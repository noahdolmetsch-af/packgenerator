/**
 * Erinnerungen aufs Handy (Web-Push): the browser side. The phone signs up once (Chrome asks
 * «Benachrichtigungen erlauben?»), gets a random code (only on this device, never in a backup) and
 * sends the server its next reminders: when the switches change, when the app opens and when it goes
 * to the background (schedule.js builds the list). The server (api/push.js) sends them at their time;
 * cron-job.org wakes it every minute (Noah «2b»). public/push-sw.js shows them.
 */
import { db } from '../db.js';
import { LAST_BACKUP } from '../backup.js';
import { buildList, pushOf, anyOn, PUSH_KEY } from './schedule.js';

export const PUSH_URL = 'https://packgen-three.vercel.app/api/push';
const TOKEN_KEY = 'push.token';
const SENT_KEY = 'push.sent';
const RESEND_MS = 6 * 3600 * 1000;

const ls = {
  get: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      if (v == null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch {
      /* private window: nothing kept */
    }
  },
};

/** Can this browser get push messages at all? (Chrome on Android: yes; a PWA on iOS only once installed.) */
export const supported = (w = globalThis) => !!(w.navigator?.serviceWorker && w.PushManager && w.Notification);
export const permission = (w = globalThis) => w.Notification?.permission ?? 'default';
export const signedUp = () => !!ls.get(TOKEN_KEY);

function newToken() {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const keyBytes = (b64u) => {
  const s = atob(b64u.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
};

async function post(body, doFetch = fetch) {
  const res = await doFetch(PUSH_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(out.message || 'push'), { code: out.code || 'server' });
  return out;
}

/** The data schedule.js needs, read from this device. */
export async function readData() {
  const [trips, repairs, bikes, settings, meta, items, notes] = await Promise.all([db.trips.toArray(), db.maintenance.toArray(), db.bikes.toArray(), db.settings.bulkGet([PUSH_KEY, 'ownValues', 'merken', 'homePlace', 'air', 'lends', 'eatRemind']), db.table('meta').get(LAST_BACKUP), db.items.toArray(), db.notes.filter((n) => !!n.remind?.at && !n.remind.done).toArray()]);
  const [push, ownValues, merken, homePlace, air, lends, eatRemind] = settings.map((r) => r?.value ?? null);
  // Paket H: supplies (items with a best-before date) and lent things (settings 'lends')
  return { trips, repairs, bikes, notes, items: items.filter((i) => i.expires), lends: Array.isArray(lends) ? lends : [], settings: { push, ownValues, merken, homePlace, air, eatRemind }, lastBackup: meta?.at ?? null, now: new Date() };
}

/** The subscription of this phone (made when missing). Throws { code } when it cannot. */
async function subscription() {
  if (!supported()) throw Object.assign(new Error('unsupported'), { code: 'unsupported' });
  // the server first: when it is not set up, nothing is asked of Chrome
  const res = await fetch(`${PUSH_URL}?a=key`).catch(() => null);
  if (!res) throw Object.assign(new Error('offline'), { code: 'offline' });
  const info = await res.json().catch(() => ({}));
  if (!info.ready || !info.publicKey) throw Object.assign(new Error('not set up'), { code: 'not_set_up' });
  if ((await Notification.requestPermission()) !== 'granted') throw Object.assign(new Error('denied'), { code: 'denied' });
  // the service worker (it is there once the app was opened online; a few seconds at most)
  const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((ok) => setTimeout(() => ok(null), 8000))]);
  if (!reg?.pushManager) throw Object.assign(new Error('no worker'), { code: 'unsupported' });
  const old = await reg.pushManager.getSubscription();
  if (old) return old;
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(info.publicKey) });
}

/** Send the list now (after a switch, or forced). → { items, weather } from the server */
export async function syncNow({ force = false } = {}) {
  const data = await readData();
  const p = pushOf(data.settings.push);
  let token = ls.get(TOKEN_KEY);
  if (!p.on) {
    if (token) await off();
    return null;
  }
  const sub = await subscription();
  token ??= newToken();
  const list = buildList(data);
  const sig = JSON.stringify([sub.endpoint, list]);
  const last = JSON.parse(ls.get(SENT_KEY) ?? 'null');
  if (!force && last?.sig === sig && Date.now() - last.at < RESEND_MS) return null;
  const out = await post({ a: 'save', token, sub: sub.toJSON(), ...list });
  ls.set(TOKEN_KEY, token);
  ls.set(SENT_KEY, JSON.stringify({ sig, at: Date.now() }));
  return out;
}

/** The main switch off: the server forgets this phone, the browser stops listening. */
export async function off() {
  const token = ls.get(TOKEN_KEY);
  ls.set(TOKEN_KEY, null);
  ls.set(SENT_KEY, null);
  if (token) await post({ a: 'off', token }).catch(() => {});
  const reg = await navigator.serviceWorker?.getRegistration?.();
  await (await reg?.pushManager?.getSubscription())?.unsubscribe().catch(() => {});
}

/** «Test senden»: one message right now. */
export async function testNow(title, body) {
  const token = ls.get(TOKEN_KEY);
  if (!token) throw Object.assign(new Error('not signed up'), { code: 'unknown_phone' });
  return post({ a: 'test', token, title, body });
}

/** In the background: when the app opens and when it goes to the background, if push is on here. */
export function startPushSync() {
  if (!supported() || !signedUp()) return () => {};
  const run = () => db.settings.get(PUSH_KEY).then((r) => anyOn(pushOf(r?.value)) && syncNow()).catch(() => {});
  const hidden = () => document.visibilityState === 'hidden' && run();
  run();
  document.addEventListener('visibilitychange', hidden);
  return () => document.removeEventListener('visibilitychange', hidden);
}

/**
 * Paket B (anleitung.md Teil 7): «Adresse für cron-job.org kopieren». The server makes the tick code
 * itself and gives the address only to a device of this server: the key from the Strava login
 * (localStorage, the same name as strava/client.svelte.js KEY_LS) or the Helfer-Code (settings «helper»).
 * Throws { code }: 'no_owner' (neither on this device), 'unauthorized', 'offline', 'server'.
 */
export const STRAVA_KEY_LS = 'pg.strava.key';
export async function ownerKey() {
  const k = ls.get(STRAVA_KEY_LS);
  if (k) return k;
  const helper = await db.settings.get('helper').catch(() => null);
  return typeof helper?.value?.code === 'string' && helper.value.code.trim() ? helper.value.code.trim() : null;
}
export async function cronUrl(doFetch = (...a) => fetch(...a)) {
  const key = await ownerKey();
  if (!key) throw Object.assign(new Error('no owner'), { code: 'no_owner' });
  const res = await doFetch(`${PUSH_URL}?a=cron`, { headers: { Authorization: `Bearer ${key}` } }).catch(() => null);
  if (!res) throw Object.assign(new Error('offline'), { code: 'offline' });
  const out = await res.json().catch(() => ({}));
  if (!res.ok || typeof out.url !== 'string') throw Object.assign(new Error('cron'), { code: out.code || 'server' });
  return out.url;
}
