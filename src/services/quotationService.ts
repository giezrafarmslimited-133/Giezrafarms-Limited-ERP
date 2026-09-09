/**
 * Quotation Service - Giezra Farms Limited
 * Price quotation PDF generation, Google Drive synchronization, and Firestore metadata tracking
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { collection, doc, setDoc, getDocs, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { uploadToDrive } from './driveService';
import { logActivity } from './activityLogService';
import { auth } from './firebase';
import { DEFAULT_GIEZRA_SETTINGS } from './settingsService';

export interface QuotationItem {
  product_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface FirestoreQuotation {
  quotation_id: string;
  quotation_number: string;
  customer_id: string;
  customer_name: string;
  valid_until: string;
  items: QuotationItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: QuotationStatus;
  notes?: string;
  drive_file_id?: string;
  drive_file_url?: string;
  download_url?: string;
  created_by: string;
  created_at: string;
}

const COLLECTION = 'quotations';

export function generateQuotationPdfBlob(quote: Omit<FirestoreQuotation, 'drive_file_id' | 'drive_file_url' | 'download_url'>, companySettings = DEFAULT_GIEZRA_SETTINGS): { blob: Blob; fileName: string; doc: jsPDF } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const fileName = `${quote.quotation_number}.pdf`;

  // Header Banner - Navy Blue for Quotation distinction
  doc.setFillColor(31, 78, 120);
  doc.rect(0, 0, 210, 38, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(companySettings.company_name.toUpperCase(), 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('PREMIUM COMMERCIAL POULTRY & WHOLESALE SUPPLY PROPOSAL', 14, 25);
  doc.text(`${companySettings.company_address} | Phone: ${companySettings.phone}`, 14, 31);

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PRICE QUOTATION', 196, 20, { align: 'right' });
  doc.setFontSize(10);
  doc.text(quote.quotation_number, 196, 28, { align: 'right' });

  // Client info
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPOSAL PREPARED FOR:', 14, 48);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(quote.customer_name, 14, 54);
  doc.text('Commercial Client Account', 14, 60);

  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION DETAILS:', 130, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(`Issue Date: ${new Date(quote.created_at).toLocaleDateString('en-GB')}`, 130, 54);
  doc.text(`Valid Until: ${new Date(quote.valid_until).toLocaleDateString('en-GB')}`, 130, 60);
  doc.text(`Status: ${quote.status}`, 130, 66);

  // Table
  const tableData = quote.items.map((it, idx) => [
    idx + 1,
    it.product_name,
    it.unit,
    it.quantity.toLocaleString(),
    `TZS ${it.unit_price.toLocaleString()}`,
    `TZS ${it.total_price.toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 72,
    head: [['#', 'Item / Poultry Product Cut', 'Unit', 'Estimated Qty', 'Unit Price', 'Quoted Amount (TZS)']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [31, 78, 120],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 32, halign: 'right' },
      5: { cellWidth: 32, halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Notes & terms
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TERMS & CONDITIONS:', 14, finalY);
  doc.setFont('helvetica', 'normal');
  doc.text('1. Prices are valid until the specified expiry date.', 14, finalY + 5);
  doc.text('2. Delivery terms: Cold-chain refrigerated truck delivery included for orders above minimum threshold.', 14, finalY + 10);
  doc.text('3. Payment terms as agreed upon formal purchase order submission.', 14, finalY + 15);

  // Totals Box
  const summaryX = 130;
  doc.text('Subtotal:', summaryX, finalY + 5);
  doc.text(`TZS ${quote.subtotal.toLocaleString()}`, 196, finalY + 5, { align: 'right' });

  if (quote.discount > 0) {
    doc.text('Discount Offer:', summaryX, finalY + 10);
    doc.text(`- TZS ${quote.discount.toLocaleString()}`, 196, finalY + 10, { align: 'right' });
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL ESTIMATE:', summaryX, finalY + 18);
  doc.text(`TZS ${quote.total.toLocaleString()}`, 196, finalY + 18, { align: 'right' });

  const blob = doc.output('blob');
  return { blob, fileName, doc };
}

export async function createAndStoreQuotation(quoteData: {
  customer_id: string;
  customer_name: string;
  valid_days?: number;
  items: QuotationItem[];
  discount?: number;
  notes?: string;
}): Promise<FirestoreQuotation> {
  const quotation_id = `quo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const quotation_number = `GIEZRA-QUO-${Date.now().toString().slice(-6)}`;
  const now = new Date();
  const validUntil = new Date(now.getTime() + (quoteData.valid_days || 14) * 24 * 60 * 60 * 1000).toISOString();
  const subtotal = quoteData.items.reduce((acc, it) => acc + it.total_price, 0);
  const discount = Number(quoteData.discount || 0);
  const total = Math.max(0, subtotal - discount);
  const currentUser = auth.currentUser;
  const created_by = currentUser?.displayName || currentUser?.email || 'Sales Desk';

  const baseQuote: FirestoreQuotation = {
    quotation_id,
    quotation_number,
    customer_id: quoteData.customer_id,
    customer_name: quoteData.customer_name,
    valid_until: validUntil,
    items: quoteData.items,
    subtotal,
    discount,
    total,
    status: 'SENT',
    notes: quoteData.notes || '',
    created_by,
    created_at: now.toISOString()
  };

  // 1. Generate PDF
  const { blob, fileName } = generateQuotationPdfBlob(baseQuote);

  // 2. Upload to Drive Quotations folder
  let drive_file_id = '';
  let drive_file_url = '';
  let download_url = '';

  try {
    const driveUpload = await uploadToDrive({
      file: blob,
      fileName,
      mimeType: 'application/pdf',
      folderCategory: 'Quotations'
    });
    drive_file_id = driveUpload.fileId;
    drive_file_url = driveUpload.webViewLink;
    download_url = driveUpload.webContentLink;
  } catch (driveErr: any) {
    console.warn('[Quotation] Drive upload notice:', driveErr.message);
  }

  // 3. Save metadata to Firestore
  const payload: FirestoreQuotation = {
    ...baseQuote,
    drive_file_id: drive_file_id || undefined,
    drive_file_url: drive_file_url || undefined,
    download_url: download_url || undefined
  };

  try {
    const docRef = doc(db, COLLECTION, quotation_id);
    await setDoc(docRef, {
      ...payload,
      _timestamp: serverTimestamp()
    });

    await logActivity({
      user_id: currentUser?.uid || 'system',
      user_name: created_by,
      action: 'QUOTATION_CREATED',
      module: 'Quotations',
      record_id: quotation_id,
      description: `Created quotation ${quotation_number} for customer "${payload.customer_name}" totaling TZS ${total.toLocaleString()}`
    });

    return payload;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTION}/${quotation_id}`);
  }
}

export async function getQuotations(): Promise<FirestoreQuotation[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as FirestoreQuotation);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION);
  }
}

export function subscribeQuotations(callback: (quotes: FirestoreQuotation[]) => void) {
  const q = query(collection(db, COLLECTION), orderBy('created_at', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => d.data() as FirestoreQuotation));
  }, (error) => {
    console.error('Quotations listener error:', error);
  });
}
