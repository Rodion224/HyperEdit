import React, { useEffect } from 'react';
import { Titlebar } from './components/Titlebar/Titlebar';
import { TabBar } from './components/Tabs/TabBar';
import { Sidebar } from './components/Sidebar/Sidebar';
import { CodeMirrorEditor } from './components/Editor/CodeMirrorEditor';
import { BottomPanel } from './components/BottomPanel/BottomPanel';
import { StatusBar } from './components/StatusBar/StatusBar';
import { CommandPalette } from './components/CommandPalette/CommandPalette';
import { QuickOpenModal } from './components/QuickOpen/QuickOpenModal';
import { SettingsView } from './components/Settings/SettingsView';
import { ToastContainer } from './components/NotificationCenter/ToastContainer';
import { useSettingsStore } from './stores/settingsStore';
import { useEditorStore } from './stores/editorStore';
import { useWorkspaceStore } from './stores/workspaceStore';
import { openFilePath } from './services/fileService';
import { initGlobalHotkeys } from './services/hotkeyService';
import { initGlobalSmoothScroll } from './services/smoothScrollService';

export const App: React.FC = () => {
  const { isSettingsOpen } = useSettingsStore();

  useEffect(() => {
    const unbindHotkeys = initGlobalHotkeys();
    const unbindSmoothScroll = initGlobalSmoothScroll();
    return () => {
      unbindHotkeys();
      unbindSmoothScroll();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) return;

    const handleExternalTarget = async (data: { path: string; isDirectory: boolean }) => {
      if (!data || !data.path) return;
      if (data.isDirectory) {
        await useWorkspaceStore.getState().openFolder(data.path);
      } else {
        const fileResult = await openFilePath(data.path);
        if (fileResult) {
          useEditorStore.getState().openFileTab(fileResult);
        }
      }
    };

    window.electronAPI.getInitialPath?.().then((target) => {
      if (target) {
        handleExternalTarget(target);
      }
    }).catch(() => {});

    const cleanup = window.electronAPI.onOpenExternalPath?.((target) => {
      handleExternalTarget(target);
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-editor-bg">
      <Titlebar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-editor-bg">
          <TabBar />

          <div className="flex-1 overflow-hidden relative">
            <CodeMirrorEditor />
            {isSettingsOpen && <SettingsView />}
          </div>

          <BottomPanel />

          <StatusBar />
        </main>
      </div>

      <CommandPalette />

      <QuickOpenModal />

      <ToastContainer />
    </div>
  );
};
