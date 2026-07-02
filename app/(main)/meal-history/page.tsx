'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/bottom-nav';
import WebNav from '@/components/web-nav';
import BackButton from '@/components/back-button';
import MealCard from '@/components/meal-card';
import MealCardSkeleton from '@/components/skeletons/meal-card-skeleton';
import ExportButton from '@/components/export-button';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { useTranslation } from '@/lib/i18n/context';
import { exportMealsToCSV, exportMealsToPDF } from '@/lib/export-utils';

const MEAL_TYPES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;

export default function MealHistoryPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    try {
      const response = await fetch('/api/meals?limit=50');
      if (response.ok) {
        const data = await response.json();
        setMeals(data.meals);
      }
    } catch (error) {
      console.error('Failed to fetch meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/meals/${id}`, { method: 'DELETE' });
      if (response.ok) setMeals(meals.filter((m) => m.id !== id));
    } catch (error) {
      console.error('Failed to delete meal:', error);
      throw error;
    }
  };

  const filteredMeals = meals.filter((meal) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm === '' ||
      meal.mealName?.toLowerCase().includes(q) ||
      meal.aiSummary?.toLowerCase().includes(q) ||
      meal.detectedFoods?.toLowerCase().includes(q);
    const matchesType = filterType === '' || meal.mealType?.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const groupedMeals: Record<string, any[]> = {};
  filteredMeals.forEach((meal) => {
    const date = parseISO(meal.eatenAt);
    const dateKey = isToday(date) ? t.mealHistory.today : isYesterday(date) ? t.mealHistory.yesterday : format(date, 'EEEE, MMM d');
    if (!groupedMeals[dateKey]) groupedMeals[dateKey] = [];
    groupedMeals[dateKey].push(meal);
  });

  // ── Search + Filter bar ────────────────────────────────────────────────────

  const renderFilterBar = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Search */}
      <div style={{ position: 'relative' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(1,35,116,0.4)' }}>
          <circle cx="11" cy="11" r="7" stroke="rgba(1,35,116,0.4)" strokeWidth="1.8"/>
          <path d="M16.5 16.5l4 4" stroke="rgba(1,35,116,0.4)" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t.mealHistory.searchPlaceholder}
          style={{ width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 11, paddingBottom: 11, borderRadius: 13, border: '1px solid rgba(1,35,116,0.13)', background: '#FFFDF9', fontSize: 14, color: '#001A4D', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>
      {/* Type filter pills */}
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {MEAL_TYPES.map((type) => {
          const active = type === 'All' ? filterType === '' : filterType.toLowerCase() === type.toLowerCase();
          return (
            <button
              key={type}
              onClick={() => setFilterType(type === 'All' ? '' : type)}
              style={{ padding: '12px 16px', borderRadius: 999, fontSize: 13, fontWeight: active ? 700 : 500, background: active ? '#012374' : '#FFFDF9', color: active ? '#FFFDF9' : 'rgba(1,35,116,0.7)', border: active ? '1px solid #012374' : '1px solid rgba(1,35,116,0.18)', cursor: 'pointer' }}
            >
              {type}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── Meal groups content ────────────────────────────────────────────────────

  const renderMealGroups = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <MealCardSkeleton />
          <MealCardSkeleton />
          <MealCardSkeleton />
        </div>
      );
    }

    if (filteredMeals.length === 0) {
      return (
        <div style={{ padding: '52px 20px', textAlign: 'center', background: '#FFFDF9', borderRadius: 22, border: '1.5px dashed rgba(1,35,116,0.16)' }}>
          <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'rgba(1,35,116,0.07)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" stroke="#012374" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/></svg>
          </div>
          {meals.length === 0 ? (
            <>
              <p className="font-serif-italic" style={{ fontSize: 22, color: '#012374' }}>No meals yet</p>
              <p style={{ fontSize: 13.5, color: 'rgba(22,24,42,0.55)', marginTop: 8, lineHeight: 1.6 }}>Start tracking to see your meal history and patterns.</p>
              <button
                onClick={() => router.push('/add-meal')}
                style={{ marginTop: 20, padding: '12px 26px', borderRadius: 999, background: '#012374', color: '#FFFDF9', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                Log your first meal
              </button>
            </>
          ) : (
            <>
              <p className="font-serif-italic" style={{ fontSize: 22, color: '#012374' }}>No matches</p>
              <p style={{ fontSize: 13.5, color: 'rgba(22,24,42,0.55)', marginTop: 8 }}>Try a different search or filter.</p>
            </>
          )}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        {Object.entries(groupedMeals).map(([dateKey, dateMeals]) => (
          <div key={dateKey}>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.5)', fontWeight: 700, marginBottom: 11 }}>{dateKey}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {dateMeals.map((meal) => (
                <MealCard key={meal.id} meal={meal} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* ─── Mobile ─── */}
      <div className="lg:hidden mobile-page-pb" style={{ minHeight: '100vh', background: '#F7EFE1', fontFamily: "'DM Sans', sans-serif" }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 0', paddingTop: 'max(18px, env(safe-area-inset-top, 0px))' }}>
          <BackButton href="/home" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Meal log</div>
              <h1 className="font-serif-italic" style={{ fontSize: 24, color: '#012374', lineHeight: 1.05 }}>What have you eaten?</h1>
            </div>
            <ExportButton
              onExportPDF={() => exportMealsToPDF(filteredMeals)}
              onExportCSV={() => exportMealsToCSV(filteredMeals)}
            />
          </div>
        </div>

        <div style={{ padding: '18px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {renderFilterBar()}
          {renderMealGroups()}
        </div>

        <BottomNav />
      </div>

      {/* ─── Web ─── */}
      <div className="hidden lg:flex" style={{ height: '100vh', background: '#F7EFE1', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>
        <WebNav />

        <div style={{ flex: 1, overflowY: 'auto', padding: '34px 44px 44px' }}>
          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>
                Meal log · {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
              <h1 className="font-serif-italic" style={{ fontSize: 38, color: '#012374', lineHeight: 1.05, marginTop: 6 }}>
                What have you eaten?
              </h1>
              <p style={{ fontSize: 16, color: 'rgba(22,24,42,0.65)', marginTop: 4 }}>
                {meals.length > 0 ? `${meals.length} meal${meals.length === 1 ? '' : 's'} tracked so far.` : 'Start tracking to see patterns.'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <ExportButton
                onExportPDF={() => exportMealsToPDF(filteredMeals)}
                onExportCSV={() => exportMealsToCSV(filteredMeals)}
              />
              <button
                onClick={() => router.push('/add-meal')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 14, background: '#012374', color: '#FFFDF9', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 8px 18px -8px rgba(1,35,116,.5)' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                Log a meal
              </button>
            </div>
          </div>

          {/* 2-col grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 22, alignItems: 'start' }}>
            {/* Left: search + meal list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ background: '#FFFDF9', borderRadius: 22, border: '1px solid rgba(1,35,116,0.07)', padding: 20, boxShadow: '0 6px 20px -12px rgba(1,35,116,.25)' }}>
                {renderFilterBar()}
              </div>
              <div style={{ background: '#FFFDF9', borderRadius: 22, border: '1px solid rgba(1,35,116,0.07)', padding: 24, boxShadow: '0 6px 20px -12px rgba(1,35,116,.25)' }}>
                {renderMealGroups()}
              </div>
            </div>

            {/* Right: summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Stats card */}
              <div style={{ background: '#FFFDF9', borderRadius: 22, border: '1px solid rgba(1,35,116,0.07)', padding: 22, boxShadow: '0 6px 20px -12px rgba(1,35,116,.25)' }}>
                <div className="font-serif-italic" style={{ fontSize: 21, color: '#012374', marginBottom: 14 }}>Your stats</div>
                {loading ? (
                  <div style={{ height: 80, background: '#F7EFE1', borderRadius: 12 }} />
                ) : meals.length === 0 ? (
                  <p style={{ fontSize: 13.5, color: 'rgba(22,24,42,0.55)', lineHeight: 1.6 }}>No meals logged yet. Snap your first plate!</p>
                ) : (() => {
                  const counts: Record<string, number> = {};
                  meals.forEach(m => {
                    const k = (m.mealType || 'Other').toLowerCase();
                    counts[k] = (counts[k] || 0) + 1;
                  });
                  const typeColors: Record<string, string> = {
                    breakfast: '#C8932B', lunch: '#012374', dinner: '#5C5290', snack: '#1C7A4F',
                  };
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {Object.entries(counts).map(([type, count]) => (
                        <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: typeColors[type] || '#7C86AB', flexShrink: 0 }} />
                          <span style={{ fontSize: 13.5, fontWeight: 500, color: '#16182A', textTransform: 'capitalize', flex: 1 }}>{type}</span>
                          <span style={{ fontSize: 13, color: 'rgba(22,24,42,0.5)', fontWeight: 600 }}>×{count}</span>
                        </div>
                      ))}
                      <div style={{ borderTop: '1px solid rgba(1,35,116,0.07)', paddingTop: 12, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, color: 'rgba(22,24,42,0.6)' }}>Total logged</span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#012374' }}>{meals.length}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Tip card */}
              <div style={{ background: '#012374', borderRadius: 22, padding: 22, color: '#FFFDF9' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700, marginBottom: 10 }}>Chatita tip</div>
                <p style={{ fontSize: 15, lineHeight: 1.65, opacity: 0.92 }}>
                  Logging meals consistently — even imperfect ones — helps you spot how different foods affect your glucose and energy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
