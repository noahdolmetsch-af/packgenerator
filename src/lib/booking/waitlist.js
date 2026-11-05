/**
 * Waiting list (Noah 04.11.2026 «7a»): people who want a time that is full. Kept only on this device
 * (settings «booking.waitlist», also in the backup). { id, offer, slot, name, contact, addedAt }.
 * When a place is free again, Heute shows a hint and a message is ready (Noah sends it himself).
 */
import { db as appDb } from '../db.js';
import { localDay } from '../localday.js';

export const WAITLIST_KEY = 'booking.waitlist';

export async function listWaiting(db = appDb) {
  const v = (await db.settings.get(WAITLIST_KEY))?.value;
  return Array.isArray(v) ? v : [];
}
const save = (list, db) => db.settings.put({ key: WAITLIST_KEY, value: JSON.parse(JSON.stringify(list)) });

export async function addWaiting({ offer, slot, name, contact = '' }, db = appDb, id = crypto.randomUUID(), today = localDay()) {
  const n = String(name ?? '').trim();
  if (!n) return listWaiting(db);
  const list = await listWaiting(db);
  if (list.some((w) => w.slot === slot && w.offer === offer && w.name.toLowerCase() === n.toLowerCase())) return list;
  const next = [...list, { id, offer, slot, name: n, contact: String(contact).trim(), addedAt: today }];
  await save(next, db);
  return next;
}

export async function removeWaiting(id, db = appDb) {
  const next = (await listWaiting(db)).filter((w) => w.id !== id);
  await save(next, db);
  return next;
}
