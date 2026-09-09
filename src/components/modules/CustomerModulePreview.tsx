import React from 'react';
import { INITIAL_CUSTOMERS } from '../../data/mockDatabase';
import { UserCheck, Lock, Sparkles, Building2, Phone, Mail, MapPin, DollarSign } from 'lucide-react';

export const CustomerModulePreview: React.FC = () => {
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
            Customer Management (CRM)
          </h1>
          <p className="text-xs sm:text-sm text-amber-200/80 mt-1 max-w-xl">
            Complete database of Hotels, Restaurants, Supermarkets, and Wholesalers with TIN, VRN, credit limits, and debt ledgers.
          </p>
        </div>

        <div className="px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          <span>Unlocks in Phase 2</span>
        </div>
      </div>

      {/* Sample Customers Directory Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-amber-500" />
          Customer Database Schema Preview (GIEZRA FARMS)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INITIAL_CUSTOMERS.map((c) => (
            <div key={c.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">{c.name}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {c.businessType}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Outstanding Debt</div>
                  <div className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                    TZS {c.outstandingBalance.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 font-mono">
                <div><strong className="text-slate-400">TIN:</strong> {c.tin}</div>
                <div><strong className="text-slate-400">VRN:</strong> {c.vrn}</div>
                <div><strong className="text-slate-400">Region:</strong> {c.region}</div>
                <div><strong className="text-slate-400">Terms:</strong> {c.paymentTerms}</div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" /> {c.phone}
                </span>
                <span>Limit: TZS {c.creditLimit.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
