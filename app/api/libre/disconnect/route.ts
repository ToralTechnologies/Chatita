import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/libre/disconnect
 * Disconnect LibreLinkUp integration
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Delete Libre integration
    await prisma.libreIntegration.delete({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      message: 'LibreLinkUp integration disconnected successfully',
    });
  } catch (error) {
    console.error('Libre disconnect error:', error);

    // If integration doesn't exist, still return success
    if ((error as any)?.code === 'P2025') {
      return NextResponse.json({
        success: true,
        message: 'No LibreLinkUp integration found',
      });
    }

    return NextResponse.json(
      { error: 'Failed to disconnect LibreLinkUp' },
      { status: 500 }
    );
  }
}
