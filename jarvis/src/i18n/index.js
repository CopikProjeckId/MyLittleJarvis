// JARVIS i18n (Internationalization) Module
// Supports: Korean (ko), English (en)

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Supported languages
export const SUPPORTED_LANGUAGES = ['ko', 'en'];
export const DEFAULT_LANGUAGE = 'ko';

// Loaded locale cache
let currentLocale = null;
let currentLanguage = DEFAULT_LANGUAGE;

/**
 * Load locale file
 */
function loadLocale(lang) {
  const localePath = join(__dirname, 'locales', `${lang}.json`);

  if (!existsSync(localePath)) {
    console.warn(`Locale file not found: ${localePath}, falling back to ${DEFAULT_LANGUAGE}`);
    return loadLocale(DEFAULT_LANGUAGE);
  }

  try {
    const content = readFileSync(localePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load locale ${lang}:`, error.message);
    if (lang !== DEFAULT_LANGUAGE) {
      return loadLocale(DEFAULT_LANGUAGE);
    }
    return {};
  }
}

/**
 * Initialize i18n with language
 */
export function initI18n(lang = DEFAULT_LANGUAGE) {
  if (!SUPPORTED_LANGUAGES.includes(lang)) {
    console.warn(`Unsupported language: ${lang}, using ${DEFAULT_LANGUAGE}`);
    lang = DEFAULT_LANGUAGE;
  }

  currentLanguage = lang;
  currentLocale = loadLocale(lang);
  return currentLocale;
}

/**
 * Get current language
 */
export function getLanguage() {
  return currentLanguage;
}

/**
 * Set language
 */
export function setLanguage(lang) {
  return initI18n(lang);
}

/**
 * Get translated string by key path (e.g., 'welcome.firstRun')
 */
export function t(keyPath, fallback = '') {
  if (!currentLocale) {
    initI18n(currentLanguage);
  }

  const keys = keyPath.split('.');
  let value = currentLocale;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return fallback || keyPath;
    }
  }

  return typeof value === 'string' ? value : fallback || keyPath;
}

/**
 * Get translated string with interpolation
 * Usage: tf('errors.message', { name: 'John' }) => "Hello John"
 */
export function tf(keyPath, params = {}, fallback = '') {
  let text = t(keyPath, fallback);

  for (const [key, value] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }

  return text;
}

/**
 * Check if language is supported
 */
export function isSupported(lang) {
  return SUPPORTED_LANGUAGES.includes(lang);
}

/**
 * Get language display name
 */
export function getLanguageName(lang) {
  const names = {
    ko: '한국어',
    en: 'English'
  };
  return names[lang] || lang;
}

// Auto-initialize with default language
initI18n(DEFAULT_LANGUAGE);

export default {
  initI18n,
  getLanguage,
  setLanguage,
  t,
  tf,
  isSupported,
  getLanguageName,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE
};
