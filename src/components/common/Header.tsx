import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { EmailActivityModal } from '../auth/EmailActivityModal';
import { 
  LogOut, 
  ShieldCheck, 
  Building2, 
  Sun, 
  Moon, 
  User as UserIcon,
  CheckCircle2,
  Lock,
  Mail
} from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  activeTab: string;
  setActiveTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ darkMode, setDarkMode, activeTab, setActiveTab }) => {
  const { currentUser, logout, emailLogs } = useAuth();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'CEO':
        return { label: 'CEO (Full Access)', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' };
      case 'SYSTEM_ADMINISTRATOR':
        return { label: 'System Administrator', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30' };
      case 'ASSISTANT_CEO':
        return { label: 'Assistant CEO', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' };
      case 'OPERATIONS_MANAGER':
        return { label: 'Operations Manager', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
      case 'SALES_MANAGER':
        return { label: 'Sales Manager', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' };
      case 'STOCK_MANAGER':
        return { label: 'Stock Manager', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30' };
      default:
        return { label: 'User', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30' };
    }
  };

  const badge = getRoleBadge(currentUser?.role);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 dark:border-white/10 bg-white/70 dark:bg-[#081c15]/80 backdrop-blur-xl transition-all duration-200 shadow-lg shadow-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#b8860b] flex items-center justify-center text-white shadow-lg shadow-[#1b4332]/30 border border-white/20">
            <Building2 className="w-6 h-6 text-[#d4af37]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                GIEZRA <span className="text-[#d4af37]">ERP</span>
              </span>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#d4af37]/15 text-[#b8860b] dark:text-[#d4af37] border border-[#d4af37]/30 flex items-center gap-1 shadow-sm">
                <CheckCircle2 className="w-3 h-3 text-[#d4af37]" />
                Phase 1 Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-emerald-200/60 font-medium">
              GIEZRA FARMS LIMITED • Tanzania Poultry ERP
            </p>
          </div>
        </div>

        {/* Right side controls: Role Badge, Email Logs, Theme Toggle & User Info */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* User Role Badge */}
          {currentUser && (
            <div className="hidden sm:flex items-center space-x-2">
              <span className={`px-3 py-1 text-xs font-bold rounded-xl border backdrop-blur-md flex items-center gap-1.5 shadow-sm ${badge.color}`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {badge.label}
              </span>
            </div>
          )}

          {/* Google Email Outbox Button */}
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Google Workspace & Gmail API Email Outbox"
          >
            <Mail className="w-4 h-4" />
            <span className="hidden md:inline">Gmail Outbox</span>
            <span className="w-4 h-4 rounded-full bg-[#d4af37] text-slate-950 font-mono text-[10px] font-bold flex items-center justify-center">
              {emailLogs.length}
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/10 border border-transparent hover:border-white/20 transition-all backdrop-blur-md"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-5 h-5 text-[#d4af37]" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>

          {/* User Profile Pill */}
          {currentUser && (
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-200 dark:border-white/10">
              <button
                onClick={() => setActiveTab && setActiveTab('my_profile')}
                className="flex items-center space-x-2.5 text-left group p-1 rounded-2xl hover:bg-white/40 dark:hover:bg-white/10 transition-all cursor-pointer"
                title="View & Edit My Profile"
              >
                <div className="flex flex-col text-right hidden md:block">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white leading-tight group-hover:text-[#d4af37] transition-colors">
                      {currentUser.name}
                    </span>
                    {currentUser.emailVerified && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                        Verified
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {currentUser.email}
                  </span>
                </div>
                
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1b4332] to-[#b8860b] border border-white/30 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    currentUser.name.charAt(0)
                  )}
                </div>
              </button>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/30 transition-all flex items-center gap-1 text-xs font-medium"
                title="Logout from session"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Gmail Activity Modal */}
      <EmailActivityModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />
    </header>
  );
};
