import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        diabetesType: true,
        targetGlucoseMin: true,
        targetGlucoseMax: true,
        preferredLanguage: true,
        weeklyReportEnabled: true,
        lastReportSent: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, diabetesType, targetGlucoseMin, targetGlucoseMax, preferredLanguage, weeklyReportEnabled } = body;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(diabetesType !== undefined && { diabetesType }),
        ...(targetGlucoseMin !== undefined && { targetGlucoseMin }),
        ...(targetGlucoseMax !== undefined && { targetGlucoseMax }),
        ...(preferredLanguage !== undefined && { preferredLanguage }),
        ...(weeklyReportEnabled !== undefined && { weeklyReportEnabled }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        diabetesType: true,
        targetGlucoseMin: true,
        targetGlucoseMax: true,
        preferredLanguage: true,
        weeklyReportEnabled: true,
        lastReportSent: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
