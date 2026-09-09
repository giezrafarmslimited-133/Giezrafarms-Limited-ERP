import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Send, Bot, User, RefreshCw, Copy, Check, Volume2, 
  VolumeX, AlertCircle, TrendingUp, ShieldAlert, Cpu, Layers, HelpCircle
} from 'lucide-react';
import { AIChatMessage } from '../../../types/erp';

interface QuickPrompt {
  id: string;
  category: string;
  label: string;
  prompt: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'cogs_margins',
    category: 'Economics',
    label: 'Live Bird Cost vs Dressed Margin',
    prompt: 'What is our current live bird purchase cost vs wholesale dressed margin? Break down our unit economics per dressed kilogram.'
  },
  {
    id: 'dressing_yield',
    category: 'Production',
    label: 'Slaughter Dressing Percentage Audit',
    prompt: 'Analyze our recent slaughter batches. What is our average dressing percentage and carcass yield compared to the 71.5% target?'
  },
  {
    id: 'inventory_coldroom',
    category: 'Cold Chain',
    label: 'Cold Room Stock & SKU Risk',
    prompt: 'Audit our cold room inventory across Cold Rooms 1, 2, and 3. Are there any SKUs at risk of stock-out or low buffer?'
  },
  {
    id: 'receivables_debt',
    category: 'Sales & Debt',
    label: 'Top Debtor Credit Risk Analysis',
    prompt: 'Review our accounts receivable exposure. Who are our top outstanding debtors and what are the recommended credit control actions?'
  },
  {
    id: 'scenario_pricing',
    category: 'Strategy',
    label: 'Price Sensitivity Simulation (+500 TZS)',
    prompt: 'Simulate the financial impact on our gross profit and net margin if we increase wholesale dressed chicken prices by TZS 500 per kg.'
  }
];

export const AIChatAssistantTab: React.FC = () => {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Hello! I am your **Giezra Farms AI Executive Intelligence Assistant**, powered by **Gemini 3.8 Flash**.

I have real-time access to our abattoir's live ERP data, including:
- **Financials**: Live bird procurement costs, packaging, operational overhead, gross margin, and net profit.
- **Production Batches**: Batch numbers, live weights, carcass yields, dressing percentages, and offal production.
- **Finished Goods**: Cold room stock levels, SKU valuations, and low-inventory reorder alerts.
- **Commercial Sales**: Orders, payment collections, credit limits, and accounts receivable exposure.

How can I assist your executive decision-making today? Choose a prompt below or ask any question!`,
      timestamp: new Date().toISOString()
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [systemOnline, setSystemOnline] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Check AI status on mount
  useEffect(() => {
    fetch('/api/ai/status')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') {
          setSystemOnline(true);
        }
      })
      .catch(() => setSystemOnline(false));
  }, []);

  const handleSendMessage = async (promptToSend?: string) => {
    const query = (promptToSend || inputPrompt).trim();
    if (!query || isLoading) return;

    const userMessage: AIChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          history: messages.slice(-8).map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: AIChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'No response received from AI engine.',
        timestamp: new Date().toISOString(),
        metricsSnapshot: data.metricsSnapshot
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('AI chat failed:', err);
      const fallbackMessage: AIChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Connection Notice:** Unable to contact the Gemini processing engine right now. Please verify server connectivity or try again in a moment.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeech = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown formatting for cleaner speech
    const cleanText = text.replace(/[*#_`>-]/g, '').replace(/\[.*?\]\(.*?\)/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleClearChat = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingId(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Chat history cleared. You are connected to **Gemini 3.8 Flash** with live Giezra Farms ERP telemetry. How can I assist you?`,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  // Helper to render markdown-like text nicely
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Heading 3
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-emerald-950 font-bold text-sm mt-3 mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            {line.replace('### ', '')}
          </h4>
        );
      }
      // Heading 2
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-emerald-950 font-bold text-base mt-4 mb-2 pb-1 border-b border-emerald-100">
            {line.replace('## ', '')}
          </h3>
        );
      }
      // Bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const bulletText = line.trim().substring(2);
        return (
          <div key={idx} className="flex items-start gap-2 ml-2 my-1 text-slate-700 text-sm">
            <span className="text-emerald-600 font-bold mt-0.5">•</span>
            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(bulletText) }} />
          </div>
        );
      }
      // Numbered list
      const numberedMatch = line.match(/^(\d+)\.\s(.*)/);
      if (numberedMatch) {
        return (
          <div key={idx} className="flex items-start gap-2 ml-2 my-1 text-slate-700 text-sm">
            <span className="text-emerald-700 font-semibold text-xs bg-emerald-50 px-1.5 py-0.5 rounded">
              {numberedMatch[1]}
            </span>
            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(numberedMatch[2]) }} />
          </div>
        );
      }
      // Empty line
      if (line.trim() === '') {
        return <div key={idx} className="h-2"></div>;
      }
      // Regular text
      return (
        <p 
          key={idx} 
          className="text-slate-800 text-sm my-1 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }}
        />
      );
    });
  };

  const formatInlineMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-950 font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-slate-800 italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-emerald-800 px-1 py-0.5 rounded text-xs font-mono">$1</code>');
  };

  return (
    <div className="flex flex-col h-[750px] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Top Telemetry Header */}
      <div className="bg-emerald-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between border-b border-emerald-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-800/80 border border-emerald-700 flex items-center justify-center text-amber-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-wide text-white">GIEZRA ERP AI INTELLIGENCE ENGINE</h3>
              <span className="inline-flex items-center gap-1 bg-emerald-800 text-emerald-200 text-xs px-2 py-0.5 rounded-full border border-emerald-700">
                <Cpu className="w-3 h-3 text-amber-300" />
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-emerald-200/80">
              Grounded on live batches, cold room inventory, P&L, and accounts receivable
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          <div className="flex items-center gap-2 text-xs bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-100 font-medium">Telemetry Connected</span>
          </div>
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 text-xs text-emerald-200 hover:text-white px-2.5 py-1 rounded bg-emerald-800/60 hover:bg-emerald-800 border border-emerald-700 transition"
            title="Clear Chat History"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Suggested Prompt Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-2 min-w-max">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Executive Prompts:
          </span>
          {QUICK_PROMPTS.map(p => (
            <button
              key={p.id}
              onClick={() => handleSendMessage(p.prompt)}
              disabled={isLoading}
              className="text-xs bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 px-3 py-1.5 rounded-full border border-slate-200 hover:border-emerald-300 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200/60 px-1 py-0.5 rounded">
                {p.category}
              </span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isAi = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}
            >
              {isAi && (
                <div className="w-8 h-8 rounded-full bg-emerald-800 text-amber-300 flex items-center justify-center flex-shrink-0 shadow-sm border border-emerald-700">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-xl p-4 shadow-sm text-sm ${
                  isAi
                    ? 'bg-white border border-slate-200/90 text-slate-900'
                    : 'bg-emerald-900 text-white rounded-br-none'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-slate-100 text-xs text-slate-400">
                  <span className="font-medium text-slate-500 flex items-center gap-1.5">
                    {isAi ? (
                      <>
                        <span className="text-emerald-700 font-bold">Giezra AI Analyst</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                          Ground Truth
                        </span>
                      </>
                    ) : (
                      <span className="text-emerald-200 font-semibold">Management Query</span>
                    )}
                  </span>
                  <span className={isAi ? 'text-slate-400' : 'text-emerald-300/80'}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-1">
                  {isAi ? renderFormattedContent(msg.content) : <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                </div>

                {/* Snapshot preview metrics if available on AI response */}
                {msg.metricsSnapshot && (
                  <div className="mt-3 pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-lg text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Net Margin</span>
                      <span className="font-bold text-emerald-700">{msg.metricsSnapshot.netMarginPct}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Avg Dressing</span>
                      <span className="font-bold text-blue-700">{msg.metricsSnapshot.avgDressingPct}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Cold Stock</span>
                      <span className="font-bold text-slate-800">{msg.metricsSnapshot.totalStockKg?.toLocaleString()} kg</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Overdue Debt</span>
                      <span className="font-bold text-rose-700">TZS {msg.metricsSnapshot.totalDebtTZS?.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* AI Message Footer Actions */}
                {isAi && (
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[11px] text-slate-400 italic">
                      Response synthesized with live flock & accounting variables
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSpeech(msg.id, msg.content)}
                        className="hover:text-emerald-700 transition flex items-center gap-1 p-1 rounded hover:bg-slate-100"
                        title={speakingId === msg.id ? 'Stop Reading' : 'Listen via Text-to-Speech'}
                      >
                        {speakingId === msg.id ? (
                          <VolumeX className="w-3.5 h-3.5 text-rose-600" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="hover:text-emerald-700 transition flex items-center gap-1 p-1 rounded hover:bg-slate-100"
                        title="Copy to Clipboard"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {!isAi && (
                <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-amber-300 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-sm max-w-[70%]">
              <div className="flex items-center gap-2 text-emerald-800 font-medium text-xs mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                Gemini 3.8 Flash is analyzing live ERP ledger data...
              </div>
              <p className="text-xs text-slate-500">
                Auditing batches, calculating dressing ratios, evaluating cold room levels, and computing margins.
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Bar */}
      <div className="bg-white border-t border-slate-200 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2"
        >
          <div className="flex-1 relative">
            <textarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              rows={2}
              placeholder="Ask anything about Giezra Farms production, slaughter yields, cold room stock, margins, or debtor exposure..."
              className="w-full resize-none rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none pr-10"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="h-[58px] px-5 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 text-white font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Send</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for a new line</span>
          <span>Security: Server-Side Proxied | Gemini @google/genai SDK</span>
        </div>
      </div>
    </div>
  );
};
