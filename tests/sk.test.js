// SK «Seiten-Kacheln» + «Links nach aussen» (Noah 13.10.2026, SK1–SK8, SKX1–SKX5): the tile rules and
// the outside links. Fictional data only; own links use example.org.
import { describe, it, expect } from 'vitest';
import { arrange, bumpUse, useCount, pruneUses, placePins, pin, unpin, moveTile, hideTile, showTile, addTile, addOwn, needsChoice, resetState, emptyState, normState, MAX_TILES, USE_DAYS } from '../src/lib/sk/tiles.js';
import { safeUrl, swisstopoUrl, sbbUrl, windyUrl, komootUrl, bikeShopsUrl, ifixitUrl, stravaRideUrl, slfUrl, meteoUrl, schweizMobilUrl, linkOn, slotOf, LINKS } from '../src/lib/sk/links.js';
import { SK_PAGES, hintsFor, tileUrl } from '../src/lib/sk/pages.js';

const today = '2026-10-13';
// calendar days in Europe/Zurich: plain date strings, never Date.now() + n * 864e5
const day = (n) => {
  const d = new Date(Date.UTC(2026, 9, 13 + n));
  return d.toISOString().slice(0, 10);
};
const cat = (n, extra = 0) => [...Array.from({ length: n }, (_, i) => ({ id: `t${i + 1}`, label: `Tile ${i + 1}`, icon: 'map', href: '#/' })), ...Array.from({ length: extra }, (_, i) => ({ id: `e${i + 1}`, label: `Extra ${i + 1}`, icon: 'map', href: '#/', extra: true }))];
const ids = (list) => list.map((d) => d.id);
const tap = (s, id, ...days) => days.reduce((x, d) => bumpUse(x, id, d), s);

describe('sorted by use over the last 4 weeks', () => {
  it('counts only taps of the last 28 days, today included', () => {
    let s = tap(emptyState(), 't3', day(0), day(-27), day(-28), day(-40), day(1));
    expect(USE_DAYS).toBe(28);
    // bumpUse prunes with each tap's own day; count again for today
    s = { ...s, uses: { t3: [day(0), day(-27), day(-28), day(-40), day(1)] } };
    expect(useCount(s, 't3', today)).toBe(2);
  });
  it('prunes old taps and drops tiles without one', () => {
    expect(pruneUses({ a: [day(-30), day(-2)], b: [day(-29)] }, today)).toEqual({ a: [day(-2)] });
  });
  it('the most used tile comes first; ties keep the page order', () => {
    const s = tap(tap(emptyState(), 't5', day(-1), day(-2)), 't3', day(-3));
    expect(ids(arrange(cat(6), s, {}, today).shown)).toEqual(['t5', 't3', 't1', 't2', 't4', 't6']);
  });
  it('a tile tapped often 5 weeks ago no longer leads', () => {
    const s = { ...emptyState(), uses: { t6: [day(-35), day(-36), day(-37)], t2: [day(-1)] } };
    expect(ids(arrange(cat(6), s, {}, today).shown).slice(0, 2)).toEqual(['t2', 't1']);
  });
  it('says when the order comes from use', () => {
    expect(arrange(cat(3), emptyState(), {}, today).byUse).toBe(false);
    expect(arrange(cat(3), tap(emptyState(), 't2', today), {}, today).byUse).toBe(true);
  });
});

describe('pinning: a tile moved by hand stays', () => {
  it('places pinned tiles at their slot, the others around them', () => {
    const list = cat(5);
    expect(ids(placePins(list, { t5: 1 }))).toEqual(['t1', 't5', 't2', 't3', 't4']);
    expect(ids(placePins(list, { t1: 9 }))).toEqual(['t2', 't3', 't4', 't5', 't1']);
  });
  it('moving pins the tile at its new place, even against use', () => {
    let s = tap(emptyState(), 't4', day(-1), day(-2), day(-3));
    const now = ids(arrange(cat(5), s, {}, today).sorted);
    expect(now[0]).toBe('t4');
    s = moveTile(s, now, 't2', 0);
    expect(s.pins).toEqual({ t2: 0 });
    s = tap(s, 't5', day(0), day(0), day(0), day(0));
    expect(ids(arrange(cat(5), s, {}, today).shown).slice(0, 2)).toEqual(['t2', 't5']);
  });
  it('a new pin on a taken slot lets the old one go; unpin sorts by use again', () => {
    let s = pin(pin(emptyState(), 't3', 0), 't4', 0);
    expect(s.pins).toEqual({ t4: 0 });
    s = unpin(s, 't4');
    expect(s.pins).toEqual({});
  });
});

describe('7 tiles plus the empty «+»', () => {
  it('shows at most 7; more go to overflow', () => {
    const a = arrange(cat(8), emptyState(), {}, today);
    expect(MAX_TILES).toBe(7);
    expect(a.shown).toHaveLength(7);
    expect(ids(a.overflow)).toEqual(['t8']);
    expect(a.full).toBe(true);
  });
  it('extras only after «Dazunehmen»', () => {
    const a = arrange(cat(3, 2), emptyState(), {}, today);
    expect(ids(a.shown)).toEqual(['t1', 't2', 't3']);
    expect(ids(a.extras)).toEqual(['e1', 'e2']);
    const s = addTile(emptyState(), a, 'e2');
    expect(ids(arrange(cat(3, 2), s, {}, today).shown)).toContain('e2');
  });
  it('every page has at most 7 tiles of its own besides one that may step aside', () => {
    for (const [page, list] of Object.entries(SK_PAGES)) expect(list.filter((d) => !d.extra).length, page).toBeLessThanOrEqual(8);
  });
});

describe('«+» with all 7 places full asks which tile goes (Noah, answer 1 b)', () => {
  const c = cat(7, 1);
  const a = arrange(c, emptyState(), {}, today);
  it('needs the choice first and changes nothing without it', () => {
    expect(needsChoice(a)).toBe(true);
    expect(addTile(emptyState(), a, 'e1')).toEqual(normState(emptyState()));
  });
  it('the chosen tile goes to «Hidden», the new one shows, still 7', () => {
    const s = addTile(emptyState(), a, 'e1', 't3');
    const b = arrange(c, s, {}, today);
    expect(ids(b.shown)).toHaveLength(7);
    expect(ids(b.shown)).toContain('e1');
    expect(ids(b.hidden)).toEqual(['t3']);
  });
  it('a pinned tile that goes leaves its place to the new one', () => {
    const s0 = pin(emptyState(), 't6', 1);
    const s = addTile(s0, arrange(c, s0, {}, today), 'e1', 't6');
    expect(s.pins).toEqual({ e1: 1 });
    expect(ids(arrange(c, s, {}, today).shown)[1]).toBe('e1');
  });
  it('an own link as a tile takes the same step', () => {
    const s = addOwn(emptyState(), a, { id: 'own-club', url: 'https://example.org/club', name: 'Bike club' }, 't1');
    const b = arrange(c, s, {}, today);
    expect(ids(b.shown)).toContain('own-club');
    expect(b.shown.find((d) => d.id === 'own-club')).toMatchObject({ own: true, url: 'https://example.org/club', label: 'Bike club' });
    expect(ids(b.hidden)).toEqual(['t1']);
  });
});

describe('hide, show again, quiet tiles, as at the start', () => {
  it('hides a tile and lets it come back', () => {
    let s = pin(emptyState(), 't2', 0);
    s = hideTile(s, 't2');
    expect(s.pins).toEqual({});
    expect(ids(arrange(cat(4), s, {}, today).hidden)).toEqual(['t2']);
    s = showTile(s, 't2');
    expect(ids(arrange(cat(4), s, {}, today).shown)).toContain('t2');
  });
  it('a tile with nothing to say steps aside with its quiet line and frees its place', () => {
    const a = arrange(cat(8), emptyState(), { t1: { quiet: 'nothing due' }, t2: { text: 'x' } }, today);
    expect(ids(a.shown)).toEqual(['t2', 't3', 't4', 't5', 't6', 't7', 't8']);
    expect(a.quiet).toEqual([{ tile: expect.objectContaining({ id: 't1' }), text: 'nothing due' }]);
    // it comes back by itself once it has something to say
    expect(ids(arrange(cat(8), emptyState(), {}, today).shown)[0]).toBe('t1');
  });
  it('a hidden tile never shows a quiet line', () => {
    const a = arrange(cat(3), hideTile(emptyState(), 't1'), { t1: { quiet: 'nothing due' } }, today);
    expect(a.quiet).toEqual([]);
  });
  it('«Wie am Anfang» clears pins, hidden, added and taps; own links stay', () => {
    let s = addOwn(emptyState(), arrange(cat(2), emptyState(), {}, today), { id: 'own-a', url: 'https://example.org/a', name: 'A' });
    s = hideTile(pin(tap(s, 't1', today), 't2', 0), 't1');
    const r = resetState(s);
    expect(r).toMatchObject({ pins: {}, hidden: [], added: [], uses: {} });
    expect(r.own).toEqual([{ id: 'own-a', url: 'https://example.org/a', name: 'A' }]);
  });
  it('a broken stored record never breaks the page', () => {
    expect(normState(null)).toEqual(emptyState());
    expect(normState({ pins: 3, hidden: 'x', own: [null, { id: 'o' }] })).toEqual(emptyState());
  });
});

describe('own links: only http and https', () => {
  it('accepts http and https, adds https:// to a bare address', () => {
    expect(safeUrl('https://example.org/regenjacke/pflege')).toBe('https://example.org/regenjacke/pflege');
    expect(safeUrl('http://example.org')).toBe('http://example.org/');
    expect(safeUrl('  example.org/shop?x=1 ')).toBe('https://example.org/shop?x=1');
  });
  it('refuses everything else', () => {
    for (const bad of ['javascript:alert(1)', 'data:text/html,hi', 'file:///etc/passwd', 'ftp://example.org', 'mailto:a@example.org', 'example', '', '   ', 'https://exa mple.org', 'https://user:pw@example.org', null]) expect(safeUrl(bad), String(bad)).toBeNull();
  });
});

describe('link builders send only the place and the date', () => {
  const place = { name: 'Langnau i. E.', lat: 46.939512, lon: 7.787633 };
  it('swisstopo searches the place name', () => {
    expect(swisstopoUrl(place)).toBe('https://map.geo.admin.ch/?swisssearch=Langnau%20i.%20E.');
    expect(swisstopoUrl(null)).toBe('https://map.geo.admin.ch/');
  });
  it('SBB to the start place on the trip day', () => {
    expect(sbbUrl(place, '2026-10-24')).toBe('https://www.sbb.ch/de/kaufen/pages/fahrplan/fahrplan.xhtml?nach=Langnau%20i.%20E.&datum=24.10.2026');
    expect(sbbUrl({ name: 'Bern & Co' }, '', 'en')).toBe('https://www.sbb.ch/en/kaufen/pages/fahrplan/fahrplan.xhtml?nach=Bern%20%26%20Co');
  });
  it('maps get the place rounded to about 100 m, nothing else', () => {
    expect(windyUrl(place)).toBe('https://www.windy.com/?wind,46.94,7.788,9');
    expect(komootUrl(place)).toBe('https://www.komoot.com/plan/@46.94,7.788,12z');
    expect(bikeShopsUrl(place)).toBe('https://www.google.com/maps/search/Veloladen/@46.94,7.788,14z');
    expect(bikeShopsUrl(null, 'en')).toBe('https://www.google.com/maps/search/bike%20shop');
    expect(windyUrl(null)).toBe('https://www.windy.com/');
  });
  it('iFixit searches brand and model, Strava opens one ride by its id', () => {
    expect(ifixitUrl({ name: 'Rain jacket', brand: 'Fictio', model: 'Storm 2' })).toBe('https://www.ifixit.com/Search?query=Fictio%20Storm%202');
    expect(ifixitUrl({ name: 'Tent & pegs' })).toBe('https://www.ifixit.com/Search?query=Tent%20%26%20pegs');
    expect(stravaRideUrl('12345')).toBe('https://www.strava.com/activities/12345');
    expect(stravaRideUrl('../x')).toBe('https://www.strava.com/athlete/training');
  });
  it('fixed pages in both languages, the SLF bulletin as a link only', () => {
    expect(slfUrl('de')).toMatch(/^https:\/\/www\.slf\.ch\/de\//);
    expect(slfUrl('en')).toMatch(/^https:\/\/www\.slf\.ch\/en\//);
    expect(meteoUrl('de')).toBe('https://www.meteoschweiz.admin.ch/');
    expect(schweizMobilUrl('en')).toMatch(/^https:\/\/schweizmobil\.ch\/en\//);
    expect(tileUrl({ url: 'meteo' }, 'en')).toBe('https://www.meteoswiss.admin.ch/');
  });
  it('every outside tile and link builder gives an https address', () => {
    for (const list of Object.values(SK_PAGES)) for (const d of list.filter((x) => x.url)) expect(tileUrl(d, 'de'), d.id).toMatch(/^https:\/\//);
  });
  it('links are switched off by kind; own links have a slot per thing', () => {
    expect(linkOn(['x10'], 'x10')).toBe(false);
    expect(linkOn(['x10'], 'x3s')).toBe(true);
    expect(slotOf('x9', 'bike-1')).toBe('x9:bike-1');
    expect(Object.keys(LINKS).filter((k) => LINKS[k].own).sort()).toEqual(['x1', 'x14', 'x15', 'x7', 'x8', 'x9']);
  });
});

describe('live hints', () => {
  it('a page tile with nothing to say is quiet', () => {
    const h = hintsFor('bikes', { trips: [], bikes: [], visits: [], kmBook: [], maintenance: [] }, today);
    expect(h.pack).toEqual({ quiet: 'no trip planned' });
    expect(h.stravacheck).toEqual({ quiet: 'nothing to check' });
  });
  it('the next trip and the rides of this month', () => {
    const trips = [{ id: 'a', title: 'Jura weekend', startDate: day(7), days: 2, entries: [{ packed: true }, { packed: false }] }];
    // Paket 3: the month counts like «Velo in diesem Monat» (withStravaRides): a counted Strava ride, an uploaded
    // ride and a Strava ride of «Training» without a ledger entry; a ride still to check (open) does not count yet
    const kmBook = [{ id: 'k1', date: day(-2), km: 40.4, kind: 'ride', state: 'counted', source: 'strava', stravaId: 's1' }, { id: 'k2', date: '2026-09-30', km: 99, kind: 'ride', state: 'counted', source: 'strava' }, { id: 'k3', date: day(-1), km: 12, kind: 'ride', state: 'open', source: 'strava' }];
    const rides = [{ id: 'r1', date: day(-3), km: 20 }];
    const acts = [{ id: 'a1', kind: 'bike', day: day(-4), km: 25 }];
    const h = hintsFor('bikes', { trips, bikes: [], visits: [], kmBook, maintenance: [], rides, acts }, today);
    expect(h.pack.text).toBe('Jura weekend · in 7 days · 1 of 2');
    expect(h.kmbook.text).toBe('This month 85 km');
    expect(h.stravacheck.text).toBe('1 ride to check');
    // the Strava rides alone (before a bike's start point, no ledger entry) are a ride this month too
    expect(hintsFor('flow', { kmBook: [], rides: [], acts, flowActs: [], flowLog: [], flowChecks: [], trips: [], debriefs: [] }, today).kmbook.text).toBe('This month 25 km');
  });
});
