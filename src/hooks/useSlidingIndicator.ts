import { useCallback, useLayoutEffect, useRef } from 'react';

interface UseSlidingIndicatorOptions {
  activeIndex: number;
}

export function useSlidingIndicator<TContainer extends HTMLElement = HTMLElement>({
  activeIndex,
}: UseSlidingIndicatorOptions) {
  const containerRef = useRef<TContainer>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const hasPositioned = useRef(false);

  const positionIndicator = useCallback(
    (animate: boolean) => {
      const item = itemRefs.current[activeIndex];
      const indicator = indicatorRef.current;
      if (!item || !indicator) return;

      indicator.dataset.animate = animate ? 'true' : 'false';
      indicator.style.setProperty('--indicator-x', `${item.offsetLeft}px`);
      indicator.style.setProperty('--indicator-y', `${item.offsetTop}px`);
      indicator.style.setProperty('--indicator-width', `${item.offsetWidth}px`);
      indicator.style.setProperty('--indicator-height', `${item.offsetHeight}px`);

      if (!animate) {
        void indicator.offsetWidth;
      }

      hasPositioned.current = true;
    },
    [activeIndex],
  );

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      positionIndicator(hasPositioned.current);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [positionIndicator]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const repositionWithoutAnimation = () => positionIndicator(false);
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(repositionWithoutAnimation);

    if (resizeObserver) {
      resizeObserver.observe(container);
    } else {
      window.addEventListener('resize', repositionWithoutAnimation);
    }

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', repositionWithoutAnimation);
    };
  }, [positionIndicator]);

  const setItemRef = useCallback(
    (index: number) => (element: HTMLButtonElement | null) => {
      itemRefs.current[index] = element;
    },
    [],
  );

  return { containerRef, indicatorRef, setItemRef };
}
