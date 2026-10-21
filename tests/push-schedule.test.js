// Erinnerungen aufs Handy (Web-Push): the list of the next reminders (src/lib/push/schedule.js).
// Fictional data only. Times are compared with atMs (the device's own clock), days on the calendar.
import { describe, it, expect } from 'vitest';
import { buildList, pushOf, anyOn, KINDS, atMs, addDays, watchable } from '../src/lib/push/schedule.js';
import de from '../src/lib/i18n/de/index.js';

const now = new Date(2026, 9, 20, 10, 0); // Tuesday 20 Oct 2026, 10:00 on this device
const allOn = { on: true, kinds: Object.fromEntries(KINDS.map((k) => [k.key, true])) };
const trip = (id, start, extra = {}) => ({ id, title: `Testtour ${id}`, status: 'planned', startDate: start, ...extra });
const base = (over = {}) => ({ trips: [], repairs: [], bikes: [], settings: { push: allOn }, lastBackup: null, now, ...over });
const keys = (l) => l.items.map((i) => i.key);

describe('push switches', () => {
  it('everything is off at the start (2b, 5a)', () => {
    const p = pushOf(undefined);
    expect(p.on).toBe(false);
    expect(Object.values(p.kinds).every((v) => v === false)).toBe(true);
    expect(anyOn(pushOf({ on: true, kinds: {} }))).toBe(false);
    expect(anyOn(pushOf({ on: true, kinds: { eve: true } }))).toBe(true);
    expect(buildList(base({ settings: { push: { on: false, kinds: allOn.kinds } }, trips: [trip('a', '2026-10-23')] })).items).toEqual([]);
  });
  it('a kind switched off sends nothing of its kind', () => {
    const l = buildList(base({ settings: { push: { on: true, kinds: { weather: true } }, homePlace: { lat: 47, lon: 8 } }, trips: [trip('a', '2026-10-23')] }));
    expect(l.items).toEqual([]);
    expect(l.weather).toHaveLength(1);
  });
  it('has German for every switch', () => {
    for (const k of KINDS) {
      expect(de[k.label], k.label).toBeTruthy();
      expect(de[k.hint], k.hint).toBeTruthy();
    }
  });
});

describe('the evening before and the tour-day weather (3a, Eigene Werte 3a 4b)', () => {
  it('the evening before at 19:00, or at the own time; only planned trips in the next 14 days', () => {
    const trips = [trip('a', '2026-10-23'), trip('b', '2026-11-20'), trip('c', '2026-10-22', { status: 'done' }), trip('d', '2026-10-24', { skipped: true })];
    const l = buildList(base({ trips }));
    expect(l.items.filter((i) => i.key.startsWith('eve:'))).toEqual([expect.objectContaining({ key: 'eve:a:2026-10-23', at: atMs('2026-10-22', '19:00'), url: '#/trip/a/packed' })]);
    const own = buildList(base({ trips, settings: { push: allOn, ownValues: { eveRemindAt: 20 * 60 + 30 } } }));
    expect(own.items.find((i) => i.key.startsWith('eve:')).at).toBe(atMs('2026-10-22', '20:30'));
  });
  it('an evening already past is not sent', () => {
    expect(keys(buildList(base({ trips: [trip('a', '2026-10-20')] }))).filter((k) => k.startsWith('eve:'))).toEqual([]);
  });
  it('the weather at 06:30 on the start day, at the route start or else the home place; hot from Eigene Werte', () => {
    const l = buildList(base({ trips: [trip('a', '2026-10-23', { route: { start: { lat: 46.5, lon: 9.8 } } }), trip('b', '2026-10-25')], settings: { push: allOn, homePlace: { name: 'Heimort', lat: 47.1, lon: 8.2 }, ownValues: { hotC: 27 } } }));
    const tours = l.weather.filter((w) => !w.only);
    expect(tours).toEqual([
      expect.objectContaining({ key: 'wx:a:2026-10-23', at: atMs('2026-10-23', '06:30'), date: '2026-10-23', lat: 46.5, lon: 9.8, title: 'Testtour a' }),
      expect.objectContaining({ key: 'wx:b:2026-10-25', lat: 47.1, lon: 8.2 }),
    ]);
    // Glätte (Paket Wetter): with «Ice in the morning» on, the home place each morning, never on a tour day
    const ice = l.weather.filter((w) => w.only);
    expect(ice.every((w) => w.only.join() === 'ice' && w.lat === 47.1)).toBe(true);
    expect(ice.map((w) => w.date)).not.toContain('2026-10-23');
    expect(ice.map((w) => w.date)).not.toContain('2026-10-25');
    expect(l.hotC).toBe(27);
    expect(buildList(base()).hotC).toBe(30);
    expect(l.texts.heat).toContain('{temp}');
  });
  it('no place, no weather check', () => {
    expect(buildList(base({ trips: [trip('a', '2026-10-23')] })).weather).toEqual([]);
  });
});

describe('workshop, backup and Merken', () => {
  it('a workshop job on its due day at 08:00 (late ones today)', () => {
    const repairs = [{ id: 7, bikeId: 'b1', task: 'Bremsbeläge prüfen', status: 'open', dueDate: '2026-10-22' }, { id: 8, task: 'Schon erledigt', status: 'done', dueDate: '2026-10-22' }, { id: 9, task: 'Spät', status: 'open', dueDate: '2026-10-19' }];
    const l = buildList(base({ repairs, bikes: [{ id: 'b1', name: 'Testvelo' }] }));
    const ws = l.items.filter((i) => i.key.startsWith('ws:'));
    expect(ws.map((i) => i.key)).toEqual(['ws:7:2026-10-22']);
    expect(ws[0]).toMatchObject({ at: atMs('2026-10-22', '08:00'), url: '#/bikes?tab=care' });
    expect(ws[0].body).toContain('Testvelo');
  });
  it('the backup when the last one is older than the days set (14, or Eigene Werte)', () => {
    const l = buildList(base({ lastBackup: new Date(2026, 9, 10, 12).toISOString() }));
    expect(l.items.find((i) => i.key.startsWith('backup:'))).toMatchObject({ key: 'backup:2026-10-24', at: atMs('2026-10-24', '19:00') });
    const late = buildList(base({ lastBackup: new Date(2026, 8, 1).toISOString(), settings: { push: allOn, ownValues: { backupDays: 7 } } }));
    expect(late.items.find((i) => i.key.startsWith('backup:')).at).toBe(atMs('2026-10-20', '19:00'));
  });
  it('birthdays the day before and on the day, plants on their day (longer in winter), own to-dos at their time', () => {
    const merken = [
      { id: 'b1', kind: 'birthday', text: 'Mia', bday: { md: '10-25', year: 1990 }, reminds: [{ before: 1, at: '18:00' }, { before: 0, at: '08:00' }], doneAt: null },
      { id: 'b2', kind: 'birthday', text: 'Aus', bday: { md: '10-25' }, reminds: [{ before: 0, at: '08:00' }], off: true },
      { id: 'p1', kind: 'plant', text: 'Basilikum', plant: { every: 2, last: '2026-10-19' }, remind: { at: '08:00', before: 0 } },
      { id: 't1', text: 'Velo putzen', due: '2026-10-23', remind: { at: '17:00', before: 1 }, doneAt: null },
      { id: 't2', text: 'Erledigt', due: '2026-10-23', remind: { at: '17:00', before: 0 }, doneAt: '2026-10-19T10:00:00Z' },
    ];
    const l = buildList(base({ settings: { push: allOn, merken } }));
    expect(l.items.filter((i) => i.key.startsWith('bday:')).map((i) => [i.at, i.body])).toEqual([
      [atMs('2026-10-24', '18:00'), 'Tomorrow is Mia’s birthday.'],
      [atMs('2026-10-25', '08:00'), 'Today is Mia’s birthday.'],
    ]);
    expect(l.items.find((i) => i.key.startsWith('plant:'))).toMatchObject({ at: atMs('2026-10-21', '08:00'), body: 'Basilikum needs water.' });
    expect(l.items.filter((i) => i.key.startsWith('own:'))).toEqual([expect.objectContaining({ at: atMs('2026-10-22', '17:00'), body: 'Velo putzen' })]);
    // winter: watered on 1 December every 7 days → 11 days
    const w = buildList(base({ now: new Date(2026, 11, 2, 9), settings: { push: allOn, merken: [{ id: 'p2', kind: 'plant', text: 'Farn', plant: { every: 7, last: '2026-12-01' }, remind: { at: '08:00' } }] } }));
    expect(w.items[0].at).toBe(atMs(addDays('2026-12-01', 11), '08:00'));
  });
  it('the list is in time order and reaches 14 days ahead at most', () => {
    const l = buildList(base({ trips: [trip('a', '2026-10-26'), trip('b', '2026-10-22')], repairs: [{ id: 1, task: 'x', status: 'open', dueDate: '2026-11-30' }] }));
    const ats = l.items.map((i) => i.at);
    expect(ats).toEqual([...ats].sort((a, b) => a - b));
    expect(Math.max(...ats)).toBeLessThanOrEqual(now.getTime() + 14 * 864e5);
  });
});

describe('Wetter-Wecker (Paket G): planned tours from tomorrow up to 10 days ahead', () => {
  it('watches each tour with a place, first look at the next 07:00 or 18:00', () => {
    const trips = [trip('a', '2026-10-24', { days: 2, route: { start: { lat: 46.5, lon: 9.8 } } }), trip('b', '2026-10-20'), trip('c', '2026-10-31'), trip('d', '2026-10-22')];
    const l = buildList(base({ trips, settings: { push: { on: true, kinds: { wxwatch: true } }, homePlace: { lat: 47.1, lon: 8.2 } } }));
    expect(l.watch).toEqual([
      expect.objectContaining({ key: 'ww:a:2026-10-24', at: atMs('2026-10-20', '18:00'), date: '2026-10-24', days: 2, lat: 46.5, lon: 9.8 }),
      expect.objectContaining({ key: 'ww:d:2026-10-22', days: 1, lat: 47.1, lon: 8.2 }),
    ]);
    expect(l.texts.turn).toContain('{trip}');
    expect(l.texts.better).toContain('{day}');
    expect(l.texts.wdays).toHaveLength(7);
  });
  it('a single tour can be switched off (everything is a suggestion)', () => {
    const trips = [trip('a', '2026-10-24'), trip('b', '2026-10-25')];
    const l = buildList(base({ trips, settings: { push: { on: true, kinds: { wxwatch: true }, wxOff: ['a'] }, homePlace: { lat: 47, lon: 8 } } }));
    expect(l.watch.map((w) => w.key)).toEqual(['ww:b:2026-10-25']);
    expect(pushOf({ on: true, wxOff: ['a', 3] }).wxOff).toEqual(['a']);
    expect(watchable([...trips, trip('c', '2026-10-20'), trip('d', '2026-11-20')], '2026-10-20').map((x) => x.id)).toEqual(['a', 'b']);
  });
  it('switched off: no watch', () => {
    const l = buildList(base({ trips: [trip('a', '2026-10-24')], settings: { push: { on: true, kinds: { weather: true } }, homePlace: { lat: 47, lon: 8 } } }));
    expect(l.watch).toEqual([]);
  });
});

describe('Paket VG 1128: chain after rain', () => {
  const ride = (bikeId, km, spot = null) => ({ bikeId, km, kind: 'ride', state: 'counted', date: '2026-10-20', spot });
  const bikes = [{ id: 'b1', name: 'Test-Velo' }, { id: 'b2', name: 'Test-Gravel' }];
  const rain = { days: { '2026-10-20': 6 }, spots: { '47.1,8.1': { days: {} } } };
  it('at 19:00 on a day with a wet ride, for the bike with the most wet km', () => {
    const l = buildList(base({ bikes, kmBook: [ride('b1', 20), ride('b2', 45), ride('b1', 60, '47.1,8.1')], rain }));
    const w = l.items.filter((i) => i.key.startsWith('wetchain:'));
    expect(w.map((i) => i.key)).toEqual(['wetchain:b2:2026-10-20']);
    expect(w[0].at).toBe(atMs('2026-10-20', '19:00'));
    expect(w[0].body).toContain('Test-Gravel');
  });
  it('dry day, the app switch off or the push kind off: nothing', () => {
    const has = (over) => keys(buildList(base({ bikes, kmBook: [ride('b1', 20)], ...over }))).some((k) => k.startsWith('wetchain:'));
    expect(has({ rain })).toBe(true);
    expect(has({ rain: { days: {} } })).toBe(false);
    expect(has({ rain, griff: { wetChain: false } })).toBe(false);
    expect(has({ rain, settings: { push: { on: true, kinds: { ...allOn.kinds, wetchain: false } } } })).toBe(false);
  });
});
