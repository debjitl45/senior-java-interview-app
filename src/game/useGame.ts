import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ActivityId, BackgroundId, CompanyId, GameState, LifelineUse, PerkId } from './types';
import {
  answerHr,
  answerQuestion,
  applyTo,
  beginSeason,
  beginTech,
  buyoutNotice,
  choosePerk,
  createGame,
  decideScenario,
  doActivity,
  endWeek,
  finishInterview,
  finishRecap,
  finishScenario,
  leaveReaction,
  newSeed,
  readMail,
  respondToOffer,
  seeded,
  spendLifeline,
  startInterview,
  takeOpportunity,
  toHrRound,
  type ActionResult,
  type OfferResponse,
  type Rng,
} from './engine';

/** Season 2 save slot. Separate from the main app, so a reset never touches study progress. */
export const SAVE_KEY = 'JavaMaster_InterviewRPG_v2';
/** Season 1 saves can't be loaded into the new game; they're cleared on the first new game. */
const LEGACY_KEY = 'JavaMaster_InterviewRPG_v1';

interface SaveFile {
  v: 2;
  savedAt: number;
  game: GameState;
}

const isGame = (g: unknown): g is GameState => {
  const s = g as GameState | null;
  return !!s && s.version === 2 && typeof s.week === 'number' && Array.isArray(s.mails) && !!s.stats;
};

export const readSave = (): SaveFile | null => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveFile;
    return isGame(parsed?.game) ? parsed : null;
  } catch {
    return null;
  }
};

/** Returns the save time, or null when storage is unavailable (private mode, quota). */
const writeSave = (game: GameState): number | null => {
  const savedAt = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 2, savedAt, game } satisfies SaveFile));
    return savedAt;
  } catch {
    return null;
  }
};

const removeKey = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage unavailable — nothing to clear */
  }
};

/** Cheap summary for the dashboard's call-to-action. */
export const peekSave = (): { week: number; finished: boolean } | null => {
  const s = readSave();
  return s ? { week: s.game.week, finished: s.game.phase === 'ending' } : null;
};

type Step = (g: GameState, rng: Rng) => ActionResult | GameState;

export const useGame = (onNote: (text: string, tone?: ActionResult['tone']) => void) => {
  const [initial] = useState(readSave);
  const [game, setGame] = useState<GameState | null>(initial?.game ?? null);
  const [savedAt, setSavedAt] = useState<number | null>(initial?.savedAt ?? null);

  // Actions read the latest state through a ref so quick successive clicks never use a stale copy.
  const gameRef = useRef(game);
  const noteRef = useRef(onNote);
  useEffect(() => {
    noteRef.current = onNote;
  });

  // Autosave every change. Skipping the object we just loaded keeps "last saved" honest.
  useEffect(() => {
    if (!game || game === initial?.game) return;
    const at = writeSave(game);
    if (at) setSavedAt(at);
  }, [game, initial]);

  const commit = useCallback((next: GameState | null) => {
    gameRef.current = next;
    setGame(next);
  }, []);

  /** Runs one engine step with fresh randomness and surfaces its note as a toast. */
  const run = useCallback(
    (step: Step): ActionResult | null => {
      const g = gameRef.current;
      if (!g) return null;
      const out = step(g, seeded(newSeed()));
      const res: ActionResult = 'version' in out ? { g: out } : out;
      if (res.g !== g) commit(res.g);
      if (res.note) noteRef.current(res.note, res.tone);
      return res;
    },
    [commit],
  );

  const saveNow = useCallback((): boolean => {
    const g = gameRef.current;
    if (!g) return false;
    const at = writeSave(g);
    if (at) setSavedAt(at);
    return at !== null;
  }, []);

  const newGame = useCallback(() => {
    removeKey(LEGACY_KEY);
    commit(createGame(seeded(newSeed())));
  }, [commit]);

  const deleteSave = useCallback(() => {
    removeKey(SAVE_KEY);
    removeKey(LEGACY_KEY);
    commit(null);
    setSavedAt(null);
  }, [commit]);

  const actions = useMemo(
    () => ({
      chooseBackground: (bg: BackgroundId) => run((g, rng) => beginSeason(g, bg, rng)),
      readMail: (id: string) => run((g) => readMail(g, id)),
      doActivity: (id: ActivityId) => run((g, rng) => doActivity(g, id, rng)),
      takeOpportunity: (id: string) => run((g, rng) => takeOpportunity(g, id, rng)),
      applyTo: (id: CompanyId) => run((g) => applyTo(g, id)),
      pickPerk: (perk: PerkId) => run((g, rng) => choosePerk(g, perk, rng)),
      startInterview: (mailId: string) => run((g, rng) => startInterview(g, mailId, rng)),
      beginTech: () => run((g) => beginTech(g)),
      spendLifeline: (use: LifelineUse) => run((g) => spendLifeline(g, use)),
      answer: (index: number, choice: number | null) => run((g) => answerQuestion(g, index, choice)),
      toHr: () => run((g) => toHrRound(g)),
      answerHr: (index: number, choiceId: string) => run((g) => answerHr(g, index, choiceId)),
      finishInterview: () => run((g, rng) => finishInterview(g, rng)),
      leaveReaction: () => run((g) => leaveReaction(g)),
      respondOffer: (mailId: string, action: OfferResponse) => run((g, rng) => respondToOffer(g, mailId, action, rng)),
      buyout: () => run((g) => buyoutNotice(g)),
      endWeek: () => run((g, rng) => endWeek(g, rng)),
      decide: (scenarioId: string, choiceId: string | null) => run((g, rng) => decideScenario(g, scenarioId, choiceId, rng)),
      finishScenario: () => run((g, rng) => finishScenario(g, rng)),
      finishRecap: () => run((g) => finishRecap(g)),
    }),
    [run],
  );

  return { game, savedAt, saveNow, newGame, deleteSave, actions };
};

export type GameActions = ReturnType<typeof useGame>['actions'];
