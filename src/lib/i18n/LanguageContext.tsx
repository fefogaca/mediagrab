"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.pt;
  isBrazilian: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('pt');
  const [isBrazilian, setIsBrazilian] = useState(true);

  useEffect(() => {
    // Detectar idioma do navegador e localização
    const detectLanguage = async () => {
      // Primeiro, verificar se há preferência salva
      const savedLang = localStorage.getItem('mediagrab-language') as Language;
      if (savedLang && (savedLang === 'pt' || savedLang === 'en')) {
        setLanguageState(savedLang);
        setIsBrazilian(savedLang === 'pt');
        return;
      }

      // Detectar pelo navegador
      const browserLang = navigator.language.toLowerCase();
      const isPT = browserLang.startsWith('pt');
      
      // Tentar detectar se é brasileiro pela timezone ou outros indicadores
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const isBrazilTimezone = timezone.includes('Brazil') || timezone.includes('Sao_Paulo');
        
        if (isPT || isBrazilTimezone) {
          setLanguageState('pt');
          setIsBrazilian(true);
        } else {
          setLanguageState('en');
          setIsBrazilian(false);
        }
      } catch {
        // Fallback baseado no idioma do navegador
        setLanguageState(isPT ? 'pt' : 'en');
        setIsBrazilian(isPT);
      }
    };

    detectLanguage();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setIsBrazilian(lang === 'pt');
    localStorage.setItem('mediagrab-language', lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isBrazilian }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useTranslation() {
  const { t, language, setLanguage, isBrazilian } = useLanguage();
  return { t, language, setLanguage, isBrazilian };
}

