/**
 * Migration Service - Giezra Farms Limited
 * Safe migration of initial/local business records to Cloud Firestore with non-destructive verification
 */

import { doc, getDoc, setDoc, getDocs, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { normalizeCustomer } from './customerService';
import { normalizeProduct } from './productService';
import { normalizeOrder } from './orderService';
import { normalizePayment } from './paymentService';
import { normalizeStockMovement } from './stockService';
import { DEFAULT_GIEZRA_SETTINGS } from './settingsService';
import { INITIAL_CUSTOMERS, INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_PAYMENTS, INITIAL_STOCK_MOVEMENTS, INITIAL_USERS } from '../data/mockDatabase';
import { logActivity } from './activityLogService';

export interface MigrationSummary {
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ALREADY_MIGRATED' | 'FAILED';
  migratedCounts: {
    users: number;
    customers: number;
    products: number;
    orders: number;
    payments: number;
    stockMovements: number;
    settings: number;
  };
  totalMigrated: number;
  errors: string[];
  verifiedAt?: string;
}

export async function checkMigrationStatus(): Promise<{
  needsMigration: boolean;
  cloudCounts: Record<string, number>;
}> {
  try {
    const [custSnap, prodSnap, ordSnap] = await Promise.all([
      getDocs(collection(db, 'customers')),
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'orders'))
    ]);

    const cloudCounts = {
      customers: custSnap.size,
      products: prodSnap.size,
      orders: ordSnap.size
    };

    // If products or customers are 0, migration is recommended
    const needsMigration = custSnap.size === 0 || prodSnap.size === 0;
    return { needsMigration, cloudCounts };
  } catch (err) {
    console.warn('[Migration] Status check error:', err);
    return { needsMigration: false, cloudCounts: {} };
  }
}

export async function runCloudDataMigration(): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    status: 'IN_PROGRESS',
    migratedCounts: {
      users: 0,
      customers: 0,
      products: 0,
      orders: 0,
      payments: 0,
      stockMovements: 0,
      settings: 0
    },
    totalMigrated: 0,
    errors: []
  };

  try {
    // 1. Migrate Users
    for (const u of INITIAL_USERS) {
      try {
        const userRef = doc(db, 'users', u.id);
        const existing = await getDoc(userRef);
        if (!existing.exists()) {
          await setDoc(userRef, {
            user_id: u.id,
            full_name: u.name,
            email: u.email,
            phone: u.phone || '+255 754 000 000',
            role: u.role,
            status: u.isActive ? 'ACTIVE' : 'INACTIVE',
            created_at: u.createdAt || new Date().toISOString(),
            _timestamp: serverTimestamp()
          });
          summary.migratedCounts.users++;
        }
      } catch (err: any) {
        summary.errors.push(`User ${u.id}: ${err.message}`);
      }
    }

    // 2. Migrate Customers
    for (const c of INITIAL_CUSTOMERS) {
      try {
        const custRef = doc(db, 'customers', c.id);
        const existing = await getDoc(custRef);
        if (!existing.exists()) {
          const norm = normalizeCustomer(c, c.id);
          await setDoc(custRef, {
            ...norm,
            _timestamp: serverTimestamp()
          });
          summary.migratedCounts.customers++;
        }
      } catch (err: any) {
        summary.errors.push(`Customer ${c.id}: ${err.message}`);
      }
    }

    // 3. Migrate Products
    for (const p of INITIAL_PRODUCTS) {
      try {
        const prodRef = doc(db, 'products', p.id);
        const existing = await getDoc(prodRef);
        if (!existing.exists()) {
          const norm = normalizeProduct(p, p.id);
          await setDoc(prodRef, {
            ...norm,
            _timestamp: serverTimestamp()
          });
          summary.migratedCounts.products++;
        }
      } catch (err: any) {
        summary.errors.push(`Product ${p.id}: ${err.message}`);
      }
    }

    // 4. Migrate Orders
    for (const o of INITIAL_ORDERS) {
      try {
        const ordRef = doc(db, 'orders', o.id);
        const existing = await getDoc(ordRef);
        if (!existing.exists()) {
          const norm = normalizeOrder(o, o.id);
          await setDoc(ordRef, {
            ...norm,
            _timestamp: serverTimestamp()
          });
          summary.migratedCounts.orders++;
        }
      } catch (err: any) {
        summary.errors.push(`Order ${o.id}: ${err.message}`);
      }
    }

    // 5. Migrate Payments
    for (const pay of INITIAL_PAYMENTS) {
      try {
        const payRef = doc(db, 'payments', pay.id);
        const existing = await getDoc(payRef);
        if (!existing.exists()) {
          const norm = normalizePayment(pay, pay.id);
          await setDoc(payRef, {
            ...norm,
            _timestamp: serverTimestamp()
          });
          summary.migratedCounts.payments++;
        }
      } catch (err: any) {
        summary.errors.push(`Payment ${pay.id}: ${err.message}`);
      }
    }

    // 6. Migrate Stock Movements
    for (const m of INITIAL_STOCK_MOVEMENTS) {
      try {
        const movRef = doc(db, 'stock_movements', m.id);
        const existing = await getDoc(movRef);
        if (!existing.exists()) {
          const norm = normalizeStockMovement(m, m.id);
          await setDoc(movRef, {
            ...norm,
            _timestamp: serverTimestamp()
          });
          summary.migratedCounts.stockMovements++;
        }
      } catch (err: any) {
        summary.errors.push(`Movement ${m.id}: ${err.message}`);
      }
    }

    // 7. Seed Settings if not present
    try {
      const setRef = doc(db, 'settings', 'company');
      const setDocSnap = await getDoc(setRef);
      if (!setDocSnap.exists()) {
        await setDoc(setRef, {
          ...DEFAULT_GIEZRA_SETTINGS,
          _timestamp: serverTimestamp()
        });
        summary.migratedCounts.settings = 1;
      }
    } catch (err: any) {
      summary.errors.push(`Settings: ${err.message}`);
    }

    summary.totalMigrated = Object.values(summary.migratedCounts).reduce((a, b) => a + b, 0);
    summary.status = summary.totalMigrated > 0 ? 'COMPLETED' : 'ALREADY_MIGRATED';
    summary.verifiedAt = new Date().toISOString();

    await logActivity({
      user_id: 'system_migration',
      user_name: 'Database Migration Engine',
      action: 'DATA_MIGRATION',
      module: 'Administration',
      description: `Migrated ${summary.totalMigrated} initial business records into Cloud Firestore`
    });

    return summary;
  } catch (err: any) {
    summary.status = 'FAILED';
    summary.errors.push(`Fatal error: ${err.message}`);
    return summary;
  }
}
