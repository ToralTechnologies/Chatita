'use client';

import { useState } from 'react';
import Link from 'next/link';

const PAGES = [
  {
    name: 'Home',
    cap: "Your day at a glance — latest reading, a gentle range, and a warm nudge to check in. No scores, no judgment.",
  },
  {
    name: 'Reading',
    cap: "Add a reading by voice or keypad. Big targets for low-tech and older users; the range note is gentle gold, never alarming red.",
  },
  {
    name: 'Timing',
    cap: "Tag when it happened — before/after meals, fasting, bedtime. Context, never grading.",
  },
  {
    name: 'Your body',
    cap: "A quick body check-in right after the reading — shaky, lightheaded, tired — the things people actually notice.",
  },
  {
    name: 'State of mind',
    cap: "Apple-style: how you feel right now vs. overall today, on a pleasant↔unpleasant scale, with words and what's affecting you.",
  },
  {
    name: 'Saved',
    cap: "A calm recap that celebrates the act of checking in — not the number.",
  },
  {
    name: 'Scan a menu',
    cap: "Step 1 — add a photo of any menu. Snap it, or pick one from your gallery.",
  },
  {
    name: 'Reading menu',
    cap: "Step 2 — Chatita reads the photo: finds the dishes, ranks them, and writes a kind note for each.",
  },
  {
    name: 'AI picks',
    cap: "Step 3 — the AI feedback. Dishes ranked Great / Moderate / With care, each with a practical, never-preachy tip.",
  },
  {
    name: 'Recipes',
    cap: "Tell Chatita what's in the kitchen — including Forgotten Harvest box items — for diabetes-friendly recipes.",
  },
  {
    name: 'Restaurants',
    cap: "Find nearby spots ranked Great / Moderate / With care — never shame, always tips.",
  },
  {
    name: 'Snap a meal',
    cap: "Photograph what you're actually eating. Chatita's AI estimates the carbs, predicts a gentle glucose impact, and offers one kind suggestion.",
  },
];

function StepScreen({ step }: { step: number }) {
  const phone: React.CSSProperties = {
    width: '100%',
    maxWidth: '360px',
    margin: '0 auto',
    background: '#FFFDF9',
    borderRadius: '28px',
    overflow: 'hidden',
    boxShadow: '0 32px 64px -24px rgba(1,35,116,0.32)',
    border: '1px solid rgba(1,35,116,0.1)',
    fontFamily: "'DM Sans', sans-serif",
  };

  const navBar = (
    <div style={{ display: 'flex', justifyContent: 'space-around', padding: '12px 20px', borderTop: '1px solid rgba(1,35,116,0.08)', background: '#FFFDF9' }}>
      {[
        <svg key="h" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 12l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8z" fill="#012374"/></svg>,
        <svg key="i" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 19V5m0 14h16M4 15l4-4 3 3 5-6 4 5" stroke="#16182A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>,
        <div key="c" style={{ width: 42, height: 42, borderRadius: 12, background: '#012374', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -10 }}>
          <div style={{ width: 18, height: 18, borderRadius: 4, background: '#FFFDF9' }} />
        </div>,
        <svg key="r" width="22" height="22" viewBox="0 0 24 24" fill="none"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="#16182A" strokeWidth="1.6" opacity="0.4"/></svg>,
        <svg key="s" width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#16182A" strokeWidth="1.6" opacity="0.4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="#16182A" strokeWidth="1.6" opacity="0.4"/></svg>,
      ]}
    </div>
  );

  if (step === 0) return (
    <div style={phone}>
      <div style={{ background: '#012374', padding: '20px 20px 52px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 18, color: '#FFFDF9', fontWeight: 700 }}>Chatita</div>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,253,249,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#FFFDF9', fontSize: 13, fontFamily: 'DM Serif Display, serif', fontStyle: 'italic' }}>L</span>
          </div>
        </div>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700, marginTop: 14 }}>Monday · 23 June</div>
        <div style={{ fontSize: 26, color: '#FFFDF9', lineHeight: 1.05, marginTop: 4, fontFamily: 'DM Serif Display, serif', fontStyle: 'italic' }}>Hola, Lucero.</div>
      </div>
      <div style={{ margin: '-40px 16px 0', background: '#FFFDF9', borderRadius: 20, padding: '16px', boxShadow: '0 12px 24px -10px rgba(1,35,116,0.22)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.6)', fontWeight: 600 }}>Today's Glucose</span>
          <span style={{ fontSize: 11, color: '#C8932B', fontWeight: 700 }}>+ Add reading</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
          <span style={{ fontSize: 48, color: '#012374', lineHeight: 0.9, fontFamily: 'DM Serif Display, serif' }}>157</span>
          <span style={{ fontSize: 12, color: '#16182A', opacity: 0.55 }}>mg/dL</span>
        </div>
        <div style={{ marginTop: 8, display: 'inline-block', padding: '4px 10px', borderRadius: 99, background: 'rgba(200,147,43,0.18)', color: '#9A6F18', fontSize: 11, fontWeight: 600 }}>A bit above range</div>
        <div style={{ marginTop: 12, height: 6, background: '#F7EFE1', borderRadius: 99, position: 'relative' }}>
          <div style={{ position: 'absolute', left: '16%', right: '22%', top: 0, bottom: 0, background: 'rgba(1,35,116,0.5)', borderRadius: 99 }} />
          <div style={{ position: 'absolute', left: '62%', top: -4, width: 14, height: 14, borderRadius: '50%', background: '#C8932B', border: '3px solid #FFFDF9', transform: 'translateX(-50%)' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '12px 16px' }}>
        {['Find restaurants', 'Scan a menu', 'Meal history', 'Recipes'].map(t => (
          <div key={t} style={{ background: '#F7EFE1', borderRadius: 14, padding: '10px 12px', fontSize: 12, color: '#012374', fontWeight: 600 }}>{t}</div>
        ))}
      </div>
      {navBar}
    </div>
  );

  if (step === 1) return (
    <div style={phone}>
      <div style={{ padding: '24px 20px 20px' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Add a reading</div>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontStyle: 'italic', fontSize: 26, color: '#012374', marginTop: 6 }}>What's your number?</div>
      </div>
      <div style={{ padding: '0 20px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 80, color: '#012374', lineHeight: 1, fontFamily: 'DM Serif Display, serif' }}>157</div>
        <div style={{ fontSize: 14, color: '#16182A', opacity: 0.55, marginTop: 4 }}>mg/dL</div>
        <div style={{ marginTop: 12, display: 'inline-block', padding: '5px 14px', borderRadius: 99, background: 'rgba(200,147,43,0.18)', color: '#9A6F18', fontSize: 12, fontWeight: 600 }}>A bit above range</div>
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {['1','2','3','4','5','6','7','8','9','⌫','0','↵'].map(k => (
            <div key={k} style={{ padding: '14px 0', background: '#F7EFE1', borderRadius: 14, fontSize: 18, color: '#012374', fontWeight: 600, textAlign: 'center', fontFamily: k === '↵' ? 'DM Serif Display, serif' : 'inherit' }}>{k}</div>
          ))}
        </div>
      </div>
    </div>
  );

  if (step === 2) return (
    <div style={phone}>
      <div style={{ padding: '24px 20px 20px' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Step 2 of 4</div>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontStyle: 'italic', fontSize: 26, color: '#012374', marginTop: 6 }}>When did you take this?</div>
        <div style={{ fontSize: 13, color: '#16182A', opacity: 0.7, marginTop: 6, lineHeight: 1.5 }}>Knowing the timing helps Chatita make sense of your number.</div>
      </div>
      <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { label: 'Fasting', sub: 'Before eating anything', active: false },
          { label: 'Before meal', sub: 'Just about to eat', active: true },
          { label: 'After meal', sub: '1–2 hours after eating', active: false },
          { label: 'Bedtime', sub: 'Right before sleep', active: false },
          { label: 'Random', sub: 'No particular timing', active: false },
        ].map(t => (
          <div key={t.label} style={{ padding: '12px 16px', borderRadius: 14, border: `1.5px solid ${t.active ? '#012374' : 'rgba(1,35,116,0.12)'}`, background: t.active ? 'rgba(1,35,116,0.05)' : '#FFFDF9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#012374' }}>{t.label}</div>
              <div style={{ fontSize: 11, color: '#16182A', opacity: 0.6, marginTop: 1 }}>{t.sub}</div>
            </div>
            {t.active && <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#012374', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFFDF9' }} /></div>}
          </div>
        ))}
      </div>
    </div>
  );

  if (step === 3) return (
    <div style={phone}>
      <div style={{ padding: '24px 20px 20px' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Step 3 of 4</div>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontStyle: 'italic', fontSize: 26, color: '#012374', marginTop: 6 }}>How does your body feel?</div>
        <div style={{ fontSize: 13, color: '#16182A', opacity: 0.7, marginTop: 6, lineHeight: 1.5 }}>Select anything you're noticing right now.</div>
      </div>
      <div style={{ padding: '0 20px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['Fine', 'Shaky', 'Lightheaded', 'Tired', 'Nauseous', 'Thirsty', 'Headache', 'Sweaty', 'Brain fog'].map((s, i) => (
            <div key={s} style={{ padding: '8px 14px', borderRadius: 99, border: `1px solid ${i < 2 ? '#012374' : 'rgba(1,35,116,0.2)'}`, background: i === 0 ? '#012374' : '#FFFDF9', color: i === 0 ? '#FFFDF9' : '#012374', fontSize: 13, fontWeight: 500 }}>{s}</div>
          ))}
        </div>
        <div style={{ marginTop: 24, padding: '14px 16px', background: 'rgba(200,147,43,0.12)', borderLeft: '3px solid #C8932B', borderRadius: 10, fontSize: 12, color: '#16182A', lineHeight: 1.55 }}>
          Chatita tip: These symptoms help connect your number to how you actually feel — not just what the chart shows.
        </div>
      </div>
    </div>
  );

  if (step === 4) return (
    <div style={phone}>
      <div style={{ padding: '24px 20px 16px' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Step 4 of 4</div>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontStyle: 'italic', fontSize: 26, color: '#012374', marginTop: 6 }}>State of mind</div>
      </div>
      <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #5C77AE, #34508C)', boxShadow: '0 10px 28px -8px rgba(1,35,116,0.45)' }} />
        <div style={{ fontFamily: 'DM Serif Display, serif', fontStyle: 'italic', fontSize: 22, color: '#012374', marginTop: 14 }}>Unpleasant</div>
        <div style={{ fontSize: 11, color: '#C8932B', fontWeight: 600, marginTop: 2 }}>Difícil</div>
        <div style={{ marginTop: 16, width: '100%', position: 'relative', height: 10, borderRadius: 99, background: 'linear-gradient(90deg,#001A4D,#34508C,#7C86AB,#C8932B,#B07C1C)' }}>
          <div style={{ position: 'absolute', left: '28%', top: -5, width: 20, height: 20, borderRadius: '50%', background: '#FFFDF9', border: '3px solid #C8932B', boxShadow: '0 3px 8px rgba(0,0,0,0.3)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: 6, fontSize: 10, color: '#16182A', opacity: 0.6 }}>
          <span>Very unpleasant</span><span>Neutral</span><span>Very pleasant</span>
        </div>
        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {['Tired', 'Frustrated', 'Worried', 'Down', 'Anxious', '+ More'].map((w, i) => (
            <span key={w} style={{ padding: '6px 12px', borderRadius: 99, background: i < 2 ? '#012374' : '#F7EFE1', color: i < 2 ? '#FFFDF9' : '#012374', fontSize: 12, fontWeight: 500 }}>{w}</span>
          ))}
        </div>
      </div>
    </div>
  );

  if (step === 5) return (
    <div style={phone}>
      <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(126,211,33,0.18)', border: '2px solid rgba(74,140,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M4 12l6 6L20 6" stroke="#4A8C00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontStyle: 'italic', fontSize: 30, color: '#012374', marginTop: 16 }}>Check-in saved.</div>
        <div style={{ fontSize: 13, color: '#16182A', opacity: 0.7, marginTop: 8, lineHeight: 1.55, maxWidth: 260 }}>You showed up today. That's the part that matters.</div>
        <div style={{ marginTop: 28, width: '100%', background: '#F7EFE1', borderRadius: 16, padding: '16px 18px', textAlign: 'left' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.55)', fontWeight: 600 }}>Your moment, captured</div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C8932B' }} />
              <span style={{ fontSize: 13, color: '#012374' }}><b>157 mg/dL</b> · after lunch</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#012374' }} />
              <span style={{ fontSize: 13, color: '#012374' }}>Feeling tired, a bit frustrated</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#012374' }} />
              <span style={{ fontSize: 13, color: '#012374' }}>Stress · Work</span>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(200,147,43,0.12)', borderLeft: '3px solid #C8932B', borderRadius: 10, fontSize: 12, color: '#16182A', lineHeight: 1.55, textAlign: 'left', width: '100%' }}>
          A bit above range and a hard moment — that's okay. A short walk often helps both. Want some ideas?
        </div>
      </div>
    </div>
  );

  if (step === 6) return (
    <div style={phone}>
      <div style={{ padding: '24px 20px 16px' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Scan a menu</div>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontStyle: 'italic', fontSize: 26, color: '#012374', marginTop: 6 }}>Add a menu photo</div>
        <div style={{ fontSize: 13, color: '#16182A', opacity: 0.7, marginTop: 6, lineHeight: 1.5 }}>Any menu works — a photo, a screenshot, or a PDF.</div>
      </div>
      <div style={{ padding: '8px 20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ height: 180, background: '#F7EFE1', borderRadius: 18, border: '2px dashed rgba(1,35,116,0.18)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2.5" stroke="#012374" strokeWidth="1.5" opacity="0.5"/><circle cx="12" cy="12.5" r="3.5" stroke="#012374" strokeWidth="1.5" opacity="0.5"/><path d="M8 6l1.5-2h5L16 6" stroke="#012374" strokeWidth="1.5" opacity="0.5"/></svg>
          <span style={{ fontSize: 13, color: 'rgba(1,35,116,0.5)', fontWeight: 500 }}>Tap to take a photo</span>
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, color: '#16182A', opacity: 0.5 }}>or</div>
        <button style={{ padding: '13px', borderRadius: 14, border: '1.5px solid rgba(1,35,116,0.18)', background: '#FFFDF9', fontSize: 14, fontWeight: 600, color: '#012374', fontFamily: 'inherit' }}>
          Upload from gallery
        </button>
        <div style={{ padding: '12px 14px', background: 'rgba(200,147,43,0.12)', borderLeft: '3px solid #C8932B', borderRadius: 10, fontSize: 12, color: '#16182A', lineHeight: 1.55 }}>
          Chatita tip: Any menu works — even a blurry photo. We'll do our best with what you share.
        </div>
      </div>
    </div>
  );

  if (step === 7) return (
    <div style={phone}>
      <div style={{ padding: '24px 20px 16px' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Reading your menu</div>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontStyle: 'italic', fontSize: 26, color: '#012374', marginTop: 6 }}>Give me a moment…</div>
      </div>
      <div style={{ padding: '12px 20px 24px' }}>
        <div style={{ height: 120, background: '#F7EFE1', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[0, 150, 300].map(d => (
              <div key={d} style={{ width: 10, height: 10, borderRadius: '50%', background: '#012374', opacity: 0.5, animation: `bounce 1.2s ${d}ms infinite` }} />
            ))}
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#16182A', opacity: 0.7, lineHeight: 1.55, textAlign: 'center' }}>
          Scanning for dishes, estimating carbs, and checking against your glucose targets…
        </div>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['Finding dishes...', 'Estimating portions...', 'Checking your range...'].map((t, i) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F7EFE1', borderRadius: 10 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: i === 0 ? '#012374' : 'rgba(1,35,116,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {i === 0 && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFFDF9' }} />}
              </div>
              <span style={{ fontSize: 12, color: '#012374', opacity: i === 0 ? 1 : 0.4 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (step === 8) return (
    <div style={phone}>
      <div style={{ padding: '20px 20px 12px' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>AI picks · 3 great options</div>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontStyle: 'italic', fontSize: 22, color: '#012374', marginTop: 4 }}>Here's what works for you</div>
      </div>
      <div style={{ padding: '0 16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { dot: '#012374', badge: 'Great', dish: 'Grilled salmon salad', note: 'High protein, steady glucose. Ask for dressing on the side.', cal: '~420 cal · ~18g carbs' },
          { dot: '#C8932B', badge: 'Moderate', dish: 'Black bean tacos (2)', note: 'Good fiber. Pair with water, skip the soda.', cal: '~560 cal · ~52g carbs' },
          { dot: '#7C86AB', badge: 'With care', dish: 'Pasta primavera', note: 'Higher carbs — a smaller portion and a walk after helps.', cal: '~680 cal · ~88g carbs' },
        ].map(d => (
          <div key={d.dish} style={{ padding: '14px', background: '#F7EFE1', borderRadius: 16, border: '1px solid rgba(1,35,116,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.dot, flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: d.dot, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{d.badge}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#012374', marginTop: 6 }}>{d.dish}</div>
            <div style={{ fontSize: 12, color: '#16182A', opacity: 0.75, marginTop: 4, lineHeight: 1.45 }}>{d.note}</div>
            <div style={{ fontSize: 11, color: '#C8932B', fontWeight: 600, marginTop: 6 }}>{d.cal}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (step === 9) return (
    <div style={phone}>
      <div style={{ padding: '24px 20px 16px' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Recipes</div>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontStyle: 'italic', fontSize: 26, color: '#012374', marginTop: 6 }}>What's in your kitchen?</div>
      </div>
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ padding: '10px 14px', background: '#F7EFE1', borderRadius: 12, fontSize: 13, color: 'rgba(1,35,116,0.45)', marginBottom: 12 }}>
          Eggs, black beans, spinach, olive oil…
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {['Eggs', 'Black beans', 'Spinach', 'Olive oil', 'Garlic', '+ Add'].map((i, idx) => (
            <span key={i} style={{ padding: '5px 11px', borderRadius: 99, background: idx < 5 ? '#012374' : '#F7EFE1', color: idx < 5 ? '#FFFDF9' : '#012374', fontSize: 12 }}>{i}</span>
          ))}
        </div>
        {[
          { name: 'Huevos rancheros bowl', time: '15 min', carbs: '~28g carbs' },
          { name: 'Spinach & black bean scramble', time: '10 min', carbs: '~22g carbs' },
        ].map(r => (
          <div key={r.name} style={{ padding: '14px', background: '#F7EFE1', borderRadius: 14, marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#012374' }}>{r.name}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <span style={{ fontSize: 11, color: '#16182A', opacity: 0.6 }}>{r.time}</span>
              <span style={{ fontSize: 11, color: '#C8932B', fontWeight: 600 }}>{r.carbs}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (step === 10) return (
    <div style={phone}>
      <div style={{ padding: '20px 20px 12px' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Restaurants nearby</div>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontStyle: 'italic', fontSize: 22, color: '#012374', marginTop: 4 }}>Kind spots near you</div>
      </div>
      <div style={{ padding: '0 16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
          {[['#012374', 'Great'], ['#C8932B', 'Moderate'], ['#7C86AB', 'With care']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
              <span style={{ fontSize: 11, color: '#16182A', opacity: 0.75 }}>{l}</span>
            </div>
          ))}
        </div>
        {[
          { dot: '#012374', name: 'Café Verde', dist: '0.3 mi', tag: 'Mexican · salads · bowls', note: 'Great grilled options. Ask for beans on the side.' },
          { dot: '#C8932B', name: 'La Familia Kitchen', dist: '0.5 mi', tag: 'Mexican comfort food', note: 'Try the soups. Skip the large tortilla portions.' },
          { dot: '#7C86AB', name: 'El Ranchero', dist: '0.8 mi', tag: 'Traditional Mexican', note: 'Hearty plates — order the half portion if available.' },
        ].map(r => (
          <div key={r.name} style={{ padding: '14px', background: '#F7EFE1', borderRadius: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.dot, flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#012374', flex: 1 }}>{r.name}</span>
              <span style={{ fontSize: 11, color: '#16182A', opacity: 0.55 }}>{r.dist}</span>
            </div>
            <div style={{ fontSize: 11, color: '#16182A', opacity: 0.6, marginTop: 3 }}>{r.tag}</div>
            <div style={{ fontSize: 12, color: '#16182A', opacity: 0.8, marginTop: 6, lineHeight: 1.45 }}>{r.note}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (step === 11) return (
    <div style={phone}>
      <div style={{ padding: '20px 20px 12px' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Snap a meal</div>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontStyle: 'italic', fontSize: 22, color: '#012374', marginTop: 4 }}>What are you eating?</div>
      </div>
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{ height: 160, background: '#F7EFE1', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #F7EFE1 0%, #EFE4D2 100%)' }} />
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" style={{ position: 'relative' }}><rect x="3" y="6" width="18" height="13" rx="2.5" stroke="#012374" strokeWidth="1.5" opacity="0.4"/><circle cx="12" cy="12.5" r="3.5" stroke="#012374" strokeWidth="1.5" opacity="0.4"/></svg>
        </div>
        <div style={{ background: '#F7EFE1', borderRadius: 14, padding: '14px' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.55)', fontWeight: 600 }}>Chatita's estimate</div>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#012374' }}>Estimated carbs</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#012374' }}>~52g</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#012374' }}>Expected impact</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#C8932B' }}>Moderate rise</span>
            </div>
          </div>
          <div style={{ marginTop: 12, height: 6, background: 'rgba(1,35,116,0.1)', borderRadius: 99, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, width: '55%', top: 0, bottom: 0, background: 'linear-gradient(90deg, rgba(1,35,116,0.4), #C8932B)', borderRadius: 99 }} />
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#16182A', opacity: 0.8, lineHeight: 1.5 }}>A short walk after eating can soften the rise by 15–20%.</div>
        </div>
      </div>
    </div>
  );

  return null;
}

export default function WalkthroughPage() {
  const [step, setStep] = useState(0);

  const go = (i: number) => setStep(i);
  const next = () => setStep(s => (s >= PAGES.length - 1 ? 0 : s + 1));
  const prev = () => setStep(s => Math.max(0, s - 1));

  const page = PAGES[step];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#EFE4D2',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: '#16182A',
      }}
    >
      {/* Back link */}
      <div style={{ padding: '20px 32px 0' }}>
        <Link
          href="/home"
          style={{ fontSize: 12, color: 'rgba(1,35,116,0.55)', fontWeight: 600, textDecoration: 'none', letterSpacing: '0.14em', textTransform: 'uppercase' }}
        >
          ← Back to app
        </Link>
      </div>

      {/* Main layout */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 40,
          padding: '32px 40px 48px',
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        {/* ── Guide panel ── */}
        <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>
            Guided walkthrough
          </div>
          <div
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 36,
              color: '#012374',
              lineHeight: 1.04,
              marginTop: 8,
              minHeight: 86,
            }}
          >
            {page.name}
          </div>
          <div style={{ fontSize: 13, color: '#16182A', opacity: 0.55, marginTop: 6, fontWeight: 600, letterSpacing: '0.02em' }}>
            Page {step + 1} of {PAGES.length}
          </div>
          <div style={{ fontSize: 15, color: '#16182A', opacity: 0.82, lineHeight: 1.58, marginTop: 14, minHeight: 96 }}>
            {page.cap}
          </div>

          {/* Nav list */}
          <div
            style={{
              marginTop: 20,
              borderTop: '1px solid rgba(1,35,116,0.12)',
              paddingTop: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {PAGES.map((p, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 10px',
                  borderRadius: 8,
                  background: i === step ? 'rgba(1,35,116,0.08)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  transition: 'background 0.15s',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: i === step ? '#012374' : 'rgba(1,35,116,0.4)',
                    width: 20,
                    flexShrink: 0,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: i === step ? '#012374' : 'rgba(1,35,116,0.55)',
                    fontWeight: i === step ? 600 : 400,
                  }}
                >
                  {p.name}
                </span>
              </button>
            ))}
          </div>

          {/* Prev / Next */}
          <div style={{ marginTop: 'auto', paddingTop: 20, display: 'flex', gap: 10 }}>
            <button
              onClick={prev}
              disabled={step === 0}
              style={{
                flex: 1,
                padding: '11px 0',
                borderRadius: 12,
                border: '1px solid rgba(1,35,116,0.22)',
                background: '#FFFDF9',
                color: '#012374',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: step === 0 ? 'not-allowed' : 'pointer',
                opacity: step === 0 ? 0.4 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              ← Prev
            </button>
            <button
              onClick={next}
              style={{
                flex: 1,
                padding: '11px 0',
                borderRadius: 12,
                border: 'none',
                background: '#012374',
                color: '#FFFDF9',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
                boxShadow: '0 8px 18px -8px rgba(1,35,116,0.5)',
              }}
            >
              {step >= PAGES.length - 1 ? 'Restart' : 'Next →'}
            </button>
          </div>
        </div>

        {/* ── Screen panel ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 0',
          }}
        >
          <StepScreen step={step} />
        </div>
      </div>
    </div>
  );
}
