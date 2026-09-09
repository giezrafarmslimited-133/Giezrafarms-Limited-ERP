import React from 'react';
import { 
  Building2, 
  Printer, 
  Download, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar,
  FileText
} from 'lucide-react';
import { MonthlyProfitReport } from '../../../types/erp';

interface ExecutiveProfitStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  activeMonth?: string;
}

export const ExecutiveProfitStatementModal: React.FC<ExecutiveProfitStatementModalProps> = ({
  isOpen,
  onClose,
  summary,
  categoryTotals,
  activeMonth = 'August 2026'
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const rows = [
      ['GIEZRA FARMS LIMITED - EXECUTIVE PROFIT & LOSS STATEMENT'],
      ['TIN: 142-889-012', 'VRN: 40-029188-B', `Period: ${activeMonth}`],
      [''],
      ['ACCOUNTING LINE ITEM', 'AMOUNT (TZS)', '% OF REVENUE'],
      ['1.0 OPERATING REVENUE', '', ''],
      ['Gross Poultry Sales Revenue', summary.totalSalesRevenue, '100.0%'],
      [''],
      ['2.0 COST OF GOODS SOLD (COGS)', '', ''],
      ['Live Broiler Flock Procurement', summary.totalLiveBirdCost, `${((summary.totalLiveBirdCost / (summary.totalSalesRevenue || 1)) * 100).toFixed(1)}%`],
      ['Packaging Materials (Bags & Boxes)', summary.totalPackagingCost, `${((summary.totalPackagingCost / (summary.totalSalesRevenue || 1)) * 100).toFixed(1)}%`],
      ['Total Production COGS', summary.cogs, `${((summary.cogs / (summary.totalSalesRevenue || 1)) * 100).toFixed(1)}%`],
      [''],
      ['3.0 GROSS PROFIT', summary.grossProfit, `${summary.grossMarginPercentage}%`],
      [''],
      ['4.0 OPERATING EXPENSES', '', ''],
      ...Object.entries(categoryTotals).map(([cat, amt]) => {
        const numAmt = Number(amt) || 0;
        return [
          `   ${cat}`,
          numAmt,
          `${((numAmt / (summary.totalSalesRevenue || 1)) * 100).toFixed(1)}%`
        ];
      }),
      ['Total Operating Expenses', summary.totalOperatingExpenses, `${((summary.totalOperatingExpenses / (summary.totalSalesRevenue || 1)) * 100).toFixed(1)}%`],
      [''],
      ['5.0 NET OPERATING PROFIT (EBITDA)', summary.netProfit, `${summary.netMarginPercentage}%`],
      [''],
      ['6.0 OPERATIONAL METRICS', 'VALUE'],
      ['Total Live Broilers Received', summary.totalLiveBirdsPurchased],
      ['Total Dressed Carcass Output (Kg)', summary.totalOutputKg],
      ['Total Product Volume Sold (Kg)', summary.totalKgSold],
      ['Average Realized Selling Price / Kg', summary.averageSellingPricePerKg],
      ['Average Cost of Production / Kg', summary.averageCostPerKgProduced]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GIEZRA_FARMS_PL_STATEMENT_${activeMonth.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative my-8">
        
        {/* Top Controls (Hidden during print) */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Official Executive P&L Financial Statement
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audited comprehensive income report formatted for board review
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-6 text-slate-900 dark:text-slate-100">
          
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 dark:border-white pb-5 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#d4af37]"></span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  GIEZRA FARMS LIMITED
                </h1>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                Commercial Poultry Abattoir & Processing Facility
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                P.O. Box 7102, Dar es Salaam, Tanzania • Tel: +255 754 000 111
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                TIN: <span className="font-mono font-bold">142-889-012</span> | VRN: <span className="font-mono font-bold">40-029188-B</span>
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <div className="inline-block px-3 py-1 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black text-xs uppercase tracking-wider rounded-md">
                Income Statement
              </div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Period: {activeMonth}
              </div>
              <div className="text-[11px] text-slate-400">
                Generated: {new Date().toLocaleDateString('en-GB')}
              </div>
            </div>
          </div>

          {/* Statement Line Items Table */}
          <div className="space-y-4 text-xs">
            
            {/* 1. Revenue */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-black text-sm text-slate-900 dark:text-white border-b border-slate-300 dark:border-slate-700 pb-1">
                <span>1.0 OPERATING SALES REVENUE</span>
                <span>TZS {summary.totalSalesRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 pl-4">
                <span>Gross Poultry Invoiced Turnover (Whole Birds & Cuts)</span>
                <span>TZS {summary.totalSalesRevenue.toLocaleString()}</span>
              </div>
            </div>

            {/* 2. COGS */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between font-black text-sm text-slate-900 dark:text-white border-b border-slate-300 dark:border-slate-700 pb-1">
                <span>2.0 COST OF GOODS SOLD (COGS)</span>
                <span className="text-rose-600 dark:text-rose-400">(TZS {summary.cogs.toLocaleString()})</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 pl-4">
                <span>Live Broiler Flock Procurement ({summary.totalLiveBirdsPurchased.toLocaleString()} birds)</span>
                <span>TZS {summary.totalLiveBirdCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 pl-4">
                <span>Packaging Materials (Vacuum Bags, 5kg Boxes & Trays)</span>
                <span>TZS {summary.totalPackagingCost.toLocaleString()}</span>
              </div>
            </div>

            {/* 3. Gross Profit */}
            <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl flex justify-between items-center font-black text-sm text-slate-900 dark:text-white">
              <span>3.0 GROSS PROCESSING PROFIT</span>
              <div className="text-right">
                <span className="text-emerald-600 dark:text-emerald-400">
                  TZS {summary.grossProfit.toLocaleString()}
                </span>
                <span className="ml-2 text-xs font-bold text-slate-500">
                  ({summary.grossMarginPercentage}% Margin)
                </span>
              </div>
            </div>

            {/* 4. Operating Expenses */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between font-black text-sm text-slate-900 dark:text-white border-b border-slate-300 dark:border-slate-700 pb-1">
                <span>4.0 OPERATING & PLANT OVERHEADS</span>
                <span className="text-rose-600 dark:text-rose-400">(TZS {summary.totalOperatingExpenses.toLocaleString()})</span>
              </div>
              {Object.entries(categoryTotals).map(([category, amount]) => (
                <div key={category} className="flex justify-between text-slate-600 dark:text-slate-400 pl-4">
                  <span>{category}</span>
                  <span>TZS {amount.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* 5. Net Operating Profit */}
            <div className="p-4 bg-emerald-500/15 border-2 border-emerald-500/40 rounded-2xl flex justify-between items-center font-black text-base text-slate-900 dark:text-white">
              <div>
                <span>5.0 NET OPERATING PROFIT (EBITDA)</span>
                <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  Comprehensive Operational Earnings
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl text-emerald-600 dark:text-emerald-400 font-black">
                  TZS {summary.netProfit.toLocaleString()}
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                  {summary.netMarginPercentage}% Net Return
                </div>
              </div>
            </div>

            {/* 6. Processing & Unit Volume Analytics */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                Key Processing Unit Economics
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Birds Processed</div>
                  <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                    {summary.totalLiveBirdsPurchased.toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Carcass Yield</div>
                  <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                    {summary.totalOutputKg.toLocaleString()} kg
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Avg Cost / Dressed Kg</div>
                  <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                    TZS {summary.averageCostPerKgProduced.toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Avg Selling Price / Kg</div>
                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    TZS {summary.averageSellingPricePerKg.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* 7. Sign-off Authorization Blocks */}
            <div className="pt-6 border-t-2 border-slate-300 dark:border-slate-700 grid grid-cols-3 gap-4 text-center">
              <div className="space-y-4">
                <div className="h-10 border-b border-dashed border-slate-400"></div>
                <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                  Prepared By:<br />Operations Officer
                </div>
              </div>

              <div className="space-y-4">
                <div className="h-10 border-b border-dashed border-slate-400"></div>
                <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                  Audited By:<br />Chief Financial Officer
                </div>
              </div>

              <div className="space-y-4">
                <div className="h-10 border-b border-dashed border-slate-400"></div>
                <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                  Approved By:<br />Managing Director / CEO
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Close */}
        <div className="flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl"
          >
            Close Statement
          </button>
        </div>

      </div>
    </div>
  );
};
