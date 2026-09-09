import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Folder, 
  FolderPlus, 
  FileText, 
  Upload, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  Plus, 
  ShieldCheck, 
  Trash2, 
  FileSpreadsheet, 
  Printer, 
  DollarSign, 
  Database, 
  Building2, 
  Layers, 
  Clock, 
  Calendar,
  Lock,
  Loader2,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { checkDriveStatus, initializeFolderStructure } from '../../services/driveService';
import { signInWithGoogle, getGoogleAccessToken } from '../../services/googleAuth';
import { subscribeInvoices, FirestoreInvoice } from '../../services/invoiceService';
import { subscribeQuotations, createAndStoreQuotation, FirestoreQuotation, QuotationItem } from '../../services/quotationService';
import { subscribeBusinessDocuments, uploadBusinessDocument, deleteBusinessDocument, FirestoreDocument } from '../../services/documentService';
import { exportStockValuationReport, exportCustomerDebtReport } from '../../services/reportService';
import { subscribeBackups, createDatabaseBackup, FirestoreBackup } from '../../services/backupService';
import { getCustomers, FirestoreCustomer } from '../../services/customerService';
import { getProducts, FirestoreProduct } from '../../services/productService';

export const DocumentAndDriveView: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'quotations' | 'documents' | 'reports' | 'backups'>('invoices');

  // Drive state
  const [driveConnected, setDriveConnected] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [folderStatus, setFolderStatus] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Collections data
  const [invoices, setInvoices] = useState<FirestoreInvoice[]>([]);
  const [quotations, setQuotations] = useState<FirestoreQuotation[]>([]);
  const [documents, setDocuments] = useState<FirestoreDocument[]>([]);
  const [backups, setBackups] = useState<FirestoreBackup[]>([]);
  const [customers, setCustomers] = useState<FirestoreCustomer[]>([]);
  const [products, setProducts] = useState<FirestoreProduct[]>([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & form state
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Quotation form
  const [quoteCustomerId, setQuoteCustomerId] = useState('');
  const [quoteValidDays, setQuoteValidDays] = useState(14);
  const [quoteDiscount, setQuoteDiscount] = useState(0);
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteItems, setQuoteItems] = useState<QuotationItem[]>([
    { product_name: 'Whole Dressed Chicken (Broiler 1.2kg)', unit: 'kg', quantity: 50, unit_price: 9500, total_price: 475000 }
  ]);

  // Upload Doc form
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<FirestoreDocument['document_type']>('Farm Permit');
  const [docCustomName, setDocCustomName] = useState('');
  const [docNotes, setDocNotes] = useState('');

  // Check Drive Status
  const refreshDriveStatus = async () => {
    const status = await checkDriveStatus();
    setDriveConnected(status.connected);
    setFolderStatus(status);
  };

  useEffect(() => {
    refreshDriveStatus();

    // Subscribe to Firestore collections
    const unsubInvoices = subscribeInvoices(setInvoices);
    const unsubQuotations = subscribeQuotations(setQuotations);
    const unsubDocs = subscribeBusinessDocuments(setDocuments);
    const unsubBackups = subscribeBackups(setBackups);

    // Fetch customers & products for quotation builder
    getCustomers().then(setCustomers).catch(() => {});
    getProducts().then(setProducts).catch(() => {});

    return () => {
      unsubInvoices();
      unsubQuotations();
      unsubDocs();
      unsubBackups();
    };
  }, []);

  const handleConnectDrive = async () => {
    try {
      setIsAuthorizing(true);
      setStatusMessage(null);
      await signInWithGoogle();
      await initializeFolderStructure();
      await refreshDriveStatus();
      setStatusMessage('Google Drive connected successfully. Root folders verified.');
    } catch (err: any) {
      setStatusMessage(`Google Drive connection error: ${err.message}`);
    } finally {
      setIsAuthorizing(false);
    }
  };

  // Add Item to Quotation
  const handleAddQuoteItem = () => {
    setQuoteItems([
      ...quoteItems,
      { product_name: products[0]?.product_name || 'Poultry Cut', unit: 'kg', quantity: 10, unit_price: 9000, total_price: 90000 }
    ]);
  };

  const handleRemoveQuoteItem = (index: number) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== index));
  };

  const handleUpdateQuoteItem = (index: number, field: keyof QuotationItem, value: any) => {
    const updated = [...quoteItems];
    const item = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      item.total_price = Number(item.quantity) * Number(item.unit_price);
    }
    updated[index] = item;
    setQuoteItems(updated);
  };

  // Submit Quotation
  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteCustomerId) {
      alert('Please select a customer for this quotation');
      return;
    }
    const customer = customers.find(c => c.customer_id === quoteCustomerId);
    try {
      setIsProcessing(true);
      setStatusMessage(null);
      const quote = await createAndStoreQuotation({
        customer_id: quoteCustomerId,
        customer_name: customer?.customer_name || 'Commercial Client',
        valid_days: quoteValidDays,
        items: quoteItems,
        discount: Number(quoteDiscount),
        notes: quoteNotes
      });
      setShowQuotationModal(false);
      setStatusMessage(`Quotation ${quote.quotation_number} generated and synced to Google Drive.`);
    } catch (err: any) {
      alert(`Error creating quotation: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Upload Business Document
  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }
    try {
      setIsProcessing(true);
      setStatusMessage(null);
      const docRecord = await uploadBusinessDocument({
        file: selectedFile,
        documentType: docType,
        customName: docCustomName.trim() || undefined,
        notes: docNotes.trim() || undefined
      });
      setSelectedFile(null);
      setDocCustomName('');
      setDocNotes('');
      setShowUploadDocModal(false);
      setStatusMessage(`Document "${docRecord.document_name}" uploaded to Google Drive.`);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Export Reports
  const handleExportStockReport = async () => {
    try {
      setIsProcessing(true);
      const result = await exportStockValuationReport();
      setStatusMessage(`Stock Valuation Report exported (${result.fileName}). Available in Google Drive.`);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportDebtReport = async () => {
    try {
      setIsProcessing(true);
      const result = await exportCustomerDebtReport();
      setStatusMessage(`Customer Debt Aging Report exported (${result.fileName}). Available in Google Drive.`);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Create Database Backup
  const handleCreateBackup = async (format: 'JSON' | 'CSV') => {
    try {
      setIsProcessing(true);
      const bkp = await createDatabaseBackup(format);
      setStatusMessage(`Full Database snapshot created (${bkp.file_name}) with ${bkp.record_count} records. Saved in Google Drive.`);
    } catch (err: any) {
      alert(`Backup failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Google Drive Cloud Status */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    Google Drive Document Repository
                  </h2>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    driveConnected 
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700' 
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700'
                  }`}>
                    {driveConnected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {driveConnected ? 'Drive Connected & Active' : 'Drive Sync Ready'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target Cloud: Google Drive <span className="font-mono text-slate-700 dark:text-slate-300">giezrafarmslimited@gmail.com</span> | Root: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">GIEZRA FARMS</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshDriveStatus}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all text-xs flex items-center gap-1.5"
              title="Refresh status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {!driveConnected ? (
              <button
                onClick={handleConnectDrive}
                disabled={isAuthorizing}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
              >
                {isAuthorizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                <span>Authorize Google Drive</span>
              </button>
            ) : (
              <a
                href="https://drive.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Google Drive</span>
              </a>
            )}
          </div>
        </div>

        {/* Status notice */}
        {statusMessage && (
          <div className="mt-4 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-blue-500 hover:text-blue-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Subfolders Grid */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { name: 'Invoices', count: invoices.length, folder: 'Invoices / 2026' },
            { name: 'Quotations', count: quotations.length, folder: 'Quotations' },
            { name: 'Sales Reports', count: 'Live', folder: 'Sales Reports' },
            { name: 'Stock Reports', count: 'Live', folder: 'Stock Reports' },
            { name: 'Production', count: 'Live', folder: 'Production Reports' },
            { name: 'Customer Docs', count: customers.length, folder: 'Customer Documents' },
            { name: 'Permits & Certs', count: documents.length, folder: 'Business Documents' },
            { name: 'Backups', count: backups.length, folder: 'Backups' },
          ].map((f, i) => (
            <div key={i} className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 text-center space-y-1">
              <Folder className="w-4 h-4 mx-auto text-blue-500" />
              <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{f.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">{f.count} items</div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('invoices')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'invoices'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Invoices ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('quotations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'quotations'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Quotations ({quotations.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('documents')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'documents'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Corporate Documents ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'reports'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Cloud Reports Export</span>
        </button>

        <button
          onClick={() => setActiveSubTab('backups')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'backups'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database Backups ({backups.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: INVOICES */}
      {activeSubTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search invoice number, customer..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-xs text-slate-500">
              All invoices stored in Cloud Firestore and auto-archived into Google Drive <span className="font-mono text-emerald-600">GIEZRA FARMS / Invoices</span>
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Invoice #</th>
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Date Issued</th>
                    <th className="p-4">Total Amount (TZS)</th>
                    <th className="p-4">Payment Status</th>
                    <th className="p-4">Google Drive Link</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {invoices
                    .filter(inv => 
                      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(inv => (
                      <tr key={inv.invoice_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {inv.invoice_number}
                        </td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">
                          {inv.customer_name}
                        </td>
                        <td className="p-4 text-slate-500">
                          {new Date(inv.created_at).toLocaleDateString('en-GB')}
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                          TZS {inv.total_amount.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'PAID' 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                              : inv.status === 'PARTIAL' 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {inv.drive_file_url ? (
                            <a
                              href={inv.drive_file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>View in Drive</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">Cloud local</span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {inv.download_url ? (
                            <a
                              href={inv.download_url}
                              download={`${inv.invoice_number}.pdf`}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 inline-flex items-center"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          ) : null}
                          <button
                            onClick={() => window.print()}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 inline-flex items-center"
                            title="Print"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No invoices registered in Firestore yet. Create a sales order to generate an invoice.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: QUOTATIONS */}
      {activeSubTab === 'quotations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search quotations..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
              />
            </div>
            <button
              onClick={() => setShowQuotationModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Quotation</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Quotation #</th>
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Valid Until</th>
                    <th className="p-4">Quoted Amount (TZS)</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Google Drive</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {quotations
                    .filter(q => 
                      q.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      q.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(q => (
                      <tr key={q.quotation_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {q.quotation_number}
                        </td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">
                          {q.customer_name}
                        </td>
                        <td className="p-4 text-slate-500">
                          {new Date(q.valid_until).toLocaleDateString('en-GB')}
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                          TZS {q.total.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            {q.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {q.drive_file_url ? (
                            <a
                              href={q.drive_file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>View in Drive</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">Cloud stored</span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {q.download_url ? (
                            <a
                              href={q.download_url}
                              download={`${q.quotation_number}.pdf`}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 inline-flex items-center"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          ) : null}
                          <button
                            onClick={() => window.print()}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 inline-flex items-center"
                            title="Print"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {quotations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No sales quotations generated yet. Click "Create New Quotation" to generate your first quote.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CORPORATE DOCUMENTS */}
      {activeSubTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search documents by name or type..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
              />
            </div>
            <button
              onClick={() => setShowUploadDocModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document to Drive</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents
              .filter(d => 
                d.document_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                d.document_type.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(docItem => (
                <div key={docItem.document_id} className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {docItem.document_type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {(docItem.file_size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate" title={docItem.document_name}>
                      {docItem.document_name}
                    </h4>
                    {docItem.notes && (
                      <p className="text-xs text-slate-500 line-clamp-2">{docItem.notes}</p>
                    )}
                    <div className="text-[11px] text-slate-400">
                      Uploaded by {docItem.uploaded_by} on {new Date(docItem.created_at).toLocaleDateString('en-GB')}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <a
                      href={docItem.drive_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Preview in Drive</span>
                    </a>
                    <button
                      onClick={() => {
                        if (confirm(`Remove document record "${docItem.document_name}"?`)) {
                          deleteBusinessDocument(docItem.document_id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            {documents.length === 0 && (
              <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 space-y-2">
                <ShieldCheck className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-bold">No compliance or legal documents stored yet.</p>
                <p className="text-xs">Upload farm permits, health certificates, and supplier agreements directly to Google Drive.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: REPORTS EXPORT */}
      {activeSubTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stock Valuation Report Box */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Inventory Stock Valuation Report
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time stock valuation across all 19 poultry SKUs
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Generates an itemized PDF report calculating unit cost valuation, retail realization, reorder alerts, and cold-room distribution. Exports directly to <span className="font-mono font-bold text-emerald-600">GIEZRA FARMS / Stock Reports</span> in Google Drive.
            </p>
            <button
              onClick={handleExportStockReport}
              disabled={isProcessing}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
              <span>Export Stock Report to Google Drive</span>
            </button>
          </div>

          {/* Customer Debt & Aging Report Box */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Customer Debt & Receivables Aging
                </h3>
                <p className="text-xs text-slate-500">
                  Comprehensive outstanding balance and credit limits audit
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Produces an official debt recovery report listing all wholesale clients with pending receivables, credit limit compliance, and payment histories. Exports directly to <span className="font-mono font-bold text-rose-600">GIEZRA FARMS / Sales Reports</span> in Google Drive.
            </p>
            <button
              onClick={handleExportDebtReport}
              disabled={isProcessing}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
              <span>Export Debt Report to Google Drive</span>
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: DATABASE BACKUPS */}
      {activeSubTab === 'backups' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Cloud Database Snapshots & Backups
              </h3>
              <p className="text-xs text-slate-500">
                Exports complete live Firestore collections into JSON or CSV and syncs to <span className="font-mono text-blue-600">GIEZRA FARMS / Backups</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleCreateBackup('JSON')}
                disabled={isProcessing}
                className="px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                <span>Snapshot (JSON)</span>
              </button>
              <button
                onClick={() => handleCreateBackup('CSV')}
                disabled={isProcessing}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                <span>Snapshot (CSV)</span>
              </button>
            </div>
          </div>

          {/* Backup History Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Backup File Name</th>
                    <th className="p-4">Format</th>
                    <th className="p-4">Records Captured</th>
                    <th className="p-4">Created By</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4 text-right">Drive Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {backups.map(bkp => (
                    <tr key={bkp.backup_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                        {bkp.file_name}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {bkp.format}
                        </span>
                      </td>
                      <td className="p-4 font-mono">
                        {bkp.record_count} records
                      </td>
                      <td className="p-4 text-slate-500">
                        {bkp.created_by}
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(bkp.created_at).toLocaleString('en-GB')}
                      </td>
                      <td className="p-4 text-right">
                        {bkp.drive_file_url ? (
                          <a
                            href={bkp.drive_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Drive Archive</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">Saved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {backups.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No database snapshots created yet. Click "Snapshot (JSON)" to create an archived backup of all Firestore records.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE QUOTATION MODAL */}
      {showQuotationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full my-auto p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Generate Price Quotation (GIEZRA-QUO)
                </h3>
              </div>
              <button onClick={() => setShowQuotationModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Customer Account *</label>
                <select
                  value={quoteCustomerId}
                  onChange={e => setQuoteCustomerId(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.customer_name} ({c.customer_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={quoteValidDays}
                    onChange={e => setQuoteValidDays(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Discount Offer (TZS)</label>
                  <input
                    type="number"
                    min="0"
                    value={quoteDiscount}
                    onChange={e => setQuoteDiscount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Quoted Poultry Items</label>
                  <button
                    type="button"
                    onClick={handleAddQuoteItem}
                    className="text-emerald-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Line Item
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {quoteItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                      <select
                        value={item.product_name}
                        onChange={e => handleUpdateQuoteItem(idx, 'product_name', e.target.value)}
                        className="flex-1 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      >
                        {products.map(p => (
                          <option key={p.product_id} value={p.product_name}>{p.product_name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={e => handleUpdateQuoteItem(idx, 'quantity', Number(e.target.value))}
                        className="w-16 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-right font-mono"
                      />
                      <input
                        type="number"
                        placeholder="Unit Price"
                        value={item.unit_price}
                        onChange={e => handleUpdateQuoteItem(idx, 'unit_price', Number(e.target.value))}
                        className="w-24 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-right font-mono"
                      />
                      <span className="w-24 text-right font-mono font-bold text-slate-900 dark:text-white">
                        TZS {item.total_price.toLocaleString()}
                      </span>
                      {quoteItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuoteItem(idx)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notes / Terms</label>
                <textarea
                  rows={2}
                  value={quoteNotes}
                  onChange={e => setQuoteNotes(e.target.value)}
                  placeholder="Special pricing terms, delivery requirements..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowQuotationModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                  <span>Generate & Sync Quotation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {showUploadDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full my-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Upload Corporate Document to Drive
                </h3>
              </div>
              <button onClick={() => setShowUploadDocModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDoc} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Document Category *</label>
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium"
                >
                  <option value="Farm Permit">Farm Permit</option>
                  <option value="Health Inspection">Health Inspection</option>
                  <option value="Food Safety Certificate">Food Safety Certificate</option>
                  <option value="Supplier Agreement">Supplier Agreement</option>
                  <option value="Customer Contract">Customer Contract</option>
                  <option value="Financial Audit">Financial Audit</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Document Custom Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., TBS_Quality_Permit_2026"
                  value={docCustomName}
                  onChange={e => setDocCustomName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select File (PDF, Images, Docs) *</label>
                <input
                  type="file"
                  required
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={docNotes}
                  onChange={e => setDocNotes(e.target.value)}
                  placeholder="Issuing authority, expiration date, compliance notes..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadDocModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>Upload & Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
