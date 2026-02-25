"use client";

import { useState, useEffect, useCallback } from "react";

// CLI is English-only
export type Lang = "en";

export const SUPPORTED_LANGS: Lang[] = ["en"];
export const DEFAULT_LANG: Lang = "en";

const LANG_NAMES: Record<Lang, string> = {
  en: "English"
};

export function getLangName(lang: Lang): string {
  return LANG_NAMES[lang];
}

// Single locale file (locales.json contains all languages)
// Load translations from unified JSON
export async function loadTranslations(lang: Lang): Promise<Record<string, any>> {
  try {
    const res = await fetch(`/locales.json`);
    if (!res.ok) throw new Error(`Failed to load locales`);
    const allLocales = await res.json();
    return allLocales[lang] || allLocales[DEFAULT_LANG] || {};
  } catch {
    // Fallback to English
    if (lang !== DEFAULT_LANG) {
      return loadTranslations(DEFAULT_LANG);
    }
    return {};
  }
}

// Client-side storage key
const STORAGE_KEY = "jarvis-lang";

export function getStoredLang(): Lang | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LANGS.includes(stored as Lang)) {
    return stored as Lang;
  }
  return null;
}

export function setStoredLang(lang: Lang): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, lang);
}

// Detect browser language
export function detectBrowserLang(): Lang {
  if (typeof navigator === "undefined") return DEFAULT_LANG;
  const browserLang = navigator.language.toLowerCase();
  const baseLang = browserLang.split("-")[0];
  
  if (SUPPORTED_LANGS.includes(baseLang as Lang)) {
    return baseLang as Lang;
  }
  
  // Chinese variants
  if (browserLang.startsWith("zh")) return "zh";
  
  return DEFAULT_LANG;
}

// Get initial language
export function getInitialLang(): Lang {
  return getStoredLang() || detectBrowserLang();
}

// Translation hook
export function useTranslation(initialLang?: Lang) {
  const [lang, setLang] = useState<Lang>(initialLang || DEFAULT_LANG);
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load translations when lang changes
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    
    loadTranslations(lang).then((data) => {
      if (mounted) {
        setTranslations(data);
        setIsLoading(false);
      }
    });
    
    return () => { mounted = false; };
  }, [lang]);

  // Initialize from storage on mount
  useEffect(() => {
    const stored = getStoredLang();
    if (stored && stored !== lang) {
      setLang(stored);
    }
  }, []);

  // Translation function
  const t = useCallback(
    (key: string, vars?: Record<string, string>): string => {
      const parts = key.split(".");
      let value: any = translations;
      
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) break;
      }
      
      if (typeof value !== "string") return key;
      
      // Replace {placeholder}
      return value.replace(/\{(\w+)\}/g, (_, k) => vars?.[k] || `{${k}}`);
    },
    [translations]
  );

  // Change language
  const changeLang = useCallback((newLang: Lang) => {
    setStoredLang(newLang);
    setLang(newLang);
    // Reload page to ensure all components pick up new language
    window.location.reload();
  }, []);

  return { t, lang, changeLang, isLoading, supportedLangs: SUPPORTED_LANGS };
}
