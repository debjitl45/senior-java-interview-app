import {
  Activity,
  Boxes,
  Code,
  Cpu,
  Database,
  FlaskConical,
  Layers,
  Leaf,
  Network,
  Server,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { Difficulty } from './data/questions';

/** lucide icon names referenced from the data layer, resolved here. */
const ICONS: Record<string, LucideIcon> = {
  Activity,
  Boxes,
  Code,
  Cpu,
  Database,
  FlaskConical,
  Layers,
  Leaf,
  Network,
  Server,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
};

export const iconFor = (name: string): LucideIcon => ICONS[name] ?? Code;

export interface DifficultyMeta {
  label: Difficulty;
  emoji: string;
  color: string;
  blurb: string;
}

export const DIFFICULTY_META: Record<Difficulty, DifficultyMeta> = {
  Core: { label: 'Core', emoji: '\u{1F331}', color: '#34d399', blurb: 'Fundamentals you should never fumble' },
  Solid: { label: 'Solid', emoji: '\u{1F4AA}', color: '#38bdf8', blurb: 'Expected at 2-4 years experience' },
  Hard: { label: 'Hard', emoji: '\u{1F525}', color: '#fbbf24', blurb: 'Senior territory' },
  Expert: { label: 'Expert', emoji: '⚡', color: '#fb923c', blurb: 'Staff-level depth' },
  Master: { label: 'Master', emoji: '\u{1F480}', color: '#fb7185', blurb: 'The ones that end interviews' },
};

/** Level ladder. Thresholds are cumulative XP. */
export interface Rank {
  level: number;
  name: string;
  emoji: string;
  xp: number;
}

export const RANKS: Rank[] = [
  { level: 1, name: 'Null Pointer', emoji: '\u{1F423}', xp: 0 },
  { level: 2, name: 'Stack Tracer', emoji: '\u{1F50D}', xp: 120 },
  { level: 3, name: 'Bean Whisperer', emoji: '\u{1F343}', xp: 320 },
  { level: 4, name: 'Thread Weaver', emoji: '\u{1F9F5}', xp: 620 },
  { level: 5, name: 'Heap Surgeon', emoji: '\u{1FA7A}', xp: 1000 },
  { level: 6, name: 'GC Whisperer', emoji: '\u{1F32C}️', xp: 1500 },
  { level: 7, name: 'Latency Slayer', emoji: '⚡', xp: 2100 },
  { level: 8, name: 'System Architect', emoji: '\u{1F5FA}️', xp: 2900 },
  { level: 9, name: 'JVM Sorcerer', emoji: '\u{1F52E}', xp: 3700 },
  { level: 10, name: 'Final Boss', emoji: '\u{1F451}', xp: 4600 },
];

export const rankFor = (xp: number): { rank: Rank; next: Rank | null; progress: number } => {
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].xp) idx = i;
  }
  const rank = RANKS[idx];
  const next = idx + 1 < RANKS.length ? RANKS[idx + 1] : null;
  const progress = next ? Math.min(1, (xp - rank.xp) / (next.xp - rank.xp)) : 1;
  return { rank, next, progress };
};

export interface Achievement {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-blood', name: 'First Blood', emoji: '\u{1F3AF}', description: 'Master your first question' },
  { id: 'ten-down', name: 'Warming Up', emoji: '\u{1F525}', description: 'Master 10 questions' },
  { id: 'fifty-down', name: 'Half Way There', emoji: '\u{1F680}', description: 'Master 50 questions' },
  { id: 'century', name: 'Centurion', emoji: '\u{1F3C6}', description: 'Master 100 questions' },
  { id: 'streak-3', name: 'Consistent', emoji: '\u{1F4C5}', description: 'Keep a 3-day streak' },
  { id: 'streak-7', name: 'Locked In', emoji: '\u{1F512}', description: 'Keep a 7-day streak' },
  { id: 'streak-30', name: 'Unstoppable', emoji: '\u{1F31F}', description: 'Keep a 30-day streak' },
  { id: 'domain-clear', name: 'Domain Cleared', emoji: '\u{1F9E9}', description: 'Master every question in one domain' },
  { id: 'boss-slayer', name: 'Boss Slayer', emoji: '\u{1F480}', description: 'Master 5 Master-tier questions' },
  { id: 'mock-ready', name: 'Mock Ready', emoji: '\u{1F3A4}', description: 'Finish a mock interview' },
  { id: 'sharp-shooter', name: 'Sharp Shooter', emoji: '\u{1F3AF}', description: 'Score 80%+ in a mock interview' },
  { id: 'bug-hunter', name: 'Bug Hunter', emoji: '\u{1F41B}', description: 'Solve 5 spot-the-defect challenges' },
];
