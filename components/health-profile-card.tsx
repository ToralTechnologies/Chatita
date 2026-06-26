'use client';

import { useState, useEffect } from 'react';
import { User, Loader2, Check, Pencil, X } from 'lucide-react';

interface HealthProfile {
  name?: string;
  diabetesType?: string;
  targetGlucoseMin?: number;
  targetGlucoseMax?: number;
  age?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
  activityLevel?: string | null;
  weightGoal?: string | null;
  otherConditions?: string[];
  currentMedications?: string[];
  dailyCalorieTarget?: number | null;
  dailyCarbTarget?: number | null;
  mealsPerDay?: number | null;
}

const DIABETES_TYPES = ['Type1', 'Type2', 'Gestational', 'PreDiabetes', 'Other'];
const ACTIVITY_LEVELS = [
  { value: 'mostly_sitting', label: 'Mostly sitting (desk job, limited movement)' },
  { value: 'lightly_active', label: 'Lightly active (some walking, light chores)' },
  { value: 'moderately_active', label: 'Moderately active (regular movement most days)' },
  { value: 'very_active', label: 'Very active (intense or daily movement)' },
  { value: 'not_sure', label: 'Not sure' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  // legacy values — shown if stored in DB
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light activity' },
  { value: 'moderate', label: 'Moderate activity' },
  { value: 'active', label: 'Active' },
];
const WEIGHT_GOALS = [
  { value: 'lose', label: 'Lose weight' },
  { value: 'maintain', label: 'Maintain weight' },
  { value: 'gain', label: 'Gain weight' },
];
const CONDITIONS = [
  { value: 'heart_disease', label: 'Heart disease' },
  { value: 'kidney_disease', label: 'Kidney disease' },
  { value: 'hypertension', label: 'Hypertension' },
];

function ProfileSummary({ profile }: { profile: HealthProfile }) {
  const hasAny = profile.diabetesType || profile.age || profile.activityLevel ||
    profile.weightGoal || profile.dailyCalorieTarget || profile.dailyCarbTarget;

  if (!hasAny) {
    return (
      <p className="text-sm text-gray-secondary">
        No health profile set. Add your information so Chatita can give you personalized guidance.
      </p>
    );
  }

  return (
    <div className="space-y-1 text-sm text-gray-700">
      {profile.diabetesType && <p>Diabetes type: <span className="font-medium">{profile.diabetesType}</span></p>}
      {profile.targetGlucoseMin && profile.targetGlucoseMax && (
        <p>Glucose target: <span className="font-medium">{profile.targetGlucoseMin}–{profile.targetGlucoseMax} mg/dL</span></p>
      )}
      {profile.age && <p>Age: <span className="font-medium">{profile.age}</span></p>}
      {profile.activityLevel && (
        <p>Activity: <span className="font-medium">{ACTIVITY_LEVELS.find(a => a.value === profile.activityLevel)?.label ?? profile.activityLevel}</span></p>
      )}
      {profile.weightGoal && (
        <p>Goal: <span className="font-medium">{WEIGHT_GOALS.find(g => g.value === profile.weightGoal)?.label ?? profile.weightGoal}</span></p>
      )}
      {(profile.otherConditions?.length ?? 0) > 0 && (
        <p>Conditions: <span className="font-medium">{profile.otherConditions!.map(c => CONDITIONS.find(x => x.value === c)?.label ?? c).join(', ')}</span></p>
      )}
      {(profile.currentMedications?.length ?? 0) > 0 && (
        <p>Medications: <span className="font-medium">{profile.currentMedications!.join(', ')}</span></p>
      )}
      {profile.dailyCalorieTarget && <p>Calorie target: <span className="font-medium">{profile.dailyCalorieTarget} cal/day</span></p>}
      {profile.dailyCarbTarget && <p>Carb target: <span className="font-medium">{profile.dailyCarbTarget}g/day</span></p>}
      {profile.mealsPerDay && <p>Meals per day: <span className="font-medium">{profile.mealsPerDay}</span></p>}
    </div>
  );
}

export default function HealthProfileCard() {
  const [profile, setProfile] = useState<HealthProfile>({});
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<HealthProfile>({});
  const [medInput, setMedInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setProfile(data.user);
          setForm(data.user);
          setMedInput((data.user.currentMedications ?? []).join(', '));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const startEdit = () => {
    setForm({ ...profile });
    setMedInput((profile.currentMedications ?? []).join(', '));
    setEditing(true);
    setSaved(false);
  };

  const cancel = () => {
    setForm({ ...profile });
    setEditing(false);
  };

  const toggleCondition = (val: string) => {
    const current = form.otherConditions ?? [];
    setForm(f => ({
      ...f,
      otherConditions: current.includes(val)
        ? current.filter(c => c !== val)
        : [...current, val],
    }));
  };

  const save = async () => {
    setSaving(true);
    const meds = medInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const payload = { ...form, currentMedications: meds };

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setMedInput((data.user.currentMedications ?? []).join(', '));
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className="flex items-center gap-2 text-sm p-5"
        style={{
          background: 'var(--bg-card)',
          borderRadius: '22px',
          border: '1px solid var(--border-card)',
          boxShadow: '0 12px 28px -10px rgba(1,35,116,0.22)',
          color: 'var(--text-muted)',
        }}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading health profile…
      </div>
    );
  }

  return (
    <div
      className="p-5"
      style={{
        background: 'var(--bg-card)',
        borderRadius: '22px',
        border: '1px solid var(--border-card)',
        boxShadow: '0 12px 28px -10px rgba(1,35,116,0.22)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" style={{ color: '#012374' }} />
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: 'var(--text-muted)' }}
          >
            Health Profile
          </p>
        </div>
        {!editing && (
          <button
            onClick={startEdit}
            className="flex items-center gap-1 text-xs font-semibold transition-all"
            style={{ color: '#012374' }}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        )}
        {saved && (
          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#4A8C00' }}>
            <Check className="w-3.5 h-3.5" /> Saved
          </span>
        )}
      </div>

      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        Your profile helps Chatita give you personalized guidance based on your goals and health context.
      </p>

      {!editing ? (
        <ProfileSummary profile={profile} />
      ) : (
        <div className="space-y-5">

          {/* Diabetes */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] mb-2" style={{ color: 'var(--text-muted)' }}>Diabetes</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Diabetes type</label>
                <select
                  value={form.diabetesType ?? ''}
                  onChange={e => setForm(f => ({ ...f, diabetesType: e.target.value || undefined }))}
                  className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" style={{ borderRadius: '10px', border: '1px solid rgba(1,35,116,0.15)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                >
                  <option value="">— Select —</option>
                  {DIABETES_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div />
              <div>
                <label className="block text-sm font-medium mb-1">Min glucose target (mg/dL)</label>
                <input
                  type="number"
                  value={form.targetGlucoseMin ?? ''}
                  onChange={e => setForm(f => ({ ...f, targetGlucoseMin: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" style={{ borderRadius: '10px', border: '1px solid rgba(1,35,116,0.15)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                  placeholder="70"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max glucose target (mg/dL)</label>
                <input
                  type="number"
                  value={form.targetGlucoseMax ?? ''}
                  onChange={e => setForm(f => ({ ...f, targetGlucoseMax: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" style={{ borderRadius: '10px', border: '1px solid rgba(1,35,116,0.15)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                  placeholder="180"
                />
              </div>
            </div>
          </div>

          {/* Personal */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] mb-2" style={{ color: 'var(--text-muted)' }}>Personal details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Age</label>
                <input
                  type="number"
                  value={form.age ?? ''}
                  onChange={e => setForm(f => ({ ...f, age: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" style={{ borderRadius: '10px', border: '1px solid rgba(1,35,116,0.15)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                  placeholder="e.g. 42"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={form.heightCm ?? ''}
                  onChange={e => setForm(f => ({ ...f, heightCm: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" style={{ borderRadius: '10px', border: '1px solid rgba(1,35,116,0.15)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                  placeholder="e.g. 165"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={form.weightKg ?? ''}
                  onChange={e => setForm(f => ({ ...f, weightKg: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" style={{ borderRadius: '10px', border: '1px solid rgba(1,35,116,0.15)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                  placeholder="e.g. 70"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Weight goal</label>
                <select
                  value={form.weightGoal ?? ''}
                  onChange={e => setForm(f => ({ ...f, weightGoal: e.target.value || null }))}
                  className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" style={{ borderRadius: '10px', border: '1px solid rgba(1,35,116,0.15)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                >
                  <option value="">— Select —</option>
                  {WEIGHT_GOALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">Activity level</label>
              <select
                value={form.activityLevel ?? ''}
                onChange={e => setForm(f => ({ ...f, activityLevel: e.target.value || null }))}
                className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" style={{ borderRadius: '10px', border: '1px solid rgba(1,35,116,0.15)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
              >
                <option value="">— Select —</option>
                {ACTIVITY_LEVELS.filter(a => !['sedentary','light','moderate','active'].includes(a.value)).map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
          </div>

          {/* Medical context */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] mb-2" style={{ color: 'var(--text-muted)' }}>Medical context</p>
            <div className="space-y-2 mb-3">
              {CONDITIONS.map(c => (
                <label key={c.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(form.otherConditions ?? []).includes(c.value)}
                    onChange={() => toggleCondition(c.value)}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-sm">{c.label}</span>
                </label>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Current medications</label>
              <input
                type="text"
                value={medInput}
                onChange={e => setMedInput(e.target.value)}
                className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" style={{ borderRadius: '10px', border: '1px solid rgba(1,35,116,0.15)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                placeholder="e.g. Metformin, Insulin glargine"
              />
              <p className="text-xs text-gray-secondary mt-1">Separate multiple medications with commas.</p>
            </div>
          </div>

          {/* Nutrition goals */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] mb-2" style={{ color: 'var(--text-muted)' }}>Nutrition goals</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Daily calorie target</label>
                <input
                  type="number"
                  value={form.dailyCalorieTarget ?? ''}
                  onChange={e => setForm(f => ({ ...f, dailyCalorieTarget: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" style={{ borderRadius: '10px', border: '1px solid rgba(1,35,116,0.15)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                  placeholder="e.g. 1800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Daily carb target (g)</label>
                <input
                  type="number"
                  value={form.dailyCarbTarget ?? ''}
                  onChange={e => setForm(f => ({ ...f, dailyCarbTarget: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" style={{ borderRadius: '10px', border: '1px solid rgba(1,35,116,0.15)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                  placeholder="e.g. 150"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Meals per day</label>
                <select
                  value={form.mealsPerDay ?? ''}
                  onChange={e => setForm(f => ({ ...f, mealsPerDay: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" style={{ borderRadius: '10px', border: '1px solid rgba(1,35,116,0.15)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                >
                  <option value="">— Select —</option>
                  {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} meals</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50"
              style={{
                borderRadius: '12px',
                background: '#012374',
                color: '#FFFDF9',
                boxShadow: '0 10px 22px -10px rgba(1,35,116,0.5)',
              }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={cancel}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all"
              style={{
                borderRadius: '12px',
                border: '1px solid rgba(1,35,116,0.2)',
                background: 'transparent',
                color: 'var(--text-primary)',
              }}
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
