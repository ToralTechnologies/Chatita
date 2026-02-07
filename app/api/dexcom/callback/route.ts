import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/dexcom/callback
 * Handles OAuth callback from Dexcom
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for authorization errors
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?dexcom_error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?dexcom_error=missing_params`
      );
    }

    // Verify state parameter
    let userId: string;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      userId = stateData.userId;

      // Verify timestamp (prevent replay attacks - state should be recent)
      const stateAge = Date.now() - stateData.timestamp;
      if (stateAge > 10 * 60 * 1000) {
        // 10 minutes
        throw new Error('State parameter expired');
      }
    } catch (err) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?dexcom_error=invalid_state`
      );
    }

    // Exchange authorization code for access token
    const clientId = process.env.DEXCOM_CLIENT_ID!;
    const clientSecret = process.env.DEXCOM_CLIENT_SECRET!;
    const redirectUri = process.env.DEXCOM_REDIRECT_URI!;
    const environment = process.env.DEXCOM_ENVIRONMENT || 'sandbox';

    const baseUrl =
      environment === 'production'
        ? 'https://api.dexcom.com'
        : 'https://sandbox-api.dexcom.com';

    const tokenResponse = await fetch(`${baseUrl}/v3/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Dexcom token exchange failed:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?dexcom_error=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Save or update Dexcom integration in database
    await prisma.dexcomIntegration.upsert({
      where: { userId },
      create: {
        userId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: expiresAt,
        environment,
        isActive: true,
        lastSyncAt: null,
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: expiresAt,
        isActive: true,
        lastError: null,
      },
    });

    // Redirect back to settings with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?dexcom_success=true`
    );
  } catch (error) {
    console.error('Dexcom callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?dexcom_error=unknown`
    );
  }
}
