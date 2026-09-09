/**
 * Business Document Management Service - Giezra Farms Limited
 * Document uploading to Google Drive, metadata tracking in Firestore, and searchable repository
 */

import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { uploadToDrive, listDriveFiles } from './driveService';
import { logActivity } from './activityLogService';
import { auth } from './firebase';

export interface FirestoreDocument {
  document_id: string;
  document_name: string;
  document_type: 'Farm Permit' | 'Health Inspection' | 'Food Safety Certificate' | 'Supplier Agreement' | 'Customer Contract' | 'Financial Audit' | 'Other';
  drive_file_id: string;
  drive_file_url: string;
  download_url?: string;
  file_size: number;
  mime_type?: string;
  uploaded_by: string;
  created_at: string;
  notes?: string;
}

const COLLECTION = 'documents';

export async function uploadBusinessDocument(options: {
  file: File;
  documentType: FirestoreDocument['document_type'];
  customName?: string;
  notes?: string;
}): Promise<FirestoreDocument> {
  const { file, documentType, customName, notes } = options;
  const fileName = customName ? (customName.endsWith(file.name.substring(file.name.lastIndexOf('.'))) ? customName : `${customName}_${file.name}`) : file.name;

  // 1. Upload to Google Drive
  const driveResult = await uploadToDrive({
    file,
    fileName,
    mimeType: file.type || 'application/pdf',
    folderCategory: 'Business Documents'
  });

  // 2. Record in Firestore
  const document_id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const currentUser = auth.currentUser;
  const uploaded_by = currentUser?.displayName || currentUser?.email || 'Compliance Officer';
  const now = new Date().toISOString();

  const docPayload: FirestoreDocument = {
    document_id,
    document_name: fileName,
    document_type: documentType,
    drive_file_id: driveResult.fileId,
    drive_file_url: driveResult.webViewLink,
    download_url: driveResult.webContentLink,
    file_size: file.size,
    mime_type: file.type,
    uploaded_by,
    created_at: now,
    notes: notes || ''
  };

  try {
    const docRef = doc(db, COLLECTION, document_id);
    await setDoc(docRef, {
      ...docPayload,
      _timestamp: serverTimestamp()
    });

    await logActivity({
      user_id: currentUser?.uid || 'system',
      user_name: uploaded_by,
      action: 'DOCUMENT_UPLOADED',
      module: 'Documents',
      record_id: document_id,
      description: `Uploaded corporate document "${fileName}" (${documentType}) to Google Drive`
    });

    return docPayload;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTION}/${document_id}`);
  }
}

export async function getBusinessDocuments(): Promise<FirestoreDocument[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as FirestoreDocument);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION);
  }
}

export function subscribeBusinessDocuments(callback: (docs: FirestoreDocument[]) => void) {
  const q = query(collection(db, COLLECTION), orderBy('created_at', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => d.data() as FirestoreDocument));
  }, (error) => {
    console.error('Documents listener error:', error);
  });
}

export async function deleteBusinessDocument(documentId: string): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTION, documentId);
    await deleteDoc(docRef);

    await logActivity({
      user_id: auth.currentUser?.uid || 'system',
      user_name: auth.currentUser?.displayName || 'User',
      action: 'DOCUMENT_DELETED',
      module: 'Documents',
      record_id: documentId,
      description: `Deleted document reference ${documentId}`
    });

    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTION}/${documentId}`);
  }
}
