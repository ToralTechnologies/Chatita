'use client';

import { useState } from 'react';
import BottomNav from '@/components/bottom-nav';
import WebNav from '@/components/web-nav';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

type Rating = 'great' | 'moderate' | 'caution';
type SearchMode = 'nearby' | 'dish' | 'name' | 'favs';

interface Dish {
  id: string;
  name: string;
  rating: Rating;
  carbs: string;
  tip: string;
}

interface Section {
  name: string;
  dishes: Dish[];
}

interface Place {
  id: string;
  name: string;
  cuisine: string;
  distance: string;
  address: string;
  sections: Section[];
}

// ─── Rating config ─────────────────────────────────────────────────────────────

const RATING = {
  great:    { label: 'Great',          color: '#1C7A4F', bg: 'rgba(28,122,79,0.12)',  border: 'rgba(28,122,79,0.18)',  row: 'rgba(28,122,79,0.06)' },
  moderate: { label: 'Enjoy mindfully', color: '#9A6F18', bg: 'rgba(200,147,43,0.18)', border: 'rgba(200,147,43,0.22)', row: 'rgba(200,147,43,0.07)' },
  caution:  { label: 'Save for later', color: '#B5562E', bg: 'rgba(181,86,46,0.13)',  border: 'rgba(181,86,46,0.18)',  row: 'rgba(181,86,46,0.05)' },
} as const;

// ─── Hardcoded restaurant data ────────────────────────────────────────────────

const PLACES: Place[] = [
  {
    id: 'pizza', name: 'Pizza House', cuisine: 'Italian', distance: '0.4 mi', address: '618 Church St',
    sections: [
      { name: 'Appetizer', dishes: [
        { id: 'caprese', name: 'Caprese Salad', rating: 'great', carbs: '6–8g', tip: 'Fresh tomato, mozzarella and basil — naturally low in carbs. Enjoy as much as you like with a drizzle of olive oil.' },
        { id: 'knots', name: 'Garlic Knots', rating: 'caution', carbs: '18–24g', tip: 'A lovely treat — share with the table and pair with a protein-rich dish to steady your blood sugar.' },
      ]},
      { name: 'Entrée', dishes: [
        { id: 'salmon', name: 'Grilled Salmon with Lemon & Herbs', rating: 'great', carbs: '2–4g', tip: 'Rich in omega-3s and protein — fill half your plate and add non-starchy veg on the side.' },
        { id: 'carbonara', name: 'Spaghetti Carbonara', rating: 'caution', carbs: '45–55g', tip: 'Ask for zucchini noodles or a smaller portion mixed with extra vegetables to keep carbs in check.' },
        { id: 'eggplant', name: 'Eggplant Parmesan', rating: 'moderate', carbs: '16–22g', tip: 'Comforting and veg-forward — just watch the breadcrumb coating and pair with a big green salad.' },
      ]},
      { name: 'Beverage', dishes: [
        { id: 'tea', name: 'Unsweetened Iced Tea', rating: 'great', carbs: '0–1g', tip: 'A refreshing choice that keeps your blood sugar steady throughout the meal.' },
      ]},
    ],
  },
  {
    id: 'salad', name: 'Green Bowl Co.', cuisine: 'Salads & bowls', distance: '0.6 mi', address: '210 Main St',
    sections: [
      { name: 'Bowls', dishes: [
        { id: 'harvest', name: 'Harvest Grain Bowl', rating: 'moderate', carbs: '24–30g', tip: 'Hearty and balanced — ask for half the grains and extra greens to lighten the load.' },
        { id: 'cobb', name: 'Chicken Cobb Salad', rating: 'great', carbs: '6–9g', tip: 'Protein-packed and crisp. Dressing on the side lets you keep it gentle.' },
      ]},
      { name: 'Sides', dishes: [
        { id: 'soup', name: 'Lentil Soup', rating: 'great', carbs: '12–16g', tip: 'Slow-digesting lentils make this a steady, warming pick.' },
      ]},
    ],
  },
  {
    id: 'grill', name: 'Cedar & Coal', cuisine: 'Mediterranean grill', distance: '0.9 mi', address: '44 Liberty St',
    sections: [
      { name: 'Plates', dishes: [
        { id: 'kebab', name: 'Chicken Kebab Plate', rating: 'great', carbs: '8–12g', tip: 'Grilled lean protein with herbs. Swap rice for the salad to keep it light.' },
        { id: 'falafel', name: 'Falafel Wrap', rating: 'moderate', carbs: '28–34g', tip: 'Flavorful and filling — go half-wrap or a lettuce wrap for fewer carbs.' },
      ]},
      { name: 'Dessert', dishes: [
        { id: 'baklava', name: 'Baklava', rating: 'caution', carbs: '30–38g', tip: 'Quite sweet — save it for a celebration and enjoy a small taste slowly.' },
      ]},
    ],
  },
];

// ─── Plate tip logic ──────────────────────────────────────────────────────────

function getPlateTip(selectedIds: string[], place: Place): string {
  const allDishes = place.sections.flatMap(s => s.dishes);
  const dishes = selectedIds.map(id => allDishes.find(d => d.id === id)).filter(Boolean) as Dish[];
  if (!dishes.length) return '';
  if (dishes.every(d => d.rating === 'great')) return 'Beautifully gentle — this combination should sit easy with your blood sugar.';
  if (dishes.some(d => d.rating === 'caution')) return "There's a richer pick here — pair it with a salad and a glass of water, and enjoy a smaller portion.";
  return 'Looking balanced. A glass of water before you eat helps too.';
}

function getGentleCount(place: Place): number {
  return place.sections.flatMap(s => s.dishes).filter(d => d.rating === 'great').length;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RestaurantFinderPage() {
  const [mode, setMode] = useState<SearchMode>('nearby');
  const [activeId, setActiveId] = useState('pizza');
  const [favs, setFavs] = useState<string[]>(['salad']);
  const [selected, setSelected] = useState<Record<string, string[]>>({ pizza: ['caprese', 'salmon'], salad: [], grill: [] });
  const [expandedMobile, setExpandedMobile] = useState<string | null>('pizza');

  const activePlace = PLACES.find(p => p.id === activeId) ?? PLACES[0];
  const activeSelected = selected[activeId] || [];
  const allDishes = activePlace.sections.flatMap(s => s.dishes);

  const toggleDish = (placeId: string, dishId: string) => {
    setSelected(prev => {
      const cur = prev[placeId] || [];
      return { ...prev, [placeId]: cur.includes(dishId) ? cur.filter(x => x !== dishId) : [...cur, dishId] };
    });
  };

  const toggleFav = (id: string) => {
    setFavs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const MODE_LABELS: { key: SearchMode; label: string }[] = [
    { key: 'nearby', label: 'Browse nearby' },
    { key: 'dish', label: 'Search by dish' },
    { key: 'name', label: 'Search by name' },
    { key: 'favs', label: 'Favorites' },
  ];

  return (
    <>
      {/* ─── Mobile (lg:hidden) ─── */}
      <div className="lg:hidden" style={{ minHeight: '100vh', background: '#F7EFE1', fontFamily: "'DM Sans', sans-serif", paddingBottom: 100 }}>
        <div style={{ padding: '24px 20px 16px' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Restaurants · Eating out</div>
          <h1 className="font-serif-italic" style={{ fontSize: 30, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic', lineHeight: 1.1, marginTop: 6 }}>
            Find a kind place to eat.
          </h1>
          <p style={{ fontSize: 14, color: '#16182A', opacity: 0.72, marginTop: 6, lineHeight: 1.5 }}>
            Chatita reads the menu with you and points to dishes that sit easy.
          </p>
        </div>

        {/* Restaurant list */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PLACES.map(place => {
            const isOpen = expandedMobile === place.id;
            const placeDishes = place.sections.flatMap(s => s.dishes);
            const placeSel = selected[place.id] || [];
            return (
              <div key={place.id} style={{ background: '#FFFDF9', borderRadius: 18, border: `1px solid ${isOpen ? '#012374' : 'rgba(1,35,116,0.08)'}`, overflow: 'hidden' }}>
                <div
                  onClick={() => setExpandedMobile(isOpen ? null : place.id)}
                  style={{ padding: '16px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic' }}>{place.name}</div>
                    <div style={{ fontSize: 13, color: 'rgba(22,24,42,0.6)', marginTop: 2 }}>{place.cuisine} · {place.distance}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ background: 'rgba(28,122,79,0.12)', color: '#1C7A4F', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>
                      {getGentleCount(place)} gentle picks
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                      <path d="M6 9l6 6 6-6" stroke="#012374" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ padding: '0 16px 16px' }}>
                    {place.sections.map(sec => (
                      <div key={sec.name} style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.5)', fontWeight: 700, marginBottom: 8 }}>{sec.name}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {sec.dishes.map(d => {
                            const r = RATING[d.rating];
                            const isSel = placeSel.includes(d.id);
                            return (
                              <div
                                key={d.id}
                                onClick={() => toggleDish(place.id, d.id)}
                                style={{
                                  cursor: 'pointer', borderRadius: 13, padding: '12px 13px',
                                  background: r.row, border: `1px solid ${r.border}`,
                                  boxShadow: isSel ? '0 0 0 2px #012374' : undefined,
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                                  <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                                    <span style={{
                                      marginTop: 1, width: 17, height: 17, borderRadius: 5, flexShrink: 0,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      background: isSel ? '#012374' : 'transparent',
                                      border: isSel ? 'none' : '1.5px solid rgba(1,35,116,0.3)',
                                    }}>
                                      {isSel && <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#FFFDF9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    </span>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#16182A' }}>{d.name}</div>
                                  </div>
                                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <span style={{ display: 'inline-flex', padding: '4px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: r.bg, color: r.color }}>{r.label}</span>
                                    <div style={{ fontSize: 11.5, color: 'rgba(22,24,42,0.5)', marginTop: 4 }}>{d.carbs} carbs</div>
                                  </div>
                                </div>
                                <div style={{ fontSize: 12.5, color: '#16182A', opacity: 0.66, lineHeight: 1.45, marginTop: 7, paddingLeft: 26 }}>{d.tip}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Plate summary */}
                    {placeSel.length > 0 && (
                      <div style={{ background: '#012374', color: '#FFFDF9', borderRadius: 15, padding: 16, marginTop: 8 }}>
                        <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Your plate so far</div>
                        <div className="font-serif-italic" style={{ fontSize: 19, lineHeight: 1.2, marginTop: 6, fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic' }}>
                          {placeSel.length} {placeSel.length === 1 ? 'dish chosen' : 'dishes chosen'}
                        </div>
                        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.88, lineHeight: 1.5 }}>{getPlateTip(placeSel, place)}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div style={{ margin: '20px 16px 0', display: 'flex', gap: 10, alignItems: 'flex-start', opacity: 0.7 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
            <path d="M12 2L2 20h20L12 2z" stroke="#C8932B" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M12 9v5M12 16v1" stroke="#C8932B" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <p style={{ fontSize: 12, color: '#16182A', lineHeight: 1.5, fontStyle: 'italic' }}>
            Carb estimates are approximate and based on typical portion sizes. Always confirm with your care team.
          </p>
        </div>

        <BottomNav />
      </div>

      {/* ─── Web (hidden lg:flex) ─── */}
      <div className="hidden lg:flex" style={{ height: '100vh', background: '#F7EFE1', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>
        <WebNav />

        <div style={{ flex: 1, overflowY: 'auto', padding: '34px 44px 44px' }}>

          {/* Header */}
          <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>
            Restaurants · Eating out
          </div>
          <h1
            className="font-serif-italic"
            style={{ fontSize: 38, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic', lineHeight: 1.1, marginTop: 8 }}
          >
            Find a kind place to eat.
          </h1>
          <p style={{ fontSize: 16, color: '#16182A', opacity: 0.72, marginTop: 8, lineHeight: 1.55 }}>
            Chatita reads the menu with you and points to dishes that sit easy — never good or bad, just gentle or mindful.
          </p>

          {/* 2-col grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, marginTop: 26, alignItems: 'start' }}>

            {/* LEFT: sticky search + list */}
            <div style={{ position: 'sticky', top: 0 }}>
              {/* Search panel */}
              <div style={{ background: '#FFFDF9', borderRadius: 22, padding: 24, border: '1px solid rgba(1,35,116,0.07)', boxShadow: '0 14px 30px -22px rgba(1,35,116,.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" stroke="#012374" strokeWidth="1.6"/>
                    <circle cx="12" cy="10" r="2.5" stroke="#012374" strokeWidth="1.6"/>
                  </svg>
                  <span className="font-serif-italic" style={{ fontSize: 18, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic' }}>Find a gentle spot</span>
                </div>
                <p style={{ fontSize: 13.5, color: 'rgba(22,24,42,0.65)', lineHeight: 1.5, marginBottom: 16 }}>
                  Browse places near you or search by dish or restaurant name.
                </p>

                {/* Mode chips 2x2 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {MODE_LABELS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setMode(key)}
                      style={{
                        padding: '10px 14px', borderRadius: 12, fontFamily: 'inherit',
                        fontSize: 13.5, fontWeight: 600, cursor: 'pointer', textAlign: 'center',
                        background: mode === key ? '#012374' : '#F7EFE1',
                        color: mode === key ? '#FFFDF9' : '#012374',
                        border: mode === key ? 'none' : '1px solid rgba(1,35,116,0.12)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Restaurant list */}
              <div style={{ marginTop: 18 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.5)', fontWeight: 700, marginBottom: 12 }}>
                  Recommended near you
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {PLACES.map(place => {
                    const isActive = activeId === place.id;
                    const isFav = favs.includes(place.id);
                    return (
                      <div
                        key={place.id}
                        onClick={() => setActiveId(place.id)}
                        style={{
                          background: '#FFFDF9', borderRadius: 16, padding: 16, cursor: 'pointer',
                          border: `1px solid ${isActive ? '#012374' : 'rgba(1,35,116,0.08)'}`,
                          boxShadow: isActive ? '0 0 0 1px #012374' : undefined,
                          transition: 'border-color 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div className="font-serif-italic" style={{ fontSize: 18, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic' }}>{place.name}</div>
                            <div style={{ fontSize: 13, color: 'rgba(22,24,42,0.6)', marginTop: 3 }}>{place.cuisine} · {place.distance}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button
                              onClick={e => { e.stopPropagation(); toggleFav(place.id); }}
                              style={{
                                width: 32, height: 32, borderRadius: '50%', background: '#F7EFE1',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: 'none', cursor: 'pointer',
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill={isFav ? '#E3171A' : 'none'}>
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={isFav ? '#E3171A' : '#012374'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 12, color: 'rgba(22,24,42,0.5)' }}>{place.address}</div>
                          <div style={{ background: 'rgba(28,122,79,0.12)', color: '#1C7A4F', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>
                            {getGentleCount(place)} gentle picks
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT: Selected restaurant menu */}
            <div style={{ background: '#FFFDF9', borderRadius: 22, overflow: 'hidden', border: '1px solid rgba(1,35,116,0.07)', boxShadow: '0 14px 30px -22px rgba(1,35,116,.3)' }}>
              {/* Restaurant header */}
              <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(1,35,116,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 className="font-serif-italic" style={{ fontSize: 26, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic', lineHeight: 1.1 }}>
                      {activePlace.name}
                    </h2>
                    <div style={{ fontSize: 13.5, color: 'rgba(22,24,42,0.6)', marginTop: 6 }}>
                      {activePlace.cuisine} · {activePlace.distance} · {activePlace.address}
                    </div>
                  </div>
                  <button style={{ background: '#012374', color: '#FFFDF9', border: 'none', padding: '10px 18px', borderRadius: 999, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    + Quick-add a meal
                  </button>
                </div>
              </div>

              {/* Menu content */}
              <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 28, alignItems: 'start' }}>
                {/* LEFT: menu sections */}
                <div>
                  {activePlace.sections.map(sec => (
                    <div key={sec.name} style={{ marginBottom: 22 }}>
                      <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.55)', fontWeight: 700, marginBottom: 12 }}>
                        {sec.name}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                        {sec.dishes.map(d => {
                          const r = RATING[d.rating];
                          const isSel = activeSelected.includes(d.id);
                          return (
                            <div
                              key={d.id}
                              onClick={() => toggleDish(activeId, d.id)}
                              style={{
                                cursor: 'pointer', borderRadius: 14, padding: '15px 16px',
                                background: r.row, border: `1px solid ${r.border}`,
                                boxShadow: isSel ? '0 0 0 2px #012374' : undefined,
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                                  <span style={{
                                    marginTop: 1, width: 19, height: 19, borderRadius: 6, flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: isSel ? '#012374' : 'transparent',
                                    border: isSel ? 'none' : '1.5px solid rgba(1,35,116,0.3)',
                                  }}>
                                    {isSel && <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#FFFDF9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                  </span>
                                  <div>
                                    <div style={{ fontSize: 15, fontWeight: 600, color: '#16182A' }}>{d.name}</div>
                                    <div style={{ fontSize: 13, color: '#16182A', opacity: 0.66, lineHeight: 1.45, marginTop: 5, maxWidth: 380 }}>{d.tip}</div>
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <span style={{ display: 'inline-flex', padding: '5px 11px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: r.bg, color: r.color }}>
                                    {r.label}
                                  </span>
                                  <div style={{ fontSize: 12, color: 'rgba(22,24,42,0.5)', marginTop: 7 }}>{d.carbs} carbs</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Disclaimer */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 10, opacity: 0.65 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                      <path d="M12 2L2 20h20L12 2z" stroke="#C8932B" strokeWidth="1.8" strokeLinejoin="round"/>
                      <path d="M12 9v5M12 16v1" stroke="#C8932B" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                    <p style={{ fontSize: 12, color: '#16182A', lineHeight: 1.5, fontStyle: 'italic' }}>
                      Carb estimates are approximate and based on typical portion sizes. Always confirm with your care team.
                    </p>
                  </div>
                </div>

                {/* RIGHT: sticky plate summary */}
                <div style={{ position: 'sticky', top: 24 }}>
                  {activeSelected.length > 0 ? (
                    <div style={{ background: '#012374', color: '#FFFDF9', borderRadius: 18, padding: 22 }}>
                      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Your plate so far</div>
                      <div className="font-serif-italic" style={{ fontSize: 23, lineHeight: 1.2, marginTop: 8, fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic' }}>
                        {activeSelected.length} {activeSelected.length === 1 ? 'dish chosen' : 'dishes chosen'}
                      </div>
                      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
                        {activeSelected.map(id => {
                          const dish = allDishes.find(d => d.id === id);
                          return dish ? (
                            <div key={id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14 }}>
                              <span style={{ opacity: 0.92 }}>{dish.name}</span>
                              <span style={{ opacity: 0.7 }}>{dish.carbs}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                      <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,253,249,0.18)', fontSize: 13.5, opacity: 0.88, lineHeight: 1.5 }}>
                        {getPlateTip(activeSelected, activePlace)}
                      </div>
                    </div>
                  ) : (
                    <div style={{ border: '1.5px dashed rgba(1,35,116,0.2)', borderRadius: 18, padding: '32px 24px', textAlign: 'center' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.35 }}>
                        <circle cx="12" cy="12" r="9" stroke="#012374" strokeWidth="1.6"/>
                        <path d="M8 12h8M12 8v8" stroke="#012374" strokeWidth="1.6" strokeLinecap="round"/>
                      </svg>
                      <div className="font-serif-italic" style={{ fontSize: 17, color: '#012374', fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic', marginTop: 14, lineHeight: 1.35 }}>
                        Build your plate
                      </div>
                      <p style={{ fontSize: 13, color: 'rgba(22,24,42,0.55)', lineHeight: 1.5, marginTop: 8 }}>
                        Tap dishes from the menu to see a gentle tip about your combination.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
