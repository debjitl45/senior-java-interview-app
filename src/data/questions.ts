/**
 * Public data facade.
 *
 * The bank is split per-domain under ./bank so no single file becomes
 * unmaintainable, but everything the UI needs is re-exported from here.
 * Existing imports of `../data/questions` keep working unchanged.
 */
import type { Category, CodeDefect, Difficulty, Question, Track } from './types';
import { CATEGORIES as RAW_CATEGORIES } from './categories';
import { DIFFICULTY_ORDER, XP_BY_DIFFICULTY } from './types';
import { TRACKS } from './tracks';
import { CODE_DEFECTS as BASE_CODE_DEFECTS } from './defects';
import { MORE_CODE_DEFECTS } from './defects-more';

import { JVM_QUESTIONS } from './bank/jvm';
import { CONCURRENCY_QUESTIONS } from './bank/concurrency';
import { COLLECTIONS_QUESTIONS } from './bank/collections';
import { STREAMS_QUESTIONS } from './bank/streams';
import { MODERN_QUESTIONS } from './bank/modern';
import { SPRING_QUESTIONS } from './bank/spring';
import { PERSISTENCE_QUESTIONS } from './bank/persistence';
import { ARCHITECTURE_QUESTIONS } from './bank/architecture';
import { TESTING_QUESTIONS } from './bank/testing';
import { SECURITY_QUESTIONS } from './bank/security';
import { PROFILING_QUESTIONS } from './bank/profiling';
import { JVM_MORE_QUESTIONS } from './bank/more/jvm';
import { CONCURRENCY_MORE_QUESTIONS } from './bank/more/concurrency';
import { COLLECTIONS_MORE_QUESTIONS } from './bank/more/collections';
import { STREAMS_MORE_QUESTIONS } from './bank/more/streams';
import { MODERN_MORE_QUESTIONS } from './bank/more/modern';
import { SPRING_MORE_QUESTIONS } from './bank/more/spring';
import { PERSISTENCE_MORE_QUESTIONS } from './bank/more/persistence';
import { ARCHITECTURE_MORE_QUESTIONS } from './bank/more/architecture';
import { TESTING_MORE_QUESTIONS } from './bank/more/testing';
import { SECURITY_MORE_QUESTIONS } from './bank/more/security';
import { PROFILING_MORE_QUESTIONS } from './bank/more/profiling';

export type { Category, CodeDefect, Difficulty, Question, Track, AccentKey } from './types';
export { XP_BY_DIFFICULTY, DIFFICULTY_ORDER } from './types';
export { TRACKS } from './tracks';

export const QUESTIONS: Question[] = [
  ...JVM_QUESTIONS,
  ...JVM_MORE_QUESTIONS,
  ...CONCURRENCY_QUESTIONS,
  ...CONCURRENCY_MORE_QUESTIONS,
  ...COLLECTIONS_QUESTIONS,
  ...COLLECTIONS_MORE_QUESTIONS,
  ...STREAMS_QUESTIONS,
  ...STREAMS_MORE_QUESTIONS,
  ...MODERN_QUESTIONS,
  ...MODERN_MORE_QUESTIONS,
  ...SPRING_QUESTIONS,
  ...SPRING_MORE_QUESTIONS,
  ...PERSISTENCE_QUESTIONS,
  ...PERSISTENCE_MORE_QUESTIONS,
  ...ARCHITECTURE_QUESTIONS,
  ...ARCHITECTURE_MORE_QUESTIONS,
  ...TESTING_QUESTIONS,
  ...TESTING_MORE_QUESTIONS,
  ...SECURITY_QUESTIONS,
  ...SECURITY_MORE_QUESTIONS,
  ...PROFILING_QUESTIONS,
  ...PROFILING_MORE_QUESTIONS,
];

/** Categories with `questionCount` derived from the real bank, never hand-maintained. */
export const CATEGORIES: Category[] = RAW_CATEGORIES.map((c) => ({
  ...c,
  questionCount: QUESTIONS.filter((q) => q.categoryId === c.id).length,
}));

/** Every spot-the-bug exercise, ordered from Core to Expert so the picker ramps up. */
export const CODE_DEFECTS: CodeDefect[] = [...BASE_CODE_DEFECTS, ...MORE_CODE_DEFECTS].sort(
  (a, b) => DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty),
);

export const TOTAL_QUESTIONS = QUESTIONS.length;

export const TOTAL_XP = QUESTIONS.reduce((sum, q) => sum + XP_BY_DIFFICULTY[q.difficulty], 0);

const QUESTIONS_BY_ID: Record<string, Question> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q]),
);

export const getQuestionById = (id: string): Question | undefined => QUESTIONS_BY_ID[id];

export const getCategoryById = (id: string): Category | undefined =>
  CATEGORIES.find((c) => c.id === id);

export const getQuestionXp = (q: Question): number => XP_BY_DIFFICULTY[q.difficulty];

/** Resolve a track to its concrete question list. */
export const getTrackQuestions = (track: Track): Question[] =>
  QUESTIONS.filter((q) => {
    if (track.categoryIds && !track.categoryIds.includes(q.categoryId)) return false;
    if (track.difficulties && !track.difficulties.includes(q.difficulty)) return false;
    if (track.tags && !track.tags.some((t) => q.tags.includes(t))) return false;
    return true;
  });

export const getTrackById = (id: string): Track | undefined => TRACKS.find((t) => t.id === id);

export const countByDifficulty = (difficulty: Difficulty): number =>
  QUESTIONS.filter((q) => q.difficulty === difficulty).length;
