import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/dexcom/disconnect
 * Disconnects Dexcom integration and removes tokens
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Delete Dexcom integration
    await prisma.dexcomIntegration.delete({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      message: 'Dexcom integration disconnected successfully',
    });
  } catch (error) {
    console.error('Dexcom disconnect error:', error);

    // If integration doesn't exist, still return success
    if ((error as any)?.code === 'P2025') {
      return NextResponse.json({
        success: true,
        message: 'No Dexcom integration found',
      });
    }

    return NextResponse.json(
      { error: 'Failed to disconnect Dexcom' },
      { status: 500 }
    );
  }
}
