(() => {
  "use strict";

  function createIndexedDbStorage({
    dbName,
    dbVersion,
    onUpgrade,
  }) {
    let dbPromise = null;

    function openDb() {
      if (dbPromise) return dbPromise;
      dbPromise = new Promise((resolve, reject) => {
        const req = window.indexedDB.open(dbName, dbVersion);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (typeof onUpgrade === "function") onUpgrade({ db, req });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      return dbPromise;
    }

    async function get(storeName, key) {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    }

    async function getAll(storeName) {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    }

    async function put(storeName, value) {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.put(value);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }

    // Batch operations for better performance
    async function putBatch(storeName, values) {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
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

    // Get multiple keys at once
    async function getMultiple(storeName, keys) {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const results = {};
        let completed = 0;
        const total = keys.length;
        
        if (total === 0) {
          resolve(results);
          return;
        }
        
        keys.forEach((key) => {
          const req = store.get(key);
          req.onsuccess = () => {
            results[key] = req.result || null;
            completed++;
            if (completed === total) {
              resolve(results);
            }
          };
          req.onerror = () => reject(req.error);
        });
      });
    }

    return { openDb, get, getAll, put, putBatch, getMultiple };
  }

  window.Storage = window.Storage || {};
  window.Storage.createIndexedDbStorage = createIndexedDbStorage;
})();

