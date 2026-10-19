// «Heute lädt nicht» (19.10.2026): the app notices a database that cannot open (another tab holds an older version).
import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { watchDbOpen } from '../src/lib/dbwait.js';

const fakeDb = () => {
  const subs = [];
  let open = false;
  let resolve;
  const ev = (name) => (name ? Object.assign(() => {}, { unsubscribe: (f) => subs.splice(subs.indexOf(f), 1) }) : null);
  return {
    on: (name, f) => (f ? subs.push(f) : ev(name)),
    isOpen: () => open,
    open: () => new Promise((r) => (resolve = () => ((open = true), r()))),
    fire: () => subs.forEach((f) => f()),
    finish: () => resolve(),
    subs,
  };
};

describe('watchDbOpen', () => {
  it('reports «blocked» and «slow», and clears both once the database opens', async () => {
    const db = fakeDb();
    const seen = [];
    let fire;
    watchDbOpen(db, (s) => seen.push(s), { setTimer: (f) => ((fire = f), 1), clearTimer: () => {} });
    db.fire();
    fire();
    expect(seen.at(-1)).toEqual({ blocked: true, slow: true, newer: false });
    db.finish();
    await new Promise((r) => setTimeout(r, 0));
    expect(seen.at(-1)).toMatchObject({ blocked: false, slow: false });
  });

  it('says nothing when the database opens in time, and stops listening', async () => {
    const db = fakeDb();
    const seen = [];
    const stop = watchDbOpen(db, (s) => seen.push(s), { setTimer: () => 1, clearTimer: () => {} });
    db.finish();
    await new Promise((r) => setTimeout(r, 0));
    expect(seen).toEqual([]);
    stop();
    expect(db.subs).toEqual([]);
  });

  it('a real upgrade held up by an old connection is reported as blocked', async () => {
    const name = 'dbwait-' + Math.random();
    const raw = await new Promise((r) => {
      const q = indexedDB.open(name, 10);
      q.onsuccess = () => r(q.result); // holds version 1 and never lets go (no versionchange handler)
    });
    const db = new Dexie(name);
    db.version(1).stores({ a: 'id' });
    db.version(2).stores({ b: 'id' });
    const seen = [];
    watchDbOpen(db, (s) => seen.push(s), { waitMs: 50 });
    await new Promise((r) => setTimeout(r, 150));
    expect(seen.at(-1)).toMatchObject({ blocked: true, slow: true });
    raw.close();
    await db.open();
    await new Promise((r) => setTimeout(r, 0));
    expect(seen.at(-1)).toMatchObject({ blocked: false, slow: false });
    db.close();
  });

  it('an old tab gives way to a newer version and says so', async () => {
    const name = 'dbwait-' + Math.random();
    const old = new Dexie(name);
    old.version(1).stores({ a: 'id' });
    await old.open();
    const seen = [];
    watchDbOpen(old, (s) => seen.push(s), { waitMs: 50 });
    const next = new Dexie(name);
    next.version(1).stores({ a: 'id' });
    next.version(2).stores({ b: 'id' });
    await next.open(); // not blocked: the old tab closed its database
    expect(seen.at(-1)).toMatchObject({ newer: true });
    next.close();
  });
});
