/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Dashboard for Chavruta Smart (חברותא חכמה)
 * הצגת רשימת חומרי הלימוד של המשתמש עם כפתור "הוסף חומר לימוד", תרגול שאלונים ואבטחת Row-Level Security
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Plus, 
  Sparkles, 
  FileText, 
  Calendar, 
  Trash2, 
  Search, 
  ShieldCheck, 
  Layers, 
  TrendingUp, 
  ArrowLeft,
  Loader2,
  Play,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import type { Document, Question } from '../types';
import { subscribeToUserDocuments, deleteDocument } from '../services/documents';
import { fetchQuestionsForDocument, saveGeneratedQuestions } from '../services/questions';
import { fetchDueQuestionsForUser } from '../services/progress';
import { DocumentViewModal } from './DocumentViewModal';

interface DashboardProps {
  onNavigateToAddDocument: () => void;
  onStartQuiz: (document: Document, questions: Question[]) => void;
  onStartChat: (document: Document) => void;
  onNavigateToDailyReview?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigateToAddDocument,
  onStartQuiz,
  onStartChat,
  onNavigateToDailyReview,
}) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [loadingQuizDocId, setLoadingQuizDocId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dueCount, setDueCount] = useState<number>(0);

  const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'תלמיד/ה';

  // טעינת מספר השאלות הממתינות לחזרה יומית
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    fetchDueQuestionsForUser(user.uid)
      .then((items) => {
        if (isMounted) setDueCount(items.length);
      })
      .catch((err) => console.error(err));

    return () => { isMounted = false; };
  }, [user]);

  // האזנה בזמן אמת למסמכים של המשתמש בלבד
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsubscribe = subscribeToUserDocuments(
      user.uid,
      (docs) => {
        setDocuments(docs);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to subscribe to documents:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (docId: string) => {
    try {
      await deleteDocument(docId);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Launch or generate quiz for a document
  const handleLaunchQuiz = async (docItem: Document) => {
    if (!user) return;

    setLoadingQuizDocId(docItem.id);
    setErrorMessage(null);

    try {
      // 1. Check if questions already exist for this document
      const existing = await fetchQuestionsForDocument(user.uid, docItem.id);
      if (existing && existing.length > 0) {
        onStartQuiz(docItem, existing);
        return;
      }

      // 2. If not, generate 8 questions from server API
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: docItem.raw_text,
          title: docItem.title,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'שגיאה ביצירת השאלון.');
      }

      const generated = data.questions;
      const saved = await saveGeneratedQuestions(user.uid, docItem.id, generated);

      onStartQuiz(docItem, saved);
    } catch (err: any) {
      console.error('Error starting quiz:', err);
      setErrorMessage(err.message || 'לא ניתן לפתוח שאלון עבור חומר זה כעת. אנא נסה שוב.');
    } finally {
      setLoadingQuizDocId(null);
    }
  };

  // סינון מסמכים לפי חיפוש
  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.raw_text.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              שלום, {firstName}! 👋
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              מחובר
            </span>
          </div>
          <p className="text-slate-500 text-sm sm:text-base">
            מרחב הלימוד האישי שלך ב&quot;חברותא חכמה&quot;
          </p>
        </div>

        {/* Action Button: Add Document */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToAddDocument}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm shadow-indigo-200 transition-all hover:shadow active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>הוסף חומר לימוד</span>
          </button>
        </div>
      </div>

      {/* Security & Row-Level Security reassurance badge */}
      <div className="mb-6 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100/90 border border-slate-200/80 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>אבטחת שורות (Row-Level Security): רק אתה יכול לצפות, לתרגל ולמחוק את החומרים שלך.</span>
      </div>

      {/* Error message banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-700 text-xs px-2 py-1"
          >
            סגור
          </button>
        </div>
      )}

      {/* Daily Review Reminder Banner if questions are due */}
      {dueCount > 0 && onNavigateToDailyReview && (
        <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-200">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  יש לך {dueCount} {dueCount === 1 ? 'שאלה שממתינה' : 'שאלות שממתינות'} לחזרה יומית להיום!
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  חזרה מרווחת
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                חזרה קצרה עכשיו מחזקת את מסלולי הזיכרון במוח ומונעת שכחה (Spaced Repetition).
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToDailyReview}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-98 shrink-0"
          >
            <span>התחל חזרה יומית</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">חומרי לימוד</p>
            <p className="text-2xl font-bold text-slate-900">{documents.length}</p>
            <p className="text-[11px] text-slate-400">סיכומים ומסמכים שמורים</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">שאלוני תרגול</p>
            <p className="text-2xl font-bold text-slate-900">8 שאלות</p>
            <p className="text-[11px] text-slate-400">מחוללות מכל חומר</p>
          </div>
        </div>

        <div 
          onClick={onNavigateToDailyReview}
          className={`bg-white rounded-2xl p-5 border shadow-sm flex items-center justify-between gap-4 transition-all ${
            onNavigateToDailyReview ? 'cursor-pointer hover:border-amber-400 hover:shadow-md' : 'border-slate-200/80'
          }`}
          title="לחץ לפתיחת מסך החזרה היומית"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">חזרה מרווחת להיום</p>
              <p className="text-2xl font-bold text-slate-900">
                {dueCount > 0 ? `${dueCount} שאלות` : 'הכל מעודכן'}
              </p>
              <p className="text-[11px] text-slate-400">
                {dueCount > 0 ? 'ממתינות לתרגול היום' : 'אין שאלות שפג תוקפן'}
              </p>
            </div>
          </div>
          {onNavigateToDailyReview && dueCount > 0 && (
            <span className="hidden sm:inline-flex items-center text-xs font-semibold text-amber-600 group-hover:translate-x-1 transition-transform">
              תרגל &larr;
            </span>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500">טוען את חומרי הלימוד שלך...</p>
        </div>
      ) : documents.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-12 text-center shadow-sm">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-2">
              עדיין לא הוספת חומרי לימוד
            </h2>

            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              העלה קובץ PDF או TXT, או הדבק סיכום הרצאה. לאחר השמירה תוכל לחולל שאלון אינטראקטיבי של 8 שאלות מתוך החומר.
            </p>

            <button
              onClick={onNavigateToAddDocument}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm shadow-indigo-200 transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>הוסף חומר לימוד ראשון</span>
            </button>
          </div>
        </div>
      ) : (
        /* Documents List View */
        <div className="space-y-6">
          {/* Search bar and counter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="חפש בחומרי הלימוד..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-900 placeholder:text-slate-400 bg-white"
              />
            </div>
            <p className="text-xs text-slate-500">
              מציג {filteredDocuments.length} מתוך {documents.length} חומרי לימוד
            </p>
          </div>

          {/* Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDocuments.map((docItem) => {
              const formattedDate = new Date(docItem.created_at).toLocaleDateString('he-IL', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              });
              const wordCount = docItem.raw_text.split(/\s+/).filter(Boolean).length;
              const isGeneratingThisQuiz = loadingQuizDocId === docItem.id;

              return (
                <div
                  key={docItem.id}
                  className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-indigo-300 text-right"
                >
                  <div>
                    {/* Top Row: Date & Action */}
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formattedDate}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('האם למחוק חומר לימוד זה?')) {
                            handleDelete(docItem.id);
                          }
                        }}
                        title="מחק חומר לימוד"
                        className="text-slate-300 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Document Title */}
                    <h3 
                      onClick={() => setSelectedDoc(docItem)}
                      className="text-base font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors cursor-pointer line-clamp-2"
                    >
                      {docItem.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                      {docItem.raw_text}
                    </p>
                  </div>

                  {/* Card Bottom: Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium shrink-0">
                      {wordCount} מילים
                    </span>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => setSelectedDoc(docItem)}
                        className="text-slate-400 hover:text-slate-700 text-xs px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        צפה
                      </button>

                      {/* Socratic Partner Study Chat button */}
                      <button
                        onClick={() => onStartChat(docItem)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs border border-purple-200/60 transition-all active:scale-98"
                        title="פתח שיחת חברותא סוקרטית על חומר זה"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>למד עם חברותא</span>
                      </button>

                      {/* Quiz Button */}
                      <button
                        onClick={() => handleLaunchQuiz(docItem)}
                        disabled={isGeneratingThisQuiz}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200/60 transition-all active:scale-98 disabled:opacity-50"
                      >
                        {isGeneratingThisQuiz ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>טוען...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>שאלון</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredDocuments.length === 0 && searchQuery && (
            <div className="py-12 text-center text-slate-500 text-sm">
              לא נמצאו חומרי לימוד התואמים את החיפוש &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      )}

      {/* View Document Modal */}
      <DocumentViewModal
        document={selectedDoc}
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        onDelete={handleDelete}
      />

    </div>
  );
};
