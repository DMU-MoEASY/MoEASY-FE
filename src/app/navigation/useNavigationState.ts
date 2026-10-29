import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { flushSync } from 'react-dom';

let pending: Array<() => void> = [];
let scheduled = false;

// Commit route and screen state together; animation belongs to page content only.
export function navigateSmoothly(update: () => void) {
  pending.push(update);
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    const updates = pending;
    pending = [];
    const commit = () => flushSync(() => updates.forEach(action => action()));
    commit();
  });
}

export function useNavigationState<T>(initial: T | (() => T)) {
  const [value, update] = useState(initial);
  const setValue: Dispatch<SetStateAction<T>> = useCallback(next => {
    navigateSmoothly(() => update(next));
  }, []);
  return [value, setValue] as const;
}
