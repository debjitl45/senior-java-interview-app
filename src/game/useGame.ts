import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  COMPANY_IDS,
  type CompanyId,
  type GameState,
  type LifelineKind,
  type LifelineUse,
  type Scenario,
  type ScenarioChoice,
} from './types';
import { applyEffects, createGame, newRun } from './engine';

/** Separate from the main app's key, so a game reset never touches study progress. */
export const SAVE_KEY = 'JavaMaster_InterviewRPG_v1';

interface SaveFile {
  v: 1;
  savedAt: number;
  game: GameState;
}

const isGame = (g: unknown): g is GameState => {
  const s = g as GameState | null;
  return !!s && s.version === 1 && Array.isArray(s.mailOrder) && Array.isArray(s.completed);
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
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, savedAt, game } satisfies SaveFile));
    return savedAt;
  } catch {
    return null;
  }
};

const clearSave = () => {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* storage unavailable — nothing to clear */
  }
};

/** Cheap summary for the dashboard's call-to-action. */
export const peekSave = (): { completed: number; finished: boolean } | null => {
  const s = readSave();
  return s ? { completed: s.game.completed.length, finished: s.game.phase === 'finale' } : null;
};

export const useGame = () => {
  const [initial] = useState(readSave);
  const [game, setGame] = useState<GameState | null>(initial?.game ?? null);
  const [savedAt, setSavedAt] = useState<number | null>(initial?.savedAt ?? null);

  // Autosave every state change. Skipping the object we just loaded keeps
  // "last saved" honest when the game is merely opened.
  useEffect(() => {
    if (!game || game === initial?.game) return;
    const at = writeSave(game);
    if (at) setSavedAt(at);
  }, [game, initial]);

  const saveNow = useCallback((): boolean => {
    if (!game) return false;
    const at = writeSave(game);
    if (at) setSavedAt(at);
    return at !== null;
  }, [game]);

  const newGame = useCallback(() => setGame(createGame()), []);

  const deleteSave = useCallback(() => {
    clearSave();
    setGame(null);
    setSavedAt(null);
  }, []);

  const patch = useCallback(
    (fn: (g: GameState) => GameState) => setGame((prev) => (prev ? fn(prev) : prev)),
    [],
  );

  const actions = useMemo(
    () => ({
      finishFacts: () => patch((g) => ({ ...g, phase: 'inbox' })),

      readMail: (id: string) =>
        patch((g) => (g.readMails.includes(id) ? g : { ...g, readMails: [...g.readMails, id] })),

      startInterview: (c: CompanyId) => {
        const fresh = newRun(c);
        patch((g) => ({ ...g, phase: 'interview', active: c, runs: { ...g.runs, [c]: g.runs[c] ?? fresh } }));
      },

      spendLifeline: (kind: LifelineKind, use: LifelineUse) =>
        patch((g) => {
          const run = g.active ? g.runs[g.active] : undefined;
          if (!run || run.lifelines[kind]) return g;
          return {
            ...g,
            runs: { ...g.runs, [run.company]: { ...run, lifelines: { ...run.lifelines, [kind]: use } } },
          };
        }),

      /** Idempotent: only records when `index` is the next unanswered question. */
      answer: (index: number, choice: number | null) =>
        patch((g) => {
          const run = g.active ? g.runs[g.active] : undefined;
          if (!run || run.answers.length !== index) return g;
          return { ...g, runs: { ...g.runs, [run.company]: { ...run, answers: [...run.answers, choice] } } };
        }),

      finishInterview: () => patch((g) => ({ ...g, phase: 'reaction' })),

      finishReaction: () => patch((g) => ({ ...g, phase: 'scenario' })),

      /** `choice` null means the decision timer ran out. */
      decide: (scenario: Scenario, choice: ScenarioChoice | null) =>
        patch((g) => {
          if (!g.active || g.scenarioLog.some((e) => e.scenarioId === scenario.id)) return g;
          const effects = choice ? choice.effects : scenario.timeout.effects;
          return {
            ...g,
            meters: applyEffects(g.meters, effects),
            scenarioLog: [
              ...g.scenarioLog,
              {
                scenarioId: scenario.id,
                company: g.active,
                choiceId: choice?.id ?? null,
                verdict: choice?.verdict ?? 'timeout',
                tone: choice?.tone ?? null,
                effects,
              },
            ],
          };
        }),

      finishScenario: () => patch((g) => ({ ...g, phase: 'result' })),

      finishResult: () =>
        patch((g) => {
          if (!g.active) return g;
          const completed = g.completed.includes(g.active) ? g.completed : [...g.completed, g.active];
          return {
            ...g,
            completed,
            active: null,
            phase: completed.length >= COMPANY_IDS.length ? 'finale' : 'inbox',
          };
        }),

      acceptOffer: (c: CompanyId | 'none') => patch((g) => ({ ...g, acceptedOffer: c })),
    }),
    [patch],
  );

  return { game, savedAt, saveNow, newGame, deleteSave, actions };
};

export type GameActions = ReturnType<typeof useGame>['actions'];
