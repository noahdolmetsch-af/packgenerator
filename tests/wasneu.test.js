import { describe, it, expect, afterEach } from 'vitest';
import { FEATURES, FEATURE_GROUPS, PAGE_GROUPS } from '../src/lib/features.js';
import { WHATS_NEW, compareVersions } from '../src/lib/whatsnew.js';
import { FUNCTIONS } from '../src/lib/home/fnlist.js';
import { TILE } from '../src/lib/home/tiles.js';
import { t, lang } from '../src/lib/i18n.svelte.js';
import DE from '../src/lib/i18n/de/index.js';
import {
  SINCE, BEST, SORTS, PLANNED, HOME_FEATURE, sinceOf, sortKey, usesOf, bumpUse, rowsOf, sortRows, searchRows, newSince, neverTried, byMonth,
  daysBetween, showMessage, messageOn, tileDaysLeft, pinNews, unpinNews, TILE_DAYS,
} from '../src/lib/know/wasneu.js';

// v0.110.0 Design-Refresh P10 «Was ist neu» (I11–I11e)
afterEach(() => (lang.v = 'en'));
const ids = (rows) => rows.map((r) => r.id);

describe('every function has a version it came with', () => {
  it('known for every function, never newer than this version, all real versions of the list', () => {
    const versions = new Set(WHATS_NEW.map((e) => e.version));
    for (const f of FEATURES) {
      expect(SINCE[f.id], f.id).toBeTruthy();
      expect(versions.has(SINCE[f.id]), `${f.id}: ${SINCE[f.id]}`).toBe(true);
    }
    for (const id of Object.keys(SINCE)) expect(FEATURES.some((f) => f.id === id), id).toBe(true);
    expect(sinceOf('nope')).toBe('0.1.0');
    expect(SINCE['f.news']).toBe('0.110.0');
    expect(SINCE['f.tripcheck']).toBe('0.111.0');
    expect(SINCE['f.strava']).toBe('0.116.0'); // v0.116.0 «Strava-Verbindung»
    expect(SINCE['f.explain']).toBe('0.117.0'); // v0.117.0 «Knöpfe neu»
    expect(SINCE['f.quickstart']).toBe('0.119.0'); // v0.119.0 «Schnellstart»
    expect(SINCE['f.packblocks']).toBe('0.124.0'); // v0.124.0 «Neue Tour Teil 2»
    expect(SINCE['f.yeargoals']).toBe('0.125.0'); // v0.125.0 «Werte überall»
    expect(SINCE['f.training']).toBe(WHATS_NEW[0].version); // «Training» TR1–TR3
  });
  it('the 10 most important exist, without doubles; the 16 buttons of Today map to functions', () => {
    expect(BEST.length).toBe(10);
    expect(new Set(BEST).size).toBe(10);
    for (const id of BEST) expect(FEATURES.some((f) => f.id === id), id).toBe(true);
    for (const f of FUNCTIONS) expect(FEATURES.some((x) => x.id === HOME_FEATURE[f.id]), f.id).toBe(true);
  });
  it('every sort, planned row and the tile have German words', () => {
    lang.v = 'de';
    for (const s of SORTS) {
      expect(DE[s.label] ?? DE[s.label.split('|')[0]], s.label).toBeTruthy();
      expect(DE[s.note], s.note).toBeTruthy();
    }
    for (const p of PLANNED) expect([DE[p.name], DE[p.note]].every(Boolean), p.name).toBe(true);
    expect(t('Your top 10')).toBe('Deine Top 10');
    expect(t('Most important 10')).toBe('Wichtigste 10');
    expect(TILE.news.sizes).toContain('long');
  });
});

describe('the counts of «Your top 10»', () => {
  it('kept safe: whole numbers for real functions only', () => {
    expect(usesOf({ backup: 3.7, nope: 4, care: -1, templates: '2' })).toEqual({ backup: 3, templates: 2 });
    expect(usesOf(null)).toEqual({});
    expect(usesOf([1, 2])).toEqual({});
    expect(bumpUse({ backup: 1 }, 'backup')).toEqual({ backup: 2 });
    expect(bumpUse({}, 'care')).toEqual({ care: 1 });
    expect(bumpUse({ care: 1 }, 'nope')).toEqual({ care: 1 });
  });
});

describe('the list and its sorts', () => {
  const used = new Set(['care']);
  const rows = rowsOf(used, { backup: 5, templates: 9, 'f.plan': 2 }, '0.116.0'); // f.strava is new in 0.116.0
  it('each row: since, place, count and state (new, used, never)', () => {
    expect(rows.length).toBe(FEATURES.length);
    const by = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(by.backup).toMatchObject({ n: 5, used: true, state: 'used' });
    expect(by.care).toMatchObject({ n: 0, used: true, state: 'used' });
    // v0.116.0: the newest function is «Strava connection»; the checks (0.111.0) are one never tried now
    expect(by['f.strava'].state).toBe('new');
    expect(by['f.tripcheck'].state).toBe('never');
    expect(by['f.news'].state).toBe('never');
    expect(by['f.explain'].state).toBe('never'); // newer than the 0.116.0 these rows are made for
    expect(by['f.quickstart'].state).toBe('never');
    expect(rowsOf().find((r) => r.id === 'f.explain').state).toBe('never'); // 0.117.0, older than this version
    expect(by['f.packblocks'].state).toBe('never');
    expect(rowsOf().find((r) => r.id === 'f.quickstart').state).toBe('never'); // 0.119.0, older than this version
    expect(rowsOf().find((r) => r.id === 'f.packblocks').state).toBe('never'); // 0.124.0, older than this version
    expect(rowsOf().find((r) => r.id === 'f.yeargoals').state).toBe('never'); // 0.125.0, older than this version
    expect(rowsOf().find((r) => r.id === 'f.training').state).toBe('new'); // new in this version
    expect(rowsOf(undefined, undefined, '0.119.0').find((r) => r.id === 'f.quickstart').state).toBe('new'); // new in its version
        expect(by['f.theft'].state).toBe('never');
    for (const r of rows) {
      expect(FEATURE_GROUPS.some((g) => g.key === r.group), r.id).toBe(true);
      expect(PAGE_GROUPS.some((g) => g.key === r.place), r.id).toBe(true);
    }
  });
  it('newest first; name A–Z; by category and by place in their order', () => {
    const newest = sortRows(rows, 'new');
    expect(ids(newest.slice(0, 6))).toEqual(['f.training', 'f.yeargoals', 'f.packblocks', 'f.quickstart', 'f.explain', 'f.strava']);
    for (let i = 1; i < newest.length; i++) expect(compareVersions(newest[i - 1].since, newest[i].since)).toBeGreaterThanOrEqual(0);
    const abc = sortRows(rows, 'name').map((r) => r.title);
    expect(abc).toEqual([...abc].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
    const g = sortRows(rows, 'group').map((r) => FEATURE_GROUPS.findIndex((x) => x.key === r.group));
    expect(g).toEqual([...g].sort((a, b) => a - b));
    const p = sortRows(rows, 'place').map((r) => PAGE_GROUPS.findIndex((x) => x.key === r.place));
    expect(p).toEqual([...p].sort((a, b) => a - b));
    expect(sortRows(rows, 'name').length).toBe(rows.length);
  });
  it('your top 10: only counted ones, most first, at most 10; the most important 10 in their fixed order', () => {
    expect(ids(sortRows(rows, 'top'))).toEqual(['templates', 'backup', 'f.plan']);
    const many = Object.fromEntries(FEATURES.slice(0, 14).map((f, i) => [f.id, i + 1]));
    expect(sortRows(rowsOf(new Set(), many), 'top').length).toBe(10);
    expect(sortRows(rowsOf(new Set(), many), 'top')[0].n).toBe(14);
    expect(ids(sortRows(rows, 'best'))).toEqual(BEST);
    expect(sortKey('top')).toBe('top');
    expect(sortKey('nope')).toBe('new');
    expect(sortKey(null)).toBe('new');
  });
  it('the search finds by English and shown words', () => {
    expect(ids(searchRows(rows, 'theft'))).toEqual(['f.theft']);
    lang.v = 'de';
    expect(ids(searchRows(rows, 'diebstahl', t))).toContain('f.theft');
    expect(searchRows(rows, '  ').length).toBe(rows.length);
  });
  it('since your last visit: newer than the version before the update; never tried: with a playground day, unused', () => {
    expect(ids(newSince(rows, '0.111.0'))).toEqual(['f.training', 'f.yeargoals', 'f.packblocks', 'f.quickstart', 'f.explain', 'f.strava']);
    expect(ids(newSince(rows, '0.110.0'))).toEqual(['f.training', 'f.yeargoals', 'f.packblocks', 'f.quickstart', 'f.explain', 'f.strava', 'f.tripcheck']);
    expect(ids(newSince(rows, '0.108.0'))).toEqual(['f.training', 'f.yeargoals', 'f.packblocks', 'f.quickstart', 'f.explain', 'f.strava', 'f.tripcheck', 'f.news']);
    expect(newSince(rows, null)).toEqual([]);
    expect(ids(newSince(rows, '0.90.0'))).toEqual(['f.training', 'f.yeargoals', 'f.packblocks', 'f.quickstart', 'f.explain', 'f.strava', 'f.tripcheck', 'f.news', 'f.unneeded']);
    const never = neverTried(rows);
    expect(never.length).toBeLessThanOrEqual(3);
    for (const r of never) expect(r.play && !r.used).toBeTruthy();
  });
});

describe('all versions by month', () => {
  it('nothing lost, newest month first, each month one key', () => {
    const months = byMonth();
    expect(months.flatMap((m) => m.entries)).toEqual(WHATS_NEW);
    expect(months[0].key).toBe(WHATS_NEW[0].date.slice(0, 7));
    expect(new Set(months.map((m) => m.key)).size).toBe(months.length);
    expect(byMonth([{ date: '2026-10-12' }, { date: '2026-10-01' }, { date: '2026-09-30' }]).map((m) => [m.key, m.entries.length])).toEqual([
      ['2026-10', 2],
      ['2026-09', 1],
    ]);
  });
  it('the newest version has a name, one sentence and the steps to test it, in German too', () => {
    const e = WHATS_NEW[0];
    expect(DE[e.title]).toBeTruthy();
    expect(DE[e.lead]).toBeTruthy();
    expect(e.test.length).toBeGreaterThanOrEqual(2);
    for (const s of e.test) expect(DE[s], s).toBeTruthy();
  });
});

describe('the message after an update (I11b) and the tile «New» (I11e)', () => {
  const v = '0.110.0';
  const update = { v, from: '0.108.0', at: '2026-10-12' };
  it('comes at each start after the update until «Do not show again»; «Later» only for this start', () => {
    expect(showMessage({ update, mute: null, later: null, current: v })).toBe(true);
    expect(showMessage({ update, mute: v, later: null, current: v })).toBe(false);
    expect(showMessage({ update, mute: '0.108.0', later: null, current: v })).toBe(true); // the next update brings it back
    expect(showMessage({ update, mute: null, later: v, current: v })).toBe(false);
    expect(showMessage({ update: null, current: v })).toBe(false); // a first install
    expect(showMessage({ update: { ...update, v: '0.108.0' }, current: v })).toBe(false);
    expect(messageOn({ update, mute: null, current: v })).toBe(true);
    expect(messageOn({ update, mute: v, current: v })).toBe(false);
  });
  it('the tile stays 14 days, counted by the calendar (over the change to winter time too)', () => {
    expect(daysBetween('2026-10-12', '2026-10-26')).toBe(14);
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
    expect(tileDaysLeft(update, '2026-10-12', v)).toBe(TILE_DAYS);
    expect(tileDaysLeft(update, '2026-10-13', v)).toBe(13);
    expect(tileDaysLeft(update, '2026-10-25', v)).toBe(1);
    expect(tileDaysLeft(update, '2026-10-26', v)).toBe(0);
    expect(tileDaysLeft(null, '2026-10-13', v)).toBe(0);
    expect(tileDaysLeft({ ...update, v: '0.108.0' }, '2026-10-13', v)).toBe(0);
  });
  it('goes on top as a whole row and back where it stood, unless it was moved or taken away', () => {
    const wall = [{ id: 'trip', size: 'long' }, { id: 'important', size: 'l' }, { id: 'news', size: 'w' }, { id: 'play', size: 's' }];
    const { tiles, from } = pinNews(wall);
    expect(tiles[0]).toEqual({ id: 'news', size: 'long' });
    expect(tiles.length).toBe(wall.length);
    expect(from).toEqual({ i: 2, size: 'w' });
    expect(unpinNews(tiles, from)).toEqual(wall);
    // not on the wall before: added on top, away again afterwards
    const without = wall.filter((x) => x.id !== 'news');
    const p = pinNews(without);
    expect(p.from).toBe(null);
    expect(unpinNews(p.tiles, p.from)).toEqual(without);
    // changed by hand: it stays as it is
    expect(unpinNews([{ id: 'news', size: 'w' }, ...without], from)).toBe(null);
    expect(unpinNews(without, from)).toBe(null);
  });
});
