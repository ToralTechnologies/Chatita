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
      let userMessage = 'Failed to connect to LibreLinkUp. Please try again.';
      if (error.message === 'WRONG_REGION') {
        userMessage = `Wrong region selected. Your LibreLinkUp account is not registered in the ${region} region. Try EU or AP instead.`;
      } else if (error.message.includes('401') || error.message.includes('Invalid') || error.message.includes('status 4')) {
        userMessage = 'Invalid email or password. Make sure you are using your LibreLinkUp credentials (not your FreeStyle Libre app credentials).';
      } else if (error.message.includes('403')) {
        userMessage = 'Access denied by LibreLinkUp. Open the LibreLinkUp app on your phone, accept any Terms of Service prompts, and try again.';
      }
      return NextResponse.json({ error: userMessage }, { status: 400 });
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
        libreUserId: authResult.userId,
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
        libreUserId: authResult.userId,
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
