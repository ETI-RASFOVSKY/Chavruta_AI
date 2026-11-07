/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Header & Navigation for Chavruta Smart (חברותא חכמה)
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleIcon } from './GoogleIcon';
import { Sparkles, LogOut, BookOpen, CalendarCheck } from 'lucide-react';

interface NavbarProps {
  onNavigateToDailyReview?: () => void;
  onNavigateToDashboard?: () => void;
  dueReviewCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigateToDailyReview,
  onNavigateToDashboard,
  dueReviewCount = 0,
}) => {
  const { user, login, logout, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo and Name */}
        <div 
          onClick={onNavigateToDashboard}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-slate-900 tracking-tight">חברותא חכמה</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">Chavruta Smart • שותף לימוד סוקרטי</p>
          </div>
        </div>

        {/* User Account / Navigation Action */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-24 h-9 bg-slate-100 rounded-lg animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Daily Review Nav Button */}
              {onNavigateToDailyReview && (
                <button
                  onClick={onNavigateToDailyReview}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-200/80 transition-colors shadow-2xs"
                  title="חזרה יומית מבוססת חזרות מרווחות"
                >
                  <CalendarCheck className="w-4 h-4 text-amber-600" />
                  <span className="hidden sm:inline">חזרה יומית</span>
                  {dueReviewCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-600 text-white text-[10px] font-bold">
                      {dueReviewCount}
                    </span>
                  )}
                </button>
              )}

              {/* User profile capsule */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/60">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'משתמש'}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-white"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
                    {user.displayName ? user.displayName.charAt(0) : 'מ'}
                  </div>
                )}
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-medium text-slate-800 leading-tight">
                    {user.displayName || 'משתמש'}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight truncate max-w-[140px]">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={logout}
                title="התנתק מהחשבון"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">התנתק</span>
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm transition-all hover:shadow active:scale-98"
            >
              <GoogleIcon className="w-4 h-4" />
              <span>התחבר עם Google</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
