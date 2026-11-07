/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Empty Dashboard for Chavruta Smart (חברותא חכמה)
 * לוח בקרה ריק וידידותי למשתמש המחובר, המציג מרחב אישי מוגן בלבד.
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  PlusCircle, 
  Sparkles, 
  HelpCircle, 
  Layers, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  FileText,
  Info
} from 'lucide-react';

export const EmptyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [showInfoBanner, setShowInfoBanner] = useState(true);

  // חילוץ השם הפרטי של המשתמש בעברית או באנגלית
  const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'תלמיד/ה';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      
      {/* Top Welcome Header */}
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
            ברוך הבא למרחב הלימוד האישי שלך ב&quot;חברותא חכמה&quot;.
          </p>
        </div>

        {/* Security & Isolation Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>מרחב אישי ומאובטח: רק אתה רואה את הנתונים שלך</span>
        </div>
      </div>

      {/* Info notification */}
      {showInfoBanner && (
        <div className="mb-8 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start justify-between gap-3 text-sm text-indigo-950">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-indigo-900 mb-0.5">
                החשבון שלך הוגדר בהצלחה!
              </p>
              <p className="text-xs sm:text-sm text-indigo-800/90 leading-relaxed">
                זהו לוח הבקרה הראשוני שלך. בשלבים הבאים תוכל להעלות לכאן סיכומים, הרצאות ומאמרים — והחברותא תחל בדיאלוג סוקרטי, הפקת כרטיסיות ותרגול מותאם.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowInfoBanner(false)}
            className="text-indigo-400 hover:text-indigo-700 text-xs px-2 py-1 rounded transition-colors"
          >
            סגור
          </button>
        </div>
      )}

      {/* Quick Stats Overview (All 0 in empty state) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">חומרי לימוד</p>
            <p className="text-2xl font-bold text-slate-900">0</p>
            <p className="text-[11px] text-slate-400">סיכומים שהועלו</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">כרטיסיות זיכרון</p>
            <p className="text-2xl font-bold text-slate-900">0</p>
            <p className="text-[11px] text-slate-400">כרטיסיות מוכנות לתרגול</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">נושאים לחיזוק</p>
            <p className="text-2xl font-bold text-slate-900">0</p>
            <p className="text-[11px] text-slate-400">מעקב חזרה מרווחת</p>
          </div>
        </div>

      </div>

      {/* Main Empty State Content Card */}
      <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-12 text-center shadow-sm">
        <div className="max-w-md mx-auto">
          
          {/* Empty State Icon */}
          <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <BookOpen className="w-10 h-10" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
            לוח הלימוד שלך ריק כרגע
          </h2>

          <p className="text-sm sm:text-base text-slate-500 leading-relaxed mb-8">
            כאן יופיעו חומרי הלימוד שתעלה או תדביק, יחד עם שיחות החברותא הסוקרטית, הכרטיסיות ומבחני התרגול.
          </p>

          {/* Action Trigger Placeholder */}
          <div className="inline-flex flex-col items-center gap-2">
            <button
              disabled
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-100 text-slate-400 font-medium text-sm border border-slate-200 cursor-not-allowed"
            >
              <PlusCircle className="w-5 h-5" />
              <span>העלאת חומר לימוד ראשון</span>
              <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-normal">
                בשלב הבא
              </span>
            </button>
            <span className="text-xs text-slate-400">
              בשלב זה של הפיתוח מוכנים מסך הנחיתה, התחברות ה-Google ולוח הבקרה.
            </span>
          </div>

        </div>
      </div>

      {/* Future Capabilities Preview */}
      <div className="mt-12">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          מה יקרה ברגע שתוסיף חומר לימוד?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-white/60 backdrop-blur-xs rounded-xl p-4 border border-slate-200 text-right">
            <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm mb-1">
              <HelpCircle className="w-4 h-4" />
              <span>1. שיחה סוקרטית</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              החברותא תשאל אותך &quot;למה?&quot; ותבקש שתסביר במילים שלך, כדי לוודא שאין לך פערים בחומר.
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-xs rounded-xl p-4 border border-slate-200 text-right">
            <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm mb-1">
              <Layers className="w-4 h-4" />
              <span>2. כרטיסיות ושאלונים</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              הפקת שאלות אמריקאיות וכרטיסיות זיכרון חכמות אוטומטית ישירות מהטקסט שהעלית.
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-xs rounded-xl p-4 border border-slate-200 text-right">
            <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>3. חזרה מרווחת</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              מעקב שקט אחר נושאים שטעית בהם וחזרה ממוקדת עליהם בדיוק בזמן הנכון.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
