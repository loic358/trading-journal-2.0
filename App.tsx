
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TradeLog from './components/TradeLog';
import AICoach from './components/AICoach';
import Playbook from './components/Playbook';
import CalendarView from './components/CalendarView';
import SettingsView from './components/SettingsView';
import ImportView from './components/ImportView';
import LandingPage from './components/LandingPage';
import ChatBot from './components/ChatBot';
import BacktestView from './components/BacktestView';
import PositionSizeCalculator from './components/PositionSizeCalculator';
import { User, Trade } from './types';
import { MOCK_TRADES } from './constants';
import { LanguageProvider } from './contexts/LanguageContext';
import { supabase } from './services/supabase';
import { tradeService } from './services/tradeService';
import { Menu } from 'lucide-react';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Trader'
        });
        loadTrades();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Trader'
        });
        loadTrades();
      } else {
        setUser(null);
        setTrades([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadTrades = async () => {
    setLoading(true);
    try {
      const data = await tradeService.fetchTrades();
      setTrades(data);
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD Handlers ---

  const handleSaveTrade = async (trade: Partial<Trade>) => {
    try {
      if (trade.id && !trade.id.startsWith('imp_')) {
        // Update existing
        const updated = await tradeService.updateTrade(trade as Trade);
        setTrades(prev => prev.map(t => t.id === updated.id ? updated : t));
      } else {
        // Create new
        const newTrade = await tradeService.createTrade(trade);
        setTrades(prev => [newTrade, ...prev]);
      }
    } catch (error) {
      console.error('Error saving trade:', error);
      alert('Failed to save trade to database.');
    }
  };

  const handleDeleteTrade = async (id: string) => {
    try {
      await tradeService.deleteTrade(id);
      setTrades(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting trade:', error);
      alert('Failed to delete trade.');
    }
  };

  // Bulk Import Handler
  const handleImportTrades = async (newTrades: Trade[]) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dbPayloads = newTrades.map(t => ({
        user_id: user.id,
        symbol: t.symbol,
        entry_date: t.entryDate,
        exit_date: t.exitDate,
        type: t.type,
        setup: t.setup,
        entry_price: t.entryPrice,
        exit_price: t.exitPrice,
        quantity: t.quantity,
        pnl: t.pnl,
        r_multiple: t.rMultiple,
        status: t.status,
        mistakes: t.mistakes || [],
        notes: t.notes || ''
      }));

      const { error } = await supabase.from('trades').insert(dbPayloads);
      if (error) throw error;
      
      await loadTrades(); 
      setActiveTab('log');
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import trades.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleDemoLogin = () => {
      setUser({ id: 'demo', name: 'Demo Trader', email: 'demo@tradepulse.ai' });
      setTrades(MOCK_TRADES);
  };

  if (!user && !loading) {
    return <LandingPage onDemoLogin={handleDemoLogin} />;
  }

  if (loading && !user) {
      return (
          <div className="min-h-screen bg-black flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
          </div>
      );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard trades={trades} />;
      case 'log':
        return <TradeLog trades={trades} onSaveTrade={handleSaveTrade} onDeleteTrade={handleDeleteTrade} />;
      case 'coach':
        return <AICoach trades={trades} />;
      case 'chat':
        return <ChatBot trades={trades} />;
      case 'playbook':
        return <Playbook trades={trades} />;
      case 'calendar':
        return <CalendarView trades={trades} />;
      case 'backtest':
        return <BacktestView />;
      case 'calculator':
        return <PositionSizeCalculator />;
      case 'settings':
        return <SettingsView user={user} onLogout={handleLogout} />;
      case 'import':
        return <ImportView onImport={handleImportTrades} currentTrades={trades} />;
      default:
        return (
            <div className="flex items-center justify-center h-full text-slate-500">
                Component under construction: {activeTab}
            </div>
        );
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsSidebarOpen(false); // Close sidebar on mobile when navigating
  };

  return (
    <div className="antialiased">
      <div className="flex min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 font-sans selection:bg-brand-blue/30 transition-colors duration-200 relative">
        
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-black border-b border-slate-800 z-40 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-brand-blue to-brand-red rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">T</span>
                </div>
                <h1 className="text-lg font-bold text-white tracking-tight">TradePulse</h1>
            </div>
            <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-slate-300 hover:text-white"
            >
                <Menu size={24} />
            </button>
        </div>

        {/* Mobile Overlay Backdrop */}
        {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
                onClick={() => setIsSidebarOpen(false)}
            ></div>
        )}

        {/* Sidebar Container - Responsive */}
        <div className={`
            fixed top-0 left-0 bottom-0 z-50 transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
            md:translate-x-0
        `}>
            <Sidebar 
                activeTab={activeTab} 
                setActiveTab={handleTabChange} 
                onClose={() => setIsSidebarOpen(false)} 
            />
        </div>
        
        {/* Main Content Area */}
        <main className="flex-1 w-full md:ml-64 h-screen overflow-y-auto scroll-smooth pt-16 md:pt-0">
          {/* Top decorative gradient line */}
          <div className="h-1 w-full bg-gradient-to-r from-brand-blue via-purple-500 to-brand-red opacity-80 sticky top-0 z-10"></div>
          
          <div className="max-w-[1600px] mx-auto min-h-full">
              {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
