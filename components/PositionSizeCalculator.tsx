
import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Percent, Target, AlertCircle, RefreshCw, TrendingUp, TrendingDown, Info, Settings, Crosshair, ArrowRight, ChevronDown } from 'lucide-react';

const INSTRUMENT_PRESETS = [
    { id: 'custom', name: 'Custom / Manual', type: 'EQUITY', multiplier: 1, note: 'Manually enter contract size' },
    { id: 'eurusd', name: 'EUR/USD (Standard)', type: 'FOREX', multiplier: 100000, note: '1 Lot = 100,000 Units' },
    { id: 'gbpusd', name: 'GBP/USD (Standard)', type: 'FOREX', multiplier: 100000, note: '1 Lot = 100,000 Units' },
    { id: 'usdjpy', name: 'USD/JPY', type: 'FOREX', multiplier: 100000, note: 'Requires Exchange Rate' },
    { id: 'xauusd', name: 'Gold (XAU/USD)', type: 'FOREX', multiplier: 100, note: '1 Lot = 100 oz' },
    { id: 'btcusd', name: 'Bitcoin (BTC/USD)', type: 'EQUITY', multiplier: 1, note: '1 Lot = 1 Coin' },
    { id: 'us30', name: 'US30 / Dow Jones (CFD)', type: 'FUTURES', multiplier: 1, note: 'Check Broker! Often 1 or 10' },
    { id: 'nas100', name: 'NAS100 / US Tech (CFD)', type: 'FUTURES', multiplier: 1, note: 'Check Broker! Often 1 or 20' },
    { id: 'us500', name: 'US500 / S&P (CFD)', type: 'FUTURES', multiplier: 1, note: 'Check Broker! Often 1 or 50' },
];

const PositionSizeCalculator: React.FC = () => {
  const [accountBalance, setAccountBalance] = useState(50000);
  const [riskType, setRiskType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [riskValue, setRiskValue] = useState(1.0);
  const [entryPrice, setEntryPrice] = useState<number | ''>('');
  const [stopLoss, setStopLoss] = useState<number | ''>('');
  const [targetPrice, setTargetPrice] = useState<number | ''>('');
  const [assetClass, setAssetClass] = useState<'EQUITY' | 'FUTURES' | 'FOREX'>('FOREX');
  const [multiplier, setMultiplier] = useState(100000);
  const [selectedPresetId, setSelectedPresetId] = useState('eurusd');
  const [exchangeRate, setExchangeRate] = useState<number>(1); // For pairs like USDJPY where Quote != Account Currency
  const [slippage, setSlippage] = useState<number | ''>('');

  // Handle Preset Change
  const handlePresetChange = (id: string) => {
      setSelectedPresetId(id);
      const preset = INSTRUMENT_PRESETS.find(p => p.id === id);
      if (preset) {
          setAssetClass(preset.type as any);
          setMultiplier(preset.multiplier);
          // Reset exchange rate to 1 unless it's a known non-USD quote pair handled manually later
          setExchangeRate(1); 
      }
  };

  // Calculations
  const riskAmount = riskType === 'PERCENT' 
    ? (accountBalance * riskValue / 100) 
    : riskValue;

  const entry = Number(entryPrice) || 0;
  const stop = Number(stopLoss) || 0;
  const target = Number(targetPrice) || 0;
  const slip = Number(slippage) || 0;

  const isLong = entry > stop;
  const rawStopDistance = Math.abs(entry - stop);
  // Effective stop distance includes slippage padding (worst case execution)
  const stopDistance = rawStopDistance + slip;
  
  // Calculate Quantity (Lots)
  // Formula: Risk = Lots * ContractSize * StopDistance * (1 / ExchangeRate if needed)
  // Therefore: Lots = (Risk * ExchangeRate) / (ContractSize * StopDistance)
  
  // Note: ExchangeRate here represents "How many QuoteUnits equal 1 AccountUnit".
  // If Account is USD and Pair is USDJPY. Risk is $100.
  // 1 Lot moves 1000 JPY per pip. Stop is 10 pips (0.10). 
  // Loss in JPY = 1 * 100000 * 0.10 = 10,000 JPY.
  // Loss in USD = 10,000 / USDJPY_Rate.
  // So we need to divide by exchange rate if quote is not account currency.
  // Ideally user inputs "USDJPY Price" as exchange rate.
  
  // Simplified logic for this calculator:
  // We assume "Exchange Rate" input is the conversion factor to bring Quote Currency to Account Currency.
  // If Account=USD, Pair=USDJPY, ExchangeRate should be ~150 (dividing factor).
  // If Account=USD, Pair=EURUSD, ExchangeRate is 1.
  
  let quantity = 0;
  // Prevent division by zero
  if (stopDistance > 0 && multiplier > 0 && exchangeRate > 0) {
      // Check if we need to divide or multiply based on standard notation.
      // Usually for XXX/USD pairs (Quote=USD), factor is 1.
      // For USD/XXX pairs (Quote=XXX), we typically divide by the pair price (ExchangeRate).
      
      let adjustedRisk = riskAmount;
      
      const isQuoteAccountCurr = exchangeRate === 1; 
      
      if (isQuoteAccountCurr) {
          quantity = riskAmount / (stopDistance * multiplier);
      } else {
          // If exchange rate is provided, we assume it's the price of the pair (e.g., 150.00 for USDJPY)
          quantity = (riskAmount * exchangeRate) / (stopDistance * multiplier);
      }
  }

  // Formatting
  let quantityFormatted = '0.00';
  if (quantity > 0 && isFinite(quantity)) {
      quantityFormatted = quantity.toLocaleString('en-US', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
      });
  }

  // Notional Value
  // For FX: Lots * 100,000 * Entry / ExchangeRate (approx)
  // This is purely indicative.
  const notionalValue = (quantity * multiplier * entry) / (exchangeRate || 1);
  
  // Target Calcs
  const targetDistance = Math.abs(target - entry);
  const rewardAmount = quantity * targetDistance * multiplier / (exchangeRate || 1); // Approx profit
  const rMultiple = (target > 0 && stopDistance > 0) ? (targetDistance / stopDistance).toFixed(2) : '0.00';

  // Dynamic Label
  const activePreset = INSTRUMENT_PRESETS.find(p => p.id === selectedPresetId);

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col animate-fade-in text-slate-900">
      <div className="mb-8 flex justify-between items-start">
         <div>
             <div className="inline-flex items-center justify-center p-3 bg-white shadow-sm border border-slate-200 rounded-xl mb-4 text-brand-blue">
                 <Calculator size={32} />
             </div>
             <h2 className="text-3xl font-extrabold text-slate-900 mb-2">MT5 / TradeLocker Calculator</h2>
             <p className="text-slate-500 font-medium max-w-xl">
                 Calculate the exact Lot Size for MetaTrader 5 or TradeLocker execution. 
                 Ensure your <strong>Contract Size</strong> matches your broker specifications.
             </p>
         </div>
         {activePreset && (
             <div className="hidden md:block bg-blue-50 border border-blue-100 p-4 rounded-xl max-w-xs">
                 <div className="flex items-center gap-2 text-brand-blue font-bold mb-1">
                     <Info size={16} />
                     Contract Spec:
                 </div>
                 <p className="text-sm text-slate-600">{activePreset.note}</p>
                 <p className="text-xs text-slate-400 mt-2">Default: {activePreset.multiplier.toLocaleString()} units</p>
             </div>
         )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Input Panel */}
          <div className="lg:col-span-7 space-y-6">
              
              {/* Account & Risk Section */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Settings size={18} className="text-slate-400" />
                      Account & Risk
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Account Balance</label>
                          <div className="relative">
                              <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                              <input 
                                  type="number" 
                                  value={accountBalance}
                                  onChange={(e) => setAccountBalance(parseFloat(e.target.value) || 0)}
                                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                              />
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Risk per Trade</label>
                          <div className="flex gap-2">
                              <div className="relative flex-1">
                                  <input 
                                      type="number" 
                                      value={riskValue}
                                      onChange={(e) => setRiskValue(parseFloat(e.target.value) || 0)}
                                      className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                                  />
                              </div>
                              <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
                                  <button 
                                      onClick={() => setRiskType('PERCENT')}
                                      className={`px-3 rounded-lg font-bold text-sm transition-all ${riskType === 'PERCENT' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-500'}`}
                                  >
                                      %
                                  </button>
                                  <button 
                                      onClick={() => setRiskType('FIXED')}
                                      className={`px-3 rounded-lg font-bold text-sm transition-all ${riskType === 'FIXED' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-500'}`}
                                  >
                                      $
                                  </button>
                              </div>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 font-medium text-right">
                              Risking: <span className="text-brand-red font-bold">${riskAmount.toLocaleString()}</span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Instrument Selection */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Target size={18} className="text-slate-400" />
                      Instrument Specification
                  </h3>
                  
                  <div className="mb-6">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Preset Instrument</label>
                      <div className="relative">
                          <select 
                              value={selectedPresetId}
                              onChange={(e) => handlePresetChange(e.target.value)}
                              className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                          >
                              {INSTRUMENT_PRESETS.map(preset => (
                                  <option key={preset.id} value={preset.id}>{preset.name}</option>
                              ))}
                          </select>
                          <ChevronDown size={18} className="absolute right-4 top-3 text-slate-400 pointer-events-none" />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block flex items-center gap-1">
                              Contract Size
                              <Info size={12} className="text-slate-400 cursor-help" title="Units per 1 Lot. E.g. 100,000 for Standard Forex." />
                          </label>
                          <input 
                              type="number" 
                              value={multiplier}
                              onChange={(e) => {
                                  setMultiplier(parseFloat(e.target.value) || 0);
                                  setSelectedPresetId('custom');
                              }}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block flex items-center gap-1">
                              Exchange Rate (Optional)
                              <Info size={12} className="text-slate-400 cursor-help" title="Price of the pair. Required if Quote Currency != Account Currency (e.g. trading USDJPY with USD account)." />
                          </label>
                          <input 
                              type="number" 
                              value={exchangeRate}
                              onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                              placeholder="1.00"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                          />
                          {exchangeRate !== 1 && (
                              <div className="text-[10px] text-slate-400 mt-1 text-right">Adjusting for Quote Currency</div>
                          )}
                      </div>
                  </div>
              </div>

              {/* Trade Details Section */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Crosshair size={18} className="text-slate-400" />
                      Trade Parameters
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Entry Price</label>
                          <input 
                              type="number" 
                              value={entryPrice}
                              onChange={(e) => setEntryPrice(parseFloat(e.target.value) || '')}
                              placeholder="0.00"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Stop Loss</label>
                          <input 
                              type="number" 
                              value={stopLoss}
                              onChange={(e) => setStopLoss(parseFloat(e.target.value) || '')}
                              placeholder="0.00"
                              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                                  entry && stop && (isLong ? stop >= entry : stop <= entry) 
                                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                  : 'border-slate-200 focus:border-brand-blue focus:ring-brand-blue/20'
                              }`}
                          />
                          {entry && stop && (isLong ? stop >= entry : stop <= entry) ? (
                              <div className="text-xs text-brand-red mt-1 font-bold flex items-center gap-1">
                                  <AlertCircle size={10} /> Invalid Stop: Must be {isLong ? 'below' : 'above'} Entry
                              </div>
                          ) : null}
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block flex items-center gap-1">
                              Take Profit <span className="text-slate-300 font-normal normal-case">(Optional)</span>
                          </label>
                          <input 
                              type="number" 
                              value={targetPrice}
                              onChange={(e) => setTargetPrice(parseFloat(e.target.value) || '')}
                              placeholder="0.00"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block flex items-center gap-1">
                              Slippage (Points) <span className="text-slate-300 font-normal normal-case">(Optional)</span>
                              <Info size={12} className="text-slate-400 cursor-help" title="Added to Stop Distance for safer risk sizing" />
                          </label>
                          <input 
                              type="number" 
                              value={slippage}
                              onChange={(e) => setSlippage(parseFloat(e.target.value) || '')}
                              placeholder="0.00"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                          />
                      </div>
                  </div>
              </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                      <Calculator size={120} />
                  </div>
                  
                  <div className="relative z-10">
                      <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">MT5 Lot Size</h3>
                      <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-6xl font-extrabold tracking-tight">
                              {quantityFormatted}
                          </span>
                          <span className="text-xl text-slate-400 font-bold">
                              Lots
                          </span>
                      </div>
                      
                      {/* Detailed Breakdown */}
                      <div className="mt-4 space-y-2">
                           <div className="flex justify-between text-sm">
                               <span className="text-slate-400">Raw Stop Distance:</span>
                               <span className="font-mono font-bold">{rawStopDistance > 0 ? rawStopDistance.toFixed(5) : '0'}</span>
                           </div>
                           {slip > 0 && (
                               <div className="flex justify-between text-sm text-yellow-500/80">
                                   <span>+ Slippage Padding:</span>
                                   <span className="font-mono font-bold">{slip.toFixed(5)}</span>
                               </div>
                           )}
                           <div className="flex justify-between text-sm border-t border-white/10 pt-2 mt-1">
                               <span className="text-slate-300 font-bold">Effective Stop:</span>
                               <span className="font-mono font-bold text-white">{stopDistance > 0 ? stopDistance.toFixed(5) : '0'}</span>
                           </div>
                           <div className="flex justify-between text-sm pt-1">
                               <span className="text-slate-400">Notional Value:</span>
                               <span className="font-mono font-bold">${notionalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                           </div>
                      </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/10 space-y-4 relative z-10">
                      <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-slate-300 font-medium">
                              <TrendingDown size={18} className="text-brand-red" />
                              Max Loss
                          </div>
                          <div className="text-xl font-bold text-brand-red font-mono">
                              -${riskAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                      </div>

                      <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-slate-300 font-medium">
                              <TrendingUp size={18} className="text-emerald-500" />
                              Profit Potential
                          </div>
                          <div className={`text-xl font-bold font-mono ${target > 0 ? 'text-emerald-500' : 'text-slate-600'}`}>
                              {target > 0 ? `+$${rewardAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '---'}
                          </div>
                      </div>
                  </div>
              </div>

              {/* R-Multiple Card */}
              <div className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-sm transition-all ${target > 0 && parseFloat(rMultiple) >= 2 ? 'ring-2 ring-emerald-500/20' : ''}`}>
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <h4 className="font-bold text-slate-800">Risk / Reward Ratio</h4>
                          <p className="text-xs text-slate-500">Based on SL and TP</p>
                      </div>
                      <div className={`px-3 py-1 rounded-lg font-bold text-sm ${parseFloat(rMultiple) >= 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {rMultiple}R
                      </div>
                  </div>
                  
                  {stopDistance > 0 && (
                       <div className="flex items-center text-sm gap-2">
                           <div className="flex-1 bg-red-50 rounded px-3 py-2 border border-red-100 text-center">
                               <div className="text-xs text-red-500 font-bold uppercase">Risk</div>
                               <div className="font-bold text-slate-900">{stopDistance.toFixed(4)} pts</div>
                           </div>
                           <ArrowRight size={16} className="text-slate-300" />
                           <div className="flex-1 bg-emerald-50 rounded px-3 py-2 border border-emerald-100 text-center">
                               <div className="text-xs text-emerald-500 font-bold uppercase">Reward</div>
                               <div className="font-bold text-slate-900">{targetDistance > 0 ? targetDistance.toFixed(4) : '-'} pts</div>
                           </div>
                       </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default PositionSizeCalculator;
