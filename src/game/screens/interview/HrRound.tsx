import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Lock } from 'lucide-react';
import type { GameState, HrChoice, InterviewSession } from '../../types';
import { getCompany } from '../../data/companies';
import { getHrQuestion } from '../../data/hr';
import { SACHIN, STATS } from '../../data/cast';
import { meetsGate } from '../../engine';
import { Avatar, Btn, CompanyMark, Typewriter, useHotkeys } from '../../kit';
import type { GameActions } from '../../useGame';
import { Tappable } from '../../../components/ui';
import { ImpressionMeter } from './TechRound';
import { signed } from '../../ui-meta';

const VERDICT_LOOK: Record<HrChoice['verdict'], { label: string; color: string }> = {
  best: { label: 'Great answer', color: '#34d399' },
  okay: { label: 'Safe answer', color: '#fbbf24' },
  bad: { label: 'Red flag', color: '#fb7185' },
};

export const HrRound: React.FC<{ game: GameState; session: InterviewSession; actions: GameActions }> = ({ game, session, actions }) => {
  const c = getCompany(session.company);
  const total = session.hrIds.length;
  const answered = session.hrAnswers.length;

  // While a reply is on screen, the view stays on the question just answered.
  const [shown, setShown] = useState<{ index: number; before: number } | null>(null);
  const index = shown?.index ?? answered;
  const done = !shown && answered >= total;
  const q = done ? undefined : getHrQuestion(session.hrIds[index]);
  const picked = shown ? q?.choices.find((ch) => ch.id === session.hrAnswers[shown.index]) : undefined;
  const delta = shown ? session.impression - shown.before : 0;
  // Charm lets Sachin read the room: one trap answer is flagged.
  const flagged = session.buffs.includes('charming') ? q?.choices.find((ch) => ch.verdict === 'bad')?.id : undefined;

  const pick = (ch: HrChoice) => {
    if (shown || !meetsGate(game, ch.requires)) return;
    setShown({ index: answered, before: session.impression });
    actions.answerHr(answered, ch.id);
  };

  const next = () => {
    setShown(null);
    if (answered >= total) actions.finishInterview();
  };

  useHotkeys((e) => {
    const onButton = (e.target as HTMLElement | null)?.tagName === 'BUTTON';
    if (shown || done) {
      if ((e.key === 'Enter' || e.key === ' ') && !onButton) {
        e.preventDefault();
        if (done) actions.finishInterview();
        else next();
      }
      return;
    }
    const n = Number(e.key);
    const ch = q && n >= 1 ? q.choices[n - 1] : undefined;
    if (ch) pick(ch);
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-10 md:p-7" data-accent={c.accent}>
      <div className="card flex flex-wrap items-center gap-3 p-3.5">
        <CompanyMark id={c.id} size={38} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-bold text-white">{c.name}</div>
          <div className="truncate text-[10.5px] font-semibold text-fuchsia-200">
            Round 3 · HR & culture fit · {done ? 'done' : `question ${index + 1} of ${total}`}
            <span className="hidden font-normal text-[var(--dim)] sm:inline"> · no clock, but every word counts</span>
          </div>
        </div>
        <ImpressionMeter value={session.impression} />
      </div>

      {done || !q ? (
        <div className="card pop-in p-6 text-center">
          <div className="text-5xl" aria-hidden>
            {'\u{1F91D}'}
          </div>
          <h3 className="font-display mt-3 text-xl font-bold text-white">“We’ll get back to you.”</h3>
          <p className="mt-1 text-[13px] text-[var(--muted)]">
            {c.hr.name} walks Sachin to the lift. The results arrive by mail at the end of the week.
          </p>
          <Btn onClick={actions.finishInterview} className="mx-auto mt-4">
            Leave the building <ArrowRight className="h-4 w-4" />
          </Btn>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <Avatar emoji={c.hr.avatar} size={48} ring="rgba(240,171,252,0.5)" />
            <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-white/[0.08] bg-black/35 px-3.5 py-2.5">
              <div className="truncate text-[11px] font-bold text-fuchsia-200">
                {c.hr.name} <span className="font-semibold text-[var(--dim)]">· {c.hr.title}</span>
              </div>
              <p className="mt-0.5 text-[14px] leading-relaxed text-white">
                <Typewriter key={q.id} text={q.q.replace(/\{co\}/g, c.name)} speed={14} />
              </p>
            </div>
          </div>

          {!shown ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--dim)]">
                <Avatar emoji={SACHIN.avatar} size={24} /> Sachin says...
              </div>
              {q.choices.map((ch, i) => {
                const unlocked = meetsGate(game, ch.requires);
                const gate = ch.requires;
                return (
                  <Tappable
                    key={ch.id}
                    onClick={() => pick(ch)}
                    disabled={!unlocked}
                    aria-label={unlocked ? ch.text : `Locked: needs ${gate ? STATS[gate.stat].label : ''} ${gate?.min}`}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
                      unlocked
                        ? gate
                          ? 'border-violet-400/40 bg-violet-400/[0.08] hover:bg-violet-400/[0.14]'
                          : 'border-white/[0.09] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                        : 'cursor-not-allowed border-white/[0.05] bg-white/[0.015] opacity-60'
                    }`}
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/[0.07] text-[11px] font-black text-[var(--muted)]">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      {gate && (
                        <span className={`mb-1 flex items-center gap-1 text-[10px] font-black tracking-wider uppercase ${unlocked ? 'text-violet-200' : 'text-[var(--dim)]'}`}>
                          {unlocked ? '✨' : <Lock className="h-3 w-3" />} {STATS[gate.stat].emoji} {STATS[gate.stat].label} {gate.min}
                          {!unlocked && <span className="font-semibold normal-case"> · you have {game.stats[gate.stat]}</span>}
                        </span>
                      )}
                      <span className={`block text-[13px] leading-snug ${unlocked ? 'text-[var(--text)]' : 'text-[var(--dim)]'}`}>{ch.text}</span>
                      {flagged === ch.id && (
                        <span className="mt-1 block text-[11px] font-bold text-rose-300">{'\u{1F6A9}'} Sachin’s gut says this one will backfire.</span>
                      )}
                    </span>
                  </Tappable>
                );
              })}
              <p className="text-center text-[11px] text-[var(--dim)]">Press 1–{q.choices.length} to answer.</p>
            </div>
          ) : (
            picked && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="flex items-start justify-end gap-3">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm border border-sky-400/25 bg-sky-400/[0.08] px-3.5 py-2.5 text-[13px] leading-snug text-sky-50">
                    {picked.text}
                  </div>
                  <Avatar emoji={SACHIN.avatar} size={40} ring="rgba(56,189,248,0.45)" />
                </div>
                <div className="flex items-start gap-3">
                  <Avatar emoji={c.hr.avatar} size={40} ring="rgba(240,171,252,0.5)" />
                  <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-white/[0.08] bg-black/35 px-3.5 py-2.5 text-[13px] leading-relaxed text-white">
                    <Typewriter text={picked.reply} speed={14} />
                  </div>
                </div>
                <div className="card flex flex-wrap items-center justify-between gap-3 p-3.5" style={{ borderColor: `${VERDICT_LOOK[picked.verdict].color}55` }}>
                  <div>
                    <div className="text-[13px] font-bold" style={{ color: VERDICT_LOOK[picked.verdict].color }}>
                      {VERDICT_LOOK[picked.verdict].label}
                    </div>
                    <div className="text-[11.5px] text-[var(--muted)]">
                      Panel impression{' '}
                      <strong className={delta > 0 ? 'text-emerald-300' : delta < 0 ? 'text-rose-300' : 'text-white'}>
                        {signed(delta)}
                      </strong>
                      {session.impression >= 100 && ' (maxed out)'}
                      {picked.requires && picked.verdict === 'best' && ' · a stat-unlocked answer lands harder'}
                    </div>
                  </div>
                  <Btn onClick={next} className="px-4 py-2.5 text-xs" autoFocus>
                    {answered >= total ? 'Finish the interview' : 'Next question'} <ArrowRight className="h-4 w-4" />
                  </Btn>
                </div>
              </motion.div>
            )
          )}
        </>
      )}
    </div>
  );
};
