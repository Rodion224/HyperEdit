import { useEditorStore } from '../stores/editorStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useTerminalStore } from '../stores/terminalStore';
import { openLocalFile, saveFileToDisk } from './fileService';
import { editorActions } from './activeViewService';

function matchKey(
  e: KeyboardEvent,
  code: string,
  charList: string[] = []
): boolean {
  if (e.code === code) return true;
  const key = e.key.toLowerCase();
  return charList.some((c) => c.toLowerCase() === key);
}

export function initGlobalHotkeys(): () => void {
  const handleKeyDown = async (e: KeyboardEvent) => {
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    const hasShift = e.shiftKey;
    const hasAlt = e.altKey;

    const editorStore = useEditorStore.getState();
    const settingsStore = useSettingsStore.getState();
    const workspaceStore = useWorkspaceStore.getState();

    if (e.key === 'Escape' || e.code === 'Escape') {
      if (workspaceStore.isQuickOpenOpen) {
        e.preventDefault();
        e.stopPropagation();
        workspaceStore.toggleQuickOpen(false);
        editorActions.focus();
        return;
      }
      if (editorStore.isCommandPaletteOpen) {
        e.preventDefault();
        e.stopPropagation();
        editorStore.toggleCommandPalette(false);
        return;
      }
      if (settingsStore.isSettingsOpen) {
        e.preventDefault();
        e.stopPropagation();
        settingsStore.toggleSettings(false);
        editorActions.focus();
        return;
      }
      if (editorActions.closeSearch()) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      return;
    }

    if (
      (!isCtrlOrCmd && !hasShift && !hasAlt && (e.code === 'F1' || e.key === 'F1')) ||
      (isCtrlOrCmd && hasShift && !hasAlt && matchKey(e, 'KeyP', ['p', 'з']))
    ) {
      e.preventDefault();
      e.stopPropagation();
      editorStore.toggleCommandPalette();
      return;
    }

    if (isCtrlOrCmd && !hasShift && !hasAlt && matchKey(e, 'KeyP', ['p', 'з'])) {
      e.preventDefault();
      e.stopPropagation();
      workspaceStore.toggleQuickOpen();
      return;
    }

    if (
      (!hasAlt && (e.code === 'F5' || e.key === 'F5')) ||
      (isCtrlOrCmd && !hasAlt && (e.code === 'F5' || e.key === 'F5'))
    ) {
      e.preventDefault();
      e.stopPropagation();
      useTerminalStore.getState().runCurrentCode();
      return;
    }

    if (
      isCtrlOrCmd &&
      !hasShift &&
      !hasAlt &&
      (e.code === 'Backquote' || e.key === '`' || e.key === '~' || e.key === 'ё' || e.key === 'Ё')
    ) {
      e.preventDefault();
      e.stopPropagation();
      useTerminalStore.getState().toggleTerminal();
      return;
    }

    if (isCtrlOrCmd && !hasShift && !hasAlt && matchKey(e, 'KeyJ', ['j', 'о'])) {
      e.preventDefault();
      e.stopPropagation();
      const termState = useTerminalStore.getState();
      if (termState.isConsoleOpen || termState.isTerminalOpen) {
        termState.closeBottomPanel();
      } else {
        termState.toggleBoth();
      }
      return;
    }

    if (!isCtrlOrCmd) return;

    if (isCtrlOrCmd && hasShift && !hasAlt && matchKey(e, 'KeyS', ['s', 'ы'])) {
      e.preventDefault();
      e.stopPropagation();
      const activeTab = editorStore.tabs.find((t) => t.id === editorStore.activeTabId);
      if (activeTab) {
        try {
          const result = await saveFileToDisk(
            activeTab.content,
            undefined,
            activeTab.title,
            undefined
          );
          if (result) editorStore.markSaved(activeTab.id, result.handle, result.filePath);
        } catch (err) {
          console.error('Save As error:', err);
        }
      }
      return;
    }

    if (isCtrlOrCmd && !hasShift && !hasAlt && matchKey(e, 'KeyS', ['s', 'ы'])) {
      e.preventDefault();
      e.stopPropagation();
      await editorStore.saveActiveTab();
      return;
    }

    if (isCtrlOrCmd && !hasShift && !hasAlt && matchKey(e, 'KeyO', ['o', 'щ'])) {
      e.preventDefault();
      e.stopPropagation();
      const file = await openLocalFile();
      if (file) editorStore.openFileTab(file);
      return;
    }

    if (isCtrlOrCmd && !hasShift && !hasAlt && matchKey(e, 'KeyN', ['n', 'т'])) {
      e.preventDefault();
      e.stopPropagation();
      editorStore.openNewTab();
      return;
    }

    if (isCtrlOrCmd && !hasShift && !hasAlt && matchKey(e, 'KeyW', ['w', 'ц'])) {
      e.preventDefault();
      e.stopPropagation();
      if (settingsStore.isSettingsOpen) {
        settingsStore.toggleSettings(false);
      } else {
        editorStore.closeTab(editorStore.activeTabId);
      }
      return;
    }

    if (isCtrlOrCmd && hasShift && !hasAlt && matchKey(e, 'KeyT', ['t', 'е'])) {
      e.preventDefault();
      e.stopPropagation();
      editorStore.reopenClosedTab();
      return;
    }

    if (
      isCtrlOrCmd &&
      !hasShift &&
      !hasAlt &&
      (matchKey(e, 'Comma', [',', '<', 'б']) || matchKey(e, 'KeyP', []) === false && e.key === ',')
    ) {
      e.preventDefault();
      e.stopPropagation();
      settingsStore.toggleSettings();
      return;
    }

    if (isCtrlOrCmd && !hasShift && !hasAlt && matchKey(e, 'KeyB', ['b', 'и'])) {
      e.preventDefault();
      e.stopPropagation();
      editorStore.toggleSidebar();
      return;
    }

    if (isCtrlOrCmd && (e.code === 'Tab' || e.key === 'Tab')) {
      e.preventDefault();
      e.stopPropagation();
      if (hasShift) {
        editorStore.switchToPreviousTab();
      } else {
        editorStore.switchToNextTab();
      }
      return;
    }

    if (isCtrlOrCmd && (e.code === 'PageDown' || e.key === 'PageDown')) {
      e.preventDefault();
      e.stopPropagation();
      editorStore.switchToNextTab();
      return;
    }
    if (isCtrlOrCmd && (e.code === 'PageUp' || e.key === 'PageUp')) {
      e.preventDefault();
      e.stopPropagation();
      editorStore.switchToPreviousTab();
      return;
    }

    if (isCtrlOrCmd && !hasShift && !hasAlt && e.code.startsWith('Digit')) {
      const digit = parseInt(e.code.replace('Digit', ''), 10);
      if (digit >= 1 && digit <= 9) {
        e.preventDefault();
        e.stopPropagation();
        editorStore.switchToTabByIndex(digit - 1);
        return;
      }
    }

    if (isCtrlOrCmd && !hasShift && !hasAlt && matchKey(e, 'KeyF', ['f', 'а'])) {
      e.preventDefault();
      e.stopPropagation();
      editorActions.find();
      return;
    }

    if (isCtrlOrCmd && !hasShift && !hasAlt && matchKey(e, 'KeyH', ['h', 'р'])) {
      e.preventDefault();
      e.stopPropagation();
      editorActions.replace();
      return;
    }

    if (
      isCtrlOrCmd &&
      !hasAlt &&
      (matchKey(e, 'Slash', ['/', '.', '?']) || e.key === '/' || e.key === '.')
    ) {
      e.preventDefault();
      e.stopPropagation();
      editorActions.toggleComment();
      return;
    }

    if (isCtrlOrCmd && !hasShift && !hasAlt && matchKey(e, 'KeyD', ['d', 'в'])) {
      e.preventDefault();
      e.stopPropagation();
      editorActions.selectNextOccurrence();
      return;
    }

    if (isCtrlOrCmd && !hasShift && !hasAlt && matchKey(e, 'KeyG', ['g', 'п'])) {
      e.preventDefault();
      e.stopPropagation();
      editorActions.gotoLine();
      return;
    }

    if (isCtrlOrCmd && !hasShift && !hasAlt && matchKey(e, 'KeyA', ['a', 'ф'])) {
      e.preventDefault();
      e.stopPropagation();
      editorActions.selectAll();
      return;
    }

    if (isCtrlOrCmd && !hasShift && !hasAlt && matchKey(e, 'KeyZ', ['z', 'я'])) {
      e.preventDefault();
      e.stopPropagation();
      editorActions.undo();
      return;
    }

    if (
      (isCtrlOrCmd && !hasShift && !hasAlt && matchKey(e, 'KeyY', ['y', 'н'])) ||
      (isCtrlOrCmd && hasShift && !hasAlt && matchKey(e, 'KeyZ', ['z', 'я']))
    ) {
      e.preventDefault();
      e.stopPropagation();
      editorActions.redo();
      return;
    }
  };

  window.addEventListener('keydown', handleKeyDown, true);

  return () => {
    window.removeEventListener('keydown', handleKeyDown, true);
  };
}
