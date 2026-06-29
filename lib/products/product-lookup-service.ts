/**
 * ProductLookupService — a single abstraction over every product source so new
 * APIs (USDA, Kroger, Instacart, …) can be added without touching callers.
 *
 * MVP implementations:
 *  - lookupByBarcode → Open Food Facts (free, no key)
 *  - searchProducts  → returns a manual candidate from the typed text (no
 *    scraping; real retailer search APIs can be plugged in later)
 *  - normalizeProduct, scoreProductForChatita, createGroceryItem/PantryItem
 *
 * AI vision extraction (extractProductFromImage / receipt / pantry) runs in the
 * API route since it needs the Anthropic key; see app/api/products/extract.
 */

import { scoreProductForChatita, type ScoreContext } from './scoring';
import type { ProductCandidate } from './types';

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return typeof n === 'number' && !isNaN(n) ? n : null;
}

/** Normalize an Open Food Facts product into a ProductCandidate. */
export function normalizeOpenFoodFacts(raw: any, barcode: string): ProductCandidate | null {
  if (!raw || !raw.product) return null;
  const p = raw.product;
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
    name: p.product_name || p.generic_name || 'Unknown product',
    brand: p.brands || null,
    barcode,
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
    source: 'open_food_facts',
    confidence: 0.95, // exact barcode match
  };
}

/** Look up a product by barcode via Open Food Facts. Returns null if not found. */
export async function lookupByBarcode(barcode: string): Promise<ProductCandidate | null> {
  const clean = (barcode || '').replace(/\D/g, '');
  if (!clean) return null;
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${clean}.json?fields=product_name,generic_name,brands,quantity,serving_size,categories,image_url,image_front_small_url,nutriments,ingredients_text,allergens`,
      { headers: { 'User-Agent': 'Chatita/1.0 (diabetes companion)' } }
    );
    if (!res.ok) return null;
    const raw = await res.json();
    if (raw.status !== 1) return null; // 0 = not found
    return normalizeOpenFoodFacts(raw, clean);
  } catch {
    return null;
  }
}

/**
 * Search products by text. No retailer API is connected yet and we never scrape
 * stores, so this returns a single manual candidate built from the typed text —
 * the user can edit/confirm it. Real APIs can be added here later.
 */
export async function searchProducts(query: string, store?: string): Promise<ProductCandidate[]> {
  const q = (query || '').trim();
  if (!q) return [];
  return [
    {
      name: q,
      store: store || null,
      source: 'search',
      confidence: 0.3, // typed text, unverified
    },
  ];
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
