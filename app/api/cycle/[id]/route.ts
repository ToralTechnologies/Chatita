import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

function parseArr(v: unknown): string[] {
  if (!v) return [];
  try { return JSON.parse(v as string); } catch { return []; }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.cycleLog.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      periodStartDate, periodEndDate, cycleDay, cyclePhase, flow,
      symptoms, cravings, appetiteChange, mood, energy, glucoseChangesNoticed, notes,
    } = body;

    const log = await prisma.cycleLog.update({
      where: { id },
      data: {
        ...(periodStartDate !== undefined && { periodStartDate: periodStartDate ? new Date(periodStartDate) : null }),
        ...(periodEndDate !== undefined && { periodEndDate: periodEndDate ? new Date(periodEndDate) : null }),
        ...(cycleDay !== undefined && { cycleDay: cycleDay ? Number(cycleDay) : null }),
        ...(cyclePhase !== undefined && { cyclePhase: cyclePhase || null }),
        ...(flow !== undefined && { flow: flow || null }),
        ...(symptoms !== undefined && { symptoms: symptoms ? JSON.stringify(symptoms) : null }),
        ...(cravings !== undefined && { cravings: cravings || null }),
        ...(appetiteChange !== undefined && { appetiteChange: appetiteChange || null }),
        ...(mood !== undefined && { mood: mood || null }),
        ...(energy !== undefined && { energy: energy ? Number(energy) : null }),
        ...(glucoseChangesNoticed !== undefined && { glucoseChangesNoticed: glucoseChangesNoticed || null }),
        ...(notes !== undefined && { notes: notes || null }),
      },
    });

    return NextResponse.json({ log: { ...log, symptoms: parseArr(log.symptoms) } });
  } catch (error) {
    console.error('Cycle update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.cycleLog.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.cycleLog.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Cycle delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
