import type { CompanyId, GameState, Mail, RecapLine, Scenario, StatEffects, StatKey, WeekRecap } from '../types';
import { SCENARIOS } from '../data/scenarios';
import { OPPORTUNITIES } from '../data/opportunities';
import { FLAVOR_MAILS } from '../data/mails';
import { getCompany } from '../data/companies';
import { COOLDOWN, INVITE_TTL, OFFER_TTL, PAYDAY_EVERY, PAYDAY_NET, formatPkg, weightedPick, type Rng } from './core';
import { apPerWeek, applyEffects, gainXp, hasPerk, romanceActive } from './stats';
import { makeMail, pickInbound, shortlistChance, statusOf, withCompany } from './jobs';
import { checkEnding } from './endings';

/** Stored flags plus flags derived from the current state. */
export const contextFlags = (g: GameState): Set<string> => {
  const f = new Set(g.flags);
  if (f.has('romance_split')) f.delete('romance');
  if (g.history.interviews.length > 0) f.add('interviewing');
  if (g.notice) f.add('resigned');
  if (g.notice || g.mails.some((m) => m.kind === 'offer' && m.status === 'open')) f.add('offer_in_hand');
  if (g.notice?.weeksLeft === 1) f.add('last_week');
  return f;
};

export const scenarioEligible = (g: GameState, s: Scenario, flags: Set<string>): boolean => {
  if (s.minWeek !== undefined && g.week < s.minWeek) return false;
  if (s.maxWeek !== undefined && g.week > s.maxWeek) return false;
  if (s.requires && !s.requires.every((f) => flags.has(f))) return false;
  if (s.excludes && s.excludes.some((f) => flags.has(f))) return false;
  const stat = (k: string) => g.stats[k as StatKey];
  if (s.minStats && Object.entries(s.minStats).some(([k, v]) => stat(k) < (v ?? 0))) return false;
  if (s.maxStats && Object.entries(s.maxStats).some(([k, v]) => stat(k) > (v ?? 100))) return false;
  // Nobody who has left the company can show up in a scene.
  return s.dialogue.every((d) => !flags.has(`gone:${d.who}`));
};

/** One office scenario per week: forced story beats first, then a weighted draw. */
export const pickScenario = (g: GameState, rng: Rng): string | null => {
  const flags = contextFlags(g);
  const eligible = SCENARIOS.filter((s) => !g.seen.scenarios.includes(s.id) && scenarioEligible(g, s, flags));
  const forced = eligible.find((s) => s.forcedWeek !== undefined && s.forcedWeek <= g.week);
  if (forced) return forced.id;
  return weightedPick(eligible, (s) => s.weight ?? 1, rng)?.id ?? null;
};

/** One or two low-hanging-fruit cards for the coming week. */
export const rollOpportunities = (g: GameState, week: number, rng: Rng): string[] => {
  const flags = contextFlags(g);
  const left = OPPORTUNITIES.filter(
    (o) =>
      (o.minWeek ?? 1) <= week &&
      (o.maxWeek ?? 99) >= week &&
      !(o.once && g.seen.opps.includes(o.id)) &&
      (!o.requires || o.requires.every((f) => flags.has(f))),
  );
  const count = rng() < 0.3 ? 1 : 2;
  const picked: string[] = [];
  for (let i = 0; i < count && left.length; i++) {
    const o = weightedPick(left, (x) => (x.weight ?? 1) * (g.seen.opps.includes(x.id) ? 0.5 : 1), rng);
    if (!o) break;
    picked.push(o.id);
    left.splice(left.indexOf(o), 1);
  }
  return picked;
};

/**
 * Closes the current week and opens the next: results and shortlists land
 * in the inbox, recruiters reach out, invites and offers expire, payday
 * happens, energy recovers. Returns the new state with a recap attached.
 */
export const advanceWeek = (start: GameState, rng: Rng): GameState => {
  const next = start.week + 1;
  const lines: RecapLine[] = [];
  let g: GameState = start;
  let offers = 0;

  const send = (m: Omit<Mail, 'id' | 'read' | 'week'>) => {
    g = { ...g, mails: [...g.mails, makeMail(g, { ...m, week: next })] };
  };
  const setCompany = (id: CompanyId, rec: Parameters<typeof withCompany>[2]) => {
    g = { ...g, companies: withCompany(g, id, rec) };
  };

  // 1. This week's interview results arrive.
  const interviews = start.history.interviews.map((r) => {
    if (r.revealed) return r;
    const c = getCompany(r.company);
    if (r.passed && r.pkg !== undefined) {
      send({ kind: 'offer', company: r.company, pkg: r.pkg, correct: r.correct, status: 'open', expiresWeek: next + OFFER_TTL });
      setCompany(r.company, { status: 'offer' });
      lines.push({ emoji: '\u{1F389}', text: `Offer from ${c.name}: ${formatPkg(c, r.pkg)}!`, tone: 'good' });
      offers++;
    } else {
      send({ kind: 'rejection', company: r.company, correct: r.correct });
      setCompany(r.company, { status: 'cooldown', until: next + COOLDOWN });
      lines.push({ emoji: '\u{1F4ED}', text: `${c.name} said no (${r.correct}/10).`, tone: 'bad' });
    }
    return { ...r, revealed: true };
  });
  g = { ...g, history: { ...g.history, interviews } };

  // 2. Applications get answered.
  for (const id of start.applications) {
    const c = getCompany(id);
    if (rng() < shortlistChance(start, c)) {
      send({ kind: 'invite', company: id, status: 'open', expiresWeek: next + INVITE_TTL });
      setCompany(id, { status: 'invited' });
      lines.push({ emoji: '\u{1F4E9}', text: `${c.name} shortlisted you — interview invite!`, tone: 'good' });
    } else {
      send({ kind: 'nolist', company: id });
      setCompany(id, { status: 'cooldown', until: next + 3 });
      lines.push({ emoji: '\u{1F5D1}️', text: `${c.name} didn’t shortlist you this time.`, tone: 'neutral' });
    }
  }
  g = { ...g, applications: [] };

  // 3. Referrals turn into invites.
  for (const id of start.buffs.referrals) {
    if (statusOf(g, id) !== 'open') continue;
    send({ kind: 'invite', company: id, status: 'open', expiresWeek: next + INVITE_TTL, referral: true });
    setCompany(id, { status: 'invited' });
    lines.push({ emoji: '\u{1F39F}️', text: `Referral worked: ${getCompany(id).name} invited you to interview.`, tone: 'good' });
  }
  g = { ...g, buffs: { ...g.buffs, referrals: [] } };

  // 4. Recruiters reach out — more often with a bigger network (not once he has resigned).
  const inbound = 0.2 + start.stats.network / 250 + (hasPerk(start, 'connector') ? 0.15 : 0);
  if (!start.notice && rng() < inbound) {
    const id = pickInbound(g, rng);
    if (id) {
      send({ kind: 'invite', company: id, status: 'open', expiresWeek: next + INVITE_TTL });
      setCompany(id, { status: 'invited' });
      lines.push({ emoji: '\u{1F4EC}', text: `A recruiter from ${getCompany(id).name} reached out with an invite.`, tone: 'good' });
    }
  }

  // 5. Unanswered invites and offers lapse.
  const lapsed: CompanyId[] = [];
  g = {
    ...g,
    mails: g.mails.map((m) => {
      const open = (m.kind === 'invite' || m.kind === 'offer') && m.status === 'open';
      if (!open || m.expiresWeek === undefined || m.expiresWeek >= next) return m;
      lapsed.push(m.company!);
      lines.push({
        emoji: '⌛',
        text: `The ${m.kind} from ${getCompany(m.company!).name} expired.`,
        tone: m.kind === 'offer' ? 'bad' : 'neutral',
      });
      return { ...m, status: 'expired' };
    }),
  };
  for (const id of lapsed) setCompany(id, { status: 'cooldown', until: next + 2 });

  // 6. New flavour mail.
  for (const f of FLAVOR_MAILS) {
    if (f.week === next && !g.seen.flavor.includes(f.id)) {
      send({ kind: 'flavor', flavorId: f.id });
      g = { ...g, seen: { ...g.seen, flavor: [...g.seen.flavor, f.id] } };
    }
  }

  // 7. Body, mind and wallet.
  // The weekend itself restores a little.
  const weekly: StatEffects = { energy: 15 + (hasPerk(start, 'chai') ? 10 : 0), sanity: 3 };
  if (start.stats.energy < 20) {
    weekly.sanity = -5;
    lines.push({ emoji: '\u{1F971}', text: 'Running on fumes all week: sanity −5.', tone: 'bad' });
  }
  if (start.stats.sanity < 25) {
    weekly.reputation = -3;
    lines.push({ emoji: '\u{1F636}', text: 'The stress is showing at work: reputation −3.', tone: 'bad' });
  }
  if (romanceActive(start) && !start.activities.includes('date')) {
    weekly.romance = -3;
    lines.push({ emoji: '\u{1F4AD}', text: 'No time for Riya this week: romance −3.', tone: 'neutral' });
  }
  if (next % PAYDAY_EVERY === 0) {
    weekly.money = PAYDAY_NET + (hasPerk(start, 'frugal') ? 5 : 0);
    lines.push({ emoji: '\u{1F4B8}', text: `Payday! +₹${weekly.money}k after rent and bills.`, tone: 'good' });
  }
  const { stats, applied } = applyEffects(g, weekly);
  g = { ...g, stats };

  // 8. Notice period ticks down.
  if (start.notice) {
    const weeksLeft = Math.max(0, start.notice.weeksLeft - 1);
    const name = getCompany(start.notice.company).name;
    g = { ...g, notice: { ...start.notice, weeksLeft } };
    lines.push(
      weeksLeft > 0
        ? { emoji: '\u{1F4E6}', text: `Notice period: ${weeksLeft} week${weeksLeft === 1 ? '' : 's'} left before you join ${name}.`, tone: 'neutral' }
        : { emoji: '\u{1F393}', text: `That was your last week at Infinite Loop. ${name}, here you come!`, tone: 'good' },
    );
  }

  // 9. A fresh week.
  g = { ...g, week: next, ap: apPerWeek(g), activities: [], takenOpps: [] };
  g = { ...g, opportunities: rollOpportunities(g, next, rng) };
  // No point advertising next week's fruit if the season is about to end.
  if (g.opportunities.length && !checkEnding(g)) {
    lines.push({ emoji: '✨', text: `${g.opportunities.length} new low-hanging fruit this week — check Home.`, tone: 'neutral' });
  }
  if (offers) g = gainXp(g, 40 * offers, rng);

  const recap: WeekRecap = { week: start.week, lines, deltas: applied };
  return {
    ...g,
    weekend: { scenarioId: start.weekend?.scenarioId ?? null, recap },
    history: { ...g.history, recaps: [...g.history.recaps, recap].slice(-60), statLog: [...g.history.statLog, g.stats] },
  };
};
