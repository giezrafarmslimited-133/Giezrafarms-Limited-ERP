import React, { useState, useMemo } from 'react';
import { 
  BatchCostBreakdown, 
  ExpenseEntry 
} from '../../../types/erp';
import { 
  Layers, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  ChevronRight, 
  TrendingUp, 
  Scale, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle,
  X,
  FileText,
  Building2,
  Calendar,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

interface BatchCostBreakdownTableProps {
  batches: BatchCostBreakdown[];
  expenses: ExpenseEntry[];
  marketSellingPricePerKg?: number;
  onAttachExpenseToBatch: (batchNumber: string) => void;
}

export const BatchCostBreakdownTable: React.FC<BatchCostBreakdownTableProps> = ({
  batches,
  expenses,
  marketSellingPricePerKg = 8500,
  onAttachExpenseToBatch
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<BatchCostBreakdown | null>(null);

  // Compute aggregate KPIs across batches
  const aggregateMetrics = useMemo(() => {
    if (!batches || batches.length === 0) {
      return {
        totalBirds: 0,
        totalLiveWeight: 0,
        totalDressedKg: 0,
        totalLiveBirdCost: 0,
        totalPackagingCost: 0,
        totalLinkedExpenses: 0,
        totalOverallCost: 0,
        avgCostPerDressedKg: 0,
        avgCostPerLiveBird: 0,
        avgDressingYield: 0,
        avgMarginPerKg: 0
      };
    }

    const totalBirds = batches.reduce((acc, b) => acc + (b.liveBirdsCount || 0), 0);
    const totalLiveWeight = batches.reduce((acc, b) => acc + (b.liveWeightKg || 0), 0);
    const totalDressedKg = batches.reduce((acc, b) => acc + (b.dressedOutputKg || 0), 0);
    const totalLiveBirdCost = batches.reduce((acc, b) => acc + (b.liveBirdsCost || 0), 0);
    const totalPackagingCost = batches.reduce((acc, b) => acc + (b.packagingCost || 0), 0);
    const totalLinkedExpenses = batches.reduce((acc, b) => acc + (b.linkedExpensesTotal || 0), 0);
    const totalOverallCost = batches.reduce((acc, b) => acc + (b.totalBatchCost || 0), 0);

    const avgCostPerDressedKg = totalDressedKg > 0 ? Math.round(totalOverallCost / totalDressedKg) : 0;
    const avgCostPerLiveBird = totalBirds > 0 ? Math.round(totalLiveBirdCost / totalBirds) : 0;
    const avgDressingYield = totalLiveWeight > 0 ? Number(((totalDressedKg / totalLiveWeight) * 100).toFixed(1)) : 0;
    const avgMarginPerKg = marketSellingPricePerKg - avgCostPerDressedKg;

    return {
      totalBirds,
      totalLiveWeight,
      totalDressedKg,
      totalLiveBirdCost,
      totalPackagingCost,
      totalLinkedExpenses,
      totalOverallCost,
      avgCostPerDressedKg,
      avgCostPerLiveBird,
      avgDressingYield,
      avgMarginPerKg
    };
  }, [batches, marketSellingPricePerKg]);

  // Filter batches
  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      const q = searchQuery.toLowerCase();
      return (
        b.batchNumber.toLowerCase().includes(q) ||
        b.supplier.toLowerCase().includes(q) ||
        (b.flockType && b.flockType.toLowerCase().includes(q))
      );
    });
  }, [batches, searchQuery]);

  // Find linked expenses for the selected batch modal
  const batchLinkedExpenses = useMemo(() => {
    if (!selectedBatch) return [];
    return expenses.filter(
      e => e.batchId && (e.batchId === selectedBatch.batchNumber || e.batchId === selectedBatch.batchId)
    );
  }, [selectedBatch, expenses]);

  return (
    <div className="space-y-6">
      
      {/* Unit Economics Executive Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Avg Live Bird Cost</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <DollarSign className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            TZS {aggregateMetrics.avgCostPerLiveBird.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Across {aggregateMetrics.totalBirds.toLocaleString()} broilers received
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Avg Dressing Yield %</span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Scale className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {aggregateMetrics.avgDressingYield}%
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {aggregateMetrics.totalDressedKg.toLocaleString()} kg carcass output
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Unit Cost / Dressed Kg</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Layers className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            TZS {aggregateMetrics.avgCostPerDressedKg.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Live bird + packaging + direct processing
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Gross Spread / Kg</span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            +TZS {aggregateMetrics.avgMarginPerKg.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            vs TZS {marketSellingPricePerKg.toLocaleString()} wholesale price
          </p>
        </div>

      </div>

      {/* Production Batch Cost Ledger Container */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Abattoir Batch Cost Breakdowns & Allocations
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-black">
                {batches.length} Batches
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live bird procurement, packaging bags/boxes, and direct processing allocations per slaughter flock
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search batch or supplier..."
                className="pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </div>

        {/* Batches Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3">Batch & Date</th>
                <th className="py-3 px-3">Supplier & Breed</th>
                <th className="py-3 px-3">Live Intake</th>
                <th className="py-3 px-3">Live Spend (TZS)</th>
                <th className="py-3 px-3">Dressed Yield</th>
                <th className="py-3 px-3">Packaging & Overheads</th>
                <th className="py-3 px-3">Total Batch Cost</th>
                <th className="py-3 px-3">Unit Cost / Kg</th>
                <th className="py-3 px-3">Margin Buffer</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
              {filteredBatches.map((batch) => {
                const spread = marketSellingPricePerKg - batch.costPerDressedKg;
                const isHealthySpread = spread > 1000;

                return (
                  <tr key={batch.batchId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{batch.batchNumber}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{batch.date}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{batch.supplier}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{batch.flockType}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        {batch.liveBirdsCount.toLocaleString()} birds
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {batch.liveWeightKg.toLocaleString()} kg live
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-amber-700 dark:text-amber-400">
                        TZS {batch.liveBirdsCost.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        TZS {batch.costPerLiveBird.toLocaleString()} / bird
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {batch.dressedOutputKg.toLocaleString()} kg
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-extrabold">
                        {batch.dressingYieldPct}% yield
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-slate-700 dark:text-slate-300">
                        Pkg: <span className="font-bold text-blue-600 dark:text-blue-400">TZS {batch.packagingCost.toLocaleString()}</span>
                      </div>
                      {batch.linkedExpensesTotal > 0 ? (
                        <div className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                          +{batch.linkedExpensesCount} exp: TZS {batch.linkedExpensesTotal.toLocaleString()}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400">No linked exp</div>
                      )}
                    </td>

                    <td className="py-3.5 px-3 font-extrabold text-slate-900 dark:text-white">
                      TZS {batch.totalBatchCost.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black ${
                        batch.costPerDressedKg < 7000
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : batch.costPerDressedKg <= 8000
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                      }`}>
                        TZS {batch.costPerDressedKg.toLocaleString()} / kg
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className={`font-black ${isHealthySpread ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {spread >= 0 ? `+TZS ${spread.toLocaleString()}` : `-TZS ${Math.abs(spread).toLocaleString()}`}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {((spread / marketSellingPricePerKg) * 100).toFixed(1)}% margin
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedBatch(batch)}
                          title="Inspect Unit Cost Tree"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-400 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onAttachExpenseToBatch(batch.batchNumber)}
                          title="Attach Direct Expense Voucher"
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Attach</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredBatches.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No production batches found matching "{searchQuery}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Batch Cost Detail Inspection Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-6 relative max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Batch {selectedBatch.batchNumber} Cost Structure
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                      {selectedBatch.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Source: {selectedBatch.supplier} • Processed: {selectedBatch.date}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBatch(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Cost Waterfall Breakdown */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Cost Allocation Stack
              </h4>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                
                {/* 1. Live Birds */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span className="font-bold text-slate-900 dark:text-white">Live Bird Procurement:</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      ({selectedBatch.liveBirdsCount} birds @ TZS {selectedBatch.costPerLiveBird.toLocaleString()})
                    </span>
                  </div>
                  <span className="font-extrabold text-amber-700 dark:text-amber-400">
                    TZS {selectedBatch.liveBirdsCost.toLocaleString()}
                  </span>
                </div>

                {/* 2. Packaging */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="font-bold text-slate-900 dark:text-white">Packaging Materials:</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      (Vacuum shrink bags, 5kg boxes & labeling)
                    </span>
                  </div>
                  <span className="font-extrabold text-blue-700 dark:text-blue-400">
                    TZS {selectedBatch.packagingCost.toLocaleString()}
                  </span>
                </div>

                {/* 3. Direct Overheads */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                    <span className="font-bold text-slate-900 dark:text-white">Direct Processing Expenses:</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      ({batchLinkedExpenses.length} attached expense vouchers)
                    </span>
                  </div>
                  <span className="font-extrabold text-purple-700 dark:text-purple-400">
                    TZS {selectedBatch.linkedExpensesTotal.toLocaleString()}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm">
                  <span className="font-black text-slate-900 dark:text-white">Total Production Batch Cost:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                    TZS {selectedBatch.totalBatchCost.toLocaleString()}
                  </span>
                </div>

              </div>

              {/* Yield & Unit Cost Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Live Intake Weight</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {selectedBatch.liveWeightKg.toLocaleString()} kg
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Dressed Carcass</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {selectedBatch.dressedOutputKg.toLocaleString()} kg
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Dressing Yield</div>
                  <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {selectedBatch.dressingYieldPct}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-center">
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">Cost / Dressed Kg</div>
                  <div className="text-sm font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                    TZS {selectedBatch.costPerDressedKg.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Linked Expenses List */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Linked Direct Vouchers ({batchLinkedExpenses.length})
                  </h4>
                  <button
                    onClick={() => {
                      const bNum = selectedBatch.batchNumber;
                      setSelectedBatch(null);
                      onAttachExpenseToBatch(bNum);
                    }}
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Attach Another Voucher</span>
                  </button>
                </div>

                {batchLinkedExpenses.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    {batchLinkedExpenses.map(exp => (
                      <div key={exp.id} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {exp.expenseNumber} • {exp.category}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {exp.date} • {exp.notes || 'Direct batch allocation'}
                          </div>
                        </div>
                        <div className="font-black text-purple-600 dark:text-purple-400">
                          TZS {exp.amount.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    No extra operating expense vouchers currently attached to this batch.
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedBatch(null)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl"
              >
                Close Inspection
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
