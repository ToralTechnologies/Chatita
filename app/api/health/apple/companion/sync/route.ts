import { NextResponse } from 'next/server';

/**
 * POST /api/health/apple/companion/sync
 *
 * TODO — Future iOS companion app endpoint.
 *
 * This endpoint will accept normalized HealthKit daily summaries from a future
 * Chatita iOS companion app and upsert them into HealthDailySummary.
 *
 * Design notes (see docs/APPLE_HEALTHKIT_COMPANION_PLAN.md):
 * - iOS app reads HealthKit data with user permission
 * - Normalizes into daily summaries matching HealthDailySummary schema
 * - Sends to this endpoint with an authenticated session (JWT or API key TBD)
 * - Chatita backend upserts summaries for provider = 'apple_healthkit_companion_future'
 *
 * Authentication design is not finalized — stub returns 501 until ready.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Not implemented',
      message: 'iOS HealthKit companion sync is planned for a future release. See docs/APPLE_HEALTHKIT_COMPANION_PLAN.md for the design.',
    },
    { status: 501 }
  );
}
