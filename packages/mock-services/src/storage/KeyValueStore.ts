export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

interface BrowserStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getBrowserStorage(): BrowserStorage | undefined {
  return (globalThis as { localStorage?: BrowserStorage }).localStorage;
}

export function createMemoryStore(initial: Record<string, string> = {}): KeyValueStore {
  const data = new Map(Object.entries(initial));
  return {
    async getItem(key) {
      return data.get(key) ?? null;
    },
    async setItem(key, value) {
      data.set(key, value);
    },
    async removeItem(key) {
      data.delete(key);
    },
  };
}

export function createWebStorageAdapter(): KeyValueStore {
  return {
    async getItem(key) {
      return getBrowserStorage()?.getItem(key) ?? null;
    },
    async setItem(key, value) {
      getBrowserStorage()?.setItem(key, value);
    },
    async removeItem(key) {
      getBrowserStorage()?.removeItem(key);
    },
  };
}
