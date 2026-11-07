// «Nebelgrenze am Morgen» (Noah 05.11.2026 «1a 2b 3a»): the morning message about the fog line, server and app.
import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/lib/i18n.svelte.js', () => ({ t: (s, v) => (v ? s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '') : s), locale: () => 'de-CH' }));

const { cleanList, cleanTexts, fogUrl, fogVerdict, fogMessage, FOG_LEVELS } = await import('../api/_lib/push.js');
const { buildList, KINDS, pushOf, fogSpots, FOG_DAYS } = await import('../src/lib/push/schedule.js');
const { fogOf } = await import('../src/lib/wetter/nebelgrenze.js');
const { parseProfil, LEVELS } = await import('../src/lib/wetter/profil.js');

const Z = { 1000: 110, 975: 330, 950: 550, 925: 780, 900: 1000, 850: 1500 };
const FOG = { rh: { 1000: 98, 975: 98, 950: 97, 925: 96, 900: 40, 850: 30 }, t: { 1000: 3, 975: 2.5, 950: 2, 925: 1, 900: 9, 850: 8 } };
const DEEP = { rh: { 1000: 98, 975: 98, 950: 97, 925: 96, 900: 95, 850: 95 }, t: FOG.t };
const OPEN = { rh: { 1000: 60, 975: 55, 950: 50, 925: 45, 900: 40, 850: 30 }, t: { 1000: 6, 975: 4, 950: 3, 925: 1, 900: -1, 850: -4 } };
// one day, one hour (08:00 local) in the format of Open-Meteo (ISO local times)
function answer({ low = 100, mid = 0, high = 0, air = FOG, rh2 = 98, t2 = 3.5 } = {}) {
  const hourly = { time: ['2026-11-20T08:00'], temperature_2m: [t2], relative_humidity_2m: [rh2], cloud_cover_low: [low], cloud_cover_mid: [mid], cloud_cover_high: [high] };
  for (const l of FOG_LEVELS) {
    hourly[`geopotential_height_${l}hPa`] = [Z[l]];
    hourly[`temperature_${l}hPa`] = [air.t[l]];
    hourly[`relative_humidity_${l}hPa`] = [air.rh[l]];
  }
  return { elevation: 410, hourly };
}
// the same hour for the app's own calculation (unixtime format of the weather core)
const appHour = (a) => parseProfil({ elevation: a.elevation, utc_offset_seconds: 3600, hourly: Object.fromEntries(Object.entries(a.hourly).map(([k, v]) => [k, k === 'time' ? [Date.parse('2026-11-20T08:00:00Z') / 1000 - 3600] : v])) }).hours[0];

const HOME = { name: 'Testdorf', lat: 47.1, lon: 8.2 };
const ON = (kinds) => ({ on: true, kinds: Object.fromEntries(kinds.map((k) => [k, true])) });
const TEXTS = { fogtitle: 'Nebelgrenze', fog: 'Hochnebel bis ca. {top} m, ab {above} m Sonne.', fogcloud: 'Hochnebel bis ca. {top} m, darüber Wolken.', fogclear: 'Heute kein Hochnebel: time to shine.', fogspot: 'Ausfahrt über dem Nebel: {name} (bis {m} m).' };

describe('the fog line on the server', () => {
  it('asks Open-Meteo for the layers of one day', () => {
    const u = fogUrl({ lat: 47.1, lon: 8.2, date: '2026-11-20' });
    for (const k of ['cloud_cover_low', 'temperature_925hPa', 'relative_humidity_850hPa', 'geopotential_height_1000hPa', 'start_date=2026-11-20']) expect(u).toContain(k);
  });
  it('fog with sun above, fog with cloud above, no fog', () => {
    expect(fogVerdict(answer(), '2026-11-20')).toEqual({ top: 800, above: 'sun' });
    expect(fogVerdict(answer({ mid: 80 }), '2026-11-20')).toEqual({ top: 800, above: 'cloud' });
    expect(fogVerdict(answer({ low: 5, air: OPEN, rh2: 55 }), '2026-11-20')).toEqual({ top: null });
    expect(fogVerdict(answer({ air: DEEP }), '2026-11-20')).toEqual({ top: null }); // a deep rain cloud is no fog deck
  });
  it('nothing without the hour or the values', () => {
    expect(fogVerdict(answer(), '2026-11-21')).toBeNull();
    expect(fogVerdict(null, '2026-11-20')).toBeNull();
    expect(fogVerdict({ elevation: 410, hourly: { time: ['2026-11-20T08:00'] } }, '2026-11-20')).toBeNull();
  });
  it('gives the same fog line as the app', () => {
    for (const a of [answer(), answer({ mid: 80 }), answer({ low: 5, air: OPEN, rh2: 55 }), answer({ air: DEEP }), answer({ rh2: 60 }), answer({ low: 60 })]) {
      const server = fogVerdict(a, '2026-11-20');
      const app = fogOf(appHour(a), a.elevation);
      expect(server.top, JSON.stringify(a.hourly.cloud_cover_low)).toBe(app.top);
    }
    expect(LEVELS.slice(0, 6)).toEqual(FOG_LEVELS);
  });
  it('the words: sun above with a ride above the fog, cloud above, time to shine', () => {
    const w = { key: 'fog:2026-11-20', url: '#/wetter', spots: [{ name: 'Albis', m: 700 }, { name: 'Napf', m: 1400 }] };
    expect(fogMessage(w, { top: 800, above: 'sun' }, TEXTS)).toEqual({ title: 'Nebelgrenze', body: 'Hochnebel bis ca. 800 m, ab 900 m Sonne. Ausfahrt über dem Nebel: Napf (bis 1400 m).', url: '#/wetter', tag: 'fog:2026-11-20' });
    expect(fogMessage({ ...w, spots: [] }, { top: 800, above: 'sun' }, TEXTS).body).toBe('Hochnebel bis ca. 800 m, ab 900 m Sonne.');
    expect(fogMessage(w, { top: 800, above: 'cloud' }, TEXTS).body).toBe('Hochnebel bis ca. 800 m, darüber Wolken.');
    expect(fogMessage(w, { top: null }, TEXTS).body).toBe('Heute kein Hochnebel: time to shine.');
    expect(fogMessage(w, null, TEXTS)).toBeNull();
    expect(fogMessage(w, { top: null }, {})).toBeNull();
  });
  it('the list from the app keeps the fog check and its suggestions, made safe', () => {
    const l = cleanList({ weather: [{ key: 'fog:2026-11-20', at: 1, date: '2026-11-20', lat: 47, lon: 8, only: ['fog', 'nonsense'], url: '#/wetter', spots: [{ name: 'Albis', m: 900 }, { name: '', m: 5 }, { name: 'X', m: 99999 }] }] });
    expect(l.weather[0].only).toEqual(['fog']);
    expect(l.weather[0].spots).toEqual([{ name: 'Albis', m: 900 }]);
    expect(cleanTexts({ fog: 'a', fogclear: 'b', fogspot: 'c', fogcloud: 'd', fogtitle: 'e' })).toMatchObject({ fog: 'a', fogclear: 'b', fogspot: 'c', fogcloud: 'd', fogtitle: 'e' });
  });
});

describe('the fog line in the app', () => {
  const now = new Date(2026, 10, 20, 5, 0); // 20.11.2026 05:00
  it('has its own switch, on unless switched off', () => {
    expect(KINDS.some((k) => k.key === 'fog')).toBe(true);
    expect(pushOf({ on: true }).kinds.fog).toBe(true);
    expect(pushOf({ on: true, kinds: { fog: false } }).kinds.fog).toBe(false);
    expect(pushOf({ on: true }).kinds.ice).toBe(false); // everything else stays off until switched on
  });
  it('checks the home place at 07:00 on the next mornings of the cold months', () => {
    const l = buildList({ settings: { push: { on: true }, homePlace: HOME }, now });
    const fog = l.weather.filter((w) => w.only?.includes('fog'));
    expect(fog).toHaveLength(FOG_DAYS);
    expect(fog[0]).toMatchObject({ key: 'fog:2026-11-20', date: '2026-11-20', lat: 47.1, lon: 8.2, url: '#/wetter', only: ['fog'] });
    expect(new Date(fog[0].at).getHours()).toBe(7);
    expect(l.texts.fog).toContain('{top}');
    expect(l.texts.fogclear).toContain('time to shine');
  });
  it('sends nothing in summer, with the switch off, without «on» or without a home place', () => {
    expect(buildList({ settings: { push: { on: true }, homePlace: HOME }, now: new Date(2026, 6, 10, 5, 0) }).weather).toEqual([]);
    const off = buildList({ settings: { push: { on: true, kinds: { fog: false } }, homePlace: HOME }, now });
    expect(off.weather).toEqual([]);
    expect(off.texts.fog).toBe('');
    expect(buildList({ settings: { push: { on: false }, homePlace: HOME }, now }).weather).toEqual([]);
    expect(buildList({ settings: { push: { on: true } }, now }).weather).toEqual([]);
  });
  it('suggests rides near home with their highest point, nearest first, each name once', () => {
    const trip = (title, lat, lon, top) => ({ id: title, title, status: 'planned', route: { start: { lat, lon }, profile: [[0, 400], [10, top]] } });
    const trips = [trip('Albis', 47.3, 8.3, 900), trip('Nah', 47.12, 8.21, 650), trip('Weit', 46.0, 7.0, 3000), trip('Nah', 47.12, 8.21, 650), { id: 'x', title: 'Ohne', status: 'planned' }, { ...trip('Weg', 47.1, 8.2, 800), skipped: true }];
    expect(fogSpots(trips, HOME)).toEqual([{ name: 'Nah', m: 650 }, { name: 'Albis', m: 900 }]);
    const l = buildList({ trips, settings: { push: { on: true }, homePlace: HOME }, now });
    expect(l.weather.find((w) => w.only?.includes('fog')).spots).toEqual([{ name: 'Nah', m: 650 }, { name: 'Albis', m: 900 }]);
  });
});
