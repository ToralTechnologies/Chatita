'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface MealCardProps {
  meal: {
    id: string;
    photoBase64?: string | null;
    description?: string | null;
    aiSummary?: string | null;
    detectedFoods?: string | null;
    mealName?: string | null;
    portionSize?: string | null;
    // Core nutrition
    calories?: number | null;
    carbs?: number | null;
    protein?: number | null;
    fat?: number | null;
    fiber?: number | null;
    sugar?: number | null;
    sodium?: number | null;
    // Extended nutrition
    addedSugar?: number | null;
    saturatedFat?: number | null;
    transFat?: number | null;
    cholesterol?: number | null;
    potassium?: number | null;
    mealType?: string | null;
    feeling?: string | null;
    nutritionSource?: string | null;
    eatenAt: Date | string;
  };
  onDelete?: (id: string) => void;
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  breakfast: { bg: 'rgba(200,147,43,0.13)', text: '#9A6F18' },
  lunch:     { bg: 'rgba(1,35,116,0.09)',   text: '#012374'  },
  dinner:    { bg: 'rgba(92,82,144,0.12)',  text: '#5C5290'  },
  snack:     { bg: 'rgba(28,122,79,0.11)',  text: '#1C7A4F'  },
};

export default function MealCard({ meal, onDelete }: MealCardProps) {
  const router = useRouter();
  const [showFeeling, setShowFeeling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const foods: string[] = meal.detectedFoods ? JSON.parse(meal.detectedFoods) : [];
  const eatenAt = typeof meal.eatenAt === 'string' ? new Date(meal.eatenAt) : meal.eatenAt;
  const typeKey = (meal.mealType || '').toLowerCase();
  const typeColor = TYPE_COLORS[typeKey] || { bg: 'rgba(1,35,116,0.07)', text: 'rgba(22,24,42,0.6)' };

  const handleDelete = async () => {
    setDeleting(true);
    setConfirmingDelete(false);
    try {
      await onDelete?.(meal.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div style={{
      background: '#FFFDF9',
      borderRadius: 18,
      border: '1px solid rgba(1,35,116,0.07)',
      overflow: 'hidden',
      opacity: deleting ? 0.45 : 1,
      transition: 'opacity 0.2s',
    }}>
      {/* Photo */}
      {meal.photoBase64 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={meal.photoBase64} alt="Meal" style={{ width: '100%', height: 190, objectFit: 'cover', display: 'block' }} />
      )}

      <div style={{ padding: '14px 16px' }}>
        {/* Row: type badge + time + actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {meal.mealType && (
              <span style={{ background: typeColor.bg, color: typeColor.text, borderRadius: 99, padding: '4px 10px', fontSize: 11.5, fontWeight: 700, textTransform: 'capitalize' }}>
                {meal.mealType}
              </span>
            )}
            <span style={{ fontSize: 12, color: 'rgba(22,24,42,0.45)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              {format(eatenAt, 'h:mm a')}
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {confirmingDelete ? (
              <>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{ padding: '5px 12px', borderRadius: 10, background: '#D0021B', color: '#FFFDF9', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  style={{ padding: '5px 12px', borderRadius: 10, background: 'rgba(22,24,42,0.08)', color: 'rgba(22,24,42,0.7)', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push(`/meals/${meal.id}/edit`)}
                  style={{ width: 32, height: 32, borderRadius: 10, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(1,35,116,0.4)' }}
                  aria-label="Edit meal"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button
                  onClick={() => setConfirmingDelete(true)}
                  style={{ width: 32, height: 32, borderRadius: 10, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(208,2,27,0.55)' }}
                  aria-label="Delete meal"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {meal.description && (
          <p style={{ fontSize: 15, fontWeight: 600, color: '#16182A', marginBottom: 8, lineHeight: 1.3 }}>{meal.description}</p>
        )}

        {/* Food chips */}
        {foods.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {foods.map((food, i) => (
              <span key={i} style={{ background: '#F7EFE1', color: '#012374', borderRadius: 99, padding: '5px 10px', fontSize: 12, fontWeight: 500 }}>
                {food}
              </span>
            ))}
          </div>
        )}

        {/* Nutrition grid */}
        {(meal.calories || meal.carbs || meal.protein || meal.fat || meal.fiber || meal.sugar || meal.sodium) && (() => {
          const primary = [
            { label: 'cal',     val: meal.calories  != null ? String(Math.round(meal.calories))  : null },
            { label: 'carbs',   val: meal.carbs     != null ? `${Math.round(meal.carbs)}g`     : null },
            { label: 'protein', val: meal.protein   != null ? `${Math.round(meal.protein)}g`   : null },
            { label: 'fat',     val: meal.fat       != null ? `${Math.round(meal.fat)}g`       : null },
            { label: 'fiber',   val: meal.fiber     != null ? `${Math.round(meal.fiber)}g`     : null },
            { label: 'sugar',   val: meal.sugar     != null ? `${Math.round(meal.sugar)}g`     : null },
            { label: 'sodium',  val: meal.sodium    != null ? `${Math.round(meal.sodium)}mg`   : null },
          ].filter(i => i.val !== null);

          const extended = [
            { label: 'sat. fat',  val: meal.saturatedFat != null ? `${Math.round(meal.saturatedFat)}g`  : null },
            { label: 'add. sugar',val: meal.addedSugar   != null ? `${Math.round(meal.addedSugar)}g`    : null },
            { label: 'chol.',     val: meal.cholesterol  != null ? `${Math.round(meal.cholesterol)}mg`  : null },
            { label: 'potassium', val: meal.potassium    != null ? `${Math.round(meal.potassium)}mg`    : null },
            { label: 'trans fat', val: meal.transFat     != null ? `${Math.round(meal.transFat)}g`      : null },
          ].filter(i => i.val !== null);

          return (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: 6, background: '#F7EFE1', borderRadius: 12, padding: '10px 12px' }}>
                {primary.map(({ label, val }) => (
                  <NutrStat key={label} label={label} value={val!} />
                ))}
              </div>
              {extended.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 6, marginTop: 6, padding: '0 2px' }}>
                  {extended.map(({ label, val }) => (
                    <NutrStat key={label} label={label} value={val!} small />
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Feeling note */}
        {meal.feeling && (
          <div>
            <button
              onClick={() => setShowFeeling(!showFeeling)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'rgba(1,35,116,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {showFeeling ? 'Hide note' : 'View note'}
            </button>
            {showFeeling && (
              <p style={{ marginTop: 8, fontSize: 13, color: 'rgba(22,24,42,0.65)', fontStyle: 'italic', background: 'rgba(1,35,116,0.05)', borderRadius: 10, padding: '9px 12px', lineHeight: 1.55 }}>
                &quot;{meal.feeling}&quot;
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NutrStat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: small ? 12 : 15, fontWeight: 700, color: small ? 'rgba(1,35,116,0.6)' : '#012374' }}>{value}</div>
      <div style={{ fontSize: small ? 9.5 : 11, color: 'rgba(22,24,42,0.45)', marginTop: 1 }}>{label}</div>
    </div>
  );
}
