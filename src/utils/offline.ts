import { openDB, IDBPDatabase } from 'idb';
import type { OfflineMessageQueue } from '@/modules/messages/types';

const DB_NAME = 'foodbridge_offline';
const STORE_NAME = 'message_queue';

export const initOfflineDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
    },
  });
};

export const queueOfflineMessage = async (payload: any) => {
  const db = await initOfflineDB();
  await db.add(STORE_NAME, { payload, timestamp: Date.now() });
};

export const getQueuedMessages = async (): Promise<OfflineMessageQueue[]> => {
  const db = await initOfflineDB();
  return db.getAll(STORE_NAME);
};

export const clearQueuedMessage = async (id: number) => {
  const db = await initOfflineDB();
  await db.delete(STORE_NAME, id);
};