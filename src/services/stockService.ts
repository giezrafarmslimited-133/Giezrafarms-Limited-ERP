/**
 * Stock & Inventory Movement Service - Giezra Farms Limited
 * Atomic stock updates and immutable movement audit log in Cloud Firestore
 */

import { collection, doc, getDocs, query, orderBy, limit, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { logActivity } from './activityLogService';
import { auth } from './firebase';

export type MovementType =
  | 'PRODUCTION_IN'
  | 'PURCHASE_IN'
  | 'SALE_OUT'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'DAMAGE'
  | 'RETURN';

export interface FirestoreStockMovement {
  movement_id: string;
  product_id: string;
  product_name: string;
  movement_type: MovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference: string;
  notes: string;
  performed_by: string;
  created_at: string;

  // Compatibility fields for existing UI
  id?: string;
  date?: string;
  time?: string;
  productId?: string;
  productName?: string;
  productCode?: string;
  type?: any;
  previousBalance?: number;
  currentBalance?: number;
  performedBy?: string;
  reason?: string;
  referenceNumber?: string;
}

const MOVEMENTS_COLLECTION = 'stock_movements';
const PRODUCTS_COLLECTION = 'products';

export function normalizeStockMovement(data: any, id?: string): FirestoreStockMovement {
  const movement_id = data.movement_id || data.id || id || `mov_${Date.now()}`;
  const product_id = data.product_id || data.productId || '';
  const product_name = data.product_name || data.productName || 'Unknown Product';
  const movement_type = (data.movement_type || (data.type ? String(data.type).toUpperCase().replace(/ /g, '_') : 'ADJUSTMENT_IN')) as MovementType;
  const quantity = Math.abs(Number(data.quantity || data.quantityChange || 0));
  const previous_stock = Number(data.previous_stock ?? data.previousBalance ?? 0);
  const new_stock = Number(data.new_stock ?? data.currentBalance ?? previous_stock);
  const reference = data.reference || data.referenceNumber || `REF-${movement_id.substring(0, 8).toUpperCase()}`;
  const notes = data.notes || data.reason || '';
  const performed_by = data.performed_by || data.performedBy || 'Giezra Stock Team';
  const created_at = data.created_at || (data.date ? `${data.date}T${data.time || '12:00:00'}Z` : new Date().toISOString());

  const dateStr = created_at.split('T')[0];
  const timeStr = created_at.includes('T') ? created_at.split('T')[1].substring(0, 5) : '00:00';

  return {
    movement_id,
    product_id,
    product_name,
    movement_type,
    quantity,
    previous_stock,
    new_stock,
    reference,
    notes,
    performed_by,
    created_at,

    // UI compatibility getters
    id: movement_id,
    date: dateStr,
    time: timeStr,
    productId: product_id,
    productName: product_name,
    productCode: data.productCode || `GZ-${product_id.substring(0, 6).toUpperCase()}`,
    type: movement_type,
    previousBalance: previous_stock,
    currentBalance: new_stock,
    performedBy: performed_by,
    reason: notes,
    referenceNumber: reference
  };
}

export async function getStockMovements(maxRecords = 100): Promise<FirestoreStockMovement[]> {
  try {
    const q = query(collection(db, MOVEMENTS_COLLECTION), orderBy('created_at', 'desc'), limit(maxRecords));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => normalizeStockMovement(d.data(), d.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, MOVEMENTS_COLLECTION);
  }
}

export function subscribeStockMovements(callback: (movements: FirestoreStockMovement[]) => void, maxRecords = 60) {
  const q = query(collection(db, MOVEMENTS_COLLECTION), orderBy('created_at', 'desc'), limit(maxRecords));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => normalizeStockMovement(d.data(), d.id));
    callback(list);
  }, (error) => {
    console.error('[Stock Movements Listener Error]', error);
  });
}

/**
 * Executes an atomic stock movement transaction:
 * 1. Reads current product stock from Firestore
 * 2. Computes the new stock balance
 * 3. Enforces negative stock rules (preventing stock from dropping below zero)
 * 4. Updates product document
 * 5. Writes an immutable movement record to stock_movements
 */
export async function recordStockMovement(params: {
  productId: string;
  movementType: MovementType;
  quantity: number;
  reference?: string;
  notes?: string;
  allowNegativeStock?: boolean;
}): Promise<FirestoreStockMovement> {
  const { productId, movementType, quantity, reference = '', notes = '', allowNegativeStock = false } = params;
  const absQty = Math.abs(quantity);

  if (absQty === 0) {
    throw new Error('Movement quantity must be greater than zero.');
  }

  const movement_id = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const productRef = doc(db, PRODUCTS_COLLECTION, productId);
  const movementRef = doc(db, MOVEMENTS_COLLECTION, movement_id);
  const currentUser = auth.currentUser;
  const performedBy = currentUser?.displayName || currentUser?.email || 'Stock Officer';
  const now = new Date().toISOString();

  let finalMovement: FirestoreStockMovement;

  try {
    await runTransaction(db, async (transaction) => {
      const productDoc = await transaction.get(productRef);
      if (!productDoc.exists()) {
        throw new Error(`Product ${productId} not found in inventory.`);
      }

      const prodData = productDoc.data();
      const previousStock = Number(prodData.current_stock ?? prodData.currentStock ?? 0);
      const productName = prodData.product_name || prodData.name || 'Chicken Cut';

      // Compute new stock based on direction
      let isAddition = false;
      if (['PRODUCTION_IN', 'PURCHASE_IN', 'ADJUSTMENT_IN', 'RETURN'].includes(movementType)) {
        isAddition = true;
      }

      const newStock = isAddition ? previousStock + absQty : previousStock - absQty;

      if (!isAddition && newStock < 0 && !allowNegativeStock) {
        throw new Error(`Insufficient stock for "${productName}". Current stock is ${previousStock}, requested deduction is ${absQty}.`);
      }

      // Update product current_stock
      transaction.update(productRef, {
        current_stock: newStock,
        currentStock: newStock,
        availability: newStock > 0,
        active: newStock > 0,
        updated_at: now,
        _timestamp: serverTimestamp()
      });

      const movementPayload = {
        movement_id,
        product_id: productId,
        product_name: productName,
        movement_type: movementType,
        quantity: absQty,
        previous_stock: previousStock,
        new_stock: newStock,
        reference: reference || `REF-${movement_id.substring(0, 8).toUpperCase()}`,
        notes,
        performed_by: performedBy,
        created_at: now,
        _timestamp: serverTimestamp()
      };

      // Create immutable movement record
      transaction.set(movementRef, movementPayload);

      finalMovement = normalizeStockMovement(movementPayload, movement_id);
    });

    await logActivity({
      user_id: currentUser?.uid || 'system',
      user_name: performedBy,
      action: 'STOCK_MOVEMENT',
      module: 'Inventory',
      record_id: movement_id,
      description: `${movementType}: ${absQty} units of "${finalMovement!.product_name}" (Bal: ${finalMovement!.new_stock})`
    });

    return finalMovement!;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${MOVEMENTS_COLLECTION}/${movement_id}`);
  }
}
