/**
 * BF7 «Wartungs-Check»: the parts that talk to the outside (the Strava status, the link check) and the
 * start of the app (main.js). The rules are in check.js.
 */
import { localDay } from '../localday.js';
import { call, readKey, StravaError } from '../strava/client.svelte.js';
import { LINKS, LINKCHECK_URL } from './links.js';
import { CHECK_KEY, checkDue, runCheck } from './check.js';

const LOGIN_CODES = ['strava_login_needed', 'not_connected', 'unauthorized'];

/** The Strava connection: 'ok', 'off' (not connected on this device), 'attention' or null (not checked). */
export async function stravaStatus({ c = call, key = readKey() } = {}) {
  if (!key) return 'off';
  try {
    const s = await c('status', { key });
    return s?.connected ? 'ok' : 'attention';
  } catch (err) {
    return err instanceof StravaError && LOGIN_CODES.includes(err.code) ? 'attention' : null;
  }
}

/** One address through the server; null when the server cannot be reached (offline, too slow). */
export async function probeLink(url, { doFetch = (...a) => fetch(...a), timeout = 8000 } = {}) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await doFetch(`${LINKCHECK_URL}?u=${encodeURIComponent(url)}`, { signal: ctl.signal });
    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    return typeof body?.ok === 'boolean' ? { ok: body.ok, status: body.status ?? null } : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** «Check now»: run the check and keep the result. */
export async function checkNow(db, { today = localDay(), status = () => stravaStatus(), probe = (u) => probeLink(u) } = {}) {
  const res = await runCheck({ links: LINKS, today, status, probe });
  await db.meta.put({ key: CHECK_KEY, ...res });
  return res;
}

/**
 * At the start, inside the tidy-up: a device without data (a first install) only notes today, so the
 * first check comes a month later; nothing else happens here (no network).
 */
export async function markFirstStart(db, today = localDay()) {
  if (await db.meta.get(CHECK_KEY)) return;
  const n = (await db.items.count()) + (await db.trips.count()) + (await db.bikes.count());
  if (!n) await db.meta.put({ key: CHECK_KEY, day: today, first: true });
}

/** After the start: the monthly check, when it is due. Never throws. */
export async function autoCheck(db, today = localDay()) {
  try {
    const last = await db.meta.get(CHECK_KEY);
    if (checkDue(last?.day ?? null, today)) await checkNow(db, { today });
  } catch {
    /* quiet: «not checked» */
  }
}
