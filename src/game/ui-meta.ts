import type { Tone, Verdict } from './types';

/** Shared display metadata for scenario outcomes. */
export const VERDICT_META: Record<Verdict, { label: string; emoji: string; color: string }> = {
  best: { label: 'Right call', emoji: '✅', color: '#34d399' },
  okay: { label: 'Risky call', emoji: '⚠️', color: '#fbbf24' },
  bad: { label: 'Wrong call', emoji: '❌', color: '#fb7185' },
  timeout: { label: 'Froze', emoji: '⏱️', color: '#94a3b8' },
};

export const TONE_COLOR: Record<Tone, string> = {
  Diplomatic: '#38bdf8',
  Assertive: '#fb923c',
  Honest: '#a3e635',
  Strategic: '#a78bfa',
  Passive: '#94a3b8',
  Emotional: '#f472b6',
  Evasive: '#facc15',
  Savage: '#fb7185',
};

/** Wraps a line in curly quotes unless it already opens with one. */
export const quoted = (text: string): string => (/^[“"]/.test(text) ? text : `“${text}”`);

/** "+4", "−12" (a real minus sign), or "0". */
export const signed = (n: number): string => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');
