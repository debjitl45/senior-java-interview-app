import type { Company, CompanyId, CompanyRecord, CompanyStatus, GameState, Mail, Tier } from '../types';
import { COMPANY_IDS, getCompany } from '../data/companies';
import { MAX_APPLICATIONS, clamp, weightedPick, type Rng } from './core';
import { hasPerk } from './stats';

export const companyRecord = (g: GameState, id: CompanyId): CompanyRecord => g.companies[id] ?? { status: 'open', interviews: 0 };

/** Cooldowns lapse on their own once their week arrives. */
export const statusOf = (g: GameState, id: CompanyId): CompanyStatus => {
  const r = companyRecord(g, id);
  return r.status === 'cooldown' && (r.until ?? 0) <= g.week ? 'open' : r.status;
};

export const withCompany = (g: GameState, id: CompanyId, rec: Partial<CompanyRecord>): GameState['companies'] => ({
  ...g.companies,
  [id]: { ...companyRecord(g, id), ...rec },
});

const TIER_BASE: Record<Tier, number> = { S: 0.1, A: 0.25, B: 0.5, C: 0.85 };
/** The skill level a tier expects; every point above or below moves the odds. */
const TIER_BAR: Record<Tier, number> = { S: 70, A: 55, B: 40, C: 0 };

export const shortlistChance = (g: GameState, c: Company): number =>
  clamp(TIER_BASE[c.tier] + (g.stats.skill - TIER_BAR[c.tier]) * 0.015 + g.stats.network * 0.003, 0.05, 0.95);

export const canApply = (g: GameState, id: CompanyId): boolean =>
  statusOf(g, id) === 'open' && !g.applications.includes(id) && g.applications.length < MAX_APPLICATIONS;

/** How likely a company is to reach out on its own, given Sachin's skill. */
const inboundWeight = (g: GameState, c: Company): number => {
  switch (c.tier) {
    case 'S':
      return g.stats.skill >= 60 ? 1 : 0.15;
    case 'A':
      return g.stats.skill >= 45 ? 1 : 0.4;
    case 'B':
      return 1;
    case 'C':
      return 0.5;
  }
};

export const pickInbound = (g: GameState, rng: Rng, tiers?: Tier[]): CompanyId | undefined =>
  weightedPick(
    COMPANY_IDS.filter(
      (id) => statusOf(g, id) === 'open' && !g.applications.includes(id) && (!tiers || tiers.includes(getCompany(id).tier)),
    ),
    (id) => inboundWeight(g, getCompany(id)),
    rng,
  );

/** Builds a mail with an id that stays unique because the mail list only grows. */
export const makeMail = (g: GameState, m: Omit<Mail, 'id' | 'read'>, offset = 0): Mail => ({
  ...m,
  id: `${m.kind}-${m.company ?? m.flavorId ?? 'x'}-w${m.week}-${g.mails.length + offset}`,
  read: false,
});

export const openOffers = (g: GameState): Mail[] => g.mails.filter((m) => m.kind === 'offer' && m.status === 'open');

export const openInvites = (g: GameState): Mail[] => g.mails.filter((m) => m.kind === 'invite' && m.status === 'open');

export const negotiationChance = (g: GameState): number =>
  clamp(
    0.35 + g.stats.charisma * 0.004 + (openOffers(g).length > 1 ? 0.2 : 0) + (hasPerk(g, 'silver') ? 0.25 : 0),
    0.05,
    0.92,
  );
