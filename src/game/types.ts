/**
 * Domain types for the Interview RPG ("Sachin's Job Hunt").
 *
 * Season 2 turns the game into a week-by-week life sim: Sachin spends
 * action points, interviews across 26 companies, survives office
 * scenarios, and the season ends in one of many endings decided by his
 * stats. The game is self-contained and never touches study progress.
 */
import type { AccentKey } from '../data/types';

/* ------------------------------------------------------------------ *
 * Companies
 * ------------------------------------------------------------------ */

export type CompanyId =
  | 'googly'
  | 'macrosoft'
  | 'amazin'
  | 'basebook'
  | 'netflux'
  | 'pear'
  | 'envydia'
  | 'oober'
  | 'hpacket'
  | 'salesfarce'
  | 'jpmoregain'
  | 'goldmine'
  | 'mortgage'
  | 'kittibank'
  | 'barclaze'
  | 'wellscargo'
  | 'tipro'
  | 'teacs'
  | 'infosis'
  | 'accenshure'
  | 'twiggy'
  | 'flopkart'
  | 'paytym'
  | 'airtell'
  | 'jiyo'
  | 'jha2';

export type CompanyKind = 'product' | 'bank' | 'service' | 'startup' | 'telecom' | 'lala';

/** S = dream companies, C = anyone gets in. */
export type Tier = 'S' | 'A' | 'B' | 'C';

/** 1-5 ratings. Toxicity is the only one where higher is worse. */
export interface CompanyStats {
  wlb: number;
  toxicity: number;
  pay: number;
  growth: number;
  security: number;
}

export interface Persona {
  name: string;
  title: string;
  avatar: string;
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
  kind: CompanyKind;
  tier: Tier;
  tagline: string;
  accent: AccentKey;
  /** Logo tile: background, foreground and a 1-2 character glyph. */
  brand: { bg: string; fg: string; glyph: string };
  location: string;
  stats: CompanyStats;
  culture: string[];
  reviews: { stars: number; text: string; by: string }[];
  vibe: string[];
  interviewer: Persona & { intro: string; quirks: string[] };
  barRaiser: Persona & { intro: string };
  hr: Persona;
  /** Offer range in LPA (or ₹ thousands per month for payUnit 'month'), for 7..10 correct. */
  ctc: [number, number];
  payUnit: 'lpa' | 'month';
  payNote?: string;
  /** Relative weight of each question topic in this company's technical rounds. */
  topics: Partial<Record<Topic, number>>;
  invite: { from: string; email: string; subject: string; body: string[]; redFlags?: string };
  offer: { subject: string; role: string; body: string[]; perks: string[]; finePrint: string; signoff: string };
  rejection: { subject: string; body: string[]; signoff: string };
  reactions: Record<ReactionBucket, Reaction>;
  epilogue: string;
}

/* ------------------------------------------------------------------ *
 * Interview content
 * ------------------------------------------------------------------ */

export type Topic =
  | 'dsa'
  | 'java'
  | 'concurrency'
  | 'design'
  | 'db'
  | 'web'
  | 'cloud'
  | 'finance'
  | 'basics'
  | 'process'
  | 'career'
  | 'lala';

/** Question difficulty: 0 = warm-up ... 4 = boss. */
export type Difficulty = 0 | 1 | 2 | 3 | 4;

export interface McqQuestion {
  id: string;
  tier: Difficulty;
  topic: Topic;
  q: string;
  code?: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  why: string;
  /** Signature questions only show up at these companies. */
  companies?: CompanyId[];
}

export type Verdict = 'best' | 'okay' | 'bad' | 'timeout';

export interface StatGate {
  stat: StatKey;
  min: number;
}

export interface HrChoice {
  id: string;
  text: string;
  verdict: Exclude<Verdict, 'timeout'>;
  /** What the HR interviewer says back. */
  reply: string;
  requires?: StatGate;
}

export interface HrQuestion {
  id: string;
  q: string;
  choices: HrChoice[];
}

export type LifelineKind = 'fifty' | 'senior' | 'poll' | 'clarify';

/** Persisted so a reload shows the same lifeline result, not a re-roll. */
export interface LifelineUse {
  kind: LifelineKind;
  q: number;
  removed?: number[];
  pick?: number;
  poll?: number[];
}

export type BuffId = 'sharp' | 'charming' | 'exhausted' | 'anxious' | 'referred' | 'mock' | 'clutch';

export type InterviewStage = 'lobby' | 'tech' | 'hr' | 'done';

export interface InterviewSession {
  company: CompanyId;
  mailId: string;
  stage: InterviewStage;
  questionIds: string[];
  /** Chosen option per answered question; null means the clock ran out. */
  answers: (number | null)[];
  lifelines: LifelineKind[];
  used: LifelineUse[];
  buffs: BuffId[];
  impression: number;
  hrIds: string[];
  hrAnswers: string[];
}

/* ------------------------------------------------------------------ *
 * Sachin
 * ------------------------------------------------------------------ */

export type StatKey = 'skill' | 'charisma' | 'energy' | 'sanity' | 'reputation' | 'network' | 'romance' | 'money';

/** All stats are 0-100 except money, which is ₹ thousands and can go negative. */
export type Stats = Record<StatKey, number>;
export type StatEffects = Partial<Record<StatKey, number>>;

export type BackgroundId = 'topper' | 'fighter' | 'talker' | 'nepo';

export interface Background {
  id: BackgroundId;
  emoji: string;
  name: string;
  tagline: string;
  desc: string;
  stats: Stats;
}

export type PerkId =
  | 'night_owl'
  | 'zen'
  | 'chai'
  | 'monk'
  | 'silver'
  | 'connector'
  | 'hoarder'
  | 'teflon'
  | 'frugal'
  | 'clutch';

export interface Perk {
  id: PerkId;
  emoji: string;
  name: string;
  desc: string;
}

export type ActivityId = 'grind' | 'recharge' | 'network' | 'impress' | 'present' | 'date';

export interface Activity {
  id: ActivityId;
  emoji: string;
  name: string;
  desc: string;
  effects: StatEffects;
  xp: number;
  /** Flag that must be set for the activity to show (e.g. the romance arc). */
  requires?: string;
}

export type OpportunitySpecial = 'referral' | 'mock' | 'hackathon' | 'recruiter';

/** "Low-hanging fruit": cheap, random, short-lived chances to improve stats. */
export interface Opportunity {
  id: string;
  emoji: string;
  title: string;
  body: string;
  ap: number;
  /** ₹ thousands spent. */
  cost?: number;
  effects: StatEffects;
  xp: number;
  special?: OpportunitySpecial;
  minWeek?: number;
  maxWeek?: number;
  /** Never offered again once taken (bonuses and windfalls). */
  once?: boolean;
  requires?: string[];
  weight?: number;
}

export interface FactCard {
  id: string;
  kind: 'fact' | 'tip';
  emoji: string;
  title: string;
  body: string;
}

/* ------------------------------------------------------------------ *
 * Office scenarios
 * ------------------------------------------------------------------ */

export type Tone =
  | 'Diplomatic'
  | 'Assertive'
  | 'Honest'
  | 'Strategic'
  | 'Passive'
  | 'Emotional'
  | 'Evasive'
  | 'Savage';

export type CastId =
  | 'rakesh'
  | 'pooja'
  | 'rohit'
  | 'ananya'
  | 'vikram'
  | 'meera'
  | 'riya'
  | 'neha'
  | 'tanmay'
  | 'shreya'
  | 'karthik'
  | 'sam'
  | 'tanvi';

export interface CastMember {
  id: CastId;
  name: string;
  role: string;
  avatar: string;
  /** Text colour used for their name in dialogue. */
  color: string;
}

export type ScenarioCategory = 'conflict' | 'impact' | 'comms' | 'romance' | 'posh' | 'wfo' | 'politics' | 'career';

export interface ScenarioChoice {
  id: string;
  tone: Tone;
  text: string;
  verdict: Exclude<Verdict, 'timeout'>;
  outcome: string;
  lesson: string;
  effects: StatEffects;
  /** Stat-gated dialogue option, RPG style. */
  requires?: StatGate;
  setFlags?: string[];
  clearFlags?: string[];
}

export interface Scenario {
  id: string;
  category: ScenarioCategory;
  codename: string;
  location: string;
  briefing: string;
  dialogue: { who: CastId; line: string; aside?: boolean }[];
  prompt: string;
  choices: ScenarioChoice[];
  timeout: { outcome: string; lesson: string; effects: StatEffects; setFlags?: string[] };
  /* Scheduling */
  minWeek?: number;
  maxWeek?: number;
  /** Always plays on this week if still unseen. */
  forcedWeek?: number;
  requires?: string[];
  excludes?: string[];
  /** Stat thresholds: Sachin's stat must be at least / at most these values. */
  minStats?: StatEffects;
  maxStats?: StatEffects;
  weight?: number;
}

/* ------------------------------------------------------------------ *
 * Mail, jobs and history
 * ------------------------------------------------------------------ */

export type MailKind = 'invite' | 'offer' | 'rejection' | 'nolist' | 'flavor';

/** Lifecycle of invites and offers. An invite becomes "accepted" once the interview starts. */
export type OfferStatus = 'open' | 'accepted' | 'declined' | 'expired' | 'withdrawn';

export interface Mail {
  id: string;
  week: number;
  kind: MailKind;
  read: boolean;
  company?: CompanyId;
  flavorId?: string;
  /** Invites and offers lapse after this week. */
  expiresWeek?: number;
  referral?: boolean;
  correct?: number;
  /** Offered package in the company's pay unit. */
  pkg?: number;
  status?: OfferStatus;
  negotiated?: 'won' | 'lost';
}

export type CompanyStatus = 'open' | 'applied' | 'invited' | 'interviewed' | 'offer' | 'cooldown';

export interface CompanyRecord {
  status: CompanyStatus;
  /** For cooldown: the company can be applied to again from this week. */
  until?: number;
  interviews: number;
}

export interface InterviewRecord {
  company: CompanyId;
  week: number;
  correct: number;
  impression: number;
  hrScore: number;
  passed: boolean;
  /** Results land in the inbox at the end of the week. */
  revealed: boolean;
  pkg?: number;
  deltas: StatEffects;
  xp: number;
}

export interface DecisionRecord {
  scenarioId: string;
  week: number;
  choiceId: string | null;
  verdict: Verdict;
  tone: Tone | null;
  effects: StatEffects;
}

export interface RecapLine {
  emoji: string;
  text: string;
  tone?: 'good' | 'bad' | 'neutral';
}

export interface WeekRecap {
  week: number;
  lines: RecapLine[];
  deltas: StatEffects;
}

export type EndingId =
  | 'burnout'
  | 'fired'
  | 'dream'
  | 'golden'
  | 'bigtech'
  | 'wallstreet'
  | 'rocket'
  | 'service'
  | 'telecom'
  | 'lala'
  | 'loyal'
  | 'founder'
  | 'influencer'
  | 'comfort';

export interface Ending {
  id: EndingId;
  emoji: string;
  title: string;
  tone: 'great' | 'good' | 'mixed' | 'bad';
  text: string;
  /** How to reach it — shown for locked endings in the gallery. */
  hint: string;
}

export type RomanceOutcome = 'engaged' | 'together' | 'split' | null;

export interface EndingState {
  id: EndingId;
  week: number;
  company?: CompanyId;
  pkg?: number;
  romance: RomanceOutcome;
}

/* ------------------------------------------------------------------ *
 * Save game
 * ------------------------------------------------------------------ */

export type Phase = 'intro' | 'hub' | 'interview' | 'reaction' | 'weekend' | 'ending';

export interface GameState {
  version: 2;
  phase: Phase;
  /** Fact/tip card ids for the opening deck. */
  facts: string[];
  background: BackgroundId | null;
  week: number;
  ap: number;
  stats: Stats;
  xp: number;
  level: number;
  perks: PerkId[];
  /** Non-empty while a level-up perk pick is waiting. */
  perkChoices: PerkId[];
  pendingPicks: number;
  flags: string[];
  companies: Partial<Record<CompanyId, CompanyRecord>>;
  applications: CompanyId[];
  mails: Mail[];
  opportunities: string[];
  takenOpps: string[];
  activities: ActivityId[];
  buffs: { mock: number; referrals: CompanyId[] };
  interview: InterviewSession | null;
  /** Index into history.interviews for the reaction screen. */
  lastInterview: number | null;
  weekend: { scenarioId: string | null; recap: WeekRecap | null } | null;
  /** Set once Sachin accepts an offer: he serves notice before the ending. */
  notice: { company: CompanyId; pkg: number; weeksLeft: number } | null;
  ending: EndingState | null;
  history: {
    interviews: InterviewRecord[];
    decisions: DecisionRecord[];
    recaps: WeekRecap[];
    statLog: Stats[];
  };
  seen: { scenarios: string[]; questions: string[]; hr: string[]; opps: string[]; flavor: string[] };
  startedAt: number;
}
