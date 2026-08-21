import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Database,
  Download,
  Flame,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  Smartphone,
  Trash2,
  Trophy,
  WifiOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CATEGORIES, CODE_DEFECTS, QUESTIONS } from '../data/questions';
import { iconFor } from '../theme';
import { Progress, Ring, SectionHeader, StatTile, Tappable } from './ui';

type Tab = 'profile' | 'privacy';

export const ComplianceInfo: React.FC = () => {
  const { state, stats, achievements, categoryProgress, setDailyGoal, resetProgress } = useApp();
  const [tab, setTab] = useState<Tab>('profile');

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JavaMaster_progress_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const unlocked = achievements.filter((a) => a.unlocked);

  return (
    <div className="fade-in mx-auto max-w-4xl space-y-6 p-4 pb-10 md:p-7">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-white md:text-3xl">Your profile</h2>
        <p className="mt-1 text-xs text-[var(--muted)] md:text-sm">
          Everything lives on this device. Nothing is uploaded, ever.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1">
        {(
          [
            { id: 'profile', label: 'Progress' },
            { id: 'privacy', label: 'Privacy & data' },
          ] as const
        ).map((t) => (
          <Tappable
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex-1 rounded-xl py-2.5 text-xs font-bold transition-colors ${
              tab === t.id ? 'text-white' : 'text-[var(--dim)]'
            }`}
          >
            {tab === t.id && (
              <motion.span
                layoutId="profileTab"
                className="absolute inset-0 rounded-xl border border-white/[0.1] bg-white/[0.07]"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{t.label}</span>
          </Tappable>
        ))}
      </div>

      {tab === 'profile' ? (
        <div className="space-y-6">
          {/* Level */}
          <section className="card ring-brand relative overflow-hidden p-5" data-accent="fuchsia">
            <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-fuchsia-500/15 blur-3xl" />
            <div className="relative flex flex-wrap items-center gap-5">
              <Ring value={stats.levelProgress} size={92} stroke={7}>
                <div className="text-center leading-none">
                  <div className="text-2xl" aria-hidden>
                    {stats.rank.emoji}
                  </div>
                  <div className="mt-1 text-[10px] font-bold text-[var(--dim)]">LV {stats.level}</div>
                </div>
              </Ring>

              <div className="min-w-[180px] flex-1">
                <div className="eyebrow">Current rank</div>
                <h3 className="font-display text-xl font-bold text-white">{stats.rank.name}</h3>
                <div className="mt-2">
                  <Progress value={stats.levelProgress} height={7} />
                  <div className="mt-1.5 flex justify-between text-[10.5px] font-bold text-[var(--dim)] tabular">
                    <span>{stats.xp.toLocaleString()} XP</span>
                    <span>
                      {stats.nextRank
                        ? `${(stats.nextRank.xp - stats.xp).toLocaleString()} to ${stats.nextRank.name}`
                        : 'Max rank reached'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div data-accent="violet">
              <StatTile label="Mastered" value={stats.mastered} sub={`of ${QUESTIONS.length}`} />
            </div>
            <div data-accent="orange">
              <StatTile
                label="Streak"
                value={stats.streak}
                sub={`best ${stats.bestStreak} day${stats.bestStreak === 1 ? '' : 's'}`}
                icon={<Flame className="h-3.5 w-3.5" />}
              />
            </div>
            <div data-accent="amber">
              <StatTile label="Bugs solved" value={`${stats.defectsSolved}/${CODE_DEFECTS.length}`} />
            </div>
            <div data-accent="emerald">
              <StatTile
                label="Badges"
                value={`${unlocked.length}/${achievements.length}`}
                icon={<Trophy className="h-3.5 w-3.5" />}
              />
            </div>
          </section>

          {/* Daily goal */}
          <section className="card p-4" data-accent="cyan">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="eyebrow">Daily goal</div>
                <p className="mt-1 text-[12.5px] text-[var(--muted)]">
                  Questions to master each day. Small and consistent beats heroic and abandoned.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Tappable
                  onClick={() => setDailyGoal(stats.dailyGoal - 1)}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.09] bg-white/[0.04] text-white"
                >
                  <Minus className="h-4 w-4" />
                </Tappable>
                <span className="font-display w-9 text-center text-xl font-bold text-white tabular">
                  {stats.dailyGoal}
                </span>
                <Tappable
                  onClick={() => setDailyGoal(stats.dailyGoal + 1)}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.09] bg-white/[0.04] text-white"
                >
                  <Plus className="h-4 w-4" />
                </Tappable>
              </div>
            </div>
          </section>

          {/* Per-domain */}
          <section>
            <SectionHeader title="Domain mastery" hint="Where you are strong, and where you are not" />
            <div className="space-y-2">
              {CATEGORIES.map((c) => {
                const p = categoryProgress(c.id);
                const Icon = iconFor(c.icon);
                return (
                  <div key={c.id} data-accent={c.accent} className="card flex items-center gap-3 p-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--a-line)] bg-[var(--a-soft)] text-[var(--a)]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[12.5px] font-bold text-white">{c.name}</span>
                        <span className="text-[11px] font-bold text-[var(--dim)] tabular">
                          {p.done}/{p.total}
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <Progress value={p.total ? p.done / p.total : 0} height={4} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Badges */}
          <section>
            <SectionHeader title="Badges" hint={`${unlocked.length} of ${achievements.length} unlocked`} />
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {achievements.map(({ achievement, unlocked: got }) => (
                <div
                  key={achievement.id}
                  title={achievement.description}
                  className={`card p-3 text-center ${got ? '' : 'opacity-40 grayscale'}`}
                  data-accent="lime"
                >
                  <div className="text-2xl" aria-hidden>
                    {achievement.emoji}
                  </div>
                  <div className="font-display mt-1.5 text-[11px] leading-tight font-bold text-white">
                    {achievement.name}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Privacy */}
          <section className="card p-5" data-accent="emerald">
            <div className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--a-line)] bg-[var(--a-soft)] text-[var(--a)]">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-white">No accounts. No tracking.</h3>
                <p className="text-[11.5px] text-[var(--muted)]">Your progress never leaves this device.</p>
              </div>
            </div>

            <ul className="mt-4 space-y-2.5">
              {[
                'No sign-up, no email, no personal data collected at any point.',
                'No analytics SDKs, no advertising identifiers, no third-party trackers.',
                'Progress, bookmarks and mock scores are stored in this device’s local storage only.',
                'All question content ships inside the app, so it works fully offline.',
                'Uninstalling the app deletes everything. There is no server-side copy to request.',
              ].map((line, i) => (
                <li key={i} className="flex gap-2.5 text-[12.5px] leading-relaxed text-[var(--muted)]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  {line}
                </li>
              ))}
            </ul>
          </section>

          {/* Platform */}
          <section className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: WifiOff, label: 'Works offline', body: 'Every question is bundled. No network needed.', accent: 'cyan' },
              { icon: Smartphone, label: 'Built for mobile', body: 'Android API 34+ and iOS 17+, safe-area aware.', accent: 'violet' },
              { icon: ShieldCheck, label: 'Store compliant', body: 'No user-generated content, ads or tracking.', accent: 'emerald' },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} data-accent={c.accent} className="card p-4">
                  <div className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--a-line)] bg-[var(--a-soft)] text-[var(--a)]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h4 className="font-display mt-2.5 text-[13px] font-bold text-white">{c.label}</h4>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--muted)]">{c.body}</p>
                </div>
              );
            })}
          </section>

          {/* Data controls */}
          <section className="card p-5">
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-[var(--dim)] uppercase">
              <Database className="h-3.5 w-3.5" /> Your data
            </div>

            <div className="mt-3 space-y-2 text-[12px] text-[var(--muted)]">
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span>Storage key</span>
                <span className="font-mono text-[11px] text-white">JavaMaster_AppState_v2</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span>Questions mastered</span>
                <span className="font-bold text-white tabular">{state.completedQuestions.length}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span>Bookmarks</span>
                <span className="font-bold text-white tabular">{state.savedQuestions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Mock rounds recorded</span>
                <span className="font-bold text-white tabular">{state.interviewHistory.length}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Tappable
                onClick={exportData}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.04] py-2.5 text-xs font-bold text-white"
              >
                <Download className="h-4 w-4" /> Export my progress
              </Tappable>
              <Tappable
                onClick={resetProgress}
                className="flex items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 py-2.5 text-xs font-bold text-rose-300"
              >
                <Trash2 className="h-4 w-4" /> Erase everything
              </Tappable>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
