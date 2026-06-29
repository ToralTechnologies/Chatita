/**
 * Shared types for the Smart Grocery List "real products" feature.
 * A ProductCandidate is the normalized shape produced by any source (photo,
 * barcode, search, receipt, manual) before it becomes a grocery/pantry item.
 */

export type FitLabel = 'great_fit' | 'good_with_portion' | 'check_label' | 'use_with_caution';

export type ProductSource =
  | 'photo'
  | 'barcode'
  | 'manual'
  | 'search'
  | 'receipt'
  | 'pantry_photo'
  | 'open_food_facts'
  | 'usda'
  | 'kroger'
  | 'instacart'
  | 'user';

export type StorageType = 'fridge' | 'freezer' | 'pantry' | 'counter';

export interface ProductNutrition {
  calories?: number | null;
  totalCarbs?: number | null;
  fiber?: number | null;
  addedSugar?: number | null;
  protein?: number | null;
  fat?: number | null;
  saturatedFat?: number | null;
  sodium?: number | null;
}

export interface ProductCandidate extends ProductNutrition {
  name: string;
  brand?: string | null;
  store?: string | null;
  barcode?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  quantity?: string | null;
  size?: string | null;
  servingSize?: string | null;
  ingredients?: string | null;
  allergens?: string | null;
  prepNotes?: string | null;
  packageType?: string | null;
  source: ProductSource;
  confidence?: number | null; // 0..1

  // Chatita-added guidance (filled by scoring)
  fitLabel?: FitLabel;
  diabetesNote?: string;
  adhdNote?: string;
  quickUseIdeas?: string[];
  tags?: string[];
}

export const FIT_LABEL_META: Record<FitLabel, { en: string; es: string; color: string }> = {
  great_fit:          { en: 'Great fit',                es: 'Buena opción',                 color: '#1C7A4F' },
  good_with_portion:  { en: 'Good with portion guidance', es: 'Bien con porción adecuada',  color: '#2A6FA8' },
  check_label:        { en: 'Check the label',          es: 'Revisa la etiqueta',           color: '#9A6F18' },
  use_with_caution:   { en: 'Use with caution',         es: 'Úsalo con cuidado',            color: '#B5562E' },
};

/**
 * Store profiles — help with language and common product style ONLY.
 * They never imply live inventory or prices.
 */
export const STORE_PROFILES: Record<string, { label: string; notes: string[] }> = {
  costco:    { label: 'Costco',     notes: ['Bulk-friendly', 'Good for repeat meals', 'Check package size and storage'] },
  sams:      { label: "Sam's Club", notes: ['Bulk-friendly', 'Good for repeat meals', 'Check package size and storage'] },
  walmart:   { label: 'Walmart',    notes: ['Wide variety', 'Good for regular weekly groceries'] },
  kroger:    { label: 'Kroger',     notes: ['Good for regular weekly groceries', 'Potential future product lookup'] },
  meijer:    { label: 'Meijer',     notes: ['Good for regular weekly groceries', 'Potential future product lookup'] },
  aldi:      { label: 'Aldi',       notes: ['Budget-friendly', 'Simple staples'] },
  other:     { label: 'Any store',  notes: ['Availability and prices may vary by store'] },
};

export function storeKey(store?: string | null): string {
  const s = (store || '').toLowerCase();
  if (s.includes('costco')) return 'costco';
  if (s.includes('sam')) return 'sams';
  if (s.includes('walmart')) return 'walmart';
  if (s.includes('kroger')) return 'kroger';
  if (s.includes('meijer')) return 'meijer';
  if (s.includes('aldi')) return 'aldi';
  return 'other';
}
