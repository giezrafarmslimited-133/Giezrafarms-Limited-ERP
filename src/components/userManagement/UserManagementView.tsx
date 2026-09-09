import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/erp';
import { 
  UserPlus, 
  ShieldAlert, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Lock, 
  CheckCircle2, 
  X, 
  Search,
  KeyRound,
  Building2,
  ListFilter
} from 'lucide-react';

interface UserManagementViewProps {
  onNavigateToProfile?: (userId: string) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ onNavigateToProfile }) => {
  const { currentUser, usersList, createUser, toggleUserStatus, unlockUserAccount } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  // New User Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('SALES_MANAGER');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCEO = currentUser?.role === 'CEO';
  const isSysAdmin = currentUser?.role === 'SYSTEM_ADMINISTRATOR';
  const canManageUsers = isCEO || isSysAdmin;

  // If user is neither CEO nor System Administrator, render Security Permission Denied guard
  if (!canManageUsers) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="p-8 bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-800 rounded-3xl text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-rose-900 dark:text-rose-200">
              Access Restricted: CEO / System Administrator Privilege Required
            </h2>
            <p className="text-sm text-rose-700 dark:text-rose-300 max-w-xl mx-auto leading-relaxed">
              In accordance with GIEZRA FARMS LIMITED security governance and Role-Based Access Control (RBAC), <strong>only the CEO and System Administrator</strong> have permission to create users, assign operational roles, or manage system access credentials.
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-800/60 text-left max-w-lg mx-auto text-xs text-slate-700 dark:text-slate-300 space-y-2">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-rose-500" />
              Your Current Role: <span className="text-amber-600 dark:text-amber-400 font-extrabold">{currentUser?.role}</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              If you require new account creation or permission adjustments for your team, please contact CEO Godfrey Mzava or System Administrator Neema Mwangi.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Draft persistence in localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('giezra_user_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name) setName(parsed.name);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.role) setRole(parsed.role);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.isModalOpen) setIsModalOpen(true);
      }
    } catch (e) {
      console.error('Error loading user draft:', e);
    }
  }, []);

  React.useEffect(() => {
    if (name || email || phone) {
      localStorage.setItem('giezra_user_draft', JSON.stringify({
        name,
        email,
        role,
        phone,
        isModalOpen
      }));
    }
  }, [name, email, role, phone, isModalOpen]);

  const handleDiscardUserDraft = () => {
    localStorage.removeItem('giezra_user_draft');
    setName('');
    setEmail('');
    setRole('SALES_MANAGER');
    setPhone('');
    setIsModalOpen(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !role) {
      setFormError('Please fill in name, email, and assign a role.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    const res = await createUser({ name, email, role, phone });

    if (res.success) {
      localStorage.removeItem('giezra_user_draft');
      setName('');
      setEmail('');
      setRole('SALES_MANAGER');
      setPhone('');
      setIsModalOpen(false);
    } else {
      setFormError(res.error || 'Failed to create user');
    }
    setIsSubmitting(false);
  };

  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleStyle = (r: UserRole) => {
    switch (r) {
      case 'CEO': return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'SYSTEM_ADMINISTRATOR': return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30';
      case 'ASSISTANT_CEO': return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30';
      case 'OPERATIONS_MANAGER': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'SALES_MANAGER': return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30';
      case 'STOCK_MANAGER': return 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30';
      default: return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl text-slate-900 dark:text-white shadow-2xl border border-slate-200/80 dark:border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#b8860b] dark:text-[#d4af37] mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>CEO Control Center • Role-Based Access Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            User Accounts & Team Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-emerald-200/80 mt-1">
            Provision user accounts, configure role permissions, and enforce security policies for GIEZRA FARMS LIMITED.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#b8860b] hover:from-[#2d6a4f] hover:to-[#d4af37] text-white font-bold text-sm rounded-2xl shadow-xl shadow-[#1b4332]/30 border border-white/20 flex items-center gap-2 transition-all transform hover:scale-[1.02] shrink-0 relative z-10"
        >
          <UserPlus className="w-5 h-5 text-[#d4af37]" />
          <span>Provision New User</span>
        </button>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="p-5 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total User Accounts</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{usersList.length}</div>
          <p className="text-[11px] text-[#52b788] font-bold">100% Active Directory</p>
        </div>

        <div className="p-5 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">CEO & Executives</span>
          <div className="text-3xl font-black text-[#b8860b] dark:text-[#d4af37]">
            {usersList.filter(u => u.role === 'CEO' || u.role === 'ASSISTANT_CEO').length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Executive Control Tier</p>
        </div>

        <div className="p-5 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Operations & Sales</span>
          <div className="text-3xl font-black text-[#1b4332] dark:text-[#52b788]">
            {usersList.filter(u => u.role === 'OPERATIONS_MANAGER' || u.role === 'SALES_MANAGER').length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Department Leads</p>
        </div>

        <div className="p-5 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Self-Registration</span>
          <div className="text-3xl font-black text-rose-500">Disabled</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Strict CEO Provisioning Only</p>
        </div>

      </div>

      {/* Directory Section */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl overflow-hidden">
        
        {/* Table Filters & Toolbar */}
        <div className="p-4 sm:p-6 border-b border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user name or email..."
              className="w-full pl-10 pr-3 py-2.5 bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <ListFilter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 text-slate-900 dark:text-white font-medium"
            >
              <option value="ALL">All Roles</option>
              <option value="CEO">CEO</option>
              <option value="SYSTEM_ADMINISTRATOR">System Administrator</option>
              <option value="ASSISTANT_CEO">Assistant CEO</option>
              <option value="OPERATIONS_MANAGER">Operations Manager</option>
              <option value="SALES_MANAGER">Sales Manager</option>
              <option value="STOCK_MANAGER">Stock Manager</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-white/40 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                <th className="p-4">Team Member</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Contact Phone</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last Activity</th>
                <th className="p-4 text-right">CEO Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
              {filteredUsers.map((u) => {
                const roleBadge = getRoleStyle(u.role);
                return (
                  <tr key={u.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                    
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1b4332] to-[#b8860b] border border-white/20 text-white font-bold flex items-center justify-center shrink-0 shadow-md">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {u.name}
                            {u.id === currentUser?.id && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#b8860b] dark:text-[#d4af37]">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-xl border inline-flex items-center gap-1 backdrop-blur-md shadow-sm ${roleBadge}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="p-4 font-mono text-slate-600 dark:text-slate-300">
                      {u.phone || '—'}
                    </td>

                    <td className="p-4">
                      {u.isLocked ? (
                        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                          Locked
                        </span>
                      ) : u.isActive ? (
                        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-800 dark:text-[#52b788] border border-emerald-500/30 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#52b788]" />
                          Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1 w-fit">
                          <UserX className="w-3.5 h-3.5 text-rose-500" />
                          Deactivated
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-xs text-slate-500 dark:text-slate-400">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never logged in'}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onNavigateToProfile && (
                          <button
                            onClick={() => onNavigateToProfile(u.id)}
                            className="px-3 py-1.5 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#b8860b] dark:text-[#d4af37] border border-[#d4af37]/30 rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            Profile
                          </button>
                        )}
                        {u.isLocked && (
                          <button
                            onClick={() => unlockUserAccount(u.id)}
                            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                          >
                            <KeyRound className="w-3 h-3 text-amber-500" />
                            Unlock
                          </button>
                        )}
                        {u.role === 'CEO' ? (
                          <span className="text-xs text-slate-400 italic font-medium">Protected CEO</span>
                        ) : (
                          <button
                            onClick={() => toggleUserStatus(u.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md transition-all shadow-sm ${
                              u.isActive
                                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-700 dark:text-[#52b788] border-emerald-500/30 hover:bg-emerald-500/20'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Access Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-500" />
            Role Permission Access Matrix (RBAC Specification)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enforced by Cloud Firestore Security Rules across every ERP module.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-bold uppercase text-slate-700 dark:text-slate-300">
                <th className="p-3">ERP Functional Module</th>
                <th className="p-3 text-center">CEO</th>
                <th className="p-3 text-center">Assistant CEO</th>
                <th className="p-3 text-center">Operations Manager</th>
                <th className="p-3 text-center">Sales Manager</th>
                <th className="p-3 text-center">Stock Manager</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              <tr>
                <td className="p-3 font-semibold text-slate-900 dark:text-white">User Creation & RBAC Management</td>
                <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400">Full Control</td>
                <td className="p-3 text-center text-slate-400">Read Only</td>
                <td className="p-3 text-center text-rose-500 font-semibold">No Access</td>
                <td className="p-3 text-center text-rose-500 font-semibold">No Access</td>
                <td className="p-3 text-center text-rose-500 font-semibold">No Access</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900 dark:text-white">Customer CRM & Credit Limits</td>
                <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400">Full Control</td>
                <td className="p-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">Full Access</td>
                <td className="p-3 text-center text-slate-400">Read Only</td>
                <td className="p-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">Full Access</td>
                <td className="p-3 text-center text-rose-500 font-semibold">No Access</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900 dark:text-white">Orders & Automatic PDF Invoices</td>
                <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400">Full Control</td>
                <td className="p-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">Full Access</td>
                <td className="p-3 text-center text-slate-400">View Delivery</td>
                <td className="p-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">Create & Edit</td>
                <td className="p-3 text-center text-slate-400">View Delivery</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900 dark:text-white">Poultry Production & Yield</td>
                <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400">Full Control</td>
                <td className="p-3 text-center text-slate-400">Read Only</td>
                <td className="p-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">Full Control</td>
                <td className="p-3 text-center text-rose-500 font-semibold">No Access</td>
                <td className="p-3 text-center text-slate-400">Receive Stock</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900 dark:text-white">Cost of Production & Profit Calc</td>
                <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400">Full Control</td>
                <td className="p-3 text-center text-slate-400">Read Only</td>
                <td className="p-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">Input Costs</td>
                <td className="p-3 text-center text-rose-500 font-semibold">No Access</td>
                <td className="p-3 text-center text-rose-500 font-semibold">No Access</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900 dark:text-white">Gemini AI Assistant & Analytics</td>
                <td className="p-3 text-center font-bold text-amber-600 dark:text-amber-400">Executive AI</td>
                <td className="p-3 text-center text-amber-600 dark:text-amber-400 font-semibold">Executive AI</td>
                <td className="p-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold">Ops AI</td>
                <td className="p-3 text-center text-indigo-600 dark:text-indigo-400 font-semibold">Sales AI</td>
                <td className="p-3 text-center text-orange-600 dark:text-orange-400 font-semibold">Stock AI</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Provision New Team Account</h3>
                  <p className="text-xs text-emerald-200">GIEZRA FARMS Executive Provisioning</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Baraka Hassan"
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Corporate Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. baraka@giezrafarms.co.tz"
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned User Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  >
                    <option value="SALES_MANAGER">Sales Manager</option>
                    <option value="OPERATIONS_MANAGER">Operations Manager</option>
                    <option value="STOCK_MANAGER">Stock Manager</option>
                    <option value="SYSTEM_ADMINISTRATOR">System Administrator (Tech Admin + Sales)</option>
                    <option value="ASSISTANT_CEO">Assistant CEO</option>
                    <option value="CEO">CEO (Full Access)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+255 7xx xxx xxx"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Automatic Credentials Generation
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  A temporary password will be initialized and logged in the system audit trail. The new user can sign in immediately.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                {(name || email || phone) && (
                  <button
                    type="button"
                    onClick={handleDiscardUserDraft}
                    className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/60"
                  >
                    Discard Draft
                  </button>
                )}
                <div className="flex items-center space-x-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-amber-600 text-white font-bold text-xs rounded-xl shadow-md hover:from-emerald-500 hover:to-amber-500 transition-colors"
                  >
                    {isSubmitting ? 'Creating Account...' : 'Confirm Account Provisioning'}
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
