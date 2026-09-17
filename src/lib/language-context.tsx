// src/lib/language-context.tsx

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "en" | "kn";

export interface Translations {
  brandName: string;
  brandSubtitle: string;
  brandFullName: string;
  navNewInvoice: string;
  navInvoices: string;
  navStock: string;
  navGallery: string;
  light: string;
  dark: string;
  loading: string;
  language: string;
  toggleLanguageAria: string;
  switchToEn: string;
  switchToKn: string;
  engLabel: string;
  kanLabel: string;
}

const translations: Record<Language, Translations> = {
  en: {
    brandName: "Sri Vijaya Lakshmi",
    brandSubtitle: "Nursery & Farm",
    brandFullName: "Sri Vijaya Lakshmi Nursery",
    navNewInvoice: "New Invoice",
    navInvoices: "Invoices",
    navStock: "Stock",
    navGallery: "Gallery",
    light: "Light",
    dark: "Dark",
    loading: "Loading…",
    language: "Language",
    toggleLanguageAria: "Switch language between English and Kannada",
    switchToEn: "Switch to English",
    switchToKn: "Switch to Kannada (ಕನ್ನಡ)",
    engLabel: "ENG",
    kanLabel: "ಕನ್ನಡ",
  },
  kn: {
    brandName: "ಶ್ರೀ ವಿಜಯಲಕ್ಷ್ಮಿ",
    brandSubtitle: "ನರ್ಸರಿ ಮತ್ತು ಫಾರ್ಮ್",
    brandFullName: "ಶ್ರೀ ವಿಜಯಲಕ್ಷ್ಮಿ ನರ್ಸರಿ",
    navNewInvoice: "ಹೊಸ ಬಿಲ್",
    navInvoices: "ಬಿಲ್‌ಗಳು",
    navStock: "ದಾಸ್ತಾನು",
    navGallery: "ಗ್ಯಾಲರಿ",
    light: "ಬೆಳಕು",
    dark: "ಕತ್ತಲೆ",
    loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
    language: "ಭಾಷೆ",
    toggleLanguageAria: "ಇಂಗ್ಲಿಷ್ ಮತ್ತು ಕನ್ನಡ ನಡುವೆ ಭಾಷೆ ಬದಲಾಯಿಸಿ",
    switchToEn: "ಇಂಗ್ಲಿಷ್‌ಗೆ ಬದಲಾಯಿಸಿ (English)",
    switchToKn: "ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ",
    engLabel: "ENG",
    kanLabel: "ಕನ್ನಡ",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "svl_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "kn") {
        setLanguageState(saved);
        document.documentElement.lang = saved;
      }
    } catch {}
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {}
  };

  const toggleLanguage = () => {
    const next: Language = language === "en" ? "kn" : "en";
    setLanguage(next);
  };

  const t = (key: keyof Translations): string => {
    return translations[language][key] ?? translations.en[key] ?? String(key);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
