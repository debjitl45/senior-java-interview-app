import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Bookmark, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  HelpCircle, 
  Target, 
  Sparkles,
  Filter
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { QUESTIONS, CATEGORIES, Question } from '../data/questions';

interface LibraryProps {
  selectedCategory: string | null;
  setSelectedCategory: (catId: string | null) => void;
}

export const Library: React.FC<LibraryProps> = ({ selectedCategory, setSelectedCategory }) => {
  const { state, toggleSaveQuestion, toggleCompleteQuestion } = useApp();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Toggle specific answer expansion
  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filter logic
  const filteredQuestions = useMemo(() => {
    return QUESTIONS.filter(q => {
      // Category filter
      if (selectedCategory && q.categoryId !== selectedCategory) {
        return false;
      }
      
      // Saved filter
      if (showSavedOnly && !state.savedQuestions.includes(q.id)) {
        return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesTitle = q.title.toLowerCase().includes(query);
        const matchesTags = q.tags.some(t => t.toLowerCase().includes(query));
        const matchesQuestion = q.question.toLowerCase().includes(query);
        const matchesScenario = q.scenario.toLowerCase().includes(query);
        return matchesTitle || matchesTags || matchesQuestion || matchesScenario;
      }

      return true;
    });
  }, [selectedCategory, showSavedOnly, searchQuery, state.savedQuestions]);

  const getDifficultyColor = (diff: Question['difficulty']) => {
    switch (diff) {
      case 'Hard': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Expert': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Master': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  // Comprehensive markdown renderer for interview answers
  const renderFormattedText = (text: string) => {
    // Process inline formatting first
    const processInlineMarkdown = (str: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = [];
      // Match **bold**, `code`, and plain text
      const regex = /(\*\*.*?\*\*|`[^`]+`)/g;
      let lastIndex = 0;
      let match;
      let key = 0;

      while ((match = regex.exec(str)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
          parts.push(<span key={key++}>{str.slice(lastIndex, match.index)}</span>);
        }
        
        const matched = match[0];
        if (matched.startsWith('**') && matched.endsWith('**')) {
          // Bold text
          parts.push(
            <strong key={key++} className="text-white font-semibold">
              {matched.slice(2, -2)}
            </strong>
          );
        } else if (matched.startsWith('`') && matched.endsWith('`')) {
          // Inline code
          parts.push(
            <code key={key++} className="px-1.5 py-0.5 bg-slate-800 text-indigo-300 rounded text-[11px] font-mono">
              {matched.slice(1, -1)}
            </code>
          );
        }
        
        lastIndex = match.index + matched.length;
      }

      // Add remaining text
      if (lastIndex < str.length) {
        parts.push(<span key={key++}>{str.slice(lastIndex)}</span>);
      }

      return parts.length > 0 ? parts : [<span key="0">{str}</span>];
    };

    // Split by double newlines for paragraphs
    const blocks = text.split('\n\n');
    
    return blocks.map((block, pIdx) => {
      // Handle ### headings
      if (block.trim().startsWith('###')) {
        return (
          <h5 key={pIdx} className="font-bold text-xs md:text-sm mt-4 mb-2 border-b border-slate-800 pb-1 text-indigo-300">
            {block.replace(/^###\s*/, '').trim()}
          </h5>
        );
      }

      // Handle headings with single #
      if (block.trim().startsWith('#') && !block.trim().startsWith('###')) {
        return (
          <h5 key={pIdx} className="font-bold text-xs md:text-sm mt-4 mb-2 text-indigo-300">
            {block.replace(/^#+\s*/, '').trim()}
          </h5>
        );
      }

      // Check if block contains list items (* or -)
      const lines = block.split('\n');
      const hasListItems = lines.some(line => /^\s*[\*\-]\s/.test(line));
      
      if (hasListItems) {
        const listItems = lines.filter(line => /^\s*[\*\-]\s/.test(line));
        const textBefore = lines.filter(line => !/^\s*[\*\-]\s/.test(line) && line.trim().length > 0);
        
        return (
          <div key={pIdx} className="my-2">
            {textBefore.length > 0 && (
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed mb-2">
                {processInlineMarkdown(textBefore.join(' '))}
              </p>
            )}
            <ul className="space-y-1 list-disc list-inside text-slate-300">
              {listItems.map((line, lIdx) => {
                const cleanLine = line.replace(/^\s*[\*\-]\s*/, '');
                return (
                  <li key={lIdx} className="text-xs md:text-sm leading-relaxed">
                    {processInlineMarkdown(cleanLine)}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }

      // Handle numbered lists
      const hasNumberedItems = lines.some(line => /^\s*\d+\.\s/.test(line));
      
      if (hasNumberedItems) {
        const listItems = lines.filter(line => /^\s*\d+\.\s/.test(line));
        const textBefore = lines.filter(line => !/^\s*\d+\.\s/.test(line) && line.trim().length > 0);
        
        return (
          <div key={pIdx} className="my-2">
            {textBefore.length > 0 && (
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed mb-2">
                {processInlineMarkdown(textBefore.join(' '))}
              </p>
            )}
            <ol className="space-y-1 list-decimal list-inside text-slate-300">
              {listItems.map((line, lIdx) => {
                const cleanLine = line.replace(/^\s*\d+\.\s*/, '');
                return (
                  <li key={lIdx} className="text-xs md:text-sm leading-relaxed">
                    {processInlineMarkdown(cleanLine)}
                  </li>
                );
              })}
            </ol>
          </div>
        );
      }

      // Default paragraph with line break support
      const processedText = block.replace(/\n/g, ' ').trim();
      if (processedText.length === 0) return null;
      
      return (
        <p key={pIdx} className="text-xs md:text-sm text-slate-300 leading-relaxed my-2">
          {processInlineMarkdown(processedText)}
        </p>
      );
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 fade-in max-w-5xl mx-auto">
      
      {/* Search & Header Controls */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Interview Questions Library
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            Showing {filteredQuestions.length} deep-dive questions curated for 10+ YOE developers.
          </p>
        </div>

        {/* Search Bar & Saved Toggle */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, tag, framework (e.g. ZGC, False Sharing, Kafka)..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={() => setShowSavedOnly(!showSavedOnly)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
              showSavedOnly 
                ? 'bg-indigo-600 text-white border-indigo-500' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${showSavedOnly ? 'fill-white' : ''}`} />
            <span>Bookmarked ({state.savedQuestions.length})</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 no-scrollbar text-xs">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              selectedCategory === null
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            All Categories
          </button>
          
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {cat.name.split(' ')[0]} {cat.name.includes('&') ? '& GC' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Questions Cards List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800/80">
            <Filter className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-300">No questions found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Try adjusting your search query or clear selected categories.
            </p>
            {(selectedCategory || searchQuery || showSavedOnly) && (
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchQuery('');
                  setShowSavedOnly(false);
                }}
                className="mt-4 px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const isSaved = state.savedQuestions.includes(q.id);
            const isCompleted = state.completedQuestions.includes(q.id);
            const isExpanded = !!expandedIds[q.id];
            
            const categoryObj = CATEGORIES.find(c => c.id === q.categoryId);

            return (
              <div 
                key={q.id}
                className={`bg-slate-900 rounded-xl border transition-all overflow-hidden ${
                  isCompleted 
                    ? 'border-slate-800/80 bg-slate-900/70' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 md:p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {categoryObj?.name || 'Java'}
                      </span>
                      <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border ${getDifficultyColor(q.difficulty)}`}>
                        {q.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleSaveQuestion(q.id)}
                        title={isSaved ? "Remove Bookmark" : "Bookmark Question"}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isSaved ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
                      </button>
                      
                      <button
                        onClick={() => toggleCompleteQuestion(q.id)}
                        title={isCompleted ? "Mark as Unstudied" : "Mark as Mastered"}
                        className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-medium transition-colors ${
                          isCompleted 
                            ? 'text-emerald-400 bg-emerald-500/10' 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'fill-emerald-400/20' : ''}`} />
                        <span className="hidden sm:inline">{isCompleted ? 'Mastered' : 'Mark Mastered'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Title & Scenario */}
                  <div>
                    <h3 className={`text-base md:text-lg font-bold tracking-tight ${isCompleted ? 'text-slate-300' : 'text-white'}`}>
                      {q.title}
                    </h3>

                    {/* Scenario Box */}
                    <div className="mt-2.5 p-3 rounded-lg bg-slate-950/50 border border-slate-800/60 text-xs md:text-sm text-slate-400 leading-relaxed">
                      <strong className="text-slate-300 font-semibold">Scenario: </strong>
                      {q.scenario}
                    </div>

                    {/* Question Prompt */}
                    <div className="mt-3 text-xs md:text-sm text-slate-200 font-medium leading-relaxed">
                      {q.question}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {q.tags.map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800/80">
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* Expand Answer Button */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <button
                      onClick={() => toggleExpand(q.id)}
                      className="w-full flex items-center justify-between py-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <span>{isExpanded ? 'Hide Ideal Senior Answer' : 'Reveal Ideal Senior Answer'}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Section */}
                {isExpanded && (
                  <div className="bg-slate-950 p-4 md:p-5 border-t border-slate-800 space-y-5 fade-in">
                    
                    {/* Ideal Answer */}
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Authoritative Answer</span>
                      </div>
                      <div className="space-y-1">
                        {renderFormattedText(q.idealAnswer)}
                      </div>
                    </div>

                    {/* Code Snippet if present */}
                    {q.codeSnippet && (
                      <div>
                        <div className="text-xs font-semibold text-slate-400 mb-1">Relevant Code Pattern:</div>
                        <pre className="bg-slate-900 p-3 rounded-lg border border-slate-800 overflow-x-auto text-xs text-slate-200 font-mono">
                          <code>{q.codeSnippet}</code>
                        </pre>
                      </div>
                    )}

                    {/* Secondary Insights Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      
                      {/* Pitfalls */}
                      <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Common Candidate Traps</span>
                        </div>
                        <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                          {q.pitfalls.map((pf, idx) => (
                            <li key={idx}>{pf}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Follow-up Questions */}
                      <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Interviewer Follow-ups</span>
                        </div>
                        <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                          {q.followUpQuestions.map((fq, idx) => (
                            <li key={idx}>{fq}</li>
                          ))}
                        </ul>
                      </div>

                    </div>

                    {/* FAANG Focus */}
                    <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-3 flex gap-2.5 items-start">
                      <Target className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                          Tier-1 Tech Company Focus
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                          {q.faangFocus}
                        </p>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
