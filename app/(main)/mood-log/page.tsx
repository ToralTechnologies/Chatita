'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/bottom-nav';
import BackButton from '@/components/back-button';

interface MoodEntry {
  id: string;
  mood: string;
  stressLevel: number;
  notFeelingWell: boolean;
  onPeriod: boolean;
  feelingOverwhelmed: boolean;
  havingCravings: boolean;
  notes: string | null;
  recordedAt: string;
}

const ORB_COLORS: Record<string, { from: string; to: string }> = {
  happy:    { from: '#E5BC5E', to: '#C8932B' },
  grateful: { from: '#D8A53E', to: '#B07C1C' },
  calm:     { from: '#7C86AB', to: '#5C77AE' },
  neutral:  { from: '#A4ACC6', to: '#7C86AB' },
  tired:    { from: '#5C77AE', to: '#34508C' },
  anxious:  { from: '#34508C', to: '#001A4D' },
  sad:      { from: '#34508C', to: '#001A4D' },
};

const MOOD_LABELS: Record<string, string> = {
  happy: 'Great', grateful: 'Grateful', calm: 'Calm',
  neutral: 'Okay', tired: 'Tired', anxious: 'Anxious', sad: 'Down',
};

const STRESS_LABELS: Record<number, string> = {
  1: 'Very easy', 2: 'Easy', 3: 'Easy', 4: 'Mild', 5: 'Mild',
  6: 'Some', 7: 'Some', 8: 'Heavy', 9: 'Heavy', 10: 'A lot',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function groupByDay(entries: MoodEntry[]) {
  const groups: { label: string; entries: MoodEntry[] }[] = [];
  const map = new Map<string, MoodEntry[]>();

  for (const entry of entries) {
    const d = new Date(entry.recordedAt);
    const key = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }

  for (const [label, entries] of map.entries()) {
    groups.push({ label, entries });
  }
  return groups;
}

export default function MoodLogPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    fetch('/api/mood?limit=50')
      .then(r => r.ok ? r.json() : { entries: [] })
      .then(d => setEntries(d.entries || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session]);

  if (status === 'loading') return null;
  if (!session) return null;

  const grouped = groupByDay(entries);

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg-page)' }}>

      {/* Header */}
      <div style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid rgba(1,35,116,0.08)',
        padding: '14px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: 672, margin: '0 auto' }}>
          <BackButton href="/home" />
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8 }}>
            <h1 className="font-serif-italic" style={{ fontSize: 28, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              State of mind
            </h1>
            <span style={{ fontSize: 11, color: '#C8932B', fontWeight: 700 }}>Your mood log</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 672, margin: '0 auto', padding: '20px 20px 0' }}>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 88, background: 'var(--bg-card)', borderRadius: 18, opacity: 0.5 }} />
            ))}
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div style={{
            marginTop: 40,
            textAlign: 'center',
            padding: '40px 20px',
            background: 'var(--bg-card)',
            borderRadius: 22,
            border: '1px solid rgba(1,35,116,0.06)',
          }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(1,35,116,0.08)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#012374" strokeWidth="1.5" opacity="0.5"/><path d="M8.5 14s1 1.5 3.5 1.5 3.5-1.5 3.5-1.5M9 9h.01M15 9h.01" stroke="#012374" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <p className="font-serif-italic" style={{ fontSize: 20, color: 'var(--text-primary)' }}>No check-ins yet</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
              Your mood check-ins will appear here. Go back to the home screen to log how you're feeling.
            </p>
          </div>
        )}

        {!loading && grouped.map(({ label, entries: dayEntries }) => (
          <div key={label} style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#C8932B',
              fontWeight: 700,
              marginBottom: 10,
            }}>
              {label}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dayEntries.map(entry => {
                const orb = ORB_COLORS[entry.mood] ?? ORB_COLORS.neutral;
                const tags = [
                  entry.notFeelingWell && 'Not feeling well',
                  entry.onPeriod && 'On period',
                  entry.feelingOverwhelmed && 'Overwhelmed',
                  entry.havingCravings && 'Having cravings',
                ].filter(Boolean) as string[];

                return (
                  <div
                    key={entry.id}
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: 18,
                      padding: '16px 18px',
                      border: '1px solid rgba(1,35,116,0.06)',
                      display: 'flex',
                      gap: 14,
                      alignItems: 'flex-start',
                    }}
                  >
                    {/* Orb */}
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: `radial-gradient(circle at 35% 30%, ${orb.from}, ${orb.to})`,
                      flexShrink: 0,
                      boxShadow: `0 6px 14px -6px ${orb.to}88`,
                    }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                        <span className="font-serif-italic" style={{ fontSize: 18, color: 'var(--text-primary)', lineHeight: 1 }}>
                          {MOOD_LABELS[entry.mood] ?? entry.mood}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                          {formatDate(entry.recordedAt)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 5 }}>
                        {/* Stress bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Stress:</div>
                          <div style={{ display: 'flex', gap: 2 }}>
                            {[1, 2, 3, 4, 5].map(i => (
                              <div key={i} style={{
                                width: 14,
                                height: 6,
                                borderRadius: 3,
                                background: i <= Math.ceil(entry.stressLevel / 2)
                                  ? (entry.stressLevel >= 8 ? '#E3171A' : entry.stressLevel >= 5 ? '#C8932B' : '#012374')
                                  : 'rgba(1,35,116,0.1)',
                              }} />
                            ))}
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {STRESS_LABELS[entry.stressLevel] ?? ''}
                          </span>
                        </div>
                      </div>

                      {tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                          {tags.map(t => (
                            <span key={t} style={{
                              padding: '3px 9px',
                              borderRadius: 99,
                              fontSize: 11,
                              background: 'rgba(1,35,116,0.07)',
                              color: 'var(--text-secondary)',
                            }}>{t}</span>
                          ))}
                        </div>
                      )}

                      {entry.notes && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5, fontStyle: 'italic' }}>
                          "{entry.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
