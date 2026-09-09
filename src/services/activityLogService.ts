/**
 * Activity Log Service - Giezra Farms Limited
 * Persistent audit logging to Cloud Firestore
 */

import { collection, doc, setDoc, getDocs, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export interface ActivityLogEntry {
  log_id: string;
  user_id: string;
  user_name: string;
  action: string; // e.g. LOGIN, CUSTOMER_CREATED, ORDER_CREATED, STOCK_UPDATED, etc.
  module: string; // e.g. Auth, Customers, Inventory, Orders, Payments, Documents
  record_id?: string;
  description: string;
  created_at: string;
  metadata?: Record<string, any>;
}

const COLLECTION = 'activity_logs';

export async function logActivity(entry: Omit<ActivityLogEntry, 'log_id' | 'created_at'>): Promise<string> {
  const log_id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const created_at = new Date().toISOString();
  const payload: ActivityLogEntry = {
    ...entry,
    log_id,
    created_at
  };

  try {
    const docRef = doc(db, COLLECTION, log_id);
    await setDoc(docRef, {
      ...payload,
      _timestamp: serverTimestamp()
    });
    return log_id;
  } catch (error) {
    console.warn('[ActivityLog] Could not write cloud audit log:', error);
    // Non-blocking for UI, but handleFirestoreError if required
    return log_id;
  }
}

export async function getActivityLogs(maxRecords = 100): Promise<ActivityLogEntry[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('created_at', 'desc'), limit(maxRecords));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ActivityLogEntry);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION);
  }
}

export function subscribeToActivityLogs(callback: (logs: ActivityLogEntry[]) => void, maxRecords = 50) {
  const q = query(collection(db, COLLECTION), orderBy('created_at', 'desc'), limit(maxRecords));
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => doc.data() as ActivityLogEntry);
    callback(logs);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, COLLECTION);
  });
}
