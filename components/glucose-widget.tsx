'use client';

import { useState } from 'react';

interface GlucoseWidgetProps {
  currentValue?: number;
  minRange: number;
  maxRange: number;
  onUpdate?: (value: number) => void;
}

export default function GlucoseWidget({
  currentValue,
  minRange,
  maxRange,
  onUpdate,
}: GlucoseWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(currentValue?.toString() || '');

  const getStatus = (value?: number) => {
    if (!value) return { label: 'No data', color: 'gray' };
    if (value < minRange) return { label: 'Low', color: 'danger' };
    if (value > maxRange) return { label: 'High', color: 'warning' };
    return { label: 'In Range', color: 'success' };
  };

  const status = getStatus(currentValue);

  const handleSave = () => {
    const value = parseFloat(inputValue);
    if (!isNaN(value) && value > 0) {
      onUpdate?.(value);
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-white rounded-card shadow-card p-6">
      <h3 className="text-lg font-semibold mb-4">Today&apos;s Glucose</h3>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Blood Glucose (mg/dL)
            </label>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter value"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setInputValue(currentValue?.toString() || '');
              }}
              className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-center mb-4">
            <div className="text-5xl font-bold text-gray-800 mb-2">
              {currentValue ? `${currentValue}` : '—'}
              <span className="text-2xl text-gray-500 ml-2">mg/dL</span>
            </div>
            <span
              className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${
                status.color === 'success'
                  ? 'bg-green-100 text-success'
                  : status.color === 'danger'
                  ? 'bg-red-100 text-danger'
                  : status.color === 'warning'
                  ? 'bg-yellow-100 text-warning'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {status.label}
            </span>
          </div>

          {/* Range visualization */}
          <div className="mb-4">
            <div className="h-2 bg-gradient-to-r from-danger via-success to-warning rounded-full relative">
              {currentValue && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-800 rounded-full"
                  style={{
                    left: `${Math.min(
                      100,
                      Math.max(0, ((currentValue - 50) / 200) * 100)
                    )}%`,
                  }}
                />
              )}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low</span>
              <span>
                {minRange}-{maxRange} mg/dL
              </span>
              <span>High</span>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="w-full border border-primary text-primary py-2 rounded-lg hover:bg-primary/5 transition-colors"
          >
            {currentValue ? 'Update Reading' : 'Add Reading'}
          </button>
        </>
      )}
    </div>
  );
}
