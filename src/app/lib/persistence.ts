export interface PersistenceStore {
  read<T>(key: string): T | undefined;
  write<T>(key: string, value: T): void;
  remove(key: string): void;
}

class BrowserPersistenceStore implements PersistenceStore {
  read<T>(key: string) {
    try {
      const saved = window.localStorage.getItem(key);
      return saved === null ? undefined : JSON.parse(saved) as T;
    } catch {
      return undefined;
    }
  }

  write<T>(key: string, value: T) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Keep the demo usable when browser storage is unavailable or full.
    }
  }

  remove(key: string) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Removing cached demo data is best-effort.
    }
  }
}

export const persistenceStore: PersistenceStore = new BrowserPersistenceStore();
