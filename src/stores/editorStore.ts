import { create } from 'zustand';
import { EditorTab, SupportedLanguage } from '../types';
import { OpenedFileResult, saveFileToDisk } from '../services/fileService';
import { useSettingsStore } from './settingsStore';
import { useTerminalStore } from './terminalStore';

const SESSION_STORAGE_KEY = 'hyperedit_session_v1';

interface StoredSession {
  tabs: Array<{
    id: string;
    title: string;
    filePath?: string;
    content: string;
    isDirty: boolean;
    language: SupportedLanguage;
    lineEnding: 'LF' | 'CRLF';
    sizeBytes: number;
  }>;
  activeTabId: string | null;
}

function loadSavedSession(): { tabs: EditorTab[]; activeTabId: string | null } | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredSession = JSON.parse(raw);
    if (!parsed.tabs || parsed.tabs.length === 0) return null;

    const tabs: EditorTab[] = parsed.tabs.map((t) => ({
      ...t,
      originalContent: t.content,
      encoding: 'UTF-8',
      cursorPosition: { line: 1, column: 1, selectionLength: 0 },
    }));

    return {
      tabs,
      activeTabId: parsed.activeTabId || tabs[0].id,
    };
  } catch (e) {
    console.error('Failed to load session:', e);
    return null;
  }
}

function saveSession(tabs: EditorTab[], activeTabId: string | null) {
  const sessionRestoreEnabled = useSettingsStore.getState().settings.sessionRestore;
  if (!sessionRestoreEnabled) {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {}
    if (typeof window !== 'undefined' && window.electronAPI?.saveSession) {
      window.electronAPI.saveSession(null).catch(() => {});
    }
    return;
  }

  try {
    const data: StoredSession = {
      activeTabId,
      tabs: tabs.map((t) => ({
        id: t.id,
        title: t.title,
        filePath: t.filePath,
        content: t.content,
        isDirty: t.isDirty,
        language: t.language,
        lineEnding: t.lineEnding,
        sizeBytes: t.sizeBytes,
      })),
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
    if (typeof window !== 'undefined' && window.electronAPI?.saveSession) {
      window.electronAPI.saveSession(data).catch(() => {});
    }
  } catch (e) {
    console.warn('Failed to save session:', e);
  }
}

let debouncedSaveTimer: any = null;

function debouncedSaveSession(tabs: EditorTab[], activeTabId: string | null, delay = 400) {
  if (debouncedSaveTimer) {
    clearTimeout(debouncedSaveTimer);
  }
  debouncedSaveTimer = setTimeout(() => {
    saveSession(tabs, activeTabId);
    debouncedSaveTimer = null;
  }, delay);
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (debouncedSaveTimer) {
      clearTimeout(debouncedSaveTimer);
      const state = useEditorStore.getState();
      saveSession(state.tabs, state.activeTabId);
    }
  });
}

const defaultContent = `function benchmark(iterations: number): void {
  console.time('Processing');
  let counter = 0;
  for (let i = 0; i < iterations; i++) {
    counter += i * 2;
  }
  console.timeEnd('Processing');
  console.log('Result:', counter);
}

benchmark(1_000_000);
`;

const initialSession = loadSavedSession();
const initialTabs: EditorTab[] = initialSession?.tabs || [];

interface EditorState {
  tabs: EditorTab[];
  activeTabId: string;
  isSidebarOpen: boolean;
  isCommandPaletteOpen: boolean;
  isWordWrap: boolean;
  isMinimapEnabled: boolean;
  cursorPosition: {
    line: number;
    column: number;
    selectionLength: number;
  };
  recentlyClosedTabs: EditorTab[];

  openNewTab: (title?: string, content?: string, language?: SupportedLanguage) => void;
  openFileTab: (fileData: OpenedFileResult) => void;
  closeTab: (tabId: string) => void;
  closeOtherTabs: (tabId: string) => void;
  closeTabsToTheRight: (tabId: string) => void;
  closeTabsToTheLeft: (tabId: string) => void;
  closeSavedTabs: () => void;
  closeAllTabs: () => void;
  reorderTabs: (sourceIndex: number, destinationIndex: number) => void;
  renameTab: (tabId: string, newTitle: string) => void;
  duplicateTab: (tabId: string) => void;
  reopenClosedTab: () => void;
  setActiveTab: (tabId: string) => void;
  updateActiveTabContent: (content: string) => void;
  updateCursorPosition: (line: number, column: number, selectionLength: number) => void;
  setLanguage: (lang: SupportedLanguage) => void;
  setLineEnding: (lineEnding: 'LF' | 'CRLF') => void;
  markSaved: (tabId: string, handle?: FileSystemFileHandle, filePath?: string) => void;
  toggleSidebar: () => void;
  toggleCommandPalette: (open?: boolean) => void;
  toggleWordWrap: () => void;
  toggleMinimap: () => void;
  switchToNextTab: () => void;
  switchToPreviousTab: () => void;
  switchToTabByIndex: (index: number) => void;
  saveActiveTab: () => Promise<void>;
  saveTabById: (tabId: string) => Promise<void>;
  updateDiagnostics: (tabId: string, errors: number, warnings: number) => void;
}

let newTabCounter = 1;

function stopRunnerIfTabClosed(closedTabIds: string[]) {
  try {
    const termStore = useTerminalStore.getState();
    if (termStore.isRunningCode) {
      if (!termStore.activeRunnerTabId || closedTabIds.includes(termStore.activeRunnerTabId)) {
        termStore.stopCurrentCode();
      }
    }
  } catch (e) {}
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: initialTabs,
  activeTabId: initialSession?.activeTabId || (initialTabs.length > 0 ? initialTabs[0].id : ''),
  isSidebarOpen: (() => {
    try {
      const saved = localStorage.getItem('hyperedit_sidebar_open_v1');
      if (saved !== null) return saved === 'true';
    } catch (e) {}
    return true;
  })(),
  isCommandPaletteOpen: false,
  isWordWrap: false,
  isMinimapEnabled: true,
  cursorPosition: { line: 1, column: 1, selectionLength: 0 },
  recentlyClosedTabs: [],

  openNewTab: (title, content = '', language = 'plaintext') => {
    const id = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const tabTitle = title || `Untitled-${newTabCounter++}`;
    const newTab: EditorTab = {
      id,
      title: tabTitle,
      content,
      originalContent: content,
      isDirty: false,
      language,
      encoding: 'UTF-8',
      lineEnding: 'LF',
      sizeBytes: new Blob([content]).size,
      cursorPosition: { line: 1, column: 1, selectionLength: 0 },
    };

    const newTabs = [...get().tabs, newTab];
    set({ tabs: newTabs, activeTabId: id });
    saveSession(newTabs, id);
  },

  openFileTab: (fileData) => {
    const { tabs } = get();
    const existing = tabs.find((t) => {
      if (fileData.filePath && t.filePath) {
        return t.filePath.toLowerCase() === fileData.filePath.toLowerCase();
      }
      return t.title === fileData.title;
    });
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }

    const id = `tab-${Date.now()}`;
    const newTab: EditorTab = {
      id,
      title: fileData.title,
      filePath: fileData.filePath,
      fileHandle: fileData.fileHandle,
      content: fileData.content,
      originalContent: fileData.content,
      isDirty: false,
      language: fileData.language,
      encoding: 'UTF-8',
      lineEnding: fileData.lineEnding,
      sizeBytes: fileData.sizeBytes,
      cursorPosition: { line: 1, column: 1, selectionLength: 0 },
    };

    const newTabs = [...tabs, newTab];
    set({ tabs: newTabs, activeTabId: id });
    saveSession(newTabs, id);
  },

  closeTab: (tabId) => {
    stopRunnerIfTabClosed([tabId]);
    const { tabs, activeTabId, recentlyClosedTabs } = get();
    const tabToClose = tabs.find((t) => t.id === tabId);
    const newRecentlyClosed = tabToClose
      ? [tabToClose, ...recentlyClosedTabs].slice(0, 20)
      : recentlyClosedTabs;

    if (tabs.length <= 1) {
      set({ tabs: [], activeTabId: '', recentlyClosedTabs: newRecentlyClosed });
      saveSession([], '');
      return;
    }

    const filtered = tabs.filter((t) => t.id !== tabId);
    if (filtered.length === 0) {
      set({ tabs: [], activeTabId: '', recentlyClosedTabs: newRecentlyClosed });
      saveSession([], '');
      return;
    }

    let nextActiveId = activeTabId;
    if (activeTabId === tabId) {
      const closedIndex = tabs.findIndex((t) => t.id === tabId);
      const nextTab = filtered[closedIndex] || filtered[closedIndex - 1] || filtered[0];
      nextActiveId = nextTab ? nextTab.id : '';
    }

    set({ tabs: filtered, activeTabId: nextActiveId, recentlyClosedTabs: newRecentlyClosed });
    saveSession(filtered, nextActiveId);
  },

  closeOtherTabs: (tabId: string) => {
    const { tabs } = get();
    const keepTab = tabs.find((t) => t.id === tabId);
    if (!keepTab) return;

    const closedTabs = tabs.filter((t) => t.id !== tabId);
    stopRunnerIfTabClosed(closedTabs.map((t) => t.id));
    const newRecentlyClosed = [...closedTabs, ...get().recentlyClosedTabs].slice(0, 20);

    set({ tabs: [keepTab], activeTabId: tabId, recentlyClosedTabs: newRecentlyClosed });
    saveSession([keepTab], tabId);
  },

  closeTabsToTheRight: (tabId: string) => {
    const { tabs, activeTabId } = get();
    const index = tabs.findIndex((t) => t.id === tabId);
    if (index === -1 || index === tabs.length - 1) return;

    const keepTabs = tabs.slice(0, index + 1);
    const closedTabs = tabs.slice(index + 1);
    stopRunnerIfTabClosed(closedTabs.map((t) => t.id));
    const newRecentlyClosed = [...closedTabs, ...get().recentlyClosedTabs].slice(0, 20);

    let nextActiveId = activeTabId;
    if (closedTabs.some((t) => t.id === activeTabId)) {
      nextActiveId = tabId;
    }

    set({ tabs: keepTabs, activeTabId: nextActiveId, recentlyClosedTabs: newRecentlyClosed });
    saveSession(keepTabs, nextActiveId);
  },

  closeTabsToTheLeft: (tabId: string) => {
    const { tabs, activeTabId } = get();
    const index = tabs.findIndex((t) => t.id === tabId);
    if (index <= 0) return;

    const keepTabs = tabs.slice(index);
    const closedTabs = tabs.slice(0, index);
    stopRunnerIfTabClosed(closedTabs.map((t) => t.id));
    const newRecentlyClosed = [...closedTabs, ...get().recentlyClosedTabs].slice(0, 20);

    let nextActiveId = activeTabId;
    if (closedTabs.some((t) => t.id === activeTabId)) {
      nextActiveId = tabId;
    }

    set({ tabs: keepTabs, activeTabId: nextActiveId, recentlyClosedTabs: newRecentlyClosed });
    saveSession(keepTabs, nextActiveId);
  },

  closeSavedTabs: () => {
    const { tabs, activeTabId } = get();
    const dirtyTabs = tabs.filter((t) => t.isDirty);
    const savedTabs = tabs.filter((t) => !t.isDirty);

    if (savedTabs.length === 0) return;

    stopRunnerIfTabClosed(savedTabs.map((t) => t.id));
    const newRecentlyClosed = [...savedTabs, ...get().recentlyClosedTabs].slice(0, 20);

    if (dirtyTabs.length === 0) {
      set({ tabs: [], activeTabId: '', recentlyClosedTabs: newRecentlyClosed });
      saveSession([], '');
      return;
    }

    let nextActiveId = activeTabId;
    if (!dirtyTabs.some((t) => t.id === activeTabId)) {
      nextActiveId = dirtyTabs[0].id;
    }

    set({ tabs: dirtyTabs, activeTabId: nextActiveId, recentlyClosedTabs: newRecentlyClosed });
    saveSession(dirtyTabs, nextActiveId);
  },

  closeAllTabs: () => {
    const { tabs } = get();
    stopRunnerIfTabClosed(tabs.map((t) => t.id));
    const newRecentlyClosed = [...tabs, ...get().recentlyClosedTabs].slice(0, 20);
    set({ tabs: [], activeTabId: '', recentlyClosedTabs: newRecentlyClosed });
    saveSession([], '');
  },

  reorderTabs: (sourceIndex: number, destinationIndex: number) => {
    const { tabs, activeTabId } = get();
    if (
      sourceIndex < 0 ||
      sourceIndex >= tabs.length ||
      destinationIndex < 0 ||
      destinationIndex >= tabs.length ||
      sourceIndex === destinationIndex
    ) {
      return;
    }

    const updated = [...tabs];
    const [movedTab] = updated.splice(sourceIndex, 1);
    updated.splice(destinationIndex, 0, movedTab);

    set({ tabs: updated });
    saveSession(updated, activeTabId);
  },

  renameTab: (tabId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    const { tabs, activeTabId } = get();
    const updated = tabs.map((t) => (t.id === tabId ? { ...t, title: trimmed } : t));
    set({ tabs: updated });
    saveSession(updated, activeTabId);
  },

  duplicateTab: (tabId: string) => {
    const { tabs } = get();
    const tabIndex = tabs.findIndex((t) => t.id === tabId);
    if (tabIndex === -1) return;
    const tab = tabs[tabIndex];

    const newId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    let copyTitle = `${tab.title} (copy)`;
    const dotIndex = tab.title.lastIndexOf('.');
    if (dotIndex > 0) {
      const name = tab.title.substring(0, dotIndex);
      const ext = tab.title.substring(dotIndex);
      copyTitle = `${name} (copy)${ext}`;
    }

    const duplicatedTab: EditorTab = {
      id: newId,
      title: copyTitle,
      content: tab.content,
      originalContent: tab.content,
      isDirty: false,
      language: tab.language,
      encoding: tab.encoding,
      lineEnding: tab.lineEnding,
      sizeBytes: tab.sizeBytes,
      cursorPosition: { ...tab.cursorPosition },
    };

    const newTabs = [...tabs];
    newTabs.splice(tabIndex + 1, 0, duplicatedTab);

    set({ tabs: newTabs, activeTabId: newId });
    saveSession(newTabs, newId);
  },

  reopenClosedTab: () => {
    const { tabs, recentlyClosedTabs } = get();
    if (recentlyClosedTabs.length === 0) return;

    const [tabToReopen, ...remainingRecentlyClosed] = recentlyClosedTabs;
    const safeId = tabs.some((t) => t.id === tabToReopen.id)
      ? `tab-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      : tabToReopen.id;

    const restoredTab: EditorTab = {
      ...tabToReopen,
      id: safeId,
    };

    let newTabs: EditorTab[];
    if (tabs.length === 1 && !tabs[0].content && !tabs[0].isDirty && !tabs[0].filePath) {
      newTabs = [restoredTab];
    } else {
      newTabs = [...tabs, restoredTab];
    }

    set({
      tabs: newTabs,
      activeTabId: safeId,
      recentlyClosedTabs: remainingRecentlyClosed,
    });
    saveSession(newTabs, safeId);
  },

  setActiveTab: (tabId) => {
    set({ activeTabId: tabId });
    saveSession(get().tabs, tabId);
  },

  updateActiveTabContent: (content) => {
    const { tabs, activeTabId } = get();
    let hasChanged = false;
    const updated = tabs.map((tab) => {
      if (tab.id !== activeTabId) return tab;
      if (tab.content === content) return tab;
      hasChanged = true;
      const isDirty = content !== tab.originalContent;
      return {
        ...tab,
        content,
        isDirty,
        sizeBytes: content.length,
      };
    });
    if (!hasChanged) return;
    set({ tabs: updated });
    debouncedSaveSession(updated, activeTabId, 400);
  },

  updateCursorPosition: (line, column, selectionLength) => {
    set({ cursorPosition: { line, column, selectionLength } });
  },

  updateDiagnostics: (tabId, errors, warnings) => {
    const { tabs } = get();
    const currentTab = tabs.find((t) => t.id === tabId);
    if (
      currentTab?.diagnostics &&
      currentTab.diagnostics.errors === errors &&
      currentTab.diagnostics.warnings === warnings
    ) {
      return;
    }
    const updated = tabs.map((tab) => {
      if (tab.id !== tabId) return tab;
      return { ...tab, diagnostics: { errors, warnings } };
    });
    set({ tabs: updated });
  },

  setLanguage: (language) => {
    const { tabs, activeTabId } = get();
    const updated = tabs.map((tab) => {
      if (tab.id !== activeTabId) return tab;
      return { ...tab, language };
    });
    set({ tabs: updated });
  },

  setLineEnding: (lineEnding) => {
    const { tabs, activeTabId } = get();
    const updated = tabs.map((tab) => {
      if (tab.id !== activeTabId) return tab;
      return { ...tab, lineEnding };
    });
    set({ tabs: updated });
  },

  markSaved: (tabId, handle, filePath) => {
    const { tabs } = get();
    const updated = tabs.map((tab) => {
      if (tab.id !== tabId) return tab;
      const fileName = filePath ? filePath.split(/[\\/]/).pop() : undefined;
      return {
        ...tab,
        title: fileName || tab.title,
        filePath: filePath || tab.filePath,
        fileHandle: handle || tab.fileHandle,
        originalContent: tab.content,
        isDirty: false,
      };
    });
    set({ tabs: updated });
    saveSession(updated, get().activeTabId);
  },

  toggleSidebar: () =>
    set((state) => {
      const next = !state.isSidebarOpen;
      try {
        localStorage.setItem('hyperedit_sidebar_open_v1', String(next));
      } catch (e) {}
      return { isSidebarOpen: next };
    }),
  toggleCommandPalette: (open) =>
    set((state) => ({
      isCommandPaletteOpen: open !== undefined ? open : !state.isCommandPaletteOpen,
    })),
  toggleWordWrap: () => set((state) => ({ isWordWrap: !state.isWordWrap })),
  toggleMinimap: () => set((state) => ({ isMinimapEnabled: !state.isMinimapEnabled })),

  switchToNextTab: () => {
    const { tabs, activeTabId, setActiveTab } = get();
    if (tabs.length <= 1) return;
    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    const nextIndex = (currentIndex + 1) % tabs.length;
    setActiveTab(tabs[nextIndex].id);
  },

  switchToPreviousTab: () => {
    const { tabs, activeTabId, setActiveTab } = get();
    if (tabs.length <= 1) return;
    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    setActiveTab(tabs[prevIndex].id);
  },

  switchToTabByIndex: (index: number) => {
    const { tabs, setActiveTab } = get();
    if (index >= 0 && index < tabs.length) {
      setActiveTab(tabs[index].id);
    }
  },

  saveActiveTab: async () => {
    const { tabs, activeTabId, markSaved } = get();
    const activeTab = tabs.find((t) => t.id === activeTabId);
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
      }
    } catch (e) {
      console.error('Failed to save active file:', e);
    }
  },

  saveTabById: async (tabId: string) => {
    const { tabs, markSaved } = get();
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;
    try {
      const result = await saveFileToDisk(
        tab.content,
        tab.fileHandle,
        tab.title,
        tab.filePath
      );
      if (result) {
        markSaved(tab.id, result.handle, result.filePath);
      }
    } catch (e) {
      console.error('Failed to save tab file:', e);
    }
  },
}));

if (typeof window !== 'undefined' && window.electronAPI?.loadSession) {
  window.electronAPI.loadSession().then((diskSession) => {
    const sessionRestoreEnabled = useSettingsStore.getState().settings.sessionRestore;
    if (sessionRestoreEnabled && diskSession && diskSession.tabs && diskSession.tabs.length > 0) {
      const restoredTabs: EditorTab[] = diskSession.tabs.map((t: any) => ({
        ...t,
        originalContent: t.content,
        encoding: 'UTF-8',
        cursorPosition: { line: 1, column: 1, selectionLength: 0 },
      }));
      useEditorStore.setState({
        tabs: restoredTabs,
        activeTabId: diskSession.activeTabId || restoredTabs[0].id,
      });
    }
  }).catch((e) => {
    console.warn('Failed to load session from disk:', e);
  });
}

