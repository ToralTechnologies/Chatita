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

    // Get user's created date
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate days with Chatita
    const daysSinceJoined = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get all badges
    const allBadges = await prisma.badge.findMany({
      orderBy: { daysRequired: 'asc' },
    });

    // Get user's unlocked badges
    const unlockedBadges = await prisma.userBadge.findMany({
      where: { userId: session.user.id },
      include: { badge: true },
      orderBy: { unlockedAt: 'desc' },
    });

    const unlockedBadgeIds = unlockedBadges.map((ub) => ub.badgeId);

    // Auto-unlock eligible badges
    for (const badge of allBadges) {
      if (
        daysSinceJoined >= badge.daysRequired &&
        !unlockedBadgeIds.includes(badge.id)
      ) {
        await prisma.userBadge.create({
          data: {
            userId: session.user.id,
            badgeId: badge.id,
          },
        });
        unlockedBadgeIds.push(badge.id);
      }
    }

    // Separate earned and locked badges
    const earnedBadges = allBadges.filter((b) => unlockedBadgeIds.includes(b.id));
    const lockedBadges = allBadges.filter((b) => !unlockedBadgeIds.includes(b.id));

    // Find next milestone
    const nextBadge = lockedBadges[0] || null;
    const daysUntilNext = nextBadge
      ? nextBadge.daysRequired - daysSinceJoined
      : 0;

    return NextResponse.json({
      currentStreak: daysSinceJoined,
      earnedBadges,
      lockedBadges,
      nextMilestone: nextBadge
        ? {
            badge: nextBadge,
            daysRemaining: daysUntilNext,
            progress: (daysSinceJoined / nextBadge.daysRequired) * 100,
          }
        : null,
    });
  } catch (error) {
    console.error('Badges error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
