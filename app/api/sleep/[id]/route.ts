import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.sleepLog.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      sleepStart, wakeTime, totalSleepMinutes, sleepQuality,
      wakeEnergy, nighttimeWakeups, stressBeforeBed, caffeineLaterInDay, notes,
    } = body;

    const log = await prisma.sleepLog.update({
      where: { id },
      data: {
        ...(sleepStart !== undefined && { sleepStart: sleepStart ? new Date(sleepStart) : null }),
        ...(wakeTime !== undefined && { wakeTime: wakeTime ? new Date(wakeTime) : null }),
        ...(totalSleepMinutes !== undefined && { totalSleepMinutes: totalSleepMinutes !== null ? Number(totalSleepMinutes) : null }),
        ...(sleepQuality !== undefined && { sleepQuality: sleepQuality || null }),
        ...(wakeEnergy !== undefined && { wakeEnergy: wakeEnergy ? Number(wakeEnergy) : null }),
        ...(nighttimeWakeups !== undefined && { nighttimeWakeups: nighttimeWakeups !== null ? Number(nighttimeWakeups) : null }),
        ...(stressBeforeBed !== undefined && { stressBeforeBed: stressBeforeBed ? Number(stressBeforeBed) : null }),
        ...(caffeineLaterInDay !== undefined && { caffeineLaterInDay: caffeineLaterInDay !== null ? Boolean(caffeineLaterInDay) : null }),
        ...(notes !== undefined && { notes: notes || null }),
      },
    });

    return NextResponse.json({ log });
  } catch (error) {
    console.error('Sleep update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.sleepLog.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.sleepLog.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Sleep delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
