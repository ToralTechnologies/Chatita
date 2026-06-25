'use client';

import { useState, useRef } from 'react';
import BottomNav from '@/components/bottom-nav';
import WebNav from '@/components/web-nav';
import BackButton from '@/components/back-button';

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'scanning' | 'done';
type Score = 'great' | 'moderate' | 'caution';

interface Dish {
  name: string;
  score: Score;
  estimatedCarbs: number;
  estimatedCalories?: number;
  tips: string[];
}

interface ScanResult {
  dishes: Dish[];
  overallAdvice: string;
  mode: 'ai' | '$0';
}

interface ManualItem {
  name: string;
  score: Score;
}

// ── Score config ──────────────────────────────────────────────────────────────

const SCORE = {
  great:    { title: 'Great choices',   color: '#1C7A4F', rowBg: 'rgba(28,122,79,0.07)',  rowBorder: 'rgba(28,122,79,0.18)',  badge: { bg: 'rgba(28,122,79,0.12)', color: '#1C7A4F' } },
  moderate: { title: 'Enjoy mindfully', color: '#9A6F18', rowBg: 'rgba(200,147,43,0.09)', rowBorder: 'rgba(200,147,43,0.22)', badge: { bg: 'rgba(200,147,43,0.14)', color: '#9A6F18' } },
  caution:  { title: 'Save for later',  color: '#B5562E', rowBg: 'rgba(181,86,46,0.07)',  rowBorder: 'rgba(181,86,46,0.18)',  badge: { bg: 'rgba(181,86,46,0.10)', color: '#B5562E' } },
} as const;

// ── Keyword fallback for manual entries ───────────────────────────────────────

function keywordRate(name: string): Score {
  const n = name.toLowerCase();
  if (/(fried|crispy|breaded|pasta|spaghetti|risotto|fries|burger|pizza|cake|tiramisu|bread|rice bowl|noodle|dumpling|tempura)/.test(n)) return 'caution';
  if (/(grilled|salmon|chicken|salad|greens|fish|shrimp|tofu|egg|soup|kebab|steak|broccoli|avocado|veg)/.test(n)) return 'great';
  return 'moderate';
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const SCAN_STYLE = `
@keyframes scanline { 0%{top:6%} 50%{top:90%} 100%{top:6%} }
@keyframes pulsedot { 0%,100%{opacity:.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
`;

const PROMISES = [
  'Sorts every dish into Great, Mindful, and Save-for-later',
  'Gives you a gentle tip for each one',
  "Never calls food \"bad\" — just helps you choose with confidence",
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MenuScannerPage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualItems, setManualItems] = useState<ManualItem[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      setPhase('scanning');
      setError(null);
      try {
        const res = await fetch('/api/analyze-menu-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoBase64: dataUrl }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Scan failed');
        setScanResult({ dishes: data.dishes || [], overallAdvice: data.overallAdvice || '', mode: data.mode });
        setPhase('done');
      } catch (err) {
        setError((err as Error).message || 'Could not scan menu. Try again.');
        setPhase('idle');
        setImagePreview(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const addManual = () => {
    const t = draft.trim();
    if (!t) return;
    setManualItems(prev => [...prev, { name: t, score: keywordRate(t) }]);
    setDraft('');
  };

  const removeManual = (i: number) => setManualItems(prev => prev.filter((_, j) => j !== i));

  // Group scan results by score
  const groups = (['great', 'moderate', 'caution'] as Score[])
    .map(score => ({ ...SCORE[score], score, dishes: scanResult?.dishes.filter(d => d.score === score) || [] }))
    .filter(g => g.dishes.length > 0);

  // ── Left panel (shared between mobile and web) ────────────────────────────

  const ScanningBox = () => (
    <div style={{ height: '200px', borderRadius: '14px', background: 'repeating-linear-gradient(135deg,#EFE4D2,#EFE4D2 12px,#F4EBDC 12px,#F4EBDC 24px)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '18px' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,transparent,#C8932B,transparent)', animation: 'scanline 1.4s ease-in-out infinite', top: '6%' }} />
      <p style={{ fontSize: '12px', color: 'rgba(1,35,116,0.5)', marginBottom: '10px' }}>Reading the menu…</p>
      <div style={{ display: 'flex', gap: '8px' }}>
        {[0, 0.2, 0.4].map((delay, i) => (
          <div key={i} style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#012374', animation: 'pulsedot 1.2s infinite', animationDelay: `${delay}s` }} />
        ))}
      </div>
    </div>
  );

  const PhotoZone = () => (
    <div style={{ border: '2px dashed rgba(1,35,116,0.2)', borderRadius: '14px', padding: '24px 20px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '12px', background: '#F7EFE1' }}>
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="7" width="20" height="14" rx="3" stroke="#012374" strokeWidth="1.6" opacity={0.4}/>
        <circle cx="12" cy="14" r="3" stroke="#012374" strokeWidth="1.6" opacity={0.4}/>
        <path d="M8 7l1.5-2h5L16 7" stroke="#012374" strokeWidth="1.6" opacity={0.4}/>
      </svg>
      <input ref={photoInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <input ref={galleryInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <button onClick={() => photoInputRef.current?.click()} style={{ padding: '10px 22px', borderRadius: '999px', background: '#012374', color: '#FFFDF9', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
        Take photo
      </button>
      <button onClick={() => galleryInputRef.current?.click()} style={{ padding: '10px 22px', borderRadius: '999px', background: 'transparent', color: '#012374', fontSize: '14px', fontWeight: 600, border: '1px solid rgba(1,35,116,0.25)', cursor: 'pointer' }}>
        Choose from gallery
      </button>
    </div>
  );

  const ManualInput = () => (
    <div>
      <p style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'rgba(1,35,116,0.5)', fontWeight: 700, marginBottom: '8px' }}>Or type dishes you see</p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text" value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addManual()}
          placeholder="e.g. Grilled Salmon"
          style={{ flex: 1, padding: '10px 13px', borderRadius: '12px', border: '1px solid rgba(1,35,116,0.15)', background: '#F7EFE1', fontSize: '13px', color: '#001A4D', outline: 'none' }}
        />
        <button onClick={addManual} style={{ padding: '10px 16px', borderRadius: '12px', background: '#012374', color: '#FFFDF9', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Add</button>
      </div>
      {manualItems.length > 0 && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
          {manualItems.map((item, i) => {
            const s = SCORE[item.score];
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: s.rowBg, border: `1px solid ${s.rowBorder}`, borderRadius: '10px', padding: '8px 12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#012374' }}>{item.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ ...s.badge, borderRadius: '999px', padding: '3px 9px', fontSize: '11px', fontWeight: 700 }}>{s.title}</span>
                  <button onClick={() => removeManual(i)} style={{ background: 'none', border: 'none', color: 'rgba(1,35,116,0.4)', cursor: 'pointer', fontSize: '16px', padding: 0, lineHeight: 1 }}>×</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const DishRow = ({ dish, compact }: { dish: Dish; compact?: boolean }) => {
    const s = SCORE[dish.score];
    return (
      <div style={{ background: s.rowBg, border: `1px solid ${s.rowBorder}`, borderRadius: '12px', padding: compact ? '10px 12px' : '13px 15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{ fontSize: compact ? '13px' : '14px', fontWeight: 600, color: '#012374' }}>{dish.name}</span>
          <span style={{ ...s.badge, borderRadius: '999px', padding: '3px 9px', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>~{dish.estimatedCarbs}g carbs</span>
        </div>
        {dish.tips?.[0] && (
          <p style={{ fontSize: '12px', color: '#16182A', opacity: 0.65, lineHeight: 1.45, marginTop: '6px' }}>{dish.tips[0]}</p>
        )}
      </div>
    );
  };

  const ResultsPanel = ({ compact }: { compact?: boolean }) => (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
      {imagePreview && (
        <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', height: '140px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagePreview} alt="Menu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button onClick={() => { setPhase('idle'); setImagePreview(null); setScanResult(null); }} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.45)', color: '#FFFDF9', border: 'none', borderRadius: '999px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>Rescan</button>
        </div>
      )}

      {scanResult?.overallAdvice && (
        <div style={{ background: 'rgba(200,147,43,0.12)', borderRadius: '12px', padding: '12px 14px' }}>
          <p style={{ fontSize: '13px', color: '#9A6F18', lineHeight: 1.5 }}>{scanResult.overallAdvice}</p>
        </div>
      )}

      {groups.map(group => (
        <div key={group.score}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: group.color, flexShrink: 0 }} />
            <p style={{ fontSize: '12px', fontWeight: 700, color: group.color, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{group.title}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '7px' }}>
            {group.dishes.map((dish, i) => <DishRow key={i} dish={dish} compact={compact} />)}
          </div>
        </div>
      ))}

      <p style={{ fontSize: '11.5px', color: 'rgba(22,24,42,0.5)', lineHeight: 1.5, fontStyle: 'italic' }}>
        Readings are gentle guidance, not medical advice. Ask about ingredients and portions, and check with your provider for what&apos;s right for you.
      </p>
    </div>
  );

  // ── MOBILE ─────────────────────────────────────────────────────────────────

  const MobileLayout = (
    <div className="lg:hidden mobile-page-pb" style={{ background: '#F7EFE1', minHeight: '100vh' }}>
      <style>{SCAN_STYLE}</style>
      <div style={{ padding: '20px 20px 0', paddingTop: 'max(20px, env(safe-area-inset-top, 0px))' }}>
        <BackButton href="/restaurant-finder" />
        <p style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(1,35,116,0.5)', fontWeight: 700, marginTop: '16px' }}>EATING OUT</p>
        <h1 className="font-serif-italic" style={{ fontSize: '30px', color: '#012374', marginTop: '2px', lineHeight: 1.1 }}>Menu scanner</h1>
      </div>

      <div style={{ padding: '18px 20px 0', display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>
        {error && (
          <div style={{ background: 'rgba(181,86,46,0.10)', border: '1px solid rgba(181,86,46,0.22)', borderRadius: '12px', padding: '12px 14px' }}>
            <p style={{ fontSize: '13px', color: '#B5562E' }}>{error}</p>
          </div>
        )}

        {phase === 'idle' && (
          <>
            <p className="font-serif-italic" style={{ fontSize: '20px', color: '#012374' }}>Let Chatita read it for you.</p>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
              {PROMISES.map((p, i) => (
                <div key={i} style={{ background: '#FFFDF9', borderRadius: '12px', border: '1px solid rgba(1,35,116,0.07)', padding: '10px 13px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
                    <path d="M5 13l4 4L19 7" stroke="#1C7A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p style={{ fontSize: '13px', color: '#16182A', lineHeight: 1.4 }}>{p}</p>
                </div>
              ))}
            </div>
            <PhotoZone />
            <ManualInput />
          </>
        )}

        {phase === 'scanning' && <ScanningBox />}

        {phase === 'done' && <ResultsPanel />}

        {(phase === 'idle' && manualItems.length === 0) && null}
      </div>
      <BottomNav />
    </div>
  );

  // ── WEB ────────────────────────────────────────────────────────────────────

  const WebLayout = (
    <div className="hidden lg:flex" style={{ minHeight: '100vh', background: '#F7EFE1' }}>
      <style>{SCAN_STYLE}</style>
      <WebNav />
      <main style={{ flex: 1, padding: '34px 44px', overflowY: 'auto' }}>
        <p style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(1,35,116,0.5)', fontWeight: 700 }}>EATING OUT · MENU SCANNER</p>
        <h1 className="font-serif-italic" style={{ fontSize: '38px', color: '#012374', marginTop: '4px', lineHeight: 1.1 }}>Snap a menu, eat with ease.</h1>
        <p style={{ fontSize: '15px', color: 'rgba(22,24,42,0.65)', marginTop: '8px', lineHeight: 1.55 }}>
          Point your camera at any menu and Chatita sorts every dish — gently and honestly.
        </p>

        {error && (
          <div style={{ marginTop: '16px', background: 'rgba(181,86,46,0.10)', border: '1px solid rgba(181,86,46,0.22)', borderRadius: '12px', padding: '12px 16px' }}>
            <p style={{ fontSize: '13px', color: '#B5562E' }}>{error}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '22px', marginTop: '28px' }}>
          {/* Left card */}
          <div style={{ background: '#FFFDF9', borderRadius: '22px', border: '1px solid rgba(1,35,116,0.07)', padding: '24px', display: 'flex', flexDirection: 'column' as const, gap: '18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
              {PROMISES.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path d="M5 13l4 4L19 7" stroke="#1C7A4F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p style={{ fontSize: '13px', color: 'rgba(22,24,42,0.7)', lineHeight: 1.4 }}>{p}</p>
                </div>
              ))}
            </div>
            {phase === 'scanning' ? <ScanningBox /> : <PhotoZone />}
            <ManualInput />
          </div>

          {/* Right panel */}
          <div>
            {phase !== 'done' && manualItems.length === 0 ? (
              <div style={{ background: '#FFFDF9', borderRadius: '22px', border: '2px dashed rgba(1,35,116,0.12)', height: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' as const, gap: '10px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="7" width="20" height="14" rx="3" stroke="#012374" strokeWidth="1.4" opacity={0.25}/>
                  <circle cx="12" cy="14" r="3" stroke="#012374" strokeWidth="1.4" opacity={0.25}/>
                </svg>
                <p style={{ fontSize: '14px', color: 'rgba(1,35,116,0.3)', fontWeight: 500 }}>Menu results will appear here</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
                {phase === 'done' && <ResultsPanel compact />}
                {manualItems.length > 0 && phase !== 'done' && (
                  <div style={{ background: '#FFFDF9', borderRadius: '22px', border: '1px solid rgba(1,35,116,0.07)', padding: '20px' }}>
                    <p style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'rgba(1,35,116,0.5)', fontWeight: 700, marginBottom: '12px' }}>Added items</p>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '7px' }}>
                      {manualItems.map((item, i) => {
                        const s = SCORE[item.score];
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: s.rowBg, border: `1px solid ${s.rowBorder}`, borderRadius: '10px', padding: '8px 13px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#012374' }}>{item.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ ...s.badge, borderRadius: '999px', padding: '3px 10px', fontSize: '11px', fontWeight: 700 }}>{s.title}</span>
                              <button onClick={() => removeManual(i)} style={{ background: 'none', border: 'none', color: 'rgba(1,35,116,0.4)', cursor: 'pointer', fontSize: '16px', padding: 0 }}>×</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );

  return (
    <>
      {MobileLayout}
      {WebLayout}
    </>
  );
}
