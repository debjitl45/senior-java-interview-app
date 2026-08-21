import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Library } from './components/Library';
import { DefectAnalyzer } from './components/DefectAnalyzer';
import { Simulator } from './components/Simulator';
import { Flashcards } from './components/Flashcards';
import { ComplianceInfo } from './components/ComplianceInfo';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

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
          />
        );
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {content()}
    </Layout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
