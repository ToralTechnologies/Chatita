import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/dexcom/authorize
 * Redirects user to Dexcom OAuth authorization page
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = process.env.DEXCOM_CLIENT_ID;
    const redirectUri = process.env.DEXCOM_REDIRECT_URI;
    const environment = process.env.DEXCOM_ENVIRONMENT || 'sandbox';

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: 'Dexcom integration not configured. Please set DEXCOM_CLIENT_ID and DEXCOM_REDIRECT_URI in environment variables.' },
        { status: 500 }
      );
    }

    // Determine base URL based on environment
    const baseUrl =
      environment === 'production'
        ? 'https://api.dexcom.com'
        : 'https://sandbox-api.dexcom.com';

    // Store user ID in state parameter for verification in callback
    const state = Buffer.from(
      JSON.stringify({
        userId: session.user.id,
        timestamp: Date.now(),
      })
    ).toString('base64');

    // Build authorization URL
    const authUrl = new URL(`${baseUrl}/v3/oauth2/login`);
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'offline_access'); // Allows refresh tokens
    authUrl.searchParams.append('state', state);

    // Redirect to Dexcom authorization page
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Dexcom authorization error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Dexcom authorization' },
      { status: 500 }
    );
  }
}
