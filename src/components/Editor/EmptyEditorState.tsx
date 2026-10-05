import React from 'react';
import {
  FilePlus,
  FolderOpen,
  FolderTree,
  Search,
  Terminal,
  Settings as SettingsIcon,
  Sparkles,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useI18nStore } from '../../stores/i18nStore';
import { openLocalFile } from '../../services/fileService';
import appLogo from '../../assets/icon.png';

export const EmptyEditorState: React.FC = () => {
  const { openNewTab, openFileTab, toggleCommandPalette } = useEditorStore();
  const { rootName, rootPath, openFolder, toggleQuickOpen } = useWorkspaceStore();
  const { toggleSettings } = useSettingsStore();
  const { t } = useI18nStore();

  const handleOpenLocalFile = async () => {
    const file = await openLocalFile();
    if (file) {
      openFileTab(file);
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-6 bg-editor-bg select-none relative overflow-hidden animate-in fade-in duration-150">
      <div className="max-w-md w-full flex flex-col items-center text-center z-10">
        <div className="relative mb-5 group cursor-default">
          <img
            src={appLogo}
            alt="HyperEdit Logo"
            className="w-16 h-16 object-contain group-hover:scale-105 transition-transform duration-200"
          />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-editor-text mb-1 flex items-center space-x-2">
          <span>HyperEdit</span>
          <span className="text-[10px] uppercase tracking-widest font-mono px-1.5 py-0.5 rounded bg-editor-accent/15 text-editor-accent border border-editor-accent/30 font-semibold">
            v0.1
          </span>
        </h1>

        {rootName ? (
          <div className="flex items-center space-x-2 text-xs text-editor-muted mb-6 bg-editor-tabActive/50 px-3 py-1 rounded-full border border-editor-border/50 max-w-sm truncate">
            <FolderTree size={13} className="text-amber-400 flex-shrink-0" />
            <span className="truncate">
              {t('empty.project')} <strong className="text-editor-text font-semibold">{rootName}</strong>
            </span>
          </div>
        ) : (
          <p className="text-xs text-editor-muted mb-6 max-w-xs leading-relaxed">
            {t('empty.noDocumentOpen')}
          </p>
        )}

        <div className="w-full flex flex-col space-y-2 mb-8 text-xs font-sans">
          <button
            onClick={() => openNewTab()}
            className="group flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-editor-sidebar border border-editor-border hover:border-editor-accent/60 hover:bg-editor-tabActive text-editor-text transition-all duration-150 shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <span className="p-1 rounded bg-editor-accent/10 text-editor-accent group-hover:scale-110 transition-transform">
                <FilePlus size={15} />
              </span>
              <span className="font-medium">{t('empty.newFile')}</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-editor-tabActive border border-editor-border font-mono text-[10px] text-editor-muted group-hover:text-editor-text shadow-sm">
              Ctrl+N
            </kbd>
          </button>

          <button
            onClick={handleOpenLocalFile}
            className="group flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-editor-sidebar border border-editor-border hover:border-editor-accent/60 hover:bg-editor-tabActive text-editor-text transition-all duration-150 shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                <FolderOpen size={15} />
              </span>
              <span className="font-medium">{t('empty.openFile')}</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-editor-tabActive border border-editor-border font-mono text-[10px] text-editor-muted group-hover:text-editor-text shadow-sm">
              Ctrl+O
            </kbd>
          </button>

          <button
            onClick={() => openFolder()}
            className="group flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-editor-sidebar border border-editor-border hover:border-editor-accent/60 hover:bg-editor-tabActive text-editor-text transition-all duration-150 shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <span className="p-1 rounded bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                <FolderTree size={15} />
              </span>
              <span className="font-medium">{t('empty.openFolder')}</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-editor-tabActive border border-editor-border font-mono text-[10px] text-editor-muted group-hover:text-editor-text shadow-sm">
              Ctrl+K Ctrl+O
            </kbd>
          </button>

          <button
            onClick={() => toggleQuickOpen(true)}
            className="group flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-editor-sidebar border border-editor-border hover:border-editor-accent/60 hover:bg-editor-tabActive text-editor-text transition-all duration-150 shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <span className="p-1 rounded bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform">
                <Search size={15} />
              </span>
              <span className="font-medium">{t('empty.quickOpen')}</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-editor-tabActive border border-editor-border font-mono text-[10px] text-editor-muted group-hover:text-editor-text shadow-sm">
              Ctrl+P
            </kbd>
          </button>

          <button
            onClick={() => toggleCommandPalette(true)}
            className="group flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-editor-sidebar border border-editor-border hover:border-editor-accent/60 hover:bg-editor-tabActive text-editor-text transition-all duration-150 shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <span className="p-1 rounded bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                <Terminal size={15} />
              </span>
              <span className="font-medium">{t('empty.commandPalette')}</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-editor-tabActive border border-editor-border font-mono text-[10px] text-editor-muted group-hover:text-editor-text shadow-sm">
              Ctrl+Shift+P
            </kbd>
          </button>
        </div>

        <div className="flex items-center justify-center space-x-4 text-[11px] text-editor-muted/70 font-mono">
          <div className="flex items-center space-x-1.5">
            <kbd className="px-1 py-0.5 rounded bg-editor-border/40 text-editor-muted border border-editor-border text-[10px]">
              Ctrl+B
            </kbd>
            <span>{t('palette.cmd.toggleSidebar')}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <kbd className="px-1 py-0.5 rounded bg-editor-border/40 text-editor-muted border border-editor-border text-[10px]">
              Ctrl+,
            </kbd>
            <span>{t('settings.title')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
