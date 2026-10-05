import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';

export const gutterLineSelectionExtension = EditorView.domEventHandlers({
  mousedown(event, view) {
    if (event.button !== 0) return false;
    const target = event.target as HTMLElement | null;
    const gutterElement = target?.closest('.cm-lineNumbers .cm-gutterElement');
    if (!gutterElement) return false;

    const parseLineNum = (el: Element | null): number | null => {
      if (!el) return null;
      const num = parseInt(el.textContent || '', 10);
      return !isNaN(num) && num >= 1 && num <= view.state.doc.lines ? num : null;
    };

    const startLineNum = parseLineNum(gutterElement);
    if (!startLineNum) return false;

    const doc = view.state.doc;

    const selectLineRange = (fromNum: number, toNum: number) => {
      const start = Math.min(fromNum, toNum);
      const end = Math.max(fromNum, toNum);
      const startLine = doc.line(start);
      const endLine = doc.line(end);
      const toPos = endLine.to < doc.length ? endLine.to + 1 : endLine.to;

      if (fromNum <= toNum) {
        view.dispatch({
          selection: EditorSelection.range(startLine.from, toPos),
          userEvent: 'select.line',
        });
      } else {
        view.dispatch({
          selection: EditorSelection.range(toPos, startLine.from),
          userEvent: 'select.line',
        });
      }
    };

    if (event.shiftKey) {
      const currentAnchor = view.state.selection.main.anchor;
      const anchorLine = doc.lineAt(currentAnchor).number;
      selectLineRange(anchorLine, startLineNum);
      return true;
    }

    selectLineRange(startLineNum, startLineNum);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const el = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY)?.closest('.cm-lineNumbers .cm-gutterElement') ?? null;
      const currentLine = parseLineNum(el);
      if (currentLine) {
        selectLineRange(startLineNum, currentLine);
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return true;
  },
});
