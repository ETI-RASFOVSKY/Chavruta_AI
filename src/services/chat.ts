/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Chat Session Service for Chavruta Smart
 * שמירה ושליפה של שיחות חברותא סוקרטיות ב-Firestore
 */

import { 
  collection, 
  doc, 
  query, 
  where, 
  getDocs, 
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { ChatSession, ChatMessage } from '../types';
import { generateSafeId } from './documents';

const COLLECTION_NAME = 'chat_sessions';

/**
 * Fetch existing chat session for a user and document
 */
export async function fetchChatSessionForDocument(
  userId: string,
  documentId: string
): Promise<ChatSession | null> {
  const sessionsRef = collection(db, COLLECTION_NAME);
  const q = query(sessionsRef, where('user_id', '==', userId));

  try {
    const snapshot = await getDocs(q);
    let found: ChatSession | null = null;
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as ChatSession;
      if (data.document_id === documentId) {
        found = data;
      }
    });
    return found;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
  }
}

/**
 * Save or update chat session messages in Firestore
 */
export async function saveChatSession(
  userId: string,
  documentId: string,
  messages: ChatMessage[],
  sessionId?: string
): Promise<ChatSession> {
  const actualId = sessionId || generateSafeId();
  const sessionDoc: ChatSession = {
    id: actualId,
    document_id: documentId,
    user_id: userId,
    messages,
    created_at: new Date().toISOString(),
  };

  const docRef = doc(db, COLLECTION_NAME, actualId);
  try {
    await setDoc(docRef, sessionDoc);
    return sessionDoc;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLLECTION_NAME}/${actualId}`);
  }
}

/**
 * Reset / clear a chat session for a document
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, sessionId);
  try {
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${sessionId}`);
  }
}
