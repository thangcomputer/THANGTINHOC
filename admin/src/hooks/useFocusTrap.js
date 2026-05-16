import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

export function useFocusTrap(active) {
  const ref = useRef(null);

  useEffect(() => {
    if (!active || !ref.current) return;
    const root = ref.current;
    const previouslyFocused = document.activeElement;

    const getFocusable = () => Array.from(root.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);

    const focusFirst = () => {
      const nodes = getFocusable();
      if (nodes[0]) nodes[0].focus();
    };

    const t = setTimeout(focusFirst, 0);

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const nodes = getFocusable();
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    root.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(t);
      root.removeEventListener('keydown', onKeyDown);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [active]);

  return ref;
}