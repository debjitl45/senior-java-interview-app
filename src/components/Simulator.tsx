import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Clock,
  History,
  Mic,
  Play,
  RotateCcw,
  Timer,
  Volume2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { QUESTIONS, getCategoryById, type Question } from '../data/questions';
import {
  Badge,
  CodeBlock,
  DifficultyTag,
  Markdown,
  Progress,
  Ring,
  SectionHeader,
  Tappable,
  celebrate,
} from './ui';

type Screen = 'setup' | 'active' | 'review' | 'scorecard';

interface Preset {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  count: number;
  categories: string[];
  accent: string;
}

const PRESETS: Preset[] = [
  {
    id: 'warmup',
    name: 'Quick warm-up',
    emoji: '⚡',
    desc: 'Four fundamentals to shake the rust off before a real call.',
    count: 4,
    categories: ['collections', 'streams', 'modern'],
    accent: 'cyan',
  },
  {
    id: 'jvm-deep',
    name: 'JVM deep dive',
    emoji: '\u{1F9E0}',
    desc: 'Memory model, GC, JIT and the profiling questions that follow them.',
    count: 8,
    categories: ['jvm', 'concurrency', 'profiling'],
    accent: 'violet',
  },
  {
    id: 'spring-round',
    name: 'Spring & data round',
    emoji: '\u{1F343}',
    desc: 'Proxies, transactions, JPA and the persistence traps behind them.',
    count: 7,
    categories: ['spring', 'persistence'],
    accent: 'emerald',
  },
  {
    id: 'design',
    name: 'System design',
    emoji: '\u{1F5FA}️',
    desc: 'Distributed systems, consistency, resilience and scale.',
    count: 6,
    categories: ['architecture'],
    accent: 'indigo',
  },
  {
    id: 'full-loop',
    name: 'The full loop',
    emoji: '\u{1F3AF}',
    desc: 'Ten questions drawn from every domain. Breadth and depth, no mercy.',
    count: 10,
    categories: [],
    accent: 'fuchsia',
  },
];

const RUBRIC = [
  'I covered the core mechanism, not just the name of it',
  'I named the trade-offs and failure modes',
  'I gave a concrete example, number or code shape',
];

const TIME_OPTIONS = [180, 300, 480];

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export const Simulator: React.FC = () => {
  const { state, stats, saveInterview } = useApp();

  const [screen, setScreen] = useState<Screen>('setup');
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [perQuestion, setPerQuestion] = useState(300);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [notes, setNotes] = useState('');
  const [scores, setScores] = useState<number[]>([]);
  const [checks, setChecks] = useState([false, false, false]);

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const preset = useMemo(() => PRESETS.find((p) => p.id === presetId) ?? PRESETS[0], [presetId]);
  const current = questions[index];

  const speak = useCallback(
    (text: string) => {
      if (!state.voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1;
      window.speechSynthesis.speak(u);
    },
    [state.voiceEnabled],
  );

  const stopTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  useEffect(() => {
    if (screen !== 'active') {
      stopTimer();
      return;
    }
    timer.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          stopTimer();
          setScreen('review');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  }, [screen, index]);

  useEffect(() => () => stopTimer(), []);

  const start = () => {
    const pool = preset.categories.length
      ? QUESTIONS.filter((q) => preset.categories.includes(q.categoryId))
      : [...QUESTIONS];

    const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, preset.count);

    setQuestions(picked);
    setIndex(0);
    setTimeLeft(perQuestion);
    setNotes('');
    setScores([]);
    setChecks([false, false, false]);
    setScreen('active');
    if (picked[0]) speak(picked[0].question);
  };

  const submitAnswer = () => {
    stopTimer();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setScreen('review');
  };

  const nextQuestion = () => {
    const earned = checks.filter(Boolean).length;
    const updated = [...scores, earned];
    setScores(updated);
    setChecks([false, false, false]);
    setNotes('');

    if (index + 1 >= questions.length) {
      const total = updated.reduce((a, b) => a + b, 0);
      const pct = Math.round((total / (questions.length * 3)) * 100);
      saveInterview({ score: pct, preset: preset.name, totalQuestions: questions.length });
      if (pct >= 70) celebrate('big');
      setScreen('scorecard');
      return;
    }

    const nextIdx = index + 1;
    setIndex(nextIdx);
    setTimeLeft(perQuestion);
    setScreen('active');
    speak(questions[nextIdx].question);
  };

  const finalPct = scores.length
    ? Math.round((scores.reduce((a, b) => a + b, 0) / (scores.length * 3)) * 100)
    : 0;

  /* ------------------------------------------------------------ setup */
  if (screen === 'setup') {
    return (
      <div className="fade-in mx-auto max-w-4xl space-y-6 p-4 pb-10 md:p-7">
        <div>
          <h2 className="font-display flex items-center gap-2 text-2xl font-bold text-white md:text-3xl">
            <Mic className="h-6 w-6 text-fuchsia-400" /> Mock interview
          </h2>
          <p className="mt-1 max-w-xl text-xs text-[var(--muted)] md:text-sm">
            One question at a time, on a clock, with a scratchpad. Answer out loud like it is the real
            thing, then score yourself honestly against the rubric.
          </p>
        </div>

        <section>
          <SectionHeader title="Pick your round" />
          <div className="grid gap-3 sm:grid-cols-2">
            {PRESETS.map((p) => {
              const active = p.id === presetId;
              return (
                <Tappable
                  key={p.id}
                  data-accent={p.accent}
                  onClick={() => setPresetId(p.id)}
                  className={`card p-4 text-left transition-colors ${
                    active ? 'card-accent glow' : 'card-hover'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-2xl leading-none" aria-hidden>
                      {p.emoji}
                    </span>
                    <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)] tabular">
                      {p.count} Q
                    </span>
                  </div>
                  <h4 className="font-display mt-2.5 text-sm font-bold text-white">{p.name}</h4>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--muted)]">{p.desc}</p>
                </Tappable>
              );
            })}
          </div>
        </section>

        <section>
          <SectionHeader title="Time per question" hint="Real rounds give you 5 to 8 minutes" />
          <div className="flex gap-2">
            {TIME_OPTIONS.map((t) => (
              <Tappable
                key={t}
                onClick={() => setPerQuestion(t)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl border py-3 text-xs font-bold transition-colors ${
                  perQuestion === t
                    ? 'border-[var(--brand-2)]/45 bg-fuchsia-500/10 text-fuchsia-200'
                    : 'border-white/[0.09] bg-white/[0.04] text-[var(--muted)]'
                }`}
              >
                <Clock className="h-4 w-4" /> {t / 60} min
              </Tappable>
            ))}
          </div>
        </section>

        <Tappable
          onClick={start}
          className="bg-brand flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/20"
        >
          <Play className="h-4.5 w-4.5" /> Start the round
        </Tappable>

        {state.interviewHistory.length > 0 && (
          <section>
            <SectionHeader
              title="Past rounds"
              hint={`Average ${Math.round(
                state.interviewHistory.reduce((a, r) => a + r.score, 0) / state.interviewHistory.length,
              )}%`}
            />
            <div className="space-y-2">
              {state.interviewHistory.slice(0, 6).map((r) => (
                <div key={r.id} className="card flex items-center justify-between gap-3 p-3.5">
                  <div className="flex items-center gap-3">
                    <History className="h-4 w-4 text-[var(--dim)]" />
                    <div>
                      <div className="text-[13px] font-bold text-white">{r.preset}</div>
                      <div className="text-[11px] text-[var(--dim)]">
                        {r.date} · {r.totalQuestions} questions
                      </div>
                    </div>
                  </div>
                  <span
                    className="font-display rounded-xl px-2.5 py-1 text-sm font-bold tabular"
                    style={{
                      color: r.score >= 70 ? '#34d399' : r.score >= 45 ? '#fbbf24' : '#fb7185',
                      background: r.score >= 70 ? '#34d3991a' : r.score >= 45 ? '#fbbf241a' : '#fb71851a',
                    }}
                  >
                    {r.score}%
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  /* ------------------------------------------------------------ active */
  if (screen === 'active' && current) {
    const cat = getCategoryById(current.categoryId);
    const frac = timeLeft / perQuestion;
    const low = timeLeft <= 30;

    return (
      <div
        className="fade-in mx-auto flex h-full max-w-3xl flex-col gap-4 p-4 pb-6 md:p-7"
        data-accent={low ? 'rose' : (cat?.accent ?? 'fuchsia')}
      >
        {/* Timer bar */}
        <div className="card flex items-center gap-4 p-4">
          <Ring value={frac} size={60} stroke={5}>
            <span className={`font-display text-[13px] font-bold tabular ${low ? 'text-rose-400' : 'text-white'}`}>
              {fmt(timeLeft)}
            </span>
          </Ring>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-[var(--muted)] tabular">
                Question {index + 1} of {questions.length}
              </span>
              <span className="text-[var(--dim)]">{preset.name}</span>
            </div>
            <div className="mt-2">
              <Progress value={(index + (1 - frac)) / questions.length} height={5} />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="card flex-1 space-y-3 overflow-y-auto p-4 md:p-5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge>
              <span aria-hidden>{cat?.emoji}</span> {cat?.shortName}
            </Badge>
            <DifficultyTag difficulty={current.difficulty} />
            {state.voiceEnabled && (
              <Tappable
                onClick={() => speak(current.question)}
                className="ml-auto rounded-lg p-1.5 text-[var(--dim)] hover:text-white"
                title="Read the question aloud"
              >
                <Volume2 className="h-4 w-4" />
              </Tappable>
            )}
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-black/25 p-3">
            <div className="eyebrow mb-1">The situation</div>
            <p className="text-[12.5px] leading-relaxed text-[var(--muted)]">{current.scenario}</p>
          </div>

          <p className="text-[15px] leading-relaxed font-semibold text-white">{current.question}</p>

          <div>
            <div className="eyebrow mb-1.5">Scratchpad — jot your structure before you speak</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              placeholder={'1. define the constraint\n2. the mechanism\n3. trade-offs\n4. what I would actually do'}
              className="w-full resize-none rounded-2xl border border-white/[0.09] bg-black/30 p-3 font-mono text-[12px] leading-relaxed text-white placeholder-[var(--dim)] outline-none focus:border-[var(--a)]"
            />
          </div>
        </div>

        <Tappable
          onClick={submitAnswer}
          className="bg-brand flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white"
        >
          I'm done — show the model answer <ArrowRight className="h-4 w-4" />
        </Tappable>
      </div>
    );
  }

  /* ------------------------------------------------------------ review */
  if (screen === 'review' && current) {
    const cat = getCategoryById(current.categoryId);
    return (
      <div
        className="fade-in mx-auto max-w-3xl space-y-4 p-4 pb-10 md:p-7"
        data-accent={cat?.accent ?? 'fuchsia'}
      >
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-[var(--dim)]" />
          <span className="text-[11px] font-bold text-[var(--dim)]">
            Question {index + 1} of {questions.length} · self-assessment
          </span>
        </div>

        <h3 className="font-display text-lg leading-snug font-bold text-white md:text-xl">{current.title}</h3>

        {notes.trim() && (
          <div className="card p-4">
            <div className="eyebrow mb-1.5">What you wrote</div>
            <pre className="font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-[var(--muted)]">
              {notes}
            </pre>
          </div>
        )}

        <div className="card p-4 md:p-5">
          <div className="eyebrow mb-2">The model answer</div>
          <Markdown text={current.idealAnswer} />
          {current.codeSnippet && (
            <div className="mt-3">
              <CodeBlock code={current.codeSnippet} label="java" />
            </div>
          )}
        </div>

        <div className="card card-accent p-4">
          <div className="eyebrow mb-3">Score yourself — be honest, it only helps you</div>
          <div className="space-y-2">
            {RUBRIC.map((r, i) => (
              <Tappable
                key={i}
                onClick={() => setChecks((c) => c.map((v, j) => (j === i ? !v : v)))}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left text-[12.5px] font-medium transition-colors ${
                  checks[i]
                    ? 'border-emerald-400/40 bg-emerald-400/10 text-white'
                    : 'border-white/[0.09] bg-white/[0.03] text-[var(--muted)]'
                }`}
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                    checks[i] ? 'border-emerald-400 bg-emerald-400 text-black' : 'border-white/20'
                  }`}
                >
                  {checks[i] && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                {r}
              </Tappable>
            ))}
          </div>
        </div>

        <Tappable
          onClick={nextQuestion}
          className="bg-brand flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white"
        >
          {index + 1 >= questions.length ? 'Finish and see my scorecard' : 'Next question'}
          <ArrowRight className="h-4 w-4" />
        </Tappable>
      </div>
    );
  }

  /* ------------------------------------------------------------ scorecard */
  const verdict =
    finalPct >= 80
      ? { title: 'Interview ready', emoji: '\u{1F451}', note: 'That is a hire signal. Keep the streak going.' }
      : finalPct >= 55
        ? { title: 'Nearly there', emoji: '\u{1F4AA}', note: 'Solid core. Tighten the trade-off framing and you are set.' }
        : { title: 'Keep grinding', emoji: '\u{1F331}', note: 'Go back to the library for these domains and try again tomorrow.' };

  return (
    <div className="fade-in mx-auto max-w-2xl space-y-5 p-4 pb-10 md:p-7" data-accent="fuchsia">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card ring-brand relative overflow-hidden p-6 text-center"
        >
          <div className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="relative">
            <div className="text-5xl" aria-hidden>
              {verdict.emoji}
            </div>
            <div className="font-display text-brand mt-3 text-6xl leading-none font-black tabular">
              {finalPct}%
            </div>
            <h3 className="font-display mt-2 text-lg font-bold text-white">{verdict.title}</h3>
            <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-[var(--muted)]">{verdict.note}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="card p-4">
        <div className="eyebrow mb-3">Per question</div>
        <div className="space-y-2.5">
          {questions.map((q, i) => {
            const s = scores[i] ?? 0;
            return (
              <div key={q.id} className="flex items-center gap-3">
                <span className="w-6 shrink-0 font-mono text-[11px] text-[var(--dim)] tabular">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--muted)]">{q.title}</span>
                <div className="flex gap-1">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className={`h-2 w-6 rounded-full ${d < s ? 'bg-emerald-400' : 'bg-white/10'}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-4 text-center">
        <div className="eyebrow">Overall readiness</div>
        <div className="font-display mt-1 text-2xl font-bold text-white tabular">{stats.readiness}%</div>
        <p className="mt-1 text-[11.5px] text-[var(--muted)]">
          Blended from questions mastered, recall ratings and mock scores.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Tappable
          onClick={() => setScreen('setup')}
          className="flex items-center justify-center gap-1.5 rounded-2xl border border-white/[0.09] bg-white/[0.04] py-3 text-xs font-bold text-[var(--muted)] hover:text-white"
        >
          <RotateCcw className="h-4 w-4" /> New round
        </Tappable>
        <Tappable onClick={start} className="bg-brand rounded-2xl py-3 text-xs font-bold text-white">
          Run it back
        </Tappable>
      </div>
    </div>
  );
};
