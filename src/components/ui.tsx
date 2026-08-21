import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import type { Difficulty } from '../data/questions';
import { DIFFICULTY_META } from '../theme';

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

/** Confetti burst used for level-ups and mastery milestones. */
export const celebrate = (intensity: 'small' | 'big' = 'small') => {
  const count = intensity === 'big' ? 160 : 60;
  confetti({
    particleCount: count,
    spread: intensity === 'big' ? 100 : 62,
    startVelocity: intensity === 'big' ? 48 : 34,
    origin: { y: 0.62 },
    colors: ['#8b5cf6', '#e879f9', '#22d3ee', '#a3e635', '#fbbf24'],
    disableForReducedMotion: true,
  });
};

/* ------------------------------------------------------------------ *
 * Primitives
 * ------------------------------------------------------------------ */

interface TappableProps extends React.ComponentProps<typeof motion.button> {
  children: React.ReactNode;
  /** Lets callers scope the accent palette for anything rendered inside. */
  'data-accent'?: string;
}

/** Button with a springy press response — the whole app should feel physical. */
export const Tappable: React.FC<TappableProps> = ({ children, ...rest }) => (
  <motion.button
    whileTap={{ scale: 0.96 }}
    transition={{ type: 'spring', stiffness: 520, damping: 30 }}
    {...rest}
  >
    {children}
  </motion.button>
);

export const Chip: React.FC<{
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  title?: string;
}> = ({ active, onClick, children, title }) => (
  <Tappable
    onClick={onClick}
    title={title}
    className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
      active
        ? 'text-[var(--a)] bg-[var(--a-soft)] border border-[var(--a-line)]'
        : 'text-[var(--muted)] bg-white/[0.04] border border-white/[0.08] hover:text-white'
    }`}
  >
    {children}
  </Tappable>
);

export const Badge: React.FC<{ children: React.ReactNode; tone?: 'accent' | 'neutral' }> = ({
  children,
  tone = 'accent',
}) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
      tone === 'accent'
        ? 'text-[var(--a)] bg-[var(--a-soft)] border border-[var(--a-line)]'
        : 'text-[var(--dim)] bg-white/[0.05] border border-white/[0.08]'
    }`}
  >
    {children}
  </span>
);

export const DifficultyTag: React.FC<{ difficulty: Difficulty; compact?: boolean }> = ({
  difficulty,
  compact,
}) => {
  const meta = DIFFICULTY_META[difficulty];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide"
      style={{
        color: meta.color,
        background: `${meta.color}1a`,
        border: `1px solid ${meta.color}44`,
      }}
      title={meta.blurb}
    >
      <span aria-hidden>{meta.emoji}</span>
      {!compact && meta.label}
    </span>
  );
};

/** Slim progress bar that inherits the surrounding accent. */
export const Progress: React.FC<{ value: number; height?: number }> = ({ value, height = 6 }) => (
  <div
    className="w-full overflow-hidden rounded-full bg-white/[0.07]"
    style={{ height }}
    role="progressbar"
    aria-valuenow={Math.round(value * 100)}
    aria-valuemin={0}
    aria-valuemax={100}
  >
    <motion.div
      className="h-full rounded-full"
      style={{ background: 'linear-gradient(90deg, var(--a), var(--a-2))' }}
      initial={{ width: 0 }}
      animate={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      transition={{ type: 'spring', stiffness: 120, damping: 22 }}
    />
  </div>
);

/** Circular progress ring. */
export const Ring: React.FC<{
  value: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}> = ({ value, size = 72, stroke = 6, children }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--a)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
};

export const StatTile: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ label, value, sub, icon }) => (
  <div className="card p-3.5">
    <div className="flex items-center gap-1.5 text-[var(--dim)]">
      {icon}
      <span className="eyebrow">{label}</span>
    </div>
    <div className="mt-1.5 font-display text-2xl leading-none font-bold text-white tabular">{value}</div>
    {sub && <div className="mt-1 text-[11px] text-[var(--muted)]">{sub}</div>}
  </div>
);

export const SectionHeader: React.FC<{
  title: string;
  action?: React.ReactNode;
  hint?: string;
}> = ({ title, action, hint }) => (
  <div className="mb-3 flex items-end justify-between gap-3">
    <div>
      <h3 className="font-display text-sm font-bold text-white">{title}</h3>
      {hint && <p className="mt-0.5 text-[11px] text-[var(--dim)]">{hint}</p>}
    </div>
    {action}
  </div>
);

export const EmptyState: React.FC<{
  emoji: string;
  title: string;
  body: string;
  action?: React.ReactNode;
}> = ({ emoji, title, body, action }) => (
  <div className="card grid place-items-center gap-2 px-6 py-14 text-center">
    <div className="text-4xl" aria-hidden>
      {emoji}
    </div>
    <h4 className="font-display text-base font-bold text-white">{title}</h4>
    <p className="max-w-sm text-xs text-[var(--muted)]">{body}</p>
    {action}
  </div>
);

export const CodeBlock: React.FC<{ code: string; label?: string }> = ({ code, label }) => (
  <div className="overflow-hidden rounded-2xl border border-white/[0.09]">
    {label && (
      <div className="flex items-center gap-1.5 border-b border-white/[0.07] bg-white/[0.03] px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-[#fb7185]" />
        <span className="h-2 w-2 rounded-full bg-[#fbbf24]" />
        <span className="h-2 w-2 rounded-full bg-[#34d399]" />
        <span className="ml-1.5 font-mono text-[10px] text-[var(--dim)]">{label}</span>
      </div>
    )}
    <pre className="code-block !rounded-none !border-0 p-3.5 text-[var(--text)]">
      <code>{code}</code>
    </pre>
  </div>
);

/* ------------------------------------------------------------------ *
 * Markdown
 *
 * The answer bodies are authored as markdown. This renders the subset
 * actually used: headings, bullet and numbered lists, fenced code,
 * tables, bold, and inline code. A line-based block parser is used
 * rather than splitting on blank lines, so fenced blocks containing
 * blank lines survive intact.
 * ------------------------------------------------------------------ */

type Block =
  | { kind: 'h'; level: number; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'code'; text: string; lang?: string }
  | { kind: 'table'; header: string[]; rows: string[][] };

const parseBlocks = (src: string): Block[] => {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  const isTableRow = (l: string) => l.trim().startsWith('|') && l.trim().endsWith('|');
  const cells = (l: string) =>
    l
      .trim()
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim());

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // Fenced code
    const fence = line.trim().match(/^```(\w*)/);
    if (fence) {
      const lang = fence[1] || undefined;
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        buf.push(lines[i]);
        i++;
      }
      i++; // closing fence
      blocks.push({ kind: 'code', text: buf.join('\n'), lang });
      continue;
    }

    // Heading
    const h = line.trim().match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      blocks.push({ kind: 'h', level: h[1].length, text: h[2].trim() });
      i++;
      continue;
    }

    // Table
    if (isTableRow(line) && i + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[i + 1].trim())) {
      const header = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(cells(lines[i]));
        i++;
      }
      blocks.push({ kind: 'table', header, rows });
      continue;
    }

    // Lists
    if (/^\s*[*-]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[*-]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[*-]\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'ul', items });
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'ol', items });
      continue;
    }

    // Paragraph: consume until a blank line or the start of another block
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*[*-]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^#{1,4}\s/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith('```') &&
      !isTableRow(lines[i])
    ) {
      buf.push(lines[i].trim());
      i++;
    }
    if (buf.length) blocks.push({ kind: 'p', text: buf.join(' ') });
  }

  return blocks;
};

const Code: React.FC<{ children: string }> = ({ children }) => (
  <code className="rounded-md border border-[var(--a-line)] bg-[var(--a-soft)] px-1.5 py-0.5 font-mono text-[0.86em] text-[var(--a-2)]">
    {children}
  </code>
);

const Inline: React.FC<{ text: string }> = ({ text }) => {
  const parts = useMemo(() => text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean), [text]);
  return (
    <>
      {parts.map((p, idx) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          // Bold can wrap inline code, so keep processing inside it.
          const inner = p.slice(2, -2).split(/(`[^`]+`)/g).filter(Boolean);
          return (
            <strong key={idx} className="font-semibold text-white">
              {inner.map((seg, j) =>
                seg.startsWith('`') && seg.endsWith('`') ? (
                  <Code key={j}>{seg.slice(1, -1)}</Code>
                ) : (
                  <React.Fragment key={j}>{seg}</React.Fragment>
                ),
              )}
            </strong>
          );
        }
        if (p.startsWith('`') && p.endsWith('`')) {
          return <Code key={idx}>{p.slice(1, -1)}</Code>;
        }
        return <React.Fragment key={idx}>{p}</React.Fragment>;
      })}
    </>
  );
};

export const Markdown: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const blocks = useMemo(() => parseBlocks(text), [text]);

  return (
    <div className={className}>
      {blocks.map((b, idx) => {
        switch (b.kind) {
          case 'h':
            return (
              <h4
                key={idx}
                className="font-display mt-5 mb-2 flex items-center gap-2 text-[13px] font-bold text-[var(--a-2)] first:mt-0"
              >
                <span className="h-3.5 w-0.5 rounded-full bg-[var(--a)]" />
                <Inline text={b.text} />
              </h4>
            );
          case 'p':
            return (
              <p key={idx} className="my-2 text-[13px] leading-relaxed text-[var(--muted)] md:text-sm">
                <Inline text={b.text} />
              </p>
            );
          case 'ul':
            return (
              <ul key={idx} className="my-2 space-y-1.5">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2.5 text-[13px] leading-relaxed text-[var(--muted)] md:text-sm">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--a)]" />
                    <span>
                      <Inline text={it} />
                    </span>
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={idx} className="my-2 space-y-1.5">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2.5 text-[13px] leading-relaxed text-[var(--muted)] md:text-sm">
                    <span className="mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-md bg-[var(--a-soft)] px-1 font-mono text-[10px] font-bold text-[var(--a)]">
                      {j + 1}
                    </span>
                    <span>
                      <Inline text={it} />
                    </span>
                  </li>
                ))}
              </ol>
            );
          case 'code':
            return (
              <div key={idx} className="my-3">
                <CodeBlock code={b.text} label={b.lang} />
              </div>
            );
          case 'table':
            return (
              <div key={idx} className="my-3 overflow-x-auto rounded-xl border border-white/[0.09]">
                <table className="w-full border-collapse text-left text-[12px]">
                  <thead>
                    <tr className="bg-white/[0.04]">
                      {b.header.map((h, j) => (
                        <th key={j} className="px-3 py-2 font-semibold text-white whitespace-nowrap">
                          <Inline text={h} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j} className="border-t border-white/[0.06]">
                        {r.map((c, k) => (
                          <td key={k} className="px-3 py-2 align-top text-[var(--muted)]">
                            <Inline text={c} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </div>
  );
};
