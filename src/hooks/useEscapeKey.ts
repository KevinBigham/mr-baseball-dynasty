import { useEffect } from 'react';

/** Calls `onEscape` when the Escape key is pressed. Cleans up on unmount. */
export function useEscapeKey(onEscape: () => void): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onEscape]);
}
