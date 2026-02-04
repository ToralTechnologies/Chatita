/**
 * Minimal EXIF parser — extracts only DateTimeOriginal and GPS coordinates
 * from a raw image File.  Zero dependencies; reads the binary ArrayBuffer
 * directly.  Works for JPEG and HEIC (which share the same EXIF/TIFF layout).
 *
 * Returns null for any field that is missing or malformed — never throws.
 */

export interface ExifData {
  /** DateTimeOriginal as a JS Date, or null if not present */
  date: Date | null;
  /** GPS coordinates, or null if not present */
  gps: { lat: number; lng: number } | null;
}

export async function extractExif(file: File): Promise<ExifData> {
  try {
    const buf = await file.arrayBuffer();
    const view = new DataView(buf);

    // ---------- locate the APP1 / EXIF segment ----------
    // JPEG starts with FF D8.  We scan for FF E1 (APP1) which contains EXIF.
    // Some files have multiple APP1 segments; we want the one starting with "Exif\0\0".
    let offset = 2; // skip SOI
    let app1Offset = -1;

    while (offset < view.byteLength - 4) {
      if (view.getUint8(offset) !== 0xff) { offset++; continue; }
      const marker = view.getUint8(offset + 1);

      if (marker === 0xe1) {
        // APP1 — check for Exif header
        const segLen = view.getUint16(offset + 2);
        // "Exif\0\0" starts at offset+4
        if (
          view.getUint8(offset + 4) === 0x45 && // E
          view.getUint8(offset + 5) === 0x78 && // x
          view.getUint8(offset + 6) === 0x69 && // i
          view.getUint8(offset + 7) === 0x66    // f
        ) {
          app1Offset = offset + 10; // skip FF E1 (2) + length (2) + "Exif\0\0" (6)
          break;
        }
        offset += 2 + segLen;
      } else if (marker === 0xd9) {
        break; // EOI
      } else if (marker >= 0xc0) {
        // skip segment
        const segLen = view.getUint16(offset + 2);
        offset += 2 + segLen;
      } else {
        offset += 2;
      }
    }

    if (app1Offset < 0) return { date: null, gps: null };

    // ---------- TIFF header ----------
    // app1Offset now points to the TIFF header inside the APP1 segment.
    const tiffBase = app1Offset;
    const littleEndian = view.getUint8(tiffBase) === 0x49; // 'II' = LE, 'MM' = BE

    const u16 = (o: number) => view.getUint16(tiffBase + o, littleEndian);
    const u32 = (o: number) => view.getUint32(tiffBase + o, littleEndian);

    // Sanity: magic number should be 42
    if (u16(2) !== 42) return { date: null, gps: null };

    const ifd0Offset = u32(4);

    // ---------- helpers ----------

    /**
     * IFD entry.
     * valOff: for data > 4 bytes this is the TIFF-relative offset to the data.
     *         for data ≤ 4 bytes it is the endian-interpreted uint32 (not useful for ASCII).
     * valByteOffset: the absolute file offset of the 4-byte value/offset field in the IFD entry.
     *                Use this to read inline values (≤ 4 bytes) directly from the buffer.
     */
    interface IfdEntry { type: number; count: number; valOff: number; valByteOffset: number; }

    /** Read an IFD and return a map of tag → IfdEntry */
    function readIfd(ifdOffset: number): Map<number, IfdEntry> {
      const map = new Map<number, IfdEntry>();
      if (ifdOffset + 2 > view.byteLength) return map;
      const count = u16(ifdOffset);
      for (let i = 0; i < count; i++) {
        const base = ifdOffset + 2 + i * 12;
        if (base + 12 > view.byteLength) break;
        const tag   = u16(base);
        const type  = u16(base + 2);
        const cnt   = u32(base + 4);
        const valOff = u32(base + 8);
        // Absolute file position of the value/offset field
        const valByteOffset = tiffBase + base + 8;
        map.set(tag, { type, count: cnt, valOff, valByteOffset });
      }
      return map;
    }

    /** Read a null-terminated ASCII string from the TIFF data area (TIFF-relative offset) */
    function readAscii(offset: number, count: number): string {
      let s = '';
      for (let i = 0; i < count - 1; i++) {
        s += String.fromCharCode(view.getUint8(tiffBase + offset + i));
      }
      return s;
    }

    /**
     * Read a single RATIONAL at a TIFF-relative offset.
     * A RATIONAL is two consecutive UInt32s: numerator then denominator.
     */
    function readRational(tiffRelOffset: number): number {
      const num = u32(tiffRelOffset);
      const den = u32(tiffRelOffset + 4);
      return den === 0 ? 0 : num / den;
    }

    // ---------- IFD0 → find ExifIFD pointer and GPS IFD pointer ----------
    const ifd0 = readIfd(ifd0Offset);

    let date: Date | null = null;
    let gps: { lat: number; lng: number } | null = null;

    // --- DateTimeOriginal (tag 0x9003) lives in the Exif sub-IFD ---
    const exifIfdTag = ifd0.get(0x8769); // ExifIFD pointer
    if (exifIfdTag) {
      const exifIfd = readIfd(exifIfdTag.valOff);
      const dtOrigTag = exifIfd.get(0x9003); // DateTimeOriginal, ASCII 20 bytes "YYYY:MM:DD HH:MM:SS\0"
      if (dtOrigTag && dtOrigTag.count === 20) {
        // 20 bytes > 4, so valOff is an offset into TIFF data
        const str = readAscii(dtOrigTag.valOff, dtOrigTag.count);
        // Parse "2024:06:15 14:30:00"
        const m = str.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
        if (m) {
          date = new Date(
            parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]),
            parseInt(m[4]), parseInt(m[5]), parseInt(m[6])
          );
          // Sanity check — reject obviously bogus dates
          if (date.getFullYear() < 2000 || date.getFullYear() > 2100) date = null;
        }
      }
    }

    // --- GPS (sub-IFD pointer tag 0x8825) ---
    const gpsIfdTag = ifd0.get(0x8825);
    if (gpsIfdTag) {
      const gpsIfd = readIfd(gpsIfdTag.valOff);

      // GPSLatitudeRef  0x0001 (ASCII "N" or "S")
      // GPSLatitude     0x0002 (3 RATIONALs: deg, min, sec)
      // GPSLongitudeRef 0x0003 (ASCII "E" or "W")
      // GPSLongitude    0x0004 (3 RATIONALs: deg, min, sec)
      const latRefTag  = gpsIfd.get(0x0001);
      const latTag     = gpsIfd.get(0x0002);
      const lngRefTag  = gpsIfd.get(0x0003);
      const lngTag     = gpsIfd.get(0x0004);

      if (latTag && lngTag && latRefTag && lngRefTag) {
        // Ref tags are 2-byte inline ASCII ("N\0").  Read the first raw byte directly
        // from the value field — do NOT use the endian-swapped valOff, because on
        // big-endian TIFFs (iOS default) u32 byte-swaps the char into the high byte.
        const latRef = String.fromCharCode(view.getUint8(latRefTag.valByteOffset));
        const lngRef = String.fromCharCode(view.getUint8(lngRefTag.valByteOffset));

        // Each coordinate is 3 RATIONALs (8 bytes each = 24 bytes total).
        // valOff is a TIFF-relative offset; readRational expects the same.
        const latDeg = readRational(latTag.valOff);
        const latMin = readRational(latTag.valOff + 8);
        const latSec = readRational(latTag.valOff + 16);

        const lngDeg = readRational(lngTag.valOff);
        const lngMin = readRational(lngTag.valOff + 8);
        const lngSec = readRational(lngTag.valOff + 16);

        let lat = latDeg + latMin / 60 + latSec / 3600;
        let lng = lngDeg + lngMin / 60 + lngSec / 3600;

        if (latRef === 'S') lat = -lat;
        if (lngRef === 'W') lng = -lng;

        // Basic sanity
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && (lat !== 0 || lng !== 0)) {
          gps = { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };
        }
      }
    }

    return { date, gps };
  } catch {
    // Never throw — EXIF is best-effort
    return { date: null, gps: null };
  }
}
