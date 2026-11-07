/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Questions Service for Chavruta Smart
 * שמירה ושליפה של שאלות וכרטיסיות ב-Firestore
 */

import { 
  collection, 
  doc, 
  query, 
  where, 
  getDocs, 
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { Question } from '../types';
import { generateSafeId } from './documents';

const COLLECTION_NAME = 'questions';

export interface GeneratedQuestionItem {
  type: 'multiple_choice' | 'flashcard';
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  topic: string;
}

/**
 * Save an array of generated questions linked to a document
 */
export async function saveGeneratedQuestions(
  userId: string,
  documentId: string,
  generatedItems: GeneratedQuestionItem[]
): Promise<Question[]> {
  const savedQuestions: Question[] = [];

  for (const item of generatedItems) {
    const questionId = generateSafeId();
    const questionDoc: Question = {
      id: questionId,
      document_id: documentId,
      user_id: userId,
      type: item.type,
      topic: item.topic || 'כללי',
      content: {
        question: item.question,
        options: item.options,
        correct_index: item.correct_index,
        explanation: item.explanation,
      }
    };

    const docRef = doc(db, COLLECTION_NAME, questionId);
    try {
      await setDoc(docRef, questionDoc);
      savedQuestions.push(questionDoc);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${COLLECTION_NAME}/${questionId}`);
    }
  }

  return savedQuestions;
}

/**
 * Fetch questions for a specific document owned by the user
 */
export async function fetchQuestionsForDocument(
  userId: string,
  documentId: string
): Promise<Question[]> {
  const questionsRef = collection(db, COLLECTION_NAME);
  // Row-Level Security matches where user_id == userId
  const q = query(questionsRef, where('user_id', '==', userId));

  try {
    const snapshot = await getDocs(q);
    const questions: Question[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Question;
      if (data.document_id === documentId) {
        questions.push(data);
      }
    });
    return questions;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
  }
}
