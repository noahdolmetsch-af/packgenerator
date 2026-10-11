// v0.97.0 «Skitouren» (mockups A–E): the pure rules of the ski pages (src/lib/ski.js). Fictional data
// only (Piz Beispiel, Muster-Gipfel, Sam, Alex); dates are fixed calendar days.
import { describe, it, expect } from 'vitest';
import {
  SKI_GROUPS, skiGroupOf, GROUP_BY_CATEGORY, nextSkiTrip, lastWithoutNotes, inSeason, seasonId, seasonStats, checkGroups, checkCount, togglePacked,
  START_CHECKS, withStartChecks, turnTime, turnDue, parseDuration, durationText, companions, afterLearnings, learningsByGroup, groupOfText,
  CARE_TASKS, CARE_PHASES, careTasks, careState, careDue, careEntry, seasonHm, stravaFor, mergeStrava, WAX_EVERY,
} from '../src/lib/ski.js';
import { READY_BY_DOMAIN, newPackTrip } from '../src/lib/domains.js';
import { parseStravaCsv } from '../src/lib/kmbook.js';
import { learningsFor } from '../src/lib/debrief.js';
import DE from '../src/lib/i18n/de/index.js';

const item = (id, category, name, extra = {}) => ({ id, name, category, domains: ['ski'], ownership: 'owned', ...extra });
const ski = (id, startDate, extra = {}) => ({ id, domain: 'ski', title: `test_data_gtp_ ${id}`, startDate, days: 1, entries: [], ready: [], status: 'planned', ...extra });

describe('the five ski groups', () => {
  it('are in Noah\'s order, each with a German name', () => {
    expect(SKI_GROUPS.map((g) => g.key)).toEqual(['hardware', 'safety', 'clothing', 'protect', 'food']);
    expect(SKI_GROUPS.map((g) => DE[g.name])).toEqual(['Hardware & Aufstieg', 'Sicherheitsausrüstung', 'Bekleidung', 'Orientierung & Schutz', 'Verpflegung']);
  });

  it('an item\'s own group first, then LVS/Schaufel/Sonde by name, then its category', () => {
    expect(skiGroupOf(item('a', 'tools', 'Tourenski', { skiGroup: 'safety' }))).toBe('safety');
    expect(skiGroupOf(item('b', 'elec', 'LVS-Gerät'))).toBe('safety');
    expect(skiGroupOf(item('c', 'tools', 'Lawinenschaufel'))).toBe('safety');
    expect(skiGroupOf(item('d', 'tools', 'Probe', { nameDe: 'Lawinensonde 240 cm' }))).toBe('safety');
    for (const [cat, group] of [['tools', 'hardware'], ['shoes', 'hardware'], ['rain', 'clothing'], ['onbike', 'clothing'], ['offbike', 'clothing'], ['elec', 'protect'], ['hyg', 'protect'], ['sleep', 'protect'], ['food', 'food']]) {
      expect(skiGroupOf(item('x', cat, 'Muster-Teil')), cat).toBe(group);
      expect(GROUP_BY_CATEGORY[cat]).toBe(group);
    }
    expect(skiGroupOf(item('y', 'unknown', 'Muster-Teil'))).toBe('protect');
    expect(skiGroupOf(item('z', 'food', 'Tee', { skiGroup: 'nonsense' }))).toBe('food');
  });

  it('groups a trip\'s entries in that order and counts n of m; a tap toggles packed', () => {
    const items = [item('s1', 'tools', 'Tourenski'), item('s2', 'elec', 'LVS-Gerät'), item('s3', 'food', 'Thermosflasche'), item('s4', 'rain', 'Hardshell-Jacke')];
    const trip = ski('t', '2026-12-12', { entries: [{ itemId: 's3', slot: 'pack', qty: 1, packed: true }, { itemId: 's2', slot: 'body', qty: 1, packed: false }, { itemId: 's1', slot: 'pack', qty: 1, packed: true }, { itemId: 's4', slot: 'pack', qty: 1, packed: false }, { itemId: 'gone', slot: 'pack', qty: 1, packed: true }] });
    const groups = checkGroups(trip, items);
    expect(groups.map((g) => [g.key, g.packed, g.total])).toEqual([['hardware', 1, 1], ['safety', 0, 1], ['clothing', 0, 1], ['food', 1, 1]]);
    expect(checkCount(groups)).toEqual({ packed: 2, total: 4 });
    const next = togglePacked(trip.entries, 's2', 'body');
    expect(next.find((e) => e.itemId === 's2').packed).toBe(true);
    expect(next.filter((e) => e.packed).length).toBe(4);
    expect(togglePacked(next, 's2', 'body').find((e) => e.itemId === 's2').packed).toBe(false);
  });
});

describe('the next ski trip', () => {
  const today = '2026-12-10';
  it('the soonest from today on, not finished or skipped; else the last one; else none', () => {
    const trips = [
      ski('later', '2026-12-20'),
      ski('soon', '2026-12-13'),
      ski('skipped', '2026-12-11', { skipped: true }),
      ski('finished', '2026-12-10', { finished: '2026-12-10' }),
      ski('past', '2026-12-01'),
      { ...ski('bike', '2026-12-11'), domain: 'bikepacking' },
    ];
    expect(nextSkiTrip(trips, today)).toEqual({ trip: trips[1], upcoming: true });
    expect(nextSkiTrip([ski('a', '2026-11-20'), ski('b', '2026-12-01')], today)).toMatchObject({ trip: { id: 'b' }, upcoming: false });
    expect(nextSkiTrip([], today)).toBe(null);
    expect(nextSkiTrip([ski('today', today)], today)?.trip.id).toBe('today');
  });

  it('the last tour without notes for «Nach der Tour»', () => {
    const trips = [ski('a', '2026-12-01', { ski: { savedAt: '2026-12-01T18:00:00Z' } }), ski('b', '2026-12-05'), ski('c', '2026-12-20')];
    expect(lastWithoutNotes(trips, today)?.id).toBe('b');
    expect(lastWithoutNotes([trips[0]], today)).toBe(null);
  });
});

describe('the season', () => {
  it('runs from 1 November to 31 May', () => {
    for (const d of ['2026-11-01', '2026-12-24', '2027-01-15', '2027-05-31']) expect(inSeason(d), d).toBe(true);
    for (const d of ['2026-10-31', '2026-06-01', '2026-08-15']) expect(inSeason(d), d).toBe(false);
  });

  it('has an id like «2026/27»; October counts to the coming season', () => {
    expect(seasonId('2026-11-01')).toBe('2026/27');
    expect(seasonId('2027-03-01')).toBe('2026/27');
    expect(seasonId('2027-08-01')).toBe('2026/27');
    expect(seasonId('2026-10-11')).toBe('2026/27');
    expect(seasonId('2026-09-30')).toBe('2025/26');
    expect(seasonId('2099-12-01')).toBe('2099/00');
  });

  it('sums tours and metres climbed of the season from trip.ski', () => {
    const trips = [
      ski('a', '2026-12-05', { ski: { peak: 'Piz Beispiel', hm: 1350, savedAt: 'x' } }),
      ski('b', '2027-01-09', { ski: { peak: 'Muster-Gipfel', hm: '1180', savedAt: 'x' } }),
      ski('c', '2027-01-20'), // over, without notes: a tour, no metres
      ski('d', '2027-02-20'), // still to come
      ski('e', '2026-03-01', { ski: { hm: 900, savedAt: 'x' } }), // the season before
      ski('f', '2027-01-10', { skipped: true, ski: { hm: 500 } }),
    ];
    const s = seasonStats(trips, '2027-02-01');
    expect(s).toMatchObject({ id: '2026/27', tours: 3, hm: 2530 });
    expect(s.peaks.map((p) => p.name)).toEqual(['Muster-Gipfel', 'Piz Beispiel']);
    expect(seasonHm(trips, '2026/27', '2027-02-01')).toBe(2530);
  });
});
