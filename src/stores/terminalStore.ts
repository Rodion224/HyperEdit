import { create } from 'zustand';
import { useEditorStore } from './editorStore';
import { useWorkspaceStore } from './workspaceStore';
import { useNotificationStore } from './notificationStore';
import { useI18nStore } from './i18nStore';

export interface ConsoleEntry {
  id: string;
  type: 'info' | 'stdout' | 'stderr' | 'success' | 'error';
  text: string;
  time: string;
}

interface TerminalState {
  isConsoleOpen: boolean;
  isTerminalOpen: boolean;
  panelHeight: number;
  isRunningCode: boolean;
  activeRunnerTitle: string | null;
  activeRunnerTabId: string | null;
  consoleEntries: ConsoleEntry[];
  terminalOutput: string[];
  terminalHistory: string[];
  isTerminalInitialized: boolean;

  toggleConsole: (open?: boolean) => void;
  toggleTerminal: (open?: boolean) => void;
  toggleBoth: () => void;
  closeBottomPanel: () => void;
  setPanelHeight: (height: number) => void;
  clearConsole: () => void;
  clearTerminal: () => void;
  runCurrentCode: () => Promise<void>;
  stopCurrentCode: () => Promise<void>;
  initTerminalSession: (force?: boolean) => Promise<void>;
  sendTerminalCommand: (cmd: string) => Promise<void>;
  appendTerminalData: (data: string) => void;
  appendConsoleOutput: (type: 'stdout' | 'stderr', text: string) => void;
  finishCodeRun: (exitCode: number | null, durationMs: number) => void;
}

const getCurrentTime = () => {
  const now = new Date();
  return now.toTimeString().split(' ')[0];
};

const getInitialTerminalBanner = () => {
  const i18n = useI18nStore.getState();
  const sessionText = i18n.t('bottompanel.terminalSession') || 'Windows PowerShell / Shell Terminal Session';
  const typeText = i18n.t('bottompanel.terminalTypeCommand') || 'Type commands and press Enter to execute.';
  return [sessionText, `${typeText}\n`];
};

export const useTerminalStore = create<TerminalState>((set, get) => ({
  isConsoleOpen: false,
  isTerminalOpen: false,
  panelHeight: (() => {
    try {
      const saved = localStorage.getItem('hyperedit_panel_height_v1');
      if (saved) {
        const num = parseInt(saved, 10);
        if (!isNaN(num) && num >= 120 && num <= 800) return num;
      }
    } catch (e) {}
    return 230;
  })(),
  isRunningCode: false,
  activeRunnerTitle: null,
  activeRunnerTabId: null,
  consoleEntries: [
    {
      id: 'init-info',
      type: 'info',
      text: 'HyperEdit Console Output ready. Click Run (F5) or use Terminal below.',
      time: getCurrentTime(),
    },
  ],
  terminalOutput: getInitialTerminalBanner(),
  terminalHistory: [],
  isTerminalInitialized: false,

  toggleConsole: (open) => {
    const next = open !== undefined ? open : !get().isConsoleOpen;
    set({ isConsoleOpen: next });
  },

  toggleTerminal: (open) => {
    const next = open !== undefined ? open : !get().isTerminalOpen;
    set({ isTerminalOpen: next });
    if (next && !get().isTerminalInitialized) {
      get().initTerminalSession();
    }
  },

  toggleBoth: () => {
    const { isConsoleOpen, isTerminalOpen } = get();
    if (isConsoleOpen && isTerminalOpen) {
      set({ isConsoleOpen: false, isTerminalOpen: false });
    } else {
      set({ isConsoleOpen: true, isTerminalOpen: true });
      if (!get().isTerminalInitialized) {
        get().initTerminalSession();
      }
    }
  },

  closeBottomPanel: () => {
    set({ isConsoleOpen: false, isTerminalOpen: false });
  },

  setPanelHeight: (height) => {
    const clamped = Math.max(120, Math.min(height, window.innerHeight * 0.7));
    set({ panelHeight: clamped });
    try {
      localStorage.setItem('hyperedit_panel_height_v1', String(clamped));
    } catch (e) {}
  },

  clearConsole: () => {
    set({
      consoleEntries: [
        {
          id: `clear-${Date.now()}`,
          type: 'info',
          text: 'Console cleared.',
          time: getCurrentTime(),
        },
      ],
    });
  },

  clearTerminal: () => {
    set({ terminalOutput: [] });
  },

  runCurrentCode: async () => {
    if (get().isRunningCode) {
      await get().stopCurrentCode();
      return;
    }

    const editorStore = useEditorStore.getState();
    const activeTab = editorStore.tabs.find((t) => t.id === editorStore.activeTabId);
    if (!activeTab) return;

    const workspaceStore = useWorkspaceStore.getState();
    const cwd = workspaceStore.rootPath || undefined;

    set({
      isConsoleOpen: true,
      isRunningCode: true,
      activeRunnerTitle: activeTab.title,
      activeRunnerTabId: activeTab.id,
    });

    const runId = `run-${Date.now()}`;
    const startTime = getCurrentTime();

    set((state) => ({
      consoleEntries: [
        ...state.consoleEntries.slice(-500),
        {
          id: `${runId}-start`,
          type: 'info',
          text: `[Running] ${activeTab.language} "${activeTab.title}" at ${startTime}...`,
          time: startTime,
        },
      ],
    }));

    if (window.electronAPI?.runCode) {
      try {
        const res = await window.electronAPI.runCode({
          code: activeTab.content,
          language: activeTab.language,
          filePath: activeTab.filePath,
          cwd,
        });

        if (!res.started && res.error) {
          set((state) => ({
            isRunningCode: false,
            activeRunnerTitle: null,
            activeRunnerTabId: null,
            consoleEntries: [
              ...state.consoleEntries.slice(-500),
              {
                id: `${runId}-error`,
                type: 'error',
                text: `[Failed to start] ${res.error}`,
                time: getCurrentTime(),
              },
            ],
          }));
        }
      } catch (err: any) {
        set((state) => ({
          isRunningCode: false,
          activeRunnerTitle: null,
          activeRunnerTabId: null,
          consoleEntries: [
            ...state.consoleEntries.slice(-500),
            {
              id: `${runId}-err`,
              type: 'error',
              text: `[Error] ${err?.message || String(err)}`,
              time: getCurrentTime(),
            },
          ],
        }));
      }
    } else {
      setTimeout(() => {
        if (activeTab.language === 'javascript' || activeTab.language === 'typescript') {
          try {
            const logs: string[] = [];
            const customConsole = {
              log: (...args: any[]) => logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
              error: (...args: any[]) => logs.push('[ERROR] ' + args.join(' ')),
              warn: (...args: any[]) => logs.push('[WARN] ' + args.join(' ')),
            };
            const fn = new Function('console', activeTab.content);
            fn(customConsole);

            set((state) => ({
              isRunningCode: false,
              activeRunnerTitle: null,
              activeRunnerTabId: null,
              consoleEntries: [
                ...state.consoleEntries.slice(-500),
                ...logs.map((l) => ({
                  id: `log-${Math.random()}`,
                  type: 'stdout' as const,
                  text: l,
                  time: getCurrentTime(),
                })),
                {
                  id: `${runId}-browser-done`,
                  type: 'success',
                  text: '[Done] execution completed in browser sandbox (0.02s)',
                  time: getCurrentTime(),
                },
              ],
            }));
          } catch (e: any) {
            set((state) => ({
              isRunningCode: false,
              activeRunnerTitle: null,
              activeRunnerTabId: null,
              consoleEntries: [
                ...state.consoleEntries.slice(-500),
                {
                  id: `${runId}-browser-err`,
                  type: 'error',
                  text: `Runtime Error: ${e.message}`,
                  time: getCurrentTime(),
                },
              ],
            }));
          }
        } else {
          set((state) => ({
            isRunningCode: false,
            activeRunnerTitle: null,
            activeRunnerTabId: null,
            consoleEntries: [
              ...state.consoleEntries.slice(-500),
              {
                id: `${runId}-nobrowser`,
                type: 'info',
                text: `[Info] Native runtime for '${activeTab.language}' is executed through Electron Desktop app.`,
                time: getCurrentTime(),
              },
            ],
          }));
        }
      }, 200);
    }
  },

  stopCurrentCode: async () => {
    set({
      isRunningCode: false,
      activeRunnerTitle: null,
      activeRunnerTabId: null,
    });

    if (window.electronAPI?.stopCode) {
      try {
        await window.electronAPI.stopCode();
      } catch (e) {}
    }

    set((state) => ({
      consoleEntries: [
        ...state.consoleEntries.slice(-500),
        {
          id: `stop-${Date.now()}`,
          type: 'error',
          text: '[Process stopped by user]',
          time: getCurrentTime(),
        },
      ],
    }));
  },

  appendConsoleOutput: (type, text) => {
    if (!get().isRunningCode) return;

    set((state) => {
      const prev = state.consoleEntries.length > 800 ? state.consoleEntries.slice(-400) : state.consoleEntries;
      return {
        consoleEntries: [
          ...prev,
          {
            id: `out-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            type,
            text,
            time: getCurrentTime(),
          },
        ],
      };
    });
  },

  finishCodeRun: (exitCode, durationMs) => {
    const wasRunning = get().isRunningCode;
    set({ isRunningCode: false, activeRunnerTitle: null, activeRunnerTabId: null });
    if (!wasRunning) return;

    const isSuccess = exitCode === 0;
    const durSec = (durationMs / 1000).toFixed(2);
    const i18n = useI18nStore.getState();
    const title = isSuccess
      ? (i18n.t('bottompanel.execSuccess') || 'Код успешно выполнен')
      : (i18n.t('bottompanel.execError') || 'Ошибка выполнения');
    const message = isSuccess
      ? (i18n.t('bottompanel.execFinished') || 'Завершено за {0}с (код 0)').replace('{0}', durSec)
      : (i18n.t('bottompanel.execFailed') || 'Процесс завершился с кодом {0}').replace('{0}', String(exitCode ?? 1));

    useNotificationStore.getState().addNotification({
      title,
      titleKey: isSuccess ? 'bottompanel.execSuccess' : 'bottompanel.execError',
      message,
      messageKey: isSuccess ? 'bottompanel.execFinished' : 'bottompanel.execFailed',
      messageArgs: [isSuccess ? durSec : (exitCode ?? 1)],
      type: isSuccess ? 'success' : 'error',
    });
    set((state) => ({
      consoleEntries: [
        ...state.consoleEntries.slice(-500),
        {
          id: `exit-${Date.now()}`,
          type: isSuccess ? 'success' : 'error',
          text: `[Done] exited with code=${exitCode ?? 0} in ${durSec}s`,
          time: getCurrentTime(),
        },
      ],
    }));
  },

  initTerminalSession: async (force?: boolean) => {
    if (get().isTerminalInitialized && !force) return;
    const workspaceStore = useWorkspaceStore.getState();
    const cwd = workspaceStore.rootPath || undefined;

    if (window.electronAPI?.initTerminal) {
      try {
        const res = await window.electronAPI.initTerminal({ cwd });
        if (res.success) {
          set({
            isTerminalInitialized: true,
            terminalOutput: getInitialTerminalBanner(),
          });
        }
      } catch (err) {
        console.error('Failed to init terminal:', err);
      }
    } else {
      set({
        isTerminalInitialized: true,
        terminalOutput: getInitialTerminalBanner(),
      });
    }
  },

  sendTerminalCommand: async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    set((state) => ({
      terminalHistory: [trimmed, ...state.terminalHistory.filter((h) => h !== trimmed)].slice(0, 50),
      terminalOutput: [...state.terminalOutput, `> ${trimmed}`],
    }));

    if (window.electronAPI?.writeTerminal) {
      await window.electronAPI.writeTerminal(trimmed);
    } else {
      setTimeout(() => {
        set((state) => ({
          terminalOutput: [
            ...state.terminalOutput,
            `Command '${trimmed}' executed (Desktop electron environment required for real shell access).`,
          ],
        }));
      }, 100);
    }
  },

  appendTerminalData: (data: string) => {
    set((state) => ({
      terminalOutput: [...state.terminalOutput, data],
    }));
  },
}));

let prevTerminalLocale = useI18nStore.getState().locale;
useI18nStore.subscribe((state) => {
  if (state.locale !== prevTerminalLocale) {
    prevTerminalLocale = state.locale;
    const { terminalOutput, terminalHistory } = useTerminalStore.getState();
    if (terminalHistory.length === 0 || terminalOutput.length <= 2) {
      useTerminalStore.setState({ terminalOutput: getInitialTerminalBanner() });
    }
  }
});

