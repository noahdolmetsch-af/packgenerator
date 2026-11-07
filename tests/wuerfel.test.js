// «Abenteuer-Würfel» (Träume und Neuland N19, Noah 27.10.2026 «1-5 a»): rolls and the rule list.
import { describe, it, expect } from 'vitest';
import { DICE_RULES, diceCfg, rulesOf, hiddenRules, roll, lastRule, addRule, renameRule, deleteRule, hideRule } from '../src/lib/dreams/wuerfel.js';

const P = 'test_data_gtp_';

describe('rolls', () => {
  it('a rule in play, never the same twice in a row', () => {
    const a = roll(null, '2026-10-28', 0);
    expect(a.last).toEqual({ id: DICE_RULES[0].id, day: '2026-10-28' });
    const b = roll(a, '2026-10-28', 0);
    expect(b.last.id).toBe(DICE_RULES[1].id);
    expect(lastRule(b).text).toBe(DICE_RULES[1].text);
  });

  it('nothing in play: no roll', () => {
    let c = null;
    for (const r of DICE_RULES) c = hideRule(c, r.id);
    expect(rulesOf(c)).toEqual([]);
    expect(roll(c, '2026-10-28').last).toBe(null);
  });
});

describe('the list', () => {
  it('own rules: add, rename, delete; the last roll goes with a deleted rule', () => {
    let c = addRule(null, `  ${P}Nur Brücken `, 'o1');
    expect(rulesOf(c).at(-1)).toEqual({ id: 'o1', text: `${P}Nur Brücken`, own: true });
    c = renameRule(c, 'o1', `${P}Nur Holzbrücken`);
    expect(c.own[0].text).toBe(`${P}Nur Holzbrücken`);
    expect(addRule(c, '   ', 'o2')).toEqual(c);
    c = { ...c, last: { id: 'o1', day: '2026-10-28' } };
    c = deleteRule(c, 'o1');
    expect(c.own).toEqual([]);
    expect(c.last).toBe(null);
  });

  it('built-in rules: hide and show again', () => {
    let c = hideRule(null, 'gravel');
    expect(rulesOf(c).some((r) => r.id === 'gravel')).toBe(false);
    expect(hiddenRules(c).map((r) => r.id)).toEqual(['gravel']);
    c = hideRule(c, 'gravel', false);
    expect(hiddenRules(c)).toEqual([]);
    expect(diceCfg({ hidden: ['nope'], own: [{ id: '', text: 'x' }] })).toEqual({ hidden: [], own: [], last: null });
  });
});
