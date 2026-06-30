import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncLibreReadings } from '@/lib/libre-sync';

/**
 * POST /api/cron/libre-sync
 * Automatic sync for all users with Libre integration
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active Libre integrations
    const integrations = await prisma.libreIntegration.findMany({
      where: {
        isActive: true,
        autoSync: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    console.log(`[Libre Cron] Found ${integrations.length} active integrations to sync`);

    const results = {
      total: integrations.length,
      synced: 0,
      failed: 0,
      skipped: 0,
      errors: [] as any[],
    };

    for (const integration of integrations) {
      try {
        // syncLibreReadings throttles itself via minIntervalMs (the per-user
        // sync frequency) and records its own lastError on failure.
        const result = await syncLibreReadings(integration.userId, {
          minIntervalMs: integration.syncFrequency * 60 * 1000,
        });

        if (result.skipped) {
          results.skipped++;
          continue;
        }
        if (!result.ok) {
          results.failed++;
          results.errors.push({ userId: integration.userId, email: integration.user.email, error: result.error });
          console.error(`[Libre Cron] Failed to sync for user ${integration.user.email}: ${result.error}`);
          continue;
        }

        results.synced++;
        console.log(
          `[Libre Cron] Synced ${result.imported}/${result.total} readings for user ${integration.user.email}`
        );
      } catch (error: any) {
        results.failed++;
        results.errors.push({ userId: integration.userId, email: integration.user.email, error: error.message });
        console.error(`[Libre Cron] Failed to sync for user ${integration.user.email}:`, error);
      }
    }

    console.log(`[Libre Cron] Completed:`, results);

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('[Libre Cron] Fatal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Vercel Cron invokes scheduled jobs with GET, so GET must run the same worker
// (the secret check inside POST still applies). Without this, the scheduled
// Libre sync never actually ran.
export async function GET(request: Request) {
  return POST(request);
}
