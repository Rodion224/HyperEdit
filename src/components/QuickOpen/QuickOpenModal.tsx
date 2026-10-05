import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ArrowRight, Clock, Folder } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useEditorStore } from '../../stores/editorStore';
import { useI18nStore } from '../../stores/i18nStore';
import { FileIcon } from '../Sidebar/FileIcon';
import { openFilePath } from '../../services/fileService';
import { editorActions, getActiveEditorView } from '../../services/activeViewService';

interface QuickOpenItem {
  name: string;
  fullPath: string;
  relativePath: string;
  isOpenTab: boolean;
  tabId?: string;
}

interface MatchResult {
  item: QuickOpenItem;
  score: number;
  matchIndices: number[];
}

function fuzzyMatch(query: string, item: QuickOpenItem): MatchResult | null {
  const lowerQuery = query.toLowerCase();
  const lowerName = item.name.toLowerCase();
  const lowerRel = item.relativePath.toLowerCase();

  if (lowerName === lowerQuery) {
    return {
      item,
      score: 1000,
      matchIndices: Array.from({ length: item.name.length }, (_, i) => i),
    };
  }

  if (lowerName.startsWith(lowerQuery)) {
    return {
      item,
      score: 500 + (100 - item.name.length),
      matchIndices: Array.from({ length: lowerQuery.length }, (_, i) => i),
    };
  }

  const subIdx = lowerName.indexOf(lowerQuery);
  if (subIdx !== -1) {
    return {
      item,
      score: 300 - subIdx,
      matchIndices: Array.from({ length: lowerQuery.length }, (_, i) => subIdx + i),
    };
  }

  let qIdx = 0;
  let score = 0;
  const matchIndices: number[] = [];
  let consecutive = 0;

  for (let i = 0; i < lowerName.length && qIdx < lowerQuery.length; i++) {
    if (lowerName[i] === lowerQuery[qIdx]) {
      matchIndices.push(i);
      qIdx++;
      consecutive++;
      score += 10 + consecutive * 5;
      if (i === 0 || lowerName[i - 1] === '-' || lowerName[i - 1] === '_' || lowerName[i - 1] === '.') {
        score += 20;
      }
    } else {
      consecutive = 0;
    }
  }

  if (qIdx === lowerQuery.length) {
    return { item, score, matchIndices };
  }

  if (lowerRel.includes(lowerQuery)) {
    return {
      item,
      score: 50,
      matchIndices: [],
    };
  }

  return null;
}

export const QuickOpenModal: React.FC = () => {
  const { isQuickOpenOpen, toggleQuickOpen, projectFiles, rootPath } = useWorkspaceStore();
  const { tabs, activeTabId, setActiveTab, openFileTab } = useEditorStore();
  const { t } = useI18nStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allItems: QuickOpenItem[] = useMemo(() => {
    const list: QuickOpenItem[] = [];
    const seenPaths = new Set<string>();

    for (const tab of tabs) {
      if (tab.filePath) {
        seenPaths.add(tab.filePath);
        list.push({
          name: tab.title,
          fullPath: tab.filePath,
          relativePath: rootPath && tab.filePath.startsWith(rootPath)
            ? tab.filePath.slice(rootPath.length).replace(/^[\\/]/, '')
            : tab.title,
          isOpenTab: true,
          tabId: tab.id,
        });
      }
    }

    for (const pf of projectFiles) {
      if (!seenPaths.has(pf.fullPath)) {
        seenPaths.add(pf.fullPath);
        list.push({
          name: pf.name,
          fullPath: pf.fullPath,
          relativePath: pf.relativePath,
          isOpenTab: false,
        });
      }
    }

    return list;
  }, [tabs, projectFiles, rootPath]);

  const { cleanQuery, targetLine } = useMemo(() => {
    const match = query.match(/^(.+?):(\d+)$/);
    if (match) {
      return { cleanQuery: match[1].trim(), targetLine: parseInt(match[2], 10) };
    }
    return { cleanQuery: query.trim(), targetLine: null };
  }, [query]);

  const filteredMatches: MatchResult[] = useMemo(() => {
    if (!cleanQuery) {
      return allItems.slice(0, 50).map((item) => ({
        item,
        score: item.isOpenTab ? 100 : 10,
        matchIndices: [],
      }));
    }

    const matches: MatchResult[] = [];
    for (const item of allItems) {
      const match = fuzzyMatch(cleanQuery, item);
      if (match) matches.push(match);
    }

    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, 75);
  }, [cleanQuery, allItems]);

  useEffect(() => {
    if (isQuickOpenOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isQuickOpenOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelectItem = async (item: QuickOpenItem) => {
    toggleQuickOpen(false);

    if (item.isOpenTab && item.tabId) {
      setActiveTab(item.tabId);
    } else {
      const existingTab = tabs.find((t) => t.filePath === item.fullPath);
      if (existingTab) {
        setActiveTab(existingTab.id);
      } else {
        const fileResult = await openFilePath(item.fullPath);
        if (fileResult) {
          openFileTab(fileResult);
        }
      }
    }

    if (targetLine !== null && targetLine > 0) {
      setTimeout(() => {
        const view = getActiveEditorView();
        if (view) {
          const doc = view.state.doc;
          const safeLineNum = Math.max(1, Math.min(targetLine, doc.lines));
          const line = doc.line(safeLineNum);
          view.dispatch({
            selection: { anchor: line.from },
            scrollIntoView: true,
          });
          view.focus();
        }
      }, 50);
    } else {
      editorActions.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      toggleQuickOpen(false);
      editorActions.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredMatches.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredMatches.length) % Math.max(1, filteredMatches.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredMatches[selectedIndex];
      if (selected) {
        handleSelectItem(selected.item);
      }
    }
  };

  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isQuickOpenOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-12 animate-in fade-in duration-100"
      onClick={() => toggleQuickOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-editor-sidebar border border-editor-border shadow-2xl shadow-black/80 rounded-lg overflow-hidden flex flex-col transform animate-smooth-down"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-2.5 border-b border-editor-border bg-editor-sidebar">
          <Search size={17} className="text-editor-accent mr-2.5 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('quickopen.placeholder', 'Search files by name (type :line to navigate)...')}
            className="flex-1 bg-transparent text-sm text-editor-text placeholder-editor-muted focus:outline-none font-sans"
          />
          <div className="flex items-center space-x-1.5 text-[11px] text-editor-muted font-mono">
            <kbd className="px-1.5 py-0.5 rounded bg-editor-border/60 text-editor-muted border border-editor-border">
              Esc
            </kbd>
            <span className="text-[10px]">close</span>
          </div>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto py-1">
          {filteredMatches.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-editor-muted">
              {t('quickopen.noFilesFound', 'No matching files found')}
            </div>
          ) : (
            filteredMatches.map(({ item, matchIndices }, index) => {
              const isSelected = index === selectedIndex;
              const dirPath = item.relativePath.includes('/') || item.relativePath.includes('\\')
                ? item.relativePath.split(/[\\/]/).slice(0, -1).join('/')
                : '';

              return (
                <div
                  key={`${item.fullPath}-${index}`}
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-4 py-2 text-xs cursor-pointer transition-all duration-100 relative ${
                    isSelected
                      ? 'bg-editor-accent/20 text-editor-text font-medium border-l-2 border-editor-accent pl-4'
                      : 'text-editor-text hover:bg-editor-tabActive/60 hover:pl-4.5'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate flex-1 min-w-0 mr-3">
                    <FileIcon fileName={item.name} size={15} className="flex-shrink-0" />

                    <span className="truncate font-mono text-[12px]">
                      {matchIndices.length > 0 ? (
                        Array.from(item.name).map((char, charIdx) => {
                          const isMatch = matchIndices.includes(charIdx);
                          return (
                            <span
                              key={charIdx}
                              className={isMatch ? 'text-editor-accent font-bold underline' : ''}
                            >
                              {char}
                            </span>
                          );
                        })
                      ) : (
                        item.name
                      )}
                    </span>

                    {dirPath && (
                      <span className="text-[11px] text-editor-muted truncate font-mono opacity-60">
                        {dirPath}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {item.isOpenTab && (
                      <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-editor-border/40 text-editor-muted text-[10px] font-mono">
                        <Clock size={10} />
                        <span>opened</span>
                      </span>
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
