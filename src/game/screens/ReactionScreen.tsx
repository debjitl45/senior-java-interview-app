import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { GameState, ReactionBucket } from '../types';
import { getCompany, KIND_LABEL } from '../data/companies';
import { SACHIN } from '../data/cast';
import { PASS_MARK, ROUND_LENGTH, impressionFace, reactionBucket } from '../engine';
import { Avatar, Btn, CompanyMark, DeltaChips, Typewriter } from '../kit';
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
  const record = game.lastInterview === null ? undefined : game.history.interviews[game.lastInterview];

  if (!record) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <p className="text-[13px] text-[var(--muted)]">That interview is behind Sachin now.</p>
        <Btn onClick={actions.leaveReaction} className="mx-auto mt-4">
          Back to the week <ArrowRight className="h-4 w-4" />
        </Btn>
      </div>
    );
  }

  const co = getCompany(record.company);
  const bucket = reactionBucket(record.correct);
  const r = co.reactions[bucket];
  const above = record.correct >= PASS_MARK;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-10 md:p-7" data-accent={co.accent}>
      <div className="flex items-center gap-2.5">
        <CompanyMark id={co.id} size={30} />
        <div>
          <div className="eyebrow">Right after the interview</div>
          <div className="text-[13px] font-bold text-white">
            {co.name} · {KIND_LABEL[co.kind]}
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
        {/* Score and consequences */}
        <section className="card p-4">
          <div className="eyebrow">The scoreboard</div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white/[0.04] p-2.5">
              <div className="font-display text-2xl leading-none font-black text-white tabular">
                {record.correct}
                <span className="text-sm text-[var(--dim)]">/{ROUND_LENGTH}</span>
              </div>
              <div className="mt-1 text-[10px] font-bold text-[var(--dim)]">Technical</div>
            </div>
            <div className="rounded-xl bg-white/[0.04] p-2.5">
              <div className="font-display text-2xl leading-none font-black text-white tabular">
                {record.hrScore}
                <span className="text-sm text-[var(--dim)]">/2</span>
              </div>
              <div className="mt-1 text-[10px] font-bold text-[var(--dim)]">HR aced</div>
            </div>
            <div className="rounded-xl bg-white/[0.04] p-2.5">
              <div className="font-display text-2xl leading-none font-black text-white tabular">
                {impressionFace(record.impression)} {record.impression}
              </div>
              <div className="mt-1 text-[10px] font-bold text-[var(--dim)]">Impression</div>
            </div>
          </div>
          <div className="relative mt-3 h-2 rounded-full bg-white/[0.08]" aria-hidden>
            <div
              className="h-full rounded-full"
              style={{ width: `${(record.correct / ROUND_LENGTH) * 100}%`, background: above ? '#34d399' : '#fb7185' }}
            />
            <span className="absolute -top-1 h-4 w-0.5 rounded bg-white/70" style={{ left: `${(PASS_MARK / ROUND_LENGTH) * 100}%` }} />
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--muted)]">
            {above
              ? `Above the ${PASS_MARK}/${ROUND_LENGTH} offer line. The verdict lands in the inbox when the week ends.`
              : `Below the ${PASS_MARK}/${ROUND_LENGTH} offer line. A polite rejection is probably on its way.`}
          </p>

          <div className="eyebrow mt-4">How the day changed Sachin</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <DeltaChips effects={record.deltas} />
            <span className="rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-200">+{record.xp} XP</span>
          </div>
          {co.stats.toxicity >= 4 && <p className="mt-2 text-[11px] text-rose-200/80">That panel was draining. Toxic places cost extra energy and sanity.</p>}

          <div className="eyebrow mt-4">Company vibe</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {co.vibe.map((v) => (
              <span key={v} className="rounded-full border border-[var(--a-line)] bg-[var(--a-soft)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--a)]">
                {v}
              </span>
            ))}
          </div>
        </section>

        {/* Group chat */}
        <section className="card overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-white/[0.07] bg-white/[0.03] px-4 py-2.5">
            <span className="text-lg" aria-hidden>
              {'\u{1F393}'}
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

      <Btn onClick={actions.leaveReaction} className="w-full">
        Back to the week <ArrowRight className="h-4 w-4" />
      </Btn>
    </div>
  );
};
