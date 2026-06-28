'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, X, Search, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { MealType } from '@/types';
import { useTranslation } from '@/lib/i18n/context';
import FoodSearchInput from './food-search-input';
import { LOW_GLUCOSE_RULE, GLUCOSE } from '@/lib/health/global-diabetes-rules';

// ── Types ──────────────────────────────────────────────────────────────────────

interface FoodEntry {
  id?: string;
  fdcId?: string;
  barcode?: string;
  foodName: string;
  foodNameEs?: string;
  brand?: string;
  servingSize: string;
  servingsEaten: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  source: 'usda' | 'barcode' | 'custom' | 'manual';
}

export interface MealFormData {
  detectedFoods: string[];
  foodEntries: FoodEntry[];
  // Core nutrition
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  portionSize?: string;
  // Meal identity
  mealName?: string;
  source?: string;
  portionEatenPercent?: number;
  estimateConfidence?: string;
  // Extended nutrition
  addedSugar?: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  potassium?: number;
  // Context
  mealType: MealType;
  feeling?: string;
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantPlaceId?: string;
  // Glucose
  preMealGlucose?: number;
  cgmTrend?: string;
  // Medication
  medicationTaken?: boolean;
  medicationName?: string;
  medicationDose?: string;
  medicationTime?: string;
  medicationNotes?: string;
  isGlp1?: boolean;
  glp1Symptoms?: string[];
  // Snack
  snackReason?: string;
  wasLowGlucoseTreatment?: boolean;
  // Hydration
  drinkType?: string;
  drinkAmountOz?: number;
  drinkSweetened?: boolean;
  // Inline mood
  moodInline?: string;
  energyInline?: number;
  hungerInline?: number;
  fullnessInline?: number;
  moodUserWords?: string;
}

interface MealFormProps {
  onSubmit: (data: MealFormData) => void;
  loading?: boolean;
  initialData?: {
    detectedFoods: string[];
    nutrition?: {
      calories?: number;
      carbs?: number;
      protein?: number;
      fat?: number;
      fiber?: number;
      sugar?: number;
      sodium?: number;
    };
    portionSize?: string;
    mealType?: MealType;
    feeling?: string;
    restaurantName?: string;
    restaurantAddress?: string;
    restaurantPlaceId?: string;
    mealName?: string;
    source?: string;
    portionEatenPercent?: number;
  };
  editMode?: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const SNACK_REASONS = [
  { value: 'hungry', label: 'Hungry' },
  { value: 'craving', label: 'Craving' },
  { value: 'low_glucose', label: 'Low glucose' },
  { value: 'before_exercise', label: 'Before exercise' },
  { value: 'after_exercise', label: 'After exercise' },
  { value: 'nausea', label: 'Nausea / upset stomach' },
  { value: 'need_more_protein', label: 'Need more protein' },
  { value: 'routine', label: 'Routine' },
  { value: 'other', label: 'Other' },
];

const MEAL_SOURCES = [
  { value: 'home', label: 'Home' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'packaged', label: 'Packaged' },
  { value: 'food_pantry', label: 'Food pantry' },
  { value: 'leftovers', label: 'Leftovers' },
  { value: 'other', label: 'Other' },
];

const PORTION_OPTIONS = [
  { value: 25, label: '¼' },
  { value: 50, label: '½' },
  { value: 75, label: '¾' },
  { value: 100, label: 'All' },
];

const CGM_TRENDS = [
  { value: 'rising', label: '↑ Rising' },
  { value: 'stable', label: '→ Stable' },
  { value: 'falling', label: '↓ Falling' },
];

const GLP1_SYMPTOM_OPTIONS = [
  'Nausea', 'Fullness', 'Reflux', 'Constipation',
  'Diarrhea', 'Vomiting', 'Stomach pain', 'No symptoms',
];

const DRINK_TYPES = [
  { value: 'water', label: 'Water' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'tea', label: 'Tea' },
  { value: 'juice', label: 'Juice' },
  { value: 'soda', label: 'Soda' },
  { value: 'agua_fresca', label: 'Agua fresca' },
  { value: 'electrolyte', label: 'Electrolytes' },
  { value: 'broth', label: 'Broth' },
  { value: 'other', label: 'Other' },
];

const QUICK_OZ = [4, 8, 12, 16];

const INLINE_MOODS = [
  { value: 'happy', label: 'Great' },
  { value: 'calm', label: 'Calm' },
  { value: 'neutral', label: 'Okay' },
  { value: 'tired', label: 'Tired' },
  { value: 'anxious', label: 'Anxious' },
  { value: 'sad', label: 'Down' },
];

// ── Helper components ──────────────────────────────────────────────────────────

function SectionToggle({
  label,
  open,
  onToggle,
  badge,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between py-2.5"
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0' }}
    >
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#012374' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {badge && (
          <span style={{ fontSize: '11px', background: 'rgba(200,147,43,0.15)', color: '#9A6F18', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
            {badge}
          </span>
        )}
        {open ? <ChevronUp className="w-4 h-4" style={{ color: '#012374' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'rgba(1,35,116,0.5)' }} />}
      </div>
    </button>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(1,35,116,0.07)', margin: '2px 0' }} />;
}

function NumInput({
  label,
  value,
  unit,
  onChange,
  placeholder,
}: {
  label: string;
  value?: number;
  unit?: string;
  onChange: (v?: number) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', color: 'rgba(1,35,116,0.6)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}{unit && <span style={{ fontWeight: 400, textTransform: 'none' }}> ({unit})</span>}
      </label>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || undefined)}
        placeholder={placeholder ?? '0'}
        style={{
          width: '100%',
          padding: '9px 12px',
          borderRadius: 11,
          border: '1px solid rgba(1,35,116,0.14)',
          background: 'var(--bg-card)',
          fontSize: 14,
          color: '#16182A',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function Chips<T extends string>({
  options,
  selected,
  onToggle,
  multi,
}: {
  options: { value: T; label: string }[];
  selected: T | T[] | undefined;
  onToggle: (v: T) => void;
  multi?: boolean;
}) {
  const isSelected = (v: T) =>
    multi ? (selected as T[] | undefined)?.includes(v) : selected === v;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onToggle(o.value)}
          style={{
            padding: '6px 12px',
            borderRadius: 99,
            fontSize: 12.5,
            fontWeight: isSelected(o.value) ? 600 : 400,
            background: isSelected(o.value) ? '#012374' : 'var(--bg-card)',
            color: isSelected(o.value) ? '#FFFDF9' : '#012374',
            border: isSelected(o.value) ? '1px solid #012374' : '1px solid rgba(1,35,116,0.2)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function MealForm({ onSubmit, loading, initialData, editMode }: MealFormProps) {
  const { t } = useTranslation();

  const [formData, setFormData] = useState<MealFormData>({
    detectedFoods: [],
    foodEntries: [],
    mealType: 'lunch',
  });

  const [foodInput, setFoodInput] = useState('');
  const [showEnhancedSearch, setShowEnhancedSearch] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [aiEnhancement, setAiEnhancement] = useState<any>(null);

  // Section visibility
  const [showNutrition, setShowNutrition] = useState(false);
  const [showExtendedNutrition, setShowExtendedNutrition] = useState(false);
  const [showDrink, setShowDrink] = useState(false);
  const [showGlucose, setShowGlucose] = useState(false);
  const [showMedication, setShowMedication] = useState(false);
  const [showMood, setShowMood] = useState(false);

  // Restaurant search
  const [restaurantQuery, setRestaurantQuery] = useState('');
  const [restaurantSuggestions, setRestaurantSuggestions] = useState<{ id: string; name: string; cuisine: string; address: string }[]>([]);
  const [searchingRestaurant, setSearchingRestaurant] = useState(false);
  const [showRestaurantSuggestions, setShowRestaurantSuggestions] = useState(false);
  const restaurantDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restaurantWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        detectedFoods: initialData.detectedFoods || prev.detectedFoods,
        calories: initialData.nutrition?.calories || prev.calories,
        carbs: initialData.nutrition?.carbs || prev.carbs,
        protein: initialData.nutrition?.protein || prev.protein,
        fat: initialData.nutrition?.fat || prev.fat,
        fiber: initialData.nutrition?.fiber || prev.fiber,
        sugar: initialData.nutrition?.sugar || prev.sugar,
        sodium: initialData.nutrition?.sodium || prev.sodium,
        portionSize: initialData.portionSize || prev.portionSize,
        ...(initialData.mealType && { mealType: initialData.mealType }),
        ...(initialData.feeling !== undefined && { feeling: initialData.feeling }),
        ...(initialData.restaurantName !== undefined && { restaurantName: initialData.restaurantName }),
        ...(initialData.restaurantAddress !== undefined && { restaurantAddress: initialData.restaurantAddress }),
        ...(initialData.restaurantPlaceId !== undefined && { restaurantPlaceId: initialData.restaurantPlaceId }),
        ...(initialData.mealName !== undefined && { mealName: initialData.mealName }),
        ...(initialData.source !== undefined && { source: initialData.source }),
        ...(initialData.portionEatenPercent !== undefined && { portionEatenPercent: initialData.portionEatenPercent }),
      }));

      if (editMode) {
        if (initialData.nutrition && Object.keys(initialData.nutrition).length > 0) setShowNutrition(true);
        if (initialData.restaurantName) setRestaurantQuery(initialData.restaurantName);
      }
    }
  }, [initialData, editMode]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (restaurantWrapperRef.current && !restaurantWrapperRef.current.contains(e.target as Node)) {
        setShowRestaurantSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const set = (patch: Partial<MealFormData>) => setFormData((p) => ({ ...p, ...patch }));

  const toggleGlp1Symptom = (symptom: string) => {
    const current = formData.glp1Symptoms || [];
    set({
      glp1Symptoms: current.includes(symptom)
        ? current.filter((s) => s !== symptom)
        : [...current, symptom],
    });
  };

  const fetchRestaurantSuggestions = async (query: string) => {
    if (query.trim().length < 1) { setRestaurantSuggestions([]); setShowRestaurantSuggestions(false); return; }
    setSearchingRestaurant(true);
    try {
      const res = await fetch('/api/restaurants/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'name', query: query.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setRestaurantSuggestions(data.suggestions || []);
        setShowRestaurantSuggestions(true);
      }
    } catch { setRestaurantSuggestions([]); }
    finally { setSearchingRestaurant(false); }
  };

  const handleRestaurantQueryChange = (value: string) => {
    setRestaurantQuery(value);
    set({ restaurantName: value });
    if (restaurantDebounceRef.current) clearTimeout(restaurantDebounceRef.current);
    restaurantDebounceRef.current = setTimeout(() => fetchRestaurantSuggestions(value), 350);
  };

  const selectRestaurantSuggestion = (s: { id: string; name: string; cuisine: string; address: string }) => {
    setShowRestaurantSuggestions(false);
    setRestaurantQuery(s.name);
    set({ restaurantName: s.name, restaurantAddress: s.address, restaurantPlaceId: s.id });
  };

  const addFood = () => {
    if (foodInput.trim()) {
      set({ detectedFoods: [...formData.detectedFoods, foodInput.trim()] });
      setFoodInput('');
    }
  };

  const removeFood = (index: number) => {
    set({ detectedFoods: formData.detectedFoods.filter((_, i) => i !== index) });
  };

  const handleAddFoodEntry = (food: FoodEntry) => {
    const next = [...formData.foodEntries, food];
    recalcFromEntries(next);
  };

  const handleRemoveFoodEntry = (index: number) => {
    const next = formData.foodEntries.filter((_, i) => i !== index);
    recalcFromEntries(next);
  };

  const handleUpdateServings = (index: number, servings: number) => {
    const next = formData.foodEntries.map((f, i) => i === index ? { ...f, servingsEaten: servings } : f);
    recalcFromEntries(next);
  };

  const recalcFromEntries = (foodEntries: FoodEntry[]) => {
    const totals = foodEntries.reduce(
      (acc, f) => ({
        calories: acc.calories + f.calories * f.servingsEaten,
        carbs: acc.carbs + f.carbs * f.servingsEaten,
        protein: acc.protein + f.protein * f.servingsEaten,
        fat: acc.fat + f.fat * f.servingsEaten,
        fiber: acc.fiber + (f.fiber || 0) * f.servingsEaten,
        sugar: acc.sugar + (f.sugar || 0) * f.servingsEaten,
        sodium: acc.sodium + (f.sodium || 0) * f.servingsEaten,
      }),
      { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
    );
    setFormData((p) => ({
      ...p, foodEntries,
      ...totals,
      detectedFoods: foodEntries.map((f) => f.foodName),
    }));
    if (foodEntries.length > 0) setShowNutrition(true);
  };

  const handleAiEnhancement = async () => {
    setEnhancing(true);
    setAiEnhancement(null);
    try {
      const res = await fetch('/api/enhance-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foods: formData.detectedFoods, mealType: formData.mealType, portionSize: formData.portionSize }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.mode === 'ai') {
          setAiEnhancement(data);
          if (data.nutritionEstimate) {
            set({
              calories: data.nutritionEstimate.calories || formData.calories,
              carbs: data.nutritionEstimate.carbs || formData.carbs,
              protein: data.nutritionEstimate.protein || formData.protein,
              fat: data.nutritionEstimate.fat || formData.fat,
              fiber: data.nutritionEstimate.fiber || formData.fiber,
              sugar: data.nutritionEstimate.sugar || formData.sugar,
            });
            setShowNutrition(true);
          }
        }
      }
    } catch (err) { console.log('AI enhancement failed:', err); }
    finally { setEnhancing(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isSnack = formData.mealType === 'snack';
  const isLowGlucoseTreatment = formData.wasLowGlucoseTreatment;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-1">

      {/* ── MEAL NAME ── */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: '11px', color: 'rgba(1,35,116,0.6)', fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Meal name <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
        </label>
        <input
          type="text"
          value={formData.mealName || ''}
          onChange={(e) => set({ mealName: e.target.value })}
          placeholder="e.g. Curry chicken with rice"
          style={{ width: '100%', padding: '10px 13px', borderRadius: 12, border: '1px solid rgba(1,35,116,0.14)', background: 'var(--bg-card)', fontSize: 14, color: '#16182A', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* ── MEAL TYPE ── */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: '11px', color: 'rgba(1,35,116,0.6)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {t.addMeal.mealType}
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => set({ mealType: type })}
              style={{
                padding: '8px 6px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: formData.mealType === type ? 600 : 400,
                background: formData.mealType === type ? '#012374' : 'var(--bg-card)',
                color: formData.mealType === type ? '#FFFDF9' : '#012374',
                border: formData.mealType === type ? '1px solid #012374' : '1px solid rgba(1,35,116,0.16)',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {t.addMeal[type]}
            </button>
          ))}
        </div>
      </div>

      {/* ── MEAL SOURCE ── */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: '11px', color: 'rgba(1,35,116,0.6)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Where is this from?
        </label>
        <Chips
          options={MEAL_SOURCES}
          selected={formData.source as any}
          onToggle={(v) => set({ source: formData.source === v ? undefined : v })}
        />
      </div>

      {/* ── PORTION EATEN ── */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: '11px', color: 'rgba(1,35,116,0.6)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Portion eaten
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          {PORTION_OPTIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => set({ portionEatenPercent: formData.portionEatenPercent === p.value ? undefined : p.value })}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 10, fontSize: 13,
                fontWeight: formData.portionEatenPercent === p.value ? 600 : 400,
                background: formData.portionEatenPercent === p.value ? '#012374' : 'var(--bg-card)',
                color: formData.portionEatenPercent === p.value ? '#FFFDF9' : '#012374',
                border: formData.portionEatenPercent === p.value ? '1px solid #012374' : '1px solid rgba(1,35,116,0.16)',
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              const custom = window.prompt('Enter percentage eaten (e.g. 30):');
              if (custom && !isNaN(parseFloat(custom))) set({ portionEatenPercent: parseFloat(custom) });
            }}
            style={{ flex: 1, padding: '7px 0', borderRadius: 10, fontSize: 13, fontWeight: 400, background: 'var(--bg-card)', color: '#012374', border: '1px solid rgba(1,35,116,0.16)', cursor: 'pointer' }}
          >
            Custom
          </button>
        </div>
        {formData.portionEatenPercent !== undefined && (
          <p style={{ fontSize: 11, color: 'rgba(1,35,116,0.5)', marginTop: 4 }}>
            {formData.portionEatenPercent}% eaten
          </p>
        )}
      </div>

      <Divider />

      {/* ── SNACK CONTEXT ── */}
      {isSnack && (
        <div style={{ background: 'rgba(200,147,43,0.07)', borderRadius: 14, padding: '14px 16px', margin: '10px 0' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A6F18', fontWeight: 700, marginBottom: 10 }}>
            Snack context
          </p>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: 'rgba(1,35,116,0.65)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Why are you snacking?</label>
            <Chips
              options={SNACK_REASONS}
              selected={formData.snackReason as any}
              onToggle={(v) => set({ snackReason: formData.snackReason === v ? undefined : v, wasLowGlucoseTreatment: v === 'low_glucose' ? true : formData.wasLowGlucoseTreatment })}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => set({ wasLowGlucoseTreatment: !formData.wasLowGlucoseTreatment })}
              style={{
                width: 20, height: 20, borderRadius: 6, border: '1.5px solid rgba(1,35,116,0.3)',
                background: formData.wasLowGlucoseTreatment ? '#012374' : 'transparent',
                cursor: 'pointer', flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 13, color: '#16182A' }}>This snack is treating low blood glucose</span>
          </div>
        </div>
      )}

      {/* ── LOW GLUCOSE NOTICE (ADA/IDF 15-15 rule) ── */}
      {isSnack && isLowGlucoseTreatment && (
        <div style={{ background: 'rgba(227,23,26,0.07)', border: '1px solid rgba(227,23,26,0.25)', borderRadius: 14, padding: '14px 16px', margin: '0 0 10px' }}>
          <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#E3171A', fontWeight: 700, marginBottom: 8 }}>
            Low glucose — IDF/ADA 15-15 rule
          </p>
          <p style={{ fontSize: 13, color: '#16182A', lineHeight: 1.6, marginBottom: 8 }}>
            Take <strong>15g</strong> of fast-acting carbohydrates, wait <strong>15 minutes</strong>, then recheck.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {LOW_GLUCOSE_RULE.fastCarbExamples.map((ex) => (
              <span key={ex} style={{ fontSize: 11.5, background: 'rgba(227,23,26,0.08)', color: '#B5562E', padding: '3px 9px', borderRadius: 99 }}>
                {ex}
              </span>
            ))}
          </div>
          <p style={{ fontSize: 11.5, color: 'rgba(22,24,42,0.55)', lineHeight: 1.5 }}>
            {LOW_GLUCOSE_RULE.disclaimer}
          </p>
          <p style={{ fontSize: 11.5, color: '#D0021B', fontWeight: 600, marginTop: 6 }}>
            If symptoms are severe or you feel unsafe — seek emergency help.
          </p>
        </div>
      )}

      <Divider />

      {/* ── FOODS ── */}
      <div style={{ padding: '4px 0 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <label style={{ fontSize: '11px', color: 'rgba(1,35,116,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {t.addMeal.foods}
          </label>
          <button
            type="button"
            onClick={() => setShowEnhancedSearch(!showEnhancedSearch)}
            style={{ fontSize: 12, color: '#012374', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }}
          >
            {showEnhancedSearch ? '← Simple mode' : '🔍 Search nutrition database'}
          </button>
        </div>

        {showEnhancedSearch ? (
          <FoodSearchInput
            onAddFood={handleAddFoodEntry}
            foodEntries={formData.foodEntries}
            onRemoveFood={handleRemoveFoodEntry}
            onUpdateServings={handleUpdateServings}
          />
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                type="text"
                value={foodInput}
                onChange={(e) => setFoodInput(e.target.value)}
                onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFood(); } }}
                placeholder={t.addMeal.foodPlaceholder}
                style={{ flex: 1, padding: '10px 12px', borderRadius: 11, border: '1px solid rgba(1,35,116,0.14)', background: 'var(--bg-card)', fontSize: 14, color: '#16182A', outline: 'none' }}
              />
              <button
                type="button"
                onClick={addFood}
                style={{ padding: '10px 16px', borderRadius: 11, background: '#012374', color: '#FFFDF9', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <Plus className="w-4 h-4" />
                {t.addMeal.add}
              </button>
            </div>
            {formData.detectedFoods.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {formData.detectedFoods.map((food, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(1,35,116,0.08)', color: '#012374', padding: '5px 11px', borderRadius: 99, fontSize: 13, fontWeight: 500 }}>
                    {food}
                    <button type="button" onClick={() => removeFood(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {/* AI Enhancement */}
        {formData.detectedFoods.length > 0 && !initialData && (
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={handleAiEnhancement}
              disabled={enhancing}
              style={{ width: '100%', padding: '10px', borderRadius: 11, background: 'rgba(1,35,116,0.06)', border: '1px solid rgba(1,35,116,0.15)', color: '#012374', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {enhancing ? <><Loader2 className="w-4 h-4 animate-spin" /> Getting AI tips…</> : '🤖 Get AI nutrition tips'}
            </button>
          </div>
        )}

        {aiEnhancement && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {aiEnhancement.questions?.length > 0 && (
              <div style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, padding: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', marginBottom: 6 }}>💭 To improve accuracy</p>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {aiEnhancement.questions.map((q: string, i: number) => (
                    <li key={i} style={{ fontSize: 12.5, color: '#5B21B6', marginBottom: 3 }}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
            {aiEnhancement.nutritionEstimate && (
              <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#065F46', marginBottom: 6 }}>📊 AI estimate ({aiEnhancement.nutritionEstimate.confidence} confidence)</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {['calories', 'carbs', 'protein'].map((k) => aiEnhancement.nutritionEstimate[k] && (
                    <div key={k}>
                      <span style={{ fontSize: 11, color: 'rgba(6,95,70,0.7)' }}>{k.charAt(0).toUpperCase() + k.slice(1)}:</span>{' '}
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{aiEnhancement.nutritionEstimate[k]}{k !== 'calories' ? 'g' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Divider />

      {/* ── RESTAURANT LOCATION (only when source = restaurant) ── */}
      {(formData.source === 'restaurant' || restaurantQuery) && (
        <div style={{ padding: '4px 0 10px' }} ref={restaurantWrapperRef}>
          <label style={{ display: 'block', fontSize: '11px', color: 'rgba(1,35,116,0.6)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Restaurant
          </label>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'rgba(1,35,116,0.4)' }} />
            <input
              type="text"
              value={restaurantQuery}
              onChange={(e) => handleRestaurantQueryChange(e.target.value)}
              onFocus={() => { if (restaurantSuggestions.length > 0) setShowRestaurantSuggestions(true); }}
              placeholder="Restaurant name (optional)"
              style={{ width: '100%', paddingLeft: 32, paddingRight: 36, paddingTop: 10, paddingBottom: 10, borderRadius: 11, border: '1px solid rgba(1,35,116,0.14)', background: 'var(--bg-card)', fontSize: 14, color: '#16182A', outline: 'none', boxSizing: 'border-box' }}
            />
            {restaurantQuery && (
              <button type="button" onClick={() => { setRestaurantQuery(''); set({ restaurantName: '', restaurantAddress: '', restaurantPlaceId: '' }); setRestaurantSuggestions([]); setShowRestaurantSuggestions(false); }}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(1,35,116,0.4)' }}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {(searchingRestaurant || (showRestaurantSuggestions && restaurantSuggestions.length > 0)) && (
            <div style={{ marginTop: 4, background: 'var(--bg-card)', border: '1px solid rgba(1,35,116,0.12)', borderRadius: 11, boxShadow: '0 4px 16px -8px rgba(1,35,116,0.2)', maxHeight: 180, overflowY: 'auto' }}>
              {searchingRestaurant ? (
                <div style={{ padding: '10px 14px', fontSize: 13, color: 'rgba(1,35,116,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Loader2 className="w-4 h-4 animate-spin" /> Searching…
                </div>
              ) : restaurantSuggestions.map((s) => (
                <button key={s.id} type="button" onClick={() => selectRestaurantSuggestion(s)}
                  style={{ width: '100%', textAlign: 'left', padding: '9px 14px', background: 'none', border: 'none', borderBottom: '1px solid rgba(1,35,116,0.05)', cursor: 'pointer' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#16182A', margin: 0 }}>{s.name}</p>
                  <p style={{ fontSize: 11.5, color: 'rgba(22,24,42,0.5)', margin: 0 }}>{s.cuisine}{s.address ? ` · ${s.address}` : ''}</p>
                </button>
              ))}
            </div>
          )}
          <Divider />
        </div>
      )}

      {/* ── NUTRITION (collapsible) ── */}
      <SectionToggle
        label="Nutrition"
        open={showNutrition}
        onToggle={() => setShowNutrition(!showNutrition)}
        badge={formData.calories ? `${Math.round(formData.calories)} cal` : undefined}
      />
      {showNutrition && (
        <div style={{ paddingBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <NumInput label="Calories" value={formData.calories} onChange={(v) => set({ calories: v })} />
            <NumInput label="Total carbs" unit="g" value={formData.carbs} onChange={(v) => set({ carbs: v })} />
            <NumInput label="Protein" unit="g" value={formData.protein} onChange={(v) => set({ protein: v })} />
            <NumInput label="Fat" unit="g" value={formData.fat} onChange={(v) => set({ fat: v })} />
            <NumInput label="Fiber" unit="g" value={formData.fiber} onChange={(v) => set({ fiber: v })} />
            <NumInput label="Sugar" unit="g" value={formData.sugar} onChange={(v) => set({ sugar: v })} />
            <NumInput label="Sodium" unit="mg" value={formData.sodium} onChange={(v) => set({ sodium: v })} />
          </div>

          <button
            type="button"
            onClick={() => setShowExtendedNutrition(!showExtendedNutrition)}
            style={{ fontSize: 12, color: '#012374', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0, marginBottom: showExtendedNutrition ? 10 : 0 }}
          >
            {showExtendedNutrition ? '− Less' : '+ More nutrients'} (added sugar, sat fat, cholesterol…)
          </button>

          {showExtendedNutrition && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              <NumInput label="Added sugar" unit="g" value={formData.addedSugar} onChange={(v) => set({ addedSugar: v })} />
              <NumInput label="Saturated fat" unit="g" value={formData.saturatedFat} onChange={(v) => set({ saturatedFat: v })} />
              <NumInput label="Trans fat" unit="g" value={formData.transFat} onChange={(v) => set({ transFat: v })} />
              <NumInput label="Cholesterol" unit="mg" value={formData.cholesterol} onChange={(v) => set({ cholesterol: v })} />
              <NumInput label="Potassium" unit="mg" value={formData.potassium} onChange={(v) => set({ potassium: v })} />
            </div>
          )}
        </div>
      )}

      <Divider />

      {/* ── DRINK / WATER (collapsible) ── */}
      <SectionToggle
        label="Drink with this meal"
        open={showDrink}
        onToggle={() => setShowDrink(!showDrink)}
        badge={formData.drinkAmountOz ? `${formData.drinkAmountOz} oz` : undefined}
      />
      {showDrink && (
        <div style={{ paddingBottom: 12 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(1,35,116,0.6)', fontWeight: 600, marginBottom: 6 }}>Drink type</label>
            <Chips
              options={DRINK_TYPES}
              selected={formData.drinkType as any}
              onToggle={(v) => set({ drinkType: formData.drinkType === v ? undefined : v })}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(1,35,116,0.6)', fontWeight: 600, marginBottom: 6 }}>Amount</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {QUICK_OZ.map((oz) => (
                <button
                  key={oz}
                  type="button"
                  onClick={() => set({ drinkAmountOz: oz })}
                  style={{
                    padding: '7px 14px', borderRadius: 10, fontSize: 13,
                    fontWeight: formData.drinkAmountOz === oz ? 600 : 400,
                    background: formData.drinkAmountOz === oz ? '#012374' : 'var(--bg-card)',
                    color: formData.drinkAmountOz === oz ? '#FFFDF9' : '#012374',
                    border: formData.drinkAmountOz === oz ? '1px solid #012374' : '1px solid rgba(1,35,116,0.16)',
                    cursor: 'pointer',
                  }}
                >
                  +{oz} oz
                </button>
              ))}
              <button
                type="button"
                onClick={() => { const c = window.prompt('How many oz?'); if (c && !isNaN(parseFloat(c))) set({ drinkAmountOz: parseFloat(c) }); }}
                style={{ padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 400, background: 'var(--bg-card)', color: '#012374', border: '1px solid rgba(1,35,116,0.16)', cursor: 'pointer' }}
              >
                Custom
              </button>
            </div>
            {formData.drinkAmountOz !== undefined && <p style={{ fontSize: 11, color: 'rgba(1,35,116,0.5)', marginTop: 4 }}>{formData.drinkAmountOz} oz logged</p>}
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#16182A', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!formData.drinkSweetened} onChange={(e) => set({ drinkSweetened: e.target.checked })} />
              Sweetened
            </label>
          </div>
        </div>
      )}

      <Divider />

      {/* ── GLUCOSE (collapsible) ── */}
      <SectionToggle
        label="Glucose context"
        open={showGlucose}
        onToggle={() => setShowGlucose(!showGlucose)}
        badge={formData.preMealGlucose ? `${formData.preMealGlucose} mg/dL` : undefined}
      />
      {showGlucose && (
        <div style={{ paddingBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <NumInput label="Before meal" unit="mg/dL" value={formData.preMealGlucose} onChange={(v) => set({ preMealGlucose: v })} placeholder="e.g. 120" />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(1,35,116,0.6)', fontWeight: 600, marginBottom: 6 }}>CGM trend</label>
            <Chips
              options={CGM_TRENDS}
              selected={formData.cgmTrend as any}
              onToggle={(v) => set({ cgmTrend: formData.cgmTrend === v ? undefined : v })}
            />
          </div>
          <div style={{ background: 'rgba(1,35,116,0.04)', borderRadius: 11, padding: '10px 12px' }}>
            <p style={{ fontSize: 12, color: 'rgba(22,24,42,0.6)', lineHeight: 1.6, margin: 0 }}>
              IDF general targets: 80–130 mg/dL before meals, under 180 mg/dL 1–2 h after. Your care team may set different goals.
            </p>
          </div>
        </div>
      )}

      <Divider />

      {/* ── MEDICATION (collapsible) ── */}
      <SectionToggle
        label="Medication"
        open={showMedication}
        onToggle={() => setShowMedication(!showMedication)}
      />
      {showMedication && (
        <div style={{ paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => set({ medicationTaken: !formData.medicationTaken })}
              style={{
                width: 42, height: 24, borderRadius: 99,
                background: formData.medicationTaken ? '#012374' : 'rgba(1,35,116,0.18)',
                border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#FFFDF9',
                transition: 'left 0.2s', left: formData.medicationTaken ? 21 : 3,
              }} />
            </button>
            <span style={{ fontSize: 13, color: '#16182A' }}>Medication taken today</span>
          </div>

          {formData.medicationTaken && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
              <input
                type="text"
                value={formData.medicationName || ''}
                onChange={(e) => set({ medicationName: e.target.value })}
                placeholder="Medication name (e.g. Metformin, Mounjaro, Ozempic)"
                style={{ padding: '9px 12px', borderRadius: 11, border: '1px solid rgba(1,35,116,0.14)', background: 'var(--bg-card)', fontSize: 13, color: '#16182A', outline: 'none' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input
                  type="text"
                  value={formData.medicationDose || ''}
                  onChange={(e) => set({ medicationDose: e.target.value })}
                  placeholder="Dose (e.g. 500mg)"
                  style={{ padding: '9px 12px', borderRadius: 11, border: '1px solid rgba(1,35,116,0.14)', background: 'var(--bg-card)', fontSize: 13, color: '#16182A', outline: 'none' }}
                />
                <input
                  type="time"
                  value={formData.medicationTime || ''}
                  onChange={(e) => set({ medicationTime: e.target.value })}
                  style={{ padding: '9px 12px', borderRadius: 11, border: '1px solid rgba(1,35,116,0.14)', background: 'var(--bg-card)', fontSize: 13, color: '#16182A', outline: 'none' }}
                />
              </div>

              {/* GLP-1 toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => set({ isGlp1: !formData.isGlp1 })}
                  style={{ width: 20, height: 20, borderRadius: 6, border: '1.5px solid rgba(1,35,116,0.3)', background: formData.isGlp1 ? '#012374' : 'transparent', cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, color: '#16182A' }}>This is a GLP-1/GIP medication (Ozempic, Mounjaro, Wegovy, Zepbound…)</span>
              </div>

              {formData.isGlp1 && (
                <div style={{ background: 'rgba(200,147,43,0.07)', borderRadius: 12, padding: '12px 14px' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#9A6F18', marginBottom: 8 }}>Any symptoms today?</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {GLP1_SYMPTOM_OPTIONS.map((symptom) => {
                      const active = formData.glp1Symptoms?.includes(symptom);
                      return (
                        <button
                          key={symptom}
                          type="button"
                          onClick={() => toggleGlp1Symptom(symptom)}
                          style={{
                            padding: '5px 11px', borderRadius: 99, fontSize: 12.5,
                            fontWeight: active ? 600 : 400,
                            background: active ? '#9A6F18' : 'var(--bg-card)',
                            color: active ? '#FFFDF9' : '#9A6F18',
                            border: active ? '1px solid #9A6F18' : '1px solid rgba(200,147,43,0.3)',
                            cursor: 'pointer',
                          }}
                        >
                          {symptom}
                        </button>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: 11.5, color: 'rgba(22,24,42,0.55)', marginTop: 8, lineHeight: 1.5 }}>
                    Chatita does not adjust your dose. If nausea, vomiting, or severe stomach symptoms do not go away, contact your care team.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Divider />

      {/* ── MOOD / BODY CHECK-IN (collapsible) ── */}
      <SectionToggle
        label="Mood & body check-in"
        open={showMood}
        onToggle={() => setShowMood(!showMood)}
        badge={formData.moodInline ? formData.moodInline : undefined}
      />
      {showMood && (
        <div style={{ paddingBottom: 12 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(1,35,116,0.6)', fontWeight: 600, marginBottom: 6 }}>How are you feeling?</label>
            <Chips
              options={INLINE_MOODS}
              selected={formData.moodInline as any}
              onToggle={(v) => set({ moodInline: formData.moodInline === v ? undefined : v })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            {([
              { label: 'Energy', key: 'energyInline' },
              { label: 'Hunger', key: 'hungerInline' },
              { label: 'Fullness', key: 'fullnessInline' },
            ] as const).map(({ label, key }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 11, color: 'rgba(1,35,116,0.55)', fontWeight: 600, marginBottom: 4 }}>{label} (1–10)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={(formData as any)[key] ?? ''}
                  onChange={(e) => set({ [key]: parseInt(e.target.value) || undefined })}
                  placeholder="–"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(1,35,116,0.14)', background: 'var(--bg-card)', fontSize: 14, color: '#16182A', outline: 'none', boxSizing: 'border-box', textAlign: 'center' }}
                />
              </div>
            ))}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(1,35,116,0.6)', fontWeight: 600, marginBottom: 6 }}>Tell Chatita in your own words</label>
            <textarea
              value={formData.moodUserWords || ''}
              onChange={(e) => set({ moodUserWords: e.target.value })}
              placeholder="e.g. I felt rushed and ate too fast. Stress from work."
              rows={2}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 11, border: '1px solid rgba(1,35,116,0.14)', background: 'var(--bg-card)', fontSize: 13, color: '#16182A', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }}
            />
          </div>
        </div>
      )}

      <Divider />

      {/* ── NOTES ── */}
      <div style={{ padding: '10px 0' }}>
        <label style={{ display: 'block', fontSize: '11px', color: 'rgba(1,35,116,0.6)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Notes / how you felt
        </label>
        <textarea
          value={formData.feeling || ''}
          onChange={(e) => set({ feeling: e.target.value })}
          placeholder={t.addMeal.feelingPlaceholder}
          rows={3}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 11, border: '1px solid rgba(1,35,116,0.14)', background: 'var(--bg-card)', fontSize: 14, color: '#16182A', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }}
        />
      </div>

      {/* ── SUBMIT ── */}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%', padding: '14px', borderRadius: 14,
          background: loading ? 'rgba(1,35,116,0.4)' : '#012374',
          color: '#FFFDF9', fontSize: 15, fontWeight: 700,
          border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: 8,
        }}
      >
        {loading ? t.addMeal.saving : (editMode ? t.editMeal.saveChanges : t.addMeal.saveMeal)}
      </button>
    </form>
  );
}
