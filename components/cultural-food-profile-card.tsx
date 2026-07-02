'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Save, Check } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { vocab } from '@/lib/i18n/vocab';

const card = {
  background: '#FFFDF9',
  borderRadius: 22,
  border: '1px solid rgba(1,35,116,0.07)',
  boxShadow: '0 14px 30px -24px rgba(1,35,116,.28)',
  padding: 24,
} as const;

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 10,
  border: '1px solid rgba(22,24,42,0.18)',
  padding: '9px 13px',
  fontSize: 14,
  background: '#FFFDF9',
  outline: 'none',
  boxSizing: 'border-box',
  color: '#16182A',
};

const DIETARY_OPTIONS = [
  'Halal', 'Kosher', 'Vegetarian', 'Vegan', 'Gluten-free',
  'Lactose-free', 'Nut-free', 'No pork', 'No beef',
];

const FOOD_ACCESS_OPTIONS = [
  { value: 'grocery', label: 'Grocery store' },
  { value: 'food_pantry', label: 'Food pantry / community box' },
  { value: 'restaurant_heavy', label: 'Mostly restaurants / takeout' },
  { value: 'mixed', label: 'Mix of all of the above' },
];

const COOKING_OPTIONS = [
  { value: 'daily', label: 'Almost every day' },
  { value: 'often', label: 'Several times a week' },
  { value: 'sometimes', label: 'A few times a week' },
  { value: 'rarely', label: 'Rarely — mostly takeout or packaged' },
];

function TagInput({
  label,
  hint,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  placeholder: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setInput('');
  };

  return (
    <div>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'rgba(22,24,42,0.7)', marginBottom: hint ? 2 : 5 }}>{label}</label>
      {hint && <p style={{ fontSize: 11.5, color: 'rgba(22,24,42,0.45)', marginBottom: 5, lineHeight: 1.4 }}>{hint}</p>}
      <div style={{ display: 'flex', gap: 7, marginBottom: 7 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          type="button"
          onClick={add}
          style={{ borderRadius: 10, background: 'rgba(1,35,116,0.08)', border: 'none', padding: '9px 14px', fontSize: 13, fontWeight: 600, color: '#012374', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          + Add
        </button>
      </div>
      {value.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {value.map((tag) => (
            <span
              key={tag}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'rgba(1,35,116,0.07)', borderRadius: 99, fontSize: 12.5, color: '#012374', fontWeight: 500 }}
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tag))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(22,24,42,0.45)', fontSize: 14, lineHeight: 1, padding: 0 }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface CulturalProfile {
  countryOrRegion: string;
  culturalFoodBackground: string;
  stapleCarbs: string[];
  commonProteins: string[];
  commonVegetables: string[];
  commonDrinks: string[];
  dietaryRestrictions: string[];
  religiousFoodNeeds: string;
  foodBudgetLevel: string;
  foodAccessContext: string;
  cookingFrequency: string;
  foodPantryUse: boolean;
  comfortFoods: string[];
  foodsToKeep: string[];
}

const EMPTY: CulturalProfile = {
  countryOrRegion: '',
  culturalFoodBackground: '',
  stapleCarbs: [],
  commonProteins: [],
  commonVegetables: [],
  commonDrinks: [],
  dietaryRestrictions: [],
  religiousFoodNeeds: '',
  foodBudgetLevel: '',
  foodAccessContext: '',
  cookingFrequency: '',
  foodPantryUse: false,
  comfortFoods: [],
  foodsToKeep: [],
};

export default function CulturalFoodProfileCard() {
  const { language } = useTranslation();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<CulturalProfile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          const u = data.user;
          setProfile({
            countryOrRegion: u.countryOrRegion || '',
            culturalFoodBackground: u.culturalFoodBackground || '',
            stapleCarbs: u.stapleCarbs || [],
            commonProteins: u.commonProteins || [],
            commonVegetables: u.commonVegetables || [],
            commonDrinks: u.commonDrinks || [],
            dietaryRestrictions: u.dietaryRestrictions || [],
            religiousFoodNeeds: u.religiousFoodNeeds || '',
            foodBudgetLevel: u.foodBudgetLevel || '',
            foodAccessContext: u.foodAccessContext || '',
            cookingFrequency: u.cookingFrequency || '',
            foodPantryUse: u.foodPantryUse || false,
            comfortFoods: u.comfortFoods || [],
            foodsToKeep: u.foodsToKeep || [],
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof CulturalProfile>(k: K, v: CulturalProfile[K]) =>
    setProfile((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        countryOrRegion: profile.countryOrRegion || null,
        culturalFoodBackground: profile.culturalFoodBackground || null,
        stapleCarbs: profile.stapleCarbs,
        commonProteins: profile.commonProteins,
        commonVegetables: profile.commonVegetables,
        commonDrinks: profile.commonDrinks,
        dietaryRestrictions: profile.dietaryRestrictions,
        religiousFoodNeeds: profile.religiousFoodNeeds || null,
        foodBudgetLevel: profile.foodBudgetLevel || null,
        foodAccessContext: profile.foodAccessContext || null,
        cookingFrequency: profile.cookingFrequency || null,
        foodPantryUse: profile.foodPantryUse,
        comfortFoods: profile.comfortFoods,
        foodsToKeep: profile.foodsToKeep,
      };
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  const hasProfile =
    profile.countryOrRegion ||
    profile.stapleCarbs.length > 0 ||
    profile.dietaryRestrictions.length > 0 ||
    profile.foodsToKeep.length > 0;

  return (
    <div style={card}>
      {/* Header row */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.5)', fontWeight: 700, marginBottom: 4 }}>
            Cultural Food Profile
          </div>
          <p style={{ fontSize: 13.5, color: '#16182A', fontWeight: 600 }}>
            {vocab(hasProfile ? 'Your food context is set' : 'Tell us about your everyday foods', language)}
          </p>
          <p style={{ fontSize: 12, color: 'rgba(22,24,42,0.5)', marginTop: 2 }}>
            Helps Chatita give guidance that fits your real life — not generic food assumptions.
          </p>
        </div>
        <div style={{ flexShrink: 0, marginLeft: 12 }}>
          {open ? <ChevronUp size={18} color="rgba(22,24,42,0.45)" /> : <ChevronDown size={18} color="rgba(22,24,42,0.45)" />}
        </div>
      </button>

      {open && (
        <div style={{ marginTop: 20, borderTop: '1px solid rgba(1,35,116,0.07)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {loading ? (
            <p style={{ fontSize: 13, color: 'rgba(22,24,42,0.5)' }}>Loading…</p>
          ) : (
            <>
              <p style={{ fontSize: 12, color: 'rgba(22,24,42,0.5)', lineHeight: 1.55 }}>
                All fields are optional. What you share helps Chatita adapt food guidance to your culture, budget, and access — not just American food assumptions.
              </p>

              {/* Food culture / heritage */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'rgba(22,24,42,0.7)', marginBottom: 5 }}>Your food culture or heritage</label>
                <input
                  type="text"
                  value={profile.countryOrRegion}
                  onChange={(e) => set('countryOrRegion', e.target.value)}
                  placeholder="e.g. Mexican, Indian, Nigerian, Filipino"
                  style={inputStyle}
                />
                <p style={{ fontSize: 11.5, color: 'rgba(22,24,42,0.5)', marginTop: 4, lineHeight: 1.5 }}>The cuisine your everyday cooking comes from — not necessarily where you live now.</p>
              </div>

              {/* Cultural food background */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'rgba(22,24,42,0.7)', marginBottom: 5 }}>How would you describe your food background?</label>
                <textarea
                  value={profile.culturalFoodBackground}
                  onChange={(e) => set('culturalFoodBackground', e.target.value)}
                  rows={3}
                  placeholder="e.g. I grew up eating rice and beans daily, lots of tortillas, tamales on weekends..."
                  style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }}
                />
              </div>

              <TagInput
                label="Staple carbs / starches"
                hint="Your everyday starchy foods"
                placeholder="e.g. tortillas, rice, roti, pasta..."
                value={profile.stapleCarbs}
                onChange={(v) => set('stapleCarbs', v)}
              />
              <TagInput
                label="Common proteins"
                hint="Proteins you eat regularly"
                placeholder="e.g. beans, chicken, dal, fish, eggs..."
                value={profile.commonProteins}
                onChange={(v) => set('commonProteins', v)}
              />
              <TagInput
                label="Common vegetables"
                placeholder="e.g. nopales, spinach, eggplant, bok choy..."
                value={profile.commonVegetables}
                onChange={(v) => set('commonVegetables', v)}
              />
              <TagInput
                label="Common drinks"
                placeholder="e.g. agua fresca, horchata, tea, coffee..."
                value={profile.commonDrinks}
                onChange={(v) => set('commonDrinks', v)}
              />
              <TagInput
                label="Foods you don't want to give up"
                hint="Chatita will never tell you to stop eating these"
                placeholder="e.g. tamales, biryani, pozole, fufu..."
                value={profile.foodsToKeep}
                onChange={(v) => set('foodsToKeep', v)}
              />

              {/* Dietary restrictions */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'rgba(22,24,42,0.7)', marginBottom: 8 }}>Dietary needs or restrictions</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {DIETARY_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        const curr = profile.dietaryRestrictions;
                        set('dietaryRestrictions', curr.includes(opt) ? curr.filter((x) => x !== opt) : [...curr, opt]);
                      }}
                      style={{
                        padding: '6px 13px',
                        borderRadius: 99,
                        fontSize: 13,
                        border: profile.dietaryRestrictions.includes(opt) ? '1.5px solid #012374' : '1.5px solid rgba(22,24,42,0.18)',
                        background: profile.dietaryRestrictions.includes(opt) ? '#012374' : 'transparent',
                        color: profile.dietaryRestrictions.includes(opt) ? '#FFFDF9' : 'rgba(22,24,42,0.7)',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Religious / cultural food needs */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'rgba(22,24,42,0.7)', marginBottom: 5 }}>
                  Religious or cultural food needs <span style={{ fontWeight: 400, color: 'rgba(22,24,42,0.45)' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={profile.religiousFoodNeeds}
                  onChange={(e) => set('religiousFoodNeeds', e.target.value)}
                  placeholder="e.g. no pork, Ramadan fasting, specific preparation rules"
                  style={inputStyle}
                />
              </div>

              {/* Food access */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'rgba(22,24,42,0.7)', marginBottom: 8 }}>How do you usually get food?</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {FOOD_ACCESS_OPTIONS.map((opt) => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="foodAccess"
                        value={opt.value}
                        checked={profile.foodAccessContext === opt.value}
                        onChange={() => set('foodAccessContext', opt.value)}
                        style={{ accentColor: '#012374', width: 15, height: 15 }}
                      />
                      <span style={{ fontSize: 13.5, color: '#16182A' }}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Cooking frequency */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'rgba(22,24,42,0.7)', marginBottom: 8 }}>How often do you cook at home?</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {COOKING_OPTIONS.map((opt) => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="cookingFreq"
                        value={opt.value}
                        checked={profile.cookingFrequency === opt.value}
                        onChange={() => set('cookingFrequency', opt.value)}
                        style={{ accentColor: '#012374', width: 15, height: 15 }}
                      />
                      <span style={{ fontSize: 13.5, color: '#16182A' }}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Food pantry */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={profile.foodPantryUse}
                  onChange={(e) => set('foodPantryUse', e.target.checked)}
                  style={{ accentColor: '#012374', width: 15, height: 15 }}
                />
                <span style={{ fontSize: 13.5, color: '#16182A' }}>I sometimes use a food pantry or community food resource</span>
              </label>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  borderRadius: 14,
                  background: saved ? '#1C7A4F' : '#012374',
                  color: '#FFFDF9',
                  border: 'none',
                  padding: '13px 20px',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                  transition: 'background 0.2s',
                }}
              >
                {saved ? (
                  <><Check size={16} /> Saved</>
                ) : saving ? (
                  'Saving…'
                ) : (
                  <><Save size={16} /> Save food profile</>
                )}
              </button>

              <p style={{ fontSize: 11.5, color: 'rgba(22,24,42,0.4)', lineHeight: 1.5, textAlign: 'center' }}>
                This information is private and only used to personalize your Chatita experience.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
