
import React, { useState, useEffect } from 'react';
import { User as UserIcon, Shield, CreditCard, Bell, LogOut, Moon, Sun, Mail, Hash, ChevronRight, ChevronLeft, Save, CheckCircle, AlertTriangle, Calendar, Check, X, AlertCircle } from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../translations';

interface SettingsViewProps {
    user: User | null;
    onLogout: () => void;
}

type SettingsSection = 'MAIN' | 'ACCOUNT' | 'RISK' | 'SUBSCRIPTION' | 'NOTIFICATIONS';

const SettingsView: React.FC<SettingsViewProps> = ({ user, onLogout }) => {
  const { t, setLanguage } = useLanguage();
  const [activeSection, setActiveSection] = useState<SettingsSection>('MAIN');
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS'>('IDLE');

  // --- Theme State ---
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            return storedTheme === 'dark';
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // --- Account State ---
  const [accountForm, setAccountForm] = useState(() => {
      const saved = localStorage.getItem('settings_account');
      return saved ? JSON.parse(saved) : {
          name: user?.name || '',
          email: user?.email || '',
          currency: 'USD',
          timezone: 'America/New_York',
          language: 'en'
      };
  });

  // --- Risk State ---
  const [riskForm, setRiskForm] = useState(() => {
      const saved = localStorage.getItem('settings_risk');
      return saved ? JSON.parse(saved) : {
          maxDailyLoss: 500,
          maxDrawdownPct: 2.5,
          maxOpenTrades: 5,
          dailyTradeLimit: 20,
          hardStopEnabled: false
      };
  });

  // --- Notification State ---
  const [notifForm, setNotifForm] = useState(() => {
      const saved = localStorage.getItem('settings_notif');
      return saved ? JSON.parse(saved) : {
          emailAlerts: true,
          dailySummary: true,
          executionAlerts: false,
          marketing: false
      };
  });

  // --- Mock Subscription Data ---
  const subscription = {
      plan: 'Pro Trader',
      price: 16.99,
      interval: 'month',
      status: 'active',
      nextBilling: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      paymentMethod: 'Visa ending in 4242'
  };

  const handleSave = (key: string, data: any) => {
      setSaveStatus('SAVING');
      
      // If saving account settings, update the global language context
      if (key === 'settings_account' && data.language) {
          setLanguage(data.language as Language);
      }

      setTimeout(() => {
          localStorage.setItem(key, JSON.stringify(data));
          setSaveStatus('SUCCESS');
          setTimeout(() => setSaveStatus('IDLE'), 2000);
      }, 600);
  };

  // --- Render Sections ---

  const renderMain = () => (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm transition-colors duration-200 animate-fade-in">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-blue to-brand-red rounded-full flex items-center justify-center text-2xl text-white font-bold shadow-lg">
                {user?.name.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h3>
                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1"><Mail size={12} /> {user?.email}</span>
                </div>
            </div>
            <button 
                onClick={() => setActiveSection('ACCOUNT')}
                className="ml-auto px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
                {t('edit')} Profile
            </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {/* Theme Toggle */}
            <div 
                className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                onClick={() => setDarkMode(!darkMode)}
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                        {darkMode ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{t('appearance')}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {darkMode ? t('darkModeOn') : t('switchToDark')}
                        </p>
                    </div>
                </div>
                {/* Switch UI */}
                <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${darkMode ? 'bg-brand-blue' : 'bg-slate-200'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
            </div>

            <div 
                onClick={() => setActiveSection('ACCOUNT')}
                className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
            >
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                        <UserIcon size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{t('accountPref')}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t('descAccount')}</p>
                    </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-slate-500 transition-colors" size={20} />
            </div>

            <div 
                onClick={() => setActiveSection('RISK')}
                className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
            >
                <div className="flex items-center gap-4">
                     <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{t('riskMgmt')}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t('descRisk')}</p>
                    </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-slate-500 transition-colors" size={20} />
            </div>

            <div 
                onClick={() => setActiveSection('SUBSCRIPTION')}
                className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
            >
                <div className="flex items-center gap-4">
                     <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
                        <CreditCard size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{t('subscription')}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t('descSub')}</p>
                    </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-slate-500 transition-colors" size={20} />
            </div>

            <div 
                onClick={() => setActiveSection('NOTIFICATIONS')}
                className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
            >
                <div className="flex items-center gap-4">
                     <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg">
                        <Bell size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{t('notifications')}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t('descNotif')}</p>
                    </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-slate-500 transition-colors" size={20} />
            </div>
            
            <div 
                onClick={onLogout}
                className="p-6 bg-red-50/50 dark:bg-red-900/10 flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-bold cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
                <LogOut size={18} />
                <span>{t('logout')}</span>
            </div>
        </div>
    </div>
  );

  const renderAccount = () => (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm animate-slide-up">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <UserIcon className="text-brand-blue" /> {t('accountPref')}
        </h3>
        
        <div className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('displayName')}</label>
                    <input 
                        type="text" 
                        value={accountForm.name}
                        onChange={e => setAccountForm({...accountForm, name: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-brand-blue transition-colors text-slate-900 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('emailAddress')}</label>
                    <input 
                        type="email" 
                        value={accountForm.email}
                        onChange={e => setAccountForm({...accountForm, email: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-brand-blue transition-colors text-slate-900 dark:text-white"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('baseCurrency')}</label>
                <select 
                    value={accountForm.currency}
                    onChange={e => setAccountForm({...accountForm, currency: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-brand-blue transition-colors text-slate-900 dark:text-white"
                >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                </select>
                <p className="text-xs text-slate-400 mt-1">{t('currencyDesc')}</p>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('timezone')}</label>
                <select 
                    value={accountForm.timezone}
                    onChange={e => setAccountForm({...accountForm, timezone: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-brand-blue transition-colors text-slate-900 dark:text-white"
                >
                    <option value="America/New_York">Eastern Time (US & Canada)</option>
                    <option value="America/Chicago">Central Time (US & Canada)</option>
                    <option value="America/Denver">Mountain Time (US & Canada)</option>
                    <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Berlin">Berlin</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                    <option value="Australia/Sydney">Sydney</option>
                </select>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('language')}</label>
                <select 
                    value={accountForm.language}
                    onChange={e => setAccountForm({...accountForm, language: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-brand-blue transition-colors text-slate-900 dark:text-white"
                >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="ja">日本語</option>
                </select>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <button 
                    onClick={() => handleSave('settings_account', accountForm)}
                    disabled={saveStatus === 'SAVING' || saveStatus === 'SUCCESS'}
                    className={`
                        px-6 py-2.5 rounded-xl font-bold text-white transition-all flex items-center gap-2
                        ${saveStatus === 'SUCCESS' ? 'bg-emerald-500' : 'bg-brand-blue hover:bg-blue-600'}
                    `}
                >
                    {saveStatus === 'SAVING' ? (
                        <>{t('saving')}</>
                    ) : saveStatus === 'SUCCESS' ? (
                        <>
                            <CheckCircle size={18} /> {t('saved')}
                        </>
                    ) : (
                        <>
                            <Save size={18} /> {t('saveChanges')}
                        </>
                    )}
                </button>
            </div>
        </div>
    </div>
  );

  const renderRisk = () => (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm animate-slide-up">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Shield className="text-emerald-500" /> {t('riskMgmt')}
        </h3>
        
        <div className="space-y-8 max-w-2xl">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex gap-3 text-emerald-800 dark:text-emerald-300">
                <AlertCircle className="shrink-0 mt-0.5" size={20} />
                <p className="text-sm">
                    <strong>Disciplined Trader Rule:</strong> These settings help you enforce your trading plan. 
                    Violations will be flagged in your Trade Log and Dashboard.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('dailyLossLimit')}</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                        <input 
                            type="number" 
                            value={riskForm.maxDailyLoss}
                            onChange={e => setRiskForm({...riskForm, maxDailyLoss: parseFloat(e.target.value)})}
                            className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-brand-blue transition-colors text-slate-900 dark:text-white font-bold"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('maxDrawdown')}</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            step="0.1"
                            value={riskForm.maxDrawdownPct}
                            onChange={e => setRiskForm({...riskForm, maxDrawdownPct: parseFloat(e.target.value)})}
                            className="w-full pl-4 pr-8 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-brand-blue transition-colors text-slate-900 dark:text-white font-bold"
                        />
                        <span className="absolute right-3 top-2 text-slate-400 font-bold">%</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('maxOpenTrades')}</label>
                    <input 
                        type="number" 
                        value={riskForm.maxOpenTrades}
                        onChange={e => setRiskForm({...riskForm, maxOpenTrades: parseInt(e.target.value)})}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-brand-blue transition-colors text-slate-900 dark:text-white font-bold"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('dailyTradeLimit')}</label>
                    <input 
                        type="number" 
                        value={riskForm.dailyTradeLimit}
                        onChange={e => setRiskForm({...riskForm, dailyTradeLimit: parseInt(e.target.value)})}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-brand-blue transition-colors text-slate-900 dark:text-white font-bold"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                 <div>
                     <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t('hardStopMode')}</h4>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('hardStopDesc')}</p>
                 </div>
                 <button 
                     onClick={() => setRiskForm({...riskForm, hardStopEnabled: !riskForm.hardStopEnabled})}
                     className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${riskForm.hardStopEnabled ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                 >
                     <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${riskForm.hardStopEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                 </button>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <button 
                    onClick={() => handleSave('settings_risk', riskForm)}
                    disabled={saveStatus === 'SAVING' || saveStatus === 'SUCCESS'}
                    className={`
                        px-6 py-2.5 rounded-xl font-bold text-white transition-all flex items-center gap-2
                        ${saveStatus === 'SUCCESS' ? 'bg-emerald-500' : 'bg-brand-blue hover:bg-blue-600'}
                    `}
                >
                    {saveStatus === 'SAVING' ? (
                        <>{t('saving')}</>
                    ) : saveStatus === 'SUCCESS' ? (
                        <>
                            <CheckCircle size={18} /> {t('saved')}
                        </>
                    ) : (
                        <>
                            <Save size={18} /> {t('updateRisk')}
                        </>
                    )}
                </button>
            </div>
        </div>
    </div>
  );

  const renderSubscription = () => (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm animate-slide-up">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <CreditCard className="text-purple-500" /> {t('subscription')}
          </h3>

          <div className="max-w-2xl">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl mb-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                      <CreditCard size={120} />
                  </div>
                  <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                          <div>
                              <div className="text-purple-300 font-bold text-xs uppercase tracking-wider mb-1">{t('currentPlan')}</div>
                              <h2 className="text-3xl font-extrabold">{subscription.plan}</h2>
                          </div>
                          <div className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">
                              {t('active')}
                          </div>
                      </div>
                      <div className="flex items-baseline gap-1 mb-6">
                          <span className="text-4xl font-bold">${subscription.price}</span>
                          <span className="text-slate-400">/{subscription.interval}</span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/10">
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                              <Calendar size={16} />
                              {t('nextBilling')}: <span className="text-white font-bold">{subscription.nextBilling}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                              <CreditCard size={16} />
                              {t('method')}: <span className="text-white font-bold">{subscription.paymentMethod}</span>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 dark:text-white">{t('planFeatures')}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {['Unlimited Trade Logging', 'AI Trading Coach', 'Advanced Analytics', 'Risk Management Tools', 'Priority Support', 'CSV Import'].map(feature => (
                          <div key={feature} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                              <CheckCircle size={16} className="text-emerald-500" />
                              {feature}
                          </div>
                      ))}
                  </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700 flex gap-4">
                  <button className="px-6 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                      {t('updatePayment')}
                  </button>
                  <button 
                    onClick={() => {
                        if (confirm("Are you sure you want to cancel? You will lose access to premium features at the end of your billing period.")) {
                            alert("Subscription cancellation scheduled.");
                        }
                    }}
                    className="px-6 py-2.5 text-red-600 hover:text-red-700 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                      {t('cancelSub')}
                  </button>
              </div>
          </div>
      </div>
  );

  const renderNotifications = () => (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm animate-slide-up">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Bell className="text-orange-500" /> {t('notifications')}
        </h3>

        <div className="max-w-2xl space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                 <div>
                     <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t('weeklySummary')}</h4>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('weeklySummaryDesc')}</p>
                 </div>
                 <button 
                     onClick={() => setNotifForm({...notifForm, dailySummary: !notifForm.dailySummary})}
                     className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${notifForm.dailySummary ? 'bg-brand-blue' : 'bg-slate-300 dark:bg-slate-600'}`}
                 >
                     <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${notifForm.dailySummary ? 'translate-x-6' : 'translate-x-0'}`} />
                 </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                 <div>
                     <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t('riskAlerts')}</h4>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('riskAlertsDesc')}</p>
                 </div>
                 <button 
                     onClick={() => setNotifForm({...notifForm, emailAlerts: !notifForm.emailAlerts})}
                     className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${notifForm.emailAlerts ? 'bg-brand-blue' : 'bg-slate-300 dark:bg-slate-600'}`}
                 >
                     <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${notifForm.emailAlerts ? 'translate-x-6' : 'translate-x-0'}`} />
                 </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                 <div>
                     <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t('tradeExec')}</h4>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('tradeExecDesc')}</p>
                 </div>
                 <button 
                     onClick={() => setNotifForm({...notifForm, executionAlerts: !notifForm.executionAlerts})}
                     className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${notifForm.executionAlerts ? 'bg-brand-blue' : 'bg-slate-300 dark:bg-slate-600'}`}
                 >
                     <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${notifForm.executionAlerts ? 'translate-x-6' : 'translate-x-0'}`} />
                 </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                 <div>
                     <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t('marketing')}</h4>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('marketingDesc')}</p>
                 </div>
                 <button 
                     onClick={() => setNotifForm({...notifForm, marketing: !notifForm.marketing})}
                     className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${notifForm.marketing ? 'bg-brand-blue' : 'bg-slate-300 dark:bg-slate-600'}`}
                 >
                     <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${notifForm.marketing ? 'translate-x-6' : 'translate-x-0'}`} />
                 </button>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <button 
                    onClick={() => handleSave('settings_notif', notifForm)}
                    disabled={saveStatus === 'SAVING' || saveStatus === 'SUCCESS'}
                    className={`
                        px-6 py-2.5 rounded-xl font-bold text-white transition-all flex items-center gap-2
                        ${saveStatus === 'SUCCESS' ? 'bg-emerald-500' : 'bg-brand-blue hover:bg-blue-600'}
                    `}
                >
                    {saveStatus === 'SAVING' ? (
                        <>{t('saving')}</>
                    ) : saveStatus === 'SUCCESS' ? (
                        <>
                            <CheckCircle size={18} /> {t('saved')}
                        </>
                    ) : (
                        <>
                            <Save size={18} /> {t('savePref')}
                        </>
                    )}
                </button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in text-slate-900 dark:text-white">
        <div className="flex items-center gap-4 mb-8">
            {activeSection !== 'MAIN' && (
                <button 
                    onClick={() => {
                        setActiveSection('MAIN');
                        setSaveStatus('IDLE');
                    }} 
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
            )}
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {activeSection === 'MAIN' ? t('settings') : 
                 activeSection === 'ACCOUNT' ? t('accountPref') :
                 activeSection === 'RISK' ? t('riskMgmt') :
                 activeSection === 'SUBSCRIPTION' ? t('subscription') : t('notifications')}
            </h2>
        </div>
        
        {activeSection === 'MAIN' && renderMain()}
        {activeSection === 'ACCOUNT' && renderAccount()}
        {activeSection === 'RISK' && renderRisk()}
        {activeSection === 'SUBSCRIPTION' && renderSubscription()}
        {activeSection === 'NOTIFICATIONS' && renderNotifications()}
    </div>
  );
};

export default SettingsView;
