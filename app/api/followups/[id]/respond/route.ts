import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { response, portionEaten } = await request.json();

    const validResponses = ['ate_all', 'ate_some', 'didnt_eat', 'changed_meal'];
    if (!validResponses.includes(response)) {
      return NextResponse.json({ error: 'Invalid response' }, { status: 400 });
    }

    // Verify follow-up belongs to user
    const followup = await prisma.mealFollowUp.findFirst({
      where: { id, userId: session.user.id },
      include: { meal: true },
    });

    if (!followup) {
      return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });
    }

    // Update follow-up
    const updatedFollowup = await prisma.mealFollowUp.update({
      where: { id },
      data: {
        status: 'responded',
        response,
        portionEaten: response === 'ate_some' ? (portionEaten ?? 0.5) : null,
        respondedAt: new Date(),
      },
    });

    // If user ate less, adjust meal nutrition proportionally
    if ((response === 'ate_some' || response === 'didnt_eat') && followup.meal) {
      const multiplier = response === 'didnt_eat' ? 0 : (portionEaten ?? 0.5);
      const meal = followup.meal;

      await prisma.meal.update({
        where: { id: meal.id },
        data: {
          calories: meal.calories != null ? meal.calories * multiplier : null,
          carbs: meal.carbs != null ? meal.carbs * multiplier : null,
          protein: meal.protein != null ? meal.protein * multiplier : null,
          fat: meal.fat != null ? meal.fat * multiplier : null,
          fiber: meal.fiber != null ? meal.fiber * multiplier : null,
          sugar: meal.sugar != null ? meal.sugar * multiplier : null,
          sodium: meal.sodium != null ? meal.sodium * multiplier : null,
          nutritionSource: 'user-edited',
        },
      });
    }

    return NextResponse.json({ followup: updatedFollowup });
  } catch (error) {
    console.error('Follow-up respond error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
