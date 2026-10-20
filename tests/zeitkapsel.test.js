// Zeitkapsel (Noah 20.10.2026 «3a»): every older database moves to today's version without losing anything.
// Instead of a hand check with a copy of Noah's backup, this test builds a database exactly as every
// older app version left it (the schema steps read from src/lib/db.js, not copied), fills it with
// fictional data (the Gesamttest fixture, plus a few invented rows for the newer tables), closes it,
// and opens it again with today's app (createDb). Every table, every record and every field must
// still be there. A new db.version() step is covered by itself, with no change to this test.
// When a future step changes stored data on purpose (an .upgrade()), add its expected change here.
import { describe, it, expect, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { readFileSync } from 'node:fs';
import { createDb, DATA_TABLES } from '../src/lib/db.js';

const SRC = readFileSync(new URL('../src/lib/db.js', import.meta.url), 'utf8');
const FIXTURE = JSON.parse(readFileSync(new URL('./fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url), 'utf8')).tables;

/** The schema steps in db.js: [{ v, stores: { table: 'id, index, …' } }], in order. */
function steps() {
  const body = SRC.slice(SRC.indexOf('export function createDb'));
  const out = [];
  for (const m of body.matchAll(/db\.version\((\d+)\)\.stores\(\{([\s\S]*?)\}\)/g)) {
    const stores = {};
    for (const s of m[2].matchAll(/^\s*(\w+):\s*'([^']*)'/gm)) stores[s[1]] = s[2];
    out.push({ v: Number(m[1]), stores, upgrade: /\.upgrade\(/.test(body.slice(m.index, m.index + m[0].length + 40)) });
  }
  return out;
}

/** The schema an app with this version had: all steps up to it, a later step overriding a table. */
const schemaAt = (v) => Object.assign({}, ...steps().filter((s) => s.v <= v).map((s) => s.stores));

/** The primary key and the indexed fields of a schema string ('id, bikeId, *domains' …). */
const fields = (spec) =>
  spec
    .split(',')
    .map((s) => s.trim().replace(/^[&*+]+/, ''))
    .filter(Boolean)
    .flatMap((s) => (s.startsWith('[') ? s.slice(1, -1).split('+') : [s]));

/** Fictional rows for a table: the fixture's own rows, or three invented ones with the indexed fields. */
function rowsFor(table, spec) {
  if (FIXTURE[table]?.length) return FIXTURE[table];
  const [key, ...idx] = fields(spec);
  return [1, 2, 3].map((n) => {
    const row = { [key]: key === 'day' || key === 'date' ? `2026-01-0${n}` : `zk-${table}-${n}`, note: `test_data_gtp_ Zeitkapsel ${table} ${n}` };
    for (const f of idx) if (!(f in row)) row[f] = /day|date|at$|due/i.test(f) ? `2026-01-0${n}` : /order|km/i.test(f) ? n : `test_data_gtp_${f}-${n}`;
    return row;
  });
}

const open = [];
afterEach(async () => {
  for (const d of open.splice(0)) d.close();
});

describe('Zeitkapsel: every older database moves to today without loss', () => {
  const all = steps();
  const latest = all.at(-1).v;

  it('reads the schema steps from db.js', () => {
    expect(all.length).toBeGreaterThan(10);
    expect(all[0].v).toBe(1);
    expect(Object.keys(schemaAt(latest))).toEqual(expect.arrayContaining(DATA_TABLES.filter((t) => t !== 'meta')));
    // the steps only add tables so far; a step with .upgrade() needs its expected change written down here
    expect(all.filter((s) => s.upgrade).map((s) => s.v)).toEqual([]);
  });

  for (const { v } of all.filter((s) => s.v < latest)) {
    it(`version ${v} → ${latest}: every table, record and field stays`, async () => {
      const name = `zeitkapsel-${v}-${Math.random()}`;
      const schema = schemaAt(v);
      const old = new Dexie(name);
      old.version(v).stores(schema);
      await old.open();
      const put = {};
      for (const [table, spec] of Object.entries(schema)) {
        if (table === 'meta') continue;
        put[table] = rowsFor(table, spec);
        await old.table(table).bulkPut(put[table]);
      }
      old.close();

      const now = createDb(name);
      open.push(now);
      await now.open();
      expect(now.verno).toBe(latest);
      for (const [table, rows] of Object.entries(put)) {
        const back = await now.table(table).toArray();
        expect(back.length, `${table} after ${v} → ${latest}`).toBe(rows.length);
        const key = now.table(table).schema.primKey.keyPath;
        const byKey = new Map(back.map((r) => [JSON.stringify(r[key]), r]));
        for (const r of rows) expect(byKey.get(JSON.stringify(r[key])), `${table} ${r[key]}`).toEqual(expect.objectContaining(r));
      }
      // the tables of the newer versions are there and empty
      for (const table of Object.keys(schemaAt(latest))) expect(now.tables.map((t) => t.name)).toContain(table);
    });
  }
});
