import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Database, 
  ShieldCheck, 
  UserCheck,
  ShoppingBag,
  FileText,
  Boxes,
  Factory,
  Calculator,
  CreditCard,
  Sparkles,
  Lock,
  CheckCircle,
  HelpCircle,
  Server,
  ShieldAlert,
  Cloud
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser } = useAuth();
  const isCEO = currentUser?.role === 'CEO';
  const isSysAdmin = currentUser?.role === 'SYSTEM_ADMINISTRATOR';
  const canAccessSystemAdmin = isCEO || isSysAdmin;

  const navItemsPhase1 = [
    {
      id: 'overview',
      label: 'Phase 1 Overview',
      icon: LayoutDashboard,
      description: 'System Architecture & Quick Metrics',
      active: true
    },
    {
      id: 'my_profile',
      label: 'My Profile',
      icon: UserCheck,
      description: 'Personal Info, Password & Security',
      active: true
    },
    ...(canAccessSystemAdmin ? [{
      id: 'system_admin',
      label: 'System Administration',
      icon: Server,
      description: 'SysAdmin Control, Backups & Health',
      active: true,
      badge: isCEO ? 'CEO & SysAdmin' : 'SysAdmin'
    }] : []),
    {
      id: 'user_management',
      label: 'User & RBAC Manager',
      icon: Users,
      description: (isCEO || isSysAdmin) ? 'Create, Edit & Control Team Users' : 'CEO / SysAdmin Restricted',
      restricted: !(isCEO || isSysAdmin),
      active: true
    },
    {
      id: 'database_schema',
      label: 'Database Design Explorer',
      icon: Database,
      description: 'Firestore Collections & Schema',
      active: true
    },
    {
      id: 'audit_logs',
      label: 'Security & Audit Trail',
      icon: ShieldCheck,
      description: 'System Activity Logs',
      active: true
    },
    {
      id: 'customers',
      label: 'Customer CRM',
      icon: Users,
      description: 'B2B Client Profiles, TIN/VRN & Credit Limits',
      active: true,
      badge: 'Phase 2'
    },
    {
      id: 'orders',
      label: 'Sales Orders & PDF Invoices',
      icon: FileText,
      description: 'Order Creation, 18% VAT & Tax Invoice PDFs',
      active: true,
      badge: 'Phase 2'
    },
    {
      id: 'payments',
      label: 'Payments & Debts Engine',
      icon: CreditCard,
      description: 'Cash, M-Pesa Receipts & Debt Aging Matrix',
      active: true,
      badge: 'Phase 2'
    },
    {
      id: 'documents',
      label: 'Google Drive Documents',
      icon: Cloud,
      description: 'Invoices, Quotations, Reports & Backups',
      active: true,
      badge: 'Google Drive'
    },
    {
      id: 'inventory',
      label: 'Inventory & Warehouses',
      icon: Boxes,
      description: '19 SKUs, Cold Rooms Telemetry, Stock Movements & Alerts',
      active: true,
      badge: 'Phase 3'
    },
    {
      id: 'production',
      label: 'Poultry Processing & Yield',
      icon: Factory,
      description: 'Slaughtering Stats, Carcass, Cuts, Offals & Packaging',
      active: true,
      badge: 'Phase 3'
    },
    {
      id: 'costing',
      label: 'Financials & Costing',
      icon: Calculator,
      description: 'Live Bird & Processing Costs, Real-time Profit & Margin Reports',
      active: true,
      badge: 'Phase 4'
    },
    {
      id: 'ai_assistant',
      label: 'AI Executive Intelligence',
      icon: Sparkles,
      description: 'Gemini Chat, CEO Digest & Automated Business Reports',
      active: true,
      badge: 'Phase 5'
    }
  ];

  const upcomingPhases: Array<{ phase: string; title: string; items: Array<{ id: string; label: string; icon: any }> }> = [];


  return (
    <aside className="w-full md:w-72 bg-white/60 dark:bg-[#081c15]/70 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/10 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] p-4 space-y-6">
      
      {/* Active Phase 1 Section */}
      <div>
        <div className="flex items-center justify-between mb-3 px-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1b4332] dark:text-[#d4af37] flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-[#d4af37]" />
            Phase 1 Modules (Active)
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#b8860b] dark:text-[#d4af37]">
            Ready
          </span>
        </div>

        <nav className="space-y-1.5">
          {navItemsPhase1.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-start space-x-3 p-3 rounded-2xl transition-all duration-200 text-left border ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#b8860b] text-white border-white/20 shadow-lg shadow-[#1b4332]/30 font-medium'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-white/50 dark:hover:bg-white/10 border-transparent hover:border-white/10'
                }`}
              >
                <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${isSelected ? 'text-[#d4af37]' : 'text-slate-500 dark:text-slate-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#d4af37]/20 text-[#b8860b] dark:text-[#d4af37] border border-[#d4af37]/30 shrink-0">
                        {item.badge}
                      </span>
                    )}
                    {item.restricted && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                        Restricted
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${isSelected ? 'text-emerald-100/90' : 'text-slate-500 dark:text-slate-400'}`}>
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200/80 dark:border-white/10 pt-2"></div>

      {/* Roadmap Phase Modules (All Operational) */}
      {upcomingPhases.length > 0 ? (
        <div className="space-y-4">
          <div className="px-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
              Upcoming ERP Phases
            </span>
          </div>

          {upcomingPhases.map((phaseGroup) => (
            <div key={phaseGroup.phase} className="px-2 space-y-1">
              <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                {phaseGroup.phase}: {phaseGroup.title}
              </div>
              {phaseGroup.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all border ${
                      activeTab === item.id 
                        ? 'bg-[#d4af37]/20 text-[#b8860b] dark:text-[#d4af37] border-[#d4af37]/40 shadow-sm backdrop-blur-md' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-white/5 border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate font-medium">
                      <Icon className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <Lock className="w-3 h-3 text-[#d4af37] shrink-0 ml-1" />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="px-2 py-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>All 5 Phases Operational</span>
          </div>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 leading-relaxed">
            Enterprise abattoir suite: Core, CRM & Invoices, Cold Chain Inventory, Costing, & Gemini Intelligence.
          </p>
        </div>
      )}

      {/* Info Card Footer */}
      <div className="mt-auto pt-4 border-t border-slate-200/80 dark:border-white/10">
        <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 space-y-1 shadow-sm">
          <div className="font-bold text-[#1b4332] dark:text-[#d4af37] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
            Giezra Farms ERP Suite
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Authorized for commercial poultry abattoir management & board governance.
          </p>
        </div>
      </div>

    </aside>
  );
};
