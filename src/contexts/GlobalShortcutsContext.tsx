import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

export type ShortcutEvent =
  | 'openCommandPalette'
  | 'openHelp'
  | 'openAccessibilityPanel'
  | 'navigateDashboard'
  | 'requestCloseTopOverlay';

type Handler = () => void;

interface GlobalShortcutsContextValue {
  on: (event: ShortcutEvent, handler: Handler) => () => void;
  emit: (event: ShortcutEvent) => void;
}

const GlobalShortcutsContext = createContext<GlobalShortcutsContextValue | null>(null);

export const useGlobalShortcuts = () => {
  const ctx = useContext(GlobalShortcutsContext);
  if (!ctx) throw new Error('useGlobalShortcuts must be used within GlobalShortcutsProvider');
  return ctx;
};

function isEditableTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  if (!tag) return false;
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    el.isContentEditable ||
    el.getAttribute('role') === 'textbox'
  );
}

function isMacLike() {
  if (typeof navigator === 'undefined') return false;
  const p = (navigator.platform || '').toLowerCase();
  return p.includes('mac') || p.includes('iphone') || p.includes('ipad') || p.includes('ipod');
}

export const GlobalShortcutsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { settings } = useAccessibility();
  const handlersRef = useRef<Map<ShortcutEvent, Set<Handler>>>(new Map());
  const lastKeyRef = useRef<string | null>(null);
  const lastTimeRef = useRef<number>(0);
  const mac = isMacLike();

  const hasListeners = (event: ShortcutEvent) => (handlersRef.current.get(event)?.size ?? 0) > 0;

  const on = useCallback<GlobalShortcutsContextValue['on']>((event, handler) => {
    if (!handlersRef.current.has(event)) handlersRef.current.set(event, new Set());
    const set = handlersRef.current.get(event)!;
    set.add(handler);
    return () => {
      set.delete(handler);
    };
  }, []);

  const emit = useCallback<GlobalShortcutsContextValue['emit']>((event) => {
    const set = handlersRef.current.get(event);
    if (!set) return;
    for (const h of Array.from(set)) {
      try { h(); } catch (e) { /* noop */ }
    }
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!settings.keyboardNavigation) return;

      const targetIsEditable = isEditableTarget(event.target);

      // Always allow Escape to bubble to overlays; we just emit a signal.
      if (event.key === 'Escape') {
        emit('requestCloseTopOverlay');
        return;
      }

      // Do not trigger global shortcuts while user types in inputs/textareas etc.
      if (targetIsEditable) return;

      // Cmd/Ctrl + K => Command Palette
      if ((mac ? event.metaKey : event.ctrlKey) && event.key.toLowerCase() === 'k') {
        if (hasListeners('openCommandPalette')) {
          event.preventDefault();
          emit('openCommandPalette');
        }
        return;
      }

      // Shift + / ("?") => Help / Shortcuts
      if ((event.shiftKey && event.key === '/') || event.key === '?') {
        if (hasListeners('openHelp')) {
          event.preventDefault();
          emit('openHelp');
        }
        return;
      }

      // Alt + / => Accessibility Panel
      if (event.altKey && event.key === '/') {
        if (hasListeners('openAccessibilityPanel')) {
          event.preventDefault();
          emit('openAccessibilityPanel');
        }
        return;
      }

      // Sequences: g then d => navigateDashboard
      const now = Date.now();
      if (event.key.toLowerCase() === 'g') {
        lastKeyRef.current = 'g';
        lastTimeRef.current = now;
        return;
      }
      if (
        event.key.toLowerCase() === 'd' &&
        lastKeyRef.current === 'g' &&
        now - lastTimeRef.current < 600
      ) {
        emit('navigateDashboard');
        lastKeyRef.current = null;
        return;
      }
      // Clear stale sequence
      if (now - lastTimeRef.current >= 600) {
        lastKeyRef.current = null;
      }
    };

    window.addEventListener('keydown', handler, { capture: true });
    return () => window.removeEventListener('keydown', handler, { capture: true } as any);
  }, [emit, settings.keyboardNavigation, mac]);

  const value = useMemo<GlobalShortcutsContextValue>(() => ({ on, emit }), [on, emit]);

  return (
    <GlobalShortcutsContext.Provider value={value}>
      {children}
    </GlobalShortcutsContext.Provider>
  );
};
