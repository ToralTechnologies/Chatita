'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

const C = { blue: '#012374', card: '#FFFDF9' };

// Retail product barcodes only — faster and fewer false reads.
const FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.UPC_A,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
];

interface Labels {
  title?: string;
  help?: string;
  denied?: string;
  enter?: string;
}

/**
 * Full-screen camera barcode scanner (mobile-first, works in iOS Safari via
 * getUserMedia). Calls onDetect(code) once with the digits, then the parent
 * closes it. Falls back to a "type the number" path if the camera is blocked.
 */
export default function BarcodeScanner({
  onDetect,
  onClose,
  onManual,
  labels = {},
}: {
  onDetect: (code: string) => void;
  onClose: () => void;
  onManual: () => void;
  labels?: Labels;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const doneRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATS);
    const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 200 });
    let cancelled = false;

    (async () => {
      try {
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } } },
          videoRef.current!,
          (result, _err, ctrls) => {
            if (result && !doneRef.current) {
              doneRef.current = true;
              const code = result.getText().replace(/\D/g, '');
              ctrls?.stop();
              if (code) onDetect(code);
            }
          }
        );
        if (cancelled) controls.stop();
        else controlsRef.current = controls;
      } catch (e: any) {
        setError(
          labels.denied ||
            'Camera access is needed to scan. You can also type the barcode number.'
        );
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{ color: C.card, fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
        {labels.title || 'Scan barcode'}
      </div>

      {error ? (
        <div style={{ maxWidth: 320, textAlign: 'center', color: C.card }}>
          <p style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.9 }}>{error}</p>
        </div>
      ) : (
        <div style={{ position: 'relative', width: 'min(88vw, 420px)', aspectRatio: '4/3' }}>
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16, background: '#000' }}
          />
          {/* Aiming frame */}
          <div
            style={{
              position: 'absolute',
              left: '12%',
              right: '12%',
              top: '38%',
              bottom: '38%',
              border: `2px solid ${C.card}`,
              borderRadius: 10,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.25)',
            }}
          />
          <p style={{ color: C.card, fontSize: 13, textAlign: 'center', marginTop: 12, opacity: 0.85 }}>
            {labels.help || 'Point your camera at the barcode'}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <button
          onClick={onManual}
          style={{
            padding: '11px 18px',
            borderRadius: 999,
            border: 'none',
            background: C.card,
            color: C.blue,
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          {labels.enter || 'Enter number instead'}
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '11px 18px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.35)',
            background: 'transparent',
            color: C.card,
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
