import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/health/imports
 * Returns the import history for the current user, newest first.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const imports = await prisma.healthImport.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        provider: true,
        importType: true,
        filename: true,
        status: true,
        recordsProcessed: true,
        errorMessage: true,
        createdAt: true,
        completedAt: true,
      },
    });

    return NextResponse.json({ imports });
  } catch (error) {
    console.error('[health/imports] GET error:', error);
    return NextResponse.json({ error: 'Failed to load import history' }, { status: 500 });
  }
}
