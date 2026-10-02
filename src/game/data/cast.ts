import type { CastId, CastMember, MeterKey } from '../types';

export const SACHIN = {
  name: 'Sachin',
  age: 24,
  role: 'Java Developer · 2 YOE',
  avatar: '\u{1F468}\u{1F3FD}‍\u{1F4BB}',
  bio: 'Two years at Infinite Loop Solutions. Knows Spring Boot, survives on chai, and is ready for a switch.',
};

export const CURRENT_EMPLOYER = 'Infinite Loop Solutions Pvt. Ltd.';

/** The people at Sachin's current job who show up in the corporate scenarios. */
export const CAST: Record<CastId, CastMember> = {
  rakesh: {
    id: 'rakesh',
    name: 'Rakesh',
    role: 'Engineering Manager',
    avatar: '\u{1F9D4}\u{1F3FD}‍♂️',
    color: '#fbbf24',
  },
  pooja: {
    id: 'pooja',
    name: 'Pooja',
    role: 'HR Business Partner',
    avatar: '\u{1F469}\u{1F3FD}‍\u{1F4BC}',
    color: '#f0abfc',
  },
  rohit: {
    id: 'rohit',
    name: 'Rohit',
    role: 'Teammate · SDE II',
    avatar: '\u{1F60F}',
    color: '#fb7185',
  },
  ananya: {
    id: 'ananya',
    name: 'Ananya',
    role: 'Senior Engineer · Mentor',
    avatar: '\u{1F469}\u{1F3FD}‍\u{1F4BB}',
    color: '#34d399',
  },
  vikram: {
    id: 'vikram',
    name: 'Vikram',
    role: 'Teammate · Chai buddy',
    avatar: '☕',
    color: '#38bdf8',
  },
  meera: {
    id: 'meera',
    name: 'Meera Bansal',
    role: 'Director of Engineering',
    avatar: '\u{1F9D1}\u{1F3FD}‍\u{1F4BC}',
    color: '#a5b4fc',
  },
};

export interface MeterMeta {
  label: string;
  /** Who "remembers" a big swing in this meter, Telltale-style. */
  who: string;
  emoji: string;
  color: string;
}

export const METERS: Record<MeterKey, MeterMeta> = {
  manager: { label: 'Manager trust', who: 'Rakesh', emoji: '\u{1F91D}', color: '#fbbf24' },
  hr: { label: 'HR rapport', who: 'Pooja', emoji: '\u{1F4CB}', color: '#f0abfc' },
  team: { label: 'Team respect', who: 'The team', emoji: '\u{1F465}', color: '#38bdf8' },
  sanity: { label: 'Sanity', who: 'Sachin’s sanity', emoji: '\u{1F9E0}', color: '#34d399' },
};

export const METER_KEYS: MeterKey[] = ['manager', 'hr', 'team', 'sanity'];
