import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { LoginForm } from './components/auth/LoginForm';
import { UserManagementView } from './components/userManagement/UserManagementView';
import { UserProfileView } from './components/profile/UserProfileView';
import { DatabaseSchemaView } from './components/architecture/DatabaseSchemaView';
import { AuditLogsView } from './components/architecture/AuditLogsView';
import { SystemAdministrationView } from './components/architecture/SystemAdministrationView';
import { Phase1OverviewDashboard } from './components/dashboard/Phase1OverviewDashboard';
import { CustomerManagementView } from './components/modules/CustomerManagementView';
import { OrderManagementView } from './components/modules/OrderManagementView';
import { PaymentAndDebtView } from './components/modules/PaymentAndDebtView';
import { ProductionManagementView } from './components/modules/ProductionManagementView';
import { InventoryAndWarehouseView } from './components/modules/InventoryAndWarehouseView';
import { FinancialsAndCostingView } from './components/modules/FinancialsAndCostingView';
import { AIAssistantAndReportsView } from './components/modules/AIAssistantAndReportsView';
import { DocumentAndDriveView } from './components/modules/DocumentAndDriveView';
import { PhaseApprovalBanner } from './components/architecture/PhaseApprovalBanner';
import { testFirestoreConnection } from './services/firebase';
import { checkMigrationStatus, runCloudDataMigration } from './services/migrationService';
import { Lock, Sparkles, Building2, CheckCircle2, WifiOff, Cloud, X } from 'lucide-react';

const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCustomerIdForOrder, setSelectedCustomerIdForOrder] = useState<string | undefined>(undefined);
  const [darkMode, setDarkMode] = useState(false);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Validate Firestore Connection on initial boot using getFromServer
  useEffect(() => {
    let isMounted = true;
    async function initCloudConnection() {
      try {
        const isOnline = await testFirestoreConnection();
        if (isMounted) {
          setDbConnected(isOnline);
          if (!isOnline) {
            setOfflineNotice('Unable to connect to Giezra cloud database. Please check your internet connection.');
          } else {
            // Check if initial migration is needed
            const status = await checkMigrationStatus();
            if (status.needsMigration) {
              await runCloudDataMigration();
            }
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setDbConnected(false);
          setOfflineNotice('Unable to connect to Giezra cloud database. Please check your internet connection.');
        }
      }
    }
    initCloudConnection();
    return () => { isMounted = false; };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-emerald-400">Loading GIEZRA ERP System...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Phase1OverviewDashboard setActiveTab={setActiveTab} />;
      case 'my_profile':
        return <UserProfileView />;
      case 'user_management':
        return <UserManagementView onNavigateToProfile={(userId) => {
          setActiveTab('my_profile');
        }} />;
      case 'system_admin':
        return <SystemAdministrationView onNavigateToUserMgmt={() => setActiveTab('user_management')} />;
      case 'database_schema':
        return <DatabaseSchemaView />;
      case 'audit_logs':
        return <AuditLogsView />;
      case 'customers':
        return <CustomerManagementView onNavigateToOrders={(customerId) => {
          setSelectedCustomerIdForOrder(customerId);
          setActiveTab('orders');
        }} />;
      case 'orders':
        return <OrderManagementView initialCustomerId={selectedCustomerIdForOrder} />;
      case 'payments':
      case 'debts':
        return <PaymentAndDebtView />;
      case 'documents':
      case 'drive':
        return <DocumentAndDriveView />;
      case 'inventory':
      case 'warehouse':
        return <InventoryAndWarehouseView onNavigateToProduction={() => setActiveTab('production')} />;
      case 'production':
        return <ProductionManagementView onNavigateToInventory={() => setActiveTab('inventory')} />;
      case 'costing':
        return <FinancialsAndCostingView />;
      case 'ai_assistant':
      case 'ai_reports':
      case 'executive_summary':
        return <AIAssistantAndReportsView />;
      default:
        return (
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            <PhaseApprovalBanner />
            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Upcoming ERP Module ({activeTab.replace('_', ' ').toUpperCase()})
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                This module is scheduled for development in subsequent phases as requested. Confirm approval of Phase 1 to unlock Phase 2 modules immediately.
              </p>
              <button
                onClick={() => setActiveTab('overview')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Return to Phase 1 Overview
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-frosted-radial text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col font-sans relative overflow-x-hidden">
      {/* Ambient background glowing orbs in dark mode */}
      <div className="hidden dark:block absolute top-12 left-1/3 w-96 h-96 rounded-full bg-[#d4af37]/10 blur-[140px] pointer-events-none"></div>
      <div className="hidden dark:block absolute bottom-12 right-1/4 w-96 h-96 rounded-full bg-[#2d6a4f]/20 blur-[140px] pointer-events-none"></div>

      <Header darkMode={darkMode} setDarkMode={setDarkMode} activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col md:flex-row relative z-10">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 min-w-0 bg-slate-100/50 dark:bg-transparent p-3 sm:p-6 space-y-4">
          {offlineNotice && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/80 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2 font-medium">
                <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{offlineNotice}</span>
              </div>
              <button
                onClick={() => setOfflineNotice(null)}
                className="text-amber-600 dark:text-amber-400 hover:text-amber-800 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
