import React, { useState, useEffect } from 'react';
import { Payment, Order, Customer, PaymentMethod } from '../../types/erp';
import { PdfInvoiceModal } from '../common/PdfInvoiceModal';
import { 
  DollarSign, CreditCard, Send, CheckCircle2, AlertTriangle, Clock, 
  Printer, Download, Plus, Search, RefreshCw, FileText, Smartphone, 
  Building2, Users, ShieldAlert, X, MessageSquare, ArrowUpRight
} from 'lucide-react';

export const PaymentAndDebtView: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agingData, setAgingData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'payments' | 'aging'>('payments');

  // Register Payment Modal
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState<boolean>(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Mobile Money');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // PDF Receipt Modal
  const [activePdfPayment, setActivePdfPayment] = useState<Payment | null>(null);

  // Reminder Modal
  const [reminderModalCustomer, setReminderModalCustomer] = useState<any | null>(null);

  const fetchPaymentModuleData = async () => {
    setLoading(true);
    try {
      const [resPayments, resOrders, resCustomers, resAging] = await Promise.all([
        fetch('/api/payments'),
        fetch('/api/orders'),
        fetch('/api/customers'),
        fetch('/api/debts/aging')
      ]);

      if (resPayments.ok) setPayments(await resPayments.json());
      if (resOrders.ok) setOrders(await resOrders.json());
      if (resCustomers.ok) setCustomers(await resCustomers.json());
      if (resAging.ok) setAgingData(await resAging.json());
    } catch (err) {
      console.error('Error loading payments data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentModuleData();
  }, []);

  // Draft persistence in localStorage for Payment form
  useEffect(() => {
    try {
      const saved = localStorage.getItem('giezra_payment_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedOrderId) setSelectedOrderId(parsed.selectedOrderId);
        if (parsed.selectedCustomerId) setSelectedCustomerId(parsed.selectedCustomerId);
        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
        if (parsed.referenceNumber) setReferenceNumber(parsed.referenceNumber);
        if (parsed.amountPaid) setAmountPaid(parsed.amountPaid);
        if (parsed.paymentNotes) setPaymentNotes(parsed.paymentNotes);
        if (parsed.isRecordPaymentOpen) setIsRecordPaymentOpen(true);
      }
    } catch (e) {
      console.error('Error loading payment draft:', e);
    }
  }, []);

  useEffect(() => {
    if (selectedOrderId || selectedCustomerId || amountPaid > 0 || referenceNumber || paymentNotes) {
      localStorage.setItem('giezra_payment_draft', JSON.stringify({
        selectedOrderId,
        selectedCustomerId,
        paymentMethod,
        referenceNumber,
        amountPaid,
        paymentNotes,
        isRecordPaymentOpen
      }));
    }
  }, [selectedOrderId, selectedCustomerId, paymentMethod, referenceNumber, amountPaid, paymentNotes, isRecordPaymentOpen]);

  const handleDiscardPaymentDraft = () => {
    localStorage.removeItem('giezra_payment_draft');
    setSelectedOrderId('');
    setSelectedCustomerId('');
    setPaymentMethod('Mobile Money');
    setReferenceNumber('');
    setAmountPaid(0);
    setPaymentNotes('');
    setIsRecordPaymentOpen(false);
  };

  const handleOrderChange = (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedCustomerId(order.customerId);
      setAmountPaid(order.remainingBalance);
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!amountPaid || amountPaid <= 0) {
      setErrorMsg('Please specify a valid payment amount.');
      return;
    }
    if (!selectedCustomerId && !selectedOrderId) {
      setErrorMsg('Please select a customer or related order.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderId,
          customerId: selectedCustomerId,
          method: paymentMethod,
          referenceNumber,
          amountPaid,
          notes: paymentNotes
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record payment.');
      }

      const newPay = await res.json();
      setSuccessMsg(`Payment Receipt ${newPay.receiptNumber} recorded! Customer balance updated.`);
      setTimeout(() => setSuccessMsg(null), 3500);

      localStorage.removeItem('giezra_payment_draft');
      setIsRecordPaymentOpen(false);
      setSelectedOrderId('');
      setSelectedCustomerId('');
      setAmountPaid(0);
      setReferenceNumber('');
      setPaymentNotes('');
      fetchPaymentModuleData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error recording payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendDebtReminder = (customer: any) => {
    setReminderModalCustomer(customer);
  };

  const totalCollectedRevenue = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalOutstandingDebts = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 mb-1">
            <DollarSign className="w-4 h-4" />
            <span>Payments, Revenue & Customer Debt Ledgers</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Payments & Customer Debts Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Register cash, M-Pesa, TigoPesa, and bank transfer receipts. Track debt aging (1-60+ days) and generate official receipts.
          </p>
        </div>

        <button
          onClick={() => setIsRecordPaymentOpen(true)}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Record Customer Payment</span>
        </button>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total Collected Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            TZS {totalCollectedRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Recorded payment receipts to date
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Outstanding Customer Debts</span>
            <CreditCard className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            TZS {totalOutstandingDebts.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Active receivables across B2B accounts
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Overdue Accounts (&gt;30 Days)</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">
            {agingData.filter(a => (a.days31To60 + a.days60Plus) > 0).length} Clients
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Require formal payment reminders
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment Receipts History ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('aging')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'aging'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Customer Debt Aging Analysis</span>
        </button>
      </div>

      {/* TAB 1: PAYMENTS LIST */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12 space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-400">Loading Payment Records...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12 p-8 space-y-2">
              <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-base">No Payments Recorded Yet</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4">Receipt #</th>
                    <th className="p-4">Customer Account</th>
                    <th className="p-4">Channel & Reference</th>
                    <th className="p-4 text-right">Amount Paid (TZS)</th>
                    <th className="p-4">Date & Handler</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all">
                      
                      <td className="p-4 font-mono font-black text-slate-900 dark:text-white text-sm">
                        {p.receiptNumber}
                      </td>

                      <td className="p-4">
                        <div className="font-extrabold text-slate-900 dark:text-white">{p.customerName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">Order: {p.orderNumber}</div>
                      </td>

                      <td className="p-4 font-mono">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 block w-max mb-1">
                          {p.method}
                        </span>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{p.referenceNumber}</div>
                      </td>

                      <td className="p-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        TZS {p.amountPaid.toLocaleString()}
                      </td>

                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        <div>{new Date(p.paymentDate).toLocaleDateString('en-GB')}</div>
                        <div className="text-[11px] text-slate-400">{p.receivedBy}</div>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => setActivePdfPayment(p)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1 inline-flex transition-all"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Receipt PDF</span>
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEBT AGING ANALYSIS */}
      {activeTab === 'aging' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Accounts Receivable Debt Aging Matrix
                </h3>
                <p className="text-xs text-slate-400">
                  Calculates debt buckets (Current, 1-30 Days, 30-60 Days, 60+ Days) per client.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3">Customer Account</th>
                    <th className="p-3 text-right">Credit Limit</th>
                    <th className="p-3 text-right">Current (0-15d)</th>
                    <th className="p-3 text-right">1-30 Days</th>
                    <th className="p-3 text-right">31-60 Days</th>
                    <th className="p-3 text-right">60+ Days</th>
                    <th className="p-3 text-right">Total Debt</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {agingData.map((a) => (
                    <tr key={a.customerId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-sans">
                        <div className="font-bold text-slate-900 dark:text-white">{a.customerName}</div>
                        <div className="text-[11px] text-slate-400">{a.businessType} • {a.phone}</div>
                      </td>
                      <td className="p-3 text-right text-slate-500">
                        TZS {a.creditLimit.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-700 dark:text-slate-300">
                        TZS {a.current.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-bold text-amber-600">
                        TZS {a.days1To30.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-bold text-orange-600">
                        TZS {a.days31To60.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-bold text-red-600">
                        TZS {a.days60Plus.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-black text-amber-600 dark:text-amber-400 text-sm">
                        TZS {a.totalOutstanding.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        {a.totalOutstanding > 0 && (
                          <button
                            onClick={() => handleSendDebtReminder(a)}
                            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 rounded-xl font-sans font-bold text-[11px] flex items-center gap-1 mx-auto"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                            <span>Reminder</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isRecordPaymentOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 my-auto">
            
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-emerald-600" />
                Record Customer Payment
              </h3>
              <button
                onClick={() => setIsRecordPaymentOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Select Order (Optional if Direct Payment)</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => handleOrderChange(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                >
                  <option value="">-- Direct Customer Account Payment --</option>
                  {orders.filter(o => o.remainingBalance > 0).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.customerName} (Bal: TZS {o.remainingBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Customer Account *</label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Debt Owed: TZS {c.outstandingBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Payment Channel *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                  >
                    <option value="Mobile Money">Mobile Money (M-Pesa/TigoPesa)</option>
                    <option value="Bank">Bank Wire / Transfer</option>
                    <option value="Cash">Cash Deposit</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Amount Paid (TZS) *</label>
                  <input
                    type="number"
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-right font-bold outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Transaction Ref / M-Pesa ID / Cheque #</label>
                <input
                  type="text"
                  placeholder="e.g. MPESA-Q89211X or NMB-TXN-1029"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Notes / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Deposit notes or bank branch info..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-4 flex justify-between items-center border-t border-slate-200 dark:border-slate-800">
                {(selectedCustomerId || selectedOrderId || amountPaid > 0) && (
                  <button
                    type="button"
                    onClick={handleDiscardPaymentDraft}
                    className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/60"
                  >
                    Discard Draft
                  </button>
                )}
                <div className="flex justify-end space-x-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsRecordPaymentOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                  >
                    {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Confirm & Issue Receipt</span>
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Payment Receipt PDF Modal */}
      {activePdfPayment && (
        <PdfInvoiceModal
          type="receipt"
          payment={activePdfPayment}
          customer={customers.find(c => c.id === activePdfPayment.customerId)}
          onClose={() => setActivePdfPayment(null)}
        />
      )}

      {/* Debt Reminder Dispatch Modal */}
      {reminderModalCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                Dispatch Payment Reminder
              </h3>
              <button onClick={() => setReminderModalCustomer(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <p className="text-slate-600 dark:text-slate-300">
                Official SMS / WhatsApp payment reminder for <strong>{reminderModalCustomer.customerName}</strong> ({reminderModalCustomer.phone}):
              </p>

              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl font-mono text-[11px] text-slate-800 dark:text-slate-200 leading-relaxed border border-slate-200 dark:border-slate-700">
                "Dear {reminderModalCustomer.customerName}, this is a gentle reminder from GIEZRA FARMS LIMITED regarding your outstanding poultry supply invoice balance of TZS {reminderModalCustomer.totalOutstanding.toLocaleString()}. Please remit via Lipa M-Pesa Till: 5821941 or CRDB A/C 0150293817100. Thank you for your continued partnership."
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => setReminderModalCustomer(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert(`Payment reminder dispatched to ${reminderModalCustomer.phone} via SMS/WhatsApp API.`);
                  setReminderModalCustomer(null);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Reminder Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
