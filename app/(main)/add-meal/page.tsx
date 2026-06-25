'use client';

import { useState } from 'react';
import BottomNav from '@/components/bottom-nav';
import WebNav from '@/components/web-nav';
import BackButton from '@/components/back-button';

// ── Meal presets ─────────────────────────────────────────────────────────────

type MealKey = 'pupusa' | 'salmon' | 'burger';
type Tone = 'great' | 'mindful' | 'treat';
type TipIcon = 'leaf' | 'walk' | 'water' | 'heart';

interface MealOrder {
  label: string;
  note: string;
}
interface MealTip {
  icon: TipIcon;
  text: string;
}
interface MealPreset {
  label: string;
  confidence: number;
  foods: string[];
  summary: string;
  tone: Tone;
  kicker: string;
  headline: string;
  order: MealOrder[];
  tips: MealTip[];
}

const MEALS: Record<MealKey, MealPreset> = {
  pupusa: {
    label: 'Pupusas & curtido',
    confidence: 81,
    foods: ['Pupusas', 'Curtido slaw', 'Tomato salsa'],
    summary: 'pupusas, curtido slaw and tomato salsa',
    tone: 'mindful',
    kicker: 'Looks delicious',
    headline: "Yum — let's keep it gentle.",
    order: [
      { label: 'Curtido slaw first', note: 'the cabbage and fiber slow everything that follows' },
      { label: 'Any beans or cheese', note: 'a little protein steadies your blood sugar' },
      { label: 'Then the pupusa', note: 'the masa carbs land softer after fiber and protein' },
    ],
    tips: [
      { icon: 'leaf', text: 'Start with a big forkful of the curtido before the pupusa — fiber first makes a real difference.' },
      { icon: 'walk', text: 'A 10–15 minute walk after helps your body use the carbs.' },
      { icon: 'water', text: 'Sip water alongside rather than a sweet drink.' },
    ],
  },
  salmon: {
    label: 'Salmon plate',
    confidence: 88,
    foods: ['Grilled salmon', 'Roasted vegetables', 'Quinoa'],
    summary: 'grilled salmon, roasted vegetables and quinoa',
    tone: 'great',
    kicker: 'Great choice',
    headline: 'That looks like a delicious, balanced plate!',
    order: [
      { label: 'Vegetables first', note: 'fiber lays a steady foundation' },
      { label: 'Then the salmon', note: 'protein and omega-3s keep you full' },
      { label: 'Quinoa last', note: 'whole-grain carbs land gently after the rest' },
    ],
    tips: [
      { icon: 'heart', text: "You're set — eat your veg and protein first, then the quinoa, and enjoy every bite." },
      { icon: 'water', text: 'Sip water through the meal to stay comfortable and full.' },
    ],
  },
  burger: {
    label: 'Burger & fries',
    confidence: 84,
    foods: ['Cheeseburger', 'French fries'],
    summary: 'a cheeseburger and french fries',
    tone: 'treat',
    kicker: 'A tasty treat',
    headline: "Let's see how we can balance it out.",
    order: [
      { label: 'Any salad or veg first', note: 'add a side of greens if you can and start there' },
      { label: 'The patty next', note: 'eat the protein before the carbs to soften the spike' },
      { label: 'Bun & fries last', note: 'enjoy them once protein and fiber are in' },
    ],
    tips: [
      { icon: 'leaf', text: 'Swap half the fries for a side salad, or share them with someone.' },
      { icon: 'walk', text: 'A 15–20 minute walk after a meal like this works wonders for your blood sugar.' },
      { icon: 'water', text: 'Choose water or unsweetened iced tea instead of soda.' },
    ],
  },
};

// ── Tone styles ───────────────────────────────────────────────────────────────

const TONE_STYLE: Record<Tone, { cardBg: string; border: string; accent: string }> = {
  great:   { cardBg: 'rgba(28,122,79,0.10)',   border: 'rgba(28,122,79,0.22)',   accent: '#1C7A4F' },
  mindful: { cardBg: 'rgba(200,147,43,0.13)',  border: 'rgba(200,147,43,0.28)',  accent: '#9A6F18' },
  treat:   { cardBg: 'rgba(181,86,46,0.10)',   border: 'rgba(181,86,46,0.24)',   accent: '#B5562E' },
};

// ── Tip icons ─────────────────────────────────────────────────────────────────

function TipIconSvg({ icon }: { icon: TipIcon }) {
  if (icon === 'leaf') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 22C6 22 3 16 3 10c0-4 4-7 9-7s9 3 9 7-3 12-9 12z" stroke="#1C7A4F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 10c3 2 6 2 9 0" stroke="#1C7A4F" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
  if (icon === 'walk') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="13" cy="4" r="1.5" stroke="#012374" strokeWidth="1.6"/>
      <path d="M9 8l2 2 3-3 2 5h3M9 14l1 6M14 11l1 4-3 1" stroke="#012374" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (icon === 'water') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L5.5 10a7 7 0 1 0 13 0L12 2z" stroke="#2A6FA8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20z" stroke="#1C7A4F" strokeWidth="1.6"/>
    </svg>
  );
}

// ── Scanning animation CSS ────────────────────────────────────────────────────

const SCAN_STYLE = `
@keyframes scanline { 0%{top:6%} 50%{top:90%} 100%{top:6%} }
@keyframes pulsedot { 0%,100%{opacity:.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
`;

// ── Page state types ──────────────────────────────────────────────────────────

type Phase = 'idle' | 'scanning' | 'detected';
type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

interface PageState {
  phase: Phase;
  meal: MealKey;
  mealType: MealType;
  extraFoods: string[];
  draft: string;
  feeling: string;
  saved: boolean;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScanningBox() {
  return (
    <div
      style={{
        height: '200px',
        borderRadius: '14px',
        background: 'repeating-linear-gradient(135deg,#EFE4D2,#EFE4D2 12px,#F4EBDC 12px,#F4EBDC 24px)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
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
              animation: `pulsedot 1.2s infinite`,
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function IdlePhotoZone({ onScan }: { onScan: () => void }) {
  return (
    <div
      style={{
        border: '2px dashed rgba(1,35,116,0.2)',
        borderRadius: '14px',
        padding: '28px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        background: '#F7EFE1',
      }}
    >
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="7" width="20" height="14" rx="3" stroke="#012374" strokeWidth="1.6" opacity={0.4}/>
        <circle cx="12" cy="14" r="3" stroke="#012374" strokeWidth="1.6" opacity={0.4}/>
        <path d="M8 7l1.5-2h5L16 7" stroke="#012374" strokeWidth="1.6" opacity={0.4}/>
      </svg>
      <button
        onClick={onScan}
        style={{
          padding: '10px 24px',
          borderRadius: '999px',
          background: '#012374',
          color: '#FFFDF9',
          fontSize: '14px',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Take photo
      </button>
      <button
        onClick={onScan}
        style={{
          padding: '10px 24px',
          borderRadius: '999px',
          background: 'transparent',
          color: '#012374',
          fontSize: '14px',
          fontWeight: 600,
          border: '1px solid rgba(1,35,116,0.25)',
          cursor: 'pointer',
        }}
      >
        Choose from gallery
      </button>
    </div>
  );
}

function GuidanceCard({ preset, web }: { preset: MealPreset; web?: boolean }) {
  const ts = TONE_STYLE[preset.tone];
  const toneEmoji = preset.tone === 'great' ? '✅' : preset.tone === 'mindful' ? '🌿' : '🎉';
  return (
    <div
      style={{
        background: ts.cardBg,
        border: `1px solid ${ts.border}`,
        borderRadius: '16px',
        padding: web ? '20px' : '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ fontSize: '18px' }}>{toneEmoji}</span>
        <span style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: ts.accent, fontWeight: 700 }}>
          {preset.kicker}
        </span>
      </div>
      <p className="font-serif-italic" style={{ fontSize: web ? '20px' : '17px', color: '#012374', marginBottom: '14px', lineHeight: 1.25 }}>
        {preset.headline}
      </p>

      {web ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
          <div>
            <p style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: ts.accent, fontWeight: 700, marginBottom: '10px' }}>
              Eat it in this order
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {preset.order.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: ts.accent, color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#012374' }}>{step.label}</p>
                    <p style={{ fontSize: '12px', color: 'rgba(22,24,42,0.6)' }}>{step.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: ts.accent, fontWeight: 700, marginBottom: '10px' }}>
              Tips
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {preset.tips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <TipIconSvg icon={tip.icon} />
                  <p style={{ fontSize: '13px', color: '#16182A', lineHeight: 1.4 }}>{tip.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <p style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: ts.accent, fontWeight: 700, marginBottom: '10px' }}>
            Eat it in this order
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
            {preset.order.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: ts.accent, color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {i + 1}
                </span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#012374' }}>{step.label}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(22,24,42,0.6)' }}>{step.note}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {preset.tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <TipIconSvg icon={tip.icon} />
                <p style={{ fontSize: '13px', color: '#16182A', lineHeight: 1.4 }}>{tip.text}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AddMealPage() {
  const [state, setState] = useState<PageState>({
    phase: 'idle',
    meal: 'pupusa',
    mealType: 'Lunch',
    extraFoods: [],
    draft: '',
    feeling: '',
    saved: false,
  });

  const update = (patch: Partial<PageState>) => setState((s) => ({ ...s, ...patch }));

  const preset = MEALS[state.meal];
  const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

  const startScan = () => {
    update({ phase: 'scanning', saved: false });
    setTimeout(() => update({ phase: 'detected' }), 2000);
  };

  const handleSave = () => {
    update({ saved: true });
    fetch('/api/analyze-meal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        foods: [...preset.foods, ...state.extraFoods],
        mealType: state.mealType,
        notes: state.feeling,
      }),
    }).catch(() => {});
  };

  const addFood = () => {
    if (state.draft.trim()) {
      update({ extraFoods: [...state.extraFoods, state.draft.trim()], draft: '' });
    }
  };

  const DemoSwitcher = () => (
    <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
      {(Object.keys(MEALS) as MealKey[]).map((key) => (
        <button
          key={key}
          onClick={() => update({ meal: key, saved: false })}
          style={{
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: state.meal === key ? 600 : 500,
            background: state.meal === key ? '#012374' : '#FFFDF9',
            color: state.meal === key ? '#FFFDF9' : '#012374',
            border: state.meal === key ? '1px solid #012374' : '1px solid rgba(1,35,116,0.2)',
            cursor: 'pointer',
          }}
        >
          {MEALS[key].label}
        </button>
      ))}
    </div>
  );

  const ChatitaSeesCard = () => (
    <div style={{ background: '#FFFDF9', borderRadius: '18px', border: '1px solid rgba(1,35,116,0.07)', padding: '16px' }}>
      <p style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.5)', fontWeight: 700 }}>
        Chatita sees
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '6px 0' }}>
        <span className="font-serif-italic" style={{ fontSize: '22px', color: '#012374' }}>{preset.confidence}% sure</span>
      </div>
      <p style={{ fontSize: '13px', color: '#16182A' }}>Looks like {preset.summary}!</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
        {[...preset.foods, ...state.extraFoods].map((f, i) => (
          <span key={i} style={{ background: '#F7EFE1', borderRadius: '999px', padding: '5px 12px', fontSize: '12px', color: '#012374', fontWeight: 500 }}>
            {f}
          </span>
        ))}
      </div>
    </div>
  );

  const MealTypeSelector = () => (
    <div>
      <p style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.5)', fontWeight: 700, marginBottom: '8px' }}>
        Meal type
      </p>
      <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
        {MEAL_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => update({ mealType: t })}
            style={{
              padding: '7px 14px',
              borderRadius: '999px',
              fontSize: '13px',
              fontWeight: state.mealType === t ? 600 : 500,
              background: state.mealType === t ? '#012374' : '#FFFDF9',
              color: state.mealType === t ? '#FFFDF9' : '#012374',
              border: state.mealType === t ? '1px solid #012374' : '1px solid rgba(1,35,116,0.2)',
              cursor: 'pointer',
            }}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );

  const FoodEditor = ({ bgInput }: { bgInput: string }) => (
    <div>
      <p style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.5)', fontWeight: 700, marginBottom: '8px' }}>
        Add foods
      </p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={state.draft}
          onChange={(e) => update({ draft: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && addFood()}
          placeholder="e.g. grilled chicken"
          style={{ flex: 1, padding: '10px 13px', borderRadius: '12px', border: '1px solid rgba(1,35,116,0.15)', background: bgInput, fontSize: '13px', color: '#001A4D', outline: 'none' }}
        />
        <button
          onClick={addFood}
          style={{ padding: '10px 16px', borderRadius: '12px', background: '#012374', color: '#FFFDF9', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
        >
          Add
        </button>
      </div>
      {state.extraFoods.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
          {state.extraFoods.map((f, i) => (
            <span key={i} style={{ background: '#012374', color: '#FFFDF9', borderRadius: '999px', padding: '5px 12px', fontSize: '12px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {f}
              <button onClick={() => update({ extraFoods: state.extraFoods.filter((_, j) => j !== i) })} style={{ background: 'none', border: 'none', color: '#FFFDF9', cursor: 'pointer', padding: 0, fontSize: '14px', lineHeight: 1 }}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const FeelingInput = ({ bgInput }: { bgInput: string }) => (
    <div>
      <p style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.5)', fontWeight: 700, marginBottom: '8px' }}>
        How are you feeling?
      </p>
      <textarea
        value={state.feeling}
        onChange={(e) => update({ feeling: e.target.value })}
        placeholder="Optional — anything on your mind before this meal?"
        rows={2}
        style={{ width: '100%', padding: '10px 13px', borderRadius: '12px', border: '1px solid rgba(1,35,116,0.15)', background: bgInput, fontSize: '13px', color: '#001A4D', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
      />
    </div>
  );

  // ── MOBILE ─────────────────────────────────────────────────────────────────

  const MobileLayout = (
    <div className="lg:hidden" style={{ background: '#F7EFE1', minHeight: '100vh', paddingBottom: '96px' }}>
      <style>{SCAN_STYLE}</style>

      <div style={{ padding: '20px 20px 0' }}>
        <BackButton href="/meal-history" />
        <p style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.5)', fontWeight: 700, marginTop: '16px' }}>
          LOG
        </p>
        <h1 className="font-serif-italic" style={{ fontSize: '30px', color: '#012374', marginTop: '2px', lineHeight: 1.1 }}>
          Add a meal
        </h1>
      </div>

      <div style={{ padding: '18px 20px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {state.phase === 'idle' && (
          <>
            <p className="font-serif-italic" style={{ fontSize: '20px', color: '#012374' }}>
              What are you having?
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(22,24,42,0.6)' }}>
              Take a photo and Chatita will read your plate and give you a gentle eating plan.
            </p>
            <IdlePhotoZone onScan={startScan} />
            <button
              onClick={() => update({ phase: 'detected' })}
              style={{ fontSize: '13px', color: '#012374', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textAlign: 'left', padding: 0 }}
            >
              Or add meal details manually →
            </button>
          </>
        )}

        {state.phase === 'scanning' && <ScanningBox />}

        {state.phase === 'detected' && (
          <>
            <DemoSwitcher />
            <ChatitaSeesCard />
            <GuidanceCard preset={preset} />
            <MealTypeSelector />
            <FoodEditor bgInput="#FFFDF9" />
            <FeelingInput bgInput="#FFFDF9" />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => update({ phase: 'idle', saved: false })}
                style={{ flex: 1, padding: '12px', borderRadius: '999px', background: 'transparent', color: '#012374', fontSize: '14px', fontWeight: 600, border: '1px solid rgba(1,35,116,0.25)', cursor: 'pointer' }}
              >
                Retake
              </button>
              <button
                onClick={handleSave}
                disabled={state.saved}
                style={{ flex: 2, padding: '12px', borderRadius: '999px', background: state.saved ? '#1C7A4F' : '#012374', color: '#FFFDF9', fontSize: '14px', fontWeight: 600, border: 'none', cursor: state.saved ? 'default' : 'pointer' }}
              >
                {state.saved ? '✓ Meal saved' : 'Save meal'}
              </button>
            </div>
          </>
        )}

        <div style={{ background: 'rgba(200,147,43,0.12)', borderRadius: '14px', padding: '13px 14px' }}>
          <p style={{ fontSize: '12.5px', color: '#9A6F18', lineHeight: 1.5 }}>
            Tracking what you eat helps you spot patterns in how your body responds to different meals.
          </p>
        </div>
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
        <p style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(1,35,116,0.5)', fontWeight: 700 }}>
          MEAL HISTORY · ADD A MEAL
        </p>
        <h1 className="font-serif-italic" style={{ fontSize: '38px', color: '#012374', marginTop: '4px', lineHeight: 1.1 }}>
          Snap your plate, eat with a plan.
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '430px 1fr', gap: '22px', marginTop: '28px' }}>
          {/* Left card */}
          <div style={{ background: '#FFFDF9', borderRadius: '22px', border: '1px solid rgba(1,35,116,0.07)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {state.phase === 'idle' && <IdlePhotoZone onScan={startScan} />}
            {state.phase === 'scanning' && <ScanningBox />}
            {state.phase === 'detected' && (
              <div style={{ background: '#F7EFE1', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: 'rgba(1,35,116,0.5)', marginBottom: '8px' }}>Photo analyzed</p>
                <button
                  onClick={() => update({ phase: 'idle', saved: false })}
                  style={{ fontSize: '13px', color: '#012374', background: 'none', border: '1px solid rgba(1,35,116,0.25)', borderRadius: '999px', padding: '7px 18px', cursor: 'pointer' }}
                >
                  Retake
                </button>
              </div>
            )}
            <MealTypeSelector />
            <FoodEditor bgInput="#F7EFE1" />
            <FeelingInput bgInput="#F7EFE1" />
            {state.phase === 'detected' && (
              <button
                onClick={handleSave}
                disabled={state.saved}
                style={{ padding: '13px', borderRadius: '999px', background: state.saved ? '#1C7A4F' : '#012374', color: '#FFFDF9', fontSize: '15px', fontWeight: 700, border: 'none', cursor: state.saved ? 'default' : 'pointer' }}
              >
                {state.saved ? '✓ Meal saved' : 'Save meal'}
              </button>
            )}
          </div>

          {/* Right card */}
          <div>
            {state.phase !== 'detected' ? (
              <div style={{ background: '#FFFDF9', borderRadius: '22px', border: '2px dashed rgba(1,35,116,0.12)', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="7" width="20" height="14" rx="3" stroke="#012374" strokeWidth="1.4" opacity={0.3}/>
                  <circle cx="12" cy="14" r="3" stroke="#012374" strokeWidth="1.4" opacity={0.3}/>
                </svg>
                <p style={{ fontSize: '14px', color: 'rgba(1,35,116,0.35)', fontWeight: 500 }}>
                  Your eating guidance will appear here
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <DemoSwitcher />
                <ChatitaSeesCard />
                <GuidanceCard preset={preset} web />
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
