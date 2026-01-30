import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeMealPhoto } from '@/lib/ai/meal-analyzer';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { photoBase64 } = await request.json();

    if (!photoBase64) {
      return NextResponse.json(
        { error: 'Photo is required' },
        { status: 400 }
      );
    }

    // Analyze the meal photo
    const analysis = await analyzeMealPhoto(photoBase64);

    // Check if AI is disabled
    if (analysis.mode === '$0') {
      return NextResponse.json({
        message: 'AI analysis is disabled. Please add foods manually.',
        mode: '$0',
        detectedFoods: [],
        nutrition: {},
      });
    }

    // Return AI analysis
    return NextResponse.json({
      detectedFoods: analysis.detectedFoods,
      nutrition: analysis.nutrition,
      portionSize: analysis.portionSize,
      confidence: analysis.confidence,
      mode: 'ai',
      disclaimer: '⚠️ These are AI estimates and may vary. Always verify nutrition information.',
    });
  } catch (error) {
    console.error('Meal analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze meal' },
      { status: 500 }
    );
  }
}
