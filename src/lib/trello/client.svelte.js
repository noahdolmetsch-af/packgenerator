/**
 * Trello (Noah 19.10.2026 «1a 2a 3b 4a 5a», «1a 2a»): the live state and the sync of the app with the board
 * «Packgenerator» (rules of the merge: src/lib/trello.js).
 *
 * - The login runs on the server (api/trello.js); the device key from Strava proves it is Noah's device.
 * - Automatic: when the app opens or comes back, at most every 15 minutes (as Google and Fitbit), and a
 *   short while after a change in a Trello list. «Jetzt abgleichen» does it at once.
 * - What lives where: db.settings 'trello' = { on, board, todos: { sync, link }, reg, lastSync }, each own
 *   list { sync: 'trello', trello: link }, each item / to-do { trello: t } (all in backups).
 */
import { liveQuery } from 'dexie';
import { db as appDb } from '../db.js';
import { readKey } from '../strava/client.svelte.js';
import { localDay } from '../localday.js';
import { MERKEN_KEY } from '../merkendb.js';
import { LISTS_KEY } from '../ownlists.js';
import { newTodo, tick } from '../merken.js';
import { t } from '../i18n.svelte.js';
import { TRELLO_KEY, TODOS_KEY, reconcile, bindIds, opParts, withIds } from '../trello.js';

export const TRELLO_URL = 'https://packgen-three.vercel.app/api/trello';
export const MERKEN_HASH = '#/calendar';
export const TRY_KEY = 'trello.try';
export const AUTO_EVERY_MS = 15 * 60 * 1000;
export const SOON_MS = 20 * 1000;

export class TrelloError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

export async function call(step, { method = 'GET', body = null, key = readKey(), doFetch = (...a) => fetch(...a) } = {}) {
  if (!key) throw new TrelloError('unauthorized');
  const headers = { Authorization: `Bearer ${key}` };
  if (body) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await doFetch(`${TRELLO_URL}?step=${encodeURIComponent(step)}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new TrelloError('network');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.ok === false) throw new TrelloError(data?.code ?? data?.error ?? 'server_error');
  return data;
}

export const trello = $state({ loaded: false, busy: false, error: '', justConnected: false, prefs: {} });

if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
  liveQuery(async () => (await appDb.settings.get(TRELLO_KEY))?.value ?? {}).subscribe({
    next: (p) => {
      trello.prefs = p;
      trello.loaded = true;
    },
    error: () => (trello.loaded = true),
  });
}

export async function savePrefs(patch, db = appDb) {
  await db.transaction('rw', db.settings, async () => {
    const old = (await db.settings.get(TRELLO_KEY))?.value ?? {};
    await db.settings.put({ key: TRELLO_KEY, value: { ...old, ...patch } });
  });
}

const uid = (p) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** The app data as units (src/lib/trello.js). */
export function unitsOf({ todos, lists, prefs }, todosName) {
  const units = [];
  const tp = prefs.todos ?? {};
  units.push({
    key: TODOS_KEY,
    kind: 'todos',
    name: todosName,
    sync: !!tp.sync,
    link: tp.link ?? null,
    items: todos.filter((x) => !x.kind).map((x) => ({ id: x.id, text: x.text, due: x.due ?? null, done: !!x.doneAt, t: x.trello ?? null, repeat: x.repeat ?? null })),
  });
  for (const l of lists) {
    units.push({ key: l.id, kind: 'list', name: l.name, sync: l.sync === 'trello', link: l.trello ?? null, items: l.items.map((x) => ({ id: x.id, text: x.text, due: x.date ?? null, done: !!x.done, t: x.trello ?? null })) });
  }
  return units;
}

/** The units back into the app data. Returns { todos, lists, todosPrefs }. */
export function appOf(units, { todos, lists }, { now = new Date().toISOString(), today = localDay(), kmOf = () => null } = {}) {
  const tu = units.find((u) => u.key === TODOS_KEY);
  let outTodos = todos;
  if (tu) {
    const byId = new Map(todos.map((x) => [x.id, x]));
    const kept = new Set(tu.items.map((x) => x.id));
    outTodos = todos.filter((x) => x.kind || kept.has(x.id)).map((x) => {
      if (x.kind) return x;
      const it = tu.items.find((i) => i.id === x.id);
      let base = x;
      if (it.ticked) base = tick(x, { today, now, bikeKm: x.repeat?.bikeId ? kmOf(x.repeat.bikeId) : null });
      const out = { ...base, text: it.text, due: it.ticked ? base.due : it.due, doneAt: it.done ? (x.doneAt ?? now) : null };
      if (it.t) out.trello = it.t;
      else delete out.trello;
      return out;
    });
    for (const it of tu.items) {
      if (byId.has(it.id)) continue;
      const td = newTodo({ text: it.text, due: it.due }, { id: it.id, now });
      if (!td) continue;
      if (it.done) td.doneAt = now;
      if (it.t) td.trello = it.t;
      outTodos.push(td);
    }
  }
  const outLists = [];
  for (const u of units) {
    if (u.kind !== 'list') continue;
    const old = lists.find((l) => l.id === u.key);
    const items = u.items.map((it) => {
      const was = old?.items.find((x) => x.id === it.id);
      const x = { ...(was ?? { id: it.id, at: now }), text: it.text, done: it.done ? (was?.done ?? now) : null };
      if (it.due) x.date = it.due;
      else delete x.date;
      if (it.t) x.trello = it.t;
      else delete x.trello;
      return x;
    });
    const l = { ...(old ?? { id: u.key, check: true, pin: null, created: now }), name: u.name, items };
    if (u.sync) l.sync = 'trello';
    else delete l.sync;
    if (u.link) l.trello = u.link;
    else delete l.trello;
    outLists.push(l);
  }
  // lists deleted in the app meanwhile stay deleted (units only hold the lists read at the start)
  return { todos: outTodos, lists: outLists, todosPrefs: tu ? { sync: tu.sync, link: tu.link } : null };
}

/** Writes the result, but keeps every to-do and list the person changed while the sync ran. */
async function writeBack(db, before, after, reg) {
  await db.transaction('rw', db.settings, async () => {
    const curTodos = (await db.settings.get(MERKEN_KEY))?.value ?? [];
    const curLists = (await db.settings.get(LISTS_KEY))?.value ?? [];
    const prefs = (await db.settings.get(TRELLO_KEY))?.value ?? {};
    // to-dos: changed meanwhile → the current one wins; new meanwhile → kept
    const bTodo = new Map(before.todos.map((x) => [x.id, x]));
    const cTodo = new Map(curTodos.map((x) => [x.id, x]));
    const todos = [];
    for (const x of after.todos) {
      const was = bTodo.get(x.id);
      const cur = cTodo.get(x.id);
      if (was && !cur) continue; // deleted meanwhile
      todos.push(was && cur && !same(was, cur) ? cur : x);
    }
    for (const x of curTodos) if (!bTodo.has(x.id) && !todos.some((y) => y.id === x.id)) todos.push(x);
    const bList = new Map(before.lists.map((x) => [x.id, x]));
    const cList = new Map(curLists.map((x) => [x.id, x]));
    const lists = [];
    for (const l of after.lists) {
      const was = bList.get(l.id);
      const cur = cList.get(l.id);
      if (was && !cur) continue;
      lists.push(was && cur && !same(was, cur) ? cur : l);
    }
    for (const l of curLists) if (!bList.has(l.id) && !lists.some((y) => y.id === l.id)) lists.push(l);
    await db.settings.put({ key: MERKEN_KEY, value: JSON.parse(JSON.stringify(todos)) });
    await db.settings.put({ key: LISTS_KEY, value: JSON.parse(JSON.stringify(lists)) });
    lastWritten = JSON.stringify([todos, lists]);
    const todosNow = same(prefs.todos?.sync, before.prefs.todos?.sync) && after.todosPrefs ? after.todosPrefs : { ...(prefs.todos ?? {}), link: after.todosPrefs?.link ?? prefs.todos?.link ?? null };
    await db.settings.put({ key: TRELLO_KEY, value: { ...prefs, todos: todosNow, reg, lastSync: new Date().toISOString() } });
  });
}

let running = null;
/** What the last sync wrote: a change the watcher sees that is only this does not start another sync. */
let lastWritten = '';
/** «Jetzt abgleichen»: the board, the merge, the changes to Trello, the result here. True when done. */
export function syncNow({ db = appDb, c = call, todosName } = {}) {
  if (running) return running;
  running = (async () => {
    trello.busy = true;
    trello.error = '';
    try {
      await db.meta.put({ key: TRY_KEY, at: new Date().toISOString() });
      const snap = await c('board');
      const before = {
        todos: (await db.settings.get(MERKEN_KEY))?.value ?? [],
        lists: (await db.settings.get(LISTS_KEY))?.value ?? [],
        prefs: (await db.settings.get(TRELLO_KEY))?.value ?? {},
      };
      const bikes = await db.bikes.toArray();
      const kmOf = (id) => bikes.find((x) => x.id === id)?.km ?? null;
      const units = unitsOf(before, todosName ?? t('To-dos'));
      const today = localDay();
      const onDone = (it) => (it.repeat ? { ...it, done: false, ticked: true, due: tick({ due: it.due, repeat: it.repeat }, { today }).due ?? it.due } : it);
      const r = reconcile(units, snap, before.prefs.reg ?? {}, { newKey: () => uid('ls'), newItemId: () => uid('td'), onDone });
      const results = [];
      const made = new Map();
      for (const part of opParts(r.ops)) {
        const res = (await c('apply', { method: 'POST', body: { ops: withIds(part, made) } })).results ?? [];
        for (const x of res) if (x.ref && x.id) made.set(x.ref, x.id);
        results.push(...res);
      }
      const b = bindIds(r.units, results, r.reg);
      const after = appOf(b.units, before, { today, kmOf });
      await writeBack(db, before, after, b.reg);
      await savePrefs({ board: snap.board }, db);
      return true;
    } catch (err) {
      const code = err?.code ?? 'network';
      trello.error = code;
      if (code === 'not_connected') await savePrefs({ on: false }, db);
      return false;
    } finally {
      trello.busy = false;
    }
  })().finally(() => (running = null));
  return running;
}

/** The automatic sync: connected, a Strava key on this device, 15 minutes passed. */
export async function autoSync({ db = appDb, now = new Date(), ...rest } = {}) {
  if (!readKey() || trello.busy) return null;
  const p = (await db.settings.get(TRELLO_KEY))?.value ?? {};
  if (!p.on) return null;
  const tried = Date.parse((await db.meta.get(TRY_KEY))?.at ?? '');
  if (Number.isFinite(tried) && now.getTime() - tried < AUTO_EVERY_MS) return null;
  return syncNow({ db, ...rest });
}

let soonTimer = null;
/** A change in a Trello list: sync a little later (an Undo within the next seconds still counts). */
export function syncSoon(opts = {}) {
  if (!trello.prefs?.on) return;
  clearTimeout(soonTimer);
  soonTimer = setTimeout(() => syncNow(opts).catch(() => {}), SOON_MS);
}

export function watchAutoSync(opts = {}) {
  if (typeof document === 'undefined') return;
  const go = () => autoSync(opts).catch(() => {});
  go();
  // a change in Merken or a list: sync a little later (only while Trello is connected)
  let first = true;
  liveQuery(async () => JSON.stringify([(await appDb.settings.get(MERKEN_KEY))?.value ?? [], (await appDb.settings.get(LISTS_KEY))?.value ?? []])).subscribe({
    next: (v) => {
      if (first) {
        first = false;
        return;
      }
      if (v !== lastWritten && !trello.busy) syncSoon(opts);
    },
    error: () => {},
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') go();
  });
}

/** «Trello verbinden»: Trello's own page asks for the permission; back to Merken. */
export async function connect({ c = call, loc = globalThis.location } = {}) {
  trello.error = '';
  try {
    const { url } = await c('start', { method: 'POST', body: { returnTo: `${loc.origin}${loc.pathname}${MERKEN_HASH}` } });
    loc.href = url;
    return url;
  } catch (err) {
    trello.error = err?.code ?? 'network';
    return null;
  }
}

/** Back from Trello: «#/calendar?trello=connected». Read once; the to-dos go to Trello (Noah «1a»), then the first sync. */
export function takeReturn(loc = globalThis.location, hist = globalThis.history, { db = appDb, todosName } = {}) {
  const h = loc?.hash ?? '';
  if (!h.startsWith(MERKEN_HASH)) return null;
  const i = h.indexOf('?');
  if (i < 0) return null;
  const q = new URLSearchParams(h.slice(i + 1));
  const v = q.get('trello');
  if (!v) return null;
  const rest = new URLSearchParams(h.slice(i + 1));
  rest.delete('trello');
  rest.delete('error');
  try {
    hist?.replaceState(null, '', `${loc.pathname}${loc.search}${h.slice(0, i)}${rest.size ? `?${rest}` : ''}`);
  } catch {
    /* the address stays */
  }
  if (v === 'connected') {
    trello.error = '';
    trello.justConnected = true;
    (async () => {
      const p = (await db.settings.get(TRELLO_KEY))?.value ?? {};
      await savePrefs({ on: true, todos: { ...(p.todos ?? {}), sync: p.todos?.sync ?? true } }, db);
      await syncNow({ db, todosName });
    })().catch(() => {});
    return { connected: true };
  }
  trello.error = q.get('error') || 'denied';
  return { error: trello.error };
}

/** «Trennen»: the app stops syncing and forgets the Trello ids; the board and the app data stay. */
export async function disconnect({ db = appDb, c = call } = {}) {
  trello.error = '';
  try {
    await c('disconnect', { method: 'POST', body: {} });
  } catch (err) {
    if ((err?.code ?? '') !== 'not_connected') trello.error = err?.code ?? 'network';
  }
  await db.transaction('rw', db.settings, async () => {
    const todos = ((await db.settings.get(MERKEN_KEY))?.value ?? []).map(({ trello: _t, ...x }) => x);
    const lists = ((await db.settings.get(LISTS_KEY))?.value ?? []).map(({ trello: _t, sync: _s, ...l }) => ({ ...l, items: l.items.map(({ trello: _x, ...it }) => it) }));
    await db.settings.put({ key: MERKEN_KEY, value: todos });
    await db.settings.put({ key: LISTS_KEY, value: lists });
    await db.settings.put({ key: TRELLO_KEY, value: {} });
  });
}

/** «Merken-To-dos in Trello» on or off. */
export async function setTodosSync(on, { db = appDb } = {}) {
  const p = (await db.settings.get(TRELLO_KEY))?.value ?? {};
  await savePrefs({ todos: { ...(p.todos ?? {}), sync: !!on } }, db);
  syncSoon({ db });
}
