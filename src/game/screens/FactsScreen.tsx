import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import type { CastId, FactCard, GameState } from '../types';
import { getFact } from '../data/facts';
import { CAST, CURRENT_EMPLOYER, SACHIN } from '../data/cast';
import { Avatar, Btn } from '../kit';
import type { GameActions } from '../useGame';
import { Tappable } from '../../components/ui';

const OFFICE: CastId[] = ['rakesh', 'pooja', 'rohit', 'ananya', 'vikram'];

export const FactsScreen: React.FC<{ game: GameState; actions: GameActions }> = ({ game, actions }) => {
  const deck = useMemo(
    () => game.facts.map(getFact).filter((f): f is FactCard => Boolean(f)),
    [game.facts],
  );
  const [i, setI] = useState(0);
  const onMeet = i >= deck.length;
  const card = deck[i];

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col p-4 pb-10 md:p-7">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow">Before you begin</div>
          <h2 className="font-display mt-1 text-xl font-bold text-white md:text-2xl">Corporate gyaan, free of cost</h2>
        </div>
        {!onMeet && (
          <Tappable
            onClick={() => setI(deck.length)}
            className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-[var(--dim)] hover:text-white"
          >
            Skip ▸▸
          </Tappable>
        )}
      </div>

      {/* Progress */}
      <div className="mt-4 flex gap-1.5" aria-hidden>
        {[...deck, null].map((_, j) => (
          <span key={j} className={`h-1 flex-1 rounded-full ${j <= i ? 'bg-[var(--brand-2)]' : 'bg-white/10'}`} />
        ))}
      </div>

      <div className="relative mt-5 flex-1">
        <AnimatePresence mode="wait">
          {!onMeet && card ? (
            <motion.article
              key={card.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className={`card relative overflow-hidden p-6 md:p-8 ${card.kind === 'tip' ? 'card-accent' : ''}`}
              data-accent={card.kind === 'tip' ? 'emerald' : 'violet'}
            >
              <div className="pointer-events-none absolute -top-16 -right-12 h-44 w-44 rounded-full bg-[var(--a-glow)] blur-3xl" />
              <div className="relative">
                <span className="rounded-full border border-[var(--a-line)] bg-[var(--a-soft)] px-2.5 py-1 text-[10px] font-bold tracking-wide text-[var(--a)] uppercase">
                  {card.kind === 'tip' ? 'Pro tip · use it IRL' : 'Fun fact'}
                </span>
                <div className="mt-6 text-6xl" aria-hidden>
                  {card.emoji}
                </div>
                <h3 className="font-display mt-4 text-2xl leading-tight font-bold text-white">{card.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-[var(--muted)]">{card.body}</p>
                <div className="mt-6 text-[11px] font-semibold text-[var(--dim)] tabular">
                  {i + 1} / {deck.length}
                </div>
              </div>
            </motion.article>
          ) : (
            <motion.article
              key="meet"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="card ring-brand relative overflow-hidden p-6 md:p-8"
              data-accent="fuchsia"
            >
              <div className="flex items-center gap-4">
                <Avatar emoji={SACHIN.avatar} size={72} ring="rgba(232,121,249,0.55)" />
                <div>
                  <div className="eyebrow">Meet your player</div>
                  <h3 className="font-display text-2xl font-bold text-white">
                    {SACHIN.name}, {SACHIN.age}
                  </h3>
                  <div className="text-[12px] text-[var(--muted)]">{SACHIN.role}</div>
                </div>
              </div>
              <p className="mt-4 text-[13.5px] leading-relaxed text-[var(--muted)]">{SACHIN.bio}</p>

              <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/25 p-4">
                <div className="eyebrow">Still working at {CURRENT_EMPLOYER}</div>
                <p className="mt-1 text-[12px] text-[var(--muted)]">
                  Between interviews, you’ll handle these people. Choose your words carefully — they remember.
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {OFFICE.map((id) => {
                    const p = CAST[id];
                    return (
                      <div key={id} className="flex items-center gap-2.5">
                        <Avatar emoji={p.avatar} size={34} ring={`${p.color}66`} />
                        <div className="min-w-0 leading-tight">
                          <div className="text-[12.5px] font-bold" style={{ color: p.color }}>
                            {p.name}
                          </div>
                          <div className="truncate text-[10.5px] text-[var(--dim)]">{p.role}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <ul className="mt-4 space-y-1.5 text-[12.5px] text-[var(--muted)]">
                <li>🎯 Interview at all four companies — clear 7/10 to earn an offer.</li>
                <li>🕴️ Make the right calls at the office to protect your reputation and sanity.</li>
                <li>💾 Your progress saves automatically. Hit Save anytime for peace of mind.</li>
              </ul>
            </motion.article>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Btn variant="ghost" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Btn>
        {onMeet ? (
          <Btn onClick={actions.finishFacts}>
            <Mail className="h-4 w-4" /> Open inbox
          </Btn>
        ) : (
          <Btn onClick={() => setI((x) => x + 1)}>
            Next <ArrowRight className="h-4 w-4" />
          </Btn>
        )}
      </div>
    </div>
  );
};
