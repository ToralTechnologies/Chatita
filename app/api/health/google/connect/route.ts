import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/health/google/connect
 *
 * Starts the Google Health API OAuth 2.0 authorization flow.
 *
 * IMPORTANT — Google Health API status (as of June 2026):
 * The Google Health API (developers.google.com/health) replaces both Google Fit
 * and the legacy Fitbit Web API (scheduled for shutdown September 2026).
 * The API is currently in limited developer access/preview.
 * You must apply for access at developers.google.com/health before production use.
 *
 * OAuth uses standard Google OAuth 2.0 endpoints.
 * Scopes below are based on published Google Health API documentation — verify
 * current scope names at developers.google.com/health/api/reference/rest before publishing.
 */

// TODO: Update these scopes once Google Health API GA scopes are confirmed.
// Current scopes are best-known from developer preview docs.
const GOOGLE_HEALTH_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/fitness.activity.read',   // steps, active minutes
  'https://www.googleapis.com/auth/fitness.sleep.read',      // sleep
  'https://www.googleapis.com/auth/fitness.heart_rate.read', // heart rate
  'https://www.googleapis.com/auth/fitness.body.read',       // weight (optional)
].join(' ');

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Falls back to the standard Google OAuth credentials (same client works for both
    // NextAuth sign-in and Fitness API — just needs Fitness API enabled in Google Cloud).
    const clientId = process.env.GOOGLE_HEALTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_HEALTH_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/health/google/callback`;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: 'Google credentials not configured. Set GOOGLE_CLIENT_ID (or GOOGLE_HEALTH_CLIENT_ID) in environment variables.' },
        { status: 500 }
      );
    }

    // Encode state with userId + timestamp to prevent CSRF
    const state = Buffer.from(
      JSON.stringify({ userId: session.user.id, timestamp: Date.now(), nonce: Math.random().toString(36).slice(2) })
    ).toString('base64url');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', GOOGLE_HEALTH_SCOPES);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'offline');   // request refresh token
    authUrl.searchParams.set('prompt', 'consent');        // always show consent to get refresh token

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('[health/google/connect] error:', error);
    return NextResponse.json({ error: 'Failed to initiate Google Health connection' }, { status: 500 });
  }
}
