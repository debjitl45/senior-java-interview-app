import React from 'react';
import { Briefcase, Clock, Lightbulb, Mail, Sparkles } from 'lucide-react';
import type { GameState } from '../../types';
import { getCompany } from '../../data/companies';
import { ACTIVITIES, ACTIVITY_IDS } from '../../data/progression';
import { getOpportunity } from '../../data/opportunities';
import { FACTS } from '../../data/facts';
import { activityEffects, formatPkg, openInvites, openOffers, romanceActive } from '../../engine';
import { Btn, CompanyMark, DeltaChips } from '../../kit';
import type { GameActions } from '../../useGame';
import { Tappable } from '../../../components/ui';

const TIPS = FACTS.filter((f) => f.kind === 'tip');

const SPECIAL_HINT: Record<string, string> = {
  referral: 'Gets you a referred invite from a top company next week.',
  mock: 'Your next interview gets an extra Clarify lifeline.',
  hackathon: '35% chance to win ₹25k and +5 reputation.',
  recruiter: 'Could turn into an interview invite right away.',
};

interface Props {
  game: GameState;
  actions: GameActions;
  onOpenMail: (id: string) => void;
  onJobs: () => void;
}

export const HomeTab: React.FC<Props> = ({ game, actions, onOpenMail, onJobs }) => {
  const invites = openInvites(game);
  const offers = openOffers(game);
  const activities = ACTIVITY_IDS.filter((id) => ACTIVITIES[id].requires !== 'romance' || romanceActive(game));
  const tip = TIPS[(game.week * 7) % TIPS.length];
  const noAp = game.ap < 1;

  return (
    <div className="space-y-6">
      {/* Agenda */}
      <section>
        <h3 className="font-display mb-2.5 flex items-center gap-2 text-sm font-bold text-white">
          <Clock className="h-4 w-4 text-sky-300" /> This week’s agenda
        </h3>
        <div className="space-y-2">
          {offers.map((m) => {
            const c = getCompany(m.company!);
            return (
              <div key={m.id} className="card card-accent flex flex-wrap items-center gap-3 p-3" data-accent="emerald">
                <CompanyMark id={c.id} size={36} />
                <div className="min-w-[11rem] flex-1">
                  <div className="text-[13px] font-bold text-white">
                    Offer from {c.name} · <span className="text-emerald-300">{formatPkg(c, m.pkg!)}</span>
                  </div>
                  <div className="text-[11px] text-[var(--dim)]">Expires after week {m.expiresWeek}. Accept, negotiate or decline.</div>
                </div>
                <Btn variant="ghost" onClick={() => onOpenMail(m.id)} className="px-3 py-2 text-xs">
                  Review offer
                </Btn>
              </div>
            );
          })}
          {invites.map((m) => {
            const c = getCompany(m.company!);
            return (
              <div key={m.id} className="card flex flex-wrap items-center gap-3 p-3">
                <CompanyMark id={c.id} size={36} />
                {/* A real minimum width lets the buttons wrap underneath on phones instead of crushing the text. */}
                <div className="min-w-[11rem] flex-1">
                  <div className="text-[13px] font-bold text-white">
                    Interview invite · {c.name} {m.referral && <span className="ml-1 text-[10px] font-bold text-amber-300">🎟️ referral</span>}
                  </div>
                  <div className="text-[11px] text-[var(--dim)]">
                    {c.kind === 'lala' ? 'Owner-run' : `${c.tier}-tier ${c.kind}`} · valid until the end of week {m.expiresWeek}
                  </div>
                </div>
                <div className="flex w-full gap-1.5 sm:w-auto">
                  <Btn variant="ghost" onClick={() => onOpenMail(m.id)} className="flex-1 px-3 py-2 text-xs sm:flex-none">
                    <Mail className="h-3.5 w-3.5" /> Details
                  </Btn>
                  <Btn onClick={() => actions.startInterview(m.id)} disabled={noAp || !!game.notice} className="flex-1 px-3 py-2 text-xs sm:flex-none">
                    Attend · 1 AP
                  </Btn>
                </div>
              </div>
            );
          })}
          {game.applications.length > 0 && (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 text-[12px] text-[var(--muted)]">
              ⏳ Waiting to hear from <strong className="text-white">{game.applications.map((id) => getCompany(id).name).join(', ')}</strong> — replies land
              when the week ends.
            </div>
          )}
          {!offers.length && !invites.length && !game.applications.length && !game.notice && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-white/[0.12] p-4">
              <p className="text-[12.5px] text-[var(--muted)]">No interviews lined up. Apply on the job portal, or network so recruiters find you.</p>
              <Btn variant="ghost" onClick={onJobs} className="px-3 py-2 text-xs">
                <Briefcase className="h-3.5 w-3.5" /> Job portal
              </Btn>
            </div>
          )}
        </div>
      </section>

      {/* Activities */}
      <section>
        <div className="mb-2.5 flex items-end justify-between gap-2">
          <h3 className="font-display text-sm font-bold text-white">Spend your action points</h3>
          <span className="text-[11px] text-[var(--dim)]">1 AP each · repeatable</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
          {activities.map((id) => {
            const a = ACTIVITIES[id];
            const times = game.activities.filter((x) => x === id).length;
            return (
              <Tappable
                key={id}
                onClick={() => actions.doActivity(id)}
                disabled={noAp}
                className="card card-hover flex flex-col gap-2 p-3 text-left disabled:cursor-not-allowed disabled:opacity-45"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-2xl leading-none" aria-hidden>
                    {a.emoji}
                  </span>
                  {times > 0 && <span className="rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[9.5px] font-bold text-[var(--muted)]">×{times}</span>}
                </div>
                <div>
                  <div className="text-[12.5px] font-bold text-white">{a.name}</div>
                  <div className="mt-0.5 text-[10.5px] leading-snug text-[var(--dim)]">{a.desc}</div>
                </div>
                <DeltaChips effects={activityEffects(game, id)} />
              </Tappable>
            );
          })}
        </div>
      </section>

      {/* Low-hanging fruit */}
      <section>
        <div className="mb-2.5 flex items-end justify-between gap-2">
          <h3 className="font-display flex items-center gap-2 text-sm font-bold text-white">
            <Sparkles className="h-4 w-4 text-amber-300" /> Low-hanging fruit
          </h3>
          <span className="text-[11px] text-[var(--dim)]">Random · gone after this week</span>
        </div>
        {game.opportunities.length ? (
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {game.opportunities.map((id) => {
              const o = getOpportunity(id);
              if (!o) return null;
              const taken = game.takenOpps.includes(id);
              const effects = o.cost ? { ...o.effects, money: (o.effects.money ?? 0) - o.cost } : o.effects;
              return (
                <div key={id} className={`card flex flex-col gap-2 p-3.5 ${taken ? 'opacity-55' : 'card-accent'}`} data-accent="amber">
                  <div className="flex items-start gap-2.5">
                    <span className="text-2xl leading-none" aria-hidden>
                      {o.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-bold text-white">{o.title}</div>
                      <p className="mt-0.5 text-[11.5px] leading-relaxed text-[var(--muted)]">{o.body}</p>
                      {o.special && <p className="mt-1 text-[11px] font-semibold text-amber-200">{SPECIAL_HINT[o.special]}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <DeltaChips effects={effects} />
                    <Btn
                      variant={taken ? 'ghost' : 'gold'}
                      onClick={() => actions.takeOpportunity(id)}
                      disabled={taken || game.ap < o.ap}
                      className="px-3 py-1.5 text-xs"
                    >
                      {taken ? 'Done ✓' : `Grab it${o.ap ? ` · ${o.ap} AP` : ' · free'}`}
                    </Btn>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[12px] text-[var(--dim)]">Nothing this week. New chances appear every Monday.</p>
        )}
      </section>

      {tip && (
        <section className="card flex gap-3 p-4" data-accent="amber">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--a-line)] bg-[var(--a-soft)] text-[var(--a)]">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div>
            <div className="eyebrow">Corporate gyaan · use it IRL</div>
            <p className="mt-1 text-[13px] font-semibold text-white">
              {tip.emoji} {tip.title}
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--muted)]">{tip.body}</p>
          </div>
        </section>
      )}
    </div>
  );
};
