/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Chavruta Smart (חברותא חכמה) - Main Application Component
 * שותף לימוד סוקרטי מבוסס בינה מלאכותית
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { AddDocumentPage } from './components/AddDocumentPage';
import { QuizScreen } from './components/QuizScreen';
import { SocraticChatScreen } from './components/SocraticChatScreen';
import { DailyReviewScreen } from './components/DailyReviewScreen';
import { fetchDueQuestionsForUser } from './services/progress';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { Document, Question } from './types';

type ActiveView = 'dashboard' | 'add-document' | 'quiz' | 'chat' | 'daily-review';

const MainApp: React.FC = () => {
  const { user, loading, error } = useAuth();
  const [currentView, setCurrentView] = useState<ActiveView>('dashboard');
  const [quizDoc, setQuizDoc] = useState<Document | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [chatDoc, setChatDoc] = useState<Document | null>(null);
  const [dueReviewCount, setDueReviewCount] = useState<number>(0);

  // פונקציה לעדכון כמות השאלות הממתינות לחזרה יומית
  const refreshDueCount = useCallback(async () => {
    if (!user) {
      setDueReviewCount(0);
      return;
    }
    try {
      const items = await fetchDueQuestionsForUser(user.uid);
      setDueReviewCount(items.length);
    } catch (err) {
      console.error('Failed to refresh due review count:', err);
    }
  }, [user]);

  useEffect(() => {
    refreshDueCount();
  }, [refreshDueCount, currentView]);

  // מסך טעינה בזמן בדיקת חיבור המשתמש ב-Firebase
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">טוען את החברותא שלך...</p>
        </div>
      </div>
    );
  }

  // כאשר המשתמש אינו מחובר - יוצג דף הנחיתה
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1">
          <LandingPage />
        </div>
      </div>
    );
  }

  // התחלת תרגול שאלון
  const handleStartQuiz = (docItem: Document, questions: Question[]) => {
    setQuizDoc(docItem);
    setQuizQuestions(questions);
    setCurrentView('quiz');
  };

  // התחלת שיחת לימוד סוקרטית עם החברותא
  const handleStartChat = (docItem: Document) => {
    setChatDoc(docItem);
    setCurrentView('chat');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar
        dueReviewCount={dueReviewCount}
        onNavigateToDailyReview={() => setCurrentView('daily-review')}
        onNavigateToDashboard={() => setCurrentView('dashboard')}
      />

      <main className="flex-1">
        {/* הצגת שגיאת אימות במידה וקיימת */}
        {error && (
          <div className="max-w-4xl mx-auto px-4 mt-4">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* ניתוב בין תצוגות המשתמש המחובר */}
        {currentView === 'add-document' && (
          <AddDocumentPage
            onBack={() => setCurrentView('dashboard')}
            onQuizReady={(docItem, questions) => handleStartQuiz(docItem, questions)}
            onStartChat={(docItem) => handleStartChat(docItem)}
          />
        )}

        {currentView === 'quiz' && quizDoc && (
          <QuizScreen
            document={quizDoc}
            questions={quizQuestions}
            onFinish={() => {
              setCurrentView('dashboard');
              refreshDueCount();
            }}
            onBackToDashboard={() => {
              setCurrentView('dashboard');
              refreshDueCount();
            }}
          />
        )}

        {currentView === 'chat' && chatDoc && (
          <SocraticChatScreen
            document={chatDoc}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'daily-review' && (
          <DailyReviewScreen
            onBackToDashboard={() => {
              setCurrentView('dashboard');
              refreshDueCount();
            }}
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard
            onNavigateToAddDocument={() => setCurrentView('add-document')}
            onStartQuiz={(docItem, questions) => handleStartQuiz(docItem, questions)}
            onStartChat={(docItem) => handleStartChat(docItem)}
            onNavigateToDailyReview={() => setCurrentView('daily-review')}
          />
        )}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
