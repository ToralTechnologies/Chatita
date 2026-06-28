/**
 * Apple Health export parser — shared between the browser and the server.
 *
 * Apple Health exports are huge (often 1-3 GB zipped, far larger uncompressed),
 * so this module supports a true streaming path: read the file as a stream,
 * decompress only `export.xml`, parse <Record> elements on the fly, and keep
 * only the small per-day summaries. Memory stays bounded regardless of file
 * size. A simpler whole-string path is kept for small server-side uploads.
 *
 * The module is dependency-light and isomorphic (fflate is imported lazily,
 * only on the streaming/zip path).
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

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Parse a single <Record ...> attribute string into a ParsedRecord (or null). */
function parseRecordAttrs(attrs: string, selectedTypes: Set<string>): ParsedRecord | null {
  const typeMatch = /\btype="([^"]+)"/.exec(attrs);
  if (!typeMatch) return null;

  const metricType = APPLE_SUPPORTED_TYPES[typeMatch[1]];
  if (!metricType || !selectedTypes.has(metricType)) return null;

  const valMatch = /\bvalue="([^"]+)"/.exec(attrs);
  const unitMatch = /\bunit="([^"]+)"/.exec(attrs);
  const startMatch = /\bstartDate="([^"]+)"/.exec(attrs);
  const endMatch = /\bendDate="([^"]+)"/.exec(attrs);

  if (!startMatch || !endMatch) return null;

  // Sleep records carry a categorical value rather than a number; duration is
  // derived from start/end, so a numeric value is optional for sleep only.
  const parsedVal = valMatch ? parseFloat(valMatch[1]) : NaN;
  if (metricType !== 'sleep' && isNaN(parsedVal)) return null;

  return {
    metricType,
    value: isNaN(parsedVal) ? 0 : parsedVal,
    unit: unitMatch?.[1] ?? '',
    startTime: new Date(startMatch[1]),
    endTime: new Date(endMatch[1]),
  };
}

/** Fold one record into the per-day accumulator map. */
function addRecordToDays(days: Map<string, DayAccumulator>, r: ParsedRecord): void {
  if (isNaN(r.startTime.getTime())) return;
  const d = new Date(r.startTime);
  d.setHours(0, 0, 0, 0);
  const key = dayKey(d);

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
      day.weightKg = r.value;
      break;
    case 'blood_glucose':
      day.bloodGlucose = r.value;
      break;
  }
}

function daysToSummaries(days: Map<string, DayAccumulator>): DailySummaryPayload[] {
  return Array.from(days.values()).map((day) => ({
    date: dayKey(day.date),
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
 * Incremental aggregator: feed it decoded XML text in chunks (which may split
 * <Record> tags across boundaries) and it folds complete records into per-day
 * summaries, holding only a small buffer + the day map in memory.
 */
export class AppleHealthAggregator {
  private buffer = '';
  private days = new Map<string, DayAccumulator>();
  recordCount = 0;
  private readonly recordRe = /<Record\s([^>]*?)\/?>/g;

  constructor(private readonly selectedTypes: Set<string>) {}

  pushText(text: string): void {
    this.buffer += text;
    this.recordRe.lastIndex = 0;
    let lastEnd = 0;
    let m: RegExpExecArray | null;
    while ((m = this.recordRe.exec(this.buffer)) !== null) {
      const rec = parseRecordAttrs(m[1], this.selectedTypes);
      if (rec) {
        addRecordToDays(this.days, rec);
        this.recordCount++;
      }
      lastEnd = this.recordRe.lastIndex;
    }

    // Keep only the unprocessed tail (which may hold a partial <Record ...>).
    this.buffer = this.buffer.slice(lastEnd);

    // Guard against unbounded growth across long non-Record stretches (e.g.
    // large <Workout>/ECG blocks): if no partial record tag is pending, drop
    // all but a small suffix that could hold a split "<Record" prefix.
    if (this.buffer.length > 65536 && this.buffer.lastIndexOf('<Record') === -1) {
      this.buffer = this.buffer.slice(-16);
    }
  }

  finalize(): DailySummaryPayload[] {
    return daysToSummaries(this.days);
  }
}

export interface StreamProgress {
  bytesRead: number;
  totalBytes: number;
}

/**
 * Stream a .zip or .xml Apple Health export entirely in the browser and return
 * compact per-day summaries. Memory is bounded — the file is read as a stream
 * and only `export.xml` is decompressed (other entries like ECG/workout routes
 * are skipped, never inflated). Safe for multi-GB exports.
 */
export async function streamAppleHealthFile(
  file: File,
  selectedTypes: Set<string>,
  onProgress?: (p: StreamProgress) => void
): Promise<{ summaries: DailySummaryPayload[]; recordCount: number }> {
  const name = file.name.toLowerCase();
  const agg = new AppleHealthAggregator(selectedTypes);
  const decoder = new TextDecoder('utf-8');
  const total = file.size;
  let bytesRead = 0;
  let sawAnyXml = false;

  // ── Plain .xml: stream-decode directly ────────────────────────────────────
  if (name.endsWith('.xml')) {
    const reader = file.stream().getReader();
    let lastYield = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      sawAnyXml = true;
      bytesRead += value.byteLength;
      agg.pushText(decoder.decode(value, { stream: true }));
      if (bytesRead - lastYield > 4 * 1024 * 1024) {
        lastYield = bytesRead;
        onProgress?.({ bytesRead, totalBytes: total });
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    agg.pushText(decoder.decode());
    onProgress?.({ bytesRead, totalBytes: total });
    return { summaries: agg.finalize(), recordCount: agg.recordCount };
  }

  // ── .zip: stream-unzip, decompressing only export.xml ─────────────────────
  if (name.endsWith('.zip')) {
    const { Unzip, UnzipInflate } = await import('fflate');

    let exportDone = false;
    let streamError: Error | null = null;
    const isExport = (n: string) => /(^|\/)export\.xml$/i.test(n);

    const unzipper = new Unzip();
    unzipper.register(UnzipInflate);
    unzipper.onfile = (entry) => {
      if (!isExport(entry.name)) return; // don't start() => never decompressed
      sawAnyXml = true;
      entry.ondata = (err, chunk, final) => {
        if (err) {
          streamError = err instanceof Error ? err : new Error(String(err));
          return;
        }
        agg.pushText(decoder.decode(chunk, { stream: !final }));
        if (final) exportDone = true;
      };
      entry.start();
    };

    const reader = file.stream().getReader();
    let lastYield = 0;
    while (!exportDone) {
      const { done, value } = await reader.read();
      if (done) {
        unzipper.push(new Uint8Array(0), true);
        break;
      }
      bytesRead += value.byteLength;
      unzipper.push(value, false);
      if (streamError) throw streamError;
      // Yield periodically so the UI stays responsive and progress repaints.
      if (bytesRead - lastYield > 4 * 1024 * 1024) {
        lastYield = bytesRead;
        onProgress?.({ bytesRead, totalBytes: total });
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    if (streamError) throw streamError;
    onProgress?.({ bytesRead, totalBytes: total });

    if (!sawAnyXml) {
      throw new Error('export.xml not found inside the zip');
    }
    return { summaries: agg.finalize(), recordCount: agg.recordCount };
  }

  throw new Error('Unsupported file type. Please upload export.xml or the Apple Health .zip.');
}

// ── Whole-string path (small server-side uploads) ────────────────────────────

/**
 * Parse a full export.xml string at once. Only suitable for small files — use
 * streamAppleHealthFile in the browser for real exports.
 */
export function parseAppleHealthXml(xml: string, selectedTypes: Set<string>): ParsedRecord[] {
  const results: ParsedRecord[] = [];
  const recordPattern = /<Record\s([^>]*?)\/?>/g;
  let match: RegExpExecArray | null;
  while ((match = recordPattern.exec(xml)) !== null) {
    const rec = parseRecordAttrs(match[1], selectedTypes);
    if (rec) results.push(rec);
  }
  return results;
}

/** Aggregate raw samples into per-day summaries. */
export function aggregateToDailySummaries(records: ParsedRecord[]): DailySummaryPayload[] {
  const days = new Map<string, DayAccumulator>();
  for (const r of records) addRecordToDays(days, r);
  return daysToSummaries(days);
}
