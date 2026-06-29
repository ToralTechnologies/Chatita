'use client';

import { useState, useEffect, useRef } from 'react';
import BottomNav from '@/components/bottom-nav';
import WebNav from '@/components/web-nav';
import BackButton from '@/components/back-button';
import { useTranslation } from '@/lib/i18n/context';
import { compressImage } from '@/lib/compress-image';
import { FIT_LABEL_META, type ProductCandidate, type FitLabel } from '@/lib/products/types';
import { toast } from '@/components/toast';

const C = { blue: '#012374', cream: '#F7EFE1', card: '#FFFDF9', green: '#1C7A4F', gold: '#9A6F18', ink: '#16182A' };

const SOURCE_BADGE: Record<string, { key: 'badgePhoto' | 'badgeBarcode' | 'badgeReceipt' | 'badgeManual' | 'badgeSuggested'; color: string }> = {
  photo: { key: 'badgePhoto', color: '#2A6FA8' }, photo_extracted: { key: 'badgePhoto', color: '#2A6FA8' },
  barcode: { key: 'badgeBarcode', color: '#5C5290' }, open_food_facts: { key: 'badgeBarcode', color: '#5C5290' },
  receipt: { key: 'badgeReceipt', color: '#9A6F18' }, receipt_item: { key: 'badgeReceipt', color: '#9A6F18' },
  manual: { key: 'badgeManual', color: '#012374' }, user: { key: 'badgeManual', color: '#012374' }, search: { key: 'badgeManual', color: '#012374' },
  generic: { key: 'badgeSuggested', color: '#1C7A4F' },
};

const SUGGESTIONS: ProductCandidate[] = [
  { name: 'Plain Greek yogurt', category: 'Dairy', source: 'manual', protein: 17, totalCarbs: 6, addedSugar: 0 },
  { name: 'Eggs', category: 'Dairy', source: 'manual', protein: 6, totalCarbs: 0 },
  { name: 'Frozen mixed vegetables', category: 'Produce', source: 'manual', fiber: 4, totalCarbs: 12 },
  { name: 'Canned tuna in water', category: 'Pantry', source: 'manual', protein: 20, totalCarbs: 0 },
  { name: 'Black beans', category: 'Pantry', source: 'manual', protein: 7, fiber: 7, totalCarbs: 20 },
  { name: 'Berries', category: 'Produce', source: 'manual', fiber: 4, totalCarbs: 14 },
];

type AddMode = null | 'menu' | 'manual' | 'photo' | 'barcode' | 'receipt' | 'pantryphoto' | 'search';

interface Item {
  id: string; name: string; brand?: string | null; store?: string | null; imageUrl?: string | null;
  category?: string | null; source: string; itemType: string; fitLabel?: string | null;
  totalCarbs?: number | null; fiber?: number | null; addedSugar?: number | null; protein?: number | null; sodium?: number | null;
  diabetesNote?: string | null; adhdNote?: string | null; confidenceScore?: number | null; status: string;
}

export default function GroceryListPage() {
  const { t } = useTranslation();
  const g = t.grocery;
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [shoppingMode, setShoppingMode] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [pantryCount, setPantryCount] = useState(0);

  // review candidates (single product or multi-select from receipt/pantry)
  const [review, setReview] = useState<ProductCandidate[]>([]);
  const [reviewTarget, setReviewTarget] = useState<'list' | 'pantry'>('list');
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetchList(); fetchPantry(); }, []);

  async function fetchList() {
    try {
      const res = await fetch('/api/grocery-list');
      if (res.ok) setItems((await res.json()).items ?? []);
    } catch { /* */ } finally { setLoading(false); }
  }
  async function fetchPantry() {
    try { const res = await fetch('/api/pantry'); if (res.ok) setPantryCount(((await res.json()).items ?? []).length); } catch { /* */ }
  }

  async function addProducts(products: ProductCandidate[], target: 'list' | 'pantry') {
    if (products.length === 0) return;
    setBusy(true);
    try {
      const url = target === 'pantry' ? '/api/pantry' : '/api/grocery-list';
      const body = target === 'pantry' ? { products, sourceType: products[0].source === 'receipt' ? 'receipt_upload' : products[0].source === 'pantry_photo' ? 'pantry_photo' : 'manual' } : { products };
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      toast(target === 'pantry' ? `Added ${products.length} to pantry` : `Added ${products.length} to your list`, 'success');
      setReview([]); setAddMode(null);
      if (target === 'pantry') fetchPantry(); else fetchList();
    } catch { toast('Could not save. Please try again.', 'error'); } finally { setBusy(false); }
  }

  async function markBought(item: Item) {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'bought' } : i));
    try {
      await fetch(`/api/grocery-list/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'bought' }) });
      fetchPantry();
    } catch { /* */ }
  }
  async function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
    try { await fetch(`/api/grocery-list/${id}`, { method: 'DELETE' }); } catch { /* */ }
  }

  // ── add flows ──
  async function onPhotos(files: FileList | null, kind: 'product' | 'receipt' | 'pantry') {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const imgs = (await Promise.all(Array.from(files).slice(0, 6).map(async f => { try { return (await compressImage(f)).base64; } catch { return null; } }))).filter((x): x is string => !!x);
      const res = await fetch('/api/products/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, images: imgs }) });
      const data = await res.json();
      const products: ProductCandidate[] = data.products ?? [];
      if (products.length === 0) { toast(g.couldntReadLabel, 'error'); setAddMode('manual'); return; }
      setReview(products);
      setReviewTarget(kind === 'product' ? 'list' : 'pantry');
    } catch { toast('Could not read the photo. Try manual entry.', 'error'); } finally { setBusy(false); }
  }

  async function lookupBarcode(code: string) {
    if (!code.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/products/barcode?code=${encodeURIComponent(code.trim())}`);
      if (res.ok) { const d = await res.json(); setReview([d.product]); setReviewTarget('list'); }
      else { toast('No match found. Add it by photo or manually.', 'info'); setAddMode('manual'); }
    } catch { toast('Lookup failed. Try manual entry.', 'error'); } finally { setBusy(false); }
  }

  const plannedItems = items.filter(i => i.status !== 'bought');
  const boughtItems = items.filter(i => i.status === 'bought');

  // ── Inner content (shared mobile/web) ──
  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, fontWeight: 700 }}>{g.navTitle}</div>
          <h1 className="font-serif-italic" style={{ fontSize: 28, color: C.blue, lineHeight: 1.05 }}>{g.groceryList}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/pantry" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 999, background: 'rgba(28,122,79,0.1)', color: C.green, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            {g.myPantry}{pantryCount > 0 ? ` · ${pantryCount}` : ''}
          </a>
          {items.length > 0 && (
            <button onClick={() => setShoppingMode(s => !s)} style={{ padding: '9px 15px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: shoppingMode ? C.blue : 'rgba(1,35,116,0.08)', color: shoppingMode ? C.card : C.blue }}>
              {g.shoppingMode}
            </button>
          )}
        </div>
      </div>

      {/* Add real items entry */}
      {!shoppingMode && (
        <AddItemsEntry g={g} addMode={addMode} setAddMode={setAddMode} busy={busy}
          onPhotos={onPhotos} lookupBarcode={lookupBarcode}
          onManual={(c: ProductCandidate) => { setReview([c]); setReviewTarget('list'); setAddMode(null); }}
          onSuggestions={() => addProducts(SUGGESTIONS.map(s => ({ ...s, source: 'manual' })), 'list')} />
      )}

      {/* Review card(s) */}
      {review.length > 0 && (
        <ReviewPanel g={g} candidates={review} target={reviewTarget} setTarget={setReviewTarget} busy={busy}
          onConfirm={(sel: ProductCandidate[]) => addProducts(sel, reviewTarget)}
          onSaveFavorite={async (c: ProductCandidate) => { try { await fetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product: c }) }); toast('Saved to favorites', 'success'); } catch { toast('Could not save', 'error'); } }}
          onCancel={() => setReview([])} />
      )}

      {/* The list */}
      {loading ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'rgba(22,24,42,0.5)' }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ background: C.card, borderRadius: 16, border: '1px solid rgba(1,35,116,0.08)', padding: '28px 20px', textAlign: 'center', color: 'rgba(22,24,42,0.6)', fontSize: 14 }}>{g.emptyList}</div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {(shoppingMode ? plannedItems : items).map(item => (
              <GroceryRow key={item.id} item={item} g={g} shoppingMode={shoppingMode} onBought={() => markBought(item)} onRemove={() => removeItem(item.id)} />
            ))}
          </div>
          {shoppingMode && boughtItems.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.green, fontWeight: 700, marginBottom: 8 }}>{g.bought} · {boughtItems.length}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {boughtItems.map(item => <GroceryRow key={item.id} item={item} g={g} shoppingMode onBought={() => {}} onRemove={() => removeItem(item.id)} />)}
              </div>
            </div>
          )}
        </>
      )}

      <p style={{ fontSize: 11.5, color: 'rgba(22,24,42,0.45)', lineHeight: 1.5, marginTop: 4 }}>{g.availabilityVaries} {g.diabetesDisclaimer}</p>
    </div>
  );

  return (
    <>
      <div className="lg:hidden min-h-screen mobile-page-pb" style={{ background: C.cream }}>
        <div style={{ padding: '18px 18px 0' }}><BackButton href="/home" /></div>
        <div style={{ padding: '12px 18px 40px' }}>{content}</div>
        <BottomNav />
      </div>
      <div className="hidden lg:flex" style={{ height: '100vh', background: C.cream, overflow: 'hidden' }}>
        <WebNav />
        <div style={{ flex: 1, overflowY: 'auto', padding: '30px 40px 48px', maxWidth: 760 }}>{content}</div>
      </div>
    </>
  );
}

// ───────────────────────── AddItemsEntry ─────────────────────────
function AddItemsEntry({ g, addMode, setAddMode, busy, onPhotos, lookupBarcode, onManual, onSuggestions }: any) {
  const photoRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLInputElement>(null);
  const pantryRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<'product' | 'receipt' | 'pantry'>('product');
  const [barcode, setBarcode] = useState('');

  const OPTIONS: { id: AddMode | 'photo' | 'receipt' | 'pantryphoto'; label: string; icon: string; onClick: () => void }[] = [
    { id: 'photo', label: g.takeProductPhoto, icon: 'M5 7h3l1-2h6l1 2h3v12H5V7zM12 16a3 3 0 100-6 3 3 0 000 6z', onClick: () => { setKind('product'); photoRef.current?.click(); } },
    { id: 'barcode', label: g.scanBarcode, icon: 'M4 6v12M8 6v12M12 6v12M16 6v12M20 6v12', onClick: () => setAddMode('barcode') },
    { id: 'search', label: g.searchProduct, icon: 'M11 4a7 7 0 105 12l4 4M11 4a7 7 0 010 14', onClick: () => setAddMode('search') },
    { id: 'manual', label: g.addManually, icon: 'M12 5v14M5 12h14', onClick: () => setAddMode('manual') },
    { id: 'receipt', label: g.uploadReceipt, icon: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3zM9 8h6M9 12h6', onClick: () => { setKind('receipt'); receiptRef.current?.click(); } },
    { id: 'pantryphoto', label: g.uploadPantryPhoto, icon: 'M4 5h16v14H4zM4 9h16M9 5v4', onClick: () => { setKind('pantry'); pantryRef.current?.click(); } },
  ];

  return (
    <div style={{ background: C.card, borderRadius: 18, border: '1px solid rgba(1,35,116,0.08)', padding: 18 }}>
      <input ref={photoRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { onPhotos(e.target.files, 'product'); e.target.value = ''; }} />
      <input ref={receiptRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { onPhotos(e.target.files, 'receipt'); e.target.value = ''; }} />
      <input ref={pantryRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { onPhotos(e.target.files, 'pantry'); e.target.value = ''; }} />

      <div className="font-serif-italic" style={{ fontSize: 19, color: C.blue }}>{g.addRealItems}</div>
      <div style={{ fontSize: 13, color: 'rgba(22,24,42,0.65)', marginTop: 3, lineHeight: 1.45 }}>{g.addRealItemsSub}</div>

      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
        {OPTIONS.map(o => (
          <button key={o.id} onClick={o.onClick} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 13px', borderRadius: 13, border: '1px solid rgba(1,35,116,0.12)', background: C.cream, color: C.blue, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, textAlign: 'left' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}><path d={o.icon} stroke={C.blue} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {o.label}
          </button>
        ))}
      </div>
      <button onClick={onSuggestions} disabled={busy} style={{ marginTop: 8, width: '100%', padding: '11px', borderRadius: 13, border: 'none', background: 'rgba(28,122,79,0.1)', color: C.green, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600 }}>{g.chatitaSuggestions}</button>

      <p style={{ fontSize: 11.5, color: 'rgba(22,24,42,0.5)', marginTop: 10, lineHeight: 1.5 }}>{g.addHelper}</p>
      {busy && <p style={{ fontSize: 12.5, color: C.blue, marginTop: 8 }}>Reading…</p>}

      {/* Barcode entry */}
      {addMode === 'barcode' && (
        <InlineField placeholder="Barcode number" value={barcode} onChange={setBarcode} onSubmit={() => lookupBarcode(barcode)} cta={g.scanBarcode} busy={busy} />
      )}
      {/* Search → manual candidate from text */}
      {addMode === 'search' && (
        <InlineField placeholder="e.g. Kirkland Greek yogurt" onSubmit={(v: string) => onManual({ name: v, source: 'search' as const })} cta={g.searchProduct} busy={busy} note={g.availabilityVaries} />
      )}
      {/* Manual full form */}
      {addMode === 'manual' && <ManualForm g={g} onAdd={onManual} />}
    </div>
  );
}

function InlineField({ placeholder, value, onChange, onSubmit, cta, busy, note }: any) {
  const [v, setV] = useState(value ?? '');
  useEffect(() => { if (value !== undefined) setV(value); }, [value]);
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={v} onChange={e => { setV(e.target.value); onChange?.(e.target.value); }} placeholder={placeholder} onKeyDown={e => e.key === 'Enter' && onSubmit(v)} style={{ flex: 1, padding: '10px 13px', borderRadius: 11, border: '1px solid rgba(1,35,116,0.15)', background: '#F7EFE1', fontSize: 13.5, outline: 'none' }} />
        <button onClick={() => onSubmit(v)} disabled={busy || !v.trim()} style={{ padding: '10px 16px', borderRadius: 11, border: 'none', background: C.blue, color: C.card, fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>{cta}</button>
      </div>
      {note && <p style={{ fontSize: 11, color: 'rgba(22,24,42,0.5)', marginTop: 6 }}>{note}</p>}
    </div>
  );
}

function ManualForm({ g, onAdd }: { g: any; onAdd: (c: ProductCandidate) => void }) {
  const [f, setF] = useState<any>({ name: '', brand: '', store: '', servingSize: '', totalCarbs: '', fiber: '', addedSugar: '', protein: '', sodium: '' });
  const set = (k: string, v: string) => setF((p: any) => ({ ...p, [k]: v }));
  const numf = (v: string) => v.trim() === '' ? null : (isNaN(parseFloat(v)) ? null : parseFloat(v));
  const fields: [string, string][] = [['brand', g.brand], ['store', g.store], ['servingSize', g.servingSize], ['totalCarbs', g.totalCarbs], ['fiber', g.fiber], ['addedSugar', g.addedSugar], ['protein', g.protein], ['sodium', g.sodium]];
  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input value={f.name} onChange={e => set('name', e.target.value)} placeholder={g.productName} style={inputS} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {fields.map(([k, label]) => <input key={k} value={f[k]} onChange={e => set(k, e.target.value)} placeholder={label} style={inputS} />)}
      </div>
      <button disabled={!f.name.trim()} onClick={() => onAdd({ name: f.name.trim(), brand: f.brand || null, store: f.store || null, servingSize: f.servingSize || null, totalCarbs: numf(f.totalCarbs), fiber: numf(f.fiber), addedSugar: numf(f.addedSugar), protein: numf(f.protein), sodium: numf(f.sodium), source: 'manual', confidence: 0.9 })} style={{ padding: '11px', borderRadius: 11, border: 'none', background: f.name.trim() ? C.blue : 'rgba(1,35,116,0.4)', color: C.card, fontWeight: 700, fontSize: 14, cursor: f.name.trim() ? 'pointer' : 'default' }}>{g.addRealProduct}</button>
    </div>
  );
}
const inputS: React.CSSProperties = { padding: '10px 13px', borderRadius: 11, border: '1px solid rgba(1,35,116,0.15)', background: '#F7EFE1', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' };

// ───────────────────────── ReviewPanel ─────────────────────────
function ReviewPanel({ g, candidates, target, setTarget, busy, onConfirm, onSaveFavorite, onCancel }: any) {
  const multi = candidates.length > 1;
  const [selected, setSelected] = useState<boolean[]>(candidates.map(() => true));
  useEffect(() => { setSelected(candidates.map(() => true)); }, [candidates]);

  return (
    <div style={{ background: C.blue, borderRadius: 18, padding: 18, color: C.card }}>
      <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,253,249,0.7)', fontWeight: 700 }}>{g.looksLike}</div>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {candidates.map((c: ProductCandidate, i: number) => (
          <ReviewCard key={i} g={g} c={c} multi={multi} selected={selected[i]} onToggle={() => setSelected((s: boolean[]) => s.map((v, j) => j === i ? !v : v))} onFav={() => onSaveFavorite(c)} />
        ))}
      </div>
      {/* target toggle */}
      <div style={{ marginTop: 12, display: 'flex', gap: 6, background: 'rgba(255,253,249,0.12)', borderRadius: 999, padding: 4, width: 'fit-content' }}>
        {(['list', 'pantry'] as const).map(tg => (
          <button key={tg} onClick={() => setTarget(tg)} style={{ padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: target === tg ? C.card : 'transparent', color: target === tg ? C.blue : 'rgba(255,253,249,0.85)' }}>{tg === 'list' ? g.addToList : g.addToPantry}</button>
        ))}
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button disabled={busy} onClick={() => onConfirm(candidates.filter((_: any, i: number) => selected[i]))} style={{ padding: '11px 18px', borderRadius: 999, border: 'none', background: C.card, color: C.blue, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          {target === 'pantry' ? g.addToPantry : g.addToList}
        </button>
        <button disabled={busy} onClick={onCancel} style={{ padding: '11px 18px', borderRadius: 999, border: '1px solid rgba(255,253,249,0.3)', background: 'transparent', color: C.card, fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>{g.notRight}</button>
      </div>
    </div>
  );
}

function ReviewCard({ g, c, multi, selected, onToggle, onFav }: any) {
  const fit = (c.fitLabel as FitLabel) || 'check_label';
  const meta = FIT_LABEL_META[fit];
  const lowConf = (c.confidence ?? 1) < 0.5;
  const nutr = [[g.totalCarbs, c.totalCarbs, 'g'], [g.fiber, c.fiber, 'g'], [g.addedSugar, c.addedSugar, 'g'], [g.protein, c.protein, 'g'], [g.sodium, c.sodium, 'mg']]
    .filter(([, v]) => v != null) as [string, number, string][];
  return (
    <div style={{ background: 'rgba(255,253,249,0.08)', borderRadius: 14, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {multi && <input type="checkbox" checked={selected} onChange={onToggle} style={{ marginTop: 4, width: 18, height: 18, accentColor: '#7ED321' }} />}
        {c.imageUrl && <img src={c.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{c.name}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,253,249,0.7)', marginTop: 1 }}>{[c.brand, c.store, c.servingSize].filter(Boolean).join(' · ') || '—'}</div>
          <span style={{ display: 'inline-block', marginTop: 7, fontSize: 11, fontWeight: 700, color: '#16182A', background: meta.color, borderRadius: 999, padding: '3px 10px' }}>{meta.en}</span>
        </div>
        <button onClick={onFav} title={g.saveFavorite} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C8932B', fontSize: 18 }}>♡</button>
      </div>
      {nutr.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>
          {nutr.map(([l, v, u]) => <span key={l} style={{ fontSize: 11, background: 'rgba(255,253,249,0.12)', borderRadius: 8, padding: '4px 8px' }}>{l} {Math.round(v)}{u}</span>)}
        </div>
      )}
      {c.diabetesNote && <p style={{ fontSize: 12.5, color: 'rgba(255,253,249,0.85)', marginTop: 9, lineHeight: 1.45 }}>{c.diabetesNote}</p>}
      {c.adhdNote && <p style={{ fontSize: 12, color: 'rgba(255,253,249,0.65)', marginTop: 5, lineHeight: 1.45 }}>⚡ {c.adhdNote}</p>}
      {lowConf && <p style={{ fontSize: 11.5, color: '#F5D98B', marginTop: 7 }}>{g.lowConfidenceNote}</p>}
    </div>
  );
}

// ───────────────────────── GroceryRow ─────────────────────────
function GroceryRow({ item, g, shoppingMode, onBought, onRemove }: { item: Item; g: any; shoppingMode: boolean; onBought: () => void; onRemove: () => void }) {
  const badge = SOURCE_BADGE[item.itemType] || SOURCE_BADGE[item.source] || SOURCE_BADGE.manual;
  const fit = item.fitLabel ? FIT_LABEL_META[item.fitLabel as FitLabel] : null;
  const bought = item.status === 'bought';
  const nutr = [['C', item.totalCarbs, 'g'], ['Fib', item.fiber, 'g'], ['P', item.protein, 'g']].filter(([, v]) => v != null) as [string, number, string][];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: C.card, borderRadius: 14, border: '1px solid rgba(1,35,116,0.08)', padding: '12px 14px', opacity: bought ? 0.6 : 1 }}>
      {shoppingMode && (
        <button onClick={bought ? undefined : onBought} aria-label="bought" style={{ width: 26, height: 26, borderRadius: 8, border: bought ? 'none' : '2px solid rgba(1,35,116,0.25)', background: bought ? C.green : 'transparent', flexShrink: 0, cursor: bought ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {bought && <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="#FFFDF9" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </button>
      )}
      {item.imageUrl && <img src={item.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: C.ink, textDecoration: bought ? 'line-through' : 'none' }}>{item.name}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, background: `${badge.color}1a`, borderRadius: 999, padding: '2px 8px' }}>{g[badge.key]}</span>
        </div>
        <div style={{ fontSize: 11.5, color: 'rgba(22,24,42,0.55)', marginTop: 2 }}>
          {[item.brand, item.store].filter(Boolean).join(' · ')}
          {nutr.length > 0 && <span style={{ marginLeft: item.brand || item.store ? 8 : 0 }}>{nutr.map(([l, v, u]) => `${l} ${Math.round(v)}${u}`).join(' · ')}</span>}
        </div>
        {fit && <span style={{ fontSize: 10.5, fontWeight: 600, color: fit.color }}>{fit.en}</span>}
      </div>
      {!shoppingMode && (
        <button onClick={onRemove} aria-label="remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(208,2,27,0.5)', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      )}
    </div>
  );
}
