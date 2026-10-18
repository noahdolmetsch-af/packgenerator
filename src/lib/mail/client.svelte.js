/**
 * Google Mail (package GM, Noah 15.10.2026 «4a»: read and send in one package): the live state of the
 * page «Mail» (#/me/mail). The same Google login as Fitbit, Drive, calendar and tasks, asking for mail in
 * addition (services ['mail']). Mails stay in Gmail: the page fetches what it shows and keeps nothing.
 * A mail goes out only after the tap on «Senden».
 */
import { db as appDb } from '../db.js';
import { call } from '../health.js';
import { readKey } from '../strava/client.svelte.js';
import { MAIL_KEY, MAIL_HASH, prefsOf } from '../mail.js';

export const mail = $state({ loaded: false, prefs: prefsOf(null), list: [], next: null, q: '', busy: '', error: '', open: null, justConnected: false });

export async function loadPrefs(db = appDb) {
  try {
    mail.prefs = prefsOf((await db.settings.get(MAIL_KEY))?.value);
  } catch {
    /* no database here: the defaults stay */
  }
  mail.loaded = true;
  return mail.prefs;
}

export async function savePrefs(patch, db = appDb) {
  const old = (await db.settings.get(MAIL_KEY))?.value ?? {};
  await db.settings.put({ key: MAIL_KEY, value: { ...old, ...patch } });
  mail.prefs = prefsOf({ ...old, ...patch });
}

const fail = async (err, db) => {
  const code = err?.code ?? 'network';
  mail.error = code;
  if (code === 'mail_not_allowed' || code === 'not_connected') await savePrefs({ allowed: false }, db).catch(() => {});
  return null;
};

/** Ask the server whether Google allows mail; remember it. */
export async function checkAllowed({ db = appDb, c = call } = {}) {
  if (!readKey()) return null;
  try {
    const st = await c('status');
    await savePrefs({ allowed: !!st.mail }, db);
    return !!st.mail;
  } catch (err) {
    return fail(err, db);
  }
}

/** The inbox, or the mails of a search; more = the next page. */
export async function loadList({ q = mail.q, more = false, db = appDb, c = call } = {}) {
  mail.busy = more ? 'more' : 'list';
  mail.error = '';
  try {
    const res = await c('mail-list', { params: { ...(q ? { q } : {}), ...(more && mail.next ? { page: mail.next } : {}) } });
    mail.q = q;
    mail.list = more ? [...mail.list, ...res.mails.filter((m) => !mail.list.some((x) => x.id === m.id))] : res.mails;
    mail.next = res.next ?? null;
    if (!mail.prefs.allowed) await savePrefs({ allowed: true }, db);
    return res.mails;
  } catch (err) {
    return fail(err, db);
  } finally {
    mail.busy = '';
  }
}

/** One mail with its text. */
export async function openMail(id, { db = appDb, c = call } = {}) {
  mail.busy = 'open';
  mail.error = '';
  try {
    const res = await c('mail-get', { params: { id } });
    mail.open = res.mail;
    mail.list = mail.list.map((m) => (m.id === id ? { ...m, unread: false } : m));
    return res.mail;
  } catch (err) {
    return fail(err, db);
  } finally {
    mail.busy = '';
  }
}

/** Send: { to, cc?, subject, text, replyTo? }. Returns the sent id or null (why in mail.error). */
export async function sendMail(v, { db = appDb, c = call } = {}) {
  mail.busy = 'send';
  mail.error = '';
  try {
    const res = await c('mail-send', { method: 'POST', body: v });
    return res.id ?? 'sent';
  } catch (err) {
    return fail(err, db);
  } finally {
    mail.busy = '';
  }
}

/** «Mit Google verbinden»: the Google login asks for mail; back to this page. */
export async function connect({ c = call, loc = globalThis.location } = {}) {
  mail.error = '';
  try {
    const { url } = await c('start', { method: 'POST', body: { services: ['mail'], returnTo: `${loc.origin}${loc.pathname}${MAIL_HASH}` } });
    loc.href = url;
    return url;
  } catch (err) {
    mail.error = err?.code ?? 'network';
    return null;
  }
}

/** Back from the Google login: «#/me/mail?google=connected». Read once. */
export function takeReturn(loc = globalThis.location, hist = globalThis.history, db = appDb) {
  const h = loc?.hash ?? '';
  if (!h.startsWith(MAIL_HASH)) return null;
  const i = h.indexOf('?');
  if (i < 0) return null;
  const q = new URLSearchParams(h.slice(i + 1));
  const g = q.get('google');
  if (!g) return null;
  try {
    hist?.replaceState(null, '', `${loc.pathname}${loc.search}${h.slice(0, i)}`);
  } catch {
    /* the address stays */
  }
  if (g === 'connected') {
    mail.justConnected = true;
    checkAllowed({ db }).catch(() => {});
    return { connected: true };
  }
  mail.error = q.get('error') || 'denied';
  return { error: mail.error };
}
