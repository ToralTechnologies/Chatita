'use client';

import { useState, useRef, RefObject } from 'react';
import BottomNav from '@/components/bottom-nav';
import WebNav from '@/components/web-nav';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Recipe {
  id: string;
  title: string;
  description: string;
  carbEstimate: string;
  calorieEstimate: string;
  bloodSugarImpact: 'low' | 'moderate' | 'high';
  prepTime: string;
  servings: number;
  cuisine: string;
  ingredients: string[];
  steps: string[];
  tips: string[];
}

// ─── Impact config ────────────────────────────────────────────────────────────

const IMPACT = {
  low:      { label: 'Gentle on blood sugar', color: '#1C7A4F', bg: 'rgba(28,122,79,0.12)',   dot: '#1C7A4F' },
  moderate: { label: 'Enjoy mindfully',        color: '#9A6F18', bg: 'rgba(200,147,43,0.18)',  dot: '#C8932B' },
  high:     { label: 'Save for special occasions', color: '#B5562E', bg: 'rgba(181,86,46,0.12)', dot: '#B5562E' },
};

// ─── Common pairings ──────────────────────────────────────────────────────────

const COMMON_PAIRINGS = ['spinach', 'lentils', 'paneer', 'tomato', 'ginger', 'cumin', 'onion', 'garlic', 'zucchini', 'chickpeas', 'okra', 'eggplant'];
const CUISINES = ['Any cuisine', 'Pakistani', 'Indian', 'Mexican', 'Mediterranean'];

// ─── Recipe card component ────────────────────────────────────────────────────

function RecipeCard({ recipe, expanded, onToggle, saved, onSave, web, userIngredients }: {
  recipe: Recipe;
  expanded: boolean;
  onToggle: () => void;
  saved: boolean;
  onSave: () => void;
  web?: boolean;
  userIngredients?: string[];
}) {
  const imp = IMPACT[recipe.bloodSugarImpact] ?? IMPACT.low;
  const extras = userIngredients && userIngredients.length > 0
    ? recipe.ingredients.filter(ri =>
        !userIngredients.some(ui => ri.toLowerCase().includes(ui.toLowerCase()))
      )
    : [];

  return (
    <div style={{
      background: '#FFFDF9',
      borderRadius: 20,
      padding: web ? '22px 24px' : '18px 20px',
      border: '1px solid rgba(1,35,116,0.07)',
      boxShadow: '0 14px 30px -22px rgba(1,35,116,.3)',
      cursor: 'pointer',
    }}>
      {/* Header */}
      <div onClick={onToggle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div className="font-serif-italic" style={{ fontSize: web ? 22 : 19, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic', lineHeight: 1.2 }}>
            {recipe.title}
          </div>
          <div style={{ fontSize: web ? 14.5 : 13.5, color: 'rgba(22,24,42,0.66)', lineHeight: 1.5, marginTop: 6 }}>
            {recipe.description}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: imp.bg, color: imp.color }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: imp.dot, flexShrink: 0 }} />
              {imp.label}
            </span>
            <span style={{ fontSize: 13, color: 'rgba(22,24,42,0.5)' }}>{recipe.carbEstimate} carbs</span>
            <span style={{ fontSize: 13, color: 'rgba(22,24,42,0.5)' }}>·</span>
            <span style={{ fontSize: 13, color: 'rgba(22,24,42,0.5)' }}>{recipe.prepTime}</span>
            {recipe.cuisine && recipe.cuisine !== 'Any' && (
              <>
                <span style={{ fontSize: 13, color: 'rgba(22,24,42,0.5)' }}>·</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#012374', background: 'rgba(1,35,116,0.08)', padding: '4px 10px', borderRadius: 999 }}>{recipe.cuisine}</span>
              </>
            )}
          </div>
        </div>
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none"
          style={{ flexShrink: 0, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginTop: 4 }}
        >
          <path d="M6 9l6 6 6-6" stroke="#012374" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ marginTop: 20 }}>
          {/* Extra ingredients callout */}
          {extras.length > 0 && (
            <div style={{
              background: 'rgba(200,147,43,0.1)', borderRadius: 14,
              padding: '13px 16px', marginBottom: 18,
              border: '1px solid rgba(200,147,43,0.22)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A6F18', marginBottom: 8 }}>
                You&apos;ll also need
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {extras.map((e, i) => (
                  <span key={i} style={{ background: 'rgba(200,147,43,0.18)', color: '#7A5010', borderRadius: 999, padding: '5px 12px', fontSize: 12.5, fontWeight: 500 }}>
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Carbs', value: recipe.carbEstimate },
              { label: 'Calories', value: recipe.calorieEstimate },
              { label: 'Servings', value: `${recipe.servings}` },
            ].map(stat => (
              <div key={stat.label} style={{ flex: 1, background: '#F7EFE1', borderRadius: 13, padding: '12px 14px' }}>
                <div className="font-serif-italic" style={{ fontSize: 22, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic', lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(22,24,42,0.55)', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* 2-col grid */}
          <div style={{ display: 'grid', gridTemplateColumns: web ? '1fr 1fr' : '1fr', gap: web ? 24 : 0 }}>
            {/* Ingredients + Tips */}
            <div>
              <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.5)', fontWeight: 700, marginBottom: 10 }}>Ingredients</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, color: '#16182A' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C8932B', flexShrink: 0, marginTop: 6 }} />
                    {ing}
                  </li>
                ))}
              </ul>
              {recipe.tips.length > 0 && (
                <div style={{ marginTop: 18, background: 'rgba(1,35,116,0.05)', borderRadius: 14, padding: '13px 16px' }}>
                  <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.5)', fontWeight: 700, marginBottom: 8 }}>Tips</div>
                  {recipe.tips.map((tip, i) => (
                    <p key={i} style={{ fontSize: 13, color: '#16182A', lineHeight: 1.5, margin: '0 0 6px' }}>{tip}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Steps */}
            <div style={{ marginTop: web ? 0 : 20 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.5)', fontWeight: 700, marginBottom: 10 }}>Steps</div>
              <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recipe.steps.map((step, i) => (
                  <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#012374', color: '#FFFDF9', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 13.5, color: '#16182A', lineHeight: 1.5, paddingTop: 2 }}>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={e => { e.stopPropagation(); onSave(); }}
            style={{
              marginTop: 20, width: '100%', padding: '13px', borderRadius: 14,
              fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: saved ? 'rgba(28,122,79,0.12)' : '#012374',
              color: saved ? '#1C7A4F' : '#FFFDF9',
              transition: 'all 0.15s',
            }}
          >
            {saved ? '✓ Saved' : 'Save this recipe'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecipesPage() {
  const [tab, setTab] = useState<'type' | 'fridge' | 'pantry'>('type');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cuisine, setCuisine] = useState('Any cuisine');
  const [customCuisine, setCustomCuisine] = useState('');
  const [craving, setCraving] = useState('');
  const [draft, setDraft] = useState('');
  const [searched, setSearched] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [usedPhoto, setUsedPhoto] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const suggestions = COMMON_PAIRINGS.filter(x => !ingredients.includes(x)).slice(0, 6);

  const addIngredient = (val?: string) => {
    const v = (val ?? draft).trim().toLowerCase();
    if (v && !ingredients.includes(v)) {
      setIngredients(prev => [...prev, v]);
      if (!val) setDraft('');
    }
  };

  const removeIngredient = (ing: string) => {
    setIngredients(prev => prev.filter(i => i !== ing));
  };

  const handlePhotoFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPhotoBase64(dataUrl);
      setPhotoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPhotoBase64(null);
    setPhotoPreview(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const search = async () => {
    if (!ingredients.length && !photoBase64) return;
    setUsedPhoto(!!photoBase64);
    setLoading(true);
    setSearched(true);
    setError(null);
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients,
          photoBase64: photoBase64 ?? undefined,
          cuisine: cuisine === 'Any cuisine' ? (customCuisine || 'Any') : cuisine,
          craving: craving || undefined,
        }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      const rList: Recipe[] = (data.recipes ?? []).map((r: Omit<Recipe, 'id'>, i: number) => ({
        ...r,
        id: r.title?.toLowerCase().replace(/\s+/g, '-') ?? `recipe-${i}`,
        bloodSugarImpact: (['low', 'moderate', 'high'].includes(r.bloodSugarImpact) ? r.bloodSugarImpact : 'low') as Recipe['bloodSugarImpact'],
      }));
      if (rList.length) {
        setRecipes(rList);
        setExpanded(rList[0].id);
        if (data.detectedIngredients?.length) {
          setDetectedIngredients(data.detectedIngredients);
          setIngredients(prev => {
            const merged = [...prev];
            for (const item of data.detectedIngredients as string[]) {
              if (!merged.includes(item.toLowerCase())) merged.push(item.toLowerCase());
            }
            return merged;
          });
        }
      } else {
        setError('No recipes returned. Try adjusting your ingredients or cuisine.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = (id: string) => {
    setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const canSearch = ingredients.length > 0 || !!photoBase64;

  // Defined as a plain render function (not a component) so React doesn't unmount/remount it on state changes, preserving input focus.
  const renderInputPanel = (web?: boolean) => (
    <div style={{
      background: '#FFFDF9', borderRadius: 22, padding: web ? 24 : 20,
      border: '1px solid rgba(1,35,116,0.07)', boxShadow: '0 14px 30px -22px rgba(1,35,116,.3)',
    }}>
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoFile(f); }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoFile(f); }}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, background: '#F7EFE1', borderRadius: 14, padding: 5 }}>
        {(['type', 'fridge', 'pantry'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, textAlign: 'center', cursor: 'pointer', padding: '11px 0',
              borderRadius: 10, fontSize: 13.5, fontWeight: 600, border: 'none',
              background: tab === t ? '#012374' : 'transparent',
              color: tab === t ? '#FFFDF9' : '#012374',
              transition: 'all .15s',
              fontFamily: 'inherit',
            }}
          >
            {t === 'type' ? 'Type' : t === 'fridge' ? 'Fridge' : 'Pantry'}
          </button>
        ))}
      </div>

      {/* Type tab */}
      {tab === 'type' && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 9 }}>
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addIngredient()}
              placeholder="e.g. chicken, spinach, yogurt…"
              style={{
                flex: 1, background: '#F7EFE1', border: '1px solid rgba(1,35,116,0.14)',
                borderRadius: 13, padding: '13px 15px', fontFamily: 'inherit',
                fontSize: 14.5, color: '#16182A', outline: 'none',
              }}
            />
            <button
              onClick={() => addIngredient()}
              style={{
                width: 50, flexShrink: 0, background: '#012374', borderRadius: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', border: 'none',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="#FFFDF9" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {ingredients.length > 0 && (
            <>
              <div style={{ marginTop: 14, fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.6)', fontWeight: 600 }}>In your basket</div>
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ingredients.map(ing => (
                  <span key={ing} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#012374', color: '#FFFDF9', padding: '9px 13px', borderRadius: 999, fontSize: 14, fontWeight: 500 }}>
                    {ing}
                    <span onClick={() => removeIngredient(ing)} style={{ cursor: 'pointer', display: 'flex', opacity: .8 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#FFFDF9" strokeWidth="2.2" strokeLinecap="round"/></svg>
                    </span>
                  </span>
                ))}
              </div>
            </>
          )}

          {suggestions.length > 0 && (
            <>
              <div style={{ marginTop: 18, fontSize: 12, color: 'rgba(22,24,42,0.6)' }}>Add a common pairing</div>
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {suggestions.map(s => (
                  <span
                    key={s}
                    onClick={() => addIngredient(s)}
                    style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFFDF9', color: '#012374', border: '1px solid rgba(1,35,116,0.2)', padding: '9px 13px', borderRadius: 999, fontSize: 14, fontWeight: 500 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#012374" strokeWidth="2.4" strokeLinecap="round"/></svg>
                    {s}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Fridge / Pantry tabs — real camera + gallery */}
      {(tab === 'fridge' || tab === 'pantry') && (
        <div style={{ marginTop: 16 }}>
          {!photoPreview ? (
            <div style={{
              border: '1.5px dashed rgba(1,35,116,0.3)', borderRadius: 18,
              background: '#F7EFE1', padding: '28px 20px', textAlign: 'center',
            }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(1,35,116,0.07)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="6" width="18" height="13" rx="2.5" stroke="#012374" strokeWidth="1.7"/>
                  <circle cx="12" cy="12.5" r="3.4" stroke="#012374" strokeWidth="1.7"/>
                  <path d="M8 6l1.4-2h5.2L16 6" stroke="#012374" strokeWidth="1.7"/>
                </svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#012374', marginTop: 12 }}>Snap your {tab}</div>
              <div style={{ fontSize: 13, color: 'rgba(22,24,42,0.62)', marginTop: 4, lineHeight: 1.45 }}>
                Chatita spots the ingredients and builds recipes from what it sees.
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  style={{ background: '#012374', color: '#FFFDF9', border: 'none', padding: '10px 22px', borderRadius: 999, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
                >
                  Take a photo
                </button>
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  style={{ background: 'transparent', color: '#012374', border: '1.5px solid rgba(1,35,116,0.3)', padding: '10px 22px', borderRadius: 999, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
                >
                  Choose from gallery
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="Photo preview" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                <button
                  onClick={clearPhoto}
                  style={{
                    position: 'absolute', top: 10, right: 10, width: 30, height: 30,
                    borderRadius: '50%', background: 'rgba(22,24,42,0.7)', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#FFFDF9" strokeWidth="2.2" strokeLinecap="round"/></svg>
                </button>
              </div>
              <div style={{ fontSize: 13, color: '#1C7A4F', background: 'rgba(28,122,79,0.1)', borderRadius: 10, padding: '9px 14px', marginBottom: 12 }}>
                Photo ready — Chatita will detect ingredients and create recipes from it.
              </div>
            </div>
          )}

          {/* Manual ingredient input alongside the photo */}
          <div style={{ display: 'flex', gap: 9, marginTop: 10 }}>
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addIngredient()}
              placeholder="Add more ingredients…"
              style={{ flex: 1, background: '#F7EFE1', border: '1px solid rgba(1,35,116,0.14)', borderRadius: 13, padding: '11px 14px', fontFamily: 'inherit', fontSize: 14, color: '#16182A', outline: 'none' }}
            />
            <button onClick={() => addIngredient()} style={{ width: 46, background: '#012374', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#FFFDF9" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </div>
          {ingredients.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ingredients.map(ing => (
                <span key={ing} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#012374', color: '#FFFDF9', padding: '9px 13px', borderRadius: 999, fontSize: 13.5, fontWeight: 500 }}>
                  {ing}
                  <span onClick={() => removeIngredient(ing)} style={{ cursor: 'pointer', display: 'flex', opacity: .8 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#FFFDF9" strokeWidth="2.2" strokeLinecap="round"/></svg>
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cuisine */}
      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.5)', fontWeight: 700, marginBottom: 10 }}>Cuisine</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CUISINES.map(c => (
            <button
              key={c}
              onClick={() => setCuisine(c)}
              style={{
                padding: '9px 15px', borderRadius: 999, fontFamily: 'inherit', fontSize: 13.5,
                fontWeight: 500, cursor: 'pointer',
                background: cuisine === c ? '#012374' : '#F7EFE1',
                color: cuisine === c ? '#FFFDF9' : '#012374',
                border: cuisine === c ? 'none' : '1px solid rgba(1,35,116,0.12)',
                transition: 'all 0.15s',
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 9, marginTop: 10 }}>
          <input
            value={customCuisine}
            onChange={e => setCustomCuisine(e.target.value)}
            placeholder="Other cuisine…"
            style={{ flex: 1, background: '#F7EFE1', border: '1px solid rgba(1,35,116,0.14)', borderRadius: 13, padding: '11px 14px', fontFamily: 'inherit', fontSize: 14, color: '#16182A', outline: 'none' }}
          />
          {customCuisine && (
            <button
              onClick={() => setCuisine(customCuisine)}
              style={{ background: '#012374', color: '#FFFDF9', border: 'none', padding: '0 16px', borderRadius: 13, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Add
            </button>
          )}
        </div>
      </div>

      {/* Craving */}
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.5)', fontWeight: 700, marginBottom: 10 }}>What are you craving?</div>
        <input
          value={craving}
          onChange={e => setCraving(e.target.value)}
          placeholder="Something warm and spiced, light and refreshing…"
          style={{ width: '100%', background: '#F7EFE1', border: '1px solid rgba(1,35,116,0.14)', borderRadius: 13, padding: '13px 15px', fontFamily: 'inherit', fontSize: 14.5, color: '#16182A', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* CTA */}
      <button
        onClick={search}
        disabled={loading || !canSearch}
        style={{
          marginTop: 22, width: '100%',
          background: loading || !canSearch ? 'rgba(1,35,116,0.5)' : '#012374',
          color: '#FFFDF9', borderRadius: 15, padding: '15px', textAlign: 'center',
          fontSize: 15, fontWeight: 600, cursor: loading || !canSearch ? 'default' : 'pointer',
          boxShadow: '0 12px 26px -14px rgba(1,35,116,.6)', border: 'none', fontFamily: 'inherit',
        }}
      >
        {loading ? 'Finding recipes…' : 'Find gentle recipes'}
      </button>
      {!canSearch && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(22,24,42,0.5)', textAlign: 'center' }}>
          Add ingredients or take a photo to get started
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ─── Mobile (lg:hidden) ─── */}
      <div className="lg:hidden mobile-page-pb" style={{ minHeight: '100vh', background: '#F7EFE1', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ padding: '24px 20px 16px' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Recipes</div>
          <h1 className="font-serif-italic" style={{ fontSize: 30, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic', lineHeight: 1.1, marginTop: 6 }}>
            Cook with what you have.
          </h1>
          <p style={{ fontSize: 14, color: '#16182A', opacity: 0.72, marginTop: 6, lineHeight: 1.5 }}>
            Tell Chatita what&apos;s in your kitchen — or snap your fridge — and get gentle recipe ideas that work for you.
          </p>
        </div>

        <div style={{ padding: '0 16px' }}>
          {renderInputPanel()}
        </div>

        {/* Mobile results */}
        {searched && (
          <div style={{ padding: '20px 16px 0' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(22,24,42,0.55)', fontSize: 14 }}>
                Chatita is finding recipes for you…
              </div>
            ) : error ? (
              <div style={{ background: '#FFFDF9', borderRadius: 16, padding: '20px', textAlign: 'center', color: 'rgba(22,24,42,0.6)', fontSize: 14 }}>
                {error}
              </div>
            ) : (
              <>
                {usedPhoto && detectedIngredients.length > 0 && (
                  <div style={{ background: 'rgba(1,35,116,0.06)', borderRadius: 14, padding: '12px 16px', marginBottom: 14, fontSize: 13, color: '#012374' }}>
                    <strong>Detected in photo:</strong> {detectedIngredients.join(', ')}
                  </div>
                )}
                <div className="font-serif-italic" style={{ fontSize: 22, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic', marginBottom: 14 }}>
                  A few gentle ideas
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {recipes.map(r => (
                    <RecipeCard
                      key={r.id}
                      recipe={r}
                      expanded={expanded === r.id}
                      onToggle={() => setExpanded(expanded === r.id ? null : r.id)}
                      saved={saved.includes(r.id)}
                      onSave={() => toggleSave(r.id)}
                      userIngredients={ingredients}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <BottomNav />
      </div>

      {/* ─── Web (hidden lg:flex) ─── */}
      <div className="hidden lg:flex" style={{ height: '100vh', background: '#F7EFE1', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>
        <WebNav />

        <div style={{ flex: 1, overflowY: 'auto', padding: '34px 44px 44px' }}>

          {/* Header */}
          <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Recipes</div>
          <h1
            className="font-serif-italic"
            style={{ fontSize: 38, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic', lineHeight: 1.1, marginTop: 8 }}
          >
            Cook with what you have.
          </h1>
          <p style={{ fontSize: 16, color: '#16182A', opacity: 0.72, marginTop: 8, lineHeight: 1.55 }}>
            Tell Chatita what&apos;s in your kitchen — or snap your fridge — and get gentle recipes tailored to your body.
          </p>

          {/* 2-col grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24, marginTop: 26 }}>

            {/* LEFT: Input card */}
            <div style={{ position: 'sticky', top: 0, height: 'fit-content' }}>
              {renderInputPanel(true)}
            </div>

            {/* RIGHT: Results */}
            <div>
              {!searched ? (
                <div style={{
                  border: '1.5px dashed rgba(1,35,116,0.2)', borderRadius: 22, padding: '60px 40px',
                  textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3 }}>
                    <path d="M4 12a8 8 0 0 1 16 0v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-1z" stroke="#012374" strokeWidth="1.6"/>
                    <path d="M3 19h18" stroke="#012374" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M12 4v4" stroke="#012374" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  <div className="font-serif-italic" style={{ fontSize: 22, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic', marginTop: 20, lineHeight: 1.3 }}>
                    Your recipe ideas will appear here
                  </div>
                  <p style={{ fontSize: 14, color: 'rgba(22,24,42,0.55)', lineHeight: 1.6, marginTop: 10, maxWidth: 320 }}>
                    Add your ingredients or snap your fridge, choose a cuisine, and Chatita will find gentle dishes that work for you.
                  </p>
                </div>
              ) : loading ? (
                <div style={{
                  border: '1.5px dashed rgba(1,35,116,0.2)', borderRadius: 22, padding: '60px 40px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 16, color: 'rgba(22,24,42,0.55)' }}>Chatita is finding recipes for you…</div>
                </div>
              ) : error ? (
                <div style={{ background: '#FFFDF9', borderRadius: 22, padding: '30px', textAlign: 'center', color: 'rgba(22,24,42,0.6)', fontSize: 15 }}>
                  {error}
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                    <div className="font-serif-italic" style={{ fontSize: 26, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic' }}>
                      {cuisine !== 'Any cuisine' ? `Gentle ${cuisine} ideas` : 'A few gentle ideas for you'}
                    </div>
                    <button
                      onClick={() => { setSearched(false); setDetectedIngredients([]); setUsedPhoto(false); }}
                      style={{ background: 'none', border: 'none', color: 'rgba(22,24,42,0.55)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      ← Edit search
                    </button>
                  </div>
                  {usedPhoto && detectedIngredients.length > 0 && (
                    <div style={{ background: 'rgba(1,35,116,0.06)', borderRadius: 14, padding: '12px 18px', marginBottom: 16, fontSize: 13.5, color: '#012374' }}>
                      <strong>Detected in your photo:</strong> {detectedIngredients.join(', ')}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {recipes.map(r => (
                      <RecipeCard
                        key={r.id}
                        recipe={r}
                        expanded={expanded === r.id}
                        onToggle={() => setExpanded(expanded === r.id ? null : r.id)}
                        saved={saved.includes(r.id)}
                        onSave={() => toggleSave(r.id)}
                        web
                        userIngredients={ingredients}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
