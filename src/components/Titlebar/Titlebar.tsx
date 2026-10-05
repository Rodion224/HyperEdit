import React, { useState, useEffect } from 'react';
import {
  FilePlus,
  FolderOpen,
  FolderTree,
  Save,
  Terminal,
  PanelLeftClose,
  PanelLeft,
  WrapText,
  Map,
  Minus,
  Square,
  X,
  Copy,
  Settings,
  Search,
  Play,
  Loader2,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useTerminalStore } from '../../stores/terminalStore';
import { useI18nStore } from '../../stores/i18nStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { openLocalFile, saveFileToDisk } from '../../services/fileService';
import appLogo from '../../assets/icon.png';

export const Titlebar: React.FC = () => {
  const { toggleSettings, isSettingsOpen, settings, toggleWordWrap, toggleMinimap } = useSettingsStore();
  const { t } = useI18nStore();
  const {
    tabs,
    activeTabId,
    isSidebarOpen,
    toggleSidebar,
    toggleCommandPalette,
    openNewTab,
    openFileTab,
    markSaved,
  } = useEditorStore();

  const [isMaximized, setIsMaximized] = useState(false);
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const isElectron = typeof window !== 'undefined' && Boolean(window.electronAPI);
  const { rootName, openFolder, toggleQuickOpen } = useWorkspaceStore();
  const {
    isRunningCode,
    runCurrentCode,
    stopCurrentCode,
  } = useTerminalStore();

  useEffect(() => {
    if (isElectron && window.electronAPI?.isMaximized) {
      window.electronAPI.isMaximized().then(setIsMaximized);
    }
  }, [isElectron]);

  const handleOpen = async () => {
    const fileData = await openLocalFile();
    if (fileData) {
      openFileTab(fileData);
    }
  };

  const handleSave = async () => {
    if (!activeTab) return;
    try {
      const result = await saveFileToDisk(
        activeTab.content,
        activeTab.fileHandle,
        activeTab.title,
        activeTab.filePath
      );
      if (result) {
        markSaved(activeTab.id, result.handle, result.filePath);
        useNotificationStore.getState().addNotification({
          title: t('tabmenu.save'),
          message: activeTab.title,
          type: 'success',
        });
      }
    } catch (e) {
      console.error('Failed to save file:', e);
    }
  };

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = () => {
    window.electronAPI?.maximize();
    setIsMaximized(!isMaximized);
  };
  const handleClose = () => window.electronAPI?.close();

  return (
    <header
      className="h-10 bg-editor-sidebar border-b border-editor-border flex items-center justify-between select-none text-xs text-editor-text z-20"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      <div className="flex items-center space-x-2 pl-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          onClick={toggleSidebar}
          title={isSidebarOpen ? t('titlebar.hideSidebar') : t('titlebar.showSidebar')}
          className="p-1 rounded hover:bg-editor-border text-editor-muted hover:text-editor-text active:scale-90 transition-all duration-150"
        >
          {isSidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeft size={15} />}
        </button>

        <div className="flex items-center space-x-2 font-semibold text-editor-text group cursor-default">
          <img
            src={appLogo}
            alt="HyperEdit Icon"
            className="w-5 h-5 object-contain group-hover:scale-105 transition-transform duration-150"
          />
          <span className="tracking-wide group-hover:text-editor-accent transition-colors duration-150 font-bold">HyperEdit</span>
        </div>

        <div className="h-4 w-[1px] bg-editor-border mx-1" />

        <div className="flex items-center space-x-1">
          <button
            onClick={() => openNewTab()}
            title={t('titlebar.newFile')}
            className="p-1 rounded hover:bg-editor-border text-editor-muted hover:text-editor-text active:scale-90 transition-all duration-150 flex items-center space-x-1"
          >
            <FilePlus size={14} />
          </button>
          <button
            onClick={handleOpen}
            title={t('titlebar.openFile')}
            className="p-1 rounded hover:bg-editor-border text-editor-muted hover:text-editor-text active:scale-90 transition-all duration-150 flex items-center space-x-1"
          >
            <FolderOpen size={14} />
          </button>
          <button
            onClick={() => openFolder()}
            title={t('workspace.openFolder')}
            className="p-1 rounded hover:bg-editor-border text-editor-muted hover:text-editor-text active:scale-90 transition-all duration-150 flex items-center space-x-1"
          >
            <FolderTree size={14} />
          </button>
          <button
            onClick={handleSave}
            title={t('titlebar.saveFile')}
            className="p-1 rounded hover:bg-editor-border text-editor-muted hover:text-editor-text active:scale-90 transition-all duration-150 flex items-center space-x-1"
          >
            <Save size={14} />
          </button>
        </div>
      </div>

      <div
        onClick={() => toggleQuickOpen()}
        className="flex items-center text-editor-muted space-x-1.5 font-sans text-[11px] truncate max-w-md px-3 py-1 rounded-md bg-editor-bg border border-editor-border hover:border-editor-accent/60 hover:bg-editor-tabActive cursor-pointer transition-all group"
        style={{ WebkitAppRegion: 'no-drag' } as any}
        title={t('empty.quickOpen')}
      >
        <Search size={12} className="text-editor-muted group-hover:text-editor-accent mr-1 flex-shrink-0 transition-colors" />
        {rootName && (
          <span className="text-editor-text font-semibold flex items-center space-x-1">
            <span>{rootName}</span>
            <span className="text-editor-muted mx-1">/</span>
          </span>
        )}
        <span className="text-editor-text font-medium truncate font-mono">{activeTab?.title || 'HyperEdit'}</span>
        {activeTab?.isDirty && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block ml-1" title={t('tabbar.unsaved')} />
        )}
        <span className="ml-2 text-[10px] text-editor-muted bg-editor-border/50 px-1 py-0.2 rounded font-mono">
          Ctrl+P
        </span>
      </div>

      <div className="flex items-center h-full">
        <div className="flex items-center space-x-1.5 pr-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {isRunningCode ? (
            <button
              onClick={() => stopCurrentCode()}
              title={t('bottompanel.stop')}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-rose-600/20 hover:bg-rose-600/35 text-rose-300 hover:text-white border border-rose-500/40 text-[11px] font-medium transition-all duration-150 active:scale-95"
            >
              <Square size={10} fill="currentColor" />
              <span className="hidden sm:inline font-sans">{t('bottompanel.stop')}</span>
            </button>
          ) : (
            <button
              onClick={() => runCurrentCode()}
              title={t('titlebar.run')}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 text-[11px] font-medium transition-all duration-150 active:scale-95"
            >
              <Play size={11} fill="currentColor" />
              <span className="hidden sm:inline font-sans">{t('bottompanel.run')}</span>
            </button>
          )}

          <div className="h-3.5 w-[1px] bg-editor-border/60 mx-1" />

          <button
            onClick={toggleWordWrap}
            title={`${t('titlebar.wordWrap')}: ${settings.wordWrap ? 'ON' : 'OFF'}`}
            className={`p-1 rounded active:scale-90 transition-all duration-150 ${
              settings.wordWrap
                ? 'bg-editor-border text-editor-accent shadow-sm'
                : 'text-editor-muted hover:bg-editor-border hover:text-editor-text'
            }`}
          >
            <WrapText size={14} />
          </button>

          <button
            onClick={toggleMinimap}
            title={`${t('titlebar.minimap')}: ${settings.minimap ? 'ON' : 'OFF'}`}
            className={`p-1 rounded active:scale-90 transition-all duration-150 ${
              settings.minimap
                ? 'bg-editor-border text-editor-accent shadow-sm'
                : 'text-editor-muted hover:bg-editor-border hover:text-editor-text'
            }`}
          >
            <Map size={14} />
          </button>

          <button
            onClick={() => toggleCommandPalette(true)}
            title={t('titlebar.commandPalette')}
            className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-editor-tabActive border border-editor-border text-editor-muted hover:text-editor-text hover:border-editor-accent/40 active:scale-95 transition-all duration-150"
          >
            <Terminal size={12} className="text-editor-accent/80" />
            <span className="text-[11px]">Ctrl+Shift+P</span>
          </button>

          <button
            onClick={() => toggleSettings()}
            title={t('titlebar.settings')}
            className={`p-1 rounded active:scale-90 transition-all duration-150 ${
              isSettingsOpen
                ? 'bg-editor-border text-editor-accent shadow-sm'
                : 'text-editor-muted hover:bg-editor-border hover:text-editor-text'
            }`}
          >
            <Settings size={14} />
          </button>
        </div>

        {isElectron && (
          <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button
              onClick={handleMinimize}
              className="h-full px-3 hover:bg-editor-border text-editor-muted hover:text-editor-text flex items-center justify-center transition-colors duration-100"
              title={t('titlebar.minimize')}
            >
              <Minus size={13} />
            </button>
            <button
              onClick={handleMaximize}
              className="h-full px-3 hover:bg-editor-border text-editor-muted hover:text-editor-text flex items-center justify-center transition-colors duration-100"
              title={isMaximized ? t('titlebar.restore') : t('titlebar.maximize')}
            >
              {isMaximized ? <Copy size={11} className="rotate-180" /> : <Square size={11} />}
            </button>
            <button
              onClick={handleClose}
              className="h-full px-3 hover:bg-red-600 hover:text-white text-editor-muted transition-colors duration-100 flex items-center justify-center"
              title={t('titlebar.close')}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
