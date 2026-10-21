// «Packliste aufräumen» (Noah 21.10.2026 «1b 2 3a 4 5a»): the rules (packrules) and the page's plan (packcleanup).
// Fictional items only.
import { describe, it, expect, afterEach } from 'vitest';
import { packRulesOf, setPackRules, isDayRide, isBigRide, byStdOrder, PACK_RULES_DEFAULT } from '../src/lib/packrules.svelte.js';
import { suggestPlan, applyPlan, standardNow, COLD_STEPS, CORE_LINES } from '../src/lib/packcleanup.js';
import { rideSets, contextEntries } from '../src/lib/context.js';
import { ridesIntoDark } from '../src/lib/blockplan.js';
import { rulesOf } from '../src/lib/situation.js';
import { standardEntries } from '../src/lib/trips.js';

afterEach(() => setPackRules(null));

const it_ = (id, name, f = {}) => ({ id, name, ownership: 'owned', role: null, sets: [], defaultBag: 'seat', domains: ['bikepacking'], ...f });
const items = [
  it_('J1', 'Rain jacket test', { sets: [] }),
  it_('J2', 'Down jacket test', { sets: ['coldEvening'] }),
  it_('L1', 'Mini lock cable', { sets: ['repair'] }),
  it_('L2', 'Chain lock spare links', { sets: ['repair'] }),
  it_('B1', 'Day backpack test', { category: 'docs' }),
  it_('G1', 'GPS bike computer edge', { sets: ['standard'] }),
  it_('HR', 'Garmin heart strap', { sets: ['standard'] }),
  it_('W1', 'Wallet with cash', { sets: ['standard'] }),
  it_('P1', 'Phone', { sets: ['standard'] }),
  it_('E1', 'Earphones in case', { sets: ['standard'] }),
  it_('F1', 'Water bottle 1 L', { sets: ['standard'] }),
  it_('K1', 'Keys', { sets: ['standard'] }),
  it_('T1', 'Spare tube', { sets: ['standard', 'repair'] }),
  it_('GEL', 'Gel', { sets: ['standard', 'food'] }),
  it_('JER', 'Jersey', { role: 'worn', defaultBag: 'body' }),
  it_('SKI', 'Ski shovel', { sets: ['standard'], domains: ['ski'] }),
  it_('FL', 'Front light', { sets: ['lights'] }),
  it_('HT', 'Head torch', { sets: ['lights'] }),
  it_('NK', 'Buff thin', {}),
  it_('GL', 'Gloves long', { sets: ['coldHands'] }),
  it_('ML', 'Midlayer yellow', {}),
  it_('TP', 'Track pants mid', { domains: ['everyday'] }),
  it_('TH', 'Thermal trousers', { sets: ['coldLayers'] }),
];

describe('packrules', () => {
  it('reads the saved value safely and changes nothing without it', () => {
    expect(packRulesOf(null)).toEqual({ ...PACK_RULES_DEFAULT });
    expect(packRulesOf({ dayOff: ['repair', 'cook', 7], darkBuffer: 999, lightAlways: 'yes', lightExtra: ['HT', 'HT'] })).toEqual({ dayOff: ['repair'], darkBuffer: 0, lightAlways: false, lightExtra: ['HT'], stdOrder: [] });
  });
  it('knows a day ride and a trip with a night or a race', () => {
    expect(isDayRide({ overnight: 'none', days: 1 })).toBe(true);
    expect(isDayRide({ days: 1 })).toBe(false); // an older trip without a known night
    expect(isBigRide({ overnight: 'none', days: 1, event: true })).toBe(true);
    expect(isBigRide({ overnight: 'lodging', days: 2 })).toBe(true);
    expect(isBigRide({ overnight: 'none', days: 1 })).toBe(false);
  });
  it('sorts «Always with you» in its order, the rest after it as before', () => {
    expect(byStdOrder([{ id: 'a' }, { id: 'b' }, { id: 'c' }], ['c', 'a']).map((x) => x.id)).toEqual(['c', 'a', 'b']);
    expect(byStdOrder([{ id: 'a' }, { id: 'b' }], []).map((x) => x.id)).toEqual(['a', 'b']);
  });
});

describe('the rules in the packing list', () => {
  const day = { overnight: 'none', days: 1 };
  it('Repair stays a button on a day ride (1b), comes with a night as before', () => {
    expect(rideSets(day)).toContain('repair');
    setPackRules({ dayOff: ['repair'] });
    expect(rideSets(day)).not.toContain('repair');
    expect(rideSets(day)).toContain('charge');
    expect(rideSets({ overnight: 'lodging', days: 2 })).toContain('repair');
  });
  it('Light always with a night or a race (3a), the head torch only then', () => {
    expect(rideSets({ overnight: 'lodging', days: 2 })).not.toContain('lights');
    setPackRules({ lightAlways: true, lightExtra: ['HT'] });
    expect(rideSets({ overnight: 'lodging', days: 2 })).toContain('lights');
    expect(rideSets({ ...day, event: true })).toContain('lights');
    expect(rideSets(day)).not.toContain('lights');
    const dark = contextEntries({ ...day, dark: true, entries: [] }, items).map((e) => e.itemId);
    expect(dark).toContain('FL');
    expect(dark).not.toContain('HT');
    const night = contextEntries({ overnight: 'lodging', days: 2, entries: [] }, items).map((e) => e.itemId);
    expect(night).toEqual(expect.arrayContaining(['FL', 'HT']));
  });
  it('early morning and evening count as dark with the buffer (3a)', () => {
    const place = { lat: 47.4, lon: 8.5 };
    const trip = { startDate: '2026-10-21', days: 1, hours: 4, rideStart: ['14:00'] }; // until 18:00, sunset about 18:25
    expect(ridesIntoDark(trip, place, () => 120, 0)).toBe(false);
    expect(ridesIntoDark(trip, place, () => 120, 30)).toBe(true);
    setPackRules({ darkBuffer: 30 });
    expect(ridesIntoDark(trip, place, () => 120)).toBe(true);
  });
  it('new trips list «Always with you» in its order', () => {
    setPackRules({ stdOrder: ['K1', 'P1'] });
    expect(standardEntries(items, {}, { overnight: false }).map((e) => e.itemId).slice(0, 2)).toEqual(['K1', 'P1']);
  });
});

describe('the plan of «Packliste aufräumen»', () => {
  it('suggests «Always with you» in Noah\'s order from your own things', () => {
    const p = suggestPlan(items, [], null);
    expect(p.std).toEqual(['J1', 'L1', 'B1', 'G1', 'W1', 'P1', 'E1', 'F1', 'K1']);
    expect(CORE_LINES.map((l) => l.key)).toEqual(['jacket', 'lock', 'backpack', 'computer', 'money', 'phone', 'earbuds', 'bottle', 'keys']);
    expect(p.dayOff).toEqual(['repair']);
    expect(p.darkBuffer).toBe(30);
    expect(p.lightAlways).toBe(true);
    expect(p.lightExtra).toEqual(['HT']);
    expect(p.cold.cold).toEqual({ limit: 12, ids: ['NK', 'GL', 'ML', 'TP'] });
    expect(p.cold.coldHands).toEqual({ limit: 8, ids: ['GL'] });
    expect(p.cold.coldLayers).toEqual({ limit: 4, ids: ['TH'] });
    expect(COLD_STEPS.map((s) => s.limit)).toEqual([12, 8, 4]);
  });
  it('applies it: Standard in and out of the bike area only, cold steps, rules; nothing deleted', () => {
    const p = suggestPlan(items, [], null);
    const r = applyPlan(p, items, [], null);
    const by = Object.fromEntries(r.items.map((i) => [i.id, i]));
    expect(by.J1.sets).toContain('standard');
    expect(by.T1.sets).toEqual(['repair']);
    expect(by.GEL.sets).toEqual(['food']);
    expect(by.HR.sets).toEqual([]);
    expect(by.SKI).toBeUndefined(); // a ski-only item keeps its Standard
    expect(by.JER).toBeUndefined(); // worn stays worn
    expect(by.TP.domains).toContain('bikepacking'); // chosen outside the bike area: it comes on a bike trip now
    expect(by.TP.sets).toEqual(['cold']);
    expect(r.items.length).toBeLessThan(items.length);
    expect(r.counts).toEqual({ stdIn: 3, stdOut: 3, cold: 4 });
    const rules = rulesOf(r.sets);
    expect(rules.cold.limit).toBe(12);
    expect(rules.coldHands.limit).toBe(8);
    expect(rules.coldLayers.limit).toBe(4);
    expect(r.rules).toEqual({ dayOff: ['repair'], darkBuffer: 30, lightAlways: true, lightExtra: ['HT'], stdOrder: p.std });
    const after = items.map((i) => by[i.id] ?? i);
    expect(standardNow(after).map((i) => i.id).sort()).toEqual([...p.std].sort());
  });
  it('starts from what is saved when you open it again', () => {
    const p = suggestPlan(items, [{ key: 'cold', rule: { on: true, metric: 'minC', cmp: 'lt', limit: 10 } }], { dayOff: ['charge'], darkBuffer: 45, lightAlways: false, lightExtra: ['FL'] });
    expect(p.cold.cold.limit).toBe(10);
    expect(p.dayOff).toEqual(['charge']);
    expect(p.darkBuffer).toBe(45);
    expect(p.lightAlways).toBe(false);
    expect(p.lightExtra).toEqual(['FL']);
  });
});
