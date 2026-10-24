import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import type { BackgroundId, CastId, FactCard, GameState, StatKey } from '../types';
import { getFact } from '../data/facts';
import { CAST, CURRENT_EMPLOYER, SACHIN, STATS } from '../data/cast';
import { BACKGROUNDS, BACKGROUND_IDS } from '../data/progression';
import { formatMoney } from '../engine';
import { Avatar, Btn } from '../kit';
import type { GameActions } from '../useGame';
import { Tappable } from '../../components/ui';

const OFFICE: CastId[] = ['rakesh', 'pooja', 'rohit', 'ananya', 'vikram', 'shreya'];
const PREVIEW: StatKey[] = ['skill', 'charisma', 'energy', 'sanity', 'network'];

export const IntroScreen: React.FC<{ game: GameState; actions: GameActions }> = ({ game, actions }) => {
  const deck = useMemo(() => game.facts.map(getFact).filter((f): f is FactCard => Boolean(f)), [game.facts]);
  const [i, setI] = useState(0);
  const [bg, setBg] = useState<BackgroundId>('fighter');
  const step = i < deck.length ? 'fact' : i === deck.length ? 'meet' : 'build';
  const card = deck[i];

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col p-4 pb-10 md:p-7">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow">{step === 'build' ? 'Character creation' : 'Before you begin'}</div>
          <h2 className="font-display mt-1 text-xl font-bold text-white md:text-2xl">
            {step === 'fact' ? 'Corporate gyaan, free of cost' : step === 'meet' ? 'Meet your player' : 'Who is Sachin, really?'}
          </h2>
        </div>
        {step === 'fact' && (
          <Tappable onClick={() => setI(deck.length)} className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-[var(--dim)] hover:text-white">
            Skip ▸▸
          </Tappable>
        )}
      </div>

      <div className="mt-4 flex gap-1.5" aria-hidden>
        {[...deck, null, null].map((_, j) => (
          <span key={j} className={`h-1 flex-1 rounded-full ${j <= i ? 'bg-[var(--brand-2)]' : 'bg-white/10'}`} />
        ))}
      </div>

      <div className="relative mt-5 flex-1">
        <AnimatePresence mode="popLayout">
          {step === 'fact' && card && (
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
              </div>
            </motion.article>
          )}

          {step === 'meet' && (
            <motion.article key="meet" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card ring-brand p-6 md:p-8" data-accent="fuchsia">
              <div className="flex items-center gap-4">
                <Avatar emoji={SACHIN.avatar} size={72} ring="rgba(232,121,249,0.55)" />
                <div>
                  <h3 className="font-display text-2xl font-bold text-white">
                    {SACHIN.name}, {SACHIN.age}
                  </h3>
                  <div className="text-[12px] text-[var(--muted)]">{SACHIN.role}</div>
                </div>
              </div>
              <p className="mt-4 text-[13.5px] leading-relaxed text-[var(--muted)]">{SACHIN.bio}</p>
              <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/25 p-4">
                <div className="eyebrow">Still working at {CURRENT_EMPLOYER}</div>
                <p className="mt-1 text-[12px] text-[var(--muted)]">Every weekend, the office throws something at you. These people remember your choices.</p>
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
                <li>🗓️ The season lasts 30 weeks. Each week you get 3 action points.</li>
                <li>🎯 Clear 7/10 in a technical round to earn an offer. Accepting starts a 4-week notice period.</li>
                <li>❤️ Stats matter: burn out or lose your reputation and the season ends early.</li>
              </ul>
            </motion.article>
          )}

          {step === 'build' && (
            <motion.div key="build" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <p className="text-[13px] text-[var(--muted)]">Pick a background. It sets Sachin’s starting stats — and how the season will feel.</p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {BACKGROUND_IDS.map((id) => {
                  const b = BACKGROUNDS[id];
                  const on = bg === id;
                  return (
                    <Tappable
                      key={id}
                      onClick={() => setBg(id)}
                      aria-pressed={on}
                      className={`rounded-2xl border p-4 text-left transition-colors ${on ? 'border-fuchsia-400/60 bg-fuchsia-400/10' : 'border-white/[0.09] bg-white/[0.03] hover:bg-white/[0.06]'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-3xl" aria-hidden>
                            {b.emoji}
                          </span>
                          <div>
                            <div className="text-[14px] font-bold text-white">{b.name}</div>
                            <div className="text-[11px] text-[var(--dim)] italic">{b.tagline}</div>
                          </div>
                        </div>
                        {on && (
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-fuchsia-400 text-black">
                            <Check className="h-4 w-4" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[12px] leading-relaxed text-[var(--muted)]">{b.desc}</p>
                      <div className="mt-3 grid grid-cols-5 gap-1.5 text-center">
                        {PREVIEW.map((k) => (
                          <div key={k} className="rounded-lg bg-black/25 py-1.5" title={STATS[k].label}>
                            <div className="text-[13px]" aria-hidden>
                              {STATS[k].emoji}
                            </div>
                            <div className="text-[12px] font-bold text-white tabular">{b.stats[k]}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-right text-[11px] font-bold text-emerald-300">Savings {formatMoney(b.stats.money)}</div>
                    </Tappable>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Btn variant="ghost" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Btn>
        {step === 'build' ? (
          <Btn onClick={() => actions.chooseBackground(bg)}>
            Start week 1 <ArrowRight className="h-4 w-4" />
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
