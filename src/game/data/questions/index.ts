import type { McqQuestion } from '../../types';
import { CORE_CS_QUESTIONS } from './core-cs';
import { FUNDAMENTALS_QUESTIONS } from './fundamentals';
import { BACKEND_QUESTIONS } from './backend';
import { LALA_QUESTIONS } from './lala';
import { JAVA_QUESTIONS } from './java';
import { CONCURRENCY_QUESTIONS } from './concurrency';
import { DSA_QUESTIONS } from './dsa';
import { DESIGN_QUESTIONS } from './design';
import { DB_QUESTIONS } from './db';
import { WEB_CLOUD_QUESTIONS } from './web-cloud';
import { FINANCE_QUESTIONS } from './finance';
import { BASICS_QUESTIONS } from './basics';

/** Every technical question; companies draw from it by topic and difficulty. */
export const QUESTION_POOL: McqQuestion[] = [
  ...CORE_CS_QUESTIONS,
  ...FUNDAMENTALS_QUESTIONS,
  ...BACKEND_QUESTIONS,
  ...LALA_QUESTIONS,
  ...JAVA_QUESTIONS,
  ...CONCURRENCY_QUESTIONS,
  ...DSA_QUESTIONS,
  ...DESIGN_QUESTIONS,
  ...DB_QUESTIONS,
  ...WEB_CLOUD_QUESTIONS,
  ...FINANCE_QUESTIONS,
  ...BASICS_QUESTIONS,
];

const BY_ID: Record<string, McqQuestion> = Object.fromEntries(QUESTION_POOL.map((q) => [q.id, q]));

export const getQuestion = (id: string): McqQuestion | undefined => BY_ID[id];
