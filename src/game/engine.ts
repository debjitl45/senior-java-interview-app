/**
 * Pure game rules. Nothing in here touches React or storage, so every
 * screen derives what it shows from GameState through these helpers.
 */
import {
  COMPANY_IDS,
  type CompanyId,
  type Effects,
  type GameState,
  type InterviewRun,
  type McqQuestion,
  type MeterKey,
  type Meters,
  type Phase,
  type ReactionBucket,
  type Scenario,
  type Tier,
  type Tone,
  type Verdict,
} from './types';
import { getCompany } from './data/companies';
import { QUESTION_BANK, getQuestion } from './data/questions';
import { getScenario, scenariosForSlot } from './data/scenarios';
import { FACTS } from './data/facts';
import { FLAVOR_MAILS, type FlavorMail, type MailTone } from './data/mails';
import { METERS, METER_KEYS } from './data/cast';

export const PASS_MARK = 7;
export const ROUND_LENGTH = 10;
export const DECISION_SECONDS = 30;
export const LETTERS = ['A', 'B', 'C', 'D'] as const;

/** KBC pacing: a clock on the early questions, none on the boss questions. */
export const TIERS: { label: string; seconds: number | null }[] = [
  { label: 'Warm-up', seconds: 45 },
  { label: 'Easy', seconds: 45 },
  { label: 'Medium', seconds: 60 },
  { label: 'Hard', seconds: 60 },
  { label: 'Boss', seconds: null },
];

export const PHASE_LABEL: Record<Phase, string> = {
  facts: 'Briefing',
  inbox: 'Inbox',
  interview: 'Interview',
  reaction: 'Debrief',
  scenario: 'Back at the office',
  result: 'The verdict',
  finale: 'Season finale',
};

export const shuffle = <T>(arr: readonly T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const sample = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const timeAgo = (ts: number, now = Date.now()): string => {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

/* ------------------------------------------------------------------ *
 * New game
 * ------------------------------------------------------------------ */

export const createGame = (): GameState => {
  const facts = shuffle(FACTS.filter((f) => f.kind === 'fact')).slice(0, 3);
  const tips = shuffle(FACTS.filter((f) => f.kind === 'tip')).slice(0, 3);
  return {
    version: 1,
    phase: 'facts',
    facts: facts.flatMap((f, i) => [f.id, tips[i].id]),
    mailOrder: shuffle(COMPANY_IDS),
    completed: [],
    readMails: [],
    active: null,
    runs: {},
    scenarioPlan: [0, 1, 2, 3].map((slot) => sample(scenariosForSlot(slot)).id),
    scenarioLog: [],
    meters: { manager: 50, hr: 50, team: 50, sanity: 60 },
    acceptedOffer: null,
    startedAt: Date.now(),
  };
};

/* ------------------------------------------------------------------ *
 * Interview
 * ------------------------------------------------------------------ */

/** Two questions per tier, in tier order, so difficulty always climbs. */
export const pickQuestions = (company: CompanyId): string[] =>
  ([0, 1, 2, 3, 4] as Tier[]).flatMap((tier) =>
    shuffle(QUESTION_BANK[company].filter((q) => q.tier === tier))
      .slice(0, 2)
      .map((q) => q.id),
  );

export const newRun = (company: CompanyId): InterviewRun => ({
  company,
  questionIds: pickQuestions(company),
  answers: [],
  lifelines: {},
});

export const isCorrect = (run: InterviewRun, index: number): boolean => {
  const q = getQuestion(run.questionIds[index]);
  return !!q && run.answers[index] === q.answer;
};

export const correctCount = (run: InterviewRun | undefined): number =>
  run ? run.answers.reduce<number>((n, _, i) => (isCorrect(run, i) ? n + 1 : n), 0) : 0;

export const gotOffer = (run: InterviewRun | undefined): boolean => correctCount(run) >= PASS_MARK;

/** Package unlocked on the ladder for a number of correct answers. */
export const packageFor = (company: CompanyId, correct: number): string | null =>
  correct > 0 ? getCompany(company).ladder[Math.min(correct, ROUND_LENGTH) - 1] : null;

export const reactionBucket = (correct: number): ReactionBucket =>
  correct >= 8 ? 'great' : correct >= 6 ? 'meh' : 'bad';

/* ------------------------------------------------------------------ *
 * Lifelines
 * ------------------------------------------------------------------ */

export const fiftyFifty = (q: McqQuestion): number[] =>
  shuffle([0, 1, 2, 3].filter((i) => i !== q.answer)).slice(0, 2);

/** The senior is reliable on basics and shakier on boss questions, like real seniors. */
const SENIOR_ACCURACY = [0.95, 0.9, 0.8, 0.7, 0.6];

export const askSenior = (q: McqQuestion, removed: number[] = []): number => {
  if (Math.random() < SENIOR_ACCURACY[q.tier]) return q.answer;
  const wrong = [0, 1, 2, 3].filter((i) => i !== q.answer && !removed.includes(i));
  return wrong.length ? sample(wrong) : q.answer;
};

const SENIOR_LINES = [
  (l: string) => `Arre, this one’s basic — it’s ${l}. Bet my chai on it.`,
  (l: string) => `Pretty sure it’s ${l}. We literally did this last sprint.`,
  (l: string) => `I’d go with ${l}. Not 100% sure, but that’s my answer.`,
  (l: string) => `Hmm... ${l}, I think? It’s been a while since I touched this.`,
  (l: string) => `Honestly? Maybe ${l}. This is boss-level — trust your gut too.`,
];

export const seniorLine = (tier: Tier, pick: number): string => SENIOR_LINES[tier](LETTERS[pick]);

/** Crowd wisdom fades as questions get harder — LinkedIn experts, after all. */
const POLL_BOOST = [62, 52, 42, 34, 26];

export const linkedInPoll = (q: McqQuestion, removed: number[] = []): number[] => {
  const raw = [0, 1, 2, 3].map((i) =>
    removed.includes(i) ? 0 : 8 + Math.random() * 22 + (i === q.answer ? POLL_BOOST[q.tier] : 0),
  );
  const total = raw.reduce((a, b) => a + b, 0);
  const pct = raw.map((v) => Math.round((v / total) * 100));
  const drift = 100 - pct.reduce((a, b) => a + b, 0);
  pct[pct.indexOf(Math.max(...pct))] += drift;
  return pct;
};

/* ------------------------------------------------------------------ *
 * Scenarios & meters
 * ------------------------------------------------------------------ */

export const currentScenario = (g: GameState): Scenario | undefined =>
  getScenario(g.scenarioPlan[g.completed.length] ?? '');

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export const applyEffects = (m: Meters, e: Effects): Meters => ({
  manager: clamp(m.manager + (e.manager ?? 0)),
  hr: clamp(m.hr + (e.hr ?? 0)),
  team: clamp(m.team + (e.team ?? 0)),
  sanity: clamp(m.sanity + (e.sanity ?? 0)),
});

/** Telltale-style "X will remember that." for the biggest swing in a decision. */
export const rememberLine = (e: Effects): string | null => {
  let key: MeterKey | null = null;
  for (const k of METER_KEYS) {
    const v = e[k] ?? 0;
    if (v !== 0 && (key === null || Math.abs(v) > Math.abs(e[key] ?? 0))) key = k;
  }
  if (!key) return null;
  const v = e[key] ?? 0;
  if (key === 'sanity') return v < 0 ? 'Sachin’s sanity took a hit.' : 'Sachin’s sanity says thank you.';
  return v < 0 ? `${METERS[key].who} will remember that.` : `${METERS[key].who} appreciated that.`;
};

export const VERDICT_META: Record<Verdict, { label: string; emoji: string; color: string }> = {
  best: { label: 'Right call', emoji: '✅', color: '#34d399' },
  okay: { label: 'Risky call', emoji: '⚠️', color: '#fbbf24' },
  bad: { label: 'Wrong call', emoji: '❌', color: '#fb7185' },
  timeout: { label: 'Froze', emoji: '⏱️', color: '#94a3b8' },
};

export const TONE_COLOR: Record<Tone, string> = {
  Diplomatic: '#38bdf8',
  Assertive: '#fb923c',
  Honest: '#a3e635',
  Strategic: '#a78bfa',
  Passive: '#94a3b8',
  Emotional: '#f472b6',
  Evasive: '#facc15',
  Savage: '#fb7185',
};

export interface Persona {
  emoji: string;
  title: string;
  blurb: string;
}

export const personaFor = (g: GameState): Persona => {
  const log = g.scenarioLog;
  const best = log.filter((e) => e.verdict === 'best').length;
  const hot = log.filter((e) => e.tone === 'Savage' || e.tone === 'Emotional').length;
  const frozen = log.filter((e) => e.verdict === 'timeout').length;
  const passive = log.filter((e) => e.tone === 'Passive').length;

  if (best >= 4)
    return {
      emoji: '\u{1F9E0}',
      title: 'Corporate Chanakya',
      blurb: 'Four right calls out of four. You read the room, protect your boundaries and still make your manager look good. Terrifyingly effective.',
    };
  if (best === 3)
    return {
      emoji: '\u{1F54A}️',
      title: 'Office Diplomat',
      blurb: 'Calm under pressure and almost always on the right side of the politics. One more rep and you’re unstoppable.',
    };
  if (hot >= 2)
    return {
      emoji: '\u{1F525}',
      title: 'Notice-Period Rebel',
      blurb: 'You say what everyone is thinking — loudly. Iconic in the group chat, risky on the appraisal sheet.',
    };
  if (frozen >= 2)
    return {
      emoji: '\u{1F440}',
      title: 'Professional Lurker',
      blurb: 'When it mattered you went quiet, and others decided for you. Prepare your one-liners before the meeting.',
    };
  if (passive >= 2 || g.meters.sanity < 30)
    return {
      emoji: '\u{1F975}',
      title: 'Burnout Speedrunner',
      blurb: 'Always available, rarely protected. Boundaries aren’t rude — they’re how you last long enough to get promoted.',
    };
  if (best === 2)
    return {
      emoji: '\u{1F4C8}',
      title: 'Rising Mid-Level',
      blurb: 'Good instincts and a few expensive lessons. You’re learning the game faster than most.',
    };
  return {
    emoji: '\u{1F331}',
    title: 'Corporate Intern (Emotionally)',
    blurb: 'Office politics won this round. Re-read the lessons below — every one of them shows up in real life.',
  };
};

/* ------------------------------------------------------------------ *
 * Inbox
 * ------------------------------------------------------------------ */

/** Two invites are waiting at the start; one more lands after each finished loop. */
export const arrivedCompanies = (g: GameState): CompanyId[] =>
  g.mailOrder.slice(0, Math.min(COMPANY_IDS.length, 2 + g.completed.length));

export const pendingCompanies = (g: GameState): CompanyId[] =>
  arrivedCompanies(g).filter((c) => !g.completed.includes(c));

export type CompanyStatus = 'locked' | 'pending' | 'active' | 'offer' | 'rejected';

export const companyStatus = (g: GameState, c: CompanyId): CompanyStatus => {
  if (g.completed.includes(c)) return gotOffer(g.runs[c]) ? 'offer' : 'rejected';
  if (g.active === c) return 'active';
  return arrivedCompanies(g).includes(c) ? 'pending' : 'locked';
};

export type MailKind = 'invite' | 'offer' | 'rejection' | 'flavor';

export interface MailItem {
  id: string;
  kind: MailKind;
  company?: CompanyId;
  flavor?: FlavorMail;
  from: string;
  email: string;
  subject: string;
  preview: string;
  tag: { label: string; tone: MailTone };
  time: string;
}

const inviteItem = (c: CompanyId): MailItem => {
  const co = getCompany(c);
  return {
    id: `invite-${c}`,
    kind: 'invite',
    company: c,
    from: co.invite.from,
    email: co.invite.email,
    subject: co.invite.subject,
    preview: co.invite.preview,
    tag: { label: 'Interview', tone: 'accent' },
    time: '',
  };
};

const resultItem = (c: CompanyId, run: InterviewRun | undefined): MailItem => {
  const co = getCompany(c);
  const offer = gotOffer(run);
  const body = offer ? co.offer.body : co.rejection.body;
  return {
    id: `result-${c}`,
    kind: offer ? 'offer' : 'rejection',
    company: c,
    from: co.invite.from,
    email: co.invite.email,
    subject: offer ? co.offer.subject : co.rejection.subject,
    preview: body[1] ?? body[0],
    tag: offer ? { label: 'Offer', tone: 'good' } : { label: 'Rejected', tone: 'bad' },
    time: '',
  };
};

const flavorItem = (m: FlavorMail): MailItem => ({
  id: m.id,
  kind: 'flavor',
  flavor: m,
  from: m.from,
  email: m.email,
  subject: m.subject,
  preview: m.preview,
  tag: m.tag,
  time: '',
});

const TIME_LABELS = ['Just now', '3 min ago', '17 min ago', '41 min ago', '1 hr ago', '2 hr ago', '4 hr ago', 'Yesterday'];

/** Rebuilds the inbox, newest first, from what has happened so far. */
export const buildInbox = (g: GameState): MailItem[] => {
  const flavor = (stage: number) => FLAVOR_MAILS.filter((m) => m.stage === stage).map(flavorItem);
  const events: MailItem[] = [...flavor(0), ...g.mailOrder.slice(0, 2).map(inviteItem)];

  g.completed.forEach((c, k) => {
    events.push(resultItem(c, g.runs[c]));
    events.push(...flavor(k + 1));
    const next = g.mailOrder[k + 2];
    if (next) events.push(inviteItem(next));
  });

  return events
    .reverse()
    .map((m, i) => ({ ...m, time: TIME_LABELS[Math.min(i, TIME_LABELS.length - 1)] }));
};
