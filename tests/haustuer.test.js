// Paket W «Von der Haustür bis zurück» (Noah 20.10.2026 «1a 2a 3a 4a»): plan B, check-in, «Gut angekommen», «Velo abgestellt».
// Fictional data only.
import { describe, it, expect, afterEach } from 'vitest';
import { t, lang } from '../src/lib/i18n.svelte.js';
import DE from '../src/lib/i18n/de/index.js';
import { DEVICE_SETTINGS } from '../src/lib/db.js';
import { stage } from '../src/lib/ride.js';
import {
  PARKED_KEY, PLANB_KINDS, planBOf, badWeather, hoursOfDay, badText, swapPlanB, staysOf, setStay, checkinOf, nightsOf,
  arrivedPeople, toggleArrived, joinNames, arrivedText, smsHref, arrivePlace, lockItems, parkedOf, agoOf, planBTomorrow, mapsAt,
  nightText, morningText, morningDue,
} from '../src/lib/haustuer/haustuer.js';

afterEach(() => (lang.v = 'en'));

const route = (km) => ({ name: 'test_data_gtp_ Schlaufe', km, gainM: 300, line: [[47, 7], [47.1, 7.1]], start: { lat: 47, lon: 7 }, end: { lat: 47.1, lon: 7.1 } });
const hour = (h, rainMm = 0, rainPct = 0, gust = 10) => ({ t: `2026-10-24T${String(h).padStart(2, '0')}:00`, h, rainMm, rainPct, gust });

describe('plan B', () => {
  it('is null until something is set, a train needs nothing more', () => {
    expect(planBOf({})).toBe(null);
    expect(planBOf({ planB: { kind: 'short', note: ' ' } })).toBe(null);
    expect(planBOf({ planB: { kind: 'train' } })).toEqual({ kind: 'train', note: '', route: null });
    expect(planBOf({ planB: { kind: 'short', route: route(40) } }).route.km).toBe(40);
    expect(planBOf({ planB: { kind: 'odd', note: 'test_data_gtp_ Notiz' } }).kind).toBe('short');
    expect(PLANB_KINDS.map((k) => k.key)).toEqual(['short', 'train']);
  });

  it('bad weather: heavy rain or a storm, not a few showers', () => {
    expect(badWeather([])).toBe(null);
    expect(badWeather([hour(8, 0.6, 40), hour(9, 0.4, 40)])).toBe(null);
    expect(badWeather([hour(8, 2.5)])).toMatchObject({ rain: true, storm: false, mm: 2.5 });
    expect(badWeather(Array.from({ length: 9 }, (_, i) => hour(8 + i, 1)))).toMatchObject({ rain: true, mm: 9 });
    expect(badWeather([hour(8, 0, 80), hour(9, 0, 75), hour(10, 0, 90)])?.rain).toBe(true);
    expect(badWeather([hour(8, 0, 0, 65)])).toMatchObject({ rain: false, storm: true, gust: 65 });
  });

  it('reads the hours of one day from a saved forecast', () => {
    const saved = { places: [{ hours: [hour(8), { ...hour(9), t: '2026-10-25T09:00' }] }, { hours: [hour(10)] }] };
    expect(hoursOfDay(saved, '2026-10-24').length).toBe(2);
    expect(hoursOfDay(null, '2026-10-24')).toEqual([]);
  });

  it('says it in German', () => {
    lang.v = 'de';
    expect(badText({ rain: true, storm: true, mm: 14, gust: 70 }, t)).toBe('Starkregen (14 mm) · Sturm (Böen bis 70 km/h)');
  });

  it('swaps the routes and back', () => {
    const trip = { route: route(110), planB: { kind: 'short', note: '', route: route(60) } };
    const a = swapPlanB(trip);
    expect(a.route.km).toBe(60);
    expect(a.planB).toMatchObject({ on: true, route: { km: 110 } });
    const b = swapPlanB({ ...trip, ...a });
    expect(b.route.km).toBe(110);
    expect(b.planB.on).toBe(false);
    expect(swapPlanB({ planB: { kind: 'train' } })).toBe(null);
  });
});

describe('check-in', () => {
  it('keeps the stays safe and drops an empty one', () => {
    expect(staysOf({ stays: [{ n: 0, until: '25:00', name: 'test_data_gtp_ Hotel' }, { n: -1 }, null] })).toEqual([{ n: 0, name: 'test_data_gtp_ Hotel', until: '', phone: '' }]);
    const list = setStay([], 1, { until: '20:00' });
    expect(list).toEqual([{ n: 1, name: '', until: '20:00', phone: '' }]);
    expect(setStay(list, 1, { until: '' })).toEqual([]);
    expect(nightsOf(3)).toBe(2);
    expect(nightsOf(1)).toBe(0);
  });

  it('warns when the planned arrival is after the check-in and gives the speed needed (race cut-off calculator)', () => {
    const trip = { startDate: '2026-10-24', days: 2, route: route(120), rideStart: { 0: '08:00' } };
    const st = stage(trip, 0);
    expect(st.km).toBe(60);
    const early = checkinOf({ until: '23:00' }, st);
    expect(early.late).toBe(false);
    const late = checkinOf({ until: '10:00' }, st);
    expect(late.late).toBe(true);
    expect(late.lateMin).toBeGreaterThan(0);
    // 60 km between 08:00 and 10:00: 30 km/h
    expect(late.needKmh).toBe(30);
    expect(late.planKmh).toBeGreaterThan(0);
    expect(checkinOf({ until: '' }, st)).toBe(null);
  });
});

describe('«Gut angekommen»', () => {
  const contacts = [{ id: 'a', name: 'test_data_gtp_Anna Muster', phone: '+41 79 000 00 01' }, { id: 'b', name: 'test_data_gtp_Ben', phone: '079 000 00 02' }];
  it('picks the people of the trip', () => {
    expect(arrivedPeople({ arrivedTo: ['b'] }, contacts).map((c) => c.id)).toEqual(['b']);
    expect(toggleArrived({ arrivedTo: ['b'] }, 'a')).toEqual(['b', 'a']);
    expect(toggleArrived({ arrivedTo: ['b'] }, 'b')).toEqual([]);
  });

  it('writes the ready text in German, first names only, with the place and a map link', () => {
    lang.v = 'de';
    expect(joinNames(['Anna Muster', 'Ben', 'Cem'], 'und')).toBe('Anna, Ben und Cem');
    const text = arrivedText({ t, names: ['Anna Muster', 'Ben'], place: 'Saignelégier', time: '18:10', here: { lat: 47.25, lon: 7.0 } });
    expect(text).toBe('Hallo Anna und Ben, ich bin gut in Saignelégier angekommen, um 18:10.\nHier bin ich: https://www.google.com/maps/search/?api=1&query=47.25000,7.00000');
    expect(arrivedText({ t, time: '18:10' })).toBe('ich bin gut angekommen, um 18:10.');
  });

  it('builds the SMS link and the place of the night', () => {
    expect(smsHref(['+41 79 000 00 01', '079 000 00 02'], 'a b')).toBe('sms:+41790000001,0790000002?body=a%20b');
    expect(arrivePlace({ stages: { days: [{ name: ' test_data_gtp_Dorf ' }] } }, 0)).toBe('test_data_gtp_Dorf');
    expect(arrivePlace({}, 0)).toBe('');
  });
});

describe('«Velo abgestellt»', () => {
  it('stays on this device only', () => {
    expect(DEVICE_SETTINGS).toContain(PARKED_KEY);
  });

  it('finds the locks in the gear', () => {
    const items = [
      { id: '1', name: 'Folding lock', nameDe: 'Faltschloss' },
      { id: '2', name: 'Tent' },
      { id: '3', name: 'Lockring tool' },
      { id: '4', name: 'Kabelschloss', archived: true },
      { id: '5', name: 'Cable', nameDe: 'Kabelschloss' },
    ];
    expect(lockItems(items).map((i) => i.id)).toEqual(['5', '1']);
  });

  it('reads the record safely and says how long ago', () => {
    expect(parkedOf(null)).toBe(null);
    const p = parkedOf({ at: '2026-10-24T10:00:00Z', lat: 47, lon: 8, photo: 'javascript:x' });
    expect(p.here).toEqual({ lat: 47, lon: 8, acc: null });
    expect(p.photo).toBe('');
    const now = new Date('2026-10-24T12:30:00Z').getTime();
    expect(agoOf('2026-10-24T12:00:00Z', now)).toEqual({ n: 30, unit: 'min' });
    expect(agoOf('2026-10-24T09:30:00Z', now)).toEqual({ n: 3, unit: 'h' });
    expect(agoOf('2026-10-21T12:30:00Z', now)).toEqual({ n: 3, unit: 'd' });
    expect(mapsAt({ lat: 47, lon: 8 })).toContain('query=47.00000,8.00000');
  });
});

describe('the evening window', () => {
  const trip = { id: 't1', title: 'test_data_gtp_Tour', startDate: '2026-10-24', days: 3, planB: { kind: 'train' } };
  it('from 17:00 the evening before any day of a trip with a plan B', () => {
    expect(planBTomorrow([trip], '2026-10-23T16:59')).toBe(null);
    expect(planBTomorrow([trip], '2026-10-23T17:00')).toMatchObject({ day: 0, date: '2026-10-24' });
    expect(planBTomorrow([trip], '2026-10-25T20:00')).toMatchObject({ day: 2, date: '2026-10-26' });
    expect(planBTomorrow([trip], '2026-10-26T20:00')).toBe(null);
    expect(planBTomorrow([{ ...trip, planB: null }], '2026-10-23T18:00')).toBe(null);
    expect(planBTomorrow([{ ...trip, finished: true }], '2026-10-23T18:00')).toBe(null);
  });
});

describe('German texts', () => {
  it('every text of the package has a German one', async () => {
    const { readFileSync, readdirSync } = await import('node:fs');
    const dir = 'src/lib/haustuer/';
    const src = readdirSync(dir).map((f) => readFileSync(dir + f, 'utf8')).join('\n');
    const keys = [...src.matchAll(/\bt\('([^']+)'/g)].map((m) => m[1]);
    for (const m of src.matchAll(/\btn\([^,]+, '([^']+)', '([^']+)'/g)) keys.push(m[1], m[2]);
    for (const k of PLANB_KINDS) keys.push(k.name, k.sub);
    expect(keys.length).toBeGreaterThan(60);
    expect([...new Set(keys)].filter((k) => !(k in DE))).toEqual([]);
  });
});

describe('Gute Nacht (1145, Noah «3a»)', () => {
  it('says where you sleep and when to call, in German too', () => {
    const en = nightText({ t, names: ['test_data_gtp_Anna'], place: 'test_data_gtp_ Hotel Post', late: '09:30' });
    expect(en).toBe('Hi test_data_gtp_Anna, I am sleeping in test_data_gtp_ Hotel Post tonight. Good night!\nIf you hear nothing from me by 09:30 tomorrow, please call me.');
    expect(nightText({ t, late: '10:00' })).toMatch(/^I am stopping for the night\. Good night!\n/);
    expect(nightText({ t, here: { lat: 47, lon: 7 } })).toContain('Where I am: ');
    lang.v = 'de';
    expect(nightText({ t, late: '10:00' })).toBe(`${DE['I am stopping for the night. Good night!']}\n${DE['If you hear nothing from me by {time} tomorrow, please call me.'].replace('{time}', '10:00')}`);
  });
  it('the morning text greets the same people', () => {
    expect(morningText({ t, names: ['test_data_gtp_Anna', 'test_data_gtp_Ben'] })).toMatch(/^Hi test_data_gtp_Anna.*test_data_gtp_Ben, Good morning, I am riding on now\.$/);
    expect(morningText({ t })).toBe('Good morning, I am riding on now.');
  });
  it('the morning reminder only after a good-night message yesterday, until the start or the reply', () => {
    const tr = { nightSent: '2026-10-23' };
    expect(morningDue(tr, '2026-10-24', 1, '2026-10-23')).toBe(true);
    expect(morningDue({ nightSent: '2026-10-22' }, '2026-10-24', 1, '2026-10-23')).toBe(false);
    expect(morningDue({ ...tr, morningSent: '2026-10-24' }, '2026-10-24', 1, '2026-10-23')).toBe(false);
    expect(morningDue({ ...tr, rideStart: { 1: '07:10' } }, '2026-10-24', 1, '2026-10-23')).toBe(false);
    expect(morningDue({ ...tr, finished: true }, '2026-10-24', 1, '2026-10-23')).toBe(false);
    expect(morningDue(null, '2026-10-24', 1, '2026-10-23')).toBe(false);
  });
});
