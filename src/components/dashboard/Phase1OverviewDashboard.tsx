import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { PhaseApprovalBanner } from '../architecture/PhaseApprovalBanner';
import { 
  Building2, 
  Users, 
  Database, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Lock,
  Layers,
  ShoppingBag,
  FileText,
  Boxes,
  Factory,
  Calculator,
  CreditCard,
  UserCheck
} from 'lucide-react';

interface Phase1OverviewDashboardProps {
  setActiveTab: (tab: string) => void;
}

export const Phase1OverviewDashboard: React.FC<Phase1OverviewDashboardProps> = ({ setActiveTab }) => {
  const { currentUser, usersList } = useAuth();
  const isCEO = currentUser?.role === 'CEO';

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-7xl mx-auto">
      
      {/* Top Callout: Phase Approval Banner */}
      <PhaseApprovalBanner setActiveTab={setActiveTab} />

      {/* Hero Welcome Card */}
      <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 text-slate-900 dark:text-white border border-slate-200/80 dark:border-white/10 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#b8860b] dark:text-[#d4af37]">
            <Building2 className="w-4 h-4" />
            <span>GIEZRA FARMS LIMITED • TANZANIA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Welcome to <span className="text-[#d4af37]">GIEZRA ERP</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-emerald-100/80 leading-relaxed">
            Logged in as <strong className="text-slate-900 dark:text-white font-bold">{currentUser?.name}</strong> ({currentUser?.role.replace('_', ' ')}). Phase 1 (Architecture & RBAC) & Phase 2 (CRM, Sales, Orders, PDF Invoices & Debts) are approved. Phase 3 (Production, Slaughter Yield % & Cold Storage Inventory) is active and running.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0 relative z-10">
          <button
            onClick={() => setActiveTab('ai_assistant')}
            className="px-4 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#b8860b] hover:from-[#b8860b] hover:to-[#996515] text-slate-950 font-bold text-xs rounded-2xl shadow-lg shadow-[#d4af37]/30 border border-white/20 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Intelligence</span>
          </button>

          <button
            onClick={() => setActiveTab('costing')}
            className="px-4 py-2.5 bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] hover:from-[#2d6a4f] hover:to-[#52b788] text-white font-bold text-xs rounded-2xl shadow-lg shadow-[#1b4332]/30 border border-white/10 transition-all flex items-center gap-2"
          >
            <Calculator className="w-4 h-4 text-[#d4af37]" />
            <span>Financials & Costs</span>
          </button>
          
          <button
            onClick={() => setActiveTab('production')}
            className="px-4 py-2.5 bg-white/10 dark:bg-white/5 hover:bg-white/20 text-[#b8860b] dark:text-[#d4af37] font-bold text-xs rounded-2xl border border-slate-300 dark:border-white/10 backdrop-blur-md transition-all flex items-center gap-2"
          >
            <Factory className="w-4 h-4" />
            <span>Batches & Yield</span>
          </button>
        </div>
      </div>

      {/* Primary Architecture Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>User Accounts</span>
            <Users className="w-4 h-4 text-[#d4af37]" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {usersList.length} Accounts
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-[#52b788] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37]" />
            Active Seed Directory
          </p>
        </div>

        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Firestore Collections</span>
            <Database className="w-4 h-4 text-[#d4af37]" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            6 Collections
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Users, Customers, Orders, Products, Batches, Payments
          </p>
        </div>

        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>RBAC Security</span>
            <ShieldCheck className="w-4 h-4 text-[#52b788]" />
          </div>
          <div className="text-3xl font-black text-[#1b4332] dark:text-[#52b788]">
            5 Roles
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            CEO, Assistant CEO, Ops, Sales & Stock
          </p>
        </div>

        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>User Provisioning</span>
            <Lock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-[#b8860b] dark:text-[#d4af37]">
            CEO Only
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Public Registration Blocked
          </p>
        </div>

      </div>

      {/* Role Directory Grid */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 space-y-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#d4af37]" />
              Configured Role Accounts (GIEZRA FARMS LIMITED)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select any role in the header login switcher to test system permissions.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('user_management')}
            className="text-xs text-[#b8860b] dark:text-[#d4af37] font-bold hover:underline flex items-center gap-1"
          >
            <span>View All Users</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div className="p-4 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between text-[#b8860b] dark:text-[#d4af37] font-bold text-xs">
              <span>👑 CEO (Chief Executive Officer)</span>
              <span className="px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[10px] border border-[#d4af37]/40">Full Access</span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Godfrey Mzava</div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400">ceo@giezrafarms.co.tz</div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Sole authority to provision users, set credit limits, view profit analytics, and invoke executive AI.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between text-blue-700 dark:text-blue-300 font-bold text-xs">
              <span>🥈 Assistant CEO</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-[10px] border border-blue-500/40">Executive View</span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Amina Salum</div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400">assistant.ceo@giezrafarms.co.tz</div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Executive oversight across CRM, sales, and reports. Cannot create user accounts.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 font-bold text-xs">
              <span>⚙️ Operations Manager</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] border border-emerald-500/40">Production Lead</span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Josephat Kilonzo</div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400">ops@giezrafarms.co.tz</div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Controls slaughter batches, bird processing, yield %, feed & production costs.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-300 font-bold text-xs">
              <span>📈 Sales Manager</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-[10px] border border-indigo-500/40">Sales & Orders</span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Neema Mwangi</div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400">sales@giezrafarms.co.tz</div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Manages customer accounts (hotels/supermarkets), orders, PDF invoices, and debt receipts.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 backdrop-blur-md space-y-2 md:col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between text-orange-700 dark:text-orange-300 font-bold text-xs">
              <span>📦 Stock Manager</span>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-[10px] border border-orange-500/40">Inventory Lead</span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Emanuel Kimaro</div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400">stock@giezrafarms.co.tz</div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Manages whole chicken, cuts, offals, packaging inventory, stock-in/out, and low stock threshold alerts.
            </p>
          </div>

        </div>
      </div>

      {/* Module Roadmap Preview for Phase 2 & 3 */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#d4af37]" />
              Active System Modules (Phase 2 & Phase 3)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select any operational module below to access live workflows, records, and reports.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div 
            onClick={() => setActiveTab('customers')}
            className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500 cursor-pointer backdrop-blur-md transition-all space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <UserCheck className="w-4 h-4" />
                Phase 2: Customer CRM
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
                Active
              </span>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">Customer CRM & Credit Control</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Manages Hotels, Restaurants, Supermarkets, Butchery, Wholesalers in Tanzania with TIN, VRN, Credit Limits, and Debt Balances.
            </p>
          </div>

          <div 
            onClick={() => setActiveTab('orders')}
            className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500 cursor-pointer backdrop-blur-md transition-all space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <FileText className="w-4 h-4" />
                Phase 2: PDF Invoices
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
                Active
              </span>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">Automatic PDF Invoices & Orders</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Generates professional PDF invoices with GIEZRA FARMS logo, 18% VAT, QR code, and direct WhatsApp / Email sharing.
            </p>
          </div>

          <div 
            onClick={() => setActiveTab('production')}
            className="p-5 rounded-2xl border border-[#d4af37]/40 bg-[#d4af37]/10 hover:border-[#d4af37] cursor-pointer backdrop-blur-md transition-all space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-[#b8860b] dark:text-[#d4af37] flex items-center gap-1">
                <Factory className="w-4 h-4" />
                Phase 3: Slaughter Yield
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#b8860b] dark:text-[#d4af37]">
                Active Now
              </span>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">Slaughtering & Dressing Yield %</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Live bird intake weight, mortality logging, carcass output, cutups (breasts, wings, drumsticks), offals & packaging sync.
            </p>
          </div>

          <div 
            onClick={() => setActiveTab('inventory')}
            className="p-5 rounded-2xl border border-[#d4af37]/40 bg-[#d4af37]/10 hover:border-[#d4af37] cursor-pointer backdrop-blur-md transition-all space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-[#b8860b] dark:text-[#d4af37] flex items-center gap-1">
                <Boxes className="w-4 h-4" />
                Phase 3: Inventory & Cold Rooms
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#b8860b] dark:text-[#d4af37]">
                Active Now
              </span>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">Cold Rooms & Low Stock Alerts</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              19 poultry SKUs, Cold Room 1 (-18°C) telemetry, stock movements, adjustments and automated threshold alert warnings.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
