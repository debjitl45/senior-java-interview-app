import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarCheck, Lock, Radio } from 'lucide-react';
import type { CastId, GameState, Scenario, StatEffects, StatKey } from '../types';
import { getScenario, CATEGORY_META } from '../data/scenarios';
import { getCompany } from '../data/companies';
import { CAST, CURRENT_EMPLOYER, SACHIN, STATS, STAT_ORDER } from '../data/cast';
import { DECISION_SECONDS, SEASON_WEEKS, checkEnding, meetsGate, monthOf, romanceActive } from '../engine';
import { VERDICT_META, TONE_COLOR, quoted } from '../ui-meta';
import { Avatar, Btn, DeltaChips, StatGrid, TimerBar, Typewriter, useCountdown, useHotkeys } from '../kit';
import type { GameActions } from '../useGame';
import { Tappable } from '../../components/ui';

interface Props {
  game: GameState;
  actions: GameActions;
}

const DECISION_XP = { best: 30, okay: 15, bad: 5, timeout: 0 } as const;

/** Telltale-style "X will remember that" for the biggest swing of a decision. */
const rememberLine = (effects: StatEffects): string | null => {
  const [top] = (Object.keys(effects) as StatKey[])
    .filter((k) => k !== 'money' && effects[k])
    .sort((a, b) => Math.abs(effects[b] ?? 0) - Math.abs(effects[a] ?? 0));
  return top && Math.abs(effects[top] ?? 0) >= 5 ? `${STATS[top].who} will remember that.` : null;
};

const statKeys = (game: GameState, effects?: StatEffects): StatKey[] =>
  STAT_ORDER.filter((k) => k !== 'romance' || romanceActive(game) || !!effects?.romance);

/* ------------------------------------------------------------------ *
 * Debrief — what happened, what it cost, what to do in real life
 * ------------------------------------------------------------------ */

const Debrief: React.FC<Props & { scenario: Scenario }> = ({ game, actions, scenario }) => {
  const entry = game.history.decisions.find((d) => d.scenarioId === scenario.id)!;
  const choice = scenario.choices.find((c) => c.id === entry.choiceId) ?? null;
  const best = scenario.choices.find((c) => c.verdict === 'best' && !c.requires) ?? scenario.choices.find((c) => c.verdict === 'best');
  const verdict = VERDICT_META[entry.verdict];
  const outcome = choice ? choice.outcome : scenario.timeout.outcome;
  const lesson = choice ? choice.lesson : scenario.timeout.lesson;
  const remember = rememberLine(entry.effects);

  useHotkeys((e) => {
    if (e.key === 'Enter' && (e.target as HTMLElement | null)?.tagName !== 'BUTTON') actions.finishScenario();
  });

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="dossier p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[10px] tracking-[0.25em] text-amber-300/80 uppercase">Debrief · {scenario.codename}</div>
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
            <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--text)]">{choice ? choice.text : '*freezes and says nothing*'}</p>
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
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="eyebrow">What it did to Sachin</div>
            <span className="rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-200">+{DECISION_XP[entry.verdict]} XP</span>
          </div>
          <StatGrid stats={game.stats} keys={statKeys(game, entry.effects)} deltas={entry.effects} />
          {entry.effects.money ? <DeltaChips effects={{ money: entry.effects.money }} className="mt-3" /> : null}
        </div>
        <div className="card card-accent p-4" data-accent="emerald">
          <div className="eyebrow" style={{ color: 'var(--a)' }}>
            Real-world takeaway
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text)]">{lesson}</p>
          {entry.verdict !== 'best' && best && (
            <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/25 p-3">
              <div className="text-[10.5px] font-bold tracking-wide text-emerald-300 uppercase">The right call</div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--muted)]">{quoted(best.text)}</p>
            </div>
          )}
        </div>
      </div>

      <Btn onClick={actions.finishScenario} className="w-full py-4">
        <CalendarCheck className="h-4 w-4" /> Wrap up week {game.week}
      </Btn>
    </motion.section>
  );
};

/* ------------------------------------------------------------------ *
 * Briefing and decision
 * ------------------------------------------------------------------ */

const Mission: React.FC<Props & { scenario: Scenario }> = ({ game, actions, scenario }) => {
  const [briefed, setBriefed] = useState(false);
  const [shown, setShown] = useState(0);
  const [skip, setSkip] = useState(false);
  const ready = skip || (briefed && shown >= scenario.dialogue.length);
  const cat = CATEGORY_META[scenario.category];

  const choose = (choiceId: string | null) => actions.decide(scenario.id, choiceId);

  const left = useCountdown(DECISION_SECONDS, ready, scenario.id, () => choose(null));

  useHotkeys((e) => {
    if (!ready) {
      if (e.key === 'Enter' && (e.target as HTMLElement | null)?.tagName !== 'BUTTON') setSkip(true);
      return;
    }
    const c = scenario.choices[['1', '2', '3', '4', '5'].indexOf(e.key)];
    if (c && meetsGate(game, c.requires)) choose(c.id);
  });

  const inScene = [...new Set(scenario.dialogue.map((d) => d.who))] as CastId[];

  return (
    <div className="space-y-4">
      <section className="dossier p-4 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] tracking-[0.25em] text-amber-300/80 uppercase">
              {cat.emoji} {cat.label} · {CURRENT_EMPLOYER}
            </div>
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

        <div className="mt-4 flex flex-wrap gap-2">
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
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className={`flex gap-3 ${d.aside ? 'opacity-80' : ''}`}>
                <Avatar emoji={p.avatar} size={36} ring={`${p.color}77`} />
                <div className="min-w-0 flex-1">
                  <div className="text-[10.5px] font-bold tracking-widest uppercase" style={{ color: p.color }}>
                    {p.name} <span className="font-semibold tracking-normal text-[var(--dim)] normal-case">· {p.role}</span>
                  </div>
                  <p className={`mt-0.5 text-[13px] leading-relaxed ${d.aside ? 'text-[var(--muted)] italic' : 'text-[var(--text)]'}`}>
                    {typing ? <Typewriter text={d.line} speed={14} onDone={() => setTimeout(() => setShown((s) => Math.max(s, i + 1)), 380)} /> : d.line}
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

      {ready && (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="dossier p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12.5px] font-bold text-amber-200">{scenario.prompt}</div>
            <div className={`text-[12px] font-bold tabular ${left <= 8 ? 'text-rose-300' : 'text-[var(--muted)]'}`}>{left}s</div>
          </div>
          <div className="mt-2">
            <TimerBar left={left} total={DECISION_SECONDS} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2.5">
            {scenario.choices.map((c, i) => {
              const unlocked = meetsGate(game, c.requires);
              const gate = c.requires;
              return (
                <Tappable
                  key={c.id}
                  onClick={() => unlocked && choose(c.id)}
                  disabled={!unlocked}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                    unlocked
                      ? gate
                        ? 'border-violet-400/40 bg-violet-400/[0.07] hover:bg-violet-400/[0.13]'
                        : 'border-white/[0.08] bg-white/[0.03] hover:border-amber-300/40 hover:bg-amber-300/[0.06]'
                      : 'cursor-not-allowed border-white/[0.05] bg-white/[0.015] opacity-55'
                  }`}
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-amber-300/30 text-[11px] font-bold text-amber-200">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 text-[10px] font-bold tracking-[0.18em] uppercase">
                      <span style={{ color: TONE_COLOR[c.tone] }}>{c.tone}</span>
                      {gate && (
                        <span className={`flex items-center gap-1 tracking-wider ${unlocked ? 'text-violet-200' : 'text-[var(--dim)]'}`}>
                          {unlocked ? '✨' : <Lock className="h-3 w-3" />} {STATS[gate.stat].emoji} {STATS[gate.stat].short} {gate.min}
                          {!unlocked && <span className="tracking-normal normal-case"> · you have {game.stats[gate.stat]}</span>}
                        </span>
                      )}
                    </span>
                    <span className={`mt-0.5 block text-[13px] leading-relaxed ${unlocked ? 'text-[var(--text)]' : 'text-[var(--dim)]'}`}>{c.text}</span>
                  </span>
                </Tappable>
              );
            })}
          </div>
          <p className="mt-3 text-[10.5px] text-[var(--dim)]">If the clock runs out, Sachin freezes — and silence is an answer too. Keys 1–{scenario.choices.length}.</p>
        </motion.section>
      )}

      <div className="card p-4">
        <div className="eyebrow mb-3">Sachin right now</div>
        <StatGrid stats={game.stats} keys={statKeys(game)} />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * Weekly recap
 * ------------------------------------------------------------------ */

const Recap: React.FC<Props> = ({ game, actions }) => {
  const recap = game.weekend!.recap!;
  const ending = checkEnding(game);
  const interviews = game.history.interviews.filter((i) => i.week === recap.week);
  const decisions = game.history.decisions.filter((d) => d.week === recap.week);
  const levelUp = game.perkChoices.length > 0;

  useHotkeys((e) => {
    if (e.key === 'Enter' && (e.target as HTMLElement | null)?.tagName !== 'BUTTON') actions.finishRecap();
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <section className="card card-accent relative overflow-hidden p-5 md:p-6" data-accent="violet">
        <div className="pointer-events-none absolute -top-24 -right-12 h-56 w-56 rounded-full bg-[var(--a-glow)] blur-3xl" />
        <div className="relative">
          <div className="eyebrow">Weekend · {monthOf(recap.week)}</div>
          <h2 className="font-display text-3xl font-black text-white">Week {recap.week} wrapped</h2>
          <p className="mt-1 text-[12.5px] text-[var(--muted)]">
            Sachin finally shuts the laptop. {recap.week >= SEASON_WEEKS ? 'That was the final week of the season.' : `${SEASON_WEEKS - recap.week} week${SEASON_WEEKS - recap.week === 1 ? '' : 's'} left in the season.`}
          </p>
        </div>
      </section>

      {(interviews.length > 0 || decisions.length > 0) && (
        <section className="card p-4">
          <div className="eyebrow mb-2">This week</div>
          <ul className="space-y-1.5 text-[12.5px]">
            {interviews.map((r, i) => (
              <li key={`i${i}`} className="text-[var(--text)]">
                {'\u{1F454}'} Interviewed at <strong className="text-white">{getCompany(r.company).name}</strong> — {r.correct}/10, impression {r.impression}
              </li>
            ))}
            {decisions.map((d) => {
              const s = getScenario(d.scenarioId);
              const v = VERDICT_META[d.verdict];
              return (
                <li key={d.scenarioId} className="text-[var(--text)]">
                  {v.emoji} <span className="font-mono text-[11.5px] text-amber-200">{s?.codename.replace('OPERATION: ', '')}</span> —{' '}
                  <span style={{ color: v.color }}>{v.label.toLowerCase()}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="card p-4">
        <div className="eyebrow mb-2">The inbox and the weekend</div>
        {recap.lines.length ? (
          <ul className="space-y-2">
            {recap.lines.map((l, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * i }}
                className={`flex gap-2.5 rounded-xl border p-2.5 text-[12.5px] ${
                  l.tone === 'good'
                    ? 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-50'
                    : l.tone === 'bad'
                      ? 'border-rose-400/20 bg-rose-400/[0.06] text-rose-50'
                      : 'border-white/[0.07] bg-white/[0.03] text-[var(--text)]'
                }`}
              >
                <span aria-hidden>{l.emoji}</span>
                <span>{l.text}</span>
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="text-[12px] text-[var(--muted)]">A quiet week. Sometimes that’s the best kind.</p>
        )}
        {Object.keys(recap.deltas).length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[var(--dim)]">
            Weekend effects: <DeltaChips effects={recap.deltas} />
          </div>
        )}
      </section>

      <section className="card p-4">
        <div className="eyebrow mb-3">{ending ? 'Sachin right now' : `Sachin going into week ${game.week}`}</div>
        <StatGrid stats={game.stats} keys={statKeys(game)} />
      </section>

      {levelUp && !ending && (
        <p className="text-center text-[12.5px] font-bold text-amber-200">{'\u{2B06}\u{FE0F}'} Level up! Pick a new perk when the week starts.</p>
      )}

      <Btn onClick={actions.finishRecap} className="w-full py-4" variant={ending ? 'gold' : 'primary'}>
        {ending ? (
          <>Something big is happening... <ArrowRight className="h-4 w-4" /></>
        ) : (
          <>
            Start week {game.week} <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Btn>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */

export const WeekendScreen: React.FC<Props> = ({ game, actions }) => {
  const w = game.weekend;
  const scenario = w?.scenarioId ? getScenario(w.scenarioId) : undefined;
  const decided = !!scenario && game.history.decisions.some((d) => d.scenarioId === scenario.id);

  let body: React.ReactNode;
  if (w?.recap) body = <Recap game={game} actions={actions} />;
  else if (scenario && decided) body = <Debrief key={`${scenario.id}-debrief`} game={game} actions={actions} scenario={scenario} />;
  else if (scenario) body = <Mission key={scenario.id} game={game} actions={actions} scenario={scenario} />;
  else
    body = (
      <div className="card p-6 text-center">
        <p className="text-[13px] text-[var(--muted)]">A quiet day at the office. Nothing to report.</p>
        {/* Without a weekend record there is nothing to advance, so go straight back to the hub. */}
        <Btn onClick={w ? actions.finishScenario : actions.finishRecap} className="mx-auto mt-4">
          <CalendarCheck className="h-4 w-4" /> Wrap up the week
        </Btn>
      </div>
    );

  return <div className="mx-auto max-w-4xl p-4 pb-10 md:p-7">{body}</div>;
};
