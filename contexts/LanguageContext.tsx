
import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRANSLATIONS, Language } from '../translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof TRANSLATIONS.en) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
     // Try to load from existing settings in localStorage
     const saved = localStorage.getItem('settings_account');
     if (saved) {
         try {
             const parsed = JSON.parse(saved);
             return (parsed.language as Language) || 'en';
         } catch(e) { return 'en'; }
     }
     return 'en';
  });

  const t = (key: keyof typeof TRANSLATIONS.en) => {
    // Fallback chain: Selected Language -> English -> Key Name
    return TRANSLATIONS[language][key] || TRANSLATIONS['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
