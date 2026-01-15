
import React from 'react';
import { LayoutDashboard, BookOpen, BarChart2, Calendar, BrainCircuit, Upload, Settings, MessageSquare, Shield, Calculator, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onClose?: () => void; // Optional prop for closing sidebar on mobile
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onClose }) => {
  const { t } = useLanguage();

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'log', label: t('tradeLog'), icon: BookOpen },
    { id: 'playbook', label: t('playbook'), icon: BarChart2 },
    { id: 'calendar', label: t('calendar'), icon: Calendar },
    { id: 'calculator', label: t('sizeCalc'), icon: Calculator },
    { id: 'backtest', label: t('backtest'), icon: Shield },
    { id: 'coach', label: t('aiCoach'), icon: BrainCircuit },
    { id: 'chat', label: t('assistant'), icon: MessageSquare },
  ];

  const bottomItems = [
    { id: 'import', label: t('importTrades'), icon: Upload },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  return (
    <div className="w-64 h-full bg-black border-r border-slate-900 flex flex-col shadow-2xl md:shadow-none">
      <div className="p-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-brand-blue to-brand-red rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">T</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">TradePulse<span className="text-brand-blue">.ai</span></h1>
        </div>
        {/* Mobile Close Button */}
        <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-brand-blue/10 text-brand-blue font-medium border border-brand-blue/20' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-900 space-y-2">
         {bottomItems.map((item) => {
             const Icon = item.icon;
             const isActive = activeTab === item.id;
             return (
                <button 
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive 
                        ? 'bg-slate-800 text-white font-medium' 
                        : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                    }`}
                >
                    <Icon size={20} />
                    <span>{item.label}</span>
                </button>
             );
         })}
      </div>
    </div>
  );
};

export default Sidebar;
