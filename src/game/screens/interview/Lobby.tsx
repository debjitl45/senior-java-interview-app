import React from 'react';
import { DoorOpen } from 'lucide-react';
import type { InterviewSession } from '../../types';
import { getCompany } from '../../data/companies';
import { BUFF_META, PASS_MARK, ROUND_LENGTH, formatPkg } from '../../engine';
import { Avatar, Btn, CompanyMark, CompanyWordmark } from '../../kit';
import type { GameActions } from '../../useGame';

const LIFELINE_LABEL = { fifty: '50:50', senior: 'Phone a senior', poll: 'LinkedIn poll', clarify: 'Clarify' } as const;

export const Lobby: React.FC<{ session: InterviewSession; actions: GameActions }> = ({ session, actions }) => {
  const c = getCompany(session.company);
  const counts = session.lifelines.reduce<Record<string, number>>((acc, l) => ({ ...acc, [l]: (acc[l] ?? 0) + 1 }), {});

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-10 md:p-7" data-accent={c.accent}>
      <section className="card card-accent relative overflow-hidden p-5 md:p-7">
        <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-[var(--a-glow)] blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <CompanyMark id={c.id} size={64} />
          <div className="min-w-0 flex-1">
            <div className="eyebrow">Interview day · {c.location}</div>
            <CompanyWordmark id={c.id} className="text-3xl md:text-4xl" />
            <p className="mt-1 text-[12.5px] text-[var(--muted)] italic">“{c.tagline}”</p>
          </div>
        </div>
        <div className="relative mt-5 rounded-2xl border border-white/[0.08] bg-black/30 p-4 text-[13px] leading-relaxed text-[var(--text)]">
          The receptionist hands Sachin a visitor badge. The lift smells of fresh carpet and ambition. Somewhere, a coffee machine is working
          perfectly — a good omen.
        </div>
      </section>

      <section className="card p-4">
        <div className="eyebrow mb-3">Today’s panel</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { p: c.interviewer, r: 'Round 1 · Tech screen', d: `Questions 1–5` },
            { p: c.barRaiser, r: 'Round 2 · Bar raiser', d: `Questions 6–${ROUND_LENGTH}` },
            { p: c.hr, r: 'Round 3 · HR & culture', d: 'Two conversations' },
          ].map(({ p, r, d }) => (
            <div key={r} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
              <div className="flex items-center gap-2.5">
                <Avatar emoji={p.avatar} size={40} />
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-[12.5px] font-bold text-white">{p.name}</div>
                  <div className="truncate text-[10.5px] text-[var(--dim)]">{p.title}</div>
                </div>
              </div>
              <div className="mt-2 text-[10.5px] font-bold text-[var(--a)]">{r}</div>
              <div className="text-[10.5px] text-[var(--dim)]">{d}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11.5px] text-[var(--muted)]">
          Get {PASS_MARK}/{ROUND_LENGTH} right in the technical rounds for an offer ({formatPkg(c, c.ctc[0])}–{formatPkg(c, c.ctc[1])}). The HR round
          and the panel’s impression decide where in that range you land — and how this day changes Sachin.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="card p-4">
          <div className="eyebrow mb-2">Walking in with</div>
          {session.buffs.length ? (
            <ul className="space-y-2">
              {session.buffs.map((b) => (
                <li key={b} className="flex gap-2 text-[12px]">
                  <span aria-hidden>{BUFF_META[b].emoji}</span>
                  <span>
                    <strong className={BUFF_META[b].good ? 'text-emerald-300' : 'text-rose-300'}>{BUFF_META[b].label}.</strong>{' '}
                    <span className="text-[var(--muted)]">{BUFF_META[b].desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-[var(--muted)]">No buffs, no debuffs. Just Sachin and his preparation.</p>
          )}
        </section>
        <section className="card p-4">
          <div className="eyebrow mb-2">Lifelines</div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(counts).map(([k, n]) => (
              <span key={k} className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[11px] font-bold text-amber-200">
                {LIFELINE_LABEL[k as keyof typeof LIFELINE_LABEL]}
                {n > 1 ? ` ×${n}` : ''}
              </span>
            ))}
          </div>
          <div className="eyebrow mt-4 mb-1">Panel impression</div>
          <p className="text-[12px] text-[var(--muted)]">
            Starts at <strong className="text-white">{session.impression}</strong>/100. Right answers and good HR answers raise it.
          </p>
        </section>
      </div>

      <Btn onClick={actions.beginTech} className="w-full py-4">
        <DoorOpen className="h-4 w-4" /> Walk into the interview room
      </Btn>
      <p className="text-center text-[11px] text-[var(--dim)]">Keys A–D pick an answer, Enter locks it.</p>
    </div>
  );
};
