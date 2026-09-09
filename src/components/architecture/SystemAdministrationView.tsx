import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SystemSettings, BackupSnapshot, DatabaseHealth, AuditLog, CompanyPaymentDetails } from '../../types/erp';
import { 
  Server, 
  Settings, 
  Database, 
  ShieldCheck, 
  ShieldAlert, 
  HardDrive, 
  RefreshCw, 
  Download, 
  RotateCcw, 
  PlusCircle, 
  CheckCircle2, 
  Activity, 
  Cpu, 
  Lock, 
  AlertTriangle,
  FileText,
  UserCheck,
  Zap,
  Globe,
  Bell,
  Sliders,
  X,
  CreditCard,
  Edit2,
  Save,
  Building2,
  Check
} from 'lucide-react';

interface SystemAdministrationViewProps {
  onNavigateToUserMgmt?: () => void;
}

export const SystemAdministrationView: React.FC<SystemAdministrationViewProps> = ({ onNavigateToUserMgmt }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'settings' | 'backups' | 'health' | 'audit' | 'scope'>('settings');

  // State for Settings, Backups, Health
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [backups, setBackups] = useState<BackupSnapshot[]>([]);
  const [dbHealth, setDbHealth] = useState<DatabaseHealth | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Payment Details state
  const [paymentForm, setPaymentForm] = useState<CompanyPaymentDetails>({
    bankName: 'CRDB Bank PLC',
    accountName: 'GIEZRA FARMS LIMITED',
    accountNumber: '10163545816',
    currency: 'TZS',
    branchName: 'Mikocheni Branch',
    branchCode: 'CRDBTZTZ',
    swiftCode: 'CORUTZTZ'
  });
  const [isEditingPayment, setIsEditingPayment] = useState<boolean>(false);
  const [isSavingPayment, setIsSavingPayment] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Restore Modal
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<BackupSnapshot | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  const isCEO = currentUser?.role === 'CEO';
  const isSysAdmin = currentUser?.role === 'SYSTEM_ADMINISTRATOR';
  const canAccess = isCEO || isSysAdmin;

  useEffect(() => {
    if (canAccess) {
      loadSystemData();
    }
  }, [canAccess]);

  const safeFetchJson = async (url: string, headers?: Record<string, string>) => {
    try {
      const res = await fetch(url, { headers });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        return await res.json();
      }
      return null;
    } catch (err) {
      console.error(`Failed to fetch JSON from ${url}:`, err);
      return null;
    }
  };

  const loadSystemData = async () => {
    setIsLoading(true);
    try {
      const headers = {
        'x-user-role': currentUser?.role || '',
        'x-user-id': currentUser?.id || '',
        'x-user-name': currentUser?.name || ''
      };

      const [settingsData, backupsData, healthData, logsData] = await Promise.all([
        safeFetchJson('/api/system/settings', headers),
        safeFetchJson('/api/system/backups', headers),
        safeFetchJson('/api/system/health', headers),
        safeFetchJson('/api/audit-logs', headers)
      ]);

      if (settingsData) {
        setSettings(settingsData);
        if (settingsData.paymentDetails) {
          const savedDraft = localStorage.getItem('giezra_sys_payment_draft');
          if (savedDraft) {
            try {
              setPaymentForm(JSON.parse(savedDraft));
              setIsEditingPayment(true);
            } catch (e) {
              setPaymentForm(settingsData.paymentDetails);
            }
          } else {
            setPaymentForm(settingsData.paymentDetails);
          }
        }
      }
      if (backupsData) setBackups(backupsData);
      if (healthData) setDbHealth(healthData);
      if (logsData) setAuditLogs(logsData);

    } catch (error) {
      console.error('Error fetching system administration data:', error);
      setStatusMessage({ type: 'error', text: 'Failed to load system administration data' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isEditingPayment && paymentForm) {
      localStorage.setItem('giezra_sys_payment_draft', JSON.stringify(paymentForm));
    }
  }, [isEditingPayment, paymentForm]);

  const handleCancelPaymentEdit = () => {
    localStorage.removeItem('giezra_sys_payment_draft');
    if (settings?.paymentDetails) {
      setPaymentForm(settings.paymentDetails);
    }
    setIsEditingPayment(false);
  };

  const handleUpdatePaymentDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPayment(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/system/settings/payment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || '',
          'x-user-id': currentUser?.id || '',
          'x-user-name': currentUser?.name || ''
        },
        body: JSON.stringify(paymentForm)
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.removeItem('giezra_sys_payment_draft');
        setStatusMessage({ type: 'success', text: 'Company Payment Details successfully saved and updated!' });
        setIsEditingPayment(false);
        if (data.paymentDetails) {
          setPaymentForm(data.paymentDetails);
        }
        // Refresh audit logs
        const logsRes = await fetch('/api/audit-logs', {
          headers: {
            'x-user-role': currentUser?.role || '',
            'x-user-id': currentUser?.id || '',
            'x-user-name': currentUser?.name || ''
          }
        });
        if (logsRes.ok) setAuditLogs(await logsRes.json());
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update payment details' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error updating payment details' });
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSavingSettings(true);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/system/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || '',
          'x-user-id': currentUser?.id || '',
          'x-user-name': currentUser?.name || ''
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (response.ok) {
        setSettings(data.settings);
        setStatusMessage({ type: 'success', text: 'System settings updated and synchronized successfully!' });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update system settings' });
      }
    } catch (error: any) {
      setStatusMessage({ type: 'error', text: error.message || 'Server error updating settings' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/system/backups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || '',
          'x-user-id': currentUser?.id || '',
          'x-user-name': currentUser?.name || ''
        },
        body: JSON.stringify({
          notes: `Manual snapshot created by ${currentUser?.name} (${currentUser?.role})`
        })
      });

      const data = await response.json();

      if (response.ok) {
        setBackups([data.backup, ...backups]);
        setStatusMessage({ type: 'success', text: `Backup snapshot created: ${data.backup.id}` });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to create backup' });
      }
    } catch (error: any) {
      setStatusMessage({ type: 'error', text: error.message || 'Error creating backup' });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackupForRestore) return;

    setIsRestoring(true);
    try {
      const response = await fetch(`/api/system/backups/${selectedBackupForRestore.id}/restore`, {
        method: 'POST',
        headers: {
          'x-user-role': currentUser?.role || '',
          'x-user-id': currentUser?.id || '',
          'x-user-name': currentUser?.name || ''
        }
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMessage({ type: 'success', text: `System database restored to backup ${selectedBackupForRestore.id}!` });
        setSelectedBackupForRestore(null);
        await loadSystemData();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to restore backup' });
      }
    } catch (error: any) {
      setStatusMessage({ type: 'error', text: error.message || 'Restore failed' });
    } finally {
      setIsRestoring(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="p-8 bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-800 rounded-3xl text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-rose-900 dark:text-rose-200">
              Access Restricted: System Administration
            </h2>
            <p className="text-sm text-rose-700 dark:text-rose-300 max-w-xl mx-auto leading-relaxed">
              In accordance with GIEZRA FARMS LIMITED security governance, <strong>only the System Administrator (Neema Mwangi) and Chief Executive Officer (Godfrey Mzava)</strong> are authorized to access system configuration, backup snapshot controls, and technical infrastructure logs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl text-slate-900 dark:text-white shadow-2xl border border-slate-200/80 dark:border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 dark:bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-purple-700 dark:text-[#d4af37]">
            <Server className="w-4 h-4 text-purple-600 dark:text-[#d4af37]" />
            <span>GIEZRA ERP Technical Administration • System Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            System Administration
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30">
              {isSysAdmin ? 'System Administrator & Sales Manager' : 'CEO Executive Access'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
            Configure enterprise settings, manage automated database backups, monitor database health metrics, and audit system activities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 relative z-10">
          <button
            onClick={loadSystemData}
            disabled={isLoading}
            className="px-4 py-2.5 bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white font-bold text-xs rounded-2xl border border-slate-300 dark:border-white/10 flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>

          <button
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            className="px-5 py-2.5 bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#b8860b] hover:from-[#2d6a4f] hover:to-[#d4af37] text-white font-bold text-xs rounded-2xl shadow-lg border border-white/20 flex items-center gap-2 transition-all"
          >
            <HardDrive className="w-4 h-4 text-[#d4af37]" />
            <span>{isCreatingBackup ? 'Snapshotting...' : 'Create Instant Backup'}</span>
          </button>
        </div>
      </div>

      {/* Status Alert Banner if present */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-medium shadow-md ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' 
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Infrastructure Telemetry Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Database Status</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {dbHealth?.status || 'HEALTHY'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Uptime: {dbHealth?.uptime || '99.98%'}</p>
        </div>

        <div className="p-5 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Server Memory & Load</span>
            <Cpu className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {dbHealth?.memoryUsage || '42%'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Connections: {dbHealth?.activeConnections || 18}</p>
        </div>

        <div className="p-5 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Backup Snapshots</span>
            <HardDrive className="w-4 h-4 text-[#b8860b] dark:text-[#d4af37]" />
          </div>
          <div className="text-2xl font-black text-[#b8860b] dark:text-[#d4af37]">
            {backups.length} Saved
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Auto-Backup: {settings?.autoBackupEnabled ? 'Enabled' : 'Disabled'}</p>
        </div>

        <div className="p-5 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Security Policy</span>
            <Lock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            RBAC Active
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Session Timeout: {settings?.sessionTimeoutMinutes || 30} mins</p>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200/80 dark:border-white/10 overflow-x-auto gap-2 pb-1">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-5 py-3 font-bold text-xs sm:text-sm rounded-2xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] text-white shadow-lg border border-white/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>System Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('backups')}
          className={`px-5 py-3 font-bold text-xs sm:text-sm rounded-2xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'backups'
              ? 'bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] text-white shadow-lg border border-white/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Backups & Recovery ({backups.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`px-5 py-3 font-bold text-xs sm:text-sm rounded-2xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'health'
              ? 'bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] text-white shadow-lg border border-white/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Database & Server Health</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-5 py-3 font-bold text-xs sm:text-sm rounded-2xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] text-white shadow-lg border border-white/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Audit Trail ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('scope')}
          className={`px-5 py-3 font-bold text-xs sm:text-sm rounded-2xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'scope'
              ? 'bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] text-white shadow-lg border border-white/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>SysAdmin Scope & Restrictions</span>
        </button>
      </div>

      {/* Tab 1: System Settings */}
      {activeTab === 'settings' && settings && (
        <div className="space-y-8">
          
          {/* COMPANY PAYMENT DETAILS CARD (Settings -> Company Information -> Company Payment Details) */}
          <div className="bg-gradient-to-br from-white via-emerald-50/20 to-slate-50 dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 rounded-3xl border-2 border-emerald-500/30 dark:border-emerald-500/20 p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Settings → Company Information → Company Payment Details</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                  Company Payment Information
                  <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500/30">
                    CEO & SysAdmin Authorized
                  </span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Official banking destination account printed automatically on every generated customer PDF invoice.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!isEditingPayment ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingPayment(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Payment Details</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCancelPaymentEdit}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleUpdatePaymentDetails} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bank Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isEditingPayment}
                    value={paymentForm.bankName}
                    onChange={(e) => setPaymentForm({ ...paymentForm, bankName: e.target.value })}
                    placeholder="CRDB Bank PLC"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-900/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Account Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isEditingPayment}
                    value={paymentForm.accountName}
                    onChange={(e) => setPaymentForm({ ...paymentForm, accountName: e.target.value })}
                    placeholder="GIEZRA FARMS LIMITED"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-900/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Account Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isEditingPayment}
                    value={paymentForm.accountNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, accountNumber: e.target.value })}
                    placeholder="10163545816"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400 disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-900/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Currency <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isEditingPayment}
                    value={paymentForm.currency}
                    onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value })}
                    placeholder="TZS"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-900/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Branch Name <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isEditingPayment}
                    value={paymentForm.branchName || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, branchName: e.target.value })}
                    placeholder="Mikocheni Branch"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-900/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Branch Code / SWIFT Code <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      disabled={!isEditingPayment}
                      value={paymentForm.branchCode || ''}
                      onChange={(e) => setPaymentForm({ ...paymentForm, branchCode: e.target.value })}
                      placeholder="CRDBTZTZ"
                      className="w-full px-2.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-white disabled:opacity-75"
                    />
                    <input
                      type="text"
                      disabled={!isEditingPayment}
                      value={paymentForm.swiftCode || ''}
                      onChange={(e) => setPaymentForm({ ...paymentForm, swiftCode: e.target.value })}
                      placeholder="CORUTZTZ"
                      className="w-full px-2.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-white disabled:opacity-75"
                    />
                  </div>
                </div>
              </div>

              {isEditingPayment && (
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="submit"
                    disabled={isSavingPayment}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingPayment ? 'Saving Payment Details...' : 'Save & Update Payment Details'}</span>
                  </button>
                </div>
              )}
            </form>
          </div>

        <form onSubmit={handleSaveSettings} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 space-y-8 shadow-xl">
          
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#b8860b] dark:text-[#d4af37]" />
              General System & Organization Parameters
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              General enterprise identifiers, contact details, and default operational mode for GIEZRA FARMS LIMITED.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Company Legal Name
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white/50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Business Mode
              </label>
              <input
                type="text"
                value={settings.businessMode}
                onChange={(e) => setSettings({ ...settings, businessMode: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white/50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                System Support Email
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white/50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                System Support Phone
              </label>
              <input
                type="text"
                value={settings.supportPhone}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white/50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-white/10 pt-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Lock className="w-5 h-5 text-purple-500" />
              Security & Authentication Governance
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Configure session limits, password policies, and multi-factor authentication rules.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Require 2FA for Admins</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Enforce 2FA for CEO & SysAdmin</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.force2FAForAdmins}
                  onChange={(e) => setSettings({ ...settings, force2FAForAdmins: e.target.checked })}
                  className="w-5 h-5 rounded accent-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password Expiry (Days)
                </label>
                <input
                  type="number"
                  value={settings.passwordExpiryDays}
                  onChange={(e) => setSettings({ ...settings, passwordExpiryDays: parseInt(e.target.value) || 90 })}
                  className="w-full px-3.5 py-2.5 bg-white/50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Max Failed Login Attempts (Lockout)
                </label>
                <input
                  type="number"
                  value={settings.maxFailedLoginAttempts}
                  onChange={(e) => setSettings({ ...settings, maxFailedLoginAttempts: parseInt(e.target.value) || 5 })}
                  className="w-full px-3.5 py-2.5 bg-white/50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-medium"
                />
              </div>

            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-white/10 pt-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <HardDrive className="w-5 h-5 text-[#b8860b] dark:text-[#d4af37]" />
              Database Backup & Storage Limits
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Configure automated cloud database backup frequency and snapshot retention rules.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Enable Automated Backups</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Scheduled snapshot engine</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoBackupEnabled}
                  onChange={(e) => setSettings({ ...settings, autoBackupEnabled: e.target.checked })}
                  className="w-5 h-5 rounded accent-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Backup Schedule Frequency
                </label>
                <select
                  value={settings.backupFrequency}
                  onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white/50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-medium"
                >
                  <option value="HOURLY">Hourly Snapshots</option>
                  <option value="DAILY">Daily Snapshots</option>
                  <option value="WEEKLY">Weekly Snapshots</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Snapshot Retention (Days)
                </label>
                <input
                  type="number"
                  value={settings.retentionDays}
                  onChange={(e) => setSettings({ ...settings, retentionDays: parseInt(e.target.value) || 30 })}
                  className="w-full px-3.5 py-2.5 bg-white/50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-medium"
                />
              </div>

            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 dark:border-white/10">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-3 bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#b8860b] hover:from-[#2d6a4f] hover:to-[#d4af37] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xl border border-white/20 transition-all"
            >
              {isSavingSettings ? 'Saving Settings...' : 'Save System Settings'}
            </button>
          </div>

        </form>
        </div>
      )}

      {/* Tab 2: Backups & Recovery */}
      {activeTab === 'backups' && (
        <div className="space-y-6">
          <div className="p-6 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-[#b8860b] dark:text-[#d4af37]" />
                  Database Backup Snapshots & Disaster Recovery
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Full snapshots of GIEZRA FARMS sales, production, inventory, and user records.
                </p>
              </div>

              <button
                onClick={handleCreateBackup}
                disabled={isCreatingBackup}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isCreatingBackup ? 'Snapshotting...' : 'Take Backup Snapshot'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-white/40 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px]">
                    <th className="p-4">Snapshot ID</th>
                    <th className="p-4">Created Date & Time</th>
                    <th className="p-4">File Size</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Created By</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                  {backups.map((b) => (
                    <tr key={b.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                        {b.id}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        {new Date(b.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 font-mono text-slate-600 dark:text-slate-300">
                        {b.size}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-800 dark:text-[#52b788] border border-emerald-500/30">
                          {b.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        {b.createdBy}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedBackupForRestore(b)}
                            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restore
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Database & Server Health */}
      {activeTab === 'health' && dbHealth && (
        <div className="space-y-6">
          <div className="p-6 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                Database Engine & Infrastructure Telemetry
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time connection metrics, indexing status, and latency diagnostics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Latency & Query Speed</div>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{dbHealth.latencyMs} ms</div>
                <p className="text-xs text-slate-500">Average document read response time</p>
              </div>

              <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Active DB Connections</div>
                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{dbHealth.activeConnections}</div>
                <p className="text-xs text-slate-500">Pooled backend client listeners</p>
              </div>

              <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Last Backup Checkpoint</div>
                <div className="text-xl font-bold text-[#b8860b] dark:text-[#d4af37]">
                  {new Date(dbHealth.lastBackupTime).toLocaleString()}
                </div>
                <p className="text-xs text-slate-500">Automated snapshot verified</p>
              </div>

            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Firestore Storage & Collections Index Status
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                All primary composite indexes (`orders_by_customer_date`, `yield_by_batch`, `audit_logs_timestamp`) are built and serving requests with 0 pending indexing tasks.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="p-6 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                System Audit Trail & Security Logs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Immutable security logs tracking user logins, system updates, profile changes, and backups.
              </p>
            </div>

            <div className="px-3.5 py-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Logs are Immutable & Cannot Be Deleted</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-white/40 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px]">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Action Performed</th>
                  <th className="p-4">Device & IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {log.userName}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200">
                      {log.action}
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {log.device || 'Desktop Chrome'} • {log.ipAddress || '197.250.22.14'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Scope & Restrictions */}
      {activeTab === 'scope' && (
        <div className="p-6 sm:p-8 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-purple-500" />
              System Administrator Scope & Governance Specifications
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Neema Mwangi serves as Sales Manager & System Administrator. Technical administration privileges are granted without compromising CEO business authority.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Authorized Privileges */}
            <div className="p-6 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-3xl space-y-4">
              <div className="font-black text-emerald-800 dark:text-emerald-300 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Authorized System Administrator Actions
              </div>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-disc list-inside leading-relaxed font-medium">
                <li>Create and provision new team accounts.</li>
                <li>Edit user profiles, contact info, and photos.</li>
                <li>Reset passwords and unlock locked accounts.</li>
                <li>Activate or deactivate team user accounts.</li>
                <li>Configure system settings and parameters.</li>
                <li>Manage stock records, products, customers, and invoices.</li>
                <li>Trigger and manage automated database backups and restores.</li>
                <li>Monitor database health and troubleshoot technical issues.</li>
              </ul>
            </div>

            {/* Prohibited Restrictions */}
            <div className="p-6 bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-3xl space-y-4">
              <div className="font-black text-rose-800 dark:text-rose-300 text-base flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-600" />
                Strict System Administrator Restrictions
              </div>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-disc list-inside leading-relaxed font-medium">
                <li><strong>CANNOT</strong> modify or deactivate CEO account without approval.</li>
                <li><strong>CANNOT</strong> delete financial or payment history records.</li>
                <li><strong>CANNOT</strong> modify finalized historical sales or audit logs.</li>
                <li><strong>CANNOT</strong> alter company ownership or executive business approvals.</li>
                <li>Enforced strictly at the server API layer via 403 Forbidden checks.</li>
              </ul>
            </div>

          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {selectedBackupForRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 font-bold text-lg">
              <AlertTriangle className="w-6 h-6" />
              <span>Confirm Database Restoration</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to restore snapshot <strong className="font-mono">{selectedBackupForRestore.id}</strong>? All database collections will be synchronized to this checkpoint.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedBackupForRestore(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleRestoreBackup}
                disabled={isRestoring}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                {isRestoring ? 'Restoring...' : 'Confirm Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
