// v0.32.0 (finding 5, stage 1: words and screens only). Stage 1 must not change any data: for the
// e2e fixtures, the packing lists of a new trip (standard, day ride, with a night, from a template)
// are the same as before (tests/stage1-packlists.json, written from main 2fdd2f9), also after every
// item went once through the item dialog without a change. Fictional fixture data only.
// v0.33.0 (stage 2): the same, except the 11a change (Standard into every copy and template start).
// WRITE_GOLDEN=1 npx vitest run tests/stage1.test.js writes the file again (only on purpose).
import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildBikeTrip, dayRidePlan } from '../src/lib/dayride.js';
import { itemDraft, itemRecord } from '../src/lib/gear.js';
import { comesOf, setStandard, setPlace, clearOptional, leaveHomeFields } from '../src/lib/gear/comes.js';
import { migrateAll, inStandard } from '../src/lib/blocks2026.js';

const read = (name) => JSON.parse(readFileSync(fileURLToPath(new URL(`./e2e/${name}`, import.meta.url)), 'utf8'));
const GOLDEN = fileURLToPath(new URL('./stage1-packlists.json', import.meta.url));
const FIXTURES = ['fixture.json', 'pf-fixture.json'];
const NOW = 1_790_000_000_000;

const norm = (trip) => (trip.entries ?? []).map((e) => `${e.itemId}@${e.slot}×${e.qty ?? 1}${e.src ? `:${e.src}` : ''}`).sort();

/** Every new trip list we compare: per bike the standard set, a night outdoors and in lodging, the day ride and each template. */
function lists(data, items = data.tables.items) {
  const { bikes, trips } = data.tables;
  const settings = Object.fromEntries((data.tables.settings ?? []).map((s) => [s.key, s.value]));
  const templates = settings.templates ?? [];
  const out = {};
  const make = (bike, start, days, fields) => norm(buildBikeTrip({ draft: { title: 'test_data_gtp_', startDate: '2026-11-07', days }, bike, start, templates, trips, items, fields }, NOW));
  for (const bike of bikes) {
    out[`${bike.id}/standard`] = make(bike, 'standard', 1, { hours: 2, overnight: 'none', cook: false, wx: { min: 8, max: 14, rain: 'none' }, event: false });
    out[`${bike.id}/last`] = make(bike, 'last', 1, { hours: 2, overnight: 'none', cook: false, wx: { min: 8, max: 14, rain: 'none' }, event: false });
    out[`${bike.id}/outdoor`] = make(bike, 'standard', 2, { hours: 5, overnight: 'outdoor', cook: true, wx: { min: 4, max: 12, rain: 'rain' }, event: false });
    out[`${bike.id}/lodging`] = make(bike, 'standard', 3, { hours: 5, overnight: 'lodging', cook: false, wx: { min: 15, max: 25, rain: 'none' }, event: false });
    for (const tp of templates) out[`${bike.id}/tpl:${tp.id}`] = make(bike, tp.id, tp.days ?? 1, { hours: tp.hours ?? 2, overnight: tp.overnight ?? 'none', cook: !!tp.cook, wx: { min: 10, max: 20, rain: 'none' }, event: false });
  }
  const plan = dayRidePlan(trips, bikes, { now: new Date(2026, 10, 7, 9) });
  if (plan) out.dayride = norm(buildBikeTrip({ draft: { title: plan.title, startDate: plan.startDate, days: 1 }, bike: plan.bike, start: 'standard', templates, trips, items, fields: { hours: plan.hours, overnight: 'none', cook: false, wx: plan.wx, event: false } }, NOW));
  return out;
}

/** "Save" in the item dialog without touching anything (the record the dialog writes). */
const savedAsIs = (item, items) => itemRecord(itemDraft(item), { item, items, weightG: item.weightG ?? null, now: item.updatedAt });

/**
 * v0.33.0 (Noah 11a): Standard comes into every new trip, also a copy ("last") and a template start.
 * Those lists may differ from stage 1 only by Standard items: added ones, or one the night brought
 * before that now comes as Standard (the same row without the mark 'context'). Every other list
 * must be exactly as in stage 1. Returns the differences that are NOT allowed ([] = fine).
 */
const is11a = (key) => /\/(last|tpl:.*)$/.test(key);
function notAllowed(now, golden, items) {
  const std = new Set(items.filter((i) => inStandard(i)).map((i) => i.id));
  const bad = [];
  for (const key of Object.keys(golden)) {
    if (!is11a(key)) {
      if (JSON.stringify(now[key]) !== JSON.stringify(golden[key])) bad.push([key, now[key], golden[key]]);
      continue;
    }
    const idOf = (s) => s.split('@')[0];
    const refIds = new Set(golden[key].map(idOf));
    for (const s of now[key].filter((x) => !refIds.has(idOf(x)))) if (!std.has(idOf(s))) bad.push([key, 'added, not Standard', s]);
    const kept = now[key].filter((x) => refIds.has(idOf(x)));
    const ref = golden[key].map((s) => (s.endsWith(':context') && std.has(idOf(s)) && kept.includes(s.replace(/:context$/, '')) ? s.replace(/:context$/, '') : s));
    if (JSON.stringify([...ref].sort()) !== JSON.stringify([...kept].sort())) bad.push([key, kept, ref]);
  }
  if (JSON.stringify(Object.keys(now)) !== JSON.stringify(Object.keys(golden))) bad.push(['keys', Object.keys(now), Object.keys(golden)]);
  return bad;
}

describe('stage 1: the same packing lists as before (stage 2: 11a apart)', () => {
  const all = Object.fromEntries(FIXTURES.map((f) => [f, lists(read(f))]));
  if (process.env.WRITE_GOLDEN) writeFileSync(GOLDEN, `${JSON.stringify(all, null, 1)}\n`);
  const golden = JSON.parse(readFileSync(GOLDEN, 'utf8'));

  for (const f of FIXTURES) {
    it(`${f}: standard, day ride, with a night and from templates as before`, () => {
      expect(Object.keys(all[f]).length).toBeGreaterThan(3);
      expect(notAllowed(all[f], golden[f], read(f).tables.items)).toEqual([]);
    });

    it(`${f}: after the update blocks2026: the same lists`, () => {
      const data = read(f);
      const items = migrateAll({ items: data.tables.items }).items;
      expect(lists(data, items)).toEqual(all[f]);
    });

    it(`${f}: every item saved once through the item dialog (before and after the update): the same lists`, () => {
      const data = read(f);
      const items = data.tables.items.map((i) => savedAsIs(i, data.tables.items));
      expect(lists(data, items)).toEqual(all[f]);
      const up = migrateAll({ items: data.tables.items }).items;
      expect(lists(data, up.map((i) => savedAsIs(i, up)))).toEqual(all[f]);
    });

    it(`${f}: pressing the button that is already on changes nothing`, () => {
      const data = read(f);
      const items = data.tables.items.map((i) => {
        const d = itemDraft(i);
        const c = comesOf(d);
        // The place buttons: pressing the place it has (Am Körper or its bag) writes the same fields.
        Object.assign(d, setPlace(d, c.body ? 'body' : 'bag'));
        return itemRecord(d, { item: i, items: data.tables.items, weightG: i.weightG ?? null, now: i.updatedAt });
      });
      for (const [n, i] of items.entries()) {
        const old = data.tables.items[n];
        expect([i.role ?? null, !!i.always, i.defaultBag ?? null, i.sets ?? []]).toEqual([old.role ?? null, !!old.always, old.defaultBag ?? null, old.sets ?? []]);
      }
      expect(lists(data, items)).toEqual(all[f]);
    });
  }

  it('11a really changes something on the pf fixture (else the exception proves nothing)', () => {
    const f = 'pf-fixture.json';
    const changed = Object.keys(golden[f]).filter((k) => JSON.stringify(all[f][k]) !== JSON.stringify(golden[f][k]));
    expect(changed.length).toBeGreaterThan(0);
    expect(changed.every(is11a)).toBe(true);
  });
});

describe('the item dialog buttons write the new fields and the old ones in step', () => {
  const d = (f) => itemDraft({ id: 'X', name: 'test_data_gtp_ X', category: 'tools', defaultBag: 'top', ownership: 'owned', role: null, sets: [], ...f });

  it('reads: Standard = On me, the block Standard, standard pack or "on every trip"; Am Körper = worn; optional is a mark', () => {
    expect(comesOf(d({}))).toEqual({ standard: false, body: false, optional: false });
    expect(comesOf(d({ role: 'standard' }))).toEqual({ standard: true, body: false, optional: false });
    expect(comesOf(d({ always: true }))).toEqual({ standard: true, body: false, optional: false });
    expect(comesOf(d({ sets: ['standard'] }))).toEqual({ standard: true, body: false, optional: false });
    expect(comesOf(d({ role: 'worn' }))).toEqual({ standard: true, body: true, optional: false });
    expect(comesOf(d({ role: 'optional' }))).toEqual({ standard: false, body: false, optional: true });
    expect(comesOf(d({ leaveHome: true }))).toEqual({ standard: false, body: false, optional: true });
    expect(comesOf(d({ role: 'optional', leaveHome: false })).optional).toBe(false);
    // The default bag "On me" alone is not the place Am Körper (the old role "worn" is).
    expect(comesOf(d({ defaultBag: 'body' })).body).toBe(false);
  });

  it('Standard on: the block standard + role standard + always; on Am Körper the role stays worn; off: all three go', () => {
    expect(setStandard(d({}), true)).toEqual({ role: 'standard', always: true, sets: ['standard'] });
    expect(setStandard(d({ role: 'optional' }), true)).toEqual({ role: 'standard', always: true, sets: ['standard'], leaveHome: false });
    expect(setStandard(d({ role: 'worn' }), true)).toEqual({ role: 'worn', always: true, sets: ['standard'] });
    expect(setStandard(d({ sets: ['sleep', 'standard'] }), true).sets).toEqual(['sleep', 'standard']);
    expect(setStandard(d({ role: 'standard', always: true, sets: ['standard', 'sleep'] }), false)).toEqual({ role: '', always: false, sets: ['sleep'] });
    expect(setStandard(d({ always: true }), false)).toEqual({ role: '', always: false, sets: [] });
  });

  it('Am Körper writes role worn and leaves the default bag; a bag again: back to Standard', () => {
    expect(setPlace(d({}), 'body')).toEqual({ role: 'worn' });
    expect(setPlace(d({ role: 'standard', always: true }), 'body')).toEqual({ role: 'worn' });
    expect(setPlace(d({ role: 'optional', leaveHome: true }), 'body')).toEqual({ role: 'worn', leaveHome: false });
    expect(setPlace(d({ role: 'worn' }), 'bag')).toEqual({ role: 'standard', sets: ['standard'] });
    expect(setPlace(d({ role: 'standard' }), 'bag')).toEqual({ role: 'standard' });
    expect(setPlace(d({ role: '' }), 'bag')).toEqual({ role: '' });
    expect(setPlace(d({ role: 'optional' }), 'bag')).toEqual({ role: 'optional' });
    expect('defaultBag' in setPlace(d({}), 'body')).toBe(false);
  });

  it('the mark "stays at home" can be taken back', () => {
    expect(clearOptional(d({ role: 'optional', leaveHome: true }))).toEqual({ role: '', leaveHome: false });
    expect(clearOptional(d({ role: 'standard' }))).toEqual({ role: 'standard', leaveHome: false });
  });

  it('"Leave at home" (Gear, debrief): out of Standard, marked, old fields in step', () => {
    expect(leaveHomeFields(d({ role: 'standard', sets: ['standard', 'sleep'] }))).toEqual({ role: 'optional', leaveHome: true, sets: ['sleep'] });
    expect(leaveHomeFields(d({ always: true, sets: ['standard'] }))).toEqual({ role: 'optional', leaveHome: true, sets: [], always: false });
    const after = { ...d({ role: 'standard', always: true, sets: ['standard'] }), ...leaveHomeFields(d({ role: 'standard', always: true, sets: ['standard'] })) };
    expect([inStandard(after), comesOf(after)]).toEqual([false, { standard: false, body: false, optional: true }]);
  });

  it('every write stays readable by an older version: role and always agree with the new fields', () => {
    const steps = [(x) => setStandard(x, true), (x) => setPlace(x, 'body'), (x) => setPlace(x, 'bag'), (x) => setStandard(x, false), (x) => leaveHomeFields(x), (x) => clearOptional(x)];
    let x = d({});
    for (const step of steps) {
      x = { ...x, ...step(x) };
      const old = { ...x, sets: (x.sets ?? []).filter((k) => k !== 'standard'), leaveHome: undefined }; // what 0.32 reads
      expect([comesOf(old).standard, comesOf(old).body]).toEqual([comesOf(x).standard, comesOf(x).body]);
    }
  });
});
