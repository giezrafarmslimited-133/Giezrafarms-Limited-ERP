import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, UserRole, AuditLog } from '../../types/erp';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Building,
  Briefcase,
  ShieldCheck,
  Key,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Smartphone,
  Globe,
  Clock,
  Sparkles,
  UserX,
  ChevronDown,
  Send,
  QrCode,
  ShieldAlert,
  Save,
  X,
  UserCheck
} from 'lucide-react';

export const UserProfileView: React.FC = () => {
  const {
    currentUser,
    usersList,
    updateUserProfile,
    changeUserPassword,
    sendPasswordResetEmail,
    toggleUser2FA,
    verifyUserEmail,
    toggleUserStatus
  } = useAuth();

  // CEO target user selection (defaults to current logged-in user)
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser?.id || '');

  // Form state for target user profile
  const [formData, setFormData] = useState<Partial<User>>({});

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status and UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userLogs, setUserLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync selected target user when currentUser or selectedUserId changes
  useEffect(() => {
    if (!selectedUserId && currentUser) {
      setSelectedUserId(currentUser.id);
    }
  }, [currentUser]);

  const targetUser = usersList.find((u) => u.id === selectedUserId) || currentUser;

  useEffect(() => {
    if (targetUser) {
      setFormData({
        name: targetUser.name || '',
        email: targetUser.email || '',
        phone: targetUser.phone || '',
        officePosition: targetUser.officePosition || getDefaultPosition(targetUser.role),
        employeeId: targetUser.employeeId || getDefaultEmployeeId(targetUser.id),
        department: targetUser.department || getDefaultDepartment(targetUser.role),
        officeAddress: targetUser.officeAddress || 'Giezra Farms HQ, Plot 14, Mikocheni Light Industrial Area, Dar es Salaam',
        emergencyContactName: targetUser.emergencyContactName || '',
        emergencyContactPhone: targetUser.emergencyContactPhone || '',
        preferredLanguage: targetUser.preferredLanguage || 'English',
        timeZone: targetUser.timeZone || 'East Africa Time (EAT) UTC+3',
        role: targetUser.role,
        avatarUrl: targetUser.avatarUrl || ''
      });
      fetchUserAuditLogs(targetUser.id, targetUser.email);
    }
  }, [selectedUserId, targetUser]);

  const fetchUserAuditLogs = async (userId: string, email: string) => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const logs: AuditLog[] = await res.json();
        const filtered = logs.filter(
          (l) => l.userId === userId || l.details.toLowerCase().includes(email.toLowerCase())
        );
        setUserLogs(filtered.slice(0, 10));
      }
    } catch (e) {
      console.error('Error loading audit logs for user profile:', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  function getDefaultPosition(role: UserRole) {
    switch (role) {
      case 'CEO': return 'Chief Executive Officer & Founder';
      case 'ASSISTANT_CEO': return 'Assistant CEO & Operations Oversight';
      case 'OPERATIONS_MANAGER': return 'Head of Processing & Plant Operations';
      case 'SALES_MANAGER': return 'Commercial Sales & Key Accounts Manager';
      case 'STOCK_MANAGER': return 'Cold Storage & Inventory Controller';
      default: return 'Giezra Farms Staff';
    }
  }

  function getDefaultEmployeeId(id: string) {
    if (id.includes('ceo')) return 'GZ-EMP-001';
    if (id.includes('ace')) return 'GZ-EMP-002';
    if (id.includes('ops')) return 'GZ-EMP-003';
    if (id.includes('sales')) return 'GZ-EMP-004';
    if (id.includes('stock')) return 'GZ-EMP-005';
    return `GZ-EMP-${id.slice(-3).toUpperCase()}`;
  }

  function getDefaultDepartment(role: UserRole) {
    switch (role) {
      case 'CEO':
      case 'ASSISTANT_CEO': return 'Executive Leadership';
      case 'OPERATIONS_MANAGER': return 'Processing & Plant Operations';
      case 'SALES_MANAGER': return 'Sales & Commercial CRM';
      case 'STOCK_MANAGER': return 'Cold Storage & Logistics';
      default: return 'Operations';
    }
  }

  const handleInputChange = (field: keyof User, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Image Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification('error', 'File size exceeds limit. Please select an image under 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData((prev) => ({ ...prev, avatarUrl: base64String }));
        showNotification('success', 'Profile picture selected! Click "Save Profile Changes" to persist.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, avatarUrl: '' }));
    showNotification('success', 'Profile picture removed. Click "Save Profile Changes" to persist.');
  };

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;

    // Validation
    if (!formData.name || formData.name.trim() === '') {
      showNotification('error', 'Validation Error: Full Name is required.');
      return;
    }

    if (!formData.email || formData.email.trim() === '') {
      showNotification('error', 'Validation Error: Login Email is required.');
      return;
    }

    // Phone validation
    if (formData.phone && formData.phone.trim() !== '') {
      const cleanPhone = formData.phone.replace(/[\s\-\(\)\+]/g, '');
      if (cleanPhone.length < 8 || !/^\d+$/.test(cleanPhone)) {
        showNotification('error', 'Validation Error: Please enter a valid phone number (e.g. +255 754 112 233).');
        return;
      }
    }

    setIsSaving(true);
    const result = await updateUserProfile(targetUser.id, formData);
    setIsSaving(false);

    if (result.success) {
      showNotification('success', `Profile for ${formData.name} updated successfully!`);
      if (targetUser) {
        fetchUserAuditLogs(targetUser.id, targetUser.email);
      }
    } else {
      showNotification('error', result.error || 'Failed to update user profile.');
    }
  };

  // Cancel / Reset Form
  const handleResetForm = () => {
    if (targetUser) {
      setFormData({
        name: targetUser.name || '',
        email: targetUser.email || '',
        phone: targetUser.phone || '',
        officePosition: targetUser.officePosition || getDefaultPosition(targetUser.role),
        employeeId: targetUser.employeeId || getDefaultEmployeeId(targetUser.id),
        department: targetUser.department || getDefaultDepartment(targetUser.role),
        officeAddress: targetUser.officeAddress || '',
        emergencyContactName: targetUser.emergencyContactName || '',
        emergencyContactPhone: targetUser.emergencyContactPhone || '',
        preferredLanguage: targetUser.preferredLanguage || 'English',
        timeZone: targetUser.timeZone || 'East Africa Time (EAT) UTC+3',
        role: targetUser.role,
        avatarUrl: targetUser.avatarUrl || ''
      });
      showNotification('success', 'Form values reset to current saved values.');
    }
  };

  // Password Change Handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;

    if (!newPassword || newPassword.length < 6) {
      showNotification('error', 'Password Validation: New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showNotification('error', 'Password Validation: New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);
    const result = await changeUserPassword(targetUser.id, newPassword, currentPassword);
    setIsChangingPassword(false);

    if (result.success) {
      showNotification('success', 'Account password successfully updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      fetchUserAuditLogs(targetUser.id, targetUser.email);
    } else {
      showNotification('error', result.error || 'Password update failed.');
    }
  };

  // Trigger Password Reset Email
  const handleSendResetEmail = async () => {
    if (!targetUser) return;
    const res = await sendPasswordResetEmail(targetUser.id);
    if (res.success) {
      showNotification('success', res.message || `Password reset link sent to ${targetUser.email}`);
    } else {
      showNotification('error', res.error || 'Failed to send password reset email.');
    }
  };

  // Toggle 2FA
  const handleToggle2FA = async () => {
    if (!targetUser) return;
    const nextState = !targetUser.twoFactorEnabled;
    const res = await toggleUser2FA(targetUser.id, nextState);
    if (res.success) {
      showNotification(
        'success',
        `Two-Factor Authentication (2FA) is now ${nextState ? 'ENABLED' : 'DISABLED'} for ${targetUser.name}.`
      );
      setShow2FAModal(false);
    } else {
      showNotification('error', res.error || 'Failed to update 2FA state.');
    }
  };

  // Verify Email
  const handleVerifyEmail = async () => {
    if (!targetUser) return;
    const res = await verifyUserEmail(targetUser.id);
    if (res.success) {
      showNotification('success', `Email address ${targetUser.email} has been verified.`);
    } else {
      showNotification('error', res.error || 'Email verification failed.');
    }
  };

  const isCEO = currentUser?.role === 'CEO';
  const isEditingSelf = currentUser?.id === targetUser?.id;

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-7xl mx-auto">
      
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 max-w-md px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-2xl flex items-center gap-3 text-sm font-semibold transition-all animate-in fade-in slide-in-from-top-4 duration-300 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50 shadow-emerald-900/50'
              : 'bg-rose-950/90 text-rose-200 border-rose-500/50 shadow-rose-900/50'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="flex-1">{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl text-slate-900 dark:text-white shadow-2xl border border-slate-200/80 dark:border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#d4af37]/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#b8860b] dark:text-[#d4af37] mb-1">
              <UserCheck className="w-4 h-4 text-[#d4af37]" />
              <span>Phase 1 Update • Employee Profile & Identity Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {isEditingSelf ? 'My Account Profile' : `Employee Profile: ${targetUser?.name}`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-emerald-200/80 mt-1 max-w-2xl leading-relaxed">
              Manage personal information, security credentials, 2FA, contact details, and audit records for GIEZRA FARMS LIMITED.
            </p>
          </div>

          {/* CEO Employee Profile Switcher */}
          {isCEO && (
            <div className="bg-white/40 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-300 dark:border-white/15 backdrop-blur-md space-y-1.5 shrink-0 min-w-[260px]">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#b8860b] dark:text-[#d4af37]">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                  CEO Executive Mode
                </span>
                <span className="text-[10px] bg-[#d4af37]/20 px-2 py-0.5 rounded-full border border-[#d4af37]/40 text-[#b8860b] dark:text-[#d4af37]">
                  All Profiles Access
                </span>
              </div>
              
              <div className="relative">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 cursor-pointer"
                >
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                      {u.name} ({u.role.replace('_', ' ')}){u.id === currentUser?.id ? ' - (You)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Profile Picture & Summary + Personal Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Quick Summary */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Avatar Card */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 shadow-xl flex flex-col items-center text-center space-y-6 relative overflow-hidden">
            
            <div className="relative group">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-[#1b4332] via-[#2d6a4f] to-[#d4af37] shadow-2xl overflow-hidden shrink-0">
                {formData.avatarUrl ? (
                  <img
                    src={formData.avatarUrl}
                    alt={formData.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center text-3xl font-black text-[#d4af37]">
                    {formData.name ? formData.name.charAt(0) : 'U'}
                  </div>
                )}
              </div>

              {/* Upload trigger overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2.5 bg-gradient-to-r from-[#1b4332] to-[#b8860b] text-white rounded-full shadow-xl border border-white/30 hover:scale-110 transition-all"
                title="Upload Profile Picture"
              >
                <Camera className="w-4 h-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div className="space-y-1 w-full">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {formData.name}
              </h3>
              <p className="text-xs font-semibold text-[#b8860b] dark:text-[#d4af37]">
                {formData.officePosition || getDefaultPosition(targetUser?.role || 'SALES_MANAGER')}
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px]">
                <span className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-slate-200 font-mono font-bold border border-slate-300 dark:border-white/10">
                  {formData.employeeId || getDefaultEmployeeId(targetUser?.id || '')}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#1b4332]/20 dark:bg-[#52b788]/20 text-[#1b4332] dark:text-[#52b788] font-bold border border-[#52b788]/30">
                  {formData.department || getDefaultDepartment(targetUser?.role || 'SALES_MANAGER')}
                </span>
              </div>
            </div>

            {/* Picture Actions */}
            <div className="flex items-center gap-2 w-full pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 text-slate-900 dark:text-white rounded-2xl border border-slate-300 dark:border-white/10 text-xs font-bold transition-all flex items-center justify-center gap-1.5 backdrop-blur-md"
              >
                <Camera className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Replace</span>
              </button>

              {formData.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 rounded-2xl border border-rose-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  title="Remove Photo"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {/* Quick Status Pill */}
            <div className="w-full pt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Account Status</span>
              {targetUser?.isActive ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-[#52b788] border border-emerald-500/30 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#52b788]" />
                  Active
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-bold flex items-center gap-1">
                  <UserX className="w-3 h-3 text-rose-500" />
                  Deactivated
                </span>
              )}
            </div>
          </div>

          {/* Account Security Overview Card */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 border-b border-slate-200/80 dark:border-white/10 pb-3">
              <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Security & Telemetry
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Last Login
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-200 text-right">
                  {targetUser?.lastLogin
                    ? new Date(targetUser.lastLogin).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })
                    : 'Active Now'}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  Device
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-200 text-right truncate max-w-[170px]">
                  {targetUser?.lastLoginDevice || 'Chrome 127 on macOS / Android'}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  Location / IP
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-200 text-right">
                  {targetUser?.lastLoginLocation || 'Dar es Salaam, TZ (197.250.12.4)'}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2 border-t border-slate-200/60 dark:border-white/5 pt-2">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Created On
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-200 text-right">
                  {new Date(targetUser?.createdAt || '2026-01-01').toLocaleDateString('en-US', {
                    dateStyle: 'long'
                  })}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Columns: Personal Info Form, Password Card & 2FA */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Personal Information Form Card */}
          <form onSubmit={handleSaveProfile} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 space-y-6 shadow-xl">
            
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-[#d4af37]" />
                  Personal & Office Details
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update personal contact records, language preferences, and emergency info.
                </p>
              </div>

              <span className="text-[11px] px-3 py-1 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#b8860b] dark:text-[#d4af37] font-bold">
                {isEditingSelf ? 'Self Editable' : 'CEO Admin Override'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Godfrey Emily Mzava"
                    className="w-full pl-10 pr-3 py-2.5 bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Login Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  Official Login Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="ceo@giezrafarms.co.tz"
                    className="w-full pl-10 pr-3 py-2.5 bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+255 754 112 233"
                    className="w-full pl-10 pr-3 py-2.5 bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 font-semibold"
                  />
                </div>
              </div>

              {/* User Role (Read Only for non-CEO, Editable for CEO) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    Assigned Role
                  </label>
                  {!isCEO && (
                    <span className="text-[10px] text-slate-400 italic">Read Only (CEO Only)</span>
                  )}
                </div>
                {isCEO ? (
                  <select
                    value={formData.role || 'SALES_MANAGER'}
                    onChange={(e) => handleInputChange('role', e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 bg-white/50 dark:bg-slate-900/90 border border-slate-300 dark:border-white/10 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40"
                  >
                    <option value="CEO">CEO (Chief Executive Officer)</option>
                    <option value="ASSISTANT_CEO">ASSISTANT CEO</option>
                    <option value="OPERATIONS_MANAGER">OPERATIONS MANAGER</option>
                    <option value="SALES_MANAGER">SALES MANAGER</option>
                    <option value="STOCK_MANAGER">STOCK MANAGER</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={targetUser?.role ? targetUser.role.replace('_', ' ') : 'STAFF'}
                    readOnly
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                )}
              </div>

              {/* Office Position (Read Only for employee unless CEO) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Office Position
                  </label>
                  {!isCEO && <span className="text-[10px] text-slate-400 italic">Read Only</span>}
                </div>
                <input
                  type="text"
                  value={formData.officePosition || ''}
                  onChange={(e) => handleInputChange('officePosition', e.target.value)}
                  readOnly={!isCEO}
                  className={`w-full px-3.5 py-2.5 border rounded-2xl text-xs sm:text-sm font-semibold ${
                    isCEO
                      ? 'bg-white/50 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white'
                      : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  }`}
                />
              </div>

              {/* Employee ID (Read Only for employee unless CEO) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Employee ID
                  </label>
                  {!isCEO && <span className="text-[10px] text-slate-400 italic">Read Only</span>}
                </div>
                <input
                  type="text"
                  value={formData.employeeId || ''}
                  onChange={(e) => handleInputChange('employeeId', e.target.value)}
                  readOnly={!isCEO}
                  className={`w-full px-3.5 py-2.5 border rounded-2xl text-xs sm:text-sm font-mono font-bold ${
                    isCEO
                      ? 'bg-white/50 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white'
                      : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  }`}
                />
              </div>

              {/* Department (Read Only for employee unless CEO) */}
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Department Unit
                  </label>
                  {!isCEO && <span className="text-[10px] text-slate-400 italic">Read Only</span>}
                </div>
                <input
                  type="text"
                  value={formData.department || ''}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  readOnly={!isCEO}
                  className={`w-full px-3.5 py-2.5 border rounded-2xl text-xs sm:text-sm font-semibold ${
                    isCEO
                      ? 'bg-white/50 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white'
                      : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  }`}
                />
              </div>

              {/* Office Address */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Office Station / Branch Address
                </label>
                <input
                  type="text"
                  value={formData.officeAddress || ''}
                  onChange={(e) => handleInputChange('officeAddress', e.target.value)}
                  placeholder="Giezra Farms HQ, Plot 14, Mikocheni Light Industrial Area, Dar es Salaam"
                  className="w-full px-3.5 py-2.5 bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 font-semibold"
                />
              </div>

              {/* Emergency Contact Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={formData.emergencyContactName || ''}
                  onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                  placeholder="Emily Mzava"
                  className="w-full px-3.5 py-2.5 bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 font-semibold"
                />
              </div>

              {/* Emergency Contact Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Emergency Contact Phone
                </label>
                <input
                  type="text"
                  value={formData.emergencyContactPhone || ''}
                  onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                  placeholder="+255 754 999 888"
                  className="w-full px-3.5 py-2.5 bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 font-semibold"
                />
              </div>

              {/* Preferred Language */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Preferred UI Language
                </label>
                <select
                  value={formData.preferredLanguage || 'English'}
                  onChange={(e) => handleInputChange('preferredLanguage', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/50 dark:bg-slate-900/90 border border-slate-300 dark:border-white/10 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40"
                >
                  <option value="English">English</option>
                  <option value="Swahili / Kiswahili">Swahili / Kiswahili</option>
                </select>
              </div>

              {/* Time Zone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Time Zone
                </label>
                <select
                  value={formData.timeZone || 'East Africa Time (EAT) UTC+3'}
                  onChange={(e) => handleInputChange('timeZone', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/50 dark:bg-slate-900/90 border border-slate-300 dark:border-white/10 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40"
                >
                  <option value="East Africa Time (EAT) UTC+3">East Africa Time (EAT) UTC+3</option>
                  <option value="Central Africa Time (CAT) UTC+2">Central Africa Time (CAT) UTC+2</option>
                  <option value="Coordinated Universal Time (UTC)">UTC</option>
                </select>
              </div>

            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-5 py-2.5 bg-white/30 dark:bg-white/5 hover:bg-white/50 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm rounded-2xl border border-slate-300 dark:border-white/10 transition-all backdrop-blur-md"
              >
                Reset / Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#b8860b] hover:from-[#2d6a4f] hover:to-[#d4af37] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xl shadow-[#1b4332]/30 border border-white/20 flex items-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#d4af37]" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-[#d4af37]" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Two-Step Verification & Email Security Card */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#d4af37]" />
                  Two-Step Verification & Email Auth
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enforce strict multi-factor authentication and official corporate email verification.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Email Verification Box */}
              <div className="p-5 bg-white/40 dark:bg-white/5 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Email Verification Status
                  </span>
                  {targetUser?.emailVerified ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-[#52b788] border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#52b788]" />
                      Verified
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-[#b8860b] dark:text-[#d4af37] border border-[#d4af37]/30 text-[11px] font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-[#d4af37]" />
                      Unverified
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Official corporate email address: <strong className="text-slate-900 dark:text-white">{targetUser?.email}</strong>
                </p>

                <div className="pt-2">
                  {!targetUser?.emailVerified ? (
                    <button
                      type="button"
                      onClick={handleVerifyEmail}
                      className="w-full py-2 px-3 bg-[#1b4332] hover:bg-[#2d6a4f] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      <Send className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Verify Email Address</span>
                    </button>
                  ) : (
                    <div className="text-[11px] text-emerald-600 dark:text-[#52b788] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Email security protocol verified
                    </div>
                  )}
                </div>
              </div>

              {/* Two-Factor Authentication Box */}
              <div className="p-5 bg-white/40 dark:bg-white/5 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Two-Factor Auth (2FA)
                  </span>
                  {targetUser?.twoFactorEnabled ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-[#52b788] border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#52b788]" />
                      2FA Active
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-white/10 text-[11px] font-bold">
                      2FA Disabled
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Requires 6-digit TOTP code from Google Authenticator or SMS on login.
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShow2FAModal(true)}
                    className="w-full py-2 px-3 bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 text-slate-900 dark:text-white rounded-xl text-xs font-bold border border-slate-300 dark:border-white/10 flex items-center justify-center gap-1.5 transition-all backdrop-blur-md"
                  >
                    <QrCode className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>{targetUser?.twoFactorEnabled ? 'Manage 2FA Setup' : 'Enable 2FA Protection'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Password Management Card */}
          <form onSubmit={handlePasswordSubmit} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 space-y-6 shadow-xl">
            
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-[#d4af37]" />
                  Password Security & Reset
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update your security password or trigger password reset instructions to email.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSendResetEmail}
                className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-[#b8860b] dark:text-[#d4af37] border border-[#d4af37]/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Send Reset Email</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full pl-10 pr-10 py-2.5 bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type password"
                    className="w-full pl-10 pr-10 py-2.5 bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                <p>• Password must be at least 6 characters in length.</p>
                <p>• Every password change is logged in the immutable system security audit trail.</p>
              </div>

              <button
                type="submit"
                disabled={isChangingPassword || !newPassword}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-[#b8860b] hover:from-[#b8860b] hover:to-[#d4af37] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg border border-white/20 transition-all disabled:opacity-40 shrink-0"
              >
                {isChangingPassword ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>

          </form>

          {/* Activity Log / History Card */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-[#d4af37]" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  User Audit Trail & Profile History
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {userLogs.length} Recent Events
              </span>
            </div>

            {loadingLogs ? (
              <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#d4af37]" />
                <span>Loading security audit logs...</span>
              </div>
            ) : userLogs.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                No recent profile updates or security events logged for this user.
              </p>
            ) : (
              <div className="space-y-3">
                {userLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-white/40 dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#d4af37]/20 border border-[#d4af37]/30 text-[#b8860b] dark:text-[#d4af37] text-[10px] font-mono font-extrabold">
                          {log.action}
                        </span>
                        <span>{log.details}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Module: {log.module} • Executed by {log.userName} ({log.userRole})
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono shrink-0">
                      {new Date(log.timestamp).toLocaleString('en-US', {
                        dateStyle: 'short',
                        timeStyle: 'medium'
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative text-white">
            <button
              onClick={() => setShow2FAModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] flex items-center justify-center mx-auto shadow-lg">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black">Two-Factor Authentication</h3>
              <p className="text-xs text-slate-300">
                Scan this QR code with Google Authenticator or Microsoft Authenticator app on your phone.
              </p>
            </div>

            {/* Mock QR Code Display */}
            <div className="bg-white p-4 rounded-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-inner">
              <div className="text-center text-slate-900 space-y-1">
                <QrCode className="w-32 h-32 mx-auto text-slate-950" />
                <p className="text-[10px] font-mono font-bold text-slate-600">GIEZRA-ERP-2FA</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">
                Enter 6-Digit Authenticator Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-[0.5em] font-mono text-lg py-2.5 bg-slate-800 border border-slate-700 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShow2FAModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleToggle2FA}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#1b4332] to-[#b8860b] hover:from-[#2d6a4f] hover:to-[#d4af37] text-white rounded-xl text-xs font-bold transition-all shadow-lg"
              >
                {targetUser?.twoFactorEnabled ? 'Disable 2FA' : 'Verify & Activate 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
