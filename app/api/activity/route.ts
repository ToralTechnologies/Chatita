import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function parseArr(v: unknown): string[] {
  if (!v) return [];
  try { return JSON.parse(v as string); } catch { return []; }
}

function formatLog(log: Record<string, unknown>) {
  return {
    ...log,
    symptoms: parseArr(log.symptoms),
  };
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date'); // YYYY-MM-DD — filter to that day if provided
  const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 50);

  const where: Record<string, unknown> = { userId: session.user.id };
  if (date) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59`);
    where.date = { gte: start, lte: end };
  }

  const logs = await prisma.activityLog.findMany({
    where,
    orderBy: { date: 'desc' },
    take: limit,
  });

  return NextResponse.json({ logs: logs.map((l) => formatLog(l as unknown as Record<string, unknown>)) });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const {
    activityType,
    activityMinutes,
    activityIntensity,
    steps,
    relatedToMeal = false,
    mealId,
    mealTiming,
    glucoseBeforeActivity,
    glucoseAfterActivity,
    energyBefore,
    energyAfter,
    moodAfter,
    symptoms,
    notes,
    date,
  } = body;

  const log = await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      date: date ? new Date(date) : new Date(),
      activityType: activityType || null,
      activityMinutes: activityMinutes ? Number(activityMinutes) : null,
      activityIntensity: activityIntensity || null,
      steps: steps ? Number(steps) : null,
      relatedToMeal: Boolean(relatedToMeal),
      mealId: mealId || null,
      mealTiming: mealTiming || null,
      glucoseBeforeActivity: glucoseBeforeActivity ? Number(glucoseBeforeActivity) : null,
      glucoseAfterActivity: glucoseAfterActivity ? Number(glucoseAfterActivity) : null,
      energyBefore: energyBefore ? Number(energyBefore) : null,
      energyAfter: energyAfter ? Number(energyAfter) : null,
      moodAfter: moodAfter || null,
      symptoms: symptoms ? JSON.stringify(symptoms) : null,
      notes: notes || null,
    },
  });

  return NextResponse.json({ log: formatLog(log as unknown as Record<string, unknown>) }, { status: 201 });
}
