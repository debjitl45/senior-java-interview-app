import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Lock, PhoneCall, Vote, X } from 'lucide-react';
import type { GameState, InterviewRun, LifelineKind, McqQuestion } from '../types';
import { getCompany } from '../data/companies';
import { getQuestion } from '../data/questions';
import { CAST } from '../data/cast';
import {
  LETTERS,
  PASS_MARK,
  ROUND_LENGTH,
  TIERS,
  askSenior,
  correctCount,
  fiftyFifty,
  isCorrect,
  linkedInPoll,
  packageFor,
  sample,
  seniorLine,
} from '../engine';
import { Avatar, Btn, CompanyMark, Typewriter, useCountdown, useHotkeys } from '../kit';
import type { GameActions } from '../useGame';
import { Ring, celebrate } from '../../components/ui';

type Stage = 'answering' | 'locked' | 'revealed';
type OptionState = 'idle' | 'selected' | 'locked' | 'correct' | 'wrong' | 'removed' | 'dim';

/** How long the "computer ji" suspense lasts between locking and the reveal. */
const SUSPENSE_MS = 1600;

/* ------------------------------------------------------------------ *
 * Package ladder — climbs one rung per correct answer
 * ------------------------------------------------------------------ */

const Ladder: React.FC<{ ladder: string[]; correct: number; maxPossible: number }> = ({ ladder, correct, maxPossible }) => (
  <ol className="space-y-1" aria-label="Package ladder">
    {ladder
      .map((pkg, i) => ({ pkg, rung: i + 1 }))
      .reverse()
      .map(({ pkg, rung }) => {
        const won = rung <= correct;
        const next = rung === correct + 1 && rung <= maxPossible;
        const out = rung > maxPossible;
        return (
          <li key={rung}>
            <div
              className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1 text-[11.5px] font-bold tabular transition-colors ${
                won
                  ? 'bg-emerald-400/15 text-emerald-200'
                  : next
                    ? 'bg-[var(--kbc-gold)] text-[#1c1300]'
                    : out
                      ? 'text-white/20 line-through'
                      : 'text-[var(--muted)]'
              }`}
            >
              <span className="w-5 opacity-70">{rung}</span>
              <span className="truncate">{pkg}</span>
            </div>
            {rung === PASS_MARK && (
              <div className="my-1 flex items-center gap-2 text-[9px] font-bold tracking-widest text-emerald-300 uppercase">
                <span className="h-px flex-1 bg-emerald-400/40" />▲ offer zone
                <span className="h-px flex-1 bg-emerald-400/40" />
              </div>
            )}
          </li>
        );
      })}
  </ol>
);

const QuestionTrack: React.FC<{ run: InterviewRun; viewIndex: number }> = ({ run, viewIndex }) => (
  <div className="grid grid-cols-10 gap-1" aria-hidden>
    {Array.from({ length: ROUND_LENGTH }, (_, i) => {
      const done = i < run.answers.length;
      const cls = done
        ? isCorrect(run, i)
          ? 'bg-emerald-400'
          : 'bg-rose-400'
        : i === viewIndex
          ? 'bg-[var(--kbc-gold)]'
          : 'bg-white/10';
      return <span key={i} className={`h-1.5 rounded-full ${cls}`} />;
    })}
  </div>
);

/* ------------------------------------------------------------------ *
 * Lifeline result modal (phone-a-senior and the LinkedIn poll)
 * ------------------------------------------------------------------ */

const LifelineModal: React.FC<{
  kind: 'senior' | 'poll';
  q: McqQuestion;
  pick?: number;
  poll?: number[];
  removed: number[];
  onClose: () => void;
}> = ({ kind, q, pick, poll, removed, onClose }) => {
  const reduce = useReducedMotion();
  const [connected, setConnected] = useState(Boolean(reduce));
  const ananya = CAST.ananya;

  useEffect(() => {
    if (connected) return;
    const t = setTimeout(() => setConnected(true), 1100);
    return () => clearTimeout(t);
  }, [connected]);

  return (
    <motion.div
      className="fixed inset-0 z-[90] grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={kind === 'senior' ? 'Phone a senior' : 'LinkedIn poll'}
        initial={{ scale: 0.94, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-sm p-5"
        style={{ background: 'rgba(12, 18, 64, 0.97)', borderColor: 'rgba(252, 211, 77, 0.3)' }}
      >
        {kind === 'senior' ? (
          <div className="text-center">
            <div className={`mx-auto w-fit rounded-full ${connected ? '' : 'pulse-ring'}`} data-accent="emerald">
              <Avatar emoji={ananya.avatar} size={64} ring={`${ananya.color}88`} />
            </div>
            <div className="mt-3 text-[13px] font-bold text-white">{ananya.name}</div>
            <div className="text-[11px] text-[var(--dim)]">{ananya.role}</div>
            <div className="mt-4 min-h-[64px] rounded-2xl border border-white/[0.08] bg-black/30 p-3 text-left text-[13px] leading-relaxed text-[var(--text)]">
              {connected && pick !== undefined ? (
                <Typewriter text={seniorLine(q.tier, pick)} />
              ) : (
                <span className="flex items-center gap-2 text-[var(--muted)]">
                  <PhoneCall className="h-4 w-4 animate-pulse text-emerald-300" /> Ringing...
                </span>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-[13px] font-bold text-white">
              <Vote className="h-4 w-4 text-sky-300" /> LinkedIn poll
            </div>
            <div className="text-[11px] text-[var(--dim)]">1,284 “thought leaders” voted. Humbled to share the results.</div>
            <div className="mt-5 flex h-40 items-end justify-around gap-3">
              {LETTERS.map((l, i) => {
                const v = poll?.[i] ?? 0;
                const gone = removed.includes(i);
                return (
                  <div key={l} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                    <span className="text-[11px] font-bold text-white tabular">{gone ? '—' : `${v}%`}</span>
                    <motion.div
                      className="w-full rounded-t-md"
                      style={{ background: 'linear-gradient(0deg, #0284c7, #7dd3fc)' }}
                      initial={{ height: 0 }}
                      animate={{ height: `${gone ? 0 : Math.max(2, v)}%` }}
                      transition={{ type: 'spring', stiffness: 90, damping: 18, delay: i * 0.08 }}
                    />
                    <span className="text-[12px] font-black text-[var(--kbc-gold)]">{l}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <Btn variant="gold" onClick={onClose} className="mt-5 w-full py-2.5 text-xs" autoFocus>
          Back to the hot seat
        </Btn>
      </motion.div>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ *
 * The round
 * ------------------------------------------------------------------ */

const LIFELINES: { kind: LifelineKind; label: string; hint: string }[] = [
  { kind: 'fifty', label: '50:50', hint: 'Remove two wrong answers' },
  { kind: 'senior', label: 'Phone a senior', hint: 'Call Ananya for advice' },
  { kind: 'poll', label: 'LinkedIn poll', hint: 'Ask the “thought leaders”' },
];

export const InterviewScreen: React.FC<{ game: GameState; actions: GameActions }> = ({ game, actions }) => {
  const company = game.active!;
  const co = getCompany(company);
  const run = game.runs[company]!;
  const answered = run.answers.length;

  const [stage, setStage] = useState<Stage>('answering');
  const [selected, setSelected] = useState<number | null>(null);
  const [revealIndex, setRevealIndex] = useState<number | null>(null);
  const [revealLine, setRevealLine] = useState('');
  const [modal, setModal] = useState<'senior' | 'poll' | null>(null);
  const [shake, setShake] = useState(false);

  const viewIndex = stage === 'revealed' && revealIndex !== null ? revealIndex : answered;
  const finished = answered >= ROUND_LENGTH && stage !== 'revealed';
  const q = finished ? undefined : getQuestion(run.questionIds[viewIndex]);
  const tier = q?.tier ?? 0;
  const seconds = TIERS[tier].seconds;

  const ll = run.lifelines;
  const removed = ll.fifty?.q === viewIndex ? (ll.fifty.removed ?? []) : [];
  const pollHere = ll.poll?.q === viewIndex ? ll.poll.poll : undefined;
  const seniorHere = ll.senior?.q === viewIndex ? ll.senior.pick : undefined;

  const correct = correctCount(run);
  const maxPossible = correct + (ROUND_LENGTH - answered);
  const unlocked = packageFor(company, correct);

  /* ---------------- answer flow ---------------- */

  const commit = (choice: number | null) => {
    if (!q) return;
    const idx = answered;
    const ok = choice === q.answer;
    actions.answer(idx, choice);
    setRevealIndex(idx);
    setRevealLine(choice === null ? co.interviewer.onTimeout : sample(ok ? co.interviewer.onCorrect : co.interviewer.onWrong));
    setStage('revealed');
    if (ok && correct + 1 === PASS_MARK) celebrate('small');
    if (!ok) setShake(true);
  };

  const lock = (choice: number) => {
    setSelected(choice);
    setStage('locked');
  };

  // The suspense beat: locked answers glow for a moment before the reveal.
  useEffect(() => {
    if (stage !== 'locked' || selected === null) return;
    const t = setTimeout(() => commit(selected), SUSPENSE_MS);
    return () => clearTimeout(t);
    // commit is recreated every render; only a change of stage or selection should restart the beat.
  }, [stage, selected]);

  useEffect(() => {
    if (!shake) return;
    const t = setTimeout(() => setShake(false), 500);
    return () => clearTimeout(t);
  }, [shake]);

  const left = useCountdown(seconds, stage === 'answering' && modal === null && !!q, `${company}-${viewIndex}`, () => {
    if (stage !== 'answering') return;
    if (selected !== null) lock(selected);
    else commit(null);
  });

  const next = () => {
    setStage('answering');
    setSelected(null);
    setRevealIndex(null);
    if (answered >= ROUND_LENGTH) actions.finishInterview();
  };

  const select = (i: number) => {
    if (stage !== 'answering' || removed.includes(i)) return;
    setSelected(i);
  };

  const trigger = (kind: LifelineKind) => {
    if (!q || stage !== 'answering' || ll[kind]) return;
    if (kind === 'fifty') {
      const rm = fiftyFifty(q);
      actions.spendLifeline('fifty', { q: viewIndex, removed: rm });
      if (selected !== null && rm.includes(selected)) setSelected(null);
    } else if (kind === 'senior') {
      actions.spendLifeline('senior', { q: viewIndex, pick: askSenior(q, removed) });
      setModal('senior');
    } else {
      actions.spendLifeline('poll', { q: viewIndex, poll: linkedInPoll(q, removed) });
      setModal('poll');
    }
  };

  useHotkeys((e) => {
    if (modal) {
      if (e.key === 'Escape') setModal(null);
      return;
    }
    if (finished) return;
    const target = e.target as HTMLElement | null;
    // Enter on the option you just picked means "lock it", so treat option buttons as non-buttons here.
    const onButton = target?.tagName === 'BUTTON' && !target.classList.contains('kbc-option');
    if (stage === 'revealed') {
      if ((e.key === 'Enter' || e.key === ' ') && !onButton) {
        e.preventDefault();
        next();
      }
      return;
    }
    if (stage !== 'answering') return;
    const k = e.key.toLowerCase();
    const idx = Math.max(['a', 'b', 'c', 'd'].indexOf(k), ['1', '2', '3', '4'].indexOf(k));
    if (idx >= 0) select(idx);
    else if (e.key === 'Enter' && selected !== null && !onButton) {
      e.preventDefault();
      lock(selected);
    } else if (e.key === 'Escape') setSelected(null);
  });

  /* ---------------- render helpers ---------------- */

  const optionState = (i: number): OptionState => {
    if (removed.includes(i)) return 'removed';
    if (stage === 'revealed' && q) {
      if (i === q.answer) return 'correct';
      if (i === run.answers[viewIndex]) return 'wrong';
      return 'dim';
    }
    if (stage === 'locked') return i === selected ? 'locked' : 'dim';
    return i === selected ? 'selected' : 'idle';
  };

  const bubble =
    stage === 'revealed'
      ? revealLine
      : viewIndex === 0
        ? `${co.interviewer.intro} First question — on your screen.`
        : `Question ${viewIndex + 1}. ${co.interviewer.tierLines[tier]}`;

  const chosen = stage === 'revealed' ? run.answers[viewIndex] : undefined;
  const wasRight = !!q && chosen === q.answer;
  const lowTime = seconds !== null && left <= 10;

  return (
    <div className="kbc-stage min-h-full" data-accent={co.accent}>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 p-4 pb-10 md:p-7 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0 space-y-4">
          {/* Header: company, clock and the 10-question track */}
          <div className="card space-y-3 p-3.5">
            <div className="flex items-center gap-3">
              <CompanyMark id={company} size={38} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold text-white">{co.name} · Technical round</div>
                <div className="text-[10.5px] font-semibold text-[var(--kbc-gold)]">Kaun Banega Employee? {'\u{1FA94}'}</div>
              </div>
              {q && seconds !== null ? (
                <div data-accent={lowTime ? 'rose' : 'amber'}>
                  <Ring value={left / seconds} size={52} stroke={5}>
                    <span className={`font-display text-[15px] font-bold tabular ${lowTime ? 'text-rose-300' : 'text-white'}`}>{left}</span>
                  </Ring>
                </div>
              ) : q ? (
                <div className="text-center text-[10px] leading-tight font-bold text-[var(--kbc-gold)]">
                  <div className="text-lg leading-none">∞</div>
                  no clock
                </div>
              ) : null}
            </div>
            <QuestionTrack run={run} viewIndex={viewIndex} />
            <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--muted)] lg:hidden">
              <span>
                Unlocked: <strong className="text-white">{unlocked ?? '—'}</strong>
              </span>
              <span className="tabular">
                {maxPossible < PASS_MARK ? (
                  <span className="text-rose-300">Offer out of reach {'\u{1F62C}'}</span>
                ) : (
                  <>
                    {correct}/{PASS_MARK} for the offer
                  </>
                )}
              </span>
            </div>
          </div>

          {finished ? (
            <div className="card pop-in p-6 text-center">
              <div className="text-5xl" aria-hidden>
                {'\u{1F3AC}'}
              </div>
              <h3 className="font-display mt-3 text-xl font-bold text-white">That’s a wrap!</h3>
              <p className="mt-1 text-[13px] text-[var(--muted)]">
                {correct}/{ROUND_LENGTH} correct at {co.name}. HR will email the result.
              </p>
              <Btn onClick={actions.finishInterview} className="mt-4">
                See how Sachin feels <ArrowRight className="h-4 w-4" />
              </Btn>
            </div>
          ) : !q ? (
            <div className="card p-6 text-center text-[13px] text-[var(--muted)]">
              This question could not be loaded.
              <Btn onClick={actions.finishInterview} className="mx-auto mt-4">
                Skip to the debrief
              </Btn>
            </div>
          ) : (
            <>
              {/* Interviewer */}
              <div className="flex items-start gap-3">
                <Avatar emoji={co.interviewer.avatar} size={44} ring="rgba(245,197,66,0.45)" />
                <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-white/[0.08] bg-black/35 px-3.5 py-2.5">
                  <div className="truncate text-[11px] font-bold text-[var(--kbc-gold)]">
                    {co.interviewer.name} <span className="font-semibold text-[var(--dim)]">· {co.interviewer.title}</span>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--text)]">
                    <Typewriter key={bubble} text={bubble} speed={12} />
                  </p>
                </div>
              </div>

              {/* Lifelines */}
              <div className="flex items-start justify-center gap-5">
                {LIFELINES.map((l) => {
                  const used = !!ll[l.kind];
                  return (
                    <button
                      key={l.kind}
                      onClick={() => trigger(l.kind)}
                      disabled={used || stage !== 'answering'}
                      title={used ? `${l.label} — used` : l.hint}
                      aria-label={used ? `${l.label}, already used` : `${l.label}: ${l.hint}`}
                      className="group flex w-16 flex-col items-center gap-1 disabled:cursor-not-allowed"
                    >
                      <span
                        className={`relative grid h-12 w-12 place-items-center rounded-full border-2 transition-colors ${
                          used
                            ? 'border-white/10 text-white/25'
                            : 'border-[var(--kbc-gold)] bg-[#0c1446] text-[var(--kbc-gold)] group-hover:bg-[#18237a] group-disabled:opacity-50'
                        }`}
                      >
                        {l.kind === 'fifty' ? (
                          <span className="font-mono text-[11px] font-black">50:50</span>
                        ) : l.kind === 'senior' ? (
                          <PhoneCall className="h-4.5 w-4.5" />
                        ) : (
                          <Vote className="h-4.5 w-4.5" />
                        )}
                        {used && <X className="absolute h-11 w-11 text-rose-500/80" strokeWidth={2.5} />}
                      </span>
                      <span className="text-center text-[9.5px] leading-tight font-bold text-[var(--dim)]">{l.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Question */}
              <div className={shake ? 'shake' : ''}>
                <div className="hex hex-frame">
                  <div className="hex hex-fill px-9 py-4 text-center md:px-12 md:py-5">
                    <div className="text-[10px] font-bold tracking-[0.14em] text-[var(--kbc-gold)] uppercase">
                      Question {viewIndex + 1} · {TIERS[tier].label}
                    </div>
                    <p className="mt-1.5 text-[15px] leading-snug font-semibold text-white md:text-[17px]">{q.q}</p>
                  </div>
                </div>
                {q.code && (
                  <pre className="code-block mt-2.5 p-3.5 text-left text-[var(--text)]">
                    <code>{q.code}</code>
                  </pre>
                )}
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-x-4">
                {q.options.map((text, i) => {
                  const state = optionState(i);
                  return (
                    <div key={i} className="kbc-rail">
                      <button
                        className="kbc-option"
                        data-state={state}
                        disabled={stage !== 'answering' || state === 'removed'}
                        onClick={() => select(i)}
                        aria-pressed={selected === i}
                        aria-label={`Option ${LETTERS[i]}: ${state === 'removed' ? 'removed by 50:50' : text}`}
                      >
                        <div className="hex hex-frame">
                          <div className="hex hex-fill flex min-h-[54px] items-center gap-2 px-7 py-2.5 text-[13px] font-semibold text-white md:text-[13.5px]">
                            <span className="font-black text-[var(--kbc-gold)]">{LETTERS[i]}:</span>
                            <span className="flex-1 leading-snug">{state === 'removed' ? '' : text}</span>
                            {pollHere && state !== 'removed' && (
                              <span className="shrink-0 rounded-md bg-sky-400/15 px-1.5 py-0.5 text-[10px] font-bold text-sky-200 tabular">
                                {pollHere[i]}%
                              </span>
                            )}
                            {seniorHere === i && (
                              <span className="shrink-0 rounded-md bg-emerald-400/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-200">
                                Ananya
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Lock / suspense / reveal — enter-only, so a panel never waits on another's exit */}
              {stage === 'answering' && selected !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] p-3"
                >
                  <p className="text-[13px] font-semibold text-amber-100">
                    “Computer ji, option {LETTERS[selected]} — lock kiya jaaye?”
                  </p>
                  <div className="flex gap-2">
                    <Btn variant="ghost" onClick={() => setSelected(null)} className="px-4 py-2 text-xs">
                      Change
                    </Btn>
                    <Btn variant="gold" onClick={() => lock(selected)} className="px-4 py-2 text-xs">
                      <Lock className="h-3.5 w-3.5" /> Lock it
                    </Btn>
                  </div>
                </motion.div>
              )}

              {stage === 'locked' && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-[13px] font-semibold text-amber-200"
                >
                  {'\u{1F941}'} Locked. The computer is thinking...
                </motion.p>
              )}

              {stage === 'revealed' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border p-4 ${
                    wasRight ? 'border-emerald-400/30 bg-emerald-400/[0.07]' : 'border-rose-400/30 bg-rose-400/[0.07]'
                  }`}
                >
                  <div className={`font-display text-lg font-bold ${wasRight ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {wasRight ? '✅ Sahi jawab!' : chosen === null ? '⏱️ Time’s up!' : '❌ Galat jawab'}
                  </div>
                  {!wasRight && (
                    <div className="mt-0.5 text-[12px] text-[var(--muted)]">
                      Correct answer:{' '}
                      <strong className="text-white">
                        {LETTERS[q.answer]}: {q.options[q.answer]}
                      </strong>
                    </div>
                  )}
                  <p className="mt-2 text-[13px] leading-relaxed text-[var(--text)]">
                    <span className="font-bold text-[var(--kbc-gold)]">Why: </span>
                    {q.why}
                  </p>
                  {wasRight && correct === PASS_MARK && (
                    <div className="mt-2 text-[12px] font-bold text-emerald-300">
                      {'\u{1F3AF}'} Offer line crossed — {PASS_MARK} correct!
                    </div>
                  )}
                  <Btn onClick={next} className="mt-3 w-full">
                    {answered >= ROUND_LENGTH ? 'Finish the interview' : 'Next question'} <ArrowRight className="h-4 w-4" />
                  </Btn>
                </motion.div>
              )}

              {stage === 'answering' && selected === null && (
                <p className="text-center text-[11px] text-[var(--dim)]">
                  Tap an answer{seconds === null ? '' : ' before the clock runs out'} · keys A–D, Enter to lock
                </p>
              )}
            </>
          )}
        </div>

        {/* Ladder */}
        <aside className="hidden lg:block">
          <div className="card sticky top-4 p-3">
            <div className="eyebrow mb-2 text-center">Package ladder</div>
            <Ladder ladder={co.ladder} correct={correct} maxPossible={maxPossible} />
            <div className="mt-3 border-t border-white/[0.07] pt-2.5 text-center text-[11px] text-[var(--muted)]">
              Unlocked: <strong className="text-white">{unlocked ?? '—'}</strong>
              {maxPossible < PASS_MARK && <div className="mt-1 font-bold text-rose-300">Offer out of reach {'\u{1F62C}'}</div>}
            </div>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {modal && q && (
          <LifelineModal
            kind={modal}
            q={q}
            pick={seniorHere}
            poll={pollHere}
            removed={removed}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
