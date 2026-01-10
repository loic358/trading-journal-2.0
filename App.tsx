
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

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

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
    // We need to save these to Supabase one by one or via bulk insert if we added that to service
    // For now, let's just do optimistic UI update and background save loop
    setLoading(true);
    try {
      // In a real app, use supabase.from('trades').insert([array])
      // We will loop through for simplicity with current service structure or basic insert
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Clean trades for DB insertion (remove temp IDs)
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
      
      await loadTrades(); // Refresh from server to get real IDs
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

  // Demo Mode Fallback
  const handleDemoLogin = () => {
      // Create a fake user state without Supabase session for Demo
      setUser({ id: 'demo', name: 'Demo Trader', email: 'demo@tradepulse.ai' });
      setTrades(MOCK_TRADES);
  };

  // If not logged in, show the Landing Page with Login
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

  return (
    <div className="antialiased">
      <div className="flex min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 font-sans selection:bg-brand-blue/30 transition-colors duration-200">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Main Content Area */}
        <main className="ml-64 flex-1 h-screen overflow-y-auto scroll-smooth">
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
