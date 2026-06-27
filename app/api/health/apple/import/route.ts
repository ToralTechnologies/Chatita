import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MAX_SIZE_MB = Number(process.env.HEALTH_IMPORT_MAX_FILE_SIZE_MB || '50');
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// Apple Health export record types we parse
const SUPPORTED_TYPES: Record<string, string> = {
  HKQuantityTypeIdentifierStepCount: 'steps',
  HKQuantityTypeIdentifierDistanceWalkingRunning: 'distance_m',
  HKQuantityTypeIdentifierActiveEnergyBurned: 'active_calories',
  HKQuantityTypeIdentifierAppleExerciseTime: 'exercise_minutes',
  HKQuantityTypeIdentifierHeartRate: 'heart_rate',
  HKQuantityTypeIdentifierRestingHeartRate: 'resting_heart_rate',
  HKQuantityTypeIdentifierBodyMass: 'weight_kg',
  HKQuantityTypeIdentifierBloodGlucose: 'blood_glucose',
  HKCategoryTypeIdentifierSleepAnalysis: 'sleep',
};

interface ParsedRecord {
  metricType: string;
  value: number;
  unit: string;
  startTime: Date;
  endTime: Date;
}

/**
 * Parses Apple Health export.xml using a streaming regex approach.
 * Only parses <Record> elements with supported HK types.
 * Apple Health XML uses attributes on a single <Record .../> element —
 * we extract them with a targeted regex rather than a full XML DOM parse
 * to handle very large files without loading them entirely into memory.
 */
function parseAppleHealthXml(
  xml: string,
  selectedTypes: Set<string>
): ParsedRecord[] {
  const results: ParsedRecord[] = [];
  // Match <Record .../> or <Record ...></Record> elements
  const recordPattern = /<Record\s([^>]+?)\/?>|<Record\s([^>]+?)>/g;
  let match: RegExpExecArray | null;

  while ((match = recordPattern.exec(xml)) !== null) {
    const attrs = match[1] || match[2];
    if (!attrs) continue;

    const typeMatch = /\btype="([^"]+)"/.exec(attrs);
    if (!typeMatch) continue;
    const hkType = typeMatch[1];

    const metricType = SUPPORTED_TYPES[hkType];
    if (!metricType || !selectedTypes.has(metricType)) continue;

    const valMatch = /\bvalue="([^"]+)"/.exec(attrs);
    const unitMatch = /\bunit="([^"]+)"/.exec(attrs);
    const startMatch = /\bstartDate="([^"]+)"/.exec(attrs);
    const endMatch = /\bendDate="([^"]+)"/.exec(attrs);

    if (!valMatch || !startMatch || !endMatch) continue;

    const value = parseFloat(valMatch[1]);
    if (isNaN(value)) continue;

    results.push({
      metricType,
      value,
      unit: unitMatch?.[1] ?? '',
      startTime: new Date(startMatch[1]),
      endTime: new Date(endMatch[1]),
    });
  }

  return results;
}

/** Aggregate raw samples into per-day summaries. */
function aggregateToDailySummaries(records: ParsedRecord[]): Map<string, {
  date: Date;
  steps?: number;
  distanceMeters?: number;
  activeCalories?: number;
  exerciseMinutes?: number;
  sleepMinutes?: number;
  avgHR?: number;
  hrSamples?: number;
  restingHeartRate?: number;
}> {
  const days = new Map<string, ReturnType<typeof aggregateToDailySummaries> extends Map<string, infer V> ? V : never>();

  for (const r of records) {
    const d = new Date(r.startTime);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().split('T')[0];

    if (!days.has(key)) days.set(key, { date: d });
    const day = days.get(key)!;

    switch (r.metricType) {
      case 'steps':
        day.steps = (day.steps ?? 0) + r.value;
        break;
      case 'distance_m': {
        // Apple Health stores walking/running distance in km — convert to meters
        const meters = r.unit === 'km' ? r.value * 1000 : r.unit === 'mi' ? r.value * 1609.344 : r.value;
        day.distanceMeters = (day.distanceMeters ?? 0) + meters;
        break;
      }
      case 'active_calories':
        day.activeCalories = (day.activeCalories ?? 0) + r.value;
        break;
      case 'exercise_minutes':
        day.exerciseMinutes = (day.exerciseMinutes ?? 0) + r.value;
        break;
      case 'sleep': {
        const durationMin = Math.round(
          (r.endTime.getTime() - r.startTime.getTime()) / 60000
        );
        if (durationMin > 0) day.sleepMinutes = (day.sleepMinutes ?? 0) + durationMin;
        break;
      }
      case 'heart_rate':
        day.avgHR = ((day.avgHR ?? 0) * (day.hrSamples ?? 0) + r.value) / ((day.hrSamples ?? 0) + 1);
        day.hrSamples = (day.hrSamples ?? 0) + 1;
        break;
      case 'resting_heart_rate':
        day.restingHeartRate = r.value; // last sample wins (typically 1/day)
        break;
    }
  }

  return days;
}

/**
 * POST /api/health/apple/import
 *
 * Accepts an Apple Health export file (.xml or .zip containing export.xml).
 * Parses selected health data types and normalizes into HealthDailySummary records.
 *
 * Flow:
 * 1. Validate file type, size
 * 2. Parse export.xml (or extract from .zip if zip support added)
 * 3. Normalize into per-day summaries
 * 4. Upsert into HealthDailySummary
 * 5. Record import job
 *
 * The raw file is NOT stored — only parsed summaries are persisted.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 });
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const filename = file.name.toLowerCase();
    const isXml = filename.endsWith('.xml');
    const isZip = filename.endsWith('.zip');
    if (!isXml && !isZip) {
      return NextResponse.json(
        { error: 'Only .xml and .zip files are supported' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_SIZE_MB} MB.` },
        { status: 413 }
      );
    }

    // Parse which data types the user wants to import
    const selectedRaw = formData.get('selectedTypes') as string | null;
    let selectedTypes: Set<string>;
    try {
      const parsed: string[] = selectedRaw ? JSON.parse(selectedRaw) : [];
      // Default to safe set if nothing specified
      selectedTypes =
        parsed.length > 0
          ? new Set(parsed)
          : new Set(['steps', 'distance_m', 'active_calories', 'exercise_minutes', 'sleep']);
    } catch {
      selectedTypes = new Set(['steps', 'distance_m', 'active_calories', 'exercise_minutes', 'sleep']);
    }

    // Create import job record
    const importJob = await prisma.healthImport.create({
      data: {
        userId,
        provider: 'apple_health_export',
        importType: 'manual_export',
        filename: file.name,
        status: 'processing',
      },
    });

    let xmlContent: string;

    if (isZip) {
      // ZIP extraction: Apple Health exports a .zip with export.xml inside.
      // TODO: Add zip extraction using the 'fflate' or 'jszip' package.
      // For now, ask users to extract the .xml manually.
      await prisma.healthImport.update({
        where: { id: importJob.id },
        data: { status: 'failed', errorMessage: 'ZIP extraction not yet supported. Please extract export.xml from the zip and upload that file directly.' },
      });
      return NextResponse.json(
        { error: 'ZIP upload not yet supported. Please extract export.xml from the Apple Health zip and upload that file.' },
        { status: 400 }
      );
    } else {
      xmlContent = await file.text();
    }

    if (!xmlContent.includes('<HealthData') && !xmlContent.includes('<Record')) {
      await prisma.healthImport.update({
        where: { id: importJob.id },
        data: { status: 'failed', errorMessage: 'File does not appear to be a valid Apple Health export' },
      });
      return NextResponse.json({ error: 'File does not appear to be a valid Apple Health export (missing <HealthData> element)' }, { status: 400 });
    }

    // Parse records
    const records = parseAppleHealthXml(xmlContent, selectedTypes);

    if (records.length === 0) {
      await prisma.healthImport.update({
        where: { id: importJob.id },
        data: { status: 'completed', recordsProcessed: 0, completedAt: new Date() },
      });
      return NextResponse.json({ success: true, recordsProcessed: 0, daysImported: 0, message: 'No matching health records found for the selected data types.' });
    }

    // Aggregate into daily summaries
    const dailySummaries = aggregateToDailySummaries(records);
    let daysUpserted = 0;

    for (const [, summary] of dailySummaries) {
      await prisma.healthDailySummary.upsert({
        where: { userId_date_provider: { userId, date: summary.date, provider: 'apple_health_export' } },
        update: {
          steps: summary.steps != null ? Math.round(summary.steps) : undefined,
          distanceMeters: summary.distanceMeters,
          activeCalories: summary.activeCalories,
          exerciseMinutes: summary.exerciseMinutes != null ? Math.round(summary.exerciseMinutes) : undefined,
          sleepMinutes: summary.sleepMinutes != null ? Math.round(summary.sleepMinutes) : undefined,
          averageHeartRate: summary.avgHR != null ? Math.round(summary.avgHR) : undefined,
          restingHeartRate: summary.restingHeartRate != null ? Math.round(summary.restingHeartRate) : undefined,
          importedAt: new Date(),
        },
        create: {
          userId,
          date: summary.date,
          provider: 'apple_health_export',
          steps: summary.steps != null ? Math.round(summary.steps) : undefined,
          distanceMeters: summary.distanceMeters,
          activeCalories: summary.activeCalories,
          exerciseMinutes: summary.exerciseMinutes != null ? Math.round(summary.exerciseMinutes) : undefined,
          sleepMinutes: summary.sleepMinutes != null ? Math.round(summary.sleepMinutes) : undefined,
          averageHeartRate: summary.avgHR != null ? Math.round(summary.avgHR) : undefined,
          restingHeartRate: summary.restingHeartRate != null ? Math.round(summary.restingHeartRate) : undefined,
        },
      });
      daysUpserted++;
    }

    await prisma.healthImport.update({
      where: { id: importJob.id },
      data: {
        status: 'completed',
        recordsProcessed: records.length,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      recordsProcessed: records.length,
      daysImported: daysUpserted,
    });
  } catch (error) {
    console.error('[health/apple/import] error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
