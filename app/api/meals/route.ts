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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const mealType = searchParams.get('mealType');

    const meals = await prisma.meal.findMany({
      where: {
        userId: session.user.id,
        ...(search && {
          OR: [
            { description: { contains: search, mode: 'insensitive' } },
            { detectedFoods: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(mealType && { mealType }),
      },
      orderBy: { eatenAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ meals });
  } catch (error) {
    console.error('Meals fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      photoBase64,
      description,
      detectedFoods,
      calories,
      carbs,
      protein,
      fat,
      fiber,
      sugar,
      sodium,
      portionSize,
      mealType,
      feeling,
      restaurantName,
      restaurantAddress,
      restaurantPlaceId,
    } = body;

    // Validate required fields
    if (!detectedFoods || detectedFoods.length === 0) {
      return NextResponse.json(
        { error: 'At least one food item is required' },
        { status: 400 }
      );
    }

    const meal = await prisma.meal.create({
      data: {
        userId: session.user.id,
        photoBase64: photoBase64 || null,
        description: description || null,
        detectedFoods: JSON.stringify(detectedFoods),
        calories: calories || null,
        carbs: carbs || null,
        protein: protein || null,
        fat: fat || null,
        fiber: fiber || null,
        sugar: sugar || null,
        sodium: sodium || null,
        portionSize: portionSize || null,
        mealType: mealType || 'snack',
        feeling: feeling || null,
        restaurantName: restaurantName || null,
        restaurantAddress: restaurantAddress || null,
        restaurantPlaceId: restaurantPlaceId || null,
      },
    });

    return NextResponse.json({ meal }, { status: 201 });
  } catch (error) {
    console.error('Meal create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
