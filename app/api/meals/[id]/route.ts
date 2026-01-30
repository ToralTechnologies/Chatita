import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const meal = await prisma.meal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    return NextResponse.json({ meal });
  } catch (error) {
    console.error('Meal fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const meal = await prisma.meal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      description,
      detectedFoods,
      calories,
      carbs,
      protein,
      fat,
      mealType,
      feeling,
    } = body;

    const updatedMeal = await prisma.meal.update({
      where: { id },
      data: {
        ...(description !== undefined && { description }),
        ...(detectedFoods !== undefined && { detectedFoods: JSON.stringify(detectedFoods) }),
        ...(calories !== undefined && { calories }),
        ...(carbs !== undefined && { carbs }),
        ...(protein !== undefined && { protein }),
        ...(fat !== undefined && { fat }),
        ...(mealType !== undefined && { mealType }),
        ...(feeling !== undefined && { feeling }),
      },
    });

    return NextResponse.json({ meal: updatedMeal });
  } catch (error) {
    console.error('Meal update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const meal = await prisma.meal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    await prisma.meal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Meal delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
