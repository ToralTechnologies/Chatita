'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

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
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark"
        >
          Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tag))}
                className="hover:text-accent"
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

export default function ProfileSetupPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCultural, setShowCultural] = useState(false);

  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    diabetesType: '',
    targetGlucoseMin: 70,
    targetGlucoseMax: 180,
  });

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
    <div className="min-h-screen flex flex-col items-center justify-between bg-gray-background p-6">
      <div className="flex-1 w-full max-w-md pt-8">
        <h1 className="text-3xl font-bold text-center mb-2">Get to Know You</h1>
        <p className="text-gray-600 text-center mb-8">
          Help us personalize your experience
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-danger p-3 rounded-lg text-sm">{error}</div>
          )}

          {/* Basic profile */}
          <div className="bg-white rounded-card shadow-card p-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">Your Name</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="What should we call you?"
              />
            </div>

            <div>
              <label htmlFor="diabetesType" className="block text-sm font-medium mb-2">Diabetes Type</label>
              <select
                id="diabetesType"
                value={formData.diabetesType}
                onChange={(e) => setFormData({ ...formData, diabetesType: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
              <label className="block text-sm font-medium mb-2">Target Glucose Range (mg/dL)</label>
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <input
                    type="number"
                    value={formData.targetGlucoseMin}
                    onChange={(e) => setFormData({ ...formData, targetGlucoseMin: parseInt(e.target.value) })}
                    min={50} max={200}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Min"
                  />
                  <p className="text-xs text-gray-500 mt-1">Low</p>
                </div>
                <span className="text-gray-400">—</span>
                <div className="flex-1">
                  <input
                    type="number"
                    value={formData.targetGlucoseMax}
                    onChange={(e) => setFormData({ ...formData, targetGlucoseMax: parseInt(e.target.value) })}
                    min={50} max={300}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Max"
                  />
                  <p className="text-xs text-gray-500 mt-1">High</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Default: 70–180 mg/dL (consult your doctor for your personal target)
              </p>
            </div>
          </div>

          {/* Cultural Food Profile toggle */}
          <div className="bg-white rounded-card shadow-card p-6">
            <button
              type="button"
              onClick={() => setShowCultural((v) => !v)}
              className="w-full flex items-center justify-between"
            >
              <div className="text-left">
                <p className="font-medium text-sm">Cultural Food Profile</p>
                <p className="text-xs text-gray-500 mt-0.5">Optional — helps Chatita give relevant food guidance</p>
              </div>
              <span className="text-primary text-sm">{showCultural ? 'Hide ▲' : 'Add ▼'}</span>
            </button>

            {showCultural && (
              <div className="mt-5 space-y-5 border-t border-gray-100 pt-5">
                <p className="text-xs text-gray-500 leading-relaxed">
                  All fields are optional. This helps Chatita understand your everyday foods so guidance fits your actual life — not generic American food assumptions.
                </p>

                <div>
                  <label className="block text-sm font-medium mb-1">Country or Region</label>
                  <input
                    type="text"
                    value={cultural.countryOrRegion}
                    onChange={(e) => set('countryOrRegion', e.target.value)}
                    placeholder="e.g. Mexico, India, Nigeria, Philippines"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">How would you describe your food background? <span className="text-gray-400">(optional)</span></label>
                  <textarea
                    value={cultural.culturalFoodBackground}
                    onChange={(e) => set('culturalFoodBackground', e.target.value)}
                    rows={3}
                    placeholder="e.g. I grew up eating rice and beans daily, lots of tortillas, tamales on weekends..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <TagInput label="Staple carbs / starches" placeholder="e.g. tortillas, rice, roti..." value={cultural.stapleCarbs} onChange={(v) => set('stapleCarbs', v)} />
                <TagInput label="Common proteins" placeholder="e.g. beans, chicken, dal, fish..." value={cultural.commonProteins} onChange={(v) => set('commonProteins', v)} />
                <TagInput label="Common vegetables" placeholder="e.g. nopales, spinach, eggplant..." value={cultural.commonVegetables} onChange={(v) => set('commonVegetables', v)} />
                <TagInput label="Common drinks" placeholder="e.g. agua fresca, horchata, tea..." value={cultural.commonDrinks} onChange={(v) => set('commonDrinks', v)} />
                <TagInput label="Foods you don't want to give up" placeholder="e.g. tamales, biryani, pozole..." value={cultural.foodsToKeep} onChange={(v) => set('foodsToKeep', v)} />

                <div>
                  <label className="block text-sm font-medium mb-2">Dietary needs or restrictions</label>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          const curr = cultural.dietaryRestrictions;
                          set('dietaryRestrictions', curr.includes(opt) ? curr.filter((x) => x !== opt) : [...curr, opt]);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          cultural.dietaryRestrictions.includes(opt)
                            ? 'bg-primary text-white border-primary'
                            : 'border-gray-300 text-gray-700 hover:border-primary'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Religious or cultural food needs <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="text"
                    value={cultural.religiousFoodNeeds}
                    onChange={(e) => set('religiousFoodNeeds', e.target.value)}
                    placeholder="e.g. no pork, fasting periods, specific preparation rules"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">How do you usually get food?</label>
                  <div className="space-y-2">
                    {FOOD_ACCESS_OPTIONS.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="foodAccess"
                          value={opt.value}
                          checked={cultural.foodAccessContext === opt.value}
                          onChange={() => set('foodAccessContext', opt.value)}
                          className="accent-primary"
                        />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">How often do you cook at home?</label>
                  <div className="space-y-2">
                    {COOKING_OPTIONS.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="cookingFreq"
                          value={opt.value}
                          checked={cultural.cookingFrequency === opt.value}
                          onChange={() => set('cookingFrequency', opt.value)}
                          className="accent-primary"
                        />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cultural.foodPantryUse}
                    onChange={(e) => set('foodPantryUse', e.target.checked)}
                    className="accent-primary w-4 h-4"
                  />
                  <span className="text-sm">I sometimes use a food pantry or community food resource</span>
                </label>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-button font-medium text-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Complete Setup'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/home')}
            className="w-full text-gray-600 py-3 text-sm hover:text-gray-800 transition-colors"
          >
            Skip for now
          </button>
        </form>
      </div>

      <div className="flex justify-center gap-2 pt-4">
        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
        <div className="w-2 h-2 rounded-full bg-primary"></div>
      </div>
    </div>
  );
}
