import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { createIndexedDbStorage, type StorageConfig } from '../../../../src/services/storage/indexedDB';

describe('IndexedDB Storage', () => {
  let storage: ReturnType<typeof createIndexedDbStorage>;
  const dbName = 'test-db';
  const dbVersion = 1;
  const storeName = 'test-store';

  beforeEach(() => {
    // Clear all databases
    indexedDB.deleteDatabase(dbName);

    const config: StorageConfig = {
      dbName,
      dbVersion,
      onUpgrade: ({ db }) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      },
    };

    storage = createIndexedDbStorage(config);
  });

  describe('openDb', () => {
    it('should open database successfully', async () => {
      const db = await storage.openDb();
      expect(db.name).toBe(dbName);
      expect(db.version).toBe(dbVersion);
    });

    it('should reuse existing connection', async () => {
      const db1 = await storage.openDb();
      const db2 = await storage.openDb();
      expect(db1).toBe(db2);
    });

    it('should call onUpgrade on first open', async () => {
      const onUpgrade = vi.fn();
      const newStorage = createIndexedDbStorage({
        dbName: 'upgrade-test-db',
        dbVersion: 1,
        onUpgrade,
      });

      await newStorage.openDb();
      expect(onUpgrade).toHaveBeenCalled();
    });
  });

  describe('put', () => {
    it('should store a value', async () => {
      const value = { id: '1', name: 'Test' };
      await storage.put(storeName, value);

      const result = await storage.get<typeof value>(storeName, '1');
      expect(result).toEqual(value);
    });

    it('should update existing value', async () => {
      const value1 = { id: '1', name: 'Test1' };
      const value2 = { id: '1', name: 'Test2' };

      await storage.put(storeName, value1);
      await storage.put(storeName, value2);

      const result = await storage.get<typeof value2>(storeName, '1');
      expect(result).toEqual(value2);
    });
  });

  describe('get', () => {
    it('should retrieve stored value', async () => {
      const value = { id: '1', name: 'Test' };
      await storage.put(storeName, value);

      const result = await storage.get<typeof value>(storeName, '1');
      expect(result).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const result = await storage.get(storeName, 'non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should retrieve all values', async () => {
      const values = [
        { id: '1', name: 'Test1' },
        { id: '2', name: 'Test2' },
        { id: '3', name: 'Test3' },
      ];

      for (const value of values) {
        await storage.put(storeName, value);
      }

      const results = await storage.getAll<(typeof values)[0]>(storeName);
      expect(results).toHaveLength(3);
      expect(results).toEqual(expect.arrayContaining(values));
    });

    it('should return empty array for empty store', async () => {
      const results = await storage.getAll(storeName);
      expect(results).toEqual([]);
    });
  });

  describe('putBatch', () => {
    it('should store multiple values at once', async () => {
      const values = [
        { id: '1', name: 'Test1' },
        { id: '2', name: 'Test2' },
        { id: '3', name: 'Test3' },
      ];

      await storage.putBatch(storeName, values);

      const results = await storage.getAll<(typeof values)[0]>(storeName);
      expect(results).toHaveLength(3);
      expect(results).toEqual(expect.arrayContaining(values));
    });

    it('should handle empty batch', async () => {
      await expect(storage.putBatch(storeName, [])).resolves.toBeUndefined();
    });

    it('should update existing values in batch', async () => {
      const initial = [
        { id: '1', name: 'Test1' },
        { id: '2', name: 'Test2' },
      ];
      const updated = [
        { id: '1', name: 'Updated1' },
        { id: '2', name: 'Updated2' },
      ];

      await storage.putBatch(storeName, initial);
      await storage.putBatch(storeName, updated);

      const results = await storage.getAll<(typeof updated)[0]>(storeName);
      expect(results).toEqual(expect.arrayContaining(updated));
    });
  });

  describe('getMultiple', () => {
    it('should retrieve multiple values by keys', async () => {
      const values = [
        { id: '1', name: 'Test1' },
        { id: '2', name: 'Test2' },
        { id: '3', name: 'Test3' },
      ];

      await storage.putBatch(storeName, values);

      const results = await storage.getMultiple<(typeof values)[0]>(storeName, ['1', '3']);
      expect(results).toEqual({
        '1': values[0],
        '3': values[2],
      });
    });

    it('should return null for non-existent keys', async () => {
      await storage.put(storeName, { id: '1', name: 'Test1' });

      const results = await storage.getMultiple(storeName, ['1', 'non-existent']);
      expect(results).toEqual({
        '1': { id: '1', name: 'Test1' },
        'non-existent': null,
      });
    });

    it('should handle empty keys array', async () => {
      const results = await storage.getMultiple(storeName, []);
      expect(results).toEqual({});
    });
  });

  describe('delete', () => {
    it('should delete a record', async () => {
      const value = { id: '1', name: 'Test' };
      await storage.put(storeName, value);

      await storage.delete(storeName, '1');

      const result = await storage.get(storeName, '1');
      expect(result).toBeNull();
    });

    it('should not error when deleting non-existent key', async () => {
      await expect(storage.delete(storeName, 'non-existent')).resolves.toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear all records from store', async () => {
      const values = [
        { id: '1', name: 'Test1' },
        { id: '2', name: 'Test2' },
        { id: '3', name: 'Test3' },
      ];

      await storage.putBatch(storeName, values);
      await storage.clear(storeName);

      const results = await storage.getAll(storeName);
      expect(results).toEqual([]);
    });

    it('should not error when clearing empty store', async () => {
      await expect(storage.clear(storeName)).resolves.toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('should reject on database open error', async () => {
      const badStorage = createIndexedDbStorage({
        dbName: '',
        dbVersion: -1,
        onUpgrade: () => {},
      });

      await expect(badStorage.openDb()).rejects.toBeDefined();
    });

    it('should reject on invalid store name', async () => {
      await storage.openDb();
      await expect(storage.get('invalid-store', '1')).rejects.toBeDefined();
    });
  });
});
