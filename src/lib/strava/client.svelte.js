/**
 * v0.116.0 «Strava-Verbindung» (E3, mockups S1–S5 approved by Noah 12.10.2026 13:39 «s1-s5 freigegeben»;
 * decisions 1a 2a 3b 4b 5a, server answers «1a 2a 3a 4a 5b»): the app side of the Strava connection.
 *
 * - The device key: after the Strava login the server sends this device a key in the address
 *   (#…&strava=connected&key=…). It lives only in localStorage (KEY_LS), never in IndexedDB, so it
 *   never travels in a backup. A second device (the phone) connects by logging in to Strava once more.
 * - Settings (db.settings, in backups): PREFS_KEY { fetch, noBike, ignore, gear, lastSync, athlete },
 *   CHANGES_KEY (questions «Velo in Strava geändert»), LAST_KEY (the last fetch, for S2 and the tile).
 * - A fetch (runSync): the Strava bikes, then every page of rides (the first time all of them, later
 *   from 30 days before the last fetch), planned by stravasync.js planSync and written to the ledger
 *   (kmbookdb.js applyImport: «Undo» on the bike page works as for a file).
 * - Automatic: when the app opens or comes back, at most every 15 minutes, when this device has a key
 *   and «Automatisch beim Öffnen» is on (decision 1a). «Jetzt holen» always works.
 * Everything is a suggestion: every ride can get another bike or «Zählt nicht» later.
 */
import { liveQuery } from 'dexie';
import { db as appDb } from '../db.js';
import { applyTicks } from '../stravaticks.js';
import { t, tn } from '../i18n.svelte.js';
import { loadRules, applyImport, updateEntry, deleteEntries, restoreEntries, syncBikes } from '../kmbookdb.js';
import { rematchOpen, inStart, ledgerStart } from '../kmbook.js';
import { planSync, suggestBike, mergeChanges, recheckFrom, FETCH_MODES, NO_BIKE_MODES, AUTO_EVERY_MS, RECHECK_DAYS } from '../stravasync.js';
import { WALL_KEY, wallOf, wallRecord } from '../home/tiles.js';
import { actRecord, KEEP, needDetail, ZONES_KEY, DETAIL_V } from '../training.js';
import { STRAVA_GONE_KEY } from '../touren/tour.js';
import { localDay } from '../localday.js';
import { saveRate } from '../maintenance/rate.js';
import { keepStravaFtp } from './ftp.svelte.js';

export const STRAVA_URL = 'https://packgen-three.vercel.app/api/strava';
/** localStorage (this device only): the device key the server gave after the Strava login. */
export const KEY_LS = 'pg.strava.key';
export const PREFS_KEY = 'strava';
export const CHANGES_KEY = 'strava.changes';
export const LAST_KEY = 'strava.last';
/** db.meta (this device only, never exported): when this device last tried to fetch. */
export const TRY_KEY = 'strava.try';
export const STRAVA_HASH = '#/bikes?tab=care&view=strava';
export const CHECK_HASH = '#/bikes?tab=care&view=strava-check';
const LAYOUT_KEY = 'homeLayout';

/** The settings as stored, with the defaults filled in. */
export const prefsOf = (v) => ({
  fetch: FETCH_MODES.includes(v?.fetch) ? v.fetch : 'auto',
  noBike: NO_BIKE_MODES.includes(v?.noBike) ? v.noBike : 'check',
  ignore: Array.isArray(v?.ignore) ? v.ignore.map(String) : [],
  gear: Array.isArray(v?.gear) ? v.gear : [],
  lastSync: typeof v?.lastSync === 'string' ? v.lastSync : null,
  athlete: typeof v?.athlete === 'string' ? v.athlete : '',
  // #202 (package G): the bike indoor rides without a Strava bike count for (null: they do not count)
  indoorBike: typeof v?.indoorBike === 'string' && v.indoorBike ? v.indoorBike : null,
});

/* ---------- the device key (localStorage, try/catch: a private window may refuse it) ---------- */
export function readKey(ls = globalThis.localStorage) {
  try {
    return ls?.getItem(KEY_LS) || null;
  } catch {
    return null;
  }
}
export function writeKey(key, ls = globalThis.localStorage) {
  try {
    ls?.setItem(KEY_LS, key);
    return true;
  } catch {
    return false;
  }
}
export function dropKey(ls = globalThis.localStorage) {
  try {
    ls?.removeItem(KEY_LS);
  } catch {
    /* nothing stored */
  }
}

/** The live state for the pages. */
export const strava = $state({ loaded: false, key: false, busy: false, error: '', justConnected: false, prefs: prefsOf(null), changes: [], last: null });

if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
  strava.key = !!readKey();
  liveQuery(async () => [await appDb.settings.get(PREFS_KEY), await appDb.settings.get(CHANGES_KEY), await appDb.settings.get(LAST_KEY)]).subscribe({
    next: ([p, c, l]) => {
      strava.prefs = prefsOf(p?.value);
      strava.changes = Array.isArray(c?.value) ? c.value : [];
      strava.last = l?.value ?? null;
      strava.loaded = true;
    },
    error: () => (strava.loaded = true),
  });
}

export class StravaError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

/** One call to the server. Throws StravaError with the server's code (network: no answer at all). */
export async function call(step, { method = 'GET', body = null, params = {}, key = readKey(), doFetch = (...a) => fetch(...a) } = {}) {
  const q = new URLSearchParams({ step, ...params });
  const headers = {};
  if (key) headers.Authorization = `Bearer ${key}`;
  if (body) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await doFetch(`${STRAVA_URL}?${q}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new StravaError('network');
  }
  const data = await res.json().catch(() => null);
  // BF8 «Gratis-Grenzen»: the server passes Strava's request numbers along; the latest stay on this device
  if (data?.rate && typeof indexedDB !== 'undefined') saveRate(appDb, data.rate);
  if (!res.ok || !data || data.ok === false) throw new StravaError(data?.code ?? data?.error ?? (res.status === 429 ? 'strava_busy' : 'server_error'));
  return data;
}

export async function savePrefs(db, patch) {
  const cur = prefsOf((await db.settings.get(PREFS_KEY))?.value);
  await db.settings.put({ key: PREFS_KEY, value: JSON.parse(JSON.stringify({ ...cur, ...patch })) });
}

/**
 * One fetch: the bikes, every page of rides, the plan, the writes. Returns the summary (LAST_KEY).
 * db: the app's database (tests: their own); c: the server call (tests: a fake).
 */
export async function runSync(db, { call: c = call, now = new Date() } = {}) {
  const prefs = prefsOf((await db.settings.get(PREFS_KEY))?.value);
  const first = !prefs.lastSync;
  const gearRes = await c('gear');
  const gear = gearRes.bikes ?? [];
  // the FTP of the Strava profile (Strava check 21.10.2026: the estimate was far off)
  if (gearRes.ftp) await keepStravaFtp(db, gearRes.ftp, now);
  const entries = await db.kmBook.toArray();
  // «Werte überall»: rides fetched before the app kept their climbing (no «hm» field) are fetched once more, all of them
  const noHm = entries.some((e) => e.source === 'strava' && e.stravaId && !('hm' in e));
  // «Training»: every activity is kept since then; a device that fetched before gets them all once
  const noActs = !(await db.activities.count());
  const after = first || noHm || noActs ? null : Math.floor((Date.parse(prefs.lastSync) - RECHECK_DAYS * 864e5) / 1000);
  const activities = [];
  for (let page = 1; page <= 100; page++) {
    const res = await c('activities', { params: { page: String(page), ...(after != null ? { after: String(Math.max(0, after)) } : {}) } });
    activities.push(...(res.activities ?? []));
    if (!res.more) break;
  }
  const bikes = await db.bikes.toArray();
  const rules = await loadRules(db);
  const importId = `strava-${now.getTime().toString(36)}`;
  const plan = planSync({ activities, gear, bikes, rules, entries, noBike: prefs.noBike, ignore: prefs.ignore, indoorBike: prefs.indoorBike, checkFrom: recheckFrom(first ? now.toISOString() : prefs.lastSync), importId }, now);
  if (plan.entries.length) {
    const text = t('Just taken over: {rides} from {files}.', { rides: tn(plan.entries.length, '{n} ride', '{n} rides'), files: 'Strava' });
    await applyImport(db, { entries: plan.entries, importId, files: ['Strava'], text });
  }
  for (const u of plan.updates) await updateEntry(db, u.id, u.changes);
  if (plan.changes.length) {
    const old = (await db.settings.get(CHANGES_KEY))?.value ?? [];
    await db.settings.put({ key: CHANGES_KEY, value: mergeChanges(old, plan.changes) });
  }
  await keepActivities(db, activities);
  // #156 (package G): Strava ticks the matching Aktiv activity (or suggests it first)
  await applyTicks(db, { now }).catch(() => null);
  await fetchTraining(db, c, now);
  const last = { at: now.toISOString(), first, counts: plan.counts, perBike: plan.perBike, km: plan.km, n: plan.entries.length, assigned: plan.counts.assigned, check: plan.counts.check, changes: plan.changes.length };
  await db.settings.put({ key: LAST_KEY, value: last });
  await savePrefs(db, { lastSync: now.toISOString(), gear: gear.map((b) => ({ id: String(b.id), name: b.name ?? '', km: b.km ?? null, primary: !!b.primary, retired: !!b.retired })) });
  return last;
}

let running = null;
/**
 * «Jetzt holen» (and the automatic fetch): never throws; an error stays in strava.error. While a fetch
 * runs, a second call gets the same result (the first fetch after connecting and the automatic one).
 */
export function fetchNow(opts = {}) {
  if (running) return running;
  if (!readKey()) return Promise.resolve(null);
  running = fetchOnce(opts).finally(() => (running = null));
  return running;
}
async function fetchOnce({ db = appDb, c = call, now = new Date() } = {}) {
  strava.busy = true;
  strava.error = '';
  try {
    await db.meta.put({ key: TRY_KEY, at: now.toISOString() });
    return await runSync(db, { call: c, now });
  } catch (err) {
    const code = err?.code ?? 'network';
    strava.error = code;
    if (code === 'unauthorized') {
      dropKey();
      strava.key = false;
    }
    return null;
  } finally {
    strava.busy = false;
  }
}

/** The automatic fetch (decision 1a): this device has a key, the setting is on, 15 minutes passed. */
export async function autoFetch({ db = appDb, now = new Date() } = {}) {
  if (!readKey() || strava.busy) return null;
  const prefs = prefsOf((await db.settings.get(PREFS_KEY))?.value);
  if (prefs.fetch !== 'auto') return null;
  const tried = Date.parse((await db.meta.get(TRY_KEY))?.at ?? '');
  if (Number.isFinite(tried) && now.getTime() - tried < AUTO_EVERY_MS) return null;
  return fetchNow({ db, now });
}

/** On start and whenever the app comes back to the screen. */
export function watchAutoFetch() {
  if (typeof document === 'undefined') return;
  const go = () => autoFetch().catch(() => {});
  go();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') go();
  });
}

/**
 * The way back from the Strava login: «#/bikes?tab=care&view=strava&strava=connected&key=…» (or
 * strava=error&error=…). Read once before the app starts, the key stored, the address cleaned.
 * Returns { connected } or { error } or null.
 */
export function takeReturn(loc = globalThis.location, hist = globalThis.history, ls = globalThis.localStorage) {
  const h = loc?.hash ?? '';
  const i = h.indexOf('?');
  if (i < 0) return null;
  const q = new URLSearchParams(h.slice(i + 1));
  const s = q.get('strava');
  if (!s) return null;
  const key = q.get('key');
  const error = q.get('error');
  for (const k of ['strava', 'key', 'error']) q.delete(k);
  const rest = q.toString();
  try {
    hist?.replaceState(null, '', `${loc.pathname}${loc.search}${h.slice(0, i)}${rest ? `?${rest}` : ''}`);
  } catch {
    /* the address stays; the key is read anyway */
  }
  if (s === 'connected' && key) {
    writeKey(key, ls);
    strava.key = true;
    strava.justConnected = true;
    strava.error = '';
    return { connected: true };
  }
  strava.error = error || 'denied';
  return { error: strava.error };
}

/** «Mit Strava verbinden»: the server gives the Strava login page; back into this app's Strava page. */
export async function connect({ c = call, loc = globalThis.location } = {}) {
  strava.error = '';
  try {
    const returnTo = `${loc.origin}${loc.pathname}${STRAVA_HASH}`;
    const { url } = await c('start', { method: 'POST', body: { returnTo }, key: null });
    loc.href = url;
    return url;
  } catch (err) {
    strava.error = err?.code ?? 'network';
    return null;
  }
}

/** After the first connection: the name for «als …» (step=status) and the tile on Today. */
export async function afterConnect(db = appDb, c = call) {
  try {
    const s = await c('status');
    if (s?.athlete?.firstname) await savePrefs(db, { athlete: s.athlete.firstname });
  } catch {
    /* the name is only for the line «Verbunden als …» */
  }
  await addTile(db);
}

/** The tile «Strava» goes on top of Today once, when this device connects (it can be taken away). */
export async function addTile(db = appDb) {
  const wallRec = (await db.settings.get(WALL_KEY))?.value;
  const legacy = (await db.settings.get(LAYOUT_KEY))?.value ?? null;
  const tiles = wallOf(wallRec, legacy);
  if (tiles.some((x) => x.id === 'strava')) return false;
  await db.settings.put({ key: WALL_KEY, value: wallRecord([{ id: 'strava', size: 'w' }, ...tiles]) });
  return true;
}

/**
 * «Trennen»: Strava access withdrawn on the server, the key gone from this device. The rides fetched
 * stay, unless `removeRides` (then every ledger entry from Strava goes). The settings stay.
 */
export async function disconnect({ removeRides = false, db = appDb, c = call } = {}) {
  strava.error = '';
  try {
    await c('disconnect', { method: 'POST' });
  } catch (err) {
    const code = err?.code ?? 'network';
    if (code !== 'unauthorized' && code !== 'not_connected') {
      strava.error = code;
      return false;
    }
  }
  dropKey();
  strava.key = false;
  strava.justConnected = false;
  if (removeRides) {
    const ids = (await db.kmBook.toArray()).filter((e) => e.source === 'strava').map((e) => e.id);
    if (ids.length) await deleteEntries(db, ids);
    await db.activities.clear();
  }
  await savePrefs(db, { lastSync: null });
  await db.settings.put({ key: CHANGES_KEY, value: [] });
  await db.settings.delete(LAST_KEY);
  return true;
}

/** «Training»: every fetched activity into db.activities; what the app added (details, note) stays. */
export async function keepActivities(db, list) {
  if (!list.length) return;
  // Tour-Seite (Noah 19.10.2026): an activity deleted in the app does not come back with the next fetch
  const gone = new Set(((await db.settings.get(STRAVA_GONE_KEY))?.value ?? []).map(String));
  const recs = list.map(actRecord).filter((r) => !gone.has(r.id));
  if (!recs.length) return;
  const old = await db.activities.bulkGet(recs.map((r) => r.id));
  // Paket S «Reise-Spur»: a line fetched before (also the finer one of step=line) stays when the list sends none
  await db.activities.bulkPut(recs.map((r, i) => ({ ...r, ...Object.fromEntries(KEEP.filter((k) => old[i] && k in old[i]).map((k) => [k, old[i][k]])), line: (old[i]?.lineFine && old[i]?.line) || r.line || old[i]?.line || null, ...(old[i]?.lineFine ? { lineFine: true } : {}) })));
}

/** TR5b–TR7f: the further parts of a detail (cadence, 5 km rows, course, heart rate by power, halves, climbs). */
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);
const moreOf = (d) => ({ cHist: obj(d.cHist), secs5: Array.isArray(d.secs5) ? d.secs5 : null, prof: obj(d.prof), hw: obj(d.hw), halves: Array.isArray(d.halves) ? d.halves : null, climbs: Array.isArray(d.climbs) ? d.climbs : [] });
/** «Strava-Fahrt vollständig» (Noah 19.10.2026 «2a»): laps, splits per km, «How hard?», temperature low/high, the steepest bit. */
const fin = (v) => (Number.isFinite(v) ? v : null);
const extraOf = (d) => ({ laps: Array.isArray(d.laps) ? d.laps : [], splits: Array.isArray(d.splits) ? d.splits : [], rpe: fin(d.rpe), tempMin: fin(d.tempMin), tempMax: fin(d.tempMax), steep: fin(d.steep) });

/** One activity's heart rate per beat and kcal from the server, kept on the activity. */
export async function loadDetail(db, id, { call: c = call, now = new Date() } = {}) {
  const d = await c('detail', { params: { id: String(id) } });
  await db.activities.update(String(id), { kcal: d.kcal ?? null, hist: d.hist ?? null, curve: Array.isArray(d.curve) ? d.curve : [], w20: Number.isFinite(d.w20) ? d.w20 : null, pHist: d.pHist ?? null, pCurve: Array.isArray(d.pCurve) ? d.pCurve : null, pauses: d.pauses ?? null, segs: Array.isArray(d.segs) ? d.segs : [], best: Array.isArray(d.best) ? d.best : [], desc: typeof d.desc === 'string' ? d.desc : '', hCurve: Array.isArray(d.hCurve) ? d.hCurve : null, dprof: obj(d.dprof) && Array.isArray(d.dprof.d) ? d.dprof : null, sprof: Array.isArray(d.sprof) ? d.sprof : null, ser: obj(d.ser) && Array.isArray(d.ser.t) ? d.ser : null, p25: obj(d.p25), ...moreOf(d), ...extraOf(d), detail: now.toISOString(), dv: Number.isFinite(d.dv) ? Math.min(d.dv, DETAIL_V) : 3 });
  return d;
}

/**
 * Paket S «Reise-Spur»: the finer route line of one activity from Strava (step=line), kept on the activity.
 * Returns the line (encoded polyline) or null.
 */
export async function loadLine(db, id, { call: c = call } = {}) {
  const d = await c('line', { params: { id: String(id) } });
  const line = typeof d?.line === 'string' && d.line ? d.line : null;
  if (line) await db.activities.update(String(id), { line, lineFine: true });
  return line;
}

/**
 * After a fetch: the zones from Strava (once a day) and the details of the newest activities with
 * heart rate, then of the older ones (Noah 19.10.2026 «4a»), at most DETAIL_MAX per fetch (Strava
 * allows 100 calls per 15 minutes). An error here never
 * spoils the fetch: what is missing comes next time or when the activity is opened.
 */
export async function fetchTraining(db, c = call, now = new Date()) {
  try {
    const z = (await db.settings.get(ZONES_KEY))?.value;
    if (!z?.at || Date.parse(z.at) < now.getTime() - 864e5) {
      const res = await c('zones');
      if (Array.isArray(res?.hr)) await db.settings.put({ key: ZONES_KEY, value: { hr: res.hr, custom: !!res.custom, at: now.toISOString() } });
    }
    for (const a of needDetail(await db.activities.toArray(), localDay(now))) {
      try {
        await loadDetail(db, a.id, { call: c, now });
      } catch (e) {
        // Strava has no details for this one (deleted, or an error only for it): skip it in the background
        // (opening the activity still tries); busy, a new login or no network: stop until next time
        if (e?.code !== 'strava_error' && e?.code !== 'bad_request') throw e;
        await db.activities.update(String(a.id), { noDetail: now.toISOString() });
      }
    }
  } catch {
    /* next time */
  }
}

/** «Übernehmen» (the km move to the bike Strava names now) or «Behalten» (the bike stays). */
export async function answerChange(db, change, take) {
  if (take) await updateEntry(db, change.entryId, change.toBike ? { bikeId: change.toBike, gear: change.toGear, by: 'gear', sure: 'likely', state: 'counted' } : { gear: change.toGear, state: 'removed' });
  else await updateEntry(db, change.entryId, { gear: change.toGear, by: 'user', sure: 'user' });
  const old = (await db.settings.get(CHANGES_KEY))?.value ?? [];
  await db.settings.put({ key: CHANGES_KEY, value: old.filter((x) => x.entryId !== change.entryId) });
}

/** A ride from «Zum Prüfen»: «Passt» / another bike (bikeId) / «Zählt nicht» (null). Returns the entry as it was. */
export async function checkRide(db, entry, bikeId) {
  if (bikeId === null) return updateEntry(db, entry.id, { state: 'removed' });
  // a ride inside the bike's start value is already in its km: on the bike, but not counted twice
  const mine = await db.kmBook.where('bikeId').equals(bikeId).toArray();
  if (inStart(ledgerStart(mine, bikeId), entry.date)) return updateEntry(db, entry.id, { bikeId, state: 'removed', by: 'user', sure: 'user', reason: { code: 'start', bike: bikeId } });
  return updateEntry(db, entry.id, { bikeId, state: 'counted', by: 'user', sure: 'user', reason: null });
}

let matching = null;
/**
 * Gesamttest 20.10.2026 B1 (Noah «1a»): open rides whose Strava bike now has an app bike of the same
 * name (or a gear rule) are assigned in one go (kmbook.js rematchOpen), like «Fits» but by the Strava
 * bike (by 'gear', sure 'likely'). Returns { n, put, bikes }: the entries and bike km as they were,
 * for «Undo» (undoAutoAssign). Idempotent: an assigned ride is no longer open; a ride you undid is
 * marked noAuto and stays for you. A second call while one runs waits for it (and finds nothing).
 */
export function autoAssign(db = appDb) {
  if (matching) return matching.then(() => ({ n: 0, counted: 0, typed: 0, already: 0, put: [], bikes: [] }));
  matching = (async () => {
    const prefs = prefsOf((await db.settings.get(PREFS_KEY))?.value);
    const skipGear = prefs.gear.filter((g) => prefs.ignore.includes(String(g.id))).map((g) => g.name).filter(Boolean);
    const rules = await loadRules(db);
    let put = [];
    let before = [];
    let counted = 0;
    let typed = 0;
    await db.transaction('rw', db.kmBook, db.bikes, async () => {
      const entries = await db.kmBook.toArray();
      const bikes = await db.bikes.toArray();
      const hits = rematchOpen(entries, { bikes, rules, skipGear, suggest: (e) => suggestBike(e, { bikes, rules, entries }), byType: prefs.noBike === 'auto' });
      if (!hits.length) return;
      const ids = new Set(hits.map((h) => h.bikeId));
      before = bikes.filter((b) => ids.has(b.id)).map((b) => ({ id: b.id, km: b.km ?? null, kmDate: b.kmDate ?? null }));
      put = hits.map((h) => JSON.parse(JSON.stringify(h.entry)));
      // a ride already in the start value or counted by its twin: on the bike, left out, with the reason
      const row = (h) => (h.as === 'count' ? { state: 'counted', reason: null } : { state: 'removed', reason: { code: h.as, bike: h.bikeId } });
      await db.kmBook.bulkPut(hits.map((h) => ({ ...JSON.parse(JSON.stringify(h.entry)), bikeId: h.bikeId, by: h.by === undefined ? 'gear' : h.by, sure: h.bikeId ? 'likely' : 'unclear', ...row(h) })));
      counted = hits.filter((h) => h.as === 'count' && h.by !== 'type').length;
      typed = hits.filter((h) => h.as === 'count' && h.by === 'type').length;
      await syncBikes(db, [...ids]);
    });
    return { n: put.length, counted, typed, already: put.length - counted - typed, put, bikes: before };
  })().finally(() => (matching = null));
  return matching;
}

/** The line after autoAssign: how many count now, how many were already in (start value or twin). */
export function autoText(r) {
  const parts = [];
  if (r?.counted) parts.push(tn(r.counted, '{n} ride assigned automatically: the Strava bike has the same name.', '{n} rides assigned automatically: the Strava bike has the same name.'));
  if (r?.typed) parts.push(tn(r.typed, '{n} ride without a bike in Strava assigned by its ride type.', '{n} rides without a bike in Strava assigned by their ride type.'));
  if (r?.already) parts.push(tn(r.already, '{n} older ride is already in the km of your bikes (start value or counted): it does not count twice.', '{n} older rides are already in the km of your bikes (start value or counted): they do not count twice.'));
  return parts.join(' ');
}

/**
 * «Undo» of autoAssign: the rides wait again, marked noAuto so they are not assigned again by
 * themselves; each bike's km are the ledger's again (or, without entries left, what they were).
 */
export async function undoAutoAssign(db, put = [], bikes = []) {
  await restoreEntries(db, { put: put.map((e) => ({ ...e, noAuto: true })) });
  await db.transaction('rw', db.kmBook, db.bikes, async () => {
    for (const b of bikes) {
      if (await db.kmBook.where('bikeId').equals(b.id).count()) await syncBikes(db, [b.id]);
      else await db.bikes.update(b.id, { km: b.km, kmDate: b.kmDate });
    }
  });
}
