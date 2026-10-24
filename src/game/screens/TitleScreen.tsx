import React, { useMemo } from 'react';
import { ArrowLeft, Play, Plus, Trash2 } from 'lucide-react';
import type { GameState } from '../types';
import { COMPANY_IDS, getCompany } from '../data/companies';
import { SACHIN } from '../data/cast';
import { ENDINGS, ENDING_IDS } from '../data/endings';
import { SCENARIOS } from '../data/scenarios';
import { SEASON_WEEKS, monthOf, readGallery, timeAgo } from '../engine';
import { Avatar, Btn, CompanyMark } from '../kit';
import { Tappable } from '../../components/ui';

const STEPS = [
  { emoji: '\u{1F5D3}️', title: 'Live the week', body: `A ${SEASON_WEEKS}-week season. Spend action points to grind, recharge, network or impress — and grab random low-hanging fruit.` },
  { emoji: '\u{1F3A4}', title: 'Interview, KBC-style', body: `${COMPANY_IDS.length} companies. A tech screen, a bar raiser, then HR. 7/10 gets the offer; your answers move Sachin’s stats.` },
  { emoji: '\u{1F575}️', title: 'Survive the office', body: `${SCENARIOS.length} dilemmas: conflict, politics, romance, POSH, WFO and more. Every choice has consequences.` },
  { emoji: '\u{1F3AC}', title: 'Reach an ending', body: `${ENDING_IDS.length} endings, decided by the offer you take and the person Sachin becomes.` },
];

interface Props {
  game: GameState | null;
  savedAt: number | null;
  onContinue: () => void;
  onNewGame: () => void;
  onDeleteSave: () => void;
  onExit: () => void;
}

export const TitleScreen: React.FC<Props> = ({ game, savedAt, onContinue, onNewGame, onDeleteSave, onExit }) => {
  const found = useMemo(readGallery, []);
  const marks = COMPANY_IDS.filter((_, i) => i % 2 === 0).slice(0, 12);

  return (
    <div className="fade-in mx-auto flex min-h-full max-w-4xl flex-col px-4 pt-4 pb-10 md:px-7">
      <div className="pt-safe flex justify-start">
        <Tappable
          onClick={onExit}
          className="flex items-center gap-1.5 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2 text-[11px] font-bold text-[var(--muted)] hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to JavaMaster
        </Tappable>
      </div>

      <section className="relative mt-6 text-center md:mt-8">
        <div className="pointer-events-none absolute top-0 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="relative">
          <div className="eyebrow">JavaMaster presents · Season 2 · an interview RPG</div>
          <h1 className="font-display text-brand mt-2 text-4xl leading-[1.02] font-black md:text-6xl">Sachin’s Job Hunt</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--muted)]">
            One 24-year-old Java developer. Thirty weeks. Twenty-six companies, one manager who loves 10 PM calls, and a coffee machine that
            might change his life.
          </p>
          <div className="float mx-auto mt-6 w-fit">
            <Avatar emoji={SACHIN.avatar} size={88} ring="rgba(232,121,249,0.55)" />
          </div>
          <div className="mt-3 text-[13px] font-bold text-white">
            {SACHIN.name}, {SACHIN.age}
          </div>
          <div className="text-[11px] text-[var(--dim)]">{SACHIN.role}</div>
        </div>
      </section>

      <div className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-2" aria-label="Some of the companies">
        {marks.map((id) => (
          <div key={id} title={getCompany(id).name}>
            <CompanyMark id={id} size={30} />
          </div>
        ))}
        <span className="grid h-[30px] place-items-center rounded-[28%] bg-white/[0.06] px-2 text-[10px] font-bold text-[var(--dim)]">
          +{COMPANY_IDS.length - marks.length}
        </span>
      </div>

      <section className="mx-auto mt-8 flex w-full max-w-sm flex-col gap-2.5">
        {game && (
          <Btn onClick={onContinue} className="w-full py-4">
            <Play className="h-4 w-4" />
            <span className="flex flex-col items-start leading-tight">
              <span>{game.phase === 'ending' ? 'See how it ended' : 'Continue'}</span>
              <span className="text-[10.5px] font-semibold text-white/75">
                {game.phase === 'intro' ? 'Character creation' : `Week ${Math.min(game.week, SEASON_WEEKS)} · ${monthOf(game.week)} · Level ${game.level}`}
                {savedAt ? ` · saved ${timeAgo(savedAt)}` : ''}
              </span>
            </span>
          </Btn>
        )}
        <Btn variant={game ? 'ghost' : 'primary'} onClick={onNewGame} className="w-full py-3.5">
          <Plus className="h-4 w-4" /> {game ? 'New game' : 'Start new game'}
        </Btn>
        {game && (
          <Tappable onClick={onDeleteSave} className="mx-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-rose-300/80 hover:text-rose-200">
            <Trash2 className="h-3.5 w-3.5" /> Delete saved game
          </Tappable>
        )}
      </section>

      <section className="card mt-8 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="eyebrow">Endings discovered</div>
          <div className="text-[11px] font-bold text-white tabular">
            {found.length}/{ENDING_IDS.length}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ENDING_IDS.map((id) => {
            const got = found.includes(id);
            return (
              <span
                key={id}
                title={got ? ENDINGS[id].title : `Undiscovered · ${ENDINGS[id].hint}`}
                className={`grid h-9 w-9 place-items-center rounded-xl text-lg ${got ? 'bg-white/[0.08]' : 'bg-white/[0.03] text-[13px] text-[var(--dim)]'}`}
              >
                {got ? ENDINGS[id].emoji : '?'}
              </span>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <div className="eyebrow mb-3 text-center">How it plays</div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <div key={s.title} className="card flex gap-3 p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-xl" aria-hidden>
                {s.emoji}
              </div>
              <div>
                <div className="text-[12.5px] font-bold text-white">
                  <span className="mr-1 font-mono text-[var(--dim)]">{i + 1}.</span>
                  {s.title}
                </div>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-[var(--muted)]">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[11px] text-[var(--dim)]">Progress saves automatically on this device. Save anytime, or reset from the top bar.</p>
      </section>
    </div>
  );
};
