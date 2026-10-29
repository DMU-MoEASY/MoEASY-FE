import { useLayoutEffect, useRef } from 'react';

export function useScrollMemory(screen: string) {
  const positions = useRef(new Map<string, number>());
  const current = useRef(screen);
  const lastY = useRef(window.scrollY);
  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    const remember = () => { lastY.current = window.scrollY; positions.current.set(current.current, window.scrollY); };
    window.addEventListener('scroll', remember, { passive: true });
    return () => { window.removeEventListener('scroll', remember); window.history.scrollRestoration = previous; };
  }, []);
  useLayoutEffect(() => {
    if (current.current === screen) return;
    positions.current.set(current.current, lastY.current);
    current.current = screen;
    const top = positions.current.get(screen) ?? 0;
    window.scrollTo({ top, behavior: 'instant' });
    lastY.current = top;
  }, [screen]);
}
