import { EditorView } from '@codemirror/view';
import {
  undo,
  redo,
  selectAll,
  toggleComment,
  copyLineDown,
  copyLineUp,
  moveLineDown,
  moveLineUp,
  deleteLine,
} from '@codemirror/commands';
import {
  openSearchPanel,
  closeSearchPanel,
  selectNextOccurrence,
  gotoLine,
} from '@codemirror/search';
import { nextDiagnostic } from '@codemirror/lint';

let currentEditorView: EditorView | null = null;

export const setActiveEditorView = (view: EditorView | null) => {
  currentEditorView = view;
};

export const getActiveEditorView = (): EditorView | null => {
  return currentEditorView;
};

export const editorActions = {
  find: (): boolean => {
    if (currentEditorView) {
      openSearchPanel(currentEditorView);
      return true;
    }
    return false;
  },
  replace: (): boolean => {
    if (currentEditorView) {
      openSearchPanel(currentEditorView);
      return true;
    }
    return false;
  },
  closeSearch: (): boolean => {
    if (currentEditorView) {
      closeSearchPanel(currentEditorView);
      return true;
    }
    return false;
  },
  toggleComment: (): boolean => {
    if (currentEditorView) {
      return toggleComment(currentEditorView);
    }
    return false;
  },
  selectNextOccurrence: (): boolean => {
    if (currentEditorView) {
      return selectNextOccurrence(currentEditorView);
    }
    return false;
  },
  undo: (): boolean => {
    if (currentEditorView) {
      return undo(currentEditorView);
    }
    return false;
  },
  redo: (): boolean => {
    if (currentEditorView) {
      return redo(currentEditorView);
    }
    return false;
  },
  selectAll: (): boolean => {
    if (currentEditorView) {
      return selectAll(currentEditorView);
    }
    return false;
  },
  deleteLine: (): boolean => {
    if (currentEditorView) {
      return deleteLine(currentEditorView);
    }
    return false;
  },
  moveLineUp: (): boolean => {
    if (currentEditorView) {
      return moveLineUp(currentEditorView);
    }
    return false;
  },
  moveLineDown: (): boolean => {
    if (currentEditorView) {
      return moveLineDown(currentEditorView);
    }
    return false;
  },
  copyLineUp: (): boolean => {
    if (currentEditorView) {
      return copyLineUp(currentEditorView);
    }
    return false;
  },
  copyLineDown: (): boolean => {
    if (currentEditorView) {
      return copyLineDown(currentEditorView);
    }
    return false;
  },
  gotoLine: (): boolean => {
    if (currentEditorView) {
      return gotoLine(currentEditorView);
    }
    return false;
  },
  nextDiagnostic: (): boolean => {
    if (currentEditorView) {
      nextDiagnostic(currentEditorView);
      return true;
    }
    return false;
  },
  focus: (): void => {
    if (currentEditorView) {
      currentEditorView.focus();
    }
  },
};
