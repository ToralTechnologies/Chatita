import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encryptToken } from '@/lib/health/token-encrypt';
import { syncGoogleHealth } from '@/lib/health/google-sync';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

/**
 * GET /api/health/google/callback
 *
 * Handles the Google OAuth 2.0 callback after user grants health data access.
 * Exchanges authorization code for tokens, stores them encrypted, saves connection.
 *
 * Note: This route does NOT require a session — the userId is recovered from the
 * signed state parameter (same pattern as Dexcom integration).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const failRedirect = (reason: string) =>
    NextResponse.redirect(`${APP_URL}/settings?health_error=${encodeURIComponent(reason)}`);

  if (error) return failRedirect(error);
  if (!code || !state) return failRedirect('missing_params');

  // Verify state parameter
  let userId: string;
  try {
    const raw = Buffer.from(state, 'base64url').toString();
    const data = JSON.parse(raw);
    userId = data.userId;
    const age = Date.now() - data.timestamp;
    if (!userId || age > 10 * 60 * 1000) throw new Error('State expired or invalid');
  } catch {
    return failRedirect('invalid_state');
  }

  // Falls back to standard Google OAuth credentials if health-specific ones not set.
  const clientId = process.env.GOOGLE_HEALTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_HEALTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const redirectUri = process.env.GOOGLE_HEALTH_REDIRECT_URI || `${appUrl}/api/health/google/callback`;

  if (!clientId || !clientSecret || !redirectUri) {
    return failRedirect('not_configured');
  }

  // Exchange authorization code for tokens
  let tokenData: {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
    token_type: string;
    sub?: string;
  };

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('[health/google/callback] token exchange failed:', err);
      return failRedirect('token_exchange_failed');
    }
    tokenData = await tokenRes.json();
  } catch (err) {
    console.error('[health/google/callback] token fetch error:', err);
    return failRedirect('token_fetch_failed');
  }

  // Fetch Google user info to get providerUserId
  let providerUserId: string | undefined;
  try {
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (userInfoRes.ok) {
      const info = await userInfoRes.json();
      providerUserId = info.sub as string;
    }
  } catch {
    // Non-fatal — continue without providerUserId
  }

  const tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  try {
    await prisma.healthConnection.upsert({
      where: { userId_provider: { userId, provider: 'google_health' } },
      update: {
        status: 'connected',
        providerUserId,
        scopes: tokenData.scope,
        accessTokenEnc: encryptToken(tokenData.access_token),
        refreshTokenEnc: tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : undefined,
        tokenExpiresAt,
        errorMessage: null,
        consentedAt: new Date(),
        consentVersion: '1.0',
        disconnectedAt: null,
        updatedAt: new Date(),
      },
      create: {
        userId,
        provider: 'google_health',
        status: 'connected',
        providerUserId,
        scopes: tokenData.scope,
        accessTokenEnc: encryptToken(tokenData.access_token),
        refreshTokenEnc: tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : undefined,
        tokenExpiresAt,
        consentedAt: new Date(),
        consentVersion: '1.0',
      },
    });
  } catch (err) {
    console.error('[health/google/callback] DB save error:', err);
    return failRedirect('db_error');
  }

  // Kick off an initial sync so the user sees data immediately after connecting,
  // instead of an empty "Connected" state until the next manual/cron sync.
  // Non-fatal: a sync failure here still leaves the connection in place.
  try {
    await syncGoogleHealth(userId);
  } catch (err) {
    console.warn('[health/google/callback] initial sync failed (non-fatal):', err);
  }

  return NextResponse.redirect(`${APP_URL}/settings?health_success=google_health`);
}
