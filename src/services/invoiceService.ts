/**
 * Invoice Service - Giezra Farms Limited
 * PDF generation via jsPDF, direct upload to Google Drive, and Firestore metadata tracking
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { collection, doc, setDoc, getDocs, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { uploadToDrive } from './driveService';
import { logActivity } from './activityLogService';
import { auth } from './firebase';
import { FirestoreOrder } from './orderService';
import { DEFAULT_GIEZRA_SETTINGS } from './settingsService';

export interface FirestoreInvoice {
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  order_id: string;
  total: number;
  amount_paid: number;
  balance: number;
  drive_file_id?: string;
  drive_file_url?: string;
  download_url?: string;
  created_by: string;
  created_at: string;
}

const COLLECTION = 'invoices';

/**
 * Generate a professional Giezra Farms commercial PDF invoice and return as Blob
 */
export function generateInvoicePdfBlob(order: FirestoreOrder, companySettings = DEFAULT_GIEZRA_SETTINGS): { blob: Blob; fileName: string; doc: jsPDF } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const invoiceNumber = `GIEZRA-INV-${order.order_number.replace(/^GZ-ORD-/, '') || Date.now().toString().slice(-6)}`;
  const fileName = `${invoiceNumber}.pdf`;

  // Header Banner
  doc.setFillColor(26, 90, 48); // Forest Green
  doc.rect(0, 0, 210, 38, 'F');

  // Title & Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(companySettings.company_name.toUpperCase(), 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('POULTRY PRODUCTION, COLD-CHAIN SLAUGHTER & WHOLESALE PROCESSING', 14, 25);
  doc.text(`${companySettings.company_address} | Phone: ${companySettings.phone}`, 14, 31);

  // Invoice Title badge
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', 196, 20, { align: 'right' });
  doc.setFontSize(10);
  doc.text(invoiceNumber, 196, 28, { align: 'right' });

  // Bill To / Invoice Details Info Block
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('BILLED TO:', 14, 48);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(order.customer_name, 14, 54);
  doc.text('Tanzania Commercial Buyer', 14, 60);

  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE DETAILS:', 130, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice Date: ${order.order_date ? new Date(order.order_date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}`, 130, 54);
  doc.text(`Order Reference: ${order.order_number}`, 130, 60);
  doc.text(`Payment Terms: ${order.payment_status}`, 130, 66);

  // Table of Items
  const tableData = order.items.map((item, idx) => [
    idx + 1,
    item.product_name,
    item.unit || 'Kg',
    item.quantity.toLocaleString(),
    `TZS ${item.unit_price.toLocaleString()}`,
    `TZS ${item.total_price.toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 72,
    head: [['#', 'Description of Cuts / Poultry Products', 'Unit', 'Qty', 'Unit Price', 'Total (TZS)']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [26, 90, 48],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 20, halign: 'right' },
      4: { cellWidth: 32, halign: 'right' },
      5: { cellWidth: 34, halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Banking Details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT & BANKING DETAILS:', 14, finalY);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bank: ${companySettings.bank_name}`, 14, finalY + 5);
  doc.text(`Account Name: ${companySettings.account_name}`, 14, finalY + 10);
  doc.text(`Account Number: ${companySettings.account_number}`, 14, finalY + 15);
  doc.text(`SWIFT: ${companySettings.swift_code}`, 14, finalY + 20);

  // Totals Box
  const summaryX = 130;
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', summaryX, finalY + 5);
  doc.text(`TZS ${order.subtotal.toLocaleString()}`, 196, finalY + 5, { align: 'right' });

  if (order.discount > 0) {
    doc.text('Discount:', summaryX, finalY + 10);
    doc.text(`- TZS ${order.discount.toLocaleString()}`, 196, finalY + 10, { align: 'right' });
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL AMOUNT:', summaryX, finalY + 18);
  doc.text(`TZS ${order.total_amount.toLocaleString()}`, 196, finalY + 18, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Amount Paid:', summaryX, finalY + 24);
  doc.text(`TZS ${order.amount_paid.toLocaleString()}`, 196, finalY + 24, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('BALANCE DUE:', summaryX, finalY + 30);
  doc.setTextColor(order.balance > 0 ? 180 : 0, 0, 0);
  doc.text(`TZS ${order.balance.toLocaleString()}`, 196, finalY + 30, { align: 'right' });

  // Footer Note
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for choosing Giezra Farms Limited. Freshly processed premium poultry.', 105, 285, { align: 'center' });

  const blob = doc.output('blob');
  return { blob, fileName, doc };
}

/**
 * Generate invoice PDF, upload to Google Drive, and store metadata in Firestore
 */
export async function createAndStoreInvoice(order: FirestoreOrder): Promise<FirestoreInvoice> {
  const invoice_id = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const invoice_number = `GIEZRA-INV-${order.order_number.replace(/^GZ-ORD-/, '') || Date.now().toString().slice(-6)}`;
  const now = new Date().toISOString();
  const currentUser = auth.currentUser;
  const created_by = currentUser?.displayName || currentUser?.email || 'Billing Officer';

  // 1. Generate PDF in memory
  const { blob, fileName } = generateInvoicePdfBlob(order);

  // 2. Upload to Google Drive (if authorized)
  let drive_file_id = '';
  let drive_file_url = '';
  let download_url = '';

  try {
    const driveUpload = await uploadToDrive({
      file: blob,
      fileName,
      mimeType: 'application/pdf',
      folderCategory: 'Invoices'
    });
    drive_file_id = driveUpload.fileId;
    drive_file_url = driveUpload.webViewLink;
    download_url = driveUpload.webContentLink;
  } catch (driveErr: any) {
    console.warn('[Invoice] Google Drive upload notice (fallback local PDF available):', driveErr.message);
  }

  // 3. Save to Firestore
  const invoicePayload: FirestoreInvoice = {
    invoice_id,
    invoice_number,
    customer_id: order.customer_id,
    customer_name: order.customer_name,
    order_id: order.order_id,
    total: order.total_amount,
    amount_paid: order.amount_paid,
    balance: order.balance,
    drive_file_id: drive_file_id || undefined,
    drive_file_url: drive_file_url || undefined,
    download_url: download_url || undefined,
    created_by,
    created_at: now
  };

  try {
    const docRef = doc(db, COLLECTION, invoice_id);
    await setDoc(docRef, {
      ...invoicePayload,
      _timestamp: serverTimestamp()
    });

    await logActivity({
      user_id: currentUser?.uid || 'system',
      user_name: created_by,
      action: 'INVOICE_GENERATED',
      module: 'Invoices',
      record_id: invoice_id,
      description: `Generated invoice ${invoice_number} for order ${order.order_number} (Drive: ${drive_file_id ? 'Synced' : 'Local'})`
    });

    return invoicePayload;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTION}/${invoice_id}`);
  }
}

export async function getInvoices(): Promise<FirestoreInvoice[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as FirestoreInvoice);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION);
  }
}

export function subscribeInvoices(callback: (invoices: FirestoreInvoice[]) => void) {
  const q = query(collection(db, COLLECTION), orderBy('created_at', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => d.data() as FirestoreInvoice));
  }, (error) => {
    console.error('Invoices listener error:', error);
  });
}
