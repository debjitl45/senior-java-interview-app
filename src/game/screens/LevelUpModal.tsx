import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { GameState, PerkId } from '../types';
import { PERKS } from '../data/progression';
import { Tappable, celebrate } from '../../components/ui';

/** Level-up: pick one perk out of three. It owns the keyboard (1–3) while open. */
export const LevelUpModal: React.FC<{ game: GameState; onPick: (perk: PerkId) => void }> = ({ game, onPick }) => {
  const choices = game.perkChoices;

  useEffect(() => {
    celebrate('small');
  }, [game.level]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const p = choices[Number(e.key) - 1];
      if (p) onPick(p);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choices, onPick]);

  return (
    <motion.div className="fixed inset-0 z-[94] grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="levelup-title"
        className="card w-full max-w-lg p-5 md:p-6"
        style={{ background: 'rgba(18, 16, 31, 0.98)', borderColor: 'rgba(252, 211, 77, 0.35)' }}
        initial={{ scale: 0.92, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        <div className="text-center">
          <div className="text-4xl" aria-hidden>
            {'\u{2B06}\u{FE0F}'}
          </div>
          <div className="eyebrow mt-2" style={{ color: '#fcd34d' }}>
            Level up
          </div>
          <h3 id="levelup-title" className="font-display text-2xl font-black text-white">
            Sachin reached level {game.level}
          </h3>
          <p className="mt-1 text-[12.5px] text-[var(--muted)]">
            Pick one perk. It lasts the whole season.
            {game.pendingPicks > 1 ? ` (${game.pendingPicks} picks waiting)` : ''}
          </p>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-2.5">
          {choices.map((p, i) => (
            <Tappable
              key={p}
              onClick={() => onPick(p)}
              autoFocus={i === 0}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.09] bg-white/[0.04] p-3.5 text-left transition-colors hover:border-amber-300/50 hover:bg-amber-300/[0.07]"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-2xl" aria-hidden>
                {PERKS[p].emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-bold text-white">{PERKS[p].name}</span>
                <span className="block text-[12px] leading-snug text-[var(--muted)]">{PERKS[p].desc}</span>
              </span>
              <span className="hidden font-mono text-[11px] text-[var(--dim)] sm:block">{i + 1}</span>
            </Tappable>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
