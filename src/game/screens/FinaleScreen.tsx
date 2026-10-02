import React from 'react';
import { motion } from 'framer-motion';
import { Check, Home, RotateCcw } from 'lucide-react';
import { COMPANY_IDS, type CompanyId, type GameState } from '../types';
import { getCompany } from '../data/companies';
import { getScenario } from '../data/scenarios';
import { CURRENT_EMPLOYER, SACHIN } from '../data/cast';
import {
  PASS_MARK,
  ROUND_LENGTH,
  TONE_COLOR,
  VERDICT_META,
  correctCount,
  gotOffer,
  isCorrect,
  packageFor,
  personaFor,
} from '../engine';
import { Avatar, Btn, CompanyMark, MetersGrid, StatsList } from '../kit';
import type { GameActions } from '../useGame';
import { SectionHeader, Tappable } from '../../components/ui';

const NO_OFFER_EPILOGUE =
  'Zero offers this season — and that’s okay. Sachin grinds the JavaMaster question bank for 30 days, fixes his weak spots, and the next season of interviews goes very differently. Every rejection is a free mock interview.';

const Epilogue: React.FC<{ company: CompanyId | null }> = ({ company }) => (
  <motion.div
    key={company ?? 'none'}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="mt-4 flex gap-3 rounded-2xl border border-white/[0.08] bg-black/25 p-4"
  >
    <Avatar emoji={SACHIN.avatar} size={40} ring="rgba(232,121,249,0.5)" />
    <div>
      <div className="eyebrow">Epilogue · one year later</div>
      <p className="mt-1 text-[13px] leading-relaxed text-[var(--text)]">
        {company ? getCompany(company).epilogue : NO_OFFER_EPILOGUE}
      </p>
    </div>
  </motion.div>
);

const Tile: React.FC<{ label: string; value: React.ReactNode; sub: string }> = ({ label, value, sub }) => (
  <div className="rounded-2xl border border-white/[0.08] bg-black/25 p-3 text-center">
    <div className="eyebrow">{label}</div>
    <div className="font-display mt-1 text-2xl leading-none font-black text-white tabular">{value}</div>
    <div className="mt-1 text-[10.5px] text-[var(--dim)]">{sub}</div>
  </div>
);

interface Props {
  game: GameState;
  actions: GameActions;
  onNewGame: () => void;
  onExit: () => void;
}

export const FinaleScreen: React.FC<Props> = ({ game, actions, onNewGame, onExit }) => {
  const order = game.completed;
  const offers = order.filter((c) => gotOffer(game.runs[c]));
  const totalCorrect = order.reduce((n, c) => n + correctCount(game.runs[c]), 0);
  const accuracy = order.length ? Math.round((totalCorrect / (order.length * ROUND_LENGTH)) * 100) : 0;
  const rightCalls = game.scenarioLog.filter((e) => e.verdict === 'best').length;
  const persona = personaFor(game);
  const accepted = game.acceptedOffer && game.acceptedOffer !== 'none' ? game.acceptedOffer : null;

  return (
    <div className="mx-auto max-w-4xl space-y-7 p-4 pb-12 md:p-7">
      {/* ---------------- Hero ---------------- */}
      <section className="card ring-brand relative overflow-hidden p-6 text-center md:p-8" data-accent="fuchsia">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="relative">
          <div className="eyebrow">Season finale</div>
          <h2 className="font-display text-brand mt-1 text-3xl font-black md:text-4xl">Sachin’s report card</h2>
          <div className="float mx-auto mt-5 w-fit text-6xl" aria-hidden>
            {persona.emoji}
          </div>
          <div className="mt-3 text-[10.5px] font-bold tracking-widest text-[var(--dim)] uppercase">Corporate persona</div>
          <h3 className="font-display text-2xl font-bold text-white">{persona.title}</h3>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-[var(--muted)]">{persona.blurb}</p>

          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Tile label="Offers" value={`${offers.length}/${COMPANY_IDS.length}`} sub={`needed ${PASS_MARK}/${ROUND_LENGTH} each`} />
            <Tile label="Accuracy" value={`${accuracy}%`} sub={`${totalCorrect} of ${order.length * ROUND_LENGTH} correct`} />
            <Tile label="Right calls" value={`${rightCalls}/${game.scenarioLog.length}`} sub="office dilemmas" />
            <Tile label="Sanity" value={game.meters.sanity} sub="out of 100" />
          </div>
        </div>
      </section>

      {/* ---------------- Interviews ---------------- */}
      <section>
        <SectionHeader title="Interview performance" hint="In the order Sachin played them · each bar is one question, warm-up to boss" />
        <div className="space-y-2.5">
          {order.map((c, idx) => {
            const co = getCompany(c);
            const run = game.runs[c]!;
            const n = correctCount(run);
            const ok = n >= PASS_MARK;
            return (
              <div key={c} className="card p-4" data-accent={co.accent}>
                <div className="flex items-center gap-3">
                  <CompanyMark id={c} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-bold text-white">{co.name}</div>
                    <div className="truncate text-[11px] text-[var(--dim)]">
                      Round {idx + 1} · {co.kind}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl leading-none font-black text-white tabular">
                      {n}
                      <span className="text-sm text-[var(--dim)]">/{ROUND_LENGTH}</span>
                    </div>
                    <div className={`mt-1 text-[10.5px] font-bold ${ok ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {ok ? `Offer · ${packageFor(c, n)}` : 'Rejected'}
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-10 gap-1" aria-hidden>
                  {run.answers.map((_, i) => (
                    <span key={i} className={`h-2 rounded-full ${isCorrect(run, i) ? 'bg-emerald-400' : 'bg-rose-400/80'}`} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- Decisions ---------------- */}
      <section>
        <SectionHeader
          title={`Corporate decisions · ${rightCalls}/${game.scenarioLog.length} right calls`}
          hint={`What Sachin did at ${CURRENT_EMPLOYER}, and what to do in real life`}
        />
        <div className="space-y-2.5">
          {game.scenarioLog.map((e) => {
            const s = getScenario(e.scenarioId);
            if (!s) return null;
            const choice = s.choices.find((c) => c.id === e.choiceId);
            const bestChoice = s.choices.find((c) => c.verdict === 'best');
            const v = VERDICT_META[e.verdict];
            return (
              <div key={e.scenarioId} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-[12px] font-bold text-amber-200">{s.codename}</div>
                    <div className="text-[10.5px] text-[var(--dim)]">after the {getCompany(e.company).name} interview</div>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                    style={{ color: v.color, background: `${v.color}1a`, border: `1px solid ${v.color}55` }}
                  >
                    {v.emoji} {v.label}
                  </span>
                </div>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-[var(--muted)]">
                  <span className="font-bold" style={{ color: choice ? TONE_COLOR[choice.tone] : '#94a3b8' }}>
                    {choice ? choice.tone : 'Froze'}:
                  </span>{' '}
                  {choice ? choice.text : 'Sachin said nothing and the moment passed.'}
                </p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--text)]">
                  <span className="font-bold text-emerald-300">Lesson: </span>
                  {choice ? choice.lesson : s.timeout.lesson}
                </p>
                {e.verdict !== 'best' && bestChoice && (
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--muted)]">
                    <span className="font-bold text-emerald-300">Right call: </span>“{bestChoice.text}”
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- Relationships ---------------- */}
      <section className="card p-4">
        <div className="eyebrow mb-3">Where Sachin stands at {CURRENT_EMPLOYER}</div>
        <MetersGrid meters={game.meters} />
      </section>

      {/* ---------------- The decision ---------------- */}
      <section className="card p-5" data-accent="emerald">
        {offers.length ? (
          <>
            <h3 className="font-display text-lg font-bold text-white">Which offer does Sachin accept?</h3>
            <p className="mt-1 text-[12.5px] text-[var(--muted)]">
              Weigh the package against the culture — the biggest number isn’t always the best deal.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {offers.map((c) => {
                const co = getCompany(c);
                const chosen = accepted === c;
                return (
                  <Tappable
                    key={c}
                    onClick={() => actions.acceptOffer(c)}
                    aria-pressed={chosen}
                    className={`rounded-2xl border p-3.5 text-left transition-colors ${
                      chosen ? 'border-emerald-400/50 bg-emerald-400/10' : 'border-white/[0.09] bg-white/[0.03] hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CompanyMark id={c} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-bold text-white">{co.name}</div>
                        <div className="text-[11.5px] font-bold text-emerald-300">{packageFor(c, correctCount(game.runs[c]))}</div>
                      </div>
                      {chosen && (
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-400 text-black">
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <StatsList stats={co.stats} />
                    </div>
                  </Tappable>
                );
              })}
            </div>
            {accepted && <Epilogue company={accepted} />}
          </>
        ) : (
          <>
            <h3 className="font-display text-lg font-bold text-white">No offers this season</h3>
            <Epilogue company={null} />
          </>
        )}
      </section>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Btn variant="ghost" onClick={onExit}>
          <Home className="h-4 w-4" /> Back to JavaMaster
        </Btn>
        <Btn onClick={onNewGame}>
          <RotateCcw className="h-4 w-4" /> Play again
        </Btn>
      </div>
    </div>
  );
};
