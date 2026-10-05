import { create } from 'zustand';
import { EditorSettings, ThemeId } from '../types/settings';
import { LocaleId } from '../types/i18n';
import { useI18nStore } from './i18nStore';
import { applyThemeToDOM, applyTypographyToDOM } from '../components/Editor/extensions/themes/themeDefinitions';

const SETTINGS_STORAGE_KEY = 'hyperedit_settings_v1';

export const DEFAULT_SETTINGS: EditorSettings = {
  locale: 'ru',
  theme: 'dark',
  fontSize: 14,
  fontFamily: 'Cascadia Code',
  lineHeight: 1.6,
  cursorBlinking: 'smooth',

  tabSize: 2,
  insertSpaces: true,
  wordWrap: false,
  minimap: true,
  lineNumbers: 'on',
  bracketMatching: true,
  closeBrackets: true,
  highlightActiveLine: true,
  renderWhitespace: 'none',
  codeFolding: true,
  colorDecorators: true,

  sessionRestore: true,
  trimTrailingWhitespace: false,
  defaultLineEnding: 'LF',

  contextMenuEnabled: true,
  contextMenuLanguage: 'auto',
};

function loadSettings(): EditorSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const activeLocale = useI18nStore.getState().locale;
    if (!raw) return { ...DEFAULT_SETTINGS, locale: activeLocale };
    const parsed = JSON.parse(raw);
    const loaded = { ...DEFAULT_SETTINGS, locale: activeLocale, ...parsed };
    if (loaded.renderWhitespace === 'selection') {
      loaded.renderWhitespace = 'none';
    }
    return loaded;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

function persistSettings(settings: EditorSettings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings to localStorage:', e);
  }

  if (typeof window !== 'undefined' && window.electronAPI?.saveSettings) {
    window.electronAPI.saveSettings(settings).catch((e) => {
      console.warn('Failed to save settings to disk:', e);
    });
  }
}

interface SettingsState {
  settings: EditorSettings;
  isSettingsOpen: boolean;
  lastSavedTime: number | null;

  setSetting: <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => void;
  mergeSettings: (newSettings: Partial<EditorSettings>) => void;
  setTheme: (theme: ThemeId) => void;
  toggleWordWrap: () => void;
  toggleMinimap: () => void;
  resetToDefaults: () => void;
  toggleSettings: (open?: boolean) => void;
}

const initialSettings = loadSettings();

if (typeof window !== 'undefined') {
  applyThemeToDOM(initialSettings.theme);
  applyTypographyToDOM(initialSettings);

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    const current = useSettingsStore.getState().settings.theme;
    if (current === 'system') {
      applyThemeToDOM('system');
    }
  });
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: initialSettings,
  isSettingsOpen: false,
  lastSavedTime: null,

  setSetting: (key, value) => {
    const updated = { ...get().settings, [key]: value };
    set({ settings: updated, lastSavedTime: Date.now() });
    persistSettings(updated);

    if (key === 'theme') {
      applyThemeToDOM(value as ThemeId);
    }

    if (key === 'locale') {
      useI18nStore.getState().setLocale(value as LocaleId);
    }

    if (
      key === 'fontSize' ||
      key === 'fontFamily' ||
      key === 'lineHeight' ||
      key === 'cursorBlinking'
    ) {
      applyTypographyToDOM(updated);
    }
  },

  mergeSettings: (newSettings) => {
    const current = get().settings;
    const updated = { ...current, ...newSettings };
    set({ settings: updated, lastSavedTime: Date.now() });
    persistSettings(updated);

    if (newSettings.theme) {
      applyThemeToDOM(newSettings.theme);
    }
    if (newSettings.locale) {
      useI18nStore.getState().setLocale(newSettings.locale);
    }
    applyTypographyToDOM(updated);
  },

  setTheme: (theme) => {
    get().setSetting('theme', theme);
  },

  toggleWordWrap: () => {
    get().setSetting('wordWrap', !get().settings.wordWrap);
  },

  toggleMinimap: () => {
    get().setSetting('minimap', !get().settings.minimap);
  },

  resetToDefaults: () => {
    set({ settings: DEFAULT_SETTINGS, lastSavedTime: Date.now() });
    persistSettings(DEFAULT_SETTINGS);
    applyThemeToDOM(DEFAULT_SETTINGS.theme);
    applyTypographyToDOM(DEFAULT_SETTINGS);
    useI18nStore.getState().setLocale(DEFAULT_SETTINGS.locale);
  },

  toggleSettings: (open) => {
    set((state) => ({
      isSettingsOpen: open !== undefined ? open : !state.isSettingsOpen,
    }));
  },
}));

if (typeof window !== 'undefined' && window.electronAPI?.loadSettings) {
  window.electronAPI.loadSettings().then((diskSettings) => {
    if (diskSettings && typeof diskSettings === 'object' && Object.keys(diskSettings).length > 0) {
      useSettingsStore.getState().mergeSettings(diskSettings);
    }
  }).catch((err) => {
    console.warn('Failed to load settings from disk:', err);
  });
}
