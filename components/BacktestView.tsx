
import React, { useState, useEffect, useRef } from 'react';
import { MOCK_BACKTEST_SESSIONS } from '../constants';
import { BacktestSession, Trade, TradeType, TradeStatus } from '../types';
import { Plus, Play, ChevronLeft, Save, TrendingUp, Target, Activity, Calendar, Clock, ArrowRight, Trash2, BarChart2, CheckSquare, Square, X } from 'lucide-react';

const COMMON_SYMBOLS = [
    { value: 'FX:EURUSD', label: 'EUR/USD' },
    { value: 'FX:GBPUSD', label: 'GBP/USD' },
    { value: 'FX:USDJPY', label: 'USD/JPY' },
    { value: 'COINBASE:BTCUSD', label: 'Bitcoin' },
    { value: 'COINBASE:ETHUSD', label: 'Ethereum' },
    { value: 'NASDAQ:AAPL', label: 'Apple' },
    { value: 'NASDAQ:TSLA', label: 'Tesla' },
    { value: 'AMEX:SPY', label: 'S&P 500 ETF' },
    { value: 'NASDAQ:QQQ', label: 'Nasdaq 100 ETF' },
];

// --- Chart Component ---
const TradingViewChart = ({ symbol }: { symbol: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": symbol,
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": "light",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com",
      "hide_side_toolbar": false
    });
    
    if (containerRef.current) {
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(script);
    }
  }, [symbol]);

  return (
    <div className="tradingview-widget-container h-full w-full bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-0" ref={containerRef}>
      <div className="tradingview-widget-container__widget h-full w-full"></div>
    </div>
  );
};

const BacktestView: React.FC = () => {
  const [sessions, setSessions] = useState<BacktestSession[]>(() => {
    try {
        const saved = localStorage.getItem('backtest_sessions');
        return saved ? JSON.parse(saved) : MOCK_BACKTEST_SESSIONS;
    } catch (e) {
        console.error("Failed to parse sessions from local storage", e);
        return MOCK_BACKTEST_SESSIONS;
    }
  });
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // New Session State
  const [newSessionForm, setNewSessionForm] = useState({
      name: '',
      symbol: 'FX:EURUSD',
      strategy: '',
      balance: 100000
  });

  // Persist sessions to localStorage whenever they change
  useEffect(() => {
      localStorage.setItem('backtest_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // New Trade Form State
  const [tradeForm, setTradeForm] = useState({
    symbol: '',
    type: TradeType.LONG,
    setup: '',
    rMultiple: 0,
    status: TradeStatus.WIN,
    notes: ''
  });

  // Derived State
  const activeSession = sessions.find(s => s.id === activeSessionId);
  
  // Sync trade symbol with session symbol when session activates
  useEffect(() => {
      if (activeSession) {
          // Extract nice name from symbol (e.g. FX:EURUSD -> EURUSD)
          const simpleSymbol = activeSession.symbol.split(':')[1] || activeSession.symbol;
          setTradeForm(prev => ({ ...prev, symbol: simpleSymbol }));
      }
  }, [activeSession?.id]);

  const calculateSessionStats = (trades: Trade[]) => {
      const wins = trades.filter(t => t.status === TradeStatus.WIN).length;
      const total = trades.length;
      const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';
      const totalR = trades.reduce((acc, t) => acc + t.rMultiple, 0).toFixed(1);
      
      const grossProfit = trades.filter(t => t.pnl > 0).reduce((a,b) => a+b.pnl, 0);
      const grossLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((a,b) => a+b.pnl, 0));
      const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? '∞' : '0.00') : (grossProfit / grossLoss).toFixed(2);
      
      const netPnl = trades.reduce((acc, t) => acc + t.pnl, 0);

      return { winRate, totalR, profitFactor, totalTrades: total, netPnl };
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const newSession: BacktestSession = {
      id: `bt_${Date.now()}`,
      name: newSessionForm.name || `Session ${new Date().toLocaleDateString()}`,
      symbol: newSessionForm.symbol,
      strategy: newSessionForm.strategy || 'Manual Backtest',
      startDate: new Date().toISOString().split('T')[0],
      initialBalance: newSessionForm.balance,
      trades: []
    };
    setSessions([...sessions, newSession]);
    setActiveSessionId(newSession.id);
    setIsCreating(false);
    // Reset form
    setNewSessionForm({ name: '', symbol: 'FX:EURUSD', strategy: '', balance: 100000 });
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (window.confirm("Are you sure you want to delete this backtest session? This action cannot be undone.")) {
          setSessions(prev => prev.filter(s => s.id !== id));
          if (activeSessionId === id) setActiveSessionId(null);
          setSelectedSessionIds(prev => prev.filter(sid => sid !== id));
      }
  };

  const handleAddTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    // Simulate basic PnL based on R multiple (Mock: 1R = 1% of balance or fixed amount)
    // Let's assume 1R = 1% of current balance for simplicity in this view, or simpler $100 per R if undefined.
    const pnl = tradeForm.rMultiple * (activeSession.initialBalance * 0.01); 

    const newTrade: Trade = {
      id: `bt_trade_${Date.now()}`,
      symbol: tradeForm.symbol || 'TEST',
      entryDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      exitDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: tradeForm.type,
      setup: tradeForm.setup || 'Backtest Setup',
      entryPrice: 0,
      exitPrice: 0,
      quantity: 1,
      pnl: pnl,
      rMultiple: tradeForm.rMultiple,
      status: tradeForm.rMultiple > 0 ? TradeStatus.WIN : (tradeForm.rMultiple < 0 ? TradeStatus.LOSS : TradeStatus.BE),
      notes: tradeForm.notes,
      mistakes: []
    };

    const updatedSession = {
      ...activeSession,
      trades: [newTrade, ...activeSession.trades]
    };

    setSessions(sessions.map(s => s.id === activeSession.id ? updatedSession : s));
    
    // Reset form mostly, keep symbol/setup for speed
    setTradeForm(prev => ({ ...prev, rMultiple: 0, status: TradeStatus.WIN, notes: '' }));
  };

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedSessionIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  // --- Render Create Modal ---
  if (isCreating) {
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCreating(false)}></div>
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-900 text-lg">Create New Session</h3>
                      <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={20} />
                      </button>
                  </div>
                  <form onSubmit={handleCreateSession} className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Session Name</label>
                          <input 
                              type="text" 
                              required
                              value={newSessionForm.name}
                              onChange={e => setNewSessionForm({...newSessionForm, name: e.target.value})}
                              placeholder="e.g. EURUSD Support/Resistance"
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Chart Symbol</label>
                          <div className="relative">
                              <select 
                                  value={newSessionForm.symbol}
                                  onChange={e => setNewSessionForm({...newSessionForm, symbol: e.target.value})}
                                  className="w-full px-4 py-2 appearance-none bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue"
                              >
                                  {COMMON_SYMBOLS.map(s => (
                                      <option key={s.value} value={s.value}>{s.label} ({s.value})</option>
                                  ))}
                              </select>
                              <div className="absolute right-4 top-3 pointer-events-none text-slate-400">
                                  <ArrowRight size={14} className="rotate-90" />
                              </div>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Strategy</label>
                              <input 
                                  type="text" 
                                  required
                                  value={newSessionForm.strategy}
                                  onChange={e => setNewSessionForm({...newSessionForm, strategy: e.target.value})}
                                  placeholder="e.g. Breakout"
                                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Starting Balance</label>
                              <input 
                                  type="number" 
                                  required
                                  value={newSessionForm.balance}
                                  onChange={e => setNewSessionForm({...newSessionForm, balance: parseFloat(e.target.value)})}
                                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue"
                              />
                          </div>
                      </div>
                      <button 
                          type="submit" 
                          className="w-full py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-blue-600 transition-colors mt-2"
                      >
                          Start Backtesting
                      </button>
                  </form>
              </div>
          </div>
      );
  }

  // --- Render Comparison View ---
  if (showComparison) {
      const selectedSessions = sessions.filter(s => selectedSessionIds.includes(s.id));

      return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col animate-fade-in text-slate-900">
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setShowComparison(false)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900">Session Comparison</h2>
                        <p className="text-slate-500 font-medium">Comparing {selectedSessions.length} strategies side-by-side</p>
                    </div>
                </div>
                <button 
                  onClick={() => setShowComparison(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Close Comparison
                </button>
             </div>

             <div className="overflow-x-auto pb-4">
                 <div className="min-w-max">
                     <div className="grid gap-6" style={{ gridTemplateColumns: `200px repeat(${selectedSessions.length}, minmax(280px, 1fr))` }}>
                         
                         {/* Labels Column */}
                         <div className="space-y-6 pt-24">
                             <div className="h-px bg-slate-100 my-4"></div>
                             <div className="text-sm font-bold text-slate-400 uppercase tracking-wider h-8 flex items-center">Total Trades</div>
                             <div className="text-sm font-bold text-slate-400 uppercase tracking-wider h-8 flex items-center">Win Rate</div>
                             <div className="text-sm font-bold text-slate-400 uppercase tracking-wider h-8 flex items-center">Total R-Multiple</div>
                             <div className="text-sm font-bold text-slate-400 uppercase tracking-wider h-8 flex items-center">Profit Factor</div>
                             <div className="text-sm font-bold text-slate-400 uppercase tracking-wider h-8 flex items-center">Net P&L (Sim)</div>
                             <div className="h-px bg-slate-100 my-4"></div>
                         </div>

                         {/* Session Columns */}
                         {selectedSessions.map(session => {
                             const stats = calculateSessionStats(session.trades);
                             const isWinRateHigh = parseFloat(stats.winRate) >= 50;
                             const isRPositive = parseFloat(stats.totalR) > 0;

                             return (
                                 <div key={session.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                     <div className="h-20 mb-4">
                                         <h3 className="text-xl font-bold text-slate-900 line-clamp-2 mb-1">{session.name}</h3>
                                         <p className="text-sm text-slate-500 font-medium">{session.strategy}</p>
                                     </div>
                                     
                                     <div className="h-px bg-slate-100 my-4"></div>
                                     
                                     <div className="space-y-6">
                                         <div className="h-8 flex items-center font-mono font-bold text-xl text-slate-700">{stats.totalTrades}</div>
                                         <div className={`h-8 flex items-center font-mono font-bold text-xl ${isWinRateHigh ? 'text-emerald-500' : 'text-slate-700'}`}>
                                             {stats.winRate}%
                                         </div>
                                         <div className={`h-8 flex items-center font-mono font-bold text-xl ${isRPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                             {isRPositive ? '+' : ''}{stats.totalR}R
                                         </div>
                                         <div className="h-8 flex items-center font-mono font-bold text-xl text-slate-700">{stats.profitFactor}</div>
                                         <div className={`h-8 flex items-center font-mono font-bold text-xl ${stats.netPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                             {stats.netPnl >= 0 ? '+' : ''}${stats.netPnl.toLocaleString()}
                                         </div>
                                     </div>

                                     <div className="h-px bg-slate-100 my-4"></div>
                                     
                                     <button 
                                         onClick={() => { setShowComparison(false); setActiveSessionId(session.id); }}
                                         className="w-full py-2 bg-slate-50 text-slate-600 font-bold rounded-lg hover:bg-slate-100 transition-colors text-sm"
                                     >
                                         View Details
                                     </button>
                                 </div>
                             );
                         })}
                     </div>
                 </div>
             </div>
        </div>
      );
  }

  // --- Render Overview Mode ---
  if (!activeSessionId) {
    return (
      <div className="p-8 max-w-6xl mx-auto h-full flex flex-col animate-fade-in text-slate-900">
         <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Backtesting</h2>
              <p className="text-slate-500 font-medium">Test strategies and build intuition without risking capital.</p>
            </div>
            <div className="flex gap-3">
                {selectedSessionIds.length > 1 && (
                    <button 
                      onClick={() => setShowComparison(true)}
                      className="px-5 py-2.5 bg-white border border-brand-blue text-brand-blue font-bold rounded-xl shadow-sm hover:bg-blue-50 transition-all flex items-center gap-2 animate-fade-in"
                    >
                      <BarChart2 size={20} /> Compare ({selectedSessionIds.length})
                    </button>
                )}
                {selectedSessionIds.length > 0 && (
                    <button 
                      onClick={() => setSelectedSessionIds([])}
                      className="px-3 py-2.5 text-slate-400 hover:text-slate-600 transition-all"
                    >
                        Clear
                    </button>
                )}
                <button 
                  onClick={() => setIsCreating(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                >
                  <Plus size={20} /> New Session
                </button>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map(session => {
              const stats = calculateSessionStats(session.trades);
              const isSelected = selectedSessionIds.includes(session.id);
              return (
                <div 
                  key={session.id} 
                  onClick={() => setActiveSessionId(session.id)}
                  className={`
                    relative bg-white border rounded-2xl p-6 transition-all cursor-pointer group flex flex-col h-full
                    ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md bg-indigo-50/10' : 'border-slate-200 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10'}
                  `}
                >
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                      <div 
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Session"
                      >
                          <Trash2 size={18} />
                      </div>
                      <div onClick={(e) => toggleSelection(e, session.id)}>
                        {isSelected ? (
                            <div className="bg-indigo-600 text-white rounded-md p-1 shadow-sm transition-transform hover:scale-110">
                                <CheckSquare size={18} />
                            </div>
                        ) : (
                            <div className="text-slate-300 hover:text-indigo-400 transition-colors">
                                <Square size={22} />
                            </div>
                        )}
                      </div>
                  </div>

                  <div className="flex justify-between items-start mb-4">
                     <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                        <Play size={20} fill="currentColor" className="opacity-80" />
                     </div>
                     <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">{session.symbol.split(':')[1] || session.symbol}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1 pr-8">{session.name}</h3>
                  <p className="text-sm text-slate-500 font-medium mb-6">{session.strategy}</p>

                  <div className="mt-auto grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                      <div>
                          <div className="text-xs text-slate-400 uppercase font-bold">Win Rate</div>
                          <div className={`font-bold font-mono text-lg ${parseFloat(stats.winRate) > 50 ? 'text-emerald-500' : 'text-slate-700'}`}>
                             {stats.winRate}%
                          </div>
                      </div>
                      <div>
                          <div className="text-xs text-slate-400 uppercase font-bold">Total R</div>
                          <div className={`font-bold font-mono text-lg ${parseFloat(stats.totalR) > 0 ? 'text-emerald-500' : 'text-slate-700'}`}>
                             {parseFloat(stats.totalR) > 0 ? '+' : ''}{stats.totalR}
                          </div>
                      </div>
                      <div className="text-right">
                           <div className="text-xs text-slate-400 uppercase font-bold">Trades</div>
                           <div className="font-bold text-slate-900 text-lg">{stats.totalTrades}</div>
                      </div>
                  </div>
                </div>
              )
            })}
         </div>
      </div>
    );
  }

  // --- Render Active Session Mode ---
  const sessionStats = calculateSessionStats(activeSession.trades);

  return (
    <div className="h-full flex flex-col animate-fade-in text-slate-900 overflow-hidden bg-white">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0 bg-white z-20 shadow-sm">
             <div className="flex items-center gap-4">
                 <button 
                    onClick={() => setActiveSessionId(null)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                 >
                    <ChevronLeft size={24} />
                 </button>
                 <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                       {activeSession.name}
                       <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wider">Simulating {activeSession.symbol}</span>
                    </h2>
                 </div>
             </div>
             <div className="flex gap-4">
                 <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl flex items-center gap-3">
                     <div className="text-right">
                         <div className="text-[10px] uppercase font-bold text-slate-400">Win Rate</div>
                         <div className="font-bold font-mono text-emerald-500 text-sm">{sessionStats.winRate}%</div>
                     </div>
                     <div className="w-px h-8 bg-slate-200"></div>
                     <div className="text-right">
                         <div className="text-[10px] uppercase font-bold text-slate-400">Total R</div>
                         <div className="font-bold font-mono text-emerald-500 text-sm">{parseFloat(sessionStats.totalR) > 0 ? '+' : ''}{sessionStats.totalR}R</div>
                     </div>
                     <div className="w-px h-8 bg-slate-200"></div>
                     <div className="text-right">
                         <div className="text-[10px] uppercase font-bold text-slate-400">Net P&L</div>
                         <div className={`font-bold font-mono text-sm ${sessionStats.netPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {sessionStats.netPnl >= 0 ? '+' : ''}${sessionStats.netPnl.toLocaleString()}
                         </div>
                     </div>
                 </div>
             </div>
        </div>

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            
            {/* Top: Chart Area */}
            <div className="h-[60%] w-full bg-slate-50 p-4 pb-0">
                <TradingViewChart symbol={activeSession.symbol} />
            </div>

            {/* Bottom: Logs & Controls */}
            <div className="flex-1 flex min-h-0 border-t border-slate-200 bg-white">
                
                {/* Left: Input Panel */}
                <div className="w-80 shrink-0 border-r border-slate-200 p-4 overflow-y-auto">
                     <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                        <Target size={16} className="text-indigo-600" />
                        Quick Log
                     </h3>
                     <form onSubmit={handleAddTrade} className="space-y-3">
                         <div className="grid grid-cols-2 gap-3">
                             <div>
                                 <label className="text-[10px] font-bold text-slate-500 uppercase">Direction</label>
                                 <div className="flex mt-1 bg-slate-100 rounded-lg p-1">
                                     <button
                                        type="button" 
                                        onClick={() => setTradeForm({...tradeForm, type: TradeType.LONG})}
                                        className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${tradeForm.type === TradeType.LONG ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                                     >
                                        Long
                                     </button>
                                     <button
                                        type="button" 
                                        onClick={() => setTradeForm({...tradeForm, type: TradeType.SHORT})}
                                        className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${tradeForm.type === TradeType.SHORT ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
                                     >
                                        Short
                                     </button>
                                 </div>
                             </div>
                             <div>
                                 <label className="text-[10px] font-bold text-slate-500 uppercase">Outcome (R)</label>
                                 <input 
                                    type="number" 
                                    step="0.1"
                                    value={tradeForm.rMultiple}
                                    onChange={e => setTradeForm({...tradeForm, rMultiple: parseFloat(e.target.value)})}
                                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                                    placeholder="2.0"
                                 />
                             </div>
                         </div>

                         <div>
                             <label className="text-[10px] font-bold text-slate-500 uppercase">Setup / Strategy</label>
                             <input 
                                type="text" 
                                value={tradeForm.setup}
                                onChange={e => setTradeForm({...tradeForm, setup: e.target.value})}
                                className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                                placeholder="e.g. S/R Flip"
                             />
                         </div>

                         <div>
                             <label className="text-[10px] font-bold text-slate-500 uppercase">Notes</label>
                             <input 
                                value={tradeForm.notes}
                                onChange={e => setTradeForm({...tradeForm, notes: e.target.value})}
                                className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                                placeholder="Observation..."
                             />
                         </div>

                         <button 
                            type="submit"
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-sm"
                         >
                            <Save size={14} /> Log Trade
                         </button>
                     </form>
                </div>

                {/* Right: Trade List */}
                <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
                    <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-white">
                        <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wide">History</h3>
                        <span className="text-[10px] font-bold text-slate-400">{activeSession.trades.length} Trades</span>
                    </div>
                    
                    <div className="overflow-y-auto flex-1">
                        {activeSession.trades.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 p-4">
                                <Activity size={32} className="mb-2" />
                                <p className="text-xs">No trades logged yet.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                 <thead className="bg-white sticky top-0 z-10 shadow-sm text-[10px] text-slate-500 uppercase font-semibold">
                                     <tr>
                                         <th className="px-4 py-2">#</th>
                                         <th className="px-4 py-2">Type</th>
                                         <th className="px-4 py-2">Setup</th>
                                         <th className="px-4 py-2">Notes</th>
                                         <th className="px-4 py-2 text-right">Result</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100 text-xs">
                                     {activeSession.trades.map((trade, idx) => (
                                         <tr key={trade.id} className="hover:bg-white transition-colors">
                                             <td className="px-4 py-2 text-slate-400 font-mono">{(activeSession.trades.length - idx).toString().padStart(2, '0')}</td>
                                             <td className="px-4 py-2">
                                                <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${trade.type === 'LONG' ? 'text-blue-600 bg-blue-50' : 'text-orange-600 bg-orange-50'}`}>
                                                    {trade.type}
                                                </span>
                                             </td>
                                             <td className="px-4 py-2 text-slate-600 font-medium">{trade.setup}</td>
                                             <td className="px-4 py-2 text-slate-500 truncate max-w-[200px]">{trade.notes}</td>
                                             <td className="px-4 py-2 text-right">
                                                 <span className={`font-mono font-bold ${trade.rMultiple >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                     {trade.rMultiple > 0 ? '+' : ''}{trade.rMultiple}R
                                                 </span>
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default BacktestView;
