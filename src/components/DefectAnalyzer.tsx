import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bug, CheckCircle2, Eye, RefreshCw, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CODE_DEFECTS, getCategoryById } from '../data/questions';
import { Badge, Chip, Markdown, Progress, Tappable, celebrate } from './ui';

export const DefectAnalyzer: React.FC = () => {
  const { state, markDefectSolved } = useApp();

  const [selectedId, setSelectedId] = useState(CODE_DEFECTS[0].id);
  const [revealed, setRevealed] = useState(false);
  const [tab, setTab] = useState<'broken' | 'fixed'>('broken');

  const defect = useMemo(
    () => CODE_DEFECTS.find((d) => d.id === selectedId) ?? CODE_DEFECTS[0],
    [selectedId],
  );
  const cat = getCategoryById(defect.categoryId);
  const solvedCount = state.solvedDefects.length;

  const select = (id: string) => {
    setSelectedId(id);
    setRevealed(false);
    setTab('broken');
  };

  const reveal = () => {
    setRevealed(true);
    setTab('fixed');
    if (!state.solvedDefects.includes(defect.id)) {
      markDefectSolved(defect.id);
      celebrate('small');
    }
  };

  return (
    <div className="fade-in mx-auto max-w-5xl space-y-5 p-4 pb-10 md:p-7" data-accent={cat?.accent ?? 'amber'}>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display flex items-center gap-2 text-2xl font-bold text-white md:text-3xl">
            <span aria-hidden>{"\u{1F41B}"}</span> Spot the bug
          </h2>
          <p className="mt-1 max-w-xl text-xs text-[var(--muted)] md:text-sm">
            Every snippet here compiles, passes review, and is wrong. Find the defect before you reveal it —
            that is exactly the exercise a debugging round puts you through.
          </p>
        </div>
        <div className="min-w-[140px]">
          <div className="mb-1 flex justify-between text-[10px] font-bold text-[var(--dim)]">
            <span>SOLVED</span>
            <span className="tabular">
              {solvedCount}/{CODE_DEFECTS.length}
            </span>
          </div>
          <Progress value={solvedCount / CODE_DEFECTS.length} height={6} />
        </div>
      </div>

      {/* Picker */}
      <div className="no-scrollbar edge-fade -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {CODE_DEFECTS.map((d, i) => {
          const c = getCategoryById(d.categoryId);
          const solved = state.solvedDefects.includes(d.id);
          return (
            <span key={d.id} data-accent={c?.accent ?? 'amber'}>
              <Chip active={d.id === selectedId} onClick={() => select(d.id)} title={d.title}>
                <span className="mr-1 font-mono text-[10px] opacity-70">
                  {solved ? '\u2713' : `${i + 1}`}
                </span>
                {d.title}
              </Chip>
            </span>
          );
        })}
      </div>

      {/* Workspace */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-black/25 px-4 py-3.5">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-1.5">
              <Badge>
                <span aria-hidden>{cat?.emoji}</span> {cat?.shortName}
              </Badge>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold text-[var(--dim)]">
                {defect.difficulty}
              </span>
            </div>
            <h3 className="font-display truncate text-sm font-bold text-white">{defect.title}</h3>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
            <Tappable
              onClick={() => setTab('broken')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors ${
                tab === 'broken' ? 'bg-rose-400/12 text-rose-300' : 'text-[var(--dim)] hover:text-white'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" /> Broken
            </Tappable>
            <Tappable
              onClick={reveal}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors ${
                tab === 'fixed' ? 'bg-emerald-400/12 text-emerald-300' : 'text-[var(--dim)] hover:text-white'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Fixed
            </Tappable>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${defect.id}-${tab}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <pre className="code-block max-h-[440px] !rounded-none !border-0 p-4 md:p-5">
              <code>{tab === 'broken' ? defect.code : defect.fixedCode}</code>
            </pre>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col items-center gap-3 border-t border-white/[0.07] bg-black/25 p-4 sm:flex-row sm:justify-between">
          <p className="text-[11.5px] text-[var(--muted)]">
            {revealed ? (
              <span className="flex items-center gap-1.5 font-semibold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" /> Solution revealed
              </span>
            ) : (
              'Read it properly first. Say the bug out loud, then check yourself.'
            )}
          </p>

          {!revealed ? (
            <Tappable
              onClick={reveal}
              className="bg-brand flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white sm:w-auto"
            >
              <Eye className="h-4 w-4" /> Reveal the defect
            </Tappable>
          ) : (
            <Tappable
              onClick={() => {
                setRevealed(false);
                setTab('broken');
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2 text-[11px] font-bold text-[var(--muted)] hover:text-white sm:w-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Look again
            </Tappable>
          )}
        </div>
      </div>

      {/* Breakdown */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="card border-rose-400/20 bg-rose-400/[0.05] p-4">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-rose-300 uppercase">
                <Bug className="h-3.5 w-3.5" /> The defect
              </div>
              <p className="text-[13px] leading-relaxed text-[var(--text)]">{defect.defectDescription}</p>
            </div>

            <div className="card p-4 md:p-5">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-[var(--a)] uppercase">
                <ShieldAlert className="h-3.5 w-3.5" /> Full breakdown
              </div>
              <Markdown text={defect.explanation} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
