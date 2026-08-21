import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Bookmark,
  Check,
  ChevronDown,
  HelpCircle,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  CATEGORIES,
  DIFFICULTY_ORDER,
  QUESTIONS,
  TRACKS,
  XP_BY_DIFFICULTY,
  getCategoryById,
  getTrackById,
  getTrackQuestions,
  type Difficulty,
  type Question,
} from '../data/questions';
import {
  Badge,
  Chip,
  CodeBlock,
  DifficultyTag,
  EmptyState,
  Markdown,
  Tappable,
  celebrate,
} from './ui';

interface LibraryProps {
  selectedCategory: string | null;
  setSelectedCategory: (catId: string | null) => void;
  selectedTrack: string | null;
  setSelectedTrack: (trackId: string | null) => void;
}

export const Library: React.FC<LibraryProps> = ({
  selectedCategory,
  setSelectedCategory,
  selectedTrack,
  setSelectedTrack,
}) => {
  const { isSaved, isCompleted, toggleSaveQuestion, toggleCompleteQuestion, stats } = useApp();

  const [query, setQuery] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const [hideMastered, setHideMastered] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);

  const trackIds = useMemo(() => {
    const t = selectedTrack ? getTrackById(selectedTrack) : undefined;
    return t ? new Set(getTrackQuestions(t).map((q) => q.id)) : null;
  }, [selectedTrack]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return QUESTIONS.filter((item) => {
      if (selectedCategory && item.categoryId !== selectedCategory) return false;
      if (trackIds && !trackIds.has(item.id)) return false;
      if (difficulty && item.difficulty !== difficulty) return false;
      if (savedOnly && !isSaved(item.id)) return false;
      if (hideMastered && isCompleted(item.id)) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.question.toLowerCase().includes(q) ||
        item.scenario.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query, selectedCategory, trackIds, difficulty, savedOnly, hideMastered, isSaved, isCompleted]);

  const activeFilters =
    (selectedCategory ? 1 : 0) + (selectedTrack ? 1 : 0) + (difficulty ? 1 : 0) + (savedOnly ? 1 : 0) + (hideMastered ? 1 : 0);

  const resetAll = () => {
    setSelectedCategory(null);
    setSelectedTrack(null);
    setDifficulty(null);
    setSavedOnly(false);
    setHideMastered(false);
    setQuery('');
  };

  const onMaster = (q: Question) => {
    const nowComplete = toggleCompleteQuestion(q.id);
    if (nowComplete) celebrate(q.difficulty === 'Master' || q.difficulty === 'Expert' ? 'big' : 'small');
  };

  const activeTrack = selectedTrack ? getTrackById(selectedTrack) : undefined;

  return (
    <div className="fade-in mx-auto max-w-5xl space-y-5 p-4 pb-10 md:p-7">
      {/* ---------------- Header ---------------- */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
            {activeTrack ? (
              <span className="flex items-center gap-2">
                <span aria-hidden>{activeTrack.emoji}</span>
                {activeTrack.name}
              </span>
            ) : selectedCategory ? (
              <span className="flex items-center gap-2">
                <span aria-hidden>{getCategoryById(selectedCategory)?.emoji}</span>
                {getCategoryById(selectedCategory)?.name}
              </span>
            ) : (
              'Question library'
            )}
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)] md:text-sm">
            {activeTrack?.tagline ??
              getCategoryById(selectedCategory ?? '')?.description ??
              `${QUESTIONS.length} deep dives across ${CATEGORIES.length} domains. ${stats.mastered} mastered.`}
          </p>
        </div>

        <div className="rounded-full border border-white/[0.09] bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-[var(--muted)] tabular">
          {results.length} shown
        </div>
      </div>

      {/* ---------------- Search + filter toggle ---------------- */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--dim)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ZGC, virtual threads, N+1, PKCE…"
            className="w-full rounded-2xl border border-white/[0.09] bg-white/[0.04] py-3 pr-10 pl-10 text-sm text-white placeholder-[var(--dim)] transition-colors outline-none focus:border-[var(--brand-2)]"
          />
          {query && (
            <Tappable
              onClick={() => setQuery('')}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1.5 text-[var(--dim)] hover:text-white"
            >
              <X className="h-4 w-4" />
            </Tappable>
          )}
        </div>

        <Tappable
          onClick={() => setShowFilters((s) => !s)}
          className={`relative grid w-12 shrink-0 place-items-center rounded-2xl border transition-colors ${
            showFilters || activeFilters
              ? 'border-[var(--brand-2)]/50 bg-fuchsia-500/10 text-fuchsia-300'
              : 'border-white/[0.09] bg-white/[0.04] text-[var(--muted)]'
          }`}
          title="Filters"
        >
          <SlidersHorizontal className="h-4.5 w-4.5" />
          {activeFilters > 0 && (
            <span className="bg-brand absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full text-[10px] font-black text-white">
              {activeFilters}
            </span>
          )}
        </Tappable>
      </div>

      {/* ---------------- Filters ---------------- */}
      <AnimatePresence initial={false}>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="card space-y-4 p-4">
              <div>
                <div className="eyebrow mb-2">Domain</div>
                <div className="no-scrollbar flex flex-wrap gap-1.5">
                  <Chip active={!selectedCategory} onClick={() => setSelectedCategory(null)}>
                    All
                  </Chip>
                  {CATEGORIES.map((c) => (
                    <span key={c.id} data-accent={c.accent}>
                      <Chip
                        active={selectedCategory === c.id}
                        onClick={() => setSelectedCategory(selectedCategory === c.id ? null : c.id)}
                        title={c.name}
                      >
                        <span aria-hidden>{c.emoji}</span> {c.shortName}
                      </Chip>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="eyebrow mb-2">Difficulty</div>
                <div className="flex flex-wrap gap-1.5">
                  <Chip active={!difficulty} onClick={() => setDifficulty(null)}>
                    Any
                  </Chip>
                  {DIFFICULTY_ORDER.map((d) => (
                    <Tappable
                      key={d}
                      onClick={() => setDifficulty(difficulty === d ? null : d)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-opacity ${
                        difficulty && difficulty !== d ? 'opacity-45' : ''
                      }`}
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <DifficultyTag difficulty={d} />
                    </Tappable>
                  ))}
                </div>
              </div>

              <div>
                <div className="eyebrow mb-2">Track</div>
                <div className="flex flex-wrap gap-1.5">
                  <Chip active={!selectedTrack} onClick={() => setSelectedTrack(null)}>
                    None
                  </Chip>
                  {TRACKS.map((t) => (
                    <span key={t.id} data-accent={t.accent}>
                      <Chip
                        active={selectedTrack === t.id}
                        onClick={() => setSelectedTrack(selectedTrack === t.id ? null : t.id)}
                        title={t.tagline}
                      >
                        <span aria-hidden>{t.emoji}</span> {t.name}
                      </Chip>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 border-t border-white/[0.07] pt-3">
                <span data-accent="amber">
                  <Chip active={savedOnly} onClick={() => setSavedOnly((s) => !s)}>
                    <Bookmark className="mr-0.5 inline h-3 w-3" /> Bookmarked ({stats.saved})
                  </Chip>
                </span>
                <span data-accent="emerald">
                  <Chip active={hideMastered} onClick={() => setHideMastered((s) => !s)}>
                    Hide mastered
                  </Chip>
                </span>
                {activeFilters > 0 && (
                  <Tappable
                    onClick={resetAll}
                    className="ml-auto text-[11px] font-bold text-[var(--dim)] hover:text-white"
                  >
                    Clear all
                  </Tappable>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- Results ---------------- */}
      {results.length === 0 ? (
        <EmptyState
          emoji={"\u{1F50E}"}
          title="Nothing matches"
          body="Try a different keyword, or loosen the filters. There are 136 questions in here somewhere."
          action={
            <Tappable
              onClick={resetAll}
              className="bg-brand mt-2 rounded-xl px-4 py-2 text-xs font-bold text-white"
            >
              Reset filters
            </Tappable>
          }
        />
      ) : (
        <div className="space-y-3">
          {results.map((q) => {
            const cat = getCategoryById(q.categoryId);
            const open = !!expanded[q.id];
            const saved = isSaved(q.id);
            const done = isCompleted(q.id);

            return (
              <div
                key={q.id}
                data-accent={cat?.accent ?? 'violet'}
                className={`card overflow-hidden transition-colors ${done ? 'border-emerald-500/25' : ''}`}
              >
                <div className="space-y-3 p-4 md:p-5">
                  {/* meta row */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge>
                      <span aria-hidden>{cat?.emoji}</span> {cat?.shortName}
                    </Badge>
                    <DifficultyTag difficulty={q.difficulty} />
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold text-[var(--dim)] tabular">
                      +{XP_BY_DIFFICULTY[q.difficulty]} XP
                    </span>

                    <div className="ml-auto flex items-center gap-1">
                      <Tappable
                        onClick={() => toggleSaveQuestion(q.id)}
                        title={saved ? 'Remove bookmark' : 'Bookmark'}
                        className={`rounded-xl p-2 transition-colors ${
                          saved ? 'bg-amber-400/12 text-amber-300' : 'text-[var(--dim)] hover:text-white'
                        }`}
                      >
                        <Bookmark className={`h-4 w-4 ${saved ? 'fill-amber-300' : ''}`} />
                      </Tappable>

                      <Tappable
                        onClick={() => onMaster(q)}
                        className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-bold transition-colors ${
                          done
                            ? 'bg-emerald-400/12 text-emerald-300'
                            : 'text-[var(--dim)] hover:bg-white/[0.06] hover:text-white'
                        }`}
                      >
                        <Check className="h-4 w-4" />
                        <span className="hidden sm:inline">{done ? 'Mastered' : 'Mark mastered'}</span>
                      </Tappable>
                    </div>
                  </div>

                  <h3 className="font-display text-[17px] leading-snug font-bold text-white md:text-lg">
                    {q.title}
                  </h3>

                  <div className="rounded-2xl border border-white/[0.07] bg-black/25 p-3">
                    <div className="eyebrow mb-1">The situation</div>
                    <p className="text-[12.5px] leading-relaxed text-[var(--muted)]">{q.scenario}</p>
                  </div>

                  <p className="text-[13px] leading-relaxed font-medium text-white md:text-sm">{q.question}</p>

                  <div className="flex flex-wrap gap-1">
                    {q.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md border border-white/[0.07] bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-[var(--dim)]"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  <Tappable
                    onClick={() => setExpanded((p) => ({ ...p, [q.id]: !p[q.id] }))}
                    className="flex w-full items-center justify-between rounded-xl border border-[var(--a-line)] bg-[var(--a-soft)] px-3.5 py-2.5 text-xs font-bold text-[var(--a)]"
                  >
                    <span>{open ? 'Hide the model answer' : 'Reveal the model answer'}</span>
                    <motion.span animate={{ rotate: open ? 180 : 0 }}>
                      <ChevronDown className="h-4 w-4" />
                    </motion.span>
                  </Tappable>
                </div>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 border-t border-white/[0.07] bg-black/25 p-4 md:p-5">
                        <div>
                          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-[var(--a)] uppercase">
                            <Sparkles className="h-3.5 w-3.5" />
                            How a strong candidate answers
                          </div>
                          <Markdown text={q.idealAnswer} />
                        </div>

                        {q.codeSnippet && <CodeBlock code={q.codeSnippet} label="java" />}

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.06] p-3.5">
                            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-amber-300 uppercase">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Traps to avoid
                            </div>
                            <ul className="space-y-1.5">
                              {q.pitfalls.map((p, i) => (
                                <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-[var(--muted)]">
                                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/70" />
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="rounded-2xl border border-sky-400/15 bg-sky-400/[0.06] p-3.5">
                            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-sky-300 uppercase">
                              <HelpCircle className="h-3.5 w-3.5" />
                              They will follow up with
                            </div>
                            <ul className="space-y-1.5">
                              {q.followUpQuestions.map((f, i) => (
                                <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-[var(--muted)]">
                                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/70" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="flex gap-2.5 rounded-2xl border border-violet-400/15 bg-violet-400/[0.06] p-3.5">
                          <Target className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                          <div>
                            <div className="text-[11px] font-bold tracking-wide text-violet-300 uppercase">
                              Why this gets asked
                            </div>
                            <p className="mt-1 text-[12px] leading-relaxed text-[var(--muted)]">{q.faangFocus}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
