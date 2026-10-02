import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Inbox, Lightbulb, MailOpen, Play, TriangleAlert } from 'lucide-react';
import { COMPANY_IDS, type CompanyId, type GameState } from '../types';
import { getCompany } from '../data/companies';
import type { FlavorMail, MailTone } from '../data/mails';
import {
  PASS_MARK,
  ROUND_LENGTH,
  buildInbox,
  companyStatus,
  correctCount,
  gotOffer,
  pendingCompanies,
  type MailItem,
} from '../engine';
import { Avatar, Btn, CompanyMark, StatsList } from '../kit';
import type { GameActions } from '../useGame';
import { Letter } from './Letter';

const TONE_CLASS: Record<MailTone, string> = {
  accent: 'text-fuchsia-200 bg-fuchsia-400/12 border-fuchsia-400/30',
  good: 'text-emerald-200 bg-emerald-400/10 border-emerald-400/30',
  bad: 'text-rose-200 bg-rose-400/10 border-rose-400/30',
  warn: 'text-amber-200 bg-amber-400/10 border-amber-400/30',
  neutral: 'text-[var(--muted)] bg-white/[0.05] border-white/[0.1]',
};

const Tag: React.FC<{ label: string; tone: MailTone }> = ({ label, tone }) => (
  <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[9.5px] font-bold tracking-wide uppercase ${TONE_CLASS[tone]}`}>
    {label}
  </span>
);

const Sender: React.FC<{ mail: MailItem; size?: number }> = ({ mail, size = 40 }) =>
  mail.company ? <CompanyMark id={mail.company} size={size} /> : <Avatar emoji={mail.flavor?.avatar ?? '✉️'} size={size} />;

/* ------------------------------------------------------------------ */

const InviteBody: React.FC<{ company: CompanyId; game: GameState; onJoin: (c: CompanyId) => void }> = ({
  company,
  game,
  onJoin,
}) => {
  const co = getCompany(company);
  const status = companyStatus(game, company);
  const run = game.runs[company];

  return (
    <>
      <div className="space-y-2.5 text-[13.5px] leading-relaxed text-[var(--text)]">
        {co.invite.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {co.invite.redFlags && (
        <div className="flex gap-2.5 rounded-2xl border border-rose-400/25 bg-rose-400/[0.07] p-3.5">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
          <div>
            <div className="text-[11px] font-bold tracking-wide text-rose-300 uppercase">Red-flag radar</div>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--muted)]">{co.invite.redFlags}</p>
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2" data-accent={co.accent}>
        <div className="rounded-2xl border border-white/[0.08] bg-black/25 p-4">
          <div className="eyebrow">Company intel · GlassFloor</div>
          <div className="mt-2.5 flex items-center gap-2.5">
            <CompanyMark id={company} size={36} />
            <div className="min-w-0">
              <div className="font-bold text-white">{co.name}</div>
              <div className="truncate text-[11px] text-[var(--dim)]">
                {co.kind} · {co.location}
              </div>
            </div>
          </div>
          <p className="mt-2.5 text-[11.5px] leading-relaxed text-[var(--muted)] italic">“{co.tagline}”</p>
          <div className="mt-3">
            <StatsList stats={co.stats} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-black/25 p-4">
          <div className="eyebrow">Work culture</div>
          <ul className="mt-2 space-y-1.5">
            {co.culture.map((x) => (
              <li key={x} className="flex gap-2 text-[12px] leading-relaxed text-[var(--muted)]">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--a)]" />
                {x}
              </li>
            ))}
          </ul>
          <div className="eyebrow mt-4">Employee reviews</div>
          {co.reviews.map((r) => (
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
        <div className="eyebrow">The round</div>
        <div className="mt-2.5 flex items-center gap-3">
          <Avatar emoji={co.interviewer.avatar} size={40} />
          <div>
            <div className="text-[13px] font-bold text-white">{co.interviewer.name}</div>
            <div className="text-[11px] text-[var(--dim)]">{co.interviewer.title}</div>
          </div>
        </div>
        <ul className="mt-3 grid grid-cols-1 gap-1.5 text-[12px] text-[var(--muted)] sm:grid-cols-2">
          <li>🎯 {ROUND_LENGTH} questions, harder every two</li>
          <li>
            ✅ {PASS_MARK}/{ROUND_LENGTH} correct earns the offer
          </li>
          <li>🛟 50:50 · Phone a senior · LinkedIn poll</li>
          <li>⏱️ 45–60s clock; boss questions are untimed</li>
        </ul>
      </section>

      {status === 'pending' ? (
        <Btn onClick={() => onJoin(company)} className="w-full py-4">
          <Play className="h-4 w-4" /> Accept & join the interview
        </Btn>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5 text-center text-[12.5px] font-semibold text-[var(--muted)]">
          Interview done · {correctCount(run)}/{ROUND_LENGTH} ·{' '}
          {gotOffer(run) ? <span className="text-emerald-300">offer received 🎉</span> : <span className="text-rose-300">not selected</span>}
        </div>
      )}
    </>
  );
};

const FlavorBody: React.FC<{ mail: FlavorMail }> = ({ mail }) => (
  <>
    <div className="space-y-2.5 text-[13.5px] leading-relaxed text-[var(--text)]">
      {mail.body.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
    <div className="flex gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] p-4">
      <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
      <div>
        <div className="text-[12.5px] font-bold text-amber-200">{mail.tipTitle}</div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--muted)]">{mail.tip}</p>
      </div>
    </div>
  </>
);

/* ------------------------------------------------------------------ */

export const InboxScreen: React.FC<{ game: GameState; actions: GameActions }> = ({ game, actions }) => {
  const mails = useMemo(() => buildInbox(game), [game]);
  const pending = pendingCompanies(game);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = mails.find((m) => m.id === openId) ?? null;
  const unread = mails.filter((m) => !game.readMails.includes(m.id)).length;
  const readerRef = useRef<HTMLDivElement>(null);

  // On phones the reader replaces the list, so bring it into view.
  useEffect(() => {
    if (openId && window.matchMedia('(max-width: 1023px)').matches) {
      readerRef.current?.scrollIntoView({ block: 'start' });
    }
  }, [openId]);

  const openMail = (m: MailItem) => {
    setOpenId(m.id);
    actions.readMail(m.id);
  };

  const hint =
    pending.length > 1
      ? `${pending.length} interview invites are waiting. Pick one to begin.`
      : pending.length === 1
        ? `An interview invite from ${getCompany(pending[0]).name} is waiting.`
        : 'All caught up.';

  return (
    <div className="mx-auto max-w-6xl p-4 pb-10 md:p-7">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow">Sachin’s mailbox</div>
          <h2 className="font-display mt-1 flex items-center gap-2 text-2xl font-bold text-white">
            <Inbox className="h-6 w-6 text-fuchsia-300" /> Inbox
            {unread > 0 && (
              <span className="rounded-full bg-fuchsia-500 px-2 py-0.5 text-[11px] font-bold text-white tabular">{unread} new</span>
            )}
          </h2>
          <p className="mt-1 text-[12px] text-[var(--muted)]">{hint}</p>
        </div>
        <div className="text-[11px] font-bold text-[var(--dim)] tabular">
          Interviews done: <span className="text-white">{game.completed.length}</span>/{COMPANY_IDS.length}
        </div>
      </header>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <ul className={`card divide-y divide-white/[0.06] self-start overflow-hidden ${open ? 'hidden lg:block' : ''}`}>
          {mails.map((m) => {
            const isUnread = !game.readMails.includes(m.id);
            const waiting = m.kind === 'invite' && !!m.company && pending.includes(m.company);
            return (
              <li key={m.id}>
                <button
                  onClick={() => openMail(m)}
                  className={`flex w-full gap-3 px-3.5 py-3 text-left transition-colors hover:bg-white/[0.04] ${
                    m.id === openId ? 'bg-white/[0.07]' : ''
                  } ${waiting ? 'bg-fuchsia-400/[0.05]' : ''}`}
                >
                  <Sender mail={m} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`truncate text-[13px] ${isUnread ? 'font-bold text-white' : 'font-semibold text-[var(--muted)]'}`}>
                        {m.from}
                      </span>
                      <span className="shrink-0 text-[10px] text-[var(--dim)]">{m.time}</span>
                    </div>
                    <div className={`truncate text-[12.5px] ${isUnread ? 'font-semibold text-white' : 'text-[var(--muted)]'}`}>
                      {m.subject}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Tag {...m.tag} />
                      {waiting ? (
                        <span className="truncate text-[10.5px] font-bold text-fuchsia-300">● Tap to open the invite</span>
                      ) : (
                        <span className="truncate text-[11px] text-[var(--dim)]">{m.preview}</span>
                      )}
                    </div>
                  </div>
                  {isUnread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-fuchsia-400" aria-label="unread" />}
                </button>
              </li>
            );
          })}
        </ul>

        <div ref={readerRef} className={`scroll-mt-4 ${open ? '' : 'hidden lg:block'}`}>
          {open ? (
            <article className="card fade-in overflow-hidden" key={open.id}>
              <div className="border-b border-white/[0.07] p-4 md:p-5">
                <button
                  onClick={() => setOpenId(null)}
                  className="mb-3 flex items-center gap-1.5 text-[11px] font-bold text-[var(--muted)] hover:text-white lg:hidden"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Inbox
                </button>
                <h3 className="font-display text-lg leading-snug font-bold text-white">{open.subject}</h3>
                <div className="mt-3 flex items-center gap-2.5">
                  <Sender mail={open} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-bold text-white">{open.from}</div>
                    <div className="truncate text-[11px] text-[var(--dim)]">
                      &lt;{open.email}&gt; · to me · {open.time}
                    </div>
                  </div>
                  <Tag {...open.tag} />
                </div>
              </div>

              <div className="space-y-4 p-4 md:p-5">
                {open.kind === 'invite' && open.company && (
                  <InviteBody company={open.company} game={game} onJoin={actions.startInterview} />
                )}
                {(open.kind === 'offer' || open.kind === 'rejection') && open.company && (
                  <Letter company={open.company} correct={correctCount(game.runs[open.company])} />
                )}
                {open.kind === 'flavor' && open.flavor && <FlavorBody mail={open.flavor} />}
              </div>
            </article>
          ) : (
            <div className="card grid min-h-[320px] place-items-center p-8 text-center">
              <div>
                <MailOpen className="mx-auto h-8 w-8 text-[var(--dim)]" />
                <p className="mt-3 text-sm font-bold text-white">
                  {pending.length ? 'Open an interview invite to begin' : 'No mail selected'}
                </p>
                <p className="mt-1 text-[12px] text-[var(--muted)]">The other mails hide real-world tips — worth a read.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
