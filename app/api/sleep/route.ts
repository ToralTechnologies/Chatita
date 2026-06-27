import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function validate(totalSleepMinutes?: number, wakeEnergy?: number, stressBeforeBed?: number, nighttimeWakeups?: number) {
  if (totalSleepMinutes !== undefined && totalSleepMinutes < 0) return 'totalSleepMinutes must be non-negative';
  if (wakeEnergy !== undefined && (wakeEnergy < 1 || wakeEnergy > 10)) return 'wakeEnergy must be 1–10';
  if (stressBeforeBed !== undefined && (stressBeforeBed < 1 || stressBeforeBed > 10)) return 'stressBeforeBed must be 1–10';
  if (nighttimeWakeups !== undefined && nighttimeWakeups < 0) return 'nighttimeWakeups must be non-negative';
  return null;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 50);

    const where: Record<string, unknown> = { userId: session.user.id };
    if (date) {
      where.date = { gte: new Date(`${date}T00:00:00`), lte: new Date(`${date}T23:59:59`) };
    }

    const logs = await prisma.sleepLog.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Sleep fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      date,
      sleepStart,
      wakeTime,
      totalSleepMinutes,
      sleepQuality,
      wakeEnergy,
      nighttimeWakeups,
      stressBeforeBed,
      caffeineLaterInDay,
      notes,
    } = body;

    const err = validate(
      totalSleepMinutes !== undefined ? Number(totalSleepMinutes) : undefined,
      wakeEnergy !== undefined ? Number(wakeEnergy) : undefined,
      stressBeforeBed !== undefined ? Number(stressBeforeBed) : undefined,
      nighttimeWakeups !== undefined ? Number(nighttimeWakeups) : undefined,
    );
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    // Calculate totalSleepMinutes from start/wake if not explicitly provided
    let computedMinutes: number | null = null;
    if (totalSleepMinutes !== undefined) {
      computedMinutes = Number(totalSleepMinutes);
    } else if (sleepStart && wakeTime) {
      const start = new Date(sleepStart);
      const wake = new Date(wakeTime);
      let diff = (wake.getTime() - start.getTime()) / 60000;
      if (diff < 0) diff += 24 * 60; // crossed midnight
      computedMinutes = Math.round(diff);
    }

    const log = await prisma.sleepLog.create({
      data: {
        userId: session.user.id,
        date: date ? new Date(date) : new Date(),
        sleepStart: sleepStart ? new Date(sleepStart) : null,
        wakeTime: wakeTime ? new Date(wakeTime) : null,
        totalSleepMinutes: computedMinutes,
        sleepQuality: sleepQuality || null,
        wakeEnergy: wakeEnergy ? Number(wakeEnergy) : null,
        nighttimeWakeups: nighttimeWakeups !== undefined ? Number(nighttimeWakeups) : null,
        stressBeforeBed: stressBeforeBed ? Number(stressBeforeBed) : null,
        caffeineLaterInDay: caffeineLaterInDay !== undefined ? Boolean(caffeineLaterInDay) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error('Sleep create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
