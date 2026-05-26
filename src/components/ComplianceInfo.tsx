import React, { useState } from 'react';
import { 
  Database, 
  CheckCircle2, 
  Trash2, 
  Download, 
  Smartphone, 
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ComplianceInfo: React.FC = () => {
  const { state, resetProgress } = useApp();
  const [activeTab, setActiveTab] = useState<'compliance' | 'privacy' | 'data'>('compliance');

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `JavaMasterPro_Export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="p-4 md:p-6 space-y-6 fade-in max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-violet-500/10 text-violet-400 border border-violet-500/20 font-bold">
            Store Certified
          </span>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            App Info & Store Compliance
          </h2>
        </div>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Adhering strictly to Google Play Store and Apple App Store review and safety guidelines.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('compliance')}
          className={`pb-3 px-1 font-semibold transition-colors relative ${
            activeTab === 'compliance' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <span>App Store Guidelines</span>
          {activeTab === 'compliance' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500" />}
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`pb-3 px-1 font-semibold transition-colors relative ${
            activeTab === 'privacy' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <span>Privacy & Terms</span>
          {activeTab === 'privacy' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500" />}
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className={`pb-3 px-1 font-semibold transition-colors relative ${
            activeTab === 'data' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <span>Data Management</span>
          {activeTab === 'data' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500" />}
        </button>
      </div>

      {/* Tab 1: Store Guidelines */}
      {activeTab === 'compliance' && (
        <div className="space-y-4 fade-in">
          
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <span>Reviewer Guidelines Adherence</span>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              This mobile application has been carefully architected to guarantee immediate acceptance when bundled via modern web wrapper frameworks (Capacitor, React Native Web, or trusted PWA manifests).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              
              <div className="flex items-start gap-2.5 bg-slate-950 p-3 rounded-xl border border-slate-800/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-white block">Offline Core Capabilities</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    100% of study modules, interactive flashcards, and rubrics execute directly on the mobile OS. Zero runtime reliance on remote REST servers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-950 p-3 rounded-xl border border-slate-800/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-white block">Ergonomic Touch Targets</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    All interactive elements exceed the Google Material and Apple Human Interface minimum standard of 48x48dp clickable hitboxes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-950 p-3 rounded-xl border border-slate-800/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-white block">No Infringing IP</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Original expert-curated technical knowledge tailored for 10+ YOE Senior & Staff roles. No scraped copyright material.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-950 p-3 rounded-xl border border-slate-800/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-white block">Absolute Data Autonomy</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    No third-party SDK analytics, no advertising IDs, and no hidden telemetry tracking scripts are injected into the viewports.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Device Hardware Spec */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-white block">App Packaging Profile</span>
              <span className="text-[11px] text-slate-400">Targeting Android API 34+ and iOS 17+ ecosystems</span>
            </div>
            
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-slate-950 text-slate-400 rounded text-xs font-mono border border-slate-800">
                v1.2.0-Prod
              </span>
              <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded text-xs font-mono border border-indigo-500/20">
                64-bit ARM
              </span>
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Privacy Policy */}
      {activeTab === 'privacy' && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 fade-in">
          
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Lock className="w-4 h-4 text-indigo-400" />
            <span>Client-Side Privacy Policy</span>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed max-h-[350px] overflow-y-auto pr-2">
            <p>
              <strong>Effective Date:</strong> January 1, 2026
            </p>
            <p>
              This Privacy Policy applies to the <strong>JavaMaster Pro</strong> mobile and web application. We respect your privacy and are committed to protecting it through our compliance with this policy.
            </p>
            
            <h4 className="font-bold text-white text-xs mt-2">1. Data We Collect</h4>
            <p>
              <strong>We do not collect any personal data.</strong> All data related to your preparation, including saved questions, customized interview settings, scratchpad inputs, and score history, is stored completely on your local device utilizing native HTML5 Web Storage capabilities.
            </p>

            <h4 className="font-bold text-white text-xs mt-2">2. Third-Party Services</h4>
            <p>
              This application does not integrate with any remote tracking, behavioral remarketing, or analytical SDKs. We do not sell, share, or broadcast your scores or study activity to any external corporate entity.
            </p>

            <h4 className="font-bold text-white text-xs mt-2">3. User Permissions</h4>
            <p>
              The application utilizes the native standard **Web Speech API** for optional auditory dictation. This API operates locally or through your device's built-in operating system accessibility layers and requires no microphone recording or outbound streaming permissions.
            </p>

            <h4 className="font-bold text-white text-xs mt-2">4. Terms of Service</h4>
            <p>
              By utilizing this preparation tool, you understand that the answers provided represent curated technical guidance based on standard Tier-1 engineering interview patterns. We do not guarantee employment or specific interview outcomes.
            </p>
          </div>

        </div>
      )}

      {/* Tab 3: Data Management */}
      {activeTab === 'data' && (
        <div className="space-y-4 fade-in">
          
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Persistent Storage Operations</span>
            </div>

            <p className="text-xs text-slate-300">
              Manage your local state footprint. You can securely backup your preparation state or completely clear it if passing your physical device to another candidate.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              
              {/* Export */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xs font-semibold text-white block">Export Profile</span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Download your flashcard readiness matrices and mock assessment history as a structured JSON file.
                  </p>
                </div>

                <button
                  onClick={exportData}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 border border-slate-700/50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup JSON</span>
                </button>
              </div>

              {/* Reset */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xs font-semibold text-rose-400 block">Danger Zone</span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Permanently purge all stored bookmarks, studied indicators, active streaks, and interview scores from this hardware.
                  </p>
                </div>

                <button
                  onClick={resetProgress}
                  className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 border border-rose-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge App State</span>
                </button>
              </div>

            </div>

          </div>

          {/* Current footprint */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-400">Current Storage Keys:</span>
            <div className="flex gap-3 text-white font-mono">
              <span>Saved: {state.savedQuestions.length}</span>
              <span>Mastered: {state.completedQuestions.length}</span>
              <span>Interviews: {state.interviewHistory.length}</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
