import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  Scale, 
  Layers, 
  Sliders, 
  BookmarkPlus, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  Percent,
  Sparkles,
  Zap
} from 'lucide-react';

interface SavedScenario {
  id: string;
  name: string;
  flockSize: number;
  costPerDressedKg: number;
  netProfit: number;
  marginPct: number;
  date: string;
}

export const ProfitSensitivityCalculator: React.FC = () => {
  // 1. Flock & Procurement Parameters
  const [flockSize, setFlockSize] = useState<number>(1000);
  const [pricingMode, setPricingMode] = useState<'per_bird' | 'per_kg_live'>('per_bird');
  const [liveBirdPrice, setLiveBirdPrice] = useState<number>(6500); // TZS / bird
  const [liveBirdPricePerKg, setLiveBirdPricePerKg] = useState<number>(3600); // TZS / kg live
  const [avgLiveWeight, setAvgLiveWeight] = useState<number>(1.85); // kg
  const [mortalityPct, setMortalityPct] = useState<number>(1.5); // % loss

  // 2. Abattoir & Processing Parameters
  const [dressingYieldPct, setDressingYieldPct] = useState<number>(75); // % yield
  const [packagingCostPerBird, setPackagingCostPerBird] = useState<number>(170); // TZS / bird
  const [processingOverheadPerBird, setProcessingOverheadPerBird] = useState<number>(350); // TZS / bird

  // 3. Revenue & Cuts Strategy
  const [monetizeOffals, setMonetizeOffals] = useState<boolean>(true);
  const [offalYieldPct, setOffalYieldPct] = useState<number>(5.5); // % of live weight
  const [offalPricePerKg, setOffalPricePerKg] = useState<number>(4500); // TZS / kg

  const [cutsProportionPct, setCutsProportionPct] = useState<number>(30); // 30% sold as cuts
  const [cutsPremiumPerKg, setCutsPremiumPerKg] = useState<number>(1500); // +1500 TZS/kg
  const [targetBasePricePerKg, setTargetBasePricePerKg] = useState<number>(8500); // TZS / kg

  // Saved scenarios
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(() => {
    try {
      const saved = localStorage.getItem('giezra_profit_scenarios');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'scen_1',
        name: 'Standard Cobb 500 (1,000 Birds)',
        flockSize: 1000,
        costPerDressedKg: 5450,
        netProfit: 3950000,
        marginPct: 32.5,
        date: '2026-08-01'
      }
    ];
  });
  const [newScenarioName, setNewScenarioName] = useState<string>('');

  // Core Financial Modeling Calculations
  const model = useMemo(() => {
    const liveBirdsSurviving = Math.round(flockSize * (1 - mortalityPct / 100));
    const totalLiveWeightKg = flockSize * avgLiveWeight;
    
    // Live bird procurement spend
    const costPerBirdProcured = pricingMode === 'per_bird' ? liveBirdPrice : Math.round(liveBirdPricePerKg * avgLiveWeight);
    const totalLiveProcurementCost = flockSize * costPerBirdProcured;

    // Output weights
    const carcassKgPerBird = avgLiveWeight * (dressingYieldPct / 100);
    const totalDressedCarcassKg = Math.round(liveBirdsSurviving * carcassKgPerBird);

    const offalKgPerBird = monetizeOffals ? avgLiveWeight * (offalYieldPct / 100) : 0;
    const totalOffalKg = Math.round(liveBirdsSurviving * offalKgPerBird);

    // Processing & packaging costs
    const totalPackagingCost = liveBirdsSurviving * packagingCostPerBird;
    const totalOverheadCost = liveBirdsSurviving * processingOverheadPerBird;
    const totalFlockProductionCost = totalLiveProcurementCost + totalPackagingCost + totalOverheadCost;

    // Unit costs
    const costPerDressedKg = totalDressedCarcassKg > 0 ? Math.round(totalFlockProductionCost / totalDressedCarcassKg) : 0;
    const costPerBirdProcessed = liveBirdsSurviving > 0 ? Math.round(totalFlockProductionCost / liveBirdsSurviving) : 0;

    // Revenue streams
    const cutsKg = Math.round(totalDressedCarcassKg * (cutsProportionPct / 100));
    const wholeKg = totalDressedCarcassKg - cutsKg;

    const wholeRevenue = wholeKg * targetBasePricePerKg;
    const cutsRevenue = cutsKg * (targetBasePricePerKg + cutsPremiumPerKg);
    const offalRevenue = monetizeOffals ? totalOffalKg * offalPricePerKg : 0;

    const totalGrossRevenue = wholeRevenue + cutsRevenue + offalRevenue;
    const totalOutputVolumeKg = totalDressedCarcassKg + totalOffalKg;

    const netProfit = totalGrossRevenue - totalFlockProductionCost;
    const netProfitPerKg = totalDressedCarcassKg > 0 ? Math.round(netProfit / totalDressedCarcassKg) : 0;
    const netProfitPerBird = liveBirdsSurviving > 0 ? Math.round(netProfit / liveBirdsSurviving) : 0;
    const marginPct = totalGrossRevenue > 0 ? Number(((netProfit / totalGrossRevenue) * 100).toFixed(1)) : 0;
    const roiPct = totalFlockProductionCost > 0 ? Number(((netProfit / totalFlockProductionCost) * 100).toFixed(1)) : 0;

    // Breakeven price per kg
    const breakevenPricePerKg = totalDressedCarcassKg > 0 
      ? Math.round((totalFlockProductionCost - offalRevenue - (cutsKg * cutsPremiumPerKg)) / totalDressedCarcassKg)
      : 0;

    return {
      liveBirdsSurviving,
      totalLiveWeightKg,
      costPerBirdProcured,
      totalLiveProcurementCost,
      totalDressedCarcassKg,
      totalOffalKg,
      totalPackagingCost,
      totalOverheadCost,
      totalFlockProductionCost,
      costPerDressedKg,
      costPerBirdProcessed,
      cutsKg,
      wholeKg,
      wholeRevenue,
      cutsRevenue,
      offalRevenue,
      totalGrossRevenue,
      totalOutputVolumeKg,
      netProfit,
      netProfitPerKg,
      netProfitPerBird,
      marginPct,
      roiPct,
      breakevenPricePerKg
    };
  }, [
    flockSize,
    pricingMode,
    liveBirdPrice,
    liveBirdPricePerKg,
    avgLiveWeight,
    mortalityPct,
    dressingYieldPct,
    packagingCostPerBird,
    processingOverheadPerBird,
    monetizeOffals,
    offalYieldPct,
    offalPricePerKg,
    cutsProportionPct,
    cutsPremiumPerKg,
    targetBasePricePerKg
  ]);

  // Sensitivity Stress Test Matrix (Prices: -10%, current, +10% vs Yields: 70%, 75%, 78%)
  const sensitivityMatrix = useMemo(() => {
    const prices = [
      { label: '-10% Downswing', price: Math.round(targetBasePricePerKg * 0.9) },
      { label: 'Current Base', price: targetBasePricePerKg },
      { label: '+10% Peak Demand', price: Math.round(targetBasePricePerKg * 1.1) }
    ];

    const yields = [70, 75, 78];

    return prices.map(p => {
      const yieldResults = yields.map(y => {
        const dressedKg = Math.round(model.liveBirdsSurviving * avgLiveWeight * (y / 100));
        const cutsKg = Math.round(dressedKg * (cutsProportionPct / 100));
        const wholeKg = dressedKg - cutsKg;
        const rev = (wholeKg * p.price) + (cutsKg * (p.price + cutsPremiumPerKg)) + model.offalRevenue;
        const profit = rev - model.totalFlockProductionCost;
        const margin = rev > 0 ? Number(((profit / rev) * 100).toFixed(1)) : 0;
        return { yield: y, profit, margin };
      });

      return {
        priceLabel: p.label,
        price: p.price,
        yieldResults
      };
    });
  }, [model, targetBasePricePerKg, avgLiveWeight, cutsProportionPct, cutsPremiumPerKg]);

  const handleSaveScenario = () => {
    const name = newScenarioName.trim() || `Flock ${flockSize.toLocaleString()} birds (${dressingYieldPct}% yield)`;
    const newScen: SavedScenario = {
      id: `scen_${Date.now()}`,
      name,
      flockSize,
      costPerDressedKg: model.costPerDressedKg,
      netProfit: model.netProfit,
      marginPct: model.marginPct,
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [newScen, ...savedScenarios].slice(0, 10);
    setSavedScenarios(updated);
    localStorage.setItem('giezra_profit_scenarios', JSON.stringify(updated));
    setNewScenarioName('');
  };

  const handleDeleteScenario = (id: string) => {
    const updated = savedScenarios.filter(s => s.id !== id);
    setSavedScenarios(updated);
    localStorage.setItem('giezra_profit_scenarios', JSON.stringify(updated));
  };

  const handleResetDefaults = () => {
    setFlockSize(1000);
    setPricingMode('per_bird');
    setLiveBirdPrice(6500);
    setLiveBirdPricePerKg(3600);
    setAvgLiveWeight(1.85);
    setMortalityPct(1.5);
    setDressingYieldPct(75);
    setPackagingCostPerBird(170);
    setProcessingOverheadPerBird(350);
    setMonetizeOffals(true);
    setOffalYieldPct(5.5);
    setOffalPricePerKg(4500);
    setCutsProportionPct(30);
    setCutsPremiumPerKg(1500);
    setTargetBasePricePerKg(8500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Simulation Controls Column */}
      <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Flock Unit Cost & Profit Simulator
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Adjust procurement, dressing yield & cuts mix
              </p>
            </div>
          </div>
          <button
            onClick={handleResetDefaults}
            title="Reset to Factory Defaults"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5 text-xs">
          
          {/* Section 1: Flock Procurement */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              1. Live Bird Procurement
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Flock Intake Size (Birds)
                </label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={flockSize}
                  onChange={(e) => setFlockSize(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Avg Live Weight (Kg)
                </label>
                <input
                  type="number"
                  min="1.0"
                  max="3.5"
                  step="0.05"
                  value={avgLiveWeight}
                  onChange={(e) => setAvgLiveWeight(Number(e.target.value) || 1.85)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Pricing Mode Toggle */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">Pricing Basis:</span>
                <div className="flex items-center gap-1 p-0.5 bg-slate-200 dark:bg-slate-700 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPricingMode('per_bird')}
                    className={`px-2 py-1 rounded-md transition-colors ${pricingMode === 'per_bird' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
                  >
                    TZS / Bird
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingMode('per_kg_live')}
                    className={`px-2 py-1 rounded-md transition-colors ${pricingMode === 'per_kg_live' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
                  >
                    TZS / Kg Live
                  </button>
                </div>
              </div>

              {pricingMode === 'per_bird' ? (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Live Broiler Purchase Price (TZS / Bird)
                  </label>
                  <input
                    type="number"
                    min="3000"
                    step="100"
                    value={liveBirdPrice}
                    onChange={(e) => setLiveBirdPrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-extrabold text-amber-600 dark:text-amber-400"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Live Weight Rate (TZS / Kg Live)
                  </label>
                  <input
                    type="number"
                    min="1500"
                    step="50"
                    value={liveBirdPricePerKg}
                    onChange={(e) => setLiveBirdPricePerKg(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-extrabold text-amber-600 dark:text-amber-400"
                  />
                  <div className="text-[10px] text-slate-400 mt-1">
                    Equivalent to TZS {Math.round(liveBirdPricePerKg * avgLiveWeight).toLocaleString()} / bird
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">Transport & Lairage Mortality</span>
                <span className="font-extrabold text-rose-600 dark:text-rose-400">{mortalityPct}% ({Math.round(flockSize * (mortalityPct / 100))} birds)</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={mortalityPct}
                onChange={(e) => setMortalityPct(Number(e.target.value))}
                className="w-full accent-rose-600"
              />
            </div>
          </div>

          {/* Section 2: Abattoir Yield & Direct Overheads */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              2. Abattoir Yield & Processing Costs
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">Dressing Carcass Yield</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{dressingYieldPct}%</span>
              </div>
              <input
                type="range"
                min="65"
                max="82"
                step="1"
                value={dressingYieldPct}
                onChange={(e) => setDressingYieldPct(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <button type="button" onClick={() => setDressingYieldPct(70)} className="hover:underline">70% Standard</button>
                <button type="button" onClick={() => setDressingYieldPct(75)} className="hover:underline font-bold text-emerald-600">75% Target</button>
                <button type="button" onClick={() => setDressingYieldPct(78)} className="hover:underline">78% Prime Cobb</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Packaging (TZS/Bird)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={packagingCostPerBird}
                  onChange={(e) => setPackagingCostPerBird(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Labour/Power/Gas (TZS/Bird)
                </label>
                <input
                  type="number"
                  min="0"
                  step="25"
                  value={processingOverheadPerBird}
                  onChange={(e) => setProcessingOverheadPerBird(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Revenue Realization & Cuts Allocation */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              3. Sales Realization & Revenue Mix
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Base Whole Carcass Price (TZS / Kg)
              </label>
              <input
                type="number"
                min="5000"
                step="100"
                value={targetBasePricePerKg}
                onChange={(e) => setTargetBasePricePerKg(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">Cuts Portion vs Whole</span>
                <span className="font-extrabold text-blue-600 dark:text-blue-400">{cutsProportionPct}% Cuts (+TZS {cutsPremiumPerKg.toLocaleString()}/kg)</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={cutsProportionPct}
                onChange={(e) => setCutsProportionPct(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            {/* Offals Monetization Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-xs">Monetize Offals & By-products</div>
                <div className="text-[10px] text-slate-400">Livers, gizzards & feet @ TZS {offalPricePerKg.toLocaleString()}/kg</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={monetizeOffals}
                  onChange={(e) => setMonetizeOffals(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* Scenario Saver */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                placeholder="Scenario label (e.g. 5K Cobb Festival Run)..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
              <button
                type="button"
                onClick={handleSaveScenario}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Simulation Output Dashboard Column */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Top Real-Time KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              Projected Net Profit
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              TZS {model.netProfit.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400/80 font-bold">
              {model.marginPct}% Margin • {model.roiPct}% ROI
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Cost Per Dressed Kg
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              TZS {model.costPerDressedKg.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              TZS {model.costPerBirdProcessed.toLocaleString()} per processed bird
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Breakeven Selling Price
            </div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
              TZS {model.breakevenPricePerKg.toLocaleString()}
            </div>
            <div className="text-[11px] text-purple-700 dark:text-purple-400 font-bold">
              Buffer: +TZS {(targetBasePricePerKg - model.breakevenPricePerKg).toLocaleString()} / kg
            </div>
          </div>

        </div>

        {/* Financial Flow Breakdown Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Simulated Financial Ledger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detailed cost absorption & revenue breakdown for this {flockSize.toLocaleString()} bird flock
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            
            {/* Cost Column */}
            <div className="space-y-3">
              <div className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                Total Production COGS (Absorption)
              </div>

              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Live Bird Intake:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    TZS {model.totalLiveProcurementCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Packaging Materials:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    TZS {model.totalPackagingCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Direct Labour, Power & Gas:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    TZS {model.totalOverheadCost.toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-sm">
                  <span className="text-slate-900 dark:text-white">Total Cost of Goods Sold:</span>
                  <span className="text-rose-600 dark:text-rose-400">
                    TZS {model.totalFlockProductionCost.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Revenue Column */}
            <div className="space-y-3">
              <div className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                Anticipated Revenue Realization
              </div>

              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Whole Carcasses ({model.wholeKg.toLocaleString()} kg):
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    TZS {model.wholeRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Specialty Cuts ({model.cutsKg.toLocaleString()} kg):
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    TZS {model.cutsRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Offals & By-products ({model.totalOffalKg.toLocaleString()} kg):
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    TZS {model.offalRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-sm">
                  <span className="text-slate-900 dark:text-white">Total Gross Revenue:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    TZS {model.totalGrossRevenue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Sensitivity Stress Test Matrix */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                <span>Market Price & Yield Stress Matrix</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stress-test profitability across market wholesale price swings and slaughter dressing yields
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="py-2.5 px-3">Price Scenario</th>
                  <th className="py-2.5 px-3">Rate / Kg</th>
                  <th className="py-2.5 px-3 text-center">70% Yield</th>
                  <th className="py-2.5 px-3 text-center">75% Yield (Target)</th>
                  <th className="py-2.5 px-3 text-center">78% Yield (Prime)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sensitivityMatrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{row.priceLabel}</td>
                    <td className="py-3 px-3 font-bold text-slate-600 dark:text-slate-300">
                      TZS {row.price.toLocaleString()}
                    </td>
                    {row.yieldResults.map((res, rIdx) => (
                      <td key={rIdx} className="py-3 px-3 text-center">
                        <div className={`font-extrabold ${res.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          TZS {res.profit.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">
                          {res.margin}% margin
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Saved Scenarios Comparison */}
        {savedScenarios.length > 0 && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Saved Simulation Scenarios ({savedScenarios.length})
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {savedScenarios.map(scen => (
                <div key={scen.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{scen.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {scen.flockSize.toLocaleString()} birds • Net: <span className="font-bold text-emerald-600 dark:text-emerald-400">TZS {scen.netProfit.toLocaleString()}</span> ({scen.marginPct}%)
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteScenario(scen.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                    title="Delete Scenario"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
