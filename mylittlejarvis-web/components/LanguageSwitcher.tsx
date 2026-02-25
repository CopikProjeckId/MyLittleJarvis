"use client";

import { useState, useRef, useEffect } from "react";
import { Lang, SUPPORTED_LANGS, getLangName, getStoredLang, setStoredLang, detectBrowserLang } from "@/lib/i18n";
import { Globe, Check } from "lucide-react";

interface LanguageSwitcherProps {
  variant?: "header" | "minimal";
}

export function LanguageSwitcher({ variant = "header" }: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<Lang>("en");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize from storage
  useEffect(() => {
    const stored = getStoredLang();
    const detected = stored || detectBrowserLang();
    setCurrentLang(detected);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLangChange = (lang: Lang) => {
    if (lang === currentLang) {
      setIsOpen(false);
      return;
    }
    setStoredLang(lang);
    window.location.reload();
  };

  if (variant === "minimal") {
    return (
      <select
        value={currentLang}
        onChange={(e) => handleLangChange(e.target.value as Lang)}
        className="bg-transparent border border-gray-700 rounded px-2 py-1 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
      >
        {SUPPORTED_LANGS.map((lang) => (
          <option key={lang} value={lang}>
            {getLangName(lang)}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{getLangName(currentLang)}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-1 z-50">
          {SUPPORTED_LANGS.map((lang) => (
            <button
              key={lang}
              onClick={() => handleLangChange(lang)}
              className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                lang === currentLang
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span>{getLangName(lang)}</span>
              {lang === currentLang && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
