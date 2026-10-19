import { describe, it, expect } from 'vitest';
import { allSports, orderedSports, colorOf, COLORS, BASE_BLOCKS, blocksOf, sportCfg, toggleBlock, moveBlock, renameBlock, addExtra, removeExtra, addOwnBlock, removeOwnBlock, addableExtras, moveId, startOff } from '../src/lib/sportsbase.js';
import { SPORTS } from '../src/lib/sportlist.js';
import { seedActs } from '../src/lib/flow.js';

const acts = seedActs();
const domains = [{ key: 'ski', name: 'Ski touring' }, { key: 'own-x', name: 'Packraft', own: true, raw: true }, { key: 'hiking', name: 'Hiking', hidden: true }];

describe('Paket O: one list of all sports', () => {
  it('has the trip sports, own sports and the Aktiv activities without «Velo draussen»', () => {
    const list = allSports({ domains, acts });
    const ids = list.map((s) => s.id);
    for (const s of SPORTS.filter((x) => x.key !== 'hiking')) expect(ids).toContain(`trip:${s.key}`);
    expect(ids).not.toContain('trip:hiking'); // hidden in Ich › Listen
    expect(ids).toContain('trip:own-x');
    expect(ids).toContain('act:gym');
    expect(ids).toContain('act:meditation');
    expect(ids).not.toContain('act:bike');
    expect(list.find((s) => s.id === 'trip:own-x').raw).toBe(true);
    expect(list.find((s) => s.id === 'trip:gravel').bike).toBe(true);
  });
  it('keeps the person’s order, new sports after it', () => {
    const list = allSports({ domains: [], acts: acts.slice(0, 3) });
    const out = orderedSports(list, { _order: ['act:yoga', 'trip:ski'] });
    expect(out.slice(0, 2).map((s) => s.id)).toEqual(['act:yoga', 'trip:ski']);
    expect(out).toHaveLength(list.length);
    expect(moveId(['a', 'b', 'c'], 'c', 0)).toEqual(['c', 'a', 'b']);
    expect(moveId(['a', 'b', 'c'], 'a', 9)).toEqual(['b', 'c', 'a']);
  });
  it('gives every sport a colour, an own one wins, no two the same while colours are left', () => {
    const list = allSports({ domains: [], acts: acts.slice(0, 4) });
    const cols = list.map((s) => colorOf(s.id, list, {}));
    expect(new Set(cols).size).toBe(Math.min(list.length, COLORS.length));
    const cfg = { 'trip:gravel': { color: COLORS[5].hex } };
    expect(colorOf('trip:gravel', list, cfg)).toBe(COLORS[5].hex);
    expect(list.filter((s) => s.id !== 'trip:gravel').map((s) => colorOf(s.id, list, cfg))).not.toContain(COLORS[5].hex);
  });
});

describe('Paket O: the blocks of a sport (#190)', () => {
  it('every sport has the seven basic blocks, on', () => {
    const b = blocksOf('trip:ski', {});
    expect(b.slice(0, 7).map((x) => x.key)).toEqual(BASE_BLOCKS);
    expect(b.every((x) => x.on)).toBe(true);
  });
  it('Gym has training plans, Tennis lessons and matches, Fahrrad commuting and loops; indoor without weather', () => {
    expect(blocksOf('act:gym', {}).map((x) => x.key)).toContain('plans');
    expect(blocksOf('act:tennis', {}).map((x) => x.key)).toEqual(expect.arrayContaining(['lessons', 'matches']));
    expect(blocksOf('trip:cycling', {}).map((x) => x.key)).toEqual(expect.arrayContaining(['commute', 'loops']));
    expect(blocksOf('trip:gravel', {}).map((x) => x.key)).toContain('route');
    expect(blocksOf('trip:downhill', {}).map((x) => x.key)).toContain('protect');
    expect(startOff('act:gym')).toEqual(['weather']);
    expect(blocksOf('act:gym', {}).find((x) => x.key === 'weather').on).toBe(false);
    expect(blocksOf('act:tennis', {}).find((x) => x.key === 'weather').on).toBe(true);
  });
  it('switches, moves, renames and gives the name back', () => {
    let cfg = toggleBlock({}, 'trip:ski', 'pack');
    expect(blocksOf('trip:ski', cfg).find((x) => x.key === 'pack').on).toBe(false);
    cfg = toggleBlock(cfg, 'trip:ski', 'pack');
    expect(blocksOf('trip:ski', cfg).find((x) => x.key === 'pack').on).toBe(true);
    cfg = moveBlock(cfg, 'trip:ski', 'next', 0);
    expect(blocksOf('trip:ski', cfg)[0].key).toBe('next');
    cfg = renameBlock(cfg, 'trip:ski', 'next', 'Lessons learned');
    const n = blocksOf('trip:ski', cfg)[0];
    expect([n.name, n.raw]).toEqual(['Lessons learned', true]);
    cfg = renameBlock(cfg, 'trip:ski', 'next', '  ');
    expect(blocksOf('trip:ski', cfg)[0]).toMatchObject({ name: 'For next time', raw: false });
  });
  it('adds and removes extras and own blocks', () => {
    let cfg = addExtra({}, 'trip:ski', 'loops');
    expect(blocksOf('trip:ski', cfg).map((x) => x.key)).toContain('loops');
    expect(addableExtras('trip:ski', cfg)).not.toContain('loops');
    cfg = removeExtra(cfg, 'trip:ski', 'loops');
    expect(blocksOf('trip:ski', cfg).map((x) => x.key)).not.toContain('loops');
    const r = addOwnBlock(cfg, 'trip:ski', { name: 'Warm-up', type: 'notes' }, 'own-1');
    const own = blocksOf('trip:ski', r.cfg).find((x) => x.key === 'own-1');
    expect(own).toMatchObject({ name: 'Warm-up', raw: true, own: true, type: 'notes' });
    expect(addOwnBlock(cfg, 'trip:ski', { name: ' ' }).key).toBe(null);
    const renamed = renameBlock(r.cfg, 'trip:ski', 'own-1', 'Einwärmen');
    expect(blocksOf('trip:ski', renamed).find((x) => x.key === 'own-1').name).toBe('Einwärmen');
    const gone = removeOwnBlock(renamed, 'trip:ski', 'own-1');
    expect(blocksOf('trip:ski', gone).some((x) => x.key === 'own-1')).toBe(false);
  });
  it('a stored goal is kept only when it makes sense', () => {
    expect(sportCfg({ x: { goal: { count: 2, days: 7 } } }, 'x').goal).toEqual({ count: 2, days: 7 });
    expect(sportCfg({ x: { goal: { count: 0, days: 7 } } }, 'x').goal).toBe(null);
  });
});
