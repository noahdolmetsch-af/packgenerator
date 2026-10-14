// SN3+ «Bausteine je nach Lage»: the seven rules, their edges, a switched-off block, the multi-day
// temperatures, the rule on the block's record, the suggestion in Packen and the backup. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect, afterEach } from 'vitest';
import { SITUATION_BLOCKS, DEFAULT_RULES, ruleOf, rulesOf, setRule, isDefaultRule, passes, tripFacts, ruleHit, situationHits, topOf, hoursOf } from '../src/lib/situation.js';
import { ruleLine, hitBadge } from '../src/lib/situationtext.js';
import { blockRows } from '../src/lib/packblocks.js';
import { allSets, isBuiltIn } from '../src/lib/sets.js';
import { blockKind } from '../src/lib/gear/comes.js';
import { createDb } from '../src/lib/db.js';
import { buildBackup, restoreBackup } from '../src/lib/backup.js';
import { lang, num } from '../src/lib/i18n.svelte.js';

afterEach(() => (lang.v = 'en'));

const trip = (extra = {}) => ({ id: 't', title: 'test_data_gtp_ Runde', startDate: '2026-10-10', days: 1, overnight: 'none', sets: {}, entries: [], ...extra });
const hit = (key, t, rule = DEFAULT_RULES[key]) => ruleHit(key, ruleOf(key, rule), tripFacts(t));
const off = (key) => ({ ...DEFAULT_RULES[key], on: false });

describe('the seven blocks', () => {
  it('are built-in, start empty, have their own kind and a standard rule', () => {
    expect(SITUATION_BLOCKS).toEqual(['cold', 'heat', 'climb', 'long', 'abroad', 'train', 'rain']);
    for (const k of SITUATION_BLOCKS) {
      expect(isBuiltIn(k)).toBe(true);
      expect(blockKind(k)).toBe('situation');
      expect(ruleOf(k, null)).toMatchObject({ on: true });
    }
    expect(allSets([]).filter((s) => SITUATION_BLOCKS.includes(s.key)).map((s) => s.name)).toEqual(['Cold', 'Heat', 'Pass & climbing', 'Long ride', 'Abroad', 'Train', 'Rain']);
  });
});

describe('the rules', () => {
  it('Kälte: below 5 °C, the edge 5 does not count', () => {
    expect(hit('cold', trip({ wx: { min: 4, max: 12 } }))).toEqual({ kind: 'cold', c: 4 });
    expect(hit('cold', trip({ wx: { min: 5, max: 12 } }))).toBeNull();
    expect(hit('cold', trip())).toBeNull(); // no weather: nothing known, nothing suggested
  });
  it('Hitze: above 28 °C, the edge 28 does not count', () => {
    expect(hit('heat', trip({ wx: { min: 18, max: 29 } }))).toEqual({ kind: 'heat', c: 29 });
    expect(hit('heat', trip({ wx: { min: 18, max: 28 } }))).toBeNull();
  });
  it('Kälte and Hitze: the lowest and highest forecast over all days of the trip (2a)', () => {
    const forecast = { days: [
      { date: '2026-10-09', min: -4, max: 30 }, // the day before: not on the trip
      { date: '2026-10-10', min: 8, max: 20 },
      { date: '2026-10-11', min: 3.4, max: 24 },
      { date: '2026-10-12', min: 9, max: 29.2 },
      { date: '2026-10-13', min: 1, max: 31 }, // the day after: not on the trip
    ] };
    const t3 = trip({ days: 3, forecast, wx: { min: 10, max: 15 } });
    expect(tripFacts(t3)).toMatchObject({ minC: 3, maxC: 29 });
    expect(hit('cold', t3)).toEqual({ kind: 'cold', c: 3 });
    expect(hit('heat', t3)).toEqual({ kind: 'heat', c: 29 });
    // one day only: the forecast of that day
    expect(tripFacts(trip({ forecast }))).toMatchObject({ minC: 8, maxC: 20 });
  });
  it('Pass & Höhenmeter: from 1’200 m a day, or the highest point from 1’500 m (3a), or the button (3b)', () => {
    const route = (gainM, top) => ({ km: 80, gainM, profile: [[0, 600], [40, top], [80, 650]] });
    expect(hit('climb', trip({ route: route(1200, 900) }))).toEqual({ kind: 'climb', by: 'gain', m: 1200 });
    expect(hit('climb', trip({ route: route(1199, 900) }))).toBeNull();
    expect(hit('climb', trip({ days: 2, route: route(2000, 900) }))).toBeNull(); // 1’000 m a day
    expect(hit('climb', trip({ route: route(400, 1500) }))).toEqual({ kind: 'climb', by: 'top', m: 1500 });
    expect(hit('climb', trip({ route: route(400, 1499) }))).toBeNull();
    expect(hit('climb', trip({ pass: true }))).toEqual({ kind: 'climb', by: 'pass' });
    expect(hit('climb', trip({ route: route(400, 1300) }), { ...DEFAULT_RULES.climb, alt: 1200 })).toMatchObject({ by: 'top' }); // the limit can change
    expect(topOf({ profile: [[0, null], [1, 812]] })).toBe(812);
  });
  it('Lange Fahrt: over 5 h a day, from Planen or else from the route', () => {
    expect(hit('long', trip({ hours: 5.5 }))).toEqual({ kind: 'long', h: 5.5 });
    expect(hit('long', trip({ hours: 5 }))).toBeNull();
    expect(hoursOf(trip({ route: { km: 96, gainM: 0 } }))).toBe(6); // 96 km at 16 km/h
    expect(hit('long', trip({ route: { km: 96, gainM: 0 } }))).toEqual({ kind: 'long', h: 6 });
    expect(hit('long', trip())).toBeNull(); // not known: no suggestion
  });
  it('Ausland: a country that is not Switzerland (4b)', () => {
    expect(hit('abroad', trip({ country: 'FR' }))).toEqual({ kind: 'abroad', country: 'FR' });
    expect(hit('abroad', trip({ country: 'CH' }))).toBeNull();
    expect(hit('abroad', trip())).toBeNull();
  });
  it('Zug: travel there by train', () => {
    expect(hit('train', trip({ arrival: 'train' }))).toEqual({ kind: 'train' });
    expect(hit('train', trip({ arrival: 'car' }))).toBeNull();
  });
  it('Regen: from 30 %, the edge counts; «rain» in Planen without a chance as before (5a)', () => {
    expect(hit('rain', trip({ wx: { rain: 'none', rainPct: 30 } }))).toEqual({ kind: 'rain', pct: 30 });
    expect(hit('rain', trip({ wx: { rain: 'none', rainPct: 29 } }))).toBeNull();
    expect(hit('rain', trip({ wx: { rain: 'showers' } }))).toEqual({ kind: 'rain', pct: null });
  });
  it('a switched-off block is never suggested', () => {
    const hot = trip({ wx: { min: -2, max: 33, rain: 'rain', rainPct: 90 }, country: 'IT', arrival: 'train', pass: true, hours: 9 });
    for (const k of SITUATION_BLOCKS) {
      expect(hit(k, hot)).not.toBeNull();
      expect(hit(k, hot, off(k))).toBeNull();
    }
  });
  it('compares lt, gt and gte', () => {
    expect([passes(4, 'lt', 5), passes(5, 'lt', 5), passes(6, 'gt', 5), passes(5, 'gt', 5), passes(5, 'gte', 5), passes(null, 'gte', 5)]).toEqual([true, false, true, false, true, false]);
  });
  it('another value on a block reports it as such', () => {
    expect(hit('cold', trip({ wx: { rain: 'none', rainPct: 80 } }), { on: true, metric: 'rainPct', cmp: 'gte', limit: 50 })).toEqual({ kind: 'cold', metric: 'rainPct', value: 80 });
  });
});

describe('the rule on the block’s record', () => {
  it('a broken value falls back to the standard; a yes/no rule keeps its kind', () => {
    expect(ruleOf('cold', { on: false, metric: 'nope', cmp: 'x', limit: 'a' })).toEqual({ on: false, metric: 'minC', cmp: 'lt', limit: 5 });
    expect(ruleOf('train', { metric: 'minC' })).toEqual({ on: true, metric: 'train' });
    expect(ruleOf('climb', { limit: 900 })).toEqual({ on: true, metric: 'gainM', cmp: 'gte', limit: 900, alt: 1500 });
  });
  it('setRule keeps name and amounts, the standard removes it again (Zurücksetzen)', () => {
    const v0 = [{ key: 'cold', name: 'test_data_gtp_ Frost', qty: { A1: 2 } }];
    const v1 = setRule(v0, 'cold', { on: true, metric: 'minC', cmp: 'lt', limit: 2 });
    expect(v1).toEqual([{ key: 'cold', name: 'test_data_gtp_ Frost', qty: { A1: 2 }, rule: { on: true, metric: 'minC', cmp: 'lt', limit: 2 } }]);
    expect(rulesOf(v1).cold.limit).toBe(2);
    expect(allSets(v1).find((s) => s.key === 'cold').rule.limit).toBe(2);
    expect(setRule(v1, 'cold', null)).toEqual(v0);
    // a block without a record gets one only for a changed rule, and loses it on reset
    const v2 = setRule([], 'train', { on: false, metric: 'train' });
    expect(v2).toEqual([{ key: 'train', rule: { on: false, metric: 'train' } }]);
    expect(setRule(v2, 'train', DEFAULT_RULES.train)).toEqual([]);
    expect(isDefaultRule('rain', DEFAULT_RULES.rain)).toBe(true);
  });
});

describe('the suggestion in Packen (SN3g)', () => {
  const item = (id, sets) => ({ id, name: `test_data_gtp_ ${id}`, weightG: 100, category: 'tools', ownership: 'owned', sets });
  const ITEMS = [item('c1', ['cold']), item('c2', ['cold']), item('h1', ['heat']), item('g1', ['u-regen']), item('w1', ['rain'])];
  const SETS = [{ key: 'u-regen', name: 'test_data_gtp_ Regen' }];
  const cold = trip({ wx: { min: 3, max: 14, rain: 'showers', rainPct: 40 } });

  it('a fitting block is a dashed suggestion with its reason, first in «Dazunehmen»; never on the trip by itself', () => {
    const r = blockRows(cold, ITEMS, SETS);
    expect(r.on.map((x) => x.key)).not.toContain('cold');
    expect(r.add.slice(0, 3).map((x) => [x.key, x.suggest])).toEqual([['cold', { kind: 'cold', c: 3 }], ['rain', { kind: 'rain', pct: 40 }], ['u-regen', { kind: 'rain', pct: 40 }]]);
    expect(r.add.find((x) => x.key === 'heat').suggest).toBeNull();
    expect(cold.entries).toEqual([]);
  });
  it('an empty block is never suggested', () => {
    expect(blockRows(trip({ arrival: 'train' }), ITEMS, SETS).add.some((x) => x.key === 'train')).toBe(false);
  });
  it('switched on it is «Dabei» and no suggestion', () => {
    const r = blockRows({ ...cold, sets: { cold: true } }, ITEMS, SETS);
    expect(r.on.find((x) => x.key === 'cold')).toMatchObject({ on: true, suggest: null });
  });
  it('the rule Regen switched off takes the own rain block’s suggestion too', () => {
    const r = blockRows(cold, ITEMS, setRule(SETS, 'rain', off('rain')));
    expect(r.add.find((x) => x.key === 'u-regen').suggest).toBeNull();
    expect(r.add.find((x) => x.key === 'rain').suggest).toBeNull();
    expect(r.add[0].key).toBe('cold');
  });
  it('the words', () => {
    lang.v = 'de';
    expect(ruleLine('cold', DEFAULT_RULES.cold)).toBe('unter 5\u00a0°C');
    expect(ruleLine('climb', DEFAULT_RULES.climb)).toBe(`ab ${num(1200)}\u00a0Hm pro Tag oder ein Pass`); // the thousands mark comes from the runtime (’ or ')
    expect(ruleLine('train', DEFAULT_RULES.train)).toBe('Anreise mit dem Zug');
    expect(hitBadge({ kind: 'cold', c: 3 })).toBe('Vorschlag: tiefste 3 °C');
    expect(hitBadge({ kind: 'climb', by: 'top', m: 1650 })).toBe(`Vorschlag: bis ${num(1650)} m ü. M.`);
    expect(hitBadge({ kind: 'long', h: 6.5 })).toBe('Vorschlag: etwa 6.5 h Fahrzeit pro Tag');
    expect(hitBadge({ kind: 'abroad', country: 'FR' })).toBe('Vorschlag: Tour in Frankreich');
  });
});

describe('backup', () => {
  it('keeps the trip fields and the rules', async () => {
    const db = createDb('sn3plus-a');
    await db.trips.put(trip({ pass: true, country: 'AT', arrival: 'train' }));
    await db.settings.put({ key: 'sets', value: setRule([], 'cold', { on: false, metric: 'minC', cmp: 'lt', limit: 2 }) });
    const file = JSON.parse(JSON.stringify(await buildBackup(db)));
    const other = createDb('sn3plus-b');
    await restoreBackup(other, file, 'replace');
    expect(await other.trips.get('t')).toMatchObject({ pass: true, country: 'AT', arrival: 'train' });
    expect(rulesOf((await other.settings.get('sets')).value).cold).toEqual({ on: false, metric: 'minC', cmp: 'lt', limit: 2 });
  });
});

describe('situationHits', () => {
  it('only the hits; no trip, none', () => {
    expect(Object.keys(situationHits(trip({ country: 'DE', arrival: 'train' }), []))).toEqual(['abroad', 'train']);
    expect(situationHits(null, [])).toEqual({});
  });
});
