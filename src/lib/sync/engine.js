/**
 * P8 «Automatischer Abgleich» (Noah 18.10.2026 «1b … 2b 3b»): one round of the sync between this
 * device and the server.
 *
 * 1. Pull: everything the other device wrote since the last round. A record this device did not change
 *    is taken over; the same content on both is fine. A record changed on BOTH devices settles by itself
 *    (Noah 24.10.2026: «im Frontend nie eine solche Meldung», replaces 3b «the app asks»): the newer
 *    change wins, and the version it replaced stays in a quiet history for 30 days (Ich › Daten und
 *    Backup › «Automatisch abgeglichen»), so nothing is lost and it can be brought back.
 * 2. Push: every record this device changed (the notes of track.js), sealed with the pairing code.
 *    The server takes a record only when nobody wrote it in between; otherwise the next pull brings it.
 *
 * What stays on this device (meta table, never exported):
 *   'syncCfg'              { code, since, on, lastAt, error, big }
 *   'sync|<table>|<id>'    the change notes (track.js)
 *   'synccf|<table>|<id>'  an open question from before 24.10.2026 (the next round settles it by itself)
 *   'synclost|<table>|<id>' the version a newer change replaced { t, id, v, del, at, dev, gone } (30 days)
 */
import { DATA_TABLES, syncLocal } from '../db.js';
import { keysOf, recName, seal, unseal } from './code.js';
import { NOTE, noteKey, stable, same } from './track.js';

export { stable, same };

export const SYNC_URL = 'https://packgen-three.vercel.app/api/sync';
export const CFG = 'syncCfg';
export const ASK = 'synccf|';
export const askKey = (table, id) => `${ASK}${table}|${JSON.stringify(id)}`;
/** The quiet history: the version a newer change on the other device replaced (or the other way round). */
export const LOST = 'synclost|';
export const lostKey = (table, id) => `${LOST}${table}|${JSON.stringify(id)}`;
/** How long a replaced version is kept, and at most how many. */
export const LOST_DAYS = 30;
export const LOST_MAX = 300;
/** One push carries at most this many characters of sealed records (Vercel takes 4.5 MB). */
export const BATCH_CHARS = 2_500_000;
/** A single record bigger than this stays on this device (a very big document); the panel says so. */
export const RECORD_MAX = 3_900_000;
const BATCH_MAX = 200;

const known = new Set(DATA_TABLES);
const deviceOnly = syncLocal;

/** The server over HTTPS: call(step, body) → JSON; errors carry .code (e.g. 'offline', 'storage_not_set_up'). */
export function httpApi(url = SYNC_URL, doFetch = (...a) => fetch(...a)) {
  return {
    async call(step, body) {
      let res;
      try {
        res = await doFetch(`${url}?step=${step}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } catch {
        throw Object.assign(new Error('offline'), { code: 'offline' });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error(data.message || 'server'), { code: data.code || (res.status === 404 ? 'not_ready' : 'server_error') });
      return data;
    },
  };
}

export const readCfg = (db) => db.meta.get(CFG);
const writeCfg = async (db, patch) => {
  const cur = (await readCfg(db)) ?? { key: CFG };
  await db.meta.put({ ...cur, ...patch, key: CFG });
};

/**
 * Switch the sync on with a code (a new one, or the one of the other device). Every record of this
 * device gets a note (dirty, base 0), so the first round compares everything with the server.
 * A record this device never changed since the notes exist gets no time (''): where it differs from
 * the other device, it counts as the older version, so pairing never overwrites newer work elsewhere.
 */
export async function startSync(db, code, now = new Date().toISOString()) {
  // the notes made here get no time (see above); now is when the sync was switched on
  await db.transaction('rw', db.meta, ...DATA_TABLES.map((t) => db.table(t)), async () => {
    const notes = await db.meta.where('key').startsWith(NOTE).toArray();
    const have = new Set(notes.map((n) => n.key));
    await db.meta.bulkPut(notes.map((n) => ({ ...n, dirty: 1, base: 0 })));
    for (const t of DATA_TABLES) {
      const ids = await db.table(t).toCollection().primaryKeys();
      const fresh = ids.filter((id) => !deviceOnly(t, id) && !have.has(noteKey(t, id))).map((id) => ({ key: noteKey(t, id), t, id, at: '', del: false, dirty: 1, base: 0 }));
      if (fresh.length) await db.meta.bulkPut(fresh);
    }
    await db.meta.where('key').startsWith(ASK).delete();
    await db.meta.put({ key: CFG, code, since: 0, on: true, startedAt: now, lastAt: null, error: null, big: 0 });
  });
}

/** Switch it off. forget: also empty this pair's space on the server. */
export async function stopSync(db, { forget = false, api = httpApi() } = {}) {
  const cfg = await readCfg(db);
  if (forget && cfg?.code) {
    const keys = await keysOf(cfg.code);
    await api.call('forget', { token: keys.token });
  }
  await db.meta.where('key').startsWith(ASK).delete();
  await db.meta.delete(CFG);
}

/** Put the other device's version in place (inside a transaction over the table and meta). */
async function takeTheirs(db, t, id, { s, v, del, at }) {
  const table = db.table(t);
  if (del) await table.delete(id);
  else await table.put(v);
  // the middleware has just noted a change of our own: it is the server's version, so it is clean
  await db.meta.put({ key: noteKey(t, id), t, id, at: at ?? new Date().toISOString(), del: !!del, dirty: 0, base: s });
  await db.meta.delete(askKey(t, id));
}

/** Answer a question: 'mine' (this device wins, it goes to the server) or 'theirs' (the other one wins). */
export async function resolve(db, key, choice) {
  await db.transaction('rw', db.meta, ...DATA_TABLES.map((x) => db.table(x)), async () => {
    const a = await db.meta.get(key);
    if (!a) return;
    if (choice === 'theirs') return takeTheirs(db, a.t, a.id, a);
    const nk = noteKey(a.t, a.id);
    const note = await db.meta.get(nk);
    const exists = (await db.table(a.t).get(a.id)) !== undefined;
    await db.meta.put({ ...(note ?? { key: nk, t: a.t, id: a.id }), at: note?.at ?? new Date().toISOString(), del: !exists, dirty: 1, base: a.s });
    await db.meta.delete(key);
  });
}

/**
 * Questions left from before 24.10.2026 (the window «Changed on both devices» is gone): every one settles
 * now by the same rule as a new conflict. Returns how many.
 */
export async function settleAsks(db) {
  let n = 0;
  for (const a of await db.meta.where('key').startsWith(ASK).toArray()) {
    n++;
    if (!known.has(a.t)) {
      await db.meta.delete(a.key);
      continue;
    }
    const local = (await db.table(a.t).get(a.id)) ?? null;
    const note = await db.meta.get(noteKey(a.t, a.id));
    const theirs = a.del ? null : a.v;
    const pick = settle(a.t, a.id, local, theirs, { mineAt: note?.at, theirsAt: a.at });
    if (pick.keep) await keepLost(db, a.t, a.id, pick.keep === 'theirs' ? { v: theirs, at: a.at, dev: a.dev } : { v: local, at: note?.at, dev: 'here' });
    await resolve(db, a.key, pick.win === 'theirs' ? 'theirs' : 'mine');
  }
  return n;
}

/** Keep the version that lost (inside a transaction over meta). */
async function keepLost(db, t, id, { v, at, dev }, now = new Date().toISOString()) {
  await db.meta.put({ key: lostKey(t, id), t, id, v: v ?? null, del: v == null, at: at ?? null, dev: dev ?? null, gone: now });
}

/** The quiet history, newest first (read only, for the panel). */
export async function lostVersions(db) {
  return (await db.meta.where('key').startsWith(LOST).toArray()).sort((x, y) => String(y.gone).localeCompare(String(x.gone)));
}

/** Remove replaced versions older than LOST_DAYS and beyond the newest LOST_MAX. Returns how many. */
export async function pruneLost(db, now = Date.now()) {
  const all = await lostVersions(db);
  const old = all.filter((x, i) => i >= LOST_MAX || now - Date.parse(x.gone) > LOST_DAYS * 864e5);
  if (old.length) await db.meta.bulkDelete(old.map((x) => x.key));
  return old.length;
}

/** Bring a replaced version back: it becomes a normal change of this device and syncs to the other one. */
export async function bringBack(db, key) {
  await db.transaction('rw', db.meta, ...DATA_TABLES.map((x) => db.table(x)), async () => {
    const l = await db.meta.get(key);
    if (!l || !known.has(l.t)) return;
    const table = db.table(l.t);
    const now = (await table.get(l.id)) ?? null;
    if (l.del) await table.delete(l.id);
    else await table.put(l.v);
    // the version it replaces now goes into the history in its place, so bringing back can be undone
    if (!same(now, l.v)) await keepLost(db, l.t, l.id, { v: now, at: null, dev: 'here' });
    else await db.meta.delete(key);
  });
}

/** Forget one replaced version. */
export const dropLost = (db, key) => db.meta.delete(key);

/*
 * Paket B (Noah 19.10.2026 «1b»): copies of Google that both devices fetch by themselves. A Fitbit day
 * carries when this device fetched it (at, src); the Fitbit and calendar settings carry the last fetch
 * (lastSync, until). These marks alone never make a question; when the values differ, the copy fetched
 * later wins without asking, because both come from the same source.
 */
export const FETCHED = {
  healthDays: { marks: ['at', 'src'], when: (r) => r?.at ?? '' },
  // fill: the one-time 30-day refetch (health.js FILL_V) is a fetch mark too, never a question
  'settings:health': { marks: ['lastSync', 'until', 'fill'], inValue: true, when: (r) => r?.value?.lastSync ?? '' },
  'settings:agenda': { marks: ['lastSync'], inValue: true, when: (r) => r?.value?.lastSync ?? '' },
  // Strava activities (Noah 20.10.2026: the question came after every update): both devices fetch the
  // details from Strava by themselves, so only the time of the fetch differs. What the person added
  // (note, feeling, own values, hidden) must be the same on both; then the newer fetch wins without asking.
  activities: { own: ['note', 'feel', 'feelSkip', 'own', 'hidden'], when: (r) => `${String(Number(r?.dv) || 0).padStart(4, '0')}|${[r?.detail ?? '', r?.noDetail ?? ''].sort().at(-1)}` },
};
/*
 * Settings the app writes by itself (Noah 21.10.2026, a question about «strava.last» on the phone): the
 * summary of the last Strava fetch, fetched copies, one-time results, counters and view states. They mean
 * nothing to the person, so changed on both devices they never become a question: the newer one wins.
 * The value is the time inside the record; null: the time of the change on each device counts.
 */
const atOf = (r) => r?.value?.at ?? '';
export const INTERNAL_SETTINGS = {
  'strava.last': atOf, // the summary of the last Strava fetch (Strava tile, S2)
  'strava.zones': atOf, // Strava's heart rate zones, as fetched
  'heat.backfill': atOf, // the one-time fetch of old rides for the heatmap
  blocksMore: atOf, // the result of the one-time «more blocks» update
  toursPage: atOf, // how Touren was last shown (filter, sort)
  toursView: atOf, // the columns of the tours list
  pastView: atOf, // the columns of the past trips list
  homeUsage: null, // how often each Heute function was used (order of the tiles)
  bookingSeen: null, // the offers already shown once
};
for (const [key, when] of Object.entries(INTERNAL_SETTINGS)) FETCHED[`settings:${key}`] = { latest: true, when };
// the Strava and Trello connection: what the person set stays a question; the fetch marks alone never are
FETCHED['settings:strava'] = { marks: ['lastSync', 'gear', 'athlete'], inValue: true, when: (r) => r?.value?.lastSync ?? '' };
FETCHED['settings:trello'] = { marks: ['lastSync'], inValue: true, when: (r) => r?.value?.lastSync ?? '' };

/** True for a settings row the app keeps by itself (never shown as a question). */
export const isInternal = (t, id) => t === 'settings' && Object.hasOwn(INTERNAL_SETTINGS, String(id));
const fetchedRule = (t, id) => FETCHED[t] ?? FETCHED[`${t}:${id}`] ?? null;
const withoutMarks = (r, rule) => {
  if (!r || typeof r !== 'object') return r;
  if (!rule.inValue) return Object.fromEntries(Object.entries(r).filter(([k]) => !rule.marks.includes(k)));
  const v = r.value && typeof r.value === 'object' ? Object.fromEntries(Object.entries(r.value).filter(([k]) => !rule.marks.includes(k))) : r.value;
  return { ...r, value: v };
};
/** The fields the person set, an empty one as null (a missing note and an empty note are the same). */
const blank = (v) => v == null || v === '' || v === false || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).some((k) => !blank(v[k])));
const ownOf = (r, keys) => Object.fromEntries(keys.map((k) => [k, blank(r?.[k]) ? null : r[k]]));
/**
 * For a record changed on both devices: 'same' (only the fetch marks differ), 'theirs' or 'mine' (the copy
 * fetched later), or null (not a copy of Google, or a delete: the person is asked as before).
 */
export function autoPick(t, id, mine, theirs, { mineAt = '', theirsAt = '' } = {}) {
  const rule = fetchedRule(t, id);
  if (rule?.latest) {
    // the app's own rows: a delete on one side counts like any other change, the newer one wins
    if (same(mine, theirs)) return 'same';
    const a = String((rule.when && mine != null ? rule.when(mine) : '') || mineAt || '');
    const b = String((rule.when && theirs != null ? rule.when(theirs) : '') || theirsAt || '');
    return b > a ? 'theirs' : 'mine';
  }
  if (!rule || mine == null || theirs == null) return null;
  if (rule.own) {
    if (same(mine, theirs)) return 'same';
    if (!same(ownOf(mine, rule.own), ownOf(theirs, rule.own))) return null;
    return String(rule.when(theirs)) > String(rule.when(mine)) ? 'theirs' : 'mine';
  }
  if (same(withoutMarks(mine, rule), withoutMarks(theirs, rule))) return 'same';
  return String(rule.when(theirs)) > String(rule.when(mine)) ? 'theirs' : 'mine';
}

/**
 * Noah 24.10.2026: a record changed on both devices never becomes a question. The fetched copies keep
 * their rules (autoPick); everything else: the newer change wins (a delete is a change too), and the other
 * version is kept (keep: which side lost, for the quiet history). Two changes with the same time: the one
 * with the larger content wins, the same on both devices, so both end with the same version.
 * Returns { win: 'same' | 'mine' | 'theirs', keep: null | 'mine' | 'theirs' }.
 */
export function settle(t, id, mine, theirs, { mineAt = '', theirsAt = '' } = {}) {
  if (same(mine, theirs)) return { win: 'same', keep: null };
  const auto = autoPick(t, id, mine, theirs, { mineAt, theirsAt });
  if (auto) return { win: auto, keep: null };
  const a = String(mineAt ?? '');
  const b = String(theirsAt ?? '');
  const theirsWins = b !== a ? b > a : stable(theirs) > stable(mine);
  return theirsWins ? { win: 'theirs', keep: 'mine' } : { win: 'mine', keep: 'theirs' };
}

/** One remote record: take it, note it as the same, or settle a change on both devices. */
async function applyRemote(db, p, s) {
  const { t, id } = p;
  if (!known.has(t) || id == null || deviceOnly(t, id)) return 'skip';
  return db.transaction('rw', db.table(t), db.meta, async () => {
    const note = await db.meta.get(noteKey(t, id));
    if (note && note.base >= s) return 'skip'; // our own write coming back, or older than what we have
    const local = (await db.table(t).get(id)) ?? null;
    const theirs = p.del ? null : p.v;
    if (!note?.dirty) {
      await takeTheirs(db, t, id, { s, v: p.v, del: p.del, at: p.at });
      return 'taken';
    }
    const { win, keep } = settle(t, id, local, theirs, { mineAt: note.at, theirsAt: p.at });
    if (keep === 'mine') await keepLost(db, t, id, { v: local, at: note.at, dev: 'here' });
    if (keep === 'theirs') await keepLost(db, t, id, { v: theirs, at: p.at, dev: p.dev });
    await db.meta.delete(askKey(t, id));
    if (win === 'same') {
      await db.meta.put({ ...note, dirty: 0, base: s, del: !!p.del });
      return 'same';
    }
    if (win === 'theirs') {
      await takeTheirs(db, t, id, { s, v: p.v, del: p.del, at: p.at });
      return 'taken';
    }
    // this device changed it later: it stays and goes to the server on the push of this round
    await db.meta.put({ ...note, dirty: 1, base: s });
    return 'same';
  });
}

/**
 * One full round. dev: 'phone' or 'computer' (shown to the other device in a question).
 * Returns { taken, sent, asks, big } or { skipped } when the sync is off or a demo runs.
 */
export async function syncNow(db, { api = httpApi(), dev = 'computer', demo = async () => !!(await db.meta.get('demo')), now = () => new Date().toISOString() } = {}) {
  const cfg = await readCfg(db);
  if (!cfg?.on || !cfg.code) return { skipped: 'off' };
  if (await demo()) return { skipped: 'demo' };
  const keys = await keysOf(cfg.code);
  const out = { taken: 0, sent: 0, asks: 0, big: 0 };
  try {
    let since = cfg.since ?? 0;
    const pull = async () => {
      for (let round = 0; round < 1000; round++) {
        const res = await api.call('pull', { token: keys.token, since });
        for (const it of res.items ?? []) {
          const p = await unseal(keys, it.e);
          if (!p) continue; // sealed with another code: not ours to read
          const r = await applyRemote(db, p, it.s);
          if (r === 'taken') out.taken++;
        }
        since = Math.max(since, Number(res.next ?? since));
        await writeCfg(db, { since });
        if (!res.more) break;
      }
    };
    await pull();
    // questions asked before a rule could answer them (e.g. Strava activities until 20.10.2026): answer them now
    out.settled = await settleAsks(db);

    // push what changed here (not the records waiting for an answer)
    const asks = new Set((await db.meta.where('key').startsWith(ASK).primaryKeys()).map((k) => k.slice(ASK.length)));
    const dirty = (await db.meta.where('key').startsWith(NOTE).toArray()).filter((n) => n.dirty && !asks.has(`${n.t}|${JSON.stringify(n.id)}`) && known.has(n.t) && !deviceOnly(n.t, n.id));
    let batch = [];
    let chars = 0;
    let raced = false;
    const send = async () => {
      if (!batch.length) return;
      const res = await api.call('push', { token: keys.token, items: batch.map(({ k, base, e }) => ({ k, base, e })) });
      const byK = new Map(batch.map((b) => [b.k, b]));
      await db.transaction('rw', db.meta, async () => {
        for (const d of res.done ?? []) {
          const b = byK.get(d.k);
          if (!b) continue;
          const note = await db.meta.get(b.nk);
          // changed again while it travelled: stays dirty, with the new base
          await db.meta.put({ ...(note ?? b.note), base: d.s, dirty: note && note.at !== b.note.at ? 1 : 0 });
          out.sent++;
        }
      });
      if (res.conflicts?.length) raced = true;
      batch = [];
      chars = 0;
    };
    for (const n of dirty) {
      const v = n.del ? null : ((await db.table(n.t).get(n.id)) ?? null);
      const e = await seal(keys, { t: n.t, id: n.id, v, del: v === null, at: n.at, dev });
      if (e.length > RECORD_MAX) {
        out.big++;
        continue;
      }
      if (batch.length >= BATCH_MAX || (batch.length && chars + e.length > BATCH_CHARS)) await send();
      batch.push({ k: await recName(keys, n.t, n.id), base: n.base ?? 0, e, nk: n.key, note: n });
      chars += e.length;
    }
    await send();
    // the other device wrote in between: its version comes now (and may become a question)
    if (raced) await pull();
    out.asks = await db.meta.where('key').startsWith(ASK).count();
    await pruneLost(db);
    await writeCfg(db, { lastAt: now(), error: null, big: out.big });
    return out;
  } catch (err) {
    await writeCfg(db, { error: err.code || 'server_error', errorAt: now() });
    throw err;
  }
}
