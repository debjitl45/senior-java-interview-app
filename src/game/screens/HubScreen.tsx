import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Briefcase, Home, Inbox, type LucideIcon } from 'lucide-react';
import type { GameState } from '../types';
import { getCompany } from '../data/companies';
import { SEASON_WEEKS, apPerWeek, buyoutCost, formatMoney, formatPkg, monthOf } from '../engine';
import { Btn } from '../kit';
import type { GameActions } from '../useGame';
import { Progress, Tappable } from '../../components/ui';
import { CharacterSheet } from './hub/CharacterSheet';
import { HomeTab } from './hub/HomeTab';
import { InboxTab, type ConfirmOptions } from './hub/InboxTab';
import { JobsTab } from './hub/JobsTab';
import { JournalTab } from './hub/JournalTab';

type Tab = 'home' | 'inbox' | 'jobs' | 'journal';

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'journal', label: 'Journal', icon: BookOpen },
];

interface Props {
  game: GameState;
  actions: GameActions;
  askConfirm: (o: ConfirmOptions) => void;
}

export const HubScreen: React.FC<Props> = ({ game, actions, askConfirm }) => {
  const [tab, setTab] = useState<Tab>('home');
  const [openMail, setOpenMail] = useState<string | null>(null);
  const unread = game.mails.filter((m) => !m.read).length;
  const pips = Math.max(apPerWeek(game), game.ap);

  const openInbox = (id: string) => {
    setOpenMail(id);
    setTab('inbox');
  };

  const endWeek = () => {
    if (game.ap > 0) {
      askConfirm({
        title: `End week ${game.week}?`,
        body: `You still have ${game.ap} action point${game.ap === 1 ? '' : 's'}. Unused points don’t carry over.`,
        confirmLabel: 'End the week',
        onConfirm: actions.endWeek,
      });
    } else {
      actions.endWeek();
    }
  };

  const notice = game.notice;
  const noticeCompany = notice ? getCompany(notice.company) : null;

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 p-4 pb-24 md:p-6 lg:grid-cols-[290px_minmax(0,1fr)] lg:pb-10">
      <CharacterSheet game={game} />

      <div className="min-w-0 space-y-4">
        {/* Week bar */}
        <section className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="eyebrow">Season 2 · {monthOf(game.week)}</div>
              <div className="font-display text-2xl leading-none font-bold text-white">
                Week {game.week} <span className="text-sm text-[var(--dim)]">/ {SEASON_WEEKS}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div aria-label={`${game.ap} action points left`}>
                <div className="eyebrow mb-1 text-right">Action points</div>
                <div className="flex justify-end gap-1.5">
                  {Array.from({ length: pips }, (_, i) => (
                    <motion.span
                      key={i}
                      initial={false}
                      animate={{ scale: i < game.ap ? 1 : 0.85 }}
                      className={`grid h-7 w-7 place-items-center rounded-lg text-sm ${
                        i < game.ap ? 'bg-amber-400/20 text-amber-300 ring-1 ring-amber-300/40' : 'bg-white/[0.04] text-white/20'
                      }`}
                    >
                      ⚡
                    </motion.span>
                  ))}
                </div>
              </div>
              {/* Wrapped: Btn's own inline-flex would beat `hidden` on the button itself. */}
              <div className="hidden lg:block">
                <Btn onClick={endWeek} className="px-4 py-2.5 text-xs">
                  End week ▸
                </Btn>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <Progress value={(game.week - 1) / SEASON_WEEKS} height={5} />
          </div>

          {notice && noticeCompany && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.07] p-3">
              <p className="text-[12.5px] text-emerald-100">
                📦 Serving notice: <strong>{notice.weeksLeft}</strong> week{notice.weeksLeft === 1 ? '' : 's'} left, then you join{' '}
                <strong>{noticeCompany.name}</strong> at {formatPkg(noticeCompany, notice.pkg)}.
              </p>
              <Btn
                variant="ghost"
                onClick={() =>
                  askConfirm({
                    title: 'Buy out your notice?',
                    body: `Pay ${formatMoney(buyoutCost(game))} to skip the remaining ${notice.weeksLeft} week${notice.weeksLeft === 1 ? '' : 's'} and go straight to your ending. You have ${formatMoney(game.stats.money)}.`,
                    confirmLabel: 'Buy out',
                    onConfirm: actions.buyout,
                  })
                }
                className="px-3 py-1.5 text-xs"
              >
                Buy out · {formatMoney(buyoutCost(game))}
              </Btn>
            </div>
          )}
        </section>

        {/* Tabs */}
        <nav className="flex gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1" aria-label="Hub sections">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <Tappable
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-colors ${active ? 'text-white' : 'text-[var(--dim)] hover:text-white'}`}
              >
                {active && (
                  <motion.span layoutId="hubTab" className="absolute inset-0 rounded-xl border border-white/[0.1] bg-white/[0.07]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
                )}
                <Icon className="relative h-4 w-4" />
                <span className="relative">{t.label}</span>
                {t.id === 'inbox' && unread > 0 && (
                  <span className="relative rounded-full bg-fuchsia-500 px-1.5 text-[10px] font-black text-white tabular">{unread}</span>
                )}
              </Tappable>
            );
          })}
        </nav>

        <div key={tab} className="fade-in">
          {tab === 'home' && <HomeTab game={game} actions={actions} onOpenMail={openInbox} onJobs={() => setTab('jobs')} />}
          {tab === 'inbox' && <InboxTab game={game} actions={actions} openId={openMail} setOpenId={setOpenMail} askConfirm={askConfirm} />}
          {tab === 'jobs' && <JobsTab game={game} actions={actions} />}
          {tab === 'journal' && <JournalTab game={game} />}
        </div>
      </div>

      {/* Phones: the week can always be ended without scrolling back up. */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.08] bg-black/70 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <span className="text-[12px] font-bold text-[var(--muted)]">
            <span className="text-amber-300">⚡ {game.ap}</span> AP left · Week {game.week}
          </span>
          <Btn onClick={endWeek} className="px-5 py-2.5 text-xs">
            End week ▸
          </Btn>
        </div>
      </div>
    </div>
  );
};
