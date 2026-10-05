import React, { useState, useMemo } from 'react';
import {
  Settings as SettingsIcon,
  Search,
  RotateCcw,
  X,
  Palette,
  Type,
  FileText,
  Check,
  Sparkles,
  ArrowLeft,
  Eye,
  Languages,
  ShieldCheck,
} from 'lucide-react';
import { useSettingsStore, DEFAULT_SETTINGS } from '../../stores/settingsStore';
import { useI18nStore } from '../../stores/i18nStore';
import { LOCALES, getLocaleById } from '../../i18n/locales';
import { THEME_LIST, getThemeById } from '../Editor/extensions/themes/themeDefinitions';
import { CursorBlinking, RenderWhitespaceMode, LineNumbersMode } from '../../types/settings';
import { LocaleId } from '../../types/i18n';
import { smoothScrollElementTo } from '../../services/smoothScrollService';

type SettingsCategory = 'commonlyUsed' | 'language' | 'appearance' | 'editor' | 'files';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, title }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      title={title}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked
          ? 'bg-editor-accent'
          : 'bg-editor-border hover:bg-editor-muted/60'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
};

export const SettingsView: React.FC = () => {
  const { settings, setSetting, resetToDefaults, toggleSettings } = useSettingsStore();
  const { locale, setLocale, t } = useI18nStore();
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('commonlyUsed');
  const [searchQuery, setSearchQuery] = useState('');
  const [languageSearch, setLanguageSearch] = useState('');
  const [isContextMenuLoading, setIsContextMenuLoading] = useState(false);
  const [contextMenuTitle, setContextMenuTitle] = useState('');
  const mainScrollRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI?.getContextMenuStatus) {
      window.electronAPI.getContextMenuStatus().then((status) => {
        if (status.title) setContextMenuTitle(status.title);
        if (status.installed !== settings.contextMenuEnabled) {
          setSetting('contextMenuEnabled', status.installed);
        }
      }).catch(() => {});
    }
  }, []);

  const handleToggleContextMenu = async (enabled: boolean, targetLang?: string) => {
    if (typeof window === 'undefined' || !window.electronAPI) return;
    setIsContextMenuLoading(true);
    const langToUse = targetLang || (settings.contextMenuLanguage === 'app' ? locale : 'auto');
    try {
      if (enabled) {
        const ok = await window.electronAPI.installContextMenu(langToUse);
        if (ok) {
          setSetting('contextMenuEnabled', true);
          const status = await window.electronAPI.getContextMenuStatus();
          if (status.title) setContextMenuTitle(status.title);
        }
      } else {
        const ok = await window.electronAPI.uninstallContextMenu();
        if (ok) {
          setSetting('contextMenuEnabled', false);
          setContextMenuTitle('');
        }
      }
    } finally {
      setIsContextMenuLoading(false);
    }
  };

  const handleChangeContextLang = (newLang: 'auto' | 'app') => {
    setSetting('contextMenuLanguage', newLang);
    if (settings.contextMenuEnabled) {
      handleToggleContextMenu(true, newLang === 'app' ? locale : 'auto');
    }
  };

  const fontOptions = [
    'Cascadia Code',
    'JetBrains Mono',
    'Consolas',
    'Fira Code',
    'Courier New',
    'monospace',
  ];

  const isModified = (key: keyof typeof DEFAULT_SETTINGS) => {
    return settings[key] !== DEFAULT_SETTINGS[key];
  };

  const categories = [
    { id: 'commonlyUsed' as const, label: t('settings.cat.commonlyUsed'), icon: Sparkles },
    { id: 'language' as const, label: t('settings.cat.language'), icon: Languages },
    { id: 'appearance' as const, label: t('settings.cat.appearance'), icon: Palette },
    { id: 'editor' as const, label: t('settings.cat.editor'), icon: Type },
    { id: 'files' as const, label: t('settings.cat.files'), icon: FileText },
  ];

  const currentTheme = getThemeById(settings.theme);
  const currentLocaleInfo = getLocaleById(locale);
  const query = searchQuery.toLowerCase();

  const matchesSearch = (title: string, desc: string, id: string) => {
    if (!query) return true;
    return (
      title.toLowerCase().includes(query) ||
      desc.toLowerCase().includes(query) ||
      id.toLowerCase().includes(query)
    );
  };

  const filteredLocales = useMemo(() => {
    const q = languageSearch.trim().toLowerCase();
    if (!q) return LOCALES;
    return LOCALES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q)
    );
  }, [languageSearch]);

  const handleSelectLocale = (targetLocale: LocaleId) => {
    setLocale(targetLocale);
    setSetting('locale', targetLocale);
    if (settings.contextMenuEnabled && settings.contextMenuLanguage === 'app') {
      handleToggleContextMenu(true, targetLocale);
    }
  };

  return (
    <div className="absolute inset-0 z-30 bg-editor-bg flex flex-col text-editor-text select-none animate-in fade-in duration-150 overflow-hidden">
      <header className="h-12 border-b border-editor-border bg-editor-sidebar px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => toggleSettings(false)}
            title={t('settings.backToEditor')}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-editor-tabActive hover:bg-editor-border text-xs text-editor-text hover:text-editor-accent transition-colors"
          >
            <ArrowLeft size={13} />
            <span>{t('settings.backToEditor')}</span>
          </button>
          <div className="h-4 w-[1px] bg-editor-border" />
          <SettingsIcon size={16} className="text-editor-accent" />
          <h1 className="text-sm font-semibold tracking-wide">{t('settings.title')}</h1>
          <span className="text-xs text-editor-muted">{t('settings.preferences')}</span>

          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-medium transition-all shadow-sm">
            <Check size={11} strokeWidth={2.5} />
            <span>{t('settings.autoSaved')}</span>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-8 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-editor-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('settings.searchPlaceholder')}
            className="w-full bg-editor-tabActive border border-editor-border rounded-md pl-9 pr-8 py-1.5 text-xs text-editor-text placeholder-editor-muted focus:outline-none focus:border-editor-accent transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-editor-muted hover:text-editor-text"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={resetToDefaults}
            title={t('settings.resetAll')}
            className="flex items-center space-x-1.5 px-2.5 py-1 text-xs rounded hover:bg-editor-border text-editor-muted hover:text-editor-text transition-colors"
          >
            <RotateCcw size={13} />
            <span>{t('settings.resetAll')}</span>
          </button>
          <button
            onClick={() => toggleSettings(false)}
            title={t('titlebar.close')}
            className="p-1.5 rounded hover:bg-editor-border text-editor-muted hover:text-editor-text active:scale-95 transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-56 border-r border-editor-border bg-editor-sidebar py-3 flex flex-col space-y-0.5 text-xs flex-shrink-0">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-editor-muted">
            {t('settings.categories')}
          </div>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id && !searchQuery;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSearchQuery('');
                  if (mainScrollRef.current) {
                    smoothScrollElementTo(mainScrollRef.current, 0);
                  }
                }}
                className={`flex items-center space-x-2.5 px-3 py-2 text-left transition-all duration-150 relative ${
                  isActive
                    ? 'bg-editor-tabActive text-editor-text font-medium border-l-2 border-editor-accent pl-3.5 translate-x-0.5 shadow-sm'
                    : 'text-editor-muted hover:bg-editor-border/40 hover:text-editor-text hover:translate-x-0.5'
                }`}
              >
                <Icon size={14} className={`transition-colors duration-150 ${isActive ? 'text-editor-accent' : 'text-editor-muted'}`} />
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}

          <div className="mt-auto p-3 border-t border-editor-border text-[11px] text-editor-muted space-y-2">
            <div className="flex items-center space-x-1.5 text-emerald-400 text-[11px]">
              <ShieldCheck size={13} />
              <span className="font-medium">{t('settings.autoSaved')}</span>
            </div>
            <p className="text-[10px] text-editor-muted/80 leading-snug">
              {t('settings.saveNotice')}
            </p>
            <div className="pt-2 border-t border-editor-border/40">
              <p className="font-semibold text-editor-text/80">{t('settings.hotkeysHint')}</p>
              <p className="mt-0.5 font-mono text-[10px] text-editor-accent">Ctrl+, : {t('settings.title')}</p>
              <p className="font-mono text-[10px] text-editor-accent">Esc : {t('settings.backToEditor')}</p>
            </div>
          </div>
        </nav>

        <main ref={mainScrollRef} className="flex-1 overflow-y-auto px-8 py-6 max-w-4xl space-y-8">
          <div className="rounded-xl border border-editor-border bg-editor-tabActive/30 p-4 shadow-sm transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-editor-border/60">
              <div className="flex items-center space-x-2 text-xs font-semibold">
                <Eye size={15} className="text-editor-accent" />
                <span>{t('settings.preview.title')}</span>
                <span className="text-[10px] text-editor-muted font-normal">{t('settings.preview.realtime')}</span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-editor-muted">
                <span>
                  {t('settings.preview.theme')}: <strong className="text-editor-text">{currentTheme.name}</strong>
                </span>
                <span>•</span>
                <span>
                  {t('settings.preview.font')}: <strong className="text-editor-text">{settings.fontFamily} ({settings.fontSize}px)</strong>
                </span>
                <span>•</span>
                <span>
                  {t('settings.preview.tab')}: <strong className="text-editor-text">{settings.tabSize} {t('settings.tabSize.spaces')}</strong>
                </span>
                <span>•</span>
                <span>
                  <strong className="text-editor-accent">{currentLocaleInfo.flag} {currentLocaleInfo.nativeName}</strong>
                </span>
              </div>
            </div>

            <div
              className="mt-3 rounded-lg border overflow-hidden transition-all duration-200"
              style={{
                backgroundColor: currentTheme.colors.bg,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
                fontFamily: `"${settings.fontFamily}", Consolas, monospace`,
                fontSize: `${settings.fontSize}px`,
                lineHeight: settings.lineHeight,
              }}
            >
              <div className="flex">
                {settings.lineNumbers === 'on' && (
                  <div
                    className="select-none py-2 px-3 text-right border-r flex flex-col font-mono"
                    style={{
                      backgroundColor: currentTheme.colors.bg,
                      borderColor: currentTheme.colors.border,
                      color: currentTheme.colors.muted,
                      fontSize: `${Math.max(10, settings.fontSize - 2)}px`,
                      minWidth: '42px',
                    }}
                  >
                    <span>1</span>
                    <span style={{ color: currentTheme.colors.accent, fontWeight: 600 }}>2</span>
                    <span>3</span>
                    <span>4</span>
                  </div>
                )}

                <div className="flex-1 py-2 overflow-x-auto">
                  <div className="px-3">
                    <span style={{ color: currentTheme.isDark ? '#f43f5e' : '#cf222e', fontWeight: 600 }}>import</span>
                    {' '}&#123; <span style={{ color: currentTheme.isDark ? '#38bdf8' : '#0550ae' }}>FastEditor</span> &#125;{' '}
                    <span style={{ color: currentTheme.isDark ? '#f43f5e' : '#cf222e', fontWeight: 600 }}>from</span>
                    {' '}<span style={{ color: currentTheme.isDark ? '#4ade80' : '#116329' }}>'@hyperedit/core'</span>;
                  </div>

                  <div
                    className="px-3 relative"
                    style={{
                      backgroundColor: settings.highlightActiveLine ? currentTheme.colors.lineHighlight : 'transparent',
                    }}
                  >
                    <span style={{ color: currentTheme.isDark ? '#f43f5e' : '#cf222e', fontWeight: 600 }}>const</span>
                    {' '}<span style={{ color: currentTheme.isDark ? '#82aaff' : '#8250df' }}>editor</span>{' '}
                    = <span style={{ color: currentTheme.isDark ? '#f43f5e' : '#cf222e', fontWeight: 600 }}>new</span>{' '}
                    <span style={{ color: currentTheme.isDark ? '#fb923c' : '#0550ae' }}>FastEditor</span>(&#123;
                    <span
                      className="inline-block w-[2px] h-[1.1em] align-middle ml-0.5"
                      style={{
                        backgroundColor: currentTheme.colors.accent,
                        boxShadow: settings.cursorBlinking === 'smooth' ? `0 0 4px ${currentTheme.colors.accent}` : 'none',
                        animation:
                          settings.cursorBlinking === 'smooth'
                            ? 'cm-smooth-caret 1.1s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                            : settings.cursorBlinking === 'blink'
                            ? 'cm-blink-caret 1s steps(1) infinite'
                            : 'none',
                      }}
                    />
                  </div>

                  <div className="px-3">
                    <span>{' '.repeat(settings.tabSize)}</span>
                    <span style={{ color: currentTheme.colors.muted }}>mode: 'advanced'</span>
                  </div>

                  <div className="px-3">
                    &#125;);
                  </div>
                </div>
              </div>
            </div>
          </div>

          {(searchQuery || activeCategory === 'commonlyUsed' || activeCategory === 'language') &&
            matchesSearch(
              t('settings.displayLanguage.title'),
              `${t('settings.displayLanguage.desc')} language русский english spanish french german китайский корейский японский`,
              'workbench.displayLanguage'
            ) && (
              <section className="space-y-3 relative pl-3">
                {isModified('locale') && (
                  <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-editor-accent rounded-full" title="Modified" />
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Languages size={17} className="text-editor-accent" />
                      <h2 className="text-sm font-semibold">{t('settings.displayLanguage.title')}</h2>
                    </div>
                    <p className="text-xs text-editor-muted mt-0.5">
                      {t('settings.displayLanguage.desc')}
                    </p>
                    <span className="text-[10px] font-mono text-editor-muted/70">workbench.displayLanguage</span>
                  </div>

                  <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-editor-tabActive border border-editor-border text-xs">
                    <span className="text-base">{currentLocaleInfo.flag}</span>
                    <span className="font-semibold text-editor-text">{currentLocaleInfo.nativeName}</span>
                    <span className="text-editor-muted text-[11px]">({currentLocaleInfo.name})</span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <div className="relative w-72">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-editor-muted" />
                    <input
                      type="text"
                      value={languageSearch}
                      onChange={(e) => setLanguageSearch(e.target.value)}
                      placeholder={t('statusbar.searchLanguage')}
                      className="w-full bg-editor-tabActive border border-editor-border rounded px-2.5 pl-8 py-1 text-xs text-editor-text placeholder-editor-muted focus:outline-none focus:border-editor-accent"
                    />
                    {languageSearch && (
                      <button
                        onClick={() => setLanguageSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-editor-muted hover:text-editor-text"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-editor-muted font-mono">
                    {filteredLocales.length} / {LOCALES.length} languages
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pt-1">
                  {filteredLocales.map((lang) => {
                    const isSelected = locale === lang.id;
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => handleSelectLocale(lang.id)}
                        className={`group cursor-pointer rounded-lg border p-2.5 flex items-center justify-between text-left transition-all duration-150 relative ${
                          isSelected
                            ? 'border-editor-accent bg-editor-tabActive ring-1 ring-editor-accent shadow-sm'
                            : 'border-editor-border hover:border-editor-accent/60 bg-editor-tabActive/30 hover:bg-editor-tabActive/70'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                          <span className="text-xl flex-shrink-0 select-none">{lang.flag}</span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-editor-text truncate flex items-center space-x-1">
                              <span>{lang.nativeName}</span>
                              {lang.rtl && (
                                <span className="text-[9px] uppercase px-1 py-0.2 bg-editor-border rounded text-editor-muted">
                                  RTL
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-editor-muted truncate">
                              {lang.name}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-editor-accent text-white flex items-center justify-center flex-shrink-0 ml-2 shadow-sm">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

          {(searchQuery || activeCategory === 'commonlyUsed' || activeCategory === 'appearance') &&
            matchesSearch(t('settings.theme.title'), t('settings.theme.desc'), 'workbench.colorTheme') && (
              <section className="space-y-3 relative pl-3">
                {isModified('theme') && (
                  <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-editor-accent rounded-full" title="Modified" />
                )}
                <div>
                  <h2 className="text-sm font-semibold">{t('settings.theme.title')}</h2>
                  <p className="text-xs text-editor-muted mt-0.5">
                    {t('settings.theme.desc')}
                  </p>
                  <span className="text-[10px] font-mono text-editor-muted/70">workbench.colorTheme</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
                  {THEME_LIST.map((theme) => {
                    const isSelected = settings.theme === theme.id;
                    const preview = getThemeById(theme.id);
                    return (
                      <div
                        key={theme.id}
                        onClick={() => setSetting('theme', theme.id)}
                        className={`group cursor-pointer rounded-lg border p-2.5 flex flex-col justify-between transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden ${
                          isSelected
                            ? 'border-editor-accent ring-2 ring-editor-accent shadow-md'
                            : 'border-editor-border hover:border-editor-accent/60 bg-editor-tabActive/40 hover:bg-editor-tabActive'
                        }`}
                        style={{ backgroundColor: preview.colors.sidebar }}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs truncate" style={{ color: preview.colors.text }}>
                              {theme.name}
                            </span>
                            {isSelected && (
                              <span
                                className="w-4 h-4 rounded-full flex items-center justify-center text-white"
                                style={{ backgroundColor: preview.colors.accent }}
                              >
                                <Check size={10} strokeWidth={3} />
                              </span>
                            )}
                          </div>

                          <div
                            className="h-10 rounded border overflow-hidden p-1.5 flex flex-col justify-between font-mono text-[9px]"
                            style={{
                              backgroundColor: preview.colors.bg,
                              borderColor: preview.colors.border,
                              color: preview.colors.text,
                            }}
                          >
                            <div className="flex items-center space-x-1">
                              <span style={{ color: preview.colors.accent }}>const</span>
                              <span>code</span>
                              <span style={{ color: preview.colors.muted }}>=</span>
                            </div>
                            <div className="flex space-x-1 items-center">
                              <span
                                className="px-1 rounded text-[8px]"
                                style={{ backgroundColor: preview.colors.selection }}
                              >
                                fast
                              </span>
                              <span style={{ color: preview.colors.accent }}>;</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-[10px] mt-2 line-clamp-1" style={{ color: preview.colors.muted }}>
                          {theme.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

          {(searchQuery || activeCategory === 'commonlyUsed' || activeCategory === 'editor') && (
            <>
              {matchesSearch(t('settings.fontFamily.title'), t('settings.fontFamily.desc'), 'editor.fontFamily') && (
                <div className="space-y-2 relative pl-3">
                  {isModified('fontFamily') && (
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-editor-accent rounded-full" />
                  )}
                  <div>
                    <h3 className="text-xs font-semibold">{t('settings.fontFamily.title')}</h3>
                    <p className="text-xs text-editor-muted">{t('settings.fontFamily.desc')}</p>
                    <span className="text-[10px] font-mono text-editor-muted/70">editor.fontFamily</span>
                  </div>
                  <select
                    value={settings.fontFamily}
                    onChange={(e) => setSetting('fontFamily', e.target.value)}
                    className="w-full max-w-md bg-editor-tabActive border border-editor-border rounded px-3 py-1.5 text-xs text-editor-text focus:outline-none focus:border-editor-accent"
                  >
                    {fontOptions.map((font) => (
                      <option key={font} value={font} className="bg-editor-sidebar text-editor-text">
                        {font}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {matchesSearch(t('settings.fontSize.title'), t('settings.fontSize.desc'), 'editor.fontSize') && (
                <div className="space-y-2 relative pl-3">
                  {isModified('fontSize') && (
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-editor-accent rounded-full" />
                  )}
                  <div>
                    <h3 className="text-xs font-semibold">{t('settings.fontSize.title')}</h3>
                    <p className="text-xs text-editor-muted">{t('settings.fontSize.desc')} ({settings.fontSize}px).</p>
                    <span className="text-[10px] font-mono text-editor-muted/70">editor.fontSize</span>
                  </div>
                  <div className="flex items-center space-x-3 max-w-md">
                    <input
                      type="range"
                      min={10}
                      max={26}
                      step={1}
                      value={settings.fontSize}
                      onChange={(e) => setSetting('fontSize', parseInt(e.target.value, 10))}
                      className="flex-1 accent-editor-accent"
                    />
                    <input
                      type="number"
                      min={10}
                      max={26}
                      value={settings.fontSize}
                      onChange={(e) => setSetting('fontSize', parseInt(e.target.value, 10) || 14)}
                      className="w-16 bg-editor-tabActive border border-editor-border rounded px-2 py-1 text-xs text-center focus:outline-none focus:border-editor-accent"
                    />
                  </div>
                </div>
              )}

              {matchesSearch(t('settings.lineHeight.title'), t('settings.lineHeight.desc'), 'editor.lineHeight') && (
                <div className="space-y-2 relative pl-3">
                  {isModified('lineHeight') && (
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-editor-accent rounded-full" />
                  )}
                  <div>
                    <h3 className="text-xs font-semibold">{t('settings.lineHeight.title')}</h3>
                    <p className="text-xs text-editor-muted">{t('settings.lineHeight.desc')} ({settings.lineHeight}).</p>
                    <span className="text-[10px] font-mono text-editor-muted/70">editor.lineHeight</span>
                  </div>
                  <div className="flex items-center space-x-3 max-w-md">
                    <input
                      type="range"
                      min={1.2}
                      max={2.4}
                      step={0.1}
                      value={settings.lineHeight}
                      onChange={(e) => setSetting('lineHeight', parseFloat(e.target.value))}
                      className="flex-1 accent-editor-accent"
                    />
                    <span className="text-xs font-mono w-12 text-center text-editor-muted">
                      {settings.lineHeight.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {(searchQuery || activeCategory === 'commonlyUsed' || activeCategory === 'editor') && (
            <>
              {matchesSearch(t('settings.tabSize.title'), t('settings.tabSize.desc'), 'editor.tabSize') && (
                <div className="space-y-2 relative pl-3">
                  {isModified('tabSize') && (
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-editor-accent rounded-full" />
                  )}
                  <div>
                    <h3 className="text-xs font-semibold">{t('settings.tabSize.title')}</h3>
                    <p className="text-xs text-editor-muted">{t('settings.tabSize.desc')}</p>
                    <span className="text-[10px] font-mono text-editor-muted/70">editor.tabSize</span>
                  </div>
                  <select
                    value={settings.tabSize}
                    onChange={(e) => setSetting('tabSize', parseInt(e.target.value, 10))}
                    className="w-48 bg-editor-tabActive border border-editor-border rounded px-3 py-1.5 text-xs text-editor-text focus:outline-none focus:border-editor-accent"
                  >
                    <option value={2} className="bg-editor-sidebar">2 {t('settings.tabSize.spaces')}</option>
                    <option value={4} className="bg-editor-sidebar">4 {t('settings.tabSize.spaces')}</option>
                    <option value={8} className="bg-editor-sidebar">8 {t('settings.tabSize.spaces')}</option>
                  </select>
                </div>
              )}

              {matchesSearch(t('settings.wordWrap.title'), t('settings.wordWrap.desc'), 'editor.wordWrap') && (
                <div className="flex items-center justify-between max-w-xl p-2.5 -mx-2.5 rounded-lg hover:bg-editor-tabActive/30 transition-colors duration-150 relative pl-3">
                  {isModified('wordWrap') && (
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-editor-accent rounded-full" />
                  )}
                  <div className="cursor-pointer" onClick={() => setSetting('wordWrap', !settings.wordWrap)}>
                    <h3 className="text-xs font-semibold">{t('settings.wordWrap.title')}</h3>
                    <p className="text-xs text-editor-muted">{t('settings.wordWrap.desc')}</p>
                    <span className="text-[10px] font-mono text-editor-muted/70">editor.wordWrap</span>
                  </div>
                  <ToggleSwitch
                    checked={settings.wordWrap}
                    onChange={(checked) => setSetting('wordWrap', checked)}
                    title={t('settings.wordWrap.title')}
                  />
                </div>
              )}

              {matchesSearch(t('settings.minimap.title'), t('settings.minimap.desc'), 'editor.minimap.enabled') && (
                <div className="flex items-center justify-between max-w-xl p-2.5 -mx-2.5 rounded-lg hover:bg-editor-tabActive/30 transition-colors duration-150 relative pl-3">
                  {isModified('minimap') && (
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-editor-accent rounded-full" />
                  )}
                  <div className="cursor-pointer" onClick={() => setSetting('minimap', !settings.minimap)}>
                    <h3 className="text-xs font-semibold">{t('settings.minimap.title')}</h3>
                    <p className="text-xs text-editor-muted">{t('settings.minimap.desc')}</p>
                    <span className="text-[10px] font-mono text-editor-muted/70">editor.minimap.enabled</span>
                  </div>
                  <ToggleSwitch
                    checked={settings.minimap}
                    onChange={(checked) => setSetting('minimap', checked)}
                    title={t('settings.minimap.title')}
                  />
                </div>
              )}

              {matchesSearch(t('settings.cursorBlinking.title'), t('settings.cursorBlinking.desc'), 'editor.cursorBlinking') && (
                <div className="space-y-2 relative pl-3">
                  {isModified('cursorBlinking') && (
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-editor-accent rounded-full" />
                  )}
                  <div>
                    <h3 className="text-xs font-semibold">{t('settings.cursorBlinking.title')}</h3>
                    <p className="text-xs text-editor-muted">{t('settings.cursorBlinking.desc')}</p>
                    <span className="text-[10px] font-mono text-editor-muted/70">editor.cursorBlinking</span>
                  </div>
                  <select
                    value={settings.cursorBlinking}
                    onChange={(e) => setSetting('cursorBlinking', e.target.value as CursorBlinking)}
                    className="w-56 bg-editor-tabActive border border-editor-border rounded px-3 py-1.5 text-xs text-editor-text focus:outline-none focus:border-editor-accent"
                  >
                    <option value="smooth" className="bg-editor-sidebar">{t('settings.cursorBlinking.smooth')}</option>
                    <option value="blink" className="bg-editor-sidebar">{t('settings.cursorBlinking.blink')}</option>
                    <option value="solid" className="bg-editor-sidebar">{t('settings.cursorBlinking.solid')}</option>
                  </select>
                </div>
              )}

              {matchesSearch(t('settings.lineNumbers.title'), t('settings.lineNumbers.desc'), 'editor.lineNumbers') && (
                <div className="space-y-2 relative pl-3">
                  {isModified('lineNumbers') && (
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-editor-accent rounded-full" />
                  )}
                  <div>
                    <h3 className="text-xs font-semibold">{t('settings.lineNumbers.title')}</h3>
                    <p className="text-xs text-editor-muted">{t('settings.lineNumbers.desc')}</p>
                    <span className="text-[10px] font-mono text-editor-muted/70">editor.lineNumbers</span>
                  </div>
                  <select
                    value={settings.lineNumbers}
                    onChange={(e) => setSetting('lineNumbers', e.target.value as LineNumbersMode)}
                    className="w-48 bg-editor-tabActive border border-editor-border rounded px-3 py-1.5 text-xs text-editor-text focus:outline-none focus:border-editor-accent"
                  >
                    <option value="on" className="bg-editor-sidebar">{t('settings.lineNumbers.on')}</option>
                    <option value="off" className="bg-editor-sidebar">{t('settings.lineNumbers.off')}</option>
                  </select>
                </div>
              )}

              {matchesSearch(t('settings.bracketMatching.title'), t('settings.bracketMatching.desc'), 'editor.bracketMatching') && (
                <div className="flex items-center justify-between max-w-xl p-2.5 -mx-2.5 rounded-lg hover:bg-editor-tabActive/30 transition-colors duration-150 relative pl-3">
                  {isModified('bracketMatching') && (
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-editor-accent rounded-full" />
                  )}
                  <div className="cursor-pointer" onClick={() => setSetting('bracketMatching', !settings.bracketMatching)}>
                    <h3 className="text-xs font-semibold">{t('settings.bracketMatching.title')}</h3>
                    <p className="text-xs text-editor-muted">{t('settings.bracketMatching.desc')}</p>
                    <span className="text-[10px] font-mono text-editor-muted/70">editor.bracketMatching</span>
                  </div>
                  <ToggleSwitch
                    checked={settings.bracketMatching}
                    onChange={(checked) => setSetting('bracketMatching', checked)}
                    title={t('settings.bracketMatching.title')}
                  />
                </div>
              )}

              {matchesSearch(t('settings.autoCloseBrackets.title'), t('settings.autoCloseBrackets.desc'), 'editor.autoClosingBrackets') && (
                <div className="flex items-center justify-between max-w-xl p-2.5 -mx-2.5 rounded-lg hover:bg-editor-tabActive/30 transition-colors duration-150 relative pl-3">
                  {isModified('closeBrackets') && (
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-editor-accent rounded-full" />
                  )}
                  <div className="cursor-pointer" onClick={() => setSetting('closeBrackets', !settings.closeBrackets)}>
                    <h3 className="text-xs font-semibold">{t('settings.autoCloseBrackets.title')}</h3>
                    <p className="text-xs text-editor-muted">{t('settings.autoCloseBrackets.desc')}</p>
                    <span className="text-[10px] font-mono text-editor-muted/70">editor.autoClosingBrackets</span>
                  </div>
                  <ToggleSwitch
                    checked={settings.closeBrackets}
                    onChange={(checked) => setSetting('closeBrackets', checked)}
                    title={t('settings.autoCloseBrackets.title')}
                  />
                </div>
              )}

              {matchesSearch(t('settings.activeLine.title'), t('settings.activeLine.desc'), 'editor.renderLineHighlight') && (
                <div className="flex items-center justify-between max-w-xl p-2.5 -mx-2.5 rounded-lg hover:bg-editor-tabActive/30 transition-colors duration-150 relative pl-3">
                  {isModified('highlightActiveLine') && (
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-editor-accent rounded-full" />
                  )}
                  <div className="cursor-pointer" onClick={() => setSetting('highlightActiveLine', !settings.highlightActiveLine)}>
                    <h3 className="text-xs font-semibold">{t('settings.activeLine.title')}</h3>
                    <p className="text-xs text-editor-muted">{t('settings.activeLine.desc')}</p>
                    <span className="text-[10px] font-mono text-editor-muted/70">editor.renderLineHighlight</span>
                  </div>
                  <ToggleSwitch
                    checked={settings.highlightActiveLine}
                    onChange={(checked) => setSetting('highlightActiveLine', checked)}
                    title={t('settings.activeLine.title')}
                  />
                </div>
              )}

              {matchesSearch(t('settings.codeFolding.title'), t('settings.codeFolding.desc'), 'editor.folding') && (
                <div className="flex items-center justify-between max-w-xl p-2.5 -mx-2.5 rounded-lg hover:bg-editor-tabActive/30 transition-colors duration-150 relative pl-3">
                  {isModified('codeFolding') && (
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-editor-accent rounded-full" />
                  )}
                  <div className="cursor-pointer" onClick={() => setSetting('codeFolding', !settings.codeFolding)}>
                    <h3 className="text-xs font-semibold">{t('settings.codeFolding.title')}</h3>
                    <p className="text-xs text-editor-muted">{t('settings.codeFolding.desc')}</p>
                    <span className="text-[10px] font-mono text-editor-muted/70">editor.folding</span>
                  </div>
                  <ToggleSwitch
                    checked={settings.codeFolding}
                    onChange={(checked) => setSetting('codeFolding', checked)}
                    title={t('settings.codeFolding.title')}
                  />
                </div>
              )}

              {matchesSearch(t('settings.colorDecorators.title'), t('settings.colorDecorators.desc'), 'editor.colorDecorators') && (
                <div className="flex items-center justify-between max-w-xl p-2.5 -mx-2.5 rounded-lg hover:bg-editor-tabActive/30 transition-colors duration-150 relative pl-3">
                  {isModified('colorDecorators') && (
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-editor-accent rounded-full" />
                  )}
                  <div className="cursor-pointer" onClick={() => setSetting('colorDecorators', !settings.colorDecorators)}>
                    <h3 className="text-xs font-semibold">{t('settings.colorDecorators.title')}</h3>
                    <p className="text-xs text-editor-muted">{t('settings.colorDecorators.desc')}</p>
                    <span className="text-[10px] font-mono text-editor-muted/70">editor.colorDecorators</span>
                  </div>
                  <ToggleSwitch
                    checked={settings.colorDecorators}
                    onChange={(checked) => setSetting('colorDecorators', checked)}
                    title={t('settings.colorDecorators.title')}
                  />
                </div>
              )}

              {matchesSearch(t('settings.renderWhitespace.title'), t('settings.renderWhitespace.desc'), 'editor.renderWhitespace') && (
                <div className="space-y-2 relative pl-3">
                  {isModified('renderWhitespace') && (
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-editor-accent rounded-full" />
                  )}
                  <div>
                    <h3 className="text-xs font-semibold">{t('settings.renderWhitespace.title')}</h3>
                    <p className="text-xs text-editor-muted">{t('settings.renderWhitespace.desc')}</p>
                    <span className="text-[10px] font-mono text-editor-muted/70">editor.renderWhitespace</span>
                  </div>
                  <select
                    value={settings.renderWhitespace}
                    onChange={(e) => setSetting('renderWhitespace', e.target.value as RenderWhitespaceMode)}
                    className="w-56 bg-editor-tabActive border border-editor-border rounded px-3 py-1.5 text-xs text-editor-text focus:outline-none focus:border-editor-accent"
                  >
                    <option value="none" className="bg-editor-sidebar">{t('settings.renderWhitespace.none')}</option>
                    <option value="all" className="bg-editor-sidebar">{t('settings.renderWhitespace.all')}</option>
                  </select>
                </div>
              )}
            </>
          )}

          {(searchQuery || activeCategory === 'commonlyUsed' || activeCategory === 'files') && (
            <>
              {matchesSearch(t('settings.sessionRestore.title'), t('settings.sessionRestore.desc'), 'files.sessionRestore') && (
                <div className="flex items-center justify-between max-w-xl p-2.5 -mx-2.5 rounded-lg hover:bg-editor-tabActive/30 transition-colors duration-150 relative pl-3">
                  {isModified('sessionRestore') && (
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-editor-accent rounded-full" />
                  )}
                  <div className="cursor-pointer" onClick={() => setSetting('sessionRestore', !settings.sessionRestore)}>
                    <h3 className="text-xs font-semibold">{t('settings.sessionRestore.title')}</h3>
                    <p className="text-xs text-editor-muted">{t('settings.sessionRestore.desc')}</p>
                    <span className="text-[10px] font-mono text-editor-muted/70">files.sessionRestore</span>
                  </div>
                  <ToggleSwitch
                    checked={settings.sessionRestore}
                    onChange={(checked) => setSetting('sessionRestore', checked)}
                    title={t('settings.sessionRestore.title')}
                  />
                </div>
              )}

              {matchesSearch(t('settings.contextMenu.title'), t('settings.contextMenu.desc'), 'system.contextMenu') && (
                <div className="max-w-xl p-2.5 -mx-2.5 rounded-lg hover:bg-editor-tabActive/30 transition-colors duration-150 relative pl-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div
                      className="cursor-pointer flex-1 mr-4"
                      onClick={() => !isContextMenuLoading && handleToggleContextMenu(!settings.contextMenuEnabled)}
                    >
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xs font-semibold">{t('settings.contextMenu.title')}</h3>
                        {settings.contextMenuEnabled ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {contextMenuTitle || t('settings.contextMenu.active')}
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-editor-border text-editor-muted">
                            {t('settings.contextMenu.inactive')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-editor-muted mt-0.5">{t('settings.contextMenu.desc')}</p>
                      <span className="text-[10px] font-mono text-editor-muted/70">system.windowsContextMenu</span>
                    </div>
                    <ToggleSwitch
                      checked={settings.contextMenuEnabled}
                      onChange={(checked) => !isContextMenuLoading && handleToggleContextMenu(checked)}
                      title={t('settings.contextMenu.title')}
                    />
                  </div>

                  {settings.contextMenuEnabled && (
                    <div className="flex items-center space-x-3 pt-2 border-t border-editor-border/40">
                      <span className="text-[11px] text-editor-muted">
                        {t('settings.contextMenu.langLabel') || 'Menu item language:'}
                      </span>
                      <select
                        value={settings.contextMenuLanguage}
                        onChange={(e) => handleChangeContextLang(e.target.value as 'auto' | 'app')}
                        className="bg-editor-tabActive border border-editor-border rounded px-2.5 py-1 text-[11px] text-editor-text focus:outline-none focus:border-editor-accent"
                      >
                        <option value="auto" className="bg-editor-sidebar">
                          {t('settings.contextMenu.langAuto') || 'Match Windows language (Auto)'}
                        </option>
                        <option value="app" className="bg-editor-sidebar">
                          {t('settings.contextMenu.langApp') || 'Match application language'} ({getLocaleById(locale).nativeName})
                        </option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {matchesSearch(t('settings.trimWhitespace.title'), t('settings.trimWhitespace.desc'), 'files.trimTrailingWhitespace') && (
                <div className="flex items-center justify-between max-w-xl p-2.5 -mx-2.5 rounded-lg hover:bg-editor-tabActive/30 transition-colors duration-150 relative pl-3">
                  {isModified('trimTrailingWhitespace') && (
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-editor-accent rounded-full" />
                  )}
                  <div className="cursor-pointer" onClick={() => setSetting('trimTrailingWhitespace', !settings.trimTrailingWhitespace)}>
                    <h3 className="text-xs font-semibold">{t('settings.trimWhitespace.title')}</h3>
                    <p className="text-xs text-editor-muted">{t('settings.trimWhitespace.desc')}</p>
                    <span className="text-[10px] font-mono text-editor-muted/70">files.trimTrailingWhitespace</span>
                  </div>
                  <ToggleSwitch
                    checked={settings.trimTrailingWhitespace}
                    onChange={(checked) => setSetting('trimTrailingWhitespace', checked)}
                    title={t('settings.trimWhitespace.title')}
                  />
                </div>
              )}

              {matchesSearch(t('settings.eol.title'), t('settings.eol.desc'), 'files.eol') && (
                <div className="space-y-2 relative pl-3">
                  {isModified('defaultLineEnding') && (
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-editor-accent rounded-full" />
                  )}
                  <div>
                    <h3 className="text-xs font-semibold">{t('settings.eol.title')}</h3>
                    <p className="text-xs text-editor-muted">{t('settings.eol.desc')}</p>
                    <span className="text-[10px] font-mono text-editor-muted/70">files.eol</span>
                  </div>
                  <select
                    value={settings.defaultLineEnding}
                    onChange={(e) => setSetting('defaultLineEnding', e.target.value as 'LF' | 'CRLF')}
                    className="w-48 bg-editor-tabActive border border-editor-border rounded px-3 py-1.5 text-xs text-editor-text focus:outline-none focus:border-editor-accent"
                  >
                    <option value="LF" className="bg-editor-sidebar">LF (\n) - Unix</option>
                    <option value="CRLF" className="bg-editor-sidebar">CRLF (\r\n) - Windows</option>
                  </select>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
