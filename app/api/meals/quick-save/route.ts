import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeMealPhoto } from '@/lib/ai/meal-analyzer';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { photoBase64 } = await request.json();

    if (!photoBase64) {
      return NextResponse.json(
        { error: 'Photo is required for quick save' },
        { status: 400 }
      );
    }

    // Analyze the meal photo
    const analysis = await analyzeMealPhoto(photoBase64);

    // Prepare meal data
    const mealData = {
      userId: session.user.id,
      photoBase64,
      aiSummary: analysis.aiSummary,
      aiConfidence: analysis.confidence,
      aiMode: analysis.mode,
      nutritionSource: analysis.mode === 'ai' ? 'ai' : 'manual',
      detectedFoods: analysis.detectedFoods.length > 0
        ? JSON.stringify(analysis.detectedFoods)
        : null,
      mealType: analysis.mealType || 'snack',
      calories: analysis.nutrition.calories,
      carbs: analysis.nutrition.carbs,
      protein: analysis.nutrition.protein,
      fat: analysis.nutrition.fat,
      fiber: analysis.nutrition.fiber,
      sugar: analysis.nutrition.sugar,
      sodium: analysis.nutrition.sodium,
      portionSize: analysis.portionSize,
    };

    // Save to database
    const meal = await prisma.meal.create({
      data: mealData,
    });

    return NextResponse.json({
      meal,
      analysis: {
        aiSummary: analysis.aiSummary,
        detectedFoods: analysis.detectedFoods,
        nutrition: analysis.nutrition,
        nutritionSummary: analysis.nutritionSummary,
        confidence: analysis.confidence,
        mealType: analysis.mealType,
        mode: analysis.mode,
      },
    });
  } catch (error) {
    console.error('Quick save error:', error);
    return NextResponse.json(
      { error: 'Failed to save meal' },
      { status: 500 }
    );
  }
}
