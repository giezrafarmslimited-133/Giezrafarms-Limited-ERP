import React, { useState, useEffect } from 'react';
import { Customer, CustomerBusinessType } from '../../types/erp';
import { 
  Users, UserPlus, Search, Building2, Phone, Mail, MapPin, 
  DollarSign, FileText, AlertTriangle, CheckCircle2, Edit2, Trash2, 
  Eye, RefreshCw, X, ArrowUpRight, TrendingUp, ShieldAlert, FileCheck
} from 'lucide-react';

interface CustomerManagementViewProps {
  onNavigateToOrders?: (customerId?: string) => void;
}

export const CustomerManagementView: React.FC<CustomerManagementViewProps> = ({
  onNavigateToOrders
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    region: 'Dar es Salaam',
    district: '',
    tin: '',
    vrn: '',
    businessType: 'Hotel' as CustomerBusinessType,
    contactPerson: '',
    creditLimit: 10000000,
    paymentTerms: 'Net 15',
    notes: ''
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      region: 'Dar es Salaam',
      district: '',
      tin: '',
      vrn: '',
      businessType: 'Hotel',
      contactPerson: '',
      creditLimit: 10000000,
      paymentTerms: 'Net 15',
      notes: ''
    });
    setEditingCustomer(null);
    setErrorMsg(null);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('giezra_customer_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.formData && (parsed.formData.name || parsed.formData.phone || parsed.formData.tin)) {
          setFormData(parsed.formData);
          if (parsed.isAddModalOpen) setIsAddModalOpen(true);
        }
      }
    } catch (e) {
      console.error('Error loading customer draft:', e);
    }
  }, []);

  useEffect(() => {
    if (!editingCustomer && (formData.name || formData.phone || formData.tin)) {
      localStorage.setItem('giezra_customer_draft', JSON.stringify({ formData, isAddModalOpen }));
    }
  }, [formData, isAddModalOpen, editingCustomer]);

  const handleDiscardCustomerDraft = () => {
    localStorage.removeItem('giezra_customer_draft');
    resetForm();
    setIsAddModalOpen(false);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      address: c.address || '',
      region: c.region || 'Dar es Salaam',
      district: c.district || '',
      tin: c.tin || '',
      vrn: c.vrn || '',
      businessType: c.businessType,
      contactPerson: c.contactPerson || '',
      creditLimit: c.creditLimit,
      paymentTerms: c.paymentTerms || 'Net 15',
      notes: c.notes || ''
    });
    setIsAddModalOpen(true);
  };

  const handleSubmitCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.name.trim()) {
      setErrorMsg('Customer Business Name is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMsg('Phone contact is required.');
      return;
    }
    if (!formData.tin.trim()) {
      setErrorMsg('TRA TIN Number is required.');
      return;
    }

    setSubmitting(true);
    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save customer');
      }

      setSuccessMsg(editingCustomer ? 'Customer profile updated successfully!' : 'New customer registered successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      localStorage.removeItem('giezra_customer_draft');
      setIsAddModalOpen(false);
      resetForm();
      fetchCustomers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving customer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete customer account "${name}"?`)) return;

    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg(`Customer ${name} removed.`);
        setTimeout(() => setSuccessMsg(null), 3000);
        fetchCustomers();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete customer.');
      }
    } catch (err) {
      alert('Error deleting customer account.');
    }
  };

  // Filtered customers
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tin.includes(searchTerm) ||
      c.phone.includes(searchTerm) ||
      c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedTypeFilter === 'ALL' || c.businessType === selectedTypeFilter;

    return matchesSearch && matchesType;
  });

  // Analytics Metrics
  const totalOutstandingDebts = customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);
  const totalCreditLimitGranted = customers.reduce((sum, c) => sum + (c.creditLimit || 0), 0);
  const highRiskCustomersCount = customers.filter(c => c.outstandingBalance > c.creditLimit * 0.8 && c.creditLimit > 0).length;

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      
      {/* Top Banner & Title */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 mb-1">
            <Building2 className="w-4 h-4" />
            <span>CRM & B2B Client Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Customer Management (CRM)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Register B2B buyers, manage TRA TIN/VRN compliance, credit limits, payment terms, and monitor debt balances.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
        >
          <UserPlus className="w-5 h-5" />
          <span>Register New Customer</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Key CRM Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total Customers</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {customers.length} Accounts
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Active Hotels, Supermarkets & Wholesalers
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total Customer Debt</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            TZS {totalOutstandingDebts.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Pending receivables across accounts
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Credit Limit Allocation</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            TZS {totalCreditLimitGranted.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Authorized revolving credit capacity
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Credit Risk Alert</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">
            {highRiskCustomersCount} Accounts
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Owed &gt; 80% of assigned credit limit
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, TIN, phone, contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
          />
        </div>

        {/* Business Type Filters */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {['ALL', 'Hotel', 'Restaurant', 'Supermarket', 'Wholesaler', 'Butchery', 'Retail'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedTypeFilter(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                selectedTypeFilter === type
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Customers List Grid */}
      {loading ? (
        <div className="text-center py-12 space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400">Loading Customer Accounts...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-2">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300 text-base">No Customer Accounts Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No customer accounts match your search or filter. Register a new customer or adjust filters above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {filteredCustomers.map((c) => {
            const creditUsagePct = c.creditLimit > 0 ? Math.min(100, Math.round((c.outstandingBalance / c.creditLimit) * 100)) : 0;
            const isHighRisk = creditUsagePct >= 80;

            return (
              <div 
                key={c.id} 
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 hover:shadow-xl transition-all relative overflow-hidden group"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {c.businessType}
                      </span>
                      <span className="text-xs font-mono text-slate-400">TIN: {c.tin}</span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">
                      {c.name}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setSelectedCustomerDetails(c)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-all"
                      title="View Customer Profile & Debt Ledger"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(c)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-all"
                      title="Edit Customer Details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(c.id, c.name)}
                      className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 transition-all"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{c.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span>{c.region}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-500" />
                    <span className="truncate">{c.email || 'No Email'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-500" />
                    <span>Terms: {c.paymentTerms}</span>
                  </div>
                </div>

                {/* Credit Limit & Debt Gauge */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">Outstanding Debt:</span>
                    <span className={`font-mono font-black ${isHighRisk ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                      TZS {c.outstandingBalance.toLocaleString()}
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${isHighRisk ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${creditUsagePct}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium">
                    <span>Limit: TZS {c.creditLimit.toLocaleString()}</span>
                    <span>{creditUsagePct}% Credit Used</span>
                  </div>
                </div>

                {/* Create Order Quick Action */}
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">
                    Contact: <strong>{c.contactPerson || 'N/A'}</strong>
                  </span>
                  
                  {onNavigateToOrders && (
                    <button
                      onClick={() => onNavigateToOrders(c.id)}
                      className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-xl font-bold text-xs flex items-center gap-1 transition-all"
                    >
                      <span>New Order</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 my-auto">
            
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-emerald-600" />
                {editingCustomer ? 'Update Customer Profile' : 'Register New B2B Customer'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
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

            <form onSubmit={handleSubmitCustomer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Customer / Business Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Serena Hotel Dar es Salaam"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Business Category *</label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value as CustomerBusinessType })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                  >
                    <option value="Hotel">Hotel</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Supermarket">Supermarket</option>
                    <option value="Wholesaler">Wholesaler</option>
                    <option value="Butchery">Butchery</option>
                    <option value="Retail">Retail</option>
                    <option value="Institution">Institution</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Phone Contact *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +255 754 123 456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. orders@serenahotels.co.tz"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">TRA TIN Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 104-982-114"
                    value={formData.tin}
                    onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">TRA VRN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 40019283-A"
                    value={formData.vrn}
                    onChange={(e) => setFormData({ ...formData, vrn: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Region (Tanzania)</label>
                  <input
                    type="text"
                    placeholder="e.g. Dar es Salaam, Mwanza, Arusha"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Contact Person Name</label>
                  <input
                    type="text"
                    placeholder="e.g. David Kweka (Head Chef)"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Credit Limit (TZS)</label>
                  <input
                    type="number"
                    placeholder="10000000"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Payment Terms</label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                  >
                    <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                    <option value="Net 7">Net 7 Days</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                  </select>
                </div>

              </div>

              <div className="space-y-1 text-xs">
                <label className="font-bold text-slate-700 dark:text-slate-300">Street Address & Delivery Notes</label>
                <textarea
                  rows={2}
                  placeholder="Physical location address or special delivery instructions..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCustomer ? 'Save Changes' : 'Register Customer'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Customer Detailed Profile & Ledger Modal */}
      {selectedCustomerDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 my-auto">
            
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {selectedCustomerDetails.businessType}
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {selectedCustomerDetails.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCustomerDetails(null)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <span className="text-slate-400 uppercase text-[10px] font-bold">TIN Number</span>
                <div className="font-mono font-bold text-slate-900 dark:text-white">{selectedCustomerDetails.tin}</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <span className="text-slate-400 uppercase text-[10px] font-bold">VRN Number</span>
                <div className="font-mono font-bold text-slate-900 dark:text-white">{selectedCustomerDetails.vrn || 'N/A'}</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <span className="text-slate-400 uppercase text-[10px] font-bold">Phone Contact</span>
                <div className="font-bold text-slate-900 dark:text-white">{selectedCustomerDetails.phone}</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <span className="text-slate-400 uppercase text-[10px] font-bold">Payment Terms</span>
                <div className="font-bold text-slate-900 dark:text-white">{selectedCustomerDetails.paymentTerms}</div>
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex justify-between items-center">
              <div>
                <div className="text-xs text-amber-800 dark:text-amber-300 font-bold">Current Debt Balance</div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  TZS {selectedCustomerDetails.outstandingBalance.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Assigned Limit</div>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">
                  TZS {selectedCustomerDetails.creditLimit.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCustomerDetails(null)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-700"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
