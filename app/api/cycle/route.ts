import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function parseArr(v: unknown): string[] {
  if (!v) return [];
  try { return JSON.parse(v as string); } catch { return []; }
}

function formatLog(log: Record<string, unknown>) {
  return { ...log, symptoms: parseArr(log.symptoms) };
}

function validate(cycleDay?: number, energy?: number) {
  if (cycleDay !== undefined && cycleDay < 1) return 'cycleDay must be positive';
  if (energy !== undefined && (energy < 1 || energy > 10)) return 'energy must be 1–10';
  return null;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check opt-in
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tracksMenstrualCycle: true },
    });
    if (!user?.tracksMenstrualCycle) {
      return NextResponse.json({ error: 'Cycle tracking is not enabled. Enable it in Settings > Sleep & Body Patterns.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 50);

    const where: Record<string, unknown> = { userId: session.user.id };
    if (date) {
      where.date = { gte: new Date(`${date}T00:00:00`), lte: new Date(`${date}T23:59:59`) };
    }

    const logs = await prisma.cycleLog.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
    });

    return NextResponse.json({ logs: logs.map((l) => formatLog(l as unknown as Record<string, unknown>)) });
  } catch (error) {
    console.error('Cycle fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tracksMenstrualCycle: true },
    });
    if (!user?.tracksMenstrualCycle) {
      return NextResponse.json({ error: 'Cycle tracking is not enabled. Enable it in Settings > Sleep & Body Patterns.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      date, periodStartDate, periodEndDate, cycleDay, cyclePhase, flow,
      symptoms, cravings, appetiteChange, mood, energy, glucoseChangesNoticed, notes,
    } = body;

    const err = validate(
      cycleDay !== undefined ? Number(cycleDay) : undefined,
      energy !== undefined ? Number(energy) : undefined,
    );
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    const log = await prisma.cycleLog.create({
      data: {
        userId: session.user.id,
        date: date ? new Date(date) : new Date(),
        periodStartDate: periodStartDate ? new Date(periodStartDate) : null,
        periodEndDate: periodEndDate ? new Date(periodEndDate) : null,
        cycleDay: cycleDay ? Number(cycleDay) : null,
        cyclePhase: cyclePhase || null,
        flow: flow || null,
        symptoms: symptoms ? JSON.stringify(symptoms) : null,
        cravings: cravings || null,
        appetiteChange: appetiteChange || null,
        mood: mood || null,
        energy: energy ? Number(energy) : null,
        glucoseChangesNoticed: glucoseChangesNoticed || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ log: formatLog(log as unknown as Record<string, unknown>) }, { status: 201 });
  } catch (error) {
    console.error('Cycle create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
