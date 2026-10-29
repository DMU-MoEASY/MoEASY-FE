import { useEffect, useState, useCallback, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { persistenceStore } from '../lib/persistence';

export function usePersistentState<T>(key: string, initialValue: T) {
  const initial = useRef(initialValue);
  const [value, updateValue] = useState<T>(() => persistenceStore.read<T>(key) ?? initial.current);

  useEffect(() => {
    const refresh = () => updateValue(persistenceStore.read<T>(key) ?? initial.current);
    const local = (event: Event) => { if ((event as CustomEvent).detail === key) refresh(); };
    const remote = (event: StorageEvent) => { if (event.key === key || event.key === null) refresh(); };
    refresh();
    window.addEventListener('moeasy:storage', local);
    window.addEventListener('storage', remote);
    return () => { window.removeEventListener('moeasy:storage', local); window.removeEventListener('storage', remote); };
  }, [key]);
  const setValue: Dispatch<SetStateAction<T>> = useCallback(next => {
    const current = persistenceStore.read<T>(key) ?? initial.current;
    const resolved = typeof next === 'function' ? (next as (value:T) => T)(current) : next;
    persistenceStore.write(key, resolved);
    updateValue(resolved);
  }, [key]);

  return [value, setValue] as [T, Dispatch<SetStateAction<T>>];
}
