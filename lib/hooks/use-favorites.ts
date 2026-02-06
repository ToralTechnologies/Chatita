'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface FavoriteRestaurant {
  id: string;
  placeId: string;
  name: string;
  address?: string;
  cuisine?: string;
  rating?: number;
  priceLevel?: number;
  notes?: string;
  tags?: string;
  createdAt: string;
}

// Fetch favorites
export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await fetch('/api/restaurants/favorites');
      if (!res.ok) throw new Error('Failed to fetch favorites');
      const data = await res.json();
      return data.favorites as FavoriteRestaurant[];
    },
  });
}

// Add favorite mutation
export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (restaurant: {
      placeId: string;
      name: string;
      address?: string;
      cuisine?: string;
      rating?: number;
      priceLevel?: number;
      notes?: string;
      tags?: string;
    }) => {
      const res = await fetch('/api/restaurants/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restaurant),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add favorite');
      }
      return res.json();
    },
    // Optimistic update
    onMutate: async (newFavorite) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      const previousFavorites = queryClient.getQueryData(['favorites']);

      queryClient.setQueryData(['favorites'], (old: FavoriteRestaurant[] = []) => [
        ...old,
        {
          id: 'temp-' + Date.now(),
          ...newFavorite,
          createdAt: new Date().toISOString(),
        },
      ]);

      return { previousFavorites };
    },
    onError: (_err, _newFavorite, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites'], context.previousFavorites);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

// Remove favorite mutation
export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (placeId: string) => {
      const res = await fetch(`/api/restaurants/favorites/${placeId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove favorite');
      return res.json();
    },
    // Optimistic update
    onMutate: async (placeId) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      const previousFavorites = queryClient.getQueryData(['favorites']);

      queryClient.setQueryData(['favorites'], (old: FavoriteRestaurant[] = []) =>
        old.filter((fav) => fav.placeId !== placeId)
      );

      return { previousFavorites };
    },
    onError: (_err, _placeId, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites'], context.previousFavorites);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}
