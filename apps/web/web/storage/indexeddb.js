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

    return { openDb, get, getAll, put };
  }

  window.Storage = window.Storage || {};
  window.Storage.createIndexedDbStorage = createIndexedDbStorage;
})();

