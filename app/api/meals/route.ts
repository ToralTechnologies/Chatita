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
            { aiSummary: { contains: search, mode: 'insensitive' } },
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
      detectedFoods,
      aiSummary,
      aiConfidence,
      aiMode,
      nutritionSource,
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

    // Auto-detect meal type if not provided
    const finalMealType = mealType || detectMealTypeFromTime();

    // Determine nutrition source
    let finalNutritionSource = nutritionSource || 'manual';
    if (aiMode === 'ai' && !nutritionSource) {
      finalNutritionSource = 'ai';
    }

    // Allow photo-only OR food-list-only (not requiring both)
    // At least one must be present
    if (!photoBase64 && (!detectedFoods || detectedFoods.length === 0)) {
      return NextResponse.json(
        { error: 'Either a photo or food items are required' },
        { status: 400 }
      );
    }

    const meal = await prisma.meal.create({
      data: {
        userId: session.user.id,
        photoBase64: photoBase64 || null,
        detectedFoods: detectedFoods?.length > 0 ? JSON.stringify(detectedFoods) : null,
        aiSummary: aiSummary || null,
        aiConfidence: aiConfidence || null,
        aiMode: aiMode || null,
        nutritionSource: finalNutritionSource,
        calories: calories || null,
        carbs: carbs || null,
        protein: protein || null,
        fat: fat || null,
        fiber: fiber || null,
        sugar: sugar || null,
        sodium: sodium || null,
        portionSize: portionSize || null,
        mealType: finalMealType,
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

// Helper function to auto-detect meal type based on time
function detectMealTypeFromTime(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 18) return 'snack';
  if (hour >= 18 || hour < 5) return 'dinner';

  return 'snack'; // fallback
}
