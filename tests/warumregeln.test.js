import { describe, it, expect } from 'vitest';
import { ruleCatalog, filterRules, toggleRule, whyLines, RULE_GROUPS } from '../src/lib/regeln.js';
import { rowReasons } from '../src/lib/reasons.js';
import { mostForgotten, togglePin, hideForgot, forgotPrefs } from '../src/lib/checks.js';
import { RULE_BLOCKS, DEFAULT_RULES, rulesOf } from '../src/lib/situation.js';
import { BANK_USABLE } from '../src/lib/power.js';
import { WAX_EVERY } from '../src/lib/ski.js';

const P = 'ZZTEST-';

describe('ruleCatalog', () => {
  it('lists every rule block, the packing rules, power and ski in the order of the groups', () => {
    const groups = ruleCatalog();
    expect(groups.map((g) => g.key)).toEqual(RULE_GROUPS.map((g) => g.key).filter((k) => k !== 'own'));
    const blocks = groups.find((g) => g.key === 'blocks').rules;
    expect(blocks.map((r) => r.key)).toEqual(RULE_BLOCKS);
    expect(blocks.every((r) => r.on === true && r.toggle === 'block' && r.when && r.source)).toBe(true);
  });

  it('takes its numbers from the modules that use them', () => {
    const groups = ruleCatalog({ rainLimit: 40 });
    const all = groups.flatMap((g) => g.rules);
    expect(all.find((r) => r.id === 'p.rain').when).toContain('40');
    expect(all.find((r) => r.id === 'w.bank').when).toContain(String(Math.round(BANK_USABLE * 100)));
    expect(all.find((r) => r.id === 's.wax').when.replace(/\D/g, '')).toBe(String(WAX_EVERY));
  });

  it('shows a changed limit, an own rule and what fits the next trip', () => {
    const setsValue = [
      { key: 'cold', rule: { ...DEFAULT_RULES.cold, limit: 9 } },
      { key: 'u-sauna-kit', name: 'Sauna kit', rule: { on: true, metric: 'minC', cmp: 'lt', limit: 20 } },
    ];
    const trip = { id: `${P}t`, days: 1, overnight: 'none', wx: { min: 3, max: 12, rain: 'none' } };
    const groups = ruleCatalog({ setsValue, trip });
    const cold = groups.find((g) => g.key === 'blocks').rules.find((r) => r.key === 'cold');
    expect(cold.when).toContain('9');
    expect(cold.active).toBe(true);
    expect(groups.find((g) => g.key === 'blocks').rules.find((r) => r.key === 'heat').active).toBe(false);
    const own = groups.find((g) => g.key === 'own').rules;
    expect(own.map((r) => r.name)).toEqual(['Sauna kit']);
    expect(own[0].active).toBe(true);
  });

  it('leaves out a deleted block', () => {
    const groups = ruleCatalog({ setsValue: [{ key: 'swim', deleted: true }] });
    expect(groups.find((g) => g.key === 'blocks').rules.some((r) => r.key === 'swim')).toBe(false);
  });

  it('follows «Tidy up the packing list»', () => {
    const on = ruleCatalog({ packValue: { dayOff: ['repair'], darkBuffer: 30, lightAlways: true } }).flatMap((g) => g.rules);
    const off = ruleCatalog().flatMap((g) => g.rules);
    expect(on.find((r) => r.id === 'p.repair').when).not.toBe(off.find((r) => r.id === 'p.repair').when);
    expect(on.find((r) => r.id === 'p.lights').when).toContain('30');
  });
});

describe('filterRules', () => {
  it('keeps the rules that hold every word, groups without a hit go', () => {
    const groups = ruleCatalog();
    expect(filterRules(groups, '')).toBe(groups);
    const hit = filterRules(groups, 'skins');
    expect(hit.map((g) => g.key)).toEqual(['ski']);
    expect(hit[0].rules.map((r) => r.id)).toEqual(['s.wax']);
    expect(filterRules(groups, 'zzz-nothing')).toEqual([]);
  });
});

describe('toggleRule', () => {
  it('switches a block rule off and on again, the limit stays', () => {
    const start = [{ key: 'cold', rule: { ...DEFAULT_RULES.cold, limit: 7 } }];
    const off = toggleRule(start, { toggle: 'block', key: 'cold' });
    expect(rulesOf(off).cold).toMatchObject({ on: false, limit: 7 });
    expect(rulesOf(toggleRule(off, { toggle: 'block', key: 'cold' })).cold).toMatchObject({ on: true, limit: 7 });
  });

  it('switches an own rule and leaves anything else as it is', () => {
    const start = [{ key: 'u-x', name: 'X', rule: { on: true, metric: 'maxC', cmp: 'gt', limit: 25 } }];
    expect(toggleRule(start, { toggle: 'own', key: 'u-x' })[0].rule.on).toBe(false);
    expect(toggleRule(start, { toggle: null, key: 'u-x' })).toBe(start);
  });
});

describe('whyLines', () => {
  const items = [
    { id: `${P}vest`, name: 'Vest', ownership: 'owned', coldBelow: 10 },
    { id: `${P}gel`, name: 'Gel', ownership: 'owned', role: 'standard', perHours: 2 },
  ];
  const trip = { id: `${P}t`, days: 1, hours: 6, overnight: 'none', wx: { min: 4, max: 12, rain: 'none' }, entries: [{ itemId: `${P}vest`, qty: 1 }, { itemId: `${P}gel`, qty: 3 }] };

  it('gives each reason with its rule and where to change it', () => {
    const reasons = rowReasons(trip, items);
    const vest = whyLines(items[0], reasons[`${P}vest`]);
    expect(vest).toHaveLength(1);
    expect(vest[0].rule).toContain('10');
    expect(vest[0].href).toBe(`#/gear?item=${encodeURIComponent(`${P}vest`)}`);
    const gel = whyLines(items[1], reasons[`${P}gel`]);
    expect(gel.map((l) => l.rule).join(' ')).toContain('2');
    expect(gel.at(-1).link).toBe('Change the amount');
  });

  it('is empty without a reason', () => {
    expect(whyLines(items[0], null)).toEqual([]);
    expect(whyLines(null, { parts: [{ kind: 'cold', text: 'x' }] })).toEqual([]);
  });

  it('names the block and its rule', () => {
    const lines = whyLines({ id: 'x', name: 'Cap' }, { parts: [{ kind: 'blocks', text: 'from Cold', keys: ['cold'] }] });
    expect(lines).toHaveLength(1);
    expect(lines[0].href).toBe('#/blocks');
    expect(lines[0].rule).toContain('5');
  });
});

describe('mostForgotten', () => {
  const trips = [
    { id: `${P}a`, domain: 'bikepacking', startDate: '2026-05-01' },
    { id: `${P}b`, domain: 'bikepacking', startDate: '2026-06-01' },
    { id: `${P}c`, domain: 'ski', startDate: '2026-02-01' },
  ];
  const debriefs = [
    { tripId: `${P}a`, doneAt: '2026-05-03', missing: [{ name: 'Sun cream' }, { name: 'Spoon' }] },
    { tripId: `${P}b`, doneAt: '2026-06-03', missing: [{ name: 'sun cream' }, { name: 'Lock' }] },
    { tripId: `${P}c`, doneAt: '2026-02-03', missing: [{ name: 'Goggles' }] },
  ];

  it('counts per trip type, the most often first', () => {
    const list = mostForgotten(trips, debriefs, 'bikepacking');
    expect(list.map((m) => m.key)).toEqual(['sun cream', 'lock', 'spoon']);
    expect(list[0].n).toBe(2);
    expect(mostForgotten(trips, debriefs, 'ski').map((m) => m.name)).toEqual(['Goggles']);
  });

  it('a pinned thing comes first, a hidden one goes', () => {
    const prefs = hideForgot(togglePin(null, 'Spoon'), 'lock');
    const list = mostForgotten(trips, debriefs, 'bikepacking', { prefs });
    expect(list.map((m) => m.key)).toEqual(['spoon', 'sun cream']);
    expect(list[0].pinned).toBe(true);
    expect(forgotPrefs(hideForgot(prefs, 'lock', false)).hidden).toEqual([]);
    expect(forgotPrefs(togglePin(prefs, 'spoon')).pinned).toEqual([]);
  });

  it('leaves out the trip itself and takes at most n', () => {
    expect(mostForgotten(trips, debriefs, 'bikepacking', { except: `${P}b` }).map((m) => m.key)).toEqual(['sun cream', 'spoon']);
    expect(mostForgotten(trips, debriefs, 'bikepacking', { n: 1 })).toHaveLength(1);
  });
});
