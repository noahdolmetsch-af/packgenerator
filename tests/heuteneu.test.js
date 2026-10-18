// 0.155.0 «Heute neu geordnet» (HN4, Noah 14.10.2026 21:51 «1a 2a 3a 4b HN4 freigegeben»; HN4b 22:13):
// the new order of Heute, the migration of a stored wall, the trip card moving up (4b) and the small rules
// of the day card, Aktiv and the compact balance. Lists come from the app source. Fictional data only.
import { describe, it, expect } from 'vitest';
import { READY, TILE, REMOVED_0155, ADDED_0155, HEAD_0155, wallOf, wallRecord, toHN4, tripUp, catalog } from '../src/lib/home/tiles.js';
import { pinNews, unpinNews } from '../src/lib/know/wasneu.js';
import { tourNear, addDay, dayCardPart, lastActivity, nextFixed, challengeNow, bodyNow, feltSleep } from '../src/lib/home/heuteneu.js';
import { DAY_CLOCK } from '../src/lib/dayclock.js';
import { CATS } from '../src/lib/balance.js';
import DE from '../src/lib/i18n/de/index.js';

const TODAY = '2026-10-09';
const ids = (w) => w.map((x) => x.id);

describe('HN4: the order of Heute', () => {
  it('the ready wall: meditation, day card, Important today, Im Flow + balance, week + swim, the row of four, trip, Aktiv, small tiles, bikes, year', () => {
    const r = ids(READY);
    expect(r.slice(0, 3)).toEqual(HEAD_0155);
    // Tages-Check back (Noah 18.10.2026 «3 a und b», T3c): «Deine 15 Fragen» right after the balance
    expect(r.slice(3, 8)).toEqual(['flow', 'balance', 'questions', 'week', 'suggest']);
    expect(r.slice(8, 12)).toEqual(['month', 'series', 'yearago', 'milestones']);
    expect(r.slice(12, 14)).toEqual(['trip', 'aktiv']);
    expect(r.slice(-2)).toEqual(['bikes', 'year']);
    // sizes: the top three and the trip card and Aktiv over the whole row, Im Flow and the balance side by side
    for (const id of [...HEAD_0155, 'trip', 'aktiv']) expect(READY.find((x) => x.id === id).size, id).toBe('long');
    expect(READY.find((x) => x.id === 'balance').size).toBe('l');
    // the row of four wide tiles fills the 8 columns of a computer
    expect(READY.slice(8, 12).every((x) => x.size === 'w')).toBe(true);
    // between Aktiv and the bikes only small tiles
    expect(READY.slice(14, -2).every((x) => x.size === 's')).toBe(true);
    for (const x of READY) expect(TILE[x.id].sizes, x.id).toContain(x.size);
  });
  it('what the day card shows, «Tried it yet?» and «Next milestone» left the wall, but stay in the catalog', () => {
    const all = catalog().flatMap((a) => a.tiles.map((x) => x.id));
    for (const id of REMOVED_0155) {
      expect(ids(READY), id).not.toContain(id);
      expect(all, id).toContain(id);
    }
    expect(REMOVED_0155).toEqual(expect.arrayContaining(['try', 'nextms', 'morningcheck', 'fn:dayride', 'fn:trip', 'fn:wear', 'fn:wardrobe', 'fn:review', 'fn:debriefs', 'fn:km', 'fn:care']));
    expect(REMOVED_0155.length).toBe(11);
  });
});

describe('HN4: a wall stored before (v 4) gets the new order once, nothing lost', () => {
  const v4 = {
    v: 4,
    tiles: [
      { id: 'trip', size: 'long' },
      { id: 'important', size: 'l' },
      { id: 'strava', size: 'w' }, // added by hand: not on the ready wall
      { id: 'flow', size: 'l' },
      { id: 'morningcheck', size: 'l' },
      { id: 'try', size: 'l' },
      { id: 'meditation', size: 's' },
      { id: 'fn:dayride', size: 's' },
      { id: 'fn:weigh', size: 'w' },
      { id: 'helper', size: 's' },
      { id: 'year', size: 'long' },
    ],
  };
  it('the removed tiles go, the new ones come, the order and sizes are those of HN4', () => {
    const w = wallOf(v4);
    // Tages-Check back: «Deine 15 Fragen» comes once, after the balance or else after Im Flow (v < 6)
    expect(ids(w)).toEqual(['meditation', 'daycard', 'important', 'flow', 'questions', 'trip', 'aktiv', 'fn:weigh', 'helper', 'strava', 'year']);
    expect(w.find((x) => x.id === 'meditation').size).toBe('long');
    expect(w.find((x) => x.id === 'important').size).toBe('long');
    for (const id of REMOVED_0155) expect(ids(w)).not.toContain(id);
  });
  it('a tile added by hand keeps its place in the order (after the small tiles) and its size', () => {
    const w = toHN4([{ id: 'strava', size: 'l' }, { id: 'fn:gear', size: 's' }, { id: 'inbox', size: 's' }, { id: 'bikes', size: 'long' }]);
    expect(ids(w)).toEqual(['meditation', 'daycard', 'aktiv', 'fn:gear', 'inbox', 'strava', 'bikes']);
    expect(w.find((x) => x.id === 'strava')).toEqual({ id: 'strava', size: 'l' });
    expect(ids(w).indexOf('strava')).toBeLessThan(ids(w).indexOf('bikes'));
  });
  it('a tile taken away by hand before stays away; once stored as v 6 the wall is left as it is', () => {
    const w = wallOf(v4);
    expect(ids(w)).not.toContain('balance'); // the old wall had no balance (taken away)
    const v5 = wallRecord(w.filter((x) => x.id !== 'aktiv'));
    expect(v5.v).toBe(6);
    expect(ids(wallOf(v5))).toEqual(ids(w).filter((id) => id !== 'aktiv'));
    // moved by hand after that: stays moved
    const moved = wallRecord([w[3], ...w.filter((_, i) => i !== 3)]);
    expect(ids(wallOf(moved))[0]).toBe('flow');
  });
  it('without a stored wall: the ready wall of HN4', () => {
    expect(wallOf(null)).toEqual(READY);
  });
});

describe('HN4 4b: the trip card moves up on the day before a trip and on its days', () => {
  const trip = (id, startDate, extra = {}) => ({ id, title: `test_data_gtp_ ${id}`, startDate, days: 1, status: 'planned', entries: [], ...extra });
  it('tourNear: a trip tomorrow, or under way today; not one in two days, a test trip, a skipped or archived one', () => {
    expect(tourNear([trip('a', addDay(TODAY, 1))], TODAY)?.id).toBe('a');
    expect(tourNear([trip('b', TODAY)], TODAY)?.id).toBe('b');
    expect(tourNear([trip('c', addDay(TODAY, -1), { days: 3 })], TODAY)?.id).toBe('c');
    expect(tourNear([trip('d', addDay(TODAY, 2))], TODAY)).toBe(null);
    expect(tourNear([{ ...trip('e', addDay(TODAY, 1)), title: 'test_data_gtp_ TEST-Runde' }], TODAY)).toBe(null);
    expect(tourNear([trip('f', addDay(TODAY, 1), { skipped: true })], TODAY)).toBe(null);
    expect(tourNear([trip('g', addDay(TODAY, 1), { archivedAt: '2026-10-01' })], TODAY)).toBe(null);
    // calendar days across the change to winter time (25.10.2026)
    expect(addDay('2026-10-24', 1)).toBe('2026-10-25');
    expect(addDay('2026-10-25', 1)).toBe('2026-10-26');
  });
  it('tripUp: right under the day card; without it under the tiles on top; nothing when not near', () => {
    expect(ids(tripUp(READY, true)).slice(0, 4)).toEqual(['meditation', 'daycard', 'trip', 'important']);
    expect(tripUp(READY, false)).toBe(READY);
    const noCard = READY.filter((x) => x.id !== 'daycard');
    expect(ids(tripUp(noCard, true)).slice(0, 3)).toEqual(['meditation', 'important', 'trip']);
    const noTrip = READY.filter((x) => x.id !== 'trip');
    expect(tripUp(noTrip, true)).toBe(noTrip);
    // moved up by hand already: stays where it is
    const high = [{ id: 'trip', size: 'long' }, ...READY.filter((x) => x.id !== 'trip')];
    expect(tripUp(high, true)).toBe(high);
    // only the shown order moves: the same tiles, nothing lost
    expect(ids(tripUp(READY, true)).sort()).toEqual(ids(READY).sort());
  });
  it('«New» after an update stands under the tiles on top, and goes back after the 14 days', () => {
    const { tiles, from } = pinNews(READY, HEAD_0155);
    expect(ids(tiles).slice(0, 4)).toEqual([...HEAD_0155, 'news']);
    expect(tiles[3].size).toBe('long');
    expect(unpinNews(tiles, from, HEAD_0155)).toEqual(READY);
  });
});

describe('the day card, Aktiv and the compact balance', () => {
  it('the day card follows the one day clock (Nacht 22–6)', () => {
    expect(dayCardPart(DAY_CLOCK.morning)).toBe('morning');
    expect(dayCardPart(10)).toBe('morning');
    expect(dayCardPart(DAY_CLOCK.day)).toBe('day');
    expect(dayCardPart(DAY_CLOCK.evening)).toBe('evening');
    expect(dayCardPart(DAY_CLOCK.night)).toBe('night');
    expect(dayCardPart(3)).toBe('night');
  });
  it('the last activity and the next fixed date', () => {
    expect(lastActivity([])).toBe(null);
    expect(lastActivity([{ date: '2026-10-05', km: 30 }, { date: '2026-10-08', km: 41.6, hrAvg: 128, source: 'strava' }])).toEqual({ date: '2026-10-08', km: 42, hr: 128, source: 'strava' });
    const fixed = [{ actId: 'yoga', wd: 1, time: '18:00' }, { actId: 'gym', wd: 5, time: '07:00' }];
    // Friday 9 Oct 2026: at 06:00 the gym is still to come today, at 09:00 it is Monday's yoga
    expect(nextFixed(fixed, TODAY, '06:00')).toEqual({ actId: 'gym', day: TODAY, time: '07:00', wd: 5 });
    expect(nextFixed(fixed, TODAY, '09:00')).toEqual({ actId: 'yoga', day: '2026-10-12', time: '18:00', wd: 1 });
    expect(nextFixed([], TODAY)).toBe(null);
  });
  it('the running challenge with its count, the resting pulse of 7 days, the felt sleep; nothing invented', () => {
    const list = [{ id: 'c1', area: 'today', what: 'Swim', times: 5, from: '2026-10-05', until: '2026-10-11', doneOn: null, stopped: false }];
    const suggests = { today: { options: ['Swim', 'Sauna'], pick: 'Swim', ticks: { Swim: ['2026-10-04', '2026-10-06', '2026-10-08', '2026-10-09'] } } };
    expect(challengeNow(list, suggests, TODAY)).toMatchObject({ what: 'Swim', n: 3, times: 5, until: '2026-10-11' });
    expect(challengeNow([{ ...list[0], stopped: true }], suggests, TODAY)).toBe(null);
    expect(challengeNow(list, suggests, '2026-10-12')).toBe(null);
    const a = (day, qid, value, at = `${day}T07:00`) => ({ day, qid, value, at });
    const rows = [a('2026-10-01', 'koerper.ruhepuls', 60), a('2026-10-05', 'koerper.ruhepuls', 54), a('2026-10-08', 'koerper.ruhepuls', 51), a(TODAY, 'koerper.ruhepuls', 52), a(TODAY, 'erholung.schlaf', 7)];
    expect(bodyNow(rows, TODAY)).toEqual({ pulse: 52, lo: 51, hi: 54, days: [54, 51, 52], azm: null });
    expect(bodyNow([], TODAY)).toEqual({ pulse: null, lo: null, hi: null, days: [], azm: null });
    expect(feltSleep(rows, TODAY)).toBe(7);
    expect(feltSleep(rows, '2026-10-08')).toBe(null);
  });
  it('every inspiration (the tip of each balance area) and every new text has a German entry', () => {
    for (const c of CATS) expect(DE[c.tip], c.tip).toBeTruthy();
    for (const k of ['Day card · {part}', 'Morning|part', 'Day|part', 'Evening|part', 'Night|part', 'Set out for today', 'Idea for today|card', 'Base weight|box', '{bike}: {n} due', 'Inspiration', 'Challenge', 'Sleep last night', 'Last activity', 'Open Aktiv']) expect(DE[k], k).toBeTruthy();
    for (const id of ADDED_0155) {
      expect(DE[TILE[id].label], id).toBeTruthy();
      expect(DE[TILE[id].pitch], id).toBeTruthy();
    }
    expect(DE['{bike}: {n} due']).toBe('{bike}: {n} fällig');
  });
});
