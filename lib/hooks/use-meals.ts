'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Meal {
  id: string;
  name: string;
  category: string;
  carbs?: number;
  protein?: number;
  fat?: number;
  calories?: number;
  glucoseBefore?: number;
  glucoseAfter?: number;
  photoUrl?: string;
  notes?: string;
  restaurant?: string;
  restaurantAddress?: string;
  restaurantPlaceId?: string;
  timestamp: string;
  createdAt: string;
}

// Fetch meals
export function useMeals(filters?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['meals', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const res = await fetch(`/api/meals?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch meals');
      const data = await res.json();
      return data.meals as Meal[];
    },
  });
}

// Fetch single meal
export function useMeal(id: string | null) {
  return useQuery({
    queryKey: ['meal', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/meals/${id}`);
      if (!res.ok) throw new Error('Failed to fetch meal');
      const data = await res.json();
      return data.meal as Meal;
    },
    enabled: !!id,
  });
}

// Add meal mutation
export function useAddMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mealData: Partial<Meal>) => {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mealData),
      });
      if (!res.ok) throw new Error('Failed to add meal');
      return res.json();
    },
    onSuccess: () => {
      // Invalidate meals query to refetch
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['glucose-readings'] });
    },
  });
}

// Update meal mutation
export function useUpdateMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Meal> }) => {
      const res = await fetch(`/api/meals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update meal');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      queryClient.invalidateQueries({ queryKey: ['meal', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

// Delete meal mutation
export function useDeleteMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/meals/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete meal');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
