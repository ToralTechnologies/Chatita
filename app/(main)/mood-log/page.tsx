'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/bottom-nav';
import WebNav from '@/components/web-nav';
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
  // Extended
  moodIntensity?: number | null;
  energyLevel?: number | null;
  hungerLevel?: number | null;
  fullnessLevel?: number | null;
  cravings?: string | null;
  symptoms?: string | null;
  contextTags?: string | null;
  userWords?: string | null;
  foodMoodConnection?: string | null;
  supportWanted?: string | null;
}

// ── Mood config ────────────────────────────────────────────────────────────────

const ORB_COLORS: Record<string, { from: string; to: string; dot: string }> = {
  happy:    { from: '#E5BC5E', to: '#C8932B', dot: '#C8932B' },
  grateful: { from: '#D8A53E', to: '#B07C1C', dot: '#C8932B' },
  calm:     { from: '#7CBBBF', to: '#2A8A8A', dot: '#2A8A8A' },
  neutral:  { from: '#A4ACC6', to: '#7C86AB', dot: '#6B7A99' },
  tired:    { from: '#8A7AB8', to: '#5C5290', dot: '#8A6FB0' },
  anxious:  { from: '#D07B5B', to: '#B5562E', dot: '#B5562E' },
  sad:      { from: '#5C77AE', to: '#34508C', dot: '#4A5578' },
};

const MOOD_LABELS: Record<string, string> = {
  happy: 'Great', grateful: 'Grateful', calm: 'Calm',
  neutral: 'Okay', tired: 'Tired', anxious: 'Anxious', sad: 'Down',
};

const STRESS_LABELS: Record<number, string> = {
  1: 'Very easy', 2: 'Easy', 3: 'Easy', 4: 'Mild', 5: 'Mild',
  6: 'Some', 7: 'Some', 8: 'Heavy', 9: 'Heavy', 10: 'A lot',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

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

function groupByDay(entries: MoodEntry[]) {
  const groups: { label: string; entries: MoodEntry[] }[] = [];
  const map = new Map<string, MoodEntry[]>();

  for (const entry of entries) {
    const d = new Date(entry.recordedAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    const key = diffDays === 0
      ? 'Today'
      : diffDays === 1
      ? 'Yesterday'
      : d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }

  for (const [label, es] of map.entries()) {
    groups.push({ label, entries: es });
  }
  return groups;
}

// ── Entry card ────────────────────────────────────────────────────────────────

function EntryCard({ entry, web }: { entry: MoodEntry; web?: boolean }) {
  const orb = ORB_COLORS[entry.mood] ?? ORB_COLORS.neutral;
  const stressLabel = STRESS_LABELS[entry.stressLevel] ?? '';
  const tags = [
    entry.notFeelingWell && 'Not feeling well',
    entry.onPeriod && 'On period',
    entry.feelingOverwhelmed && 'Overwhelmed',
    entry.havingCravings && 'Having cravings',
  ].filter(Boolean) as string[];

  return (
    <div style={{
      background: web ? '#F7EFE1' : '#FFFDF9',
      borderRadius: 14,
      padding: web ? '12px 14px' : '13px 15px',
      border: web ? 'none' : '1px solid rgba(1,35,116,0.07)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
    }}>
      {/* Orb — kept per user instruction */}
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
          <span style={{ fontSize: 14, fontWeight: 600, color: '#16182A' }}>
            {MOOD_LABELS[entry.mood] ?? entry.mood}
          </span>
          <span style={{ fontSize: 12, color: 'rgba(22,24,42,0.45)', flexShrink: 0 }}>
            {formatDate(entry.recordedAt)}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(22,24,42,0.55)', marginTop: 2 }}>
          Stress: {stressLabel}
        </div>
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 7 }}>
            {tags.map(t => (
              <span key={t} style={{ padding: '3px 9px', borderRadius: 99, fontSize: 11, background: 'rgba(1,35,116,0.07)', color: 'rgba(22,24,42,0.7)' }}>{t}</span>
            ))}
          </div>
        )}
        {/* Extended stats row */}
        {(entry.energyLevel || entry.hungerLevel || entry.fullnessLevel) && (
          <div style={{ display: 'flex', gap: 10, marginTop: 7, flexWrap: 'wrap' }}>
            {entry.energyLevel && <span style={{ fontSize: 11, color: 'rgba(22,24,42,0.55)' }}>Energy: {entry.energyLevel}/10</span>}
            {entry.hungerLevel && <span style={{ fontSize: 11, color: 'rgba(22,24,42,0.55)' }}>Hunger: {entry.hungerLevel}/10</span>}
            {entry.fullnessLevel && <span style={{ fontSize: 11, color: 'rgba(22,24,42,0.55)' }}>Fullness: {entry.fullnessLevel}/10</span>}
          </div>
        )}
        {/* Parsed JSON arrays */}
        {(() => {
          const cravings = entry.cravings ? (() => { try { return JSON.parse(entry.cravings!); } catch { return []; } })() : [];
          const symptoms = entry.symptoms ? (() => { try { return JSON.parse(entry.symptoms!); } catch { return []; } })() : [];
          const ctags = entry.contextTags ? (() => { try { return JSON.parse(entry.contextTags!); } catch { return []; } })() : [];
          const allTags = [...cravings, ...symptoms, ...ctags];
          return allTags.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {allTags.map((t: string) => (
                <span key={t} style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, background: 'rgba(1,35,116,0.06)', color: 'rgba(22,24,42,0.65)' }}>{t}</span>
              ))}
            </div>
          ) : null;
        })()}
        {/* User's own words */}
        {entry.userWords && (
          <p style={{ fontSize: 12, color: 'rgba(22,24,42,0.65)', marginTop: 6, lineHeight: 1.5, fontStyle: 'italic' }}>
            &ldquo;{entry.userWords}&rdquo;
          </p>
        )}
        {entry.notes && (
          <p style={{ fontSize: 12, color: 'rgba(22,24,42,0.6)', marginTop: 6, lineHeight: 1.5, fontStyle: 'italic' }}>
            &ldquo;{entry.notes}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

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

  const EmptyState = () => (
    <div style={{ padding: '52px 20px', textAlign: 'center', background: '#FFFDF9', borderRadius: 22, border: '1.5px dashed rgba(1,35,116,0.16)' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(1,35,116,0.07)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#012374" strokeWidth="1.5" opacity="0.5"/><path d="M8.5 14s1 1.5 3.5 1.5 3.5-1.5 3.5-1.5M9 9h.01M15 9h.01" stroke="#012374" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </div>
      <p className="font-serif-italic" style={{ fontSize: 22, color: '#012374' }}>No check-ins yet</p>
      <p style={{ fontSize: 13, color: 'rgba(22,24,42,0.55)', marginTop: 8, lineHeight: 1.6, maxWidth: 320, margin: '8px auto 0' }}>
        Your mood check-ins will appear here. Log how you&apos;re feeling from the home screen.
      </p>
    </div>
  );

  const LoadingSkeleton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: 76, background: '#FFFDF9', borderRadius: 14, opacity: 0.5 }} />
      ))}
    </div>
  );

  const LogGroups = ({ web }: { web?: boolean }) => (
    <>
      {loading ? <LoadingSkeleton /> : entries.length === 0 ? <EmptyState /> : (
        grouped.map(({ label, entries: dayEntries }) => (
          <div key={label} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,26,77,0.5)', fontWeight: 700, marginBottom: 10 }}>
              {label}
            </div>
            {web ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                {dayEntries.map(entry => (
                  <EntryCard key={entry.id} entry={entry} web />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dayEntries.map(entry => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </>
  );

  return (
    <>
      {/* ─── Mobile ─── */}
      <div className="lg:hidden mobile-page-pb" style={{ minHeight: '100vh', background: '#F7EFE1', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ padding: '18px 20px 0', paddingTop: 'max(18px, env(safe-area-inset-top, 0px))' }}>
          <BackButton href="/home" />
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>State of mind</div>
            <h1 className="font-serif-italic" style={{ fontSize: 23, color: '#012374', lineHeight: 1 }}>Your mood log</h1>
          </div>
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          <LogGroups />
        </div>

        <BottomNav />
      </div>

      {/* ─── Web ─── */}
      <div className="hidden lg:flex" style={{ height: '100vh', background: '#F7EFE1', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>
        <WebNav />

        <div style={{ flex: 1, overflowY: 'auto', padding: '34px 44px 44px' }}>
          <div style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>
            State of mind · {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <h1 className="font-serif-italic" style={{ fontSize: 38, color: '#012374', lineHeight: 1.05, marginTop: 6 }}>
            How are you, really?
          </h1>
          <p style={{ fontSize: 16, color: '#16182A', opacity: 0.72, marginTop: 4, lineHeight: 1.55 }}>
            Check in, watch your week unfold, and see how your mood has been tracking.
          </p>

          <div style={{ marginTop: 26, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, alignItems: 'start' }}>
            {/* Left column */}
            <div>
              <div style={{ background: '#FFFDF9', borderRadius: 22, border: '1px solid rgba(1,35,116,0.07)', padding: 24, boxShadow: '0 14px 30px -24px rgba(1,35,116,.3)' }}>
                <div className="font-serif-italic" style={{ fontSize: 23, color: '#012374', marginBottom: 14 }}>Recent check-ins</div>
                <LogGroups web />
              </div>
            </div>

            {/* Right column — summary / insight */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div style={{ background: '#FFFDF9', borderRadius: 22, border: '1px solid rgba(1,35,116,0.07)', padding: 24, boxShadow: '0 14px 30px -24px rgba(1,35,116,.3)' }}>
                <div className="font-serif-italic" style={{ fontSize: 23, color: '#012374', marginBottom: 6 }}>Your week at a glance</div>
                <p style={{ fontSize: 14, color: 'rgba(22,24,42,0.6)', lineHeight: 1.6 }}>
                  {entries.length === 0
                    ? 'No check-ins yet this week. Start from the home screen.'
                    : `${entries.length} check-in${entries.length === 1 ? '' : 's'} logged. Keep checking in — patterns emerge over time.`}
                </p>

                {/* Mood distribution if there are entries */}
                {entries.length > 0 && (() => {
                  const counts: Record<string, number> = {};
                  entries.forEach(e => { counts[e.mood] = (counts[e.mood] || 0) + 1; });
                  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
                  return (
                    <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {top.map(([mood, count]) => {
                        const orb = ORB_COLORS[mood] ?? ORB_COLORS.neutral;
                        return (
                          <div key={mood} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F7EFE1', borderRadius: 12, padding: '10px 14px' }}>
                            <div style={{ width: 11, height: 11, borderRadius: '50%', background: orb.dot, flexShrink: 0 }} />
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#16182A' }}>{MOOD_LABELS[mood] ?? mood}</span>
                            <span style={{ fontSize: 12, color: 'rgba(22,24,42,0.5)' }}>×{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div style={{ background: '#012374', borderRadius: 22, padding: 24, color: '#FFFDF9' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C8932B', fontWeight: 700 }}>Chatita reminder</div>
                <p style={{ fontSize: 16, lineHeight: 1.6, marginTop: 10, opacity: 0.92 }}>
                  Your mood and blood sugar are connected. Stress, sleep, and how you feel all play a role — logging regularly helps you see the full picture.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
