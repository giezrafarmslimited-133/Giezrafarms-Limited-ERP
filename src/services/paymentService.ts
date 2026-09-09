/**
 * Payment & Debt Tracking Service - Giezra Farms Limited
 * Atomic payment recording and automatic balance/debt recalculation in Cloud Firestore
 */

import { collection, doc, getDocs, query, orderBy, limit, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { logActivity } from './activityLogService';
import { auth } from './firebase';

export type PaymentMethod = 'CASH' | 'BANK' | 'MOBILE_MONEY' | 'OTHER';

export interface FirestorePayment {
  payment_id: string;
  customer_id: string;
  customer_name: string;
  order_id?: string;
  order_number?: string;
  invoice_id?: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number: string;
  payment_date: string;
  received_by: string;
  notes: string;
  created_at: string;

  // UI mirrors
  id?: string;
  receiptNumber?: string;
  customerId?: string;
  customerName?: string;
  orderId?: string;
  amountReceived?: number;
  paymentMethod?: string;
  date?: string;
  recordedBy?: string;
}

const PAYMENTS_COLLECTION = 'payments';
const ORDERS_COLLECTION = 'orders';
const CUSTOMERS_COLLECTION = 'customers';

export function normalizePayment(data: any, id?: string): FirestorePayment {
  const payment_id = data.payment_id || data.id || id || `pay_${Date.now()}`;
  const customer_id = data.customer_id || data.customerId || '';
  const customer_name = data.customer_name || data.customerName || 'Customer';
  const order_id = data.order_id || data.orderId || '';
  const order_number = data.order_number || data.orderNumber || '';
  const invoice_id = data.invoice_id || '';
  const amount = Number(data.amount ?? data.amountReceived ?? 0);
  const payment_method = (data.payment_method || (data.paymentMethod ? String(data.paymentMethod).toUpperCase().replace(/ /g, '_') : 'CASH')) as PaymentMethod;
  const reference_number = data.reference_number || data.receiptNumber || `RCP-${payment_id.substring(4, 10).toUpperCase()}`;
  const payment_date = data.payment_date || data.date || new Date().toISOString();
  const received_by = data.received_by || data.recordedBy || 'Finance Desk';
  const notes = data.notes || '';
  const created_at = data.created_at || payment_date;

  return {
    payment_id,
    customer_id,
    customer_name,
    order_id,
    order_number,
    invoice_id,
    amount,
    payment_method,
    reference_number,
    payment_date,
    received_by,
    notes,
    created_at,

    // UI compatibility getters
    id: payment_id,
    receiptNumber: reference_number,
    customerId: customer_id,
    customerName: customer_name,
    orderId: order_id,
    amountReceived: amount,
    paymentMethod: payment_method,
    date: payment_date,
    recordedBy: received_by
  };
}

export async function getPayments(maxRecords = 100): Promise<FirestorePayment[]> {
  try {
    const q = query(collection(db, PAYMENTS_COLLECTION), orderBy('payment_date', 'desc'), limit(maxRecords));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => normalizePayment(d.data(), d.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PAYMENTS_COLLECTION);
  }
}

export function subscribePayments(callback: (payments: FirestorePayment[]) => void, maxRecords = 60) {
  const q = query(collection(db, PAYMENTS_COLLECTION), orderBy('payment_date', 'desc'), limit(maxRecords));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => normalizePayment(d.data(), d.id));
    callback(list);
  }, (error) => {
    console.error('[Payments Listener Error]', error);
  });
}

/**
 * Records payment atomically across payment record, order record, and customer record
 */
export async function recordPayment(params: {
  customerId: string;
  customerName?: string;
  orderId?: string;
  orderNumber?: string;
  invoiceId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}): Promise<FirestorePayment> {
  const { customerId, customerName = '', orderId, orderNumber, invoiceId, amount, paymentMethod, referenceNumber = '', notes = '' } = params;

  if (amount <= 0) {
    throw new Error('Payment amount must be greater than zero.');
  }

  const payment_id = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const paymentRef = doc(db, PAYMENTS_COLLECTION, payment_id);
  const now = new Date().toISOString();
  const currentUser = auth.currentUser;
  const receivedBy = currentUser?.displayName || currentUser?.email || 'Cashier';
  const finalRefNumber = referenceNumber || `RCP-${Date.now().toString().slice(-6)}`;

  let finalPayment: FirestorePayment;

  try {
    await runTransaction(db, async (transaction) => {
      // 1. If orderId is supplied, read order and calculate updated payment balance
      let resolvedOrderNumber = orderNumber || '';
      let resolvedCustomerName = customerName;

      if (orderId) {
        const orderRef = doc(db, ORDERS_COLLECTION, orderId);
        const orderDoc = await transaction.get(orderRef);
        if (orderDoc.exists()) {
          const orderData = orderDoc.data();
          resolvedOrderNumber = orderData.order_number || orderData.orderNumber || resolvedOrderNumber;
          resolvedCustomerName = resolvedCustomerName || orderData.customer_name || orderData.customerName || '';

          const totalAmount = Number(orderData.total_amount ?? orderData.grandTotal ?? 0);
          const currentAmountPaid = Number(orderData.amount_paid ?? orderData.amountPaid ?? 0);
          const newAmountPaid = currentAmountPaid + amount;
          const newBalance = Math.max(0, totalAmount - newAmountPaid);
          const newPaymentStatus = newBalance <= 0 ? 'PAID' : (newAmountPaid > 0 ? 'PARTIAL' : 'UNPAID');

          transaction.update(orderRef, {
            amount_paid: newAmountPaid,
            amountPaid: newAmountPaid,
            balance: newBalance,
            remainingBalance: newBalance,
            payment_status: newPaymentStatus,
            updated_at: now,
            _timestamp: serverTimestamp()
          });
        }
      }

      // 2. Read customer doc and decrease outstanding balance
      if (customerId) {
        const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
        const customerDoc = await transaction.get(customerRef);
        if (customerDoc.exists()) {
          const custData = customerDoc.data();
          resolvedCustomerName = resolvedCustomerName || custData.customer_name || custData.name || '';
          const currentDebt = Number(custData.outstanding_balance ?? custData.outstandingBalance ?? 0);
          const newDebt = Math.max(0, currentDebt - amount);

          transaction.update(customerRef, {
            outstanding_balance: newDebt,
            outstandingBalance: newDebt,
            updated_at: now,
            _timestamp: serverTimestamp()
          });
        }
      }

      // 3. Create payment document
      const paymentPayload = {
        payment_id,
        customer_id: customerId,
        customer_name: resolvedCustomerName || 'Giezra Client',
        order_id: orderId || '',
        order_number: resolvedOrderNumber,
        invoice_id: invoiceId || '',
        amount,
        payment_method: paymentMethod,
        reference_number: finalRefNumber,
        payment_date: now,
        received_by: receivedBy,
        notes,
        created_at: now,
        _timestamp: serverTimestamp()
      };

      transaction.set(paymentRef, paymentPayload);
      finalPayment = normalizePayment(paymentPayload, payment_id);
    });

    await logActivity({
      user_id: currentUser?.uid || 'system',
      user_name: receivedBy,
      action: 'PAYMENT_RECEIVED',
      module: 'Payments',
      record_id: payment_id,
      description: `Recorded payment of TZS ${amount.toLocaleString()} via ${paymentMethod} for ${finalPayment!.customer_name} (Ref: ${finalRefNumber})`
    });

    return finalPayment!;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${PAYMENTS_COLLECTION}/${payment_id}`);
  }
}
