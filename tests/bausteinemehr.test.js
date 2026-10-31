// v0.154.0 «Bausteine mehr» (SN3h–SN3j, Noah 14.10.2026 «SN3h–SN3j freigegeben», answers 1a 2a 3a 4b 5a):
// the nine new blocks and their rules, the stages (4b), the example parts (1a) and the new parts with
// Rückgängig (2a), the groups of the page. Lists come from the app source. Fictional data only.
import './setup/de.js'; // this test needs the German texts
import 'fake-indexeddb/auto';
import { describe, it, expect, afterEach } from 'vitest';
import { SITUATION_BLOCKS, MORE_BLOCKS, STAGE_BLOCKS, STAGE_OF, stagesOf, BATHING_BLOCKS, RULE_BLOCKS, DEFAULT_RULES, NEED, ruleOf, rulesOf, tripFacts, ruleHit, situationHits, lossOf } from '../src/lib/situation.js';
import { ruleLine, hitBadge, dayRange } from '../src/lib/situationtext.js';
import { blockRows, FIT_ONLY } from '../src/lib/packblocks.js';
import { allSets, isBuiltIn, BUILT_IN } from '../src/lib/sets.js';
import { blockKind } from '../src/lib/gear/comes.js';
import { LOOSE } from '../src/lib/context.js';
import { MORE_PARTS, ALL_PARTS, BLOCK_GROUPS, OPEN_GROUPS, MORE_KEY, MORE_MARKER, NEW_DAYS, morePlan, blocksMore2026, newParts, undoMorePlan, undoMore } from '../src/lib/blocksmore.js';
import { undoBulk } from '../src/lib/gear/bulk.js';
import { createDb } from '../src/lib/db.js';
import { lang, num } from '../src/lib/i18n.svelte.js';
import DE from '../src/lib/i18n/de/index.js';
import { SETS } from '../src/lib/gear.js';

afterEach(() => (lang.v = 'en'));

const trip = (extra = {}) => ({ id: 't', title: 'test_data_gtp_ Runde', startDate: '2026-10-16', days: 1, overnight: 'none', sets: {}, entries: [], ...extra });
const hit = (key, t, rule = DEFAULT_RULES[key]) => ruleHit(key, ruleOf(key, rule), tripFacts(t));
const item = (id, extra = {}) => ({ id: `test_data_gtp_${id}`, name: `test_data_gtp_ ${id}`, category: 'tools', weightG: 100, qty: 1, ownership: 'owned', sets: [], domains: ['bikepacking'], ...extra });

describe('the new blocks and stages', () => {
  it('are built-in, have a kind, a rule and a German name', () => {
    expect(MORE_BLOCKS).toHaveLength(9);
    for (const k of [...MORE_BLOCKS, ...STAGE_BLOCKS]) {
      expect(isBuiltIn(k)).toBe(true);
      expect(blockKind(k)).toBe(MORE_BLOCKS.includes(k) ? 'situation' : 'stage');
      expect(ruleOf(k, null)).toMatchObject({ on: true });
      expect(RULE_BLOCKS).toContain(k);
    }
    lang.v = 'de';
    for (const s of allSets([]).filter((x) => FIT_ONLY.includes(x.key))) expect(s.name).not.toMatch(/\|/);
    expect(allSets([]).find((s) => s.key === 'coldHands').name).toBe('Kälte: Hände und Füsse');
    expect(stagesOf('cold')).toEqual(['coldHands', 'coldLayers', 'coldEvening']);
    expect(Object.values(STAGE_OF).every((p) => BUILT_IN.includes(p))).toBe(true);
  });
});

describe('the rules (README SN3h, table B7–B26)', () => {
  it('Gut schlafen: a night in a tent or bivouac', () => {
    expect(hit('sleepwell', trip({ overnight: 'outdoor', days: 2 }))).toEqual({ kind: 'sleepwell' });
    expect(hit('sleepwell', trip({ overnight: 'lodging', days: 2 }))).toBeNull();
  });
  it('Zwei Nächte and Hygiene: Pflege: from 2 nights', () => {
    expect(hit('twonights', trip({ overnight: 'lodging', days: 3 }))).toMatchObject({ kind: 'twonights', value: 2 });
    expect(hit('twonights', trip({ overnight: 'lodging', days: 2 }))).toBeNull();
    expect(hit('twonights', trip({ overnight: 'none', days: 3 }))).toBeNull(); // no night, no nights
    expect(hit('hygieneCare', trip({ overnight: 'outdoor', days: 3 }))).toMatchObject({ kind: 'hygieneCare' });
  });
  it('Abfahrt warm: from 1’200 m descent a day or a pass', () => {
    expect(hit('descent', trip({ route: { km: 90, gainM: 1300, lossM: 1250 } }))).toMatchObject({ kind: 'descent', value: 1250 });
    expect(hit('descent', trip({ route: { km: 90, gainM: 1300, lossM: 1199 } }))).toBeNull();
    expect(hit('descent', trip({ pass: true }))).toMatchObject({ kind: 'descent', by: 'pass' });
    // a route without lossM: the descent from the profile
    expect(lossOf({ profile: [[0, 600], [40, 2100], [80, 500]] })).toBe(1600);
    expect(hit('descent', trip({ route: { km: 80, profile: [[0, 600], [40, 2100], [80, 500]] } }))).toMatchObject({ value: 1600 });
  });
  it('Erholung danach: over 5 h or from 1’500 m climbing a day', () => {
    expect(hit('recovery', trip({ hours: 5.5 }))).toMatchObject({ kind: 'recovery', value: 5.5 });
    expect(hit('recovery', trip({ hours: 4, route: { km: 60, gainM: 1500 } }))).toEqual({ kind: 'recovery', by: 'gain', m: 1500 });
    expect(hit('recovery', trip({ hours: 4, route: { km: 60, gainM: 1499 } }))).toBeNull();
  });
  it('Glatt und nass: below 3 °C or snow (1 mm at 0 °C or colder)', () => {
    expect(hit('icy', trip({ wx: { min: 2, max: 8 } }))).toMatchObject({ kind: 'icy', value: 2 });
    expect(hit('icy', trip({ wx: { min: 3, max: 8 } }))).toBeNull();
    const forecast = { days: [{ date: '2026-10-16', min: 0, max: 4, rainMm: 2 }] };
    expect(hit('icy', trip({ forecast, wx: { min: 3, max: 8 } }, { ...DEFAULT_RULES.icy, limit: -5 }))).toEqual({ kind: 'icy', by: 'snow' });
  });
  it('Kurz ins Wasser: over 22 °C AND «See oder Fluss» by hand; Sauna und Bad and Kaltes Wasser by hand', () => {
    expect(NEED.swim).toBe('lake');
    expect(hit('swim', trip({ wx: { min: 15, max: 25 } }))).toBeNull(); // no lake tapped
    expect(hit('swim', trip({ wx: { min: 15, max: 25 }, bathe: ['lake'] }))).toMatchObject({ kind: 'swim', value: 25 });
    expect(hit('swim', trip({ wx: { min: 15, max: 22 }, bathe: ['lake'] }))).toBeNull();
    expect(hit('sauna', trip({ bathe: ['sauna'] }))).toEqual({ kind: 'sauna' });
    expect(hit('coldwater', trip({ bathe: ['cold'] }))).toEqual({ kind: 'coldwater' });
    expect(hit('coldwater', trip())).toBeNull();
  });
  it('Nasses trocken halten follows the other bathing blocks', () => {
    expect(situationHits(trip({ bathe: ['sauna'] }), []).drybag).toEqual({ kind: 'drybag' });
    expect(situationHits(trip(), []).drybag).toBeUndefined();
    // the bathing block switched off: nothing to follow
    expect(situationHits(trip({ bathe: ['sauna'] }), [{ key: 'sauna', rule: { on: false, metric: 'sauna' } }]).drybag).toBeUndefined();
    expect(BATHING_BLOCKS).toContain('drybag');
  });
  it('Kälte stages (4b): below 8 °C, below 0 °C, the evening only with a night', () => {
    const hits = situationHits(trip({ wx: { min: -1, max: 4 } }), []);
    expect(['cold', 'coldHands', 'coldLayers'].every((k) => hits[k])).toBe(true);
    expect(hits.coldEvening).toBeUndefined();
    expect(situationHits(trip({ wx: { min: 6, max: 12 } }), []).coldHands).toMatchObject({ value: 6 });
    expect(situationHits(trip({ wx: { min: 6, max: 12 } }), []).cold).toBeUndefined();
    expect(situationHits(trip({ overnight: 'lodging', days: 2, wx: { min: 9, max: 15 } }), []).coldEvening).toMatchObject({ value: 9 });
  });
  it('the stages of Kochen, Laden and Erste Hilfe', () => {
    expect(hit('cookWarm', trip({ overnight: 'outdoor', cook: true, days: 2, wx: { min: 8, max: 14 } }))).toMatchObject({ kind: 'cookWarm' });
    expect(hit('cookWarm', trip({ overnight: 'outdoor', cook: false, days: 2, wx: { min: 8, max: 14 } }))).toBeNull();
    expect(hit('chargeLong', trip({ overnight: 'outdoor', days: 3 }))).toMatchObject({ kind: 'chargeLong' });
    expect(hit('chargeLong', trip({ overnight: 'lodging', days: 3 }))).toBeNull(); // a hotel has power
    expect(hit('aidWinter', trip({ wx: { min: -2, max: 3 } }))).toMatchObject({ kind: 'aidWinter' });
  });
  it('a rule switched off never fits', () => {
    expect(hit('sleepwell', trip({ overnight: 'outdoor', days: 2 }), { on: false, metric: 'outdoor' })).toBeNull();
  });
  it('a saved rule lives on the block record (rulesOf)', () => {
    expect(rulesOf([{ key: 'recovery', rule: { on: true, metric: 'hours', cmp: 'gt', limit: 6, alt: 2000 } }]).recovery).toEqual({ on: true, metric: 'hours', cmp: 'gt', limit: 6, alt: 2000 });
  });
});

describe('the words', () => {
  it('Bausteine and Packen in German (mockups SN3h, SN3j)', () => {
    lang.v = 'de';
    expect(ruleLine('swim', DEFAULT_RULES.swim)).toBe('über 22 °C und am See oder Fluss');
    expect(ruleLine('twonights', DEFAULT_RULES.twonights)).toBe('ab 2 Nächten');
    expect(ruleLine('descent', DEFAULT_RULES.descent)).toBe(`ab ${num(1200)} Hm Abfahrt pro Tag oder ein Pass`);
    expect(ruleLine('recovery', DEFAULT_RULES.recovery)).toBe(`über 5 Std. Fahrzeit pro Tag oder ab ${num(1500)} Hm pro Tag`);
    expect(ruleLine('sleepwell', DEFAULT_RULES.sleepwell)).toBe('Übernachtung im Zelt oder Biwak');
    expect(ruleLine('coldEvening', DEFAULT_RULES.coldEvening)).toBe('unter 10 °C mit Nacht');
    expect(dayRange('2026-10-16', 3)).toMatch(/^Fr\.?–So\.?$/); // the short weekday comes from the runtime (a browser writes «Fr.»)
    expect(hitBadge(hit('twonights', trip({ overnight: 'lodging', days: 3 })))).toBe(`Vorschlag: ${dayRange('2026-10-16', 3)}, 2 Nächte`);
    expect(hitBadge(hit('descent', trip({ pass: true, route: { km: 70, gainM: 1600, lossM: 1594 } })))).toBe(`Vorschlag: Pass, ↓ ${num(1594)} m`);
    expect(hitBadge(hit('coldHands', trip({ wx: { min: 6, max: 12 } })))).toBe('Vorschlag: tiefste 6 °C');
    expect(hitBadge({ kind: 'drybag' })).toBe('Vorschlag: mit Baden');
  });
  it('every new block name has a German entry', () => {
    for (const k of FIT_ONLY) expect(DE[SETS[k]], k).toBeTruthy();
  });
});

describe('Packen (mockup SN3j)', () => {
  const items = [item('EAR', { sets: ['sleepwell'] }), item('SHIRT', { sets: ['twonights'] }), item('VEST', { sets: ['descent'] }), item('COLD', { sets: ['cold'] })];
  it('a new block shows only when it fits (dashed) or is on; the others stay out of the buttons', () => {
    const r = blockRows(trip({ overnight: 'lodging', days: 3, pass: true }), items, []);
    const keys = r.add.map((x) => x.key);
    expect(keys).toContain('twonights');
    expect(keys).toContain('descent');
    expect(keys).not.toContain('sleepwell'); // a hotel night: Gut schlafen does not fit, so it is not shown
    expect(keys).toContain('cold'); // the older blocks stay as before
    expect(r.add.find((x) => x.key === 'twonights').suggest).toMatchObject({ kind: 'twonights' });
    const on = blockRows(trip({ overnight: 'lodging', days: 1, sets: { sleepwell: true } }), items, []);
    expect(on.on.map((x) => x.key)).toContain('sleepwell');
  });
  it('4b: every Kälte stage is its own suggestion', () => {
    const its = [item('A', { sets: ['cold'] }), item('B', { sets: ['coldHands'] }), item('C', { sets: ['coldLayers'] })];
    const r = blockRows(trip({ wx: { min: -2, max: 3 } }), its, []);
    expect(r.add.filter((x) => x.suggest).map((x) => x.key)).toEqual(['cold', 'coldHands', 'coldLayers']);
  });
});

describe('the groups of Bausteine (Gesamtliste, 3a, 5a)', () => {
  it('cover every built-in block once, stages inside their block, Standard first in «Auf jeder Fahrt»', () => {
    const listed = Object.values(BLOCK_GROUPS).flat();
    expect(new Set(listed).size).toBe(listed.length);
    const rest = BUILT_IN.filter((k) => !listed.includes(k) && !STAGE_BLOCKS.includes(k));
    expect(rest).toEqual(LOOSE); // Verpflegung, Hygiene, Komfort: «Zum Dazunehmen»
    expect(BLOCK_GROUPS.every[0]).toBe('standard');
    expect(BLOCK_GROUPS.situation).toHaveLength(12);
    expect(SITUATION_BLOCKS.every((k) => BLOCK_GROUPS.situation.includes(k))).toBe(true);
    expect(BLOCK_GROUPS.bathing).toEqual(BATHING_BLOCKS);
    expect(OPEN_GROUPS).toEqual(['situation', 'bathing']);
  });
});

describe('example parts (1a) and new parts (2a)', () => {
  it('every new block and stage has example parts; names are generic and German too', () => {
    for (const k of [...MORE_BLOCKS, ...STAGE_BLOCKS]) expect(MORE_PARTS[k]?.length).toBeGreaterThan(0);
    for (const p of ALL_PARTS) expect(p.name && p.nameDe).toBeTruthy();
  });
  it('the plan reuses an item with the same name, never doubles, and makes the rest unclear and not weighed', () => {
    const items = [item('OWN', { name: 'Sunscreen', sets: ['hygiene'] }), item('GONE', { name: 'Tea', ownership: 'gone' }), item('DE', { name: 'test_data_gtp_ x', nameDe: 'ohrstöpsel' })];
    const plan = morePlan(items, { now: '2026-10-14T12:00:00.000Z' });
    const byId = new Map(plan.items.map((i) => [i.id, i]));
    expect(byId.get('test_data_gtp_OWN').sets).toEqual(['hygiene', 'hygieneCare']); // reused, its block added
    expect(byId.get('test_data_gtp_DE').sets).toEqual(['sleepwell']); // the German name counts too
    expect(byId.has('test_data_gtp_GONE')).toBe(false); // a gone item is not reused
    const made = plan.items.filter((i) => plan.created.includes(i.id));
    expect(new Set(made.map((i) => i.name)).size).toBe(made.length);
    expect(made.every((i) => i.ownership === 'unclear' && i.weightG == null && i.sources.startsWith('example parts'))).toBe(true);
    expect(made.find((i) => i.name === 'Tea').sets).toEqual(['coldwater', 'cookWarm']);
    expect(plan.added.hotel).toHaveLength(3);
    expect(plan.added.hygieneCare).toContain('test_data_gtp_OWN');
  });
  it('runs once on a device with data, never on an empty one; «+N neu» for 14 days; Rückgängig per block with Undo', async () => {
    const empty = createDb('more-empty');
    expect(await blocksMore2026(empty)).toBeNull();
    expect(await empty.items.count()).toBe(0);

    const db = createDb('more-run');
    await db.items.bulkPut([item('A')]);
    await db.trips.put({ id: 'test_data_gtp_t', title: 'test_data_gtp_ t', entries: [] });
    const plan = await blocksMore2026(db, { today: '2026-10-14' });
    expect(plan.created.length).toBe(ALL_PARTS.length);
    expect(await db.settings.get(MORE_MARKER)).toBeTruthy();
    expect(await blocksMore2026(db)).toBeNull(); // once
    const more = (await db.settings.get(MORE_KEY)).value;
    const items = await db.items.toArray();
    expect(newParts(more, 'hotel', items, '2026-10-14')).toHaveLength(3);
    expect(newParts(more, 'hotel', items, `2026-10-${14 + NEW_DAYS}`)).toEqual([]); // after 14 calendar days
    // one hotel part is on a trip: it stays as an item, only out of the block
    const cash = items.find((i) => i.name === 'Cash');
    await db.trips.put({ id: 'test_data_gtp_t', title: 'test_data_gtp_ t', entries: [{ itemId: cash.id, slot: 'body', qty: 1, packed: false }] });
    const before = await db.items.count();
    const snap = await undoMore(db, 'hotel');
    expect(snap.n).toBe(3);
    expect(await db.items.count()).toBe(before - 2);
    expect((await db.items.get(cash.id)).sets).toEqual([]);
    expect((await db.settings.get(MORE_KEY)).value.added.hotel).toBeUndefined();
    // the page's Undo puts everything back
    await undoBulk(db, snap);
    await db.settings.put(snap.more);
    expect(await db.items.count()).toBe(before);
    expect((await db.settings.get(MORE_KEY)).value.added.hotel).toHaveLength(3);
  });
  it('Rückgängig keeps an item the update made when it is in another block too', () => {
    const more = { at: '2026-10-14', added: { coldwater: ['X1'], cookWarm: ['X1'] }, created: ['X1'] };
    const items = [{ id: 'X1', name: 'Tea', sets: ['coldwater', 'cookWarm'] }];
    const r = undoMorePlan(more, 'coldwater', items);
    expect(r.drop).toEqual([]);
    expect(r.items[0].sets).toEqual(['cookWarm']);
    const r2 = undoMorePlan({ ...r.value }, 'cookWarm', r.items);
    expect(r2.drop).toEqual(['X1']);
  });
});
