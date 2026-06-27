import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const [dexcom, libre] = await Promise.all([
    prisma.dexcomIntegration.findUnique({ where: { userId } }),
    prisma.libreIntegration.findUnique({ where: { userId } }),
  ]);

  const connected = (dexcom?.isActive || libre?.isActive) ?? false;
  if (!connected) {
    return NextResponse.json({ connected: false, provider: null, latestReading: null, lastSync: null });
  }

  const provider = dexcom?.isActive ? 'dexcom' : 'libre';
  const notePrefix = dexcom?.isActive ? 'Dexcom CGM' : 'FreeStyle Libre';
  const lastSync = dexcom?.isActive
    ? (dexcom.lastSyncAt?.toISOString() ?? null)
    : (libre?.lastSyncAt?.toISOString() ?? null);

  // Find the most recent CGM reading in the last 4 hours
  const since = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const latest = await prisma.glucoseEntry.findFirst({
    where: {
      userId,
      notes: { contains: notePrefix },
      measuredAt: { gte: since },
    },
    orderBy: { measuredAt: 'desc' },
  });

  let trend: string | null = null;
  if (latest?.notes) {
    const m = latest.notes.match(/Trend:\s*([^)]+)/i);
    if (m) trend = m[1].trim();
  }

  return NextResponse.json({
    connected,
    provider,
    lastSync,
    latestReading: latest
      ? { value: latest.value, measuredAt: latest.measuredAt.toISOString(), trend }
      : null,
  });
}
