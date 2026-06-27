'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const MOVEMENT_TYPES = [
  { value: 'walking', label: 'Walking' },
  { value: 'chores', label: 'Chores / housework' },
  { value: 'dancing', label: 'Dancing' },
  { value: 'gym', label: 'Gym / workout' },
  { value: 'strength_training', label: 'Strength training' },
  { value: 'sports', label: 'Sports' },
  { value: 'physical_work', label: 'Physical job / manual labor' },
  { value: 'chair_exercises', label: 'Chair exercises' },
  { value: 'stretching_yoga', label: 'Stretching / yoga' },
  { value: 'biking', label: 'Biking' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'not_active_right_now', label: 'Not currently active' },
  { value: 'other', label: 'Other' },
];

const ACTIVITY_LEVEL_OPTIONS = [
  { value: 'mostly_sitting', label: 'Mostly sitting (desk job, limited movement)' },
  { value: 'lightly_active', label: 'Lightly active (some walking, light chores)' },
  { value: 'moderately_active', label: 'Moderately active (regular movement most days)' },
  { value: 'very_active', label: 'Very active (intense or daily movement)' },
  { value: 'not_sure', label: 'Not sure' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const MOVEMENT_GOAL_OPTIONS = [
  { value: 'more_energy', label: 'More energy throughout the day' },
  { value: 'manage_glucose', label: 'Help manage glucose levels' },
  { value: 'lose_weight', label: 'Support weight goals' },
  { value: 'feel_better', label: 'Just feel better overall' },
  { value: 'other', label: 'Other' },
];

const CYCLE_TRACKING_OPTIONS = [
  { value: 'yes', label: "Yes — I'd like to track this" },
  { value: 'maybe', label: 'Maybe later' },
  { value: 'no', label: 'No' },
  { value: 'not_relevant', label: 'Not relevant to me' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

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
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
  };

  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#001A4D' }}>{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          style={{ flex: 1, padding: '9px 14px', borderRadius: '10px', border: '1px solid rgba(1,35,116,0.15)', background: '#F7EFE1', fontSize: '13px', color: '#001A4D', outline: 'none' }}
        />
        <button
          type="button"
          onClick={add}
          style={{ padding: '9px 16px', borderRadius: '10px', background: '#012374', color: '#FFFDF9', fontSize: '13px', fontWeight: 600 }}
        >
          Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
              style={{ background: 'rgba(1,35,116,0.08)', color: '#012374' }}
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tag))}
                style={{ color: '#E3171A' }}
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid rgba(1,35,116,0.15)',
  background: '#F7EFE1',
  fontSize: '14px',
  color: '#001A4D',
  outline: 'none',
};

const inputLg: React.CSSProperties = {
  ...inputStyle,
  padding: '10px 16px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  marginBottom: '6px',
  color: '#001A4D',
};

const muted: React.CSSProperties = { color: 'rgba(1,35,116,0.5)', fontSize: '12px' };

const cardStyle: React.CSSProperties = {
  background: '#FFFDF9',
  borderRadius: '22px',
  border: '1px solid rgba(1,35,116,0.07)',
  boxShadow: '0 14px 30px -24px rgba(1,35,116,0.2)',
  padding: '24px',
};

export default function ProfileSetupPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSleepBody, setShowSleepBody] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [showCultural, setShowCultural] = useState(false);

  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    diabetesType: '',
    targetGlucoseMin: 70,
    targetGlucoseMax: 180,
  });

  const [sleepBody, setSleepBody] = useState({
    sleepGoalHours: '',
    typicalBedtime: '',
    typicalWakeTime: '',
    sleepTrackingNotes: '',
    cycleTrackingChoice: '',  // 'yes'|'maybe'|'no'|'not_relevant'|'prefer_not_to_say'
    typicalCycleLength: '',
    typicalPeriodLength: '',
    cycleTrackingNotes: '',
  });

  const setSB = (k: keyof typeof sleepBody, v: string) => setSleepBody((s) => ({ ...s, [k]: v }));

  const [movement, setMovement] = useState({
    activityLevel: '',
    preferredMovementTypes: [] as string[],
    movementGoal: '',
    hasPhysicalJob: false,
    mobilityLimitations: '',
  });

  const setMov = (k: keyof typeof movement, v: unknown) => setMovement((m) => ({ ...m, [k]: v }));

  const [cultural, setCultural] = useState({
    countryOrRegion: '',
    culturalFoodBackground: '',
    stapleCarbs: [] as string[],
    commonProteins: [] as string[],
    commonVegetables: [] as string[],
    commonDrinks: [] as string[],
    dietaryRestrictions: [] as string[],
    religiousFoodNeeds: '',
    foodBudgetLevel: '',
    foodAccessContext: '',
    cookingFrequency: '',
    foodPantryUse: false,
    comfortFoods: [] as string[],
    foodsToKeep: [] as string[],
  });

  const set = (k: keyof typeof cultural, v: unknown) => setCultural((c) => ({ ...c, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        ...formData,
      };

      if (showSleepBody) {
        const wantsCycleTracking = sleepBody.cycleTrackingChoice === 'yes';
        Object.assign(payload, {
          tracksSleep: true,
          sleepGoalHours: sleepBody.sleepGoalHours ? Number(sleepBody.sleepGoalHours) : undefined,
          typicalBedtime: sleepBody.typicalBedtime || undefined,
          typicalWakeTime: sleepBody.typicalWakeTime || undefined,
          sleepTrackingNotes: sleepBody.sleepTrackingNotes || undefined,
          tracksMenstrualCycle: wantsCycleTracking,
          typicalCycleLength: wantsCycleTracking && sleepBody.typicalCycleLength ? Number(sleepBody.typicalCycleLength) : undefined,
          typicalPeriodLength: wantsCycleTracking && sleepBody.typicalPeriodLength ? Number(sleepBody.typicalPeriodLength) : undefined,
          cycleTrackingNotes: wantsCycleTracking && sleepBody.cycleTrackingNotes ? sleepBody.cycleTrackingNotes : undefined,
        });
      }

      if (showMovement) {
        Object.assign(payload, {
          activityLevel: movement.activityLevel || undefined,
          preferredMovementTypes: movement.preferredMovementTypes.length ? movement.preferredMovementTypes : undefined,
          movementGoal: movement.movementGoal || undefined,
          hasPhysicalJob: movement.hasPhysicalJob,
          mobilityLimitations: movement.mobilityLimitations || undefined,
        });
      }

      if (showCultural) {
        Object.assign(payload, {
          countryOrRegion: cultural.countryOrRegion || undefined,
          culturalFoodBackground: cultural.culturalFoodBackground || undefined,
          stapleCarbs: cultural.stapleCarbs.length ? cultural.stapleCarbs : undefined,
          commonProteins: cultural.commonProteins.length ? cultural.commonProteins : undefined,
          commonVegetables: cultural.commonVegetables.length ? cultural.commonVegetables : undefined,
          commonDrinks: cultural.commonDrinks.length ? cultural.commonDrinks : undefined,
          dietaryRestrictions: cultural.dietaryRestrictions.length ? cultural.dietaryRestrictions : undefined,
          religiousFoodNeeds: cultural.religiousFoodNeeds || undefined,
          foodBudgetLevel: cultural.foodBudgetLevel || undefined,
          foodAccessContext: cultural.foodAccessContext || undefined,
          cookingFrequency: cultural.cookingFrequency || undefined,
          foodPantryUse: cultural.foodPantryUse,
          comfortFoods: cultural.comfortFoods.length ? cultural.comfortFoods : undefined,
          foodsToKeep: cultural.foodsToKeep.length ? cultural.foodsToKeep : undefined,
        });
      }

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to update profile');
      router.push('/home');
    } catch {
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6" style={{ background: '#F7EFE1' }}>
      <div className="flex-1 w-full max-w-md pt-8">
        <h1
          className="font-serif-italic text-center mb-2"
          style={{ fontSize: '2rem', color: '#012374' }}
        >
          Get to Know You
        </h1>
        <p className="text-center mb-8" style={{ color: 'rgba(1,35,116,0.55)' }}>
          Help us personalize your experience
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div
              className="text-sm p-3 rounded-[12px]"
              style={{ background: 'rgba(208,2,27,0.08)', color: '#D0021B', border: '1px solid rgba(208,2,27,0.2)' }}
            >
              {error}
            </div>
          )}

          {/* Basic profile */}
          <div style={cardStyle} className="space-y-4">
            <div>
              <label htmlFor="name" style={labelStyle}>Your Name</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputLg}
                placeholder="What should we call you?"
              />
            </div>

            <div>
              <label htmlFor="diabetesType" style={labelStyle}>Diabetes Type</label>
              <select
                id="diabetesType"
                value={formData.diabetesType}
                onChange={(e) => setFormData({ ...formData, diabetesType: e.target.value })}
                required
                style={inputLg}
              >
                <option value="">Select type</option>
                <option value="Type1">Type 1</option>
                <option value="Type2">Type 2</option>
                <option value="Gestational">Gestational</option>
                <option value="PreDiabetes">Pre-diabetes</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Target Glucose Range (mg/dL)</label>
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <input
                    type="number"
                    value={formData.targetGlucoseMin}
                    onChange={(e) => setFormData({ ...formData, targetGlucoseMin: parseInt(e.target.value) })}
                    min={50} max={200}
                    style={inputLg}
                    placeholder="Min"
                  />
                  <p className="text-xs mt-1" style={muted}>Low</p>
                </div>
                <span style={{ color: 'rgba(1,35,116,0.3)' }}>—</span>
                <div className="flex-1">
                  <input
                    type="number"
                    value={formData.targetGlucoseMax}
                    onChange={(e) => setFormData({ ...formData, targetGlucoseMax: parseInt(e.target.value) })}
                    min={50} max={300}
                    style={inputLg}
                    placeholder="Max"
                  />
                  <p className="text-xs mt-1" style={muted}>High</p>
                </div>
              </div>
              <p className="text-xs mt-2" style={muted}>
                Default: 70–180 mg/dL (consult your doctor for your personal target)
              </p>
            </div>
          </div>

          {/* Sleep & Body Patterns section */}
          <div style={cardStyle}>
            <button
              type="button"
              onClick={() => setShowSleepBody((v) => !v)}
              className="w-full flex items-center justify-between"
            >
              <div className="text-left">
                <p className="font-medium text-sm" style={{ color: '#001A4D' }}>Sleep & Body Patterns</p>
                <p className="text-xs mt-0.5" style={muted}>Optional — helps Chatita understand the full picture</p>
              </div>
              <span className="text-sm font-medium" style={{ color: '#012374' }}>{showSleepBody ? 'Hide ▲' : 'Add ▼'}</span>
            </button>

            {showSleepBody && (
              <div className="mt-5 space-y-5 pt-5" style={{ borderTop: '1px solid rgba(1,35,116,0.07)' }}>
                <p className="text-xs leading-relaxed" style={muted}>
                  Sleep can affect hunger, cravings, energy, mood, stress, and glucose patterns. This helps Chatita understand the full picture.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={labelStyle}>Sleep goal <span style={muted}>(hours/night)</span></label>
                    <input
                      type="number" min={3} max={14} step={0.5}
                      value={sleepBody.sleepGoalHours}
                      onChange={(e) => setSB('sleepGoalHours', e.target.value)}
                      placeholder="e.g. 7.5"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={labelStyle}>Typical bedtime</label>
                    <input type="time" value={sleepBody.typicalBedtime} onChange={(e) => setSB('typicalBedtime', e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Typical wake time</label>
                    <input type="time" value={sleepBody.typicalWakeTime} onChange={(e) => setSB('typicalWakeTime', e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Sleep notes <span style={muted}>(optional)</span></label>
                  <textarea
                    value={sleepBody.sleepTrackingNotes}
                    onChange={(e) => setSB('sleepTrackingNotes', e.target.value)}
                    placeholder="e.g. trouble falling asleep, frequent wakeups..."
                    rows={2}
                    style={{ ...inputStyle, resize: 'none' }}
                  />
                </div>

                <div style={{ borderTop: '1px solid rgba(1,35,116,0.07)', paddingTop: '16px' }}>
                  <p className="text-sm font-medium mb-1" style={{ color: '#001A4D' }}>Menstrual cycle tracking, if relevant to you</p>
                  <p className="text-xs mb-3 leading-relaxed" style={muted}>
                    Some people notice changes in appetite, mood, energy, cravings, or glucose patterns around their cycle. This is optional and only used to personalize your insights.
                  </p>
                  <div className="space-y-2">
                    {CYCLE_TRACKING_OPTIONS.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio" name="cycleTracking" value={opt.value}
                          checked={sleepBody.cycleTrackingChoice === opt.value}
                          onChange={() => setSB('cycleTrackingChoice', opt.value)}
                        />
                        <span className="text-sm" style={{ color: '#001A4D' }}>{opt.label}</span>
                      </label>
                    ))}
                  </div>

                  {sleepBody.cycleTrackingChoice === 'yes' && (
                    <div className="mt-4 space-y-3 pl-4" style={{ borderLeft: '2px solid rgba(1,35,116,0.18)' }}>
                      <p className="text-xs" style={muted}>All fields optional.</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label style={labelStyle}>Cycle length <span style={muted}>(days)</span></label>
                          <input type="number" min={15} max={60} value={sleepBody.typicalCycleLength} onChange={(e) => setSB('typicalCycleLength', e.target.value)} placeholder="e.g. 28" style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Period length <span style={muted}>(days)</span></label>
                          <input type="number" min={1} max={14} value={sleepBody.typicalPeriodLength} onChange={(e) => setSB('typicalPeriodLength', e.target.value)} placeholder="e.g. 5" style={inputStyle} />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Cycle pattern notes <span style={muted}>(optional)</span></label>
                        <textarea
                          value={sleepBody.cycleTrackingNotes}
                          onChange={(e) => setSB('cycleTrackingNotes', e.target.value)}
                          placeholder="e.g. glucose tends to run higher before period..."
                          rows={2}
                          style={{ ...inputStyle, resize: 'none' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Movement & Activity section */}
          <div style={cardStyle}>
            <button
              type="button"
              onClick={() => setShowMovement((v) => !v)}
              className="w-full flex items-center justify-between"
            >
              <div className="text-left">
                <p className="font-medium text-sm" style={{ color: '#001A4D' }}>Movement & Activity</p>
                <p className="text-xs mt-0.5" style={muted}>Optional — helps Chatita understand your movement context</p>
              </div>
              <span className="text-sm font-medium" style={{ color: '#012374' }}>{showMovement ? 'Hide ▲' : 'Add ▼'}</span>
            </button>

            {showMovement && (
              <div className="mt-5 space-y-5 pt-5" style={{ borderTop: '1px solid rgba(1,35,116,0.07)' }}>
                <p className="text-xs leading-relaxed" style={muted}>
                  All fields are optional and private. This helps Chatita give context-aware, non-judgmental guidance. You don&apos;t need to exercise — movement means anything that gets you moving.
                </p>

                <div>
                  <label style={labelStyle}>How would you describe your general activity? <span style={muted}>(optional)</span></label>
                  <select value={movement.activityLevel} onChange={(e) => setMov('activityLevel', e.target.value)} style={inputStyle}>
                    <option value="">— Not sure / skip —</option>
                    {ACTIVITY_LEVEL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Types of movement you do <span style={muted}>(select all that apply)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {MOVEMENT_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => {
                          const curr = movement.preferredMovementTypes;
                          setMov('preferredMovementTypes', curr.includes(t.value)
                            ? curr.filter((v) => v !== t.value)
                            : [...curr, t.value]);
                        }}
                        className="px-3 py-1.5 rounded-full text-xs transition-colors"
                        style={{
                          border: movement.preferredMovementTypes.includes(t.value) ? '1px solid #012374' : '1px solid rgba(1,35,116,0.2)',
                          background: movement.preferredMovementTypes.includes(t.value) ? '#012374' : '#FFFDF9',
                          color: movement.preferredMovementTypes.includes(t.value) ? '#FFFDF9' : '#001A4D',
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>What would movement support look like for you? <span style={muted}>(optional)</span></label>
                  <select value={movement.movementGoal} onChange={(e) => setMov('movementGoal', e.target.value)} style={inputStyle}>
                    <option value="">— Skip —</option>
                    {MOVEMENT_GOAL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={movement.hasPhysicalJob} onChange={(e) => setMov('hasPhysicalJob', e.target.checked)} className="mt-0.5" />
                  <span className="text-sm" style={{ color: '#001A4D' }}>My job or daily routine already involves physical activity (e.g. standing, lifting, moving)</span>
                </label>

                <div>
                  <label style={labelStyle}>Any mobility limitations or physical considerations? <span style={muted}>(optional)</span></label>
                  <textarea
                    value={movement.mobilityLimitations}
                    onChange={(e) => setMov('mobilityLimitations', e.target.value)}
                    placeholder="e.g. knee pain, back injury, limited stamina..."
                    rows={2}
                    style={{ ...inputStyle, resize: 'none' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cultural Food Profile toggle */}
          <div style={cardStyle}>
            <button
              type="button"
              onClick={() => setShowCultural((v) => !v)}
              className="w-full flex items-center justify-between"
            >
              <div className="text-left">
                <p className="font-medium text-sm" style={{ color: '#001A4D' }}>Cultural Food Profile</p>
                <p className="text-xs mt-0.5" style={muted}>Optional — helps Chatita give relevant food guidance</p>
              </div>
              <span className="text-sm font-medium" style={{ color: '#012374' }}>{showCultural ? 'Hide ▲' : 'Add ▼'}</span>
            </button>

            {showCultural && (
              <div className="mt-5 space-y-5 pt-5" style={{ borderTop: '1px solid rgba(1,35,116,0.07)' }}>
                <p className="text-xs leading-relaxed" style={muted}>
                  All fields are optional. This helps Chatita understand your everyday foods so guidance fits your actual life — not generic American food assumptions.
                </p>

                <div>
                  <label style={labelStyle}>Country or Region</label>
                  <input type="text" value={cultural.countryOrRegion} onChange={(e) => set('countryOrRegion', e.target.value)} placeholder="e.g. Mexico, India, Nigeria, Philippines" style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>How would you describe your food background? <span style={muted}>(optional)</span></label>
                  <textarea
                    value={cultural.culturalFoodBackground}
                    onChange={(e) => set('culturalFoodBackground', e.target.value)}
                    rows={3}
                    placeholder="e.g. I grew up eating rice and beans daily, lots of tortillas, tamales on weekends..."
                    style={{ ...inputStyle, resize: 'none' }}
                  />
                </div>

                <TagInput label="Staple carbs / starches" placeholder="e.g. tortillas, rice, roti..." value={cultural.stapleCarbs} onChange={(v) => set('stapleCarbs', v)} />
                <TagInput label="Common proteins" placeholder="e.g. beans, chicken, dal, fish..." value={cultural.commonProteins} onChange={(v) => set('commonProteins', v)} />
                <TagInput label="Common vegetables" placeholder="e.g. nopales, spinach, eggplant..." value={cultural.commonVegetables} onChange={(v) => set('commonVegetables', v)} />
                <TagInput label="Common drinks" placeholder="e.g. agua fresca, horchata, tea..." value={cultural.commonDrinks} onChange={(v) => set('commonDrinks', v)} />
                <TagInput label="Foods you don&apos;t want to give up" placeholder="e.g. tamales, biryani, pozole..." value={cultural.foodsToKeep} onChange={(v) => set('foodsToKeep', v)} />

                <div>
                  <label style={{ ...labelStyle, marginBottom: '10px' }}>Dietary needs or restrictions</label>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          const curr = cultural.dietaryRestrictions;
                          set('dietaryRestrictions', curr.includes(opt) ? curr.filter((x) => x !== opt) : [...curr, opt]);
                        }}
                        className="px-3 py-1.5 rounded-full text-sm transition-colors"
                        style={{
                          border: cultural.dietaryRestrictions.includes(opt) ? '1px solid #012374' : '1px solid rgba(1,35,116,0.2)',
                          background: cultural.dietaryRestrictions.includes(opt) ? '#012374' : '#FFFDF9',
                          color: cultural.dietaryRestrictions.includes(opt) ? '#FFFDF9' : '#001A4D',
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Religious or cultural food needs <span style={muted}>(optional)</span></label>
                  <input type="text" value={cultural.religiousFoodNeeds} onChange={(e) => set('religiousFoodNeeds', e.target.value)} placeholder="e.g. no pork, fasting periods, specific preparation rules" style={inputStyle} />
                </div>

                <div>
                  <label style={{ ...labelStyle, marginBottom: '10px' }}>How do you usually get food?</label>
                  <div className="space-y-2">
                    {FOOD_ACCESS_OPTIONS.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                        <input type="radio" name="foodAccess" value={opt.value} checked={cultural.foodAccessContext === opt.value} onChange={() => set('foodAccessContext', opt.value)} className="accent-primary" />
                        <span className="text-sm" style={{ color: '#001A4D' }}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ ...labelStyle, marginBottom: '10px' }}>How often do you cook at home?</label>
                  <div className="space-y-2">
                    {COOKING_OPTIONS.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                        <input type="radio" name="cookingFreq" value={opt.value} checked={cultural.cookingFrequency === opt.value} onChange={() => set('cookingFrequency', opt.value)} className="accent-primary" />
                        <span className="text-sm" style={{ color: '#001A4D' }}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={cultural.foodPantryUse} onChange={(e) => set('foodPantryUse', e.target.checked)} className="accent-primary w-4 h-4" />
                  <span className="text-sm" style={{ color: '#001A4D' }}>I sometimes use a food pantry or community food resource</span>
                </label>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderRadius: '999px',
              background: '#012374',
              color: '#FFFDF9',
              boxShadow: '0 10px 24px -10px rgba(1,35,116,0.5)',
            }}
          >
            {loading ? 'Saving…' : 'Complete Setup'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/home')}
            className="w-full py-3 text-sm transition-colors"
            style={{ color: 'rgba(1,35,116,0.5)' }}
          >
            Skip for now
          </button>
        </form>
      </div>

      <div className="flex justify-center gap-2 pt-4">
        <div style={{ width: '8px', height: '8px', borderRadius: '999px', background: 'rgba(1,35,116,0.18)' }} />
        <div style={{ width: '8px', height: '8px', borderRadius: '999px', background: 'rgba(1,35,116,0.18)' }} />
        <div style={{ width: '8px', height: '8px', borderRadius: '999px', background: '#012374' }} />
      </div>
    </div>
  );
}
