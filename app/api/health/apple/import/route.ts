import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  parseAppleHealthXml,
  aggregateToDailySummaries,
  APPLE_DEFAULT_TYPES,
  type DailySummaryPayload,
} from '@/lib/health/apple-health-parser';

// Direct server-side parsing is only viable for small files because Vercel
// serverless caps the request body at ~4.5MB. Large Apple Health exports are
// parsed in the browser and POSTed here as compact per-day summaries (JSON).
const MAX_SIZE_MB = Number(process.env.HEALTH_IMPORT_MAX_FILE_SIZE_MB || '4');
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const PROVIDER = 'apple_health_export';

/** Persist a batch of per-day summaries, returning how many days were written. */
async function upsertDailySummaries(
  userId: string,
  summaries: DailySummaryPayload[]
): Promise<number> {
  let daysUpserted = 0;

  for (const s of summaries) {
    const date = new Date(`${s.date}T00:00:00`);
    if (isNaN(date.getTime())) continue;

    const data = {
      steps: s.steps != null ? Math.round(s.steps) : undefined,
      distanceMeters: s.distanceMeters,
      activeCalories: s.activeCalories,
      exerciseMinutes: s.exerciseMinutes != null ? Math.round(s.exerciseMinutes) : undefined,
      sleepMinutes: s.sleepMinutes != null ? Math.round(s.sleepMinutes) : undefined,
      averageHeartRate: s.averageHeartRate != null ? Math.round(s.averageHeartRate) : undefined,
      restingHeartRate: s.restingHeartRate != null ? Math.round(s.restingHeartRate) : undefined,
    };

    await prisma.healthDailySummary.upsert({
      where: { userId_date_provider: { userId, date, provider: PROVIDER } },
      update: { ...data, importedAt: new Date() },
      create: { userId, date, provider: PROVIDER, ...data },
    });
    daysUpserted++;
  }

  return daysUpserted;
}

/**
 * POST /api/health/apple/import
 *
 * Two intake modes:
 *  1. JSON `{ summaries: DailySummaryPayload[] }` — the browser already parsed
 *     export.xml (preferred for real exports; avoids the 4.5MB body limit).
 *  2. multipart/form-data with a small `.xml` file — parsed here directly.
 *
 * The raw export file is never stored — only normalized per-day summaries.
 */
export async function POST(request: Request) {
  let importJobId: string | null = null;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const contentType = request.headers.get('content-type') || '';

    // ── Mode 1: pre-parsed summaries (browser-side extraction) ──────────────
    if (contentType.includes('application/json')) {
      let body: { summaries?: DailySummaryPayload[]; recordsProcessed?: number; filename?: string };
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
      }

      const summaries = Array.isArray(body.summaries) ? body.summaries : [];
      if (summaries.length === 0) {
        return NextResponse.json(
          { error: 'No matching health data found for the selected types. Try selecting more data types or a file with more history.' },
          { status: 400 }
        );
      }

      const importJob = await prisma.healthImport.create({
        data: {
          userId,
          provider: PROVIDER,
          importType: 'manual_export',
          filename: body.filename ?? 'export.xml',
          status: 'processing',
        },
      });
      importJobId = importJob.id;

      const daysUpserted = await upsertDailySummaries(userId, summaries);

      await prisma.healthImport.update({
        where: { id: importJob.id },
        data: {
          status: 'completed',
          recordsProcessed: body.recordsProcessed ?? daysUpserted,
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        recordsProcessed: body.recordsProcessed ?? daysUpserted,
        daysImported: daysUpserted,
      });
    }

    // ── Mode 2: small direct file upload (server-side parse) ────────────────
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const filename = file.name.toLowerCase();
    if (!filename.endsWith('.xml')) {
      // Zips and large files must be parsed client-side and sent as summaries.
      return NextResponse.json(
        {
          error:
            'Please upload through the in-app importer so large files and zips can be processed in your browser.',
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `This file is larger than ${MAX_SIZE_MB} MB. The in-app importer handles large exports automatically — please use the Upload button rather than posting the file directly.`,
        },
        { status: 413 }
      );
    }

    let selectedTypes: Set<string>;
    try {
      const raw = formData.get('selectedTypes') as string | null;
      const parsed: string[] = raw ? JSON.parse(raw) : [];
      selectedTypes = parsed.length > 0 ? new Set(parsed) : new Set(APPLE_DEFAULT_TYPES);
    } catch {
      selectedTypes = new Set(APPLE_DEFAULT_TYPES);
    }

    const importJob = await prisma.healthImport.create({
      data: { userId, provider: PROVIDER, importType: 'manual_export', filename: file.name, status: 'processing' },
    });
    importJobId = importJob.id;

    const xmlContent = await file.text();
    if (!xmlContent.includes('<HealthData') && !xmlContent.includes('<Record')) {
      await prisma.healthImport.update({
        where: { id: importJob.id },
        data: { status: 'failed', errorMessage: 'File does not appear to be a valid Apple Health export' },
      });
      return NextResponse.json(
        { error: 'File does not appear to be a valid Apple Health export (missing <HealthData> element).' },
        { status: 400 }
      );
    }

    const records = parseAppleHealthXml(xmlContent, selectedTypes);
    const summaries = aggregateToDailySummaries(records);
    const daysUpserted = await upsertDailySummaries(userId, summaries);

    await prisma.healthImport.update({
      where: { id: importJob.id },
      data: { status: 'completed', recordsProcessed: records.length, completedAt: new Date() },
    });

    return NextResponse.json({ success: true, recordsProcessed: records.length, daysImported: daysUpserted });
  } catch (error) {
    console.error('[health/apple/import] error:', error);
    if (importJobId) {
      await prisma.healthImport
        .update({ where: { id: importJobId }, data: { status: 'failed', errorMessage: 'Import failed while saving data.' } })
        .catch(() => {});
    }
    return NextResponse.json({ error: 'Import failed. Please try again.' }, { status: 500 });
  }
}
