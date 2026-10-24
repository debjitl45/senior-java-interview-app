import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Tappable } from '../components/ui';
import type { CompanyId, CompanyStats, StatEffects, StatKey, Stats } from './types';
import { getCompany } from './data/companies';
import { STATS, STAT_ORDER } from './data/cast';
import { formatMoney } from './engine';
import { signed } from './ui-meta';

/* ------------------------------------------------------------------ *
 * Company branding — parody marks drawn with CSS, nothing ships as an image.
 * ------------------------------------------------------------------ */

const rgb = (hex: string): number[] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

/** WCAG relative luminance. */
const luminance = (hex: string): number => {
  const [r, g, b] = rgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const saturation = (hex: string): number => {
  const v = rgb(hex);
  const max = Math.max(...v);
  return max ? (max - Math.min(...v)) / max : 0;
};

const mix = (hex: string, toward: string, t: number): string => {
  const to = rgb(toward);
  return `#${rgb(hex)
    .map((c, i) => Math.round((c + (to[i] - c) * t) * 255).toString(16).padStart(2, '0'))
    .join('')}`;
};

const CARD_SURFACE = '#15131f';
const PAPER_SURFACE = '#fbf8f1';

/**
 * A readable brand colour for large text on the dark UI (or on the letter paper):
 * the logo background if it reads, else a colourful logo foreground, else a tint of the brand colour.
 */
export const brandText = (id: CompanyId, onPaper = false): string => {
  const { bg, fg } = getCompany(id).brand;
  const surface = onPaper ? PAPER_SURFACE : CARD_SURFACE;
  const readable = (c: string) => contrast(c, surface) >= 3.2;
  if (readable(bg)) return bg;
  if (readable(fg) && (saturation(fg) > 0.2 || saturation(bg) < 0.15)) return fg;
  // A tint is already off-brand, so it should at least be comfortably readable.
  for (let t = 0.1; t < 1; t += 0.1) {
    const c = mix(bg, onPaper ? '#000000' : '#ffffff', t);
    if (contrast(c, surface) >= 4.5) return c;
  }
  return onPaper ? '#111827' : '#ffffff';
};

export const CompanyMark: React.FC<{ id: CompanyId; size?: number; className?: string }> = ({ id, size = 40, className = '' }) => {
  const { brand } = getCompany(id);
  const base = `grid shrink-0 place-items-center rounded-[28%] select-none ${className}`;
  const box = { width: size, height: size };

  if (id === 'googly') {
    return (
      <div className={`${base} bg-white font-display font-black`} style={{ ...box, fontSize: size * 0.58 }} aria-hidden>
        <span
          style={{
            background: 'conic-gradient(from -45deg, #ea4335 0 25%, #4285f4 0 50%, #34a853 0 75%, #fbbc05 0)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            lineHeight: 1,
          }}
        >
          G
        </span>
      </div>
    );
  }
  if (id === 'tipro') {
    return (
      <div className={`${base} border border-white/10`} style={{ ...box, background: brand.bg }} aria-hidden>
        <span
          className="block rounded-full"
          style={{
            width: size * 0.64,
            height: size * 0.64,
            background: 'conic-gradient(#ef4444, #f97316, #eab308, #22c55e, #06b6d4, #6366f1, #a855f7, #ef4444)',
            WebkitMask: 'radial-gradient(circle, transparent 30%, #000 32%)',
            mask: 'radial-gradient(circle, transparent 30%, #000 32%)',
          }}
        />
      </div>
    );
  }
  const emoji = /\p{Extended_Pictographic}/u.test(brand.glyph);
  const scale = emoji ? 0.52 : brand.glyph.length > 1 ? 0.36 : 0.56;
  return (
    <div
      className={`${base} border border-white/10 font-display font-black`}
      style={{ ...box, background: brand.bg, color: brand.fg, fontSize: size * scale, lineHeight: 1 }}
      aria-hidden
    >
      {brand.glyph}
    </div>
  );
};

const GOOGLY_COLORS = ['#4285f4', '#ea4335', '#fbbc05', '#4285f4', '#34a853', '#ea4335'];

export const CompanyWordmark: React.FC<{ id: CompanyId; className?: string; onPaper?: boolean }> = ({ id, className = '', onPaper }) => {
  const c = getCompany(id);
  if (id === 'googly') {
    return (
      <span className={`font-display font-bold tracking-tight ${className}`}>
        {'Googly'.split('').map((ch, i) => (
          <span key={i} style={{ color: GOOGLY_COLORS[i] }}>
            {ch}
          </span>
        ))}
      </span>
    );
  }
  const serif = c.kind === 'lala';
  return (
    <span
      className={`${serif ? 'font-serif uppercase tracking-wide' : 'font-display tracking-tight'} font-black ${className}`}
      style={{ color: brandText(id, onPaper) }}
    >
      {c.name}
    </span>
  );
};

/* ------------------------------------------------------------------ *
 * People
 * ------------------------------------------------------------------ */

export const Avatar: React.FC<{ emoji: string; size?: number; ring?: string; className?: string }> = ({
  emoji,
  size = 44,
  ring = 'rgba(255,255,255,0.14)',
  className = '',
}) => (
  <div
    className={`grid shrink-0 place-items-center rounded-full bg-white/[0.06] leading-none ${className}`}
    style={{ width: size, height: size, fontSize: size * 0.52, boxShadow: `0 0 0 2px ${ring}` }}
    aria-hidden
  >
    {emoji}
  </div>
);

/* ------------------------------------------------------------------ *
 * Typewriter — reveals text a couple of characters per tick.
 * ------------------------------------------------------------------ */

export const Typewriter: React.FC<{ text: string; speed?: number; skip?: boolean; onDone?: () => void; className?: string }> = ({
  text,
  speed = 16,
  skip,
  onDone,
  className,
}) => {
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  const shown = skip || reduce ? text.length : n;
  const done = shown >= text.length;

  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    if (done) return;
    const id = setTimeout(() => setN((x) => Math.min(text.length, x + 2)), speed);
    return () => clearTimeout(id);
  }, [n, done, speed, text.length]);

  useEffect(() => {
    if (done) doneRef.current?.();
  }, [done]);

  return (
    <span className={className}>
      {text.slice(0, shown)}
      {!done && <span className="caret" aria-hidden />}
    </span>
  );
};

/* ------------------------------------------------------------------ *
 * Timing and keyboard
 * ------------------------------------------------------------------ */

/** Restarts whenever `resetKey` changes; `seconds: null` means no clock. */
export const useCountdown = (seconds: number | null, running: boolean, resetKey: string | number, onExpire: () => void): number => {
  const [timer, setTimer] = useState({ key: resetKey, left: seconds ?? 0 });
  // Reset during render so a stale 0 from the previous question can never fire.
  if (timer.key !== resetKey) setTimer({ key: resetKey, left: seconds ?? 0 });
  const left = timer.key === resetKey ? timer.left : (seconds ?? 0);

  const expire = useRef(onExpire);
  useEffect(() => {
    expire.current = onExpire;
  });

  useEffect(() => {
    if (seconds === null || !running) return;
    const id = setInterval(() => setTimer((t) => (t.left <= 0 ? t : { ...t, left: t.left - 1 })), 1000);
    return () => clearInterval(id);
  }, [seconds, running, resetKey]);

  useEffect(() => {
    if (seconds !== null && running && timer.key === resetKey && timer.left <= 0) expire.current();
  }, [timer, seconds, running, resetKey]);

  return left;
};

/** Window-level shortcuts that ignore typing in form fields, modified keys and open dialogs. */
export const useHotkeys = (handler: (e: KeyboardEvent) => void, enabled = true) => {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    if (!enabled) return;
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // A confirm dialog or level-up owns the keyboard while it is open.
      if (document.querySelector('[role="alertdialog"]')) return;
      ref.current(e);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [enabled]);
};

export const TimerBar: React.FC<{ left: number; total: number }> = ({ left, total }) => {
  const pct = Math.max(0, Math.min(1, left / total));
  const color = pct > 0.5 ? '#34d399' : pct > 0.2 ? '#fbbf24' : '#fb7185';
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
      <div className="h-full rounded-full transition-[width] duration-1000 ease-linear" style={{ width: `${pct * 100}%`, background: color }} />
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * Stats
 * ------------------------------------------------------------------ */

export const StatBar: React.FC<{ k: StatKey; value: number; delta?: number }> = ({ k, value, delta }) => {
  const m = STATS[k];
  const low = (k === 'energy' || k === 'sanity' || k === 'reputation') && value < 25;
  return (
    <div title={m.hint}>
      <div className="flex items-center justify-between gap-2 text-[10.5px] font-bold">
        <span className={`truncate ${low ? 'text-rose-300' : 'text-[var(--muted)]'}`}>
          <span aria-hidden>{m.emoji}</span> {m.label}
        </span>
        <span className="text-white tabular">
          {value}
          {delta ? (
            <span className="ml-1" style={{ color: delta > 0 ? '#34d399' : '#fb7185' }}>
              {signed(delta)}
            </span>
          ) : null}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: low ? '#fb7185' : m.color }}
          initial={false}
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', stiffness: 140, damping: 22 }}
        />
      </div>
    </div>
  );
};

export const StatGrid: React.FC<{ stats: Stats; keys?: StatKey[]; deltas?: StatEffects; className?: string }> = ({
  stats,
  keys = STAT_ORDER.filter((k) => k !== 'romance'),
  deltas,
  className = '',
}) => (
  <div className={`grid grid-cols-2 gap-x-4 gap-y-2.5 ${className}`}>
    {keys.map((k) => (
      <StatBar key={k} k={k} value={stats[k]} delta={deltas?.[k]} />
    ))}
  </div>
);

/** "+4 🧠  −12 ⚡  −₹2k" as coloured chips. */
export const DeltaChips: React.FC<{ effects: StatEffects; className?: string }> = ({ effects, className = '' }) => {
  const keys = (Object.keys(effects) as StatKey[]).filter((k) => effects[k]);
  if (!keys.length) return null;
  return (
    <span className={`inline-flex flex-wrap gap-1 ${className}`}>
      {keys.map((k) => {
        const v = effects[k] ?? 0;
        const good = v > 0;
        return (
          <span
            key={k}
            title={STATS[k].label}
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular ${
              good ? 'bg-emerald-400/12 text-emerald-200' : 'bg-rose-400/12 text-rose-200'
            }`}
          >
            {k === 'money' ? (
              `${good ? '+' : '−'}${formatMoney(Math.abs(v))}`
            ) : (
              <>
                {good ? '+' : '−'}
                {Math.abs(v)} <span aria-hidden>{STATS[k].emoji}</span>
              </>
            )}
          </span>
        );
      })}
    </span>
  );
};

/** 1-5 rating rendered as pills; `invert` for stats where high is bad (toxicity). */
export const RatingPills: React.FC<{ value: number; invert?: boolean }> = ({ value, invert }) => {
  const good = invert ? 6 - value : value;
  const color = good >= 4 ? '#34d399' : good === 3 ? '#fbbf24' : '#fb7185';
  return (
    <span className="inline-flex gap-1" role="img" aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className="h-1.5 w-3.5 rounded-full" style={{ background: i < value ? color : 'rgba(255,255,255,0.1)' }} />
      ))}
    </span>
  );
};

const STAT_ROWS: { key: keyof CompanyStats; label: string; invert?: boolean }[] = [
  { key: 'wlb', label: 'Work-life balance' },
  { key: 'toxicity', label: 'Toxicity', invert: true },
  { key: 'pay', label: 'Pay' },
  { key: 'growth', label: 'Growth' },
  { key: 'security', label: 'Job security' },
];

export const StatsList: React.FC<{ stats: CompanyStats }> = ({ stats }) => (
  <div className="space-y-2">
    {STAT_ROWS.map((r) => (
      <div key={r.key} className="flex items-center justify-between gap-3 text-[12px]">
        <span className="text-[var(--muted)]">{r.label}</span>
        <RatingPills value={stats[r.key]} invert={r.invert} />
      </div>
    ))}
  </div>
);

/* ------------------------------------------------------------------ *
 * Buttons
 * ------------------------------------------------------------------ */

type BtnVariant = 'primary' | 'ghost' | 'danger' | 'gold';

const BTN_LOOK: Record<BtnVariant, string> = {
  primary: 'bg-brand text-white shadow-lg shadow-fuchsia-500/20',
  ghost: 'border border-white/[0.1] bg-white/[0.05] text-[var(--text)] hover:bg-white/[0.09]',
  danger: 'border border-rose-400/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/15',
  gold: 'text-[#1c1300] shadow-lg shadow-amber-500/20',
};

export const Btn: React.FC<React.ComponentProps<typeof Tappable> & { variant?: BtnVariant }> = ({
  variant = 'primary',
  className = '',
  style,
  children,
  ...rest
}) => (
  <Tappable
    className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-colors disabled:pointer-events-none disabled:opacity-40 ${BTN_LOOK[variant]} ${className}`}
    style={variant === 'gold' ? { background: 'linear-gradient(180deg, #fcd34d, #f59e0b)', ...style } : style}
    {...rest}
  >
    {children}
  </Tappable>
);
