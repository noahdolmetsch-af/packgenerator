// v0.33.0 (finding 5, stage 2 preparation): the one-time update blocks2026, the helpers that read
// old and new fields, and when an imported backup needs the update again. Fictional data only.
import { describe, it, expect } from 'vitest';
import {
  STANDARD, BLOCKS_MARKER, inStandard, isWorn, leaveHome, migrateItem, migrateTemplate, migrateAll,
  templateBlockKeys, blockOrder, needsBlocksUpdate, hasBlocksMarker, blocksRerunAfterImport,
} from '../src/lib/blocks2026.js';

const item = (id, f = {}) => ({ id, name: `test_data_gtp_ ${id}`, ownership: 'owned', role: null, sets: [], defaultBag: 'seat', ...f });

const ITEMS = [
  item('test_data_gtp_STD', { role: 'standard' }),
  item('test_data_gtp_ALW', { always: true }),
  item('test_data_gtp_WRN', { role: 'worn', defaultBag: 'body' }),
  item('test_data_gtp_WRN2', { role: 'worn', defaultBag: null }),
  item('test_data_gtp_WRNALW', { role: 'worn', always: true, defaultBag: 'body' }),
  item('test_data_gtp_OPT', { role: 'optional' }),
  item('test_data_gtp_NIGHT', { sets: ['sleep'] }),
  item('test_data_gtp_STDBASE', { role: 'standard', sets: ['base'] }),
  item('test_data_gtp_BODYLAYER', { defaultBag: 'body', coldBelow: 5 }),
  item('test_data_gtp_PLAIN'),
  item('test_data_gtp_NOSETS', { role: 'standard', sets: undefined }),
  item('test_data_gtp_ALWFALSE', { always: false, role: '' }),
];
const byId = (list, id) => list.find((i) => i.id === id);

describe('migrateItem', () => {
  it('role standard or always → sets gets standard; role and always stay', () => {
    const s = migrateItem(byId(ITEMS, 'test_data_gtp_STD'));
    expect(s.sets).toEqual([STANDARD]);
    expect(s.role).toBe('standard');
    const a = migrateItem(byId(ITEMS, 'test_data_gtp_ALW'));
    expect(a.sets).toEqual([STANDARD]);
    expect(a.always).toBe(true);
    expect(migrateItem(byId(ITEMS, 'test_data_gtp_STDBASE')).sets).toEqual(['base', STANDARD]);
    expect(migrateItem(byId(ITEMS, 'test_data_gtp_NOSETS')).sets).toEqual([STANDARD]);
  });

  it('role worn stays exactly as it is (coordinator correction): no standard, no defaultBag', () => {
    for (const id of ['test_data_gtp_WRN', 'test_data_gtp_WRN2']) expect(migrateItem(byId(ITEMS, id))).toBe(byId(ITEMS, id));
    expect(migrateItem(byId(ITEMS, 'test_data_gtp_WRN2')).defaultBag).toBeNull();
    // worn AND "On every trip": standard comes from always, the worn part is untouched
    const wa = migrateItem(byId(ITEMS, 'test_data_gtp_WRNALW'));
    expect(wa.sets).toEqual([STANDARD]);
    expect(wa.role).toBe('worn');
    expect(wa.defaultBag).toBe('body');
  });

  it('role optional → leaveHome: true, role stays; an explicit leaveHome is kept', () => {
    const o = migrateItem(byId(ITEMS, 'test_data_gtp_OPT'));
    expect(o.leaveHome).toBe(true);
    expect(o.role).toBe('optional');
    expect(o.sets).toEqual([]);
    const kept = item('test_data_gtp_OPT2', { role: 'optional', leaveHome: false });
    expect(migrateItem(kept)).toBe(kept);
  });

  it('nothing to do → the same object; never touches updatedAt or other fields', () => {
    for (const id of ['test_data_gtp_NIGHT', 'test_data_gtp_PLAIN', 'test_data_gtp_BODYLAYER', 'test_data_gtp_ALWFALSE']) expect(migrateItem(byId(ITEMS, id))).toBe(byId(ITEMS, id));
    const x = item('test_data_gtp_U', { role: 'standard', updatedAt: '2026-01-01T00:00:00.000Z', weightG: 120, note: 'n' });
    const { sets, ...rest } = migrateItem(x);
    const { sets: s0, ...rest0 } = x;
    expect(rest).toEqual(rest0);
    expect(migrateItem(null)).toBeNull();
  });

  it('idempotent: a second run changes nothing', () => {
    for (const i of ITEMS) {
      const once = migrateItem(i);
      expect(migrateItem(once)).toBe(once);
    }
  });

  it('does not change the input', () => {
    const before = structuredClone(ITEMS);
    ITEMS.forEach(migrateItem);
    expect(ITEMS).toEqual(before);
  });
});

describe('helpers read old and new fields: same answer before and after', () => {
  it('inStandard, isWorn, leaveHome', () => {
    const after = ITEMS.map(migrateItem);
    for (const [n, i] of ITEMS.entries()) {
      expect([i.id, inStandard(after[n])]).toEqual([i.id, inStandard(i)]);
      expect([i.id, isWorn(after[n])]).toEqual([i.id, isWorn(i)]);
      expect([i.id, leaveHome(after[n])]).toEqual([i.id, leaveHome(i)]);
    }
  });

  it('inStandard: role standard, always, or the block; not worn alone', () => {
    const yes = ['test_data_gtp_STD', 'test_data_gtp_ALW', 'test_data_gtp_WRNALW', 'test_data_gtp_STDBASE', 'test_data_gtp_NOSETS'];
    expect(ITEMS.filter(inStandard).map((i) => i.id)).toEqual(yes);
    expect(inStandard(item('test_data_gtp_NEW', { sets: [STANDARD] }))).toBe(true);
    expect(inStandard(null)).toBe(false);
  });

  it('isWorn: role worn only, exactly as today (a body layer is not worn)', () => {
    expect(ITEMS.filter(isWorn).map((i) => i.id)).toEqual(['test_data_gtp_WRN', 'test_data_gtp_WRN2', 'test_data_gtp_WRNALW']);
    expect(isWorn(undefined)).toBe(false);
  });

  it('leaveHome: role optional or the mark; an explicit false wins', () => {
    expect(ITEMS.filter(leaveHome).map((i) => i.id)).toEqual(['test_data_gtp_OPT']);
    expect(leaveHome(item('test_data_gtp_L', { leaveHome: true }))).toBe(true);
    expect(leaveHome(item('test_data_gtp_L', { role: 'optional', leaveHome: false }))).toBe(false);
  });
});

describe('templates get blocks', () => {
  const items = [
    ...ITEMS,
    item('test_data_gtp_R1', { sets: ['u-test-data-gtp-regen'] }),
    item('test_data_gtp_R2', { sets: ['u-test-data-gtp-regen'] }),
    item('test_data_gtp_GONE', { sets: ['u-test-data-gtp-regen'], ownership: 'gone' }),
    item('test_data_gtp_ODD', { sets: ['zzz-unknown'] }),
  ].map(migrateItem);
  const stdIds = items.filter((i) => i.sets?.includes(STANDARD)).map((i) => i.id);
  const tpl = (ids, f = {}) => ({ id: 'tpl-gtp', name: 'test_data_gtp_ T', entries: ids.map((itemId) => ({ itemId, slot: 'seat', qty: 1 })), ...f });
  const setsValue = [{ key: 'u-test-data-gtp-regen', name: 'test_data_gtp_ Rain' }];

  it('order: standard, built-in, own, then unknown keys', () => {
    const order = blockOrder(items, setsValue);
    expect(order[0]).toBe(STANDARD);
    expect(order.indexOf('sleep')).toBeLessThan(order.indexOf('u-test-data-gtp-regen'));
    expect(order.at(-1)).toBe('zzz-unknown');
  });

  it('only blocks fully contained (gone items do not count)', () => {
    expect(templateBlockKeys(tpl([...stdIds, 'test_data_gtp_R1', 'test_data_gtp_R2', 'test_data_gtp_PLAIN']), items, setsValue)).toEqual([STANDARD, 'base', 'u-test-data-gtp-regen']);
    expect(templateBlockKeys(tpl([...stdIds.slice(1), 'test_data_gtp_R1']), items, setsValue)).toEqual(['base']);
    // base: only STDBASE has it; it is in the standard ids → base is complete too
    expect(templateBlockKeys(tpl(stdIds), items, setsValue)).toEqual([STANDARD, 'base']);
    expect(templateBlockKeys(tpl(['test_data_gtp_ODD', 'test_data_gtp_NIGHT']), items, setsValue)).toEqual(['sleep', 'zzz-unknown']);
    expect(templateBlockKeys({ id: 'x' }, items)).toEqual([]);
  });

  it('entries and other fields stay; a template with blocks is not touched', () => {
    const t0 = tpl([...stdIds, 'test_data_gtp_PLAIN'], { hours: 2, setup: { seat: 'b' } });
    const t1 = migrateTemplate(t0, items, setsValue);
    expect(t1).not.toBe(t0);
    const { blocks, ...rest } = t1;
    expect(rest).toEqual(t0);
    expect(blocks).toEqual([STANDARD, 'base']);
    expect(migrateTemplate(t1, items, setsValue)).toBe(t1);
    const own = { ...t0, blocks: ['sleep'] };
    expect(migrateTemplate(own, items)).toBe(own);
  });
});

describe('migrateAll', () => {
  const templates = [{ id: 'tpl-gtp-a', name: 'test_data_gtp_ A', entries: [{ itemId: 'test_data_gtp_STD', slot: 'seat', qty: 1 }] }];
  it('changes what it must and returns the marker', () => {
    const out = migrateAll({ items: ITEMS, templates }, { now: '2026-10-08T08:00:00.000Z' });
    expect(out.changedItems).toEqual(['test_data_gtp_STD', 'test_data_gtp_ALW', 'test_data_gtp_WRNALW', 'test_data_gtp_OPT', 'test_data_gtp_STDBASE', 'test_data_gtp_NOSETS']);
    expect(out.changedTemplates).toEqual(['tpl-gtp-a']);
    expect(out.marker).toEqual({ key: BLOCKS_MARKER, value: '2026-10-08T08:00:00.000Z' });
    expect(out.items).toHaveLength(ITEMS.length);
  });

  it('idempotent: the second run changes nothing', () => {
    const once = migrateAll({ items: ITEMS, templates });
    const twice = migrateAll({ items: once.items, templates: once.templates });
    expect(twice.changedItems).toEqual([]);
    expect(twice.changedTemplates).toEqual([]);
    expect(twice.items).toEqual(once.items);
    expect(twice.templates).toEqual(once.templates);
    expect(needsBlocksUpdate(once)).toBe(false);
    expect(needsBlocksUpdate({ items: ITEMS, templates })).toBe(true);
  });

  it('empty data', () => {
    expect(migrateAll()).toMatchObject({ items: [], templates: [], changedItems: [], changedTemplates: [] });
    expect(migrateAll({ items: [], templates: null }).templates).toEqual([]);
  });
});

describe('old backups: when the update must run again', () => {
  const backup = (items, settings) => ({ app: 'pack-generator', schemaVersion: 4, tables: { items, settings } });
  const updated = migrateAll({ items: ITEMS, templates: [{ id: 'tpl-gtp-a', name: 'test_data_gtp_ A', entries: [] }] });
  const newSettings = [updated.marker, { key: 'templates', value: updated.templates }];

  it('marker found in settings rows', () => {
    expect(hasBlocksMarker(newSettings)).toBe(true);
    expect(hasBlocksMarker([])).toBe(false);
    expect(hasBlocksMarker(undefined)).toBe(false);
    expect(hasBlocksMarker([{ key: BLOCKS_MARKER, value: null }])).toBe(false);
  });

  it('an old file: run again, in both modes', () => {
    expect(blocksRerunAfterImport(backup(ITEMS, []), 'replace')).toEqual({ rerun: true, reason: 'old-data' });
    expect(blocksRerunAfterImport(backup(ITEMS, []), 'merge')).toEqual({ rerun: true, reason: 'old-data' });
  });

  it('an old template without blocks also needs the update', () => {
    const file = backup(updated.items, [updated.marker, { key: 'templates', value: [{ id: 'tpl-old', name: 'test_data_gtp_ Old', entries: [] }] }]);
    expect(blocksRerunAfterImport(file, 'merge')).toEqual({ rerun: true, reason: 'old-data' });
  });

  it('a file from after the update: nothing to do', () => {
    expect(blocksRerunAfterImport(backup(updated.items, newSettings), 'replace')).toEqual({ rerun: false, reason: null });
    expect(blocksRerunAfterImport(backup(updated.items, newSettings), 'merge')).toEqual({ rerun: false, reason: null });
  });

  it('replace with a file without the marker (nothing old in it): run again to set the marker', () => {
    expect(blocksRerunAfterImport(backup(updated.items, []), 'replace')).toEqual({ rerun: true, reason: 'no-marker' });
    expect(blocksRerunAfterImport(backup(updated.items, []), 'merge')).toEqual({ rerun: false, reason: null });
    expect(blocksRerunAfterImport(backup([], undefined), 'replace')).toEqual({ rerun: true, reason: 'no-marker' });
  });

  it('a broken file does not throw', () => {
    expect(blocksRerunAfterImport(null, 'merge')).toEqual({ rerun: false, reason: null });
    expect(blocksRerunAfterImport({}, 'replace')).toEqual({ rerun: true, reason: 'no-marker' });
  });
});

describe('template blocks only count bikepacking items', () => {
  it('a Standard item only for the weekend does not keep Standard out', () => {
    const items = [
      item('test_data_gtp_B1', { role: 'standard', domains: ['bikepacking'] }),
      item('test_data_gtp_W1', { role: 'standard', domains: ['weekend'] }),
    ].map(migrateItem);
    const tpl = { id: 'tpl-gtp-w', name: 'test_data_gtp_ W', entries: [{ itemId: 'test_data_gtp_B1', slot: 'seat', qty: 1 }] };
    expect(templateBlockKeys(tpl, items)).toEqual([STANDARD]);
  });
});
