'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function ProfileSetupPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    diabetesType: '',
    targetGlucoseMin: 70,
    targetGlucoseMax: 180,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      router.push('/home');
    } catch (err) {
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
            <div className="bg-red-50 text-danger p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-card shadow-card p-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Your Name
              </label>
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
              <label htmlFor="diabetesType" className="block text-sm font-medium mb-2">
                Diabetes Type
              </label>
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
              <label className="block text-sm font-medium mb-2">
                Target Glucose Range (mg/dL)
              </label>
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <input
                    type="number"
                    value={formData.targetGlucoseMin}
                    onChange={(e) => setFormData({ ...formData, targetGlucoseMin: parseInt(e.target.value) })}
                    min={50}
                    max={200}
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
                    min={50}
                    max={300}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Max"
                  />
                  <p className="text-xs text-gray-500 mt-1">High</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Default: 70-180 mg/dL (consult your doctor for your target range)
              </p>
            </div>
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
