/**
 * Every state transition the UI can trigger. Pure: (state, input, rng) → result.
 * `note` is an optional toast for the player.
 */
import type {
  ActivityId,
  BackgroundId,
  CompanyId,
  GameState,
  InterviewRecord,
  LifelineUse,
  PerkId,
  Tier,
} from '../types';
import { FACTS } from '../data/facts';
import { ACTIVITIES, BACKGROUNDS } from '../data/progression';
import { getOpportunity } from '../data/opportunities';
import { FLAVOR_MAILS } from '../data/mails';
import { getCompany } from '../data/companies';
import { getQuestion } from '../data/questions';
import { getHrQuestion } from '../data/hr';
import { getScenario } from '../data/scenarios';
import { BASE_AP, BUYOUT_PER_WEEK, INVITE_TTL, NOTICE_WEEKS, PASS_MARK, formatMoney, formatPkg, round1, shuffle, type Rng } from './core';
import { activityEffects, applyEffects, describeEffects, gainXp, hasPerk, meetsGate, pickPerk, romanceActive } from './stats';
import { canApply, companyRecord, makeMail, negotiationChance, pickInbound, withCompany } from './jobs';
import {
  IMPRESSION,
  correctCount,
  createSession,
  hrScore,
  interviewAftermath,
  offerPackage,
  remainingLifelines,
} from './interview';
import { advanceWeek, pickScenario, rollOpportunities } from './week';
import { checkEnding, noticeEnding } from './endings';

export interface ActionResult {
  g: GameState;
  note?: string;
  tone?: 'good' | 'bad' | 'neutral';
}

const same = (g: GameState): ActionResult => ({ g });

/* ------------------------------------------------------------------ *
 * New game
 * ------------------------------------------------------------------ */

export const createGame = (rng: Rng): GameState => {
  const facts = shuffle(FACTS.filter((f) => f.kind === 'fact'), rng).slice(0, 3);
  const tips = shuffle(FACTS.filter((f) => f.kind === 'tip'), rng).slice(0, 3);
  return {
    version: 2,
    phase: 'intro',
    facts: facts.flatMap((f, i) => [f.id, tips[i].id]),
    background: null,
    week: 1,
    ap: BASE_AP,
    stats: { ...BACKGROUNDS.fighter.stats },
    xp: 0,
    level: 1,
    perks: [],
    perkChoices: [],
    pendingPicks: 0,
    flags: [],
    companies: {},
    applications: [],
    mails: [],
    opportunities: [],
    takenOpps: [],
    activities: [],
    buffs: { mock: 0, referrals: [] },
    interview: null,
    lastInterview: null,
    weekend: null,
    notice: null,
    ending: null,
    history: { interviews: [], decisions: [], recaps: [], statLog: [] },
    seen: { scenarios: [], questions: [], hr: [], opps: [], flavor: [] },
    startedAt: Date.now(),
  };
};

/** Character creation done: week 1 starts with two invites already waiting. */
export const beginSeason = (start: GameState, bg: BackgroundId, rng: Rng): GameState => {
  let g: GameState = { ...start, background: bg, stats: { ...BACKGROUNDS[bg].stats }, phase: 'hub', week: 1, ap: BASE_AP };
  for (const f of FLAVOR_MAILS.filter((m) => m.week === 1)) {
    g = { ...g, mails: [...g.mails, makeMail(g, { week: 1, kind: 'flavor', flavorId: f.id })], seen: { ...g.seen, flavor: [...g.seen.flavor, f.id] } };
  }
  const starters: Tier[][] = [['B', 'C'], ['A']];
  for (const tiers of starters) {
    const id = pickInbound(g, rng, tiers);
    if (!id) continue;
    g = {
      ...g,
      mails: [...g.mails, makeMail(g, { week: 1, kind: 'invite', company: id, status: 'open', expiresWeek: 1 + INVITE_TTL })],
      companies: withCompany(g, id, { status: 'invited' }),
    };
  }
  return { ...g, opportunities: rollOpportunities(g, 1, rng), history: { ...g.history, statLog: [g.stats] } };
};

/* ------------------------------------------------------------------ *
 * Hub
 * ------------------------------------------------------------------ */

export const readMail = (g: GameState, id: string): GameState =>
  g.mails.some((m) => m.id === id && !m.read) ? { ...g, mails: g.mails.map((m) => (m.id === id ? { ...m, read: true } : m)) } : g;

export const doActivity = (g: GameState, id: ActivityId, rng: Rng): ActionResult => {
  const a = ACTIVITIES[id];
  if (g.ap < 1) return { g, note: 'No action points left. End the week to recharge.', tone: 'bad' };
  if (a.requires === 'romance' && !romanceActive(g)) return same(g);
  const { stats, applied } = applyEffects(g, activityEffects(g, id));
  const next = gainXp({ ...g, stats, ap: g.ap - 1, activities: [...g.activities, id] }, a.xp, rng);
  return { g: next, note: `${a.emoji} ${a.name}: ${describeEffects(applied) || 'no change'}`, tone: 'good' };
};

export const takeOpportunity = (g: GameState, id: string, rng: Rng): ActionResult => {
  const o = getOpportunity(id);
  if (!o || !g.opportunities.includes(id) || g.takenOpps.includes(id)) return same(g);
  if (g.ap < o.ap) return { g, note: 'Not enough action points for that one.', tone: 'bad' };
  const effects = o.cost ? { ...o.effects, money: (o.effects.money ?? 0) - o.cost } : o.effects;
  const { stats, applied } = applyEffects(g, effects);
  let next: GameState = {
    ...g,
    stats,
    ap: g.ap - o.ap,
    takenOpps: [...g.takenOpps, id],
    seen: { ...g.seen, opps: g.seen.opps.includes(id) ? g.seen.opps : [...g.seen.opps, id] },
  };
  let note = `${o.emoji} ${o.title}: ${describeEffects(applied) || 'done'}`;
  switch (o.special) {
    case 'mock':
      next = { ...next, buffs: { ...next.buffs, mock: next.buffs.mock + 1 } };
      note = `${o.emoji} Mock done — your next interview gets an extra Clarify lifeline.`;
      break;
    case 'referral': {
      const cid = pickInbound(next, rng, ['S', 'A']);
      if (cid) {
        next = { ...next, buffs: { ...next.buffs, referrals: [...next.buffs.referrals, cid] } };
        note = `\u{1F39F}️ Priya will refer you to ${getCompany(cid).name}. Watch your inbox next week.`;
      }
      break;
    }
    case 'hackathon':
      if (rng() < 0.35) {
        next = { ...next, stats: applyEffects(next, { money: 25, reputation: 5 }).stats };
        note = '\u{1F3C6} Your team WON the hackathon! +₹25k and +5 reputation.';
      } else {
        note = '\u{1F3C6} No prize this time — but you learned a ton and met great people.';
      }
      break;
    case 'recruiter': {
      const cid = pickInbound(next, rng, ['A', 'B']);
      if (cid) {
        next = {
          ...next,
          mails: [...next.mails, makeMail(next, { week: next.week, kind: 'invite', company: cid, status: 'open', expiresWeek: next.week + INVITE_TTL })],
          companies: withCompany(next, cid, { status: 'invited' }),
        };
        note = `\u{1F4E8} The call went well — ${getCompany(cid).name} sent an interview invite!`;
      }
      break;
    }
  }
  return { g: gainXp(next, o.xp, rng), note, tone: 'good' };
};

export const applyTo = (g: GameState, id: CompanyId): ActionResult => {
  if (g.notice || !canApply(g, id)) return same(g);
  return {
    g: { ...g, applications: [...g.applications, id], companies: withCompany(g, id, { status: 'applied' }) },
    note: `Applied to ${getCompany(id).name}. You’ll hear back when the week ends.`,
    tone: 'neutral',
  };
};

export const choosePerk = (g: GameState, perk: PerkId, rng: Rng): GameState => pickPerk(g, perk, rng);

/* ------------------------------------------------------------------ *
 * Interviews
 * ------------------------------------------------------------------ */

export const startInterview = (g: GameState, mailId: string, rng: Rng): ActionResult => {
  const mail = g.mails.find((m) => m.id === mailId);
  if (!mail || mail.kind !== 'invite' || mail.status !== 'open' || g.phase !== 'hub') return same(g);
  if (g.notice) return { g, note: 'You’ve already resigned — no more interviews this season.', tone: 'bad' };
  if (g.ap < 1) return { g, note: 'An interview needs 1 action point. End the week first — the invite is still valid.', tone: 'bad' };
  const session = createSession(g, mail, rng);
  return {
    g: {
      ...g,
      ap: g.ap - 1,
      phase: 'interview',
      interview: session,
      buffs: { ...g.buffs, mock: session.buffs.includes('mock') ? Math.max(0, g.buffs.mock - 1) : g.buffs.mock },
      mails: g.mails.map((m) => (m.id === mailId ? { ...m, status: 'accepted', read: true } : m)),
    },
  };
};

const withSession = (g: GameState, patch: Partial<NonNullable<GameState['interview']>>): GameState =>
  g.interview ? { ...g, interview: { ...g.interview, ...patch } } : g;

export const beginTech = (g: GameState): GameState => withSession(g, { stage: 'tech' });

export const spendLifeline = (g: GameState, use: LifelineUse): GameState => {
  const s = g.interview;
  if (!s || remainingLifelines(s)[use.kind] < 1) return g;
  return withSession(g, { used: [...s.used, use] });
};

/** Idempotent: only records when `index` is the next unanswered question. */
export const answerQuestion = (g: GameState, index: number, choice: number | null): GameState => {
  const s = g.interview;
  if (!s || s.answers.length !== index) return g;
  const q = getQuestion(s.questionIds[index]);
  const delta = choice === null ? IMPRESSION.timeout : q && choice === q.answer ? IMPRESSION.correct : IMPRESSION.wrong;
  return withSession(g, { answers: [...s.answers, choice], impression: Math.max(0, Math.min(100, s.impression + delta)) });
};

export const toHrRound = (g: GameState): GameState => withSession(g, { stage: 'hr' });

export const answerHr = (g: GameState, index: number, choiceId: string): GameState => {
  const s = g.interview;
  if (!s || s.hrAnswers.length !== index) return g;
  const choice = getHrQuestion(s.hrIds[index])?.choices.find((c) => c.id === choiceId);
  if (!choice || !meetsGate(g, choice.requires)) return g;
  let delta = choice.verdict === 'best' ? (choice.requires ? IMPRESSION.hrGated : IMPRESSION.hrBest) : choice.verdict === 'okay' ? IMPRESSION.hrOkay : IMPRESSION.hrBad;
  if (choice.verdict === 'best' && hasPerk(g, 'silver')) delta += 5;
  return withSession(g, { hrAnswers: [...s.hrAnswers, choiceId], impression: Math.max(0, Math.min(100, s.impression + delta)) });
};

export const finishInterview = (g: GameState, rng: Rng): GameState => {
  const s = g.interview;
  if (!s) return g;
  const c = getCompany(s.company);
  const correct = correctCount(s);
  const passed = correct >= PASS_MARK;
  const { effects, xp } = interviewAftermath(c, correct, s.impression);
  const { stats, applied } = applyEffects(g, effects);
  const record: InterviewRecord = {
    company: c.id,
    week: g.week,
    correct,
    impression: s.impression,
    hrScore: hrScore(s),
    passed,
    revealed: false,
    pkg: passed ? offerPackage(c, correct, s.impression, s.buffs) : undefined,
    deltas: applied,
    xp,
  };
  const next: GameState = {
    ...g,
    stats,
    phase: 'reaction',
    interview: null,
    lastInterview: g.history.interviews.length,
    history: { ...g.history, interviews: [...g.history.interviews, record] },
    companies: withCompany(g, c.id, { status: 'interviewed', interviews: companyRecord(g, c.id).interviews + 1 }),
    seen: { ...g.seen, questions: [...g.seen.questions, ...s.questionIds], hr: [...g.seen.hr, ...s.hrIds] },
  };
  return gainXp(next, xp, rng);
};

export const leaveReaction = (g: GameState): GameState => ({ ...g, phase: 'hub' });

/* ------------------------------------------------------------------ *
 * Offers
 * ------------------------------------------------------------------ */

export type OfferResponse = 'accept' | 'negotiate' | 'decline';

export const respondToOffer = (g: GameState, mailId: string, action: OfferResponse, rng: Rng): ActionResult => {
  const mail = g.mails.find((m) => m.id === mailId);
  if (!mail || mail.kind !== 'offer' || mail.status !== 'open' || mail.pkg === undefined) return same(g);
  const c = getCompany(mail.company!);
  const setMail = (patch: Partial<typeof mail>) => g.mails.map((m) => (m.id === mailId ? { ...m, ...patch } : m));

  if (action === 'accept') {
    if (g.notice) return same(g);
    // Accepting closes every other door: open offers and invites are declined.
    const mails = g.mails.map((m) =>
      m.id === mailId
        ? { ...m, status: 'accepted' as const }
        : (m.kind === 'offer' || m.kind === 'invite') && m.status === 'open'
          ? { ...m, status: 'declined' as const }
          : m,
    );
    return {
      g: { ...g, mails, applications: [], notice: { company: c.id, pkg: mail.pkg, weeksLeft: NOTICE_WEEKS } },
      note: `\u{1F389} You accepted ${c.name}! Resignation sent — ${NOTICE_WEEKS} weeks of notice at Infinite Loop.`,
      tone: 'good',
    };
  }

  if (action === 'decline') {
    return {
      g: { ...g, mails: setMail({ status: 'declined' }), companies: withCompany(g, c.id, { status: 'cooldown', until: g.week + 4 }) },
      note: `You declined ${c.name} — politely, bridges intact.`,
      tone: 'neutral',
    };
  }

  if (mail.negotiated) return same(g);
  if (rng() < negotiationChance(g)) {
    const pkg = round1(mail.pkg * (1.08 + rng() * 0.07));
    const stats = applyEffects(g, { charisma: 2 }).stats;
    return { g: { ...g, stats, mails: setMail({ pkg, negotiated: 'won' }) }, note: `\u{1F91D} ${c.name} agreed: ${formatPkg(c, pkg)}!`, tone: 'good' };
  }
  if (c.kind === 'lala' && rng() < 0.35) {
    return {
      g: { ...g, mails: setMail({ status: 'withdrawn', negotiated: 'lost' }), companies: withCompany(g, c.id, { status: 'cooldown', until: g.week + 6 }) },
      note: '\u{1F624} Jha ji got offended by the negotiation and withdrew the offer.',
      tone: 'bad',
    };
  }
  return { g: { ...g, mails: setMail({ negotiated: 'lost' }) }, note: `${c.name}: “This is our best offer.” The original offer still stands.`, tone: 'neutral' };
};

export const buyoutCost = (g: GameState): number => (g.notice ? BUYOUT_PER_WEEK * g.notice.weeksLeft : 0);

/** Pay to skip the rest of the notice period and go straight to the ending. */
export const buyoutNotice = (g: GameState): ActionResult => {
  if (!g.notice || g.phase !== 'hub') return same(g);
  const cost = buyoutCost(g);
  if (g.stats.money < cost) {
    return { g, note: `A buyout costs ₹${cost}k; you have ${formatMoney(g.stats.money)}.`, tone: 'bad' };
  }
  const next: GameState = { ...g, stats: { ...g.stats, money: round1(g.stats.money - cost) }, notice: { ...g.notice, weeksLeft: 0 } };
  return { g: { ...next, phase: 'ending', ending: noticeEnding(next) } };
};

/* ------------------------------------------------------------------ *
 * The weekend: an office scenario, then the weekly recap
 * ------------------------------------------------------------------ */

export const endWeek = (g: GameState, rng: Rng): GameState => {
  if (g.phase !== 'hub') return g;
  const scenarioId = pickScenario(g, rng);
  if (scenarioId) {
    return { ...g, phase: 'weekend', weekend: { scenarioId, recap: null }, seen: { ...g.seen, scenarios: [...g.seen.scenarios, scenarioId] } };
  }
  return { ...advanceWeek({ ...g, weekend: { scenarioId: null, recap: null } }, rng), phase: 'weekend' };
};

/** `choiceId` null means the decision clock ran out. */
export const decideScenario = (g: GameState, scenarioId: string, choiceId: string | null, rng: Rng): GameState => {
  const s = getScenario(scenarioId);
  if (!s || g.history.decisions.some((d) => d.scenarioId === scenarioId)) return g;
  const choice = choiceId ? s.choices.find((c) => c.id === choiceId) ?? null : null;
  if (choiceId && (!choice || !meetsGate(g, choice.requires))) return g;
  const { stats, applied } = applyEffects(g, choice ? choice.effects : s.timeout.effects);
  const add = choice ? choice.setFlags ?? [] : s.timeout.setFlags ?? [];
  const remove = choice?.clearFlags ?? [];
  const flags = [...new Set([...g.flags, ...add])].filter((f) => !remove.includes(f));
  const verdict = choice ? choice.verdict : 'timeout';
  const next: GameState = {
    ...g,
    stats,
    flags,
    history: {
      ...g.history,
      decisions: [...g.history.decisions, { scenarioId, week: g.week, choiceId: choice?.id ?? null, verdict, tone: choice?.tone ?? null, effects: applied }],
    },
  };
  return gainXp(next, verdict === 'best' ? 30 : verdict === 'okay' ? 15 : verdict === 'bad' ? 5 : 0, rng);
};

export const finishScenario = (g: GameState, rng: Rng): GameState =>
  g.weekend && !g.weekend.recap ? advanceWeek(g, rng) : g;

export const finishRecap = (g: GameState): GameState => {
  const ending = checkEnding(g);
  return ending ? { ...g, phase: 'ending', ending, weekend: null } : { ...g, phase: 'hub', weekend: null };
};
