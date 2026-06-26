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
    const limit = parseInt(searchParams.get('limit') || '10');

    const entries = await prisma.moodEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Mood fetch error:', error);
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
      // Core (required)
      mood,
      stressLevel,
      // Legacy flags
      notFeelingWell,
      onPeriod,
      feelingOverwhelmed,
      havingCravings,
      notes,
      // Extended
      moodIntensity,
      energyLevel,
      hungerLevel,
      fullnessLevel,
      cravings,
      symptoms,
      contextTags,
      userWords,
      foodMoodConnection,
      supportWanted,
      mealId,
    } = body;

    if (!mood || stressLevel === undefined) {
      return NextResponse.json({ error: 'mood and stressLevel are required' }, { status: 400 });
    }

    const entry = await prisma.moodEntry.create({
      data: {
        userId: session.user.id,
        mood,
        stressLevel: parseInt(stressLevel),
        notFeelingWell: notFeelingWell || false,
        onPeriod: onPeriod || false,
        feelingOverwhelmed: feelingOverwhelmed || false,
        havingCravings: havingCravings || false,
        notes: notes || null,
        moodIntensity: moodIntensity ? parseInt(moodIntensity) : null,
        energyLevel: energyLevel ? parseInt(energyLevel) : null,
        hungerLevel: hungerLevel ? parseInt(hungerLevel) : null,
        fullnessLevel: fullnessLevel ? parseInt(fullnessLevel) : null,
        cravings: cravings?.length ? JSON.stringify(cravings) : null,
        symptoms: symptoms?.length ? JSON.stringify(symptoms) : null,
        contextTags: contextTags?.length ? JSON.stringify(contextTags) : null,
        userWords: userWords || null,
        foodMoodConnection: foodMoodConnection || null,
        supportWanted: supportWanted || null,
        ...(mealId && { mealId }),
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Mood create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
