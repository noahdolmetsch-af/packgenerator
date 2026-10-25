/**
 * Paket C «Ruhig und persönlich»: reading and writing its settings records (each one travels in every
 * backup and in the automatic sync, like every other settings record).
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';

const plain = (x) => JSON.parse(JSON.stringify(x ?? null));
/** One settings record's value, live (undefined while reading, null when there is none). */
export const settingQ = (key) => liveQuery(async () => (await db.settings.get(key))?.value ?? null);
export const saveSetting = (key, value) => db.settings.put({ key, value: plain(value) });
export const readSetting = async (key) => (await db.settings.get(key))?.value ?? null;
