import React from 'react';
import { FileText, Lock, Sparkles, Printer, Download, Share2, QrCode, CheckCircle2 } from 'lucide-react';

export const OrderModulePreview: React.FC = () => {
  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-emerald-950 p-6 rounded-3xl text-white shadow-xl border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-300 mb-1">
            <Lock className="w-4 h-4" />
            <span>Phase 2 Module • Pending Approval</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Order Management & Automatic PDF Invoices
          </h1>
          <p className="text-xs sm:text-sm text-amber-200/80 mt-1 max-w-xl">
            Generates official tax-compliant invoices with company logo, 18% VAT, discounts, QR Code verification, and WhatsApp sharing.
          </p>
        </div>

        <div className="px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          <span>Unlocks in Phase 2</span>
        </div>
      </div>

      {/* Mock PDF Invoice Document Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl max-w-3xl mx-auto">
        
        {/* PDF Header */}
        <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h2 className="text-2xl font-black text-emerald-800 dark:text-emerald-400">GIEZRA FARMS LIMITED</h2>
            <p className="text-xs text-slate-500">Poultry Processing & Packaging Division</p>
            <p className="text-xs text-slate-500">Plot 42, Nyerere Road, Dar es Salaam, Tanzania</p>
            <p className="text-xs text-slate-500 font-mono mt-1">TIN: 104-982-114 | VRN: 40019283-A</p>
          </div>

          <div className="text-right space-y-1">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-xs rounded-full inline-block">
              TAX INVOICE
            </span>
            <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">#INV-2026-0089</div>
            <div className="text-xs text-slate-500">Date: 10 Aug 2026</div>
          </div>
        </div>

        {/* Customer & Line Items Preview */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <strong className="block text-slate-400 uppercase text-[10px]">Billed To Customer:</strong>
            <div className="font-bold text-slate-900 dark:text-white text-sm">Serena Hotel Dar es Salaam</div>
            <div className="text-slate-500">Ohio Street, Ilala, Dar es Salaam</div>
            <div className="font-mono text-slate-500">TIN: 104-982-114</div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-right">
            <strong className="block text-slate-400 uppercase text-[10px]">Payment Status:</strong>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 inline-block mt-1">
              Partially Paid (Net 30)
            </span>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-slate-600 dark:text-slate-300">
              <th className="p-2">Product Description</th>
              <th className="p-2 text-center">Qty</th>
              <th className="p-2 text-right">Unit Price</th>
              <th className="p-2 text-right">Total (TZS)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            <tr>
              <td className="p-2 font-bold text-slate-800 dark:text-slate-200">Whole Chicken (A-Grade 1.4kg)</td>
              <td className="p-2 text-center">300 Kg</td>
              <td className="p-2 text-right font-mono">8,500</td>
              <td className="p-2 text-right font-bold font-mono">2,550,000</td>
            </tr>
            <tr>
              <td className="p-2 font-bold text-slate-800 dark:text-slate-200">Breast Boneless (Skinless)</td>
              <td className="p-2 text-center">100 Kg</td>
              <td className="p-2 text-right font-mono">13,500</td>
              <td className="p-2 text-right font-bold font-mono">1,350,000</td>
            </tr>
          </tbody>
        </table>

        {/* PDF Totals */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-between items-center text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <QrCode className="w-10 h-10 text-slate-400" />
            <span>TRA E-Tax Verification QR</span>
          </div>

          <div className="space-y-1 text-right font-mono">
            <div>Subtotal: <strong>TZS 3,900,000</strong></div>
            <div>VAT (18%): <strong>TZS 350,000</strong></div>
            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">Grand Total: TZS 4,250,000</div>
          </div>
        </div>

      </div>

    </div>
  );
};
