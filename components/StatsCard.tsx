import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subValue, isPositive, icon }) => {
  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 hover:shadow-md transition-all shadow-sm">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 group-hover:text-emerald-500 transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-slate-500 text-sm font-semibold mb-2 uppercase tracking-wider">{title}</h3>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-extrabold ${
          typeof isPositive === 'boolean' 
            ? (isPositive ? 'text-emerald-500' : 'text-brand-red')
            : 'text-slate-900'
        }`}>
          {value}
        </span>
        {subValue && (
          <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-full font-medium">{subValue}</span>
        )}
      </div>
    </div>
  );
};

export default StatsCard;