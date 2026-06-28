'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/bottom-nav';
import WebNav from '@/components/web-nav';
import BackButton from '@/components/back-button';

// ── Types & constants ────────────────────────────────────────────────────────

type ImpactLevel = 'low' | 'moderate';

interface Recipe {
  id: string;
  cuisine: string;
  title: string;
  desc: string;
  impact: ImpactLevel;
  carbs: string;
  steps: string[];
  tip: string;
}

const RECIPES: Recipe[] = [
  {
    id: 'biryani',
    cuisine: 'Pakistani',
    title: 'Spiced Chicken Biryani with Cauliflower Rice',
    desc: 'A lighter take on the classic — fragrant basmati swapped for cauliflower rice, with tender chicken and all the warm spice you love.',
    impact: 'low',
    carbs: '12–15g carbs',
    steps: [
      'Pulse the cauliflower into rice-sized pieces.',
      'Marinate the chicken in yogurt, ginger-garlic and garam masala for 15 minutes.',
      'Sear until golden, add a splash of water, cover and cook through.',
      'Stir in the cauliflower rice and saffron; cover 4–5 minutes.',
      'Fold in cilantro and serve warm.',
    ],
    tip: 'Cauliflower rice cuts the carbs roughly in half while keeping the dish satisfying.',
  },
  {
    id: 'raita',
    cuisine: 'Pakistani',
    title: 'Spiced Grilled Chicken with Cucumber Raita',
    desc: 'Marinated, charred chicken paired with cooling cucumber raita — refreshing, protein-packed, and easy on your blood sugar.',
    impact: 'low',
    carbs: '8–10g carbs',
    steps: [
      'Mix yogurt, lemon, ginger-garlic, cumin and chili into a marinade.',
      'Coat the chicken and rest at least 15 minutes.',
      'Grill 6–7 minutes per side until cooked through.',
      'Stir grated cucumber and mint into yogurt for the raita.',
      'Slice the chicken and serve with the raita.',
    ],
    tip: 'Greek-yogurt marinades keep chicken moist with fewer carbs than cream.',
  },
  {
    id: 'salmonbowl',
    cuisine: 'Mediterranean',
    title: 'Mediterranean Salmon & Chickpea Bowl',
    desc: 'Herby baked salmon over a lemony chickpea and cucumber salad — rich in protein, omega-3s and fiber that keep blood sugar steady.',
    impact: 'moderate',
    carbs: '16–20g carbs',
    steps: [
      'Season the salmon with lemon, olive oil, salt and pepper.',
      'Bake at 400°F for 12–14 minutes until just flaky.',
      'Toss chickpeas, cucumber, tomato and red onion with lemon and olive oil.',
      'Fold in chopped parsley.',
      'Flake the salmon over the salad and serve.',
    ],
    tip: 'Chickpeas are slow-digesting, so they steady the meal rather than spike it.',
  },
  {
    id: 'skillet',
    cuisine: 'Mexican',
    title: 'Chicken & Red Pepper Skillet',
    desc: 'Tender chicken with sweet peppers, onion and a little feta, seasoned with cumin and paprika — bright flavor without the carbs.',
    impact: 'low',
    carbs: '12–15g carbs',
    steps: [
      'Season diced chicken with cumin, paprika, salt and pepper.',
      'Cook in olive oil until golden, then set aside.',
      'Sauté peppers and onion until softened.',
      'Return the chicken, add garlic, finish with feta and cilantro.',
    ],
    tip: 'Serve over cauliflower rice for extra volume without spiking blood sugar.',
  },
];

const IMPACT_CONFIG: Record<ImpactLevel, { bg: string; color: string; label: string; dot: string }> = {
  low:      { bg: 'rgba(28,122,79,0.12)',   color: '#1C7A4F', label: 'Gentle on blood sugar', dot: '#1C7A4F' },
  moderate: { bg: 'rgba(200,147,43,0.18)',  color: '#9A6F18', label: 'Enjoy mindfully',        dot: '#C8932B' },
};

// ── RecipeCard (standalone component, not nested) ────────────────────────────

interface RecipeCardProps {
  recipe: Recipe;
  expanded: boolean;
  onToggle: () => void;
  onRemove: (e: React.MouseEvent) => void;
  web?: boolean;
}

function RecipeCard({ recipe, expanded, onToggle, onRemove, web }: RecipeCardProps) {
  const impact = IMPACT_CONFIG[recipe.impact];
  const pad = web ? '22px 24px' : '16px';
  const expPad = web ? '0 24px 22px' : '0 16px 16px';
  const titleSize = web ? '21px' : '18px';
  const heartSize = web ? '36px' : '32px';
  const pillPad = web ? '7px 13px' : '6px 11px';
  const pillFs = web ? '13px' : '12px';
  const stepFs = web ? '14px' : '13.5px';
  const dotSize = web ? '8px' : '7px';
  const numSize = web ? '23px' : '22px';

  return (
    <div style={{
      background: '#FFFDF9',
      borderRadius: web ? '20px' : '18px',
      border: '1px solid rgba(1,35,116,0.08)',
      overflow: 'hidden',
      boxShadow: '0 10px 24px -20px rgba(1,35,116,.5)',
    }}>
      {/* Header row — click to expand */}
      <div onClick={onToggle} style={{ cursor: 'pointer', padding: pad }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
          <span className="font-serif" style={{ fontSize: titleSize, color: '#012374', lineHeight: 1.18 }}>
            {recipe.title}
          </span>
          {/* Heart button */}
          <button
            onClick={onRemove}
            style={{
              flexShrink: 0,
              width: heartSize,
              height: heartSize,
              borderRadius: '50%',
              background: '#F7EFE1',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title="Remove from saved"
          >
            <svg width={web ? 18 : 17} height={web ? 18 : 17} viewBox="0 0 24 24" fill="#012374">
              <path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20z" stroke="#012374" strokeWidth="1.6"/>
            </svg>
          </button>
        </div>

        <p style={{ fontSize: '13px', color: '#16182A', opacity: 0.7, lineHeight: 1.45, marginTop: '7px' }}>
          {recipe.desc}
        </p>

        {/* Badge row */}
        <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
          {/* Impact */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: dotSize === '8px' ? '7px' : '6px',
            background: impact.bg, color: impact.color,
            padding: pillPad, borderRadius: '999px', fontSize: pillFs, fontWeight: 600,
          }}>
            <span style={{ width: dotSize, height: dotSize, borderRadius: '50%', background: impact.dot, flexShrink: 0 }} />
            {impact.label}
          </span>
          {/* Carbs */}
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            background: '#F7EFE1', color: '#012374',
            padding: pillPad, borderRadius: '999px', fontSize: pillFs, fontWeight: 600,
          }}>
            {recipe.carbs}
          </span>
          {/* Cuisine */}
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            background: 'rgba(200,147,43,0.14)', color: '#9A6F18',
            padding: pillPad, borderRadius: '999px', fontSize: pillFs, fontWeight: 600,
          }}>
            {recipe.cuisine}
          </span>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div style={{ padding: expPad }}>
          <div style={{
            borderTop: '1px solid rgba(1,35,116,0.07)',
            paddingTop: '13px',
            fontSize: '12px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#001A4D',
            opacity: 0.6,
            fontWeight: 600,
          }}>
            Steps
          </div>
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recipe.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: web ? '12px' : '11px', alignItems: 'flex-start' }}>
                <span style={{
                  flexShrink: 0,
                  width: numSize, height: numSize,
                  borderRadius: '50%',
                  background: '#012374', color: '#FFFDF9',
                  fontSize: '12px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: '1px',
                }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: stepFs, color: '#16182A', lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>
          {/* Why it's gentle box */}
          <div style={{
            marginTop: '14px',
            background: 'rgba(200,147,43,0.12)',
            borderRadius: web ? '13px' : '12px',
            padding: web ? '15px' : '13px',
          }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.06em', color: '#9A6F18', fontWeight: 700, textTransform: 'uppercase' }}>
              Why it&apos;s gentle
            </div>
            <div style={{ fontSize: web ? '13.5px' : '13px', color: '#16182A', lineHeight: 1.45, marginTop: '7px' }}>
              {recipe.tip}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SavedRecipesPage() {
  const router = useRouter();
  const [saved, setSaved] = useState<string[]>(['biryani', 'raita', 'salmonbowl', 'skillet']);
  const [filter, setFilter] = useState('All');
  const [expanded, setExpanded] = useState<string | null>('biryani');

  const savedRecipes = RECIPES.filter((r) => saved.includes(r.id));
  const cuisines = Array.from(new Set(savedRecipes.map((r) => r.cuisine)));
  const filterChips = ['All', ...cuisines];
  const shown = filter === 'All' ? savedRecipes : savedRecipes.filter((r) => r.cuisine === filter);

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved((prev) => prev.filter((s) => s !== id));
    if (expanded === id) setExpanded(null);
  };

  const handleToggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  const resetAll = () => {
    setSaved(RECIPES.map((r) => r.id));
    setFilter('All');
  };

  const renderFilterChips = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {filterChips.map((chip) => {
        const active = filter === chip;
        return (
          <button
            key={chip}
            onClick={() => setFilter(chip)}
            style={{
              cursor: 'pointer',
              userSelect: 'none',
              padding: '9px 15px',
              borderRadius: '999px',
              fontSize: '13.5px',
              fontWeight: 600,
              background: active ? '#012374' : '#FFFDF9',
              color: active ? '#FFFDF9' : '#012374',
              border: active ? '1px solid #012374' : '1px solid rgba(1,35,116,0.2)',
              whiteSpace: 'nowrap',
            }}
          >
            {chip === 'All' ? 'All recipes' : chip}
          </button>
        );
      })}
    </div>
  );

  const renderEmptyState = (web?: boolean) => (
    <div style={{
      textAlign: 'center',
      padding: web ? '70px 40px' : '40px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{
        width: web ? '68px' : '64px',
        height: web ? '68px' : '64px',
        borderRadius: '20px',
        background: web ? '#F7EFE1' : '#FFFDF9',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: web ? 'none' : '0 8px 20px -16px rgba(1,35,116,.5)',
      }}>
        <svg width={web ? 32 : 30} height={web ? 32 : 30} viewBox="0 0 24 24" fill="none">
          <path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20z" stroke="#012374" strokeWidth="1.6"/>
        </svg>
      </div>
      <div className="font-serif-italic" style={{ fontSize: web ? '27px' : '23px', color: '#012374', marginTop: '16px' }}>
        No saved recipes yet
      </div>
      <div style={{
        fontSize: web ? '15px' : '14px',
        color: '#16182A',
        opacity: 0.66,
        lineHeight: 1.5,
        marginTop: '6px',
        maxWidth: web ? '420px' : undefined,
      }}>
        When you find a recipe you love, tap{' '}
        <span style={{ fontWeight: 600, color: '#012374' }}>Save this recipe</span>{' '}
        and it&apos;ll wait for you here.
      </div>
      <button
        onClick={() => router.push('/recipes')}
        style={{
          marginTop: web ? '20px' : '18px',
          display: 'inline-block',
          background: '#012374',
          color: '#FFFDF9',
          padding: web ? '14px 26px' : '13px 22px',
          borderRadius: web ? '14px' : '13px',
          fontSize: web ? '15px' : '14px',
          fontWeight: 600,
          cursor: 'pointer',
          border: 'none',
          fontFamily: 'inherit',
        }}
      >
        Browse recipes
      </button>
    </div>
  );

  return (
    <>
      {/* ─── Mobile ─── */}
      <div className="lg:hidden mobile-page-pb" style={{ background: '#F7EFE1', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
        {/* Header */}
        <div style={{ padding: '14px 20px 0', paddingTop: 'max(14px, env(safe-area-inset-top, 0px))' }}>
          <BackButton href="/recipes" />
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>
              Recipes
            </div>
            <div className="font-serif-italic" style={{ fontSize: '23px', color: '#012374', lineHeight: 1 }}>
              Saved for you
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ padding: '0 20px', overflowY: 'auto' }}>
          {savedRecipes.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {/* Count + subtitle */}
              <div style={{ marginTop: '18px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <div className="font-serif-italic" style={{ fontSize: '27px', color: '#012374' }}>
                  {savedRecipes.length} {savedRecipes.length === 1 ? 'saved recipe' : 'saved recipes'}
                </div>
              </div>
              <div style={{ fontSize: '13.5px', color: '#16182A', opacity: 0.7, lineHeight: 1.45, marginTop: '4px' }}>
                A gentle little cookbook you&apos;ve built, one meal at a time.
              </div>

              {/* Filter chips */}
              <div style={{ marginTop: '16px' }}>
                {renderFilterChips()}
              </div>

              {/* Cards */}
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '13px' }}>
                {shown.length === 0 ? (
                  renderEmptyState()
                ) : (
                  shown.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      expanded={expanded === recipe.id}
                      onToggle={() => handleToggle(recipe.id)}
                      onRemove={(e) => handleRemove(recipe.id, e)}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <BottomNav />
      </div>

      {/* ─── Web ─── */}
      <div className="hidden lg:flex" style={{ height: '100vh', background: '#F7EFE1', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>
        <WebNav />

        <div style={{ flex: 1, overflowY: 'auto', padding: '34px 44px 44px' }}>
          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>
                Recipes · saved
              </div>
              <div className="font-serif-italic" style={{ fontSize: '38px', color: '#012374', lineHeight: 1.05, marginTop: '6px' }}>
                Your saved recipes.
              </div>
              <div style={{ fontSize: '16px', color: '#16182A', opacity: 0.72, marginTop: '4px' }}>
                A gentle little cookbook you&apos;ve built, one meal at a time.
              </div>
            </div>

            {savedRecipes.length > 0 && (
              <div style={{
                background: '#FFFDF9',
                border: '1px solid rgba(1,35,116,0.08)',
                borderRadius: '16px',
                padding: '14px 20px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}>
                <div className="font-serif" style={{ fontSize: '30px', color: '#012374', lineHeight: 1 }}>
                  {savedRecipes.length}
                </div>
                <div style={{ fontSize: '12px', color: '#16182A', opacity: 0.55, marginTop: '3px' }}>
                  {savedRecipes.length === 1 ? 'recipe kept' : 'recipes kept'}
                </div>
              </div>
            )}
          </div>

          {savedRecipes.length === 0 ? (
            <div style={{
              marginTop: '30px',
              background: '#FFFDF9',
              border: '1px dashed rgba(1,35,116,0.16)',
              borderRadius: '22px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              {renderEmptyState(true)}
            </div>
          ) : (
            <>
              {/* Filter chips */}
              <div style={{ marginTop: '24px' }}>
                {renderFilterChips()}
              </div>

              {/* 2-column grid */}
              <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', alignItems: 'start' }}>
                {shown.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1' }}>{renderEmptyState(true)}</div>
                ) : (
                  shown.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      expanded={expanded === recipe.id}
                      onToggle={() => handleToggle(recipe.id)}
                      onRemove={(e) => handleRemove(recipe.id, e)}
                      web
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
