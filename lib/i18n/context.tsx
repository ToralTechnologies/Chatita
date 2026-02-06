'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations, TranslationKeys } from './translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [dbSynced, setDbSynced] = useState(false);

  // Load language preference on mount
  useEffect(() => {
    const loadLanguagePreference = async () => {
      // First try localStorage (works immediately)
      const savedLocal = localStorage.getItem('chatita_language') as Language;
      if (savedLocal === 'en' || savedLocal === 'es') {
        setLanguageState(savedLocal);
      }

      // Try to sync with database (will fail silently if not logged in)
      if (!dbSynced) {
        try {
          const res = await fetch('/api/user/profile');
          if (res.ok) {
            const data = await res.json();
            const dbLang = data.user?.preferredLanguage as Language;
            if ((dbLang === 'en' || dbLang === 'es') && dbLang !== savedLocal) {
              // Database preference differs from local, sync it
              setLanguageState(dbLang);
              localStorage.setItem('chatita_language', dbLang);
            }
          }
          setDbSynced(true);
        } catch (error) {
          // Silently fail if not logged in or network error
          setDbSynced(true);
        }
      }
    };

    // Only run after client-side mount
    if (typeof window !== 'undefined') {
      loadLanguagePreference();
    }
  }, [dbSynced]);

  // Save language to localStorage when it changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('chatita_language', lang);
  };

  const value = {
    language,
    setLanguage,
    t: translations[language],
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

// Helper hook for just translations
export function useTranslation() {
  const { t, language } = useI18n();
  return { t, language };
}
