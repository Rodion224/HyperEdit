import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, FileCode, Circle, Settings } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useI18nStore } from '../../stores/i18nStore';
import { EditorTab } from '../../types';
import { TabContextMenu } from './TabContextMenu';

export const TabBar: React.FC = () => {
  const {
    tabs,
    activeTabId,
    setActiveTab,
    closeTab,
    openNewTab,
    reorderTabs,
    renameTab,
  } = useEditorStore();
  const { isSettingsOpen, toggleSettings } = useSettingsStore();
  const { t } = useI18nStore();

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    targetTab: EditorTab | null;
  } | null>(null);

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'left' | 'right' | null>(null);

  const startRename = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;
    setEditingTabId(tabId);
    setEditingTitle(tab.title);
  };

  const finishRename = (tabId: string) => {
    if (editingTitle.trim()) {
      renameTab(tabId, editingTitle.trim());
    }
    setEditingTabId(null);
    setEditingTitle('');
  };

  const cancelRename = () => {
    setEditingTabId(null);
    setEditingTitle('');
  };

  useEffect(() => {
    if (editingTabId && renameInputRef.current) {
      renameInputRef.current.focus();
      const dotIdx = editingTitle.lastIndexOf('.');
      if (dotIdx > 0) {
        renameInputRef.current.setSelectionRange(0, dotIdx);
      } else {
        renameInputRef.current.select();
      }
    }
  }, [editingTabId]);

  const handleTabClick = (tabId: string) => {
    if (editingTabId === tabId) return;
    if (isSettingsOpen) {
      toggleSettings(false);
    }
    setActiveTab(tabId);
  };

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          targetTab: null,
        });
      }}
      onWheel={(e) => {
        if (e.deltaY !== 0) {
          e.currentTarget.scrollLeft += e.deltaY;
        }
      }}
      className="h-9 bg-editor-sidebar border-b border-editor-border flex items-center select-none overflow-x-auto overflow-y-hidden text-xs"
    >
      <div className="flex items-center h-full">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId && !isSettingsOpen;
          const isDragging = tab.id === draggedTabId;
          const isOver = tab.id === dragOverTabId;
          const isEditing = tab.id === editingTabId;

          return (
            <div
              key={tab.id}
              draggable={!isEditing}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', tab.id);
                e.dataTransfer.effectAllowed = 'move';
                setDraggedTabId(tab.id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (!draggedTabId || draggedTabId === tab.id) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const midpoint = rect.left + rect.width / 2;
                const pos = e.clientX < midpoint ? 'left' : 'right';
                setDragOverTabId(tab.id);
                setDropPosition(pos);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  if (dragOverTabId === tab.id) {
                    setDragOverTabId(null);
                    setDropPosition(null);
                  }
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (!draggedTabId || draggedTabId === tab.id) {
                  setDraggedTabId(null);
                  setDragOverTabId(null);
                  setDropPosition(null);
                  return;
                }
                const sourceIndex = tabs.findIndex((t) => t.id === draggedTabId);
                const targetIndex = tabs.findIndex((t) => t.id === tab.id);
                if (sourceIndex !== -1 && targetIndex !== -1) {
                  let destIndex = targetIndex;
                  if (dropPosition === 'right') {
                    destIndex = sourceIndex < targetIndex ? targetIndex : targetIndex + 1;
                  } else {
                    destIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
                  }
                  destIndex = Math.max(0, Math.min(tabs.length - 1, destIndex));
                  reorderTabs(sourceIndex, destIndex);
                }
                setDraggedTabId(null);
                setDragOverTabId(null);
                setDropPosition(null);
              }}
              onDragEnd={() => {
                setDraggedTabId(null);
                setDragOverTabId(null);
                setDropPosition(null);
              }}
              onClick={() => handleTabClick(tab.id)}
              onDoubleClick={() => startRename(tab.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  targetTab: tab,
                });
              }}
              onMouseDown={(e) => {
                if (e.button === 1) {
                  e.preventDefault();
                  e.stopPropagation();
                  closeTab(tab.id);
                }
              }}
              className={`group flex items-center h-full px-3 border-r border-editor-border cursor-pointer transition-all duration-150 ease-out relative min-w-[120px] max-w-[200px] ${
                isActive
                  ? 'bg-editor-bg text-editor-text font-medium'
                  : 'bg-editor-tabInactive text-editor-muted hover:bg-editor-tabActive/70 hover:text-editor-text'
              } ${isDragging ? 'opacity-40 scale-[0.98]' : ''}`}
            >
              {isOver && dropPosition === 'left' && (
                <div className="absolute top-0 bottom-0 left-0 w-[2px] bg-editor-accent z-30" />
              )}
              {isOver && dropPosition === 'right' && (
                <div className="absolute top-0 bottom-0 right-0 w-[2px] bg-editor-accent z-30" />
              )}

              {isActive && (
                <div className="tab-active-indicator" />
              )}

              <FileCode
                size={13}
                className={`mr-1.5 flex-shrink-0 transition-colors duration-150 ${
                  isActive ? 'text-editor-accent' : 'text-editor-muted group-hover:text-editor-text'
                }`}
              />

              {isEditing ? (
                <input
                  ref={renameInputRef}
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      finishRename(tab.id);
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      e.stopPropagation();
                      cancelRename();
                    }
                  }}
                  onBlur={() => finishRename(tab.id)}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="bg-editor-bg text-editor-text border border-editor-accent rounded px-1 py-0 font-mono text-[12px] outline-none flex-1 w-full min-w-0"
                />
              ) : (
                <span className="truncate flex-1 font-mono text-[12px]">{tab.title}</span>
              )}

              <div className="ml-1.5 flex items-center justify-center w-4 h-4 flex-shrink-0">
                {tab.isDirty ? (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    title={t('tabbar.unsaved')}
                    className="flex items-center justify-center p-0.5 rounded hover:bg-editor-border text-editor-text group-hover:hidden"
                  >
                    <Circle size={8} fill="currentColor" />
                  </span>
                ) : null}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  title={t('tabbar.closeTab')}
                  className={`p-0.5 rounded hover:bg-editor-border hover:text-red-400 hover:scale-110 active:scale-90 transition-all duration-150 ${
                    tab.isDirty ? 'hidden group-hover:flex' : 'flex'
                  }`}
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          );
        })}

        {isSettingsOpen && (
          <div
            onClick={() => toggleSettings(true)}
            onMouseDown={(e) => {
              if (e.button === 1) {
                e.preventDefault();
                toggleSettings(false);
              }
            }}
            className="group flex items-center h-full px-3 border-r border-editor-border cursor-pointer transition-all duration-150 ease-out relative min-w-[120px] max-w-[180px] bg-editor-bg text-editor-text font-medium"
          >
            <div className="tab-active-indicator" />
            <Settings size={13} className="mr-1.5 flex-shrink-0 text-editor-accent" />
            <span className="truncate flex-1 font-sans text-[12px]">{t('tabbar.settings')}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSettings(false);
              }}
              title={t('tabbar.closeTab')}
              className="p-0.5 rounded hover:bg-editor-border hover:text-red-400 hover:scale-110 active:scale-90 transition-all duration-150 ml-1.5"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <button
          onClick={() => openNewTab()}
          title={t('tabbar.newTab')}
          className="h-full px-2.5 flex items-center justify-center text-editor-muted hover:text-editor-accent hover:bg-editor-tabActive hover:scale-105 active:scale-90 transition-all duration-150"
        >
          <Plus size={15} />
        </button>
      </div>

      {contextMenu && (
        <TabContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetTab={contextMenu.targetTab}
          onClose={() => setContextMenu(null)}
          onStartRename={startRename}
        />
      )}
    </div>
  );
};
