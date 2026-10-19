/**
 * v0.77.0 «KI-Helfer»: the helper's settings on this device and the one way to ask it.
 *
 * Settings record "helper" (db.settings): { code, on, capChf, model }. It is device-only (backup.js
 * DEVICE_SETTINGS): the Helfer-Code never goes into an export, a backup file or the folder backup.
 * The month's spend comes back with every answer and is kept in db.meta (never exported).
 *
 * Without a code everything works as before (answer 8a): the helper's UI hides itself, only New
 * trip and the settings say calmly that it is not set up. With the switch off it hides too.
 * v0.118.0 «KI-Helfer ausblenden» (mockups K1–K4, Noah 12.10.2026 «k1-k4 ok», answer a ★): the helper is
 * completely off by default. ONE switch, Ich › KI-Helfer «Show the AI helper in the app» (`show`, default
 * false), brings every place back at once: Packen «Check the list», the debrief draft, bike care, the
 * search answer, the tile on Today and «Ask the helper» in New trip. The code, the limit and the old
 * `on` stay stored as they are; switched off, nothing is asked and nothing goes to Claude.
 * The monthly limit (answer 7a) pauses it until next month; the server has its own. Noah 15.10.2026 «1b»:
 * the default is CHF 2. «2a, wobei nutzer dies ändern kann im frontend»: Sonnet 5.5 stays the default
 * model, Ich › KI-Helfer can switch to Haiku 5.5 (cheaper); the choice goes with every request.
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';
import { t } from '../i18n.svelte.js';
import { localDay } from '../localday.js';

export const HELPER_URL = 'https://packgen-three.vercel.app/api/helper';
export const HELPER_KEY = 'helper';
export const SPEND_KEY = 'helper.spend';
/**
 * Empty credit (Noah 18.10.2026 «1a und wenn das guthaben aufgebraucht ist, erlischt das feld in der app
 * überall»): db.meta 'helper.credit' { empty, at, told, probed } (never exported). While empty, isOn() and
 * isShown() are false: every helper field and button hides (New trip card, search answer, Assistant,
 * Check the list, look back draft, bike care, the tile); the free answers of the app stay. The sentence
 * «The AI credit is used up …» shows once (CreditNotice, `told`). Once a day the app asks the server
 * (status with probe); an answer that works, or a server that says the credit is back, brings it all back.
 */
export const CREDIT_KEY = 'helper.credit';
export const DEFAULT_CAP = 2;
/** The models the person can pick (the server checks the same list). The first is the default. */
export const MODELS = [
  { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5', what: 'Default. Better answers, a few centimes per request.' },
  { id: 'claude-haiku-5-5', name: 'Claude Haiku 5.5', what: 'Cheaper, about 20 times less. Simpler answers.' },
];
export const DEFAULT_MODEL = MODELS[0].id;
const modelOf = (v) => (MODELS.some((m) => m.id === v) ? v : DEFAULT_MODEL);
const TIMEOUT = 90_000;

export const thisMonth = (day = localDay()) => day.slice(0, 7);

/** Settings saved before 15.10.2026 hold the old default CHF 5; they count as the new CHF 2 once.
 *  Every save from now on stores capV 2, so a limit of 5 the person sets later stays 5. */
const CAP_V = 2;
const capOf = (value) => {
  const n = Number(value?.capChf);
  if (!(n > 0)) return DEFAULT_CAP;
  return n === 5 && value?.capV !== CAP_V ? DEFAULT_CAP : n;
};

/** The settings as stored, with the defaults filled in. */
export const settingsOf = (value) => ({ code: typeof value?.code === 'string' ? value.code : '', show: value?.show === true, capChf: capOf(value), model: modelOf(value?.model) });

/** Paused by the limit: this month's spend reached the device's cap or the server's. */
export function pausedBy(settings, spend, month = thisMonth()) {
  if (!spend || spend.month !== month) return false;
  const cap = Math.min(settings.capChf, Number(spend.cap) > 0 ? Number(spend.cap) : Infinity);
  return spend.chf >= cap || spend.capped === true;
}

/** The live state for the components. */
export const helper = $state({ loaded: false, code: '', show: false, capChf: DEFAULT_CAP, model: DEFAULT_MODEL, spend: null, credit: null });
/** The AI credit is used up (the server said so; until an answer works again). */
export const noCredit = () => helper.credit?.empty === true;
export const isSetUp = () => !!helper.code;
export const isPaused = () => pausedBy(helper, helper.spend);
/** v0.118.0: the one switch «Show the AI helper in the app» (default off). */
export const isShown = () => helper.show && !noCredit();
/** Show the helper's buttons: shown and set up (paused shows a calm line instead). */
export const isOn = () => !!helper.code && helper.show && !noCredit();

if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
  liveQuery(async () => [await db.settings.get(HELPER_KEY), await db.meta.get(SPEND_KEY), await db.meta.get(CREDIT_KEY)]).subscribe({
    next: ([rec, spend, credit]) => {
      Object.assign(helper, settingsOf(rec?.value));
      helper.spend = spend?.value ?? null;
      helper.credit = credit?.value ?? null;
      helper.loaded = true;
      probeCredit();
    },
    error: () => (helper.loaded = true),
  });
}

/** Save part of the settings ({ code } / { show } / { capChf } / { model }); the other fields stay as stored. */
export async function saveSettings(patch) {
  const cur = settingsOf((await db.settings.get(HELPER_KEY))?.value);
  await db.settings.put({ key: HELPER_KEY, value: { ...cur, ...patch, capV: CAP_V } });
}

/** Remember what the server said about the credit (empty: true / false). Never throws. */
export async function keepCredit(empty, patch = {}) {
  const cur = (await db.meta.get(CREDIT_KEY).catch(() => null))?.value ?? helper.credit ?? {};
  if (!empty && !cur.empty && !Object.keys(patch).length) return;
  const value = empty ? { ...cur, empty: true, at: cur.empty ? cur.at : localDay(), ...patch } : { empty: false, at: localDay() };
  helper.credit = value;
  try {
    await db.meta.put({ key: CREDIT_KEY, value });
  } catch {
    /* only the display */
  }
}
/** The sentence was shown: it does not come again until the credit is empty another time. */
export const creditTold = () => keepCredit(true, { told: true });

let probing = false;
/** Once a day while the credit is empty: ask the server whether it is back (status with probe). */
async function probeCredit(day = localDay()) {
  if (probing || !noCredit() || !helper.code || !helper.show || helper.credit?.probed === day) return;
  probing = true;
  try {
    await keepCredit(true, { probed: day });
    await ask('status', {}, { probe: true });
  } finally {
    probing = false;
  }
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
 * 'off' (not set up / switched off), 'paused' (limit), 'no_credit' (credit used up), 'offline', 'auth', 'server', 'busy', 'error'.
 * Never throws; the rest of the app keeps working whatever happens here.
 */
export async function ask(task, input, { fetchFn = (...a) => fetch(...a), probe = false } = {}) {
  const s = settingsOf((await db.settings.get(HELPER_KEY).catch(() => null))?.value);
  if (!s.code || (!s.show && task !== 'status')) return { ok: false, error: 'off' };
  const spend = (await db.meta.get(SPEND_KEY).catch(() => null))?.value ?? null;
  if (task !== 'status' && pausedBy(s, spend)) return { ok: false, error: 'paused' };
  const credit = (await db.meta.get(CREDIT_KEY).catch(() => null))?.value ?? null;
  if (task !== 'status' && credit?.empty) return { ok: false, error: 'no_credit' };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { ok: false, error: 'offline' };
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT);
  let res;
  try {
    res = await fetchFn(HELPER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.code}` },
      body: JSON.stringify({ task, input, model: s.model, ...(probe ? { probe: true } : {}) }),
      signal: ctl.signal,
    });
  } catch {
    return { ok: false, error: 'offline' };
  } finally {
    clearTimeout(timer);
  }
  const body = await res.json().catch(() => null);
  if (body?.spend) await keepSpend(body.spend, res.status === 429);
  if (res.status === 402 || body?.code === 'no_credit' || body?.credit === 'empty') await keepCredit(true);
  else if (res.ok && body?.ok && (body.credit === 'ok' || task !== 'status')) await keepCredit(false);
  if (res.status === 402 || body?.code === 'no_credit') return { ok: false, error: 'no_credit' };
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
  if (error === 'no_credit') return t('The AI credit is used up. Everything else works as usual.');
  return t('The helper could not answer this time. Everything else works as usual.');
}
