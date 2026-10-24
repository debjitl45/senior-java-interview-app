import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { GameState } from '../../types';
import { SACHIN, STATS, STAT_ORDER } from '../../data/cast';
import { BACKGROUNDS, PERKS } from '../../data/progression';
import { BUFF_META, computeBuffs, formatMoney, levelProgress, romanceActive } from '../../engine';
import { Avatar, StatBar } from '../../kit';
import { Progress } from '../../../components/ui';

export const CharacterSheet: React.FC<{ game: GameState }> = ({ game }) => {
  const [open, setOpen] = useState(false);
  const lp = levelProgress(game.xp);
  const bg = game.background ? BACKGROUNDS[game.background] : null;
  const keys = STAT_ORDER.filter((k) => k !== 'romance' || romanceActive(game) || game.flags.includes('romance_split'));
  const buffs = computeBuffs(game, false);

  return (
    <aside className="card p-4 lg:sticky lg:top-4" data-accent="fuchsia">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar emoji={SACHIN.avatar} size={56} ring="rgba(232,121,249,0.5)" />
          <span className="bg-brand absolute -right-1 -bottom-1 rounded-full px-1.5 py-0.5 text-[10px] font-black text-white tabular shadow">
            Lv {lp.level}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-bold text-white">
            {SACHIN.name}, {SACHIN.age}
          </div>
          <div className="truncate text-[11px] text-[var(--dim)]">
            {bg ? `${bg.emoji} ${bg.name}` : SACHIN.role}
          </div>
          <div className="mt-1.5">
            <Progress value={lp.pct} height={5} />
            <div className="mt-1 text-[10px] font-semibold text-[var(--dim)] tabular">
              {game.xp} XP{lp.next ? ` · ${lp.next - game.xp} to level ${lp.level + 1}` : ' · max level'}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-3 flex w-full items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-[11px] font-bold text-[var(--muted)] lg:hidden"
        aria-expanded={open}
      >
        {open ? 'Hide stats' : 'Show stats, perks & buffs'}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Mobile: the four survival stats are always visible. */}
      {!open && (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 lg:hidden">
          {(['energy', 'sanity', 'reputation', 'skill'] as const).map((k) => (
            <StatBar key={k} k={k} value={game.stats[k]} />
          ))}
        </div>
      )}

      <div className={`${open ? 'block' : 'hidden'} lg:block`}>
        <div className="mt-4 space-y-2.5">
          {keys.map((k) => (
            <StatBar key={k} k={k} value={game.stats[k]} />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-black/25 px-3 py-2.5">
          <span className="text-[11.5px] font-semibold text-[var(--muted)]">
            {STATS.money.emoji} {STATS.money.label}
          </span>
          <span className={`font-display text-[15px] font-bold tabular ${game.stats.money < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
            {formatMoney(game.stats.money)}
          </span>
        </div>

        <div className="mt-4">
          <div className="eyebrow mb-1.5">Perks</div>
          {game.perks.length ? (
            <div className="flex flex-wrap gap-1.5">
              {game.perks.map((p) => (
                <span key={p} title={PERKS[p].desc} className="rounded-full border border-white/[0.09] bg-white/[0.04] px-2 py-1 text-[10.5px] font-bold text-white">
                  {PERKS[p].emoji} {PERKS[p].name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-[var(--dim)]">Level up to pick your first perk.</p>
          )}
        </div>

        <div className="mt-4">
          <div className="eyebrow mb-1.5">Walking into an interview now</div>
          {buffs.length ? (
            <div className="flex flex-wrap gap-1.5">
              {buffs.map((b) => (
                <span
                  key={b}
                  title={BUFF_META[b].desc}
                  className={`rounded-full px-2 py-1 text-[10.5px] font-bold ${BUFF_META[b].good ? 'bg-emerald-400/12 text-emerald-200' : 'bg-rose-400/12 text-rose-200'}`}
                >
                  {BUFF_META[b].emoji} {BUFF_META[b].label}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-[var(--dim)]">No buffs or debuffs. Skill 65+ makes you Sharp; Charisma 60+ makes you Charming.</p>
          )}
        </div>
      </div>
    </aside>
  );
};
