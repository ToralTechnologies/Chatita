'use client';

import { useState, useEffect } from 'react';
import BottomNav from '@/components/bottom-nav';
import WebNav from '@/components/web-nav';
import BackButton from '@/components/back-button';
import { useTranslation } from '@/lib/i18n/context';
import { toast } from '@/components/toast';

const C = { blue: '#012374', cream: '#F7EFE1', card: '#FFFDF9', green: '#1C7A4F', gold: '#9A6F18', ink: '#16182A' };

interface PItem { id: string; name: string; brand?: string | null; store?: string | null; category?: string | null; totalCarbs?: number | null; protein?: number | null; fiber?: number | null; }
interface Idea { title: string; prepTime?: string; ingredientsUsed?: string[]; missingIngredients?: string[]; diabetesNote?: string; adhdNote?: string; carbNote?: string; confidence?: string; }

export default function PantryPage() {
  const { t } = useTranslation();
  const g = t.grocery;
  const [items, setItems] = useState<PItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [thinking, setThinking] = useState(false);
  const [newItem, setNewItem] = useState('');

  useEffect(() => { fetchPantry(); }, []);
  async function fetchPantry() {
    try { const res = await fetch('/api/pantry'); if (res.ok) setItems((await res.json()).items ?? []); } catch { /* */ } finally { setLoading(false); }
  }

  async function addManual() {
    if (!newItem.trim()) return;
    const name = newItem.trim(); setNewItem('');
    try {
      const res = await fetch('/api/pantry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ products: [{ name, source: 'manual' }], sourceType: 'manual' }) });
      if (res.ok) fetchPantry();
    } catch { toast('Could not add', 'error'); }
  }
  async function remove(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
    try { await fetch(`/api/pantry/${id}`, { method: 'DELETE' }); } catch { /* */ }
  }
  async function whatCanIEat() {
    setThinking(true); setIdeas(null);
    try {
      const res = await fetch('/api/pantry/quick-meals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      setIdeas(data.ideas ?? []);
      if ((data.ideas ?? []).length === 0 && data.message) toast(data.message, 'info');
    } catch { toast('Could not generate ideas', 'error'); } finally { setThinking(false); }
  }

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, fontWeight: 700 }}>{g.navTitle}</div>
          <h1 className="font-serif-italic" style={{ fontSize: 28, color: C.blue, lineHeight: 1.05 }}>{g.myPantry}</h1>
        </div>
        <a href="/grocery-list" style={{ padding: '9px 15px', borderRadius: 999, background: 'rgba(1,35,116,0.08)', color: C.blue, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>{g.groceryList}</a>
      </div>

      {/* What can I eat right now */}
      <button onClick={whatCanIEat} disabled={thinking || items.length === 0} style={{ background: C.blue, color: C.card, border: 'none', borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: items.length === 0 ? 'default' : 'pointer', opacity: items.length === 0 ? 0.55 : 1, fontFamily: 'inherit' }}>
        <span style={{ fontSize: 16, fontWeight: 700 }}>{g.whatCanIEat}</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFDF9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {thinking && <p style={{ fontSize: 13, color: C.blue }}>Chatita is looking at your pantry…</p>}

      {ideas && ideas.map((idea, i) => (
        <div key={i} style={{ background: C.card, borderRadius: 16, border: '1px solid rgba(1,35,116,0.08)', padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <div className="font-serif-italic" style={{ fontSize: 17, color: C.blue }}>{idea.title}</div>
            {idea.prepTime && <span style={{ fontSize: 12, fontWeight: 600, color: C.green, background: 'rgba(28,122,79,0.1)', borderRadius: 999, padding: '3px 10px', height: 'fit-content', whiteSpace: 'nowrap' }}>{idea.prepTime}</span>}
          </div>
          {idea.ingredientsUsed && idea.ingredientsUsed.length > 0 && <div style={{ fontSize: 12.5, color: 'rgba(22,24,42,0.7)', marginTop: 5 }}>Uses: {idea.ingredientsUsed.join(', ')}</div>}
          {idea.missingIngredients && idea.missingIngredients.length > 0 && <div style={{ fontSize: 12, color: C.gold, marginTop: 3 }}>Missing: {idea.missingIngredients.join(', ')}</div>}
          {idea.diabetesNote && <p style={{ fontSize: 12.5, color: 'rgba(22,24,42,0.7)', marginTop: 7, lineHeight: 1.45 }}>{idea.diabetesNote}</p>}
          {idea.adhdNote && <p style={{ fontSize: 12, color: 'rgba(22,24,42,0.55)', marginTop: 4 }}>⚡ {idea.adhdNote}</p>}
          {idea.confidence === 'low' && <p style={{ fontSize: 11.5, color: C.gold, marginTop: 5 }}>{g.lowConfidenceNote}</p>}
        </div>
      ))}

      {/* Quick add */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && addManual()} placeholder="Add a pantry item…" style={{ flex: 1, padding: '11px 14px', borderRadius: 12, border: '1px solid rgba(1,35,116,0.15)', background: C.card, fontSize: 14, outline: 'none' }} />
        <button onClick={addManual} style={{ padding: '11px 18px', borderRadius: 12, border: 'none', background: C.blue, color: C.card, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>+</button>
      </div>

      {/* Pantry items */}
      {loading ? <div style={{ padding: 16, textAlign: 'center', color: 'rgba(22,24,42,0.5)' }}>Loading…</div>
        : items.length === 0 ? <div style={{ background: C.card, borderRadius: 16, border: '1px solid rgba(1,35,116,0.08)', padding: '24px 18px', textAlign: 'center', color: 'rgba(22,24,42,0.6)', fontSize: 14 }}>{g.emptyPantry}</div>
        : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(28,122,79,0.08)', border: '1px solid rgba(28,122,79,0.2)', borderRadius: 999, padding: '8px 12px' }}>
                <span style={{ fontSize: 13.5, color: C.ink, fontWeight: 500 }}>{item.brand ? `${item.brand} ` : ''}{item.name}</span>
                <button onClick={() => remove(item.id)} aria-label="remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(22,24,42,0.4)', display: 'flex' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}

      <p style={{ fontSize: 11.5, color: 'rgba(22,24,42,0.45)', lineHeight: 1.5, marginTop: 4 }}>{g.diabetesDisclaimer}</p>
    </div>
  );

  return (
    <>
      <div className="lg:hidden min-h-screen mobile-page-pb" style={{ background: C.cream }}>
        <div style={{ padding: '18px 18px 0' }}><BackButton href="/grocery-list" /></div>
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
