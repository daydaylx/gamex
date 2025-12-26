/**
 * IndexedDB Storage Service
 * Provides a typed wrapper around IndexedDB for persistent storage
 */

export interface StorageConfig {
  dbName: string;
  dbVersion: number;
  onUpgrade?: (context: { db: IDBDatabase; req: IDBOpenDBRequest }) => void;
}

export interface IndexedDBStorage {
  openDb: () => Promise<IDBDatabase>;
  get: <T>(storeName: string, key: IDBValidKey) => Promise<T | null>;
  getAll: <T>(storeName: string) => Promise<T[]>;
  put: (storeName: string, value: unknown) => Promise<void>;
  putBatch: (storeName: string, values: unknown[]) => Promise<void>;
  getMultiple: <T>(storeName: string, keys: IDBValidKey[]) => Promise<Record<string, T | null>>;
  delete: (storeName: string, key: IDBValidKey) => Promise<void>;
  clear: (storeName: string) => Promise<void>;
}

/**
 * Creates an IndexedDB storage instance with typed operations
 */
export function createIndexedDbStorage(config: StorageConfig): IndexedDBStorage {
  const { dbName, dbVersion, onUpgrade } = config;
  let dbPromise: Promise<IDBDatabase> | null = null;

  function openDb(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
      const req = window.indexedDB.open(dbName, dbVersion);

      req.onupgradeneeded = () => {
        const db = req.result;
        if (typeof onUpgrade === 'function') {
          onUpgrade({ db, req });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    return dbPromise;
  }

  async function get<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);

      req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  async function getAll<T>(storeName: string): Promise<T[]> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = () => resolve((req.result as T[]) ?? []);
      req.onerror = () => reject(req.error);
    });
  }

  async function put(storeName: string, value: unknown): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function putBatch(storeName: string, values: unknown[]): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      let completed = 0;
      const total = values.length;

      if (total === 0) {
        resolve();
        return;
      }

      values.forEach((value) => {
        const req = store.put(value);
        req.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        req.onerror = () => reject(req.error);
      });
    });
  }

  async function getMultiple<T>(
    storeName: string,
    keys: IDBValidKey[]
  ): Promise<Record<string, T | null>> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const results: Record<string, T | null> = {};
      let completed = 0;
      const total = keys.length;

      if (total === 0) {
        resolve(results);
        return;
      }

      keys.forEach((key) => {
        const req = store.get(key);
        req.onsuccess = () => {
          results[String(key)] = (req.result as T | undefined) ?? null;
          completed++;
          if (completed === total) {
            resolve(results);
          }
        };
        req.onerror = () => reject(req.error);
      });
    });
  }

  async function deleteRecord(storeName: string, key: IDBValidKey): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function clear(storeName: string): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  return {
    openDb,
    get,
    getAll,
    put,
    putBatch,
    getMultiple,
    delete: deleteRecord,
    clear,
  };
}

// Standalone instance for simple usage
let defaultInstance: IndexedDBStorage | null = null;
let currentDbName = '';
let currentDbVersion = 0;

/**
 * Initializes or retrieves the default IndexedDB instance
 */
export function init(dbName: string, dbVersion: number): Promise<IDBDatabase> {
  if (defaultInstance && dbName === currentDbName && dbVersion === currentDbVersion) {
    return defaultInstance.openDb();
  }

  currentDbName = dbName;
  currentDbVersion = dbVersion;

  defaultInstance = createIndexedDbStorage({
    dbName,
    dbVersion,
    onUpgrade: ({ db, req }) => {
      // Basic upgrade: create stores if they don't exist
      const storeNames = ['sessions', 'responses'];

      // Access oldVersion from the transaction object
      const oldVersion = (req as IDBOpenDBRequest & { oldVersion: number }).oldVersion;

      // Remove old stores if version < 2 (breaking change for v2)
      if (oldVersion && oldVersion < 2) {
        for (const name of storeNames) {
          if (db.objectStoreNames.contains(name)) {
            db.deleteObjectStore(name);
          }
        }
      }

      // Create stores
      for (const name of storeNames) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'id' });
        }
      }
    },
  });

  return defaultInstance.openDb();
}

/**
 * Gets a value from the default instance
 */
export function get<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
  if (!defaultInstance) throw new Error('IndexedDB not initialized. Call init() first.');
  return defaultInstance.get<T>(storeName, key);
}

/**
 * Gets all values from the default instance
 */
export function getAll<T>(storeName: string): Promise<T[]> {
  if (!defaultInstance) throw new Error('IndexedDB not initialized. Call init() first.');
  return defaultInstance.getAll<T>(storeName);
}

/**
 * Puts a value in the default instance
 */
export function put(storeName: string, value: unknown): Promise<void> {
  if (!defaultInstance) throw new Error('IndexedDB not initialized. Call init() first.');
  return defaultInstance.put(storeName, value);
}
