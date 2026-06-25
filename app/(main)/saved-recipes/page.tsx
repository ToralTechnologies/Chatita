'use client';

import { useState } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/bottom-nav';
import WebNav from '@/components/web-nav';
import BackButton from '@/components/back-button';

// ── Static recipe data ──────────────────────────────────────────────────────

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

// ── Impact badge config ─────────────────────────────────────────────────────

const IMPACT_CONFIG: Record<ImpactLevel, { bg: string; color: string; label: string; dot: string }> = {
  low: {
    bg: 'rgba(28,122,79,0.12)',
    color: '#1C7A4F',
    label: 'Gentle on blood sugar',
    dot: '#1C7A4F',
  },
  moderate: {
    bg: 'rgba(200,147,43,0.18)',
    color: '#9A6F18',
    label: 'Enjoy mindfully',
    dot: '#C8932B',
  },
};

// ── Subcomponents ───────────────────────────────────────────────────────────

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20z"
        fill="#012374"
        stroke="#012374"
        strokeWidth="1.6"
      />
    </svg>
  );
}

interface RecipeCardProps {
  recipe: Recipe;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  web?: boolean;
}

function RecipeCard({ recipe, expanded, onToggle, onRemove, web }: RecipeCardProps) {
  const impact = IMPACT_CONFIG[recipe.impact];
  const borderRadius = web ? '20px' : '18px';

  return (
    <div
      style={{
        background: '#FFFDF9',
        borderRadius,
        border: '1px solid rgba(1,35,116,0.07)',
        boxShadow: '0 14px 30px -24px rgba(1,35,116,.3)',
        overflow: 'hidden',
      }}
    >
      {/* Card header — clickable to expand */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: web ? '20px 20px 14px' : '16px 16px 12px',
          textAlign: 'left',
          display: 'block',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <span
            className="font-serif-italic"
            style={{
              fontSize: web ? '21px' : '18px',
              color: '#012374',
              lineHeight: 1.2,
              flex: 1,
              display: 'block',
            }}
          >
            {recipe.title}
          </span>
          {/* Heart / remove button */}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#F7EFE1',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title="Remove from saved"
          >
            <HeartIcon />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'rgba(22,24,42,0.65)', marginTop: '6px', lineHeight: 1.5 }}>
          {recipe.desc}
        </p>

        {/* Badges row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
          {/* Impact badge */}
          <span
            style={{
              background: impact.bg,
              color: impact.color,
              borderRadius: '999px',
              padding: '5px 10px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: impact.dot,
                flexShrink: 0,
              }}
            />
            {impact.label}
          </span>
          {/* Carbs chip */}
          <span
            style={{
              background: '#F7EFE1',
              color: '#012374',
              borderRadius: '999px',
              padding: '5px 10px',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            {recipe.carbs}
          </span>
          {/* Cuisine chip */}
          <span
            style={{
              background: 'rgba(1,35,116,0.07)',
              color: '#012374',
              borderRadius: '999px',
              padding: '5px 10px',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            {recipe.cuisine}
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: web ? '0 20px 20px' : '0 16px 16px' }}>
          {/* Steps */}
          <p
            style={{
              fontSize: '11px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(1,35,116,0.5)',
              fontWeight: 700,
              marginBottom: '10px',
            }}
          >
            How to make it
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recipe.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#012374',
                    color: '#FFFDF9',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '1px',
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontSize: '13px', color: '#16182A', lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>

          {/* Tip box */}
          <div
            style={{
              background: 'rgba(200,147,43,0.12)',
              borderRadius: '12px',
              padding: '13px',
              marginTop: '14px',
            }}
          >
            <p
              style={{
                fontSize: '11px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#9A6F18',
                fontWeight: 700,
                marginBottom: '5px',
              }}
            >
              Why it&apos;s gentle
            </p>
            <p style={{ fontSize: '13px', color: '#16182A', lineHeight: 1.5 }}>{recipe.tip}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function SavedRecipesPage() {
  const [saved, setSaved] = useState<string[]>(['biryani', 'raita', 'salmonbowl', 'skillet']);
  const [filter, setFilter] = useState('All');
  const [expanded, setExpanded] = useState<string | null>('biryani');

  const savedRecipes = RECIPES.filter((r) => saved.includes(r.id));
  const cuisines = Array.from(new Set(savedRecipes.map((r) => r.cuisine)));
  const filterChips = ['All', ...cuisines];

  const displayedRecipes =
    filter === 'All' ? savedRecipes : savedRecipes.filter((r) => r.cuisine === filter);

  const handleRemove = (id: string) => {
    setSaved((prev) => prev.filter((s) => s !== id));
    if (expanded === id) setExpanded(null);
  };

  const handleToggle = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  // ── Filter chips ──────────────────────────────────────────────────────────

  function FilterChips() {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
        {filterChips.map((chip) => {
          const active = filter === chip;
          return (
            <button
              key={chip}
              onClick={() => setFilter(chip)}
              style={{
                padding: '7px 14px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: active ? 600 : 500,
                background: active ? '#012374' : '#FFFDF9',
                color: active ? '#FFFDF9' : '#012374',
                border: active ? '1px solid #012374' : '1px solid rgba(1,35,116,0.2)',
                cursor: 'pointer',
              }}
            >
              {chip === 'All' ? 'All recipes' : chip}
            </button>
          );
        })}
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  function EmptyState({ web }: { web?: boolean }) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: web ? '60px 20px' : '48px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20z"
            stroke="#012374"
            strokeWidth="1.6"
            fill="none"
            opacity={0.3}
          />
        </svg>
        <span className="font-serif-italic" style={{ fontSize: '22px', color: '#012374', opacity: 0.5 }}>
          No saved recipes yet
        </span>
        <Link
          href="/recipes"
          style={{
            marginTop: '4px',
            padding: '10px 22px',
            borderRadius: '999px',
            background: '#012374',
            color: '#FFFDF9',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Browse recipes
        </Link>
      </div>
    );
  }

  // ── MOBILE LAYOUT ─────────────────────────────────────────────────────────

  const MobileLayout = (
    <div className="lg:hidden mobile-page-pb" style={{ background: '#F7EFE1', minHeight: '100vh' }}>
      {/* Page header */}
      <div style={{ padding: '20px 20px 0', paddingTop: 'max(20px, env(safe-area-inset-top, 0px))' }}>
        <BackButton href="/recipes" />
        <p
          style={{
            fontSize: '11px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(1,35,116,0.5)',
            fontWeight: 700,
            marginTop: '16px',
          }}
        >
          RECIPES
        </p>
        <h1 className="font-serif-italic" style={{ fontSize: '30px', color: '#012374', marginTop: '2px', lineHeight: 1.1 }}>
          Saved for you
        </h1>

        {savedRecipes.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <p style={{ fontSize: '14px', color: '#16182A' }}>
              <span className="font-serif-italic" style={{ fontSize: '18px', color: '#012374' }}>
                {savedRecipes.length}
              </span>{' '}
              {savedRecipes.length === 1 ? 'saved recipe' : 'saved recipes'}
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(22,24,42,0.55)', marginTop: '2px' }}>
              A gentle little cookbook you&apos;ve built, one meal at a time.
            </p>
          </div>
        )}
      </div>

      {savedRecipes.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Filter chips */}
          <div style={{ padding: '16px 20px 0' }}>
            <FilterChips />
          </div>

          {/* Recipe cards */}
          <div style={{ padding: '14px 20px 0', display: 'flex', flexDirection: 'column', gap: '13px' }}>
            {displayedRecipes.length === 0 ? (
              <EmptyState />
            ) : (
              displayedRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  expanded={expanded === recipe.id}
                  onToggle={() => handleToggle(recipe.id)}
                  onRemove={() => handleRemove(recipe.id)}
                />
              ))
            )}
          </div>

          {/* Info tip */}
          <div
            style={{
              margin: '20px 20px 0',
              background: 'rgba(200,147,43,0.12)',
              borderRadius: '14px',
              padding: '13px 14px',
            }}
          >
            <p style={{ fontSize: '12.5px', color: '#9A6F18', lineHeight: 1.5 }}>
              Tracking what you eat helps you spot patterns in how your body responds to different meals.
            </p>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );

  // ── WEB LAYOUT ────────────────────────────────────────────────────────────

  const WebLayout = (
    <div className="hidden lg:flex" style={{ minHeight: '100vh', background: '#F7EFE1' }}>
      <WebNav />

      <main style={{ flex: 1, padding: '34px 44px', overflowY: 'auto' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <p
              style={{
                fontSize: '11px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(1,35,116,0.5)',
                fontWeight: 700,
              }}
            >
              RECIPES · SAVED
            </p>
            <h1 className="font-serif-italic" style={{ fontSize: '38px', color: '#012374', marginTop: '4px', lineHeight: 1.1 }}>
              Your saved recipes.
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(22,24,42,0.55)', marginTop: '6px' }}>
              A gentle little cookbook you&apos;ve built, one meal at a time.
            </p>
          </div>

          {savedRecipes.length > 0 && (
            <div
              style={{
                background: '#FFFDF9',
                borderRadius: '18px',
                border: '1px solid rgba(1,35,116,0.07)',
                padding: '16px 22px',
                textAlign: 'center',
                minWidth: '110px',
              }}
            >
              <span className="font-serif-italic" style={{ fontSize: '30px', color: '#012374' }}>
                {savedRecipes.length}
              </span>
              <p style={{ fontSize: '12px', color: 'rgba(22,24,42,0.5)', marginTop: '2px' }}>
                {savedRecipes.length === 1 ? 'recipe kept' : 'recipes kept'}
              </p>
            </div>
          )}
        </div>

        {savedRecipes.length === 0 ? (
          <div
            style={{
              background: '#FFFDF9',
              borderRadius: '22px',
              border: '2px dashed rgba(1,35,116,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <EmptyState web />
          </div>
        ) : (
          <>
            {/* Filter chips */}
            <div style={{ marginBottom: '20px' }}>
              <FilterChips />
            </div>

            {/* 2-column grid */}
            {displayedRecipes.length === 0 ? (
              <EmptyState web />
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '18px',
                }}
              >
                {displayedRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    expanded={expanded === recipe.id}
                    onToggle={() => handleToggle(recipe.id)}
                    onRemove={() => handleRemove(recipe.id)}
                    web
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );

  return (
    <>
      {MobileLayout}
      {WebLayout}
    </>
  );
}
