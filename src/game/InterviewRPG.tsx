import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, Save, X } from 'lucide-react';
import './game.css';
import type { GameState, Phase, StatKey } from './types';
import { STATS } from './data/cast';
import { SEASON_WEEKS, formatMoney, timeAgo, type ActionResult } from './engine';
import { useGame } from './useGame';
import { Btn } from './kit';
import { Tappable } from '../components/ui';
import type { ConfirmOptions } from './screens/hub/InboxTab';
import { TitleScreen } from './screens/TitleScreen';
import { IntroScreen } from './screens/IntroScreen';
import { HubScreen } from './screens/HubScreen';
import { InterviewScreen } from './screens/InterviewScreen';
import { ReactionScreen } from './screens/ReactionScreen';
import { WeekendScreen } from './screens/WeekendScreen';
import { EndingScreen } from './screens/EndingScreen';
import { LevelUpModal } from './screens/LevelUpModal';

/* ------------------------------------------------------------------ *
 * HUD
 * ------------------------------------------------------------------ */

const PHASE_LABEL: Record<Phase, string> = {
  intro: 'Character creation',
  hub: 'Weekdays',
  interview: 'Interview day',
  reaction: 'After the interview',
  weekend: 'Weekend',
  ending: 'Season over',
};

const HUD_STATS: StatKey[] = ['energy', 'sanity', 'reputation'];

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
  const sub = game.phase === 'intro' ? PHASE_LABEL.intro : `Week ${Math.min(game.week, SEASON_WEEKS)}/${SEASON_WEEKS} · ${PHASE_LABEL[game.phase]} · Lv ${game.level}`;

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
          <div className="truncate text-[10.5px] font-semibold text-[var(--dim)]">{sub}</div>
        </button>

        {game.phase !== 'intro' && (
          <div className="hidden items-center gap-3 md:flex" aria-label="Sachin’s key stats">
            {HUD_STATS.map((k) => {
              const v = game.stats[k];
              return (
                <span key={k} title={STATS[k].label} className={`text-[11px] font-bold tabular ${v < 25 ? 'text-rose-300' : 'text-[var(--muted)]'}`}>
                  <span aria-hidden>{STATS[k].emoji}</span> {v}
                </span>
              );
            })}
            <span title={STATS.money.label} className="text-[11px] font-bold text-[var(--muted)] tabular">
              <span aria-hidden>{STATS.money.emoji}</span> {formatMoney(game.stats.money)}
            </span>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-1.5">
          <span className="hidden text-[10px] text-[var(--dim)] lg:block">{savedLabel}</span>
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
    </header>
  );
};

/* ------------------------------------------------------------------ *
 * Confirm dialog & toast
 * ------------------------------------------------------------------ */

const ConfirmDialog: React.FC<{ state: ConfirmOptions | null; onClose: () => void }> = ({ state, onClose }) => (
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
              variant={state.danger ? 'danger' : 'primary'}
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

const TOAST_RING: Record<NonNullable<ActionResult['tone']>, string> = {
  good: 'border-emerald-400/35',
  bad: 'border-rose-400/40',
  neutral: 'border-white/[0.1]',
};

/* ------------------------------------------------------------------ *
 * Root
 * ------------------------------------------------------------------ */

export const InterviewRPG: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [toast, setToast] = useState<{ id: number; text: string; tone: NonNullable<ActionResult['tone']> } | null>(null);
  const notify = useCallback((text: string, tone: ActionResult['tone'] = 'neutral') => setToast({ id: Date.now(), text, tone }), []);

  const { game, savedAt, saveNow, newGame, deleteSave, actions } = useGame(notify);
  const [onTitle, setOnTitle] = useState(true);
  const [confirm, setConfirm] = useState<ConfirmOptions | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const showTitle = onTitle || !game;
  const sceneKey =
    showTitle || !game
      ? 'title'
      : [game.phase, game.interview?.stage ?? '-', game.week, game.weekend?.recap ? 'recap' : (game.weekend?.scenarioId ?? '-'), game.history.decisions.length].join(':');

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [sceneKey]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
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
      body:
        game.phase === 'ending'
          ? 'Start a new season with a fresh Sachin. Endings you discovered stay in your gallery.'
          : `This replaces your current save (week ${Math.min(game.week, SEASON_WEEKS)}, level ${game.level}). Endings you discovered and your JavaMaster study progress are not affected.`,
      confirmLabel: 'Start fresh',
      danger: game.phase !== 'ending',
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
      danger: true,
      onConfirm: () => {
        deleteSave();
        notify('Save deleted');
      },
    });

  const save = () => (saveNow() ? notify('Progress saved \u{1F4BE}', 'good') : notify('Couldn’t save — storage is unavailable', 'bad'));

  const scene = (g: GameState) => {
    switch (g.phase) {
      case 'intro':
        return <IntroScreen game={g} actions={actions} />;
      case 'interview':
        return g.interview ? (
          <InterviewScreen game={g} actions={actions} />
        ) : (
          <div className="mx-auto max-w-md p-6 text-center">
            <p className="text-[13px] text-[var(--muted)]">This interview can’t be resumed.</p>
            <Btn onClick={actions.leaveReaction} className="mx-auto mt-4">
              Back to the week
            </Btn>
          </div>
        );
      case 'reaction':
        return <ReactionScreen game={g} actions={actions} />;
      case 'weekend':
        return <WeekendScreen game={g} actions={actions} />;
      case 'ending':
        return g.ending ? <EndingScreen game={g} onNewGame={askNewGame} onExit={onExit} /> : <HubScreen game={g} actions={actions} askConfirm={setConfirm} />;
      case 'hub':
      default:
        return <HubScreen game={g} actions={actions} askConfirm={setConfirm} />;
    }
  };

  const levelUp = !showTitle && !!game && game.phase === 'hub' && game.perkChoices.length > 0;
  // Phones show the hub's bottom bar, so toasts sit above it there.
  const toastBottom = !showTitle && game?.phase === 'hub' ? 'bottom-24 lg:bottom-6' : 'bottom-6';

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

      {!showTitle && game && <Hud game={game} savedAt={savedAt} onSave={save} onReset={askNewGame} onTitle={() => setOnTitle(true)} onExit={onExit} />}

      {/* No z-index here on purpose: screen-level modals must stack above the HUD. */}
      <div ref={scroller} className="pb-safe relative flex-1 overflow-x-hidden overflow-y-auto">
        {/* Opacity only: a transformed ancestor would break the hub's fixed bottom bar. */}
        <motion.div key={sceneKey} className="min-h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22 }}>
          {showTitle || !game ? (
            <TitleScreen game={game} savedAt={savedAt} onContinue={() => setOnTitle(false)} onNewGame={askNewGame} onDeleteSave={askDelete} onExit={onExit} />
          ) : (
            scene(game)
          )}
        </motion.div>
      </div>

      {levelUp && game && <LevelUpModal game={game} onPick={actions.pickPerk} />}

      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            className={`pointer-events-none fixed inset-x-0 z-[96] mx-auto w-fit max-w-[calc(100%-32px)] rounded-2xl border bg-black/85 px-4 py-2 text-center text-[12.5px] font-bold text-white shadow-lg backdrop-blur ${TOAST_RING[toast.tone]} ${toastBottom}`}
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
