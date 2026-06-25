'use client';

import { useState } from 'react';
import BottomNav from '@/components/bottom-nav';
import WebNav from '@/components/web-nav';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Recipe {
  id: string;
  title: string;
  description: string;
  carbEstimate: string;
  calorieEstimate: string;
  bloodSugarImpact: 'low' | 'moderate';
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
};

// ─── Static fallback recipes ──────────────────────────────────────────────────

const STATIC_RECIPES: Recipe[] = [
  {
    id: 'biryani',
    title: 'Chicken & Cauliflower Biryani',
    description: 'A lighter spin on a beloved classic — cauliflower stands in for half the rice, soaking up all the warming spices.',
    carbEstimate: '28–34g',
    calorieEstimate: '310 kcal',
    bloodSugarImpact: 'low',
    prepTime: '35 min',
    servings: 4,
    cuisine: 'Pakistani',
    ingredients: ['500g chicken thighs, boneless', '1 small cauliflower, riced', '1 cup basmati rice', '1 cup plain yogurt', '2 onions, thinly sliced', '3 tbsp ghee or oil', '1 tsp cumin seeds', '2 tsp biryani masala', 'Fresh coriander and mint to finish'],
    steps: [
      'Marinate chicken in yogurt, biryani masala, and salt for at least 20 minutes.',
      'In a heavy pot, fry onions in ghee until deep golden and crisp. Remove half for topping.',
      'Add cumin seeds, then the chicken. Sear until lightly browned, about 8 minutes.',
      'Add soaked rice and cauliflower rice. Pour in 1.5 cups of water.',
      'Cover tightly and cook on low for 18–20 minutes until the rice is tender.',
      'Rest covered for 5 minutes, then fluff gently and top with reserved onions and fresh herbs.',
    ],
    tips: [
      'Ricing the cauliflower yourself (pulse in a food processor) gives the best texture.',
      'The yogurt marinade is key — it tenderizes the chicken and adds gentle tang.',
    ],
  },
  {
    id: 'raita',
    title: 'Cucumber & Mint Raita',
    description: 'A cooling, probiotic-rich side that pairs beautifully with spiced dishes and helps slow carb absorption.',
    carbEstimate: '5–7g',
    calorieEstimate: '70 kcal',
    bloodSugarImpact: 'low',
    prepTime: '10 min',
    servings: 4,
    cuisine: 'Pakistani',
    ingredients: ['2 cups plain full-fat yogurt', '1 cucumber, grated and squeezed dry', 'Small handful fresh mint, finely chopped', '1/2 tsp cumin, toasted and ground', 'Pinch of salt and chili flakes'],
    steps: [
      'Whisk the yogurt until smooth and creamy.',
      'Fold in the cucumber, mint, and cumin.',
      'Taste and adjust salt. Top with a pinch of chili flakes.',
      'Chill for 10 minutes before serving for best flavor.',
    ],
    tips: [
      'Squeezing the cucumber is important — it prevents the raita from going watery.',
      'Toasting the cumin yourself makes a big difference in flavor.',
    ],
  },
  {
    id: 'daal',
    title: 'Red Lentil Daal with Turmeric',
    description: 'Slow-digesting lentils in a fragrant, golden broth. Protein and fiber together keep glucose rising gently.',
    carbEstimate: '30–36g',
    calorieEstimate: '280 kcal',
    bloodSugarImpact: 'low',
    prepTime: '30 min',
    servings: 4,
    cuisine: 'Pakistani',
    ingredients: ['1.5 cups red lentils, rinsed', '1 onion, diced', '3 garlic cloves, minced', '1 tbsp fresh ginger, grated', '1 tsp turmeric', '1 tsp cumin', '400ml canned tomatoes', '1 tbsp ghee or butter', 'Fresh coriander to serve'],
    steps: [
      'Simmer lentils in 3 cups water with turmeric and a pinch of salt for 20 minutes until soft.',
      'In a separate pan, fry onion in ghee until golden. Add garlic and ginger, cook 2 minutes.',
      'Add cumin and tomatoes. Simmer 8 minutes until the sauce thickens.',
      'Combine lentils and sauce. Adjust consistency with water.',
      'Finish with a squeeze of lemon and fresh coriander.',
    ],
    tips: [
      'Red lentils dissolve more than green — perfect for a creamy, souplike texture.',
      'Serve with a small portion of rice or a warm roti for a balanced meal.',
    ],
  },
  {
    id: 'skillet',
    title: 'Ginger Chicken & Veggie Skillet',
    description: 'A quick weeknight one-pan that comes together in 20 minutes with minimal carbs and maximum flavor.',
    carbEstimate: '10–14g',
    calorieEstimate: '350 kcal',
    bloodSugarImpact: 'low',
    prepTime: '20 min',
    servings: 2,
    cuisine: 'Any',
    ingredients: ['400g chicken breast, sliced thin', '2 cups broccoli florets', '1 red bell pepper, sliced', '2 tsp fresh ginger, grated', '2 garlic cloves', '2 tbsp low-sodium soy sauce', '1 tsp sesame oil', 'Sesame seeds to finish'],
    steps: [
      'Season chicken with a little salt and pepper.',
      'Heat oil in a large skillet or wok over high heat. Sear chicken until golden, 4–5 minutes. Remove.',
      'Add ginger and garlic. Stir 30 seconds until fragrant.',
      'Add broccoli and pepper. Stir-fry 4 minutes.',
      'Return chicken. Add soy sauce and sesame oil. Toss to coat.',
      'Serve immediately, topped with sesame seeds.',
    ],
    tips: [
      'High heat is the secret — it creates char and flavor rather than steaming the vegetables.',
      'Swap broccoli for bok choy or snap peas depending on what you have.',
    ],
  },
  {
    id: 'salmonbowl',
    title: 'Smoked Salmon & Avocado Bowl',
    description: 'Healthy fats and omega-3s on a bed of greens — minimal carbs, maximum satisfaction.',
    carbEstimate: '8–12g',
    calorieEstimate: '420 kcal',
    bloodSugarImpact: 'low',
    prepTime: '10 min',
    servings: 1,
    cuisine: 'Any',
    ingredients: ['100g smoked salmon', '1/2 ripe avocado, sliced', '2 cups mixed greens', '6 cherry tomatoes, halved', '1 tbsp capers', '1 tbsp extra-virgin olive oil', 'Juice of half a lemon', 'Cracked black pepper'],
    steps: [
      'Arrange greens in a bowl.',
      'Layer salmon, avocado slices, and tomatoes.',
      'Scatter capers over the top.',
      'Drizzle with olive oil and lemon juice.',
      'Finish with cracked pepper.',
    ],
    tips: [
      'Choose wild salmon when possible for the best omega-3 profile.',
      'If you want more substance, add a soft-boiled egg or a handful of cooked quinoa.',
    ],
  },
];

// ─── Common pairings + detect data ───────────────────────────────────────────

const COMMON_PAIRINGS = ['spinach', 'lentils', 'paneer', 'tomato', 'ginger', 'cumin', 'onion', 'garlic', 'zucchini', 'chickpeas', 'okra', 'eggplant'];

const DETECT = {
  fridge: ['greek yogurt', 'red bell pepper', 'feta', 'lettuce', 'tomato', 'red onion'],
  pantry: ['chickpeas', 'brown rice', 'red lentils', 'cumin', 'olive oil', 'canned tomatoes'],
};

const CUISINES = ['Any cuisine', 'Pakistani', 'Indian', 'Mexican', 'Mediterranean'];

// ─── Recipe card component ────────────────────────────────────────────────────

function RecipeCard({ recipe, expanded, onToggle, saved, onSave, web }: {
  recipe: Recipe;
  expanded: boolean;
  onToggle: () => void;
  saved: boolean;
  onSave: () => void;
  web?: boolean;
}) {
  const imp = IMPACT[recipe.bloodSugarImpact];

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
            {recipe.cuisine !== 'Any' && (
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
  const [ingredients, setIngredients] = useState<string[]>(['chicken', 'cauliflower', 'yogurt']);
  const [photo, setPhoto] = useState<'fridge' | 'pantry' | null>(null);
  const [cuisine, setCuisine] = useState('Any cuisine');
  const [customCuisine, setCustomCuisine] = useState('');
  const [craving, setCraving] = useState('');
  const [draft, setDraft] = useState('');
  const [searched, setSearched] = useState(false);
  const [expanded, setExpanded] = useState<string | null>('biryani');
  const [saved, setSaved] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>(STATIC_RECIPES);

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

  const onTakePhoto = () => {
    if (tab !== 'fridge' && tab !== 'pantry') return;
    const detected = DETECT[tab];
    setPhoto(tab);
    setIngredients(prev => {
      const merged = [...prev];
      for (const item of detected) {
        if (!merged.includes(item)) merged.push(item);
      }
      return merged;
    });
  };

  const search = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, cuisine: cuisine === 'Any cuisine' ? customCuisine || 'Any' : cuisine, craving }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.recipes?.length) {
          setRecipes(data.recipes);
          setExpanded(data.recipes[0]?.id ?? null);
        } else {
          setRecipes(STATIC_RECIPES);
          setExpanded('biryani');
        }
      } else {
        setRecipes(STATIC_RECIPES);
        setExpanded('biryani');
      }
    } catch {
      setRecipes(STATIC_RECIPES);
      setExpanded('biryani');
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = (id: string) => {
    setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // ── Input panel (shared between mobile and web) ──
  const InputPanel = ({ web }: { web?: boolean }) => (
    <div style={{
      background: '#FFFDF9', borderRadius: 22, padding: web ? 24 : 20,
      border: '1px solid rgba(1,35,116,0.07)', boxShadow: '0 14px 30px -22px rgba(1,35,116,.3)',
    }}>
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

      {/* Fridge / Pantry tabs */}
      {(tab === 'fridge' || tab === 'pantry') && (
        <div style={{ marginTop: 16 }}>
          {photo !== tab ? (
            <div
              onClick={onTakePhoto}
              style={{
                border: '1.5px dashed rgba(1,35,116,0.3)', borderRadius: 18,
                background: '#F7EFE1', padding: '34px 20px', textAlign: 'center', cursor: 'pointer',
              }}
            >
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(1,35,116,0.07)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="6" width="18" height="13" rx="2.5" stroke="#012374" strokeWidth="1.7"/>
                  <circle cx="12" cy="12.5" r="3.4" stroke="#012374" strokeWidth="1.7"/>
                  <path d="M8 6l1.4-2h5.2L16 6" stroke="#012374" strokeWidth="1.7"/>
                </svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#012374', marginTop: 12 }}>Snap your {tab}</div>
              <div style={{ fontSize: 13, color: 'rgba(22,24,42,0.62)', marginTop: 4, lineHeight: 1.45 }}>Chatita spots the ingredients for you — you can edit them after.</div>
              <button style={{ marginTop: 14, background: '#012374', color: '#FFFDF9', border: 'none', padding: '10px 22px', borderRadius: 999, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
                Take a photo
              </button>
            </div>
          ) : (
            <div>
              <div style={{ background: 'rgba(1,35,116,0.08)', borderRadius: 14, padding: '28px 20px', textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 14, color: '#012374', fontWeight: 600 }}>Chatita spotted {DETECT[tab].length} items</div>
                <div style={{ fontSize: 12.5, color: 'rgba(22,24,42,0.6)', marginTop: 4 }}>from your {tab}</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ingredients.map(ing => (
                  <span key={ing} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#012374', color: '#FFFDF9', padding: '9px 13px', borderRadius: 999, fontSize: 13.5, fontWeight: 500 }}>
                    {ing}
                    <span onClick={() => removeIngredient(ing)} style={{ cursor: 'pointer', display: 'flex', opacity: .8 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#FFFDF9" strokeWidth="2.2" strokeLinecap="round"/></svg>
                    </span>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 9, marginTop: 12 }}>
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
              onClick={() => { setCuisine(customCuisine); }}
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
        disabled={loading}
        style={{
          marginTop: 22, width: '100%', background: loading ? 'rgba(1,35,116,0.5)' : '#012374',
          color: '#FFFDF9', borderRadius: 15, padding: '15px', textAlign: 'center',
          fontSize: 15, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
          boxShadow: '0 12px 26px -14px rgba(1,35,116,.6)', border: 'none', fontFamily: 'inherit',
        }}
      >
        {loading ? 'Finding recipes…' : 'Find gentle recipes'}
      </button>
    </div>
  );

  return (
    <>
      {/* ─── Mobile (lg:hidden) ─── */}
      <div className="lg:hidden" style={{ minHeight: '100vh', background: '#F7EFE1', fontFamily: "'DM Sans', sans-serif", paddingBottom: 100 }}>
        <div style={{ padding: '24px 20px 16px' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Recipes</div>
          <h1 className="font-serif-italic" style={{ fontSize: 30, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic', lineHeight: 1.1, marginTop: 6 }}>
            Cook with what you have.
          </h1>
          <p style={{ fontSize: 14, color: '#16182A', opacity: 0.72, marginTop: 6, lineHeight: 1.5 }}>
            Tell Chatita what&apos;s in your kitchen and get gentle recipe ideas that work for you.
          </p>
        </div>

        <div style={{ padding: '0 16px' }}>
          <InputPanel />
        </div>

        {/* Mobile results */}
        {searched && (
          <div style={{ padding: '20px 16px 0' }}>
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
                />
              ))}
            </div>
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
            Tell Chatita what&apos;s in your kitchen and get gentle recipe ideas tailored to your body.
          </p>

          {/* 2-col grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24, marginTop: 26 }}>

            {/* LEFT: Input card */}
            <div style={{ position: 'sticky', top: 0, height: 'fit-content' }}>
              <InputPanel web />
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
                    Add your ingredients, choose a cuisine, and Chatita will find gentle dishes that work for you.
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                    <div className="font-serif-italic" style={{ fontSize: 26, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic' }}>
                      {cuisine !== 'Any cuisine' ? `Gentle ${cuisine} ideas` : 'A few gentle ideas for you'}
                    </div>
                    <button
                      onClick={() => setSearched(false)}
                      style={{ background: 'none', border: 'none', color: 'rgba(22,24,42,0.55)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      ← Edit search
                    </button>
                  </div>
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
