import type { CompanyId, McqQuestion } from '../../types';
import { GOOGLY_QUESTIONS } from './googly';
import { TIPRO_QUESTIONS } from './tipro';
import { TWIGGY_QUESTIONS } from './twiggy';
import { JHA2_QUESTIONS } from './jha2';

export const QUESTION_BANK: Record<CompanyId, McqQuestion[]> = {
  googly: GOOGLY_QUESTIONS,
  tipro: TIPRO_QUESTIONS,
  twiggy: TWIGGY_QUESTIONS,
  jha2: JHA2_QUESTIONS,
};

const BY_ID: Record<string, McqQuestion> = Object.fromEntries(
  Object.values(QUESTION_BANK)
    .flat()
    .map((q) => [q.id, q]),
);

export const getQuestion = (id: string): McqQuestion | undefined => BY_ID[id];
