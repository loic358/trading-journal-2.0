
import React, { useState } from 'react';
import { Upload, FileText, Check, AlertCircle, RefreshCw, CheckCircle, XCircle, Server, Lock, Key, X, AlertTriangle } from 'lucide-react';
import { parseBrokerCSV, ImportResult } from '../services/csvParser';
import { Trade } from '../types';

// Mock Brokers Data for Auto-Sync
const BROKERS = [
  { id: 'nt8', name: 'NinjaTrader 8', type: 'Futures', status: 'connected', lastSync: '10 mins ago', icon: 'N', fields: ['License Key', 'Machine ID'] },
  { id: 'mt4', name: 'MetaTrader 4', type: 'Forex/CFD', status: 'disconnected', icon: 'M', fields: ['Login ID', 'Password', 'Server'] },
  { id: 'mt5', name: 'MetaTrader 5', type: 'Forex/CFD', status: 'disconnected', icon: 'M', fields: ['Login ID', 'Password', 'Server'] },
  { id: 'tv', name: 'TradingView', type: 'Webhooks', status: 'disconnected', icon: 'T', fields: ['Webhook URL', 'Secret Token'] },
  { id: 'ibkr', name: 'Interactive Brokers', type: 'Stocks/Options', status: 'disconnected', icon: 'I', fields: ['Account ID', 'API Key'] },
  { id: 'coin', name: 'Coinbase', type: 'Crypto', status: 'disconnected', icon: 'C', fields: ['API Key', 'API Secret'] },
];

interface ImportViewProps {
    onImport: (newTrades: Trade[]) => void;
    currentTrades: Trade[];
}

const ImportView: React.FC<ImportViewProps> = ({ onImport, currentTrades }) => {
  // Tabs State
  const [activeTab, setActiveTab] = useState<'upload' | 'sync'>('upload');
  
  // Auto-Sync State
  const [brokers, setBrokers] = useState(BROKERS);
  const [activeModal, setActiveModal] = useState<string | null>(null); // Track which broker modal is open
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // CSV Import State
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  // --- CSV Handlers ---
  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
  };

  const handleDragLeave = () => {
      setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          validateAndSetFile(e.dataTransfer.files[0]);
      }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          validateAndSetFile(e.target.files[0]);
      }
  };

  const validateAndSetFile = (uploadedFile: File) => {
      if (uploadedFile.type !== "text/csv" && !uploadedFile.name.endsWith('.csv')) {
          alert("Please upload a valid CSV file.");
          return;
      }
      setFile(uploadedFile);
      setResult(null);
  };

  const processImport = () => {
      if (!file) return;
      setIsProcessing(true);

      const reader = new FileReader();
      reader.onload = (e) => {
          const content = e.target?.result as string;
          setTimeout(() => {
              const importResult = parseBrokerCSV(content);
              setResult(importResult);
              
              if (importResult.success) {
                  // Merge with current trades
                  // In a real app we might check for duplicates by ID or content
                  const merged = [...currentTrades, ...importResult.trades];
                  onImport(merged);
              }
              
              setIsProcessing(false);
          }, 800);
      };
      reader.onerror = () => {
          setIsProcessing(false);
          alert("Error reading file");
      };
      reader.readAsText(file);
  };

  const resetImport = () => {
      setFile(null);
      setResult(null);
  };

  // --- Auto-Sync Handlers ---
  const handleConnectClick = (id: string) => {
      const broker = brokers.find(b => b.id === id);
      if (broker?.status === 'connected') {
          if (confirm(`Disconnect ${broker.name}? This will stop auto-syncing.`)) {
              setBrokers(prev => prev.map(b => b.id === id ? { ...b, status: 'disconnected', lastSync: undefined } : b));
          }
      } else {
          setConnectionError(null);
          setActiveModal(id);
      }
  };

  const submitConnection = (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeModal) return;

      setIsConnecting(true);
      setConnectionError(null);
      
      // Simulate API verification
      setTimeout(() => {
          // Mock Failure Scenario for MetaTrader 5
          if (activeModal === 'mt5') {
              setConnectionError("Connection Failed: Unable to authenticate with the broker server. Please verify your Login ID and Password.");
              setIsConnecting(false);
              setBrokers(prev => prev.map(b => b.id === activeModal ? { ...b, status: 'error' } : b));
          } else {
              setBrokers(prev => prev.map(b => b.id === activeModal ? { ...b, status: 'connected', lastSync: 'Just now' } : b));
              setIsConnecting(false);
              setActiveModal(null);
          }
      }, 1500);
  };

  const getActiveBroker = () => brokers.find(b => b.id === activeModal);

  return (
    <div className="p-8 max-w-5xl mx-auto h-full flex flex-col animate-fade-in text-slate-900 relative">
        <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Import Trades</h2>
            <p className="text-slate-500">Sync your trading history to unlock analytics.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-10">
            <div className="bg-slate-100 p-1 rounded-xl inline-flex">
                <button 
                    onClick={() => setActiveTab('upload')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'upload' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Manual Upload
                </button>
                <button 
                    onClick={() => setActiveTab('sync')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'sync' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <RefreshCw size={14} className={activeTab === 'sync' ? 'animate-spin' : ''} />
                    Auto-Sync
                </button>
            </div>
        </div>

        {/* Content Area */}
        {activeTab === 'upload' ? (
            /* CSV Upload View */
            <div className="animate-fade-in flex flex-col items-center">
                {!result && (
                    <div 
                        className={`
                            w-full max-w-2xl border-3 border-dashed rounded-3xl p-12 text-center transition-all duration-300 relative
                            ${isDragging 
                                ? 'border-brand-blue bg-brand-blue/5 scale-102' 
                                : 'border-slate-300 hover:border-brand-blue hover:bg-slate-50'
                            }
                            ${file ? 'bg-emerald-50/50 border-emerald-500' : 'bg-white'}
                        `}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {!file ? (
                            <>
                                <div className="w-20 h-20 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center mx-auto mb-6 pointer-events-none">
                                    <Upload size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2 pointer-events-none">Drag & Drop your CSV here</h3>
                                <p className="text-slate-500 mb-6 pointer-events-none">Supported: NinjaTrader 8, MetaTrader 4/5, TradingView</p>
                                
                                <input 
                                    type="file" 
                                    accept=".csv"
                                    onChange={handleFileSelect}
                                    className="hidden" 
                                    id="file-upload"
                                />
                                <label 
                                    htmlFor="file-upload"
                                    className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer inline-block"
                                >
                                    Browse Files
                                </label>
                            </>
                        ) : (
                            <div className="animate-fade-in">
                                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FileText size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{file.name}</h3>
                                <p className="text-slate-500 mb-6">{(file.size / 1024).toFixed(2)} KB • Ready to process</p>
                                
                                <div className="flex gap-3 justify-center">
                                    <button 
                                        onClick={resetImport}
                                        disabled={isProcessing}
                                        className="px-6 py-3 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
                                    >
                                        Change File
                                    </button>
                                    <button 
                                        onClick={processImport}
                                        disabled={isProcessing}
                                        className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <RefreshCw className="animate-spin" size={18} />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Check size={18} />
                                                Process Import
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Results View */}
                {result && (
                    <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-lg animate-slide-up">
                        <div className={`p-6 border-b ${result.success ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${result.success ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                    {result.success ? <CheckCircle size={24} /> : <XCircle size={24} />}
                                </div>
                                <div>
                                    <h3 className={`text-xl font-bold ${result.success ? 'text-emerald-900' : 'text-red-900'}`}>
                                        {result.success ? 'Import Successful' : 'Import Failed'}
                                    </h3>
                                    <p className={`${result.success ? 'text-emerald-700' : 'text-red-700'}`}>
                                        Processed {result.summary.totalProcessed} rows • {result.summary.successful} added • {result.summary.failed} skipped
                                    </p>
                                </div>
                                <button 
                                    onClick={resetImport}
                                    className="ml-auto px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-600 font-semibold hover:text-slate-900 text-sm"
                                >
                                    Import Another
                                </button>
                            </div>
                        </div>

                        {/* Error Log */}
                        {result.errors.length > 0 && (
                            <div className="p-6 bg-slate-50 border-b border-slate-200 max-h-40 overflow-y-auto">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Error Log</h4>
                                <ul className="space-y-2">
                                    {result.errors.map((err, i) => (
                                        <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                                            <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                            {err}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Preview Table */}
                        {result.trades.length > 0 && (
                            <div className="p-0">
                                <div className="px-6 py-4 bg-white border-b border-slate-100 flex justify-between items-center">
                                    <h4 className="font-bold text-slate-800">Preview (First 5 Trades)</h4>
                                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                        Total: {result.trades.length}
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                            <tr>
                                                <th className="px-6 py-3 font-semibold">Date</th>
                                                <th className="px-6 py-3 font-semibold">Symbol</th>
                                                <th className="px-6 py-3 font-semibold">Type</th>
                                                <th className="px-6 py-3 font-semibold text-right">P&L</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {result.trades.slice(0, 5).map((t, i) => (
                                                <tr key={i} className="hover:bg-slate-50">
                                                    <td className="px-6 py-3 text-slate-600">{t.entryDate}</td>
                                                    <td className="px-6 py-3 font-bold text-slate-800">{t.symbol}</td>
                                                    <td className="px-6 py-3">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${t.type === 'LONG' ? 'bg-blue-50 text-brand-blue' : 'bg-orange-50 text-orange-600'}`}>
                                                            {t.type}
                                                        </span>
                                                    </td>
                                                    <td className={`px-6 py-3 text-right font-mono font-bold ${t.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {!result && (
                    <div className="mt-8 flex items-start gap-3 p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 max-w-2xl w-full">
                        <AlertCircle className="shrink-0 mt-0.5" size={20} />
                        <div className="text-sm">
                            <p className="font-bold">Privacy Note</p>
                            <p>Your data is processed locally in your browser session. No data is permanently stored on our servers.</p>
                        </div>
                    </div>
                )}
            </div>
        ) : (
            /* Auto Sync View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in relative">
                {brokers.map(broker => (
                    <div 
                        key={broker.id} 
                        className={`
                            border rounded-xl p-5 flex items-center gap-4 transition-all
                            ${broker.status === 'connected' 
                                ? 'bg-white border-brand-blue shadow-sm ring-1 ring-brand-blue/10' 
                                : broker.status === 'error'
                                    ? 'bg-red-50/50 border-red-200'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                            }
                        `}
                    >
                        {/* Icon */}
                        <div className={`
                            w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl
                            ${broker.status === 'connected' 
                                ? 'bg-brand-blue text-white' 
                                : broker.status === 'error'
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-slate-100 text-slate-500'
                            }
                        `}>
                            {broker.status === 'error' ? <AlertTriangle size={24} /> : broker.icon}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1">
                            <h3 className={`font-bold ${broker.status === 'error' ? 'text-red-900' : 'text-slate-900'}`}>{broker.name}</h3>
                            <div className="flex items-center gap-2 text-xs">
                                <span className={broker.status === 'error' ? 'text-red-700' : 'text-slate-500'}>{broker.type}</span>
                                {broker.status === 'connected' && (
                                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        Synced {broker.lastSync}
                                    </span>
                                )}
                                {broker.status === 'error' && (
                                    <span className="text-red-600 font-medium flex items-center gap-1">
                                        Connection Failed
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Action */}
                        <button 
                            onClick={() => handleConnectClick(broker.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                                broker.status === 'connected' 
                                ? 'border-slate-200 text-slate-600 hover:bg-slate-50' 
                                : broker.status === 'error'
                                    ? 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                                    : 'bg-slate-900 text-white border-transparent hover:bg-slate-800'
                            }`}
                        >
                            {broker.status === 'connected' ? 'Manage' : broker.status === 'error' ? 'Retry' : 'Connect'}
                        </button>
                    </div>
                ))}

                {/* Info Card */}
                 <div className="md:col-span-2 mt-4 p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 flex gap-3">
                     <Server size={20} className="shrink-0" />
                     <div className="text-sm">
                         <p className="font-bold">Secure Connection</p>
                         <p>We use read-only API keys to sync your trade history. Your funds are never accessible. Data is encrypted end-to-end.</p>
                     </div>
                 </div>
            </div>
        )}

        {/* Credentials Modal */}
        {activeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-lg flex items-center justify-center font-bold">
                                {getActiveBroker()?.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Connect {getActiveBroker()?.name}</h3>
                                <p className="text-xs text-slate-500">Enter your read-only API credentials</p>
                            </div>
                        </div>
                        <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={submitConnection} className="p-6 space-y-4">
                        {connectionError && (
                            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2 border border-red-100 animate-fade-in">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <span>{connectionError}</span>
                            </div>
                        )}

                        {getActiveBroker()?.fields.map((field, i) => (
                            <div key={i}>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">{field}</label>
                                <div className="relative">
                                    <input 
                                        type={field.toLowerCase().includes('password') || field.toLowerCase().includes('secret') ? "password" : "text"} 
                                        className={`
                                            w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-slate-900 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all
                                        `}
                                        placeholder={`Enter ${field}`}
                                        required
                                        onChange={() => setConnectionError(null)}
                                    />
                                    <div className="absolute left-3 top-2.5 text-slate-400">
                                        {field.toLowerCase().includes('key') ? <Key size={18} /> : <Lock size={18} />}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="pt-2">
                            <button 
                                type="submit"
                                disabled={isConnecting}
                                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isConnecting ? (
                                    <>
                                        <RefreshCw size={18} className="animate-spin" />
                                        Verifying Credentials...
                                    </>
                                ) : (
                                    'Connect Account'
                                )}
                            </button>
                            <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-1">
                                <Lock size={10} />
                                Credentials are encrypted and never stored in plain text.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default ImportView;
