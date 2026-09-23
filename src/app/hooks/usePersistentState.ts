import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { persistenceStore } from '../lib/persistence';

export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => persistenceStore.read<T>(key) ?? initialValue);

  useEffect(() => {
    persistenceStore.write(key, value);
  }, [key, value]);

  return [value, setValue] as [T, Dispatch<SetStateAction<T>>];
}
