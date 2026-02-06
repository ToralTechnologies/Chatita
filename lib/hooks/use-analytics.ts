'use client';

import { useQuery } from '@tanstack/react-query';

interface AnalyticsData {
  averageGlucose: number;
  lowestGlucose: number;
  highestGlucose: number;
  totalMeals: number;
  timeInRange: number;
  glucoseTrend: Array<{
    date: string;
    avgBefore: number;
    avgAfter: number;
  }>;
  mealsByCategory: Record<string, number>;
  averageGlucoseByCategory: Record<string, { before: number; after: number }>;
  topMeals: Array<{
    name: string;
    count: number;
    avgGlucoseBefore: number;
    avgGlucoseAfter: number;
  }>;
}

export function useAnalytics(filters?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['analytics', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const res = await fetch(`/api/analytics?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();
      return data as AnalyticsData;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - analytics can be slightly stale
  });
}
