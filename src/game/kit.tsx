import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Tappable } from '../components/ui';
import type { CompanyId, CompanyStats, MeterKey, Meters } from './types';
import { METERS, METER_KEYS } from './data/cast';

/* ------------------------------------------------------------------ *
 * Company branding — parody marks, drawn with CSS so nothing ships as an image.
 * ------------------------------------------------------------------ */

export const CompanyMark: React.FC<{ id: CompanyId; size?: number; className?: string }> = ({
  id,
  size = 40,
  className = '',
}) => {
  const base = `grid shrink-0 place-items-center rounded-[28%] select-none ${className}`;
  const box = { width: size, height: size };

  switch (id) {
    case 'googly':
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
    case 'tipro':
      return (
        <div className={`${base} border border-white/10 bg-[#0f172a]`} style={box} aria-hidden>
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
    case 'twiggy':
      return (
        <div
          className={`${base} font-display font-black text-white`}
          style={{ ...box, fontSize: size * 0.55, background: 'linear-gradient(135deg, #ff9a3c, #fc5c11)' }}
          aria-hidden
        >
          t
        </div>
      );
    case 'jha2':
      return (
        <div
          className={`${base} font-serif font-black`}
          style={{ ...box, fontSize: size * 0.36, color: '#fcd34d', background: 'linear-gradient(135deg, #8b1c1c, #450a0a)' }}
          aria-hidden
        >
          J2
        </div>
      );
  }
};

const GOOGLY_COLORS = ['#4285f4', '#ea4335', '#fbbc05', '#4285f4', '#34a853', '#ea4335'];

/** Wordmark. `onPaper` switches to colours that read on the light letter background. */
export const CompanyWordmark: React.FC<{ id: CompanyId; className?: string; onPaper?: boolean }> = ({
  id,
  className = '',
  onPaper,
}) => {
  switch (id) {
    case 'googly':
      return (
        <span className={`font-display font-bold tracking-tight ${className}`}>
          {'Googly'.split('').map((ch, i) => (
            <span key={i} style={{ color: GOOGLY_COLORS[i] }}>
              {ch}
            </span>
          ))}
        </span>
      );
    case 'tipro':
      return (
        <span className={`font-display font-bold tracking-tight ${className}`} style={{ color: onPaper ? '#312e81' : '#c7d2fe' }}>
          tipro
        </span>
      );
    case 'twiggy':
      return (
        <span className={`font-display font-black tracking-tight ${className}`} style={{ color: '#fc6a11' }}>
          twiggy
        </span>
      );
    case 'jha2':
      return (
        <span className={`font-serif font-black tracking-wide uppercase ${className}`} style={{ color: onPaper ? '#7f1d1d' : '#fcd34d' }}>
          Jha2 Infotech
        </span>
      );
  }
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
 * Parents pass `skip` to show everything at once.
 * ------------------------------------------------------------------ */

export const Typewriter: React.FC<{
  text: string;
  speed?: number;
  skip?: boolean;
  onDone?: () => void;
  className?: string;
}> = ({ text, speed = 16, skip, onDone, className }) => {
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
 * Countdown — restarts whenever `resetKey` changes; `seconds: null` = no clock.
 * ------------------------------------------------------------------ */

export const useCountdown = (
  seconds: number | null,
  running: boolean,
  resetKey: string | number,
  onExpire: () => void,
): number => {
  const [timer, setTimer] = useState({ key: resetKey, left: seconds ?? 0 });
  // Reset synchronously during render so a stale 0 from the last question can never fire.
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

/** Window-level shortcuts that ignore typing in form fields and modified keys. */
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
      // A confirm dialog owns the keyboard while it is open.
      if (document.querySelector('[role="alertdialog"]')) return;
      ref.current(e);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [enabled]);
};

/* ------------------------------------------------------------------ *
 * Bars, dots and buttons
 * ------------------------------------------------------------------ */

export const TimerBar: React.FC<{ left: number; total: number }> = ({ left, total }) => {
  const pct = Math.max(0, Math.min(1, left / total));
  const color = pct > 0.5 ? '#34d399' : pct > 0.2 ? '#fbbf24' : '#fb7185';
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
      <div
        className="h-full rounded-full transition-[width] duration-1000 ease-linear"
        style={{ width: `${pct * 100}%`, background: color }}
      />
    </div>
  );
};

export const MeterBar: React.FC<{ k: MeterKey; value: number; delta?: number }> = ({ k, value, delta }) => {
  const m = METERS[k];
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[10.5px] font-bold">
        <span className="truncate text-[var(--muted)]">
          <span aria-hidden>{m.emoji}</span> {m.label}
        </span>
        <span className="text-white tabular">
          {value}
          {delta ? (
            <span className="ml-1" style={{ color: delta > 0 ? '#34d399' : '#fb7185' }}>
              {delta > 0 ? '+' : ''}
              {delta}
            </span>
          ) : null}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: m.color }}
          initial={false}
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', stiffness: 140, damping: 22 }}
        />
      </div>
    </div>
  );
};

export const MetersGrid: React.FC<{ meters: Meters; deltas?: Partial<Meters>; className?: string }> = ({
  meters,
  deltas,
  className = '',
}) => (
  <div className={`grid grid-cols-2 gap-x-4 gap-y-2.5 ${className}`}>
    {METER_KEYS.map((k) => (
      <MeterBar key={k} k={k} value={meters[k]} delta={deltas?.[k]} />
    ))}
  </div>
);

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
