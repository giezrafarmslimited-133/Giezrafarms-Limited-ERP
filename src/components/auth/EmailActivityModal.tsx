import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Mail, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  RefreshCw, 
  X, 
  ShieldCheck, 
  KeyRound,
  Send
} from 'lucide-react';

interface EmailActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOtp?: (otp: string) => void;
}

export const EmailActivityModal: React.FC<EmailActivityModalProps> = ({
  isOpen,
  onClose,
  onSelectOtp
}) => {
  const { emailLogs, refreshEmailLogs, googleAccessToken } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-[#d4af37]/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Google Workspace Email Outbox
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono">
                  Gmail API Active
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Live telemetric audit of OTP codes, verification emails & alerts dispatched to users.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => refreshEmailLogs()}
              title="Refresh logs"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Integration Status Bar */}
        <div className="px-5 py-3 bg-emerald-950/40 border-b border-emerald-800/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
            <span>Connected to Project: <strong>gen-lang-client-0335830100</strong> (Giezra Farms Limited)</span>
          </div>
          <div className="text-emerald-400/80 font-mono text-[11px]">
            {googleAccessToken ? '● OAuth Bearer Active' : '● Server Relay Ready'}
          </div>
        </div>

        {/* Logs List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {emailLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No verification emails dispatched yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Initiate a sign-in, registration, or OTP request to see outgoing Gmail messages here.
              </p>
            </div>
          ) : (
            emailLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#d4af37]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white truncate max-w-[280px]">
                      {log.to}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      {log.status === 'SENT_VIA_GMAIL_API' ? 'Gmail API Dispatched' : log.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    {log.subject}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span>Sender: {log.sender}</span>
                  </div>
                </div>

                {log.otpCode && (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <div className="text-center px-3 py-1.5 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40">
                      <div className="text-[9px] uppercase tracking-wider text-[#d4af37] font-bold">OTP Code</div>
                      <div className="text-lg font-black tracking-widest text-[#d4af37] font-mono">
                        {log.otpCode}
                      </div>
                    </div>
                    {onSelectOtp && (
                      <button
                        onClick={() => {
                          onSelectOtp(log.otpCode!);
                          onClose();
                        }}
                        className="px-3 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md"
                      >
                        Auto-Fill
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <KeyRound className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Scope: <code className="text-slate-300">gmail.send</code> & <code className="text-slate-300">userinfo.email</code></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
