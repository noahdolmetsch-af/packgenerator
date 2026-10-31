// SN6+ «SN6 plus» (mockups SN6p, Noah 13.10.2026 «freigabe SN6p», answers 1b 2b 3b 4a 5b): the rules of
// the progress bar, «Your top 5», «Fits right now», «New since your last visit», the order of the blocks
// and «How it works» for every function. Fictional data only.
import './setup/de.js'; // this test needs the German texts
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { FEATURES } from '../src/lib/features.js';
import { WHATS_NEW, compareVersions } from '../src/lib/whatsnew.js';
import { rowsOf, SINCE } from '../src/lib/know/wasneu.js';
import { HOWTO, howtoOf } from '../src/lib/know/howto.js';
import {
  BLOCKS, snapsOf, addSnap, moreThanMonth, share, topFive, opensOf, openApp, versionOn, newSinceOpen, fitsNow, SOON_DAYS, FITS_MAX, KEEP_DAYS,
} from '../src/lib/know/sn6plus.js';
import { t, lang } from '../src/lib/i18n.svelte.js';
import DE from '../src/lib/i18n/de/index.js';

afterEach(() => (lang.v = 'en'));
const TODAY = '2026-10-09';

describe('K1 progress: x of y used, more than a month ago', () => {
  it('keeps one record per day, drops old ones, and compares with the newest at least 30 days old', () => {
    let s = addSnap(null, 10, '2026-08-10');
    s = addSnap(s, 13, '2026-09-05');
    s = addSnap(s, 14, '2026-09-20');
    s = addSnap(s, 14, TODAY);
    s = addSnap(s, 15, TODAY); // the last of the day wins
    expect(s.filter((x) => x.at === TODAY)).toEqual([{ at: TODAY, n: 15 }]);
    expect(s.some((x) => x.at === '2026-08-10')).toBe(true); // 60 days: kept
    expect(addSnap(s, 15, '2026-10-12').some((x) => x.at === '2026-08-10')).toBe(false); // 63 days: dropped
    expect(KEEP_DAYS).toBeGreaterThanOrEqual(31);
    // 2026-09-05 is 34 days back: the newest one that old
    expect(moreThanMonth(s, 15, TODAY)).toBe(2);
    // no record a month old: no comparison
    expect(moreThanMonth([{ at: '2026-09-20', n: 3 }], 15, TODAY)).toBe(null);
    expect(moreThanMonth(null, 15, TODAY)).toBe(null);
    expect(snapsOf([{ at: 'x', n: 1 }, { at: TODAY, n: -1 }, 'nope'])).toEqual([]);
  });
  it('the real numbers of the catalogue: used and total, a bar share', () => {
    expect(FEATURES.length).toBeGreaterThan(80);
    const used = new Set(FEATURES.slice(0, 15).map((f) => f.id));
    const rows = rowsOf(used, {});
    expect(rows.filter((r) => r.used).length).toBe(15);
    expect(share(15, FEATURES.length)).toBe(Math.round((15 / FEATURES.length) * 100));
    expect(share(0, 0)).toBe(0);
    expect(share(9, 3)).toBe(100);
  });
});

describe('K2 «Your top 5» counts since the start (answer 2b)', () => {
  it('the five most opened functions, most first, with their counts; none without counts', () => {
    const uses = { gpx: 41, 'f.plan': 12, wxsuggest: 9, care: 6, backup: 5, note: 2, nope: 99 };
    const top = topFive(uses);
    expect(top.map((r) => [r.id, r.n])).toEqual([['gpx', 41], ['f.plan', 12], ['wxsuggest', 9], ['care', 6], ['backup', 5]]);
    expect(topFive({})).toEqual([]);
    expect(topFive({ gpx: 3 }).map((r) => r.id)).toEqual(['gpx']);
  });
});

describe('K6 «New since your last visit» (answers 1b, 5b)', () => {
  it('an opening of the app moves the last one to «previous»', () => {
    const a = openApp(null, '2026-10-02T07:00:00.000Z', '0.124.0');
    expect(a).toEqual({ prev: null, last: { at: '2026-10-02T07:00:00.000Z', v: '0.124.0' } });
    const b = openApp(a, '2026-10-09T08:00:00.000Z', '0.127.0');
    expect(b.prev).toEqual({ at: '2026-10-02T07:00:00.000Z', v: '0.124.0' });
    expect(b.last.v).toBe('0.127.0');
    expect(opensOf('broken')).toEqual({ last: null, prev: null });
  });
  it('the functions newer than the version of the previous opening, newest first', () => {
    const rows = rowsOf(new Set(), {});
    const { from, rows: fresh } = newSinceOpen({ at: '2026-10-02T07:00:00.000Z', v: '0.124.0' }, rows);
    expect(from).toBe('2026-10-02T07:00:00.000Z');
    const want = FEATURES.filter((f) => compareVersions(SINCE[f.id] ?? '0.1.0', '0.124.0') > 0).map((f) => f.id);
    expect(fresh.map((r) => r.id).sort()).toEqual(want.sort());
    expect(fresh.length).toBeGreaterThan(0);
    for (let i = 1; i < fresh.length; i++) expect(compareVersions(fresh[i - 1].since, fresh[i].since)).toBeGreaterThanOrEqual(0);
    // nothing newer than the current version; the first opening has nothing to compare
    expect(newSinceOpen({ at: '2026-10-09T07:00:00.000Z', v: WHATS_NEW[0].version }, rows).rows).toEqual([]);
    expect(newSinceOpen(null, rows)).toEqual({ from: null, rows: [] });
  });
  it('an opening without a version takes the version of its day', () => {
    const e = WHATS_NEW.find((x) => x.date < WHATS_NEW[0].date);
    expect(versionOn(e.date)).toBe(WHATS_NEW.find((x) => x.date <= e.date).version);
    const rows = rowsOf(new Set(), {});
    const fresh = newSinceOpen({ at: `${e.date}T10:00:00.000Z`, v: null }, rows).rows;
    for (const r of fresh) expect(compareVersions(r.since, versionOn(e.date))).toBeGreaterThan(0);
  });
});

describe('K3 «Fits right now»', () => {
  const trip = (id, startDate, more = {}) => ({ id, title: `test_data_gtp_ ${id}`, startDate, days: 1, entries: [{ itemId: 'a', qty: 1 }], ...more });
  const bike = (km, lastKm) => ({ id: 'b1', name: 'test_data_gtp_ Gravel', km, parts: [{ key: 'chain', history: [{ action: 'service', date: '2026-09-01', km: lastKm }] }] });

  it('a trip soon, chain care due, a trip to debrief and the playground (from «New for you»), at most 3', () => {
    const fits = fitsNow({ trips: [trip('soon', '2026-10-10'), trip('past', '2026-10-01')], bikes: [bike(1288, 1000)], debriefs: [], today: TODAY });
    expect(fits.map((x) => x.kind)).toEqual(['trip', 'chain', 'rate']);
    expect(fits[0]).toMatchObject({ days: 1, trip: { id: 'soon' } });
    expect(fits[1]).toMatchObject({ since: 288, bike: { id: 'b1' } });
    expect(fits[2].trip.id).toBe('past');
    expect(fits.length).toBeLessThanOrEqual(FITS_MAX);
  });
  it('Bewerten and Spielwiese move here', () => {
    const fits = fitsNow({ trips: [trip('past', '2026-10-01')], today: TODAY });
    expect(fits.map((x) => x.kind)).toEqual(['rate', 'play']);
    // a debrief done, the playground used or a demo running: nothing of both
    expect(fitsNow({ trips: [trip('past', '2026-10-01')], debriefs: [{ tripId: 'past', status: 'done' }], used: new Set(['f.playground']), today: TODAY })).toEqual([]);
    expect(fitsNow({ demo: { file: 'x' }, today: TODAY })).toEqual([]);
  });
  it('the avalanche bulletin before a ski tour; nothing far away; a chain not yet due stays quiet', () => {
    const fits = fitsNow({ trips: [trip('ski', '2026-10-11', { domain: 'ski' })], used: new Set(['f.playground']), today: TODAY });
    expect(fits.map((x) => x.kind)).toEqual(['trip', 'bulletin']);
    const far = fitsNow({ trips: [trip('far', '2026-10-20')], bikes: [bike(1100, 1000)], used: new Set(['f.playground']), today: TODAY });
    expect(far).toEqual([]);
    expect(SOON_DAYS).toBe(3);
  });
});

describe('the order of the blocks (answer 3b)', () => {
  it('head, progress, Fits right now, Your top 5, search, New since your last visit, the six cards', () => {
    expect(BLOCKS).toEqual(['progress', 'fits', 'top', 'search', 'news', 'groups']);
    const src = readFileSync(new URL('../src/pages/Features.svelte', import.meta.url), 'utf8');
    const markup = src.slice(src.indexOf('<div class="feat"'));
    const found = [...markup.matchAll(/data-block="(\w+)"/g)].map((m) => m[1]);
    expect(found).toEqual(['help', ...BLOCKS.filter((b) => b !== 'groups')]); // «Alles finden 2» (Noah 22.10.2026 «3a»): the help rows (handbook, rules, keys, intro) on top
    // «New for you» is gone (K6 replaces it)
    expect(src.includes("t('New for you')")).toBe(false);
  });
});

describe('K4 «How it works»: three steps for every function (answer 4a)', () => {
  it('every function of the catalogue has 3 short steps, every step in German', () => {
    for (const f of FEATURES) {
      const steps = howtoOf(f.id);
      expect(steps.length, f.id).toBe(3);
      for (const s of steps) {
        expect(s.length, `${f.id}: ${s}`).toBeLessThanOrEqual(90);
        expect(DE[s], `${f.id}: ${s}`).toBeTruthy();
      }
    }
    for (const id of Object.keys(HOWTO)) expect(FEATURES.some((f) => f.id === id), id).toBe(true);
    expect(howtoOf('nope')).toEqual([]);
    lang.v = 'de';
    expect(t(howtoOf('gpx')[1])).toBe('Tippe bei «Route» auf «GPX laden».');
  });
  it('the new words of the page are German', () => {
    for (const k of ['Fits right now', 'Your top 5', 'New since your last visit', 'How it works', '{n} times|top', '{n} more than a month ago', 'Nothing new has come since your last visit.', 'After a few days your most used functions stand here.']) expect(DE[k], k).toBeTruthy();
  });
});
