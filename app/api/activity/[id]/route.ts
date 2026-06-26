import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

function parseArr(v: unknown): string[] {
  if (!v) return [];
  try { return JSON.parse(v as string); } catch { return []; }
}

function formatLog(log: Record<string, unknown>) {
  return { ...log, symptoms: parseArr(log.symptoms) };
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.activityLog.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const {
    activityType,
    activityMinutes,
    activityIntensity,
    steps,
    relatedToMeal,
    mealId,
    mealTiming,
    glucoseBeforeActivity,
    glucoseAfterActivity,
    energyBefore,
    energyAfter,
    moodAfter,
    symptoms,
    notes,
  } = body;

  const log = await prisma.activityLog.update({
    where: { id },
    data: {
      ...(activityType !== undefined && { activityType: activityType || null }),
      ...(activityMinutes !== undefined && { activityMinutes: activityMinutes ? Number(activityMinutes) : null }),
      ...(activityIntensity !== undefined && { activityIntensity: activityIntensity || null }),
      ...(steps !== undefined && { steps: steps ? Number(steps) : null }),
      ...(relatedToMeal !== undefined && { relatedToMeal: Boolean(relatedToMeal) }),
      ...(mealId !== undefined && { mealId: mealId || null }),
      ...(mealTiming !== undefined && { mealTiming: mealTiming || null }),
      ...(glucoseBeforeActivity !== undefined && { glucoseBeforeActivity: glucoseBeforeActivity ? Number(glucoseBeforeActivity) : null }),
      ...(glucoseAfterActivity !== undefined && { glucoseAfterActivity: glucoseAfterActivity ? Number(glucoseAfterActivity) : null }),
      ...(energyBefore !== undefined && { energyBefore: energyBefore ? Number(energyBefore) : null }),
      ...(energyAfter !== undefined && { energyAfter: energyAfter ? Number(energyAfter) : null }),
      ...(moodAfter !== undefined && { moodAfter: moodAfter || null }),
      ...(symptoms !== undefined && { symptoms: symptoms ? JSON.stringify(symptoms) : null }),
      ...(notes !== undefined && { notes: notes || null }),
    },
  });

  return NextResponse.json({ log: formatLog(log as unknown as Record<string, unknown>) });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.activityLog.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.activityLog.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
