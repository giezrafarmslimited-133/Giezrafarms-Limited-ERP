import React, { useState, useEffect } from 'react';
import { Order, OrderItem, Customer, Product, OrderStatus } from '../../types/erp';
import { PdfInvoiceModal } from '../common/PdfInvoiceModal';
import { 
  FileText, ShoppingBag, Plus, Search, Filter, Printer, Download, 
  CheckCircle2, Clock, AlertTriangle, XCircle, Trash2, Edit3, Eye, 
  RefreshCw, DollarSign, ArrowRight, UserCheck, Tag, X, QrCode
} from 'lucide-react';

interface OrderManagementViewProps {
  initialCustomerId?: string;
}

export const OrderManagementView: React.FC<OrderManagementViewProps> = ({
  initialCustomerId
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Order Creation Wizard Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || '');
  const [orderItems, setOrderItems] = useState<Array<{ productId: string; quantity: number; unitPrice: number; discount: number }>>([]);
  const [deliveryDate, setDeliveryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [applyVat, setApplyVat] = useState<boolean>(true);
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [submittingOrder, setSubmittingOrder] = useState<boolean>(false);
  const [wizardError, setWizardError] = useState<string | null>(null);

  // Invoice & Receipt PDF Modal
  const [activePdfOrder, setActivePdfOrder] = useState<Order | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchOrderModuleData = async () => {
    setLoading(true);
    try {
      const [resOrders, resCustomers, resProducts] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/customers'),
        fetch('/api/products')
      ]);

      if (resOrders.ok) setOrders(await resOrders.json());
      if (resCustomers.ok) setCustomers(await resCustomers.json());
      if (resProducts.ok) setProducts(await resProducts.json());
    } catch (err) {
      console.error('Failed to fetch orders data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderModuleData();
  }, []);

  // Draft persistence in localStorage
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('giezra_order_invoice_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.selectedCustomerId) setSelectedCustomerId(parsed.selectedCustomerId);
        if (Array.isArray(parsed.orderItems) && parsed.orderItems.length > 0) setOrderItems(parsed.orderItems);
        if (parsed.deliveryDate) setDeliveryDate(parsed.deliveryDate);
        if (typeof parsed.notes === 'string') setNotes(parsed.notes);
        if (typeof parsed.applyVat === 'boolean') setApplyVat(parsed.applyVat);
        if (typeof parsed.overallDiscount === 'number') setOverallDiscount(parsed.overallDiscount);
        if (typeof parsed.isCreateModalOpen === 'boolean') setIsCreateModalOpen(parsed.isCreateModalOpen);
      }
    } catch (err) {
      console.error('Error loading order draft from storage:', err);
    }
  }, []);

  useEffect(() => {
    if (orderItems.length > 0 || selectedCustomerId || notes) {
      const draftObj = {
        selectedCustomerId,
        orderItems,
        deliveryDate,
        notes,
        applyVat,
        overallDiscount,
        isCreateModalOpen
      };
      localStorage.setItem('giezra_order_invoice_draft', JSON.stringify(draftObj));
    }
  }, [selectedCustomerId, orderItems, deliveryDate, notes, applyVat, overallDiscount, isCreateModalOpen]);

  const handleDiscardDraft = () => {
    localStorage.removeItem('giezra_order_invoice_draft');
    setSelectedCustomerId('');
    setOrderItems([]);
    setDeliveryDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setApplyVat(true);
    setOverallDiscount(0);
    setWizardError(null);
    setIsCreateModalOpen(false);
  };

  const handleAddLineItem = () => {
    if (products.length === 0) return;
    const defaultProduct = products[0];
    setOrderItems([
      ...orderItems,
      {
        productId: defaultProduct.id,
        quantity: 100,
        unitPrice: defaultProduct.unitPrice,
        discount: 0
      }
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    const updated = [...orderItems];
    updated.splice(index, 1);
    setOrderItems(updated);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const prod = products.find(p => p.id === productId);
    const updated = [...orderItems];
    updated[index].productId = productId;
    if (prod) {
      updated[index].unitPrice = prod.unitPrice;
    }
    setOrderItems(updated);
  };

  const handleLineItemChange = (index: number, field: string, value: number) => {
    const updated = [...orderItems];
    // @ts-ignore
    updated[index][field] = value;
    setOrderItems(updated);
  };

  // Calculations for Wizard
  const wizardSubtotal = orderItems.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice) - item.discount;
  }, 0);
  const wizardFinalSubtotal = Math.max(0, wizardSubtotal - overallDiscount);
  const wizardVat = applyVat ? Math.round(wizardFinalSubtotal * 0.18) : 0;
  const wizardGrandTotal = wizardFinalSubtotal + wizardVat;

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const isCreditExceeded = selectedCustomer 
    ? (selectedCustomer.outstandingBalance + wizardGrandTotal > selectedCustomer.creditLimit && selectedCustomer.creditLimit > 0)
    : false;

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWizardError(null);

    if (!selectedCustomerId) {
      setWizardError('Please select a customer for this order.');
      return;
    }
    if (orderItems.length === 0) {
      setWizardError('Please add at least one poultry product line item.');
      return;
    }

    setSubmittingOrder(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          items: orderItems,
          deliveryDate,
          notes,
          applyVat,
          discountAmount: overallDiscount
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create order.');
      }

      const newOrder = await res.json();
      setSuccessMsg(`Order ${newOrder.orderNumber} generated successfully!`);
      setTimeout(() => setSuccessMsg(null), 3500);

      localStorage.removeItem('giezra_order_invoice_draft');
      setIsCreateModalOpen(false);
      setOrderItems([]);
      setSelectedCustomerId('');
      setNotes('');
      setOverallDiscount(0);
      fetchOrderModuleData();
    } catch (err: any) {
      setWizardError(err.message || 'Error generating order.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setSuccessMsg(`Order status updated to ${newStatus}`);
        setTimeout(() => setSuccessMsg(null), 2500);
        fetchOrderModuleData();
      }
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  // Filtered Orders
  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.salesOfficerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span>Sales & Commercial Orders Processing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Order Management & PDF Invoices
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Create sales orders, generate TRA E-Tax compliant 18% VAT invoices, manage delivery schedules, and track payment balances.
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreateModalOpen(true);
            if (orderItems.length === 0) handleAddLineItem();
          }}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>New Sales Order</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search order #, customer, officer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {['ALL', 'Pending', 'Approved', 'Delivered', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table List */}
      {loading ? (
        <div className="text-center py-12 space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400">Loading Sales Orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-2">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300 text-base">No Orders Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No sales orders match your criteria. Create a new order to get started.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4">Order #</th>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Date & Officer</th>
                  <th className="p-4 text-right">Grand Total (TZS)</th>
                  <th className="p-4 text-right">Balance Due</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((o) => {
                  const getStatusBadge = (status: OrderStatus) => {
                    switch (status) {
                      case 'Approved':
                        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
                      case 'Delivered':
                        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
                      case 'Pending':
                        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
                      case 'Cancelled':
                        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
                      default:
                        return 'bg-slate-100 text-slate-800';
                    }
                  };

                  return (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all">
                      
                      <td className="p-4 font-mono font-black text-slate-900 dark:text-white text-sm">
                        {o.orderNumber}
                      </td>

                      <td className="p-4">
                        <div className="font-extrabold text-slate-900 dark:text-white">{o.customerName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{o.items.length} line items</div>
                      </td>

                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        <div>Deliv: <strong>{o.deliveryDate}</strong></div>
                        <div className="text-[11px] text-slate-400">{o.salesOfficerName}</div>
                      </td>

                      <td className="p-4 text-right font-mono font-extrabold text-slate-900 dark:text-white text-sm">
                        TZS {o.grandTotal.toLocaleString()}
                      </td>

                      <td className="p-4 text-right font-mono font-bold">
                        <span className={o.remainingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                          TZS {o.remainingBalance.toLocaleString()}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${getStatusBadge(o.status)}`}>
                          {o.status}
                        </span>
                      </td>

                      <td className="p-4 text-right space-x-1">
                        <button
                          onClick={() => setActivePdfOrder(o)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1 inline-flex transition-all"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>PDF Invoice</span>
                        </button>

                        {/* Status Change Dropdown */}
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateStatus(o.id, e.target.value as OrderStatus)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Order Wizard Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 my-auto max-h-[92vh] flex flex-col">
            
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShoppingBag className="w-6 h-6 text-emerald-600" />
                  Create Commercial Sales Order
                </h3>
                <p className="text-xs text-slate-400">
                  Calculates 18% TRA VAT, line item discounts, and verifies credit limits automatically.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {wizardError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs font-bold">
                {wizardError}
              </div>
            )}

            <form onSubmit={handleCreateOrderSubmit} className="space-y-6 overflow-y-auto pr-1">
              
              {/* Customer Selector & Order Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Select Customer Account *</label>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.businessType}) - TIN: {c.tin}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white font-mono"
                  />
                </div>

              </div>

              {/* Customer Debt & Credit Warning if selected */}
              {selectedCustomer && (
                <div className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row justify-between items-center gap-2 ${
                  isCreditExceeded 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  <div className="space-y-0.5">
                    <div className="font-bold flex items-center gap-1.5">
                      {isCreditExceeded && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                      <span>Customer: <strong>{selectedCustomer.name}</strong></span>
                    </div>
                    <div>
                      Existing Debt: <strong className="font-mono">TZS {selectedCustomer.outstandingBalance.toLocaleString()}</strong> | Credit Limit: <strong className="font-mono">TZS {selectedCustomer.creditLimit.toLocaleString()}</strong>
                    </div>
                  </div>

                  {isCreditExceeded && (
                    <div className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-xl text-[11px] font-black text-amber-700 dark:text-amber-300">
                      Requires CEO Approval (Credit Limit Exceeded)
                    </div>
                  )}
                </div>
              )}

              {/* Order Items Table Builder */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                    Poultry Products Line Items
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-900 dark:text-white rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-slate-600 dark:text-slate-300">
                        <th className="p-3">Product Item</th>
                        <th className="p-3 text-center w-28">Quantity</th>
                        <th className="p-3 text-right w-32">Unit Price (TZS)</th>
                        <th className="p-3 text-right w-32">Line Total</th>
                        <th className="p-3 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {orderItems.map((item, idx) => {
                        const lineTotal = (item.quantity * item.unitPrice) - item.discount;
                        return (
                          <tr key={idx}>
                            <td className="p-2">
                              <select
                                value={item.productId}
                                onChange={(e) => handleProductSelect(idx, e.target.value)}
                                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white text-xs"
                              >
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.unit}) - TZS {p.unitPrice.toLocaleString()}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="p-2">
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => handleLineItemChange(idx, 'quantity', Number(e.target.value))}
                                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-center font-bold outline-none text-slate-900 dark:text-white"
                              />
                            </td>

                            <td className="p-2">
                              <input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => handleLineItemChange(idx, 'unitPrice', Number(e.target.value))}
                                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-right font-bold outline-none text-slate-900 dark:text-white"
                              />
                            </td>

                            <td className="p-2 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                              TZS {lineTotal.toLocaleString()}
                            </td>

                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLineItem(idx)}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tax & Discount Options & Calculations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="applyVat"
                      checked={applyVat}
                      onChange={(e) => setApplyVat(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="applyVat" className="font-bold text-slate-700 dark:text-slate-300">
                      Apply TRA Standard 18% VAT Tax
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Overall Discount (TZS)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={overallDiscount}
                      onChange={(e) => setOverallDiscount(Number(e.target.value))}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-right font-bold outline-none text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Delivery Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Deliver before 10 AM to main hotel kitchen"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span>TZS {wizardSubtotal.toLocaleString()}</span>
                  </div>
                  {overallDiscount > 0 && (
                    <div className="flex justify-between text-amber-400">
                      <span>Discount:</span>
                      <span>- TZS {overallDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>VAT (18%):</span>
                    <span>TZS {wizardVat.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-emerald-400 pt-2 border-t border-slate-800">
                    <span>Grand Total:</span>
                    <span>TZS {wizardGrandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-slate-200 dark:border-slate-800">
                {(orderItems.length > 0 || selectedCustomerId || notes) && (
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-xl font-bold text-xs hover:bg-rose-100 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Discard Draft</span>
                  </button>
                )}
                <div className="flex items-center space-x-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingOrder}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                  >
                    {submittingOrder && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Generate Order & PDF Invoice</span>
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* PDF Tax Invoice Modal */}
      {activePdfOrder && (
        <PdfInvoiceModal
          type="invoice"
          order={activePdfOrder}
          customer={customers.find(c => c.id === activePdfOrder.customerId)}
          onClose={() => setActivePdfOrder(null)}
        />
      )}

    </div>
  );
};
