import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  RotateCcw,
  Pencil,
  Copy,
  FolderOpen,
  Save,
  Files,
  Plus,
} from 'lucide-react';
import { EditorTab } from '../../types';
import { useEditorStore } from '../../stores/editorStore';
import { useI18nStore } from '../../stores/i18nStore';

export interface TabContextMenuProps {
  x: number;
  y: number;
  targetTab: EditorTab | null;
  onClose: () => void;
  onStartRename?: (tabId: string) => void;
}

export const TabContextMenu: React.FC<TabContextMenuProps> = ({
  x,
  y,
  targetTab,
  onClose,
  onStartRename,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x, y });

  const {
    tabs,
    recentlyClosedTabs,
    closeTab,
    closeOtherTabs,
    closeTabsToTheRight,
    closeTabsToTheLeft,
    closeSavedTabs,
    closeAllTabs,
    reopenClosedTab,
    duplicateTab,
    saveTabById,
    openNewTab,
  } = useEditorStore();

  const { t } = useI18nStore();

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      let adjustedX = x;
      let adjustedY = y;

      if (x + rect.width > window.innerWidth - 8) {
        adjustedX = Math.max(8, window.innerWidth - rect.width - 8);
      }
      if (y + rect.height > window.innerHeight - 8) {
        adjustedY = Math.max(8, window.innerHeight - rect.height - 8);
      }

      setCoords({ x: adjustedX, y: adjustedY });
    }
  }, [x, y]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleContextMenu = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('blur', onClose);
    window.addEventListener('resize', onClose);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('blur', onClose);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  const targetIndex = targetTab ? tabs.findIndex((t) => t.id === targetTab.id) : -1;
  const hasTabsToRight = targetIndex >= 0 && targetIndex < tabs.length - 1;
  const hasTabsToLeft = targetIndex > 0;
  const hasOtherTabs = tabs.length > 1;
  const hasSavedTabs = tabs.some((t) => !t.isDirty);
  const canReopen = recentlyClosedTabs.length > 0;
  const hasFilePath = Boolean(targetTab?.filePath);

  const handleCopyPath = () => {
    if (targetTab?.filePath) {
      navigator.clipboard.writeText(targetTab.filePath);
    }
    onClose();
  };

  const handleCopyName = () => {
    if (targetTab) {
      navigator.clipboard.writeText(targetTab.title);
    }
    onClose();
  };

  const handleRevealInExplorer = () => {
    if (targetTab?.filePath && window.electronAPI?.revealInExplorer) {
      window.electronAPI.revealInExplorer(targetTab.filePath);
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{
        left: `${coords.x}px`,
        top: `${coords.y}px`,
      }}
      className="fixed z-[9999] min-w-[220px] py-1 bg-editor-sidebar border border-editor-border text-editor-text rounded-md shadow-2xl shadow-black/80 select-none font-sans text-[12px] animate-smooth-pop overflow-hidden"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {targetTab ? (
        <>
          <button
            onClick={() => {
              closeTab(targetTab.id);
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-editor-accent hover:text-white group text-left cursor-pointer transition-colors duration-75"
          >
            <span className="flex items-center gap-2">
              <X size={14} className="text-editor-muted group-hover:text-white" />
              <span>{t('tabmenu.close')}</span>
            </span>
            <span className="text-[11px] text-editor-muted group-hover:text-white/80 font-mono">
              Ctrl+W
            </span>
          </button>

          <button
            disabled={!hasOtherTabs}
            onClick={() => {
              closeOtherTabs(targetTab.id);
              onClose();
            }}
            className={`w-full flex items-center justify-between px-3 py-1.5 group text-left transition-colors duration-75 ${
              hasOtherTabs
                ? 'hover:bg-editor-accent hover:text-white cursor-pointer'
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-3.5" />
              <span>{t('tabmenu.closeOthers')}</span>
            </span>
          </button>

          <button
            disabled={!hasTabsToRight}
            onClick={() => {
              closeTabsToTheRight(targetTab.id);
              onClose();
            }}
            className={`w-full flex items-center justify-between px-3 py-1.5 group text-left transition-colors duration-75 ${
              hasTabsToRight
                ? 'hover:bg-editor-accent hover:text-white cursor-pointer'
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center gap-2">
              <ArrowRight size={14} className="text-editor-muted group-hover:text-white" />
              <span>{t('tabmenu.closeRight')}</span>
            </span>
          </button>

          <button
            disabled={!hasTabsToLeft}
            onClick={() => {
              closeTabsToTheLeft(targetTab.id);
              onClose();
            }}
            className={`w-full flex items-center justify-between px-3 py-1.5 group text-left transition-colors duration-75 ${
              hasTabsToLeft
                ? 'hover:bg-editor-accent hover:text-white cursor-pointer'
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center gap-2">
              <ArrowLeft size={14} className="text-editor-muted group-hover:text-white" />
              <span>{t('tabmenu.closeLeft')}</span>
            </span>
          </button>

          <button
            disabled={!hasSavedTabs}
            onClick={() => {
              closeSavedTabs();
              onClose();
            }}
            className={`w-full flex items-center justify-between px-3 py-1.5 group text-left transition-colors duration-75 ${
              hasSavedTabs
                ? 'hover:bg-editor-accent hover:text-white cursor-pointer'
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center gap-2">
              <Check size={14} className="text-editor-muted group-hover:text-white" />
              <span>{t('tabmenu.closeSaved')}</span>
            </span>
          </button>

          <button
            onClick={() => {
              closeAllTabs();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-editor-accent hover:text-white group text-left cursor-pointer transition-colors duration-75"
          >
            <span className="flex items-center gap-2">
              <span className="w-3.5" />
              <span>{t('tabmenu.closeAll')}</span>
            </span>
          </button>

          <div className="h-[1px] bg-editor-border my-1" />

          <button
            disabled={!canReopen}
            onClick={() => {
              reopenClosedTab();
              onClose();
            }}
            className={`w-full flex items-center justify-between px-3 py-1.5 group text-left transition-colors duration-75 ${
              canReopen
                ? 'hover:bg-editor-accent hover:text-white cursor-pointer'
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center gap-2">
              <RotateCcw size={14} className="text-editor-muted group-hover:text-white" />
              <span>{t('tabmenu.reopenClosed')}</span>
            </span>
            <span className="text-[11px] text-editor-muted group-hover:text-white/80 font-mono">
              Ctrl+Shift+T
            </span>
          </button>

          <div className="h-[1px] bg-editor-border my-1" />

          <button
            onClick={() => {
              if (onStartRename) {
                onStartRename(targetTab.id);
              }
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-editor-accent hover:text-white group text-left cursor-pointer transition-colors duration-75"
          >
            <span className="flex items-center gap-2">
              <Pencil size={14} className="text-editor-muted group-hover:text-white" />
              <span>{t('tabmenu.rename')}</span>
            </span>
            <span className="text-[11px] text-editor-muted group-hover:text-white/80 font-mono">
              F2
            </span>
          </button>

          <button
            onClick={() => {
              duplicateTab(targetTab.id);
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-editor-accent hover:text-white group text-left cursor-pointer transition-colors duration-75"
          >
            <span className="flex items-center gap-2">
              <Files size={14} className="text-editor-muted group-hover:text-white" />
              <span>{t('tabmenu.duplicate')}</span>
            </span>
          </button>

          <div className="h-[1px] bg-editor-border my-1" />

          <button
            disabled={!hasFilePath}
            onClick={handleCopyPath}
            className={`w-full flex items-center justify-between px-3 py-1.5 group text-left transition-colors duration-75 ${
              hasFilePath
                ? 'hover:bg-editor-accent hover:text-white cursor-pointer'
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center gap-2">
              <Copy size={14} className="text-editor-muted group-hover:text-white" />
              <span>{t('tabmenu.copyPath')}</span>
            </span>
          </button>

          <button
            onClick={handleCopyName}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-editor-accent hover:text-white group text-left cursor-pointer transition-colors duration-75"
          >
            <span className="flex items-center gap-2">
              <span className="w-3.5" />
              <span>{t('tabmenu.copyName')}</span>
            </span>
          </button>

          <button
            disabled={!hasFilePath}
            onClick={handleRevealInExplorer}
            className={`w-full flex items-center justify-between px-3 py-1.5 group text-left transition-colors duration-75 ${
              hasFilePath
                ? 'hover:bg-editor-accent hover:text-white cursor-pointer'
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center gap-2">
              <FolderOpen size={14} className="text-editor-muted group-hover:text-white" />
              <span>{t('tabmenu.revealInExplorer')}</span>
            </span>
          </button>

          <div className="h-[1px] bg-editor-border my-1" />

          <button
            onClick={() => {
              saveTabById(targetTab.id);
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-editor-accent hover:text-white group text-left cursor-pointer transition-colors duration-75"
          >
            <span className="flex items-center gap-2">
              <Save size={14} className="text-editor-muted group-hover:text-white" />
              <span>{t('tabmenu.save')}</span>
            </span>
            <span className="text-[11px] text-editor-muted group-hover:text-white/80 font-mono">
              Ctrl+S
            </span>
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => {
              openNewTab();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-editor-accent hover:text-white group text-left cursor-pointer transition-colors duration-75"
          >
            <span className="flex items-center gap-2">
              <Plus size={14} className="text-editor-muted group-hover:text-white" />
              <span>{t('tabbar.newTab')}</span>
            </span>
            <span className="text-[11px] text-editor-muted group-hover:text-white/80 font-mono">
              Ctrl+N
            </span>
          </button>

          <button
            disabled={!canReopen}
            onClick={() => {
              reopenClosedTab();
              onClose();
            }}
            className={`w-full flex items-center justify-between px-3 py-1.5 group text-left transition-colors duration-75 ${
              canReopen
                ? 'hover:bg-editor-accent hover:text-white cursor-pointer'
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center gap-2">
              <RotateCcw size={14} className="text-editor-muted group-hover:text-white" />
              <span>{t('tabmenu.reopenClosed')}</span>
            </span>
            <span className="text-[11px] text-editor-muted group-hover:text-white/80 font-mono">
              Ctrl+Shift+T
            </span>
          </button>

          <div className="h-[1px] bg-editor-border my-1" />

          <button
            onClick={() => {
              closeAllTabs();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-editor-accent hover:text-white group text-left cursor-pointer transition-colors duration-75"
          >
            <span className="flex items-center gap-2">
              <X size={14} className="text-editor-muted group-hover:text-white" />
              <span>{t('tabmenu.closeAll')}</span>
            </span>
          </button>
        </>
      )}
    </div>
  );
};
