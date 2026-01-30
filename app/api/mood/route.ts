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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      mood,
      stressLevel,
      notFeelingWell,
      onPeriod,
      feelingOverwhelmed,
      havingCravings,
      notes,
    } = await request.json();

    if (!mood || !stressLevel) {
      return NextResponse.json(
        { error: 'Mood and stress level are required' },
        { status: 400 }
      );
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
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Mood create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
