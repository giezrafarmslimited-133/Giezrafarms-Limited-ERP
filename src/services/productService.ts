/**
 * Product Service - Giezra Farms Limited
 * Persistent product catalogue and stock availability in Cloud Firestore
 */

import { collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { logActivity } from './activityLogService';
import { auth } from './firebase';

export interface FirestoreProduct {
  product_id: string;
  product_name: string;
  category: string;
  unit: string;
  selling_price: number;
  wholesale_price: number;
  cost_price: number;
  minimum_order: number;
  current_stock: number;
  reorder_level: number;
  availability: boolean;
  code?: string;
  description?: string;
  warehouse_location?: string;
  created_at: string;
  updated_at?: string;

  // Compatibility fields for existing UI
  id?: string;
  name?: string;
  group?: any;
  unitPrice?: number;
  costPrice?: number;
  currentStock?: number;
  lowStockThreshold?: number;
  active?: boolean;
  warehouseLocation?: string;
}

const COLLECTION = 'products';

export function normalizeProduct(data: any, id?: string): FirestoreProduct {
  const product_id = data.product_id || data.id || id || `prod_${Date.now()}`;
  const product_name = data.product_name || data.name || 'Unnamed Product';
  const category = data.category || data.group || 'Chicken Cuts';
  const unit = data.unit || 'Kg';
  const selling_price = Number(data.selling_price ?? data.unitPrice ?? 0);
  const wholesale_price = Number(data.wholesale_price ?? data.selling_price ?? data.unitPrice ?? 0);
  const cost_price = Number(data.cost_price ?? data.costPrice ?? 0);
  const minimum_order = Number(data.minimum_order ?? 1);
  const current_stock = Number(data.current_stock ?? data.currentStock ?? 0);
  const reorder_level = Number(data.reorder_level ?? data.lowStockThreshold ?? data.minStockLevel ?? 50);
  const availability = data.availability !== undefined ? Boolean(data.availability) : (data.active !== undefined ? Boolean(data.active) : current_stock > 0);
  const code = data.code || `GZ-${product_id.substring(0, 6).toUpperCase()}`;
  const created_at = data.created_at || data.createdAt || new Date().toISOString();

  return {
    product_id,
    product_name,
    category,
    unit,
    selling_price,
    wholesale_price,
    cost_price,
    minimum_order,
    current_stock,
    reorder_level,
    availability,
    code,
    description: data.description || '',
    warehouse_location: data.warehouse_location || data.warehouseLocation || 'Cold Room 1 (-18°C)',
    created_at,
    updated_at: data.updated_at || new Date().toISOString(),

    // UI mirrors
    id: product_id,
    name: product_name,
    group: category,
    unitPrice: selling_price,
    costPrice: cost_price,
    currentStock: current_stock,
    lowStockThreshold: reorder_level,
    active: availability,
    warehouseLocation: data.warehouse_location || data.warehouseLocation || 'Cold Room 1 (-18°C)'
  };
}

export async function getProducts(): Promise<FirestoreProduct[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('product_name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => normalizeProduct(d.data(), d.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION);
  }
}

export function subscribeProducts(callback: (products: FirestoreProduct[]) => void, onError?: (err: any) => void) {
  const q = query(collection(db, COLLECTION), orderBy('product_name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => normalizeProduct(d.data(), d.id));
    callback(list);
  }, (error) => {
    console.error('[Products Listener Error]', error);
    if (onError) onError(error);
  });
}

export async function getProductById(productId: string): Promise<FirestoreProduct | null> {
  try {
    const docRef = doc(db, COLLECTION, productId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return normalizeProduct(snap.data(), snap.id);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTION}/${productId}`);
  }
}

export async function createProduct(productData: Partial<FirestoreProduct>): Promise<FirestoreProduct> {
  const product_id = productData.product_id || productData.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const normalized = normalizeProduct({
    ...productData,
    product_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  if (normalized.selling_price < 0 || normalized.cost_price < 0) {
    throw new Error('Product price cannot be negative.');
  }

  try {
    const docRef = doc(db, COLLECTION, product_id);
    await setDoc(docRef, {
      ...normalized,
      _timestamp: serverTimestamp()
    });

    await logActivity({
      user_id: auth.currentUser?.uid || 'system',
      user_name: auth.currentUser?.displayName || auth.currentUser?.email || 'User',
      action: 'PRODUCT_CREATED',
      module: 'Products',
      record_id: product_id,
      description: `Created catalog product "${normalized.product_name}" (${normalized.category}) with price TZS ${normalized.selling_price.toLocaleString()}`
    });

    return normalized;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${COLLECTION}/${product_id}`);
  }
}

export async function updateProduct(productId: string, updateData: Partial<FirestoreProduct>): Promise<FirestoreProduct> {
  try {
    const docRef = doc(db, COLLECTION, productId);
    const current = await getProductById(productId);
    if (!current) throw new Error(`Product ${productId} not found.`);

    const merged = normalizeProduct({
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
      action: 'PRODUCT_UPDATED',
      module: 'Products',
      record_id: productId,
      description: `Updated product "${merged.product_name}" stock to ${merged.current_stock} ${merged.unit}`
    });

    return merged;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION}/${productId}`);
  }
}

export async function deleteProduct(productId: string): Promise<boolean> {
  try {
    const current = await getProductById(productId);
    await deleteDoc(doc(db, COLLECTION, productId));

    await logActivity({
      user_id: auth.currentUser?.uid || 'system',
      user_name: auth.currentUser?.displayName || auth.currentUser?.email || 'User',
      action: 'PRODUCT_DELETED',
      module: 'Products',
      record_id: productId,
      description: `Removed product "${current?.product_name || productId}" from catalog`
    });

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION}/${productId}`);
  }
}
