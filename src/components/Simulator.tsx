import React, { useState, useEffect, useRef } from 'react';
import { 
  PlaySquare, 
  Clock, 
  Award, 
  RotateCcw, 
  Edit3, 
  Sparkles,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { QUESTIONS, Question } from '../data/questions';

export const Simulator: React.FC = () => {
  const { state, saveInterview } = useApp();

  // Screen states: 'setup' | 'active' | 'evaluation' | 'scorecard'
  const [screen, setScreen] = useState<'setup' | 'active' | 'evaluation' | 'scorecard'>('setup');
  
  // Setup configuration
  const [selectedPreset, setSelectedPreset] = useState<string>('staff_deep');
  const [timePerQuestion, setTimePerQuestion] = useState<number>(300); // seconds

  // Interview state
  const [interviewQuestions, setInterviewQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [scratchpad, setScratchpad] = useState<string>('');
  
  // Per-question scores: out of 3 rubrics checked
  const [questionScores, setQuestionScores] = useState<number[]>([]);
  
  // Current rubric selection
  const [rubricsChecked, setRubricsChecked] = useState<boolean[]>([false, false, false]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const presets = [
    {
      id: 'staff_deep',
      name: 'Staff Deep Dive: JVM & Concurrency',
      desc: 'Intense technical focus on low-latency memory models, CPU caches, and virtual thread internals.',
      count: 8,
      categoryFilter: ['jvm', 'concurrency']
    },
    {
      id: 'system_design',
      name: 'Distributed Systems & Architecture',
      desc: 'High-throughput patterns, Sagas, dual-writes, outbox tailing, and distributed idempotency.',
      count: 6,
      categoryFilter: ['architecture']
    },
    {
      id: 'faang_mix',
      name: 'Complete FAANG Architecture Mix',
      desc: 'A full randomized interview slate spanning all categories to test breadth and depth.',
      count: 10,
      categoryFilter: []
    },
    {
      id: 'quick_warmup',
      name: 'Quick-Fire Warmup',
      desc: 'A fast 4-question sprint for daily practice.',
      count: 4,
      categoryFilter: []
    }
  ];

  // Start interview
  const startInterview = () => {
    const preset = presets.find(p => p.id === selectedPreset) || presets[0];
    
    // Filter and shuffle
    let pool = [...QUESTIONS];
    if (preset.categoryFilter.length > 0) {
      pool = pool.filter(q => preset.categoryFilter.includes(q.categoryId));
    }
    
    // Simple deterministic or randomized selection
    // Let's randomize cleanly
    const shuffled = pool.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, preset.count);

    setInterviewQuestions(selected);
    setCurrentIndex(0);
    setTimeLeft(timePerQuestion);
    setScratchpad('');
    setQuestionScores(new Array(selected.length).fill(0));
    setRubricsChecked([false, false, false]);
    setScreen('active');

    // Announce first question if voice enabled
    if (state.voiceEnabled && selected.length > 0) {
      speakQuestion(selected[0].question);
    }
  };

  const speakQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Timer logic
  useEffect(() => {
    if (screen === 'active') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Auto transition to evaluation
            clearInterval(timerRef.current!);
            setScreen('evaluation');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen]);

  // Handle evaluation transition
  const handleEvaluate = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setScreen('evaluation');
  };

  // Submit current question evaluation
  const submitEvaluation = () => {
    // Score based on how many rubrics checked
    const points = rubricsChecked.filter(Boolean).length;
    
    setQuestionScores(prev => {
      const updated = [...prev];
      updated[currentIndex] = points;
      return updated;
    });

    // Move to next or finish
    if (currentIndex + 1 < interviewQuestions.length) {
      setCurrentIndex(prev => prev + 1);
      setTimeLeft(timePerQuestion);
      setScratchpad('');
      setRubricsChecked([false, false, false]);
      setScreen('active');
      
      // Speak next
      if (state.voiceEnabled) {
        speakQuestion(interviewQuestions[currentIndex + 1].question);
      }
    } else {
      // Finish interview
      finishInterview();
    }
  };

  const finishInterview = () => {
    setScreen('scorecard');
    
    // Trigger celebration
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // safe fallback
    }

    // Save state
    // Total max points = questions * 3
    // Calculate percentage
    // Calculate final score using latest questionScores if possible
    // Let's use a delayed save to ensure questionScores state is stable or calculate directly
  };

  // Calculate percentage dynamically
  const totalPointsEarned = questionScores.reduce((a, b) => a + b, 0);
  const maxPossiblePoints = interviewQuestions.length * 3;
  const finalPercentage = maxPossiblePoints > 0 ? Math.round((totalPointsEarned / maxPossiblePoints) * 100) : 0;

  // Save the interview exactly once when scorecard mounts
  useEffect(() => {
    if (screen === 'scorecard' && interviewQuestions.length > 0) {
      const presetObj = presets.find(p => p.id === selectedPreset);
      saveInterview({
        score: finalPercentage,
        preset: presetObj?.name || 'Custom Simulator',
        totalQuestions: interviewQuestions.length
      });
    }
  }, [screen]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentQ = interviewQuestions[currentIndex];

  return (
    <div className="p-4 md:p-6 space-y-6 fade-in max-w-4xl mx-auto">
      
      {/* 1. SETUP SCREEN */}
      {screen === 'setup' && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                Simulator
              </span>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                Mock Interview Studio
              </h2>
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Test your ability to deliver structured, high-signal answers under real time constraints.
            </p>
          </div>

          {/* Preset Selector */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Select Interview Blueprint
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presets.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          {preset.name}
                        </span>
                        <span className="text-[10px] font-semibold bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                          {preset.count} Questions
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {preset.desc}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-indigo-400 font-semibold pt-1">
                      <span>{isSelected ? 'Blueprint Selected' : 'Select Blueprint'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timing & Voice Controls */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Simulation Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1.5">
                  Time Allocation per Question
                </label>
                <select
                  value={timePerQuestion}
                  onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={180}>3 Minutes (Fast paced)</option>
                  <option value={300}>5 Minutes (Standard FAANG)</option>
                  <option value={450}>7.5 Minutes (In-depth architecture)</option>
                  <option value={600}>10 Minutes (Exhaustive design)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1.5">
                  Auditory Question Readout
                </label>
                <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-slate-400">
                    {state.voiceEnabled ? 'Speech Synthesis Active' : 'Speech Synthesis Disabled'}
                  </span>
                  <button
                    onClick={() => {
                      // simple local alert or toggle global context
                      if ('speechSynthesis' in window) {
                        // toggle via context
                      }
                    }}
                    className="text-xs text-indigo-400 font-semibold"
                  >
                    Configured in Sidebar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={startInterview}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold tracking-wide transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <PlaySquare className="w-5 h-5" />
            Begin Mock Interview
          </button>
        </div>
      )}

      {/* 2. ACTIVE INTERVIEW SCREEN */}
      {screen === 'active' && currentQ && (
        <div className="space-y-5 fade-in">
          
          {/* Header Progress Bar */}
          <div className="flex items-center justify-between bg-slate-900 px-4 py-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Question {currentIndex + 1} of {interviewQuestions.length}
              </span>
              <span className="text-xs text-slate-600">•</span>
              <span className="text-xs font-semibold text-indigo-400">
                {currentQ.difficulty} Tier
              </span>
            </div>

            <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-sm">
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Timeline Bar */}
          <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / interviewQuestions.length) * 100}%` }}
            />
          </div>

          {/* Question Workspace */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Interview Scenario:
              </span>
              <p className="text-xs md:text-sm text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800/60 leading-relaxed">
                {currentQ.scenario}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                Interviewer Prompt:
              </span>
              <h3 className="text-base md:text-lg font-bold text-white leading-relaxed">
                {currentQ.question}
              </h3>
            </div>

            {/* Built-in Scratchpad */}
            <div className="pt-2 space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <Edit3 className="w-3.5 h-3.5" />
                <span>Candidate Scratchpad (Notes & Outlines)</span>
              </label>
              <textarea
                value={scratchpad}
                onChange={(e) => setScratchpad(e.target.value)}
                placeholder="Type code sketches, core architectural bullet points, or trade-offs here before evaluating..."
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to exit the interview? Current score will be discarded.')) {
                  setScreen('setup');
                }
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-medium transition-colors"
            >
              Abandon Interview
            </button>

            <button
              onClick={handleEvaluate}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <span>Evaluate My Answer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* 3. EVALUATION RUBRIC SCREEN */}
      {screen === 'evaluation' && currentQ && (
        <div className="space-y-5 fade-in">
          
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Self-Evaluation Rubric
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Compare your response against the authoritative answer. Be honest—check the key evaluation signals you covered.
            </p>
          </div>

          {/* Ideal Answer Display */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ideal Senior Response</span>
            </div>

            <div className="text-xs md:text-sm text-slate-300 space-y-2 leading-relaxed">
              {/* Simply render the full ideal answer text cleanly */}
              <div className="whitespace-pre-line font-medium">
                {currentQ.idealAnswer}
              </div>
            </div>

            {/* Candidate Scratchpad Review */}
            {scratchpad.trim() && (
              <div className="pt-3 border-t border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Your Scratchpad Notes:</span>
                <pre className="bg-slate-900 p-2.5 rounded-lg text-xs text-slate-400 font-mono overflow-x-auto">
                  {scratchpad}
                </pre>
              </div>
            )}
          </div>

          {/* Actionable Checkboxes */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-white block">
              Evaluation Criteria:
            </span>

            <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={rubricsChecked[0]}
                onChange={(e) => setRubricsChecked([e.target.checked, rubricsChecked[1], rubricsChecked[2]])}
                className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
              />
              <span className="text-xs text-slate-200">
                <strong>Core Trade-offs:</strong> Addressed the foundational architecture differences or memory layout.
              </span>
            </label>

            <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={rubricsChecked[1]}
                onChange={(e) => setRubricsChecked([rubricsChecked[0], e.target.checked, rubricsChecked[2]])}
                className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
              />
              <span className="text-xs text-slate-200">
                <strong>Deep Internals:</strong> Mentioned the precise hardware/JVM components (e.g., Load Barriers, CAS, Scalar Replacement).
              </span>
            </label>

            <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={rubricsChecked[2]}
                onChange={(e) => setRubricsChecked([rubricsChecked[0], rubricsChecked[1], e.target.checked])}
                className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
              />
              <span className="text-xs text-slate-200">
                <strong>Production Realities:</strong> Accounted for failure modes, performance limits, or common pitfalls.
              </span>
            </label>
          </div>

          {/* Footer Submit */}
          <button
            onClick={submitEvaluation}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <span>{currentIndex + 1 < interviewQuestions.length ? 'Submit Score & Next Question' : 'Complete Interview & View Scorecard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>
      )}

      {/* 4. SCORECARD SCREEN */}
      {screen === 'scorecard' && (
        <div className="space-y-6 fade-in text-center py-4">
          
          <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Interview Complete!
            </h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto">
              You've successfully finished the simulation. Your performance has been logged to your global readiness profile.
            </p>
          </div>

          {/* Final Score View */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 max-w-sm mx-auto space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Overall Signal Score
            </span>
            <div className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              {finalPercentage}%
            </div>
            
            <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-slate-950 text-indigo-400 border border-slate-800">
              {finalPercentage >= 80 ? 'Strong Hire Signal' : finalPercentage >= 50 ? 'Leaning Hire' : 'Needs Calibration'}
            </div>
          </div>

          {/* Feedback details */}
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/60 max-w-md mx-auto text-left space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Staff Assessment Summary
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {finalPercentage >= 80 ? (
                "Exceptional depth. You provided authoritative architectural boundaries and communicated multi-threaded hardware constraints smoothly."
              ) : finalPercentage >= 50 ? (
                "Solid theoretical fundamentals. Ensure you emphasize the precise failure modes (like allocation stalls or thread pinning) in every answer."
              ) : (
                "Review the Ideal Answers in the study library. Focus specifically on bridging high-level APIs with internal HotSpot memory behaviors."
              )}
            </p>
          </div>

          {/* Restart */}
          <button
            onClick={() => setScreen('setup')}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Take Another Simulation
          </button>

        </div>
      )}

    </div>
  );
};
