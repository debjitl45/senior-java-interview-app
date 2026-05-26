import React, { useState } from 'react';
import { Bug, CheckCircle, AlertOctagon, RefreshCw, Eye, Code2 } from 'lucide-react';
import { CODE_DEFECTS } from '../data/questions';

export const DefectAnalyzer: React.FC = () => {
  const [selectedDefectId, setSelectedDefectId] = useState<string>(CODE_DEFECTS[0].id);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'broken' | 'fixed'>('broken');

  const currentDefect = CODE_DEFECTS.find(d => d.id === selectedDefectId) || CODE_DEFECTS[0];

  const handleSelect = (id: string) => {
    setSelectedDefectId(id);
    setRevealed(false);
    setActiveTab('broken');
  };

  // Render markdown-like string natively
  const renderExplanation = (text: string) => {
    return text.split('\n\n').map((paragraph, idx) => {
      if (paragraph.startsWith('###')) {
        return (
          <h4 key={idx} className="text-xs md:text-sm font-bold text-indigo-400 mt-4 mb-1">
            {paragraph.replace('###', '').trim()}
          </h4>
        );
      }

      // Check if ordered list
      if (paragraph.includes('1. ')) {
        const lines = paragraph.split('\n');
        return (
          <ol key={idx} className="space-y-1 list-decimal list-inside text-xs md:text-sm text-slate-300 my-2">
            {lines.map((l, lIdx) => (
              <li key={lIdx} className="leading-relaxed">
                {l.replace(/^\d+\.\s*/, '')}
              </li>
            ))}
          </ol>
        );
      }

      // Default paragraph
      const parts = paragraph.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className="text-xs md:text-sm text-slate-300 leading-relaxed my-2">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 fade-in max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
            Interactive
          </span>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Spot the Concurrency Defect
          </h2>
        </div>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Senior candidates are frequently asked to debug complex multi-threaded code. Can you spot the hidden race condition or memory leak?
        </p>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {CODE_DEFECTS.map((defect) => {
          const isSelected = defect.id === selectedDefectId;
          return (
            <button
              key={defect.id}
              onClick={() => handleSelect(defect.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-indigo-600/15 border-indigo-500/40 text-white shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-400">
                  {defect.categoryId.toUpperCase()}
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  {defect.difficulty}
                </span>
              </div>
              <h3 className="text-xs font-bold mt-1 line-clamp-1">
                {defect.title}
              </h3>
            </button>
          );
        })}
      </div>

      {/* Main Workspace */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        
        {/* Workspace Top Toolbar */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-white block">
              {currentDefect.title}
            </span>
            <span className="text-[11px] text-slate-400">
              {currentDefect.defectDescription}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('broken')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === 'broken'
                  ? 'bg-amber-500/10 text-amber-400 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5" />
                Original Code
              </span>
            </button>
            
            <button
              onClick={() => {
                setActiveTab('fixed');
                setRevealed(true);
              }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === 'fixed'
                  ? 'bg-emerald-500/10 text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Fixed Solution
              </span>
            </button>
          </div>
        </div>

        {/* Code Viewport */}
        <div className="relative">
          <pre className="p-4 md:p-6 text-xs md:text-sm font-mono overflow-x-auto text-slate-200 leading-relaxed max-h-[400px]">
            <code>{activeTab === 'broken' ? currentDefect.code : currentDefect.fixedCode}</code>
          </pre>

          {/* Watermark */}
          <div className="absolute right-4 bottom-4 text-right pointer-events-none opacity-20">
            <Code2 className="w-16 h-16 text-slate-500 inline-block" />
          </div>
        </div>

        {/* Action Bottom Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {revealed ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 inline" /> Solution Revealed
              </span>
            ) : (
              <span>Inspect the original code carefully before revealing the fix.</span>
            )}
          </div>

          {!revealed ? (
            <button
              onClick={() => {
                setRevealed(true);
                setActiveTab('fixed');
              }}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              Reveal Defect & Solution
            </button>
          ) : (
            <button
              onClick={() => {
                setRevealed(false);
                setActiveTab('broken');
              }}
              className="w-full sm:w-auto px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Reset & Try Again
            </button>
          )}
        </div>

      </div>

      {/* Technical Breakdown */}
      {revealed && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 fade-in">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
            <Bug className="w-4 h-4" />
            <span>Architectural Breakdown</span>
          </div>

          <div className="space-y-1">
            {renderExplanation(currentDefect.explanation)}
          </div>
        </div>
      )}

    </div>
  );
};
