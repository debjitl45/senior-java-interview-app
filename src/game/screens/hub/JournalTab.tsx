import React from 'react';
import type { GameState, StatKey } from '../../types';
import { getCompany } from '../../data/companies';
import { getScenario } from '../../data/scenarios';
import { STATS } from '../../data/cast';
import { SEASON_WEEKS } from '../../engine';
import { VERDICT_META, signed } from '../../ui-meta';
import { CompanyMark } from '../../kit';

const JOURNEY: StatKey[] = ['skill', 'charisma', 'energy', 'sanity', 'reputation', 'network'];

export const JournalTab: React.FC<{ game: GameState }> = ({ game }) => {
  const start = game.history.statLog[0] ?? game.stats;
  const decisions = game.history.decisions;
  const right = decisions.filter((d) => d.verdict === 'best').length;
  const offers = game.mails.filter((m) => m.kind === 'offer').length;

  const weeks = [...new Set([...game.history.interviews.map((i) => i.week), ...decisions.map((d) => d.week), ...game.history.recaps.map((r) => r.week)])].sort(
    (a, b) => b - a,
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: 'Interviews', value: game.history.interviews.length, sub: 'attended' },
          { label: 'Offers', value: offers, sub: 'received' },
          { label: 'Right calls', value: `${right}/${decisions.length}`, sub: 'office dilemmas' },
          { label: 'Weeks left', value: Math.max(0, SEASON_WEEKS - game.week + 1), sub: `of ${SEASON_WEEKS}` },
        ].map((t) => (
          <div key={t.label} className="card p-3 text-center">
            <div className="eyebrow">{t.label}</div>
            <div className="font-display mt-1 text-2xl leading-none font-black text-white tabular">{t.value}</div>
            <div className="mt-1 text-[10.5px] text-[var(--dim)]">{t.sub}</div>
          </div>
        ))}
      </div>

      <section className="card p-4">
        <div className="eyebrow mb-3">Stat journey since week 1</div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
          {JOURNEY.map((k) => {
            const d = game.stats[k] - start[k];
            return (
              <div key={k} className="flex items-center justify-between text-[12px]">
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
            );
          })}
        </div>
      </section>

      <section>
        <div className="eyebrow mb-2">Timeline</div>
        {weeks.length === 0 && <p className="text-[12px] text-[var(--dim)]">Nothing yet. Your first week is just getting started.</p>}
        <ol className="space-y-3">
          {weeks.map((w) => {
            const recap = game.history.recaps.find((r) => r.week === w);
            return (
              <li key={w} className="card p-3.5">
                <div className="mb-2 text-[11px] font-black tracking-widest text-[var(--dim)] uppercase">Week {w}</div>
                <div className="space-y-1.5 text-[12px]">
                  {game.history.interviews
                    .filter((i) => i.week === w)
                    .map((i, idx) => (
                      <div key={`i${idx}`} className="flex items-center gap-2">
                        <CompanyMark id={i.company} size={20} />
                        <span className="text-white">
                          Interviewed at {getCompany(i.company).name} — {i.correct}/10
                        </span>
                        <span className={i.revealed ? (i.passed ? 'text-emerald-300' : 'text-rose-300') : 'text-[var(--dim)]'}>
                          {i.revealed ? (i.passed ? 'offer' : 'rejected') : 'result pending'}
                        </span>
                      </div>
                    ))}
                  {decisions
                    .filter((d) => d.week === w)
                    .map((d) => {
                      const s = getScenario(d.scenarioId);
                      const v = VERDICT_META[d.verdict];
                      return (
                        <div key={d.scenarioId} className="flex items-center gap-2">
                          <span aria-hidden>{v.emoji}</span>
                          <span className="font-mono text-[11px] text-amber-200">{s?.codename.replace('OPERATION: ', '')}</span>
                          <span className="text-[var(--dim)]">· {d.tone ?? 'froze'}</span>
                        </div>
                      );
                    })}
                  {recap?.lines.map((l, idx) => (
                    <div key={`r${idx}`} className="text-[var(--muted)]">
                      {l.emoji} {l.text}
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
};
