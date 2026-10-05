import React, { useState, useRef, useEffect } from 'react';
import {
  GitBranch,
  AlertCircle,
  AlertTriangle,
  FileCode,
  Check,
  Search,
  X,
  Code2,
  Bell,
  Tv,
  Terminal as TerminalIcon,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useI18nStore } from '../../stores/i18nStore';
import { useTerminalStore } from '../../stores/terminalStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { NotificationCenter } from '../NotificationCenter/NotificationCenter';
import { editorActions } from '../../services/activeViewService';
import { SupportedLanguage } from '../../types';

interface LanguageOption {
  label: string;
  value: SupportedLanguage;
  extensions: string;
}

const LANGUAGES: LanguageOption[] = [
  { label: 'TypeScript', value: 'typescript', extensions: '.ts, .tsx' },
  { label: 'JavaScript', value: 'javascript', extensions: '.js, .jsx, .mjs, .cjs' },
  { label: 'C#', value: 'csharp', extensions: '.cs, .csx' },
  { label: 'Lua', value: 'lua', extensions: '.lua' },
  { label: 'Python', value: 'python', extensions: '.py, .pyw' },
  { label: 'C++', value: 'cpp', extensions: '.cpp, .cc, .c, .h, .hpp' },
  { label: 'Rust', value: 'rust', extensions: '.rs' },
  { label: 'Java', value: 'java', extensions: '.java' },
  { label: 'Go', value: 'go', extensions: '.go' },
  { label: 'PHP', value: 'php', extensions: '.php, .phtml' },
  { label: 'SQL', value: 'sql', extensions: '.sql' },
  { label: 'HTML', value: 'html', extensions: '.html, .htm' },
  { label: 'CSS', value: 'css', extensions: '.css, .scss, .less' },
  { label: 'JSON', value: 'json', extensions: '.json' },
  { label: 'YAML', value: 'yaml', extensions: '.yaml, .yml' },
  { label: 'XML', value: 'xml', extensions: '.xml, .svg, .xaml' },
  { label: 'Markdown', value: 'markdown', extensions: '.md, .markdown' },
  { label: 'Shell Script', value: 'shell', extensions: '.sh, .bash, .zsh' },
  { label: 'PowerShell', value: 'powershell', extensions: '.ps1, .psm1, .psd1' },
  { label: 'Ruby', value: 'ruby', extensions: '.rb, .rake' },
  { label: 'Swift', value: 'swift', extensions: '.swift' },
  { label: 'Kotlin', value: 'kotlin', extensions: '.kt, .kts' },
  { label: 'Dart', value: 'dart', extensions: '.dart' },
  { label: 'R', value: 'r', extensions: '.r, .R' },
  { label: 'Dockerfile', value: 'dockerfile', extensions: 'Dockerfile, .dockerfile' },
  { label: 'TOML', value: 'toml', extensions: '.toml' },
  { label: 'CMake', value: 'cmake', extensions: 'CMakeLists.txt, .cmake' },
  { label: 'Diff', value: 'diff', extensions: '.diff, .patch' },
  { label: 'INI / Config', value: 'ini', extensions: '.ini, .cfg, .conf, .reg, .inf, .env' },
  { label: 'Batch Script', value: 'bat', extensions: '.bat, .cmd' },
  { label: 'VBScript', value: 'vbscript', extensions: '.vbs' },
  { label: 'Plain Text', value: 'plaintext', extensions: '.txt, .log' },
];

export const StatusBar: React.FC = () => {
  const { tabs, activeTabId, setLanguage, setLineEnding, cursorPosition } = useEditorStore();
  const { settings, setSetting } = useSettingsStore();
  const { t } = useI18nStore();
  const { isConsoleOpen, isTerminalOpen, toggleConsole, toggleTerminal } = useTerminalStore();
  const { notifications, isOpen: isNotifOpen, toggleOpen: toggleNotif } = useNotificationStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const [selectedLangIndex, setSelectedLangIndex] = useState(0);
  const langInputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const currentLang = activeTab?.language || 'plaintext';
  const currentLangObj = LANGUAGES.find((l) => l.value === currentLang) || LANGUAGES[0];

  const diag = activeTab?.diagnostics || { errors: 0, warnings: 0 };
  const hasErrors = diag.errors > 0;
  const hasWarnings = diag.warnings > 0;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredLanguages = LANGUAGES.filter(
    (l) =>
      l.label.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.value.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.extensions.toLowerCase().includes(langSearch.toLowerCase())
  );

  useEffect(() => {
    if (isLangModalOpen) {
      setLangSearch('');
      const activeIdx = filteredLanguages.findIndex((l) => l.value === currentLang);
      setSelectedLangIndex(activeIdx >= 0 ? activeIdx : 0);
      setTimeout(() => langInputRef.current?.focus(), 50);
    }
  }, [isLangModalOpen]);

  useEffect(() => {
    setSelectedLangIndex(0);
  }, [langSearch]);

  const handleLangKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsLangModalOpen(false);
      editorActions.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedLangIndex((prev) => (prev + 1) % Math.max(1, filteredLanguages.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedLangIndex((prev) => (prev - 1 + filteredLanguages.length) % Math.max(1, filteredLanguages.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredLanguages[selectedLangIndex];
      if (selected) {
        setLanguage(selected.value);
        setIsLangModalOpen(false);
        editorActions.focus();
      }
    }
  };

  const handleCycleTabSize = () => {
    const nextSize = settings.tabSize === 2 ? 4 : settings.tabSize === 4 ? 8 : 2;
    setSetting('tabSize', nextSize);
  };

  const handleToggleLineEnding = () => {
    const current = activeTab?.lineEnding || 'LF';
    setLineEnding(current === 'LF' ? 'CRLF' : 'LF');
  };

  return (
    <>
      <footer className="h-6 bg-editor-sidebar border-t border-editor-border flex items-center justify-between px-2 text-[11px] text-editor-muted select-none font-sans z-20">
        <div className="flex items-center space-x-1">
          <div
            className="flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-editor-tabActive hover:text-editor-text cursor-pointer transition-colors"
            title="Source Control (Git: main branch)"
          >
            <GitBranch size={11} className="text-editor-accent" />
            <span className="font-mono text-[10px]">main</span>
          </div>

          <button
            onClick={() => editorActions.nextDiagnostic()}
            className="flex items-center space-x-1.5 px-1.5 py-0.5 rounded hover:bg-editor-tabActive hover:text-editor-text cursor-pointer transition-colors group"
            title={`${diag.errors} Error${diag.errors === 1 ? '' : 's'}, ${diag.warnings} Warning${diag.warnings === 1 ? '' : 's'} (Click to jump to next)`}
          >
            {hasErrors && (
              <div className="flex items-center space-x-1 text-red-400">
                <AlertCircle size={11} className="text-red-400" />
                <span className="font-mono text-[10px] font-semibold">{diag.errors}</span>
              </div>
            )}

            {hasWarnings && (
              <div className="flex items-center space-x-1 text-amber-400">
                <AlertTriangle size={11} className="text-amber-400" />
                <span className="font-mono text-[10px] font-semibold">{diag.warnings}</span>
              </div>
            )}

            {!hasErrors && !hasWarnings && (
              <div className="flex items-center space-x-1 text-emerald-400">
                <Check size={11} className="text-emerald-400" />
                <span className="font-mono text-[10px]">0</span>
              </div>
            )}
          </button>

          <div className="h-3 w-[1px] bg-editor-border mx-0.5" />

          <button
            onClick={() => editorActions.gotoLine()}
            className="px-1.5 py-0.5 rounded hover:bg-editor-tabActive hover:text-editor-text text-editor-muted cursor-pointer transition-colors font-mono text-[10px]"
            title="Go to Line/Column (Ctrl+G)"
          >
            {t('statusbar.line')} {cursorPosition.line}, {t('statusbar.col')} {cursorPosition.column}
          </button>

          {cursorPosition.selectionLength > 0 && (
            <span className="text-editor-accent font-mono text-[10px] px-1 py-0.5 rounded bg-editor-accent/10">
              ({cursorPosition.selectionLength} {t('statusbar.selected')})
            </span>
          )}

          <div className="h-3 w-[1px] bg-editor-border mx-0.5" />

          <span className="px-1.5 py-0.5 text-editor-muted font-mono text-[10px]" title="File Size">
            {formatBytes(activeTab?.sizeBytes || 0)}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleCycleTabSize}
            className="px-1.5 py-0.5 rounded hover:bg-editor-tabActive hover:text-editor-text text-editor-muted cursor-pointer transition-colors font-mono text-[10px]"
            title={`${t('statusbar.spaces')}: ${settings.tabSize}. Click to cycle (2, 4, 8)`}
          >
            {t('statusbar.spaces')}: {settings.tabSize}
          </button>

          <div className="h-3 w-[1px] bg-editor-border mx-0.5" />

          <span
            className="px-1.5 py-0.5 rounded hover:bg-editor-tabActive hover:text-editor-text text-editor-muted cursor-default transition-colors font-mono text-[10px]"
            title={t('statusbar.encoding')}
          >
            {activeTab?.encoding || 'UTF-8'}
          </span>

          <div className="h-3 w-[1px] bg-editor-border mx-0.5" />

          <button
            onClick={handleToggleLineEnding}
            className="px-1.5 py-0.5 rounded hover:bg-editor-tabActive hover:text-editor-text text-editor-muted cursor-pointer transition-colors font-mono text-[10px]"
            title={`${t('statusbar.eol')}: ${activeTab?.lineEnding || 'LF'}. Click to toggle LF / CRLF`}
          >
            {activeTab?.lineEnding || 'LF'}
          </button>

          <div className="h-3 w-[1px] bg-editor-border mx-0.5" />

          <button
            onClick={() => setIsLangModalOpen(true)}
            className="flex items-center space-x-1.5 px-2 py-0.5 rounded hover:bg-editor-tabActive text-editor-muted hover:text-editor-text cursor-pointer transition-colors"
            title={t('statusbar.selectLanguage')}
          >
            <Code2 size={12} className="text-editor-accent" />
            <span className="font-medium text-[11px] text-editor-text">{currentLangObj.label}</span>
          </button>

          <div className="h-3 w-[1px] bg-editor-border mx-0.5" />

          <button
            onClick={() => toggleConsole()}
            className={`flex items-center space-x-1 px-1.5 py-0.5 rounded cursor-pointer transition-colors font-sans text-[10px] ${
              isConsoleOpen
                ? 'bg-editor-accent/20 text-editor-accent font-medium'
                : 'hover:bg-editor-tabActive text-editor-muted hover:text-editor-text'
            }`}
            title={t('titlebar.console')}
          >
            <Tv size={11} className={isConsoleOpen ? 'text-editor-accent' : 'text-editor-muted'} />
            <span className="hidden sm:inline">{t('bottompanel.console')}</span>
          </button>

          <button
            onClick={() => toggleTerminal()}
            className={`flex items-center space-x-1 px-1.5 py-0.5 rounded cursor-pointer transition-colors font-sans text-[10px] ${
              isTerminalOpen
                ? 'bg-editor-accent/20 text-editor-accent font-medium'
                : 'hover:bg-editor-tabActive text-editor-muted hover:text-editor-text'
            }`}
            title={t('titlebar.terminal')}
          >
            <TerminalIcon size={11} className={isTerminalOpen ? 'text-editor-accent' : 'text-editor-muted'} />
            <span className="hidden sm:inline">{t('bottompanel.terminal')}</span>
          </button>

          <button
            data-notification-toggle="true"
            onClick={() => toggleNotif()}
            className={`relative p-1 rounded cursor-pointer transition-colors ml-0.5 ${
              isNotifOpen
                ? 'bg-editor-accent/20 text-editor-accent'
                : 'hover:bg-editor-tabActive text-editor-muted hover:text-editor-text'
            }`}
            title={t('statusbar.notifications')}
          >
            <Bell size={11} />
            {unreadCount > 0 && (
              <span className="absolute 0 top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-editor-accent" />
            )}
          </button>
        </div>
      </footer>

      {isLangModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-14 animate-in fade-in duration-100"
          onClick={() => setIsLangModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-editor-sidebar border border-editor-border shadow-2xl shadow-black/80 rounded-lg overflow-hidden flex flex-col transform animate-smooth-down"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center px-3.5 py-2.5 border-b border-editor-border bg-editor-sidebar">
              <Search size={15} className="text-editor-muted mr-2 flex-shrink-0" />
              <input
                ref={langInputRef}
                type="text"
                value={langSearch}
                onChange={(e) => setLangSearch(e.target.value)}
                onKeyDown={handleLangKeyDown}
                placeholder={t('statusbar.searchLanguage')}
                className="flex-1 bg-transparent text-xs text-editor-text placeholder-editor-muted focus:outline-none font-sans"
              />
              <span className="text-[10px] text-editor-muted font-mono bg-editor-border/50 px-1.5 py-0.5 rounded">
                Esc
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto py-1">
              {filteredLanguages.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-editor-muted">
                  {t('statusbar.noLanguages')}
                </div>
              ) : (
                filteredLanguages.map((lang, index) => {
                  const isSelected = index === selectedLangIndex;
                  const isActive = lang.value === currentLang;

                  return (
                    <div
                      key={lang.value}
                      onClick={() => {
                        setLanguage(lang.value);
                        setIsLangModalOpen(false);
                        editorActions.focus();
                      }}
                      onMouseEnter={() => setSelectedLangIndex(index)}
                      className={`flex items-center justify-between px-3.5 py-2 text-xs cursor-pointer transition-all duration-150 relative ${
                        isSelected
                          ? 'bg-editor-accent/20 text-editor-text font-medium border-l-2 border-editor-accent pl-3.5'
                          : 'text-editor-text hover:bg-editor-tabActive hover:pl-4'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <FileCode
                          size={14}
                          className={isActive ? 'text-editor-accent' : isSelected ? 'text-editor-accent' : 'text-editor-muted'}
                        />
                        <span className={isActive ? 'font-semibold text-editor-accent' : ''}>
                          {lang.label}
                        </span>
                        <span className="text-[10px] text-editor-muted font-mono">
                          ({lang.extensions})
                        </span>
                      </div>

                      {isActive && (
                        <div className="flex items-center text-editor-accent" title="Currently Active">
                          <Check size={14} strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <NotificationCenter />
    </>
  );
};
