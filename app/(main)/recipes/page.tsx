'use client';

import { useState, useRef } from 'react';
import BottomNav from '@/components/bottom-nav';
import BackButton from '@/components/back-button';
import WebNav from '@/components/web-nav';
import { compressImage } from '@/lib/compress-image';

interface Recipe {
  title: string;
  description: string;
  carbEstimate: string;
  calorieEstimate: string;
  bloodSugarImpact: 'low' | 'moderate' | 'high';
  ingredients: string[];
  steps: string[];
  tips: string[];
  prepTime: string;
  servings: number;
}

const COMMON_PAIRINGS = [
  'spinach', 'lentils', 'paneer', 'tomato', 'ginger', 'cumin',
  'onion', 'garlic', 'zucchini', 'chickpeas', 'okra', 'eggplant',
];

const IMPACT = {
  low: { label: 'Gentle on blood sugar', color: '#1C7A4F', bg: 'rgba(28,122,79,0.12)', dot: '#1C7A4F' },
  moderate: { label: 'Enjoy mindfully', color: '#9A6F18', bg: 'rgba(200,147,43,0.18)', dot: '#C8932B' },
  high: { label: 'Save for a special occasion', color: '#B5562E', bg: 'rgba(181,86,46,0.13)', dot: '#B5562E' },
};

// ─── Shared sub-components ────────────────────────────────────────────────────

function InputPanel({
  tab, setTab, draft, setDraft, ingredients, setIngredients,
  fridgePhoto, setFridgePhoto, onSearch, loading, web,
}: {
  tab: 'type' | 'photo';
  setTab: (t: 'type' | 'photo') => void;
  draft: string;
  setDraft: (v: string) => void;
  ingredients: string[];
  setIngredients: (v: string[]) => void;
  fridgePhoto: string | null;
  setFridgePhoto: (v: string | null) => void;
  onSearch: () => void;
  loading: boolean;
  web?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const addIngredient = () => {
    const v = draft.trim().toLowerCase();
    if (v && !ingredients.includes(v)) {
      setIngredients([...ingredients, v]);
      setDraft('');
    }
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { base64 } = await compressImage(file);
      setFridgePhoto(base64);
    } catch { /* silent */ }
  };

  const suggestions = COMMON_PAIRINGS.filter(x => !ingredients.includes(x)).slice(0, 6);

  const tabStyle = (active: boolean) => ({
    flex: 1 as const,
    textAlign: 'center' as const,
    cursor: 'pointer' as const,
    padding: web ? '12px 0' : '11px 0',
    borderRadius: '10px',
    fontSize: web ? '14px' : '13.5px',
    fontWeight: 600 as const,
    border: 'none' as const,
    background: active ? '#012374' : 'transparent',
    color: active ? '#FFFDF9' : '#012374',
    transition: 'all .15s',
  });

  return (
    <div style={{
      background: '#FFFDF9',
      borderRadius: web ? '22px' : '20px',
      padding: web ? '24px' : '20px',
      border: '1px solid rgba(1,35,116,0.07)',
      boxShadow: '0 14px 30px -24px rgba(1,35,116,.3)',
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', background: '#F7EFE1', borderRadius: '14px', padding: '5px' }}>
        <button style={tabStyle(tab === 'type')} onClick={() => setTab('type')}>
          Type ingredients
        </button>
        <button style={tabStyle(tab === 'photo')} onClick={() => setTab('photo')}>
          Snap your fridge
        </button>
      </div>

      {tab === 'type' ? (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', gap: '9px' }}>
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addIngredient()}
              placeholder="e.g. chicken, spinach, yogurt…"
              style={{
                flex: 1,
                background: web ? '#F7EFE1' : '#FFFDF9',
                border: '1px solid rgba(1,35,116,0.14)',
                borderRadius: '13px',
                padding: '13px 15px',
                fontFamily: 'inherit',
                fontSize: web ? '14.5px' : '14px',
                color: '#16182A',
                outline: 'none',
              }}
            />
            <button
              onClick={addIngredient}
              style={{ width: web ? '50px' : '48px', flexShrink: 0, background: '#012374', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="#FFFDF9" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {ingredients.length > 0 && (
            <>
              <div style={{ marginTop: '14px', fontSize: '12px', letterSpacing: '.1em', textTransform: 'uppercase', color: '#001A4D', opacity: .6, fontWeight: 600 }}>In your basket</div>
              <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {ingredients.map(ing => (
                  <span key={ing} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#012374', color: '#FFFDF9', padding: '9px 13px', borderRadius: '999px', fontSize: web ? '14px' : '13.5px', fontWeight: 500 }}>
                    {ing}
                    <span onClick={() => setIngredients(ingredients.filter(i => i !== ing))} style={{ cursor: 'pointer', display: 'flex', opacity: .8 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#FFFDF9" strokeWidth="2.2" strokeLinecap="round"/></svg>
                    </span>
                  </span>
                ))}
              </div>
            </>
          )}

          {suggestions.length > 0 && (
            <>
              <div style={{ marginTop: '18px', fontSize: '12px', color: '#16182A', opacity: .6 }}>Add a common pairing</div>
              <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {suggestions.map(s => (
                  <span
                    key={s}
                    onClick={() => setIngredients([...ingredients, s])}
                    style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FFFDF9', color: '#012374', border: '1px solid rgba(1,35,116,0.2)', padding: '9px 13px', borderRadius: '999px', fontSize: web ? '14px' : '13.5px', fontWeight: 500 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#012374" strokeWidth="2.4" strokeLinecap="round"/></svg>
                    {s}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ marginTop: '16px' }}>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: 'none' }} />
          <div
            onClick={() => fileRef.current?.click()}
            style={{ border: '1.5px dashed rgba(1,35,116,0.3)', borderRadius: '18px', background: web ? '#F7EFE1' : '#FFFDF9', padding: '34px 20px', textAlign: 'center', cursor: 'pointer' }}
          >
            {fridgePhoto ? (
              <>
                <img src={`data:image/jpeg;base64,${fridgePhoto}`} alt="Fridge" style={{ maxHeight: '160px', borderRadius: '12px', marginBottom: '8px', maxWidth: '100%' }} />
                <div style={{ fontSize: '13px', color: '#012374', fontWeight: 600 }}>Photo added — tap to change</div>
              </>
            ) : (
              <>
                <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'rgba(1,35,116,0.07)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2.5" stroke="#012374" strokeWidth="1.7"/><circle cx="12" cy="12.5" r="3.4" stroke="#012374" strokeWidth="1.7"/><path d="M8 6l1.4-2h5.2L16 6" stroke="#012374" strokeWidth="1.7"/></svg>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#012374', marginTop: '12px' }}>Snap your fridge or pantry</div>
                <div style={{ fontSize: '13px', color: '#16182A', opacity: .62, marginTop: '4px', lineHeight: 1.45 }}>Chatita spots the ingredients for you — you can edit them after.</div>
              </>
            )}
          </div>
        </div>
      )}

      <button
        onClick={onSearch}
        disabled={loading}
        style={{
          marginTop: '22px', background: loading ? 'rgba(1,35,116,0.5)' : '#012374', color: '#FFFDF9',
          borderRadius: '15px', padding: '15px', textAlign: 'center', fontSize: '15px', fontWeight: 600,
          cursor: loading ? 'default' : 'pointer', boxShadow: '0 12px 26px -14px rgba(1,35,116,.6)',
          border: 'none', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}
      >
        {loading ? (
          <>
            <svg style={{ animation: 'spin 1s linear infinite' }} width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="#FFFDF9" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            Finding recipes…
          </>
        ) : 'Find gentle recipes'}
      </button>
    </div>
  );
}

function RecipeCard({ r, idx, expanded, onToggle, saved, onSave, web }: {
  r: Recipe; idx: number; expanded: boolean; onToggle: () => void;
  saved: boolean; onSave: () => void; web?: boolean;
}) {
  const imp = IMPACT[r.bloodSugarImpact] ?? IMPACT.moderate;
  const px = web ? '24px' : '16px';
  const py = web ? '22px 24px' : '16px';

  return (
    <div style={{ background: '#FFFDF9', borderRadius: web ? '20px' : '18px', border: '1px solid rgba(1,35,116,0.08)', overflow: 'hidden', boxShadow: '0 14px 30px -24px rgba(1,35,116,.4)' }}>
      {/* Header */}
      <div onClick={onToggle} style={{ cursor: 'pointer', padding: py }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div className="font-serif-italic" style={{ fontSize: web ? '22px' : '18px', color: '#012374', lineHeight: 1.15 }}>{r.title}</div>
            <div style={{ fontSize: web ? '14.5px' : '13px', color: '#16182A', opacity: .72, lineHeight: 1.5, marginTop: web ? '8px' : '7px' }}>{r.description}</div>
            <div style={{ marginTop: web ? '14px' : '12px', display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: web ? '7px 13px' : '6px 11px', borderRadius: '999px', fontSize: web ? '13px' : '12px', fontWeight: 600, background: imp.bg, color: imp.color }}>
                <span style={{ width: web ? '8px' : '7px', height: web ? '8px' : '7px', borderRadius: '50%', background: imp.dot, flexShrink: 0 }} />
                {imp.label}
              </span>
              <span style={{ background: '#F7EFE1', color: '#012374', padding: web ? '7px 13px' : '6px 11px', borderRadius: '999px', fontSize: web ? '13px' : '12px', fontWeight: 600 }}>{r.carbEstimate} carbs</span>
              <span style={{ background: '#F7EFE1', color: '#012374', padding: web ? '7px 13px' : '6px 11px', borderRadius: '999px', fontSize: web ? '13px' : '12px', fontWeight: 600 }}>{r.prepTime}</span>
            </div>
          </div>
          <div style={{ flexShrink: 0, transition: 'transform .2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <svg width={web ? 22 : 18} height={web ? 22 : 18} viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="#012374" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: `0 ${px} ${px}` }}>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: web ? '12px' : '8px', paddingTop: web ? '6px' : '13px', borderTop: '1px solid rgba(1,35,116,0.07)' }}>
            {[
              { label: 'carbs / serving', value: r.carbEstimate },
              { label: 'cal / serving', value: r.calorieEstimate || '—' },
              { label: 'servings', value: String(r.servings) },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: '#F7EFE1', borderRadius: web ? '14px' : '12px', padding: web ? '14px 16px' : '11px 12px' }}>
                <div className="font-serif-italic" style={{ fontSize: web ? '22px' : '18px', color: '#012374' }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: '#16182A', opacity: .55, marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {web ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '28px', marginTop: '22px' }}>
              {/* Left: ingredients + why gentle */}
              <div>
                <div style={{ fontSize: '12px', letterSpacing: '.1em', textTransform: 'uppercase', color: '#001A4D', opacity: .6, fontWeight: 600 }}>You&apos;ll use</div>
                <div style={{ marginTop: '11px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {r.ingredients.map(ing => <span key={ing} style={{ background: '#F7EFE1', color: '#16182A', padding: '7px 12px', borderRadius: '999px', fontSize: '13px' }}>{ing}</span>)}
                </div>
                <div style={{ marginTop: '20px', background: 'rgba(200,147,43,0.12)', borderRadius: '14px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', letterSpacing: '.06em', color: '#9A6F18', fontWeight: 700, textTransform: 'uppercase' }}>Why it&apos;s gentle</div>
                  <div style={{ marginTop: '9px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {r.tips.map((tip, i) => <div key={i} style={{ fontSize: '13.5px', color: '#16182A', lineHeight: 1.45 }}>• {tip}</div>)}
                  </div>
                </div>
              </div>
              {/* Right: steps + save */}
              <div>
                <div style={{ fontSize: '12px', letterSpacing: '.1em', textTransform: 'uppercase', color: '#001A4D', opacity: .6, fontWeight: 600 }}>Steps</div>
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '13px' }}>
                  {r.steps.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: '13px', alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%', background: '#012374', color: '#FFFDF9', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                      <span style={{ fontSize: '14.5px', color: '#16182A', lineHeight: 1.5 }}>{step}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={onSave}
                  style={{ marginTop: '22px', borderRadius: '14px', padding: '14px', textAlign: 'center', fontSize: '14.5px', fontWeight: 600, cursor: 'pointer', border: 'none', width: '100%', background: saved ? 'rgba(28,122,79,0.12)' : '#012374', color: saved ? '#1C7A4F' : '#FFFDF9' }}
                >
                  {saved ? '✓ Saved to your recipes' : 'Save this recipe'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginTop: '16px', fontSize: '12px', letterSpacing: '.1em', textTransform: 'uppercase', color: '#001A4D', opacity: .6, fontWeight: 600 }}>You&apos;ll use</div>
              <div style={{ marginTop: '9px', display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {r.ingredients.map(ing => <span key={ing} style={{ background: '#F7EFE1', color: '#16182A', padding: '6px 11px', borderRadius: '999px', fontSize: '12.5px' }}>{ing}</span>)}
              </div>
              <div style={{ marginTop: '16px', fontSize: '12px', letterSpacing: '.1em', textTransform: 'uppercase', color: '#001A4D', opacity: .6, fontWeight: 600 }}>Steps</div>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '11px' }}>
                {r.steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '11px', alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, width: '22px', height: '22px', borderRadius: '50%', background: '#012374', color: '#FFFDF9', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px' }}>{i + 1}</span>
                    <span style={{ fontSize: '13.5px', color: '#16182A', lineHeight: 1.5 }}>{step}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', background: 'rgba(200,147,43,0.12)', borderRadius: '13px', padding: '14px' }}>
                <div style={{ fontSize: '12px', letterSpacing: '.06em', color: '#9A6F18', fontWeight: 700, textTransform: 'uppercase' }}>Why it&apos;s gentle</div>
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {r.tips.map((tip, i) => <div key={i} style={{ fontSize: '13px', color: '#16182A', lineHeight: 1.45 }}>• {tip}</div>)}
                </div>
              </div>
              <button
                onClick={onSave}
                style={{ marginTop: '14px', borderRadius: '13px', padding: '13px', textAlign: 'center', fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none', width: '100%', background: saved ? 'rgba(28,122,79,0.12)' : '#012374', color: saved ? '#1C7A4F' : '#FFFDF9' }}
              >
                {saved ? '✓ Saved to your recipes' : 'Save this recipe'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecipesPage() {
  const [tab, setTab] = useState<'type' | 'photo'>('type');
  const [draft, setDraft] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [fridgePhoto, setFridgePhoto] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());

  const generateRecipes = async () => {
    if (!ingredients.length && !fridgePhoto) {
      setError('Add at least one ingredient first.');
      return;
    }
    setLoading(true);
    setError('');
    setRecipes([]);
    setExpanded(null);
    setSearched(false);
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, photoBase64: fridgePhoto }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRecipes(data.recipes || []);
      setSearched(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveRecipe = async (idx: number) => {
    const r = recipes[idx];
    if (!r || saved.has(idx)) return;
    try {
      await fetch('/api/recipes/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: r.title,
          description: r.description,
          ingredients: r.ingredients.map(name => ({ name, amount: '' })),
          instructions: r.steps,
          servings: r.servings || 2,
          diabetesTips: r.tips,
          tags: ['generated', r.bloodSugarImpact],
        }),
      });
      setSaved(prev => new Set([...prev, idx]));
    } catch { /* silent */ }
  };

  const resetSearch = () => { setSearched(false); setRecipes([]); setExpanded(null); };

  const inputProps = { tab, setTab, draft, setDraft, ingredients, setIngredients, fridgePhoto, setFridgePhoto, onSearch: generateRecipes, loading };

  const Disclaimer = () => (
    <div style={{ marginTop: '16px', background: 'rgba(200,147,43,0.1)', borderRadius: '13px', padding: '13px 15px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
        <path d="M12 3l9 16H3L12 3z" stroke="#9A6F18" strokeWidth="1.7" strokeLinejoin="round"/>
        <path d="M12 10v4M12 16.5v.5" stroke="#9A6F18" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
      <div style={{ fontSize: '12px', color: '#16182A', opacity: .72, lineHeight: 1.45 }}>Recipes are gentle suggestions, not medical advice. Your healthcare provider knows your numbers best.</div>
    </div>
  );

  return (
    <>
      {/* ── Desktop (lg+) ── */}
      <div className="hidden lg:flex min-h-screen" style={{ background: '#F7EFE1' }}>
        <WebNav />

        <div style={{ flex: 1, overflowY: 'auto', padding: '34px 44px 44px' }}>
          <div style={{ fontSize: '12px', letterSpacing: '.2em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Recipes · from your kitchen</div>
          <div className="font-serif-italic" style={{ fontSize: '38px', color: '#012374', lineHeight: 1.05, marginTop: '6px' }}>Let&apos;s cook something kind.</div>
          <div style={{ fontSize: '16px', color: '#16182A', opacity: .72, marginTop: '4px' }}>Add what you have on hand. Chatita keeps it gentle — no scores, no judgment.</div>

          <div style={{ marginTop: '26px', display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px', alignItems: 'start' }}>
            <InputPanel {...inputProps} web />

            <div>
              {!searched ? (
                <div style={{ background: '#FFFDF9', border: '1px dashed rgba(1,35,116,0.16)', borderRadius: '22px', padding: '60px 40px', textAlign: 'center', minHeight: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: '#F7EFE1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 0 1 16 0v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-1z" stroke="#012374" strokeWidth="1.5"/><path d="M3 19h18" stroke="#012374" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </div>
                  <div className="font-serif-italic" style={{ fontSize: '25px', color: '#012374', marginTop: '18px' }}>Your recipe ideas will appear here</div>
                  <div style={{ fontSize: '14.5px', color: '#16182A', opacity: .65, marginTop: '6px', maxWidth: '360px', lineHeight: 1.5 }}>
                    Add a few ingredients and press <strong style={{ color: '#012374' }}>Find gentle recipes</strong>. Every suggestion comes with carb ranges and a kind tip.
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <div className="font-serif-italic" style={{ fontSize: '26px', color: '#012374' }}>A few gentle ideas for you</div>
                    <button onClick={resetSearch} style={{ cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#012374', background: 'none', border: 'none' }}>Edit ingredients</button>
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {recipes.map((r, i) => (
                      <RecipeCard key={i} r={r} idx={i} expanded={expanded === i} onToggle={() => setExpanded(expanded === i ? null : i)} saved={saved.has(i)} onSave={() => saveRecipe(i)} web />
                    ))}
                  </div>
                  <Disclaimer />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile (< lg) ── */}
      <div className="lg:hidden min-h-screen pb-24" style={{ background: '#F7EFE1' }}>
        {/* Navy hero */}
        <div style={{ background: '#012374', padding: '0 24px 72px', position: 'relative' }}>
          <div style={{ paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#FFFDF9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px -4px rgba(1,35,116,.4)' }}>
              <BackButton href="/home" />
            </div>
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '.18em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Recipes</div>
              <div className="font-serif-italic" style={{ fontSize: '23px', color: '#FFFDF9', lineHeight: 1 }}>From your kitchen</div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '640px', margin: '0 auto', marginTop: '-60px', padding: '0 20px' }}>
          {!searched ? (
            <>
              <div className="font-serif-italic" style={{ fontSize: '27px', color: '#012374', lineHeight: 1.1, marginBottom: '16px' }}>Let&apos;s cook something kind.</div>
              <div style={{ fontSize: '14px', color: '#16182A', opacity: .7, lineHeight: 1.5, marginBottom: '18px' }}>Tell Chatita what you have — no full list needed, no judgment.</div>
              <InputPanel {...inputProps} />
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#16182A', opacity: .5, textAlign: 'center' }}>No scores, no judgment — just ideas that feel good.</div>
            </>
          ) : (
            <>
              <div style={{ background: '#FFFDF9', borderRadius: '16px', border: '1px solid rgba(1,35,116,0.08)', padding: '14px 16px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '12px', letterSpacing: '.14em', textTransform: 'uppercase', color: '#001A4D', opacity: .6, fontWeight: 600 }}>Cooking with</div>
                  <button onClick={resetSearch} style={{ cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#012374', background: 'none', border: 'none' }}>Edit</button>
                </div>
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                  {ingredients.map(ing => <span key={ing} style={{ background: '#F7EFE1', color: '#012374', padding: '7px 11px', borderRadius: '999px', fontSize: '13px', fontWeight: 500 }}>{ing}</span>)}
                </div>
              </div>

              <div className="font-serif-italic" style={{ fontSize: '24px', color: '#012374', marginBottom: '14px' }}>A few gentle ideas for you</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
                {recipes.map((r, i) => (
                  <RecipeCard key={i} r={r} idx={i} expanded={expanded === i} onToggle={() => setExpanded(expanded === i ? null : i)} saved={saved.has(i)} onSave={() => saveRecipe(i)} />
                ))}
              </div>
            </>
          )}

          {error && <div style={{ marginTop: '12px', padding: '12px', borderRadius: '12px', background: 'rgba(181,86,46,0.1)', color: '#B5562E', fontSize: '13px' }}>{error}</div>}

          <Disclaimer />
        </div>

        <BottomNav />
      </div>
    </>
  );
}
