import React, { useState } from 'react';
import { motion } from 'framer-motion'; 
import { RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { QUESTIONS, CATEGORIES } from '../data/questions';

export const Flashcards: React.FC = () => {
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const [startX, setStartX] = useState<number | null>(null);
  const [wasSwipe, setWasSwipe] = useState(false);

  // Filter pool
  const pool = selectedCategory 
    ? QUESTIONS.filter(q => q.categoryId === selectedCategory)
    : QUESTIONS;

  const currentQ = pool[currentIndex];

  const handleFlip = () => {
    if (wasSwipe) {
      setWasSwipe(false);
      return;
    }
  
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    setIsFlipped(false);
  
    if (currentIndex + 1 < pool.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };
  
  const previousCard = () => {
    setIsFlipped(false);
  
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(pool.length - 1);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setStartX(e.clientX);
  };
  
  const handlePointerUp = (e: React.PointerEvent) => {
    if (startX === null) return;
  
    const delta = e.clientX - startX;
  
    if (Math.abs(delta) > 70) {
      setWasSwipe(true);
  
      if (delta < 0) {
        nextCard();
      } else {
        previousCard();
      }
    }
  
    setStartX(null);
  };

  // Safe layout render
  const renderFormattedText = (text: string) => {
    return text.split('\n\n').map((paragraph, idx) => {
      if (paragraph.startsWith('###')) {
        return (
          <h5 key={idx} className="font-bold text-indigo-300 text-xs mt-3 mb-1">
            {paragraph.replace('###', '').trim()}
          </h5>
        );
      }
      return (
        <p key={idx} className="text-xs text-slate-300 leading-relaxed my-1">
          {paragraph}
        </p>
      );
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 fade-in max-w-3xl mx-auto">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
            Spaced Repetition
          </span>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Active Recall Flashcards
          </h2>
        </div>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Test your memory directly. Rate your confidence on each answer to feed our dynamic Readiness Algorithm.
        </p>
      </div>

      {/* Category Picker */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 no-scrollbar text-xs">
        <button
          onClick={() => {
            setSelectedCategory(null);
            setCurrentIndex(0);
            setIsFlipped(false);
          }}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
            selectedCategory === null
              ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          All Domains
        </button>
        
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            {cat.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Flashcard Card Area */}
      {currentQ ? (
        <div className="space-y-4">
          
          {/* Progress status */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Card {currentIndex + 1} of {pool.length}</span>
            <span className="font-semibold text-indigo-400">{currentQ.difficulty}</span>
          </div>

          {/* The Flip Card */}
          <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.3}
                whileDrag={{
                  scale: 1.02,
                  rotate: 3
                }}
                onDragEnd={(_, info) => {
                  const threshold = 100;

                  if (info.offset.x < -threshold) {
                    nextCard();
                  } else if (info.offset.x > threshold) {
                    previousCard();
                  }
                }}
                onClick={handleFlip}
                className={`min-h-[320px] bg-slate-900 hover:bg-slate-900/90 rounded-2xl border border-slate-800 p-6 md:p-8 flex flex-col justify-between cursor-pointer transition-all select-none relative group shadow-xl ${
                  isFlipped ? 'border-indigo-500/30 bg-slate-950/80' : ''
                }`}
              >

            {/* Top Tag */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                {CATEGORIES.find(c => c.id === currentQ.categoryId)?.name || 'Java'}
              </span>

              <div className="flex items-center gap-1 text-[11px] text-slate-500 group-hover:text-indigo-400 transition-colors">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Tap to {isFlipped ? 'see Question' : 'Flip'}</span>
              </div>
            </div>

            {/* Main Content */}
            <div className="my-6">
              {!isFlipped ? (
                <div className="space-y-4 text-center">
                  <span className="text-xs font-semibold text-indigo-400 block">Question Prompt</span>
                  <h3 className="text-base md:text-xl font-bold text-white leading-relaxed">
                    {currentQ.question}
                  </h3>
                  {currentQ.scenario && (
                    <p className="text-xs text-slate-400 max-w-lg mx-auto bg-slate-950 p-2.5 rounded-lg border border-slate-800/60">
                      <strong>Scenario: </strong>{currentQ.scenario}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 text-left fade-in">
                  <span className="text-xs font-semibold text-indigo-400 block">Ideal Senior Answer</span>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2">
                    {renderFormattedText(currentQ.idealAnswer)}
                  </div>
                  
                  {currentQ.codeSnippet && (
                    <pre className="bg-slate-900 p-2.5 rounded-lg text-xs text-slate-300 font-mono overflow-x-auto border border-slate-800">
                      <code>{currentQ.codeSnippet}</code>
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Tip */}
            <div className="text-center text-[11px] text-slate-600">
              {!isFlipped ? 'Think through your answer before flipping' : 'Rate your retention below'}
            </div>
          </motion.div>
              
          {/* Rating Controls */}

          <div className="flex gap-3">
              <button
                onClick={previousCard}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <ChevronLeft size={18} />
                Previous
              </button>

              <button
                onClick={nextCard}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="text-center text-xs text-slate-500">
              Swipe left for next card • Swipe right for previous card
            </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          No questions in this pool.
        </div>
      )}

    </div>
  );
};
