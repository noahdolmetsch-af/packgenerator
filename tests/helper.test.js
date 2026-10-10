// v0.77.0 «KI-Helfer» (Noah's answers 1–8 ★a): the app side. What goes to Claude (the field
// allowlist), the Helfer-Code never in a backup, the question rule of the search, the daily refresh
// of the maintenance suggestions, and what the app does with the answers. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { buildBackup, restoreBackup, DEVICE_SETTINGS } from '../src/lib/backup.js';
import { FIELDS, keysOf, tripPayload, searchPayload, debriefPayload, checklistPayload, maintenancePayload, bikeRides } from '../src/lib/helper/payload.js';
import { endsAsQuestion, looksLikeQuestion, conditionChips, addHelperItems, helperLearning, careHash, careRefresh, careRows, careTask, hashOf } from '../src/lib/helper/logic.js';
import { settingsOf, pausedBy, nextMonthStart } from '../src/lib/helper/client.svelte.js';

/* ---------- fictional records that carry everything the helper must NOT see ---------- */
const SECRET = 'test-helfer-code-0000000000000000';
const PHOTO = 'data:image/jpeg;base64,AAAA';
const item = (id, name, extra = {}) => ({
  id, name, nameDe: `${name} DE`, brand: 'Demo', model: 'X', category: 'clothing', weightG: 120, qty: 1, ownership: 'owned', domains: ['bikepacking'], sets: ['warm'],
  tempMin: 0, tempMax: 10, photo: PHOTO, priceChf: 89.5, note: 'gekauft bei Velo Muster AG', receipt: PHOTO, ...extra,
});
const items = [item('IT1', 'Daunenjacke grau'), item('IT2', 'Stirnlampe Murmeli', { category: 'elec', tempMin: undefined, tempMax: undefined }), item('IT3', 'Alte Jacke', { ownership: 'gone' }), item('IT4', 'Wunsch', { ownership: 'wishlist' })];
const bike = {
  id: 'bike-demo', name: 'Demo Gravel', type: 'gravel', km: 12800, kmDate: '2026-10-06', weightG: 9800, photo: PHOTO,
  parts: [
    { key: 'chain', model: 'Kette 12-fach', history: [{ date: '2026-03-01', km: 9950, action: 'replace', result: 'done', by: 'shop', chf: 49, shop: 'Velo Muster AG', note: 'Rechnung R-1' }, { date: '2026-08-19', km: 12500, action: 'check', value: 0.4, result: 'ok', by: 'self' }] },
    { key: 'padsF', model: '', history: [{ date: '2026-05-02', km: 10900, action: 'replace', by: 'self', chf: 30 }] },
    { key: 'grips', model: '', history: [] },
  ],
};
const trips = [
  { id: 'trip-a', title: 'Jura-Biwak', bikeId: 'bike-demo', startDate: '2026-09-25', days: 3, overnight: 'outdoor', wx: { min: 5, max: 12, rain: 'rain' }, route: { km: 186, gainM: 2900, line: [[47, 7]] }, photo: PHOTO, entries: [{ itemId: 'IT1', slot: 'seat', qty: 1 }] },
  { id: 'trip-b', title: 'Feierabend', bikeId: 'bike-demo', startDate: '2026-02-01', days: 1, wx: { min: 2, max: 6, rain: 'none' }, route: { km: 40 } },
];
const rides = [{ id: 'r1', tripId: 'trip-a', km: 190, gainM: 3000, date: '2026-09-25', line: [[1, 2]], file: 'x.gpx' }];
const notes = [{ id: 7, bikeId: 'bike-demo', text: 'Bremse vorne quietscht', at: '2026-10-02T08:00:00Z', photo: PHOTO }, { id: 8, bikeId: 'other', text: 'anderes Velo', at: '2026-10-02T08:00:00Z' }];
const tasks = [{ id: 3, bikeId: 'bike-demo', task: 'Schaltung einstellen', status: 'open', logDate: '2026-10-01', photo: PHOTO, by: 'Velo Muster AG' }];
const learnings = [{ id: 1, rule: 'Unter 8 °C die warmen Handschuhe', action: '', source: 'Jura' }];

const FORBIDDEN_TEXT = [SECRET, PHOTO, 'Velo Muster AG', 'R-1', '89.5', 'priceChf', 'receipt', 'photo', 'chf', 'shop'];
function allowed(payload) {
  const keys = [...keysOf(payload)];
  expect(keys.filter((k) => !FIELDS.has(k)), 'keys outside the allowlist').toEqual([]);
  const text = JSON.stringify(payload);
  for (const bad of FORBIDDEN_TEXT) expect(text.includes(bad), `"${bad}" must not go to Claude`).toBe(false);
}

describe('what goes to Claude (answer 8a: only what each task needs)', () => {
  it('trip: question, areas, bikes, blocks, own gear (no wishlist, no gone items), learnings', () => {
    const p = tripPayload('3 Tage Jura, 5 °C, Biwak', { items, bikes: [bike], sets: [{ key: 'warm', label: 'Kälte' }], areas: [{ key: 'bikepacking', name: 'Bikepacking' }], learnings, today: '2026-10-10', lang: 'de' });
    allowed(p);
    expect(p.items.map((i) => i.id)).toEqual(['IT1', 'IT2']);
    expect(p.items[0]).toEqual({ id: 'IT1', name: 'Daunenjacke grau DE', category: 'clothing', weightG: 120, tempMin: 0, tempMax: 10, blocks: ['warm'] });
    expect(p.bikes).toEqual([{ id: 'bike-demo', name: 'Demo Gravel' }]);
  });
  it('search: the question and the own gear (name, category, weight)', () => {
    const p = searchPayload('Was nehme ich für 2 Tage Regen mit?', { items, lang: 'en' });
    allowed(p);
    expect(p.items[0]).toEqual({ id: 'IT1', name: 'Daunenjacke grau', category: 'clothing', weightG: 120, tempMin: 0, tempMax: 10 });
  });
  it('debrief: the trip, the notes on the way, unused / broken / missing names, learnings', () => {
    const p = debriefPayload(trips[0], { notes: [{ key: 'ride:7', day: 0, at: '2026-09-25T21:40:00', text: 'Finger kalt beim Kochen', photo: PHOTO }], debrief: { items: { IT1: 'unused', IT2: 'broken' }, missing: [{ id: 'm1', name: 'Winterhandschuhe' }] }, items, learnings, lang: 'de' });
    allowed(p);
    expect(p.trip).toEqual({ title: 'Jura-Biwak', area: 'bikepacking', start: '2026-09-25', days: 3, overnight: 'outdoor', tempMin: 5, tempMax: 12, rain: 'rain', km: 186 });
    expect(p.notes).toEqual([{ key: 'ride:7', day: 1, time: '21:40', text: 'Finger kalt beim Kochen' }]);
    expect([p.unused, p.broken, p.missing]).toEqual([['Daunenjacke grau DE'], ['Stirnlampe Murmeli DE'], ['Winterhandschuhe']]);
  });
  it('checklist: the list with amounts, the own gear not on it, unused before', () => {
    const p = checklistPayload(trips[0], { items, learnings, unusedBefore: { IT1: 2, IT9: 1 }, lang: 'de' });
    allowed(p);
    expect(p.list.map((i) => [i.id, i.qty])).toEqual([['IT1', 1]]);
    expect(p.own.map((i) => i.id)).toEqual(['IT2']);
    expect(p.unusedBefore).toEqual([{ id: 'IT1', times: 2 }]);
  });
  it('maintenance: parts with km, intervals and dates, wet km and climbing since; never money, shops or who', () => {
    const p = maintenancePayload(bike, { tasks, notes, trips, rides, checks: [{ bikeId: 'bike-demo', key: 'padsF', date: '2026-10-08', km: 12780, status: 'check' }], today: '2026-10-10', lang: 'de' });
    allowed(p);
    const chain = p.parts.find((x) => x.key === 'chain');
    expect(chain).toMatchObject({ key: 'chain', name: 'Chain', model: 'Kette 12-fach', kmSinceReplace: 2850, lastReplace: { date: '2026-03-01', km: 9950 }, lastMeasure: { date: '2026-08-19', km: 12500, value: 0.4 }, wetKmSinceReplace: 190, gainMSinceReplace: 3000 });
    expect(chain.interval).toMatchObject({ everyKm: 150, warnAt: 0.4, limit: 0.5, unit: '%' });
    expect(p.parts.some((x) => x.key === 'grips')).toBe(false); // nothing to say about it
    expect(p.notes.map((x) => x.text)).toEqual(['Schaltung einstellen', 'Bremse vorne quietscht']);
    expect(p.rides).toEqual({ since: '2025-10-10', count: 2, km: 230, gainM: 3000, wetKm: 190 });
    expect(p.checks).toEqual([{ key: 'padsF', date: '2026-10-08', km: 12780, status: 'check' }]);
  });
  it('the rides of a bike come from its trips (uploaded ride first, else the route)', () => {
    expect(bikeRides(bike, { trips, rides })).toEqual([{ date: '2026-02-01', km: 40, gainM: null, wet: false }, { date: '2026-09-25', km: 190, gainM: 3000, wet: true }]);
  });
});

describe('the Helfer-Code stays on this device (answer 8a)', () => {
  let db;
  let n = 0;
  beforeEach(() => (db = createDb(`helper-${++n}`)));
  it('is never in a backup or an export, and a restore keeps the device its own', async () => {
    expect(DEVICE_SETTINGS).toContain('helper');
    await db.settings.bulkPut([{ key: 'helper', value: { code: SECRET, on: true, capChf: 5 } }, { key: 'riderWeightG', value: 64000 }]);
    const file = await buildBackup(db);
    expect(JSON.stringify(file)).not.toContain(SECRET);
    expect(file.tables.settings.map((s) => s.key)).toEqual(['riderWeightG']);
    await restoreBackup(db, { app: 'pack-generator', schemaVersion: 1, tables: { settings: [{ key: 'helper', value: { code: 'other' } }] } }, 'replace');
    expect((await db.settings.get('helper')).value.code).toBe(SECRET);
  });
});

describe('settings and the monthly limit (answer 7a)', () => {
  it('defaults: no code, on, CHF 5', () => {
    expect(settingsOf(undefined)).toEqual({ code: '', on: true, capChf: 5 });
    expect(settingsOf({ code: 'x', on: false, capChf: '3.5' })).toEqual({ code: 'x', on: false, capChf: 3.5 });
  });
  it('pauses from the lower of the two limits, this month only', () => {
    const s = settingsOf({ code: 'x', capChf: 2 });
    expect(pausedBy(s, { month: '2026-10', chf: 1.99, cap: 5 }, '2026-10')).toBe(false);
    expect(pausedBy(s, { month: '2026-10', chf: 2, cap: 5 }, '2026-10')).toBe(true);
    expect(pausedBy(settingsOf({ code: 'x', capChf: 9 }), { month: '2026-10', chf: 5.01, cap: 5 }, '2026-10')).toBe(true);
    expect(pausedBy(s, { month: '2026-09', chf: 9, cap: 5 }, '2026-10')).toBe(false);
    expect(pausedBy(s, { month: '2026-10', chf: 0.1, cap: 5, capped: true }, '2026-10')).toBe(true);
  });
  it('says when it starts again (calendar months, December → January)', () => {
    expect(nextMonthStart('2026-10-10', 'de-CH')).toMatch(/^1\. Nov/);
    expect(nextMonthStart('2026-12-31', 'de-CH')).toMatch(/^1\. Jan/);
  });
});

describe('2 Suche: only a question gets an answer', () => {
  it('a text ending with «?» (not every keystroke: a word alone is no question)', () => {
    expect(endsAsQuestion('Was nehme ich für 2 Tage Regen mit?')).toBe(true);
    expect(endsAsQuestion('Was nehme ich')).toBe(false);
    expect(endsAsQuestion('Kette?')).toBe(false);
  });
  it('on Enter: a text that starts like a question', () => {
    expect(looksLikeQuestion('Was nehme ich für Regen mit')).toBe(true);
    expect(looksLikeQuestion('what should I take for rain')).toBe(true);
    expect(looksLikeQuestion('Regenjacke gelb')).toBe(false);
    expect(looksLikeQuestion('wiegen')).toBe(false);
  });
});

describe('1 Neue Tour: chips and extra items', () => {
  const c = { area: 'bikepacking', bikeId: 'bike-demo', days: 3, overnight: 'outdoor', cook: true, tempMin: 5, tempMax: null, rain: '' };
  it('one chip per understood condition, dropped ones stay out', () => {
    expect(conditionChips(c).map((x) => x.key)).toEqual(['area', 'days', 'overnight', 'temp', 'bike']);
    expect(conditionChips(c).find((x) => x.key === 'temp').value).toEqual([5, 5]);
    expect(conditionChips(c, { dropped: new Set(['bike', 'days']) }).map((x) => x.key)).toEqual(['area', 'overnight', 'temp']);
  });
  it('extra items go into their place once, only owned ones, marked as from the helper', () => {
    const trip = { entries: [{ itemId: 'IT1', slot: 'seat', qty: 1 }] };
    const out = addHelperItems(trip, items, ['IT1', 'IT2', 'IT3', 'IT4', 'NOPE', 'IT2'], () => 'frame');
    expect(out.entries.slice(1)).toEqual([{ itemId: 'IT2', slot: 'frame', qty: 1, packed: false, src: 'helper' }]);
    expect(addHelperItems(trip, items, [], () => 'x')).toBe(trip);
  });
});

describe('3 Rückblick: a learning like the app saves its own', () => {
  it('number id after the highest, topic Debrief, the trip as source', () => {
    const l = helperLearning({ rule: 'Bei 5 °C waren die Handschuhe zu dünn', action: 'unter 8 °C die Winterhandschuhe' }, trips[0], [{ id: 4 }, { id: 'x' }], '2026-10-10T10:00:00.000Z');
    expect(l).toEqual({ id: 5, topic: 'Debrief', rule: 'Bei 5 °C waren die Handschuhe zu dünn', action: 'unter 8 °C die Winterhandschuhe', itemIds: [], source: 'Jura-Biwak', appliesTo: ['all'], priority: 'medium', confirmed: 0, createdAt: '2026-10-10T10:00:00.000Z', from: 'helper' });
  });
});

describe('5 + 6 Wartung: once a day per bike, after new km or a new ride', () => {
  const base = maintenancePayload(bike, { trips, rides, today: '2026-10-10' });
  it('the hash ignores the day and the checks done here, not the km', () => {
    expect(careHash({ ...base, today: '2026-10-11', checks: [{ key: 'x' }] })).toBe(careHash(base));
    expect(careHash(maintenancePayload({ ...bike, km: 12900 }, { trips, rides, today: '2026-10-10' }))).not.toBe(careHash(base));
    expect(hashOf({ a: 1 })).toBe(hashOf({ a: 1 }));
  });
  it('fresh with the same data, stale (no second ask) the same day, ask on a later day', () => {
    const cache = { hash: 'h1', day: '2026-10-10', result: { parts: [] } };
    expect(careRefresh(cache, 'h1', '2026-10-12')).toBe('fresh');
    expect(careRefresh(cache, 'h2', '2026-10-10')).toBe('stale');
    expect(careRefresh(cache, 'h2', '2026-10-11')).toBe('ask');
    expect(careRefresh(null, 'h1', '2026-10-10')).toBe('ask');
  });
  it('«Jetzt fällig» shows soon and check, never ok; done and × hide a row for the same data', () => {
    const result = { parts: [{ key: 'cassette', status: 'ok' }, { key: 'padsF', status: 'check' }, { key: 'chain', status: 'soon' }, { key: 'tyres', status: 'check' }] };
    expect(careRows(result, { bikeId: 'b', hash: 'h' }).map((r) => r.key)).toEqual(['chain', 'padsF', 'tyres']);
    const done = [{ bikeId: 'b', key: 'chain', hash: 'h' }];
    const dismissed = [{ bikeId: 'b', key: 'tyres', hash: 'h' }, { bikeId: 'b', key: 'padsF', hash: 'old' }];
    expect(careRows(result, { bikeId: 'b', hash: 'h', done, dismissed }).map((r) => r.key)).toEqual(['padsF']);
  });
  it('«Als Aufgabe merken» makes an open bike task', () => {
    const task = careTask({ key: 'chain', status: 'soon', reason: '2850 km seit Wechsel', check: 'Verschleiss messen (Lehre 0.5)' }, bike, 'Kette', [{ id: 9 }], '2026-10-10');
    expect(task).toMatchObject({ id: 10, bikeId: 'bike-demo', subject: 'Demo Gravel', task: 'Kette: Verschleiss messen (Lehre 0.5)', status: 'open', source: 'Helper', logDate: '2026-10-10', note: '2850 km seit Wechsel' });
  });
});
