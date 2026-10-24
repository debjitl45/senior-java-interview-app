import type { AccentKey } from '../../../data/types';
import type { Company, CompanyId, CompanyKind, CompanyStats, Persona, Reaction, ReactionBucket, Tier, Topic } from '../../types';
import { ARCHETYPES } from '../archetypes';

/** What a company file has to state; everything else comes from its archetype. */
export interface CompanySeed {
  id: CompanyId;
  name: string;
  kind: CompanyKind;
  tier: Tier;
  tagline: string;
  accent: AccentKey;
  brand: Company['brand'];
  location: string;
  /** Fictional mail domain, e.g. "macrosoft.careers". */
  domain: string;
  stats: CompanyStats;
  culture: string[];
  reviews: Company['reviews'];
  vibe: string[];
  interviewer: Company['interviewer'];
  ctc: [number, number];
  payUnit?: 'lpa' | 'month';
  payNote?: string;
  topics?: Partial<Record<Topic, number>>;
  role?: string;
  perks?: string[];
  finePrint?: string;
  epilogue: string;
  invite?: Partial<Company['invite']>;
  offer?: Partial<Company['offer']>;
  rejection?: Partial<Company['rejection']>;
  reactions?: Partial<Record<ReactionBucket, Reaction>>;
  barRaiser?: Company['barRaiser'];
  hr?: Persona;
}

/** Stable pick so a company always gets the same bar raiser and HR persona. */
const stablePick = <T>(arr: T[], key: string): T => {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return arr[h % arr.length];
};

export const defineCompany = (s: CompanySeed): Company => {
  const a = ARCHETYPES[s.kind];
  const offer = a.offer(s.name);
  return {
    id: s.id,
    name: s.name,
    kind: s.kind,
    tier: s.tier,
    tagline: s.tagline,
    accent: s.accent,
    brand: s.brand,
    location: s.location,
    stats: s.stats,
    culture: s.culture,
    reviews: s.reviews,
    vibe: s.vibe,
    interviewer: s.interviewer,
    barRaiser: s.barRaiser ?? stablePick(a.barRaisers, s.id),
    hr: s.hr ?? stablePick(a.hrs, s.id),
    ctc: s.ctc,
    payUnit: s.payUnit ?? 'lpa',
    payNote: s.payNote,
    topics: { ...a.topics, ...s.topics },
    invite: { ...a.invite(s.name, s.domain), ...s.invite },
    offer: {
      ...offer,
      role: s.role ?? offer.role,
      perks: s.perks ?? offer.perks,
      finePrint: s.finePrint ?? offer.finePrint,
      ...s.offer,
    },
    rejection: { ...a.rejection(s.name), ...s.rejection },
    reactions: { ...a.reactions(s.name), ...s.reactions },
    epilogue: s.epilogue,
  };
};
