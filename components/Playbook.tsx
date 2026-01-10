
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Trade } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface PlaybookProps {
    trades: Trade[];
}

const Playbook: React.FC<PlaybookProps> = ({ trades }) => {
  const { t } = useLanguage();
  
  // Aggregate data by Setup
  const setupStats: Record<string, { win: number, loss: number, pnl: number }> = {};
  
  trades.forEach(t => {
      const setup = t.setup || 'Unknown';
      if (!setupStats[setup]) setupStats[setup] = { win: 0, loss: 0, pnl: 0 };
      if (t.pnl > 0) setupStats[setup].win++;
      else setupStats[setup].loss++;
      setupStats[setup].pnl += t.pnl;
  });

  const chartData = Object.keys(setupStats).map(key => ({
      name: key,
      pnl: setupStats[key].pnl,
      winRate: (setupStats[key].win + setupStats[key].loss) > 0 
        ? (setupStats[key].win / (setupStats[key].win + setupStats[key].loss)) * 100 
        : 0
  })).sort((a,b) => b.pnl - a.pnl);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl">
          <p className="text-slate-500 text-xs mb-1 font-medium">{label}</p>
          <p className={`font-bold text-lg ${payload[0].value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {payload[0].value >= 0 ? '+' : ''}${payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in text-slate-900">
        <div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">{t('playbookTitle')}</h2>
            <p className="text-slate-500 font-medium">{t('playbookDesc')}</p>
        </div>
        
        {trades.length === 0 ? (
             <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                 <p className="font-medium mb-2">{t('noTradeData')}</p>
                 <p className="text-sm">{t('logTradesToUnlock')}</p>
             </div>
        ) : (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {chartData.map((setup) => (
                        <div key={setup.name} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-brand-blue hover:shadow-md transition-all cursor-pointer group shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-8 rounded-full ${setup.pnl >= 0 ? 'bg-emerald-500' : 'bg-brand-red'}`}></div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg group-hover:text-brand-blue transition-colors">{setup.name}</h3>
                                        <p className="text-xs text-slate-500 font-medium">
                                            {(setupStats[setup.name].win + setupStats[setup.name].loss)} Trades
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-lg font-mono font-bold ${setup.pnl >= 0 ? 'text-emerald-600' : 'text-brand-red'}`}>
                                        {setup.pnl >= 0 ? '+' : ''}${setup.pnl.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-4 mt-6 bg-slate-50 rounded-xl p-3">
                                <div className="text-center flex-1 border-r border-slate-200">
                                    <div className="text-2xl font-bold text-slate-900">{setup.winRate.toFixed(0)}%</div>
                                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{t('winRate')}</div>
                                </div>
                                
                                <div className="text-center flex-1">
                                    <div className="text-2xl font-bold text-slate-900">2.4</div>
                                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{t('expectancy')}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Visual Chart */}
                <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
                    <h3 className="text-slate-900 font-bold mb-6 text-lg">{t('performanceBySetup')}</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={120} 
                                    tick={{fill: '#475569', fontSize: 13, fontWeight: 500}} 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9'}} />
                                <Bar dataKey="pnl" radius={[0, 4, 4, 0]} barSize={30}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#2563EB' : '#DC2626'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </>
        )}
    </div>
  );
};

export default Playbook;
