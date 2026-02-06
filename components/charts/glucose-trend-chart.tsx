'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';

interface GlucoseDataPoint {
  measuredAt: string | Date;
  value: number;
  context?: string;
}

interface GlucoseTrendChartProps {
  data: GlucoseDataPoint[];
  targetMin?: number;
  targetMax?: number;
}

export default function GlucoseTrendChart({
  data,
  targetMin = 70,
  targetMax = 180
}: GlucoseTrendChartProps) {
  // Transform data for chart
  const chartData = data.map((entry) => ({
    date: typeof entry.measuredAt === 'string'
      ? new Date(entry.measuredAt)
      : entry.measuredAt,
    value: entry.value,
    context: entry.context,
  })).sort((a, b) => a.date.getTime() - b.date.getTime());

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold mb-1">
            {format(data.date, 'MMM d, h:mm a')}
          </p>
          <p className="text-lg font-bold text-primary">
            {data.value} mg/dL
          </p>
          {data.context && (
            <p className="text-xs text-gray-500 capitalize mt-1">
              {data.context.replace('-', ' ')}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Get color based on value
  const getPointColor = (value: number) => {
    if (value < targetMin) return '#D0021B'; // danger red
    if (value > targetMax) return '#F5A623'; // warning yellow
    return '#7ED321'; // success green
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No glucose data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => format(date, 'MMM d')}
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            domain={[0, 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Target range reference lines */}
          <ReferenceLine
            y={targetMin}
            stroke="#7ED321"
            strokeDasharray="3 3"
            label={{ value: 'Target Min', position: 'insideTopRight', fill: '#7ED321', fontSize: 10 }}
          />
          <ReferenceLine
            y={targetMax}
            stroke="#7ED321"
            strokeDasharray="3 3"
            label={{ value: 'Target Max', position: 'insideBottomRight', fill: '#7ED321', fontSize: 10 }}
          />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#4A90E2"
            strokeWidth={2}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={getPointColor(payload.value)}
                  stroke="#fff"
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
