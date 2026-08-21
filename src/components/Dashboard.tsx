import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bug,
  ChevronRight,
  Flame,
  Layers,
  Lightbulb,
  Mic,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CATEGORIES, TRACKS, getTrackQuestions } from '../data/questions';
import { iconFor } from '../theme';
import {
  Badge,
  Progress,
  Ring,
  SectionHeader,
  StatTile,
  Tappable,
  celebrate,
} from './ui';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setSelectedTrack: (trackId: string | null) => void;
}

const TIPS = [
  'Say the trade-off out loud. "I would pick X, and here is what it costs me" beats a confident one-sided answer every single time.',
  'When you hit something you do not know, say so and then reason forward. Interviewers score recovery, not omniscience.',
  'Numbers make you sound senior. "A cross-region round trip is ~80ms" ends a debate faster than an opinion.',
  'Ask what the failure mode is before you design the happy path. Most senior questions are really about what breaks.',
  'If they mention scale, ask for the read/write ratio first. The whole design hangs off that one number.',
  'Never say "it depends" and stop. Say what it depends on, then pick one and defend it.',
  'Draw the boundary before the boxes. Where the data lives decides the architecture.',
  'For any concurrency answer, name the memory-visibility guarantee you are relying on. That is the tell.',
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return 'Still up?';
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
};

export const Dashboard: React.FC<DashboardProps> = ({
  setActiveTab,
  setSelectedCategory,
  setSelectedTrack,
}) => {
  const { state, stats, achievements, categoryProgress, acknowledgeLevel } = useApp();

  // Celebrate a level-up exactly once, the next time the dashboard is opened.
  useEffect(() => {
    if (stats.level > state.celebratedLevel) {
      celebrate('big');
      acknowledgeLevel(stats.level);
    }
  }, [stats.level, state.celebratedLevel, acknowledgeLevel]);

  const tip = useMemo(() => {
    const day = Math.floor(Date.now() / 86_400_000);
    return TIPS[day % TIPS.length];
  }, []);

  const unlocked = achievements.filter((a) => a.unlocked);
  const goalPct = Math.min(1, stats.todayCount / Math.max(1, stats.dailyGoal));

  const openCategory = (id: string) => {
    setSelectedTrack(null);
    setSelectedCategory(id);
    setActiveTab('library');
  };

  const openTrack = (id: string) => {
    setSelectedCategory(null);
    setSelectedTrack(id);
    setActiveTab('library');
  };

  const quickActions = [
    { id: 'interview', label: 'Mock interview', sub: 'Timed, scored, brutal', icon: Mic, accent: 'fuchsia' },
    { id: 'flashcards', label: 'Flashcards', sub: 'Swipe. Recall. Repeat.', icon: Layers, accent: 'cyan' },
    { id: 'defects', label: 'Spot the bug', sub: '16 cursed snippets', icon: Bug, accent: 'amber' },
    { id: 'library', label: 'Full library', sub: `${stats.total} deep dives`, icon: Sparkles, accent: 'violet' },
  ] as const;

  return (
    <div className="fade-in mx-auto max-w-6xl space-y-8 p-4 pb-10 md:p-7">
      {/* ---------------- Hero ---------------- */}
      <section className="card ring-brand relative overflow-hidden p-5 md:p-7" data-accent="fuchsia">
        <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-violet-500/15 blur-3xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <Badge>
              <Flame className="h-3 w-3" />
              {stats.streak} day streak{stats.bestStreak > stats.streak ? ` · best ${stats.bestStreak}` : ''}
            </Badge>

            <h2 className="font-display text-3xl leading-[1.05] font-bold text-white md:text-4xl">
              {greeting()}, <span className="text-brand">{stats.rank.name}</span>
            </h2>

            <p className="max-w-md text-sm text-[var(--muted)]">
              {stats.mastered === 0
                ? `${stats.total} questions across 11 domains, from fundamentals to the ones that end interviews. Start anywhere.`
                : `You have mastered ${stats.mastered} of ${stats.total}. ${
                    stats.nextRank
                      ? `${(stats.nextRank.xp - stats.xp).toLocaleString()} XP to ${stats.nextRank.name}.`
                      : 'You have hit the top rank. Respect.'
                  }`}
            </p>

            <div className="max-w-sm pt-1">
              <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold">
                <span className="flex items-center gap-1.5 text-white">
                  <span aria-hidden>{stats.rank.emoji}</span> Level {stats.level}
                </span>
                <span className="text-[var(--dim)] tabular">
                  {stats.xp.toLocaleString()}
                  {stats.nextRank ? ` / ${stats.nextRank.xp.toLocaleString()}` : ''} XP
                </span>
              </div>
              <Progress value={stats.levelProgress} height={8} />
            </div>
          </div>

          {/* Daily goal ring */}
          <Tappable
            onClick={() => setActiveTab('library')}
            className="card card-hover flex items-center gap-4 self-start bg-black/45 p-4 text-left backdrop-blur-md md:self-auto"
            data-accent="cyan"
          >
            <Ring value={goalPct} size={78} stroke={7}>
              <div className="text-center leading-none">
                <div className="font-display text-lg font-bold text-white tabular">{stats.todayCount}</div>
                <div className="text-[9px] font-bold text-[var(--dim)]">of {stats.dailyGoal}</div>
              </div>
            </Ring>
            <div>
              <div className="eyebrow">Today's goal</div>
              <div className="font-display mt-1 text-sm font-bold text-white">
                {goalPct >= 1 ? 'Goal smashed \u{1F389}' : `${stats.dailyGoal - stats.todayCount} to go`}
              </div>
              <div className="mt-1 text-[11px] text-[var(--muted)]">
                Readiness <strong className="text-[var(--a)] tabular">{stats.readiness}%</strong>
              </div>
            </div>
          </Tappable>
        </div>
      </section>

      {/* ---------------- Stats ---------------- */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div data-accent="violet">
          <StatTile
            label="Mastered"
            value={stats.mastered}
            sub={`of ${stats.total} questions`}
            icon={<Target className="h-3.5 w-3.5" />}
          />
        </div>
        <div data-accent="fuchsia">
          <StatTile
            label="Total XP"
            value={stats.xp.toLocaleString()}
            sub={`${Math.round((stats.xp / stats.totalXp) * 100)}% of all XP`}
            icon={<Sparkles className="h-3.5 w-3.5" />}
          />
        </div>
        <div data-accent="amber">
          <StatTile
            label="Bugs squashed"
            value={stats.defectsSolved}
            sub="spot-the-defect"
            icon={<Bug className="h-3.5 w-3.5" />}
          />
        </div>
        <div data-accent="emerald">
          <StatTile
            label="Badges"
            value={`${unlocked.length}/${achievements.length}`}
            sub={unlocked.at(-1)?.achievement.name ?? 'none yet'}
            icon={<Trophy className="h-3.5 w-3.5" />}
          />
        </div>
      </section>

      {/* ---------------- Quick actions ---------------- */}
      <section>
        <SectionHeader title="Jump back in" hint="Pick a mode and go" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Tappable
                key={a.id}
                data-accent={a.accent}
                onClick={() => {
                  if (a.id === 'library') setSelectedCategory(null);
                  setActiveTab(a.id);
                }}
                className="card card-hover group relative flex h-32 flex-col justify-between overflow-hidden p-4 text-left"
              >
                <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-[var(--a-glow)] opacity-40 blur-2xl transition-opacity group-hover:opacity-80" />
                <div className="relative grid h-10 w-10 place-items-center rounded-xl border border-[var(--a-line)] bg-[var(--a-soft)] text-[var(--a)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="relative">
                  <h4 className="font-display text-sm font-bold text-white">{a.label}</h4>
                  <p className="mt-0.5 text-[11px] text-[var(--muted)]">{a.sub}</p>
                </div>
              </Tappable>
            );
          })}
        </div>
      </section>

      {/* ---------------- Tracks ---------------- */}
      <section>
        <SectionHeader title="Study tracks" hint="Curated paths that cut across domains" />
        <div className="no-scrollbar edge-fade -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {TRACKS.map((t) => {
            const qs = getTrackQuestions(t);
            const done = qs.filter((q) => state.completedQuestions.includes(q.id)).length;
            return (
              <Tappable
                key={t.id}
                data-accent={t.accent}
                onClick={() => openTrack(t.id)}
                className="card card-hover w-[248px] shrink-0 p-4 text-left"
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl leading-none" aria-hidden>
                    {t.emoji}
                  </span>
                  <span className="rounded-full bg-[var(--a-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--a)] tabular">
                    {done}/{qs.length}
                  </span>
                </div>
                <h4 className="font-display mt-3 text-sm font-bold text-white">{t.name}</h4>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[var(--muted)]">{t.tagline}</p>
                <div className="mt-3">
                  <Progress value={qs.length ? done / qs.length : 0} height={5} />
                </div>
              </Tappable>
            );
          })}
        </div>
      </section>

      {/* ---------------- Domains ---------------- */}
      <section>
        <SectionHeader
          title="Knowledge domains"
          hint="Tap to filter the library"
          action={
            <Tappable
              onClick={() => {
                setSelectedCategory(null);
                setSelectedTrack(null);
                setActiveTab('library');
              }}
              className="flex items-center gap-1 text-[11px] font-bold text-[var(--muted)] hover:text-white"
            >
              See all <ChevronRight className="h-3.5 w-3.5" />
            </Tappable>
          }
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat, i) => {
            const Icon = iconFor(cat.icon);
            const p = categoryProgress(cat.id);
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <Tappable
                  data-accent={cat.accent}
                  onClick={() => openCategory(cat.id)}
                  className="card card-hover group flex h-full w-full flex-col gap-3 p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--a-line)] bg-[var(--a-soft)] text-[var(--a)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg leading-none font-bold text-white tabular">
                        {p.done}
                        <span className="text-sm text-[var(--dim)]">/{p.total}</span>
                      </div>
                      <div className="eyebrow mt-1">done</div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h4 className="font-display flex items-center gap-1.5 text-sm font-bold text-white">
                      <span aria-hidden>{cat.emoji}</span>
                      {cat.name}
                    </h4>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[var(--muted)]">
                      {cat.description}
                    </p>
                  </div>

                  <div>
                    <Progress value={p.total ? p.done / p.total : 0} height={5} />
                    <div className="mt-2 flex items-center justify-between text-[10px] font-bold">
                      <span className="text-[var(--dim)]">{p.pct}% complete</span>
                      <ArrowRight className="h-3.5 w-3.5 text-[var(--a)] transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Tappable>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ---------------- Badges ---------------- */}
      <section>
        <SectionHeader title="Badges" hint={`${unlocked.length} of ${achievements.length} unlocked`} />
        <div className="no-scrollbar edge-fade -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {achievements.map(({ achievement, unlocked: got }) => (
            <div
              key={achievement.id}
              title={achievement.description}
              className={`card w-[132px] shrink-0 p-3 text-center transition-opacity ${
                got ? '' : 'opacity-40 grayscale'
              }`}
              data-accent="lime"
            >
              <div className={`text-2xl ${got ? 'float' : ''}`} aria-hidden>
                {achievement.emoji}
              </div>
              <div className="font-display mt-1.5 text-[11px] leading-tight font-bold text-white">
                {achievement.name}
              </div>
              <div className="mt-1 text-[9.5px] leading-tight text-[var(--dim)]">
                {achievement.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Tip ---------------- */}
      <section className="card flex gap-3 p-4" data-accent="amber">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--a-line)] bg-[var(--a-soft)] text-[var(--a)]">
          <Lightbulb className="h-4 w-4" />
        </div>
        <div>
          <div className="eyebrow">Interviewer tip of the day</div>
          <p className="mt-1 text-[13px] leading-relaxed font-medium text-[var(--text)]">{tip}</p>
        </div>
      </section>
    </div>
  );
};
