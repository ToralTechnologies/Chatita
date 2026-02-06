'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface HourlyData {
  hour: number;
  average: number;
  count: number;
}

interface DailyPatternChartProps {
  data: HourlyData[];
  targetMin?: number;
  targetMax?: number;
}

export default function DailyPatternChart({
  data,
  targetMin = 70,
  targetMax = 180
}: DailyPatternChartProps) {
  // Ensure we have all 24 hours, fill missing with null
  const fullDayData = Array.from({ length: 24 }, (_, hour) => {
    const existing = data.find(d => d.hour === hour);
    return existing || { hour, average: null, count: 0 };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (data.average === null) return null;

      const formatHour = (hour: number) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:00 ${period}`;
      };

      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold mb-1">{formatHour(data.hour)}</p>
          <p className="text-lg font-bold text-primary">
            {Math.round(data.average)} mg/dL
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {data.count} reading{data.count > 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No daily pattern data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={fullDayData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorGlucose" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4A90E2" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#4A90E2" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="hour"
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(hour) => {
              if (hour === 0) return '12am';
              if (hour === 12) return '12pm';
              return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
            }}
            ticks={[0, 6, 12, 18, 23]}
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
            strokeOpacity={0.5}
          />
          <ReferenceLine
            y={targetMax}
            stroke="#F5A623"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />

          <Area
            type="monotone"
            dataKey="average"
            stroke="#4A90E2"
            strokeWidth={2}
            fill="url(#colorGlucose)"
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
