interface InertiaScrollState {
  targetTop: number;
  targetLeft: number;
  rafId: number | null;
}

const scrollStateMap = new WeakMap<HTMLElement, InertiaScrollState>();

function findScrollableParent(
  target: HTMLElement | null,
  deltaY: number,
  deltaX: number
): HTMLElement | null {
  let node: HTMLElement | null = target;

  while (node && node !== document.body && node !== document.documentElement) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    const overflowX = style.overflowX;

    const hasScrollY =
      (overflowY === 'auto' || overflowY === 'scroll') &&
      node.scrollHeight > node.clientHeight + 1;

    const hasScrollX =
      (overflowX === 'auto' || overflowX === 'scroll') &&
      node.scrollWidth > node.clientWidth + 1;

    let canScrollY = false;
    if (hasScrollY && deltaY !== 0) {
      if (deltaY < 0 && node.scrollTop > 0) canScrollY = true;
      if (
        deltaY > 0 &&
        Math.ceil(node.scrollTop + node.clientHeight) < node.scrollHeight
      ) {
        canScrollY = true;
      }
    }

    let canScrollX = false;
    if (hasScrollX && deltaX !== 0) {
      if (deltaX < 0 && node.scrollLeft > 0) canScrollX = true;
      if (
        deltaX > 0 &&
        Math.ceil(node.scrollLeft + node.clientWidth) < node.scrollWidth
      ) {
        canScrollX = true;
      }
    }

    if (canScrollY || canScrollX) {
      return node;
    }

    node = node.parentElement;
  }

  return null;
}

export function smoothScrollElementTo(
  element: HTMLElement,
  targetScrollTop: number,
  durationMs = 250
): void {
  const maxScroll = Math.max(0, element.scrollHeight - element.clientHeight);
  const clampedTarget = Math.max(0, Math.min(maxScroll, targetScrollTop));

  let state = scrollStateMap.get(element);
  if (!state) {
    state = {
      targetTop: element.scrollTop,
      targetLeft: element.scrollLeft,
      rafId: null,
    };
    scrollStateMap.set(element, state);
  }

  if (state.rafId !== null) {
    cancelAnimationFrame(state.rafId);
    state.rafId = null;
  }

  state.targetTop = clampedTarget;

  const step = () => {
    const current = element.scrollTop;
    const diff = state!.targetTop - current;

    if (Math.abs(diff) > 0.5) {
      element.scrollTop = current + diff * 0.18;
      state!.rafId = requestAnimationFrame(step);
    } else {
      element.scrollTop = state!.targetTop;
      state!.rafId = null;
    }
  };

  state.rafId = requestAnimationFrame(step);
}

export function initGlobalSmoothScroll(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleWheel = (event: WheelEvent) => {
    if (event.defaultPrevented || event.ctrlKey || event.altKey) return;

    const isDiscrete =
      event.deltaMode !== 0 ||
      Math.abs(event.deltaY) >= 20 ||
      Math.abs(event.deltaX) >= 20;

    if (!isDiscrete) return;

    const deltaY = event.shiftKey ? 0 : event.deltaY;
    const deltaX = event.shiftKey ? event.deltaY : event.deltaX;

    const scrollContainer = findScrollableParent(
      event.target as HTMLElement | null,
      deltaY,
      deltaX
    );

    if (!scrollContainer) return;

    event.preventDefault();

    let state = scrollStateMap.get(scrollContainer);
    if (!state) {
      state = {
        targetTop: scrollContainer.scrollTop,
        targetLeft: scrollContainer.scrollLeft,
        rafId: null,
      };
      scrollStateMap.set(scrollContainer, state);
    }

    if (state.rafId === null) {
      state.targetTop = scrollContainer.scrollTop;
      state.targetLeft = scrollContainer.scrollLeft;
    }

    const maxScrollTop = Math.max(
      0,
      scrollContainer.scrollHeight - scrollContainer.clientHeight
    );
    const maxScrollLeft = Math.max(
      0,
      scrollContainer.scrollWidth - scrollContainer.clientWidth
    );

    state.targetTop = Math.max(
      0,
      Math.min(maxScrollTop, state.targetTop + deltaY * 1.15)
    );
    state.targetLeft = Math.max(
      0,
      Math.min(maxScrollLeft, state.targetLeft + deltaX * 1.15)
    );

    if (state.rafId === null) {
      scrollContainer.style.scrollBehavior = 'auto';
      const tick = () => {
        const currentTop = scrollContainer.scrollTop;
        const currentLeft = scrollContainer.scrollLeft;

        const diffY = state!.targetTop - currentTop;
        const diffX = state!.targetLeft - currentLeft;

        const movingY = Math.abs(diffY) > 0.4;
        const movingX = Math.abs(diffX) > 0.4;

        if (movingY || movingX) {
          if (movingY) scrollContainer.scrollTop = currentTop + diffY * 0.2;
          if (movingX) scrollContainer.scrollLeft = currentLeft + diffX * 0.2;
          state!.rafId = requestAnimationFrame(tick);
        } else {
          scrollContainer.scrollTop = state!.targetTop;
          scrollContainer.scrollLeft = state!.targetLeft;
          scrollContainer.style.scrollBehavior = '';
          state!.rafId = null;
        }
      };

      state.rafId = requestAnimationFrame(tick);
    }
  };

  const handlePointerDown = (event: PointerEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const container = findScrollableParent(target, 1, 0);
    if (container) {
      const state = scrollStateMap.get(container);
      if (state && state.rafId !== null) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
        state.targetTop = container.scrollTop;
        state.targetLeft = container.scrollLeft;
        container.style.scrollBehavior = '';
      }
    }
  };

  window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
  window.addEventListener('pointerdown', handlePointerDown, { capture: true });

  return () => {
    window.removeEventListener('wheel', handleWheel, { capture: true });
    window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
  };
}
