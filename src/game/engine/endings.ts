import type { Company, EndingId, EndingState, GameState, RomanceOutcome } from '../types';
import { ENDING_IDS } from '../data/endings';
import { getCompany } from '../data/companies';
import { SEASON_WEEKS } from './core';

export const romanceOutcome = (g: GameState): RomanceOutcome => {
  if (g.flags.includes('romance_split')) return 'split';
  if (!g.flags.includes('romance')) return null;
  if (g.stats.romance >= 80 || (g.flags.includes('romance_serious') && g.stats.romance >= 65)) return 'engaged';
  if (g.stats.romance >= 45) return 'together';
  return 'split';
};

/** Accepting an offer ends the season; the company and Sachin's state decide how. */
export const offerEnding = (g: GameState, c: Company): EndingId => {
  const topTier = c.tier === 'S' || c.tier === 'A';
  if (topTier && g.stats.sanity < 35) return 'golden';
  if (topTier && g.stats.sanity >= 65 && g.stats.reputation >= 50) return 'dream';
  switch (c.kind) {
    case 'product':
      return 'bigtech';
    case 'bank':
      return 'wallstreet';
    case 'startup':
      return 'rocket';
    case 'service':
      return 'service';
    case 'telecom':
      return 'telecom';
    case 'lala':
      return 'lala';
  }
};

/** No offer accepted by the end of the season. */
export const seasonEndEnding = (g: GameState): EndingId => {
  const s = g.stats;
  if (s.skill >= 80 && s.network >= 70 && s.charisma >= 55 && s.money >= 250) return 'founder';
  if (s.charisma >= 75 && s.network >= 75) return 'influencer';
  if (s.reputation >= 75) return 'loyal';
  return 'comfort';
};

/** The ending after notice is served: the new company plus Sachin's state on his last day. */
export const noticeEnding = (g: GameState): EndingState => {
  const n = g.notice!;
  return { id: offerEnding(g, getCompany(n.company)), week: Math.min(g.week, SEASON_WEEKS), company: n.company, pkg: n.pkg, romance: romanceOutcome(g) };
};

/** Game-over and season-end checks, run when a week closes. */
export const checkEnding = (g: GameState): EndingState | null => {
  const romance = romanceOutcome(g);
  if (g.stats.sanity <= 0) return { id: 'burnout', week: g.week, romance };
  // Nobody bothers firing someone who is already serving notice.
  if (g.stats.reputation <= 0 && !g.notice) return { id: 'fired', week: g.week, romance };
  if (g.notice && (g.notice.weeksLeft <= 0 || g.week > SEASON_WEEKS)) return noticeEnding(g);
  if (g.week > SEASON_WEEKS) return { id: seasonEndEnding(g), week: SEASON_WEEKS, romance };
  return null;
};

/* ------------------------------------------------------------------ *
 * Endings gallery — survives new games and save deletion on purpose.
 * ------------------------------------------------------------------ */

const GALLERY_KEY = 'JavaMaster_InterviewRPG_endings';

export const readGallery = (): EndingId[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(GALLERY_KEY) ?? '[]') as unknown;
    return Array.isArray(raw) ? (raw.filter((id) => ENDING_IDS.includes(id as EndingId)) as EndingId[]) : [];
  } catch {
    return [];
  }
};

export const unlockEnding = (id: EndingId): EndingId[] => {
  const all = readGallery();
  if (all.includes(id)) return all;
  const next = [...all, id];
  try {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — the ending still shows, it just isn't remembered */
  }
  return next;
};
