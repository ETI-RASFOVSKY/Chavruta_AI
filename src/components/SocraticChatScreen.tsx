/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Socratic Chat Screen for Chavruta Smart (לימוד עם חברותא)
 * שיחה סוקרטית אינטראקטיבית מול שותף הלימוד ב-AI, כולל שמירה ב-chat_sessions.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  BookOpen, 
  ChevronRight, 
  RotateCcw, 
  HelpCircle, 
  Loader2, 
  Lightbulb, 
  FileText, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import type { Document, ChatMessage, ChatSession } from '../types';
import { fetchChatSessionForDocument, saveChatSession, deleteChatSession } from '../services/chat';
import { useAuth } from '../context/AuthContext';

interface SocraticChatScreenProps {
  document: Document;
  onBackToDashboard: () => void;
}

export const SocraticChatScreen: React.FC<SocraticChatScreenProps> = ({
  document: docItem,
  onBackToDashboard,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Load existing chat session from Firestore or initiate Socratic conversation
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    async function initChat() {
      if (!user) return;
      setIsLoadingSession(true);
      setErrorMessage(null);

      try {
        const existingSession = await fetchChatSessionForDocument(user.uid, docItem.id);
        
        if (isMounted) {
          if (existingSession && existingSession.messages.length > 0) {
            setSessionId(existingSession.id);
            setMessages(existingSession.messages);
          } else {
            // First time chatting on this document: fetch initial Socratic opening question
            await requestInitialQuestion();
          }
        }
      } catch (err: any) {
        console.error('Failed to load chat session:', err);
        if (isMounted) {
          setErrorMessage('שגיאה בטעינת היסטוריית השיחה.');
        }
      } finally {
        if (isMounted) setIsLoadingSession(false);
      }
    }

    initChat();

    return () => {
      isMounted = false;
    };
  }, [user, docItem.id]);

  // Send request for initial Socratic question
  const requestInitialQuestion = async () => {
    try {
      setIsSending(true);
      const res = await fetch('/api/study-partner/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: '__START__',
          studyMaterial: docItem.raw_text,
          conversationHistory: [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה בפתיחת השיחה.');

      const openingReply = data.reply || `שלום! קראתי את חומר הלימוד בנושא "${docItem.title}". תוכל להסביר לי במילים שלך מהו הרעיון המרכזי?`;

      const initialMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        text: openingReply,
        created_at: new Date().toISOString(),
      };

      const newMessages = [initialMessage];
      setMessages(newMessages);

      if (user) {
        const saved = await saveChatSession(user.uid, docItem.id, newMessages);
        setSessionId(saved.id);
      }
    } catch (err: any) {
      console.error('Initial question error:', err);
      // Fallback greeting if network fails
      const fallback: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        text: `שלום! אני החברותא שלך לחומר "${docItem.title}". ממה תרצה שנתחיל? נסה להסביר לי מושג ראשון מתוך הטקסט במילים שלך.`,
        created_at: new Date().toISOString(),
      };
      setMessages([fallback]);
    } finally {
      setIsSending(false);
    }
  };

  // Send student message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending || !user) return;

    setInputText('');
    setErrorMessage(null);

    const userMessage: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      text,
      created_at: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsSending(true);

    try {
      // Send conversation to server-side endpoint (pass prior messages as history)
      const res = await fetch('/api/study-partner/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: text,
          studyMaterial: docItem.raw_text,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה בקבלת תשובה מהחברותא.');

      const assistantMessage: ChatMessage = {
        id: `msg_a_${Date.now()}`,
        role: 'assistant',
        text: data.reply || 'מעניין! תוכל להרחיב עוד?',
        created_at: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      // Save complete session to Firestore under chat_sessions table
      const saved = await saveChatSession(user.uid, docItem.id, finalMessages, sessionId);
      if (!sessionId) setSessionId(saved.id);

    } catch (err: any) {
      console.error('Send message error:', err);
      setErrorMessage(err.message || 'שגיאה בשליחת ההודעה לחברותא. אנא נסה שוב.');
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Clear / Reset chat
  const handleResetSession = async () => {
    if (window.confirm('האם אתה בטוח שברצונך להתחיל שיחה חדשה? היסטוריית השיחה הנוכחית תימחק.')) {
      setMessages([]);
      if (sessionId) {
        try {
          await deleteChatSession(sessionId);
        } catch (e) {
          console.error(e);
        }
      }
      setSessionId(undefined);
      await requestInitialQuestion();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 text-right flex flex-col h-[calc(100vh-5rem)]">
      
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            title="חזרה ללוח הבקרה"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                חברותא סוקרטית
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                פעיל
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-md">
              חומר: {docItem.title}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Toggle Notes View */}
          <button
            onClick={() => setShowNotesDrawer(!showNotesDrawer)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              showNotesDrawer 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{showNotesDrawer ? 'הסתר סיכום' : 'הצג סיכום'}</span>
          </button>

          {/* Reset chat button */}
          <button
            onClick={handleResetSession}
            title="התחל שיחה חדשה"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Optional Side / Dropdown Notes Drawer for easy reference */}
      {showNotesDrawer && (
        <div className="p-4 mb-3 bg-slate-100/90 border border-slate-200 rounded-2xl max-h-48 overflow-y-auto text-xs text-slate-700 leading-relaxed shrink-0 animate-in fade-in duration-200">
          <div className="flex items-center justify-between font-bold text-slate-800 mb-1.5">
            <span>טקסט חומר הלימוד:</span>
            <span className="text-[11px] text-slate-400 font-normal">מוצג לעזרתך בזמן השיחה</span>
          </div>
          <div className="whitespace-pre-wrap">{docItem.raw_text}</div>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="my-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-800 text-xs px-2"
          >
            סגור
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        
        {isLoadingSession ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs">פותח את מרחב הלימוד הסוקרטי...</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const timeString = new Date(msg.created_at).toLocaleTimeString('he-IL', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isUser
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-indigo-600 text-white shadow-xs'
                  }`}
                >
                  {isUser ? (user?.displayName ? user.displayName.charAt(0) : 'אתה') : 'ח'}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-3xl px-4 py-3 text-sm sm:text-base leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200/90 text-slate-800 shadow-xs rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                  <div
                    className={`text-[10px] mt-1.5 ${
                      isUser ? 'text-indigo-200 text-left' : 'text-slate-400 text-left'
                    }`}
                  >
                    {timeString}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isSending && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
              ח
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl rounded-tl-none px-4 py-3 shadow-xs flex items-center gap-2 text-slate-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>החברותא מקשיבה ומנסחת שאלה סוקרטית...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Helper Chips */}
      {!isLoadingSession && (
        <div className="py-2 flex items-center gap-2 overflow-x-auto text-xs shrink-0 no-scrollbar">
          <span className="text-slate-400 text-[11px] shrink-0">הצעות מהירות:</span>
          
          <button
            type="button"
            disabled={isSending}
            onClick={() => {
              const currentInput = inputText.trim();
              if (currentInput) {
                handleSendMessage(`${currentInput} (אני קצת מתלבט, אפשר רמז קטן שיכוון אותי?)`);
              } else {
                handleSendMessage('אני קצת מתקשה בשאלה הנוכחית... תוכל לתת לי רמז קטן שיכוון אותי בלי לגלות את התשובה?');
              }
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-medium transition-colors shrink-0 disabled:opacity-50"
            title="בקש רמז מנחה"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
            <span>אפשר רמז קטן?</span>
          </button>

          <button
            type="button"
            disabled={isSending}
            onClick={() => {
              const currentInput = inputText.trim();
              if (currentInput) {
                // If student typed their explanation in the box, send it with the verification question
                handleSendMessage(`${currentInput}\n(האם הסברתי נכון ומדויק על פי החומר, או שיש נקודה שפספסתי?)`);
              } else {
                // If input box is empty, check their previous explanation in chat
                handleSendMessage('האם מה שהסברתי קודם נכון ומדויק על פי החומר, או שיש נקודה שפספסתי? אנא בדוק ישירות את ההסבר שלי ואל תעקוף את השאלה.');
              }
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-medium transition-colors shrink-0 disabled:opacity-50 font-semibold"
            title="בדוק אם ההסבר שלך מדויק"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>הסברתי נכון?</span>
          </button>

          <button
            type="button"
            disabled={isSending}
            onClick={() => handleSendMessage('בוא נעמיק עוד יותר: שאל אותי שאלה סוקרטית מאתגרת ומעמיקה במיוחד שבוחנת הבנת עומק ומנגנונים מתוך החומר, ולא שאלה שטחית.')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-medium transition-colors shrink-0 disabled:opacity-50"
            title="בקש שאלה מאתגרת ועמוקה יותר"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>שאל שאלה עמוקה יותר</span>
          </button>

          <button
            type="button"
            disabled={isSending}
            onClick={() => handleSendMessage('הבנתי היטב את הנקודה הזו. בוא נתקדם לשאלה הבאה מתוך החומר!')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium transition-colors shrink-0 disabled:opacity-50"
            title="מעבר לשאלה הבאה"
          >
            <span>בוא נתקדם לשאלה הבאה</span>
          </button>
        </div>
      )}

      {/* Input Box */}
      <div className="pt-2 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center"
        >
          <input
            ref={inputRef}
            type="text"
            disabled={isSending || isLoadingSession}
            placeholder="הסבר במילים שלך, שאל 'מדוע?', או ענה לשאלת החברותא..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full pr-4 pl-12 py-3.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 bg-white shadow-xs"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSending || isLoadingSession}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white flex items-center justify-center transition-all shadow-xs disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>
        <p className="text-[10px] text-slate-400 text-center mt-1.5">
          החברותא מונחית לא לגלות את התשובה מיד, אלא לכוון אותך להבין בעצמך. השיחה נשמרת אוטומטית.
        </p>
      </div>

    </div>
  );
};
