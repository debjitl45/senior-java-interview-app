import React from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Bug,
  Flame,
  Home,
  Layers,
  Mic,
  User,
  Volume2,
  VolumeX,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Progress, Tappable } from './ui';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  short: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Home', short: 'Home', icon: Home },
  { id: 'library', label: 'Question Library', short: 'Learn', icon: BookOpen },
  { id: 'flashcards', label: 'Flashcards', short: 'Cards', icon: Layers },
  { id: 'defects', label: 'Spot the Bug', short: 'Bugs', icon: Bug },
  { id: 'interview', label: 'Mock Interview', short: 'Mock', icon: Mic },
  { id: 'info', label: 'Profile & Data', short: 'You', icon: User },
];

const Wordmark: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <div className="flex items-center gap-2.5">
    <div className="ring-brand bg-brand grid h-9 w-9 place-items-center rounded-xl shadow-lg shadow-fuchsia-500/20">
      <span className="font-mono text-base font-black text-white">J</span>
    </div>
    <div className="leading-none">
      <h1 className="font-display text-[15px] font-bold text-white">
        Java<span className="text-brand">Master</span>
      </h1>
      {!compact && (
        <span className="mt-0.5 block text-[10px] font-semibold tracking-wide text-[var(--dim)]">
          get the offer. no cap.
        </span>
      )}
    </div>
  </div>
);

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { state, stats, toggleVoice } = useApp();

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <div className="aurora" aria-hidden />
      <div className="grain" aria-hidden />

      {/* ---------------- Desktop rail ---------------- */}
      <aside className="relative z-10 hidden w-[268px] shrink-0 flex-col border-r border-white/[0.07] bg-black/25 backdrop-blur-xl select-none md:flex">
        <div className="px-5 pt-6 pb-5">
          <Wordmark />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          <div className="eyebrow px-3 pb-2">Menu</div>
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Tappable
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive ? 'text-white' : 'text-[var(--muted)] hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="railActive"
                    className="absolute inset-0 rounded-xl border border-white/[0.1] bg-white/[0.07]"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon className={`relative h-[18px] w-[18px] ${isActive ? 'text-[var(--brand-2)]' : ''}`} />
                <span className="relative">{item.label}</span>
              </Tappable>
            );
          })}
        </nav>

        {/* Level card */}
        <div className="p-3">
          <div className="card p-4" data-accent="fuchsia">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none" aria-hidden>
                  {stats.rank.emoji}
                </span>
                <div className="leading-tight">
                  <div className="font-display text-[13px] font-bold text-white">{stats.rank.name}</div>
                  <div className="text-[10px] font-semibold text-[var(--dim)]">Level {stats.level}</div>
                </div>
              </div>
              <Tappable
                onClick={toggleVoice}
                title={state.voiceEnabled ? 'Mute question read-aloud' : 'Enable question read-aloud'}
                className="rounded-lg p-2 text-[var(--dim)] transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                {state.voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Tappable>
            </div>

            <div className="mt-3">
              <Progress value={stats.levelProgress} />
              <div className="mt-1.5 flex justify-between text-[10px] font-semibold text-[var(--dim)]">
                <span className="tabular">{stats.xp.toLocaleString()} XP</span>
                <span className="tabular">
                  {stats.nextRank ? `${stats.nextRank.xp.toLocaleString()} XP` : 'MAXED'}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5 border-t border-white/[0.07] pt-3 text-xs">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-[var(--muted)]">
                <strong className="text-white tabular">{stats.streak}</strong> day{stats.streak === 1 ? '' : 's'} in a row
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ---------------- Main ---------------- */}
      <div className="relative z-10 flex h-full flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="pt-safe flex shrink-0 items-center justify-between border-b border-white/[0.07] bg-black/30 px-4 py-3 backdrop-blur-xl select-none md:hidden">
          <Wordmark compact />

          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 rounded-full border border-white/[0.09] bg-white/[0.05] px-2.5 py-1"
              title={`Level ${stats.level} — ${stats.rank.name}`}
            >
              <span className="text-xs leading-none" aria-hidden>
                {stats.rank.emoji}
              </span>
              <span className="text-[11px] font-bold text-white tabular">Lv{stats.level}</span>
            </div>

            <div className="flex items-center gap-1 rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-1">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-[11px] font-bold text-orange-300 tabular">{stats.streak}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="pb-safe flex shrink-0 items-stretch border-t border-white/[0.07] bg-black/45 backdrop-blur-xl select-none md:hidden">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Tappable
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 ${
                  isActive ? 'text-white' : 'text-[var(--dim)]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="tabActive"
                    className="bg-brand absolute top-0 h-[3px] w-9 rounded-full"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon className="h-[19px] w-[19px]" />
                <span className="text-[9.5px] leading-none font-bold tracking-wide">{item.short}</span>
              </Tappable>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
