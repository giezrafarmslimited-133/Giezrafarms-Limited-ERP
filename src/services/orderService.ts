/**
 * Order Management Service - Giezra Farms Limited
 * Persistent orders, item subcollections, and automated stock deductions in Cloud Firestore
 */

import { collection, doc, setDoc, getDocs, getDoc, updateDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { logActivity } from './activityLogService';
import { recordStockMovement } from './stockService';
import { auth } from './firebase';

export interface FirestoreOrderItem {
  item_id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit?: string;
  total_price: number;

  // UI mirrors
  id?: string;
  productId?: string;
  productName?: string;
  unitPrice?: number;
  totalAmount?: number;
  discount?: number;
  vatRate?: number;
}

export type OrderPaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';
export type OrderFulfillmentStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY' | 'DELIVERED' | 'CANCELLED';

export interface FirestoreOrder {
  order_id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  order_date: string;
  items: FirestoreOrderItem[];
  subtotal: number;
  discount: number;
  delivery_cost: number;
  total_amount: number;
  amount_paid: number;
  balance: number;
  payment_status: OrderPaymentStatus;
  order_status: OrderFulfillmentStatus;
  created_by: string;
  created_at: string;
  updated_at?: string;
  notes?: string;

  // UI mirrors for compatibility
  id?: string;
  orderNumber?: string;
  customerId?: string;
  customerName?: string;
  totalDiscount?: number;
  totalVat?: number;
  grandTotal?: number;
  amountPaid?: number;
  remainingBalance?: number;
  deliveryDate?: string;
  salesOfficerName?: string;
  status?: any;
  createdAt?: string;
}

const COLLECTION = 'orders';

export function normalizeOrder(data: any, id?: string): FirestoreOrder {
  const order_id = data.order_id || data.id || id || `ord_${Date.now()}`;
  const order_number = data.order_number || data.orderNumber || `GZ-ORD-${order_id.substring(4, 10).toUpperCase()}`;
  const customer_id = data.customer_id || data.customerId || '';
  const customer_name = data.customer_name || data.customerName || 'Walk-in Client';
  const order_date = data.order_date || data.createdAt || new Date().toISOString();

  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items: FirestoreOrderItem[] = rawItems.map((it: any, index: number) => {
    const item_id = it.item_id || it.id || `item_${index}`;
    const product_id = it.product_id || it.productId || '';
    const product_name = it.product_name || it.productName || 'Poultry Item';
    const quantity = Number(it.quantity || 1);
    const unit_price = Number(it.unit_price ?? it.unitPrice ?? 0);
    const total_price = Number(it.total_price ?? it.totalAmount ?? (quantity * unit_price));

    return {
      item_id,
      order_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      unit: it.unit || 'Kg',
      total_price,
      // UI mirrors
      id: item_id,
      productId: product_id,
      productName: product_name,
      unitPrice: unit_price,
      totalAmount: total_price,
      discount: it.discount || 0,
      vatRate: it.vatRate || 0
    };
  });

  const subtotal = Number(data.subtotal ?? items.reduce((acc, it) => acc + it.total_price, 0));
  const discount = Number(data.discount ?? data.totalDiscount ?? 0);
  const delivery_cost = Number(data.delivery_cost ?? 0);
  const total_amount = Number(data.total_amount ?? data.grandTotal ?? Math.max(0, subtotal - discount + delivery_cost));
  const amount_paid = Number(data.amount_paid ?? data.amountPaid ?? 0);
  const balance = Number(data.balance ?? data.remainingBalance ?? Math.max(0, total_amount - amount_paid));

  let payment_status: OrderPaymentStatus = 'UNPAID';
  if (amount_paid >= total_amount && total_amount > 0) {
    payment_status = 'PAID';
  } else if (amount_paid > 0) {
    payment_status = 'PARTIAL';
  }

  // Normalize order status
  let order_status: OrderFulfillmentStatus = 'PENDING';
  const rawStatus = (data.order_status || data.status || 'PENDING').toString().toUpperCase();
  if (['DRAFT', 'PENDING', 'CONFIRMED', 'PROCESSING', 'READY', 'DELIVERED', 'CANCELLED'].includes(rawStatus)) {
    order_status = rawStatus as OrderFulfillmentStatus;
  } else if (rawStatus === 'APPROVED') {
    order_status = 'CONFIRMED';
  }

  const created_by = data.created_by || data.salesOfficerName || 'Sales Team';
  const created_at = data.created_at || data.createdAt || order_date;

  return {
    order_id,
    order_number,
    customer_id,
    customer_name,
    order_date,
    items,
    subtotal,
    discount,
    delivery_cost,
    total_amount,
    amount_paid,
    balance,
    payment_status,
    order_status,
    created_by,
    created_at,
    updated_at: data.updated_at || new Date().toISOString(),
    notes: data.notes || '',

    // UI mirrors
    id: order_id,
    orderNumber: order_number,
    customerId: customer_id,
    customerName: customer_name,
    totalDiscount: discount,
    totalVat: data.totalVat || 0,
    grandTotal: total_amount,
    amountPaid: amount_paid,
    remainingBalance: balance,
    deliveryDate: data.deliveryDate || order_date,
    salesOfficerName: created_by,
    status: order_status === 'CONFIRMED' ? 'Approved' : (order_status === 'DELIVERED' ? 'Delivered' : (order_status === 'CANCELLED' ? 'Cancelled' : 'Pending')),
    createdAt: created_at
  };
}

export async function getOrders(): Promise<FirestoreOrder[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => normalizeOrder(d.data(), d.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION);
  }
}

export function subscribeOrders(callback: (orders: FirestoreOrder[]) => void, onError?: (err: any) => void) {
  const q = query(collection(db, COLLECTION), orderBy('created_at', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => normalizeOrder(d.data(), d.id));
    callback(list);
  }, (error) => {
    console.error('[Orders Listener Error]', error);
    if (onError) onError(error);
  });
}

export async function createOrder(orderData: Partial<FirestoreOrder>): Promise<FirestoreOrder> {
  const order_id = orderData.order_id || orderData.id || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const order_number = orderData.order_number || orderData.orderNumber || `GZ-ORD-${Date.now().toString().slice(-6)}`;
  
  const normalized = normalizeOrder({
    ...orderData,
    order_id,
    order_number,
    created_by: auth.currentUser?.displayName || auth.currentUser?.email || orderData.created_by || 'Sales Officer',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  try {
    const docRef = doc(db, COLLECTION, order_id);
    await setDoc(docRef, {
      ...normalized,
      _timestamp: serverTimestamp()
    });

    // Also write line items into nested subcollection /orders/{orderId}/items/{itemId}
    for (const item of normalized.items) {
      const itemRef = doc(db, COLLECTION, order_id, 'items', item.item_id);
      await setDoc(itemRef, {
        ...item,
        order_id,
        _timestamp: serverTimestamp()
      });
    }

    await logActivity({
      user_id: auth.currentUser?.uid || 'system',
      user_name: auth.currentUser?.displayName || auth.currentUser?.email || 'User',
      action: 'ORDER_CREATED',
      module: 'Orders',
      record_id: order_id,
      description: `Created order ${order_number} for customer "${normalized.customer_name}" totaling TZS ${normalized.total_amount.toLocaleString()}`
    });

    return normalized;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${COLLECTION}/${order_id}`);
  }
}

export async function updateOrderStatus(orderId: string, newStatus: OrderFulfillmentStatus): Promise<FirestoreOrder> {
  try {
    const docRef = doc(db, COLLECTION, orderId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error(`Order ${orderId} not found.`);

    const current = normalizeOrder(snap.data(), snap.id);
    const prevStatus = current.order_status;

    // Deduct stock if transitioning to CONFIRMED or DELIVERED for the first time
    if (newStatus === 'CONFIRMED' || newStatus === 'DELIVERED') {
      if (prevStatus !== 'CONFIRMED' && prevStatus !== 'DELIVERED') {
        for (const item of current.items) {
          if (item.product_id && item.quantity > 0) {
            try {
              await recordStockMovement({
                productId: item.product_id,
                movementType: 'SALE_OUT',
                quantity: item.quantity,
                reference: current.order_number,
                notes: `Fulfillment for order ${current.order_number} to ${current.customer_name}`
              });
            } catch (stockErr: any) {
              console.warn(`Stock deduction notice for ${item.product_name}:`, stockErr.message);
            }
          }
        }
      }
    }

    const updated = normalizeOrder({
      ...current,
      order_status: newStatus,
      updated_at: new Date().toISOString()
    });

    await updateDoc(docRef, {
      order_status: newStatus,
      updated_at: updated.updated_at,
      status: updated.status,
      _timestamp: serverTimestamp()
    });

    await logActivity({
      user_id: auth.currentUser?.uid || 'system',
      user_name: auth.currentUser?.displayName || auth.currentUser?.email || 'User',
      action: 'ORDER_STATUS_CHANGED',
      module: 'Orders',
      record_id: orderId,
      description: `Order ${current.order_number} updated status from ${prevStatus} to ${newStatus}`
    });

    return updated;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION}/${orderId}`);
  }
}
