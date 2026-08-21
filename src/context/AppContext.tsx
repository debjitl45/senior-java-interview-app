import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  CATEGORIES,
  QUESTIONS,
  TOTAL_QUESTIONS,
  TOTAL_XP,
  XP_BY_DIFFICULTY,
  getQuestionById,
} from '../data/questions';
import { ACHIEVEMENTS, rankFor, type Achievement, type Rank } from '../theme';

export type FlashcardRating = 'Again' | 'Hard' | 'Good' | 'Easy';

export interface InterviewRecord {
  id: string;
  date: string;
  score: number;
  preset: string;
  totalQuestions: number;
}

interface AppState {
  savedQuestions: string[];
  completedQuestions: string[];
  solvedDefects: string[];
  flashcardRatings: Record<string, FlashcardRating>;
  streak: number;
  bestStreak: number;
  lastActiveDate: string;
  interviewHistory: InterviewRecord[];
  voiceEnabled: boolean;
  /** Questions the user aims to master each day. */
  dailyGoal: number;
  /** date -> number of questions mastered that day, for the goal ring. */
  dailyProgress: Record<string, number>;
  /** Level the user has already been congratulated for, so we only celebrate once. */
  celebratedLevel: number;
}

export interface Stats {
  xp: number;
  totalXp: number;
  level: number;
  rank: Rank;
  nextRank: Rank | null;
  levelProgress: number;
  mastered: number;
  total: number;
  saved: number;
  streak: number;
  bestStreak: number;
  todayCount: number;
  dailyGoal: number;
  readiness: number;
  defectsSolved: number;
}

interface AppContextType {
  state: AppState;
  stats: Stats;
  achievements: { achievement: Achievement; unlocked: boolean }[];
  toggleSaveQuestion: (id: string) => void;
  toggleCompleteQuestion: (id: string) => boolean;
  isSaved: (id: string) => boolean;
  isCompleted: (id: string) => boolean;
  markDefectSolved: (id: string) => void;
  rateFlashcard: (id: string, rating: FlashcardRating) => void;
  saveInterview: (record: Omit<InterviewRecord, 'id' | 'date'>) => void;
  toggleVoice: () => void;
  setDailyGoal: (n: number) => void;
  acknowledgeLevel: (level: number) => void;
  resetProgress: () => void;
  categoryProgress: (categoryId: string) => { done: number; total: number; pct: number };
  getReadinessScore: () => number;
}

const today = () => new Date().toISOString().split('T')[0];

const initialState: AppState = {
  savedQuestions: [],
  completedQuestions: [],
  solvedDefects: [],
  flashcardRatings: {},
  streak: 1,
  bestStreak: 1,
  lastActiveDate: today(),
  interviewHistory: [],
  voiceEnabled: true,
  dailyGoal: 5,
  dailyProgress: {},
  celebratedLevel: 1,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'JavaMaster_AppState_v2';
const LEGACY_KEY = 'JavaMasterPro_AppState_v1';

const daysBetween = (a: string, b: string) => {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / 86_400_000);
};

const load = (): AppState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return initialState;

    const parsed = JSON.parse(raw) as Partial<AppState>;
    const t = today();

    let streak = parsed.streak ?? 1;
    if (parsed.lastActiveDate) {
      const gap = daysBetween(parsed.lastActiveDate, t);
      if (gap === 1) streak += 1;
      else if (gap > 1) streak = 1;
    }

    return {
      ...initialState,
      ...parsed,
      streak,
      bestStreak: Math.max(parsed.bestStreak ?? 1, streak),
      lastActiveDate: t,
    };
  } catch {
    return initialState;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage can be unavailable (private mode); progress is best-effort */
    }
  }, [state]);

  const toggleSaveQuestion = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      savedQuestions: prev.savedQuestions.includes(id)
        ? prev.savedQuestions.filter((q) => q !== id)
        : [...prev.savedQuestions, id],
    }));
  }, []);

  /** Returns true when the question was just marked as mastered (for celebration effects). */
  const toggleCompleteQuestion = useCallback((id: string) => {
    let becameComplete = false;
    setState((prev) => {
      const has = prev.completedQuestions.includes(id);
      becameComplete = !has;
      const t = today();
      const delta = has ? -1 : 1;
      return {
        ...prev,
        completedQuestions: has
          ? prev.completedQuestions.filter((q) => q !== id)
          : [...prev.completedQuestions, id],
        dailyProgress: {
          ...prev.dailyProgress,
          [t]: Math.max(0, (prev.dailyProgress[t] ?? 0) + delta),
        },
      };
    });
    return becameComplete;
  }, []);

  const markDefectSolved = useCallback((id: string) => {
    setState((prev) =>
      prev.solvedDefects.includes(id)
        ? prev
        : { ...prev, solvedDefects: [...prev.solvedDefects, id] },
    );
  }, []);

  const rateFlashcard = useCallback((id: string, rating: FlashcardRating) => {
    setState((prev) => {
      const learned = rating === 'Good' || rating === 'Easy';
      const alreadyDone = prev.completedQuestions.includes(id);
      const t = today();
      return {
        ...prev,
        flashcardRatings: { ...prev.flashcardRatings, [id]: rating },
        completedQuestions:
          learned && !alreadyDone ? [...prev.completedQuestions, id] : prev.completedQuestions,
        dailyProgress:
          learned && !alreadyDone
            ? { ...prev.dailyProgress, [t]: (prev.dailyProgress[t] ?? 0) + 1 }
            : prev.dailyProgress,
      };
    });
  }, []);

  const saveInterview = useCallback((record: Omit<InterviewRecord, 'id' | 'date'>) => {
    setState((prev) => ({
      ...prev,
      interviewHistory: [
        {
          ...record,
          id: `int_${Date.now()}`,
          date: new Date().toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        },
        ...prev.interviewHistory,
      ].slice(0, 50),
    }));
  }, []);

  const toggleVoice = useCallback(() => {
    setState((prev) => ({ ...prev, voiceEnabled: !prev.voiceEnabled }));
  }, []);

  const setDailyGoal = useCallback((n: number) => {
    setState((prev) => ({ ...prev, dailyGoal: Math.max(1, Math.min(50, n)) }));
  }, []);

  const acknowledgeLevel = useCallback((level: number) => {
    setState((prev) => (prev.celebratedLevel >= level ? prev : { ...prev, celebratedLevel: level }));
  }, []);

  const resetProgress = useCallback(() => {
    if (window.confirm('Reset all progress? Your XP, streak and bookmarks will be erased.')) {
      setState({ ...initialState, lastActiveDate: today() });
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_KEY);
    }
  }, []);

  const stats: Stats = useMemo(() => {
    const xp = state.completedQuestions.reduce((sum, id) => {
      const q = getQuestionById(id);
      return q ? sum + XP_BY_DIFFICULTY[q.difficulty] : sum;
    }, 0);

    const { rank, next, progress } = rankFor(xp);

    const masteryWeight = (state.completedQuestions.length / TOTAL_QUESTIONS) * 55;

    const ratings = Object.values(state.flashcardRatings);
    const recallWeight = ratings.length
      ? (ratings.reduce(
          (acc, r) => acc + (r === 'Easy' ? 3 : r === 'Good' ? 2 : r === 'Hard' ? 1 : 0),
          0,
        ) /
          (ratings.length * 3)) *
        20
      : 0;

    const mockWeight = state.interviewHistory.length
      ? (state.interviewHistory.reduce((a, r) => a + r.score, 0) /
          state.interviewHistory.length /
          100) *
        25
      : 0;

    return {
      xp,
      totalXp: TOTAL_XP,
      level: rank.level,
      rank,
      nextRank: next,
      levelProgress: progress,
      mastered: state.completedQuestions.length,
      total: TOTAL_QUESTIONS,
      saved: state.savedQuestions.length,
      streak: state.streak,
      bestStreak: state.bestStreak,
      todayCount: state.dailyProgress[today()] ?? 0,
      dailyGoal: state.dailyGoal,
      readiness: Math.min(100, Math.round(masteryWeight + recallWeight + mockWeight)),
      defectsSolved: state.solvedDefects.length,
    };
  }, [state]);

  const achievements = useMemo(() => {
    const done = new Set(state.completedQuestions);
    const masterTier = QUESTIONS.filter((q) => q.difficulty === 'Master' && done.has(q.id)).length;
    const clearedDomain = CATEGORIES.some((c) => {
      const inCat = QUESTIONS.filter((q) => q.categoryId === c.id);
      return inCat.length > 0 && inCat.every((q) => done.has(q.id));
    });
    const bestMock = state.interviewHistory.reduce((m, r) => Math.max(m, r.score), 0);

    const unlockedIds = new Set<string>();
    if (done.size >= 1) unlockedIds.add('first-blood');
    if (done.size >= 10) unlockedIds.add('ten-down');
    if (done.size >= 50) unlockedIds.add('fifty-down');
    if (done.size >= 100) unlockedIds.add('century');
    if (state.bestStreak >= 3) unlockedIds.add('streak-3');
    if (state.bestStreak >= 7) unlockedIds.add('streak-7');
    if (state.bestStreak >= 30) unlockedIds.add('streak-30');
    if (clearedDomain) unlockedIds.add('domain-clear');
    if (masterTier >= 5) unlockedIds.add('boss-slayer');
    if (state.interviewHistory.length >= 1) unlockedIds.add('mock-ready');
    if (bestMock >= 80) unlockedIds.add('sharp-shooter');
    if (state.solvedDefects.length >= 5) unlockedIds.add('bug-hunter');

    return ACHIEVEMENTS.map((a) => ({ achievement: a, unlocked: unlockedIds.has(a.id) }));
  }, [state]);

  const categoryProgress = useCallback(
    (categoryId: string) => {
      const inCat = QUESTIONS.filter((q) => q.categoryId === categoryId);
      const done = inCat.filter((q) => state.completedQuestions.includes(q.id)).length;
      return {
        done,
        total: inCat.length,
        pct: inCat.length ? Math.round((done / inCat.length) * 100) : 0,
      };
    },
    [state.completedQuestions],
  );

  const isSaved = useCallback(
    (id: string) => state.savedQuestions.includes(id),
    [state.savedQuestions],
  );
  const isCompleted = useCallback(
    (id: string) => state.completedQuestions.includes(id),
    [state.completedQuestions],
  );

  const value: AppContextType = {
    state,
    stats,
    achievements,
    toggleSaveQuestion,
    toggleCompleteQuestion,
    isSaved,
    isCompleted,
    markDefectSolved,
    rateFlashcard,
    saveInterview,
    toggleVoice,
    setDailyGoal,
    acknowledgeLevel,
    resetProgress,
    categoryProgress,
    getReadinessScore: () => stats.readiness,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};
