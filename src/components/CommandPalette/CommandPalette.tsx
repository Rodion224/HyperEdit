import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  ArrowRight,
  FileCode,
  Palette,
  Settings,
  Files,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useI18nStore } from '../../stores/i18nStore';
import { THEME_LIST } from '../Editor/extensions/themes/themeDefinitions';
import { openLocalFile, saveFileToDisk } from '../../services/fileService';
import { editorActions } from '../../services/activeViewService';
import { CommandItem, SupportedLanguage } from '../../types';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    toggleCommandPalette,
    openNewTab,
    openFileTab,
    tabs,
    activeTabId,
    markSaved,
    closeTab,
    toggleSidebar,
    setLanguage,
    switchToNextTab,
    switchToPreviousTab,
    closeOtherTabs,
    closeTabsToTheRight,
    closeTabsToTheLeft,
    closeSavedTabs,
    closeAllTabs,
    reopenClosedTab,
    duplicateTab,
  } = useEditorStore();

  const { toggleSettings, setTheme, toggleWordWrap, toggleMinimap } = useSettingsStore();
  const { t } = useI18nStore();

  const [query, setQuery] = useState('>');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const commands: CommandItem[] = [
    {
      id: 'file-quick-open',
      title: 'Go to File (Quick Open)',
      shortcut: 'Ctrl+P',
      category: t('palette.cat.file'),
      action: () => useWorkspaceStore.getState().toggleQuickOpen(true),
    },
    {
      id: 'file-open-folder',
      title: 'Open Folder / Workspace...',
      shortcut: 'Ctrl+K Ctrl+O',
      category: t('palette.cat.file'),
      action: () => useWorkspaceStore.getState().openFolder(),
    },
    {
      id: 'file-new',
      title: t('palette.cmd.newFile'),
      shortcut: 'Ctrl+N',
      category: t('palette.cat.file'),
      action: () => openNewTab(),
    },
    {
      id: 'file-open',
      title: t('palette.cmd.openFile'),
      shortcut: 'Ctrl+O',
      category: t('palette.cat.file'),
      action: async () => {
        const file = await openLocalFile();
        if (file) openFileTab(file);
      },
    },
    {
      id: 'file-save',
      title: t('palette.cmd.saveFile'),
      shortcut: 'Ctrl+S',
      category: t('palette.cat.file'),
      action: async () => {
        if (!activeTab) return;
        const result = await saveFileToDisk(
          activeTab.content,
          activeTab.fileHandle,
          activeTab.title,
          activeTab.filePath
        );
        if (result) markSaved(activeTab.id, result.handle, result.filePath);
      },
    },
    {
      id: 'file-save-as',
      title: t('palette.cmd.saveAs'),
      shortcut: 'Ctrl+Shift+S',
      category: t('palette.cat.file'),
      action: async () => {
        if (!activeTab) return;
        const result = await saveFileToDisk(
          activeTab.content,
          undefined,
          activeTab.title,
          undefined
        );
        if (result) markSaved(activeTab.id, result.handle, result.filePath);
      },
    },

    {
      id: 'edit-find',
      title: t('palette.cmd.find'),
      shortcut: 'Ctrl+F',
      category: t('palette.cat.find'),
      action: () => editorActions.find(),
    },
    {
      id: 'edit-replace',
      title: t('palette.cmd.replace'),
      shortcut: 'Ctrl+H',
      category: t('palette.cat.find'),
      action: () => editorActions.replace(),
    },
    {
      id: 'edit-toggle-comment',
      title: t('palette.cmd.toggleComment'),
      shortcut: 'Ctrl+/',
      category: t('palette.cat.edit'),
      action: () => editorActions.toggleComment(),
    },
    {
      id: 'edit-select-next',
      title: t('palette.cmd.selectNext'),
      shortcut: 'Ctrl+D',
      category: t('palette.cat.edit'),
      action: () => editorActions.selectNextOccurrence(),
    },
    {
      id: 'edit-goto-line',
      title: t('palette.cmd.gotoLine'),
      shortcut: 'Ctrl+G',
      category: t('palette.cat.edit'),
      action: () => editorActions.gotoLine(),
    },
    {
      id: 'edit-select-all',
      title: t('palette.cmd.selectAll'),
      shortcut: 'Ctrl+A',
      category: t('palette.cat.edit'),
      action: () => editorActions.selectAll(),
    },
    {
      id: 'edit-undo',
      title: t('palette.cmd.undo'),
      shortcut: 'Ctrl+Z',
      category: t('palette.cat.edit'),
      action: () => editorActions.undo(),
    },
    {
      id: 'edit-redo',
      title: t('palette.cmd.redo'),
      shortcut: 'Ctrl+Y',
      category: t('palette.cat.edit'),
      action: () => editorActions.redo(),
    },

    {
      id: 'view-next-tab',
      title: t('palette.cmd.nextTab'),
      shortcut: 'Ctrl+Tab',
      category: t('palette.cat.view'),
      action: () => switchToNextTab(),
    },
    {
      id: 'view-prev-tab',
      title: t('palette.cmd.prevTab'),
      shortcut: 'Ctrl+Shift+Tab',
      category: t('palette.cat.view'),
      action: () => switchToPreviousTab(),
    },
    {
      id: 'tab-close',
      title: t('palette.cmd.closeTab'),
      shortcut: 'Ctrl+W',
      category: t('palette.cat.view'),
      action: () => {
        if (activeTab) closeTab(activeTab.id);
      },
    },
    {
      id: 'tab-reopen',
      title: t('tabmenu.reopenClosed'),
      shortcut: 'Ctrl+Shift+T',
      category: t('palette.cat.view'),
      action: () => reopenClosedTab(),
    },
    {
      id: 'tab-close-others',
      title: t('tabmenu.closeOthers'),
      category: t('palette.cat.view'),
      action: () => {
        if (activeTab) closeOtherTabs(activeTab.id);
      },
    },
    {
      id: 'tab-close-right',
      title: t('tabmenu.closeRight'),
      category: t('palette.cat.view'),
      action: () => {
        if (activeTab) closeTabsToTheRight(activeTab.id);
      },
    },
    {
      id: 'tab-close-saved',
      title: t('tabmenu.closeSaved'),
      category: t('palette.cat.view'),
      action: () => closeSavedTabs(),
    },
    {
      id: 'tab-close-all',
      title: t('tabmenu.closeAll'),
      category: t('palette.cat.view'),
      action: () => closeAllTabs(),
    },
    {
      id: 'tab-duplicate',
      title: t('tabmenu.duplicate'),
      category: t('palette.cat.view'),
      action: () => {
        if (activeTab) duplicateTab(activeTab.id);
      },
    },
    {
      id: 'view-sidebar',
      title: t('palette.cmd.toggleSidebar'),
      shortcut: 'Ctrl+B',
      category: t('palette.cat.view'),
      action: () => toggleSidebar(),
    },
    {
      id: 'view-word-wrap',
      title: t('palette.cmd.toggleWordWrap'),
      category: t('palette.cat.view'),
      action: () => toggleWordWrap(),
    },
    {
      id: 'view-minimap',
      title: t('palette.cmd.toggleMinimap'),
      category: t('palette.cat.view'),
      action: () => toggleMinimap(),
    },

    {
      id: 'pref-settings',
      title: t('palette.cmd.openSettings'),
      shortcut: 'Ctrl+,',
      category: t('palette.cat.preferences'),
      action: () => toggleSettings(true),
    },
    {
      id: 'pref-display-language',
      title: t('palette.cmd.changeDisplayLanguage'),
      category: t('palette.cat.preferences'),
      action: () => toggleSettings(true),
    },

    ...THEME_LIST.map((theme) => ({
      id: `theme-${theme.id}`,
      title: `${t('palette.cmd.colorTheme')}: ${theme.name}`,
      category: t('palette.cat.themes'),
      action: () => setTheme(theme.id),
    })),

    ...([
      ['TypeScript', 'typescript'],
      ['JavaScript', 'javascript'],
      ['C#', 'csharp'],
      ['Lua', 'lua'],
      ['Python', 'python'],
      ['C++', 'cpp'],
      ['Rust', 'rust'],
      ['Java', 'java'],
      ['Go', 'go'],
      ['PHP', 'php'],
      ['SQL', 'sql'],
      ['HTML', 'html'],
      ['CSS', 'css'],
      ['JSON', 'json'],
      ['YAML', 'yaml'],
      ['XML', 'xml'],
      ['Markdown', 'markdown'],
      ['Shell Script', 'shell'],
      ['PowerShell', 'powershell'],
      ['Ruby', 'ruby'],
      ['Swift', 'swift'],
      ['Kotlin', 'kotlin'],
      ['Dart', 'dart'],
      ['R', 'r'],
      ['Dockerfile', 'dockerfile'],
      ['TOML', 'toml'],
      ['CMake', 'cmake'],
      ['Diff', 'diff'],
      ['INI / Config', 'ini'],
      ['Plain Text', 'plaintext'],
    ] as [string, SupportedLanguage][]).map(([name, lang]) => ({
      id: `lang-${lang}`,
      title: `${t('palette.cmd.changeLanguage')}: ${name}`,
      category: t('palette.cat.language'),
      action: () => setLanguage(lang),
    })),
  ];

  const cleanQuery = query.startsWith('>') ? query.slice(1).trim().toLowerCase() : query.trim().toLowerCase();

  const filtered = commands.filter((c) => {
    if (!cleanQuery) return true;
    const fullText = `${c.category}: ${c.title}`.toLowerCase();
    return fullText.includes(cleanQuery) || c.title.toLowerCase().includes(cleanQuery);
  });

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('>');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(1, 1);
      }, 50);
    }
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isCommandPaletteOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      toggleCommandPalette(false);
      editorActions.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filtered[selectedIndex];
      if (selected) {
        selected.action();
        toggleCommandPalette(false);
        editorActions.focus();
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    if (category === t('palette.cat.file') || category === 'File') {
      return <Files size={13} className="text-editor-accent" />;
    }
    if (category === t('palette.cat.themes') || category === 'Themes') {
      return <Palette size={13} className="text-purple-400" />;
    }
    if (category === t('palette.cat.preferences') || category === 'Preferences') {
      return <Settings size={13} className="text-editor-accent" />;
    }
    if (category === t('palette.cat.language') || category === 'Language') {
      return <FileCode size={13} className="text-amber-400" />;
    }
    if (
      category === t('palette.cat.find') ||
      category === t('palette.cat.edit') ||
      category === 'Find' ||
      category === 'Edit'
    ) {
      return <Terminal size={13} className="text-emerald-400" />;
    }
    return <Sparkles size={13} className="text-editor-accent" />;
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-12 animate-in fade-in duration-100"
      onClick={() => toggleCommandPalette(false)}
    >
      <div
        className="w-full max-w-2xl bg-editor-sidebar border border-editor-border shadow-2xl shadow-black/80 rounded-lg overflow-hidden flex flex-col transform animate-smooth-down"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-2.5 border-b border-editor-border bg-editor-sidebar">
          <ChevronRight size={17} className="text-editor-accent mr-2.5 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('palette.placeholder')}
            className="flex-1 bg-transparent text-sm text-editor-text placeholder-editor-muted focus:outline-none font-sans"
          />
          <div className="flex items-center space-x-1.5 text-[11px] text-editor-muted font-mono">
            <kbd className="px-1.5 py-0.5 rounded bg-editor-border/60 text-editor-muted border border-editor-border">
              Esc
            </kbd>
            <span className="text-[10px]">{t('palette.escToClose')}</span>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-editor-muted">
              {t('palette.noCommands')}
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  ref={isSelected ? selectedItemRef : undefined}
                  onClick={() => {
                    item.action();
                    toggleCommandPalette(false);
                    editorActions.focus();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-4 py-2 text-xs cursor-pointer transition-all duration-150 relative ${
                    isSelected
                      ? 'bg-editor-accent/20 text-editor-text font-medium border-l-2 border-editor-accent pl-4'
                      : 'text-editor-text hover:bg-editor-tabActive/60 hover:pl-4.5'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="flex-shrink-0">{getCategoryIcon(item.category)}</span>
                    <span className="text-editor-muted/80 text-[11px] font-semibold tracking-wide uppercase">
                      {item.category}:
                    </span>
                    <span className="truncate">{item.title}</span>
                  </div>

                  <div className="flex items-center space-x-2.5 font-mono text-[11px] flex-shrink-0 ml-3">
                    {item.shortcut && (
                      <kbd className="px-2 py-0.5 rounded bg-editor-tabActive border border-editor-border text-editor-muted text-[10px] shadow-sm">
                        {item.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <ArrowRight size={13} className="text-editor-accent animate-in fade-in" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
