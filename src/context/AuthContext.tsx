/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Authentication Context for Chavruta Smart (חברותא חכמה)
 * ניהול מצב המשתמש המחובר, התחברות ב-Google והתנתקות.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOut, testConnection } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // בדוק חיבור למסד הנתונים
    testConnection();

    // מאזין לשינויים במצב האימות של פיירבייס
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    }, (err) => {
      console.error('Auth state error:', err);
      setError('אירעה שגיאה בטעינת נתוני ההתחברות.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Login error:', err);
      // Don't show error if user simply closed the popup
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('שגיאה בהתחברות באמצעות Google. אנא נסה שוב.');
      }
    }
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (err: any) {
      console.error('Logout error:', err);
      setError('שגיאה בעת ההתנתקות.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
