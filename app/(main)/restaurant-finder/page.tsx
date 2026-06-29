'use client';

import { useState, useRef } from 'react';
import BottomNav from '@/components/bottom-nav';
import WebNav from '@/components/web-nav';
import BackButton from '@/components/back-button';

// ─── Types ────────────────────────────────────────────────────────────────────

type Score = 'great' | 'moderate' | 'caution';

interface RestaurantSuggestion {
  id: string;
  name: string;
  cuisine: string;
  address?: string;
  distance?: string;
}

interface MenuDish {
  name: string;
  category: string;
  score: Score;
  carbEstimate: string;
  tip: string;
}

interface DishTip {
  dish: string;
  dishScore: Score;
  scoreReason: string;
  tips: string[];
  portionGuidance?: string;
  culturalNote?: string | null;
}

interface TipsResult {
  dishTips: DishTip[];
  overallAdvice: string;
  mealBalance?: { estimatedCarbs: string; estimatedProtein: string; bloodSugarImpact: string };
}

// ─── Score config ─────────────────────────────────────────────────────────────

const SCORE = {
  great:    { label: 'Great',           color: '#1C7A4F', bg: 'rgba(28,122,79,0.12)',  border: 'rgba(28,122,79,0.18)',  row: 'rgba(28,122,79,0.06)' },
  moderate: { label: 'Enjoy mindfully', color: '#9A6F18', bg: 'rgba(200,147,43,0.18)', border: 'rgba(200,147,43,0.22)', row: 'rgba(200,147,43,0.07)' },
  caution:  { label: 'Save for later',  color: '#B5562E', bg: 'rgba(181,86,46,0.13)',  border: 'rgba(181,86,46,0.18)',  row: 'rgba(181,86,46,0.05)' },
} as const;

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RestaurantFinderPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<RestaurantSuggestion[]>([]);
  const [selected, setSelected] = useState<RestaurantSuggestion | null>(null);
  const [menu, setMenu] = useState<MenuDish[] | null>(null);
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);
  const [tips, setTips] = useState<TipsResult | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const [favs, setFavs] = useState<string[]>([]);

  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [loadingTips, setLoadingTips] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Search by name ─────────────────────────────────────────────────────────
  const handleSearchInput = (q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim()) { setSuggestions([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const res = await fetch('/api/restaurants/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'name', query: q }),
        });
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch { setSuggestions([]); } finally { setLoadingSearch(false); }
    }, 350);
  };

  // ── Detect nearby ──────────────────────────────────────────────────────────
  const handleNearby = () => {
    setLocationError(null);
    if (!navigator.geolocation) { setLocationError('Geolocation is not supported by your browser.'); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLoadingSearch(true);
        try {
          const res = await fetch('/api/restaurants/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'nearby', lat: pos.coords.latitude, lng: pos.coords.longitude }),
          });
          const data = await res.json();
          setSuggestions(data.places || []);
        } catch { setLocationError('Could not load nearby restaurants.'); } finally { setLoadingSearch(false); }
      },
      () => setLocationError('Location access was denied. Try searching by name instead.')
    );
  };

  // ── Select restaurant → load menu ──────────────────────────────────────────
  const handleSelectRestaurant = async (r: RestaurantSuggestion) => {
    setSelected(r);
    setMenu(null);
    setSelectedDishes([]);
    setTips(null);
    setError(null);
    setLoadingMenu(true);
    try {
      const res = await fetch('/api/restaurants/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantName: r.name, cuisine: r.cuisine }),
      });
      const data = await res.json();
      setMenu(data.dishes || []);
    } catch { setError('Could not load menu. Try again.'); } finally { setLoadingMenu(false); }
  };

  // ── Get tips for selected dishes ───────────────────────────────────────────
  const handleGetTips = async () => {
    if (!selected || selectedDishes.length === 0) return;
    setLoadingTips(true);
    setTips(null);
    try {
      const res = await fetch('/api/restaurant-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantName: selected.name, cuisine: selected.cuisine, dishes: selectedDishes }),
      });
      const data = await res.json();
      setTips({ dishTips: data.dishTips || [], overallAdvice: data.overallAdvice || '', mealBalance: data.mealBalance });
    } catch { setError('Could not get tips. Try again.'); } finally { setLoadingTips(false); }
  };

  const toggleDish = (name: string) => setSelectedDishes(prev =>
    prev.includes(name) ? prev.filter(d => d !== name) : [...prev, name]
  );
  const toggleFav = (id: string) => setFavs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // ── Group menu by category ─────────────────────────────────────────────────
  const menuByCategory = menu
    ? Object.entries(
        menu.reduce<Record<string, MenuDish[]>>((acc, d) => {
          (acc[d.category] = acc[d.category] || []).push(d);
          return acc;
        }, {})
      )
    : [];

  const gentleCount = menu?.filter(d => d.score === 'great').length ?? 0;

  // ─── MOBILE ────────────────────────────────────────────────────────────────

  const MobileLayout = (
    <div className="lg:hidden mobile-page-pb" style={{ minHeight: '100vh', background: '#F7EFE1' }}>
      <div style={{ padding: '18px 20px 16px' }}>
        <BackButton href="/home" />
        <div style={{ marginTop: 10, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#C8932B', fontWeight: 700 }}>Restaurants · Eating out</div>
        <h1 className="font-serif-italic" style={{ fontSize: 30, color: '#012374', lineHeight: 1.1, marginTop: 6 }}>Find a kind place to eat.</h1>
        <p style={{ fontSize: 14, color: '#16182A', opacity: 0.72, marginTop: 6, lineHeight: 1.5 }}>
          Chatita reads the menu with you and points to dishes that sit easy.
        </p>
      </div>

      {/* Search */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ background: '#FFFDF9', borderRadius: 18, border: '1px solid rgba(1,35,116,0.08)', padding: 16 }}>
          <input
            type="text" value={searchQuery} onChange={e => handleSearchInput(e.target.value)}
            placeholder="Search restaurant or cuisine…"
            style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1px solid rgba(1,35,116,0.15)', background: '#F7EFE1', fontSize: '14px', color: '#001A4D', outline: 'none', boxSizing: 'border-box' as const }}
          />
          <button onClick={handleNearby} style={{ marginTop: 10, width: '100%', padding: '11px', borderRadius: '12px', background: 'rgba(1,35,116,0.07)', color: '#012374', fontSize: '13px', fontWeight: 600, border: '1px solid rgba(1,35,116,0.12)', cursor: 'pointer' }}>
            📍 Use my location
          </button>
          {locationError && <p style={{ fontSize: '12px', color: '#B5562E', marginTop: 8 }}>{locationError}</p>}
        </div>
      </div>

      {/* Suggestions or selected restaurant */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
        {error && (
          <div style={{ background: 'rgba(181,86,46,0.10)', borderRadius: '12px', padding: '12px 14px', border: '1px solid rgba(181,86,46,0.22)' }}>
            <p style={{ fontSize: '13px', color: '#B5562E' }}>{error}</p>
          </div>
        )}

        {loadingSearch && <p style={{ fontSize: '13px', color: 'rgba(1,35,116,0.5)', textAlign: 'center' as const }}>Searching…</p>}

        {!selected && suggestions.map(r => (
          <div key={r.id} onClick={() => handleSelectRestaurant(r)} style={{ background: '#FFFDF9', borderRadius: 16, border: '1px solid rgba(1,35,116,0.08)', padding: '14px 16px', cursor: 'pointer' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#012374' }}>{r.name}</div>
            <div style={{ fontSize: 13, color: 'rgba(22,24,42,0.6)', marginTop: 2 }}>{r.cuisine}{r.distance ? ` · ${r.distance}` : ''}</div>
            {r.address && <div style={{ fontSize: 12, color: 'rgba(22,24,42,0.45)', marginTop: 2 }}>{r.address}</div>}
          </div>
        ))}

        {selected && (
          <div style={{ background: '#FFFDF9', borderRadius: 18, border: '1px solid rgba(1,35,116,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="font-serif-italic" style={{ fontSize: 18, color: '#012374' }}>{selected.name}</div>
                <div style={{ fontSize: 13, color: 'rgba(22,24,42,0.6)', marginTop: 2 }}>{selected.cuisine}</div>
              </div>
              <button onClick={() => { setSelected(null); setMenu(null); setSelectedDishes([]); setTips(null); }} style={{ fontSize: '12px', color: 'rgba(1,35,116,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>← Back</button>
            </div>

            {loadingMenu && <div style={{ padding: 16 }}><p style={{ fontSize: '13px', color: 'rgba(1,35,116,0.5)', textAlign: 'center' as const }}>Loading menu…</p></div>}

            {menu && (
              <div style={{ padding: '12px 16px 16px' }}>
                <p style={{ fontSize: 11.5, color: 'rgba(22,24,42,0.5)', lineHeight: 1.5, marginBottom: 12 }}>
                  A representative menu for this spot. For the exact dishes, <a href="/menu-scanner" style={{ color: '#012374', fontWeight: 600 }}>scan the real menu →</a>
                </p>
                {menuByCategory.map(([cat, dishes]) => (
                  <div key={cat} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(0,26,77,0.5)', fontWeight: 700, marginBottom: 8 }}>{cat}</div>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
                      {dishes.map(d => {
                        const r = SCORE[d.score];
                        const isSel = selectedDishes.includes(d.name);
                        return (
                          <div key={d.name} onClick={() => toggleDish(d.name)} style={{ cursor: 'pointer', borderRadius: 12, padding: '11px 12px', background: r.row, border: `1px solid ${r.border}`, boxShadow: isSel ? '0 0 0 2px #012374' : undefined }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <span style={{ marginTop: 2, width: 16, height: 16, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSel ? '#012374' : 'transparent', border: isSel ? 'none' : '1.5px solid rgba(1,35,116,0.3)' }}>
                                  {isSel && <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#FFFDF9" strokeWidth="3" strokeLinecap="round"/></svg>}
                                </span>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#16182A' }}>{d.name}</div>
                              </div>
                              <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: r.bg, color: r.color, flexShrink: 0 }}>{r.label}</span>
                            </div>
                            <div style={{ fontSize: 12, color: '#16182A', opacity: 0.6, marginTop: 5, paddingLeft: 24, lineHeight: 1.4 }}>{d.tip} · {d.carbEstimate} carbs</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {selectedDishes.length > 0 && (
                  <div>
                    {!tips && !loadingTips && (
                      <button onClick={handleGetTips} style={{ width: '100%', padding: 12, borderRadius: 14, background: '#012374', color: '#FFFDF9', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: 4 }}>
                        Get tips for {selectedDishes.length} {selectedDishes.length === 1 ? 'dish' : 'dishes'} →
                      </button>
                    )}
                    {loadingTips && <p style={{ textAlign: 'center' as const, fontSize: '13px', color: 'rgba(1,35,116,0.5)', marginTop: 12 }}>Getting your tips…</p>}
                    {tips && (
                      <div style={{ background: '#012374', color: '#FFFDF9', borderRadius: 15, padding: 16, marginTop: 8 }}>
                        <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase' as const, color: '#C8932B', fontWeight: 700 }}>Your meal tips</div>
                        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                          {tips.dishTips.map((dt, i) => (
                            <div key={i}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFDF9' }}>{dt.dish}</div>
                              {dt.tips.slice(0, 2).map((tip, j) => (
                                <div key={j} style={{ fontSize: 12, color: 'rgba(255,253,249,0.8)', marginTop: 3 }}>· {tip}</div>
                              ))}
                            </div>
                          ))}
                        </div>
                        {tips.overallAdvice && <div style={{ fontSize: 12.5, color: 'rgba(255,253,249,0.75)', marginTop: 12, lineHeight: 1.5, borderTop: '1px solid rgba(255,253,249,0.15)', paddingTop: 10 }}>{tips.overallAdvice}</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', opacity: 0.7, marginTop: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
            <path d="M12 2L2 20h20L12 2z" stroke="#C8932B" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M12 9v5M12 16v1" stroke="#C8932B" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <p style={{ fontSize: 12, color: '#16182A', lineHeight: 1.5, fontStyle: 'italic' }}>Carb estimates are approximate. Always confirm with your care team.</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );

  // ─── WEB ───────────────────────────────────────────────────────────────────

  const WebLayout = (
    <div className="hidden lg:flex" style={{ height: '100vh', background: '#F7EFE1', overflow: 'hidden' }}>
      <WebNav />
      <div style={{ flex: 1, overflowY: 'auto', padding: '34px 44px 44px' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#C8932B', fontWeight: 700 }}>Restaurants · Eating out</div>
        <h1 className="font-serif-italic" style={{ fontSize: 38, color: '#012374', lineHeight: 1.1, marginTop: 8 }}>Find a kind place to eat.</h1>
        <p style={{ fontSize: 16, color: '#16182A', opacity: 0.72, marginTop: 8, lineHeight: 1.55 }}>
          Chatita reads the menu with you and points to dishes that sit easy — never good or bad, just gentle or mindful.
        </p>

        {error && (
          <div style={{ marginTop: '16px', background: 'rgba(181,86,46,0.10)', borderRadius: '12px', padding: '12px 16px', border: '1px solid rgba(181,86,46,0.22)' }}>
            <p style={{ fontSize: '13px', color: '#B5562E' }}>{error}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, marginTop: 26, alignItems: 'start' }}>
          {/* LEFT: search + list */}
          <div style={{ position: 'sticky', top: 0 }}>
            <div style={{ background: '#FFFDF9', borderRadius: 22, padding: 24, border: '1px solid rgba(1,35,116,0.07)', boxShadow: '0 14px 30px -22px rgba(1,35,116,.3)' }}>
              <span className="font-serif-italic" style={{ fontSize: 18, color: '#012374', display: 'block', marginBottom: 8 }}>Find a gentle spot</span>
              <input
                type="text" value={searchQuery} onChange={e => handleSearchInput(e.target.value)}
                placeholder="Restaurant name or cuisine…"
                style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1px solid rgba(1,35,116,0.15)', background: '#F7EFE1', fontSize: '13.5px', color: '#001A4D', outline: 'none', boxSizing: 'border-box' as const, marginBottom: 10 }}
              />
              <button onClick={handleNearby} style={{ width: '100%', padding: '11px', borderRadius: '12px', background: 'rgba(1,35,116,0.07)', color: '#012374', fontSize: '13.5px', fontWeight: 600, border: '1px solid rgba(1,35,116,0.12)', cursor: 'pointer' }}>
                📍 Use my location
              </button>
              {locationError && <p style={{ fontSize: '12px', color: '#B5562E', marginTop: 8 }}>{locationError}</p>}
            </div>

            {/* Suggestion list */}
            {suggestions.length > 0 && !selected && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(0,26,77,0.5)', fontWeight: 700, marginBottom: 10 }}>
                  {loadingSearch ? 'Searching…' : 'Results'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                  {suggestions.map(r => (
                    <div key={r.id} onClick={() => handleSelectRestaurant(r)} style={{ background: '#FFFDF9', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', border: '1px solid rgba(1,35,116,0.08)', transition: 'border-color .15s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div className="font-serif-italic" style={{ fontSize: 15, color: '#012374' }}>{r.name}</div>
                          <div style={{ fontSize: 12, color: 'rgba(22,24,42,0.6)', marginTop: 2 }}>{r.cuisine}{r.distance ? ` · ${r.distance}` : ''}</div>
                          {r.address && <div style={{ fontSize: 11, color: 'rgba(22,24,42,0.4)', marginTop: 1 }}>{r.address}</div>}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); toggleFav(r.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: favs.includes(r.id) ? '#E3171A' : 'rgba(1,35,116,0.25)', fontSize: 18 }}>
                          {favs.includes(r.id) ? '♥' : '♡'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loadingSearch && !suggestions.length && (
              <p style={{ textAlign: 'center' as const, fontSize: '13px', color: 'rgba(1,35,116,0.5)', marginTop: 16 }}>Searching…</p>
            )}
          </div>

          {/* RIGHT: menu + tips */}
          <div>
            {!selected && (
              <div style={{ background: '#FFFDF9', borderRadius: 22, border: '2px dashed rgba(1,35,116,0.12)', height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' as const, gap: 12 }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                  <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" stroke="#012374" strokeWidth="1.4" opacity={0.25}/>
                  <circle cx="12" cy="10" r="2.5" stroke="#012374" strokeWidth="1.4" opacity={0.25}/>
                </svg>
                <p style={{ fontSize: '15px', color: 'rgba(1,35,116,0.3)', fontWeight: 500 }}>Search for a restaurant to see the menu</p>
              </div>
            )}

            {selected && (
              <div style={{ background: '#FFFDF9', borderRadius: 22, border: '1px solid rgba(1,35,116,0.07)', overflow: 'hidden' }}>
                {/* Restaurant header */}
                <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(1,35,116,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="font-serif-italic" style={{ fontSize: 22, color: '#012374' }}>{selected.name}</div>
                    <div style={{ fontSize: 13, color: 'rgba(22,24,42,0.6)', marginTop: 3 }}>{selected.cuisine}{selected.address ? ` · ${selected.address}` : ''}</div>
                    {menu && <div style={{ fontSize: 12, color: '#1C7A4F', marginTop: 4, fontWeight: 600 }}>{gentleCount} gentle {gentleCount === 1 ? 'pick' : 'picks'} on the menu</div>}
                  </div>
                  <button onClick={() => { setSelected(null); setMenu(null); setSelectedDishes([]); setTips(null); setSuggestions([]); setSearchQuery(''); }} style={{ fontSize: '13px', color: 'rgba(1,35,116,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>← Back</button>
                </div>

                {loadingMenu && <div style={{ padding: 30, textAlign: 'center' as const }}><p style={{ fontSize: '14px', color: 'rgba(1,35,116,0.5)' }}>Generating menu…</p></div>}

                {menu && (
                  <div style={{ padding: '20px 24px' }}>
                    <p style={{ fontSize: 12.5, color: 'rgba(22,24,42,0.5)', lineHeight: 1.5, marginBottom: 14 }}>
                      A representative menu for this spot. For the exact dishes, <a href="/menu-scanner" style={{ color: '#012374', fontWeight: 600 }}>scan the real menu →</a>
                    </p>
                    {/* Dish grid by category */}
                    {menuByCategory.map(([cat, dishes]) => (
                      <div key={cat} style={{ marginBottom: 18 }}>
                        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(0,26,77,0.5)', fontWeight: 700, marginBottom: 10 }}>{cat}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {dishes.map(d => {
                            const r = SCORE[d.score];
                            const isSel = selectedDishes.includes(d.name);
                            return (
                              <div key={d.name} onClick={() => toggleDish(d.name)} style={{ cursor: 'pointer', borderRadius: 12, padding: '12px 13px', background: r.row, border: `1px solid ${r.border}`, boxShadow: isSel ? '0 0 0 2px #012374' : undefined, transition: 'box-shadow .15s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'flex-start' }}>
                                  <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                                    <span style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSel ? '#012374' : 'transparent', border: isSel ? 'none' : '1.5px solid rgba(1,35,116,0.28)' }}>
                                      {isSel && <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#FFFDF9" strokeWidth="3" strokeLinecap="round"/></svg>}
                                    </span>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#16182A' }}>{d.name}</div>
                                  </div>
                                  <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, background: r.bg, color: r.color, flexShrink: 0 }}>{r.label}</span>
                                </div>
                                <div style={{ fontSize: 11.5, color: '#16182A', opacity: 0.62, marginTop: 5, paddingLeft: 22, lineHeight: 1.4 }}>{d.tip} · {d.carbEstimate}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Get tips CTA */}
                    {selectedDishes.length > 0 && !loadingTips && !tips && (
                      <button onClick={handleGetTips} style={{ width: '100%', padding: '13px', borderRadius: '14px', background: '#012374', color: '#FFFDF9', fontSize: '15px', fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: 4 }}>
                        Get detailed tips for {selectedDishes.length} {selectedDishes.length === 1 ? 'dish' : 'dishes'} →
                      </button>
                    )}
                    {loadingTips && <p style={{ textAlign: 'center' as const, fontSize: '14px', color: 'rgba(1,35,116,0.5)', marginTop: 12 }}>Getting your tips…</p>}

                    {/* Tips panel */}
                    {tips && (
                      <div style={{ background: '#012374', borderRadius: 16, padding: 20, marginTop: 14 }}>
                        <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase' as const, color: '#C8932B', fontWeight: 700 }}>Your meal tips</div>
                        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: tips.dishTips.length > 1 ? '1fr 1fr' : '1fr', gap: 14 }}>
                          {tips.dishTips.map((dt, i) => (
                            <div key={i}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFDF9', marginBottom: 6 }}>{dt.dish}</div>
                              {dt.tips.slice(0, 2).map((tip, j) => (
                                <div key={j} style={{ fontSize: 12, color: 'rgba(255,253,249,0.82)', marginBottom: 3, lineHeight: 1.4 }}>· {tip}</div>
                              ))}
                              {dt.portionGuidance && <div style={{ fontSize: 11.5, color: 'rgba(255,253,249,0.6)', marginTop: 5, fontStyle: 'italic' }}>{dt.portionGuidance}</div>}
                            </div>
                          ))}
                        </div>
                        {tips.overallAdvice && (
                          <div style={{ fontSize: 13, color: 'rgba(255,253,249,0.75)', marginTop: 14, lineHeight: 1.55, borderTop: '1px solid rgba(255,253,249,0.15)', paddingTop: 12 }}>
                            {tips.overallAdvice}
                          </div>
                        )}
                        {tips.mealBalance && (
                          <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
                            {[['Est. carbs', tips.mealBalance.estimatedCarbs], ['Protein', tips.mealBalance.estimatedProtein], ['BG impact', tips.mealBalance.bloodSugarImpact]].map(([k, v]) => (
                              <div key={k} style={{ background: 'rgba(255,253,249,0.1)', borderRadius: 10, padding: '6px 12px' }}>
                                <div style={{ fontSize: 10, color: 'rgba(255,253,249,0.55)', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>{k}</div>
                                <div style={{ fontSize: 12.5, color: '#FFFDF9', fontWeight: 600, marginTop: 2 }}>{v}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        <button onClick={() => { setTips(null); setSelectedDishes([]); }} style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,253,249,0.55)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          Clear selection
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 14, opacity: 0.65 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                        <path d="M12 2L2 20h20L12 2z" stroke="#C8932B" strokeWidth="1.8" strokeLinejoin="round"/>
                        <path d="M12 9v5M12 16v1" stroke="#C8932B" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                      <p style={{ fontSize: 11.5, color: '#16182A', lineHeight: 1.5, fontStyle: 'italic' }}>Carb estimates are approximate. Always confirm with your care team.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {MobileLayout}
      {WebLayout}
    </>
  );
}
