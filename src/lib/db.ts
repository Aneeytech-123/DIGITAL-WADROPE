/**
 * Tiny IndexedDB wrapper. App data is stored as one JSON document,
 * photos as Blobs in their own store (localStorage is too small for images).
 * Falls back to memory when IndexedDB is unavailable (e.g. private mode).
 */

const DB_NAME = "digital-wardrobe";
const DB_VERSION = 1;
const KV = "kv";
const PHOTOS = "photos";

let dbPromise: Promise<IDBDatabase | null> | null = null;
const memory = { kv: new Map<string, unknown>(), photos: new Map<string, Blob>() };

function open(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(KV)) db.createObjectStore(KV);
        if (!db.objectStoreNames.contains(PHOTOS)) db.createObjectStore(PHOTOS);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function run<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  return open().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        if (!db) return resolve(undefined);
        const tx = db.transaction(store, mode);
        const req = fn(tx.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

export async function getValue<T>(key: string): Promise<T | undefined> {
  const db = await open();
  if (!db) return memory.kv.get(key) as T | undefined;
  return run<T>(KV, "readonly", (s) => s.get(key) as IDBRequest<T>);
}

export async function setValue(key: string, value: unknown): Promise<void> {
  const db = await open();
  if (!db) {
    memory.kv.set(key, value);
    return;
  }
  await run(KV, "readwrite", (s) => s.put(value, key));
}

export async function putPhoto(id: string, blob: Blob): Promise<void> {
  const db = await open();
  if (!db) {
    memory.photos.set(id, blob);
    return;
  }
  await run(PHOTOS, "readwrite", (s) => s.put(blob, id));
}

export async function getPhoto(id: string): Promise<Blob | undefined> {
  const db = await open();
  if (!db) return memory.photos.get(id);
  return run<Blob>(PHOTOS, "readonly", (s) => s.get(id) as IDBRequest<Blob>);
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await open();
  if (!db) {
    memory.photos.delete(id);
    return;
  }
  await run(PHOTOS, "readwrite", (s) => s.delete(id));
}

export async function clearAll(): Promise<void> {
  memory.kv.clear();
  memory.photos.clear();
  const db = await open();
  if (!db) return;
  await run(KV, "readwrite", (s) => s.clear());
  await run(PHOTOS, "readwrite", (s) => s.clear());
}
