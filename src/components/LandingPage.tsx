/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Landing Page for Chavruta Smart (חברותא חכמה)
 * שותף לימוד סוקרטי מבוסס AI - דף נחיתה בעברית עם RTL מלא
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleIcon } from './GoogleIcon';
import { 
  HelpCircle, 
  Layers, 
  TrendingUp, 
  Lock, 
  MessageSquare, 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2, 
  BookOpen,
  Brain
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { login, loading } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 -z-10 w-96 h-96 bg-indigo-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-1/4 -z-10 w-80 h-80 bg-purple-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs sm:text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>לימוד אישי בשיטת החברותא והדיאלוג הסוקרטי</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
            לא רק לשנן חומר — <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-600 via-indigo-700 to-purple-600">
              ללמוד עם שותף שמאתגר אותך להבין.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed mb-10">
            מעלים סיכומים והרצאות, וה-AI פועל כחברותא סוקרטית: הוא שואל &quot;למה?&quot;, מבקש ממך להסביר במילים שלך, ומזהה פערים בהבנה. הוא לעולם לא זורק לך סתם את התשובה.
          </p>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={login}
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-indigo-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              <GoogleIcon className="w-5 h-5 bg-white p-0.5 rounded-full" />
              <span>התחברות מהירה עם Google</span>
              <ArrowLeft className="w-4 h-4 mr-1" />
            </button>
          </div>

          {/* Trust points */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-xs sm:text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              כניסה מאובטחת בחשבון Google
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              כל סטודנט רואה רק את החומרים שלו
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              מותאם לטלפון הנייד ולמחשב
            </span>
          </div>

        </div>
      </section>

      {/* Socratic Dialogue Preview Card */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 w-full">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-100 relative">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                AI
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm sm:text-base">איך החברותא פועלת בזמן אמת?</h3>
                <p className="text-xs text-slate-500">דוגמה לשיחה מתוך חומר שהועלה למערכת</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
              שיטה סוקרטית
            </span>
          </div>

          <div className="space-y-4 text-sm sm:text-base">
            {/* Student Message */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold shrink-0">
                אתה
              </div>
              <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[85%]">
                <p>התשובה היא שהמיתוכונדריה היא פשוט &quot;תחנת הכוח&quot; של התא.</p>
              </div>
            </div>

            {/* Socratic Chavruta Response */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                חברותא
              </div>
              <div className="bg-indigo-50 border border-indigo-100 text-indigo-950 rounded-2xl rounded-tl-none px-4 py-3 max-w-[90%]">
                <p className="font-medium text-indigo-900 mb-1">
                  הגדרה מוכרת! אבל בוא נעמיק רגע:
                </p>
                <p className="text-slate-700 leading-relaxed">
                  למה בעצם היא נקראת כך? תוכל להסביר במילים שלך איזה תהליך ביוכימי מתרחש בתוכה ואיך בדיוק נוצרות מולקולות ה-ATP שהתא צורך?
                </p>
              </div>
            </div>

            {/* Student Reply */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold shrink-0">
                אתה
              </div>
              <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[85%]">
                <p>היא מפרקת גלוקוז בעזרת חמצן בנשימה תאית?</p>
              </div>
            </div>

            {/* Socratic Chavruta Feedback */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                חברותא
              </div>
              <div className="bg-indigo-50 border border-indigo-100 text-indigo-950 rounded-2xl rounded-tl-none px-4 py-3 max-w-[90%]">
                <p className="text-slate-700 leading-relaxed">
                  מדויק מאוד! ואיפה במעגל קרבס נכנס החמצן? מה קורה לתא כאשר אין מספיק חמצן בסביבה?
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3 Pillars of Chavruta Smart */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            שלושת עמודי התווך של החברותא
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
            בנוי על פי מחקרים קוגניטיביים של למידה פעילה, אחזור מידע וחזרה מרווחת
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Pillar 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">1. שותף סוקרטי שואל &quot;למה?&quot;</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              ה-AI לא יסכם עבורך כדי שתשכח תוך שעה. הוא מבקש ממך לנסח במילים שלך, מאתר נקודות חולשה, ומסייע לך להגיע לתובנה בכוחות עצמך.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">2. כרטיסיות ושאלונים מותאמים</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              העלה כל סיכום או מצגת, והחברותא תיצור עבורך כרטיסיות זיכרון חכמות ושאלות רב-ברירה (אמריקאיות) שבודקות הבנה אמיתית ולא רק זיכרון יבש.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">3. חזרה מרווחת מותאמת אישית</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              המערכת עוקבת אחרי הנושאים שהתקשית בהם וחוזרת עליהם בתדירות גבוהה יותר, בדיוק במרווחי הזמן הנכונים לשימור בזיכרון לטווח ארוך.
            </p>
          </div>

        </div>
      </section>

      {/* Privacy and Security Guarantee */}
      <section className="bg-slate-100/70 border-t border-slate-200 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-slate-800 mb-1">הפרטיות שלך מעל הכל</h4>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            כל סטודנט רואה אך ורק את החומרים והדיאלוגים שלו. הנתונים מאובטחים לחלוטין תחת חשבון ה-Google שלך ואף משתמש אחר אינו יכול לגשת אליהם.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} חברותא חכמה (Chavruta Smart) • למידה משמעותית בסיוע בינה מלאכותית</p>
      </footer>

    </div>
  );
};
