import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const followups = await prisma.mealFollowUp.findMany({
      where: {
        userId: session.user.id,
        status: 'pending',
        scheduledFor: {
          lte: now,
          gte: oneDayAgo, // Don't show stale follow-ups older than 24hrs
        },
      },
      include: {
        meal: {
          select: {
            id: true,
            aiSummary: true,
            detectedFoods: true,
            photoBase64: true,
            calories: true,
            carbs: true,
            protein: true,
            fat: true,
            mealType: true,
            eatenAt: true,
          },
        },
      },
      orderBy: { scheduledFor: 'asc' },
      take: 5,
    });

    return NextResponse.json({ followups });
  } catch (error) {
    console.error('Follow-up fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
