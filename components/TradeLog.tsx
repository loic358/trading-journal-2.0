
import React, { useState, useEffect, useRef } from 'react';
import { TradeType, TradeStatus, Trade } from '../types';
import { ChevronRight, Filter, Search, X, FileText, CheckCircle, Clock, Calendar, Hash, AlignLeft, AlertCircle, Image as ImageIcon, Upload, Trash2, Edit, Check, Plus, Save, Calculator, RefreshCw, ChevronDown, Zap, TrendingDown, Bold, Italic, Underline, List as ListIcon, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const COMMON_MISTAKES = [
  "FOMO",
  "Impatience",
  "Revenge Trading",
  "Oversizing",
  "Moved Stop Loss",
  "No Plan",
  "Chasing",
  "Early Exit",
  "Hesitation",
  "Counter-trend"
];

const stripHtml = (html: string) => {
   if (!html) return "";
   const tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
};

interface TradeLogProps {
    trades: Trade[];
    onSaveTrade: (trade: Partial<Trade>) => void;
    onDeleteTrade: (id: string) => void;
}

const TradeLog: React.FC<TradeLogProps> = ({ trades, onSaveTrade, onDeleteTrade }) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<TradeStatus | 'ALL'>('ALL');
  const [filterMistake, setFilterMistake] = useState<string | 'ALL'>('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Detail View State
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Trade>>({});
  const [newMistake, setNewMistake] = useState('');
  const [editMultiplier, setEditMultiplier] = useState(1);
  const [autoCalcPnL, setAutoCalcPnL] = useState(false);
  
  const [calcOrderType, setCalcOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [calcSlippage, setCalcSlippage] = useState(0);

  // Sync draft when selection changes (only when ID changes)
  useEffect(() => {
    if (selectedTrade) {
        // Find the most up-to-date version of the selected trade from the trades prop
        const currentVersion = trades.find(t => t.id === selectedTrade.id) || selectedTrade;
        
        const initialNotes = currentVersion.notes || '';
        setNoteDraft(initialNotes);
        if (editorRef.current) {
            editorRef.current.innerHTML = initialNotes;
        }
        setIsSaved(false);
        setIsEditing(false);
        setHasUnsavedChanges(false);
        setEditForm({});
    }
  }, [selectedTrade?.id, trades]);

  // Initialize edit form when entering edit mode
  useEffect(() => {
      if (isEditing && selectedTrade) {
          setEditForm(JSON.parse(JSON.stringify(selectedTrade)));
          setNewMistake('');
          
          // Calculate implied multiplier
          const dir = selectedTrade.type === TradeType.LONG ? 1 : -1;
          const diff = selectedTrade.exitPrice - selectedTrade.entryPrice;
          const rawPnL = diff * dir * selectedTrade.quantity;
          
          let implMult = 1;
          if (Math.abs(rawPnL) > 0.0001) {
              implMult = selectedTrade.pnl / rawPnL;
          } else if (selectedTrade.symbol.includes('ES') || selectedTrade.symbol.includes('NQ')) {
             implMult = selectedTrade.symbol.includes('ES') ? 50 : 20; 
          }

          if (Math.abs(Math.round(implMult) - implMult) < 0.01) {
              implMult = Math.round(implMult);
          } else {
              implMult = parseFloat(implMult.toFixed(4));
          }
          
          setEditMultiplier(implMult);
          setAutoCalcPnL(false);
          setCalcOrderType('LIMIT');
          setCalcSlippage(0);
      }
  }, [isEditing, selectedTrade]);

  const confirmDiscard = () => {
      if (isEditing && hasUnsavedChanges) {
          return window.confirm("You have unsaved changes. Are you sure you want to discard them?");
      }
      return true;
  };

  const handleRowClick = (trade: Trade) => {
      if (selectedTrade?.id === trade.id) return;
      if (confirmDiscard()) {
          setSelectedTrade(trade);
      }
  };

  const handleClosePanel = () => {
      if (confirmDiscard()) {
          setSelectedTrade(null);
      }
  };

  const handleDelete = () => {
      if (selectedTrade && window.confirm("Are you sure you want to delete this trade?")) {
          onDeleteTrade(selectedTrade.id);
          setSelectedTrade(null);
      }
  };

  const handleCancelEdit = () => {
      if (confirmDiscard()) {
          setIsEditing(false);
          setEditForm({});
          setHasUnsavedChanges(false);
          if (selectedTrade) {
              setNoteDraft(selectedTrade.notes || '');
              if (editorRef.current) {
                  editorRef.current.innerHTML = selectedTrade.notes || '';
              }
          }
      }
  };

  const calculateMetrics = (
      currentForm: Partial<Trade>, 
      multiplier: number, 
      orderType: 'LIMIT' | 'MARKET' = calcOrderType, 
      slippage: number = calcSlippage
    ) => {
      const { entryPrice, exitPrice, quantity, type, stopLoss } = currentForm;
      
      if (entryPrice === undefined || exitPrice === undefined || quantity === undefined || !type) return;
      
      const dir = type === TradeType.LONG ? 1 : -1;
      const diff = exitPrice - entryPrice;
      let rawPnL = diff * dir * quantity * multiplier;

      if (orderType === 'MARKET') {
          const slippageCost = Math.abs(slippage) * quantity * multiplier;
          rawPnL -= slippageCost;
      }
      
      let newR = currentForm.rMultiple;

      if (stopLoss !== undefined && stopLoss !== 0 && entryPrice !== stopLoss) {
          const riskPerShare = Math.abs(entryPrice - stopLoss);
          const rewardPerShare = diff * dir;
          newR = parseFloat((rewardPerShare / riskPerShare).toFixed(2));
      }
      
      setEditForm(prev => ({ 
          ...prev, 
          pnl: parseFloat(rawPnL.toFixed(2)),
          rMultiple: newR
      }));
      setHasUnsavedChanges(true);
  };

  const handleFieldChange = (field: keyof Trade, value: any) => {
      const newForm = { ...editForm, [field]: value };
      setEditForm(newForm);
      setHasUnsavedChanges(true);
      
      if (autoCalcPnL && (field === 'entryPrice' || field === 'exitPrice' || field === 'quantity' || field === 'type' || field === 'stopLoss')) {
          calculateMetrics(newForm, editMultiplier, calcOrderType, calcSlippage);
      }
  };

  const handleMultiplierChange = (val: number) => {
      setEditMultiplier(val);
      if (autoCalcPnL) {
          calculateMetrics(editForm, val, calcOrderType, calcSlippage);
      }
  };

  const toggleAutoCalc = () => {
      const newState = !autoCalcPnL;
      setAutoCalcPnL(newState);
      if (newState) {
          calculateMetrics(editForm, editMultiplier, calcOrderType, calcSlippage);
      }
  };

  const handleSaveNote = () => {
      if (!selectedTrade) return;
      
      const updatedTrade = { ...selectedTrade, notes: noteDraft };
      onSaveTrade(updatedTrade);
      
      setSelectedTrade(updatedTrade); // Optimistic update
      setIsSaved(true);
      setHasUnsavedChanges(false);
      
      setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSaveEdit = () => {
      if (!selectedTrade || !editForm) return;

      const updatedTrade = {
          ...selectedTrade,
          ...editForm,
          notes: noteDraft
      } as Trade;

      if (updatedTrade.pnl > 0) updatedTrade.status = TradeStatus.WIN;
      else if (updatedTrade.pnl < 0) updatedTrade.status = TradeStatus.LOSS;
      else updatedTrade.status = TradeStatus.BE;

      onSaveTrade(updatedTrade);
      setSelectedTrade(updatedTrade);
      setIsEditing(false);
      setHasUnsavedChanges(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedTrade) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      
      const updatedTrade = { ...selectedTrade, screenshotUrl: imageUrl };
      onSaveTrade(updatedTrade);
      setSelectedTrade(updatedTrade);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedTrade) return;
    
    const updatedTrade = { ...selectedTrade, screenshotUrl: undefined };
    onSaveTrade(updatedTrade);
    setSelectedTrade(updatedTrade);
  };

  const addMistake = () => {
      if (newMistake && editForm.mistakes) {
          if (!editForm.mistakes.includes(newMistake)) {
            setEditForm({...editForm, mistakes: [...editForm.mistakes, newMistake]});
            setHasUnsavedChanges(true);
          }
          setNewMistake('');
      } else if (newMistake) {
          setEditForm({...editForm, mistakes: [newMistake]});
          setHasUnsavedChanges(true);
          setNewMistake('');
      }
  };
  
  const removeMistake = (mistakeToRemove: string) => {
      if (editForm.mistakes) {
          setEditForm({...editForm, mistakes: editForm.mistakes.filter(m => m !== mistakeToRemove)});
          setHasUnsavedChanges(true);
      }
  };

  const execCommand = (command: string) => {
    document.execCommand(command, false, '');
    if (editorRef.current) {
        editorRef.current.focus();
    }
  };

  const allMistakes = Array.from(new Set(trades.flatMap(t => t.mistakes || []))).sort();

  const filteredTrades = trades.filter(trade => {
    const matchesSearch = 
        trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
        trade.setup.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || trade.status === filterStatus;
    const matchesMistake = filterMistake === 'ALL' || (trade.mistakes && trade.mistakes.includes(filterMistake));

    return matchesSearch && matchesStatus && matchesMistake;
  });

  const getFilterLabel = () => {
      if (filterStatus === 'ALL' && filterMistake === 'ALL') return t('filters');
      if (filterStatus !== 'ALL' && filterMistake !== 'ALL') return `${filterStatus} • ${filterMistake}`;
      if (filterStatus !== 'ALL') return filterStatus;
      if (filterMistake !== 'ALL') return filterMistake;
      return t('filters');
  }

  return (
    <div className="p-4 md:p-8 h-full flex flex-col animate-fade-in text-slate-900 overflow-hidden relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 shrink-0 gap-4">
        <div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">{t('tradeLog')}</h2>
            <p className="text-slate-500 font-medium">{t('logDescription')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative group w-full md:w-auto">
                <Search className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-brand-blue transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder={t('searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-900 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue w-full md:w-64 shadow-sm transition-all"
                />
            </div>
            <div className="relative w-full md:w-auto">
                <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 border rounded-xl text-sm font-semibold shadow-sm transition-all ${
                        isFilterOpen || filterStatus !== 'ALL' || filterMistake !== 'ALL'
                        ? 'bg-brand-blue text-white border-brand-blue'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <Filter size={16} />
                    <span>{getFilterLabel()}</span>
                </button>
                
                {isFilterOpen && (
                    <div className="absolute right-0 mt-2 w-full md:w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-2 animate-fade-in max-h-96 overflow-y-auto">
                        <div className="text-xs font-bold text-slate-400 uppercase px-2 py-1 mb-1">{t('status')}</div>
                        {['ALL', 'WIN', 'LOSS', 'BREAK_EVEN'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status as any)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center ${
                                    filterStatus === status 
                                    ? 'bg-brand-blue/10 text-brand-blue font-bold' 
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {status === 'ALL' ? t('allStatuses') : status}
                                {filterStatus === status && <CheckCircle size={14} />}
                            </button>
                        ))}
                        
                        <div className="border-t border-slate-100 my-2 pt-2">
                            <div className="text-xs font-bold text-slate-400 uppercase px-2 py-1 mb-1">{t('mistakes')}</div>
                            <button
                                onClick={() => setFilterMistake('ALL')}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center ${
                                    filterMistake === 'ALL' 
                                    ? 'bg-brand-blue/10 text-brand-blue font-bold' 
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {t('anyNone')}
                                {filterMistake === 'ALL' && <CheckCircle size={14} />}
                            </button>
                            {allMistakes.map(mistake => (
                                <button
                                    key={mistake}
                                    onClick={() => setFilterMistake(mistake)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center ${
                                        filterMistake === mistake 
                                        ? 'bg-brand-blue/10 text-brand-blue font-bold' 
                                        : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {mistake}
                                    {filterMistake === mistake && <CheckCircle size={14} />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Main Content Area: Split View */}
      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0 relative">
        
        {/* Left: Trade Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col flex-1 min-h-0">
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse relative min-w-[800px]">
                    <thead className="sticky top-0 z-10">
                        <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500 tracking-wider">
                        <th className="px-6 py-4 font-bold">{t('date')}</th>
                        <th className="px-6 py-4 font-bold">{t('symbol')}</th>
                        <th className="px-6 py-4 font-bold">{t('type')}</th>
                        <th className="px-6 py-4 font-bold">{t('setup')}</th>
                        <th className="px-6 py-4 font-bold text-right">{t('price')}</th>
                        <th className="px-6 py-4 font-bold text-right">{t('pnl')}</th>
                        <th className="px-6 py-4 font-bold text-center">{t('rMultiple')}</th>
                        <th className="px-6 py-4 font-bold">{t('status')}</th>
                        <th className="px-6 py-4 font-bold">{t('notes')}</th>
                        <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredTrades.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                                    {t('noTradesFound')}
                                </td>
                            </tr>
                        ) : filteredTrades.map((trade) => (
                        <tr 
                            key={trade.id} 
                            onClick={() => handleRowClick(trade)}
                            className={`
                                transition-colors cursor-pointer group border-l-4
                                ${selectedTrade?.id === trade.id 
                                    ? 'bg-blue-50/50 border-l-brand-blue' 
                                    : 'hover:bg-slate-50 border-l-transparent'}
                            `}
                        >
                            <td className="px-6 py-4 text-slate-600 text-sm font-medium whitespace-nowrap">
                                <div className="flex flex-col">
                                    <span>{trade.entryDate.split(' ')[0]}</span>
                                    <span className="text-xs text-slate-400">{trade.entryDate.split(' ')[1]}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded text-xs tracking-wide border border-slate-200">
                                    {trade.symbol}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`text-xs font-bold px-2 py-1 rounded ${
                                    trade.type === TradeType.LONG 
                                        ? 'bg-blue-50 text-brand-blue border border-blue-100' 
                                        : 'bg-orange-50 text-orange-600 border border-orange-100'
                                }`}>
                                    {trade.type}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600 text-sm font-medium">{trade.setup}</td>
                            <td className="px-6 py-4 text-right text-slate-600 font-mono text-sm">
                                {trade.entryPrice.toFixed(2)}
                            </td>
                            <td className={`px-6 py-4 text-right font-bold font-mono text-sm ${
                                trade.pnl >= 0 ? 'text-emerald-600' : 'text-brand-red'
                            }`}>
                                {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                                    trade.rMultiple >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                }`}>
                                    {trade.rMultiple}R
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                    trade.status === TradeStatus.WIN ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                    trade.status === TradeStatus.LOSS ? 'bg-red-50 border-red-200 text-red-700' :
                                    'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                    {trade.status === TradeStatus.WIN && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
                                    {trade.status === TradeStatus.LOSS && <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>}
                                    {trade.status}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                {trade.notes ? (
                                    <div className="flex items-center gap-1 text-slate-500 max-w-[120px]">
                                        <FileText size={14} className="shrink-0 text-brand-blue" />
                                        <span className="truncate text-xs">{stripHtml(trade.notes)}</span>
                                    </div>
                                ) : (
                                    <span className="text-slate-300 text-xs">-</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <ChevronRight size={18} className={`transition-colors ${selectedTrade?.id === trade.id ? 'text-brand-blue' : 'text-slate-300 group-hover:text-brand-blue'}`} />
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Right: Trade Detail View */}
        {/* On Mobile: Full screen fixed overlay. On Desktop: Side Panel */}
        {selectedTrade && (
            <div className={`
                bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col animate-slide-up overflow-hidden
                fixed inset-0 z-50 w-full h-full md:relative md:w-[420px] md:h-auto md:shrink-0
            `}>
                {/* Panel Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50 shrink-0">
                    <div className="flex-1 mr-4">
                        {isEditing ? (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <input 
                                        type="text"
                                        value={editForm.symbol || ''}
                                        onChange={(e) => handleFieldChange('symbol', e.target.value.toUpperCase())}
                                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm font-bold uppercase"
                                        placeholder="SYMBOL"
                                    />
                                    <select 
                                        value={editForm.type} 
                                        onChange={(e) => handleFieldChange('type', e.target.value as TradeType)}
                                        className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold uppercase"
                                    >
                                        <option value={TradeType.LONG}>LONG</option>
                                        <option value={TradeType.SHORT}>SHORT</option>
                                    </select>
                                </div>
                                <input 
                                    type="text"
                                    value={editForm.entryDate || ''}
                                    onChange={(e) => handleFieldChange('entryDate', e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-600 font-mono"
                                    placeholder="YYYY-MM-DD HH:MM"
                                />
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-2xl font-extrabold text-slate-900">{selectedTrade.symbol}</h3>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                        selectedTrade.type === 'LONG' ? 'bg-blue-100 text-brand-blue' : 'bg-orange-100 text-orange-600'
                                    }`}>
                                        {selectedTrade.type}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                                    <Calendar size={12} />
                                    {selectedTrade.entryDate}
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex gap-2 items-center">
                        {isEditing && hasUnsavedChanges && (
                            <span className="text-xs text-orange-500 font-bold animate-pulse mr-2 hidden sm:block">
                                {t('unsaved')}
                            </span>
                        )}
                        {isEditing ? (
                            <>
                                <button 
                                    onClick={handleCancelEdit}
                                    className="p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
                                    title={t('cancel')}
                                >
                                    <X size={18} />
                                </button>
                                <button 
                                    onClick={handleSaveEdit}
                                    className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm"
                                    title={t('save')}
                                >
                                    <Check size={18} />
                                </button>
                            </>
                        ) : (
                            <>
                                <button 
                                    onClick={() => { setIsEditing(true); }}
                                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-brand-blue hover:border-brand-blue transition-colors shadow-sm"
                                    title={t('edit')}
                                >
                                    <Edit size={18} />
                                </button>
                                <button 
                                    onClick={handleDelete}
                                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-red-400 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm"
                                    title={t('delete')}
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button 
                                    onClick={handleClosePanel}
                                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Performance Card */}
                    <div className={`p-4 rounded-xl border flex items-center justify-between relative overflow-hidden ${
                        (isEditing ? editForm.pnl! >= 0 : selectedTrade.pnl >= 0) 
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-900' 
                            : 'bg-red-50 border-red-100 text-red-900'
                    }`}>
                        {/* Auto-Calc Indicator/Toggle */}
                        {isEditing && (
                            <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
                                <span className="text-[10px] font-bold uppercase text-slate-400">{t('autoCalc')}</span>
                                <button 
                                    onClick={toggleAutoCalc}
                                    className={`w-8 h-4 rounded-full transition-colors relative ${autoCalcPnL ? 'bg-brand-blue' : 'bg-slate-300'}`}
                                    title="Toggle automatic P&L and R calculation based on params"
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${autoCalcPnL ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        )}

                        <div className="flex-1 mr-4">
                            <div className="text-xs uppercase tracking-wider font-bold opacity-70 mb-1 flex items-center gap-1">
                                {t('netPnl')}
                                {isEditing && autoCalcPnL && <RefreshCw size={10} className="animate-spin" />}
                            </div>
                            {isEditing ? (
                                <input 
                                    type="number"
                                    value={editForm.pnl}
                                    onChange={(e) => {
                                        setEditForm({...editForm, pnl: parseFloat(e.target.value)});
                                        setHasUnsavedChanges(true);
                                        // If user manually types PnL, disable auto-calc to respect their input
                                        setAutoCalcPnL(false);
                                    }}
                                    className="w-full bg-white/50 border border-black/10 rounded px-2 py-1 text-2xl font-extrabold font-mono tracking-tight text-inherit placeholder-inherit focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 transition-colors"
                                />
                            ) : (
                                <div className="text-3xl font-extrabold font-mono tracking-tight">
                                    {selectedTrade.pnl >= 0 ? '+' : ''}{selectedTrade.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                </div>
                            )}
                        </div>
                        <div className="text-right pt-4">
                            <div className="text-xs uppercase tracking-wider font-bold opacity-70 mb-1">{t('return')}</div>
                            {isEditing ? (
                                <div className="flex items-center gap-1 justify-end">
                                    <input 
                                        type="number"
                                        step="0.1"
                                        value={editForm.rMultiple}
                                        onChange={(e) => handleFieldChange('rMultiple', parseFloat(e.target.value))}
                                        className="w-20 bg-white/50 border border-black/10 rounded px-2 py-1 text-lg font-bold text-right font-mono"
                                    />
                                    <span className="font-bold">R</span>
                                </div>
                            ) : (
                                <div className={`text-xl font-bold bg-white/50 px-3 py-1 rounded-lg inline-block ${
                                    selectedTrade.pnl >= 0 ? 'text-emerald-700' : 'text-red-700'
                                }`}>
                                    {selectedTrade.rMultiple}R
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                <AlignLeft size={12} /> {t('entryPrice')}
                            </div>
                            {isEditing ? (
                                <input 
                                    type="number"
                                    value={editForm.entryPrice}
                                    onChange={(e) => handleFieldChange('entryPrice', parseFloat(e.target.value))}
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono font-bold text-slate-900 text-sm"
                                />
                            ) : (
                                <div className="font-mono font-bold text-slate-900">{selectedTrade.entryPrice}</div>
                            )}
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                <AlignLeft size={12} /> {t('exitPrice')}
                            </div>
                            {isEditing ? (
                                <input 
                                    type="number"
                                    value={editForm.exitPrice}
                                    onChange={(e) => handleFieldChange('exitPrice', parseFloat(e.target.value))}
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono font-bold text-slate-900 text-sm"
                                />
                            ) : (
                                <div className="font-mono font-bold text-slate-900">{selectedTrade.exitPrice}</div>
                            )}
                        </div>

                        {/* Stop Loss Field */}
                        {(isEditing || selectedTrade.stopLoss) && (
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                    <ShieldAlert size={12} /> {t('stopLoss')}
                                </div>
                                {isEditing ? (
                                    <input 
                                        type="number"
                                        value={editForm.stopLoss || ''}
                                        placeholder="Optional"
                                        onChange={(e) => handleFieldChange('stopLoss', parseFloat(e.target.value))}
                                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono font-bold text-slate-900 text-sm"
                                    />
                                ) : (
                                    <div className="font-mono font-bold text-slate-900">{selectedTrade.stopLoss || '-'}</div>
                                )}
                            </div>
                        )}

                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                <Hash size={12} /> {t('quantity')}
                            </div>
                            {isEditing ? (
                                <input 
                                    type="number"
                                    value={editForm.quantity}
                                    onChange={(e) => handleFieldChange('quantity', parseFloat(e.target.value))}
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono font-bold text-slate-900 text-sm"
                                />
                            ) : (
                                <div className="font-mono font-bold text-slate-900">{selectedTrade.quantity}</div>
                            )}
                        </div>
                        
                        {isEditing && (
                            <>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                        <Calculator size={12} /> {t('multiplier')}
                                    </div>
                                    <input 
                                        type="number"
                                        value={editMultiplier}
                                        onChange={(e) => handleMultiplierChange(parseFloat(e.target.value))}
                                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono font-bold text-slate-900 text-sm"
                                        title="Contract multiplier for P&L calculation"
                                    />
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                        <Zap size={12} /> {t('orderType')}
                                    </div>
                                    <select
                                        value={calcOrderType}
                                        onChange={(e) => {
                                            const val = e.target.value as 'LIMIT' | 'MARKET';
                                            setCalcOrderType(val);
                                            if (autoCalcPnL) calculateMetrics(editForm, editMultiplier, val, calcSlippage);
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm font-bold text-slate-900 focus:outline-none"
                                    >
                                        <option value="LIMIT">Limit</option>
                                        <option value="MARKET">Market</option>
                                    </select>
                                </div>
                                {calcOrderType === 'MARKET' && (
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 animate-fade-in">
                                        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                            <TrendingDown size={12} /> {t('slippage')}
                                        </div>
                                        <input 
                                            type="number"
                                            step="0.01"
                                            value={calcSlippage}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setCalcSlippage(val);
                                                if (autoCalcPnL) calculateMetrics(editForm, editMultiplier, calcOrderType, val);
                                            }}
                                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono font-bold text-slate-900 text-sm"
                                            placeholder="0.00"
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        <div className={`p-3 bg-slate-50 rounded-lg border border-slate-100 ${isEditing && calcOrderType === 'LIMIT' ? 'col-span-2' : ''}`}>
                            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                <Clock size={12} /> {t('setup')}
                            </div>
                            {isEditing ? (
                                <input 
                                    type="text"
                                    value={editForm.setup || ''}
                                    onChange={(e) => handleFieldChange('setup', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-bold text-slate-900 text-sm"
                                />
                            ) : (
                                <div className="font-bold text-slate-900 truncate">{selectedTrade.setup}</div>
                            )}
                        </div>
                    </div>

                    {/* Chart / Screenshot Section */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                            <ImageIcon size={12} /> {t('chartScreenshot')}
                        </label>
                        
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />

                        {selectedTrade.screenshotUrl ? (
                            <div className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                <img 
                                    src={selectedTrade.screenshotUrl} 
                                    alt="Trade Chart" 
                                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500"
                                    onClick={() => window.open(selectedTrade.screenshotUrl, '_blank')}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button 
                                        onClick={() => window.open(selectedTrade.screenshotUrl, '_blank')}
                                        className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-sm transition-colors"
                                        title="View Full Size"
                                    >
                                        <ImageIcon size={16} />
                                    </button>
                                    <button 
                                        onClick={handleRemoveImage}
                                        className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-sm transition-colors"
                                        title="Remove Image"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-brand-blue hover:text-brand-blue hover:bg-blue-50/50 transition-all gap-2"
                            >
                                <Upload size={24} className="opacity-50" />
                                <span className="text-sm font-semibold">{t('uploadImage')}</span>
                            </button>
                        )}
                    </div>

                    {/* Mistakes */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                            <AlertCircle size={12} /> {t('mistakes')}
                        </label>
                        
                        <div className="flex flex-wrap gap-2 mb-2">
                            {(isEditing ? editForm.mistakes : selectedTrade.mistakes)?.map((m, i) => (
                                <span key={i} className="text-xs font-bold bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100 flex items-center gap-1">
                                    {m}
                                    {isEditing && (
                                        <button onClick={() => removeMistake(m)} className="hover:text-red-800">
                                            <X size={12} />
                                        </button>
                                    )}
                                </span>
                            ))}
                        </div>

                        {isEditing && (
                            <div className="flex flex-col gap-2">
                                <select
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            if (!editForm.mistakes?.includes(e.target.value)) {
                                                setEditForm({
                                                    ...editForm, 
                                                    mistakes: [...(editForm.mistakes || []), e.target.value]
                                                });
                                                setHasUnsavedChanges(true);
                                            }
                                            e.target.value = ""; // Reset select
                                        }
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-sm mb-1 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                                >
                                    <option value="">Select a common mistake...</option>
                                    {COMMON_MISTAKES.filter(m => !editForm.mistakes?.includes(m)).map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={newMistake}
                                        onChange={(e) => setNewMistake(e.target.value)}
                                        placeholder="Or type custom mistake..."
                                        className="flex-1 bg-white border border-slate-200 rounded px-3 py-1.5 text-sm"
                                        onKeyDown={(e) => e.key === 'Enter' && addMistake()}
                                    />
                                    <button 
                                        onClick={addMistake}
                                        className="bg-slate-100 text-slate-600 p-2 rounded hover:bg-slate-200"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notes Section - Rich Text */}
                    <div className="flex-1 flex flex-col min-h-[200px]">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                            <FileText size={12} /> {t('tradeNotes')}
                        </label>
                        <div className="flex-1 relative group border border-slate-200 rounded-xl overflow-hidden bg-white shadow-inner focus-within:ring-2 focus-within:ring-brand-blue/20 focus-within:border-brand-blue transition-all">
                            {/* Toolbar */}
                            <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-100 bg-slate-50">
                                <button onClick={() => execCommand('bold')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Bold"><Bold size={14} /></button>
                                <button onClick={() => execCommand('italic')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Italic"><Italic size={14} /></button>
                                <button onClick={() => execCommand('underline')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Underline"><Underline size={14} /></button>
                                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                                <button onClick={() => execCommand('insertUnorderedList')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Bullet List"><ListIcon size={14} /></button>
                            </div>
                            
                            {/* Content Editable Area */}
                            <div 
                                ref={editorRef}
                                contentEditable={true}
                                onInput={(e) => {
                                    setNoteDraft(e.currentTarget.innerHTML);
                                    if(isEditing) setHasUnsavedChanges(true);
                                }}
                                className="w-full h-full min-h-[150px] p-4 text-slate-700 text-sm leading-relaxed focus:outline-none overflow-y-auto [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                                style={{ minHeight: '150px' }}
                            />
                            
                            {!isEditing && (
                                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                    {isSaved && (
                                        <span className="text-xs text-emerald-600 font-bold animate-fade-in flex items-center gap-1 bg-white/80 px-2 py-1 rounded-md shadow-sm backdrop-blur-sm">
                                            <CheckCircle size={12} /> {t('saved')}
                                        </span>
                                    )}
                                    <button 
                                        onClick={handleSaveNote}
                                        className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                    >
                                        <Save size={14} /> {t('saveNote')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default TradeLog;
