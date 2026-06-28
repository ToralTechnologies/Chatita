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

interface ZipEntryLoc {
  method: number; // 0 = stored, 8 = deflate
  compSize: number;
  localOffset: number;
}

async function sliceView(file: File, start: number, end: number): Promise<DataView> {
  const buf = await file.slice(Math.max(0, start), end).arrayBuffer();
  return new DataView(buf);
}

/**
 * Locate a single entry by reading the ZIP central directory (at the end of the
 * file) rather than streaming from the front. This is robust for huge, Zip64
 * archives (Apple exports with thousands of ECG/workout files), and lets us read
 * ONLY the target entry's bytes via file.slice — never the rest of the archive.
 */
async function locateZipEntry(
  file: File,
  predicate: (name: string) => boolean
): Promise<ZipEntryLoc | null> {
  const EOCD_SIG = 0x06054b50;
  const Z64_LOC_SIG = 0x07064b50;
  const CEN_SIG = 0x02014b50;

  // EOCD lives in the last 22 bytes + up to 65535 bytes of comment.
  const tailLen = Math.min(file.size, 22 + 65535);
  const tailStart = file.size - tailLen;
  const tail = await sliceView(file, tailStart, file.size);

  let eocd = -1;
  for (let i = tail.byteLength - 22; i >= 0; i--) {
    if (tail.getUint32(i, true) === EOCD_SIG) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('ZIP end-of-central-directory not found');

  let cdOffset = tail.getUint32(eocd + 16, true);
  let cdSize = tail.getUint32(eocd + 12, true);

  // Zip64: sentinel values mean the real numbers are in the Zip64 EOCD.
  if (cdOffset === 0xffffffff || cdSize === 0xffffffff) {
    const locPos = eocd - 20;
    if (locPos < 0 || tail.getUint32(locPos, true) !== Z64_LOC_SIG) {
      throw new Error('Zip64 locator not found');
    }
    const z64EocdOffset = Number(tail.getBigUint64(locPos + 8, true));
    const z = await sliceView(file, z64EocdOffset, z64EocdOffset + 56);
    cdSize = Number(z.getBigUint64(40, true));
    cdOffset = Number(z.getBigUint64(48, true));
  }

  // Read the central directory and walk its fixed-size headers.
  const cd = await sliceView(file, cdOffset, cdOffset + cdSize);
  const td = new TextDecoder('utf-8');
  let p = 0;
  while (p + 46 <= cd.byteLength && cd.getUint32(p, true) === CEN_SIG) {
    const method = cd.getUint16(p + 10, true);
    let compSize = cd.getUint32(p + 20, true);
    let uncompSize = cd.getUint32(p + 24, true);
    const fnLen = cd.getUint16(p + 28, true);
    const extraLen = cd.getUint16(p + 30, true);
    const commentLen = cd.getUint16(p + 32, true);
    let localOffset = cd.getUint32(p + 42, true);

    const nameBytes = new Uint8Array(cd.buffer, cd.byteOffset + p + 46, fnLen);
    const name = td.decode(nameBytes);

    // Zip64 extended info (header id 0x0001) overrides sentinel fields.
    if (compSize === 0xffffffff || uncompSize === 0xffffffff || localOffset === 0xffffffff) {
      let ep = p + 46 + fnLen;
      const extraEnd = ep + extraLen;
      while (ep + 4 <= extraEnd) {
        const hid = cd.getUint16(ep, true);
        const hsize = cd.getUint16(ep + 2, true);
        let dp = ep + 4;
        if (hid === 0x0001) {
          if (uncompSize === 0xffffffff) { uncompSize = Number(cd.getBigUint64(dp, true)); dp += 8; }
          if (compSize === 0xffffffff) { compSize = Number(cd.getBigUint64(dp, true)); dp += 8; }
          if (localOffset === 0xffffffff) { localOffset = Number(cd.getBigUint64(dp, true)); dp += 8; }
        }
        ep += 4 + hsize;
      }
    }

    if (predicate(name)) return { method, compSize, localOffset };
    p += 46 + fnLen + extraLen + commentLen;
  }

  return null;
}

/**
 * Read + inflate a single ZIP entry's bytes (via file.slice) and feed the
 * decoded text to the aggregator. Streams the compressed bytes so memory stays
 * bounded even for a multi-GB export.xml.
 */
async function inflateEntryToAggregator(
  file: File,
  loc: ZipEntryLoc,
  agg: AppleHealthAggregator,
  onProgress: (bytesRead: number) => void
): Promise<void> {
  // Local header is 30 bytes + filename + extra; data starts after it.
  const lh = await sliceView(file, loc.localOffset, loc.localOffset + 30);
  const lFnLen = lh.getUint16(26, true);
  const lExtraLen = lh.getUint16(28, true);
  const dataStart = loc.localOffset + 30 + lFnLen + lExtraLen;
  const dataEnd = dataStart + loc.compSize;

  const decoder = new TextDecoder('utf-8');
  const reader = file.slice(dataStart, dataEnd).stream().getReader();
  let read = 0;
  let lastYield = 0;

  if (loc.method === 0) {
    // Stored (no compression) — decode bytes directly.
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      read += value.byteLength;
      agg.pushText(decoder.decode(value, { stream: true }));
      if (read - lastYield > 4 * 1024 * 1024) { lastYield = read; onProgress(read); await new Promise((r) => setTimeout(r, 0)); }
    }
    agg.pushText(decoder.decode());
    return;
  }

  // Deflate (method 8) — raw inflate stream.
  const { Inflate } = await import('fflate');
  let inflateErr: Error | null = null;
  const inflater = new Inflate((chunk, final) => {
    agg.pushText(decoder.decode(chunk, { stream: !final }));
  });

  while (true) {
    const { done, value } = await reader.read();
    if (done) { inflater.push(new Uint8Array(0), true); break; }
    read += value.byteLength;
    try {
      inflater.push(value, false);
    } catch (e) {
      inflateErr = e instanceof Error ? e : new Error(String(e));
      break;
    }
    if (read - lastYield > 4 * 1024 * 1024) { lastYield = read; onProgress(read); await new Promise((r) => setTimeout(r, 0)); }
  }
  if (inflateErr) throw inflateErr;
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
  let agg = new AppleHealthAggregator(selectedTypes);
  const total = file.size;
  const isExport = (n: string) => /(^|\/)export\.xml$/i.test(n);

  // ── Plain .xml: stream-decode directly ────────────────────────────────────
  if (name.endsWith('.xml')) {
    const decoder = new TextDecoder('utf-8');
    const reader = file.stream().getReader();
    let bytesRead = 0;
    let lastYield = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
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

  if (!name.endsWith('.zip')) {
    throw new Error('Unsupported file type. Please upload export.xml or the Apple Health .zip.');
  }

  // ── .zip: random-access via the central directory (robust for Zip64 + huge
  //    archives). Reads ONLY export.xml's bytes. ────────────────────────────
  try {
    const loc = await locateZipEntry(file, isExport);
    if (loc) {
      await inflateEntryToAggregator(file, loc, agg, (read) =>
        onProgress?.({ bytesRead: read, totalBytes: loc.compSize })
      );
      onProgress?.({ bytesRead: loc.compSize, totalBytes: loc.compSize });
      return { summaries: agg.finalize(), recordCount: agg.recordCount };
    }
    // No export.xml in the directory — fall through to streaming as a last try.
  } catch (err) {
    // Central-directory read failed (unusual zip layout) — fall back to
    // front-streaming below with a fresh aggregator.
    console.warn('[apple-health] central-directory read failed; falling back to streaming:', err);
    agg = new AppleHealthAggregator(selectedTypes);
  }

  // ── Fallback: stream-unzip from the front, decompressing only export.xml ───
  const { Unzip, UnzipInflate } = await import('fflate');
  const decoder = new TextDecoder('utf-8');
  let exportDone = false;
  let sawAnyXml = false;
  let streamError: Error | null = null;

  const unzipper = new Unzip();
  unzipper.register(UnzipInflate);
  unzipper.onfile = (entry) => {
    if (!isExport(entry.name)) return;
    sawAnyXml = true;
    entry.ondata = (err, chunk, final) => {
      if (err) { streamError = err instanceof Error ? err : new Error(String(err)); return; }
      agg.pushText(decoder.decode(chunk, { stream: !final }));
      if (final) exportDone = true;
    };
    entry.start();
  };

  const reader = file.stream().getReader();
  let bytesRead = 0;
  let lastYield = 0;
  while (!exportDone) {
    const { done, value } = await reader.read();
    if (done) { unzipper.push(new Uint8Array(0), true); break; }
    bytesRead += value.byteLength;
    unzipper.push(value, false);
    if (streamError) throw streamError;
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
