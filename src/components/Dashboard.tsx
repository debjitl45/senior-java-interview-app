import React from 'react';
import { 
  Cpu, 
  Zap, 
  Layers, 
  Server, 
  Code, 
  Activity, 
  Sparkles, 
  ArrowRight, 
  Bookmark, 
  PlaySquare, 
  Bug, 
  Flame
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/questions';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, setSelectedCategory }) => {
  const { state, getReadinessScore } = useApp();

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cpu': return Cpu;
      case 'Zap': return Zap;
      case 'Layers': return Layers;
      case 'Server': return Server;
      case 'Code': return Code;
      case 'Activity': return Activity;
      default: return Code;
    }
  };

  const readiness = getReadinessScore();

  // Calculate stats
  const totalQuestions = 16;
  const completedCount = state.completedQuestions.length;
  const savedCount = state.savedQuestions.length;

  const handleCategoryClick = (id: string) => {
    setSelectedCategory(id);
    setActiveTab('library');
  };

  const proTips = [
    "When discussing ZGC, emphasize that Load Barriers handle self-healing concurrently. Mention Allocation Stalls as the primary failure mode under sudden heap exhaustion.",
    "In System Design for 5+ YOE, never present a single static architecture. Present the trade-offs: optimize for write-heavy (LSM-trees, Cassandra) vs read-heavy (B-Trees, Redis caches).",
    "For Virtual Threads, clearly articulate that they do not increase single-threaded latency speed—they provide massive concurrency. Identify synchronized blocks as the root cause of carrier thread pinning.",
    "When explaining Spring proxies, always trace the 'self-invocation' limitation. Tier-1 interviewers love candidates who understand runtime bytecode manipulation.",
    "If asked about Distributed Transactions, immediately rule out 2PC for microservices due to its blocking locks. Propose Orchestrated Sagas with idempotent compensating transactions."
  ];

  // Pick a stable pro tip based on the day of the year
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const currentTip = proTips[dayOfYear % proTips.length];

  return (
    <div className="p-4 md:p-6 space-y-6 fade-in max-w-6xl mx-auto">
      
      {/* Welcome & Readiness Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 p-6 border border-indigo-500/20 shadow-xl">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-20 -bottom-10 w-32 h-32 bg-violet-500/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Staff & Senior Tier Preparation</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Welcome Back, Architect
            </h2>
            <p className="text-sm text-slate-300 max-w-xl">
              Master the exact rigorous interview patterns tested by Tier-1 engineering teams for Senior Engineer roles.
            </p>
          </div>

          {/* Readiness Gauge */}
          <div className="flex items-center gap-4 bg-slate-950/40 p-4 rounded-xl border border-white/5 self-start md:self-auto">
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              {/* Circular Progress */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-indigo-500 transition-all duration-500"
                  strokeWidth="3.5"
                  strokeDasharray={`${readiness}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-sm font-bold text-white">{readiness}%</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Readiness Score
              </div>
              <div className="text-sm font-medium text-slate-300 mt-0.5">
                {readiness < 40 ? 'Foundational' : readiness < 75 ? 'Advanced' : 'Interview Ready'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Based on mastery & mock scores
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Footnote */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-white/5 text-center md:text-left">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Questions Mastered</span>
            <span className="text-sm font-bold text-white">{completedCount} <span className="text-slate-500 font-normal">/ {totalQuestions}</span></span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Active Streak</span>
            <span className="text-sm font-bold text-amber-400 flex items-center justify-center md:justify-start gap-1">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              {state.streak} Days
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Bookmarked</span>
            <span className="text-sm font-bold text-white">{savedCount}</span>
          </div>
        </div>
      </div>

      {/* Pro Tip of the Day */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-3 items-start">
        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            Staff Interviewer Pro Tip
          </div>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
            "{currentTip}"
          </p>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Preparation Modes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <button
            onClick={() => setActiveTab('interview')}
            className="group relative overflow-hidden bg-slate-900 hover:bg-slate-800/80 p-4 rounded-xl border border-slate-800 transition-all text-left flex flex-col justify-between h-32"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                <PlaySquare className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                Mock Interview
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                Simulate real FAANG timing & rubrics
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('defects')}
            className="group relative overflow-hidden bg-slate-900 hover:bg-slate-800/80 p-4 rounded-xl border border-slate-800 transition-all text-left flex flex-col justify-between h-32"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                <Bug className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">
                Interactive
              </span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                Spot the Defect
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                Analyze senior multithreaded bugs
              </p>
            </div>
          </button>

          <button
            onClick={() => {
              setSelectedCategory(null);
              setActiveTab('library');
            }}
            className="group relative overflow-hidden bg-slate-900 hover:bg-slate-800/80 p-4 rounded-xl border border-slate-800 transition-all text-left flex flex-col justify-between h-32"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                <Bookmark className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                Browse Library
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                Explore all 16 Deep-Dive Questions
              </p>
            </div>
          </button>

        </div>
      </div>

      {/* Categories Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Knowledge Domains
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Select to filter library
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);
            
            // Calculate specific category mastery
            // Find questions belonging to this category
            // We know the counts from the data or we can filter
            // Let's filter directly for precision:
            // Since we don't import QUESTIONS directly to avoid circular if any, we can just use the counts
            // Let's calculate how many are completed in this category
            // Let's import QUESTIONS to be absolutely precise!
            
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="group bg-slate-900 hover:bg-slate-800/60 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all text-left flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 bg-slate-800 rounded-lg text-indigo-400 group-hover:bg-indigo-600/20 group-hover:text-indigo-300 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-300 transition-colors">
                    {cat.questionCount} Questions
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                    {cat.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span className="group-hover:text-slate-300 transition-colors font-medium">Study Domain</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-indigo-400" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
