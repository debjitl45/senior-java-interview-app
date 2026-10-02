/**
 * Domain types for the Interview RPG ("Sachin's Job Hunt").
 *
 * The game is fully self-contained: it has its own data, its own save
 * slot in localStorage, and never touches the main app's progress.
 */
import type { AccentKey } from '../data/types';

export type CompanyId = 'googly' | 'tipro' | 'twiggy' | 'jha2';

export const COMPANY_IDS: CompanyId[] = ['googly', 'tipro', 'twiggy', 'jha2'];

/** 1-5 ratings. Toxicity is the only one where higher is worse. */
export interface CompanyStats {
  wlb: number;
  toxicity: number;
  pay: number;
  growth: number;
  security: number;
}

export interface Interviewer {
  name: string;
  title: string;
  avatar: string;
  intro: string;
  /** One flavour line per difficulty tier, said before a question of that tier. */
  tierLines: [string, string, string, string, string];
  onCorrect: string[];
  onWrong: string[];
  onTimeout: string;
}

export type ReactionBucket = 'great' | 'meh' | 'bad';

export interface Reaction {
  mood: string;
  headline: string;
  thought: string;
  /** What Sachin texts the college group right after. */
  text: string;
}

export interface Company {
  id: CompanyId;
  name: string;
  kind: string;
  tagline: string;
  accent: AccentKey;
  location: string;
  stats: CompanyStats;
  culture: string[];
  reviews: { stars: number; text: string; by: string }[];
  vibe: string[];
  interviewer: Interviewer;
  /** The KBC-style ladder: package unlocked at 1..10 correct answers. */
  ladder: string[];
  invite: {
    from: string;
    email: string;
    subject: string;
    preview: string;
    body: string[];
    redFlags?: string;
  };
  offer: {
    subject: string;
    role: string;
    body: string[];
    perks: string[];
    finePrint: string;
    signoff: string;
  };
  rejection: { subject: string; body: string[]; signoff: string };
  reactions: Record<ReactionBucket, Reaction>;
  epilogue: string;
}

export type Tier = 0 | 1 | 2 | 3 | 4;

export interface McqQuestion {
  id: string;
  tier: Tier;
  q: string;
  code?: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  why: string;
}

export type MeterKey = 'manager' | 'hr' | 'team' | 'sanity';
export type Meters = Record<MeterKey, number>;
export type Effects = Partial<Record<MeterKey, number>>;

export type Verdict = 'best' | 'okay' | 'bad' | 'timeout';

export type Tone =
  | 'Diplomatic'
  | 'Assertive'
  | 'Honest'
  | 'Strategic'
  | 'Passive'
  | 'Emotional'
  | 'Evasive'
  | 'Savage';

export type CastId = 'rakesh' | 'pooja' | 'rohit' | 'ananya' | 'vikram' | 'meera';

export interface CastMember {
  id: CastId;
  name: string;
  role: string;
  avatar: string;
  /** Text colour used for their name in dialogue. */
  color: string;
}

export interface ScenarioChoice {
  id: string;
  tone: Tone;
  text: string;
  verdict: Exclude<Verdict, 'timeout'>;
  outcome: string;
  lesson: string;
  effects: Effects;
}

export interface Scenario {
  id: string;
  /** Which beat of the story this belongs to: 0 = after the first interview. */
  slot: 0 | 1 | 2 | 3;
  codename: string;
  location: string;
  briefing: string;
  dialogue: { who: CastId; line: string; aside?: boolean }[];
  prompt: string;
  choices: ScenarioChoice[];
  timeout: { outcome: string; lesson: string; effects: Effects };
}

export interface FactCard {
  id: string;
  kind: 'fact' | 'tip';
  emoji: string;
  title: string;
  body: string;
}

export type LifelineKind = 'fifty' | 'senior' | 'poll';

/** Persisted so a reload shows the same lifeline result, not a re-roll. */
export interface LifelineUse {
  q: number;
  removed?: number[];
  pick?: number;
  poll?: number[];
}

export interface InterviewRun {
  company: CompanyId;
  questionIds: string[];
  /** Chosen option per answered question; null means the clock ran out. */
  answers: (number | null)[];
  lifelines: Partial<Record<LifelineKind, LifelineUse>>;
}

export interface ScenarioLogEntry {
  scenarioId: string;
  company: CompanyId;
  choiceId: string | null;
  verdict: Verdict;
  tone: Tone | null;
  effects: Effects;
}

export type Phase = 'facts' | 'inbox' | 'interview' | 'reaction' | 'scenario' | 'result' | 'finale';

export interface GameState {
  version: 1;
  phase: Phase;
  /** Fact/tip card ids for the opening deck. */
  facts: string[];
  /** Order in which interview invites land in the inbox. */
  mailOrder: CompanyId[];
  /** Companies whose loop (interview, scenario, result) is fully done, in play order. */
  completed: CompanyId[];
  readMails: string[];
  active: CompanyId | null;
  runs: Partial<Record<CompanyId, InterviewRun>>;
  /** One scenario id per story slot, rolled at new-game time. */
  scenarioPlan: string[];
  scenarioLog: ScenarioLogEntry[];
  meters: Meters;
  acceptedOffer: CompanyId | 'none' | null;
  startedAt: number;
}
