/**
 * Reporting Service - Giezra Farms Limited
 * Real-time analytics, dynamic financial calculations, and PDF/CSV report exports to Google Drive
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getCustomers, FirestoreCustomer } from './customerService';
import { getProducts, FirestoreProduct } from './productService';
import { getOrders, FirestoreOrder } from './orderService';
import { getPayments, FirestorePayment } from './paymentService';
import { uploadToDrive } from './driveService';
import { logActivity } from './activityLogService';
import { auth } from './firebase';
import { DEFAULT_GIEZRA_SETTINGS } from './settingsService';

export interface BusinessOverviewReport {
  totalRevenue: number;
  totalOrders: number;
  unpaidOrders: number;
  totalReceivables: number;
  totalStockQuantity: number;
  stockValuationCost: number;
  stockValuationRetail: number;
  lowStockItemsCount: number;
  recentPaymentsTotal: number;
}

export async function generateBusinessOverview(): Promise<BusinessOverviewReport> {
  const [customers, products, orders, payments] = await Promise.all([
    getCustomers(),
    getProducts(),
    getOrders(),
    getPayments(100)
  ]);

  const totalRevenue = orders.reduce((acc, o) => acc + o.total_amount, 0);
  const totalOrders = orders.length;
  const unpaidOrders = orders.filter(o => o.payment_status !== 'PAID').length;
  const totalReceivables = customers.reduce((acc, c) => acc + c.outstanding_balance, 0);

  const totalStockQuantity = products.reduce((acc, p) => acc + p.current_stock, 0);
  const stockValuationCost = products.reduce((acc, p) => acc + (p.current_stock * p.cost_price), 0);
  const stockValuationRetail = products.reduce((acc, p) => acc + (p.current_stock * p.selling_price), 0);
  const lowStockItemsCount = products.filter(p => p.current_stock <= p.reorder_level).length;

  const recentPaymentsTotal = payments.reduce((acc, p) => acc + p.amount, 0);

  return {
    totalRevenue,
    totalOrders,
    unpaidOrders,
    totalReceivables,
    totalStockQuantity,
    stockValuationCost,
    stockValuationRetail,
    lowStockItemsCount,
    recentPaymentsTotal
  };
}

/**
 * Generate comprehensive Stock Valuation Report PDF and export to Google Drive
 */
export async function exportStockValuationReport(): Promise<{ fileName: string; driveUrl?: string; blob: Blob }> {
  const products = await getProducts();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const fileName = `GIEZRA_STOCK_VALUATION_${new Date().toISOString().split('T')[0]}.pdf`;

  // Header
  doc.setFillColor(26, 90, 48);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('GIEZRA FARMS LIMITED', 14, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Official Inventory Stock Valuation Report — ${new Date().toLocaleDateString('en-GB')}`, 14, 23);

  const totalQty = products.reduce((a, p) => a + p.current_stock, 0);
  const totalCost = products.reduce((a, p) => a + (p.current_stock * p.cost_price), 0);
  const totalRetail = products.reduce((a, p) => a + (p.current_stock * p.selling_price), 0);

  const tableData = products.map((p, idx) => [
    idx + 1,
    p.product_name,
    p.category,
    `${p.current_stock} ${p.unit}`,
    `TZS ${p.cost_price.toLocaleString()}`,
    `TZS ${(p.current_stock * p.cost_price).toLocaleString()}`,
    `TZS ${p.selling_price.toLocaleString()}`,
    p.current_stock <= p.reorder_level ? 'LOW STOCK' : 'OK'
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['#', 'Product Item', 'Category', 'In Stock', 'Unit Cost', 'Valuation (Cost)', 'Retail Price', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [26, 90, 48], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Items Tracked: ${products.length} products (${totalQty.toLocaleString()} units)`, 14, finalY);
  doc.text(`Total Inventory Cost Valuation: TZS ${totalCost.toLocaleString()}`, 14, finalY + 6);
  doc.text(`Estimated Retail Realization: TZS ${totalRetail.toLocaleString()}`, 14, finalY + 12);

  const blob = doc.output('blob');
  let driveUrl: string | undefined;

  try {
    const upload = await uploadToDrive({
      file: blob,
      fileName,
      mimeType: 'application/pdf',
      folderCategory: 'Stock Reports'
    });
    driveUrl = upload.webViewLink;

    await logActivity({
      user_id: auth.currentUser?.uid || 'system',
      user_name: auth.currentUser?.displayName || 'System',
      action: 'REPORT_EXPORTED',
      module: 'Reports',
      description: `Exported Stock Valuation Report to Google Drive (${fileName})`
    });
  } catch (e: any) {
    console.warn('[Report] Drive upload notice:', e.message);
  }

  return { fileName, driveUrl, blob };
}

/**
 * Generate Customer Debt & Receivables Aging Report PDF and export to Google Drive
 */
export async function exportCustomerDebtReport(): Promise<{ fileName: string; driveUrl?: string; blob: Blob }> {
  const customers = await getCustomers();
  const debtors = customers.filter(c => c.outstanding_balance > 0);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const fileName = `GIEZRA_DEBTORS_REPORT_${new Date().toISOString().split('T')[0]}.pdf`;

  // Header
  doc.setFillColor(180, 40, 40); // Dark Crimson
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('GIEZRA FARMS LIMITED', 14, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Customer Outstanding Receivables & Debt Schedule — ${new Date().toLocaleDateString('en-GB')}`, 14, 23);

  const totalDebt = debtors.reduce((a, c) => a + c.outstanding_balance, 0);

  const tableData = debtors.map((c, idx) => [
    idx + 1,
    c.customer_name,
    c.customer_type,
    c.phone,
    `TZS ${c.credit_limit.toLocaleString()}`,
    `TZS ${c.outstanding_balance.toLocaleString()}`,
    c.outstanding_balance > c.credit_limit ? 'EXCEEDED' : 'WITHIN LIMIT'
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['#', 'Customer / Business Name', 'Type', 'Phone', 'Credit Limit', 'Outstanding Debt (TZS)', 'Credit Status']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [180, 40, 40], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text(`Active Debtors: ${debtors.length} clients`, 14, finalY);
  doc.text(`Total Outstanding Receivables: TZS ${totalDebt.toLocaleString()}`, 14, finalY + 6);

  const blob = doc.output('blob');
  let driveUrl: string | undefined;

  try {
    const upload = await uploadToDrive({
      file: blob,
      fileName,
      mimeType: 'application/pdf',
      folderCategory: 'Sales Reports'
    });
    driveUrl = upload.webViewLink;

    await logActivity({
      user_id: auth.currentUser?.uid || 'system',
      user_name: auth.currentUser?.displayName || 'System',
      action: 'REPORT_EXPORTED',
      module: 'Reports',
      description: `Exported Customer Debt Aging Report to Google Drive (${fileName})`
    });
  } catch (e: any) {
    console.warn('[Report] Drive upload notice:', e.message);
  }

  return { fileName, driveUrl, blob };
}
