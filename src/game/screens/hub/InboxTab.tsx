import React, { useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Handshake, Lightbulb, MailOpen, Play, TriangleAlert, X } from 'lucide-react';
import type { CompanyId, GameState, Mail } from '../../types';
import { getCompany } from '../../data/companies';
import { getFlavorMail, type MailTone } from '../../data/mails';
import { NOTICE_WEEKS, PASS_MARK, ROUND_LENGTH, companyRecord, formatPkg, negotiationChance } from '../../engine';
import { Avatar, Btn, CompanyMark, StatsList } from '../../kit';
import type { GameActions } from '../../useGame';
import { Letter } from '../Letter';

export interface ConfirmOptions {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
}

const TONE_CLASS: Record<MailTone, string> = {
  accent: 'text-fuchsia-200 bg-fuchsia-400/12 border-fuchsia-400/30',
  good: 'text-emerald-200 bg-emerald-400/10 border-emerald-400/30',
  bad: 'text-rose-200 bg-rose-400/10 border-rose-400/30',
  warn: 'text-amber-200 bg-amber-400/10 border-amber-400/30',
  neutral: 'text-[var(--muted)] bg-white/[0.05] border-white/[0.1]',
};

const STATUS_TAG: Record<string, { label: string; tone: MailTone }> = {
  accepted: { label: 'Accepted', tone: 'good' },
  declined: { label: 'Declined', tone: 'neutral' },
  expired: { label: 'Expired', tone: 'neutral' },
  withdrawn: { label: 'Withdrawn', tone: 'bad' },
};

interface MailMeta {
  from: string;
  email: string;
  subject: string;
  preview: string;
  tag: { label: string; tone: MailTone };
  company?: CompanyId;
  avatar?: string;
}

const metaOf = (m: Mail): MailMeta => {
  if (m.kind === 'flavor') {
    const f = getFlavorMail(m.flavorId!)!;
    return { from: f.from, email: f.email, subject: f.subject, preview: f.preview, tag: f.tag, avatar: f.avatar };
  }
  const c = getCompany(m.company!);
  const closed = m.status && m.status !== 'open' ? STATUS_TAG[m.status] : undefined;
  switch (m.kind) {
    case 'invite':
      return {
        from: c.invite.from,
        email: c.invite.email,
        subject: c.invite.subject,
        preview: c.invite.body[1] ?? '',
        tag: m.status === 'accepted' ? { label: 'Attended', tone: 'neutral' } : (closed ?? { label: m.referral ? 'Referral invite' : 'Interview', tone: 'accent' }),
        company: c.id,
      };
    case 'offer':
      return { from: c.invite.from, email: c.invite.email, subject: c.offer.subject, preview: c.offer.body[1] ?? '', tag: closed ?? { label: 'Offer', tone: 'good' }, company: c.id };
    case 'rejection':
      return { from: c.invite.from, email: c.invite.email, subject: c.rejection.subject, preview: c.rejection.body[1] ?? '', tag: { label: 'Rejected', tone: 'bad' }, company: c.id };
    default:
      return {
        from: c.invite.from,
        email: c.invite.email,
        subject: `Your application to ${c.name}`,
        preview: 'Thank you for applying. After reviewing your profile...',
        tag: { label: 'Not shortlisted', tone: 'neutral' },
        company: c.id,
      };
  }
};

const Tag: React.FC<{ label: string; tone: MailTone }> = ({ label, tone }) => (
  <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[9.5px] font-bold tracking-wide uppercase ${TONE_CLASS[tone]}`}>{label}</span>
);

const Sender: React.FC<{ meta: MailMeta; size?: number }> = ({ meta, size = 40 }) =>
  meta.company ? <CompanyMark id={meta.company} size={size} /> : <Avatar emoji={meta.avatar ?? '✉️'} size={size} />;

/* ------------------------------------------------------------------ */

const InviteBody: React.FC<{ mail: Mail; game: GameState; actions: GameActions }> = ({ mail, game, actions }) => {
  const c = getCompany(mail.company!);
  return (
    <>
      <div className="space-y-2.5 text-[13.5px] leading-relaxed text-[var(--text)]">
        {c.invite.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {c.invite.redFlags && (
        <div className="flex gap-2.5 rounded-2xl border border-rose-400/25 bg-rose-400/[0.07] p-3.5">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
          <div>
            <div className="text-[11px] font-bold tracking-wide text-rose-300 uppercase">Red-flag radar</div>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--muted)]">{c.invite.redFlags}</p>
          </div>
        </div>
      )}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2" data-accent={c.accent}>
        <div className="rounded-2xl border border-white/[0.08] bg-black/25 p-4">
          <div className="eyebrow">Company intel · GlassFloor</div>
          <div className="mt-2.5 flex items-center gap-2.5">
            <CompanyMark id={c.id} size={36} />
            <div className="min-w-0">
              <div className="font-bold text-white">{c.name}</div>
              <div className="truncate text-[11px] text-[var(--dim)]">
                {c.tier}-tier · {c.location}
              </div>
            </div>
          </div>
          <p className="mt-2.5 text-[11.5px] leading-relaxed text-[var(--muted)] italic">“{c.tagline}”</p>
          <div className="mt-3">
            <StatsList stats={c.stats} />
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-black/25 p-4">
          <div className="eyebrow">Work culture</div>
          <ul className="mt-2 space-y-1.5">
            {c.culture.map((x) => (
              <li key={x} className="flex gap-2 text-[12px] leading-relaxed text-[var(--muted)]">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--a)]" />
                {x}
              </li>
            ))}
          </ul>
          {c.reviews.map((r) => (
            <div key={r.text} className="mt-2 rounded-xl bg-white/[0.04] p-2.5">
              <div className="text-[11px] text-amber-300">
                {'★'.repeat(r.stars)}
                <span className="text-white/15">{'★'.repeat(5 - r.stars)}</span>
                <span className="ml-1.5 text-[10px] text-[var(--dim)]">{r.by}</span>
              </div>
              <p className="mt-0.5 text-[12px] text-[var(--muted)]">“{r.text}”</p>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-white/[0.08] bg-black/25 p-4">
        <div className="eyebrow">The panel</div>
        <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            { p: c.interviewer, r: 'Round 1 · Tech screen' },
            { p: c.barRaiser, r: 'Round 2 · Bar raiser' },
            { p: c.hr, r: 'Round 3 · HR' },
          ].map(({ p, r }) => (
            <div key={r} className="flex items-center gap-2">
              <Avatar emoji={p.avatar} size={32} />
              <div className="min-w-0 leading-tight">
                <div className="truncate text-[12px] font-bold text-white">{p.name}</div>
                <div className="text-[10px] text-[var(--dim)]">{r}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11.5px] text-[var(--muted)]">
          {ROUND_LENGTH} technical questions, harder every two. {PASS_MARK}/{ROUND_LENGTH} earns the offer; the HR round and the panel’s impression set the
          package. Offer range: {formatPkg(c, c.ctc[0])} – {formatPkg(c, c.ctc[1])}.
        </p>
      </section>
      {mail.status === 'open' ? (
        <div className="space-y-1.5">
          <Btn onClick={() => actions.startInterview(mail.id)} disabled={game.ap < 1 || !!game.notice} className="w-full py-4">
            <Play className="h-4 w-4" /> Attend the interview · 1 AP
          </Btn>
          <p className="text-center text-[11px] text-[var(--dim)]">
            {game.notice ? 'You’ve resigned — no more interviews.' : game.ap < 1 ? 'No action points left — the invite is still valid next week.' : `Valid until the end of week ${mail.expiresWeek}.`}
          </p>
        </div>
      ) : (
        <p className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 text-center text-[12.5px] text-[var(--muted)]">
          {mail.status === 'accepted' ? 'You attended this interview.' : mail.status === 'expired' ? 'This invite expired.' : 'Declined — you accepted another offer.'}
        </p>
      )}
    </>
  );
};

const OfferBody: React.FC<{ mail: Mail; game: GameState; actions: GameActions; askConfirm: (o: ConfirmOptions) => void }> = ({ mail, game, actions, askConfirm }) => {
  const c = getCompany(mail.company!);
  const chance = Math.round(negotiationChance(game) * 100);
  return (
    <>
      <Letter company={c.id} offer correct={mail.correct ?? PASS_MARK} pkg={mail.pkg} negotiated={mail.negotiated} />
      {mail.status === 'open' && !game.notice ? (
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Btn
              onClick={() =>
                askConfirm({
                  title: `Accept ${c.name}?`,
                  body: `You’ll resign and serve ${NOTICE_WEEKS} weeks of notice at Infinite Loop; your other open offers and invites will be declined. Your ending depends on how you finish the notice period.`,
                  confirmLabel: 'Accept & resign',
                  onConfirm: () => actions.respondOffer(mail.id, 'accept'),
                })
              }
            >
              Accept
            </Btn>
            <Btn variant="gold" onClick={() => actions.respondOffer(mail.id, 'negotiate')} disabled={!!mail.negotiated}>
              <Handshake className="h-4 w-4" /> {mail.negotiated ? 'Negotiated' : `Negotiate · ${chance}%`}
            </Btn>
            <Btn
              variant="danger"
              onClick={() =>
                askConfirm({
                  title: `Decline ${c.name}?`,
                  body: 'They won’t consider you again for a few weeks.',
                  confirmLabel: 'Decline offer',
                  danger: true,
                  onConfirm: () => actions.respondOffer(mail.id, 'decline'),
                })
              }
            >
              <X className="h-4 w-4" /> Decline
            </Btn>
          </div>
          <p className="text-center text-[11px] text-[var(--dim)]">
            Valid until the end of week {mail.expiresWeek}. Negotiation odds rise with Charisma, competing offers and the Silver Tongue perk
            {c.kind === 'lala' ? ' — but Jha ji may take offence.' : '.'}
          </p>
        </div>
      ) : (
        <p className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 text-center text-[12.5px] text-[var(--muted)]">
          {mail.status === 'accepted'
            ? `You accepted this offer. Joining after your notice period.`
            : mail.status === 'open'
              ? 'You have already accepted another offer.'
              : mail.status === 'withdrawn'
                ? 'This offer was withdrawn.'
                : mail.status === 'expired'
                  ? 'This offer expired.'
                  : 'You declined this offer.'}
        </p>
      )}
    </>
  );
};

/* ------------------------------------------------------------------ */

interface Props {
  game: GameState;
  actions: GameActions;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  askConfirm: (o: ConfirmOptions) => void;
}

export const InboxTab: React.FC<Props> = ({ game, actions, openId, setOpenId, askConfirm }) => {
  const mails = useMemo(() => [...game.mails].reverse(), [game.mails]);
  const open = mails.find((m) => m.id === openId) ?? null;
  const readerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openId) actions.readMail(openId);
    if (openId && window.matchMedia('(max-width: 1023px)').matches) readerRef.current?.scrollIntoView({ block: 'start' });
  }, [openId, actions]);

  const when = (m: Mail) => (m.week === game.week ? 'This week' : `Week ${m.week}`);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      <ul className={`card divide-y divide-white/[0.06] self-start overflow-hidden ${open ? 'hidden lg:block' : ''}`}>
        {mails.map((m) => {
          const meta = metaOf(m);
          const actionable = (m.kind === 'invite' || m.kind === 'offer') && m.status === 'open' && !game.notice;
          return (
            <li key={m.id}>
              <button
                onClick={() => setOpenId(m.id)}
                className={`flex w-full gap-3 px-3.5 py-3 text-left transition-colors hover:bg-white/[0.04] ${m.id === openId ? 'bg-white/[0.07]' : ''} ${actionable ? 'bg-fuchsia-400/[0.05]' : ''}`}
              >
                <Sender meta={meta} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`truncate text-[12.5px] ${m.read ? 'font-semibold text-[var(--muted)]' : 'font-bold text-white'}`}>{meta.from}</span>
                    <span className="shrink-0 text-[10px] text-[var(--dim)]">{when(m)}</span>
                  </div>
                  <div className={`truncate text-[12px] ${m.read ? 'text-[var(--muted)]' : 'font-semibold text-white'}`}>{meta.subject}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <Tag {...meta.tag} />
                    <span className="truncate text-[11px] text-[var(--dim)]">{actionable ? 'Action needed' : meta.preview}</span>
                  </div>
                </div>
                {!m.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-fuchsia-400" aria-label="unread" />}
              </button>
            </li>
          );
        })}
      </ul>

      <div ref={readerRef} className={`min-w-0 scroll-mt-4 ${open ? '' : 'hidden lg:block'}`}>
        {open ? (
          (() => {
            const meta = metaOf(open);
            const flavor = open.kind === 'flavor' ? getFlavorMail(open.flavorId!) : undefined;
            return (
              <article className="card fade-in overflow-hidden" key={open.id}>
                <div className="border-b border-white/[0.07] p-4 md:p-5">
                  <button onClick={() => setOpenId(null)} className="mb-3 flex items-center gap-1.5 text-[11px] font-bold text-[var(--muted)] hover:text-white lg:hidden">
                    <ArrowLeft className="h-3.5 w-3.5" /> Inbox
                  </button>
                  <h3 className="font-display text-lg leading-snug font-bold text-white">{meta.subject}</h3>
                  <div className="mt-3 flex items-center gap-2.5">
                    <Sender meta={meta} size={34} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-bold text-white">{meta.from}</div>
                      <div className="truncate text-[11px] text-[var(--dim)]">
                        &lt;{meta.email}&gt; · to me · {when(open)}
                      </div>
                    </div>
                    <Tag {...meta.tag} />
                  </div>
                </div>
                <div className="space-y-4 p-4 md:p-5">
                  {open.kind === 'invite' && <InviteBody mail={open} game={game} actions={actions} />}
                  {open.kind === 'offer' && <OfferBody mail={open} game={game} actions={actions} askConfirm={askConfirm} />}
                  {open.kind === 'rejection' && (
                    <>
                      <Letter company={open.company!} offer={false} correct={open.correct ?? 0} />
                      <p className="text-center text-[11.5px] text-[var(--dim)]">
                        {getCompany(open.company!).name} will consider you again from week {companyRecord(game, open.company!).until ?? game.week}.
                      </p>
                    </>
                  )}
                  {open.kind === 'nolist' && (
                    <div className="space-y-3 text-[13.5px] leading-relaxed text-[var(--text)]">
                      <p>Dear Sachin,</p>
                      <p>
                        Thank you for applying to {getCompany(open.company!).name}. After reviewing your profile, we will not be moving forward at this time.
                      </p>
                      <div className="flex gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] p-4 text-[12.5px] text-[var(--muted)]">
                        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                        Shortlisting odds rise with Skill (especially for dream companies) and with Network. Referrals skip the queue entirely.
                      </div>
                    </div>
                  )}
                  {flavor && (
                    <>
                      <div className="space-y-2.5 text-[13.5px] leading-relaxed text-[var(--text)]">
                        {flavor.body.map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                      </div>
                      <div className="flex gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] p-4">
                        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                        <div>
                          <div className="text-[12.5px] font-bold text-amber-200">{flavor.tipTitle}</div>
                          <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--muted)]">{flavor.tip}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </article>
            );
          })()
        ) : (
          <div className="card grid min-h-[320px] place-items-center p-8 text-center">
            <div>
              <MailOpen className="mx-auto h-8 w-8 text-[var(--dim)]" />
              <p className="mt-3 text-sm font-bold text-white">Pick a mail to read</p>
              <p className="mt-1 text-[12px] text-[var(--muted)]">Invites and offers need action. The rest hide real-world tips.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
