import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { EmailActivityModal } from './EmailActivityModal';
import { UserRole } from '../../types/erp';
import { 
  Building2, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  UserCheck,
  UserPlus,
  KeyRound,
  RefreshCw,
  Phone,
  User as UserIcon,
  Send,
  Inbox
} from 'lucide-react';

export const LoginForm: React.FC = () => {
  const { 
    login, 
    loginWithGoogle, 
    requestOtp, 
    verifyOtp, 
    registerWithEmail,
    emailLogs 
  } = useAuth();

  // Mode: 'login' | 'register' | 'otp_verify'
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'otp_verify'>('login');
  
  // Login / Common Fields
  const [email, setEmail] = useState('ceo@giezrafarms.co.tz');
  const [password, setPassword] = useState('GiezraCEO#2026');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration Fields
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerRole, setRegisterRole] = useState<UserRole>('SALES_MANAGER');
  
  // OTP Verification Fields
  const [otpCode, setOtpCode] = useState('');
  const [otpPurpose, setOtpPurpose] = useState<'login' | 'signup' | 'verification'>('login');
  const [otpTargetEmail, setOtpTargetEmail] = useState('');
  const [lastDispatchedOtp, setLastDispatchedOtp] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // UI state
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [isEmailActivityOpen, setIsEmailActivityOpen] = useState(false);

  // Timer for OTP resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle Standard Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    const result = await login(email, password, rememberMe);

    if (!result.success) {
      setError(result.error || 'Authentication failed');
    }
    setIsSubmitting(false);
  };

  // Handle Requesting OTP for Login
  const handleRequestLoginOtp = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address to receive an OTP code.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    const res = await requestOtp(email, email.split('@')[0], 'login');
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Failed to dispatch OTP code.');
      return;
    }

    setOtpTargetEmail(email);
    setOtpPurpose('login');
    setLastDispatchedOtp(res.otp || null);
    setResendCooldown(45);
    setSuccessMsg(`Verification passcode sent to ${email}. Check your inbox.`);
    setAuthMode('otp_verify');
  };

  // Handle Registration Submit (triggers OTP verification)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !email) {
      setError('Please provide your full name and corporate/Google email.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    const res = await registerWithEmail({
      name: registerName,
      email,
      phone: registerPhone,
      role: registerRole,
      password: password || 'Giezra#2026'
    });

    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Registration failed.');
      return;
    }

    setOtpTargetEmail(email);
    setOtpPurpose('signup');
    setLastDispatchedOtp(res.otp || null);
    setResendCooldown(45);
    setSuccessMsg(`Registration passcode dispatched to ${email}. Check your Gmail/email inbox.`);
    setAuthMode('otp_verify');
  };

  // Handle OTP Code Verification
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const payloadUserData = otpPurpose === 'signup' ? {
      name: registerName || otpTargetEmail.split('@')[0],
      email: otpTargetEmail,
      role: registerRole,
      phone: registerPhone
    } : undefined;

    const res = await verifyOtp(otpTargetEmail, otpCode.trim(), otpPurpose, payloadUserData);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Incorrect or expired verification code.');
      return;
    }

    setSuccessMsg('Email verified successfully! Access granted to GIEZRA ERP.');
  };

  // Handle Google 1-Click Sign-In
  const handleGoogleSignIn = async () => {
    setError('');
    setSuccessMsg('');
    setIsGoogleLoading(true);

    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        setError(res.error || 'Google Sign-In failed.');
      } else {
        setSuccessMsg('Signed in successfully via Google Workspace account.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setIsSubmitting(true);

    const res = await requestOtp(otpTargetEmail, registerName || otpTargetEmail.split('@')[0], otpPurpose);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Failed to resend code.');
      return;
    }

    setLastDispatchedOtp(res.otp || null);
    setResendCooldown(45);
    setSuccessMsg(`New verification code sent to ${otpTargetEmail}`);
  };

  const setDemoAccount = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError('');
    setSuccessMsg('');
    setAuthMode('login');
  };

  return (
    <div className="min-h-screen w-full bg-frosted-radial text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      
      {/* Ambient background glowing orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#d4af37]/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#2d6a4f]/30 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-5xl z-10 flex flex-col lg:flex-row bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-2xl overflow-hidden my-auto">
        
        {/* Left Panel: Brand & Google Email Architecture Highlights */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 bg-white/5">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-[#d4af37] via-[#b8860b] to-[#1b4332] rounded-2xl flex items-center justify-center shadow-lg shadow-[#d4af37]/20 border border-white/20">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  GIEZRA <span className="text-[#d4af37]">ERP</span>
                </h1>
                <p className="text-xs text-emerald-200/80 font-medium">GIEZRA FARMS LIMITED • TANZANIA</p>
              </div>
            </div>

            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-xs font-bold text-[#d4af37]">
                <Sparkles className="w-3.5 h-3.5" />
                Google Workspace & Gmail API Enabled
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light leading-tight text-white">
                Smart Poultry <br />
                <span className="font-bold text-white/95">Business System</span>
              </h2>
              <p className="text-white/70 text-sm sm:text-base leading-relaxed">
                Secure enterprise poultry operations management with automated Google Email OTP verification, biometric RBAC, and real-time outbox tracking.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs uppercase tracking-widest text-[#d4af37] font-semibold">Security & Communication</span>
                <span className="text-[10px] bg-[#2d6a4f]/50 text-[#52b788] px-2.5 py-0.5 rounded-full border border-[#52b788]/30 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Gmail API Active
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-[11px] text-white/70 font-medium">
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#52b788] rounded-full"></div> 6-Digit Email OTP</div>
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#52b788] rounded-full"></div> Google Single Sign-On</div>
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#52b788] rounded-full"></div> Cloud Firestore</div>
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#52b788] rounded-full"></div> Audit Log Tracking</div>
              </div>
            </div>

            {/* Outbox Activity Button */}
            <button
              type="button"
              onClick={() => setIsEmailActivityOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-[#d4af37]" />
                <span>Live Email Dispatch Log ({emailLogs.length})</span>
              </div>
              <span className="text-[10px] text-emerald-400 underline">View Outbox &rarr;</span>
            </button>

            <div className="flex items-center justify-between text-xs text-white/40 font-mono">
              <span>© 2026 GIEZRA FARMS LTD</span>
              <span>v2.2-GmailVerified</span>
            </div>
          </div>
        </div>

        {/* Right Panel: Login / Register / OTP Forms */}
        <div className="w-full lg:w-1/2 p-6 sm:p-10 lg:p-12 bg-slate-950/80 backdrop-blur-xl flex flex-col justify-center">
          
          {/* Top Tabs: Sign In vs Sign Up */}
          {authMode !== 'otp_verify' && (
            <div className="flex items-center p-1 bg-white/5 rounded-2xl border border-white/10 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setError('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  authMode === 'login'
                    ? 'bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setError('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  authMode === 'register'
                    ? 'bg-gradient-to-r from-[#b8860b] to-[#d4af37] text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign Up & Verify Email
              </button>
            </div>
          )}

          {/* Heading */}
          <div className="mb-6">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              {authMode === 'login' && 'Account Login'}
              {authMode === 'register' && 'New Account Registration'}
              {authMode === 'otp_verify' && 'Verify Email Passcode'}
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm">
              {authMode === 'login' && 'Sign in to access your poultry operations workspace.'}
              {authMode === 'register' && 'Register your staff account to receive an OTP verification email.'}
              {authMode === 'otp_verify' && `Enter the 6-digit passcode dispatched to ${otpTargetEmail}`}
            </p>
          </div>

          {/* Notifications */}
          {error && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex items-center space-x-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex items-center space-x-3 animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Official Sign In with Google Button */}
          {authMode !== 'otp_verify' && (
            <div className="mb-6 space-y-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isSubmitting}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-lg transition-all border border-slate-200 active:scale-[0.99] disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <RefreshCw className="w-5 h-5 text-slate-700 animate-spin" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-white/10 w-full"></div>
                <span className="bg-slate-950 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-bold shrink-0">
                  Or continue with corporate credentials
                </span>
                <div className="border-t border-white/10 w-full"></div>
              </div>
            </div>
          )}

          {/* MODE 1: LOGIN FORM */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold text-[#d4af37] uppercase tracking-wider mb-1.5">
                  Corporate / Google Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-emerald-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@giezrafarms.co.tz"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 focus:border-[#d4af37] transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-[#d4af37] uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(true)}
                    className="text-xs text-[#d4af37] hover:underline transition-colors font-medium"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 text-emerald-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 focus:border-[#d4af37] transition-all placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & 2FA Note */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-[#1b4332] focus:ring-[#d4af37]/40"
                  />
                  <span>Remember session</span>
                </label>

                <button
                  type="button"
                  onClick={handleRequestLoginOtp}
                  disabled={isSubmitting}
                  className="text-xs text-[#52b788] hover:text-[#d4af37] font-semibold flex items-center gap-1 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Sign in with Email OTP
                </button>
              </div>

              {/* Submit Buttons */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#b8860b] hover:from-[#2d6a4f] hover:to-[#d4af37] text-white font-bold text-sm shadow-xl shadow-[#1b4332]/40 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 2: SIGN UP / REGISTRATION FORM */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-[#d4af37] uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="e.g. Juma Hamisi"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 focus:border-[#d4af37] placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-bold text-[#d4af37] uppercase tracking-wider mb-1">
                  Email (OTP will be sent here)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="juma.hamisi@gmail.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 focus:border-[#d4af37] placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Phone & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#d4af37] uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      placeholder="+255 754 123 456"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 focus:border-[#d4af37] placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#d4af37] uppercase tracking-wider mb-1">
                    Operational Role
                  </label>
                  <select
                    value={registerRole}
                    onChange={(e) => setRegisterRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 focus:border-[#d4af37]"
                  >
                    <option value="SALES_MANAGER">Sales Manager</option>
                    <option value="STOCK_MANAGER">Stock & Warehouse Mgr</option>
                    <option value="OPERATIONS_MANAGER">Operations Manager</option>
                    <option value="ASSISTANT_CEO">Assistant CEO</option>
                    <option value="SYSTEM_ADMINISTRATOR">System Administrator</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-[#d4af37] uppercase tracking-wider mb-1">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 focus:border-[#d4af37] placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Submit Registration */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#52b788] hover:opacity-95 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center space-x-2 transition-all mt-4 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Dispatching OTP via Gmail...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Verification Passcode to Email</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 3: OTP PASSCODE VERIFICATION */}
          {authMode === 'otp_verify' && (
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-5">
              
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="text-xs text-slate-300">
                  A 6-digit verification code has been dispatched to:
                </div>
                <div className="text-sm font-bold text-emerald-300 font-mono">
                  {otpTargetEmail}
                </div>
                <div className="text-[11px] text-slate-400">
                  Please check your Gmail inbox or spam folder. Passcode valid for 10 minutes.
                </div>
              </div>

              {/* OTP Input */}
              <div>
                <label className="block text-[11px] font-bold text-[#d4af37] uppercase tracking-wider mb-2 text-center">
                  Enter 6-Digit Verification Passcode
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                  required
                  className="w-full py-4 text-center tracking-[12px] font-mono font-black text-3xl sm:text-4xl bg-white/10 border-2 border-[#d4af37]/60 rounded-2xl text-white focus:outline-none focus:ring-4 focus:ring-[#d4af37]/30 focus:border-[#d4af37] transition-all"
                />
              </div>

              {/* Instant Test Helper / Auto-Fill Badge */}
              {lastDispatchedOtp && (
                <div className="p-3 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Sparkles className="w-4 h-4 text-[#d4af37]" />
                    <span>Dispatched Code: <strong className="text-[#d4af37] font-mono tracking-widest">{lastDispatchedOtp}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpCode(lastDispatchedOtp)}
                    className="px-2.5 py-1 rounded-lg bg-[#d4af37] text-slate-950 font-bold text-[10px] hover:bg-yellow-400 transition-colors"
                  >
                    Fill Code
                  </button>
                </div>
              )}

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isSubmitting || otpCode.length < 6}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#b8860b] hover:from-[#2d6a4f] hover:to-[#d4af37] text-white font-bold text-sm shadow-xl flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Verifying Passcode...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Verify Code & Enter Workspace</span>
                  </>
                )}
              </button>

              {/* Resend & Back actions */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="hover:text-white transition-colors"
                >
                  &larr; Back to login
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isSubmitting}
                  className={`flex items-center gap-1 font-semibold ${
                    resendCooldown > 0 
                      ? 'text-slate-500 cursor-not-allowed' 
                      : 'text-[#d4af37] hover:underline'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email OTP'}
                </button>
              </div>

            </form>
          )}

          {/* Quick One-Click Role Selector (Shown on Login Mode) */}
          {authMode === 'login' && (
            <div className="mt-6 pt-5 border-t border-white/10 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  One-Click Role Selectors
                </span>
                <span className="text-[10px] text-slate-500">Fast Demo Access</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDemoAccount('ceo@giezrafarms.co.tz', 'GiezraCEO#2026')}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    email === 'ceo@giezrafarms.co.tz'
                      ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="text-xs font-bold truncate">👑 CEO</div>
                  <div className="text-[10px] text-slate-400 truncate">Executive Lead</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDemoAccount('sales@giezrafarms.co.tz', 'GiezraSales#2026')}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    email === 'sales@giezrafarms.co.tz'
                      ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="text-xs font-bold truncate">📈 Sales Mgr</div>
                  <div className="text-[10px] text-slate-400 truncate">CRM & Orders</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDemoAccount('ops@giezrafarms.co.tz', 'GiezraOps#2026')}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    email === 'ops@giezrafarms.co.tz'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="text-xs font-bold truncate">⚙️ Operations</div>
                  <div className="text-[10px] text-slate-400 truncate">Production</div>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
      />

      {/* Live Email Activity / Outbox Modal */}
      <EmailActivityModal
        isOpen={isEmailActivityOpen}
        onClose={() => setIsEmailActivityOpen(false)}
        onSelectOtp={(otp) => {
          setOtpCode(otp);
          setAuthMode('otp_verify');
        }}
      />

    </div>
  );
};
