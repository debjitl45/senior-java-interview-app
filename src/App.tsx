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
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            setActiveTab={setActiveTab} 
            setSelectedCategory={setSelectedCategory} 
          />
        );
      case 'library':
        return (
          <Library 
            selectedCategory={selectedCategory} 
            setSelectedCategory={setSelectedCategory} 
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
      default:
        return (
          <Dashboard 
            setActiveTab={setActiveTab} 
            setSelectedCategory={setSelectedCategory} 
          />
        );
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
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
