/**
 * Settings Service - Giezra Farms Limited
 * Company operational parameters, banking, and numbering rules in Cloud Firestore
 */

import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { logActivity } from './activityLogService';
import { auth } from './firebase';

export interface GiezraCompanySettings {
  setting_id: string;
  company_name: string;
  company_address: string;
  phone: string;
  email: string;
  logo?: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  swift_code: string;
  tax_rate: number;
  currency: string;
  invoice_prefix: string;
  quotation_prefix: string;
  order_prefix: string;
  receipt_prefix: string;
  updated_at?: string;
}

export const DEFAULT_GIEZRA_SETTINGS: GiezraCompanySettings = {
  setting_id: 'company',
  company_name: 'Giezra Farms Limited',
  company_address: 'Plot 14, Mikocheni Light Industrial Area, Dar es Salaam, Tanzania',
  phone: '+255 754 112 233',
  email: 'giezrafarmslimited@gmail.com',
  bank_name: 'CRDB Bank Plc',
  account_name: 'GIEZRA FARMS LIMITED',
  account_number: '0150348829100',
  swift_code: 'CORUTZTZ',
  tax_rate: 18,
  currency: 'TZS',
  invoice_prefix: 'GZ-INV-',
  quotation_prefix: 'GZ-QUO-',
  order_prefix: 'GZ-ORD-',
  receipt_prefix: 'GZ-RCP-'
};

const DOC_PATH = 'settings/company';

export async function getCompanySettings(): Promise<GiezraCompanySettings> {
  try {
    const docRef = doc(db, 'settings', 'company');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_GIEZRA_SETTINGS, ...snap.data() };
    }
    // Initialize default if not found
    await setDoc(docRef, {
      ...DEFAULT_GIEZRA_SETTINGS,
      created_at: new Date().toISOString(),
      _timestamp: serverTimestamp()
    });
    return DEFAULT_GIEZRA_SETTINGS;
  } catch (error) {
    console.warn('Could not fetch settings from Firestore, falling back to defaults:', error);
    return DEFAULT_GIEZRA_SETTINGS;
  }
}

export function subscribeCompanySettings(callback: (settings: GiezraCompanySettings) => void) {
  const docRef = doc(db, 'settings', 'company');
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback({ ...DEFAULT_GIEZRA_SETTINGS, ...snap.data() });
    } else {
      callback(DEFAULT_GIEZRA_SETTINGS);
    }
  }, (error) => {
    console.error('Settings listener error:', error);
  });
}

export async function updateCompanySettings(settings: Partial<GiezraCompanySettings>): Promise<GiezraCompanySettings> {
  try {
    const docRef = doc(db, 'settings', 'company');
    const current = await getCompanySettings();
    const updated = {
      ...current,
      ...settings,
      updated_at: new Date().toISOString()
    };

    await setDoc(docRef, {
      ...updated,
      _timestamp: serverTimestamp()
    }, { merge: true });

    await logActivity({
      user_id: auth.currentUser?.uid || 'system',
      user_name: auth.currentUser?.displayName || auth.currentUser?.email || 'User',
      action: 'SETTINGS_UPDATED',
      module: 'Administration',
      record_id: 'company',
      description: `Updated enterprise configuration parameters for ${updated.company_name}`
    });

    return updated;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, DOC_PATH);
  }
}
