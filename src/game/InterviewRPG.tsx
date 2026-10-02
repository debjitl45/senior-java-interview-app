import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, Save, X } from 'lucide-react';
import './game.css';
import { COMPANY_IDS, type CompanyId, type GameState } from './types';
import { getCompany } from './data/companies';
import { PHASE_LABEL, companyStatus, timeAgo, type CompanyStatus } from './engine';
import { useGame } from './useGame';
import { Btn, CompanyMark } from './kit';
import { Tappable } from '../components/ui';
import { TitleScreen } from './screens/TitleScreen';
import { FactsScreen } from './screens/FactsScreen';
import { InboxScreen } from './screens/InboxScreen';
import { InterviewScreen } from './screens/InterviewScreen';
import { ReactionScreen } from './screens/ReactionScreen';
import { ScenarioScreen } from './screens/ScenarioScreen';
import { ResultScreen } from './screens/ResultScreen';
import { FinaleScreen } from './screens/FinaleScreen';

/* ------------------------------------------------------------------ *
 * HUD
 * ------------------------------------------------------------------ */

const STATUS: Record<CompanyStatus, { title: string; badge: string; mark: string }> = {
  locked: { title: 'invite not received yet', badge: '', mark: '' },
  pending: { title: 'invite waiting in the inbox', badge: 'bg-fuchsia-400', mark: '' },
  active: { title: 'interviewing now', badge: 'bg-amber-400 animate-pulse', mark: '' },
  offer: { title: 'offer received', badge: 'bg-emerald-400 text-black', mark: '✓' },
  rejected: { title: 'rejected', badge: 'bg-rose-500 text-white', mark: '✕' },
};

const CompanyChip: React.FC<{ game: GameState; id: CompanyId }> = ({ game, id }) => {
  const s = companyStatus(game, id);
  return (
    <div
      className={`relative ${s === 'locked' ? 'opacity-30 grayscale' : ''}`}
      title={`${getCompany(id).name} — ${STATUS[s].title}`}
      aria-label={`${getCompany(id).name}: ${STATUS[s].title}`}
      role="img"
    >
      <CompanyMark id={id} size={26} />
      {s !== 'locked' && (
        <span
          className={`absolute -right-1 -bottom-1 grid h-3.5 w-3.5 place-items-center rounded-full text-[8px] font-black ring-2 ring-[#0b0a16] ${STATUS[s].badge}`}
        >
          {STATUS[s].mark}
        </span>
      )}
    </div>
  );
};

const Hud: React.FC<{
  game: GameState;
  savedAt: number | null;
  onSave: () => void;
  onReset: () => void;
  onTitle: () => void;
  onExit: () => void;
}> = ({ game, savedAt, onSave, onReset, onTitle, onExit }) => {
  // Re-render twice a minute so "saved 3 min ago" stays truthful.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const savedLabel = savedAt ? `Saved ${timeAgo(savedAt)}` : 'Not saved yet';
  const chips = COMPANY_IDS.map((id) => <CompanyChip key={id} game={game} id={id} />);

  return (
    <header className="pt-safe relative z-20 shrink-0 border-b border-white/[0.07] bg-black/40 backdrop-blur-xl select-none">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 md:gap-3 md:px-5">
        <Tappable
          onClick={onExit}
          title="Exit to JavaMaster — your progress is saved"
          aria-label="Exit the game"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[0.09] bg-white/[0.04] text-[var(--muted)] hover:text-white"
        >
          <X className="h-4 w-4" />
        </Tappable>

        <button onClick={onTitle} className="min-w-0 flex-1 text-left" title="Back to the title screen">
          <div className="font-display truncate text-[13px] font-bold text-white">Sachin’s Job Hunt</div>
          <div className="truncate text-[10.5px] font-semibold text-[var(--dim)]">
            {PHASE_LABEL[game.phase]} · {game.completed.length}/{COMPANY_IDS.length} interviews
          </div>
        </button>

        <div className="hidden items-center gap-2.5 sm:flex">{chips}</div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span className="hidden text-[10px] text-[var(--dim)] md:block">{savedLabel}</span>
          <Tappable
            onClick={onSave}
            title={savedLabel}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 text-[11px] font-bold text-emerald-200 hover:bg-emerald-400/15"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Save</span>
          </Tappable>
          <Tappable
            onClick={onReset}
            title="Reset and start a new game"
            aria-label="Reset and start a new game"
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.09] bg-white/[0.04] text-[var(--muted)] hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
          </Tappable>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 pb-2 sm:hidden">
        <div className="flex items-center gap-2.5">{chips}</div>
        <span className="text-[10px] text-[var(--dim)]">{savedLabel}</span>
      </div>
    </header>
  );
};

/* ------------------------------------------------------------------ *
 * Confirm dialog & toast
 * ------------------------------------------------------------------ */

interface ConfirmState {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
}

const ConfirmDialog: React.FC<{ state: ConfirmState | null; onClose: () => void }> = ({ state, onClose }) => (
  <AnimatePresence>
    {state && (
      <motion.div
        className="fixed inset-0 z-[95] grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="rpg-confirm-title"
          aria-describedby="rpg-confirm-body"
          className="card w-full max-w-sm p-5"
          style={{ background: 'rgba(18, 16, 31, 0.98)' }}
          initial={{ scale: 0.95, y: 8 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.97, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 id="rpg-confirm-title" className="font-display text-base font-bold text-white">
            {state.title}
          </h3>
          <p id="rpg-confirm-body" className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">
            {state.body}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Btn variant="ghost" onClick={onClose} className="py-2.5 text-xs" autoFocus>
              Cancel
            </Btn>
            <Btn
              variant="danger"
              onClick={() => {
                state.onConfirm();
                onClose();
              }}
              className="py-2.5 text-xs"
            >
              {state.confirmLabel}
            </Btn>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ------------------------------------------------------------------ *
 * Root
 * ------------------------------------------------------------------ */

const NEEDS_ACTIVE = new Set<GameState['phase']>(['interview', 'reaction', 'scenario', 'result']);

export const InterviewRPG: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const { game, savedAt, saveNow, newGame, deleteSave, actions } = useGame();
  const [onTitle, setOnTitle] = useState(true);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const showTitle = onTitle || !game;
  const sceneKey = showTitle || !game ? 'title' : `${game.phase}:${game.active ?? '-'}:${game.completed.length}`;

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [sceneKey]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!confirm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirm(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirm]);

  const notify = (text: string) => setToast({ id: Date.now(), text });

  const startFresh = () => {
    newGame();
    setOnTitle(false);
  };

  const askNewGame = () => {
    if (!game) {
      startFresh();
      return;
    }
    setConfirm({
      title: 'Reset and start a new game?',
      body: `This replaces your current save (${game.completed.length}/${COMPANY_IDS.length} interviews done). Your JavaMaster study progress is not affected.`,
      confirmLabel: 'Start fresh',
      onConfirm: () => {
        startFresh();
        notify('New game started');
      },
    });
  };

  const askDelete = () =>
    setConfirm({
      title: 'Delete saved game?',
      body: 'Sachin’s progress in this game will be erased from this device. Your JavaMaster study progress is not affected.',
      confirmLabel: 'Delete save',
      onConfirm: () => {
        deleteSave();
        notify('Save deleted');
      },
    });

  const save = () => notify(saveNow() ? 'Progress saved \u{1F4BE}' : 'Couldn’t save — storage is unavailable');

  const scene = (g: GameState) => {
    if (NEEDS_ACTIVE.has(g.phase) && !(g.active && g.runs[g.active])) {
      return <InboxScreen game={g} actions={actions} />;
    }
    switch (g.phase) {
      case 'facts':
        return <FactsScreen game={g} actions={actions} />;
      case 'interview':
        return <InterviewScreen game={g} actions={actions} />;
      case 'reaction':
        return <ReactionScreen game={g} actions={actions} />;
      case 'scenario':
        return <ScenarioScreen game={g} actions={actions} />;
      case 'result':
        return <ResultScreen game={g} actions={actions} />;
      case 'finale':
        return <FinaleScreen game={g} actions={actions} onNewGame={askNewGame} onExit={onExit} />;
      case 'inbox':
      default:
        return <InboxScreen game={g} actions={actions} />;
    }
  };

  return (
    <motion.div
      className="rpg fixed inset-0 z-[80] flex flex-col overflow-hidden bg-[var(--bg)] text-[var(--text)]"
      role="dialog"
      aria-modal="true"
      aria-label="Sachin’s Job Hunt — interview RPG"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="aurora" aria-hidden />
      <div className="grain" aria-hidden />

      {!showTitle && game && (
        <Hud
          game={game}
          savedAt={savedAt}
          onSave={save}
          onReset={askNewGame}
          onTitle={() => setOnTitle(true)}
          onExit={onExit}
        />
      )}

      {/* No z-index here on purpose: screen-level modals must stack above the HUD. */}
      <div ref={scroller} className="pb-safe relative flex-1 overflow-x-hidden overflow-y-auto">
        {/* Enter-only transition: the next scene never waits on the previous one's exit. */}
        <motion.div
          key={sceneKey}
          className="min-h-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          {showTitle || !game ? (
            <TitleScreen
              game={game}
              savedAt={savedAt}
              onContinue={() => setOnTitle(false)}
              onNewGame={askNewGame}
              onDeleteSave={askDelete}
              onExit={onExit}
            />
          ) : (
            scene(game)
          )}
        </motion.div>
      </div>

      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            className="pointer-events-none fixed inset-x-0 z-[96] mx-auto w-fit rounded-full border border-white/[0.1] bg-black/85 px-4 py-2 text-[12.5px] font-bold text-white shadow-lg backdrop-blur"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
