import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's restaurant visits with glucose impact
    const visits = await prisma.restaurantVisit.findMany({
      where: { userId: session.user.id },
      orderBy: { visitedAt: 'desc' },
      take: 50,
    });

    // Get meals from restaurants with glucose data
    const restaurantMeals = await prisma.meal.findMany({
      where: {
        userId: session.user.id,
        restaurantName: { not: null },
      },
      include: {
        relatedGlucoseReadings: {
          where: {
            context: 'post-meal',
          },
        },
      },
      orderBy: { eatenAt: 'desc' },
      take: 30,
    });

    // Calculate recommendations based on glucose impact
    const restaurantScores: Record<string, {
      name: string;
      cuisine?: string;
      address?: string;
      placeId: string;
      visits: number;
      avgGlucose: number;
      glucoseReadings: number;
      lastVisit: Date;
      score: number;
    }> = {};

    // Process visits
    visits.forEach((visit) => {
      if (!restaurantScores[visit.placeId]) {
        restaurantScores[visit.placeId] = {
          name: visit.name,
          cuisine: visit.cuisine || undefined,
          address: visit.address || undefined,
          placeId: visit.placeId,
          visits: 0,
          avgGlucose: 0,
          glucoseReadings: 0,
          lastVisit: visit.visitedAt,
          score: 0,
        };
      }
      restaurantScores[visit.placeId].visits += 1;
      if (visit.visitedAt > restaurantScores[visit.placeId].lastVisit) {
        restaurantScores[visit.placeId].lastVisit = visit.visitedAt;
      }
    });

    // Process meals with glucose data
    restaurantMeals.forEach((meal) => {
      if (!meal.restaurantPlaceId || meal.relatedGlucoseReadings.length === 0) return;

      if (!restaurantScores[meal.restaurantPlaceId]) {
        restaurantScores[meal.restaurantPlaceId] = {
          name: meal.restaurantName!,
          cuisine: undefined,
          address: meal.restaurantAddress || undefined,
          placeId: meal.restaurantPlaceId,
          visits: 0,
          avgGlucose: 0,
          glucoseReadings: 0,
          lastVisit: meal.eatenAt,
          score: 0,
        };
      }

      const glucoseValues = meal.relatedGlucoseReadings.map((r) => r.value);
      const avgMealGlucose = glucoseValues.reduce((a, b) => a + b, 0) / glucoseValues.length;

      const current = restaurantScores[meal.restaurantPlaceId];
      current.avgGlucose =
        (current.avgGlucose * current.glucoseReadings + avgMealGlucose) /
        (current.glucoseReadings + 1);
      current.glucoseReadings += 1;
    });

    // Calculate recommendation scores
    // Lower glucose = higher score, more visits = higher score, recent = higher score
    const recommendations = Object.values(restaurantScores)
      .filter((r) => r.glucoseReadings > 0) // Only restaurants with glucose data
      .map((r) => {
        const glucoseScore = r.avgGlucose <= 140 ? 100 : Math.max(0, 100 - (r.avgGlucose - 140));
        const visitScore = Math.min(50, r.visits * 10);
        const recencyDays = (Date.now() - r.lastVisit.getTime()) / (1000 * 60 * 60 * 24);
        const recencyScore = Math.max(0, 50 - recencyDays * 2);

        r.score = glucoseScore + visitScore + recencyScore;
        return r;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return NextResponse.json({
      recommendations,
      message:
        recommendations.length === 0
          ? 'Start logging meals from restaurants to get personalized recommendations'
          : `Found ${recommendations.length} recommended restaurants based on your glucose data`,
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
