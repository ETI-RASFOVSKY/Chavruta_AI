/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Add Document Modal (הוספת חומר לימוד חדש)
 * מודאל ידידותי בעברית להדבקת סיכומים, הרצאות או טקסטים ללימוד.
 */

import React, { useState } from 'react';
import { X, FileText, Sparkles, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { createDocument } from '../services/documents';
import { useAuth } from '../context/AuthContext';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentCreated?: () => void;
}

export const AddDocumentModal: React.FC<AddDocumentModalProps> = ({
  isOpen,
  onClose,
  onDocumentCreated,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // דוגמאות מוכנות שסטודנט יכול לטעון בלחיצה אחת
  const handleLoadSample = (sampleType: 'bio' | 'law' | 'cs') => {
    if (sampleType === 'bio') {
      setTitle('ביולוגיה של התא: נשימה תאית ומיתוכונדריה');
      setRawText(`הנשימה התאית היא התהליך שבאמצעותו תאים מפיקים אנרגיה (מולקולות ATP) מפירוק תרכובות אורגניות, ובעיקר גלוקוז.

שלבי הנשימה התאית:
1. גליקוליזה: מתרחשת בציטופלזמה של התא, אינה דורשת חמצן. מולקולת גלוקוז מתפרקת לשתי מולקולות פירובט. בתהליך זה נוצר רווח נקי של 2 מולקולות ATP.
2. מעגל קרבס (מעגל חומצת הלימון): מתרחש במטריקס של המיתוכונדריה בנוכחות חמצן. הפירובט הופך לאצטיל קואנזים A ונכנס למעגל, תוך שחרור פחמן דו-חמצני וטעינת נשאי אלקטרונים (NADH ו-FADH2).
3. שרשרת מעבר האלקטרונים (זרחון חמצוני): מתרחשת על גבי הממברנה הפנימית של המיתוכונדריה (קריסטה). האלקטרונים מועברים דרך קומפלקסים חלבוניים, ומניעים משאבות פרוטונים שיוצרות מפל ריכוזים. החמצן משמש כקולט האלקטרונים הסופי ונוצרים מים. אנזים ATP synthase מייצר כ-32-34 מולקולות ATP.`);
    } else if (sampleType === 'law') {
      setTitle('דיני חוזים: כריתת חוזה, הצעה וקיבול');
      setRawText(`על פי חוק החוזים (חלק כללי), תשל"ג-1973, חוזה נכרת בדרך של הצעה וקיבול.

יסודות ההצעה (סעיף 2):
1. פנייה של המציע לאדם אחר.
2. גמירת דעת: כוונה רצינית ומגובשת להתקשר בחוזה משפטי מחייב, הנבחנת במבחן אובייקטיבי חיצוני על פי נסיבות העניין, התנהגות הצדדים ודבריהם.
3. מסוימות: ההצעה צריכה לכלול פרטים מהותיים ומספיקים המאפשרים את כריתת החוזה עם קיבולה (שמות הצדדים, מהות הנכס, מחיר, מועדי תשלום).

קיבול (סעיף 5):
הודעת הניצע שנמסרה למציע ומעידה על גמירת דעתו של הניצע להתקשר עם המציע בחוזה לפי ההצעה. קיבול שיש בו תוספת או שינוי נחשב כהצעה חדשה (סעיף 11).`);
    } else {
      setTitle('מדעי המחשב: רקורסיה ומבני נתונים');
      setRawText(`רקורסיה היא שיטה במדעי המחשב שבה פונקציה קוראת לעצמה כדי לפתור תת-בעיה של הבעיה המקורית.

מרכיבי פונקציה רקורסיבית:
1. תנאי עצירה (Base Case): התנאי שמסיים את הקריאות הרקורסיביות ומחזיר תוצאה ישירה ללא קריאה נוספת. ללא תנאי עצירה נכון, הפונקציה תיכנס לרקורסיה אינסופית ותגרום לקריסת מחסנית (Stack Overflow).
2. הצעד הרקורסיבי (Recursive Step): פירוק הבעיה למופע קטן יותר של אותה בעיה, וקריאה לפונקציה עם הקלט המצומצם.

דוגמה: חישוב עצרת (!n):
- תנאי עצירה: עבור n <= 1, התוצאה היא 1.
- צעד רקורסיבי: עבור n > 1, התוצאה היא n * factorial(n - 1).`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage('עליך להיות מחובר כדי להוסיף חומר לימוד.');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('אנא הזן כותרת לחומר הלימוד.');
      return;
    }

    if (!rawText.trim()) {
      setErrorMessage('אנא הזן או הדבק את תוכן חומר הלימוד.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await createDocument(user.uid, title, rawText);
      setTitle('');
      setRawText('');
      if (onDocumentCreated) onDocumentCreated();
      onClose();
    } catch (err: any) {
      console.error('Error creating document:', err);
      setErrorMessage('אירעה שגיאה בשמירת חומר הלימוד. אנא נסה שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-2xl border border-slate-200 shadow-2xl overflow-hidden text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">הוספת חומר לימוד חדש</h2>
              <p className="text-xs text-slate-500">הדבק סיכום, הרצאה או טקסט שממנו תרצה ללמוד</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              כותרת חומר הלימוד <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={250}
              placeholder="למשל: סיכום ביולוגיה של התא - שיעור 4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Quick sample loader buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                תוכן הטקסט / הסיכום <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>דוגמאות מהירות:</span>
                <button
                  type="button"
                  onClick={() => handleLoadSample('bio')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-[11px] font-medium transition-colors"
                >
                  ביולוגיה
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('law')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-[11px] font-medium transition-colors"
                >
                  משפטים
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('cs')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-[11px] font-medium transition-colors"
                >
                  מדעי המחשב
                </button>
              </div>
            </div>

            <textarea
              required
              rows={8}
              maxLength={100000}
              placeholder="הדבק כאן את הסיכום שלך, הערות ההרצאה, שאלות או החומר לבחינה..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-900 placeholder:text-slate-400 resize-y leading-relaxed font-sans"
            />
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
              <span>{rawText ? `${rawText.split(/\s+/).filter(Boolean).length} מילים` : '0 מילים'}</span>
              <span>{rawText.length.toLocaleString()} / 100,000 תווים</span>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>החומר נשמר תחת חשבונך בלבד ומוגן בהרשאות גישה אישיות (Row-Level Security).</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>שומר חומר לימוד...</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  <span>שמור חומר לימוד</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
