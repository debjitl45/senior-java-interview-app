import type { Activity, ActivityId, Background, BackgroundId, Perk, PerkId } from '../types';

/* ------------------------------------------------------------------ *
 * Backgrounds — the character-creation pick. Same Sachin, different build.
 * ------------------------------------------------------------------ */

export const BACKGROUNDS: Record<BackgroundId, Background> = {
  topper: {
    id: 'topper',
    emoji: '\u{1F393}',
    name: 'The Topper',
    tagline: 'NIT gold medallist. Can invert a binary tree blindfolded.',
    desc: 'Strong technical base, average people skills. Interviews feel easier; office politics does not.',
    stats: { skill: 58, charisma: 32, energy: 70, sanity: 55, reputation: 50, network: 40, romance: 0, money: 80 },
  },
  fighter: {
    id: 'fighter',
    emoji: '\u{1F94A}',
    name: 'Tier-3 Fighter',
    tagline: 'Self-taught from YouTube at 2x speed. Never gives up.',
    desc: 'Balanced and resilient: more energy and sanity, less money. The underdog build.',
    stats: { skill: 45, charisma: 42, energy: 82, sanity: 68, reputation: 55, network: 32, romance: 0, money: 35 },
  },
  talker: {
    id: 'talker',
    emoji: '\u{1F3A4}',
    name: 'The Smooth Talker',
    tagline: 'Won every college debate. Also the fest anchor.',
    desc: 'Great at HR rounds, negotiation and politics. Needs to grind for the technical rounds.',
    stats: { skill: 36, charisma: 62, energy: 72, sanity: 60, reputation: 52, network: 55, romance: 0, money: 55 },
  },
  nepo: {
    id: 'nepo',
    emoji: '\u{1F48E}',
    name: 'The Nepo Kid',
    tagline: 'Papa knows a guy. Papa knows every guy.',
    desc: 'Big savings and a huge network, but skills and grit are... a work in progress.',
    stats: { skill: 34, charisma: 46, energy: 75, sanity: 72, reputation: 45, network: 68, romance: 0, money: 300 },
  },
};

export const BACKGROUND_IDS: BackgroundId[] = ['topper', 'fighter', 'talker', 'nepo'];

/* ------------------------------------------------------------------ *
 * Perks — one pick from three at every level-up.
 * ------------------------------------------------------------------ */

export const PERKS: Record<PerkId, Perk> = {
  night_owl: { id: 'night_owl', emoji: '\u{1F989}', name: 'Night Owl', desc: '+1 action point every week.' },
  zen: { id: 'zen', emoji: '\u{1F9D8}', name: 'Zen Mode', desc: 'Sanity losses are 30% smaller.' },
  chai: { id: 'chai', emoji: '☕', name: 'Chai Powered', desc: '+10 extra energy at the start of every week.' },
  monk: { id: 'monk', emoji: '\u{1F4DA}', name: 'LeetCode Monk', desc: 'Grinding gives +2 extra skill.' },
  silver: { id: 'silver', emoji: '\u{1F5E3}️', name: 'Silver Tongue', desc: '+25% negotiation success and warmer HR rounds.' },
  connector: { id: 'connector', emoji: '\u{1F578}️', name: 'Super Connector', desc: 'Recruiters reach out more; networking gives +3 extra.' },
  hoarder: { id: 'hoarder', emoji: '\u{1F6DF}', name: 'Lifeline Hoarder', desc: 'An extra 50:50 in every interview.' },
  teflon: { id: 'teflon', emoji: '\u{1F6E1}️', name: 'Teflon', desc: 'Reputation losses are 30% smaller.' },
  frugal: { id: 'frugal', emoji: '\u{1F4B8}', name: 'Frugal', desc: 'Spending costs half; +₹5k every payday.' },
  clutch: { id: 'clutch', emoji: '\u{1F3AF}', name: 'Clutch Player', desc: '+10 seconds on every interview clock.' },
};

export const PERK_IDS = Object.keys(PERKS) as PerkId[];

/** Cumulative XP needed for each level; index 0 is level 1. */
export const LEVEL_XP = [0, 150, 400, 750, 1200, 1750, 2400, 3200, 4100, 5100];

/* ------------------------------------------------------------------ *
 * Weekly activities — each costs one action point.
 * ------------------------------------------------------------------ */

export const ACTIVITIES: Record<ActivityId, Activity> = {
  grind: {
    id: 'grind',
    emoji: '\u{1F4DA}',
    name: 'Grind LeetCode',
    desc: 'Two hours of problems and one existential crisis.',
    effects: { skill: 4, energy: -12, sanity: -2 },
    xp: 10,
  },
  recharge: {
    id: 'recharge',
    emoji: '\u{1F9D8}',
    name: 'Recharge',
    desc: 'Sleep, gym, mom’s phone call. Touch grass.',
    effects: { energy: 22, sanity: 8 },
    xp: 6,
  },
  network: {
    id: 'network',
    emoji: '\u{1F91D}',
    name: 'Network',
    desc: 'Meetups, coffee chats, LinkedIn comments that aren’t “Congrats!”.',
    effects: { network: 5, charisma: 2, energy: -6 },
    xp: 10,
  },
  impress: {
    id: 'impress',
    emoji: '\u{1F4BC}',
    name: 'Impress at work',
    desc: 'Pick up the gnarly ticket everyone is avoiding.',
    effects: { reputation: 6, skill: 1, energy: -10, sanity: -2 },
    xp: 10,
  },
  present: {
    id: 'present',
    emoji: '\u{1F3A4}',
    name: 'Demo day',
    desc: 'Present your work at the team demo. Sweaty palms, big upside.',
    effects: { charisma: 4, reputation: 2, energy: -6 },
    xp: 10,
  },
  date: {
    id: 'date',
    emoji: '❤️',
    name: 'Date night',
    desc: 'Dinner with Riya. Phone face-down. Mostly.',
    effects: { romance: 8, sanity: 6, money: -2 },
    xp: 8,
    requires: 'romance',
  },
};

export const ACTIVITY_IDS: ActivityId[] = ['grind', 'recharge', 'network', 'impress', 'present', 'date'];
