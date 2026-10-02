import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Library } from './components/Library';
import { DefectAnalyzer } from './components/DefectAnalyzer';
import { Simulator } from './components/Simulator';
import { Flashcards } from './components/Flashcards';
import { ComplianceInfo } from './components/ComplianceInfo';
import { InterviewRPG } from './game/InterviewRPG';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [gameOpen, setGameOpen] = useState(false);

  const content = () => {
    switch (activeTab) {
      case 'library':
        return (
          <Library
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedTrack={selectedTrack}
            setSelectedTrack={setSelectedTrack}
          />
        );
      case 'defects':
        return <DefectAnalyzer />;
      case 'interview':
        return <Simulator />;
      case 'flashcards':
        return <Flashcards />;
      case 'info':
        return <ComplianceInfo />;
      case 'dashboard':
      default:
        return (
          <Dashboard
            setActiveTab={setActiveTab}
            setSelectedCategory={setSelectedCategory}
            setSelectedTrack={setSelectedTrack}
            onStartGame={() => setGameOpen(true)}
          />
        );
    }
  };

  return (
    <>
      {/* The game is a full-screen layer; the app underneath stays mounted but inert. */}
      <div className="h-full" inert={gameOpen}>
        <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
          {content()}
        </Layout>
      </div>
      <AnimatePresence>{gameOpen && <InterviewRPG onExit={() => setGameOpen(false)} />}</AnimatePresence>
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
