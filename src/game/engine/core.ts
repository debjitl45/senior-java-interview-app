/**
 * Constants, randomness and formatting shared by every engine module.
 * Engine functions are pure: randomness comes in as an `Rng` so the hook
 * can seed it outside React state updaters.
 */
import type { Company } from '../types';

export const SEASON_WEEKS = 30;
export const BASE_AP = 3;
export const PASS_MARK = 7;
export const ROUND_LENGTH = 10;
export const DECISION_SECONDS = 30;
export const MAX_APPLICATIONS = 3;
/** Weeks an invite stays valid after it arrives. */
export const INVITE_TTL = 2;
/** Weeks an offer stays valid after it arrives. */
export const OFFER_TTL = 3;
/** Weeks before a company considers you again after a rejection. */
export const COOLDOWN = 6;
/** Weeks of notice Sachin serves after accepting an offer. */
export const NOTICE_WEEKS = 4;
/** ₹ thousands per remaining week to buy out the notice period. */
export const BUYOUT_PER_WEEK = 12;
export const PAYDAY_EVERY = 4;
/** ₹ thousands left over each payday after rent and bills. */
export const PAYDAY_NET = 15;

export const LETTERS = ['A', 'B', 'C', 'D'] as const;

export type Rng = () => number;

/** Small, fast seeded PRNG (mulberry32). */
export const seeded = (seed: number): Rng => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const newSeed = (): number => Math.floor(Math.random() * 2 ** 32);

export const shuffle = <T>(arr: readonly T[], rng: Rng = Math.random): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const sample = <T>(arr: readonly T[], rng: Rng = Math.random): T => arr[Math.floor(rng() * arr.length)];

/** Picks one item with probability proportional to its weight; undefined if all weights are 0. */
export const weightedPick = <T>(items: readonly T[], weight: (item: T) => number, rng: Rng): T | undefined => {
  const ws = items.map((i) => Math.max(0, weight(i)));
  const total = ws.reduce((a, b) => a + b, 0);
  if (total <= 0) return undefined;
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= ws[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
};

export const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export const round1 = (n: number) => Math.round(n * 10) / 10;

/* ------------------------------------------------------------------ *
 * Calendar & formatting
 * ------------------------------------------------------------------ */

const MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];

/** The season starts in July. */
export const monthOf = (week: number) => MONTHS[Math.min(MONTHS.length - 1, Math.floor((week - 1) / 4.35))];

const num = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/** Savings are stored in ₹ thousands. */
export const formatMoney = (k: number): string => {
  const sign = k < 0 ? '−' : '';
  const v = Math.abs(k);
  if (v >= 100) return `${sign}₹${num(round1(v / 100))}L`;
  return `${sign}₹${Math.round(v)}k`;
};

export const formatPkg = (company: Company, pkg: number): string =>
  company.payUnit === 'month' ? `₹${num(round1(pkg))}k/month` : `${num(round1(pkg))} LPA`;

export const timeAgo = (ts: number, now = Date.now()): string => {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};
