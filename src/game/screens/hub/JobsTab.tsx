import React, { useState } from 'react';
import { Briefcase } from 'lucide-react';
import type { CompanyKind, CompanyStatus, GameState } from '../../types';
import { COMPANY_IDS, KIND_LABEL, TIER_LABEL, getCompany } from '../../data/companies';
import { MAX_APPLICATIONS, canApply, companyRecord, formatPkg, shortlistChance, statusOf } from '../../engine';
import { Btn, CompanyMark, RatingPills } from '../../kit';
import type { GameActions } from '../../useGame';
import { Chip } from '../../../components/ui';

const KINDS: (CompanyKind | 'all')[] = ['all', 'product', 'bank', 'startup', 'service', 'telecom', 'lala'];

const STATUS_LABEL: Record<Exclude<CompanyStatus, 'open'>, string> = {
  applied: '⏳ Applied — reply at week end',
  invited: '📩 Invite waiting in your inbox',
  interviewed: '🤞 Interviewed — result at week end',
  offer: '🎉 Offer in hand',
  cooldown: '',
};

const TIER_COLOR = { S: '#f0abfc', A: '#7dd3fc', B: '#86efac', C: '#fcd34d' } as const;

export const JobsTab: React.FC<{ game: GameState; actions: GameActions }> = ({ game, actions }) => {
  const [kind, setKind] = useState<CompanyKind | 'all'>('all');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const used = game.applications.length;

  const ids = COMPANY_IDS.filter((id) => (kind === 'all' || getCompany(id).kind === kind) && (!onlyOpen || statusOf(game, id) === 'open'));

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-400/12 text-sky-300">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[14px] font-bold text-white">JobKart Portal</div>
            <div className="text-[11px] text-[var(--dim)]">Applying is free. Replies arrive when the week ends.</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-xl font-bold text-white tabular">
            {used}/{MAX_APPLICATIONS}
          </div>
          <div className="text-[10px] font-bold tracking-wide text-[var(--dim)] uppercase">applications this week</div>
        </div>
      </div>

      {game.notice && (
        <p className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] p-3 text-[12.5px] text-amber-100">
          You’ve resigned and accepted {getCompany(game.notice.company).name}. The job hunt is over — enjoy the notice period.
        </p>
      )}

      <div className="no-scrollbar edge-fade -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {KINDS.map((k) => (
          <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
            {k === 'all' ? `All ${COMPANY_IDS.length}` : KIND_LABEL[k]}
          </Chip>
        ))}
        <Chip active={onlyOpen} onClick={() => setOnlyOpen((v) => !v)}>
          Open only
        </Chip>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {ids.map((id) => {
          const c = getCompany(id);
          const status = statusOf(game, id);
          const rec = companyRecord(game, id);
          const chance = Math.round(shortlistChance(game, c) * 100);
          const chanceColor = chance >= 60 ? '#34d399' : chance >= 30 ? '#fbbf24' : '#fb7185';
          return (
            <div key={id} className="card flex flex-col gap-3 p-3.5" data-accent={c.accent}>
              <div className="flex items-start gap-2.5">
                <CompanyMark id={id} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[13.5px] font-bold text-white">{c.name}</span>
                    <span
                      className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black tracking-wide uppercase"
                      style={{ color: TIER_COLOR[c.tier], background: `${TIER_COLOR[c.tier]}1f` }}
                      title={`${c.tier}-tier`}
                    >
                      {TIER_LABEL[c.tier]}
                    </span>
                  </div>
                  <div className="text-[10.5px] text-[var(--dim)]">
                    {KIND_LABEL[c.kind]} · {c.location.split('·')[0].trim()}
                  </div>
                </div>
              </div>
              <p className="line-clamp-2 text-[11.5px] leading-relaxed text-[var(--muted)] italic">“{c.tagline}”</p>
              <div className="grid grid-cols-3 gap-2 text-[10px] text-[var(--dim)]">
                <div>
                  WLB
                  <RatingPills value={c.stats.wlb} />
                </div>
                <div>
                  Toxicity
                  <RatingPills value={c.stats.toxicity} invert />
                </div>
                <div>
                  Growth
                  <RatingPills value={c.stats.growth} />
                </div>
              </div>
              <div className="text-[12px] font-bold text-emerald-300">
                {formatPkg(c, c.ctc[0])} – {formatPkg(c, c.ctc[1])} {c.payNote && <span className="font-semibold text-emerald-200/70">{c.payNote}</span>}
              </div>
              <div className="mt-auto">
                {status === 'open' && !game.notice ? (
                  <>
                    <div className="mb-1 flex justify-between text-[10.5px] font-bold">
                      <span className="text-[var(--dim)]">Shortlist chance</span>
                      <span style={{ color: chanceColor }}>{chance}%</span>
                    </div>
                    <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                      <div className="h-full rounded-full" style={{ width: `${chance}%`, background: chanceColor }} />
                    </div>
                    <Btn onClick={() => actions.applyTo(id)} disabled={!canApply(game, id)} className="w-full py-2 text-xs">
                      {used >= MAX_APPLICATIONS ? 'Application limit reached' : 'Apply'}
                    </Btn>
                  </>
                ) : (
                  <p className="rounded-xl bg-white/[0.04] px-3 py-2 text-center text-[11px] font-semibold text-[var(--muted)]">
                    {game.notice && status === 'open'
                      ? 'Job hunt over'
                      : status === 'cooldown'
                        ? `❄️ Can apply again from week ${rec.until}`
                        : STATUS_LABEL[status as Exclude<CompanyStatus, 'open'>]}
                  </p>
                )}
                {rec.interviews > 0 && <p className="mt-1.5 text-center text-[10px] text-[var(--dim)]">Interviewed here ×{rec.interviews}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
