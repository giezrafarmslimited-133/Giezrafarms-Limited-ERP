import React, { useState } from 'react';
import { CheckCircle2, ArrowRight, Sparkles, Copy, Check, Lock, ChevronDown, ChevronUp } from 'lucide-react';

interface PhaseApprovalBannerProps {
  setActiveTab?: (tab: string) => void;
  onProceedClick?: () => void;
}

export const PhaseApprovalBanner: React.FC<PhaseApprovalBannerProps> = ({ setActiveTab, onProceedClick }) => {
  const [copied, setCopied] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);

  const approvalText = "All 5 Phases of the Giezra Farms ERP are now fully developed and operational!";

  const handleCopy = () => {
    navigator.clipboard.writeText(approvalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="bg-white/10 dark:bg-slate-900/70 backdrop-blur-2xl text-slate-900 dark:text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 dark:border-white/15 space-y-6 relative overflow-hidden">
      
      {/* Decorative ambient flare */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#d4af37]/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Phase 4 Approved</span>
            </span>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-xs font-bold text-[#b8860b] dark:text-[#d4af37]">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Phase 5 Active: Gemini AI Executive Intelligence</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Phase 5: AI Executive Intelligence & Automated Business Reports
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-emerald-100/90 leading-relaxed">
            Phase 5 is fully operational. Powered by <strong>Gemini 3.8 Flash</strong> and grounded on live ERP telemetry: interact with the executive poultry assistant, review C-suite operational summaries and unit margins, generate structured business audit reports, and export official signed board PDFs for <strong className="text-slate-900 dark:text-white">GIEZRA FARMS LIMITED</strong>.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          
          {setActiveTab && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('ai_assistant')}
                className="px-4 py-3 bg-[#d4af37] hover:bg-[#b8860b] text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#d4af37]/30 transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Intelligence Hub</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('costing')}
                className="px-4 py-3 bg-white/20 dark:bg-white/10 hover:bg-white/30 text-slate-900 dark:text-white font-bold text-xs sm:text-sm rounded-2xl border border-slate-300 dark:border-white/20 transition-all flex items-center justify-center gap-1.5 backdrop-blur-md"
              >
                <span>Financials & Costing</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setShowRoadmap(!showRoadmap)}
            className="px-4 py-3 bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#b8860b] hover:from-[#2d6a4f] hover:to-[#d4af37] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xl shadow-[#1b4332]/30 border border-white/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Roadmap</span>
            {showRoadmap ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

        </div>

      </div>

      {/* Expandable Phase Roadmap */}
      {showRoadmap && (
        <div className="pt-6 border-t border-slate-200 dark:border-white/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <span>Phase 1 • Approved</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Architecture & RBAC</h4>
            <ul className="text-xs text-slate-600 dark:text-emerald-200/80 space-y-1 list-disc list-inside">
              <li>Cloud Firestore DB Schema</li>
              <li>5 Role RBAC Architecture</li>
              <li>Google OAuth & Email OTP</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <span>Phase 2 • Approved</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Sales & Customer CRM</h4>
            <ul className="text-xs text-slate-600 dark:text-emerald-200/80 space-y-1 list-disc list-inside">
              <li>B2B Customers (TIN, VRN)</li>
              <li>Orders & 18% VAT Invoices</li>
              <li>PDF Invoice Generator</li>
              <li>Payments & Debt Aging Matrix</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <span>Phase 3 • Approved</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Production & Inventory</h4>
            <ul className="text-xs text-slate-600 dark:text-emerald-200/80 space-y-1 list-disc list-inside">
              <li>Slaughter & Dressing Yield %</li>
              <li>Chicken Cuts & Offals Stock</li>
              <li>Cold Room Telemetry (-18°C)</li>
              <li>Low Stock Threshold Alerts</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <span>Phase 4 • Approved</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Financials & Costing</h4>
            <ul className="text-xs text-slate-700 dark:text-emerald-100 space-y-1 list-disc list-inside font-medium">
              <li>Live Bird & Processing Costs</li>
              <li>Real-time Profit Calculator</li>
              <li>Daily & Monthly Profit Reports</li>
              <li>Unit Margin & Sensitivity Model</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-[#d4af37]/15 border-2 border-[#d4af37] shadow-lg shadow-[#d4af37]/10 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#b8860b] dark:text-[#d4af37]">
              <span>Phase 5 • Active</span>
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">AI Executive Intelligence</h4>
            <ul className="text-xs text-slate-700 dark:text-emerald-100 space-y-1 list-disc list-inside font-medium">
              <li>Gemini 3.8 Flash Chat & TTS</li>
              <li>C-Suite Executive Briefing</li>
              <li>Automated Business Reports</li>
              <li>Official Board PDF Exporter</li>
            </ul>
          </div>

        </div>
      )}

    </div>
  );
};
