import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Radio } from 'lucide-react';
import type { CastId, GameState, Scenario, ScenarioChoice } from '../types';
import { getCompany } from '../data/companies';
import { CAST, CURRENT_EMPLOYER, SACHIN } from '../data/cast';
import { DECISION_SECONDS, TONE_COLOR, VERDICT_META, currentScenario, rememberLine } from '../engine';
import { Avatar, Btn, MetersGrid, TimerBar, Typewriter, useCountdown, useHotkeys } from '../kit';
import type { GameActions } from '../useGame';
import { Tappable } from '../../components/ui';

interface Props {
  game: GameState;
  actions: GameActions;
}

/* ------------------------------------------------------------------ *
 * Debrief — what happened, what it cost, what to do in real life
 * ------------------------------------------------------------------ */

const Debrief: React.FC<Props & { scenario: Scenario }> = ({ game, actions, scenario }) => {
  const entry = game.scenarioLog.find((e) => e.scenarioId === scenario.id)!;
  const choice = scenario.choices.find((c) => c.id === entry.choiceId) ?? null;
  const best = scenario.choices.find((c) => c.verdict === 'best');
  const verdict = VERDICT_META[entry.verdict];
  const outcome = choice ? choice.outcome : scenario.timeout.outcome;
  const lesson = choice ? choice.lesson : scenario.timeout.lesson;
  const remember = rememberLine(entry.effects);
  const company = game.active ? getCompany(game.active) : null;

  useHotkeys((e) => {
    if (e.key === 'Enter' && (e.target as HTMLElement | null)?.tagName !== 'BUTTON') actions.finishScenario();
  });

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="dossier p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[10px] tracking-[0.25em] text-amber-300/80 uppercase">Debrief</div>
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{ color: verdict.color, background: `${verdict.color}1a`, border: `1px solid ${verdict.color}55` }}
          >
            {verdict.emoji} {verdict.label}
          </span>
        </div>

        <div className="mt-3 flex gap-3">
          <Avatar emoji={SACHIN.avatar} size={36} ring="rgba(232,121,249,0.5)" />
          <div className="min-w-0">
            <div className="text-[10.5px] font-bold tracking-widest text-fuchsia-300 uppercase">
              Sachin{choice && <span style={{ color: TONE_COLOR[choice.tone] }}> · {choice.tone}</span>}
            </div>
            <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--text)]">{choice ? choice.text : '*says nothing*'}</p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-white/[0.08] bg-black/30 p-3 text-[13px] leading-relaxed text-amber-50/90">
          <span className="text-amber-300">OUTCOME ▸ </span>
          <Typewriter text={outcome} speed={10} />
        </div>
        {remember && <p className="mt-3 text-[12px] text-[var(--muted)] italic">◆ {remember}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card p-4">
          <div className="eyebrow mb-3">Relationship impact</div>
          <MetersGrid meters={game.meters} deltas={entry.effects} />
        </div>
        <div className="card card-accent p-4" data-accent="emerald">
          <div className="eyebrow" style={{ color: 'var(--a)' }}>
            Real-world takeaway
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text)]">{lesson}</p>
          {entry.verdict !== 'best' && best && (
            <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/25 p-3">
              <div className="text-[10.5px] font-bold tracking-wide text-emerald-300 uppercase">The right call</div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--muted)]">“{best.text}”</p>
            </div>
          )}
        </div>
      </div>

      <Btn onClick={actions.finishScenario} className="w-full py-4">
        <Mail className="h-4 w-4" /> New mail — the {company?.name ?? 'interview'} result is in
      </Btn>
    </motion.section>
  );
};

/* ------------------------------------------------------------------ *
 * Briefing and decision
 * ------------------------------------------------------------------ */

const Mission: React.FC<Props & { scenario: Scenario }> = ({ game, actions, scenario }) => {
  const decided = game.scenarioLog.some((e) => e.scenarioId === scenario.id);
  const [briefed, setBriefed] = useState(decided);
  const [shown, setShown] = useState(decided ? scenario.dialogue.length : 0);
  const [skip, setSkip] = useState(decided);
  const ready = skip || (briefed && shown >= scenario.dialogue.length);

  const choose = (c: ScenarioChoice | null) => actions.decide(scenario, c);

  const left = useCountdown(DECISION_SECONDS, ready && !decided, scenario.id, () => choose(null));

  useHotkeys((e) => {
    if (!ready || decided) return;
    const i = ['1', '2', '3', '4'].indexOf(e.key);
    if (i >= 0 && scenario.choices[i]) choose(scenario.choices[i]);
  });

  const inScene = [...new Set(scenario.dialogue.map((d) => d.who))] as CastId[];

  return (
    <div className="space-y-4">
      <section className="dossier p-4 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] tracking-[0.25em] text-amber-300/80 uppercase">Meanwhile at {CURRENT_EMPLOYER}</div>
            <h2 className="mt-1 text-lg font-bold tracking-wider text-amber-100 md:text-2xl">{scenario.codename}</h2>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
              <Radio className="h-3.5 w-3.5 animate-pulse text-rose-400" /> {scenario.location}
            </div>
          </div>
          <span className="stamp text-[10px]">CLASSIFIED</span>
        </div>

        <div className="mt-4 rounded-lg border border-amber-300/15 bg-black/30 p-3 text-[12.5px] leading-relaxed text-amber-50/90">
          <span className="text-amber-300">BRIEFING ▸ </span>
          <Typewriter text={scenario.briefing} speed={10} skip={skip} onDone={() => setBriefed(true)} />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {inScene.map((id) => (
            <div key={id} className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/25 py-1 pr-3 pl-1">
              <Avatar emoji={CAST[id].avatar} size={26} ring={`${CAST[id].color}66`} />
              <span className="text-[11px] font-bold" style={{ color: CAST[id].color }}>
                {CAST[id].name}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-3.5">
          {scenario.dialogue.map((d, i) => {
            if (!skip && (!briefed || i > shown)) return null;
            const p = CAST[d.who];
            const typing = !skip && i === shown;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex gap-3 ${d.aside ? 'opacity-80' : ''}`}
              >
                <Avatar emoji={p.avatar} size={36} ring={`${p.color}77`} />
                <div className="min-w-0 flex-1">
                  <div className="text-[10.5px] font-bold tracking-widest uppercase" style={{ color: p.color }}>
                    {p.name} <span className="font-semibold tracking-normal text-[var(--dim)] normal-case">· {p.role}</span>
                  </div>
                  <p className={`mt-0.5 text-[13px] leading-relaxed ${d.aside ? 'text-[var(--muted)] italic' : 'text-[var(--text)]'}`}>
                    {typing ? (
                      <Typewriter
                        text={d.line}
                        speed={14}
                        onDone={() => setTimeout(() => setShown((s) => Math.max(s, i + 1)), 380)}
                      />
                    ) : (
                      d.line
                    )}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {!ready && (
          <div className="mt-4 text-right">
            <Tappable onClick={() => setSkip(true)} className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-amber-200/70 hover:text-amber-100">
              Skip ▸▸
            </Tappable>
          </div>
        )}
      </section>

      {ready && !decided && (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="dossier p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12.5px] font-bold text-amber-200">{scenario.prompt}</div>
            <div className={`text-[12px] font-bold tabular ${left <= 8 ? 'text-rose-300' : 'text-[var(--muted)]'}`}>{left}s</div>
          </div>
          <div className="mt-2">
            <TimerBar left={left} total={DECISION_SECONDS} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2.5">
            {scenario.choices.map((c, i) => (
              <Tappable
                key={c.id}
                onClick={() => choose(c)}
                className="flex w-full items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-left transition-colors hover:border-amber-300/40 hover:bg-amber-300/[0.06]"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-amber-300/30 text-[11px] font-bold text-amber-200">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: TONE_COLOR[c.tone] }}>
                    {c.tone}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-[var(--text)]">{c.text}</span>
                </span>
              </Tappable>
            ))}
          </div>
          <p className="mt-3 text-[10.5px] text-[var(--dim)]">
            If the clock runs out, Sachin freezes — and silence is an answer too. Keys 1–4.
          </p>
        </motion.section>
      )}

      {!decided && (
        <div className="card p-4">
          <div className="eyebrow mb-3">Sachin’s standing at the office</div>
          <MetersGrid meters={game.meters} />
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */

export const ScenarioScreen: React.FC<Props> = ({ game, actions }) => {
  const scenario = currentScenario(game);

  if (!scenario) {
    return (
      <div className="mx-auto max-w-xl p-6 text-center">
        <p className="text-[13px] text-[var(--muted)]">A quiet day at the office. Nothing to report.</p>
        <Btn onClick={actions.finishScenario} className="mx-auto mt-4">
          <Mail className="h-4 w-4" /> Check mail
        </Btn>
      </div>
    );
  }

  const decided = game.scenarioLog.some((e) => e.scenarioId === scenario.id);

  return (
    <div className="mx-auto max-w-4xl p-4 pb-10 md:p-7">
      {decided ? (
        <Debrief key={`${scenario.id}-debrief`} game={game} actions={actions} scenario={scenario} />
      ) : (
        <Mission key={scenario.id} game={game} actions={actions} scenario={scenario} />
      )}
    </div>
  );
};
