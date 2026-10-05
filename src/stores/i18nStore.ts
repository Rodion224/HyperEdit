import { create } from 'zustand';
import { LocaleId, TranslationDictionary } from '../types/i18n';
import { TRANSLATIONS, enTranslations } from '../i18n/translations';
import { getLocaleById } from '../i18n/locales';

const LOCALE_STORAGE_KEY = 'hyperedit_locale_v1';

function detectInitialLocale(): LocaleId {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && TRANSLATIONS[saved as LocaleId]) {
      return saved as LocaleId;
    }

    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('ru')) return 'ru';
      if (browserLang.startsWith('uk')) return 'uk';
      if (browserLang.startsWith('be')) return 'be';
      if (browserLang.startsWith('kk')) return 'kk';
      if (browserLang.startsWith('es')) return 'es';
      if (browserLang.startsWith('fr')) return 'fr';
      if (browserLang.startsWith('de')) return 'de';
      if (browserLang.startsWith('zh-tw') || browserLang.startsWith('zh-hk')) return 'zh-tw';
      if (browserLang.startsWith('zh')) return 'zh-cn';
      if (browserLang.startsWith('ja')) return 'ja';
      if (browserLang.startsWith('ko')) return 'ko';
      if (browserLang.startsWith('it')) return 'it';
      if (browserLang.startsWith('pt-br')) return 'pt-br';
      if (browserLang.startsWith('pt')) return 'pt-pt';
      if (browserLang.startsWith('pl')) return 'pl';
      if (browserLang.startsWith('tr')) return 'tr';
      if (browserLang.startsWith('ar')) return 'ar';
    }
  } catch (e) {}
  return 'ru';
}

interface I18nState {
  locale: LocaleId;
  setLocale: (locale: LocaleId) => void;
  t: (key: keyof TranslationDictionary, fallback?: string) => string;
}

const initialLocale = detectInitialLocale();

if (typeof document !== 'undefined') {
  const info = getLocaleById(initialLocale);
  document.documentElement.lang = initialLocale;
  document.documentElement.dir = info.rtl ? 'rtl' : 'ltr';
}

export const useI18nStore = create<I18nState>((set, get) => ({
  locale: initialLocale,

  setLocale: (locale) => {
    set({ locale });
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch (e) {
      console.warn('Failed to save locale preference:', e);
    }

    if (typeof document !== 'undefined') {
      const info = getLocaleById(locale);
      document.documentElement.lang = locale;
      document.documentElement.dir = info.rtl ? 'rtl' : 'ltr';
    }
  },

  t: (key, fallback) => {
    const { locale } = get();
    const dict = TRANSLATIONS[locale] || TRANSLATIONS.en;
    if (dict && dict[key]) {
      return dict[key];
    }
    if (enTranslations[key]) {
      return enTranslations[key];
    }
    return fallback || String(key);
  },
}));
