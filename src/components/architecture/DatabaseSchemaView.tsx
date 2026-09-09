import React, { useState } from 'react';
import { SCHEMA_DEFINITIONS, INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_USERS } from '../../data/mockDatabase';
import { 
  Database, 
  Code2, 
  ShieldCheck, 
  Table, 
  Eye, 
  Key, 
  CheckCircle2, 
  Layers,
  FileCode,
  Lock,
  ArrowRight
} from 'lucide-react';

export const DatabaseSchemaView: React.FC = () => {
  const [selectedCollection, setSelectedCollection] = useState<string>('users');
  const [activeTab, setActiveTab] = useState<'schema' | 'records' | 'rules'>('schema');

  const currentSchema = SCHEMA_DEFINITIONS.find(s => s.name === selectedCollection) || SCHEMA_DEFINITIONS[0];

  const getSampleData = () => {
    switch (selectedCollection) {
      case 'users': return INITIAL_USERS;
      case 'customers': return INITIAL_CUSTOMERS;
      case 'products': return INITIAL_PRODUCTS;
      default: return [{ info: 'Records populated dynamically when operating ERP' }];
    }
  };

  const firestoreRulesSample = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Global Deny Default
    match /{document=**} {
      allow read, write: if false;
    }

    // Master Helper Functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    function isCEO() {
      return isSignedIn() && getUserRole() == 'CEO';
    }

    // 1. Users Collection - Strictly CEO Write Access
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isCEO(); // Only CEO can create/edit users!
    }

    // 2. Customers Collection - CEO, Assistant CEO, Sales Manager
    match /customers/{customerId} {
      allow read: if isSignedIn();
      allow create, update: if isSignedIn() && (
        getUserRole() in ['CEO', 'ASSISTANT_CEO', 'SALES_MANAGER']
      );
      allow delete: if isCEO();
    }

    // 3. Orders Collection
    match /orders/{orderId} {
      allow read: if isSignedIn();
      allow create, update: if isSignedIn() && (
        getUserRole() in ['CEO', 'ASSISTANT_CEO', 'SALES_MANAGER']
      );
    }

    // 4. Products & Stock Collection
    match /products/{productId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && (
        getUserRole() in ['CEO', 'OPERATIONS_MANAGER', 'STOCK_MANAGER']
      );
    }
  }
}`;

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl text-slate-900 dark:text-white shadow-2xl border border-slate-200/80 dark:border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#b8860b] dark:text-[#d4af37]">
            <Database className="w-4 h-4 text-[#d4af37]" />
            <span>Cloud Firestore Architecture Specification • GIEZRA ERP</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Database Design & Security Rules
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-emerald-200/80 max-w-2xl leading-relaxed">
            Complete relational document schemas, field definitions, index plans, and Attribute-Based Access Control (ABAC) rules for Tanzanian poultry processing operations.
          </p>
        </div>
      </div>

      {/* Navigation tabs between Schema, Sample Records & Security Rules */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        
        {/* Collection Selector Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {SCHEMA_DEFINITIONS.map((c) => (
            <button
              key={c.name}
              onClick={() => setSelectedCollection(c.name)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedCollection === c.name
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>{c.title.split(' ')[0]} ({c.name})</span>
            </button>
          ))}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'schema'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Field Specification</span>
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'records'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Record Inspector</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>firestore.rules</span>
          </button>
        </div>

      </div>

      {/* Tab 1: Field Specification */}
      {activeTab === 'schema' && (
        <div className="space-y-6">
          
          {/* Collection Header Card */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-4">
              <div>
                <span className="text-xs font-bold font-mono text-[#1b4332] dark:text-[#52b788] uppercase tracking-wider">
                  Collection: /{currentSchema.name}
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {currentSchema.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {currentSchema.description}
                </p>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <div className="p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 backdrop-blur-md space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Read Access</div>
                  <div className="font-bold text-[#1b4332] dark:text-[#52b788]">
                    {currentSchema.readRoles.join(', ')}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 backdrop-blur-md space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Write / Modify Access</div>
                  <div className="font-bold text-[#b8860b] dark:text-[#d4af37]">
                    {currentSchema.writeRoles.join(', ')}
                  </div>
                </div>
              </div>
            </div>

            {/* Field Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wider">
                    <th className="p-3">Field Name</th>
                    <th className="p-3">Data Type</th>
                    <th className="p-3">Required</th>
                    <th className="p-3">Field Description & Validation Constraints</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {currentSchema.fields.map((f) => (
                    <tr key={f.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 font-mono">
                      <td className="p-3 font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{f.name}</span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                          {f.type}
                        </span>
                      </td>
                      <td className="p-3">
                        {f.required ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">Yes</span>
                        ) : (
                          <span className="text-slate-400 text-xs">Optional</span>
                        )}
                      </td>
                      <td className="p-3 font-sans text-xs text-slate-600 dark:text-slate-300">
                        {f.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* Tab 2: Sample Records */}
      {activeTab === 'records' && (
        <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800 text-slate-100 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Code2 className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-sm text-amber-400">Live Collection Data Inspector</span>
              <span className="text-xs text-slate-400">/{currentSchema.name}</span>
            </div>
            <span className="text-xs text-slate-500 font-mono">JSON Document Viewer</span>
          </div>

          <pre className="p-4 bg-slate-900 rounded-2xl overflow-x-auto text-xs font-mono text-emerald-300 leading-relaxed border border-slate-800">
            {JSON.stringify(getSampleData(), null, 2)}
          </pre>
        </div>
      )}

      {/* Tab 3: Security Rules Code */}
      {activeTab === 'rules' && (
        <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800 text-slate-100 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-sm text-emerald-400">firestore.rules (ABAC Security Policy)</span>
            </div>
            <span className="text-xs text-slate-400">Version 2</span>
          </div>

          <pre className="p-4 bg-slate-900 rounded-2xl overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed border border-slate-800">
            {firestoreRulesSample}
          </pre>
        </div>
      )}

    </div>
  );
};
