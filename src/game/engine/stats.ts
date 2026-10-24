import type { ActivityId, GameState, PerkId, StatEffects, StatGate, StatKey, Stats } from '../types';
import { ACTIVITIES, LEVEL_XP, PERK_IDS } from '../data/progression';
import { STATS } from '../data/cast';
import { BASE_AP, clamp, round1, shuffle, type Rng } from './core';

/** "+4 Skill, −12 Energy, −₹2k" */
export const describeEffects = (e: StatEffects): string =>
  (Object.keys(e) as StatKey[])
    .filter((k) => e[k])
    .map((k) => {
      const v = e[k] ?? 0;
      const sign = v > 0 ? '+' : '−';
      return k === 'money' ? `${sign}₹${Math.abs(v)}k` : `${sign}${Math.abs(v)} ${STATS[k].short}`;
    })
    .join(', ');

export const hasPerk = (g: GameState, p: PerkId) => g.perks.includes(p);

export const apPerWeek = (g: GameState) => BASE_AP + (hasPerk(g, 'night_owl') ? 1 : 0);

/** Romance counts as "on" once started, until a split. */
export const romanceActive = (g: GameState) => g.flags.includes('romance') && !g.flags.includes('romance_split');

export const meetsGate = (g: GameState, gate?: StatGate) => !gate || g.stats[gate.stat] >= gate.min;

/** Perk-adjusted version of a stat change, before it is applied. */
export const adjustEffects = (g: GameState, e: StatEffects): StatEffects => {
  const out: StatEffects = {};
  for (const k of Object.keys(e) as StatKey[]) {
    let d = e[k] ?? 0;
    if (k === 'sanity' && d < 0 && hasPerk(g, 'zen')) d = Math.round(d * 0.7);
    if (k === 'reputation' && d < 0 && hasPerk(g, 'teflon')) d = Math.round(d * 0.7);
    if (k === 'money' && d < 0 && hasPerk(g, 'frugal')) d = round1(d * 0.5);
    if (d) out[k] = d;
  }
  return out;
};

/** Applies (perk-adjusted) effects and reports what actually changed after clamping. */
export const applyEffects = (g: GameState, e: StatEffects): { stats: Stats; applied: StatEffects } => {
  const stats = { ...g.stats };
  const applied: StatEffects = {};
  const adjusted = adjustEffects(g, e);
  for (const k of Object.keys(adjusted) as StatKey[]) {
    const before = stats[k];
    stats[k] = k === 'money' ? round1(before + (adjusted[k] ?? 0)) : clamp(before + (adjusted[k] ?? 0));
    const change = round1(stats[k] - before);
    if (change) applied[k] = change;
  }
  return { stats, applied };
};

export const mergeEffects = (a: StatEffects, b: StatEffects): StatEffects => {
  const out: StatEffects = { ...a };
  for (const k of Object.keys(b) as StatKey[]) out[k] = round1((out[k] ?? 0) + (b[k] ?? 0));
  return out;
};

/** Effects of a weekly activity once perks are taken into account. */
export const activityEffects = (g: GameState, id: ActivityId): StatEffects => {
  const base = { ...ACTIVITIES[id].effects };
  if (id === 'grind' && hasPerk(g, 'monk')) base.skill = (base.skill ?? 0) + 2;
  if (id === 'network' && hasPerk(g, 'connector')) base.network = (base.network ?? 0) + 3;
  return base;
};

/* ------------------------------------------------------------------ *
 * XP and levels
 * ------------------------------------------------------------------ */

export const levelForXp = (xp: number): number => {
  let level = 1;
  for (let i = 0; i < LEVEL_XP.length; i++) if (xp >= LEVEL_XP[i]) level = i + 1;
  return level;
};

export const levelProgress = (xp: number): { level: number; pct: number; next: number | null } => {
  const level = levelForXp(xp);
  const cur = LEVEL_XP[level - 1];
  const next = LEVEL_XP[level];
  return next === undefined ? { level, pct: 1, next: null } : { level, pct: (xp - cur) / (next - cur), next };
};

const rollPerkChoices = (owned: PerkId[], rng: Rng): PerkId[] =>
  shuffle(PERK_IDS.filter((p) => !owned.includes(p)), rng).slice(0, 3);

/** Adds XP; any level-ups queue a perk pick (three random perks not yet owned). */
export const gainXp = (g: GameState, amount: number, rng: Rng): GameState => {
  const xp = g.xp + Math.max(0, Math.round(amount));
  const level = levelForXp(xp);
  const ups = level - g.level;
  if (ups <= 0) return { ...g, xp };
  const choices = g.perkChoices.length ? g.perkChoices : rollPerkChoices(g.perks, rng);
  return {
    ...g,
    xp,
    level,
    pendingPicks: choices.length ? g.pendingPicks + ups : 0,
    perkChoices: choices,
  };
};

export const pickPerk = (g: GameState, perk: PerkId, rng: Rng): GameState => {
  if (!g.perkChoices.includes(perk)) return g;
  const perks = [...g.perks, perk];
  const pendingPicks = Math.max(0, g.pendingPicks - 1);
  const perkChoices = pendingPicks > 0 ? rollPerkChoices(perks, rng) : [];
  const next = { ...g, perks, pendingPicks: perkChoices.length ? pendingPicks : 0, perkChoices };
  // Night Owl pays out immediately for the current week.
  return perk === 'night_owl' ? { ...next, ap: next.ap + 1 } : next;
};
