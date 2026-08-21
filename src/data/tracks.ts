import type { Track } from './types';

/**
 * Curated study paths. Tracks slice the bank across categories so the
 * library never feels like one undifferentiated wall of questions.
 */
export const TRACKS: Track[] = [
  {
    id: 'ramp-up',
    name: 'The Ramp-Up',
    emoji: '\u{1F680}',
    tagline: 'Everything a 2-4 YOE dev is expected to answer without blinking.',
    accent: 'cyan',
    difficulties: ['Core', 'Solid'],
  },
  {
    id: 'concurrency-gauntlet',
    name: 'Concurrency Gauntlet',
    emoji: '\u{1F9F5}',
    tagline: 'Threads, memory visibility and Loom. The round that breaks people.',
    accent: 'amber',
    categoryIds: ['concurrency'],
  },
  {
    id: 'jvm-deep-dive',
    name: 'Under The Hood',
    emoji: '\u{1F527}',
    tagline: 'GC, JIT and the memory model, all the way down.',
    accent: 'violet',
    categoryIds: ['jvm', 'profiling'],
  },
  {
    id: 'spring-mastery',
    name: 'Spring Boot Boss Fight',
    emoji: '\u{1F343}',
    tagline: 'Proxies, transactions and the auto-config magic you have to explain.',
    accent: 'emerald',
    categoryIds: ['spring', 'persistence'],
  },
  {
    id: 'design-blitz',
    name: 'System Design Blitz',
    emoji: '\u{1F5FA}️',
    tagline: 'Distributed systems questions asked in the 45-minute round.',
    accent: 'indigo',
    categoryIds: ['architecture'],
  },
  {
    id: 'modern-upgrade',
    name: 'Java 25 Glow-Up',
    emoji: '✨',
    tagline: 'Prove you have not been writing Java 8 for a decade.',
    accent: 'fuchsia',
    categoryIds: ['modern', 'streams'],
  },
  {
    id: 'daily-core',
    name: 'Daily Fundamentals',
    emoji: '\u{1F4DA}',
    tagline: 'Collections, streams and the language rules interviewers still check.',
    accent: 'teal',
    categoryIds: ['collections', 'streams'],
  },
  {
    id: 'ship-it-safely',
    name: 'Ship It Safely',
    emoji: '\u{1F6E1}️',
    tagline: 'Testing and security, the two rounds nobody prepares for.',
    accent: 'rose',
    categoryIds: ['testing', 'security'],
  },
  {
    id: 'final-boss',
    name: 'Final Boss',
    emoji: '\u{1F480}',
    tagline: 'Only Expert and Master questions. Good luck.',
    accent: 'orange',
    difficulties: ['Expert', 'Master'],
  },
];
