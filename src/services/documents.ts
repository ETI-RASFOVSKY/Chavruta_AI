/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Documents Service for Chavruta Smart
 * ניהול חומרי הלימוד של המשתמש ב-Firestore עם בידוד והרשאות Row-Level Security
 */

import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  getDocs 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { Document } from '../types';

const COLLECTION_NAME = 'documents';

/**
 * Generate a random safe Firestore alphanumeric ID
 */
export function generateSafeId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let autoId = '';
  for (let i = 0; i < 20; i++) {
    autoId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return autoId;
}

/**
 * Real-time listener for the user's documents
 * Row-level security enforces user_id == request.auth.uid
 */
export function subscribeToUserDocuments(
  userId: string,
  onData: (documents: Document[]) => void,
  onError?: (error: Error) => void
): () => void {
  const docsRef = collection(db, COLLECTION_NAME);
  const q = query(docsRef, where('user_id', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const docs: Document[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Document;
        docs.push(data);
      });
      // Sort in-memory by created_at descending (newest first)
      docs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      onData(docs);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      } catch (err: any) {
        if (typeof onError === 'function') {
          onError(err);
        }
      }
    }
  );
}

/**
 * Add a new study document for the current user
 */
export async function createDocument(
  userId: string, 
  title: string, 
  rawText: string
): Promise<Document> {
  const id = generateSafeId();
  const newDoc: Document = {
    id,
    user_id: userId,
    title: title.trim(),
    raw_text: rawText.trim(),
    created_at: new Date().toISOString()
  };

  const docRef = doc(db, COLLECTION_NAME, id);
  try {
    await setDoc(docRef, newDoc);
    return newDoc;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${COLLECTION_NAME}/${id}`);
  }
}

/**
 * Delete a user document by ID
 */
export async function deleteDocument(documentId: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, documentId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${documentId}`);
  }
}
