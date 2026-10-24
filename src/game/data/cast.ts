import type { CastId, CastMember, StatKey } from '../types';

export const SACHIN = {
  name: 'Sachin',
  age: 24,
  role: 'Java Developer · 2 YOE',
  avatar: '\u{1F468}\u{1F3FD}‍\u{1F4BB}',
  bio: 'Two years at Infinite Loop Solutions. Knows Spring Boot, survives on chai, and is ready for a switch.',
};

export const CURRENT_EMPLOYER = 'Infinite Loop Solutions Pvt. Ltd.';

/** The people at Sachin's current job who show up in the office scenarios. */
export const CAST: Record<CastId, CastMember> = {
  rakesh: { id: 'rakesh', name: 'Rakesh', role: 'Engineering Manager', avatar: '\u{1F9D4}\u{1F3FD}‍♂️', color: '#fbbf24' },
  pooja: { id: 'pooja', name: 'Pooja', role: 'HR Business Partner', avatar: '\u{1F469}\u{1F3FD}‍\u{1F4BC}', color: '#f0abfc' },
  rohit: { id: 'rohit', name: 'Rohit', role: 'Teammate · SDE II', avatar: '\u{1F60F}', color: '#fb7185' },
  ananya: { id: 'ananya', name: 'Ananya', role: 'Senior Engineer · Mentor', avatar: '\u{1F469}\u{1F3FD}‍\u{1F4BB}', color: '#34d399' },
  vikram: { id: 'vikram', name: 'Vikram', role: 'Teammate · Chai buddy', avatar: '☕', color: '#38bdf8' },
  meera: { id: 'meera', name: 'Meera Bansal', role: 'Director of Engineering', avatar: '\u{1F9D1}\u{1F3FD}‍\u{1F4BC}', color: '#a5b4fc' },
  riya: { id: 'riya', name: 'Riya', role: 'Data Analyst · Data team', avatar: '\u{1F469}\u{1F3FD}', color: '#f472b6' },
  neha: { id: 'neha', name: 'Neha', role: 'QA Engineer · Teammate', avatar: '\u{1F469}\u{1F3FD}‍\u{1F52C}', color: '#fda4af' },
  tanmay: { id: 'tanmay', name: 'Tanmay', role: 'Intern', avatar: '\u{1F9D1}\u{1F3FD}‍\u{1F393}', color: '#a3e635' },
  shreya: { id: 'shreya', name: 'Shreya', role: 'Product Manager', avatar: '\u{1F469}\u{1F3FD}‍\u{1F3EB}', color: '#fb923c' },
  karthik: { id: 'karthik', name: 'Karthik', role: 'Platform Team Lead', avatar: '\u{1F9D4}\u{1F3FE}', color: '#22d3ee' },
  sam: { id: 'sam', name: 'Sam', role: 'US Counterpart · Seattle', avatar: '\u{1F9D1}\u{1F3FC}‍\u{1F4BB}', color: '#93c5fd' },
  tanvi: { id: 'tanvi', name: 'Tanvi', role: 'Junior Analyst', avatar: '\u{1F469}\u{1F3FB}', color: '#c4b5fd' },
};

export interface StatMeta {
  label: string;
  short: string;
  emoji: string;
  color: string;
  /** Telltale-style "X will remember that" subject for big swings. */
  who: string;
  hint: string;
}

export const STATS: Record<StatKey, StatMeta> = {
  skill: { label: 'Tech skill', short: 'Skill', emoji: '\u{1F9E0}', color: '#a78bfa', who: 'Your skills', hint: 'Unlocks better invites and the Sharp interview buff (65+).' },
  charisma: { label: 'Charisma', short: 'Charisma', emoji: '\u{1F5E3}️', color: '#f472b6', who: 'Your reputation as a communicator', hint: 'Better HR rounds and negotiations; unlocks special dialogue.' },
  energy: { label: 'Energy', short: 'Energy', emoji: '⚡', color: '#fbbf24', who: 'Your body', hint: 'Below 25 you walk into interviews exhausted (shorter clocks).' },
  sanity: { label: 'Sanity', short: 'Sanity', emoji: '\u{1F60C}', color: '#34d399', who: 'Your sanity', hint: 'Hit 0 and Sachin burns out. Below 30 he interviews anxious.' },
  reputation: { label: 'Reputation', short: 'Rep', emoji: '⭐', color: '#38bdf8', who: 'Your manager', hint: 'Standing at Infinite Loop. Hit 0 and you get fired.' },
  network: { label: 'Network', short: 'Network', emoji: '\u{1F91D}', color: '#22d3ee', who: 'Your network', hint: 'More recruiters reach out; boosts shortlist chances.' },
  romance: { label: 'Romance', short: 'Romance', emoji: '❤️', color: '#fb7185', who: 'Riya', hint: 'Only matters once something starts with Riya.' },
  money: { label: 'Savings', short: 'Savings', emoji: '\u{1F4B0}', color: '#4ade80', who: 'Your wallet', hint: 'In ₹. Payday every 4 weeks; some endings need a cushion.' },
};

/** Display order for stat panels; romance is shown only once the arc starts. */
export const STAT_ORDER: StatKey[] = ['skill', 'charisma', 'energy', 'sanity', 'reputation', 'network', 'romance'];
