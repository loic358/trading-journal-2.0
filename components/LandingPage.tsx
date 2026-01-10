
import React, { useState } from 'react';
import { ChevronRight, BarChart2, BookOpen, FileText, Settings, PlayCircle, Shield, User, Lock, Mail, ArrowRight, Loader2, Check, Upload, BrainCircuit, Target, Calculator, Monitor, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase';

interface LandingPageProps {
  onDemoLogin?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onDemoLogin }) => {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (authMode === 'SIGNUP') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name }
          }
        });
        if (signUpError) throw signUpError;
        alert("Registration successful! Please log in.");
        setAuthMode('LOGIN');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
        // Auth state change will be picked up by App.tsx
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToSection = (id: string) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden relative">
      
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-brand-red flex items-center justify-center text-white font-bold text-xl">
             T
           </div>
           <span className="text-xl font-bold tracking-tight text-slate-900">TRADE<span className="text-slate-500">PULSE</span></span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <button onClick={() => scrollToSection('features')} className="hover:text-brand-blue transition-colors">Features</button>
          <button onClick={() => scrollToSection('brokers')} className="hover:text-brand-blue transition-colors">Supported Brokers</button>
          <button onClick={() => scrollToSection('pricing')} className="hover:text-brand-blue transition-colors">Pricing</button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => scrollToSection('auth-form')}
            className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            Log In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-6 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8 animate-slide-up">
          <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-slate-900">
            Master your trading <span className="gradient-text">psychology</span> & edge.
          </h1>
          <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
            TradePulse gives you the analytics, journaling, and AI coaching you need to stop gambling and start trading like a professional.
          </p>
          
          {/* Auth Form Card */}
          <div id="auth-form" className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 max-w-md w-full relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue to-brand-red"></div>
             
             <div className="mb-6 flex gap-6 border-b border-slate-100 pb-2">
                <button 
                  onClick={() => { setAuthMode('LOGIN'); setError(null); }}
                  className={`pb-2 text-sm font-bold transition-colors relative ${authMode === 'LOGIN' ? 'text-brand-blue' : 'text-slate-400'}`}
                >
                  Log In
                  {authMode === 'LOGIN' && <div className="absolute bottom-[-9px] left-0 w-full h-0.5 bg-brand-blue rounded-t-full"></div>}
                </button>
                <button 
                  onClick={() => { setAuthMode('SIGNUP'); setError(null); }}
                  className={`pb-2 text-sm font-bold transition-colors relative ${authMode === 'SIGNUP' ? 'text-brand-blue' : 'text-slate-400'}`}
                >
                  Create Account
                  {authMode === 'SIGNUP' && <div className="absolute bottom-[-9px] left-0 w-full h-0.5 bg-brand-blue rounded-t-full"></div>}
                </button>
             </div>

             <form onSubmit={handleAuth} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        {error}
                    </div>
                )}

                {authMode === 'SIGNUP' && (
                  <div className="relative">
                      <User className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Full Name" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all font-medium"
                      />
                  </div>
                )}
                <div className="relative">
                    <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      placeholder="Email Address" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all font-medium"
                    />
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      type="password" 
                      placeholder="Password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all font-medium"
                    />
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-brand-blue to-brand-red text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      {authMode === 'LOGIN' ? 'Sign In' : 'Start Free Trial'}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
             </form>
             
             {authMode === 'LOGIN' && onDemoLogin && (
               <div className="mt-4 text-center border-t border-slate-100 pt-4">
                 <button onClick={onDemoLogin} className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                    Try Demo Version
                 </button>
               </div>
             )}
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative group perspective-1000 animate-fade-in delay-100 hidden lg:block">
           <div className="absolute -inset-4 bg-gradient-to-tr from-brand-blue/20 to-brand-red/20 rounded-[2rem] blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-700"></div>
           <div className="relative bg-slate-950 rounded-xl border-4 border-slate-900 shadow-2xl overflow-hidden transform transition-transform duration-700 hover:rotate-0 rotate-y-[-10deg] rotate-x-[5deg] origin-center" style={{ height: '500px' }}>
              <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-700 font-mono text-sm">
                  [Interactive Dashboard Preview]
              </div>
              
              {/* Floating tags */}
              <div className="absolute top-10 -left-6 bg-white shadow-xl rounded-lg p-3 flex items-center gap-3 animate-bounce" style={{ animationDuration: '3s' }}>
                  <div className="p-2 bg-green-100 rounded-md text-green-600">
                     <BarChart2 size={20} />
                  </div>
                  <div>
                     <div className="text-xs text-slate-500">Net P&L</div>
                     <div className="text-sm font-bold text-slate-900">+$92,129.10</div>
                  </div>
              </div>
           </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Everything You Need to Find Your Edge</h2>
                <p className="text-slate-500 max-w-xl mx-auto">From psychological analysis to technical breakdowns, we provide the tools to make you a consistent trader.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                    {
                        icon: <BarChart2 size={24} />,
                        title: "Advanced Analytics",
                        desc: "Visualize your equity curve, profit factor, and win rate instantly. Spot trends in your performance over time."
                    },
                    {
                        icon: <BrainCircuit size={24} />,
                        title: "AI Trading Coach",
                        desc: "Get personalized, unbiased feedback on every trade. Our Gemini-powered AI helps identify psychological leaks."
                    },
                    {
                        icon: <Target size={24} />,
                        title: "Playbook Tracking",
                        desc: "Tag your trades by setup (e.g., 'Breakout', 'Reversal'). Analyze which strategies are actually printing money."
                    },
                    {
                        icon: <FileText size={24} />,
                        title: "Rich Journaling",
                        desc: "Document your thoughts with a full rich-text editor. Upload chart screenshots to preserve your trade context."
                    },
                    {
                        icon: <Shield size={24} />,
                        title: "Manual Backtesting",
                        desc: "Replay market scenarios and log simulated trades to build intuition without risking real capital."
                    },
                    {
                        icon: <Calculator size={24} />,
                        title: "Risk Management",
                        desc: "Built-in position size calculators for Forex, Futures, and Crypto ensure you never over-leverage."
                    }
                ].map((feature, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow hover:border-brand-blue/30 group">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 group-hover:bg-brand-blue group-hover:text-white transition-colors mb-4">
                            {feature.icon}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Supported Brokers Section */}
      <section id="brokers" className="py-20 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                   <div>
                       <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Seamless Integration</h2>
                       <p className="text-lg text-slate-500 mb-8">
                           Import your trade history directly from the platforms you already use. 
                           Whether you trade futures, forex, or crypto, we can normalize your data.
                       </p>
                       <ul className="space-y-4">
                           {[
                               "One-click CSV Import",
                               "Auto-Sync API (Beta)",
                               "Universal Format Support",
                               "Duplicate Detection"
                           ].map((item, i) => (
                               <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                   <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                       <Check size={12} strokeWidth={3} />
                                   </div>
                                   {item}
                               </li>
                           ))}
                       </ul>
                   </div>
                   
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                       {[
                           { name: 'NinjaTrader 8', type: 'Futures' },
                           { name: 'MetaTrader 4', type: 'Forex' },
                           { name: 'MetaTrader 5', type: 'CFDs' },
                           { name: 'TradingView', type: 'Charting' },
                           { name: 'Interactive Brokers', type: 'Stocks' },
                           { name: 'Coinbase', type: 'Crypto' },
                       ].map((broker, i) => (
                           <div key={i} className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-slate-200 hover:shadow-lg transition-all text-center group cursor-default">
                               <div className="w-10 h-10 bg-slate-200 rounded-full mb-3 flex items-center justify-center font-bold text-slate-500 group-hover:bg-brand-blue group-hover:text-white transition-colors">
                                   {broker.name.charAt(0)}
                               </div>
                               <span className="font-bold text-slate-800 text-sm">{broker.name}</span>
                               <span className="text-[10px] text-slate-400 uppercase font-bold mt-1">{broker.type}</span>
                           </div>
                       ))}
                   </div>
               </div>
          </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
                <p className="text-slate-500 max-w-xl mx-auto">Everything you need to trade like a professional, for less than the cost of a single commission.</p>
            </div>

            <div className="max-w-sm mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden hover:scale-105 transition-transform duration-300 relative">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-brand-blue to-brand-red"></div>
                <div className="p-8">
                    <h3 className="text-lg font-bold text-slate-500 uppercase tracking-wider mb-2">Pro Trader</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-5xl font-extrabold text-slate-900">$16.99</span>
                        <span className="text-slate-500 font-medium">/month</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-6 pb-6 border-b border-slate-100">
                        Unlock full access to AI coaching, unlimited journals, and advanced analytics.
                    </p>
                    
                    <ul className="space-y-4 mb-8">
                        {[
                            'Unlimited Trade Journaling', 
                            'Gemini AI Trading Coach', 
                            'Advanced Playbook Analytics', 
                            'Equity Curve Simulator',
                            'Broker Import (MT4/5, NinjaTrader)',
                            'Risk Management Calculator'
                        ].map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                <div className="w-5 h-5 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
                                    <Check size={12} strokeWidth={3} />
                                </div>
                                {feature}
                            </li>
                        ))}
                    </ul>

                    <button 
                        onClick={() => scrollToSection('auth-form')}
                        className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
                    >
                        Start 7-Day Free Trial
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-3">Cancel anytime. No questions asked.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Footer Strip */}
      <section className="border-t border-slate-200 bg-white py-8">
         <div className="max-w-7xl mx-auto px-6 text-center">
             <p className="text-slate-500 text-sm">Trusted by over 10,000 traders worldwide</p>
         </div>
      </section>
    </div>
  );
};

export default LandingPage;
