import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  X, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  CreditCard,
  Hash
} from 'lucide-react';
import { ExpenseEntry } from '../../../types/erp';

interface ExpenseVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingExpense?: ExpenseEntry | null;
  initialBatchId?: string;
  availableBatches?: string[];
  userRole?: string;
  userName?: string;
  userId?: string;
}

export const ExpenseVoucherModal: React.FC<ExpenseVoucherModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingExpense,
  initialBatchId = '',
  availableBatches = [],
  userRole = 'OPERATIONS_MANAGER',
  userName = 'Operations Officer',
  userId = 'usr_ops_01'
}) => {
  const [category, setCategory] = useState<ExpenseEntry['category']>('Feed & Veterinary');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [batchId, setBatchId] = useState<string>(initialBatchId);
  const [paymentMethod, setPaymentMethod] = useState<'CRDB Bank' | 'NMB Bank' | 'M-Pesa Till' | 'Cash' | 'Cheque'>('CRDB Bank');
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize form if editing or if initialBatchId provided
  useEffect(() => {
    if (editingExpense) {
      setCategory(editingExpense.category);
      setAmount(editingExpense.amount);
      setDate(editingExpense.date);
      setBatchId(editingExpense.batchId || '');
      setPaymentMethod(editingExpense.paymentMethod || 'CRDB Bank');
      setReceiptNumber(editingExpense.receiptNumber || '');
      setNotes(editingExpense.notes || '');
    } else if (initialBatchId) {
      setBatchId(initialBatchId);
    } else {
      // Load draft if available
      try {
        const draft = localStorage.getItem('giezra_expense_draft');
        if (draft) {
          const parsed = JSON.parse(draft);
          if (parsed.category) setCategory(parsed.category);
          if (parsed.amount) setAmount(Number(parsed.amount) || 0);
          if (parsed.date) setDate(parsed.date);
          if (parsed.batchId) setBatchId(parsed.batchId);
          if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
          if (parsed.receiptNumber) setReceiptNumber(parsed.receiptNumber);
          if (parsed.notes) setNotes(parsed.notes);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [editingExpense, initialBatchId, isOpen]);

  // Draft auto-save
  useEffect(() => {
    if (!editingExpense && (amount > 0 || notes || batchId || receiptNumber)) {
      localStorage.setItem('giezra_expense_draft', JSON.stringify({
        category,
        amount,
        date,
        batchId,
        paymentMethod,
        receiptNumber,
        notes
      }));
    }
  }, [category, amount, date, batchId, paymentMethod, receiptNumber, notes, editingExpense]);

  if (!isOpen) return null;

  const handleDiscardDraft = () => {
    localStorage.removeItem('giezra_expense_draft');
    setCategory('Feed & Veterinary');
    setAmount(0);
    setDate(new Date().toISOString().split('T')[0]);
    setBatchId('');
    setPaymentMethod('CRDB Bank');
    setReceiptNumber('');
    setNotes('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setErrorMsg('Expense amount must be a positive number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const url = editingExpense 
        ? `/api/financials/expenses/${editingExpense.id}`
        : '/api/financials/expenses';
      
      const method = editingExpense ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole,
          'x-user-id': userId,
          'x-user-name': userName
        },
        body: JSON.stringify({
          category,
          amount,
          date,
          batchId: batchId.trim() || undefined,
          paymentMethod,
          receiptNumber: receiptNumber.trim() || undefined,
          notes: notes.trim() || undefined
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save expense voucher');
      }

      localStorage.removeItem('giezra_expense_draft');
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving expense voucher');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 relative">
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {editingExpense ? `Edit Expense Voucher #${editingExpense.expenseNumber}` : 'Record Direct Operating Expense'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Giezra Farms Financial Costing Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Category */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Expense Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
              required
            >
              <option value="Live Bird Procurement">Live Bird Procurement</option>
              <option value="Feed & Veterinary">Feed & Veterinary</option>
              <option value="Transport & Logistics">Transport & Logistics</option>
              <option value="Utilities (Power/Water)">Utilities (Power/Water)</option>
              <option value="Abattoir Direct Labour">Abattoir Direct Labour</option>
              <option value="Packaging Materials (Bags/Boxes)">Packaging Materials (Bags/Boxes)</option>
              <option value="Equipment Maintenance">Equipment Maintenance</option>
              <option value="Cold Room Storage & Fuel">Cold Room Storage & Fuel</option>
              <option value="Regulatory & Halal Compliance">Regulatory & Halal Compliance</option>
              <option value="Other Operating Expense">Other Operating Expense</option>
            </select>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Amount (TZS) *
              </label>
              <input
                type="number"
                min="1"
                step="1000"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                placeholder="e.g. 750000"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-black text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Date Incurred *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Payment Method & Receipt Reference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
              >
                <option value="CRDB Bank">CRDB Bank (Main Ops)</option>
                <option value="NMB Bank">NMB Bank</option>
                <option value="M-Pesa Till">M-Pesa Till (Lipa Namba)</option>
                <option value="Cash">Cash Voucher</option>
                <option value="Cheque">Company Cheque</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Receipt / Invoice Ref #
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="e.g. TANESCO-99214"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Link to Production Batch */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Link to Slaughter Production Batch (Optional)
            </label>
            <div className="flex gap-2">
              {availableBatches.length > 0 ? (
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                >
                  <option value="">-- No Direct Batch Allocation --</option>
                  {availableBatches.map(b => (
                    <option key={b} value={b}>Batch {b}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  placeholder="e.g. PB-2026-042"
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                />
              )}
            </div>
          </div>

          {/* Description Notes */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Expense Description / Voucher Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Industrial TANESCO electricity charge for blast freezer compressor..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {!editingExpense && (amount > 0 || notes) && (
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-xs hover:bg-rose-100"
              >
                Discard Draft
              </button>
            )}

            <div className="flex items-center space-x-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
              >
                {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingExpense ? 'Update Voucher' : 'Confirm Voucher'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
