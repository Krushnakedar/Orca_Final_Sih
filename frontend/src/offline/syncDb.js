import { openDB } from 'idb';

const DB_NAME = 'orca-sync';
const DB_VERSION = 1;
const STORE = 'outbox';

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('by_status', 'status');
          store.createIndex('by_created', 'createdAt');
          store.createIndex('by_idempotencyKey', 'idempotencyKey', {
            unique: true,
          });
        }
      },
    });
  }
  return dbPromise;
}

export async function addAction(action) {
  const db = await getDB();
  await db.add(STORE, action);
}

export async function updateAction(action) {
  const db = await getDB();
  await db.put(STORE, action);
}

export async function getAction(id) {
  const db = await getDB();
  return db.get(STORE, id);
}

export async function listActions() {
  const db = await getDB();
  return db.getAllFromIndex(STORE, 'by_created');
}

export async function listByStatus(status) {
  const db = await getDB();
  return db.getAllFromIndex(STORE, 'by_status', status);
}

export async function deleteAction(id) {
  const db = await getDB();
  await db.delete(STORE, id);
}

export async function clearAll() {
  const db = await getDB();
  await db.clear(STORE);
}
