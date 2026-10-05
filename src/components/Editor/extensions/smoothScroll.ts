import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';

interface InertialScrollState {
  targetTop: number;
  targetLeft: number;
  rafId: number | null;
}

const scrollStateMap = new WeakMap<HTMLElement, InertialScrollState>();

export function createSmoothScrollExtension(): Extension {
  return EditorView.domEventHandlers({
    wheel(event, view) {
      if (event.ctrlKey || event.altKey) return false;

      const scroller = view.scrollDOM;
      if (!scroller) return false;

      const isDiscrete = event.deltaMode !== 0 || Math.abs(event.deltaY) >= 25 || Math.abs(event.deltaX) >= 25;
      if (!isDiscrete) {
        return false;
      }

      event.preventDefault();

      let state = scrollStateMap.get(scroller);
      if (!state) {
        state = {
          targetTop: scroller.scrollTop,
          targetLeft: scroller.scrollLeft,
          rafId: null,
        };
        scrollStateMap.set(scroller, state);
      }

      if (state.rafId === null) {
        state.targetTop = scroller.scrollTop;
        state.targetLeft = scroller.scrollLeft;
      }

      const maxScrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);

      const deltaY = event.shiftKey ? 0 : event.deltaY;
      const deltaX = event.shiftKey ? event.deltaY : event.deltaX;

      state.targetTop = Math.max(0, Math.min(maxScrollTop, state.targetTop + deltaY * 1.15));
      state.targetLeft = Math.max(0, Math.min(maxScrollLeft, state.targetLeft + deltaX * 1.15));

      if (state.rafId === null) {
        const tick = () => {
          const currentTop = scroller.scrollTop;
          const currentLeft = scroller.scrollLeft;

          const diffY = state!.targetTop - currentTop;
          const diffX = state!.targetLeft - currentLeft;

          const needsScrollY = Math.abs(diffY) > 0.4;
          const needsScrollX = Math.abs(diffX) > 0.4;

          if (needsScrollY || needsScrollX) {
            if (needsScrollY) scroller.scrollTop = currentTop + diffY * 0.2;
            if (needsScrollX) scroller.scrollLeft = currentLeft + diffX * 0.2;
            state!.rafId = requestAnimationFrame(tick);
          } else {
            scroller.scrollTop = state!.targetTop;
            scroller.scrollLeft = state!.targetLeft;
            state!.rafId = null;
          }
        };

        state.rafId = requestAnimationFrame(tick);
      }

      return true;
    },

    mousedown(_event, view) {
      const scroller = view.scrollDOM;
      if (scroller) {
        const state = scrollStateMap.get(scroller);
        if (state && state.rafId !== null) {
          cancelAnimationFrame(state.rafId);
          state.rafId = null;
          state.targetTop = scroller.scrollTop;
          state.targetLeft = scroller.scrollLeft;
        }
      }
      return false;
    },
  });
}

export function smoothScrollToLine(
  view: EditorView,
  lineNumber: number,
  align: 'center' | 'top' = 'center'
): void {
  const lineCount = view.state.doc.lines;
  const targetLine = Math.max(1, Math.min(lineCount, lineNumber));
  const line = view.state.doc.line(targetLine);

  view.dispatch({
    selection: { anchor: line.from },
    scrollIntoView: false,
  });

  const scroller = view.scrollDOM;
  if (!scroller) return;

  const lineBlock = view.lineBlockAt(line.from);
  const targetY =
    align === 'center'
      ? lineBlock.top - scroller.clientHeight / 2 + lineBlock.height / 2
      : lineBlock.top;

  const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
  const clampedTarget = Math.max(0, Math.min(maxScroll, targetY));

  let state = scrollStateMap.get(scroller);
  if (!state) {
    state = {
      targetTop: scroller.scrollTop,
      targetLeft: scroller.scrollLeft,
      rafId: null,
    };
    scrollStateMap.set(scroller, state);
  }

  if (state.rafId !== null) {
    cancelAnimationFrame(state.rafId);
    state.rafId = null;
  }

  state.targetTop = clampedTarget;

  const step = () => {
    const current = scroller.scrollTop;
    const diff = state!.targetTop - current;

    if (Math.abs(diff) > 0.5) {
      scroller.scrollTop = current + diff * 0.16;
      state!.rafId = requestAnimationFrame(step);
    } else {
      scroller.scrollTop = state!.targetTop;
      state!.rafId = null;
    }
  };

  state.rafId = requestAnimationFrame(step);
}
