/**
 * v0.77.0 «KI-Helfer»: the helper's settings on this device and the one way to ask it.
 *
 * Settings record "helper" (db.settings): { code, on, capChf }. It is device-only (backup.js
 * DEVICE_SETTINGS): the Helfer-Code never goes into an export, a backup file or the folder backup.
 * The month's spend comes back with every answer and is kept in db.meta (never exported).
 *
 * Without a code everything works as before (answer 8a): the helper's UI hides itself, only New
 * trip and the settings say calmly that it is not set up. With the switch off it hides too.
 * The monthly limit (answer 7a, default CHF 5) pauses it until next month; the server has its own.
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';
import { t } from '../i18n.svelte.js';
import { localDay } from '../localday.js';

export const HELPER_URL = 'https://packgen-three.vercel.app/api/helper';
export const HELPER_KEY = 'helper';
export const SPEND_KEY = 'helper.spend';
export const DEFAULT_CAP = 5;
const TIMEOUT = 90_000;

export const thisMonth = (day = localDay()) => day.slice(0, 7);

/** The settings as stored, with the defaults filled in. */
export const settingsOf = (value) => ({ code: typeof value?.code === 'string' ? value.code : '', on: value?.on !== false, capChf: Number(value?.capChf) > 0 ? Number(value.capChf) : DEFAULT_CAP });

/** Paused by the limit: this month's spend reached the device's cap or the server's. */
export function pausedBy(settings, spend, month = thisMonth()) {
  if (!spend || spend.month !== month) return false;
  const cap = Math.min(settings.capChf, Number(spend.cap) > 0 ? Number(spend.cap) : Infinity);
  return spend.chf >= cap || spend.capped === true;
}

/** The live state for the components. */
export const helper = $state({ loaded: false, code: '', on: true, capChf: DEFAULT_CAP, spend: null });
export const isSetUp = () => !!helper.code;
export const isPaused = () => pausedBy(helper, helper.spend);
/** Show the helper's buttons: set up and switched on (paused shows a calm line instead). */
export const isOn = () => !!helper.code && helper.on;

if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
  liveQuery(async () => [await db.settings.get(HELPER_KEY), await db.meta.get(SPEND_KEY)]).subscribe({
    next: ([rec, spend]) => {
      Object.assign(helper, settingsOf(rec?.value));
      helper.spend = spend?.value ?? null;
      helper.loaded = true;
    },
    error: () => (helper.loaded = true),
  });
}

/** Save part of the settings ({ code } / { on } / { capChf }). */
export async function saveSettings(patch) {
  const cur = settingsOf((await db.settings.get(HELPER_KEY))?.value);
  await db.settings.put({ key: HELPER_KEY, value: { ...cur, ...patch } });
}

async function keepSpend(spend, capped = false) {
  if (!spend || typeof spend.chf !== 'number' || typeof spend.month !== 'string') return;
  const value = { month: spend.month, chf: spend.chf, cap: Number(spend.cap) || null, capped, at: new Date().toISOString() };
  helper.spend = value;
  try {
    await db.meta.put({ key: SPEND_KEY, value });
  } catch {
    /* only the display of the spend */
  }
}

/**
 * Ask the helper. Returns { ok: true, result } or { ok: false, error } with error one of
 * 'off' (not set up / switched off), 'paused' (limit), 'offline', 'auth', 'server', 'busy', 'error'.
 * Never throws; the rest of the app keeps working whatever happens here.
 */
export async function ask(task, input, { fetchFn = (...a) => fetch(...a) } = {}) {
  const s = settingsOf((await db.settings.get(HELPER_KEY).catch(() => null))?.value);
  if (!s.code || (!s.on && task !== 'status')) return { ok: false, error: 'off' };
  const spend = (await db.meta.get(SPEND_KEY).catch(() => null))?.value ?? null;
  if (task !== 'status' && pausedBy(s, spend)) return { ok: false, error: 'paused' };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { ok: false, error: 'offline' };
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT);
  let res;
  try {
    res = await fetchFn(HELPER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.code}` },
      body: JSON.stringify({ task, input }),
      signal: ctl.signal,
    });
  } catch {
    return { ok: false, error: 'offline' };
  } finally {
    clearTimeout(timer);
  }
  const body = await res.json().catch(() => null);
  if (body?.spend) await keepSpend(body.spend, res.status === 429);
  if (res.ok && body?.ok) return { ok: true, result: body.result ?? null, spend: body.spend ?? null };
  if (res.status === 429 || body?.code === 'monthly_cap') return { ok: false, error: 'paused' };
  if (res.status === 401) return { ok: false, error: 'auth' };
  if (res.status === 503 && body?.code === 'busy') return { ok: false, error: 'busy' };
  if (res.status === 503) return { ok: false, error: 'server' };
  return { ok: false, error: 'error' };
}

/** The first day of next month, as people read it ("1. Nov."). */
export function nextMonthStart(day = localDay(), loc = 'de-CH') {
  const [y, m] = day.split('-').map(Number);
  const d = new Date(Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1));
  return d.toLocaleDateString(loc, { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** One calm line per error. */
export function errorText(error, { capChf = DEFAULT_CAP, loc = 'de-CH' } = {}) {
  if (error === 'paused') return t('The helper pauses until {date}: the monthly limit of CHF {cap} is reached. Everything else works as usual.', { date: nextMonthStart(localDay(), loc), cap: Number(capChf).toFixed(2) });
  if (error === 'offline') return t('Offline right now. The helper answers again once you are online.');
  if (error === 'auth') return t('The helper code is not right. Check it in the settings.');
  if (error === 'server') return t('The helper is not ready on the server yet.');
  if (error === 'busy') return t('The helper is busy right now. Try again in a minute.');
  if (error === 'off') return t('The helper is switched off.');
  return t('The helper could not answer this time. Everything else works as usual.');
}
