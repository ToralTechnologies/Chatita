// Compress and resize an image File to stay under Vercel's 4.5MB serverless
// payload limit.  Mobile camera photos routinely exceed 10MB; resizing to
// 800px on the long edge and re-encoding as JPEG at 0.8 quality keeps the
// base64 payload well under 1MB while retaining enough detail for AI vision.
//
// EXIF metadata (date, GPS) is extracted from the raw File BEFORE compression
// because the canvas re-encode strips it.  The caller receives both the
// compressed base64 and any extracted EXIF data in a single call.

import { extractExif, ExifData } from './exif';

const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.8;

export interface CompressedImage {
  base64: string;
  exif: ExifData;
}

export async function compressImage(file: File): Promise<CompressedImage> {
  // Extract EXIF first — before any canvas round-trip destroys it
  const exif = await extractExif(file);

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height / width) * MAX_DIMENSION);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width / height) * MAX_DIMENSION);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context not available'));

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return { base64, exif };
}
