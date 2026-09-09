import React, { useEffect, useState } from 'react';
import { AuditLog } from '../../types/erp';
import { ShieldCheck, ShieldAlert, User, Clock, Search, ListFilter, RefreshCw } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error('Failed to fetch audit logs', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    l.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.module.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl text-slate-900 dark:text-white shadow-2xl border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#b8860b] dark:text-[#d4af37]">
            <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
            <span>Security Governance & Audit Trail</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            System Security Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-emerald-200/80 mt-1">
            Immutable activity log tracking all user authentications, RBAC checks, and operational changes.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-4 py-2.5 bg-white/20 dark:bg-white/10 hover:bg-white/30 text-slate-900 dark:text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-300 dark:border-white/10 backdrop-blur-md relative z-10 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#d4af37] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl overflow-hidden space-y-4">
        
        {/* Search Toolbar */}
        <div className="p-4 sm:p-6 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by user, action, module or details..."
              className="w-full pl-10 pr-3 py-2.5 bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 text-slate-900 dark:text-white"
            />
          </div>
          <span className="text-xs text-slate-500 font-mono hidden sm:block">
            {filteredLogs.length} Security Events Recorded
          </span>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm font-mono">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                <th className="p-4">Timestamp</th>
                <th className="p-4">User & Role</th>
                <th className="p-4">Module</th>
                <th className="p-4">Action Triggered</th>
                <th className="p-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredLogs.map((log) => {
                const isWarning = log.action.includes('UNAUTHORIZED') || log.action.includes('DENIED');
                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    
                    <td className="p-4 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="p-4 font-sans">
                      <div className="font-bold text-slate-900 dark:text-white">{log.userName}</div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {log.userRole}
                      </span>
                    </td>

                    <td className="p-4 font-sans text-slate-700 dark:text-slate-300 font-semibold">
                      {log.module}
                    </td>

                    <td className="p-4">
                      {isWarning ? (
                        <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1 w-fit">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          {log.action}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 w-fit">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {log.action}
                        </span>
                      )}
                    </td>

                    <td className="p-4 font-sans text-xs text-slate-600 dark:text-slate-300 max-w-md truncate">
                      {log.details}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
