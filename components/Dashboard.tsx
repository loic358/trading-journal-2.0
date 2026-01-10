
import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import StatsCard from './StatsCard';
import { TrendingUp, Activity, Target, AlertTriangle, Calendar } from 'lucide-react';
import { Trade } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
    trades: Trade[];
}

const Dashboard: React.FC<DashboardProps> = ({ trades }) => {
  const { t } = useLanguage();

  // Compute Stats
  const totalPnL = trades.reduce((acc, t) => acc + t.pnl, 0);
  const winCount = trades.filter(t => t.pnl > 0).length;
  const winRate = trades.length > 0 ? ((winCount / trades.length) * 100).toFixed(1) : '0.0';
  const avgR = trades.length > 0 ? (trades.reduce((acc, t) => acc + t.rMultiple, 0) / trades.length).toFixed(2) : '0.00';
  
  const grossProfit = trades.filter(t => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
  const grossLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0));
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 100 : 0) : parseFloat((grossProfit / grossLoss).toFixed(2));

  // Compute Equity Curve
  const equityCurve = useMemo(() => {
      let balance = 0; // Starting relative balance
      const points = [{ name: 'Start', value: balance }];
      // Sort trades by date
      const sortedTrades = [...trades].sort((a,b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
      
      sortedTrades.forEach((t, i) => {
          balance += t.pnl;
          points.push({ name: `${i+1}`, value: balance });
      });
      return points;
  }, [trades]);

  // Compute Daily Stats for Heatmap
  const dailyStatsMap = useMemo(() => {
      const map: Record<string, { pnl: number, count: number }> = {};
      trades.forEach(t => {
          const date = t.entryDate.split(' ')[0];
          if (!map[date]) map[date] = { pnl: 0, count: 0 };
          map[date].pnl += t.pnl;
          map[date].count += 1;
      });
      return map;
  }, [trades]);

  // Generate last 30 days for heatmap
  const recentDays = Array.from({ length: 28 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (27 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayNum = d.getDate();
      const stat = dailyStatsMap[dateStr];
      return {
          day: dayNum,
          pnl: stat ? stat.pnl : undefined,
          tradeCount: stat ? stat.count : 0
      };
  });

  // Group into weeks of 7 days
  const weeks = [];
  for (let i = 0; i < recentDays.length; i += 7) {
      const weekDays = recentDays.slice(i, i + 7);
      const weeklyPnl = weekDays.reduce((acc, curr) => acc + (curr.pnl || 0), 0);
      weeks.push({
          days: weekDays,
          summary: { pnl: weeklyPnl }
      });
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xl animate-fade-in min-w-[150px]">
          <p className="text-slate-500 text-xs mb-2 font-bold uppercase tracking-wider">Trade #{label}</p>
          <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">{t('cumPnl')}</div>
              <div className={`font-mono font-bold text-lg ${value >= 0 ? 'text-emerald-500' : 'text-brand-red'}`}>
                  {value >= 0 ? '+' : ''}${value.toLocaleString()}
              </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in text-slate-900">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">{t('execDashboard')}</h2>
          <p className="text-slate-500 font-medium">{t('perfOverview')}</p>
        </div>
        <div className="flex gap-3">
             <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 font-semibold shadow-sm flex items-center gap-2 hover:border-brand-blue/30 transition-colors cursor-pointer">
                <Calendar size={16} className="text-brand-blue" />
                {t('allTime')}
             </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title={t('netPnl')}
          value={`$${totalPnL.toLocaleString()}`} 
          isPositive={totalPnL >= 0} 
          icon={<TrendingUp size={40} />}
        />
        <StatsCard 
          title={t('winRate')}
          value={`${winRate}%`} 
          subValue={`${trades.length} Trades`}
          isPositive={parseFloat(winRate) > 50}
          icon={<Target size={40} />}
        />
        <StatsCard 
          title={t('profitFactor')}
          value={profitFactor} 
          isPositive={profitFactor > 1.5}
          icon={<Activity size={40} />}
        />
        <StatsCard 
          title={t('avgR')}
          value={`${avgR}R`} 
          isPositive={parseFloat(avgR) > 0}
          icon={<AlertTriangle size={40} />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Equity Curve */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-8">
            <div>
                <h3 className="text-xl font-extrabold text-slate-900">{t('equityCurve')}</h3>
                <p className="text-sm text-slate-500">{t('cumPnl')}</p>
            </div>
            <div className="flex gap-2">
                 <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                 <span className="text-xs font-bold text-slate-600">{t('realizedPnl')}</span>
            </div>
          </div>
          <div className="h-[400px] w-full">
            {trades.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityCurve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        tick={{fontSize: 10, fontWeight: 600}} 
                        axisLine={false} 
                        tickLine={false} 
                        dy={10}
                        interval="preserveStartEnd"
                    />
                    <YAxis 
                        stroke="#94a3b8" 
                        tick={{fontSize: 12, fontWeight: 600}} 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(val) => `$${val}`} 
                        dx={-10}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                    />
                </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                    {t('noTradesYet')}
                </div>
            )}
          </div>
        </div>

        {/* Mini Calendar / Heatmap */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-xl font-extrabold text-slate-900">{t('last4Weeks')}</h3>
            <p className="text-sm text-slate-500">{t('pnlHeatmap')}</p>
          </div>
          
          <div className="grid grid-cols-8 gap-2 mb-3">
             {['S', 'M', 'T', 'W', 'T', 'F', 'S', 'Tot'].map((d, i) => (
               <div key={i} className={`text-center text-[10px] font-bold uppercase ${i===7 ? 'text-slate-900' : 'text-slate-400'}`}>{d}</div>
             ))}
          </div>

          <div className="grid grid-cols-8 gap-2">
            {weeks.map((week, wIdx) => (
                <React.Fragment key={wIdx}>
                    {week.days.map((day, dIdx) => (
                        <div 
                            key={`${wIdx}-${dIdx}`}
                            className={`
                                aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 cursor-default
                                ${day.pnl !== undefined 
                                    ? (day.pnl > 0 ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200' : (day.pnl < 0 ? 'bg-brand-red text-white shadow-sm shadow-red-200' : 'bg-slate-50 text-slate-300'))
                                    : 'bg-white border border-slate-100 text-slate-200'
                                }
                            `}
                            title={day.pnl ? `$${day.pnl}` : 'No Trade'}
                        >
                            {day.day}
                        </div>
                    ))}
                    {/* Weekly Total Cell */}
                    <div className="aspect-square rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
                        <span className={`text-[8px] font-bold ${week.summary.pnl >= 0 ? 'text-emerald-600' : 'text-brand-red'}`}>
                            {week.summary.pnl >= 0 ? '+' : ''}{Math.abs(week.summary.pnl) >= 1000 ? (Math.abs(week.summary.pnl)/1000).toFixed(1) + 'k' : Math.abs(week.summary.pnl)}
                        </span>
                    </div>
                </React.Fragment>
            ))}
          </div>
          
          <div className="mt-auto pt-6 text-center text-xs text-slate-400">
             {t('recentActivity')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
