import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LibreLinkUpClient, encryptPassword } from '@/lib/libre-api';

/**
 * POST /api/libre/connect
 * Connect LibreLinkUp account
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { email, password, region = 'US' } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate region
    if (!['US', 'EU', 'AP'].includes(region)) {
      return NextResponse.json(
        { error: 'Invalid region. Must be US, EU, or AP' },
        { status: 400 }
      );
    }

    // Test login with LibreLinkUp
    const client = new LibreLinkUpClient(region as 'US' | 'EU' | 'AP');

    let authResult;
    try {
      authResult = await client.login(email, password);
    } catch (error: any) {
      console.error('LibreLinkUp login failed:', error);
      return NextResponse.json(
        {
          error:
            error.message.includes('401') || error.message.includes('Invalid')
              ? 'Invalid email or password'
              : 'Failed to connect to LibreLinkUp. Please try again.',
        },
        { status: 400 }
      );
    }

    // Store integration in database
    await prisma.libreIntegration.upsert({
      where: { userId },
      create: {
        userId,
        libreEmail: email,
        librePassword: encryptPassword(password),
        authToken: authResult.token,
        tokenExpiresAt: authResult.expires,
        librePatientId: authResult.patientId || null,
        region,
        isActive: true,
        lastSyncAt: null,
      },
      update: {
        libreEmail: email,
        librePassword: encryptPassword(password),
        authToken: authResult.token,
        tokenExpiresAt: authResult.expires,
        librePatientId: authResult.patientId || null,
        region,
        isActive: true,
        lastError: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'LibreLinkUp connected successfully',
      patientId: authResult.patientId,
    });
  } catch (error) {
    console.error('Libre connect error:', error);
    return NextResponse.json(
      { error: 'Failed to connect LibreLinkUp account' },
      { status: 500 }
    );
  }
}
