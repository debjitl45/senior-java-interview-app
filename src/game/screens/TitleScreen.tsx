import React from 'react';
import { ArrowLeft, Play, Plus, Trash2 } from 'lucide-react';
import { COMPANY_IDS, type GameState } from '../types';
import { getCompany } from '../data/companies';
import { SACHIN } from '../data/cast';
import { PASS_MARK, PHASE_LABEL, ROUND_LENGTH, timeAgo } from '../engine';
import { Avatar, Btn, CompanyMark } from '../kit';
import { Tappable } from '../../components/ui';

const STEPS = [
  { emoji: '\u{1F4E9}', title: 'Open the mail', body: 'Invites from four very different companies land in Sachin’s inbox, in any order.' },
  { emoji: '\u{1F3A4}', title: 'Hot seat, KBC-style', body: `${ROUND_LENGTH} questions, four options, harder every round. Three lifelines. Lock kiya jaaye?` },
  { emoji: '\u{1F575}️', title: 'Office dilemma', body: 'Back at his current job, Sachin faces his manager, HR and teammates. Every choice has consequences.' },
  { emoji: '\u{1F4E8}', title: 'Offer or rejection', body: `Score ${PASS_MARK}/${ROUND_LENGTH} (70%) to get the offer letter. Fall short and the “we regret to inform you” arrives.` },
];

interface Props {
  game: GameState | null;
  savedAt: number | null;
  onContinue: () => void;
  onNewGame: () => void;
  onDeleteSave: () => void;
  onExit: () => void;
}

export const TitleScreen: React.FC<Props> = ({ game, savedAt, onContinue, onNewGame, onDeleteSave, onExit }) => (
  <div className="fade-in mx-auto flex min-h-full max-w-4xl flex-col px-4 pt-4 pb-10 md:px-7">
    <div className="pt-safe flex justify-start">
      <Tappable
        onClick={onExit}
        className="flex items-center gap-1.5 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2 text-[11px] font-bold text-[var(--muted)] hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to JavaMaster
      </Tappable>
    </div>

    {/* Hero */}
    <section className="relative mt-6 text-center md:mt-10">
      <div className="pointer-events-none absolute top-0 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="relative">
        <div className="eyebrow">JavaMaster presents · an interview RPG</div>
        <h1 className="font-display text-brand mt-2 text-4xl leading-[1.02] font-black md:text-6xl">Sachin’s Job Hunt</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-[var(--muted)]">
          Four companies. Forty questions. Four office dilemmas. One 24-year-old Java developer who really, really
          needs a hike.
        </p>

        <div className="float mx-auto mt-6 w-fit">
          <Avatar emoji={SACHIN.avatar} size={92} ring="rgba(232,121,249,0.55)" />
        </div>
        <div className="mt-3 text-[13px] font-bold text-white">
          {SACHIN.name}, {SACHIN.age}
        </div>
        <div className="text-[11px] text-[var(--dim)]">{SACHIN.role}</div>
      </div>
    </section>

    {/* Companies */}
    <section className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {COMPANY_IDS.map((id) => {
        const co = getCompany(id);
        return (
          <div key={id} className="card flex items-center gap-2.5 p-3" data-accent={co.accent}>
            <CompanyMark id={id} size={34} />
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-bold text-white">{co.name}</div>
              <div className="truncate text-[10.5px] text-[var(--dim)]">{co.kind}</div>
            </div>
          </div>
        );
      })}
    </section>

    {/* Actions */}
    <section className="mx-auto mt-8 flex w-full max-w-sm flex-col gap-2.5">
      {game && (
        <Btn onClick={onContinue} className="w-full py-4">
          <Play className="h-4 w-4" />
          <span className="flex flex-col items-start leading-tight">
            <span>{game.phase === 'finale' ? 'View season finale' : 'Continue'}</span>
            <span className="text-[10.5px] font-semibold text-white/75">
              {game.completed.length}/{COMPANY_IDS.length} interviews · {PHASE_LABEL[game.phase]}
              {savedAt ? ` · saved ${timeAgo(savedAt)}` : ''}
            </span>
          </span>
        </Btn>
      )}
      <Btn variant={game ? 'ghost' : 'primary'} onClick={onNewGame} className="w-full py-3.5">
        <Plus className="h-4 w-4" /> {game ? 'New game' : 'Start new game'}
      </Btn>
      {game && (
        <Tappable
          onClick={onDeleteSave}
          className="mx-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-rose-300/80 hover:text-rose-200"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete saved game
        </Tappable>
      )}
    </section>

    {/* How it plays */}
    <section className="mt-10">
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
      <p className="mt-4 text-center text-[11px] text-[var(--dim)]">
        Progress saves automatically on this device. Use Save anytime, or start over from the menu.
      </p>
    </section>
  </div>
);
