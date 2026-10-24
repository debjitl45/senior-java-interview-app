import type {
  BuffId,
  Company,
  Difficulty,
  GameState,
  InterviewSession,
  LifelineKind,
  LifelineUse,
  Mail,
  McqQuestion,
  ReactionBucket,
  StatEffects,
} from '../types';
import { getCompany } from '../data/companies';
import { QUESTION_POOL, getQuestion } from '../data/questions';
import { HR_QUESTIONS, getHrQuestion } from '../data/hr';
import { LETTERS, PASS_MARK, ROUND_LENGTH, clamp, round1, sample, shuffle, weightedPick, type Rng } from './core';
import { hasPerk } from './stats';

/** KBC pacing: a clock on the early questions, none on the boss questions. */
export const TIERS: { label: string; seconds: number | null }[] = [
  { label: 'Warm-up', seconds: 45 },
  { label: 'Easy', seconds: 45 },
  { label: 'Medium', seconds: 60 },
  { label: 'Hard', seconds: 60 },
  { label: 'Boss', seconds: null },
];

/** Round 1 (tech screen) is the first five questions; round 2 (bar raiser) the rest. */
export const ROUND_SPLIT = 5;

const SLOTS: Difficulty[] = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];

export const BUFF_META: Record<BuffId, { emoji: string; label: string; desc: string; good: boolean }> = {
  sharp: { emoji: '\u{1F9E0}', label: 'Sharp', desc: 'Skill 65+: an extra “Clarify” lifeline that removes one wrong option.', good: true },
  charming: { emoji: '✨', label: 'Charming', desc: 'Charisma 60+: one bad HR answer gets flagged, and +5% on the package.', good: true },
  referred: { emoji: '\u{1F39F}️', label: 'Referred', desc: 'Someone vouched for you: the panel starts warmer (+10 impression).', good: true },
  mock: { emoji: '\u{1F3AF}', label: 'Mock-ready', desc: 'Your mock interview pays off: one more “Clarify” lifeline.', good: true },
  clutch: { emoji: '⏱️', label: 'Clutch', desc: 'Perk: +10 seconds on every clock.', good: true },
  exhausted: { emoji: '\u{1F634}', label: 'Exhausted', desc: 'Energy under 25: every clock is 15 seconds shorter.', good: false },
  anxious: { emoji: '\u{1F630}', label: 'Anxious', desc: 'Sanity under 30: clocks 10 seconds shorter and a colder start.', good: false },
};

export const IMPRESSION = { correct: 6, wrong: -6, timeout: -8, hrBest: 12, hrGated: 18, hrOkay: 3, hrBad: -12 };

export const computeBuffs = (g: GameState, referral: boolean): BuffId[] => {
  const b: BuffId[] = [];
  if (g.stats.skill >= 65) b.push('sharp');
  if (g.stats.charisma >= 60) b.push('charming');
  if (referral) b.push('referred');
  if (g.buffs.mock > 0) b.push('mock');
  if (hasPerk(g, 'clutch')) b.push('clutch');
  if (g.stats.energy < 25) b.push('exhausted');
  if (g.stats.sanity < 30) b.push('anxious');
  return b;
};

export const lifelinesFor = (g: GameState, buffs: BuffId[]): LifelineKind[] => {
  const l: LifelineKind[] = ['fifty', 'senior', 'poll'];
  if (hasPerk(g, 'hoarder')) l.push('fifty');
  if (buffs.includes('sharp')) l.push('clarify');
  if (buffs.includes('mock')) l.push('clarify');
  return l;
};

export const secondsFor = (tier: Difficulty, buffs: BuffId[]): number | null => {
  const base = TIERS[tier].seconds;
  if (base === null) return null;
  let s = base;
  if (buffs.includes('clutch')) s += 10;
  if (buffs.includes('exhausted')) s -= 15;
  if (buffs.includes('anxious')) s -= 10;
  return Math.max(20, s);
};

/* ------------------------------------------------------------------ *
 * Building a session
 * ------------------------------------------------------------------ */

/** Two questions per difficulty, weighted toward the company's topics and away from repeats. */
export const pickQuestions = (c: Company, seen: string[], rng: Rng): string[] => {
  const ids: string[] = [];
  for (const tier of SLOTS) {
    const pool = QUESTION_POOL.filter(
      (q) => q.tier === tier && !ids.includes(q.id) && (!q.companies || q.companies.includes(c.id)),
    );
    const weight = (q: McqQuestion) => {
      let w = c.topics[q.topic] ?? 0;
      if (q.companies) w = Math.max(w, 1) * 3;
      return seen.includes(q.id) ? w * 0.15 : w;
    };
    const pick =
      weightedPick(pool, weight, rng) ??
      weightedPick(pool.filter((q) => q.topic !== 'lala'), (q) => (seen.includes(q.id) ? 0.2 : 1), rng);
    if (pick) ids.push(pick.id);
  }
  return ids;
};

export const pickHr = (seen: string[], rng: Rng): string[] => {
  const fresh = shuffle(HR_QUESTIONS.filter((q) => !seen.includes(q.id)), rng);
  const stale = shuffle(HR_QUESTIONS.filter((q) => seen.includes(q.id)), rng);
  return [...fresh, ...stale].slice(0, 2).map((q) => q.id);
};

export const createSession = (g: GameState, invite: Mail, rng: Rng): InterviewSession => {
  const c = getCompany(invite.company!);
  const buffs = computeBuffs(g, !!invite.referral);
  return {
    company: c.id,
    mailId: invite.id,
    stage: 'lobby',
    questionIds: pickQuestions(c, g.seen.questions, rng),
    answers: [],
    lifelines: lifelinesFor(g, buffs),
    used: [],
    buffs,
    impression: clamp(50 + (buffs.includes('referred') ? 10 : 0) - (buffs.includes('anxious') ? 5 : 0)),
    hrIds: pickHr(g.seen.hr, rng),
    hrAnswers: [],
  };
};

/* ------------------------------------------------------------------ *
 * Lifelines
 * ------------------------------------------------------------------ */

export const remainingLifelines = (s: InterviewSession): Record<LifelineKind, number> => {
  const count: Record<LifelineKind, number> = { fifty: 0, senior: 0, poll: 0, clarify: 0 };
  for (const l of s.lifelines) count[l]++;
  for (const u of s.used) count[u.kind]--;
  return count;
};

export const usesOn = (s: InterviewSession, q: number): LifelineUse[] => s.used.filter((u) => u.q === q);

/** Every option eliminated on this question by 50:50 or Clarify. */
export const removedOn = (s: InterviewSession, q: number): number[] =>
  [...new Set(usesOn(s, q).flatMap((u) => u.removed ?? []))];

const wrongLeft = (q: McqQuestion, removed: number[]) => [0, 1, 2, 3].filter((i) => i !== q.answer && !removed.includes(i));

export const eliminate = (q: McqQuestion, removed: number[], count: number, rng: Rng): number[] =>
  shuffle(wrongLeft(q, removed), rng).slice(0, count);

/** The senior is reliable on basics and shakier on boss questions, like real seniors. */
const SENIOR_ACCURACY = [0.95, 0.9, 0.8, 0.7, 0.6];

export const askSenior = (q: McqQuestion, removed: number[], rng: Rng): number => {
  if (rng() < SENIOR_ACCURACY[q.tier]) return q.answer;
  const wrong = wrongLeft(q, removed);
  return wrong.length ? sample(wrong, rng) : q.answer;
};

const SENIOR_LINES = [
  (l: string) => `Arre, this one’s basic — it’s ${l}. Bet my chai on it.`,
  (l: string) => `Pretty sure it’s ${l}. We literally did this last sprint.`,
  (l: string) => `I’d go with ${l}. Not 100% sure, but that’s my answer.`,
  (l: string) => `Hmm... ${l}, I think? It’s been a while since I touched this.`,
  (l: string) => `Honestly? Maybe ${l}. This is boss-level — trust your gut too.`,
];

export const seniorLine = (tier: Difficulty, pick: number): string => SENIOR_LINES[tier](LETTERS[pick]);

/** Crowd wisdom fades as questions get harder — LinkedIn experts, after all. */
const POLL_BOOST = [62, 52, 42, 34, 26];

export const linkedInPoll = (q: McqQuestion, removed: number[], rng: Rng): number[] => {
  const raw = [0, 1, 2, 3].map((i) =>
    removed.includes(i) ? 0 : 8 + rng() * 22 + (i === q.answer ? POLL_BOOST[q.tier] : 0),
  );
  const total = raw.reduce((a, b) => a + b, 0);
  const pct = raw.map((v) => Math.round((v / total) * 100));
  const drift = 100 - pct.reduce((a, b) => a + b, 0);
  pct[pct.indexOf(Math.max(...pct))] += drift;
  return pct;
};

/* ------------------------------------------------------------------ *
 * Scoring
 * ------------------------------------------------------------------ */

export const isCorrect = (s: InterviewSession, index: number): boolean => {
  const q = getQuestion(s.questionIds[index]);
  return !!q && s.answers[index] === q.answer;
};

export const correctCount = (s: InterviewSession): number =>
  s.answers.reduce<number>((n, _, i) => (isCorrect(s, i) ? n + 1 : n), 0);

export const hrScore = (s: InterviewSession): number =>
  s.hrAnswers.reduce<number>((n, choiceId, i) => {
    const q = getHrQuestion(s.hrIds[i]);
    return q?.choices.find((c) => c.id === choiceId)?.verdict === 'best' ? n + 1 : n;
  }, 0);

/** The ten-rung package ladder; rungs 7–10 are real offers. */
export const ladderFor = (c: Company): number[] => {
  const [lo, hi] = c.ctc;
  return Array.from({ length: ROUND_LENGTH }, (_, i) => {
    const rung = i + 1;
    return rung < PASS_MARK
      ? round1(lo * (0.4 + 0.1 * (rung - 1)))
      : round1(lo + ((hi - lo) * (rung - PASS_MARK)) / (ROUND_LENGTH - PASS_MARK));
  });
};

/** The rung sets the base; the interviewer's impression and charm move it. */
export const offerPackage = (c: Company, correct: number, impression: number, buffs: BuffId[]): number => {
  const base = ladderFor(c)[Math.min(Math.max(correct, 1), ROUND_LENGTH) - 1];
  const mult = (0.9 + impression / 500) * (buffs.includes('charming') ? 1.05 : 1);
  return round1(base * mult);
};

export const reactionBucket = (correct: number): ReactionBucket =>
  correct >= 8 ? 'great' : correct >= 6 ? 'meh' : 'bad';

/** How the interview itself changes Sachin, good or bad. */
export const interviewAftermath = (c: Company, correct: number, impression: number): { effects: StatEffects; xp: number } => {
  const effects: StatEffects = {
    energy: -15,
    // Every interview teaches something — rough ones teach more.
    skill: correct <= 5 ? 2 : 1,
    network: 1,
    // Time off for interviews gets noticed, a little.
    reputation: -1,
    sanity: correct >= 8 ? 8 : correct >= PASS_MARK ? 4 : correct >= 5 ? -4 : -10,
  };
  if (c.stats.toxicity >= 4) {
    effects.sanity = (effects.sanity ?? 0) - 4;
    effects.energy = (effects.energy ?? 0) - 5;
  }
  if (impression >= 70) effects.charisma = 3;
  else if (impression <= 30) effects.charisma = -2;
  if (c.payUnit === 'month') effects.money = -1;
  return { effects, xp: 20 + correct * 8 + (impression >= 70 ? 20 : 0) };
};

export const impressionFace = (impression: number): string =>
  impression >= 80 ? '\u{1F60D}' : impression >= 62 ? '\u{1F642}' : impression >= 42 ? '\u{1F610}' : impression >= 25 ? '\u{1F612}' : '\u{1F620}';
