import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCw, Shuffle, Undo2 } from 'lucide-react';
import { useApp, type FlashcardRating } from '../context/AppContext';
import {
  CATEGORIES,
  QUESTIONS,
  getCategoryById,
  type Question,
} from '../data/questions';
import { Chip, CodeBlock, DifficultyTag, EmptyState, Markdown, Progress, Tappable, celebrate } from './ui';

const RATINGS: { key: FlashcardRating; label: string; emoji: string; color: string }[] = [
  { key: 'Again', label: 'Again', emoji: '\u{1F635}', color: '#fb7185' },
  { key: 'Hard', label: 'Hard', emoji: '\u{1F613}', color: '#fbbf24' },
  { key: 'Good', label: 'Good', emoji: '\u{1F642}', color: '#38bdf8' },
  { key: 'Easy', label: 'Easy', emoji: '\u{1F60E}', color: '#34d399' },
];

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const Flashcards: React.FC = () => {
  const { state, rateFlashcard } = useApp();

  const [category, setCategory] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seed, setSeed] = useState(0);
  const [direction, setDirection] = useState(1);

  const pool = useMemo<Question[]>(() => {
    const base = category ? QUESTIONS.filter((q) => q.categoryId === category) : QUESTIONS;
    return seed === 0 ? base : shuffle(base);
  }, [category, seed]);

  const card = pool[index];
  const cat = card ? getCategoryById(card.categoryId) : undefined;
  const rated = card ? state.flashcardRatings[card.id] : undefined;

  const go = (delta: number) => {
    if (!pool.length) return;
    setDirection(delta);
    setFlipped(false);
    setIndex((i) => (i + delta + pool.length) % pool.length);
  };

  const rate = (r: FlashcardRating) => {
    if (!card) return;
    rateFlashcard(card.id, r);
    if (r === 'Easy') celebrate('small');
    go(1);
  };

  const reset = (catId: string | null) => {
    setCategory(catId);
    setIndex(0);
    setFlipped(false);
  };

  return (
    <div className="fade-in mx-auto max-w-3xl space-y-5 p-4 pb-10 md:p-7" data-accent={cat?.accent ?? 'cyan'}>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-white md:text-3xl">Recall drill</h2>
          <p className="mt-1 text-xs text-[var(--muted)] md:text-sm">
            Answer out loud before you flip. Being honest with the rating is the whole point.
          </p>
        </div>
        <Tappable
          onClick={() => {
            setSeed((s) => s + 1);
            setIndex(0);
            setFlipped(false);
          }}
          className="flex items-center gap-1.5 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2 text-[11px] font-bold text-[var(--muted)] hover:text-white"
        >
          <Shuffle className="h-3.5 w-3.5" /> Shuffle
        </Tappable>
      </div>

      {/* Category picker */}
      <div className="no-scrollbar edge-fade -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        <Chip active={!category} onClick={() => reset(null)}>
          All domains
        </Chip>
        {CATEGORIES.map((c) => (
          <span key={c.id} data-accent={c.accent}>
            <Chip active={category === c.id} onClick={() => reset(c.id)} title={c.name}>
              <span aria-hidden>{c.emoji}</span> {c.shortName}
            </Chip>
          </span>
        ))}
      </div>

      {!card ? (
        <EmptyState emoji={'\u{1F0CF}'} title="No cards here" body="Pick another domain to start drilling." />
      ) : (
        <div className="space-y-4">
          {/* Progress */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold">
              <span className="text-[var(--muted)] tabular">
                Card {index + 1} of {pool.length}
              </span>
              {rated && (
                <span className="text-[var(--dim)]">
                  last rated <strong className="text-white">{rated}</strong>
                </span>
              )}
            </div>
            <Progress value={(index + 1) / pool.length} height={5} />
          </div>

          {/* Card */}
          <div className="relative min-h-[380px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`${card.id}-${flipped}`}
                custom={direction}
                initial={{ opacity: 0, x: direction * 48, rotateY: flipped ? -12 : 12 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                exit={{ opacity: 0, x: -direction * 48 }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.22}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -90) go(1);
                  else if (info.offset.x > 90) go(-1);
                }}
                onClick={() => setFlipped((f) => !f)}
                className={`card min-h-[380px] cursor-pointer p-5 select-none md:p-7 ${
                  flipped ? 'card-accent glow' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-[var(--a-line)] bg-[var(--a-soft)] px-2.5 py-1 text-[10px] font-bold text-[var(--a)]">
                    <span aria-hidden>{cat?.emoji}</span> {cat?.shortName}
                  </span>
                  <div className="flex items-center gap-2">
                    <DifficultyTag difficulty={card.difficulty} />
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--dim)]">
                      <RotateCw className="h-3 w-3" /> tap
                    </span>
                  </div>
                </div>

                {!flipped ? (
                  <div className="flex min-h-[280px] flex-col justify-center gap-4 py-6 text-center">
                    <span className="eyebrow">The question</span>
                    <h3 className="font-display text-lg leading-snug font-bold text-white md:text-2xl">
                      {card.question}
                    </h3>
                    <p className="mx-auto max-w-lg rounded-xl border border-white/[0.07] bg-black/25 p-3 text-[11.5px] leading-relaxed text-[var(--muted)]">
                      <strong className="text-white">Context: </strong>
                      {card.scenario}
                    </p>
                  </div>
                ) : (
                  <div className="py-4">
                    <span className="eyebrow">Model answer</span>
                    <div className="scroll-fade mt-2 max-h-[46vh] min-h-[220px] overflow-y-auto pr-1">
                      <Markdown text={card.idealAnswer} />
                      {card.codeSnippet && (
                        <div className="mt-3">
                          <CodeBlock code={card.codeSnippet} label="java" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 border-t border-white/[0.07] pt-3 text-center text-[10.5px] font-semibold text-[var(--dim)]">
                  {flipped ? 'How well did you actually know that?' : 'Swipe to skip · tap to flip'}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Rating */}
          <AnimatePresence>
            {flipped && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="grid grid-cols-4 gap-2"
              >
                {RATINGS.map((r) => (
                  <Tappable
                    key={r.key}
                    onClick={() => rate(r.key)}
                    className="flex flex-col items-center gap-1 rounded-2xl border py-3 text-[11px] font-bold"
                    style={{
                      color: r.color,
                      background: `${r.color}14`,
                      borderColor: `${r.color}3d`,
                    }}
                  >
                    <span className="text-lg leading-none" aria-hidden>
                      {r.emoji}
                    </span>
                    {r.label}
                  </Tappable>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {!flipped && (
            <div className="grid grid-cols-2 gap-2">
              <Tappable
                onClick={() => go(-1)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.04] py-3 text-xs font-bold text-[var(--muted)] hover:text-white"
              >
                <Undo2 className="h-4 w-4" /> Previous
              </Tappable>
              <Tappable
                onClick={() => setFlipped(true)}
                className="bg-brand rounded-2xl py-3 text-xs font-bold text-white"
              >
                Reveal answer
              </Tappable>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
