import { useCallback, useState } from 'react';

export type RovingOrientation = 'vertical' | 'horizontal' | 'both';

interface UseRovingFocusOptions {
  orientation?: RovingOrientation;
  loop?: boolean;
  initialIndex?: number;
}

interface RootProps {
  'data-rf-root': '';
}

interface ItemProps {
  tabIndex: number;
  'data-rf-item': '';
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
}

export function useRovingFocus(itemCount: number, options: UseRovingFocusOptions = {}) {
  const { orientation = 'both', loop = true, initialIndex = 0 } = options;
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const getRootProps = useCallback<() => RootProps>(() => ({ 'data-rf-root': '' }), []);

  const getRovingProps = useCallback(
    (index: number): ItemProps => {
      const move = (next: number, e: React.KeyboardEvent<HTMLElement>) => {
        e.preventDefault();
        const root = (e.currentTarget.closest('[data-rf-root]') || e.currentTarget.parentElement) as HTMLElement | null;
        if (!root) { setActiveIndex(next); return; }
        const items = Array.from(root.querySelectorAll<HTMLElement>('[data-rf-item]'));
        const clamped = loop
          ? (next + items.length) % items.length
          : Math.max(0, Math.min(items.length - 1, next));
        setActiveIndex(clamped);
        items[clamped]?.focus();
      };

      const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
        const key = e.key;
        const isVertical = orientation === 'vertical' || orientation === 'both';
        const isHorizontal = orientation === 'horizontal' || orientation === 'both';

        if (isVertical && (key === 'ArrowUp' || key === 'ArrowDown')) {
          move(index + (key === 'ArrowDown' ? 1 : -1), e);
          return;
        }
        if (isHorizontal && (key === 'ArrowLeft' || key === 'ArrowRight')) {
          move(index + (key === 'ArrowRight' ? 1 : -1), e);
          return;
        }
        if (key === 'Home') { move(0, e); return; }
        if (key === 'End') { move(itemCount - 1, e); return; }
        if (key === 'Enter' || key === ' ') {
          // Let the consumer handle activation; prevent accidental page scroll on Space
          e.preventDefault();
          (e.currentTarget as HTMLElement).click?.();
          return;
        }
      };

      return {
        tabIndex: index === activeIndex ? 0 : -1,
        'data-rf-item': '',
        onKeyDown,
      };
    },
    [activeIndex, itemCount, loop, orientation]
  );

  return { activeIndex, setActiveIndex, getRootProps, getRovingProps };
}
