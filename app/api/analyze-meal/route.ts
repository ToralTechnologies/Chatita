import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeMealPhoto, analyzeMealText } from '@/lib/ai/meal-analyzer';
import { checkRateLimit, recordAiUsage } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { photoBase64, foods } = await request.json();

    if (!photoBase64 && (!foods || !Array.isArray(foods) || foods.length === 0)) {
      return NextResponse.json(
        { error: 'A photo or a list of foods is required' },
        { status: 400 }
      );
    }

    const limit = await checkRateLimit(session.user.id, 'analyze-meal');
    if (!limit.allowed) {
      return NextResponse.json({
        message: 'AI analysis limit reached. You can still save the meal manually.',
        mode: '$0',
        detectedFoods: foods ?? [],
        nutrition: {},
      });
    }

    const analysis = photoBase64
      ? await analyzeMealPhoto(photoBase64)
      : await analyzeMealText(foods as string[]);

    if (analysis.mode === '$0') {
      return NextResponse.json({
        message: 'AI analysis is unavailable. You can still save the meal manually.',
        mode: '$0',
        detectedFoods: foods ?? [],
        nutrition: {},
      });
    }

    await recordAiUsage(session.user.id, 'analyze-meal');

    return NextResponse.json({
      detectedFoods: analysis.detectedFoods,
      allDetectedDishes: analysis.allDetectedDishes || [],
      needsSelection: analysis.needsSelection || false,
      aiSummary: analysis.aiSummary,
      nutrition: analysis.nutrition,
      nutritionSummary: analysis.nutritionSummary,
      portionSize: analysis.portionSize,
      confidence: analysis.confidence,
      guidance: analysis.guidance,
      mode: 'ai',
      disclaimer: 'AI estimates may vary. Always verify with your care team.',
    });
  } catch (error) {
    console.error('Meal analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze meal' },
      { status: 500 }
    );
  }
}
