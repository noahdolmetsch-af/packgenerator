/**
 * «Abgleich vergleichen» (Noah 03.11.2026 «a», Thread «Abgleich und Datenverlust Smartphone»): shows what the
 * server holds and this device lacks, and the other way round, with names (e.g. a bike that never arrived).
 * Reads only: nothing is written until fixMissing() runs, and that only adds, it never deletes.
 *
 * The sync pushes only what it knows as changed. A record that the server lost, or never got, is never sent
 * again, and a round still says «Done». This check finds exactly that.
 */
import { DATA_TABLES, syncLocal } from '../db.js';
import { keysOf, unseal } from './code.js';
import { NOTE, noteKey } from './track.js';
import { readCfg, httpApi, takeTheirs } from './engine.js';

const known = new Set(DATA_TABLES);

/**
 * Reads the whole server space (not applied) and compares it with this device.
 * Returns { onServer, here, missingHere, missingThere, deletedThere, unreadable } where the missing lists hold
 * { t, id, v, s }: v is the record (from the server or from here).
 */
export async function compareSync(db, { api = httpApi() } = {}) {
  const cfg = await readCfg(db);
  if (!cfg?.on || !cfg.code) return { off: true };
  const keys = await keysOf(cfg.code);
  const server = new Map();
  let unreadable = 0;
  let since = 0;
  for (let round = 0; round < 1000; round++) {
    const res = await api.call('pull', { token: keys.token, since });
    for (const it of res.items ?? []) {
      const p = await unseal(keys, it.e);
      if (!p) {
        unreadable++;
        continue;
      }
      if (!known.has(p.t) || syncLocal(p.t, p.id)) continue;
      server.set(noteKey(p.t, p.id), { t: p.t, id: p.id, v: p.del ? null : p.v, del: !!p.del, s: it.s });
    }
    since = Math.max(since, Number(res.next ?? since));
    if (!res.more) break;
  }
  const out = { onServer: 0, here: 0, missingHere: [], missingThere: [], deletedThere: [], unreadable };
  const notes = new Map((await db.meta.where('key').startsWith(NOTE).toArray()).map((n) => [n.key, n]));
  const local = new Set();
  for (const t of DATA_TABLES) {
    for (const id of await db.table(t).toCollection().primaryKeys()) {
      if (syncLocal(t, id)) continue;
      out.here++;
      const k = noteKey(t, id);
      local.add(k);
      const sv = server.get(k);
      if (!sv) out.missingThere.push({ t, id, v: await db.table(t).get(id) });
      else if (sv.del) out.deletedThere.push({ t, id, v: await db.table(t).get(id) });
    }
  }
  for (const [k, sv] of server) {
    if (sv.del) continue;
    out.onServer++;
    // a delete made here that has not gone out yet is not «missing»
    if (!local.has(k) && !notes.get(k)?.del) out.missingHere.push(sv);
  }
  return out;
}

/**
 * Fills the gaps both ways, only adding: what the server holds and this device lacks is put here; what this
 * device holds and the server lacks is marked to go out with the next round. Entries the other device deleted
 * stay as they are. Returns { got, sent }.
 */
export async function fixMissing(db, found, now = new Date().toISOString()) {
  let got = 0;
  let sent = 0;
  await db.transaction('rw', db.meta, ...DATA_TABLES.map((t) => db.table(t)), async () => {
    for (const r of found.missingHere ?? []) {
      await takeTheirs(db, r.t, r.id, { s: r.s, v: r.v, del: false, at: now });
      got++;
    }
    for (const r of found.missingThere ?? []) {
      await db.meta.put({ key: noteKey(r.t, r.id), t: r.t, id: r.id, at: now, del: false, dirty: 1, base: 0 });
      sent++;
    }
  });
  return { got, sent };
}
