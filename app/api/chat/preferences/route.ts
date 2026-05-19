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

    const prefs = await prisma.chatPreference.findUnique({
      where: { userId: session.user.id },
    });

    // Return defaults if no preferences saved yet
    return NextResponse.json(
      prefs ?? {
        communicationStyle: 'warm',
        responseLength: 'medium',
        enableNotifications: true,
        notificationTime: '09:00',
      }
    );
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { communicationStyle, responseLength, enableNotifications, notificationTime } = body;

    const prefs = await prisma.chatPreference.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        communicationStyle: communicationStyle ?? 'warm',
        responseLength: responseLength ?? 'medium',
        enableNotifications: enableNotifications ?? true,
        notificationTime: notificationTime ?? '09:00',
      },
      update: {
        ...(communicationStyle !== undefined && { communicationStyle }),
        ...(responseLength !== undefined && { responseLength }),
        ...(enableNotifications !== undefined && { enableNotifications }),
        ...(notificationTime !== undefined && { notificationTime }),
      },
    });

    return NextResponse.json(prefs);
  } catch (error) {
    console.error('Save preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
