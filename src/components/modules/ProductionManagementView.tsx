import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProductionBatch } from '../../types/erp';
import { 
  Factory, 
  Plus, 
  Scale, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Boxes, 
  FileText, 
  Trash2, 
  RefreshCw, 
  Search, 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  X, 
  Calculator, 
  Layers,
  ArrowRight,
  ShieldCheck,
  Building2,
  PieChart
} from 'lucide-react';

interface ProductionManagementViewProps {
  onNavigateToInventory?: () => void;
}

export const ProductionManagementView: React.FC<ProductionManagementViewProps> = ({ onNavigateToInventory }) => {
  const { currentUser } = useAuth();
  const isOperations = currentUser?.role === 'OPERATIONS_MANAGER';
  const isCEO = currentUser?.role === 'CEO';
  const isSysAdmin = currentUser?.role === 'SYSTEM_ADMINISTRATOR';
  const isStockMgr = currentUser?.role === 'STOCK_MANAGER';
  const canManageProduction = isOperations || isCEO || isSysAdmin || isStockMgr;

  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterSupplier, setFilterSupplier] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalStep, setModalStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Selected Batch Detail Modal State
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null);

  // Production Form State
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    supplierName: 'Kibaha Broiler Outgrowers Co-op',
    liveBirdsPurchased: 2000,
    averageLiveWeightKg: 1.85,
    liveBirdsCost: 13000000, // TZS
    slaughteredBirds: 1980,
    mortalityCount: 20,
    carcassProducedKg: 1950,
    carcassProducedPcs: 1450,
    quarterLegsKg: 260,
    drumsticksKg: 180,
    bonelessBreastKg: 130,
    wingsKg: 80,
    thighsKg: 110,
    gizzardsKg: 100,
    liversKg: 50,
    feetAndNecksKg: 50,
    vacuumBags1kg: 1450,
    boxes5kg: 160,
    trays: 80,
    updateInventory: true,
    notes: 'Standard processing batch at Kibaha plant.',
    operatorName: currentUser?.name || 'Josephat Kilonzo (Operations Manager)'
  });

  // Draft persistence in localStorage
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('giezra_production_batch_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.form) {
          setForm(prev => ({ ...prev, ...parsed.form }));
        }
        if (typeof parsed.modalStep === 'number') setModalStep(parsed.modalStep);
        if (parsed.isModalOpen) setIsModalOpen(true);
      }
    } catch (e) {
      console.error('Error loading production batch draft:', e);
    }
  }, []);

  useEffect(() => {
    if (form) {
      localStorage.setItem('giezra_production_batch_draft', JSON.stringify({ form, modalStep, isModalOpen }));
    }
  }, [form, modalStep, isModalOpen]);

  const handleDiscardDraft = () => {
    localStorage.removeItem('giezra_production_batch_draft');
    setModalStep(1);
    setForm({
      date: new Date().toISOString().split('T')[0],
      supplierName: 'Kibaha Broiler Outgrowers Co-op',
      liveBirdsPurchased: 2000,
      averageLiveWeightKg: 1.85,
      liveBirdsCost: 13000000,
      slaughteredBirds: 1980,
      mortalityCount: 20,
      carcassProducedKg: 1950,
      carcassProducedPcs: 1450,
      quarterLegsKg: 260,
      drumsticksKg: 180,
      bonelessBreastKg: 130,
      wingsKg: 80,
      thighsKg: 110,
      gizzardsKg: 100,
      liversKg: 50,
      feetAndNecksKg: 50,
      vacuumBags1kg: 1450,
      boxes5kg: 160,
      trays: 80,
      updateInventory: true,
      notes: '',
      operatorName: currentUser?.name || 'Josephat Kilonzo'
    });
    setIsModalOpen(false);
  };

  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/production/batches', {
        headers: {
          'x-user-role': currentUser?.role || '',
          'x-user-id': currentUser?.id || '',
          'x-user-name': currentUser?.name || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setBatches(data);
      }
    } catch (err) {
      console.error('Error fetching production batches:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // Yield calculations in real-time
  const totalLiveKg = Math.round(form.liveBirdsPurchased * form.averageLiveWeightKg * 10) / 10;
  const totalCutsKg = form.quarterLegsKg + form.drumsticksKg + form.bonelessBreastKg + form.wingsKg + (form.thighsKg || 0);
  const totalOffalsKg = form.gizzardsKg + form.liversKg + form.feetAndNecksKg;
  const totalOutputKg = form.carcassProducedKg + totalCutsKg + totalOffalsKg;
  const yieldPct = totalLiveKg > 0 ? Math.round((totalOutputKg / totalLiveKg) * 1000) / 10 : 0;
  const dressingPct = totalLiveKg > 0 ? Math.round((form.carcassProducedKg / totalLiveKg) * 1000) / 10 : 0;
  const pkgCost = (form.vacuumBags1kg * 180) + (form.boxes5kg * 800) + (form.trays * 250);
  const estCostPerKg = totalOutputKg > 0 ? Math.round((form.liveBirdsCost + pkgCost) / totalOutputKg) : 0;

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const payload = {
        date: form.date,
        supplierName: form.supplierName,
        liveBirdsPurchased: Number(form.liveBirdsPurchased),
        averageLiveWeightKg: Number(form.averageLiveWeightKg),
        liveBirdsCost: Number(form.liveBirdsCost),
        slaughteredBirds: Number(form.slaughteredBirds),
        mortalityCount: Number(form.mortalityCount),
        carcassProducedKg: Number(form.carcassProducedKg),
        carcassProducedPcs: Number(form.carcassProducedPcs),
        cutsBreakdown: {
          quarterLegsKg: Number(form.quarterLegsKg),
          drumsticksKg: Number(form.drumsticksKg),
          bonelessBreastKg: Number(form.bonelessBreastKg),
          wingsKg: Number(form.wingsKg),
          thighsKg: Number(form.thighsKg || 0)
        },
        offalsBreakdown: {
          gizzardsKg: Number(form.gizzardsKg),
          liversKg: Number(form.liversKg),
          feetAndNecksKg: Number(form.feetAndNecksKg)
        },
        packagingBreakdown: {
          vacuumBags1kg: Number(form.vacuumBags1kg),
          boxes5kg: Number(form.boxes5kg),
          trays: Number(form.trays)
        },
        totalPackagingCost: pkgCost,
        updateInventory: form.updateInventory,
        notes: form.notes,
        operatorName: form.operatorName
      };

      const res = await fetch('/api/production/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || '',
          'x-user-id': currentUser?.id || '',
          'x-user-name': currentUser?.name || ''
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: `Batch #${data.batchNumber} recorded successfully! Stock levels updated automatically.`
        });
        localStorage.removeItem('giezra_production_batch_draft');
        setIsModalOpen(false);
        setModalStep(1);
        fetchBatches();
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed to record production batch'
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Server error recording batch'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBatch = async (batchId: string, batchNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete production batch ${batchNumber}?`)) return;

    try {
      const res = await fetch(`/api/production/batches/${batchId}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': currentUser?.role || '',
          'x-user-id': currentUser?.id || '',
          'x-user-name': currentUser?.name || ''
        }
      });

      if (res.ok) {
        fetchBatches();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to delete batch');
      }
    } catch (err) {
      console.error('Error deleting batch:', err);
    }
  };

  // Metrics summary
  const totalBirdsPurchased = batches.reduce((sum, b) => sum + (b.liveBirdsPurchased || 0), 0);
  const avgYieldPct = batches.length > 0 
    ? Math.round((batches.reduce((sum, b) => sum + (b.yieldPercentage || 0), 0) / batches.length) * 10) / 10 
    : 74.5;
  const totalCarcassOutputKg = batches.reduce((sum, b) => sum + (b.carcassProducedKg || 0), 0);
  const totalCutsOffalsKg = batches.reduce((sum, b) => sum + (b.cutsProducedKg || 0) + (b.offalsProducedKg || 0), 0);
  const totalPackagingUnits = batches.reduce((sum, b) => sum + (b.packagingUsedUnits || 0), 0);

  // Filter batches
  const filteredBatches = batches.filter(b => {
    const matchesSearch = b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (b.supplierName && b.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (b.operatorName && b.operatorName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSupplier = filterSupplier === 'ALL' || b.supplierName === filterSupplier;
    return matchesSearch && matchesSupplier;
  });

  const suppliersList = Array.from(new Set(batches.map(b => b.supplierName).filter(Boolean)));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Factory className="w-3.5 h-3.5" /> Phase 3 Active • Slaughter & Yield Processing
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Production Management & Yield Control
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
            Track live birds acquisition, slaughter stats, carcass/cuts/offals output yield %, packaging usage, and automatic inventory updates.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          {onNavigateToInventory && (
            <button
              onClick={onNavigateToInventory}
              className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-2xl border border-white/20 backdrop-blur-md flex items-center gap-2 transition-all"
            >
              <Boxes className="w-4 h-4 text-teal-300" />
              <span>Cold Rooms & Stock</span>
            </button>
          )}

          {canManageProduction && (
            <button
              onClick={() => {
                setModalStep(1);
                setIsModalOpen(true);
              }}
              className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Record Slaughter Batch</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold shadow-md ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <div className="flex items-center gap-3">
            {statusMessage.type === 'success' && onNavigateToInventory && (
              <button
                onClick={onNavigateToInventory}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
              >
                <span>Inspect Stock</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Live Birds Processed</span>
            <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalBirdsPurchased.toLocaleString()} <span className="text-xs text-slate-500 font-medium">Birds</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Kibaha Processing Plant
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Avg Yield %</span>
            <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {avgYieldPct}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Benchmark Target: <span className="font-bold text-slate-700 dark:text-slate-200">72.0% - 78.0%</span>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Carcass Produced</span>
            <Factory className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalCarcassOutputKg.toLocaleString()} <span className="text-xs text-slate-500 font-medium">Kg</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Whole Broiler Chickens
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Cuts & Offals Output</span>
            <PieChart className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalCutsOffalsKg.toLocaleString()} <span className="text-xs text-slate-500 font-medium">Kg</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Cutup Parts + Cleaned Offals
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Packaging Materials</span>
            <Boxes className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalPackagingUnits.toLocaleString()} <span className="text-xs text-slate-500 font-medium">Units</span>
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
            Vacuum Bags & Boxes
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Batch #, Supplier or Operator..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">Supplier:</span>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Outgrower Suppliers</option>
              {suppliersList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <button
              onClick={fetchBatches}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Batches Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="p-3.5">Batch Code & Date</th>
                <th className="p-3.5">Outgrower Supplier</th>
                <th className="p-3.5 text-right">Live Birds / Weight</th>
                <th className="p-3.5 text-right">Carcass (Whole)</th>
                <th className="p-3.5 text-right">Cuts & Offals</th>
                <th className="p-3.5 text-center">Yield %</th>
                <th className="p-3.5 text-right">Cost / Kg</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading production processing records...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No production batches found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => {
                  const isYieldGood = batch.yieldPercentage >= 74;
                  return (
                    <tr key={batch.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5">
                        <div className="font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <Factory className="w-3.5 h-3.5" />
                          <span>{batch.batchNumber}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                          {new Date(batch.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {batch.supplierName || 'Internal Processing'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Operator: {batch.operatorName}
                        </div>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {batch.liveBirdsPurchased.toLocaleString()} birds
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {batch.totalLiveWeightKg ? batch.totalLiveWeightKg.toLocaleString() : (batch.liveBirdsPurchased * 1.8).toFixed(1)} Kg
                        </div>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {batch.carcassProducedKg.toLocaleString()} Kg
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Dressing: {batch.dressingPercentage ? batch.dressingPercentage : (batch.totalLiveWeightKg ? ((batch.carcassProducedKg / batch.totalLiveWeightKg) * 100).toFixed(1) : '53.0')}%
                        </div>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {(batch.cutsProducedKg + batch.offalsProducedKg).toLocaleString()} Kg
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Cuts: {batch.cutsProducedKg}kg | Offals: {batch.offalsProducedKg}kg
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                          isYieldGood 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-500/30'
                        }`}>
                          {batch.yieldPercentage}%
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        TZS {batch.costPerKgProduced ? batch.costPerKgProduced.toLocaleString() : '4,800'}
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedBatch(batch)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                            title="View Full Breakdown"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          {(isCEO || isOperations) && (
                            <button
                              onClick={() => handleDeleteBatch(batch.id, batch.batchNumber)}
                              className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-lg transition-colors"
                              title="Delete Batch Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* CREATE SLAUGHTER BATCH WIZARD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl shadow-2xl overflow-hidden my-auto">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between border-b border-emerald-500/20">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-300">
                  <Factory className="w-4 h-4 text-emerald-400" />
                  <span>Kibaha Slaughterhouse & Processing Plant</span>
                </div>
                <h3 className="text-lg font-black tracking-tight">Record New Slaughter & Yield Processing Batch</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Wizard Indicator */}
            <div className="bg-slate-100 dark:bg-slate-800/80 p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
              <div className={`flex items-center gap-1.5 ${modalStep >= 1 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${modalStep >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'}`}>1</span>
                <span className="hidden sm:inline">Acquisition</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <div className={`flex items-center gap-1.5 ${modalStep >= 2 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${modalStep >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'}`}>2</span>
                <span className="hidden sm:inline">Slaughter</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <div className={`flex items-center gap-1.5 ${modalStep >= 3 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${modalStep >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'}`}>3</span>
                <span className="hidden sm:inline">Yield Breakdown</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <div className={`flex items-center gap-1.5 ${modalStep >= 4 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${modalStep >= 4 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'}`}>4</span>
                <span className="hidden sm:inline">Packaging & Sync</span>
              </div>
            </div>

            <form onSubmit={handleCreateBatch} className="p-6 space-y-6">
              
              {/* STEP 1: Live Birds Acquisition */}
              {modalStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    <Scale className="w-4 h-4" />
                    <span>Step 1: Live Birds Acquisition & Sourcing</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Batch Processing Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={form.date ?? ''}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Outgrower Supplier / Farm Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.supplierName ?? ''}
                        onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                        placeholder="e.g. Kibaha Broiler Outgrowers Co-op"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Live Birds Purchased (Count) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={form.liveBirdsPurchased ?? 0}
                        onChange={(e) => setForm({ ...form, liveBirdsPurchased: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Average Live Bird Weight (Kg) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.5"
                        value={form.averageLiveWeightKg ?? 0}
                        onChange={(e) => setForm({ ...form, averageLiveWeightKg: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Total Live Birds Cost (TZS) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.liveBirdsCost ?? 0}
                        onChange={(e) => setForm({ ...form, liveBirdsCost: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400"
                        required
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Cost per bird: TZS {form.liveBirdsPurchased > 0 ? Math.round(form.liveBirdsCost / form.liveBirdsPurchased).toLocaleString() : '0'} | Total Input Weight: <span className="font-bold text-slate-800 dark:text-slate-200">{totalLiveKg.toLocaleString()} Kg</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Slaughter Stats & Mortality */}
              {modalStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    <Factory className="w-4 h-4" />
                    <span>Step 2: Slaughtering Operations & Mortality Stats</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Birds Slaughtered (Count) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={form.slaughteredBirds ?? 0}
                        onChange={(e) => setForm({ ...form, slaughteredBirds: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Mortality / Rejected Birds (Count)
                      </label>
                      <input
                        type="number"
                        value={form.mortalityCount ?? 0}
                        onChange={(e) => setForm({ ...form, mortalityCount: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Plant Operator / Supervisor Name
                      </label>
                      <input
                        type="text"
                        value={form.operatorName ?? ''}
                        onChange={(e) => setForm({ ...form, operatorName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 rounded-2xl text-xs space-y-1">
                    <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Operational Summary
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Purchased: <span className="font-bold">{form.liveBirdsPurchased}</span> | Dressed: <span className="font-bold">{form.slaughteredBirds}</span> | Mortality Rate: <span className="font-bold text-rose-600 dark:text-rose-400">{((form.mortalityCount / form.liveBirdsPurchased) * 100).toFixed(1)}%</span>
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 3: Yield Breakdown */}
              {modalStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    <PieChart className="w-4 h-4" />
                    <span>Step 3: Carcass, Cuts & Offals Yield Breakdown</span>
                  </div>

                  {/* Whole Chicken Carcass */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white uppercase">
                      1. Whole Chicken (Dressed Carcass)
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Carcass Weight (Kg)
                        </label>
                        <input
                          type="number"
                          value={form.carcassProducedKg ?? 0}
                          onChange={(e) => setForm({ ...form, carcassProducedKg: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Whole Birds Count (Pcs)
                        </label>
                        <input
                          type="number"
                          value={form.carcassProducedPcs ?? 0}
                          onChange={(e) => setForm({ ...form, carcassProducedPcs: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Chicken Cuts */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white uppercase flex items-center justify-between">
                      <span>2. Chicken Cutup Parts (Kg)</span>
                      <span className="text-emerald-600 font-bold">{totalCutsKg} Kg Total</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Quarter Legs (Kg)</label>
                        <input
                          type="number"
                          value={form.quarterLegsKg ?? 0}
                          onChange={(e) => setForm({ ...form, quarterLegsKg: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Drumsticks (Kg)</label>
                        <input
                          type="number"
                          value={form.drumsticksKg ?? 0}
                          onChange={(e) => setForm({ ...form, drumsticksKg: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Chicken Thighs (Kg)</label>
                        <input
                          type="number"
                          value={form.thighsKg ?? 0}
                          onChange={(e) => setForm({ ...form, thighsKg: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Breast Boneless (Kg)</label>
                        <input
                          type="number"
                          value={form.bonelessBreastKg ?? 0}
                          onChange={(e) => setForm({ ...form, bonelessBreastKg: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Wings (Kg)</label>
                        <input
                          type="number"
                          value={form.wingsKg ?? 0}
                          onChange={(e) => setForm({ ...form, wingsKg: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Offals */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white uppercase flex items-center justify-between">
                      <span>3. Cleaned Offals (Kg)</span>
                      <span className="text-amber-600 font-bold">{totalOffalsKg} Kg Total</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Gizzards (Kg)</label>
                        <input
                          type="number"
                          value={form.gizzardsKg ?? 0}
                          onChange={(e) => setForm({ ...form, gizzardsKg: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Livers (Kg)</label>
                        <input
                          type="number"
                          value={form.liversKg ?? 0}
                          onChange={(e) => setForm({ ...form, liversKg: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Feet & Necks (Kg)</label>
                        <input
                          type="number"
                          value={form.feetAndNecksKg ?? 0}
                          onChange={(e) => setForm({ ...form, feetAndNecksKg: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculated Yield Summary Box */}
                  <div className="p-4 bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-2xl space-y-2 border border-emerald-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-emerald-300">Live Input vs Net Output Yield</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${yieldPct >= 74 ? 'bg-emerald-500 text-slate-950' : 'bg-amber-400 text-slate-950'}`}>
                        {yieldPct}% Yield Rate
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-emerald-500/20">
                      <div>
                        <span className="text-[10px] text-emerald-200 block">Live Input:</span>
                        <span className="font-bold">{totalLiveKg} Kg</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-200 block">Total Output:</span>
                        <span className="font-bold">{totalOutputKg} Kg</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-200 block">Dressing %:</span>
                        <span className="font-bold">{dressingPct}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-200 block">Est. Cost/Kg:</span>
                        <span className="font-mono font-bold text-emerald-300">TZS {estCostPerKg.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Packaging & Sync */}
              {modalStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    <Boxes className="w-4 h-4" />
                    <span>Step 4: Packaging Materials Usage & Inventory Sync</span>
                  </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Vacuum Bags 1kg (Pcs)
                      </label>
                      <input
                        type="number"
                        value={form.vacuumBags1kg ?? 0}
                        onChange={(e) => setForm({ ...form, vacuumBags1kg: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Boxes 5kg (Pcs)
                      </label>
                      <input
                        type="number"
                        value={form.boxes5kg ?? 0}
                        onChange={(e) => setForm({ ...form, boxes5kg: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Plastic Trays (Pcs)
                      </label>
                      <input
                        type="number"
                        value={form.trays ?? 0}
                        onChange={(e) => setForm({ ...form, trays: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Batch Processing Notes / Observations
                    </label>
                    <textarea
                      value={form.notes ?? ''}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Add any flock health, dressing quality, or operational notes..."
                      rows={3}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        Automatic Stock Inventory Sync
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        Automatically increment finished goods inventory and deduct used packaging materials.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.updateInventory}
                      onChange={(e) => setForm({ ...form, updateInventory: e.target.checked })}
                      className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Wizard Nav Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-xl font-bold text-xs hover:bg-rose-100 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Discard Draft</span>
                </button>

                <div className="flex items-center space-x-2 ml-auto">
                  {modalStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setModalStep(modalStep - 1)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200"
                    >
                      Back
                    </button>
                  )}

                  {modalStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => setModalStep(modalStep + 1)}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                    >
                      <span>Next Step</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                    >
                      {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>Save & Finalize Batch</span>
                    </button>
                  )}
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DETAILED BATCH BREAKDOWN MODAL */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl overflow-hidden my-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500/30 uppercase">
                  Batch Detail Sheet
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Factory className="w-5 h-5 text-emerald-600" />
                  <span>Batch #{selectedBatch.batchNumber}</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedBatch(null)}
                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Processing Date</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedBatch.date}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Outgrower Supplier</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedBatch.supplierName || 'Kibaha Co-op'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Operator</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedBatch.operatorName}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Live Birds Sourced</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedBatch.liveBirdsPurchased.toLocaleString()} Birds</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Live Weight</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedBatch.totalLiveWeightKg ? selectedBatch.totalLiveWeightKg.toLocaleString() : (selectedBatch.liveBirdsPurchased * 1.8)} Kg</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Yield Percentage</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">{selectedBatch.yieldPercentage}%</span>
              </div>
            </div>

            {/* Cuts and Offals breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-500">Output Products Breakdown</h4>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  <span>Whole Chicken (Carcass)</span>
                  <span className="font-bold">{selectedBatch.carcassProducedKg} Kg</span>
                </div>
                {selectedBatch.cutsBreakdown && (
                  <>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400 pl-3">
                      <span>• Quarter Legs</span>
                      <span>{selectedBatch.cutsBreakdown.quarterLegsKg || 0} Kg</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400 pl-3">
                      <span>• Drumsticks</span>
                      <span>{selectedBatch.cutsBreakdown.drumsticksKg || 0} Kg</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400 pl-3">
                      <span>• Chicken Thighs</span>
                      <span>{(selectedBatch.cutsBreakdown as any).thighsKg || 0} Kg</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400 pl-3">
                      <span>• Boneless Breast</span>
                      <span>{selectedBatch.cutsBreakdown.bonelessBreastKg || 0} Kg</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400 pl-3 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                      <span>• Wings</span>
                      <span>{selectedBatch.cutsBreakdown.wingsKg || 0} Kg</span>
                    </div>
                  </>
                )}
                {selectedBatch.offalsBreakdown && (
                  <>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400 pl-3">
                      <span>• Gizzards</span>
                      <span>{selectedBatch.offalsBreakdown.gizzardsKg || 0} Kg</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400 pl-3">
                      <span>• Livers</span>
                      <span>{selectedBatch.offalsBreakdown.liversKg || 0} Kg</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400 pl-3">
                      <span>• Feet & Necks</span>
                      <span>{selectedBatch.offalsBreakdown.feetAndNecksKg || 0} Kg</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {selectedBatch.notes && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                <span className="font-bold">Operator Notes:</span> {selectedBatch.notes}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              {onNavigateToInventory && (
                <button
                  onClick={() => {
                    setSelectedBatch(null);
                    onNavigateToInventory();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Inspect Stock in Cold Rooms</span>
                </button>
              )}
              <button
                onClick={() => setSelectedBatch(null)}
                className="px-5 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs rounded-xl"
              >
                Close Sheet
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
