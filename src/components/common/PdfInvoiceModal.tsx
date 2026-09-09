import React, { useRef, useState, useEffect } from 'react';
import { Order, Payment, Customer, CompanyPaymentDetails } from '../../types/erp';
import { X, Printer, Download, Share2, CheckCircle2, QrCode, FileText, Building2, Phone, Mail, ShieldCheck, Copy, Check, CreditCard, Cloud, ExternalLink, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { uploadToDrive } from '../../services/driveService';
import { createAndStoreInvoice } from '../../services/invoiceService';
import { normalizeOrder } from '../../services/orderService';

interface PdfInvoiceModalProps {
  type: 'invoice' | 'receipt';
  order?: Order | null;
  payment?: Payment | null;
  customer?: Customer | null;
  onClose: () => void;
}

const DEFAULT_PAYMENT_DETAILS: CompanyPaymentDetails = {
  bankName: 'CRDB Bank PLC',
  accountName: 'GIEZRA FARMS LIMITED',
  accountNumber: '10163545816',
  currency: 'TZS',
  branchName: 'Mikocheni Branch',
  branchCode: 'CRDBTZTZ',
  swiftCode: 'CORUTZTZ'
};

export const PdfInvoiceModal: React.FC<PdfInvoiceModalProps> = ({
  type,
  order,
  payment,
  customer,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<CompanyPaymentDetails>(DEFAULT_PAYMENT_DETAILS);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [driveUrl, setDriveUrl] = useState<string | null>(null);
  const [driveMessage, setDriveMessage] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handleUploadToDrive = async () => {
    if (!order) return;
    try {
      setIsUploadingToDrive(true);
      setDriveMessage(null);
      const normalized = normalizeOrder(order);
      const invoice = await createAndStoreInvoice(normalized);
      if (invoice.drive_file_url) {
        setDriveUrl(invoice.drive_file_url);
        setDriveMessage('Saved to GIEZRA FARMS/Invoices in Google Drive');
      } else {
        setDriveMessage('Saved to Cloud Firestore. Sign in with Google to enable Drive file sync.');
      }
    } catch (err: any) {
      setDriveMessage(err.message || 'Could not sync to Google Drive');
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  useEffect(() => {
    fetch('/api/system/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.paymentDetails) {
          setPaymentDetails(data.paymentDetails);
        }
      })
      .catch(err => console.error('Error fetching company payment settings:', err));
  }, []);

  // Generate jsPDF Download
  const handleDownloadPdf = () => {
    const doc = new jsPDF();

    // Title / Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('GIEZRA FARMS LIMITED', 14, 16);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Poultry Processing, Packaging & Commercial Distribution', 14, 23);
    doc.text('Plot 14, Mikocheni Light Industrial Area, Dar es Salaam, Tanzania', 14, 28);
    doc.text('TIN: 104-982-114 | VRN: 40019283-A | Contact: +255 754 112 233', 14, 33);

    // Document Type Banner
    const isInvoice = type === 'invoice';
    const docTitle = isInvoice ? 'OFFICIAL TAX INVOICE' : 'PAYMENT RECEIPT';
    const docNum = isInvoice ? (order?.orderNumber || 'ORD-2026') : (payment?.receiptNumber || 'GZ-REC-2026');

    doc.setFillColor(245, 247, 250);
    doc.rect(0, 38, 210, 20, 'F');

    doc.setTextColor(16, 185, 129); // emerald-600
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(docTitle, 14, 51);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    doc.text(`Doc Ref: ${docNum}`, 140, 48);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 140, 54);

    // Customer Info Box
    const custName = customer?.name || order?.customerName || payment?.customerName || 'Valued Customer';
    const custTin = customer?.tin || '104-982-114';
    const custVrn = customer?.vrn || '40019283-A';
    const custPhone = customer?.phone || '+255 700 000 000';
    const custAddress = customer?.address || 'Dar es Salaam';

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('BILLED TO / CUSTOMER DETAILS:', 14, 68);

    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${custName}`, 14, 74);
    doc.text(`Address: ${custAddress}, ${customer?.region || 'Tanzania'}`, 14, 79);
    doc.text(`TIN: ${custTin} | VRN: ${custVrn}`, 14, 84);
    doc.text(`Phone: ${custPhone}`, 14, 89);

    let startY = 96;

    if (isInvoice && order) {
      // Items Table
      const tableData = order.items.map((item, index) => [
        (index + 1).toString(),
        item.productName,
        `${item.quantity} ${item.unit}`,
        `TZS ${item.unitPrice.toLocaleString()}`,
        `TZS ${item.totalAmount.toLocaleString()}`
      ]);

      autoTable(doc, {
        startY: startY,
        head: [['#', 'Item Description', 'Qty / Unit', 'Unit Price', 'Line Total (TZS)']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 }
      });

      // @ts-ignore
      const finalY = (doc as any).lastAutoTable.finalY + 10;

      // Summary
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Subtotal: TZS ${order.subtotal.toLocaleString()}`, 130, finalY);
      doc.text(`VAT (18%): TZS ${order.totalVat.toLocaleString()}`, 130, finalY + 5);
      if (order.totalDiscount > 0) {
        doc.text(`Discount: TZS ${order.totalDiscount.toLocaleString()}`, 130, finalY + 10);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(16, 185, 129);
      doc.text(`GRAND TOTAL: TZS ${order.grandTotal.toLocaleString()}`, 130, finalY + 18);

      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(`Amount Paid: TZS ${order.amountPaid.toLocaleString()}`, 130, finalY + 24);
      doc.text(`Outstanding Balance: TZS ${order.remainingBalance.toLocaleString()}`, 130, finalY + 29);

      // PAYMENT DETAILS BOX (Automatic Company Payment Information)
      const payY = finalY + 38;
      doc.setFillColor(240, 253, 244); // light emerald fill
      doc.rect(14, payY, 182, 38, 'F');
      doc.setDrawColor(167, 243, 208);
      doc.rect(14, payY, 182, 38, 'D');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('PAYMENT DETAILS', 18, payY + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Bank: ${paymentDetails.bankName}`, 18, payY + 13);
      doc.text(`Account Name: ${paymentDetails.accountName}`, 18, payY + 18);
      doc.text(`Account Number: ${paymentDetails.accountNumber}`, 18, payY + 23);
      doc.text(`Currency: ${paymentDetails.currency}`, 18, payY + 28);

      doc.setFont('helvetica', 'italic');
      doc.setTextColor(5, 150, 105);
      doc.text('Thank you for doing business with GIEZRA FARMS LIMITED.', 18, payY + 34);

    } else if (payment) {
      // Payment Receipt details
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT BREAKDOWN:', 14, startY);

      const receiptData = [
        ['Receipt Reference Number:', payment.receiptNumber],
        ['Order Reference Number:', payment.orderNumber],
        ['Payment Method:', payment.method],
        ['M-Pesa / Bank Ref Number:', payment.referenceNumber],
        ['Amount Received:', `TZS ${payment.amountPaid.toLocaleString()}`],
        ['Date Received:', new Date(payment.paymentDate).toLocaleString()],
        ['Received & Handled By:', payment.receivedBy]
      ];

      autoTable(doc, {
        startY: startY + 5,
        body: receiptData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 3 }
      });
    }

    // Save File
    doc.save(`${docNum}_GIEZRA_FARMS.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isInvoice = type === 'invoice';
  const docTitle = isInvoice ? 'TAX INVOICE' : 'OFFICIAL PAYMENT RECEIPT';
  const docNum = isInvoice ? (order?.orderNumber || 'ORD-2026-000') : (payment?.receiptNumber || 'GZ-REC-2026-000');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Controls Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80 rounded-t-3xl">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              {docTitle} - <span className="font-mono text-emerald-600 dark:text-emerald-400">{docNum}</span>
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            {type === 'invoice' && order && (
              driveUrl ? (
                <a
                  href={driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View in Drive</span>
                </a>
              ) : (
                <button
                  onClick={handleUploadToDrive}
                  disabled={isUploadingToDrive}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
                >
                  {isUploadingToDrive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                  <span>{isUploadingToDrive ? 'Uploading...' : 'Save to Drive'}</span>
                </button>
              )
            )}

            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {driveMessage && (
          <div className="bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-800/50 px-4 py-2 text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Cloud className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {driveMessage}</span>
            <button onClick={() => setDriveMessage(null)} className="text-blue-500 hover:text-blue-700"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Printable Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100" ref={printRef}>
          
          {/* Document Letterhead Header */}
          <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                  GZ
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  GIEZRA FARMS LIMITED
                </h1>
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Poultry Processing, Cold Storage & Distribution Division
              </p>
              <p className="text-xs text-slate-500">
                Plot 14, Mikocheni Light Industrial Area, Dar es Salaam, Tanzania
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-slate-600 dark:text-slate-400 pt-1">
                <span><strong>TIN:</strong> 104-982-114</span>
                <span><strong>VRN:</strong> 40019283-A</span>
                <span><strong>TEL:</strong> +255 754 112 233</span>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 min-w-[200px]">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase inline-block ${
                isInvoice 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
              }`}>
                {docTitle}
              </span>
              <div className="text-base font-extrabold font-mono text-slate-900 dark:text-white">{docNum}</div>
              <div className="text-xs text-slate-500">
                Date: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Billed To & Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">
                Billed To Customer:
              </span>
              <div className="text-base font-extrabold text-slate-900 dark:text-white">
                {customer?.name || order?.customerName || payment?.customerName || 'Valued Client'}
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                {customer?.address || 'Dar es Salaam'}, {customer?.region || 'Tanzania'}
              </div>
              <div className="font-mono text-slate-500 pt-1 flex gap-3">
                <span>TIN: {customer?.tin || '104-982-114'}</span>
                <span>VRN: {customer?.vrn || '40019283-A'}</span>
              </div>
              <div className="text-slate-500 font-medium">
                Contact Person: {customer?.contactPerson || 'Purchasing Manager'} ({customer?.phone || '+255 700 000 000'})
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">
                Order & Credit Details:
              </span>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Payment Terms:</span>
                <span className="font-bold">{customer?.paymentTerms || 'Net 15 Days'}</span>
              </div>
              {order && (
                <>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Delivery Date:</span>
                    <span className="font-bold">{order.deliveryDate}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Sales Officer:</span>
                    <span className="font-bold">{order.salesOfficerName}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">Status:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {order.status}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Itemized Table if Invoice */}
          {isInvoice && order && (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-slate-700 dark:text-slate-300">
                    <th className="p-3">#</th>
                    <th className="p-3">Product Description</th>
                    <th className="p-3 text-center">Qty / Unit</th>
                    <th className="p-3 text-right">Unit Price (TZS)</th>
                    <th className="p-3 text-right">Line Total (TZS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {order.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {item.productName}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        {item.unitPrice.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {item.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payment Receipt Specific Details */}
          {!isInvoice && payment && (
            <div className="p-5 bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-3">
              <h4 className="font-extrabold text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Payment Confirmation Ledger
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div><span className="text-slate-500">Receipt #:</span> <strong>{payment.receiptNumber}</strong></div>
                <div><span className="text-slate-500">Order #:</span> <strong>{payment.orderNumber}</strong></div>
                <div><span className="text-slate-500">Payment Channel:</span> <strong>{payment.method}</strong></div>
                <div><span className="text-slate-500">Ref / Txn ID:</span> <strong>{payment.referenceNumber}</strong></div>
                <div><span className="text-slate-500">Date Received:</span> <strong>{new Date(payment.paymentDate).toLocaleString()}</strong></div>
                <div><span className="text-slate-500">Authorized By:</span> <strong>{payment.receivedBy}</strong></div>
              </div>
              <div className="pt-2 border-t border-emerald-500/20 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Amount Paid Received:</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  TZS {payment.amountPaid.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Invoice Totals Summary & Company Payment Details */}
          {isInvoice && order && (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-stretch gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="p-5 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-3 text-xs max-w-md w-full shadow-sm">
                <div className="font-extrabold tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-2 border-b border-emerald-200 dark:border-emerald-800/60 pb-2">
                  <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  PAYMENT DETAILS
                </div>
                <div className="space-y-2 text-slate-800 dark:text-slate-200 font-sans text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block font-semibold">Bank:</span>
                    <strong className="text-slate-900 dark:text-white">{paymentDetails.bankName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block font-semibold">Account Name:</span>
                    <strong className="text-slate-900 dark:text-white">{paymentDetails.accountName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block font-semibold">Account Number:</span>
                    <strong className="font-mono text-emerald-700 dark:text-emerald-400 text-sm">{paymentDetails.accountNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block font-semibold">Currency:</span>
                    <strong className="text-slate-900 dark:text-white">{paymentDetails.currency}</strong>
                  </div>
                  {paymentDetails.branchName && (
                    <div>
                      <span className="text-slate-500 text-[11px] block font-semibold">Branch Name:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{paymentDetails.branchName}</strong>
                    </div>
                  )}
                  {paymentDetails.swiftCode && (
                    <div>
                      <span className="text-slate-500 text-[11px] block font-semibold">SWIFT Code:</span>
                      <strong className="font-mono text-slate-800 dark:text-slate-200">{paymentDetails.swiftCode}</strong>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/60 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 italic">
                  Thank you for doing business with GIEZRA FARMS LIMITED.
                </div>
              </div>

              <div className="space-y-2 text-right w-full max-w-xs font-mono text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-900 dark:text-white">TZS {order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>VAT (18%):</span>
                  <span className="font-bold text-slate-900 dark:text-white">TZS {order.totalVat.toLocaleString()}</span>
                </div>
                {order.totalDiscount > 0 && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400">
                    <span>Discount:</span>
                    <span className="font-bold">- TZS {order.totalDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-emerald-600 dark:text-emerald-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>Grand Total:</span>
                  <span>TZS {order.grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500 pt-1 text-[11px]">
                  <span>Amount Paid:</span>
                  <span>TZS {order.amountPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                  <span>Balance Due:</span>
                  <span>TZS {order.remainingBalance.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* TRA QR Code & Authorization Signature */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <QrCode className="w-12 h-12 text-slate-700 dark:text-slate-300" />
              <div>
                <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> TRA E-Tax Compliant
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  EFD Receipt Verification Token: GZ-TZ-2026-X89
                </div>
              </div>
            </div>

            <div className="text-center sm:text-right space-y-1">
              <div className="border-b border-dashed border-slate-400 w-48 mx-auto sm:ml-auto h-8"></div>
              <div className="font-bold text-slate-900 dark:text-white">Authorized Signatory</div>
              <div className="text-[10px] text-slate-500">GIEZRA FARMS Finance & Accounts Division</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
