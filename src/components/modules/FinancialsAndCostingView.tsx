import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit2,
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers, 
  ShieldCheck, 
  Download, 
  Printer, 
  Filter, 
  Info,
  X,
  Sparkles,
  ChevronRight,
  Receipt,
  FileText,
  Building2,
  Search
} from 'lucide-react';
import { ExpenseEntry, DailyProfitReport, MonthlyProfitReport, BatchCostBreakdown } from '../../types/erp';
import { BatchCostBreakdownTable } from './financials/BatchCostBreakdownTable';
import { ProfitSensitivityCalculator } from './financials/ProfitSensitivityCalculator';
import { ExecutiveProfitStatementModal } from './financials/ExecutiveProfitStatementModal';
import { ExpenseVoucherModal } from './financials/ExpenseVoucherModal';

interface FinancialOverviewData {
  summary: {
    totalSalesRevenue: number;
    totalLiveBirdCost: number;
    totalPackagingCost: number;
    cogs: number;
    totalOperatingExpenses: number;
    grossProfit: number;
    netProfit: number;
    grossMarginPercentage: number;
    netMarginPercentage: number;
    totalLiveBirdsPurchased: number;
    totalOutputKg: number;
    totalKgSold: number;
    averageCostPerKgProduced: number;
    averageSellingPricePerKg: number;
  };
  categoryTotals: Record<string, number>;
  dailyProfitReports: DailyProfitReport[];
  monthlyProfitReports: MonthlyProfitReport[];
  batchCostBreakdowns?: BatchCostBreakdown[];
  expenses: ExpenseEntry[];
}

export const FinancialsAndCostingView: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'cost_allocations' | 'profit_calculator' | 'profit_reports'>('overview');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [data, setData] = useState<FinancialOverviewData | null>(null);

  // Time Period Filter
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'this_month' | 'last_30_days' | 'last_7_days'>('all');

  // Expense modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);
  const [targetBatchForExpense, setTargetBatchForExpense] = useState<string>('');

  // Executive P&L Statement Modal state
  const [isStatementModalOpen, setIsStatementModalOpen] = useState<boolean>(false);

  // Expenses Filter & Search state in Overview
  const [expenseSearchQuery, setExpenseSearchQuery] = useState<string>('');
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState<string>('all');

  const fetchOverview = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/financials/overview');
      if (!res.ok) throw new Error('Failed to load financial overview data');
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error fetching financial metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense voucher? This action is audited.')) {
      return;
    }

    try {
      const res = await fetch(`/api/financials/expenses/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': currentUser?.role || 'OPERATIONS_MANAGER',
          'x-user-id': currentUser?.id || 'usr_ops',
          'x-user-name': currentUser?.name || 'Operations Officer'
        }
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to delete expense voucher');
      }

      setSuccessMsg('Expense voucher removed successfully.');
      setTimeout(() => setSuccessMsg(null), 3500);
      fetchOverview();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error deleting expense voucher');
      setTimeout(() => setErrorMsg(null), 3500);
    }
  };

  const handleOpenExpenseModal = (batchId: string = '', expenseToEdit: ExpenseEntry | null = null) => {
    setTargetBatchForExpense(batchId);
    setEditingExpense(expenseToEdit);
    setIsExpenseModalOpen(true);
  };

  const availableBatchNumbers = useMemo(() => {
    if (!data || !data.batchCostBreakdowns) return [];
    return data.batchCostBreakdowns.map(b => b.batchNumber);
  }, [data]);

  // Filtered expenses in Overview tab
  const filteredExpenses = useMemo(() => {
    if (!data || !data.expenses) return [];
    return data.expenses.filter(e => {
      const matchesSearch = 
        e.expenseNumber.toLowerCase().includes(expenseSearchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(expenseSearchQuery.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(expenseSearchQuery.toLowerCase())) ||
        (e.batchId && e.batchId.toLowerCase().includes(expenseSearchQuery.toLowerCase()));
      
      const matchesCategory = selectedExpenseCategory === 'all' || e.category === selectedExpenseCategory;
      return matchesSearch && matchesCategory;
    });
  }, [data, expenseSearchQuery, selectedExpenseCategory]);

  const exportDailyCSV = () => {
    if (!data || !data.dailyProfitReports) return;
    const headers = ['Date', 'Revenue (TZS)', 'COGS (TZS)', 'Expenses (TZS)', 'Gross Profit (TZS)', 'Net Profit (TZS)', 'Margin (%)', 'Volume Sold (Kg)'];
    const rows = data.dailyProfitReports.map(r => [
      r.date,
      r.revenue,
      r.cogs,
      r.expenses,
      r.grossProfit,
      r.netProfit,
      r.marginPercentage,
      r.volumeSoldKg
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GIEZRA_FARMS_DAILY_PL_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/15 text-[#b8860b] dark:text-[#d4af37] flex items-center justify-center font-black">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Financials & Real-Time Costing
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                GIEZRA FARMS LIMITED • Commercial Poultry Abattoir Financial Engine
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsStatementModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Official P&L Statement</span>
          </button>

          <button
            onClick={() => handleOpenExpenseModal('')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Expense Voucher</span>
          </button>

          <button
            onClick={fetchOverview}
            disabled={loading}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl transition-colors"
            title="Refresh Financial Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2 pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-[#1b4332] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Financial Overview & Cash Flow</span>
        </button>

        <button
          onClick={() => setActiveTab('cost_allocations')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'cost_allocations'
              ? 'bg-[#1b4332] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Live Bird & Processing Costs</span>
          {data?.batchCostBreakdowns && (
            <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black">
              {data.batchCostBreakdowns.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('profit_calculator')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'profit_calculator'
              ? 'bg-[#1b4332] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Real-time Profit Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('profit_reports')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'profit_reports'
              ? 'bg-[#1b4332] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Daily & Monthly P&L Reports</span>
        </button>
      </div>

      {loading && !data && (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-bold">Synchronizing financial ledger & batch costing allocations...</p>
        </div>
      )}

      {data && (
        <>
          {/* TAB 1: EXECUTIVE FINANCIAL OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Executive Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Revenue */}
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span>Total Invoiced Revenue</span>
                    <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    TZS {data.summary.totalSalesRevenue.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {data.summary.totalKgSold.toLocaleString()} kg wholesale poultry sold
                  </p>
                </div>

                {/* 2. Direct COGS */}
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span>Production COGS</span>
                    <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Layers className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    TZS {data.summary.cogs.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Live birds: TZS {data.summary.totalLiveBirdCost.toLocaleString()} + Pkg: TZS {data.summary.totalPackagingCost.toLocaleString()}
                  </p>
                </div>

                {/* 3. Gross Profit */}
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span>Gross Processing Margin</span>
                    <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <DollarSign className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    TZS {data.summary.grossProfit.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-blue-600 dark:text-blue-400">
                    <span>{data.summary.grossMarginPercentage}% Gross Margin</span>
                  </div>
                </div>

                {/* 4. Net Operating Profit */}
                <div className="p-5 rounded-3xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    <span>Net Operating Profit</span>
                    <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    TZS {data.summary.netProfit.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-extrabold">
                    {data.summary.netMarginPercentage}% Net Return (EBITDA)
                  </p>
                </div>

              </div>

              {/* Unit Economics Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/15 pb-3">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400">
                      Plant Unit Cost Economics & Yield Efficiency
                    </h3>
                    <p className="text-xs text-slate-300">
                      Realized manufacturing cost per dressed kg against market wholesale selling prices
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="text-slate-300">Birds Processed: <strong className="text-white">{data.summary.totalLiveBirdsPurchased.toLocaleString()}</strong></span>
                    <span className="text-slate-300">Carcass Output: <strong className="text-white">{data.summary.totalOutputKg.toLocaleString()} kg</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <div className="text-xs text-slate-400 font-semibold">Average Cost of Production / Kg</div>
                    <div className="text-2xl font-black text-white mt-1">
                      TZS {data.summary.averageCostPerKgProduced.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Absorbs live bird procurement, packaging and plant overhead
                    </p>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 font-semibold">Average Selling Price Realized / Kg</div>
                    <div className="text-2xl font-black text-emerald-400 mt-1">
                      TZS {data.summary.averageSellingPricePerKg.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Across wholesale B2B distributor invoices
                    </p>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 font-semibold">Unit Spread Margin / Dressed Kg</div>
                    <div className="text-2xl font-black text-[#d4af37] mt-1">
                      +TZS {(data.summary.averageSellingPricePerKg - data.summary.averageCostPerKgProduced).toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Healthy {(((data.summary.averageSellingPricePerKg - data.summary.averageCostPerKgProduced) / (data.summary.averageSellingPricePerKg || 1)) * 100).toFixed(1)}% operating cushion
                    </p>
                  </div>
                </div>
              </div>

              {/* Cost Absorption Distribution & Operating Expense Management */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Cost Distribution Breakdown */}
                <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Operating Expense Breakdown
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Total Plant Operating Expenses: TZS {data.summary.totalOperatingExpenses.toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(data.categoryTotals).map(([cat, amt]) => {
                      const numAmt = Number(amt) || 0;
                      const pct = data.summary.totalOperatingExpenses > 0 
                        ? Number(((numAmt / data.summary.totalOperatingExpenses) * 100).toFixed(1)) 
                        : 0;

                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-700 dark:text-slate-300">{cat}</span>
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              TZS {numAmt.toLocaleString()} <span className="text-slate-400 font-normal">({pct}%)</span>
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div 
                              className="h-full bg-emerald-600 rounded-full transition-all"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {Object.keys(data.categoryTotals).length === 0 && (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        No operating expenses recorded yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Operating Expense Vouchers Table */}
                <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        Recent Expense Vouchers
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {data.expenses.length} vouchers recorded in financial audit ledger
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={expenseSearchQuery}
                          onChange={(e) => setExpenseSearchQuery(e.target.value)}
                          placeholder="Search voucher..."
                          className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        />
                      </div>

                      <button
                        onClick={() => handleOpenExpenseModal('')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                          <th className="py-2.5 px-3">Voucher #</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Amount (TZS)</th>
                          <th className="py-2.5 px-3">Batch Link</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredExpenses.slice(0, 15).map(exp => (
                          <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                              {exp.expenseNumber}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">
                              {exp.category}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">{exp.date}</td>
                            <td className="py-2.5 px-3 font-black text-emerald-600 dark:text-emerald-400">
                              TZS {exp.amount.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3">
                              {exp.batchId ? (
                                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold rounded-md text-[10px]">
                                  {exp.batchId}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">General Ops</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleOpenExpenseModal('', exp)}
                                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                  title="Edit Voucher"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(exp.id)}
                                  className="p-1 rounded-md text-slate-400 hover:text-rose-600"
                                  title="Delete Voucher"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {filteredExpenses.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">
                              No expense vouchers found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 2: LIVE BIRD & PROCESSING COSTS */}
          {activeTab === 'cost_allocations' && (
            <div className="space-y-6">
              <BatchCostBreakdownTable
                batches={data.batchCostBreakdowns || []}
                expenses={data.expenses || []}
                marketSellingPricePerKg={data.summary.averageSellingPricePerKg || 8500}
                onAttachExpenseToBatch={(bNum) => handleOpenExpenseModal(bNum)}
              />
            </div>
          )}

          {/* TAB 3: REAL-TIME PROFIT CALCULATOR & SIMULATOR */}
          {activeTab === 'profit_calculator' && (
            <div className="space-y-6">
              <ProfitSensitivityCalculator />
            </div>
          )}

          {/* TAB 4: DAILY & MONTHLY PROFIT REPORTS */}
          {activeTab === 'profit_reports' && (
            <div className="space-y-6">
              
              {/* Daily Profit Ledger */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span>Daily Profit & Loss Ledger</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Day-by-day revenue realized, direct COGS, overhead absorption & net margin
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportDailyCSV}
                      className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                    <button
                      onClick={() => setIsStatementModalOpen(true)}
                      className="px-3.5 py-2 bg-[#d4af37] hover:bg-[#b8860b] text-slate-950 font-black text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Formal P&L Statement</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Sales Revenue (TZS)</th>
                        <th className="py-3 px-3">Direct COGS (TZS)</th>
                        <th className="py-3 px-3">Operating Overheads (TZS)</th>
                        <th className="py-3 px-3">Gross Profit</th>
                        <th className="py-3 px-3">Net Profit</th>
                        <th className="py-3 px-3">Net Margin</th>
                        <th className="py-3 px-3 text-right">Volume (Kg)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.dailyProfitReports.map(report => (
                        <tr key={report.date} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 font-medium">
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{report.date}</td>
                          <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                            TZS {report.revenue.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-amber-600 dark:text-amber-400">
                            TZS {report.cogs.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-purple-600 dark:text-purple-400">
                            TZS {report.expenses.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                            TZS {report.grossProfit.toLocaleString()}
                          </td>
                          <td className={`py-3 px-3 font-black ${report.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            TZS {report.netProfit.toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              report.marginPercentage >= 15 
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' 
                                : report.marginPercentage >= 0 
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' 
                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            }`}>
                              {report.marginPercentage}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold">{report.volumeSoldKg.toLocaleString()} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Monthly Executive P&L Summary */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>Monthly Executive Profit & Loss Summary</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Aggregated monthly earnings statement & processing throughput
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                        <th className="py-3 px-3">Month</th>
                        <th className="py-3 px-3">Gross Sales (TZS)</th>
                        <th className="py-3 px-3">Live Bird Procurement</th>
                        <th className="py-3 px-3">Packaging</th>
                        <th className="py-3 px-3">Operating Expenses</th>
                        <th className="py-3 px-3">Net Profit</th>
                        <th className="py-3 px-3">Net Margin</th>
                        <th className="py-3 px-3 text-right">Birds Processed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.monthlyProfitReports.map(m => (
                        <tr key={m.month} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 font-medium">
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{m.month}</td>
                          <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                            TZS {m.revenue.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-slate-500">TZS {m.liveBirdCost.toLocaleString()}</td>
                          <td className="py-3 px-3 text-slate-500">TZS {m.packagingCost.toLocaleString()}</td>
                          <td className="py-3 px-3 text-purple-600 dark:text-purple-400">
                            TZS {m.operatingExpenses.toLocaleString()}
                          </td>
                          <td className={`py-3 px-3 font-black ${m.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            TZS {m.netProfit.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                            {m.marginPercentage}%
                          </td>
                          <td className="py-3 px-3 text-right font-bold">{m.totalBirdsProcessed.toLocaleString()} birds</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </>
      )}

      {/* Expense Voucher Modal */}
      <ExpenseVoucherModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={() => {
          setSuccessMsg('Expense voucher recorded in financial audit ledger.');
          setTimeout(() => setSuccessMsg(null), 3500);
          fetchOverview();
        }}
        editingExpense={editingExpense}
        initialBatchId={targetBatchForExpense}
        availableBatches={availableBatchNumbers}
        userRole={currentUser?.role}
        userName={currentUser?.name}
        userId={currentUser?.id}
      />

      {/* Executive P&L Statement Modal */}
      {data && (
        <ExecutiveProfitStatementModal
          isOpen={isStatementModalOpen}
          onClose={() => setIsStatementModalOpen(false)}
          summary={data.summary}
          categoryTotals={data.categoryTotals}
          activeMonth="August 2026"
        />
      )}

    </div>
  );
};

export default FinancialsAndCostingView;
