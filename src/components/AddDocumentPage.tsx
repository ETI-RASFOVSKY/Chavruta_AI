/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Add Document Page for Chavruta Smart
 * דף הוספת חומר לימוד: כותרת, אזור טקסט גדול, העלאת קובצי TXT ו-PDF (חילוץ טקסט),
 * שמירה, ולאחריה כפתור "חולל שאלון" שמפעיל קריאה לצד השרת עבור 8 שאלות ב-STRICT JSON.
 */

import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ChevronRight, 
  BookOpen, 
  Play, 
  FileCheck, 
  X,
  FileCode,
  File
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createDocument } from '../services/documents';
import { saveGeneratedQuestions, fetchQuestionsForDocument } from '../services/questions';
import { extractTextFromFile } from '../lib/fileExtractor';
import type { Document, Question } from '../types';

interface AddDocumentPageProps {
  onBack: () => void;
  onQuizReady: (document: Document, questions: Question[]) => void;
  onStartChat?: (document: Document) => void;
}

export const AddDocumentPage: React.FC<AddDocumentPageProps> = ({
  onBack,
  onQuizReady,
  onStartChat,
}) => {
  const { user } = useAuth();
  
  // State
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedDocument, setSavedDocument] = useState<Document | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload handler for .txt and .pdf
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingFile(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await extractTextFromFile(file);
      setRawText(result.text);
      setUploadedFileName(result.fileName);
      if (!title.trim()) {
        setTitle(result.suggestedTitle);
      }
      setSuccessMessage(`הטקסט חולץ בהצלחה מתוך הקובץ "${result.fileName}" (${result.text.split(/\s+/).filter(Boolean).length} מילים)`);
    } catch (err: any) {
      console.error('File extraction error:', err);
      setErrorMessage(err.message || 'שגיאה בחילוץ הטקסט מהקובץ.');
    } finally {
      setIsExtractingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Sample texts
  const loadSample = (type: 'bio' | 'law' | 'cs') => {
    setErrorMessage(null);
    if (type === 'bio') {
      setTitle('ביולוגיה: נשימה תאית ומבנה המיתוכונדריה');
      setRawText(`הנשימה התאית היא התהליך שבאמצעותו תאים מפיקים אנרגיה כימית זמינה בצורת מולקולות ATP מפירוק חומרים אורגניים, בראשם גלוקוז.

שלבי הנשימה התאית האירובית:
1. גליקוליזה: תהליך המתרחש בציטופלזמה של התא ואינו דורש נוכחות חמצן. מולקולת גלוקוז אחת (6 פחמנים) מתפרקת לשתי מולקולות של פירובט (3 פחמנים). הרווח האנרגטי הישיר הוא 2 מולקולות ATP ו-2 מולקולות של נשא האלקטרונים NADH.
2. חמצון פירובט ומעגל קרבס: מתרחש בתוך המטריקס של המיתוכונדריה בנוכחות חמצן. הפירובט הופך לאצטיל קואנזים A (Acetyl-CoA), נכנס למעגל קרבס ופולט פחמן דו-חמצני (CO2). בתהליך נטענים נשאי אלקטרונים NADH ו-FADH2 ונוצרות מולקולות ATP נוספות.
3. שרשרת מעבר האלקטרונים והזרחון החמצוני: מתרחשת על גבי הממברנה הפנימית המפותלת של המיתוכונדריה (קריסטה). האלקטרונים מועברים דרך קומפלקסים חלבוניים, תהליך הדוחף פרוטונים אל החלל הבין-ממברנלי ויוצר מפל ריכוזים ומפל מתחים חזק. חמצן משמש כקולט האלקטרונים הסופי ומתחבר לפרוטונים ליצירת מולקולות מים.
4. אנזים ATP Synthase: משתמש במפל הפרוטונים החוזרים למטריקס כדי לסנתז כ-30 עד 34 מולקולות ATP נוספות. בסך הכל מתקבלות כ-36-38 מולקולות ATP מכל מולקולת גלוקוז.`);
    } else if (type === 'law') {
      setTitle('דיני חוזים: יסודות ההצעה והקיבול');
      setRawText(`דיני החוזים בישראל מוסדרים בעיקרם בחוק החוזים (חלק כללי), תשל"ג-1973. לפי סעיף 1 לחוק, חוזה נכרת בדרך של הצעה וקיבול.

יסודות ההצעה (סעיף 2):
1. פנייה: ביטוי חיצוני המופנה לאדם אחר (או לציבור).
2. גמירת דעת: כוונה מגובשת, רצינית והחלטית ליצור יחסים משפטיים מחייבים. גמירת הדעת נבחנת במבחן אובייקטיבי חיצוני – האם אדם סביר בנעלי הניצע היה מסיק מנסיבות העניין, הדברים וההתנהגות כי המציע גמר בדעתו להתקשר בחוזה מחייב.
3. מסוימות: ההצעה חייבת לכלול פרטים מהותיים וחיוניים המספיקים כדי להגדיר את מהות העסקה, שמות הצדדים, תיאור הנכס, מחיר ותנאי תשלום. בהיעדר פרטים מסוימים, בית המשפט רשאי להשלימם לפי מנגנוני השלמה נורמטיביים (נוהג, הוראות חוק דיספוזיטיביות).

יסודות הקיבול (סעיף 5):
קיבול יהיה בהודעת הניצע שנמסרה למציע ומעידה על גמירת דעתו של הניצע להתקשר עם המציע בחוזה לפי ההצעה.
סעיף 11 קובע כי קיבול שיש בו תוספת, הגבלה או שינוי אחר לעומת ההצעה כמוהו כהצעה חדשה.`);
    } else {
      setTitle('מדעי המחשב: אלגוריתמיקה, רקורסיה ומבני נתונים');
      setRawText(`רקורסיה היא טכניקה חישובית יסודית שבה פונקציה קוראת לעצמה באופן ישיר או עקיף לצורך פתרון תת-בעיה מוקטנת של אותה בעיה.

מרכיבי פונקציה רקורסיבית תקינה:
1. תנאי עצירה (Base Case): מקרה בסיסי שאינו דורש קריאה נוספת ומחזיר תוצאה מיידית. ללא תנאי עצירה נכון מתרחשת גלישת מחסנית (Stack Overflow).
2. צעד רקורסיבי (Recursive Step): צמצום הבעיה לגודל קטן יותר לקראת תנאי העצירה, וביצוע קריאה לפונקציה.

דוגמה: חיפוש בינארי (Binary Search):
במערך ממוין, משווים את האיבר המבוקש לאיבר האמצעי. אם הוא שווה – החיפוש הצליח. אם הוא קטן מהאמצעי – מחפשים רקורסיבית במחצית השמאלית; אחרת – במחצית הימנית.
סיבוכיות הזמן היא O(log n), לעומת חיפוש ליניארי שלוקח O(n).`);
    }
  };

  // Submit and save document
  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage('עליך להיות מחובר כדי לשמור חומר לימוד.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('נא להזין כותרת לחומר הלימוד.');
      return;
    }
    if (!rawText.trim() || rawText.trim().length < 15) {
      setErrorMessage('נא להזין או להעלות טקסט של לפחות 15 תווים.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const docCreated = await createDocument(user.uid, title, rawText);
      setSavedDocument(docCreated);
      setSuccessMessage('חומר הלימוד נשמר בהצלחה במרחב האישי שלך!');
    } catch (err: any) {
      console.error('Failed to save document:', err);
      setErrorMessage('אירעה שגיאה בשמירת חומר הלימוד.');
    } finally {
      setIsSaving(false);
    }
  };

  // Call server-side function to generate 8 multiple-choice questions
  const handleGenerateQuiz = async () => {
    if (!savedDocument && (!title.trim() || !rawText.trim())) {
      setErrorMessage('נא לשמור את חומר הלימוד תחילה.');
      return;
    }

    const currentDoc = savedDocument;
    if (!currentDoc || !user) {
      setErrorMessage('יש לשמור את חומר הלימוד לפני יצירת השאלון.');
      return;
    }

    setIsGeneratingQuiz(true);
    setErrorMessage(null);
    setGenerationStep('בודק שאלון קיים בחומר זה...');

    try {
      // 1. Check if questions were already generated for this document in Firestore
      const existing = await fetchQuestionsForDocument(user.uid, currentDoc.id);
      if (existing && existing.length > 0) {
        setGenerationStep('טוען שאלון קיים...');
        onQuizReady(currentDoc, existing);
        return;
      }

      setGenerationStep('ה-AI מנתח את חומר הלימוד...');
      
      // Timer to cycle helpful progress text while waiting
      const stepTimer1 = setTimeout(() => {
        setGenerationStep('מנסח 8 שאלות רב-ברירה והסברים בעברית...');
      }, 1500);

      const stepTimer2 = setTimeout(() => {
        setGenerationStep('בודק ומאמת תקינות תשובות...');
      }, 3500);

      // Server-side call to /api/quiz/generate
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentDoc.raw_text,
          title: currentDoc.title,
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'שגיאה ביצירת השאלון מהשרת.');
      }

      const generatedQuestions = data.questions;

      if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
        throw new Error('השאלון שהתקבל ריק או בפורמט שגוי.');
      }

      setGenerationStep('שומר שאלון במרחב האישי...');

      // Save questions in Firestore under this document
      const savedQuestions = await saveGeneratedQuestions(
        user.uid,
        currentDoc.id,
        generatedQuestions
      );

      // Launch Quiz Screen
      onQuizReady(currentDoc, savedQuestions);
    } catch (err: any) {
      console.error('Quiz generation error:', err);
      setErrorMessage(
        err.message || 'הפקת השאלון נכשלה. אנא נסה שנית או ודא שהטקסט מכיל מספיק מידע.'
      );
    } finally {
      setIsGeneratingQuiz(false);
      setGenerationStep('');
    }
  };

  const wordCount = rawText ? rawText.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 text-right animate-in fade-in duration-200">
      
      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors mb-2"
          >
            <ChevronRight className="w-4 h-4" />
            <span>חזרה ללוח הבקרה</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            הוספת חומר לימוד חדש
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            הדבק סיכום או העלה קובץ TXT / PDF. החברותא תנתח אותו ותחולל שאלון תרגול ממוקד.
          </p>
        </div>
      </div>

      {/* Error and Success Notifications */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">הודעת מערכת</p>
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            {savedDocument && (
              <button
                type="button"
                onClick={handleGenerateQuiz}
                disabled={isGeneratingQuiz}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shrink-0 disabled:opacity-50"
              >
                נסה שוב כעת
              </button>
            )}
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold mb-0.5">הצלחה</p>
            <p>{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-emerald-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Form Box */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        
        <form onSubmit={handleSaveDocument} className="space-y-6">
          
          {/* Title Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              כותרת חומר הלימוד <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isSaving || isGeneratingQuiz}
              maxLength={250}
              placeholder="למשל: סיכום ביולוגיה - נשימה תאית ומעגל קרבס"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* File Upload Zone for .txt and .pdf */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              העלאת קובץ מסמך (.txt / .pdf)
            </label>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isExtractingFile 
                  ? 'bg-slate-50 border-slate-300' 
                  : uploadedFileName 
                  ? 'bg-emerald-50/40 border-emerald-300 hover:bg-emerald-50/70' 
                  : 'bg-slate-50/60 border-slate-300 hover:bg-indigo-50/40 hover:border-indigo-300'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,text/plain,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {isExtractingFile ? (
                <div className="flex flex-col items-center justify-center gap-2 py-2">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-sm font-semibold text-slate-700">מחלץ טקסט מתוך הקובץ...</p>
                  <p className="text-xs text-slate-400">אנא המתן מספר רגעים</p>
                </div>
              ) : uploadedFileName ? (
                <div className="flex flex-col items-center justify-center gap-2 py-2">
                  <FileCheck className="w-8 h-8 text-emerald-600" />
                  <p className="text-sm font-semibold text-slate-800">
                    נטען בהצלחה: <span className="font-mono text-emerald-700">{uploadedFileName}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    לחץ להחלפת קובץ (או ערוך את הטקסט למטה)
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-2">
                  <Upload className="w-8 h-8 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700">
                    לחץ כאן כדי להעלות קובץ <span className="text-indigo-600">.txt</span> או <span className="text-indigo-600">.pdf</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    הטקסט יחולץ אוטומטית ויוזן לתיבת הטקסט למטה
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Large Text Area for Pasting / Extracted Content */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="block text-xs font-bold text-slate-700">
                תוכן חומר הלימוד (הדבקה או טקסט מחולץ) <span className="text-rose-500">*</span>
              </label>

              {/* Sample loader buttons */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>דוגמאות מוכנות:</span>
                <button
                  type="button"
                  onClick={() => loadSample('bio')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-[11px] font-medium transition-colors"
                >
                  ביולוגיה
                </button>
                <button
                  type="button"
                  onClick={() => loadSample('law')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-[11px] font-medium transition-colors"
                >
                  משפטים
                </button>
                <button
                  type="button"
                  onClick={() => loadSample('cs')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-[11px] font-medium transition-colors"
                >
                  מדעי המחשב
                </button>
              </div>
            </div>

            <textarea
              required
              rows={12}
              maxLength={100000}
              disabled={isSaving || isGeneratingQuiz}
              placeholder="הדבק כאן את הסיכום המלא, הערות ההרצאה, נקודות מפתח או שאלות..."
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                // If user changes text after saving, reset saved doc so they re-save
                if (savedDocument) setSavedDocument(null);
              }}
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 resize-y leading-relaxed font-sans"
            />

            <div className="flex justify-between items-center text-xs text-slate-400 mt-1.5 px-1">
              <span>{wordCount.toLocaleString()} מילים</span>
              <span>{rawText.length.toLocaleString()} / 100,000 תווים</span>
            </div>
          </div>

          {/* Save Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              {savedDocument ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  המסמך שמור במערכת. באפשרותך לחולל שאלון כעת.
                </span>
              ) : (
                'שמירת המסמך מבטיחה בידוד Row-Level Security לחשבונך.'
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onBack}
                disabled={isSaving || isGeneratingQuiz}
                className="flex-1 sm:flex-none px-5 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                ביטול
              </button>

              <button
                type="submit"
                disabled={isSaving || isGeneratingQuiz}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-sm transition-all active:scale-98 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>שומר מסמך...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    <span>{savedDocument ? 'עדכן מסמך' : 'שמור חומר לימוד'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>

      {/* AFTER SAVING: Prominent "Generate Quiz" Card */}
      {savedDocument && (
        <div className="mt-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-3xl border border-indigo-200 p-6 sm:p-8 shadow-md text-right animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100/80 text-indigo-700 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>החומר מוכן לפעולה</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                מוכן לבחון את ההבנה שלך?
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                ה-AI ינתח את חומר הלימוד שלך ויחולל במדויק <strong className="text-indigo-900">8 שאלות רב-ברירה</strong> בעברית, המבוססות אך ורק על המידע שמופיע בטקסט, כולל הסבר מפורט לכל תשובה.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
              {onStartChat && (
                <button
                  type="button"
                  onClick={() => onStartChat(savedDocument)}
                  disabled={isGeneratingQuiz}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-base shadow-md shadow-purple-200 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>למד עם חברותא</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleGenerateQuiz}
                disabled={isGeneratingQuiz}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                {isGeneratingQuiz ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>מחולל שאלון (8 שאלות)...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>חולל שאלון</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {isGeneratingQuiz && (
            <div className="mt-4 pt-4 border-t border-indigo-100 flex items-center gap-2.5 text-xs font-medium text-indigo-700 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{generationStep || 'ה-AI מנתח את החומר ומחבר שאלון מהיר...'}</span>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
