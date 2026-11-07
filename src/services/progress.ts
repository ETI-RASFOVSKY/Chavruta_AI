/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Progress Service for Chavruta Smart
 * מעקב חזרה מרווחת (Spaced Repetition), שמירת הצלחות וטעויות בטבלת progress,
 * וחישוב שאלות הממתינות לחזרה יומית (Daily Review).
 */

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { Progress, Question } from '../types';

const COLLECTION_NAME = 'progress';

/**
 * Record a question attempt result (correct / wrong) and schedule next spaced repetition review:
 * - A wrong answer comes back tomorrow (1 day).
 * - A correct answer comes back after 3 days (first time).
 * - A subsequent correct answer comes back after 7 days.
 */
export async function recordQuestionProgress(
  userId: string,
  questionId: string,
  isCorrect: boolean
): Promise<Progress> {
  const progressId = `prog_${questionId.slice(0, 16)}`;
  const progressRef = doc(db, COLLECTION_NAME, progressId);

  let existing: Progress | null = null;
  try {
    const snap = await getDoc(progressRef);
    if (snap.exists()) {
      existing = snap.data() as Progress;
    }
  } catch (err) {
    // If not found, will create new
  }

  const times_correct = (existing?.times_correct || 0) + (isCorrect ? 1 : 0);
  const times_wrong = (existing?.times_wrong || 0) + (isCorrect ? 0 : 1);

  // Exact rule specified:
  // a wrong answer comes back tomorrow (1 day)
  // a correct one after 3 days, then 7 days
  let intervalDays = 1;
  if (isCorrect) {
    intervalDays = times_correct >= 2 ? 7 : 3;
  } else {
    intervalDays = 1;
  }

  const nextDate = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);

  const updatedProgress: Progress = {
    id: progressId,
    user_id: userId,
    question_id: questionId,
    times_correct,
    times_wrong,
    next_review_at: nextDate.toISOString(),
  };

  try {
    await setDoc(progressRef, updatedProgress, { merge: true });
    return updatedProgress;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLLECTION_NAME}/${progressId}`);
  }
}

/**
 * Fetch all progress entries for the user
 */
export async function fetchUserProgress(userId: string): Promise<Progress[]> {
  const progressRef = collection(db, COLLECTION_NAME);
  const q = query(progressRef, where('user_id', '==', userId));

  try {
    const snapshot = await getDocs(q);
    const list: Progress[] = [];
    snapshot.forEach((snap) => {
      list.push(snap.data() as Progress);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
  }
}

export interface DueQuestionItem {
  question: Question;
  progress: Progress;
}

/**
 * Fetch questions that are due for daily review today (next_review_at <= now)
 */
export async function fetchDueQuestionsForUser(userId: string): Promise<DueQuestionItem[]> {
  const now = new Date();

  // 1. Fetch user's progress records
  const progressList = await fetchUserProgress(userId);
  if (!progressList || progressList.length === 0) {
    return [];
  }

  // 2. Filter for entries where next_review_at is today or earlier
  const dueProgressMap = new Map<string, Progress>();
  for (const p of progressList) {
    const reviewDate = new Date(p.next_review_at);
    if (reviewDate <= now) {
      dueProgressMap.set(p.question_id, p);
    }
  }

  if (dueProgressMap.size === 0) {
    return [];
  }

  // 3. Fetch questions belonging to this user
  const questionsRef = collection(db, 'questions');
  const q = query(questionsRef, where('user_id', '==', userId));

  try {
    const snapshot = await getDocs(q);
    const dueItems: DueQuestionItem[] = [];

    snapshot.forEach((snap) => {
      const question = snap.data() as Question;
      const progress = dueProgressMap.get(question.id);
      if (progress) {
        dueItems.push({ question, progress });
      }
    });

    return dueItems;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'questions');
  }
}
