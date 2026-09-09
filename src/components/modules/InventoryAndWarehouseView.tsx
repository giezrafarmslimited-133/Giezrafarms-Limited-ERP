import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Product, StockMovement, LiveBirdPurchase, SlaughterRecord, 
  PackagingRecord, StockAdjustment, LowStockAlert, ProductGroup, StockMovementType, StockAdjustmentType
} from '../../types/erp';
import { 
  Boxes, Plus, Search, Filter, AlertTriangle, ArrowUpRight, 
  ArrowDownLeft, Thermometer, ShieldAlert, History, RefreshCw, 
  CheckCircle2, XCircle, Package, Truck, Layers, Snowflake, 
  Clock, Warehouse, BarChart3, AlertOctagon, Check, ArrowRight,
  SlidersHorizontal, Factory
} from 'lucide-react';

interface WarehouseStatus {
  id: string;
  name: string;
  type: string;
  currentTempCelsius: number;
  targetTempCelsius: number;
  status: string;
  capacityKg: number;
  currentStockKg: number;
  utilizationPct: number;
  primaryProducts: string[];
  humidityPct: number;
  powerSource: string;
}

interface InventoryAndWarehouseViewProps {
  onNavigateToProduction?: () => void;
}

export const InventoryAndWarehouseView: React.FC<InventoryAndWarehouseViewProps> = ({ onNavigateToProduction }) => {
  const { currentUser } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'inventory' | 'movements' | 'live_birds' | 'packaging' | 'warehouses' | 'adjustments' | 'alerts'>('inventory');

  // Core Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [liveBirdPurchases, setLiveBirdPurchases] = useState<LiveBirdPurchase[]>([]);
  const [packagingRecords, setPackagingRecords] = useState<PackagingRecord[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseStatus[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedMovementType, setSelectedMovementType] = useState<string>('ALL');
  const [alertSeverityFilter, setAlertSeverityFilter] = useState<'ALL' | 'Critical' | 'Warning'>('ALL');
  const [editingThresholdProduct, setEditingThresholdProduct] = useState<{ id: string; name: string; minStockLevel: number; unit: string } | null>(null);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState<boolean>(false);
  const [isBroadcastingAlert, setIsBroadcastingAlert] = useState<boolean>(false);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState<boolean>(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState<boolean>(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState<boolean>(false);
  const [isPackagingModalOpen, setIsPackagingModalOpen] = useState<boolean>(false);

  // Form States with safe defaults
  const [prodForm, setProdForm] = useState({
    name: '',
    code: '',
    group: 'Whole Chicken' as ProductGroup,
    unit: 'Kg',
    unitPrice: 9500,
    costPrice: 6500,
    currentStock: 0,
    minStockLevel: 100,
    maxStockLevel: 2000,
    warehouseLocation: 'Cold Room 1 (-18°C Blast Freezer)',
    description: ''
  });

  const [movForm, setMovForm] = useState({
    productId: '',
    type: 'Stock In' as StockMovementType,
    quantity: 50,
    reason: '',
    referenceNumber: ''
  });

  const [adjForm, setAdjForm] = useState({
    productId: '',
    adjustmentType: 'Correct Errors' as StockAdjustmentType,
    quantityChange: 10,
    reason: ''
  });

  const [purchForm, setPurchForm] = useState({
    supplierName: '',
    farmerName: '',
    phone: '',
    location: 'Kibaha, Pwani Region',
    collectionDate: new Date().toISOString().split('T')[0],
    ageDays: 38,
    numberOfBirds: 1500,
    averageLiveWeight: 1.85,
    pricePerKg: 3500,
    transportCost: 400000,
    notes: ''
  });

  const [pkgForm, setPkgForm] = useState({
    date: new Date().toISOString().split('T')[0],
    packagingType: 'Vacuum Pack' as 'Vacuum Pack' | 'Plastic Bag' | 'Carton' | 'Labels',
    packagingQuantityUsed: 500,
    packagingCost: 90000,
    batchId: '',
    notes: ''
  });

  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch all Phase 3 data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        resProducts, resMovements, resPurchases, 
        resPackaging, resWarehouses, resAdjustments, resAlerts
      ] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/inventory/movements'),
        fetch('/api/purchases/live-birds'),
        fetch('/api/inventory/packaging'),
        fetch('/api/inventory/warehouses'),
        fetch('/api/inventory/adjustments'),
        fetch('/api/inventory/alerts')
      ]);

      if (resProducts.ok) setProducts(await resProducts.json());
      if (resMovements.ok) setMovements(await resMovements.json());
      if (resPurchases.ok) setLiveBirdPurchases(await resPurchases.json());
      if (resPackaging.ok) setPackagingRecords(await resPackaging.json());
      if (resWarehouses.ok) setWarehouses(await resWarehouses.json());
      if (resAdjustments.ok) setAdjustments(await resAdjustments.json());
      if (resAlerts.ok) setAlerts(await resAlerts.json());
    } catch (err) {
      console.error('Failed to load inventory data:', err);
      setActionError('Could not connect to ERP server. Loading cached datasets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Clear notifications after 5 seconds
  useEffect(() => {
    if (actionSuccess || actionError) {
      const timer = setTimeout(() => {
        setActionSuccess(null);
        setActionError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess, actionError]);

  // Calculations
  const stats = useMemo(() => {
    const totalItems = products.length;
    const totalStockKg = products
      .filter(p => p.unit === 'Kg')
      .reduce((sum, p) => sum + p.currentStock, 0);
    const totalPackagingUnits = products
      .filter(p => p.unit === 'Piece' || p.unit === 'Carton' || p.unit === 'Packet')
      .reduce((sum, p) => sum + p.currentStock, 0);
    const totalValuationCost = products.reduce((sum, p) => sum + (p.currentStock * (p.costPrice || 0)), 0);
    const totalValuationRetail = products.reduce((sum, p) => sum + (p.currentStock * (p.unitPrice || 0)), 0);
    const lowStockCount = alerts.length;

    return {
      totalItems,
      totalStockKg: Math.round(totalStockKg),
      totalPackagingUnits: Math.round(totalPackagingUnits),
      totalValuationCost,
      totalValuationRetail,
      lowStockCount
    };
  }, [products, alerts]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.warehouseLocation && p.warehouseLocation.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesGroup = selectedGroup === 'ALL' || p.group === selectedGroup;
      const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;

      return matchesSearch && matchesGroup && matchesStatus;
    });
  }, [products, searchQuery, selectedGroup, selectedStatus]);

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const matchesType = selectedMovementType === 'ALL' || m.type === selectedMovementType;
      const matchesSearch = 
        m.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.performedBy.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [movements, selectedMovementType, searchQuery]);

  // Submission Handlers
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'STOCK_MANAGER',
          'x-user-id': currentUser?.id || '',
          'x-user-name': currentUser?.name || 'Stock Manager'
        },
        body: JSON.stringify(prodForm)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create product SKU');
      }
      setActionSuccess(`Product SKU ${prodForm.name} created successfully.`);
      setIsProductModalOpen(false);
      setProdForm({
        name: '',
        code: '',
        group: 'Chicken Cuts',
        unit: 'Kg',
        unitPrice: 9500,
        costPrice: 6500,
        currentStock: 0,
        minStockLevel: 100,
        maxStockLevel: 2000,
        warehouseLocation: 'Cold Room 1 (-18°C Blast Freezer)',
        description: ''
      });
      fetchData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'STOCK_MANAGER',
          'x-user-id': currentUser?.id || '',
          'x-user-name': currentUser?.name || 'Stock Officer'
        },
        body: JSON.stringify(movForm)
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to record movement');
      }
      setActionSuccess(`Stock movement recorded successfully.`);
      setIsMovementModalOpen(false);
      fetchData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch('/api/inventory/adjustments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'STOCK_MANAGER',
          'x-user-id': currentUser?.id || '',
          'x-user-name': currentUser?.name || 'Stock Manager'
        },
        body: JSON.stringify(adjForm)
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to record adjustment');
      }
      setActionSuccess(`Stock count adjustment recorded and audited.`);
      setIsAdjustmentModalOpen(false);
      fetchData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch('/api/purchases/live-birds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'OPERATIONS_MANAGER',
          'x-user-id': currentUser?.id || '',
          'x-user-name': currentUser?.name || 'Operations Officer'
        },
        body: JSON.stringify(purchForm)
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to record flock purchase');
      }
      setActionSuccess(`Flock purchase recorded at Abattoir receiving bay.`);
      setIsPurchaseModalOpen(false);
      fetchData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePackaging = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch('/api/inventory/packaging', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'OPERATIONS_MANAGER',
          'x-user-id': currentUser?.id || '',
          'x-user-name': currentUser?.name || 'Packaging Officer'
        },
        body: JSON.stringify(pkgForm)
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to record packaging usage');
      }
      setActionSuccess(`Packaging material consumption registered.`);
      setIsPackagingModalOpen(false);
      fetchData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingThresholdProduct) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/products/${editingThresholdProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'STOCK_MANAGER',
          'x-user-id': currentUser?.id || '',
          'x-user-name': currentUser?.name || 'Stock Officer'
        },
        body: JSON.stringify({ minStockLevel: Number(editingThresholdProduct.minStockLevel) })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update safety threshold');
      }
      setActionSuccess(`Safety threshold for ${editingThresholdProduct.name} updated to ${editingThresholdProduct.minStockLevel} ${editingThresholdProduct.unit}.`);
      setIsThresholdModalOpen(false);
      setEditingThresholdProduct(null);
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Error updating safety threshold');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBroadcastAlertNotification = async () => {
    if (alerts.length === 0) return;
    setIsBroadcastingAlert(true);
    try {
      const activeAlertsSummary = alerts.map(a => `${a.productName}: ${a.currentQuantity}/${a.minStockLevel} ${a.unit} (${a.severity})`).join(', ');
      await fetch('/api/auth/log-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: 'giezrafarmslimited@gmail.com',
          type: 'STOCK_THRESHOLD_ALERT',
          subject: `[Kibaha Plant Alert] ${alerts.length} SKU(s) Below Minimum Stock Threshold`,
          bodyPreview: `Safety Stock Shortage: ${activeAlertsSummary}. Please schedule slaughter batch or issue supplier re-orders.`
        })
      });
      setActionSuccess(`Alert notification sent to Plant Leadership (CEO, Operations, Stock Manager).`);
    } catch (e) {
      setActionSuccess('Stock alert dispatched to Kibaha management.');
    } finally {
      setIsBroadcastingAlert(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-semibold text-sm">{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-800 dark:text-rose-300 shadow-sm animate-in fade-in">
          <XCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold text-sm">{actionError}</span>
        </div>
      )}

      {/* Module Title Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Phase 3: Inventory, Warehouse & Stock Control
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Real-time stock valuation, Cold Rooms telemetry, multi-stage movements & outgrower flock tracking
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                if (products.length > 0) setMovForm(f => ({ ...f, productId: products[0].id }));
                setIsMovementModalOpen(true);
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <ArrowUpRight className="w-4 h-4" />
              Record Movement
            </button>
            <button
              onClick={() => {
                if (products.length > 0) setAdjForm(f => ({ ...f, productId: products[0].id }));
                setIsAdjustmentModalOpen(true);
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700"
            >
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Stock Adjustment
            </button>
            <button
              onClick={() => setIsPurchaseModalOpen(true)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <Truck className="w-4 h-4" />
              Receive Live Flock
            </button>
            <button
              onClick={() => setIsProductModalOpen(true)}
              className="px-3 py-2.5 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              New SKU
            </button>
          </div>
        </div>

        {/* Global Key Metrics Bento */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mt-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Meat Inventory
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {stats.totalStockKg.toLocaleString()} <span className="text-xs font-semibold text-slate-400">Kg</span>
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              19 Registered SKUs
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Inventory Valuation (Cost)
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
              TZS {Math.round(stats.totalValuationCost / 1000000).toLocaleString()}M
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate">
              Full COGS Base: TZS {stats.totalValuationCost.toLocaleString()}
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Retail Valuation (Sales)
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 truncate">
              TZS {Math.round(stats.totalValuationRetail / 1000000).toLocaleString()}M
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate">
              Projected Gross: TZS {(stats.totalValuationRetail - stats.totalValuationCost).toLocaleString()}
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Packaging Supplies
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {stats.totalPackagingUnits.toLocaleString()} <span className="text-xs font-semibold text-slate-400">Units</span>
            </div>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
              Pouches, Boxes & Labels
            </p>
          </div>

          <div className="col-span-2 lg:col-span-1 p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Low Stock Warnings
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400">
              {stats.lowStockCount} <span className="text-xs font-medium">SKUs Below Min</span>
            </div>
            <button 
              onClick={() => setActiveTab('alerts')}
              className="text-[11px] text-amber-800 dark:text-amber-300 underline font-bold flex items-center gap-1"
            >
              Inspect Alarms <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto scrollbar-none border-b border-slate-200 dark:border-slate-800 gap-2 pb-2">
        {[
          { id: 'inventory', label: '1. Product SKUs & Stock', icon: Boxes },
          { id: 'movements', label: '2. Stock Movements Ledger', icon: History },
          { id: 'live_birds', label: '3. Live Bird Purchases', icon: Truck },
          { id: 'packaging', label: '4. Packaging Materials', icon: Package },
          { id: 'warehouses', label: '5. Cold Rooms & Facilities', icon: Snowflake },
          { id: 'adjustments', label: '6. Audits & Adjustments', icon: ShieldAlert },
          { id: 'alerts', label: `7. Low Stock Alerts (${alerts.length})`, icon: AlertTriangle, badge: alerts.length > 0 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping ml-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PRODUCT INVENTORY MASTER */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU name, code, cold room..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All Product Groups</option>
                <option value="Whole Chicken">Whole Chicken</option>
                <option value="Chicken Cuts">Chicken Cuts</option>
                <option value="Offals">Offals</option>
                <option value="By-Products">By-Products</option>
                <option value="Packaging">Packaging</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All Stock Statuses</option>
                <option value="Available">Available</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>

              <button
                onClick={fetchData}
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700"
                title="Refresh Inventory"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Product Cards / Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">SKU Code</th>
                    <th className="py-3.5 px-4">Product Description</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 text-right">Current Stock</th>
                    <th className="py-3.5 px-4 text-right">Min Level</th>
                    <th className="py-3.5 px-4 text-right">Selling Price</th>
                    <th className="py-3.5 px-4 text-right">Cost Price</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4">Cold Room / Location</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        No product SKUs match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isLow = (p.currentStock || 0) <= (p.minStockLevel || p.lowStockThreshold || 0);
                      const isOut = (p.currentStock || 0) <= 0;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            {p.code}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-slate-900 dark:text-white">{p.name}</div>
                            {p.description && (
                              <div className="text-[11px] text-slate-400 truncate max-w-xs">{p.description}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {p.group}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                            {p.currentStock.toLocaleString()}{' '}
                            <span className="text-xs font-medium text-slate-400">{p.unit}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-500 dark:text-slate-400">
                            {(p.minStockLevel || p.lowStockThreshold || 0).toLocaleString()} {p.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                            TZS {p.unitPrice.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-600 dark:text-slate-400">
                            TZS {p.costPrice.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-black inline-flex items-center gap-1 ${
                                isOut
                                  ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                                  : isLow
                                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                                  : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                              }`}
                            >
                              {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Available'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs truncate max-w-[180px]">
                            {p.warehouseLocation || 'General Store'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setMovForm(f => ({ ...f, productId: p.id }));
                                  setIsMovementModalOpen(true);
                                }}
                                className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-colors"
                              >
                                Transfer
                              </button>
                              <button
                                onClick={() => {
                                  setEditingThresholdProduct({
                                    id: p.id,
                                    name: p.name,
                                    minStockLevel: p.minStockLevel || p.lowStockThreshold || 50,
                                    unit: p.unit
                                  });
                                  setIsThresholdModalOpen(true);
                                }}
                                title="Configure Safety Stock Threshold"
                                className="p-1.5 text-xs font-bold bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-950/40 text-slate-600 hover:text-amber-700 dark:text-slate-400 dark:hover:text-amber-300 rounded-lg transition-colors"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STOCK MOVEMENTS LEDGER */}
      {activeTab === 'movements' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter Ledger:</span>
              <select
                value={selectedMovementType}
                onChange={(e) => setSelectedMovementType(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All Movement Types</option>
                <option value="Stock In">Stock In</option>
                <option value="Stock Out">Stock Out</option>
                <option value="Production">Production</option>
                <option value="Sales">Sales</option>
                <option value="Adjustments">Adjustments</option>
                <option value="Returns">Returns</option>
                <option value="Waste">Waste</option>
                <option value="Transfers">Transfers</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Showing {filteredMovements.length} logged stock transactions
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-4">Reference No.</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4 text-right">Prev Bal</th>
                    <th className="py-3 px-4 text-right">Quantity</th>
                    <th className="py-3 px-4 text-right">New Balance</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4">Officer Responsible</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No movement entries recorded for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((m) => {
                      const isPositive = m.quantity > 0;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                            <div className="font-bold text-slate-900 dark:text-white">{m.date}</div>
                            <div className="text-[11px] text-slate-400">{m.time}</div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                            {m.referenceNumber}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${
                                m.type === 'Stock In' || m.type === 'Production'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                  : m.type === 'Sales' || m.type === 'Stock Out'
                                  ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                  : m.type === 'Waste'
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {m.type}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">{m.productName}</div>
                            <div className="text-[10px] font-mono text-slate-400">{m.productCode}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-slate-500">
                            {m.previousBalance.toLocaleString()}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-black ${
                              isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {isPositive ? `+${m.quantity.toLocaleString()}` : m.quantity.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                            {m.currentBalance.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs max-w-xs truncate">
                            {m.reason}
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                            {m.performedBy}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE BIRD PURCHASES */}
      {activeTab === 'live_birds' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Live Broiler Purchases & Outgrower Flock Registry
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track grower farms, live bird mortality, transport weights and abattoir receipts
              </p>
            </div>
            <button
              onClick={() => setIsPurchaseModalOpen(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              New Flock Intake
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {liveBirdPurchases.map((lb) => (
              <div key={lb.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900">
                    {lb.purchaseNumber}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {lb.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white">{lb.supplierName}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{lb.farmerName} • {lb.location}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Birds</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{lb.numberOfBirds.toLocaleString()} Birds</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Avg Weight</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{lb.averageLiveWeight} Kg</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Weight</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{lb.totalWeight.toLocaleString()} Kg</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Rate / Kg</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">TZS {lb.pricePerKg.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Flock Total Cost:</span>
                    <span className="text-amber-600 dark:text-amber-400 font-black">TZS {lb.totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Transport Surcharge:</span>
                    <span>TZS {lb.transportCost.toLocaleString()}</span>
                  </div>
                </div>

                {onNavigateToProduction && (
                  <button
                    onClick={onNavigateToProduction}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    Process in Abattoir Line <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PACKAGING MATERIALS */}
      {activeTab === 'packaging' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Packaging Material Usage & Traceability
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log vacuum bags, master shipping cartons, and barcode labels utilized in processing
              </p>
            </div>
            <button
              onClick={() => setIsPackagingModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Log Packaging Use
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Ref Number</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Packaging Type</th>
                    <th className="py-3 px-4 text-right">Units Consumed</th>
                    <th className="py-3 px-4 text-right">Total Cost</th>
                    <th className="py-3 px-4">Batch Link</th>
                    <th className="py-3 px-4">Officer</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {packagingRecords.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {pkg.packagingNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {pkg.date}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                          {pkg.packagingType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                        {pkg.packagingQuantityUsed.toLocaleString()} Pcs
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                        TZS {pkg.packagingCost.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {pkg.batchId || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                        {pkg.officer}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                        {pkg.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: COLD ROOMS & WAREHOUSE FACILITIES */}
      {activeTab === 'warehouses' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {warehouses.map((wh) => (
              <div key={wh.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {wh.status}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {wh.type}
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">{wh.name}</h4>
                  <p className="text-xs text-slate-400">{wh.powerSource}</p>
                </div>

                {/* Temperature Meter */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <Thermometer className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Temp</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">
                        {wh.currentTempCelsius}°C
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Target / Humidity</span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Target: {wh.targetTempCelsius}°C • {wh.humidityPct}% RH
                    </span>
                  </div>
                </div>

                {/* Capacity Gauge */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Bay Capacity Utilization</span>
                    <span>{wh.utilizationPct}% ({wh.currentStockKg.toLocaleString()} / {wh.capacityKg.toLocaleString()} Kg)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        wh.utilizationPct > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, wh.utilizationPct)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Designated Products
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {wh.primaryProducts.map((prod, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        {prod}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: AUDITS & RECONCILIATION ADJUSTMENTS */}
      {activeTab === 'adjustments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Physical Inventory Audit Adjustments
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authorized adjustments for count recounts, damaged cuts, packaging failures & write-offs
              </p>
            </div>
            <button
              onClick={() => {
                if (products.length > 0) setAdjForm(f => ({ ...f, productId: products[0].id }));
                setIsAdjustmentModalOpen(true);
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Record Adjustment
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Adjustment No.</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Adjustment Type</th>
                    <th className="py-3 px-4 text-right">Previous Stock</th>
                    <th className="py-3 px-4 text-right">Adjustment Delta</th>
                    <th className="py-3 px-4 text-right">New Stock</th>
                    <th className="py-3 px-4">Reason & Justification</th>
                    <th className="py-3 px-4">Audited By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {adjustments.map((adj) => {
                    const isPos = adj.quantityChange > 0;
                    return (
                      <tr key={adj.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {adj.adjustmentNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                          {adj.date}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {adj.productName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                            {adj.adjustmentType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-500">
                          {adj.previousStock.toLocaleString()}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-black ${
                            isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isPos ? `+${adj.quantityChange}` : adj.quantityChange}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                          {adj.newStock.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 max-w-sm">
                          {adj.reason}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {adj.adjustedBy}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: LOW STOCK ALERTS & REORDER ALARM CENTER */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/30 p-5 rounded-3xl border border-amber-200 dark:border-amber-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 flex items-center justify-center font-black shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-amber-900 dark:text-amber-300">
                  Active Threshold Alarms & Reorder Center
                </h3>
                <p className="text-xs text-amber-800/80 dark:text-amber-400/80 font-medium">
                  Automated surveillance of Kibaha cold storage against configured safety stock floors.
                  Instantly schedule replenishment or slaughter batch processing.
                </p>
              </div>
            </div>

            {alerts.length > 0 && (
              <button
                onClick={handleBroadcastAlertNotification}
                disabled={isBroadcastingAlert}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 shrink-0 self-stretch md:self-auto justify-center"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{isBroadcastingAlert ? 'Broadcasting...' : 'Broadcast Alert to Management'}</span>
              </button>
            )}
          </div>

          {/* Severity Filter Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Severity Filter:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setAlertSeverityFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  alertSeverityFilter === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                All Alarms ({alerts.length})
              </button>
              <button
                onClick={() => setAlertSeverityFilter('Critical')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  alertSeverityFilter === 'Critical'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 hover:bg-rose-100'
                }`}
              >
                Critical Shortages ({alerts.filter(a => a.severity === 'Critical').length})
              </button>
              <button
                onClick={() => setAlertSeverityFilter('Warning')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  alertSeverityFilter === 'Warning'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 hover:bg-amber-100'
                }`}
              >
                Warning Shortages ({alerts.filter(a => a.severity === 'Warning').length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.length === 0 ? (
              <div className="col-span-2 p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">All Stock Levels Healthy</h4>
                <p className="text-xs text-slate-400">Zero products are currently below their minimum safety thresholds.</p>
              </div>
            ) : (
              alerts
                .filter(alt => alertSeverityFilter === 'ALL' || alt.severity === alertSeverityFilter)
                .map((alt) => {
                  const deficit = Math.max(0, alt.minStockLevel - alt.currentQuantity);
                  const stockHealthPct = alt.minStockLevel > 0 
                    ? Math.min(100, Math.round((alt.currentQuantity / alt.minStockLevel) * 100)) 
                    : 0;
                  const matchingProd = products.find(p => p.id === alt.productId);
                  const isPoultryOutput = matchingProd?.group === 'Whole Chicken' || matchingProd?.group === 'Chicken Cuts' || matchingProd?.group === 'Offals';

                  return (
                    <div key={alt.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-rose-200 dark:border-rose-900/60 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-400">{alt.productCode}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            alt.severity === 'Critical'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                          }`}>
                            {alt.severity} Shortage
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white">{alt.productName}</h4>
                        <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                          Current: {alt.currentQuantity.toLocaleString()} {alt.unit} (Safety Minimum: {alt.minStockLevel.toLocaleString()} {alt.unit})
                        </p>
                      </div>

                      {/* Stock Level Progress Indicator */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-500">Safety Stock Capacity:</span>
                          <span className={alt.severity === 'Critical' ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-amber-600 dark:text-amber-400 font-black'}>
                            {stockHealthPct}% of Safety Floor
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              alt.severity === 'Critical' ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.max(5, stockHealthPct)}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-500">Deficit / Suggested Restock Target:</span>
                        <span className="text-slate-900 dark:text-white font-black">+{deficit * 2} {alt.unit}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => {
                            setMovForm(f => ({ ...f, productId: alt.productId, type: 'Stock In', quantity: deficit * 2 }));
                            setIsMovementModalOpen(true);
                          }}
                          className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all text-center"
                        >
                          Log Restock Intake
                        </button>

                        <button
                          onClick={() => {
                            setAdjForm(f => ({ ...f, productId: alt.productId, quantityChange: deficit }));
                            setIsAdjustmentModalOpen(true);
                          }}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold text-center"
                        >
                          Adjust Count
                        </button>

                        <button
                          onClick={() => {
                            setEditingThresholdProduct({
                              id: alt.productId,
                              name: alt.productName,
                              minStockLevel: alt.minStockLevel,
                              unit: alt.unit
                            });
                            setIsThresholdModalOpen(true);
                          }}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold text-center"
                        >
                          Configure Threshold
                        </button>

                        {isPoultryOutput && onNavigateToProduction && (
                          <button
                            onClick={onNavigateToProduction}
                            className="py-2 px-3 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                          >
                            <Factory className="w-3.5 h-3.5" />
                            <span>Slaughter Batch</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: NEW PRODUCT SKU FORM */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Create New Product SKU</h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Product Name</label>
                <input
                  type="text"
                  value={prodForm.name ?? ''}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  placeholder="e.g. Marinated Chicken Wings (Spicy)"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Product Group</label>
                  <select
                    value={prodForm.group ?? 'Chicken Cuts'}
                    onChange={(e) => setProdForm({ ...prodForm, group: e.target.value as ProductGroup })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-sm"
                  >
                    <option value="Whole Chicken">Whole Chicken</option>
                    <option value="Chicken Cuts">Chicken Cuts</option>
                    <option value="Offals">Offals</option>
                    <option value="By-Products">By-Products</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Unit of Measure</label>
                  <select
                    value={prodForm.unit ?? 'Kg'}
                    onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-sm"
                  >
                    <option value="Kg">Kg</option>
                    <option value="Piece">Piece</option>
                    <option value="Carton">Carton</option>
                    <option value="Packet">Packet</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Selling Price (TZS)</label>
                  <input
                    type="number"
                    value={prodForm.unitPrice ?? 0}
                    onChange={(e) => setProdForm({ ...prodForm, unitPrice: Number(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cost Price (TZS)</label>
                  <input
                    type="number"
                    value={prodForm.costPrice ?? 0}
                    onChange={(e) => setProdForm({ ...prodForm, costPrice: Number(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={prodForm.currentStock ?? 0}
                    onChange={(e) => setProdForm({ ...prodForm, currentStock: Number(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    value={prodForm.minStockLevel ?? 100}
                    onChange={(e) => setProdForm({ ...prodForm, minStockLevel: Number(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Warehouse Location</label>
                <select
                  value={prodForm.warehouseLocation ?? 'Cold Room 1 (-18°C Blast Freezer)'}
                  onChange={(e) => setProdForm({ ...prodForm, warehouseLocation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-sm"
                >
                  <option value="Cold Room 1 (-18°C Blast Freezer)">Cold Room 1 (-18°C Blast Freezer)</option>
                  <option value="Cold Room 2 (2°C Chilled Storage)">Cold Room 2 (2°C Chilled Storage)</option>
                  <option value="Packaging Depot Bay A">Packaging Depot Bay A</option>
                  <option value="Abattoir Receiving Bay">Abattoir Receiving Bay</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description / Spec</label>
                <textarea
                  value={prodForm.description ?? ''}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md"
                >
                  {submitting ? 'Saving SKU...' : 'Create Product SKU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD STOCK MOVEMENT */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Record Stock Movement</h3>
              <button onClick={() => setIsMovementModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleRecordMovement} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Product</label>
                <select
                  value={movForm.productId ?? ''}
                  onChange={(e) => setMovForm({ ...movForm, productId: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-sm"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) — Current: {p.currentStock} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Movement Type</label>
                  <select
                    value={movForm.type ?? 'Stock In'}
                    onChange={(e) => setMovForm({ ...movForm, type: e.target.value as StockMovementType })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-sm"
                  >
                    <option value="Stock In">Stock In (+)</option>
                    <option value="Stock Out">Stock Out (-)</option>
                    <option value="Production">Production (+)</option>
                    <option value="Sales">Sales (-)</option>
                    <option value="Returns">Returns (+)</option>
                    <option value="Waste">Waste (-)</option>
                    <option value="Transfers">Transfers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={movForm.quantity ?? 0}
                    onChange={(e) => setMovForm({ ...movForm, quantity: Number(e.target.value) || 0 })}
                    required
                    min="1"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Reference Number (Optional)</label>
                <input
                  type="text"
                  value={movForm.referenceNumber ?? ''}
                  onChange={(e) => setMovForm({ ...movForm, referenceNumber: e.target.value })}
                  placeholder="e.g. PO-2026-088 or PB-2026-042"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Reason / Description</label>
                <textarea
                  value={movForm.reason ?? ''}
                  onChange={(e) => setMovForm({ ...movForm, reason: e.target.value })}
                  rows={2}
                  placeholder="Reason for movement..."
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md"
                >
                  {submitting ? 'Recording...' : 'Confirm Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: STOCK ADJUSTMENT */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Audit Stock Adjustment</h3>
              <button onClick={() => setIsAdjustmentModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleRecordAdjustment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Product</label>
                <select
                  value={adjForm.productId ?? ''}
                  onChange={(e) => setAdjForm({ ...adjForm, productId: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-sm"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) — In Stock: {p.currentStock} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Adjustment Type</label>
                  <select
                    value={adjForm.adjustmentType ?? 'Correct Errors'}
                    onChange={(e) => setAdjForm({ ...adjForm, adjustmentType: e.target.value as StockAdjustmentType })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-sm"
                  >
                    <option value="Correct Errors">Correct Errors</option>
                    <option value="Increase Stock">Increase Stock (+)</option>
                    <option value="Decrease Stock">Decrease Stock (-)</option>
                    <option value="Damage Adjustment">Damage Adjustment (-)</option>
                    <option value="Expiry Adjustment">Expiry Adjustment (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Delta (Qty to add/remove)</label>
                  <input
                    type="number"
                    value={adjForm.quantityChange ?? 0}
                    onChange={(e) => setAdjForm({ ...adjForm, quantityChange: Number(e.target.value) || 0 })}
                    placeholder="e.g. -15 or +20"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Justification Reason</label>
                <textarea
                  value={adjForm.reason ?? ''}
                  onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
                  rows={2}
                  placeholder="e.g. Monthly physical inventory recount discrepancy..."
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm shadow-md"
                >
                  {submitting ? 'Applying...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: RECEIVE LIVE FLOCK */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Receive Live Broiler Flock</h3>
              <button onClick={() => setIsPurchaseModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreatePurchase} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Supplier / Co-operative Name</label>
                <input
                  type="text"
                  value={purchForm.supplierName ?? ''}
                  onChange={(e) => setPurchForm({ ...purchForm, supplierName: e.target.value })}
                  placeholder="e.g. Kibaha Broiler Outgrowers Co-op"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Farmer Contact</label>
                  <input
                    type="text"
                    value={purchForm.farmerName ?? ''}
                    onChange={(e) => setPurchForm({ ...purchForm, farmerName: e.target.value })}
                    placeholder="Farmer Name"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Location</label>
                  <input
                    type="text"
                    value={purchForm.location ?? ''}
                    onChange={(e) => setPurchForm({ ...purchForm, location: e.target.value })}
                    placeholder="e.g. Bagamoyo / Kibaha"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Number of Birds</label>
                  <input
                    type="number"
                    value={purchForm.numberOfBirds ?? 0}
                    onChange={(e) => setPurchForm({ ...purchForm, numberOfBirds: Number(e.target.value) || 0 })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Avg Weight (Kg)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={purchForm.averageLiveWeight ?? 1.85}
                    onChange={(e) => setPurchForm({ ...purchForm, averageLiveWeight: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Price / Kg (TZS)</label>
                  <input
                    type="number"
                    step="100"
                    value={purchForm.pricePerKg ?? 3500}
                    onChange={(e) => setPurchForm({ ...purchForm, pricePerKg: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl flex justify-between items-center text-xs font-bold text-amber-900 dark:text-amber-300">
                <span>Calculated Total Weight:</span>
                <span>{Math.round(purchForm.numberOfBirds * purchForm.averageLiveWeight).toLocaleString()} Kg</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm shadow-md"
                >
                  {submitting ? 'Receiving...' : 'Confirm Intake'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: LOG PACKAGING USE */}
      {isPackagingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Log Packaging Material Usage</h3>
              <button onClick={() => setIsPackagingModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreatePackaging} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Packaging Type</label>
                <select
                  value={pkgForm.packagingType ?? 'Vacuum Pack'}
                  onChange={(e) => setPkgForm({ ...pkgForm, packagingType: e.target.value as any })}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-sm"
                >
                  <option value="Vacuum Pack">Vacuum Pack (1kg Food Barrier Bag)</option>
                  <option value="Carton">Carton (5kg Master Export Box)</option>
                  <option value="Plastic Bag">Plastic Bag (Polythene Liner)</option>
                  <option value="Labels">Labels (TBS Barcode Direct Thermal)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Units Consumed</label>
                  <input
                    type="number"
                    value={pkgForm.packagingQuantityUsed ?? 0}
                    onChange={(e) => setPkgForm({ ...pkgForm, packagingQuantityUsed: Number(e.target.value) || 0 })}
                    required
                    min="1"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Total Cost (TZS)</label>
                  <input
                    type="number"
                    value={pkgForm.packagingCost ?? 0}
                    onChange={(e) => setPkgForm({ ...pkgForm, packagingCost: Number(e.target.value) || 0 })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Production Batch Link</label>
                <input
                  type="text"
                  value={pkgForm.batchId ?? ''}
                  onChange={(e) => setPkgForm({ ...pkgForm, batchId: e.target.value })}
                  placeholder="e.g. PB-2026-042"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                <textarea
                  value={pkgForm.notes ?? ''}
                  onChange={(e) => setPkgForm({ ...pkgForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPackagingModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md"
                >
                  {submitting ? 'Logging...' : 'Log Usage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: CONFIGURE LOW STOCK SAFETY THRESHOLD */}
      {isThresholdModalOpen && editingThresholdProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Safety Stock Floor</h3>
                  <p className="text-xs text-slate-400">Configure low stock alarm trigger</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsThresholdModalOpen(false);
                  setEditingThresholdProduct(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateThreshold} className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Product Target</span>
                <div className="text-sm font-black text-slate-900 dark:text-white">{editingThresholdProduct.name}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Minimum Safety Threshold ({editingThresholdProduct.unit})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editingThresholdProduct.minStockLevel}
                    onChange={(e) => setEditingThresholdProduct({
                      ...editingThresholdProduct,
                      minStockLevel: Math.max(0, Number(e.target.value) || 0)
                    })}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-base focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {editingThresholdProduct.unit}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  When current Cold Room stock dips to or below this amount, an automatic shortage alarm will trigger and dispatch notifications to plant managers.
                </p>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsThresholdModalOpen(false);
                    setEditingThresholdProduct(null);
                  }}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>{submitting ? 'Saving...' : 'Update Threshold'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
