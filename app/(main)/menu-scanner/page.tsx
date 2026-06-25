'use client';

import { useState } from 'react';
import BottomNav from '@/components/bottom-nav';
import WebNav from '@/components/web-nav';
import BackButton from '@/components/back-button';

// ── Types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'scanning' | 'done';
type Rating = 'great' | 'mindful' | 'later';

interface ManualItem {
  name: string;
  rating: Rating;
}

// ── Rating logic ─────────────────────────────────────────────────────────────

function rate(name: string): Rating {
  const n = name.toLowerCase();
  if (/(fried|crispy|breaded|pasta|spaghetti|risotto|fries|burger|pizza|cake|tiramisu|bread|rice bowl|noodle|dumpling|tempura)/.test(n)) return 'later';
  if (/(grilled|salmon|chicken|salad|greens|fish|shrimp|tofu|egg|soup|kebab|steak|broccoli|avocado|veg)/.test(n)) return 'great';
  return 'mindful';
}

// ── Hardcoded scan results ────────────────────────────────────────────────────

interface DishResult {
  name: string;
  carbs: string;
  tip: string;
}
interface DishGroup {
  title: string;
  dot: string;
  color: string;
  rowBg: string;
  rowBorder: string;
  dishes: DishResult[];
}

const DEMO_RESULTS = {
  venueName: 'Casa del Sol',
  summaryLine: '3 dishes sit easy with your blood sugar, 2 are worth noting, and 2 are best saved for a special occasion.',
  groups: [
    {
      title: 'Great choices',
      dot: '#1C7A4F',
      color: '#1C7A4F',
      rowBg: 'rgba(28,122,79,0.07)',
      rowBorder: 'rgba(28,122,79,0.18)',
      dishes: [
        { name: 'Grilled Chicken Tacos', carbs: '~20g', tip: 'Ask for corn tortillas and extra veg. Start with any beans or slaw on the side.' },
        { name: 'Ceviche', carbs: '~8g', tip: 'Excellent start to the meal — high protein, low carb.' },
        { name: 'Ensalada de Nopales', carbs: '~6g', tip: 'Cactus salad is fiber-rich. A great opener.' },
      ],
    },
    {
      title: 'Enjoy mindfully',
      dot: '#C8932B',
      color: '#9A6F18',
      rowBg: 'rgba(200,147,43,0.09)',
      rowBorder: 'rgba(200,147,43,0.22)',
      dishes: [
        { name: 'Black Bean Soup', carbs: '~30g', tip: 'Beans are slow-digesting — fine if this is your main carb source. Pair with protein.' },
        { name: 'Arroz con Pollo', carbs: '~45g', tip: 'Eat the chicken first, then the rice. Ask for a smaller portion of rice.' },
      ],
    },
    {
      title: 'Save for later',
      dot: '#B5562E',
      color: '#B5562E',
      rowBg: 'rgba(181,86,46,0.07)',
      rowBorder: 'rgba(181,86,46,0.18)',
      dishes: [
        { name: 'Churros con Chocolate', carbs: '~55g', tip: 'A special-occasion treat. If you go for it, share and take a walk after.' },
        { name: 'Pozole Rojo', carbs: '~50g', tip: 'Hominy is high-carb. Enjoy a small bowl and fill up on protein sides.' },
      ],
    },
  ] as DishGroup[],
};

// ── What Chatita promises ─────────────────────────────────────────────────────

const PROMISES = [
  'Sorts every dish into Great, Mindful, and Save-for-later',
  'Gives you a gentle tip for each one',
  'Never calls food "bad" — just helps you choose with confidence',
];

// ── Badge config ──────────────────────────────────────────────────────────────

const BADGE_CONFIG: Record<Rating, { bg: string; color: string; label: string }> = {
  great:   { bg: 'rgba(28,122,79,0.12)',   color: '#1C7A4F', label: 'Great' },
  mindful: { bg: 'rgba(200,147,43,0.14)',  color: '#9A6F18', label: 'Mindful' },
  later:   { bg: 'rgba(181,86,46,0.10)',   color: '#B5562E', label: 'Save for later' },
};

function RatingBadge({ rating }: { rating: Rating }) {
  const cfg = BADGE_CONFIG[rating];
  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        borderRadius: '999px',
        padding: '5px 10px',
        fontSize: '12px',
        fontWeight: 600,
      }}
    >
      {cfg.label}
    </span>
  );
}

// ── Scanning animation CSS ────────────────────────────────────────────────────

const SCAN_STYLE = `
@keyframes scanline { 0%{top:6%} 50%{top:90%} 100%{top:6%} }
@keyframes pulsedot { 0%,100%{opacity:.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
`;

// ── Sub-components ────────────────────────────────────────────────────────────

function ScanningBox() {
  return (
    <div
      style={{
        height: '180px',
        borderRadius: '14px',
        background: 'repeating-linear-gradient(135deg,#EFE4D2,#EFE4D2 12px,#F4EBDC 12px,#F4EBDC 24px)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: '18px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg,transparent,#C8932B,transparent)',
          animation: 'scanline 1.4s ease-in-out infinite',
          top: '6%',
        }}
      />
      <div style={{ display: 'flex', gap: '8px' }}>
        {[0, 0.2, 0.4].map((delay, i) => (
          <div
            key={i}
            style={{
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              background: '#012374',
              animation: 'pulsedot 1.2s infinite',
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function PhotoUploadZone({ onScan }: { onScan: () => void }) {
  return (
    <div
      style={{
        border: '2px dashed rgba(1,35,116,0.2)',
        borderRadius: '14px',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        background: '#F7EFE1',
      }}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="7" width="20" height="14" rx="3" stroke="#012374" strokeWidth="1.6" opacity={0.4}/>
        <circle cx="12" cy="14" r="3" stroke="#012374" strokeWidth="1.6" opacity={0.4}/>
        <path d="M8 7l1.5-2h5L16 7" stroke="#012374" strokeWidth="1.6" opacity={0.4}/>
      </svg>
      <button
        onClick={onScan}
        style={{ padding: '10px 24px', borderRadius: '999px', background: '#012374', color: '#FFFDF9', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
      >
        Take photo
      </button>
      <button
        onClick={onScan}
        style={{ padding: '10px 24px', borderRadius: '999px', background: 'transparent', color: '#012374', fontSize: '14px', fontWeight: 600, border: '1px solid rgba(1,35,116,0.25)', cursor: 'pointer' }}
      >
        Choose from gallery
      </button>
    </div>
  );
}

function PromisesList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {PROMISES.map((p, i) => (
        <div
          key={i}
          style={{
            background: '#FFFDF9',
            borderRadius: '13px',
            padding: '12px 14px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            border: '1px solid rgba(1,35,116,0.06)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
            <circle cx="12" cy="12" r="10" fill="rgba(28,122,79,0.12)"/>
            <path d="M8 12l3 3 5-5" stroke="#1C7A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '13px', color: '#16182A', lineHeight: 1.4 }}>{p}</span>
        </div>
      ))}
    </div>
  );
}

function ResultsView({ web }: { web?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: web ? '20px' : '16px' }}>
      <div>
        <p
          style={{
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(1,35,116,0.5)',
            fontWeight: 700,
            marginBottom: '4px',
          }}
        >
          {DEMO_RESULTS.venueName}
        </p>
        <p className="font-serif-italic" style={{ fontSize: web ? '22px' : '18px', color: '#012374', lineHeight: 1.2 }}>
          Here&apos;s how the menu reads
        </p>
        <p style={{ fontSize: '13px', color: 'rgba(22,24,42,0.6)', marginTop: '6px', lineHeight: 1.5 }}>
          {DEMO_RESULTS.summaryLine}
        </p>
      </div>

      {DEMO_RESULTS.groups.map((group) => (
        <div key={group.title}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: group.dot, flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: group.color }}>{group.title}</span>
          </div>
          {web ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {group.dishes.map((dish, i) => (
                <div
                  key={i}
                  style={{
                    background: group.rowBg,
                    border: `1px solid ${group.rowBorder}`,
                    borderRadius: '13px',
                    padding: '13px 14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#012374' }}>{dish.name}</span>
                    <span style={{ fontSize: '11px', color: group.color, fontWeight: 600, flexShrink: 0 }}>{dish.carbs}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'rgba(22,24,42,0.6)', lineHeight: 1.4 }}>{dish.tip}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {group.dishes.map((dish, i) => (
                <div
                  key={i}
                  style={{
                    background: group.rowBg,
                    border: `1px solid ${group.rowBorder}`,
                    borderRadius: '13px',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#012374' }}>{dish.name}</span>
                    <span style={{ fontSize: '11px', color: group.color, fontWeight: 600 }}>{dish.carbs}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'rgba(22,24,42,0.6)', marginTop: '4px', lineHeight: 1.4 }}>{dish.tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Disclaimer */}
      <p style={{ fontSize: '11.5px', color: 'rgba(22,24,42,0.45)', lineHeight: 1.5 }}>
        Readings are gentle guidance, not medical advice. Ask about ingredients and portions, and check with your provider for what&apos;s right for you.
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MenuScannerPage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [draft, setDraft] = useState('');
  const [manual, setManual] = useState<ManualItem[]>([]);

  const startScan = () => {
    setPhase('scanning');
    setTimeout(() => setPhase('done'), 2200);
  };

  const addManual = () => {
    if (draft.trim()) {
      setManual((prev) => [...prev, { name: draft.trim(), rating: rate(draft.trim()) }]);
      setDraft('');
    }
  };

  const removeManual = (i: number) => setManual((prev) => prev.filter((_, j) => j !== i));

  const InputAndList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addManual()}
          placeholder="e.g. Grilled Salmon"
          style={{ flex: 1, padding: '10px 13px', borderRadius: '12px', border: '1px solid rgba(1,35,116,0.15)', background: '#F7EFE1', fontSize: '13px', color: '#001A4D', outline: 'none' }}
        />
        <button
          onClick={addManual}
          style={{ padding: '10px 16px', borderRadius: '12px', background: '#012374', color: '#FFFDF9', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
        >
          Add
        </button>
      </div>
      {manual.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {manual.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                background: '#FFFDF9',
                borderRadius: '12px',
                padding: '10px 13px',
                border: '1px solid rgba(1,35,116,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                <RatingBadge rating={item.rating} />
                <span style={{ fontSize: '13px', color: '#16182A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name}
                </span>
              </div>
              <button
                onClick={() => removeManual(i)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(22,24,42,0.35)', fontSize: '18px', lineHeight: 1, flexShrink: 0 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── MOBILE LAYOUT ─────────────────────────────────────────────────────────

  const MobileLayout = (
    <div className="lg:hidden" style={{ background: '#F7EFE1', minHeight: '100vh', paddingBottom: '96px' }}>
      <style>{SCAN_STYLE}</style>

      <div style={{ padding: '20px 20px 0' }}>
        <BackButton href="/home" />
        <p style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.5)', fontWeight: 700, marginTop: '16px' }}>
          EATING OUT
        </p>
        <h1 className="font-serif-italic" style={{ fontSize: '30px', color: '#012374', marginTop: '2px', lineHeight: 1.1 }}>
          Menu scanner
        </h1>
      </div>

      <div style={{ padding: '18px 20px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {phase !== 'done' ? (
          <>
            <p className="font-serif-italic" style={{ fontSize: '20px', color: '#012374' }}>
              Let Chatita read it for you.
            </p>
            <PromisesList />

            {/* Photo zone */}
            {phase === 'idle' ? (
              <PhotoUploadZone onScan={startScan} />
            ) : (
              <ScanningBox />
            )}

            {/* Manual input */}
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#012374', marginBottom: '8px' }}>
                Or type menu items yourself
              </p>
              <InputAndList />
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#012374' }}>{DEMO_RESULTS.venueName}</p>
              <button
                onClick={() => setPhase('idle')}
                style={{ fontSize: '13px', color: '#C8932B', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Rescan
              </button>
            </div>
            <ResultsView />
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );

  // ── WEB LAYOUT ────────────────────────────────────────────────────────────

  const WebLayout = (
    <div className="hidden lg:flex" style={{ minHeight: '100vh', background: '#F7EFE1' }}>
      <style>{SCAN_STYLE}</style>
      <WebNav />

      <main style={{ flex: 1, padding: '34px 44px', overflowY: 'auto' }}>
        <p style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.5)', fontWeight: 700 }}>
          EATING OUT · MENU SCANNER
        </p>
        <h1 className="font-serif-italic" style={{ fontSize: '38px', color: '#012374', marginTop: '4px', lineHeight: 1.1 }}>
          Smart menu reading.
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(22,24,42,0.55)', marginTop: '6px', marginBottom: '28px' }}>
          Point Chatita at any menu and get gentle, personalized recommendations.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '22px' }}>
          {/* Left card */}
          <div style={{ background: '#FFFDF9', borderRadius: '22px', border: '1px solid rgba(1,35,116,0.07)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <PromisesList />

            {phase === 'idle' ? (
              <PhotoUploadZone onScan={startScan} />
            ) : phase === 'scanning' ? (
              <ScanningBox />
            ) : (
              <div style={{ background: '#F7EFE1', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: 'rgba(1,35,116,0.5)', marginBottom: '8px' }}>Menu scanned</p>
                <button
                  onClick={() => setPhase('idle')}
                  style={{ fontSize: '13px', color: '#012374', background: 'none', border: '1px solid rgba(1,35,116,0.25)', borderRadius: '999px', padding: '7px 18px', cursor: 'pointer' }}
                >
                  Rescan
                </button>
              </div>
            )}

            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#012374', marginBottom: '8px' }}>
                Or type menu items manually
              </p>
              <InputAndList />
            </div>
          </div>

          {/* Right panel */}
          <div>
            {phase !== 'done' ? (
              <div style={{ background: '#FFFDF9', borderRadius: '22px', border: '2px dashed rgba(1,35,116,0.12)', height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16M4 12h16M4 18h10" stroke="#012374" strokeWidth="1.5" strokeLinecap="round" opacity={0.3}/>
                </svg>
                <p style={{ fontSize: '14px', color: 'rgba(1,35,116,0.35)', fontWeight: 500 }}>
                  Menu recommendations will appear here
                </p>
              </div>
            ) : (
              <div style={{ background: '#FFFDF9', borderRadius: '22px', border: '1px solid rgba(1,35,116,0.07)', padding: '24px' }}>
                <ResultsView web />
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
