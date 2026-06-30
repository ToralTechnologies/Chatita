/**
 * ProductLookupService — a single abstraction over every product source so new
 * APIs (USDA, Kroger, Instacart, …) can be added without touching callers.
 *
 * MVP implementations:
 *  - lookupByBarcode → Open Food Facts (free, no key)
 *  - searchProducts  → real text search via Open Food Facts (primary) + USDA
 *    FoodData Central (supplement); falls back to an editable manual candidate.
 *    We never scrape stores or claim live prices/inventory. Retailer APIs
 *    (Kroger, Instacart, …) plug in here later behind their own credentials.
 *  - normalizeProduct, scoreProductForChatita, createGroceryItem/PantryItem
 *
 * AI vision extraction (extractProductFromImage / receipt / pantry) runs in the
 * API route since it needs the Anthropic key; see app/api/products/extract.
 */

import { scoreProductForChatita, type ScoreContext } from './scoring';
import type { ProductCandidate, ProductSource } from './types';

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return typeof n === 'number' && !isNaN(n) ? n : null;
}

/** fetch with a hard timeout so a slow/hung upstream can't stall our route. */
async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 8000): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(ms) });
}

/**
 * Tiny bounded in-memory TTL + LRU cache. Softens Open Food Facts throttling so
 * repeated/concurrent lookups for the same term don't re-hit upstream. Scoped to
 * the serverless instance (not shared across instances) — best-effort, which is
 * fine for read-only product data. We only cache successful results, so a
 * transient throttle/timeout is never cached and will retry next time.
 */
class TtlCache<T> {
  private store = new Map<string, { value: T; expires: number }>();
  constructor(private ttlMs: number, private maxEntries = 200) {}
  get(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (Date.now() > hit.expires) {
      this.store.delete(key);
      return undefined;
    }
    // Refresh recency (Map keeps insertion order → oldest is evicted first).
    this.store.delete(key);
    this.store.set(key, hit);
    return hit.value;
  }
  set(key: string, value: T): void {
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
  }
}

const searchCache = new TtlCache<ProductCandidate[]>(10 * 60 * 1000); // 10 min
const barcodeCache = new TtlCache<ProductCandidate>(60 * 60 * 1000); // 1 hour

/** Normalize a single Open Food Facts product object into a ProductCandidate. */
export function normalizeOFFProduct(
  p: any,
  opts: { barcode?: string | null; confidence?: number; source?: ProductSource } = {}
): ProductCandidate | null {
  if (!p) return null;
  const name = p.product_name || p.generic_name || '';
  if (!name.trim()) return null;
  const n = p.nutriments || {};
  // Prefer per-serving values; fall back to per-100g.
  const per = (base: string) => num(n[`${base}_serving`]) ?? num(n[`${base}_100g`]);
  const sodiumMg = (() => {
    const s = num(n['sodium_serving']) ?? num(n['sodium_100g']);
    if (s != null) return Math.round(s * 1000); // OFF sodium is grams
    const salt = num(n['salt_serving']) ?? num(n['salt_100g']);
    return salt != null ? Math.round(salt * 400) : null; // salt→sodium ≈ /2.5
  })();

  return {
    name: name.slice(0, 120),
    brand: (p.brands || '').split(',')[0]?.trim() || null,
    barcode: opts.barcode ?? p.code ?? null,
    imageUrl: p.image_front_small_url || p.image_url || null,
    category: (p.categories || '').split(',')[0]?.trim() || null,
    quantity: p.quantity || null,
    servingSize: p.serving_size || null,
    calories: per('energy-kcal'),
    totalCarbs: per('carbohydrates'),
    fiber: per('fiber'),
    addedSugar: per('sugars'), // OFF only exposes total sugars
    protein: per('proteins'),
    fat: per('fat'),
    saturatedFat: per('saturated-fat'),
    sodium: sodiumMg,
    ingredients: p.ingredients_text || null,
    allergens: p.allergens || null,
    source: opts.source ?? 'open_food_facts',
    confidence: opts.confidence ?? 0.95,
  };
}

/** Normalize an Open Food Facts barcode response (`{ product: {...} }`). */
export function normalizeOpenFoodFacts(raw: any, barcode: string): ProductCandidate | null {
  if (!raw || !raw.product) return null;
  return normalizeOFFProduct(raw.product, { barcode, confidence: 0.95 });
}

const OFF_SEARCH_FIELDS =
  'code,product_name,generic_name,brands,quantity,serving_size,categories,image_url,image_front_small_url,nutriments,ingredients_text,allergens';

/** Open Food Facts text search → candidates (branded packaged products). */
async function searchOpenFoodFacts(query: string): Promise<ProductCandidate[]> {
  try {
    const url =
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}` +
      `&search_simple=1&action=process&json=1&page_size=12&fields=${OFF_SEARCH_FIELDS}`;
    const res = await fetchWithTimeout(url, { headers: { 'User-Agent': 'Chatita/1.0 (diabetes companion)' } });
    if (!res.ok) return [];
    const data = await res.json();
    const products: any[] = Array.isArray(data.products) ? data.products : [];
    return products
      .map((p) => normalizeOFFProduct(p, { source: 'open_food_facts', confidence: 0.6 }))
      .filter((c): c is ProductCandidate => !!c);
  } catch {
    return [];
  }
}

/** Map a USDA FDC "labelNutrients" entry (per serving) to a number. */
function usdaLabel(food: any, key: string): number | null {
  const v = food?.labelNutrients?.[key]?.value;
  return num(v);
}

/** Normalize a USDA FoodData Central (Branded) food into a ProductCandidate. */
export function normalizeUsdaFood(food: any): ProductCandidate | null {
  const name = food?.description || '';
  if (!name.trim()) return null;
  const serving =
    food?.householdServingFullText ||
    (food?.servingSize ? `${food.servingSize}${food.servingSizeUnit || ''}` : null);
  return {
    name: String(name).slice(0, 120),
    brand: food.brandName || food.brandOwner || null,
    barcode: food.gtinUpc || null,
    category: food.brandedFoodCategory || food.foodCategory || null,
    servingSize: serving,
    calories: usdaLabel(food, 'calories'),
    totalCarbs: usdaLabel(food, 'carbohydrates'),
    fiber: usdaLabel(food, 'fiber'),
    addedSugar: usdaLabel(food, 'sugars'), // FDC label exposes total sugars
    protein: usdaLabel(food, 'protein'),
    fat: usdaLabel(food, 'fat'),
    saturatedFat: usdaLabel(food, 'saturatedFat'),
    sodium: usdaLabel(food, 'sodium'),
    ingredients: food.ingredients || null,
    source: 'usda',
    confidence: 0.65,
  };
}

/** USDA FoodData Central branded search. No-op (returns []) without USDA_API_KEY. */
async function searchUsda(query: string): Promise<ProductCandidate[]> {
  const key = process.env.USDA_API_KEY;
  if (!key) return [];
  try {
    const url =
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${key}` +
      `&query=${encodeURIComponent(query)}&dataType=Branded&pageSize=10`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];
    const data = await res.json();
    const foods: any[] = Array.isArray(data.foods) ? data.foods : [];
    return foods
      .map(normalizeUsdaFood)
      .filter((c): c is ProductCandidate => !!c)
      // Require real label nutrition — USDA branded search returns many
      // nutrition-less, loosely-matched rows that would just add noise.
      .filter((c) => c.calories != null || c.totalCarbs != null || c.protein != null);
  } catch {
    return [];
  }
}

/** Look up a product by barcode via Open Food Facts. Returns null if not found. */
export async function lookupByBarcode(barcode: string): Promise<ProductCandidate | null> {
  const clean = (barcode || '').replace(/\D/g, '');
  if (!clean) return null;

  const cached = barcodeCache.get(clean);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout(
      `https://world.openfoodfacts.org/api/v2/product/${clean}.json?fields=product_name,generic_name,brands,quantity,serving_size,categories,image_url,image_front_small_url,nutriments,ingredients_text,allergens`,
      { headers: { 'User-Agent': 'Chatita/1.0 (diabetes companion)' } }
    );
    if (!res.ok) return null;
    const raw = await res.json();
    if (raw.status !== 1) return null; // 0 = not found
    const candidate = normalizeOpenFoodFacts(raw, clean);
    if (candidate) barcodeCache.set(clean, candidate);
    return candidate;
  } catch {
    return null;
  }
}

/**
 * Search real products by text across the sources we have keys for. We never
 * scrape store sites and we don't claim live prices/inventory.
 *
 * Active sources: Open Food Facts (branded packaged products, images, barcodes)
 * and USDA FoodData Central (good label nutrition; needs USDA_API_KEY).
 *
 * Future retailer sources (Kroger, Instacart, …) plug in here behind their own
 * credentials — add a `searchKroger(q)` etc. to the Promise.all below and they
 * flow through scoring + the review card unchanged.
 *
 * If nothing matches (or all sources are unavailable), we fall back to a single
 * editable manual candidate from the typed text so the flow never dead-ends.
 */
export async function searchProducts(query: string, store?: string): Promise<ProductCandidate[]> {
  const q = (query || '').trim();
  if (!q) return [];

  const cacheKey = `${q.toLowerCase()}|${(store || '').toLowerCase()}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  // Open Food Facts is the primary source — strong branded relevance, images,
  // barcodes, per-serving nutrition. USDA only supplements when OFF is sparse,
  // since its branded search relevance is weaker.
  // Future retailer sources (Kroger, Instacart, …) slot in the same way.
  const off = await searchOpenFoodFacts(q);
  const usda = off.length < 4 ? await searchUsda(q) : [];
  const merged = [...off, ...usda];

  // Dedupe by barcode, else by name+brand.
  const seen = new Set<string>();
  const deduped: ProductCandidate[] = [];
  for (const c of merged) {
    const key = (c.barcode || `${c.name}|${c.brand ?? ''}`).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    if (store && !c.store) c.store = store;
    deduped.push(c);
  }

  if (deduped.length > 0) {
    const results = deduped.slice(0, 16);
    // Cache only real hits — never cache a throttle/timeout fallback.
    searchCache.set(cacheKey, results);
    return results;
  }

  // Nothing matched — let the user save what they typed.
  return [{ name: q, store: store || null, source: 'search', confidence: 0.3 }];
}

/** Attach Chatita guidance (fit label + notes) to a candidate. */
export function withScore(candidate: ProductCandidate, ctx?: ScoreContext): ProductCandidate {
  const s = scoreProductForChatita(candidate, ctx);
  return { ...candidate, ...s };
}

/** Shared product fields → Prisma data (grocery or pantry). */
function baseData(c: ProductCandidate) {
  return {
    name: c.name,
    brand: c.brand ?? null,
    store: c.store ?? null,
    imageUrl: c.imageUrl ?? null,
    barcode: c.barcode ?? null,
    category: c.category ?? null,
    servingSize: c.servingSize ?? null,
    calories: c.calories ?? null,
    totalCarbs: c.totalCarbs ?? null,
    fiber: c.fiber ?? null,
    addedSugar: c.addedSugar ?? null,
    protein: c.protein ?? null,
    sodium: c.sodium ?? null,
    saturatedFat: c.saturatedFat ?? null,
    ingredients: c.ingredients ?? null,
    diabetesNote: c.diabetesNote ?? null,
    adhdNote: c.adhdNote ?? null,
    tags: c.tags ? JSON.stringify(c.tags) : null,
  };
}

const ITEM_TYPE_BY_SOURCE: Record<string, string> = {
  photo: 'photo_extracted',
  pantry_photo: 'photo_extracted',
  barcode: 'barcode',
  open_food_facts: 'barcode',
  receipt: 'receipt_item',
  manual: 'manual',
  user: 'manual',
  search: 'real_product',
  usda: 'real_product',
  kroger: 'real_product',
  instacart: 'real_product',
};

export function createGroceryItemData(c: ProductCandidate, userId: string) {
  const scored = c.fitLabel ? c : withScore(c);
  return {
    userId,
    itemType: ITEM_TYPE_BY_SOURCE[scored.source] ?? 'real_product',
    source: scored.source,
    confidenceScore: scored.confidence ?? null,
    fitLabel: scored.fitLabel ?? null,
    quickUseIdeas: scored.quickUseIdeas ? JSON.stringify(scored.quickUseIdeas) : null,
    quantity: scored.quantity ?? null,
    size: scored.size ?? null,
    status: 'planned',
    ...baseData(scored),
  };
}

export function createPantryItemData(
  c: ProductCandidate,
  userId: string,
  sourceType = 'manual',
  sourceGroceryListItemId?: string
) {
  const scored = c.fitLabel ? c : withScore(c);
  return {
    userId,
    sourceType,
    sourceGroceryListItemId: sourceGroceryListItemId ?? null,
    quantity: scored.quantity ?? null,
    storageType: null as string | null,
    dateBought: new Date(),
    status: 'available',
    ...baseData(scored),
  };
}
