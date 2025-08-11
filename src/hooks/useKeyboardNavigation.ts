import { useEffect, useCallback } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: () => void;
  onSpace?: () => void;
  autoFocus?: boolean;
  trapFocus?: boolean;
}

export const useKeyboardNavigation = (
  elementRef: React.RefObject<HTMLElement>,
  options: KeyboardNavigationOptions = {}
) => {
  const { settings } = useAccessibility();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!settings.keyboardNavigation) return;

    switch (event.key) {
      case 'Escape':
        if (options.onEscape) {
          event.preventDefault();
          options.onEscape();
        }
        break;
      case 'Enter':
        if (options.onEnter) {
          event.preventDefault();
          options.onEnter();
        }
        break;
      case 'ArrowUp':
        if (options.onArrowUp) {
          event.preventDefault();
          options.onArrowUp();
        }
        break;
      case 'ArrowDown':
        if (options.onArrowDown) {
          event.preventDefault();
          options.onArrowDown();
        }
        break;
      case 'ArrowLeft':
        if (options.onArrowLeft) {
          event.preventDefault();
          options.onArrowLeft();
        }
        break;
      case 'ArrowRight':
        if (options.onArrowRight) {
          event.preventDefault();
          options.onArrowRight();
        }
        break;
      case 'Tab':
        if (options.onTab) {
          options.onTab();
        }
        if (options.trapFocus) {
          handleTabTrapping(event);
        }
        break;
      case ' ':
        if (options.onSpace) {
          event.preventDefault();
          options.onSpace();
        }
        break;
    }
  }, [settings.keyboardNavigation, options]);

  const handleTabTrapping = useCallback((event: KeyboardEvent) => {
    const element = elementRef.current;
    if (!element) return;

    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  }, [elementRef]);

  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.screenReaderOptimized) return;

    const announcer = document.getElementById(
      priority === 'assertive' ? 'accessibility-alerts' : 'accessibility-announcements'
    );
    
    if (announcer) {
      announcer.textContent = message;
    }
  }, [settings.screenReaderOptimized]);

  const moveFocus = useCallback((direction: 'next' | 'previous' | 'first' | 'last') => {
    const element = elementRef.current;
    if (!element) return;

    const focusableElements = Array.from(element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )) as HTMLElement[];

    if (focusableElements.length === 0) return;

    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    let nextIndex = 0;

    switch (direction) {
      case 'next':
        nextIndex = currentIndex + 1;
        if (nextIndex >= focusableElements.length) nextIndex = 0;
        break;
      case 'previous':
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) nextIndex = focusableElements.length - 1;
        break;
      case 'first':
        nextIndex = 0;
        break;
      case 'last':
        nextIndex = focusableElements.length - 1;
        break;
    }

    focusableElements[nextIndex]?.focus();
  }, [elementRef]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('keydown', handleKeyDown);

    // Auto-focus if enabled
    if (options.autoFocus && settings.keyboardNavigation) {
      const firstFocusable = element.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      
      if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 0);
      }
    }

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [elementRef, handleKeyDown, options.autoFocus, settings.keyboardNavigation]);

  return {
    announceToScreenReader,
    moveFocus,
    isKeyboardNavigationEnabled: settings.keyboardNavigation
  };
};