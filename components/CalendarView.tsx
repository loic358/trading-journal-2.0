
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Clock, ArrowRight } from 'lucide-react';
import { Trade } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface CalendarViewProps {
    trades: Trade[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ trades }) => {
  const { t } = useLanguage();
  // Initialize with the current real-time date
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Compute Daily Stats dynamically from trades prop
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

  
  // Logic to determine grid structure
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

  // Generate flat array of day cells for the month
  const dayCells = [];
  
  // Add empty placeholders for days before the 1st
  for (let i = 0; i < firstDayOfMonth; i++) {
    dayCells.push(null);
  }
  
  // Add actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    const stat = dailyStatsMap[dateStr];
    dayCells.push({ 
        day: d, 
        date: dateStr, 
        pnl: stat ? stat.pnl : undefined,
        tradeCount: stat ? stat.count : 0
    });
  }

  // Chunk days into weeks for the grid row layout
  const weeks = [];
  let currentWeek = [];
  
  for (let i = 0; i < dayCells.length; i++) {
    currentWeek.push(dayCells[i]);
    
    // If week is full (7 days) or it's the very last element
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  
  // Handle remaining partial week at the end of month
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  // Calculate stats for each week row
  const weeksWithStats = weeks.map(week => {
    const validDays = week.filter(d => d !== null);
    const weeklyPnl = validDays.reduce((acc, curr) => acc + (curr.pnl || 0), 0);
    const weeklyTrades = validDays.reduce((acc, curr) => acc + (curr.tradeCount || 0), 0);
    return {
      days: week,
      summary: { pnl: weeklyPnl, trades: weeklyTrades }
    };
  });

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const jumpToToday = () => {
    setCurrentDate(new Date());
  };

  const formatCompactNumber = (num: number) => {
      const absNum = Math.abs(num);
      if (absNum >= 1000) {
          return (absNum / 1000).toFixed(1) + 'k';
      }
      return absNum.toLocaleString();
  };

  // Modal Helpers
  const getTradesForDate = (dateStr: string) => {
    // Match the YYYY-MM-DD part of the entryDate string
    return trades.filter(t => t.entryDate.startsWith(dateStr));
  };

  const renderDayModal = () => {
    if (!selectedDate) return null;

    const dayTrades = getTradesForDate(selectedDate);
    const totalPnl = dayTrades.reduce((acc, t) => acc + t.pnl, 0);
    
    const displayDate = new Date(selectedDate + 'T12:00:00'); // Safe parse

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedDate(null)}></div>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden animate-slide-up flex flex-col max-h-[80vh]">
                {/* Modal Header */}
                <div className={`p-6 border-b flex justify-between items-start shrink-0 ${totalPnl >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                    <div>
                        <h3 className="text-2xl font-extrabold text-slate-900 mb-1">
                            {displayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </h3>
                        <div className="flex items-center gap-3">
                            <span className={`text-xl font-mono font-bold ${totalPnl >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                {totalPnl >= 0 ? '+' : ''}{totalPnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                            </span>
                            <span className="text-sm font-semibold text-slate-500 bg-white/60 px-2 py-0.5 rounded-lg border border-white/20">
                                {dayTrades.length} Trades
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSelectedDate(null)} 
                        className="p-1 rounded-full bg-white/50 hover:bg-white text-slate-500 transition-colors shadow-sm"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                {/* Trades List */}
                <div className="p-0 overflow-y-auto flex-1">
                    {dayTrades.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <CalendarIcon size={32} className="opacity-50" />
                            </div>
                            <p className="font-medium">No trades recorded for this day.</p>
                            <p className="text-sm text-slate-400 mt-2">Enjoy your day off!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {dayTrades.map(trade => (
                                <div key={trade.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className={`
                                            w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm
                                            ${trade.type === 'LONG' ? 'bg-blue-100 text-brand-blue' : 'bg-orange-100 text-orange-600'}
                                        `}>
                                            {trade.type === 'LONG' ? 'L' : 'S'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900 text-lg">{trade.symbol}</span>
                                                <span className="text-xs text-slate-400 font-mono flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded">
                                                    <Clock size={10} />
                                                    {trade.entryDate.split(' ')[1]}
                                                </span>
                                            </div>
                                            <div className="text-xs font-medium text-slate-500 mt-0.5">{trade.setup}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-mono font-bold text-lg ${trade.pnl >= 0 ? 'text-emerald-600' : 'text-brand-red'}`}>
                                            {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toLocaleString()}
                                        </div>
                                        <div className="text-xs font-bold text-slate-400 bg-slate-50 inline-block px-1.5 py-0.5 rounded mt-1">
                                            {trade.rMultiple}R
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                 <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end items-center text-xs text-slate-500 shrink-0">
                      {dayTrades.length > 0 && (
                          <button className="font-bold text-brand-blue hover:text-brand-dark flex items-center gap-1 transition-colors">
                              View Full Log <ArrowRight size={12} />
                          </button>
                      )}
                 </div>
            </div>
        </div>
    );
  };

  return (
    <div className="p-8 h-full flex flex-col animate-fade-in text-slate-900">
        
        {/* Header Controls */}
        <div className="flex justify-between items-end mb-8">
            <div>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-2">{t('calendarTitle')}</h2>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={prevMonth}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-brand-blue transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <span className="text-xl font-bold text-slate-700 min-w-[180px] text-center select-none">
                        {monthNames[month]} {year}
                    </span>
                    <button 
                        onClick={nextMonth}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-brand-blue transition-colors"
                    >
                        <ChevronRight size={24} />
                    </button>
                    
                    <button 
                        onClick={jumpToToday}
                        className="ml-4 text-xs font-bold text-brand-blue bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                    >
                        <CalendarIcon size={12} />
                        Today
                    </button>
                </div>
            </div>
            
            {/* Monthly Summary */}
            <div className="text-right">
                <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">{t('monthlyNetPnl')}</div>
                <div className={`text-3xl font-extrabold font-mono ${
                    weeksWithStats.reduce((acc, w) => acc + w.summary.pnl, 0) >= 0 
                    ? 'text-emerald-600' 
                    : 'text-brand-red'
                }`}>
                    {weeksWithStats.reduce((acc, w) => acc + w.summary.pnl, 0) >= 0 ? '+' : ''}
                    ${weeksWithStats.reduce((acc, w) => acc + w.summary.pnl, 0).toLocaleString()}
                </div>
            </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-8 gap-4 min-w-[800px]">
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Wk Total'].map((day, i) => (
                    <div key={day} className={`text-center font-bold uppercase text-sm pb-2 border-b border-slate-100 mb-2 ${i === 7 ? 'text-slate-900' : 'text-slate-400'}`}>
                        {day}
                    </div>
                ))}
                
                {weeksWithStats.map((week, weekIdx) => (
                    <React.Fragment key={weekIdx}>
                        {/* Render Days */}
                        {week.days.map((dayObj, dayIdx) => (
                            dayObj ? (
                                <div 
                                    key={`day-${dayObj.day}`} 
                                    onClick={() => setSelectedDate(dayObj.date)}
                                    className={`
                                        aspect-square rounded-2xl border p-3 flex flex-col justify-between transition-all hover:scale-105 cursor-pointer shadow-sm relative group
                                        ${dayObj.pnl !== undefined 
                                            ? (dayObj.pnl > 0 
                                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-200 shadow-lg ring-2 ring-emerald-500/20' 
                                                : (dayObj.pnl < 0 ? 'bg-brand-red text-white border-brand-red shadow-red-200 shadow-lg ring-2 ring-red-500/20' : 'bg-slate-50 border-slate-200'))
                                            : 'bg-white border-slate-100 text-slate-300 hover:border-brand-blue hover:text-brand-blue'
                                        }
                                    `}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className={`text-sm font-bold ${!dayObj.pnl ? 'text-slate-300 group-hover:text-brand-blue' : 'opacity-90'}`}>{dayObj.day}</span>
                                        {dayObj.tradeCount ? (
                                             <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${dayObj.pnl ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                {dayObj.tradeCount}T
                                             </span>
                                        ) : null}
                                    </div>

                                    {dayObj.pnl !== undefined && dayObj.pnl !== 0 && (
                                        <div className="text-right">
                                            <div className="text-lg font-bold tracking-tight font-mono">
                                                {dayObj.pnl > 0 ? '+' : ''}${formatCompactNumber(dayObj.pnl)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Empty placeholder for padding days
                                <div key={`empty-${weekIdx}-${dayIdx}`} className="aspect-square bg-slate-50/30 rounded-2xl border border-dashed border-slate-100"></div>
                            )
                        ))}

                        {/* Render Weekly Total */}
                        <div className="aspect-square rounded-2xl border border-slate-200 bg-slate-100 p-3 flex flex-col justify-between">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Week {weekIdx + 1}</div>
                            <div className="text-right">
                                 {week.summary.trades > 0 && (
                                    <div className="text-xs text-slate-500 mb-1">{week.summary.trades} Trades</div>
                                 )}
                                 <div className={`text-lg font-bold font-mono ${week.summary.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {week.summary.pnl >= 0 ? '+' : ''}${formatCompactNumber(week.summary.pnl)}
                                 </div>
                            </div>
                        </div>
                    </React.Fragment>
                ))}
            </div>
        </div>
        
        {/* Legend */}
        <div className="mt-8 flex gap-6 shrink-0">
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                <span className="text-sm text-slate-600 font-medium">{t('winningDay')}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-brand-red shadow-sm shadow-red-200"></div>
                <span className="text-sm text-slate-600 font-medium">{t('losingDay')}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-white border border-slate-200"></div>
                <span className="text-sm text-slate-600 font-medium">{t('noTradesDay')}</span>
            </div>
            <div className="flex items-center gap-2 ml-4 border-l pl-4 border-slate-200">
                <div className="w-4 h-4 rounded bg-slate-100 border border-slate-200"></div>
                <span className="text-sm text-slate-600 font-medium">{t('weeklySummary')}</span>
            </div>
        </div>

        {/* Modal Overlay */}
        {renderDayModal()}
    </div>
  );
};

export default CalendarView;
