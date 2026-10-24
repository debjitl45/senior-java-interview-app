import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Home, RotateCcw } from 'lucide-react';
import type { Ending, EndingId, GameState, StatKey } from '../types';
import { getCompany, TIER_LABEL } from '../data/companies';
import { getScenario, CATEGORY_META } from '../data/scenarios';
import { CURRENT_EMPLOYER, SACHIN, STATS } from '../data/cast';
import { ENDINGS, ENDING_IDS, ROMANCE_EPILOGUE } from '../data/endings';
import { BACKGROUNDS, PERKS } from '../data/progression';
import { PASS_MARK, ROUND_LENGTH, formatMoney, formatPkg, readGallery, unlockEnding } from '../engine';
import { TONE_COLOR, VERDICT_META, quoted, signed } from '../ui-meta';
import { Avatar, Btn, CompanyMark, CompanyWordmark } from '../kit';
import { SectionHeader, Tappable, celebrate } from '../../components/ui';

const TONE_LOOK: Record<Ending['tone'], { label: string; color: string; accent: string }> = {
  great: { label: 'Legendary ending', color: '#fbbf24', accent: 'amber' },
  good: { label: 'Good ending', color: '#34d399', accent: 'emerald' },
  mixed: { label: 'Bittersweet ending', color: '#38bdf8', accent: 'sky' },
  bad: { label: 'Game over', color: '#fb7185', accent: 'rose' },
};

const JOURNEY: StatKey[] = ['skill', 'charisma', 'energy', 'sanity', 'reputation', 'network'];

/** A week-by-week line of one stat, 0–100. */
const Spark: React.FC<{ values: number[]; color: string }> = ({ values, color }) => {
  if (values.length < 2) return null;
  const w = 120;
  const h = 28;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - (Math.max(0, Math.min(100, v)) / 100) * h).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full" preserveAspectRatio="none" aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

const Tile: React.FC<{ label: string; value: React.ReactNode; sub: string }> = ({ label, value, sub }) => (
  <div className="rounded-2xl border border-white/[0.08] bg-black/25 p-3 text-center">
    <div className="eyebrow">{label}</div>
    <div className="font-display mt-1 text-2xl leading-none font-black text-white tabular">{value}</div>
    <div className="mt-1 text-[10.5px] text-[var(--dim)]">{sub}</div>
  </div>
);

interface Props {
  game: GameState;
  onNewGame: () => void;
  onExit: () => void;
}

export const EndingScreen: React.FC<Props> = ({ game, onNewGame, onExit }) => {
  const state = game.ending!;
  const ending = ENDINGS[state.id];
  const look = TONE_LOOK[ending.tone];
  const company = state.company ? getCompany(state.company) : null;

  // Read before unlocking, so a first-time ending can say so.
  const [fresh] = useState(() => !readGallery().includes(state.id));
  const [gallery, setGallery] = useState<EndingId[]>(readGallery);
  const [allDecisions, setAllDecisions] = useState(false);

  useEffect(() => {
    setGallery(unlockEnding(state.id));
  }, [state.id]);

  useEffect(() => {
    if (fresh && (ending.tone === 'great' || ending.tone === 'good')) celebrate('big');
  }, [fresh, ending.tone]);

  const interviews = game.history.interviews;
  const decisions = game.history.decisions;
  const offers = interviews.filter((i) => i.passed).length;
  const totalCorrect = interviews.reduce((n, i) => n + i.correct, 0);
  const accuracy = interviews.length ? Math.round((totalCorrect / (interviews.length * ROUND_LENGTH)) * 100) : 0;
  const rightCalls = decisions.filter((d) => d.verdict === 'best').length;
  const weeks = Math.max(1, game.history.recaps.length);
  const log = game.history.statLog.length ? game.history.statLog : [game.stats];
  const start = log[0];
  const shownDecisions = allDecisions ? decisions : decisions.slice(0, 6);

  return (
    <div className="mx-auto max-w-4xl space-y-7 p-4 pb-12 md:p-7">
      {/* ---------------- The ending ---------------- */}
      <section className="card card-accent relative overflow-hidden p-6 text-center md:p-8" data-accent={look.accent}>
        <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[var(--a-glow)] blur-3xl" />
        <div className="relative">
          <div className="eyebrow" style={{ color: look.color }}>
            {look.label}
            {fresh ? ' · new!' : ''}
          </div>
          <motion.div
            className="mx-auto mt-4 w-fit text-7xl"
            initial={{ scale: 0.4, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            aria-hidden
          >
            {ending.emoji}
          </motion.div>
          <h2 className="font-display mt-3 text-3xl font-black text-white md:text-4xl">{ending.title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-[var(--text)]">{ending.text}</p>

          {company && state.pkg !== undefined && (
            <div className="mx-auto mt-5 flex w-fit max-w-full items-center gap-3 rounded-2xl border border-white/[0.09] bg-black/30 px-4 py-3 text-left">
              <CompanyMark id={company.id} size={44} />
              <div className="min-w-0">
                <CompanyWordmark id={company.id} className="text-lg" />
                <div className="text-[12px] font-bold text-emerald-300">
                  {formatPkg(company, state.pkg)} · {TIER_LABEL[company.tier]} tier
                </div>
              </div>
            </div>
          )}

          {state.romance && <p className="mx-auto mt-4 max-w-xl text-[13px] text-pink-200">{ROMANCE_EPILOGUE[state.romance]}</p>}

          {company && (
            <div className="mx-auto mt-5 flex max-w-xl gap-3 rounded-2xl border border-white/[0.08] bg-black/25 p-4 text-left">
              <Avatar emoji={SACHIN.avatar} size={40} ring="rgba(232,121,249,0.5)" />
              <div>
                <div className="eyebrow">Epilogue · one year later</div>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--text)]">{company.epilogue}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ---------------- Numbers ---------------- */}
      <section>
        <SectionHeader
          title="Sachin’s season in numbers"
          hint={`${game.background ? `${BACKGROUNDS[game.background].emoji} ${BACKGROUNDS[game.background].name} · ` : ''}level ${game.level}`}
        />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Tile label="Weeks" value={weeks} sub="played" />
          <Tile label="Offers" value={`${offers}/${interviews.length}`} sub={`interviews · ${PASS_MARK}/${ROUND_LENGTH} to pass`} />
          <Tile label="Accuracy" value={`${accuracy}%`} sub={`${totalCorrect} correct answers`} />
          <Tile label="Right calls" value={`${rightCalls}/${decisions.length}`} sub="office dilemmas" />
        </div>
      </section>

      {/* ---------------- Stat journey ---------------- */}
      <section className="card p-4">
        <div className="eyebrow mb-3">The stat journey · week 1 to the end</div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          {JOURNEY.map((k) => {
            const d = game.stats[k] - start[k];
            return (
              <div key={k}>
                <div className="flex items-center justify-between text-[11.5px]">
                  <span className="text-[var(--muted)]">
                    {STATS[k].emoji} {STATS[k].short}
                  </span>
                  <span className="font-bold text-white tabular">
                    {start[k]} → {game.stats[k]}{' '}
                    <span className={d > 0 ? 'text-emerald-300' : d < 0 ? 'text-rose-300' : 'text-[var(--dim)]'}>
                      ({signed(d)})
                    </span>
                  </span>
                </div>
                <Spark values={log.map((s) => s[k])} color={STATS[k].color} />
              </div>
            );
          })}
        </div>
        <div className="mt-3 border-t border-white/[0.07] pt-3 text-[12px] text-[var(--muted)]">
          {STATS.money.emoji} Savings: {formatMoney(start.money)} → <strong className="text-white">{formatMoney(game.stats.money)}</strong>
          {game.perks.length > 0 && (
            <span className="mt-2 flex flex-wrap gap-1.5">
              {game.perks.map((p) => (
                <span key={p} title={PERKS[p].desc} className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-[10.5px] font-bold text-amber-200">
                  {PERKS[p].emoji} {PERKS[p].name}
                </span>
              ))}
            </span>
          )}
        </div>
      </section>

      {/* ---------------- Interviews ---------------- */}
      <section>
        <SectionHeader title="Interview performance" hint={interviews.length ? 'Every interview, in order' : 'Sachin never sat an interview this season'} />
        <div className="space-y-2">
          {interviews.map((r, i) => {
            const co = getCompany(r.company);
            return (
              <div key={i} className="card flex items-center gap-3 p-3.5">
                <CompanyMark id={co.id} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold text-white">{co.name}</div>
                  <div className="truncate text-[10.5px] text-[var(--dim)]">
                    Week {r.week} · HR {r.hrScore}/2 · impression {r.impression}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg leading-none font-black text-white tabular">
                    {r.correct}
                    <span className="text-xs text-[var(--dim)]">/{ROUND_LENGTH}</span>
                  </div>
                  <div className={`mt-1 text-[10.5px] font-bold ${r.passed ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {r.passed && r.pkg !== undefined ? `Offer · ${formatPkg(co, r.pkg)}` : 'Rejected'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- Decisions ---------------- */}
      {decisions.length > 0 && (
        <section>
          <SectionHeader
            title={`Office decisions · ${rightCalls}/${decisions.length} right calls`}
            hint={`What Sachin did at ${CURRENT_EMPLOYER}, and what to do in real life`}
          />
          <div className="space-y-2.5">
            {shownDecisions.map((e) => {
              const s = getScenario(e.scenarioId);
              if (!s) return null;
              const choice = s.choices.find((c) => c.id === e.choiceId);
              const best = s.choices.find((c) => c.verdict === 'best' && !c.requires) ?? s.choices.find((c) => c.verdict === 'best');
              const v = VERDICT_META[e.verdict];
              return (
                <div key={e.scenarioId} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-[12px] font-bold text-amber-200">{s.codename}</div>
                      <div className="text-[10.5px] text-[var(--dim)]">
                        Week {e.week} · {CATEGORY_META[s.category].emoji} {CATEGORY_META[s.category].label}
                      </div>
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
                  {e.verdict !== 'best' && best && (
                    <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--muted)]">
                      <span className="font-bold text-emerald-300">Right call: </span>{quoted(best.text)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {decisions.length > 6 && (
            <Tappable
              onClick={() => setAllDecisions((v) => !v)}
              className="mx-auto mt-3 block rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2 text-[12px] font-bold text-[var(--text)] hover:bg-white/[0.08]"
            >
              {allDecisions ? 'Show fewer' : `Show all ${decisions.length} decisions`}
            </Tappable>
          )}
        </section>
      )}

      {/* ---------------- Gallery ---------------- */}
      <section className="card p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="eyebrow">Endings discovered</div>
          <div className="text-[11px] font-bold text-white tabular">
            {gallery.length}/{ENDING_IDS.length}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ENDING_IDS.map((id) => {
            const got = gallery.includes(id);
            const e = ENDINGS[id];
            const current = id === state.id;
            return (
              <div
                key={id}
                className={`flex items-start gap-2.5 rounded-xl border p-2.5 ${
                  current ? 'border-amber-300/40 bg-amber-300/[0.07]' : got ? 'border-white/[0.08] bg-white/[0.04]' : 'border-white/[0.05] bg-white/[0.015]'
                }`}
              >
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-lg ${got ? 'bg-white/[0.07]' : 'bg-white/[0.03] text-[12px] text-[var(--dim)]'}`} aria-hidden>
                  {got ? e.emoji : '?'}
                </span>
                <div className="min-w-0">
                  <div className={`text-[12px] font-bold ${got ? 'text-white' : 'text-[var(--dim)]'}`}>
                    {got ? e.title : 'Undiscovered'}
                    {current && <span className="ml-1.5 text-[10px] text-amber-300">← you are here</span>}
                  </div>
                  <div className="text-[10.5px] leading-snug text-[var(--dim)]">{e.hint}</div>
                </div>
              </div>
            );
          })}
        </div>
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
