/**
 * Customer Service - Giezra Farms Limited
 * Persistent B2B and retail customer management in Cloud Firestore
 */

import { collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { logActivity } from './activityLogService';
import { auth } from './firebase';

export interface FirestoreCustomer {
  customer_id: string;
  customer_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  area: string;
  customer_type: 'HOTEL' | 'RESTAURANT' | 'SUPERMARKET' | 'BUTCHERY' | 'CATERER' | 'WHOLESALER' | 'RETAILER' | 'INDIVIDUAL' | 'OTHER';
  payment_type: 'CASH' | 'CREDIT' | 'BANK' | 'MOBILE_MONEY';
  credit_limit: number;
  outstanding_balance: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  tin?: string;
  vrn?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;

  // Compatibility fields for existing UI
  id?: string;
  name?: string;
  contactPerson?: string;
  businessType?: any;
  creditLimit?: number;
  outstandingBalance?: number;
  paymentTerms?: string;
}

const COLLECTION = 'customers';

/**
 * Normalizes customer object to satisfy both database schema and UI components
 */
export function normalizeCustomer(data: any, id?: string): FirestoreCustomer {
  const customer_id = data.customer_id || data.id || id || `cust_${Date.now()}`;
  const customer_name = data.customer_name || data.name || 'Unnamed Client';
  const phone = data.phone || '';
  const email = data.email || '';
  const contact_person = data.contact_person || data.contactPerson || '';
  const address = data.address || '';
  const area = data.area || data.region || data.district || 'Dar es Salaam';
  const customer_type = (data.customer_type || (data.businessType ? String(data.businessType).toUpperCase() : 'OTHER')) as any;
  const payment_type = (data.payment_type || 'CASH') as any;
  const credit_limit = Number(data.credit_limit ?? data.creditLimit ?? 0);
  const outstanding_balance = Number(data.outstanding_balance ?? data.outstandingBalance ?? 0);
  const status = data.status || 'ACTIVE';
  const created_at = data.created_at || data.createdAt || new Date().toISOString();

  return {
    customer_id,
    customer_name,
    contact_person,
    phone,
    email,
    address,
    area,
    customer_type,
    payment_type,
    credit_limit,
    outstanding_balance,
    status,
    tin: data.tin || '',
    vrn: data.vrn || '',
    notes: data.notes || '',
    created_by: data.created_by || 'System',
    created_at,
    updated_at: data.updated_at || new Date().toISOString(),

    // UI compatibility getters/mirrors
    id: customer_id,
    name: customer_name,
    contactPerson: contact_person,
    businessType: customer_type,
    creditLimit: credit_limit,
    outstandingBalance: outstanding_balance,
    paymentTerms: data.paymentTerms || payment_type
  };
}

export async function getCustomers(): Promise<FirestoreCustomer[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('customer_name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => normalizeCustomer(d.data(), d.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION);
  }
}

export function subscribeCustomers(callback: (customers: FirestoreCustomer[]) => void, onError?: (err: any) => void) {
  const q = query(collection(db, COLLECTION), orderBy('customer_name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => normalizeCustomer(d.data(), d.id));
    callback(list);
  }, (error) => {
    console.error('[Customers Listener Error]', error);
    if (onError) onError(error);
  });
}

export async function getCustomerById(customerId: string): Promise<FirestoreCustomer | null> {
  try {
    const docRef = doc(db, COLLECTION, customerId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return normalizeCustomer(snap.data(), snap.id);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTION}/${customerId}`);
  }
}

export async function createCustomer(customerData: Partial<FirestoreCustomer>): Promise<FirestoreCustomer> {
  const customer_id = customerData.customer_id || customerData.id || `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const normalized = normalizeCustomer({
    ...customerData,
    customer_id,
    created_by: auth.currentUser?.email || customerData.created_by || 'Staff',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  try {
    // Duplicate prevention check by phone
    if (normalized.phone) {
      const existing = await getCustomers();
      const duplicate = existing.find(c => c.customer_id !== customer_id && c.phone === normalized.phone);
      if (duplicate) {
        throw new Error(`A customer with phone number ${normalized.phone} already exists (${duplicate.customer_name}).`);
      }
    }

    const docRef = doc(db, COLLECTION, customer_id);
    await setDoc(docRef, {
      ...normalized,
      _timestamp: serverTimestamp()
    });

    await logActivity({
      user_id: auth.currentUser?.uid || 'system',
      user_name: auth.currentUser?.displayName || auth.currentUser?.email || 'User',
      action: 'CUSTOMER_CREATED',
      module: 'Customers',
      record_id: customer_id,
      description: `Registered new B2B customer "${normalized.customer_name}" with credit limit TZS ${normalized.credit_limit.toLocaleString()}`
    });

    return normalized;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${COLLECTION}/${customer_id}`);
  }
}

export async function updateCustomer(customerId: string, updateData: Partial<FirestoreCustomer>): Promise<FirestoreCustomer> {
  try {
    const docRef = doc(db, COLLECTION, customerId);
    const current = await getCustomerById(customerId);
    if (!current) throw new Error(`Customer ${customerId} not found.`);

    const merged = normalizeCustomer({
      ...current,
      ...updateData,
      updated_at: new Date().toISOString()
    });

    await updateDoc(docRef, {
      ...merged,
      _timestamp: serverTimestamp()
    });

    await logActivity({
      user_id: auth.currentUser?.uid || 'system',
      user_name: auth.currentUser?.displayName || auth.currentUser?.email || 'User',
      action: 'CUSTOMER_UPDATED',
      module: 'Customers',
      record_id: customerId,
      description: `Updated profile details for customer "${merged.customer_name}"`
    });

    return merged;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION}/${customerId}`);
  }
}

export async function deleteCustomer(customerId: string): Promise<boolean> {
  try {
    const current = await getCustomerById(customerId);
    await deleteDoc(doc(db, COLLECTION, customerId));

    await logActivity({
      user_id: auth.currentUser?.uid || 'system',
      user_name: auth.currentUser?.displayName || auth.currentUser?.email || 'User',
      action: 'CUSTOMER_DELETED',
      module: 'Customers',
      record_id: customerId,
      description: `Removed customer "${current?.customer_name || customerId}" from directory`
    });

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION}/${customerId}`);
  }
}
