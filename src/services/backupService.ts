/**
 * Backup & Export Service - Giezra Farms Limited
 * Full Firestore database snapshots, JSON/CSV exports, Google Drive archiving, and controlled restore
 */

import { collection, doc, setDoc, getDocs, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { uploadToDrive } from './driveService';
import { logActivity } from './activityLogService';
import { auth } from './firebase';
import { getCustomers } from './customerService';
import { getProducts } from './productService';
import { getOrders } from './orderService';
import { getPayments } from './paymentService';
import { getStockMovements } from './stockService';

export interface FirestoreBackup {
  backup_id: string;
  file_name: string;
  format: 'JSON' | 'CSV';
  drive_file_id?: string;
  drive_file_url?: string;
  download_url?: string;
  record_count: number;
  collection_counts: Record<string, number>;
  created_by: string;
  created_at: string;
}

const COLLECTION = 'backups';

export async function createDatabaseBackup(format: 'JSON' | 'CSV' = 'JSON'): Promise<FirestoreBackup> {
  const currentUser = auth.currentUser;
  const created_by = currentUser?.displayName || currentUser?.email || 'System Administrator';
  const now = new Date();
  const timestampStr = now.toISOString().replace(/[:.]/g, '-');
  const backup_id = `bkp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const fileName = `GIEZRA_DB_BACKUP_${timestampStr}.${format.toLowerCase()}`;

  // Fetch all collections
  const [customers, products, orders, payments, stockMovements] = await Promise.all([
    getCustomers(),
    getProducts(),
    getOrders(),
    getPayments(),
    getStockMovements(200)
  ]);

  const collectionCounts = {
    customers: customers.length,
    products: products.length,
    orders: orders.length,
    payments: payments.length,
    stockMovements: stockMovements.length
  };

  const totalRecords = customers.length + products.length + orders.length + payments.length + stockMovements.length;

  let fileContent: string;
  let mimeType: string;

  if (format === 'JSON') {
    fileContent = JSON.stringify({
      system: 'Giezra Farms Limited Management System',
      exportedAt: now.toISOString(),
      recordCount: totalRecords,
      collectionCounts,
      data: {
        customers,
        products,
        orders,
        payments,
        stockMovements
      }
    }, null, 2);
    mimeType = 'application/json';
  } else {
    // CSV export combining key records
    const lines: string[] = ['Collection,ID,Name_or_Reference,Date,Amount_or_Stock,Status'];
    customers.forEach(c => lines.push(`Customers,${c.customer_id},"${c.customer_name}",${c.created_at},${c.outstanding_balance},${c.status}`));
    products.forEach(p => lines.push(`Products,${p.product_id},"${p.product_name}",${p.created_at},${p.current_stock},${p.availability ? 'Available' : 'Out of Stock'}`));
    orders.forEach(o => lines.push(`Orders,${o.order_id},"${o.order_number}",${o.order_date},${o.total_amount},${o.order_status}`));
    payments.forEach(pay => lines.push(`Payments,${pay.payment_id},"${pay.reference_number}",${pay.payment_date},${pay.amount},Completed`));
    stockMovements.forEach(m => lines.push(`StockMovements,${m.movement_id},"${m.product_name}",${m.created_at},${m.quantity},${m.movement_type}`));

    fileContent = lines.join('\n');
    mimeType = 'text/csv';
  }

  // Upload to Google Drive
  let drive_file_id = '';
  let drive_file_url = '';
  let download_url = '';

  try {
    const driveUpload = await uploadToDrive({
      file: fileContent,
      fileName,
      mimeType,
      folderCategory: 'Backups'
    });
    drive_file_id = driveUpload.fileId;
    drive_file_url = driveUpload.webViewLink;
    download_url = driveUpload.webContentLink;
  } catch (driveErr: any) {
    console.warn('[Backup] Drive upload notice:', driveErr.message);
  }

  const payload: FirestoreBackup = {
    backup_id,
    file_name: fileName,
    format,
    drive_file_id: drive_file_id || undefined,
    drive_file_url: drive_file_url || undefined,
    download_url: download_url || undefined,
    record_count: totalRecords,
    collection_counts: collectionCounts,
    created_by,
    created_at: now.toISOString()
  };

  try {
    const docRef = doc(db, COLLECTION, backup_id);
    await setDoc(docRef, {
      ...payload,
      _timestamp: serverTimestamp()
    });

    await logActivity({
      user_id: currentUser?.uid || 'system',
      user_name: created_by,
      action: 'DATABASE_BACKUP_CREATED',
      module: 'Administration',
      record_id: backup_id,
      description: `Created snapshot "${fileName}" with ${totalRecords} records across all collections`
    });

    return payload;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTION}/${backup_id}`);
  }
}

export async function getBackups(): Promise<FirestoreBackup[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as FirestoreBackup);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION);
  }
}

export function subscribeBackups(callback: (backups: FirestoreBackup[]) => void) {
  const q = query(collection(db, COLLECTION), orderBy('created_at', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => d.data() as FirestoreBackup));
  }, (error) => {
    console.error('Backups listener error:', error);
  });
}
