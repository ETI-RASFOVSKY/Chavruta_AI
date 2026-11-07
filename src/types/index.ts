/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Chavruta Smart (חברותא חכמה) Data Model
 * 
 * הגדרת מבני הנתונים עבור מסד הנתונים:
 * - documents: חומרי לימוד וסיכומים
 * - questions: כרטיסיות ושאלות רב-ברירה
 * - progress: מעקב חזרה מרווחת והצלחות/טעויות
 * - chat_sessions: היסטוריית שיחות סוקרטיות
 */

export interface Document {
  id: string;
  user_id: string;
  title: string;
  raw_text: string;
  created_at: string;
}

export type QuestionType = 'flashcard' | 'multiple_choice';

export interface FlashcardContent {
  front: string; // השאלה / המושג
  back: string;  // ההסבר / התשובה
}

export interface MultipleChoiceContent {
  question: string;         // שאלת רב-ברירה
  options: string[];        // 4 אפשרויות בחירה
  correct_index: number;    // אינדקס התשובה הנכונה (0-3)
  explanation?: string;     // הסבר קצר לתשובה
}

export interface Question {
  id: string;
  document_id: string;
  user_id: string;
  type: QuestionType;
  content: FlashcardContent | MultipleChoiceContent | Record<string, any>;
  topic: string;
}

export interface Progress {
  id: string;
  user_id: string;
  question_id: string;
  times_correct: number;
  times_wrong: number;
  next_review_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  document_id: string;
  user_id: string;
  messages: ChatMessage[];
  created_at: string;
}
