'use client';

import { useState, useEffect, useRef } from 'react';
import BottomNav from '@/components/bottom-nav';
import BackButton from '@/components/back-button';
import WebNav from '@/components/web-nav';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Place {
  id: string;
  name: string;
  cuisine: string;
  distance?: string;
  address?: string;
}

interface Dish {
  name: string;
  category: string;
  score: 'great' | 'moderate' | 'caution';
  carbEstimate: string;
  tip: string;
}

type SearchMode = 'nearby' | 'dish' | 'name' | 'favs';

// ─── Rating config ─────────────────────────────────────────────────────────────
// Maps API score → design labels (great/mindful/save-for-later)
const RATING = {
  great:    { label: 'Great',         color: '#1C7A4F', bg: 'rgba(28,122,79,0.12)',   border: 'rgba(28,122,79,0.18)',   row: 'rgba(28,122,79,0.06)' },
  moderate: { label: 'Mindful',       color: '#9A6F18', bg: 'rgba(200,147,43,0.18)',  border: 'rgba(200,147,43,0.22)',  row: 'rgba(200,147,43,0.07)' },
  caution:  { label: 'Save for later',color: '#B5562E', bg: 'rgba(181,86,46,0.13)',   border: 'rgba(181,86,46,0.18)',   row: 'rgba(181,86,46,0.05)' },
} as const;

// ─── Plate tip logic ──────────────────────────────────────────────────────────

function getPlateTip(selected: string[], menu: Dish[]): string {
  if (!selected.length) return '';
  const dishes = selected.map(n => menu.find(d => d.name === n)).filter(Boolean) as Dish[];
  if (dishes.every(d => d.score === 'great')) return "Beautifully gentle — this combination should sit easy with your blood sugar.";
  if (dishes.some(d => d.score === 'caution')) return "There's a richer pick here — pair it with a salad and a glass of water, and enjoy a smaller portion.";
  return "Looking balanced. A glass of water before you eat helps too.";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DishRow({ dish, selected, onSelect, web }: { dish: Dish; selected: boolean; onSelect: () => void; web?: boolean }) {
  const r = RATING[dish.score];
  return (
    <div
      onClick={onSelect}
      style={{
        cursor: 'pointer',
        borderRadius: web ? '14px' : '13px',
        padding: web ? '15px 16px' : '12px 13px',
        background: r.row,
        border: `1px solid ${r.border}`,
        boxShadow: selected ? `0 0 0 2px #012374` : undefined,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: web ? '11px' : '9px', alignItems: 'flex-start' }}>
          <span style={{
            marginTop: '1px', width: web ? '19px' : '17px', height: web ? '19px' : '17px',
            borderRadius: web ? '6px' : '5px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: selected ? '#012374' : 'transparent',
            border: selected ? 'none' : '1.5px solid rgba(1,35,116,0.3)',
          }}>
            {selected && <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#FFFDF9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </span>
          <div>
            <div style={{ fontSize: web ? '15px' : '14px', fontWeight: 600, color: '#16182A' }}>{dish.name}</div>
            {web && <div style={{ fontSize: '13px', color: '#16182A', opacity: .66, lineHeight: 1.45, marginTop: '5px', maxWidth: '380px' }}>{dish.tip}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: web ? '5px 11px' : '4px 9px', borderRadius: '999px', fontSize: web ? '11.5px' : '11px', fontWeight: 700, background: r.bg, color: r.color }}>
            {r.label}
          </span>
          <div style={{ fontSize: web ? '12px' : '11.5px', color: '#16182A', opacity: .5, marginTop: web ? '7px' : '5px' }}>{dish.carbEstimate} carbs</div>
        </div>
      </div>
      {!web && <div style={{ fontSize: '12.5px', color: '#16182A', opacity: .66, lineHeight: 1.45, marginTop: '7px', paddingLeft: '26px' }}>{dish.tip}</div>}
    </div>
  );
}

function PlateCard({ selected, menu, web }: { selected: string[]; menu: Dish[]; web?: boolean }) {
  if (!selected.length) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#012374', fontSize: '13px', fontWeight: 600, padding: '4px 2px' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#012374" strokeWidth="1.7"/><path d="M12 8v.5M11 11h1v5h1" stroke="#012374" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
      Tap dishes to build a plate and get a tip.
    </div>
  );

  const tip = getPlateTip(selected, menu);
  const selectedDishes = selected.map(n => menu.find(d => d.name === n)).filter(Boolean) as Dish[];

  return (
    <div style={{ background: '#012374', color: '#FFFDF9', borderRadius: web ? '18px' : '15px', padding: web ? '22px' : '16px' }}>
      <div style={{ fontSize: '11px', letterSpacing: '.14em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Your plate so far</div>
      <div className="font-serif-italic" style={{ fontSize: web ? '23px' : '19px', lineHeight: 1.2, marginTop: web ? '8px' : '6px' }}>
        {selected.length} {selected.length === 1 ? 'dish chosen' : 'dishes chosen'}
      </div>
      {web && (
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '9px' }}>
          {selectedDishes.map(d => (
            <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '14px' }}>
              <span style={{ opacity: .92 }}>{d.name}</span>
              <span style={{ opacity: .7 }}>{d.carbEstimate}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: web ? '16px' : '7px', paddingTop: web ? '14px' : '10px', borderTop: web ? '1px solid rgba(255,253,249,0.18)' : undefined, fontSize: web ? '13.5px' : '13px', opacity: .88, lineHeight: 1.5 }}>
        {tip}
      </div>
    </div>
  );
}

function RestaurantMenu({ place, menu, selectedDishes, onToggleDish, onQuickAdd, web }: {
  place: Place;
  menu: Dish[];
  selectedDishes: string[];
  onToggleDish: (name: string) => void;
  onQuickAdd: () => void;
  web?: boolean;
}) {
  // Group dishes by category
  const categories = Array.from(new Set(menu.map(d => d.category)));
  const sections = categories.map(cat => ({ name: cat, dishes: menu.filter(d => d.category === cat) }));

  if (web) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '28px', alignItems: 'start' }}>
        <div>
          {sections.map(sec => (
            <div key={sec.name} style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', letterSpacing: '.08em', textTransform: 'uppercase', color: '#001A4D', opacity: .55, fontWeight: 700 }}>{sec.name}</div>
              <div style={{ marginTop: '11px', display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {sec.dishes.map(d => (
                  <DishRow key={d.name} dish={d} selected={selectedDishes.includes(d.name)} onSelect={() => onToggleDish(d.name)} web />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ position: 'sticky', top: '10px' }}>
          <PlateCard selected={selectedDishes} menu={menu} web />
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', padding: '13px 0 14px', borderTop: '1px solid rgba(1,35,116,0.07)' }}>
        <button onClick={onQuickAdd} style={{ flex: 1, background: '#012374', color: '#FFFDF9', borderRadius: '12px', padding: '12px', textAlign: 'center', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', border: 'none' }}>
          + Quick-add a meal
        </button>
      </div>
      {sections.map(sec => (
        <div key={sec.name} style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', letterSpacing: '.08em', textTransform: 'uppercase', color: '#001A4D', opacity: .55, fontWeight: 700 }}>{sec.name}</div>
          <div style={{ marginTop: '9px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sec.dishes.map(d => (
              <DishRow key={d.name} dish={d} selected={selectedDishes.includes(d.name)} onSelect={() => onToggleDish(d.name)} />
            ))}
          </div>
        </div>
      ))}
      <PlateCard selected={selectedDishes} menu={menu} />
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RestaurantFinderPage() {
  const [mode, setMode] = useState<SearchMode>('nearby');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [menus, setMenus] = useState<Record<string, Dish[]>>({});
  const [loadingMenu, setLoadingMenu] = useState<Record<string, boolean>>({});
  const [selectedDishes, setSelectedDishes] = useState<Record<string, string[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);  // mobile
  const [activeId, setActiveId] = useState<string | null>(null);       // desktop
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [dishQuery, setDishQuery] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [searchingName, setSearchingName] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [error, setError] = useState('');

  // Load favorites on mount
  useEffect(() => {
    fetch('/api/restaurants/favorites')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.favorites) setFavoriteIds(new Set(data.favorites.map((f: any) => f.placeId)));
      })
      .catch(() => {});
  }, []);

  // Auto-load nearby on mount
  useEffect(() => { detectNearby(); }, []);

  const detectNearby = () => {
    setLoadingPlaces(true);
    setError('');
    navigator.geolocation?.getCurrentPosition(
      async pos => {
        try {
          const res = await fetch('/api/restaurants/nearby', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          });
          if (res.ok) {
            const data = await res.json();
            const list = (data.restaurants || []).map((r: any) => ({
              id: r.id || r.placeId || r.name,
              name: r.name,
              cuisine: r.cuisine || 'Restaurant',
              distance: r.distance,
              address: r.address,
            }));
            setPlaces(list);
            if (list.length > 0) { setActiveId(list[0].id); loadMenu(list[0]); }
          }
        } catch { setError('Could not load nearby restaurants.'); }
        setLoadingPlaces(false);
      },
      () => {
        // fallback: use default location
        fetch('/api/restaurants/nearby', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: 40.7128, lng: -74.0060 }),
        })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            const list = (data?.restaurants || []).map((r: any) => ({
              id: r.id || r.placeId || r.name,
              name: r.name,
              cuisine: r.cuisine || 'Restaurant',
              distance: r.distance,
              address: r.address,
            }));
            setPlaces(list);
            if (list.length > 0) { setActiveId(list[0].id); loadMenu(list[0]); }
          })
          .catch(() => setError('Could not load restaurants.'))
          .finally(() => setLoadingPlaces(false));
      }
    );
  };

  const searchByDish = async () => {
    if (!dishQuery.trim()) return;
    setLoadingPlaces(true);
    setError('');
    navigator.geolocation?.getCurrentPosition(
      async pos => {
        try {
          const res = await fetch('/api/restaurants/nearby', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude, dishFilter: dishQuery }),
          });
          if (res.ok) {
            const data = await res.json();
            const list = (data.restaurants || []).map((r: any) => ({ id: r.id || r.name, name: r.name, cuisine: r.cuisine || 'Restaurant', distance: r.distance, address: r.address }));
            setPlaces(list);
            if (list.length > 0) setActiveId(list[0].id);
          }
        } catch { setError('Search failed.'); }
        setLoadingPlaces(false);
      },
      async () => {
        // fallback without location
        setLoadingPlaces(false);
      }
    );
  };

  const searchByName = async (query: string) => {
    if (!query.trim()) { setSuggestions([]); return; }
    setSearchingName(true);
    try {
      const res = await fetch('/api/restaurants/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'name', query }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions((data.suggestions || []).map((s: any) => ({ id: s.id || s.name, name: s.name, cuisine: s.cuisine || 'Restaurant', address: s.address, distance: s.distance })));
      }
    } catch { /* silent */ }
    setSearchingName(false);
  };

  const loadFavorites = async () => {
    setLoadingPlaces(true);
    try {
      const res = await fetch('/api/restaurants/favorites');
      if (res.ok) {
        const data = await res.json();
        const list = (data.favorites || []).map((f: any) => ({ id: f.placeId, name: f.name, cuisine: f.cuisine || 'Restaurant', address: f.address }));
        setPlaces(list);
        if (list.length > 0) setActiveId(list[0].id);
      }
    } catch { setError('Could not load favorites.'); }
    setLoadingPlaces(false);
  };

  const loadMenu = async (place: Place) => {
    if (menus[place.id] || loadingMenu[place.id]) return;
    setLoadingMenu(prev => ({ ...prev, [place.id]: true }));
    try {
      const res = await fetch('/api/restaurants/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantName: place.name, cuisine: place.cuisine }),
      });
      if (res.ok) {
        const data = await res.json();
        setMenus(prev => ({ ...prev, [place.id]: data.dishes || [] }));
      }
    } catch { /* silent */ }
    setLoadingMenu(prev => ({ ...prev, [place.id]: false }));
  };

  const toggleDish = (placeId: string, dishName: string) => {
    setSelectedDishes(prev => {
      const cur = prev[placeId] || [];
      return { ...prev, [placeId]: cur.includes(dishName) ? cur.filter(n => n !== dishName) : [...cur, dishName] };
    });
  };

  const toggleFavorite = async (place: Place, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFav = favoriteIds.has(place.id);
    setFavoriteIds(prev => {
      const next = new Set(prev);
      isFav ? next.delete(place.id) : next.add(place.id);
      return next;
    });
    try {
      if (isFav) {
        await fetch(`/api/restaurants/favorites/${encodeURIComponent(place.id)}`, { method: 'DELETE' });
      } else {
        await fetch('/api/restaurants/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ placeId: place.id, name: place.name, cuisine: place.cuisine, address: place.address || '' }),
        });
      }
    } catch { /* rollback */
      setFavoriteIds(prev => {
        const next = new Set(prev);
        isFav ? next.add(place.id) : next.delete(place.id);
        return next;
      });
    }
  };

  const selectPlace = (place: Place) => {
    setActiveId(place.id);
    loadMenu(place);
  };

  const handleModeChange = (m: SearchMode) => {
    setMode(m);
    if (m === 'nearby') detectNearby();
    if (m === 'favs') loadFavorites();
  };

  const handleNameQueryChange = (q: string) => {
    setNameQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchByName(q), 350);
  };

  const handleSuggestionSelect = (place: Place) => {
    setSuggestions([]);
    setNameQuery(place.name);
    setPlaces([place]);
    setActiveId(place.id);
    loadMenu(place);
  };

  const greatCount = (placeId: string) => {
    const m = menus[placeId];
    return m ? m.filter(d => d.score === 'great').length : 0;
  };

  const activePlace = places.find(p => p.id === activeId) ?? places[0] ?? null;
  const activeMenu = activePlace ? (menus[activePlace.id] ?? []) : [];
  const activeSelected = activePlace ? (selectedDishes[activePlace.id] ?? []) : [];

  const MODES: { id: SearchMode; label: string }[] = [
    { id: 'nearby', label: 'Browse nearby' },
    { id: 'dish', label: 'Search by dish' },
    { id: 'name', label: 'Search by name' },
    { id: 'favs', label: 'Favorites' },
  ];

  const Disclaimer = () => (
    <div style={{ marginTop: '16px', background: 'rgba(200,147,43,0.1)', borderRadius: '13px', padding: '13px 15px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
        <path d="M12 3l9 16H3L12 3z" stroke="#9A6F18" strokeWidth="1.7" strokeLinejoin="round"/>
        <path d="M12 10v4M12 16.5v.5" stroke="#9A6F18" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
      <div style={{ fontSize: '12px', color: '#16182A', opacity: .72, lineHeight: 1.45 }}>Suggestions are general guidance. Ask about ingredients and portions, and check with your provider for personalized advice.</div>
    </div>
  );

  const PlaceListCard = ({ place, onSelect, mobile }: { place: Place; onSelect: () => void; mobile?: boolean }) => {
    const isActive = activeId === place.id;
    const isFav = favoriteIds.has(place.id);
    const gc = greatCount(place.id);

    return (
      <div
        onClick={onSelect}
        style={{
          cursor: 'pointer',
          background: '#FFFDF9',
          borderRadius: mobile ? '18px' : '16px',
          border: `1px solid ${isActive && !mobile ? '#012374' : 'rgba(1,35,116,0.08)'}`,
          overflow: 'hidden',
          boxShadow: '0 8px 20px -18px rgba(1,35,116,.5)',
        }}
      >
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 3v8a3 3 0 0 0 6 0V3M8 3v18M19 3c-1.5 0-3 1.5-3 5s1.5 4 3 4m0 0v9" stroke="#012374" strokeWidth="1.6" strokeLinecap="round"/></svg>
                <span className="font-serif-italic" style={{ fontSize: '18px', color: '#012374' }}>{place.name}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#16182A', opacity: .6, marginTop: '4px' }}>{place.cuisine}{place.distance ? ` · ${place.distance}` : ''}</div>
              {place.address && <div style={{ fontSize: '12.5px', color: '#16182A', opacity: .5, marginTop: '2px' }}>{place.address}</div>}
            </div>
            <button
              onClick={e => toggleFavorite(place, e)}
              style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#F7EFE1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, border: 'none' }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill={isFav ? '#C8932B' : 'none'}>
                <path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20z" stroke="#C8932B" strokeWidth="1.7"/>
              </svg>
            </button>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(28,122,79,0.12)', color: '#1C7A4F', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#1C7A4F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {gc > 0 ? `${gc} gentle picks` : (menus[place.id] ? 'Menu loaded' : 'See the menu')}
            </span>
            {mobile && (
              <span style={{ fontSize: '12px', color: '#16182A', opacity: .55 }}>
                {expandedId === place.id ? 'Hide menu' : 'See the menu'}
              </span>
            )}
          </div>
        </div>

        {/* Mobile accordion */}
        {mobile && expandedId === place.id && (
          <div style={{ padding: '0 16px 16px' }}>
            {loadingMenu[place.id] ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(1,35,116,0.5)', fontSize: '13px' }}>Loading menu…</div>
            ) : menus[place.id] ? (
              <RestaurantMenu
                place={place}
                menu={menus[place.id]}
                selectedDishes={selectedDishes[place.id] ?? []}
                onToggleDish={name => toggleDish(place.id, name)}
                onQuickAdd={() => {}}
              />
            ) : null}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* ── Desktop (lg+) ── */}
      <div className="hidden lg:flex min-h-screen" style={{ background: '#F7EFE1' }}>
        <WebNav />

        <div style={{ flex: 1, overflowY: 'auto', padding: '34px 44px 44px' }}>
          <div style={{ fontSize: '12px', letterSpacing: '.2em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Restaurants · eating out</div>
          <div className="font-serif-italic" style={{ fontSize: '38px', color: '#012374', lineHeight: 1.05, marginTop: '6px' }}>Find a kind place to eat.</div>
          <div style={{ fontSize: '16px', color: '#16182A', opacity: .72, marginTop: '4px' }}>Chatita reads the menu with you and points to dishes that sit easy — never good or bad, just gentle or mindful.</div>

          <div style={{ marginTop: '26px', display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px', alignItems: 'start' }}>
            {/* Left: sticky search + list */}
            <div style={{ position: 'sticky', top: '0' }}>
              {/* Search panel */}
              <div style={{ background: '#FFFDF9', borderRadius: '22px', padding: '24px', border: '1px solid rgba(1,35,116,0.07)', boxShadow: '0 14px 30px -24px rgba(1,35,116,.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" stroke="#012374" strokeWidth="1.7"/><circle cx="12" cy="10" r="2.5" stroke="#012374" strokeWidth="1.7"/></svg>
                  <div className="font-serif-italic" style={{ fontSize: '21px', color: '#012374' }}>Find a gentle spot</div>
                </div>
                <div style={{ fontSize: '14px', color: '#16182A', opacity: .7, lineHeight: 1.5, marginTop: '8px' }}>Choose how you&apos;d like to look. Chatita does the menu reading.</div>
                <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {MODES.map(m => (
                    <button key={m.id} onClick={() => handleModeChange(m.id)} style={{ cursor: 'pointer', textAlign: 'center', padding: '13px 8px', borderRadius: '13px', fontSize: '14px', fontWeight: 600, border: 'none', background: mode === m.id ? '#012374' : '#F7EFE1', color: mode === m.id ? '#FFFDF9' : '#012374', transition: 'all .15s' }}>
                      {m.label}
                    </button>
                  ))}
                </div>
                {mode === 'dish' && (
                  <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                    <input value={dishQuery} onChange={e => setDishQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchByDish()} placeholder="e.g. grilled salmon, salad…" style={{ flex: 1, background: '#F7EFE1', border: '1px solid rgba(1,35,116,0.12)', borderRadius: '11px', padding: '12px 14px', fontFamily: 'inherit', fontSize: '14px', color: '#16182A', outline: 'none' }} />
                    <button onClick={searchByDish} style={{ padding: '12px 16px', borderRadius: '11px', background: '#012374', color: '#FFFDF9', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13.5px' }}>Go</button>
                  </div>
                )}
                {mode === 'name' && (
                  <div style={{ marginTop: '14px', position: 'relative' }}>
                    <input value={nameQuery} onChange={e => handleNameQueryChange(e.target.value)} placeholder="Restaurant name…" style={{ width: '100%', background: '#F7EFE1', border: '1px solid rgba(1,35,116,0.12)', borderRadius: '11px', padding: '12px 14px', fontFamily: 'inherit', fontSize: '14px', color: '#16182A', outline: 'none', boxSizing: 'border-box' }} />
                    {suggestions.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#FFFDF9', borderRadius: '12px', border: '1px solid rgba(1,35,116,0.12)', boxShadow: '0 10px 24px -8px rgba(1,35,116,.25)', marginTop: '4px', zIndex: 10, overflow: 'hidden' }}>
                        {suggestions.map(s => (
                          <div key={s.id} onClick={() => handleSuggestionSelect(s)} style={{ padding: '12px 14px', cursor: 'pointer', fontSize: '14px', color: '#012374', fontWeight: 500, borderBottom: '1px solid rgba(1,35,116,0.06)' }}>
                            <div>{s.name}</div>
                            <div style={{ fontSize: '12px', opacity: .6, marginTop: '2px' }}>{s.cuisine}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Restaurant list */}
              <div style={{ marginTop: '18px', fontSize: '12px', letterSpacing: '.1em', textTransform: 'uppercase', color: '#001A4D', opacity: .6, fontWeight: 600 }}>Recommended near you</div>
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {loadingPlaces ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(1,35,116,0.5)', fontSize: '14px' }}>Finding restaurants…</div>
                ) : places.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(1,35,116,0.5)', fontSize: '14px' }}>No restaurants found</div>
                ) : (
                  places.map(place => (
                    <PlaceListCard key={place.id} place={place} onSelect={() => selectPlace(place)} />
                  ))
                )}
              </div>
            </div>

            {/* Right: active restaurant menu */}
            {activePlace ? (
              <div style={{ background: '#FFFDF9', borderRadius: '22px', border: '1px solid rgba(1,35,116,0.07)', boxShadow: '0 14px 30px -26px rgba(1,35,116,.35)', overflow: 'hidden' }}>
                <div style={{ padding: '26px 28px', borderBottom: '1px solid rgba(1,35,116,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="font-serif-italic" style={{ fontSize: '26px', color: '#012374' }}>{activePlace.name}</div>
                    <div style={{ fontSize: '14px', color: '#16182A', opacity: .6, marginTop: '4px' }}>{activePlace.cuisine}{activePlace.distance ? ` · ${activePlace.distance}` : ''}{activePlace.address ? ` · ${activePlace.address}` : ''}</div>
                  </div>
                  <button style={{ background: '#012374', color: '#FFFDF9', borderRadius: '999px', padding: '12px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 10px 22px -12px rgba(1,35,116,.55)', border: 'none' }}>
                    + Quick-add a meal
                  </button>
                </div>
                <div style={{ padding: '24px 28px' }}>
                  {loadingMenu[activePlace.id] ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(1,35,116,0.5)', fontSize: '14px' }}>Loading menu…</div>
                  ) : activeMenu.length > 0 ? (
                    <RestaurantMenu
                      place={activePlace}
                      menu={activeMenu}
                      selectedDishes={activeSelected}
                      onToggleDish={name => toggleDish(activePlace.id, name)}
                      onQuickAdd={() => {}}
                      web
                    />
                  ) : (
                    <div style={{ background: '#F7EFE1', border: '1px dashed rgba(1,35,116,0.18)', borderRadius: '18px', padding: '40px', textAlign: 'center' }}>
                      <div className="font-serif-italic" style={{ fontSize: '19px', color: '#012374', marginTop: '12px' }}>Build your plate</div>
                      <div style={{ fontSize: '13.5px', color: '#16182A', opacity: .66, lineHeight: 1.5, marginTop: '6px' }}>Select a restaurant on the left and Chatita will read the menu for you.</div>
                    </div>
                  )}
                  <div style={{ marginTop: '16px', display: 'flex', gap: '11px', alignItems: 'flex-start', fontSize: '13px', color: '#16182A', opacity: .6, lineHeight: 1.45 }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}><path d="M12 3l9 16H3L12 3z" stroke="#9A6F18" strokeWidth="1.7" strokeLinejoin="round"/><path d="M12 10v4M12 16.5v.5" stroke="#9A6F18" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    <span>Suggestions are general guidance. Ask about ingredients and portions, and check with your provider for personalized advice.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#FFFDF9', border: '1px dashed rgba(1,35,116,0.16)', borderRadius: '22px', padding: '60px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <div className="font-serif-italic" style={{ fontSize: '22px', color: '#012374' }}>Select a restaurant to see its menu</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile (< lg) ── */}
      <div className="lg:hidden min-h-screen pb-24" style={{ background: '#F7EFE1' }}>
        {/* Navy hero */}
        <div style={{ background: '#012374', padding: '0 24px 72px', position: 'relative' }}>
          <div style={{ paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#FFFDF9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px -4px rgba(1,35,116,.4)', flexShrink: 0 }}>
              <BackButton href="/home" />
            </div>
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '.18em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Eating out</div>
              <div className="font-serif-italic" style={{ fontSize: '23px', color: '#FFFDF9', lineHeight: 1 }}>Restaurants near you</div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '640px', margin: '0 auto', marginTop: '-60px', padding: '0 20px' }}>
          {/* Search panel */}
          <div style={{ background: '#FFFDF9', borderRadius: '20px', padding: '20px', border: '1px solid rgba(1,35,116,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" stroke="#012374" strokeWidth="1.7"/><circle cx="12" cy="10" r="2.5" stroke="#012374" strokeWidth="1.7"/></svg>
              <div className="font-serif-italic" style={{ fontSize: '20px', color: '#012374' }}>Find a gentle spot</div>
            </div>
            <div style={{ fontSize: '13.5px', color: '#16182A', opacity: .7, lineHeight: 1.5, marginTop: '8px' }}>Chatita finds nearby places and points you to the dishes that sit easy with your blood sugar.</div>
            <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {MODES.map(m => (
                <button key={m.id} onClick={() => handleModeChange(m.id)} style={{ cursor: 'pointer', textAlign: 'center', padding: '12px 8px', borderRadius: '13px', fontSize: '13.5px', fontWeight: 600, border: 'none', background: mode === m.id ? '#012374' : '#F7EFE1', color: mode === m.id ? '#FFFDF9' : '#012374', transition: 'all .15s' }}>
                  {m.label}
                </button>
              ))}
            </div>
            {mode === 'dish' && (
              <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                <input value={dishQuery} onChange={e => setDishQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchByDish()} placeholder="e.g. grilled salmon…" style={{ flex: 1, background: '#F7EFE1', border: '1px solid rgba(1,35,116,0.12)', borderRadius: '11px', padding: '12px 14px', fontFamily: 'inherit', fontSize: '14px', color: '#16182A', outline: 'none' }} />
                <button onClick={searchByDish} style={{ padding: '12px 16px', borderRadius: '11px', background: '#012374', color: '#FFFDF9', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Go</button>
              </div>
            )}
            {mode === 'name' && (
              <div style={{ marginTop: '14px', position: 'relative' }}>
                <input value={nameQuery} onChange={e => handleNameQueryChange(e.target.value)} placeholder="Restaurant name…" style={{ width: '100%', background: '#F7EFE1', border: '1px solid rgba(1,35,116,0.12)', borderRadius: '11px', padding: '12px 14px', fontFamily: 'inherit', fontSize: '14px', color: '#16182A', outline: 'none', boxSizing: 'border-box' }} />
                {suggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#FFFDF9', borderRadius: '12px', border: '1px solid rgba(1,35,116,0.12)', boxShadow: '0 10px 24px -8px rgba(1,35,116,.25)', marginTop: '4px', zIndex: 10, overflow: 'hidden' }}>
                    {suggestions.map(s => (
                      <div key={s.id} onClick={() => handleSuggestionSelect(s)} style={{ padding: '12px 14px', cursor: 'pointer', fontSize: '14px', color: '#012374', fontWeight: 500 }}>
                        <div>{s.name}</div>
                        <div style={{ fontSize: '12px', opacity: .6, marginTop: '2px' }}>{s.cuisine}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Restaurant list */}
          <div style={{ marginTop: '22px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div className="font-serif-italic" style={{ fontSize: '22px', color: '#012374' }}>Recommended for you</div>
            <button onClick={detectNearby} style={{ fontSize: '13px', fontWeight: 600, color: '#012374', background: 'none', border: 'none', cursor: 'pointer' }}>Refresh</button>
          </div>

          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '13px' }}>
            {loadingPlaces ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(1,35,116,0.5)', fontSize: '14px' }}>Finding restaurants…</div>
            ) : error ? (
              <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(181,86,46,0.1)', color: '#B5562E', fontSize: '13px' }}>{error}</div>
            ) : places.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(1,35,116,0.5)', fontSize: '14px' }}>No restaurants found. Try refreshing.</div>
            ) : (
              places.map(place => (
                <PlaceListCard
                  key={place.id}
                  place={place}
                  mobile
                  onSelect={() => {
                    if (expandedId === place.id) {
                      setExpandedId(null);
                    } else {
                      setExpandedId(place.id);
                      loadMenu(place);
                    }
                  }}
                />
              ))
            )}
          </div>

          <Disclaimer />
        </div>

        <BottomNav />
      </div>
    </>
  );
}
