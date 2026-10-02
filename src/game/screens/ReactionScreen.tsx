import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Building2 } from 'lucide-react';
import type { GameState, ReactionBucket } from '../types';
import { getCompany } from '../data/companies';
import { CURRENT_EMPLOYER, SACHIN } from '../data/cast';
import { PASS_MARK, ROUND_LENGTH, correctCount, isCorrect, reactionBucket } from '../engine';
import { Avatar, Btn, CompanyMark, Typewriter } from '../kit';
import type { GameActions } from '../useGame';

/** The college group chat always has an opinion. */
const REPLIES: Record<ReactionBucket, { from: string; text: string }[]> = {
  great: [
    { from: 'Aman', text: 'party kab hai?? \u{1F973}' },
    { from: 'Neha', text: 'told you, topper \u{1F525}' },
  ],
  meh: [
    { from: 'Aman', text: 'chill bro, it’ll work out' },
    { from: 'Neha', text: 'manifesting for you \u{1F91E}' },
  ],
  bad: [
    { from: 'Aman', text: 'F in the chat \u{1FAE1}' },
    { from: 'Neha', text: 'their loss. next one is yours \u{1F4AA}' },
  ],
};

const MOOD_COLOR: Record<ReactionBucket, string> = { great: '#34d399', meh: '#fbbf24', bad: '#fb7185' };

export const ReactionScreen: React.FC<{ game: GameState; actions: GameActions }> = ({ game, actions }) => {
  const company = game.active!;
  const co = getCompany(company);
  const run = game.runs[company]!;
  const correct = correctCount(run);
  const bucket = reactionBucket(correct);
  const r = co.reactions[bucket];

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-10 md:p-7" data-accent={co.accent}>
      <div className="flex items-center gap-2.5">
        <CompanyMark id={company} size={30} />
        <div>
          <div className="eyebrow">Right after the interview</div>
          <div className="text-[13px] font-bold text-white">
            {co.name} · {co.kind}
          </div>
        </div>
      </div>

      {/* Sachin's reaction */}
      <section className="card card-accent relative overflow-hidden p-5 md:p-7">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[var(--a-glow)] blur-3xl" />
        <div className="relative flex flex-col items-center text-center">
          <div className="relative">
            <Avatar emoji={SACHIN.avatar} size={88} ring={`${MOOD_COLOR[bucket]}99`} />
            <motion.span
              className="absolute -right-2 -bottom-1 grid h-10 w-10 place-items-center rounded-full bg-[var(--bg)] text-2xl"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 16, delay: 0.25 }}
              aria-hidden
            >
              {r.mood}
            </motion.span>
          </div>
          <h2 className="font-display mt-4 text-2xl font-bold text-white md:text-3xl">{r.headline}</h2>
          <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[var(--muted)] italic">
            “<Typewriter text={r.thought} speed={14} />”
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Score */}
        <section className="card p-4">
          <div className="eyebrow">The scoreboard</div>
          <div className="mt-2 flex items-end gap-2">
            <span className="font-display text-4xl leading-none font-black text-white tabular">{correct}</span>
            <span className="pb-0.5 text-sm text-[var(--dim)]">/ {ROUND_LENGTH} correct</span>
          </div>
          <div className="mt-3 grid grid-cols-10 gap-1" aria-hidden>
            {run.answers.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full ${isCorrect(run, i) ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            ))}
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-[var(--muted)]">
            The offer line is {PASS_MARK}/{ROUND_LENGTH}. HR will email the verdict once Sachin is back at his desk.
          </p>
          <div className="eyebrow mt-4">Company vibe</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {co.vibe.map((v) => (
              <span
                key={v}
                className="rounded-full border border-[var(--a-line)] bg-[var(--a-soft)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--a)]"
              >
                {v}
              </span>
            ))}
          </div>
        </section>

        {/* Group chat */}
        <section className="card overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-white/[0.07] bg-white/[0.03] px-4 py-2.5">
            <span className="text-lg" aria-hidden>
              🎓
            </span>
            <div>
              <div className="text-[12.5px] font-bold text-white">College Gang</div>
              <div className="text-[10px] text-[var(--dim)]">Aman, Neha, Sachin + 9 others</div>
            </div>
          </div>
          <div className="space-y-2 p-4">
            <motion.div
              className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-700/80 px-3 py-2 text-[12.5px] text-white"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {r.text}
              <div className="mt-0.5 text-right text-[9px] text-white/70">now ✓✓</div>
            </motion.div>
            {REPLIES[bucket].map((m, i) => (
              <motion.div
                key={m.from}
                className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white/[0.07] px-3 py-2 text-[12.5px] text-[var(--text)]"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + i * 0.7 }}
              >
                <div className="text-[10px] font-bold text-sky-300">{m.from}</div>
                {m.text}
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      <section className="card flex flex-col items-center gap-3 p-4 text-center sm:flex-row sm:text-left">
        <Building2 className="h-8 w-8 shrink-0 text-amber-300" />
        <div className="flex-1">
          <div className="text-[13px] font-bold text-white">Meanwhile, back at the office</div>
          <p className="text-[12px] text-[var(--muted)]">
            Sachin still has a day job at {CURRENT_EMPLOYER} — and something is brewing.
          </p>
        </div>
        <Btn onClick={actions.finishReaction} className="w-full sm:w-auto">
          Head back to the office <ArrowRight className="h-4 w-4" />
        </Btn>
      </section>
    </div>
  );
};
