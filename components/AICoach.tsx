
import React, { useState } from 'react';
import { BrainCircuit, Sparkles, MessageSquare, Target, Zap } from 'lucide-react';
import { analyzeTrades } from '../services/geminiService';
import { Trade } from '../types';

// Simplified markdown renderer substitute for light theme
const SimpleMarkdown = ({ content }: { content: string }) => {
    return (
        <div className="prose prose-slate max-w-none text-sm text-slate-700 space-y-4">
            {content.split('\n').map((line, i) => {
                if (line.startsWith('###')) return <h3 key={i} className="text-lg font-bold text-slate-900 mt-4 border-b border-slate-200 pb-2">{line.replace('###', '')}</h3>
                if (line.startsWith('**')) return <p key={i} className="font-bold text-slate-900">{line.replace(/\*\*/g, '')}</p>
                if (line.startsWith('-')) return <li key={i} className="ml-4 marker:text-brand-blue">{line.replace('-', '')}</li>
                return <p key={i} className="leading-relaxed">{line}</p>
            })}
        </div>
    )
}

const PROMPT_TEMPLATES = [
    { label: 'Risk Management Analysis', prompt: 'Analyze my trade entries and exits based on risk-reward ratios and stop-loss adherence. Am I taking trades with poor R:R or moving stops?' },
    { label: 'Entry Discipline', prompt: 'Focus on my entry timing and setups. Am I chasing price, entering late, or adhering to my setup rules?' },
    { label: 'Psychology Check', prompt: 'Look for signs of emotional trading, tilt, revenge trading, or overtrading in my loss streaks.' },
    { label: 'Win Rate Analysis', prompt: 'Why are my winners winning? Is it the setup, the time of day, or the symbol? Help me replicate success.' },
];

interface AICoachProps {
    trades: Trade[];
}

const AICoach: React.FC<AICoachProps> = ({ trades }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [customFocus, setCustomFocus] = useState('');

  const handleAnalysis = async () => {
    setLoading(true);
    const result = await analyzeTrades(trades, customFocus);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto h-full flex flex-col animate-fade-in text-slate-900">
       <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-white shadow-sm border border-slate-200 rounded-2xl mb-4">
             <BrainCircuit size={48} className="text-brand-blue" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Gemini Trade Coach</h2>
          <p className="text-slate-500 max-w-lg mx-auto font-medium">
              Uses Google's Gemini AI to analyze your recent trade execution. Customize the prompt to focus on specific areas of your game.
          </p>
       </div>

       <div className="flex-1 flex flex-col gap-6">
           {/* Control Panel */}
           <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
               <div className="flex flex-col gap-4">
                   
                   {/* Input Section */}
                   <div className="flex flex-col gap-3">
                       <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                           <Target size={16} className="text-brand-red" />
                           Coach Focus Area
                       </label>
                       
                       <div className="flex flex-wrap gap-2">
                           {PROMPT_TEMPLATES.map((template) => (
                               <button
                                   key={template.label}
                                   onClick={() => setCustomFocus(template.prompt)}
                                   className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 hover:bg-brand-blue/10 hover:text-brand-blue hover:border-brand-blue/30 transition-all"
                               >
                                   <Zap size={12} />
                                   {template.label}
                               </button>
                           ))}
                       </div>

                       <input 
                           type="text" 
                           value={customFocus}
                           onChange={(e) => setCustomFocus(e.target.value)}
                           placeholder="e.g., 'Analyze my discipline on losing trades' or select a template above"
                           className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all placeholder:text-slate-400"
                       />
                   </div>

                   <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-2">
                       <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                           <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
                           <span className="text-slate-500 text-sm font-medium">Model: <span className="text-slate-900 font-bold">gemini-3-pro-preview</span></span>
                       </div>
                       
                       <button 
                          onClick={handleAnalysis}
                          disabled={loading || trades.length === 0}
                          className={`
                            px-8 py-3 rounded-xl font-bold text-white shadow-lg shadow-brand-blue/20 flex items-center gap-2 transition-all w-full md:w-auto justify-center
                            ${loading || trades.length === 0 ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-brand-blue to-brand-red hover:scale-105 active:scale-95'}
                          `}
                       >
                          {loading ? (
                              <>Analyzing...</>
                          ) : (
                              <>
                                <Sparkles size={18} />
                                Analyze My Trades
                              </>
                          )}
                       </button>
                   </div>
                   
                   {trades.length === 0 && (
                        <p className="text-center text-xs text-red-500 font-medium">Please log some trades to use the AI Coach.</p>
                   )}
               </div>
           </div>

           {/* Output Area */}
           <div className={`flex-1 bg-white border border-slate-200 rounded-2xl p-8 relative min-h-[400px] shadow-sm overflow-y-auto transition-all duration-500 ${analysis ? 'opacity-100' : 'opacity-100'}`}>
                {!analysis && !loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                        <MessageSquare size={48} className="mb-4 opacity-20 text-slate-300" />
                        <p className="font-medium">No analysis generated yet.</p>
                        <p className="text-sm">Set a focus area and click analyze to start.</p>
                    </div>
                )}
                
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                        <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-brand-blue font-bold animate-pulse">Consulting the oracle...</p>
                    </div>
                )}

                {analysis && (
                    <div className="animate-fade-in">
                        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                            <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 font-mono text-xs uppercase tracking-widest px-2 py-1 rounded">Report Ready</span>
                            <span className="text-slate-400 text-xs ml-auto font-medium">{new Date().toLocaleTimeString()}</span>
                        </div>
                        <SimpleMarkdown content={analysis} />
                    </div>
                )}
           </div>
       </div>
    </div>
  );
};

export default AICoach;
