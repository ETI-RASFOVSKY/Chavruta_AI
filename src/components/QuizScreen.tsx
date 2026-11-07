/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Quiz Screen for Chavruta Smart (מסך שאלון מודרני אינטראקטיבי)
 * הצגת שאלה אחת בכל פעם, משוב מיידי עם הסבר מפורט, ציון סופי ושמירה לטבלת progress.
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  RotateCcw, 
  Award, 
  HelpCircle, 
  Brain, 
  Sparkles, 
  TrendingUp, 
  Home,
  Check,
  ChevronRight
} from 'lucide-react';
import type { Question, Document } from '../types';
import { recordQuestionProgress } from '../services/progress';
import { useAuth } from '../context/AuthContext';

interface QuizScreenProps {
  document: Document;
  questions: Question[];
  onFinish: () => void;
  onBackToDashboard: () => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  document: docItem,
  questions,
  onFinish,
  onBackToDashboard,
}) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<{
    questionId: string;
    selected: number;
    correct: number;
    isCorrect: boolean;
    topic: string;
  }[]>([]);
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);
  const [isSavingProgress, setIsSavingProgress] = useState<boolean>(false);

  const currentQ = questions[currentIndex];
  const qContent = (currentQ?.content || {}) as {
    question?: string;
    options?: string[];
    correct_index?: number;
    explanation?: string;
  };

  const options = qContent.options || [];
  const correctIndex = typeof qContent.correct_index === 'number' ? qContent.correct_index : 0;
  const questionText = qContent.question || '';
  const explanation = qContent.explanation || '';
  const topic = currentQ?.topic || 'כללי';

  // כאשר המשתמש בוחר תשובה
  const handleSelectOption = async (optionIndex: number) => {
    if (isAnswered) return; // לא ניתן לשנות לאחר שנבחר

    setSelectedOption(optionIndex);
    setIsAnswered(true);

    const isCorrect = optionIndex === correctIndex;

    // שמירה מיידית למערך התוצאות המקומי
    setUserAnswers((prev) => [
      ...prev,
      {
        questionId: currentQ.id,
        selected: optionIndex,
        correct: correctIndex,
        isCorrect,
        topic,
      },
    ]);

    // שמירה אוטומטית לטבלת progress ב-Firestore (אבטחת שורות לפי user_id)
    if (user) {
      try {
        setIsSavingProgress(true);
        await recordQuestionProgress(user.uid, currentQ.id, isCorrect);
      } catch (err) {
        console.error('Failed to save progress for question:', err);
      } finally {
        setIsSavingProgress(false);
      }
    }
  };

  // מעבר לשאלה הבאה או סיום המבחן
  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsQuizCompleted(true);
    }
  };

  // אתחול מחדש של המבחן
  const handleRestartQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setUserAnswers([]);
    setIsQuizCompleted(false);
  };

  // סיכום תוצאות
  const correctCount = userAnswers.filter((a) => a.isCorrect).length;
  const totalCount = questions.length;
  const percentage = Math.round((correctCount / totalCount) * 100);

  // קיבוץ לפי נושאים
  const topicStats = userAnswers.reduce((acc, curr) => {
    if (!acc[curr.topic]) {
      acc[curr.topic] = { correct: 0, total: 0 };
    }
    acc[curr.topic].total += 1;
    if (curr.isCorrect) acc[curr.topic].correct += 1;
    return acc;
  }, {} as Record<string, { correct: number; total: number }>);

  // מסך סיכום וציונים (Score Screen)
  if (isQuizCompleted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14 text-right animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xl shadow-slate-100 text-center">
          
          {/* Badge */}
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-indigo-50 text-indigo-600 shadow-inner">
            <Award className="w-10 h-10" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
            סיימת את שאלון התרגול! 🎉
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mb-8">
            מתוך החומר: <span className="font-semibold text-slate-700">{docItem.title}</span>
          </p>

          {/* Score Box */}
          <div className="max-w-xs mx-auto mb-8 p-6 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-xs">
            <div className="text-5xl font-black text-indigo-600 mb-1 tracking-tight">
              {percentage}%
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {correctCount} מתוך {totalCount} תשובות נכונות
            </p>
            <p className="text-xs text-slate-400 mt-2">
              {percentage >= 80 
                ? 'שליטה מצוינת בחומר! המשך כך.' 
                : percentage >= 60 
                ? 'הבנה טובה. שווה לחזור על הנקודות המאתגרות.' 
                : 'מומלץ לתרגל שוב ולקרוא את ההסברים המפורטים.'}
            </p>
          </div>

          {/* Spaced Repetition Notification */}
          <div className="max-w-md mx-auto mb-8 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-900 text-xs sm:text-sm text-right flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">התוצאות נשמרו בטבלת המעקב (Spaced Repetition)</p>
              <p className="text-emerald-700/90 text-xs mt-0.5">
                המערכת מתעדת אילו שאלות היו קלות עבורך ואילו דורשות חיזוק, ותתזמן עבורך חזרות מרווחות בעתיד.
              </p>
            </div>
          </div>

          {/* Topics Breakdown */}
          <div className="text-right max-w-lg mx-auto mb-10">
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              פירוט ביצועים לפי נושאים:
            </h4>
            <div className="space-y-2">
              {Object.entries(topicStats).map(([topName, stats]) => {
                const pct = Math.round((stats.correct / stats.total) * 100);
                return (
                  <div 
                    key={topName} 
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs sm:text-sm"
                  >
                    <span className="font-medium text-slate-700">{topName}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-800 w-12 text-left">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleRestartQuiz}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>תרגל שוב את השאלון</span>
            </button>

            <button
              onClick={onBackToDashboard}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all"
            >
              <Home className="w-4 h-4" />
              <span>חזור ללוח הבקרה</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // תצוגת שאלה בודדת (One Question at a Time)
  const optionLetters = ['א', 'ב', 'ג', 'ד'];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 text-right">
      
      {/* Top Bar: Back, Title, Progress */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          <span>חזור לחומרי הלימוד</span>
        </button>

        <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
          {topic}
        </span>
      </div>

      {/* Progress Bar & Counter */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
          <span>שאלה {currentIndex + 1} מתוך {questions.length}</span>
          <span>{Math.round(((currentIndex) / questions.length) * 100)}% הושלם</span>
        </div>
        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm mb-6">
        
        {/* Question Prompt */}
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed mb-6">
          {questionText}
        </h3>

        {/* Options List */}
        <div className="space-y-3 mb-6">
          {options.map((optionText, idx) => {
            const isSelected = selectedOption === idx;
            const isThisCorrect = idx === correctIndex;

            // עיצוב תגובתי למצב לאחר מענה (Immediate Feedback)
            let buttonStyle = 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800';
            let letterBadgeStyle = 'bg-slate-100 text-slate-600';
            let icon = null;

            if (isAnswered) {
              if (isThisCorrect) {
                buttonStyle = 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-medium ring-1 ring-emerald-500';
                letterBadgeStyle = 'bg-emerald-600 text-white';
                icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
              } else if (isSelected && !isThisCorrect) {
                buttonStyle = 'border-rose-500 bg-rose-50/70 text-rose-950 ring-1 ring-rose-500';
                letterBadgeStyle = 'bg-rose-600 text-white';
                icon = <XCircle className="w-5 h-5 text-rose-600 shrink-0" />;
              } else {
                buttonStyle = 'border-slate-200 bg-slate-50/50 text-slate-400 opacity-60';
              }
            } else if (isSelected) {
              buttonStyle = 'border-indigo-600 bg-indigo-50/50 text-indigo-950';
              letterBadgeStyle = 'bg-indigo-600 text-white';
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-4 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 text-sm sm:text-base ${buttonStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${letterBadgeStyle}`}>
                    {optionLetters[idx] || idx + 1}
                  </span>
                  <span className="leading-snug">{optionText}</span>
                </div>
                {icon}
              </button>
            );
          })}
        </div>

        {/* Immediate Feedback Explanation Box */}
        {isAnswered && (
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-indigo-950 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-2.5 mb-1.5">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <h4 className="font-bold text-sm sm:text-base text-indigo-900">
                {selectedOption === correctIndex ? 'כל הכבוד! תשובה נכונה' : 'הסבר לתשובה הנכונה:'}
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pr-7">
              {explanation}
            </p>
          </div>
        )}

      </div>

      {/* Next Question Button */}
      {isAnswered && (
        <div className="flex justify-end animate-in fade-in duration-200">
          <button
            onClick={handleNextQuestion}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 transition-all hover:shadow-indigo-300 active:scale-98"
          >
            <span>{currentIndex + 1 === questions.length ? 'צפה בציון הסופי' : 'השאלה הבאה'}</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
};
