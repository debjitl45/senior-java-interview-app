/**
 * Core domain types for the JavaMaster question bank.
 * Difficulty now spans a full ramp so 2-YOE devs and Staff candidates
 * can both find a level that stretches them.
 */

export type Difficulty = 'Core' | 'Solid' | 'Hard' | 'Expert' | 'Master';

export type AccentKey =
  | 'violet'
  | 'amber'
  | 'cyan'
  | 'emerald'
  | 'fuchsia'
  | 'lime'
  | 'sky'
  | 'indigo'
  | 'rose'
  | 'orange'
  | 'teal';

export interface Question {
  id: string;
  title: string;
  categoryId: string;
  difficulty: Difficulty;
  tags: string[];
  scenario: string;
  question: string;
  idealAnswer: string;
  codeSnippet?: string;
  pitfalls: string[];
  followUpQuestions: string[];
  faangFocus: string;
}

export interface Category {
  id: string;
  name: string;
  /** Compact label used in filter pills and tight mobile chrome. */
  shortName: string;
  emoji: string;
  description: string;
  /** lucide-react icon name, resolved via the icon registry. */
  icon: string;
  accent: AccentKey;
  /** Populated at module load from the real question bank. */
  questionCount: number;
}

export interface CodeDefect {
  id: string;
  title: string;
  categoryId: string;
  difficulty: 'Core' | 'Solid' | 'Hard' | 'Expert';
  code: string;
  defectDescription: string;
  fixedCode: string;
  explanation: string;
}

/** A curated study path stitched across categories. */
export interface Track {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  accent: AccentKey;
  categoryIds?: string[];
  difficulties?: Difficulty[];
  tags?: string[];
}

/** XP awarded for mastering a question at each rung of the ladder. */
export const XP_BY_DIFFICULTY: Record<Difficulty, number> = {
  Core: 10,
  Solid: 20,
  Hard: 35,
  Expert: 55,
  Master: 80,
};

export const DIFFICULTY_ORDER: Difficulty[] = ['Core', 'Solid', 'Hard', 'Expert', 'Master'];
