import { prisma } from './prisma';

export const TIER_LIMITS: Record<string, { daily: number | null }> = {
  free: { daily: 20 },
  pro: { daily: 100 },
  unlimited: { daily: null }, // no limit
};

// Hard ceiling across all users per day
export const GLOBAL_DAILY_CAP = 500;

export async function checkRateLimit(
  userId: string,
  endpoint: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Look up user tier
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true },
  });

  const tier = user?.tier ?? 'free';
  const limits = TIER_LIMITS[tier] ?? TIER_LIMITS.free;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Check per-user daily limit (skip for unlimited tier)
  if (limits.daily !== null) {
    const userCount = await prisma.aiUsage.count({
      where: { userId, createdAt: { gte: oneDayAgo } },
    });
    if (userCount >= limits.daily) {
      return { allowed: false, reason: 'daily_limit' };
    }
  }

  // Check global daily cap
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const globalCount = await prisma.aiUsage.count({
    where: { createdAt: { gte: today } },
  });
  if (globalCount >= GLOBAL_DAILY_CAP) {
    return { allowed: false, reason: 'global_cap' };
  }

  return { allowed: true };
}

export async function recordAiUsage(userId: string, endpoint: string): Promise<void> {
  await prisma.aiUsage.create({ data: { userId, endpoint } });
}
