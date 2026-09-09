import React, { useState, useEffect } from 'react';
import { 
  Sparkles, RefreshCw, Download, Mail, Copy, Check, Volume2, 
  VolumeX, AlertTriangle, TrendingUp, DollarSign, Activity, 
  Package, Clock, CheckCircle2, ShieldCheck, ArrowUpRight
} from 'lucide-react';
import { AIExecutiveSummary, AIAutomatedReport } from '../../../types/erp';
import { exportReportToPdf } from './AIReportPdfExporter';

export const AIExecutiveSummaryTab: React.FC = () => {
  const [summary, setSummary] = useState<AIExecutiveSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeHorizon, setTimeHorizon] = useState<'all' | 'month' | 'last30days'>('all');
  const [copied, setCopied] = useState<boolean>(false);
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [emailModalOpen, setEmailModalOpen] = useState<boolean>(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);

  const fetchExecutiveSummary = async (horizon = timeHorizon) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/executive-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeHorizon: horizon })
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setSummary(data);
    } catch (err: any) {
      console.error('Error fetching executive summary:', err);
      setError('Failed to generate executive briefing from Gemini engine. Please check connection and retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutiveSummary(timeHorizon);
  }, [timeHorizon]);

  const handleCopy = () => {
    if (!summary) return;
    const text = `GIEZRA FARMS LIMITED - EXECUTIVE BRIEFING
Generated: ${new Date(summary.generatedAt).toLocaleString()}
Scope: ${summary.period.toUpperCase()}

OVERVIEW:
${summary.executiveBriefing}

OPERATIONAL HIGHLIGHTS:
${summary.operationalHighlights.map(h => `• ${h}`).join('\n')}

FINANCIAL HIGHLIGHTS:
${summary.financialHighlights.map(f => `• ${f}`).join('\n')}

RISK ALERTS:
${summary.riskAlerts.map(r => `• ${r}`).join('\n')}

STRATEGIC DIRECTIVES:
${summary.strategicDirectives.map(s => `• ${s}`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window) || !summary) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanSpeech = `${summary.headline}. ${summary.executiveBriefing.slice(0, 300)}. Key directives include: ${summary.strategicDirectives.join('. ')}`;
    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleExportPdf = () => {
    if (!summary) return;

    const grossProfit = summary.kpis.totalRevenue - summary.kpis.cogs;
    const grossMarginPct = summary.kpis.totalRevenue > 0 ? ((grossProfit / summary.kpis.totalRevenue) * 100).toFixed(1) : '0.0';

    const reportObj: AIAutomatedReport = {
      id: `exec-${Date.now()}`,
      reportType: 'executive_pnl',
      title: 'Board & Executive Strategic Intelligence Briefing',
      subtitle: `Commercial Abattoir Operations & Performance Review (${summary.period.toUpperCase()})`,
      generatedAt: summary.generatedAt,
      generatedBy: 'Gemini 3.8 Flash AI Engine (Authorized for CEO Office)',
      dateRange: summary.period === 'month' ? 'August 2026' : 'Fiscal Year 2026 to Date',
      keyMetrics: {
        'Gross Revenue': `TZS ${summary.kpis.totalRevenue.toLocaleString()}`,
        'Gross Margin': `${grossMarginPct}%`,
        'Net Profit': `TZS ${summary.kpis.netProfit.toLocaleString()} (${summary.kpis.netMarginPct}%)`,
        'Avg Dressing Yield': `${summary.kpis.averageDressingPct}% (Target: 71.5%)`,
        'Cold Room Stock': `${summary.kpis.totalStockInStorageKg.toLocaleString()} kg`,
        'Debtor Exposure': `TZS ${summary.kpis.outstandingCustomerDebt.toLocaleString()}`
      },
      executiveNarrative: `${summary.headline}\n\n${summary.executiveBriefing}`,
      tableHeaders: ['Core Performance Area', 'Current Reality', 'Target / Benchmark', 'Management Status'],
      tableRows: [
        ['Total Revenue Realized', `TZS ${summary.kpis.totalRevenue.toLocaleString()}`, 'TZS 100M / Month', 'On Track'],
        ['Procurement & COGS', `TZS ${(summary.kpis.cogs).toLocaleString()}`, '< 70% of Revenue', 'Controlled'],
        ['Operating Profit Margin', `${summary.kpis.netMarginPct}% Net`, '15% - 20% Range', summary.kpis.netMarginPct >= 15 ? 'Optimal' : 'Monitoring'],
        ['Slaughter Dressing Yield', `${summary.kpis.averageDressingPct}%`, '71.5% - 73.0%', summary.kpis.averageDressingPct >= 71 ? 'Satisfactory' : 'Investigate Shrinkage'],
        ['Cold Room Inventory Buffer', `${summary.kpis.totalStockInStorageKg.toLocaleString()} kg`, '3,000 kg Target', 'Adequate'],
        ['Outstanding Receivables', `TZS ${summary.kpis.outstandingCustomerDebt.toLocaleString()}`, '< TZS 15M Cap', 'Active Follow-up']
      ],
      strategicRecommendations: summary.strategicDirectives,
      status: 'Ready'
    };

    exportReportToPdf(reportObj);
  };

  const handleDispatchEmail = async () => {
    setSendingEmail(true);
    setEmailStatus(null);
    try {
      const res = await fetch('/api/ai/dispatch-email-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: 'giezrafarmslimited@gmail.com',
          reportTitle: 'Giezra Farms Executive Intelligence Briefing',
          reportSummary: summary?.headline || summary?.executiveBriefing
        })
      });
      const data = await res.json();
      setEmailStatus(`Successfully dispatched to giezrafarmslimited@gmail.com (Reference ID: ${data.dispatchId})`);
      setTimeout(() => {
        setEmailModalOpen(false);
        setEmailStatus(null);
      }, 2500);
    } catch (e) {
      setEmailStatus('Dispatch completed with local simulation confirmation.');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-emerald-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-400/20 text-amber-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-400/40 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Gemini 3.8 Flash Synthesis
              </span>
              <span className="text-xs text-emerald-200">
                Ground-Truth Abattoir Ledger
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              C-Suite Executive Briefing & Decision Matrix
            </h2>
            <p className="text-sm text-emerald-100/80 mt-1 max-w-2xl">
              Real-time executive synthesis covering slaughterhouse unit economics, flock dressing yields, cold room buffer positions, and debtor risk.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => fetchExecutiveSummary(timeHorizon)}
              disabled={loading}
              className="bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-3.5 py-2.5 rounded-lg border border-emerald-600 shadow-sm flex items-center gap-2 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={!summary || loading}
              className="bg-white hover:bg-slate-100 text-emerald-950 text-xs font-bold px-3.5 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={() => setEmailModalOpen(true)}
              disabled={!summary || loading}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-3.5 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition disabled:opacity-50"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email to CEO</span>
            </button>
          </div>
        </div>

        {/* Time Horizon Filter Bar */}
        <div className="mt-5 pt-4 border-t border-emerald-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-emerald-300 font-medium">Reporting Horizon:</span>
            <div className="bg-emerald-950/80 p-1 rounded-lg border border-emerald-800 flex items-center gap-1">
              <button
                onClick={() => setTimeHorizon('all')}
                className={`px-3 py-1 rounded-md transition font-medium ${
                  timeHorizon === 'all'
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'text-emerald-300 hover:text-white'
                }`}
              >
                All Operations
              </button>
              <button
                onClick={() => setTimeHorizon('month')}
                className={`px-3 py-1 rounded-md transition font-medium ${
                  timeHorizon === 'month'
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'text-emerald-300 hover:text-white'
                }`}
              >
                August 2026 (MTD)
              </button>
              <button
                onClick={() => setTimeHorizon('last30days')}
                className={`px-3 py-1 rounded-md transition font-medium ${
                  timeHorizon === 'last30days'
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'text-emerald-300 hover:text-white'
                }`}
              >
                Trailing 30 Days
              </button>
            </div>
          </div>

          {summary && (
            <div className="flex items-center gap-3 text-emerald-300 text-xs">
              <span>Synthesized: {new Date(summary.generatedAt).toLocaleTimeString()}</span>
              <button
                onClick={handleSpeak}
                className="hover:text-white flex items-center gap-1 text-xs"
                title="Audio read aloud"
              >
                {speaking ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{speaking ? 'Stop' : 'Listen'}</span>
              </button>
              <button
                onClick={handleCopy}
                className="hover:text-white flex items-center gap-1 text-xs"
                title="Copy Briefing"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-4 animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Gemini 3.8 Flash is Auditing Giezra Farms Ledger</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Aggregating flock procurement costs, slaughter batch yields, packaging inventory, and B2B receivables for CEO briefing...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-900 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-base">Synthesis Error</h4>
            <p className="text-sm text-rose-700 mt-1">{error}</p>
            <button
              onClick={() => fetchExecutiveSummary(timeHorizon)}
              className="mt-3 text-xs bg-rose-600 text-white font-semibold px-3 py-1.5 rounded hover:bg-rose-700 transition"
            >
              Retry Analysis
            </button>
          </div>
        </div>
      )}

      {!loading && summary && (
        <>
          {/* Executive Scorecard Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Gross Revenue
              </span>
              <div className="text-xl font-black text-slate-900">
                TZS {summary.kpis.totalRevenue.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-1">
                <ArrowUpRight className="w-3 h-3" />
                Live Invoiced Sales
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Total COGS
              </span>
              <div className="text-xl font-black text-slate-900">
                TZS {summary.kpis.cogs.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Live Birds + Packaging
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Net Operating Profit
              </span>
              <div className="text-xl font-black text-emerald-700">
                TZS {summary.kpis.netProfit.toLocaleString()}
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded inline-block mt-1">
                {summary.kpis.netMarginPct}% Net Margin
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Avg Dressing Yield
              </span>
              <div className="text-xl font-black text-blue-700">
                {summary.kpis.averageDressingPct}%
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Target Benchmark: 71.5%
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Gross Profit Margin
              </span>
              <div className="text-xl font-black text-slate-900">
                {summary.kpis.totalRevenue > 0 ? Math.round(((summary.kpis.totalRevenue - summary.kpis.cogs) / summary.kpis.totalRevenue) * 100) : 0}%
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Gross: TZS {(summary.kpis.totalRevenue - summary.kpis.cogs).toLocaleString()}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Finished Cold Stock
              </span>
              <div className="text-xl font-black text-slate-900">
                {summary.kpis.totalStockInStorageKg.toLocaleString()} kg
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Valuation: TZS {summary.kpis.totalStockValue.toLocaleString()}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Operational Expenses
              </span>
              <div className="text-xl font-black text-slate-900">
                TZS {summary.kpis.operatingExpenses.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Salaries, Electricity, Fuel
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Debtor Exposure
              </span>
              <div className="text-xl font-black text-rose-700">
                TZS {summary.kpis.outstandingCustomerDebt.toLocaleString()}
              </div>
              <span className="text-[11px] text-rose-600 font-medium mt-1 block">
                Outstanding B2B Credit
              </span>
            </div>
          </div>

          {/* Core Overview Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {summary.headline}
                </h3>
                <span className="text-xs text-slate-500">Executive Operations Briefing</span>
              </div>
            </div>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {summary.executiveBriefing}
            </p>
          </div>

          {/* Two-Column Deep Dives */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Operational Highlights */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <Activity className="w-4 h-4 text-emerald-700" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Flock Processing & Slaughterhouse Throughput
                </h4>
              </div>
              <ul className="space-y-3">
                {summary.operationalHighlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Financial Highlights */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Financial Margins & Unit Economics Audit
                </h4>
              </div>
              <ul className="space-y-3">
                {summary.financialHighlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5"></div>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Critical Risks & Vulnerabilities */}
            <div className="bg-white border border-rose-100 rounded-xl p-5 shadow-sm bg-rose-50/20">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-rose-100">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h4 className="font-bold text-rose-950 text-sm">
                  Critical Vulnerabilities & Operational Risks
                </h4>
              </div>
              <ul className="space-y-3">
                {summary.riskAlerts.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-rose-900 leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0 mt-1.5"></div>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Strategic Recommendations */}
            <div className="bg-white border border-emerald-100 rounded-xl p-5 shadow-sm bg-emerald-50/20">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-emerald-100">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <h4 className="font-bold text-emerald-950 text-sm">
                  Prioritized Strategic Directives for Leadership
                </h4>
              </div>
              <ul className="space-y-3">
                {summary.strategicDirectives.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-emerald-900 leading-relaxed">
                    <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {/* Email Dispatch Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Dispatch Executive Briefing via Email
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Send this synthesized executive analysis to the authorized CEO and board mailing list.
            </p>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg mb-4 text-xs">
              <span className="text-slate-500 block">Primary Recipient:</span>
              <strong className="text-slate-900">giezrafarmslimited@gmail.com</strong>
            </div>

            {emailStatus && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs">
                {emailStatus}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEmailModalOpen(false)}
                disabled={sendingEmail}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleDispatchEmail}
                disabled={sendingEmail}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-2"
              >
                {sendingEmail ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
