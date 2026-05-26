import React, { createContext, useContext, useState, useEffect } from 'react';

interface InterviewRecord {
  id: string;
  date: string;
  score: number;
  preset: string;
  totalQuestions: number;
}

interface AppState {
  savedQuestions: string[];
  completedQuestions: string[];
  flashcardRatings: Record<string, 'Again' | 'Hard' | 'Good' | 'Easy'>;
  streak: number;
  lastActiveDate: string;
  interviewHistory: InterviewRecord[];
  theme: 'dark' | 'light';
  voiceEnabled: boolean;
}

interface AppContextType {
  state: AppState;
  toggleSaveQuestion: (id: string) => void;
  toggleCompleteQuestion: (id: string) => void;
  rateFlashcard: (id: string, rating: 'Again' | 'Hard' | 'Good' | 'Easy') => void;
  saveInterview: (record: Omit<InterviewRecord, 'id' | 'date'>) => void;
  toggleVoice: () => void;
  resetProgress: () => void;
  getReadinessScore: () => number;
}

const initialState: AppState = {
  savedQuestions: [],
  completedQuestions: [],
  flashcardRatings: {},
  streak: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  interviewHistory: [],
  theme: 'dark',
  voiceEnabled: true
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'JavaMasterPro_AppState_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Calculate streak updates
        const today = new Date().toISOString().split('T')[0];
        let currentStreak = parsed.streak || 1;
        
        if (parsed.lastActiveDate) {
          const lastDate = new Date(parsed.lastActiveDate);
          const currentDate = new Date(today);
          const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentStreak += 1;
          } else if (diffDays > 1) {
            currentStreak = 1;
          }
        }
        
        return {
          ...initialState,
          ...parsed,
          streak: currentStreak,
          lastActiveDate: today
        };
      }
    } catch (e) {
      console.error('Failed to load state from localStorage', e);
    }
    return initialState;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }, [state]);

  const toggleSaveQuestion = (id: string) => {
    setState(prev => {
      const exists = prev.savedQuestions.includes(id);
      return {
        ...prev,
        savedQuestions: exists 
          ? prev.savedQuestions.filter(qId => qId !== id)
          : [...prev.savedQuestions, id]
      };
    });
  };

  const toggleCompleteQuestion = (id: string) => {
    setState(prev => {
      const exists = prev.completedQuestions.includes(id);
      return {
        ...prev,
        completedQuestions: exists
          ? prev.completedQuestions.filter(qId => qId !== id)
          : [...prev.completedQuestions, id]
      };
    });
  };

  const rateFlashcard = (id: string, rating: 'Again' | 'Hard' | 'Good' | 'Easy') => {
    setState(prev => ({
      ...prev,
      flashcardRatings: {
        ...prev.flashcardRatings,
        [id]: rating
      },
      // Automatically mark as studied/completed if rated Good or Easy
      completedQuestions: (rating === 'Good' || rating === 'Easy') && !prev.completedQuestions.includes(id)
        ? [...prev.completedQuestions, id]
        : prev.completedQuestions
    }));
  };

  const saveInterview = (record: Omit<InterviewRecord, 'id' | 'date'>) => {
    const newRecord: InterviewRecord = {
      ...record,
      id: 'int_' + Date.now(),
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    };
    setState(prev => ({
      ...prev,
      interviewHistory: [newRecord, ...prev.interviewHistory]
    }));
  };

  const toggleVoice = () => {
    setState(prev => ({
      ...prev,
      voiceEnabled: !prev.voiceEnabled
    }));
  };

  const resetProgress = () => {
    if (window.confirm('Are you sure you want to reset all preparation progress? This cannot be undone.')) {
      setState(initialState);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const getReadinessScore = () => {
    // Total out of 100 based on completed questions, flashcard mastery, and interview performance
    // Total questions = 16
    const totalQuestions = 16;
    const completedWeight = (state.completedQuestions.length / totalQuestions) * 40;
    
    // Flashcard ratings
    const ratings = Object.values(state.flashcardRatings);
    let flashcardScore = 0;
    if (ratings.length > 0) {
      const points = ratings.reduce((acc, r) => {
        if (r === 'Easy') return acc + 3;
        if (r === 'Good') return acc + 2;
        if (r === 'Hard') return acc + 1;
        return acc;
      }, 0);
      flashcardScore = (points / (ratings.length * 3)) * 30;
    }

    // Interview history
    let interviewScore = 0;
    if (state.interviewHistory.length > 0) {
      const avgScore = state.interviewHistory.reduce((acc, curr) => acc + curr.score, 0) / state.interviewHistory.length;
      interviewScore = (avgScore / 100) * 30;
    }

    return Math.min(100, Math.round(completedWeight + flashcardScore + interviewScore));
  };

  return (
    <AppContext.Provider value={{
      state,
      toggleSaveQuestion,
      toggleCompleteQuestion,
      rateFlashcard,
      saveInterview,
      toggleVoice,
      resetProgress,
      getReadinessScore
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
