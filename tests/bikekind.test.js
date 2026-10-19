// «Velo im Griff» #1009 (Noah 19.10.2026): a part template per bike kind (road bike, gravel, mountain bike).
// Fictional bikes only.
import { describe, it, expect } from 'vitest';
import { KINDS, STD_OFF, kindOf, kindFromType, normTemplates, partOn, setPartOn, addOwn, renameOwn, areaOwn, removeOwn, restoreOwn, moveOwn, resetKind, changed, ownOf, ownKey } from '../src/lib/bikekind.js';
import { defaultParts, ensureParts, PARTS, isBlank } from '../src/lib/care.js';

const keys = (parts) => parts.map((p) => p.key);

describe('the kind of a bike', () => {
  it('reads it from the type, the own choice wins, gravel without a hint', () => {
    expect(kindFromType('Rennvelo')).toBe('road');
    expect(kindFromType('Road')).toBe('road');
    expect(kindFromType('Gravel')).toBe('gravel');
    expect(kindFromType('Road / gravel')).toBe('gravel');
    expect(kindFromType('Hardtail')).toBe('mtb');
    expect(kindFromType('Full suspension')).toBe('mtb');
    expect(kindFromType('MTB')).toBe('mtb');
    expect(kindFromType('')).toBe(null);
    expect(kindOf({ type: 'Hardtail', kind: 'gravel' })).toBe('gravel');
    expect(kindOf({ type: 'Hardtail', kind: 'nonsense' })).toBe('mtb');
    expect(kindOf({})).toBe('gravel');
    expect(KINDS).toEqual(['road', 'gravel', 'mtb']);
  });
});

describe('the template of each kind', () => {
  it('gives a road bike no suspension, a gravel bike a fork, a mountain bike everything', () => {
    expect(keys(defaultParts({ kind: 'road' }))).not.toContain('fork');
    expect(keys(defaultParts({ kind: 'road' }))).toContain('chain');
    expect(keys(defaultParts({ kind: 'gravel' }))).toContain('fork');
    expect(keys(defaultParts({ kind: 'gravel' }))).not.toContain('shock');
    // shock and linkage only on a full suspension
    expect(keys(defaultParts({ kind: 'mtb', type: 'Hardtail' }))).toEqual(expect.arrayContaining(['fork']));
    expect(keys(defaultParts({ kind: 'mtb', type: 'Hardtail' }))).not.toContain('shock');
    expect(keys(defaultParts({ kind: 'mtb', type: 'Full suspension' }))).toEqual(expect.arrayContaining(['fork', 'shock', 'linkage']));
    for (const k of KINDS) for (const off of STD_OFF[k]) expect(partOn(null, k, off)).toBe(false);
  });

  it('switches parts on and off as a difference to the standard', () => {
    let tpl = setPartOn(null, 'road', 'fork', true);
    expect(tpl.road.add).toEqual(['fork']);
    expect(partOn(tpl, 'road', 'fork')).toBe(true);
    expect(keys(defaultParts({ kind: 'road' }, tpl))).toContain('fork');
    tpl = setPartOn(tpl, 'road', 'fork', false);
    expect(tpl.road).toEqual({ add: [], drop: [], own: [] });
    tpl = setPartOn(tpl, 'gravel', 'charger', false);
    expect(tpl.gravel.drop).toEqual(['charger']);
    expect(keys(defaultParts({ kind: 'gravel' }, tpl))).not.toContain('charger');
    expect(changed(tpl, 'gravel')).toBe(true);
    expect(changed(resetKind(tpl, 'gravel'), 'gravel')).toBe(false);
  });

  it('adds, renames, moves and removes own parts, Undo puts one back at its place', () => {
    let { templates: tpl, key } = addOwn(null, 'gravel', 'test_data_gtp_ Klingel', 'extras');
    expect(key).toBe('own-test-data-gtp-klingel');
    expect(ownKey(tpl, 'gravel', 'test_data_gtp_ Klingel')).toBe('own-test-data-gtp-klingel-2');
    tpl = addOwn(tpl, 'gravel', 'test_data_gtp_ Licht', 'cockpit').templates;
    expect(addOwn(tpl, 'gravel', '   ').key).toBe(null);
    tpl = renameOwn(tpl, 'gravel', key, 'test_data_gtp_ Glocke');
    expect(ownOf(tpl, 'gravel').map((p) => p.name)).toEqual(['test_data_gtp_ Glocke', 'test_data_gtp_ Licht']);
    tpl = areaOwn(tpl, 'gravel', key, 'cockpit');
    tpl = moveOwn(tpl, 'gravel', 0, 1);
    expect(ownOf(tpl, 'gravel').map((p) => p.key)).toEqual(['own-test-data-gtp-licht', key]);
    const parts = defaultParts({ kind: 'gravel' }, tpl);
    expect(parts.find((p) => p.key === key)).toMatchObject({ name: 'test_data_gtp_ Glocke', area: 'cockpit', tpl: true });
    const res = removeOwn(tpl, 'gravel', key);
    expect(ownOf(res.templates, 'gravel')).toHaveLength(1);
    expect(ownOf(restoreOwn(res.templates, 'gravel', res.part, res.at), 'gravel').map((p) => p.key)).toEqual(['own-test-data-gtp-licht', key]);
    // other kinds stay as they were
    expect(ownOf(tpl, 'road')).toEqual([]);
    expect(normTemplates({ road: { add: 'x' } }).road).toEqual({ add: [], drop: [], own: [] });
  });
});

describe('ensureParts never drops a part with data', () => {
  it('leaves out only empty parts the kind does not have', () => {
    const fork = { key: 'fork', model: '', history: [] };
    expect(isBlank(fork)).toBe(true);
    expect(isBlank({ key: 'fork', model: '', history: [], attrs: { travel: null } })).toBe(true);
    expect(isBlank({ key: 'fork', model: '', history: [], attrs: { travel: 40 } })).toBe(false);
    expect(isBlank({ key: 'fork', model: '', history: [], everyDays: null })).toBe(false); // own care setting
    const road = { id: 'test_data_gtp_road', kind: 'road', parts: [...defaultParts({ kind: 'gravel' })] };
    expect(keys(ensureParts(road))).not.toContain('fork');
    const withModel = { ...road, parts: road.parts.map((p) => (p.key === 'fork' ? { ...p, model: 'test_data_gtp_ Starrgabel' } : p)) };
    expect(keys(ensureParts(withModel))).toContain('fork');
    const withHistory = { ...road, parts: road.parts.map((p) => (p.key === 'fork' ? { ...p, history: [{ date: '2026-01-01', action: 'service', result: 'done' }] } : p)) };
    expect(keys(ensureParts(withHistory))).toContain('fork');
    // an own part from the import (not from the template) always stays
    const own = { ...road, parts: [...road.parts, { key: 'own-test-data-gtp-x', name: 'x', area: 'extras', model: '', history: [] }] };
    expect(keys(ensureParts(own))).toContain('own-test-data-gtp-x');
    // a template own part removed from the template: empty → hidden, with data → stays
    const tplPart = { key: 'own-test-data-gtp-y', name: 'y', area: 'extras', tpl: true, model: '', history: [] };
    expect(keys(ensureParts({ ...road, parts: [...road.parts, tplPart] }))).not.toContain('own-test-data-gtp-y');
    expect(keys(ensureParts({ ...road, parts: [...road.parts, { ...tplPart, model: 'm' }] }))).toContain('own-test-data-gtp-y');
    // every part of PARTS is in some template
    for (const p of PARTS.filter((x) => !x.legacy)) expect(KINDS.some((k) => partOn(null, k, p.key))).toBe(true);
  });
});
