/**
 * Apple Health export parser — shared between the browser and the server.
 *
 * This module is intentionally dependency-free and isomorphic so the heavy
 * XML parsing + aggregation can run in the browser (sidestepping Vercel's
 * ~4.5MB request-body limit), with only the small per-day summaries sent to
 * the API. The same functions are reused server-side for small direct uploads.
 */

// Apple Health export <Record type="..."> identifiers we understand.
export const APPLE_SUPPORTED_TYPES: Record<string, string> = {
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

export const APPLE_DEFAULT_TYPES = [
  'steps',
  'distance_m',
  'active_calories',
  'exercise_minutes',
  'sleep',
];

export interface ParsedRecord {
  metricType: string;
  value: number;
  unit: string;
  startTime: Date;
  endTime: Date;
}

/** Compact per-day summary — this is the small payload sent browser → server. */
export interface DailySummaryPayload {
  date: string; // ISO date (yyyy-mm-dd), midnight-local
  steps?: number;
  distanceMeters?: number;
  activeCalories?: number;
  exerciseMinutes?: number;
  sleepMinutes?: number;
  averageHeartRate?: number;
  restingHeartRate?: number;
  weightKg?: number;
  bloodGlucose?: number;
}

/**
 * Parse Apple Health export.xml using a streaming regex scan. Apple Health
 * stores each sample as a single self-closing `<Record .../>` element with
 * attributes, so we can extract them without building a full DOM — critical
 * for the very large export files Apple produces (often 100s of MB).
 */
export function parseAppleHealthXml(
  xml: string,
  selectedTypes: Set<string>
): ParsedRecord[] {
  const results: ParsedRecord[] = [];
  const recordPattern = /<Record\s([^>]+?)\/?>|<Record\s([^>]+?)>/g;
  let match: RegExpExecArray | null;

  while ((match = recordPattern.exec(xml)) !== null) {
    const attrs = match[1] || match[2];
    if (!attrs) continue;

    const typeMatch = /\btype="([^"]+)"/.exec(attrs);
    if (!typeMatch) continue;

    const metricType = APPLE_SUPPORTED_TYPES[typeMatch[1]];
    if (!metricType || !selectedTypes.has(metricType)) continue;

    const valMatch = /\bvalue="([^"]+)"/.exec(attrs);
    const unitMatch = /\bunit="([^"]+)"/.exec(attrs);
    const startMatch = /\bstartDate="([^"]+)"/.exec(attrs);
    const endMatch = /\bendDate="([^"]+)"/.exec(attrs);

    if (!startMatch || !endMatch) continue;

    // Sleep records carry a categorical value (e.g. "HKCategoryValueSleepAnalysisAsleep")
    // rather than a number; duration is derived from start/end, so value can be 0.
    let value = valMatch ? parseFloat(valMatch[1]) : 0;
    if (isNaN(value)) value = 0;
    if (metricType !== 'sleep' && (!valMatch || isNaN(parseFloat(valMatch[1])))) continue;

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

interface DayAccumulator {
  date: Date;
  steps?: number;
  distanceMeters?: number;
  activeCalories?: number;
  exerciseMinutes?: number;
  sleepMinutes?: number;
  avgHR?: number;
  hrSamples?: number;
  restingHeartRate?: number;
  weightKg?: number;
  bloodGlucose?: number;
}

/** Aggregate raw samples into per-day summaries keyed by local date. */
export function aggregateToDailySummaries(records: ParsedRecord[]): DailySummaryPayload[] {
  const days = new Map<string, DayAccumulator>();

  for (const r of records) {
    if (isNaN(r.startTime.getTime())) continue;
    const d = new Date(r.startTime);
    d.setHours(0, 0, 0, 0);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (!days.has(key)) days.set(key, { date: d });
    const day = days.get(key)!;

    switch (r.metricType) {
      case 'steps':
        day.steps = (day.steps ?? 0) + r.value;
        break;
      case 'distance_m': {
        const meters =
          r.unit === 'km' ? r.value * 1000 : r.unit === 'mi' ? r.value * 1609.344 : r.value;
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
        const durationMin = Math.round((r.endTime.getTime() - r.startTime.getTime()) / 60000);
        if (durationMin > 0) day.sleepMinutes = (day.sleepMinutes ?? 0) + durationMin;
        break;
      }
      case 'heart_rate':
        day.avgHR = ((day.avgHR ?? 0) * (day.hrSamples ?? 0) + r.value) / ((day.hrSamples ?? 0) + 1);
        day.hrSamples = (day.hrSamples ?? 0) + 1;
        break;
      case 'resting_heart_rate':
        day.restingHeartRate = r.value;
        break;
      case 'weight_kg':
        day.weightKg = r.value; // last sample wins
        break;
      case 'blood_glucose':
        day.bloodGlucose = r.value;
        break;
    }
  }

  return Array.from(days.values()).map((day) => ({
    date: `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, '0')}-${String(day.date.getDate()).padStart(2, '0')}`,
    steps: day.steps != null ? Math.round(day.steps) : undefined,
    distanceMeters: day.distanceMeters,
    activeCalories: day.activeCalories,
    exerciseMinutes: day.exerciseMinutes != null ? Math.round(day.exerciseMinutes) : undefined,
    sleepMinutes: day.sleepMinutes != null ? Math.round(day.sleepMinutes) : undefined,
    averageHeartRate: day.avgHR != null ? Math.round(day.avgHR) : undefined,
    restingHeartRate: day.restingHeartRate != null ? Math.round(day.restingHeartRate) : undefined,
    weightKg: day.weightKg,
    bloodGlucose: day.bloodGlucose,
  }));
}

/**
 * Extract export.xml text from an Apple Health export File (in the browser).
 * Handles both a raw .xml file and a .zip containing `apple_health_export/export.xml`.
 * Uses fflate's async unzip with a filter so only export.xml is decompressed.
 */
export async function extractAppleHealthXml(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.xml')) {
    return file.text();
  }

  if (name.endsWith('.zip')) {
    const { unzip } = await import('fflate');
    const buf = new Uint8Array(await file.arrayBuffer());

    const entry: Uint8Array = await new Promise((resolve, reject) => {
      unzip(
        buf,
        {
          // Only decompress the export.xml entry — skip ECG/workout-route files
          // which can be huge and are not needed.
          filter: (f) => /(^|\/)export\.xml$/i.test(f.name),
        },
        (err, unzipped) => {
          if (err) return reject(err);
          const key = Object.keys(unzipped).find((k) => /(^|\/)export\.xml$/i.test(k));
          if (!key) return reject(new Error('export.xml not found inside the zip'));
          resolve(unzipped[key]);
        }
      );
    });

    return new TextDecoder('utf-8').decode(entry);
  }

  throw new Error('Unsupported file type. Please upload export.xml or the Apple Health .zip.');
}
