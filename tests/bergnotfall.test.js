// Paket J «Berg, Schnee und Notfall» (Noah 19.10.2026 «1a und b … 2a 3a 4a, 5 nicht»): fictional data only.
import { describe, it, expect } from 'vitest';
import { parseSnow, snowForTrip, isMountain, snowReach, snowStale, snowUrl, HIGH_M } from '../src/lib/mountain/snow.js';
import { toLv95, swissNum, cardText, cleanCard, hasCard, parseVcf, telOf, positionText, CALLS, CARD_FIELDS, mountainLinks, LINK_SPORTS, SIGNS, HIKE_SCALE, SKI_SCALE } from '../src/lib/mountain/sos.js';
import { OVERLAYS, BASES, tileUrl, layersOn, baseFor, startView } from '../src/lib/mountain/maplayers.js';
import { pageOf, placeOf, tabOf } from '../src/lib/nav.js';
import DE from '../src/lib/i18n/de/index.js';

/** Open-Meteo-shaped answer for 5 days from 2026-12-02 (3 past days + 2), hourly every hour. */
function answer() {
  const days = ['2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05', '2026-12-06'];
  const time = [];
  const fl = [];
  const depth = [];
  for (const [i, d] of days.entries())
    for (let h = 0; h < 24; h++) {
      time.push(`${d}T${String(h).padStart(2, '0')}:00`);
      fl.push(h < 6 || h > 18 ? 500 : 1200 + i * 100 + h * 10); // night values must not count
      depth.push(h === 12 ? 0.4 + i * 0.05 : 0);
    }
  return { elevation: 1712, daily: { time: days, snowfall_sum: [4, 0, 6.5, 10, 0] }, hourly: { time, freezing_level_height: fl, snow_depth: depth } };
}
const place = { name: 'Testdorf', lat: 46.81, lon: 9.84 };

describe('#160 freezing level and fresh snow', () => {
  it('asks Open-Meteo with the map point only, 3 days back', () => {
    const url = snowUrl(place);
    expect(url).toContain('latitude=46.81');
    expect(url).toContain('freezing_level_height');
    expect(url).toContain('past_days=3');
    expect(url).not.toContain('Testdorf');
  });

  it('keeps the daytime freezing level (6–18 h), rounded to 50 m, the snow and the depth', () => {
    const s = parseSnow(answer(), place, new Date('2026-12-05T08:00:00Z'));
    expect(s.elevation).toBe(1712);
    const d = s.days.find((x) => x.date === '2026-12-05');
    // i = 3: 1200 + 300 + 18*10 = 1680 → 1700; low 1200 + 300 + 60 = 1560 → 1550
    expect(d).toEqual({ date: '2026-12-05', freezeM: 1700, freezeLowM: 1550, snowCm: 10, depthCm: 55 });
  });

  it('shows the trip days and adds up the fresh snow of the 3 days before', () => {
    const snow = parseSnow(answer(), place);
    const r = snowForTrip({ startDate: '2026-12-05', days: 2, snow });
    expect(r.days.map((d) => d.date)).toEqual(['2026-12-05', '2026-12-06']);
    expect(r.fresh).toBe(10.5); // 4 + 0 + 6.5
    expect(r.freshDays).toBe(3);
    expect(snowForTrip({ startDate: '2027-01-10', days: 1, snow })).toBeNull();
  });

  it('every ski tour and hike counts, a bike trip only with a route up to 1500 m', () => {
    expect(isMountain({ domain: 'ski' })).toBe(true);
    expect(isMountain({ domain: 'hiking' })).toBe(true);
    expect(isMountain({ domain: 'bikepacking', route: { profile: [[0, 600], [20, 900]] } })).toBe(false);
    expect(isMountain({ domain: 'bikepacking', route: { profile: [[0, 600], [30, HIGH_M]] } })).toBe(true);
    expect(isMountain(null)).toBe(false);
  });

  it('is in reach from 16 days before until the last day; fetches again after 3 hours or a new place', () => {
    const trip = { place, startDate: '2026-12-20', days: 2 };
    expect(snowReach(trip, '2026-12-03')).toBe(false);
    expect(snowReach(trip, '2026-12-05')).toBe(true);
    expect(snowReach(trip, '2026-12-21')).toBe(true);
    expect(snowReach(trip, '2026-12-22')).toBe(false);
    expect(snowReach({ startDate: '2026-12-20' }, '2026-12-19')).toBe(false);
    const at = new Date('2026-12-05T08:00:00Z');
    const fresh = { place, snow: { fetchedAt: at.toISOString(), place } };
    expect(snowStale(fresh, at.getTime() + 2 * 36e5)).toBe(false);
    expect(snowStale(fresh, at.getTime() + 4 * 36e5)).toBe(true);
    expect(snowStale({ ...fresh, place: { ...place, lat: 47 } }, at.getTime())).toBe(true);
    expect(snowStale({ place })).toBe(true);
  });
});

describe('#325 #217 emergency', () => {
  it('Rega 1414 and 112 as tel: links', () => {
    expect(CALLS.map((c) => c.number)).toEqual(['1414', '112']);
    expect(telOf('+41 79 000 00 00')).toBe('tel:+41790000000');
  });

  it('turns degrees into Swiss coordinates LV95 (about 1 m), nothing outside Switzerland', () => {
    // swisstopo's own example point near Bern
    const ch = toLv95(46.95108, 7.43864);
    expect(Math.abs(ch.e - 2600000)).toBeLessThan(5);
    expect(Math.abs(ch.n - 1200000)).toBeLessThan(5);
    expect(toLv95(48.8566, 2.3522)).toBeNull();
    expect(swissNum(2600000)).toBe('2’600’000');
    expect(positionText({ lat: 46.95108, lon: 7.43864, alt: 540.4 })).toMatch(/^46\.95108, 7\.43864 · LV95 2’6\d\d’\d{3} \/ 1’\d{3}’\d{3} · 540 m$/);
  });
});

describe('#311 #1001 emergency card', () => {
  it('keeps only known, trimmed lines and writes the QR text in order', () => {
    const card = cleanCard({ phone: ' +41 79 000 00 00 ', contact: 'Test Person', blood: '', foo: 'x' });
    expect(card).toEqual({ contact: 'Test Person', phone: '+41 79 000 00 00' });
    expect(hasCard(card)).toBe(true);
    expect(hasCard({ name: '  ' })).toBe(false);
    expect(cardText(card, (k) => k.split('|')[0], 'ICE')).toBe('ICE\nEmergency contact: Test Person\nTheir phone number: +41 79 000 00 00');
  });

  it('reads name and number from a vCard, also folded lines and N without FN', () => {
    expect(parseVcf('BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Erika Beispiel\r\nTEL;TYPE=CELL:+41 79 111 22 33\r\nTEL:044 000\r\nEND:VCARD')).toEqual({ name: 'Erika Beispiel', phone: '+41 79 111 22 33' });
    expect(parseVcf('BEGIN:VCARD\nN:Muster;Max;;;\nTEL;VALUE=uri:tel:+41790000000\nEND:VCARD')).toEqual({ name: 'Max Muster', phone: '+41790000000' });
    expect(parseVcf('BEGIN:VCARD\nFN:Lange\n  Zeile\nEND:VCARD')).toEqual({ name: 'Lange Zeile', phone: '' });
    expect(parseVcf('hello')).toBeNull();
  });
});

describe('#161 the swisstopo map', () => {
  it('swisstopo WMTS in Web Mercator, slopes and ski routes on by default', () => {
    expect(tileUrl(OVERLAYS[0])).toBe('https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.hangneigung-ueber_30/default/current/3857/{z}/{x}/{y}.png');
    expect(layersOn(undefined)).toEqual(['slope', 'ski']);
    expect(layersOn(['hike', 'nope'])).toEqual(['hike']);
    expect(layersOn([])).toEqual([]);
    expect(baseFor(1)).toBe('winter');
    expect(baseFor(7)).toBe('summer');
    expect(baseFor(7, 'winter')).toBe('winter');
    expect(startView(null, place)).toEqual({ center: [46.81, 9.84], zoom: 13 });
    expect(startView(null, null).zoom).toBe(8);
  });
});

describe('the pages', () => {
  it('#/mountain and its pages belong to Touren, under the tab Ski tours', () => {
    for (const h of ['#/mountain', '#/mountain/sos', '#/mountain/qr', '#/mountain/map?trip=x', '#/mountain/scales']) {
      expect(pageOf(h), h).toBe('mountain');
      expect(tabOf('trips', h), h).toBe('ski');
    }
    expect(placeOf('mountain')).toBe('trips');
  });

  it('every label has a German text', () => {
    const keys = [
      ...CALLS.flatMap((c) => [c.label, c.sub]),
      ...CARD_FIELDS.flatMap((f) => [f.label, ...(f.hint === 'Optional' || f.hint.startsWith('+') ? [] : [f.hint])]),
      ...SIGNS.flatMap((s) => [s.name, s.text]),
      ...[...HIKE_SCALE, ...SKI_SCALE].flatMap((g) => [g.name, g.text]),
      ...mountainLinks('de').flatMap((l) => [l.name, l.sub]),
      ...LINK_SPORTS.map((s) => s.name),
      ...[...BASES, ...OVERLAYS].flatMap((l) => [l.name, ...(l.sub ? [l.sub] : [])]),
    ];
    expect(keys.filter((k) => !(k in DE))).toEqual([]);
  });

  it('the Swiss sources have unique ids, each in a group', () => {
    const links = mountainLinks('en');
    expect(new Set(links.map((l) => l.id)).size).toBe(links.length);
    for (const l of links) expect(LINK_SPORTS.map((s) => s.key)).toContain(l.sport);
    for (const l of links) expect(l.href).toMatch(/^https:\/\//);
  });
});

// #1158 the wallet card: the filled lines in the order of the card, at most 8
import { walletLines as wl } from '../src/lib/mountain/sos.js';
describe('wallet card', () => {
  it('takes the filled lines in order and stops at the limit', () => {
    const lines = wl({ blood: '0+', contact: 'K', phone: '+41', notes: '' }, (k) => k.toUpperCase());
    expect(lines.map((l) => l.key)).toEqual(['contact', 'phone', 'blood']);
    expect(lines[0]).toEqual({ key: 'contact', label: 'EMERGENCY CONTACT', value: 'K' });
    expect(wl({ name: 'a', contact: 'b', phone: 'c' }, undefined, 2).length).toBe(2);
    expect(wl({})).toEqual([]);
  });
});
