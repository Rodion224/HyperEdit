import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Settings,
  XSquare,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useI18nStore } from '../../stores/i18nStore';
import { WorkspaceTree } from './WorkspaceTree';
import { FileIcon } from './FileIcon';

export const Sidebar: React.FC = () => {
  const {
    isSidebarOpen,
    tabs,
    activeTabId,
    setActiveTab,
    closeTab,
    openNewTab,
    closeAllTabs,
  } = useEditorStore();
  const { toggleSettings } = useSettingsStore();
  const { t } = useI18nStore();

  const [isOpenEditorsOpen, setIsOpenEditorsOpen] = useState(true);

  return (
    <aside
      className={`bg-editor-sidebar border-r border-editor-border flex flex-col select-none text-xs text-editor-text z-10 flex-shrink-0 transition-[width,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
        isSidebarOpen ? 'w-60 opacity-100' : 'w-0 opacity-0 pointer-events-none border-r-0'
      }`}
    >
      <div className="w-60 flex flex-col h-full flex-shrink-0">
        <div className="flex flex-col border-b border-editor-border flex-shrink-0">
          <div
            onClick={() => setIsOpenEditorsOpen(!isOpenEditorsOpen)}
            className="h-8 px-3 flex items-center justify-between font-semibold uppercase tracking-wider text-[11px] text-editor-muted hover:bg-editor-border/20 cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-1.5 truncate">
              <ChevronRight
                size={13}
                className={`transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isOpenEditorsOpen ? 'rotate-90 text-editor-accent' : 'rotate-0 text-editor-muted'
                }`}
              />
              <span className="truncate">{t('sidebar.openEditors')}</span>
              <span className="text-[10px] text-editor-muted/60 font-mono">({tabs.length})</span>
            </div>

            <div
              className="flex items-center space-x-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => openNewTab()}
                title={t('sidebar.newFile')}
                className="p-1 rounded hover:bg-editor-border text-editor-muted hover:text-editor-text transition-colors"
              >
                <Plus size={13} />
              </button>
              <button
                onClick={() => closeAllTabs()}
                title={t('sidebar.closeAll')}
                className="p-1 rounded hover:bg-editor-border text-editor-muted hover:text-editor-text transition-colors"
              >
                <XSquare size={13} />
              </button>
            </div>
          </div>

          {isOpenEditorsOpen && (
            <div className="max-h-44 overflow-y-auto py-0.5 border-t border-editor-border/40">
              {tabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                return (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group flex items-center justify-between px-3 py-1 cursor-pointer text-[12px] font-mono transition-all duration-100 ${
                      isActive
                        ? 'bg-editor-accent/20 text-editor-text font-medium border-l-2 border-editor-accent pl-3.5'
                        : 'text-editor-muted hover:bg-editor-border/30 hover:text-editor-text'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate min-w-0">
                      <FileIcon fileName={tab.title} size={14} className="flex-shrink-0" />
                      <span className="truncate">{tab.title}</span>
                    </div>

                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {tab.isDirty && (
                        <span className="w-1.5 h-1.5 rounded-full bg-editor-muted mr-1" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeTab(tab.id);
                        }}
                        title={t('titlebar.close')}
                        className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-editor-border text-editor-muted hover:text-editor-text transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <WorkspaceTree />

        <div className="h-8 px-3 border-t border-editor-border text-[11px] text-editor-muted flex items-center justify-between font-mono bg-editor-tabActive/20 flex-shrink-0">
          <span>{tabs.length} {t('sidebar.filesCount')}</span>
          <button
            onClick={() => toggleSettings()}
            title={t('sidebar.settings')}
            className="p-1 rounded hover:bg-editor-border hover:text-editor-text transition-colors"
          >
            <Settings size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
};
