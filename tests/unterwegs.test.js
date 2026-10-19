// Paket K «Unterwegs» (Noah 19.10.2026): the pure parts of the helpers on On the way. Fictional data only.
import { describe, it, expect } from 'vitest';
import { stationsUrl, connectionsUrl, nearestStation, parseConnections, durationMin, minText, mapsHomeUrl, trainsHome } from '../src/lib/unterwegs/heimweg.js';
import { eatOf, startEat, nextEat, eaten, snooze, isDue, minutesLeft, eatPushItems, MAX_PUSH } from '../src/lib/unterwegs/essen.js';
import { tilesOf, toggleTile, moveTile, tileValues, addFix, DEFAULT_TILES, MAX_TILES } from '../src/lib/unterwegs/lenker.js';
import { waterFood, hotDay } from '../src/lib/unterwegs/wasser.js';
import { readiness, kmByDay, tipsOf, addTip, renameTip, dropTip, tipsFor } from '../src/lib/unterwegs/bereit.js';
import { sunAt, daylight, moon, PHASES } from '../src/lib/unterwegs/himmel.js';
import { askPoints, wikiUrl, parseWiki, loadPlaces } from '../src/lib/unterwegs/orte.js';
import { sheetDocs, contactsOf, addContact, editContact, dropContact, routePath, telHref, EMERGENCY } from '../src/lib/unterwegs/abfahrt.js';
import { autoGlove, autoToday, gloveOn, modeOf } from '../src/lib/unterwegs/handschuh.js';
import { pdfText } from '../src/lib/unterwegs/abfahrtpdf.js';
import { buildList, KINDS } from '../src/lib/push/schedule.js';
import { FEATURES } from '../src/lib/features.js';
import { HANDBOOK } from '../src/lib/handbook.js';
import { HOWTO } from '../src/lib/know/howto.js';
import DE from '../src/lib/i18n/de/index.js';

const HOME = { name: 'Musterdorf', lat: 47.4, lon: 8.6 };
const HERE = { lat: 47.123456, lon: 7.654321 };

describe('Nach Hause (#94, #97)', () => {
  it('asks transport.opendata.ch with latitude as x and longitude as y', () => {
    expect(stationsUrl(HERE)).toBe('https://transport.opendata.ch/v1/locations?x=47.12346&y=7.65432&type=station');
    expect(connectionsUrl('8500010', 'Bern', 3)).toContain('from=8500010&to=Bern&limit=3');
  });
  it('reads the nearest station and the connections', () => {
    expect(nearestStation({ stations: [{ id: null, name: '' }, { id: 8500010, name: 'Basel SBB', distance: 812.4 }] })).toEqual({ id: '8500010', name: 'Basel SBB', m: 812 });
    expect(nearestStation({})).toBe(null);
    const list = parseConnections({
      connections: [
        { from: { departure: '2026-10-19T17:04:00+0200', platform: '7', delay: 2, station: { name: 'A' } }, to: { arrival: '2026-10-19T18:27:00+0200', station: { name: 'B' } }, duration: '00d01:23:00', transfers: 1, sections: [{ journey: { category: 'IC', number: '5' } }, { walk: {} }, { journey: { category: 'S', number: '3' } }] },
        { from: {}, to: {} },
      ],
    });
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ depTime: '17:04', arrTime: '18:27', platform: '7', delay: 2, transfers: 1, min: 83, lines: ['IC 5', 'S 3'] });
    expect(durationMin('01d00:05:00')).toBe(1445);
    expect(minText(83)).toBe('1 h 23');
    expect(minText(45)).toBe('45 min');
  });
  it('builds the Maps link for car, bike and public transport', () => {
    const u = new URL(mapsHomeUrl(HERE, HOME, 'bicycling'));
    expect(u.searchParams.get('origin')).toBe('47.12346,7.65432');
    expect(u.searchParams.get('destination')).toBe('47.4,8.6');
    expect(u.searchParams.get('travelmode')).toBe('bicycling');
    expect(new URL(mapsHomeUrl(null, HOME)).searchParams.has('origin')).toBe(false);
  });
  it('finds the trains home, and says when you are already there', async () => {
    const answers = { here: { stations: [{ id: '1', name: 'Dorf A' }] }, home: { stations: [{ id: '2', name: 'Musterdorf' }] } };
    const fake = async (url) => ({ ok: true, json: async () => (url.includes('connections') ? { connections: [{ from: { departure: '2026-10-19T17:04:00+0200' }, to: { arrival: '2026-10-19T18:00:00+0200' }, duration: '00d00:56:00' }] } : url.includes('x=47.4&') ? answers.home : answers.here) });
    const r = await trainsHome(HERE, HOME, fake);
    expect(r.from.name).toBe('Dorf A');
    expect(r.list).toHaveLength(1);
    answers.here = answers.home;
    expect((await trainsHome(HERE, HOME, fake)).same).toBe(true);
    await expect(trainsHome(HERE, null, fake)).rejects.toMatchObject({ code: 'nohome' });
    await expect(trainsHome(HERE, HOME, async () => ({ ok: false }))).rejects.toMatchObject({ code: 'net' });
  });
});

describe('Ess-Erinnerung (#286)', () => {
  const T0 = new Date(2026, 9, 19, 8, 0).getTime();
  const min = 60000;
  it('starts off, rings every interval, «Gegessen» and «In 10 Minuten»', () => {
    expect(eatOf(null)).toBe(null);
    const e = eatOf(startEat({ every: 45, now: T0, until: T0 + 5 * 36e5 }), T0);
    expect(nextEat(e)).toBe(T0 + 45 * min);
    expect(isDue(e, T0 + 44 * min)).toBe(false);
    expect(isDue(e, T0 + 45 * min)).toBe(true);
    expect(minutesLeft(e, T0 + 30 * min)).toBe(15);
    expect(nextEat(eaten(e, T0 + 50 * min))).toBe(T0 + 95 * min);
    expect(nextEat(snooze(e, T0 + 50 * min))).toBe(T0 + 60 * min);
    expect(startEat({ every: 7, now: T0 }).every).toBe(45);
  });
  it('ends at the planned end, at 12 h without one', () => {
    expect(eatOf(startEat({ now: T0 }), T0 + 13 * 36e5)).toBe(null);
    const e = eatOf(startEat({ every: 60, now: T0, until: T0 + 90 * min }), T0);
    expect(nextEat(eaten(e, T0 + 60 * min))).toBe(null);
  });
  it('hands the messages for a closed app to the push list, only with the kind switched on', () => {
    const v = startEat({ every: 30, now: T0, until: T0 + 3 * 36e5 });
    const items = eatPushItems(v, { title: 'T', body: 'B' }, T0 + 1);
    expect(items.map((x) => (x.at - T0) / min)).toEqual([30, 60, 90, 120, 150, 180]);
    expect(eatPushItems(startEat({ every: 30, now: T0 }), { title: '', body: '' }, T0).length).toBeLessThanOrEqual(MAX_PUSH);
    expect(KINDS.some((k) => k.key === 'eat')).toBe(true);
    const base = { trips: [], repairs: [], bikes: [], now: new Date(T0 + 1), settings: { eatRemind: v, push: { on: true, kinds: { eat: false } } } };
    expect(buildList(base).items.filter((x) => x.key.startsWith('eat:'))).toHaveLength(0);
    base.settings.push.kinds.eat = true;
    expect(buildList(base).items.filter((x) => x.key.startsWith('eat:'))).toHaveLength(6);
  });
});

describe('Lenker-Ansicht (#114)', () => {
  it('starts with time, km, metres up and next meal; up to 6, ordered', () => {
    expect(DEFAULT_TILES).toEqual(['clock', 'km', 'up', 'eat']);
    expect(tilesOf(null)).toEqual(DEFAULT_TILES);
    expect(tilesOf({ tiles: ['km', 'km', 'nope', 'temp'] })).toEqual(['km', 'temp']);
    let l = tilesOf(null);
    l = toggleTile(l, 'temp');
    l = toggleTile(l, 'speed');
    expect(l).toHaveLength(MAX_TILES);
    expect(toggleTile(l, 'arrive')).toBe(l);
    expect(toggleTile(['km'], 'km')).toEqual(['km']);
    expect(moveTile(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });
  it('works the numbers out: a guess from the pace, or GPS', () => {
    const now = new Date(2026, 9, 19, 10, 30).getTime();
    const v = tileValues({ now, startAt: '2026-10-19T08:00', km: 80, gainM: 1234.4, kmh: 20, nextEat: now + 12 * 60000, arrive: '12:00' });
    expect(v.clock.value).toBe('10:30');
    expect(v.ride.value).toBe('2:30');
    expect(v.km).toEqual({ value: '50.0', guess: true });
    expect(v.left.value).toBe('30.0');
    expect(v.up.value).toBe('1234');
    expect(v.eat.value).toBe('12');
    expect(v.speed.value).toBe('–');
    const g = tileValues({ now, startAt: '2026-10-19T08:00', km: 80, kmh: 20, gps: { km: 41.26, kmh: 23.4 } });
    expect(g.km).toEqual({ value: '41.3', guess: false });
    expect(g.speed.value).toBe('23');
  });
  it('adds GPS fixes, leaving out jitter and bad fixes', () => {
    const dist = (a, b) => Math.abs(b.lat - a.lat) * 111;
    let tr = addFix(null, { lat: 47, lon: 8, at: 0 }, dist);
    tr = addFix(tr, { lat: 47.0001, lon: 8, at: 1000 }, dist);
    expect(tr.km).toBe(0);
    tr = addFix(tr, { lat: 47.01, lon: 8, at: 180000, acc: 10 }, dist);
    expect(tr.km).toBeCloseTo(1.11, 2);
    expect(addFix(tr, { lat: 48, lon: 8, at: 200000, acc: 500 }, dist)).toBe(tr);
  });
});

describe('Wasser- und Essen-Rechner (#322)', () => {
  it('counts litres, refills, kcal and the food against the packing list', () => {
    const r = waterFood({ days: [{ hours: 6, hot: true }, { hours: 4 }], bottles: 1.5, food: [{ id: 'bar', name: 'Riegel', perHours: 1, qty: 8 }, { id: 'x', name: 'x', perHours: 0 }] });
    expect(r.days[0]).toEqual({ hours: 6, waterL: 4.5, refills: 2, kcal: 1500 });
    expect(r.days[1].waterL).toBe(2);
    expect(r.total).toEqual({ hours: 10, waterL: 6.5, refills: 3, kcal: 2500 });
    expect(r.food).toEqual([{ id: 'bar', name: 'Riegel', need: 10, have: 8, short: 2 }]);
    expect(waterFood({ days: [{ hours: 2 }] }).total.refills).toBe(null);
    expect(hotDay([{ temp: 20 }, { temp: 26 }])).toBe(true);
    expect(hotDay([], 'Hot')).toBe(true);
    expect(hotDay([{ temp: 10 }], 'Hot')).toBe(false);
  });
});

describe('Bereit für heute? (#280) and Hör-Tipp (#206)', () => {
  const today = '2026-10-19';
  const days = (n, f) => Array.from({ length: n }, (_, i) => { const d = new Date(Date.UTC(2026, 9, 19 - n + i)); return { date: d.toISOString().slice(0, 10), ...f(i) }; });
  it('says quietly that there is no data', () => {
    expect(readiness({ today }).level).toBe('none');
  });
  it('is calm with usual values and names the signs otherwise', () => {
    const usual = days(30, () => ({ sleep: { asleepMin: 450 }, hrvMs: 50, restingHr: 52 }));
    expect(readiness({ health: [...usual, { date: today, sleep: { asleepMin: 440 }, hrvMs: 49, restingHr: 53 }], today }).level).toBe('ok');
    const bad = readiness({ health: [...usual, { date: today, sleep: { asleepMin: 310 }, hrvMs: 38, restingHr: 60 }], today });
    expect(bad.level).toBe('short');
    expect(bad.signs.map((s) => s.key)).toEqual(['sleep', 'hrv', 'hr']);
    expect(bad.signs[0].vars.h).toBe('5.2');
  });
  it('counts the last 3 days of riding against the month', () => {
    const km = kmByDay([{ day: '2026-10-18', km: 60 }, { day: '2026-10-17', km: 50 }, { day: '2026-10-01', km: 20 }], [{ date: '2026-10-18', km: 999 }]);
    expect(km['2026-10-18']).toBe(60);
    const r = readiness({ km, today });
    expect(r.level).toBe('easy');
    expect(r.signs[0]).toMatchObject({ key: 'load', vars: { km: 110 } });
    expect(kmByDay([], [{ date: '2026-10-18', km: 12 }])).toEqual({ '2026-10-18': 12 });
  });
  it('keeps listening tips per kind of tour: add, rename, delete', () => {
    let l = tipsOf(null);
    expect(addTip(l, { domain: 'ski', url: 'javascript:alert(1)' })).toBe(null);
    l = addTip(l, { domain: 'ski', name: 'Bergpodcast', url: 'https://example.org/pod' }, 'a');
    l = addTip(l, { domain: 'bikepacking', name: '', url: 'https://example.org/list' }, 'b');
    expect(tipsFor(l, 'ski').map((x) => x.name)).toEqual(['Bergpodcast']);
    expect(tipsFor(l, 'bikepacking')[0].name).toBe('https://example.org/list');
    l = renameTip(l, 'a', 'Gipfelfunk');
    expect(l[0].name).toBe('Gipfelfunk');
    expect(dropTip(l, 'a').map((x) => x.id)).toEqual(['b']);
    expect(tipsOf([{ id: 'z', url: 'ftp://x' }])).toEqual([]);
  });
});

describe('Sonne, Mond und Orte (#99)', () => {
  it('works the sun out like blockplan.js and the dusk after the sunset', () => {
    const d = daylight('2026-06-21', 47.37, 8.54);
    expect(d.dark).toBeGreaterThan(d.set);
    expect(d.dawn).toBeLessThan(d.rise);
    expect(d.dayMin).toBeGreaterThan(15 * 60);
    expect(sunAt('2026-06-21', 80, 0)).toBe(null);
  });
  it('knows the moon: a full moon and a new moon of 2026', () => {
    const full = moon(Date.UTC(2026, 9, 26, 4, 0)); // full moon 26 Oct 2026
    expect(full.phase).toBe('full');
    expect(full.lit).toBeGreaterThan(0.97);
    const nm = moon(Date.UTC(2026, 9, 10, 16, 0)); // new moon 10 Oct 2026
    expect(nm.phase).toBe('new');
    expect(nm.lit).toBeLessThan(0.03);
    expect(Object.keys(PHASES)).toHaveLength(8);
    const next = moon(Date.UTC(2026, 9, 19, 12)).nextFull;
    expect(Math.abs(next - Date.UTC(2026, 9, 26, 4)) / 864e5).toBeLessThan(1);
  });
  it('asks Wikipedia about start, middle and finish only, and keeps each place once', async () => {
    const route = { line: [[47.1, 8.1], [47.2, 8.2], [47.3, 8.3], [47.4, 8.4]] };
    expect(askPoints(route)).toEqual([{ lat: 47.1, lon: 8.1 }, { lat: 47.3, lon: 8.3 }, { lat: 47.4, lon: 8.4 }]);
    expect(askPoints(null, { lat: 47, lon: 8 })).toEqual([{ lat: 47, lon: 8 }]);
    const u = new URL(wikiUrl({ lat: 47.123456, lon: 8.5 }, 'en'));
    expect(u.host).toBe('en.wikipedia.org');
    expect(u.searchParams.get('ggscoord')).toBe('47.1235|8.5000');
    expect(u.searchParams.get('origin')).toBe('*');
    const json = { query: { pages: { 2: { index: 2, title: 'Burg Muster', extract: 'Eine Burg.  Alt.' }, 1: { index: 1, title: 'Musterdorf', extract: 'Ein Dorf.', coordinates: [{ lat: 47, lon: 8 }] }, 3: { index: 3, title: 'Leer', extract: '' } } } };
    expect(parseWiki(json).map((x) => x.title)).toEqual(['Musterdorf', 'Burg Muster']);
    expect(parseWiki(json)[1]).toMatchObject({ text: 'Eine Burg. Alt.', url: 'https://de.wikipedia.org/wiki/Burg_Muster' });
    const res = await loadPlaces(askPoints(route), 'de', async () => ({ ok: true, json: async () => json }), new Date('2026-10-19T10:00:00Z'));
    expect(res.list).toHaveLength(2);
    await expect(loadPlaces([{ lat: 1, lon: 1 }], 'de', async () => { throw new Error('x'); })).rejects.toMatchObject({ code: 'net' });
  });
});

describe('Blatt «Vor der Abfahrt» (#87)', () => {
  it('has the Swiss emergency numbers and your own contacts (add, change, delete)', () => {
    expect(EMERGENCY.map((x) => x.nr)).toEqual(['144', '1414', '117', '118', '112', '145']);
    let c = contactsOf(null);
    expect(addContact(c, { name: '', phone: '1' })).toBe(null);
    c = addContact(c, { name: 'Kim', phone: '+41 79 000 00 00 (Handy)' }, 'k');
    expect(c[0].phone).toBe('+41 79 000 00 00');
    c = editContact(c, 'k', { name: 'Kim M.', phone: '' });
    expect(c[0]).toEqual({ id: 'k', name: 'Kim M.', phone: '+41 79 000 00 00' });
    expect(dropContact(c, 'k')).toEqual([]);
    expect(telHref('+41 79 000')).toBe('tel:+4179000');
  });
  it('takes the papers for the trip from Dokumente', () => {
    const docs = [{ id: 1, name: 'Zugbillett', group: 'Travel' }, { id: 2, name: 'Pass', inPack: true }, { id: 3, name: 'Quittung', group: 'Receipts' }, { id: 4, name: 'Karte', group: '' }];
    expect(sheetDocs(docs, [4]).map((d) => d.id)).toEqual([4, 2, 1]);
  });
  it('draws the route line in a box, north up', () => {
    const p = routePath([[47.0, 8.0], [47.1, 8.0], [47.1, 8.2]], 300, 160, 10);
    expect(p.d.startsWith('M')).toBe(true);
    expect(p.start[1]).toBeGreaterThan(p.end[1]); // the start is further south: lower in the box
    for (const [x, y] of p.points) expect(x >= 0 && x <= 300 && y >= 0 && y <= 160).toBe(true);
    expect(routePath([[47, 8]])).toBe(null);
  });
  it('writes only letters the PDF font knows', () => {
    expect(pdfText('Zürich → Bern · 12 °C – ok 🚲')).toBe('Zürich > Bern · 12 °C – ok -');
  });
});

describe('Handschuh-Modus (#285)', () => {
  it('switches itself on below 5 °C or on a ski tour day, and by hand', () => {
    expect(autoGlove({ temp: 4.9 })).toEqual({ on: true, why: 'cold' });
    expect(autoGlove({ temp: 5 })).toEqual({ on: false, why: null });
    expect(autoGlove({ ski: true, temp: 20 })).toEqual({ on: true, why: 'ski' });
    expect(autoToday(JSON.stringify({ day: '2026-10-19', on: true, why: 'cold' }), '2026-10-19').on).toBe(true);
    expect(autoToday(JSON.stringify({ day: '2026-10-18', on: true }), '2026-10-19').on).toBe(false);
    expect(autoToday('{', '2026-10-19').on).toBe(false);
    expect(gloveOn('auto', { on: true })).toBe(true);
    expect(gloveOn('off', { on: true })).toBe(false);
    expect(gloveOn('on', { on: false })).toBe(true);
    expect(modeOf('nope')).toBe('auto');
  });
});

describe('Paket K in the catalogue', () => {
  const ids = ['f.trainhome', 'f.handlebar', 'f.glove', 'f.eatremind', 'f.departsheet', 'f.komoottour', 'f.convert', 'f.waterfood', 'f.ready', 'f.listentip', 'f.skyplaces'];
  it('has every helper with a handbook entry, «So geht\'s» and German texts', () => {
    for (const id of ids) {
      const f = FEATURES.find((x) => x.id === id);
      expect(f, id).toBeTruthy();
      expect(HANDBOOK[id], id).toBeTruthy();
      expect(HOWTO[id]?.length, id).toBeGreaterThan(0);
      for (const s of [f.title, f.text, ...HOWTO[id]]) expect(DE[s], s).toBeTruthy();
    }
  });
});
