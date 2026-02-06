'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface MealTypeData {
  mealType: string;
  averageGlucose: number;
  count: number;
}

interface MealComparisonChartProps {
  data: MealTypeData[];
  targetMax?: number;
}

export default function MealComparisonChart({
  data,
  targetMax = 180
}: MealComparisonChartProps) {
  // Sort by meal time order
  const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
  const sortedData = data.sort((a, b) => {
    const indexA = mealOrder.indexOf(a.mealType.toLowerCase());
    const indexB = mealOrder.indexOf(b.mealType.toLowerCase());
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isHigh = data.averageGlucose > targetMax;

      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold mb-1 capitalize">{data.mealType}</p>
          <p className={`text-lg font-bold ${isHigh ? 'text-warning' : 'text-primary'}`}>
            {Math.round(data.averageGlucose)} mg/dL
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {data.count} reading{data.count > 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  // Get bar color based on average glucose
  const getBarColor = (value: number) => {
    if (value > targetMax) return '#F5A623'; // warning
    if (value > targetMax * 0.9) return '#4A90E2'; // primary
    return '#7ED321'; // success
  };

  if (sortedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No meal comparison data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sortedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="mealType"
            stroke="#6B7280"
            style={{ fontSize: '12px', textTransform: 'capitalize' }}
            tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
          />
          <YAxis
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Avg Glucose (mg/dL)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
          />
          <Tooltip content={<CustomTooltip />} />

          <ReferenceLine
            y={targetMax}
            stroke="#F5A623"
            strokeDasharray="3 3"
            label={{ value: 'Target', position: 'right', fill: '#F5A623', fontSize: 10 }}
          />

          <Bar
            dataKey="averageGlucose"
            radius={[8, 8, 0, 0]}
          >
            {sortedData.map((entry, index) => (
              <rect key={`cell-${index}`} fill={getBarColor(entry.averageGlucose)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
