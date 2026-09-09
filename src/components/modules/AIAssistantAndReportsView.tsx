import React, { useState } from 'react';
import { 
  Sparkles, MessageSquare, BarChart3, FileText, Cpu, ShieldCheck, 
  Clock, RefreshCw, CheckCircle2, AlertCircle
} from 'lucide-react';
import { AIChatAssistantTab } from './ai/AIChatAssistantTab';
import { AIExecutiveSummaryTab } from './ai/AIExecutiveSummaryTab';
import { AIAutomatedReportsTab } from './ai/AIAutomatedReportsTab';

interface AIAssistantAndReportsViewProps {
  initialTab?: 'chat' | 'summary' | 'reports';
}

export const AIAssistantAndReportsView: React.FC<AIAssistantAndReportsViewProps> = ({
  initialTab = 'summary'
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'summary' | 'reports'>(initialTab);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-amber-300 flex items-center justify-center shadow-md flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Phase 5: Intelligence & Reporting
                </span>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Gemini 3.8 Flash Online
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                AI Executive Intelligence & Automated Business Reports
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                C-Suite decision support synthesized directly from live abattoir ledger data, flock dressing yield ratios, packaging usage, cold room buffer inventory, and B2B accounts receivable.
              </p>
            </div>
          </div>

          {/* Sub-tab Navigation Switch */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'summary'
                  ? 'bg-emerald-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Executive Briefing</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'chat'
                  ? 'bg-emerald-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>AI Chat Assistant</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'reports'
                  ? 'bg-emerald-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Automated Reports & PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render Active Sub-tab View */}
      {activeTab === 'summary' && <AIExecutiveSummaryTab />}
      {activeTab === 'chat' && <AIChatAssistantTab />}
      {activeTab === 'reports' && <AIAutomatedReportsTab />}
    </div>
  );
};
