/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Daily Review Screen for Chavruta Smart (חזרה יומית מבוססת Spaced Repetition)
 * מציג אך ורק את השאלות שתאריך החזרה שלהן (next_review_at) הגיע להיום או עבר.
 * מנגנון תזמון מדויק: טעות חוזרת מחר (יום 1), תשובה נכונה אחרי 3 ימים, ולאחר מכן 7 ימים.
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  CalendarCheck, 
  ArrowLeft, 
  ChevronRight, 
  Sparkles, 
  RotateCcw, 
  Award, 
  Clock, 
  Loader2, 
  TrendingUp, 
  Home,
  Check
} from 'lucide-react';
import type { Question, Progress } from '../types';
import { fetchDueQuestionsForUser, recordQuestionProgress, DueQuestionItem } from '../services/progress';
import { useAuth } from '../context/AuthContext';

interface DailyReviewScreenProps {
  onBackToDashboard: () => void;
}

export const DailyReviewScreen: React.FC<DailyReviewScreenProps> = ({
  onBackToDashboard,
}) => {
  const { user } = useAuth();
  const [dueItems, setDueItems] = useState<DueQuestionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [nextIntervalMessage, setNextIntervalMessage] = useState<string>('');
  const [answersSummary, setAnswersSummary] = useState<{
    questionId: string;
    isCorrect: boolean;
    topic: string;
  }[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // טעינת כל השאלות שמועד החזרה שלהן הגיע להיום
  useEffect(() => {
    if (!user) return;
    const userId = user.uid;
    let isMounted = true;

    async function loadDueQuestions() {
      setLoading(true);
      try {
        const items = await fetchDueQuestionsForUser(userId);
        if (isMounted) {
          setDueItems(items);
        }
      } catch (err) {
        console.error('Failed to load due review questions:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDueQuestions();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const currentItem = dueItems[currentIndex];
  const currentQ = currentItem?.question;
  const currentProgress = currentItem?.progress;

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

  // כאשר התלמיד בוחר תשובה
  const handleSelectOption = async (optionIndex: number) => {
    if (isAnswered || !currentQ || !user) return;

    setSelectedOption(optionIndex);
    setIsAnswered(true);

    const isCorrect = optionIndex === correctIndex;

    // חישוב מילולי של מועד החזרה הבא להצגה לתלמיד
    const previousCorrect = currentProgress?.times_correct || 0;
    if (isCorrect) {
      if (previousCorrect >= 1) {
        setNextIntervalMessage('תשובה נכונה נוספת! החזרה הבאה תוזמנה לבעוד 7 ימים.');
      } else {
        setNextIntervalMessage('תשובה נכונה! החזרה הבאה תוזמנה לבעוד 3 ימים.');
      }
    } else {
      setNextIntervalMessage('טעות. השאלה תחזור מחר (בעוד 24 שעות) לחיזוק הזיכרון.');
    }

    setAnswersSummary((prev) => [
      ...prev,
      {
        questionId: currentQ.id,
        isCorrect,
        topic,
      },
    ]);

    // שמירה מיידית בטבלת progress עם הכלל: טעות=מחר (1 יום), נכון=3 ימים, 7 ימים
    try {
      await recordQuestionProgress(user.uid, currentQ.id, isCorrect);
    } catch (err) {
      console.error('Failed to update review progress:', err);
    }
  };

  // מעבר לשאלה הבאה
  const handleNext = () => {
    if (currentIndex + 1 < dueItems.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setNextIntervalMessage('');
    } else {
      setIsCompleted(true);
    }
  };

  // טעינה
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">בודק אילו שאלות הגיע זמנן להתרענן בזיכרון...</p>
      </div>
    );
  }

  // מצב בו אין שאלות לחזרה היום (All Caught Up!)
  if (!loading && dueItems.length === 0 && !isCompleted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16 text-center animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center">
          
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-xs">
            <CalendarCheck className="w-10 h-10" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
            הזיכרון שלך מעודכן לחלוטין! 🎉
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed mb-8">
            אין שאלות שממתינות לחזרה להיום. כל החומרים תורגלו ונמצאים במרווחי הזמן הנכונים (מחר, בעוד 3 ימים, או בעוד שבוע).
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 max-w-md mx-auto mb-8 text-right space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>כיצד פועל מנגנון החזרה היומית?</span>
            </div>
            <p>• <strong>תשובה שגויה:</strong> חוזרת מחר (בעוד יום אחד) לחיזוק מהיר.</p>
            <p>• <strong>תשובה נכונה ראשונה:</strong> חוזרת בעוד 3 ימים.</p>
            <p>• <strong>תשובה נכונה חוזרת:</strong> חוזרת בעוד 7 ימים לשימור לטווח ארוך.</p>
          </div>

          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-all"
          >
            <Home className="w-4 h-4" />
            <span>חזרה ללוח הבקרה</span>
          </button>

        </div>
      </div>
    );
  }

  // מסך סיום החזרה היומית
  if (isCompleted) {
    const correctCount = answersSummary.filter((a) => a.isCorrect).length;
    const totalCount = dueItems.length;
    const percentage = Math.round((correctCount / totalCount) * 100);

    return (
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16 text-center animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center">
          
          <div className="w-20 h-20 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Award className="w-10 h-10" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
            סיימת את החזרה היומית! 👏
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mb-6">
            השלמת את כל השאלות שתוזמנו להיום
          </p>

          <div className="max-w-xs mx-auto mb-8 p-6 rounded-3xl bg-slate-50 border border-slate-200/80">
            <div className="text-5xl font-black text-indigo-600 mb-1">{percentage}%</div>
            <p className="text-sm font-semibold text-slate-700">
              {correctCount} מתוך {totalCount} תשובות נכונות
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-900 text-xs sm:text-sm max-w-md mx-auto mb-8 text-right flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">כל התוצאות עודכנו בטבלת progress</p>
              <p className="text-emerald-700 text-xs mt-0.5">
                שאלות שטעית בהן ישובו מחר. שאלות שענית עליהן נכון תוזמנו ל-3 או ל-7 ימים מהיום.
              </p>
            </div>
          </div>

          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-all"
          >
            <Home className="w-4 h-4" />
            <span>חזרה ללוח הבקרה</span>
          </button>

        </div>
      </div>
    );
  }

  // שאלה יומית בודדת
  const optionLetters = ['א', 'ב', 'ג', 'ד'];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 text-right">
      
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          <span>חזרה ללוח הבקרה</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            חזרה יומית
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
            {topic}
          </span>
        </div>
      </div>

      {/* Progress counter */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
          <span>שאלה {currentIndex + 1} מתוך {dueItems.length} הממתינות להיום</span>
          <span>{Math.round(((currentIndex) / dueItems.length) * 100)}% הושלם</span>
        </div>
        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-amber-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / dueItems.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm mb-6">
        
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed mb-6">
          {questionText}
        </h3>

        {/* Options List */}
        <div className="space-y-3 mb-6">
          {options.map((optionText, idx) => {
            const isSelected = selectedOption === idx;
            const isThisCorrect = idx === correctIndex;

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

        {/* Feedback and next_review_at interval notice */}
        {isAnswered && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Spaced repetition schedule banner */}
            <div className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
              selectedOption === correctIndex 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <Clock className="w-4 h-4 shrink-0" />
              <span>{nextIntervalMessage}</span>
            </div>

            {/* Explanation */}
            <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-indigo-950">
              <div className="flex items-center gap-2 font-bold text-xs text-indigo-900 mb-1">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>הסבר לתשובה:</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pr-6">
                {explanation}
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Next Button */}
      {isAnswered && (
        <div className="flex justify-end animate-in fade-in duration-200">
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 transition-all hover:shadow-indigo-300 active:scale-98"
          >
            <span>{currentIndex + 1 === dueItems.length ? 'סיים חזרה יומית' : 'השאלה הבאה'}</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
};
