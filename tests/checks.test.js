import { describe, it, expect } from 'vitest';
import { CHECK_KINDS, CHECKS_BY_DOMAIN, CHECK_LINKS, ALL_OF, checkKey, suggested, freshCheck, checkOf, checkCount, toggleCheck, removeCheck, addCheck, asStandard, differs, nextOpen, moveCheck, keepTicks, missingSuggestions, missedBefore, checkStats, lastWithOwn } from '../src/lib/checks.js';
import { TRIP_DOMAINS, BIKEPACKING } from '../src/lib/domains.js';
import de from '../src/lib/i18n/de/index.js';

// v0.106.0 «Bausteine bearbeiten» (Noah 1-5a, 12.10.2026): evening-before and after-trip checks.
describe('trip checks (eve, after)', () => {
  it('suggests a list for every trip area, every row in German', () => {
    for (const kind of CHECK_KINDS) {
      for (const d of TRIP_DOMAINS) {
        const rows = suggested(kind, d.key);
        expect(rows.length, `${kind} ${d.key}`).toBeGreaterThan(0);
        for (const r of rows) expect(de[r.label], r.label).toBeTruthy();
        expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
      }
    }
    expect(CHECKS_BY_DOMAIN.eve.ski.map((r) => r.id)).toContain('bulletin');
    expect(CHECKS_BY_DOMAIN.after.ski.map((r) => r.id)).toContain('skins');
    // v0.111.0 (mockup V4): every trip type has its own evening list
    const lists = TRIP_DOMAINS.map((d) => suggested('eve', d.key).map((r) => r.id).join('|'));
    expect(new Set(lists).size).toBe(lists.length);
    for (const d of TRIP_DOMAINS) expect(de[ALL_OF[d.key]], d.key).toBeTruthy();
    for (const l of Object.values(CHECK_LINKS)) expect(de[l.label], l.label).toBeTruthy();
  });

  it('keeps one standard per area, like the ready check', () => {
    expect(checkKey('eve', BIKEPACKING)).toBe('eveStandard');
    expect(checkKey('eve', undefined)).toBe('eveStandard');
    expect(checkKey('after', 'ski')).toBe('afterStandard.ski');
  });

  it('starts from the saved standard, else from the suggestion, nothing ticked', () => {
    expect(freshCheck('eve', 'ski').every((r) => r.done === false)).toBe(true);
    expect(freshCheck('eve', 'ski', [{ id: 'a', label: 'Mine' }])).toEqual([{ id: 'a', label: 'Mine', done: false }]);
    expect(freshCheck('eve', 'ski', [])).toEqual(freshCheck('eve', 'ski'));
  });

  it('shows the trip its own list once it has one, else a fresh one of its area', () => {
    const ski = { id: 't1', domain: 'ski', packs: [] };
    expect(checkOf(ski, 'after').map((r) => r.id)).toEqual(CHECKS_BY_DOMAIN.after.ski.map((r) => r.id));
    const own = [{ id: 'x', label: 'Own', done: true }];
    expect(checkOf({ ...ski, after: own }, 'after')).toBe(own);
    expect(checkOf({ ...ski, after: [] }, 'after')).toEqual([]);
  });

  it('ticks, removes and adds rows without touching the others', () => {
    const list = freshCheck('eve', 'hiking');
    const ticked = toggleCheck(list, list[0].id);
    expect(ticked[0].done).toBe(true);
    expect(checkCount(ticked)).toEqual({ done: 1, total: list.length });
    expect(toggleCheck(ticked, list[0].id)[0].done).toBe(false);
    expect(removeCheck(list, list[1].id).map((r) => r.id)).toEqual(list.filter((_, n) => n !== 1).map((r) => r.id));
    const added = addCheck(list, '  Buy bread  ', 1000);
    expect(added.at(-1)).toEqual({ id: 'own-rs', label: 'Buy bread', done: false });
    expect(addCheck(list, '   ')).toBe(list);
  });

  it('saves a list as a standard with stable ids and no ticks', () => {
    const std = asStandard([{ id: 'route', label: 'Route', done: true }, { id: 'own-1', label: 'Mine', done: false }], 36 ** 2);
    expect(std).toEqual([{ id: 'route', label: 'Route' }, { id: 'std-1-100', label: 'Mine' }]);
    expect(differs(freshCheck('eve', 'ski'), freshCheck('eve', 'ski'))).toBe(false);
    expect(differs(addCheck(freshCheck('eve', 'ski'), 'More'), freshCheck('eve', 'ski'))).toBe(true);
  });
});

// v0.111.0 Vorabend- und Schluss-Check (mockups V1–V6, Noah «v1-v4 ok» and «v5-6 ok», 12.10.2026)
describe('check sheet and editor (V1–V6)', () => {
  const list = [
    { id: 'a', label: 'A', done: true },
    { id: 'b', label: 'B', done: false },
    { id: 'c', label: 'C', done: false },
  ];

  it('names the next open row, or none when all are ticked', () => {
    expect(nextOpen(list).id).toBe('b');
    expect(nextOpen(list.map((r) => ({ ...r, done: true })))).toBeNull();
  });

  it('sorts a row to another place and leaves a wrong move alone', () => {
    expect(moveCheck(list, 0, 2).map((r) => r.id)).toEqual(['b', 'c', 'a']);
    expect(moveCheck(list, 2, 0).map((r) => r.id)).toEqual(['c', 'a', 'b']);
    expect(moveCheck(list, 0, 5)).toBe(list);
  });

  it('keeps the ticks of the rows that stay after an edit', () => {
    const draft = [list[2], list[0], { id: 'own-x', label: 'New', done: false }];
    expect(keepTicks(draft, list)).toEqual([
      { id: 'c', label: 'C', done: false },
      { id: 'a', label: 'A', done: true },
      { id: 'own-x', label: 'New', done: false },
    ]);
  });

  it('offers the suggested rows not in the list', () => {
    const ski = freshCheck('eve', 'ski');
    expect(missingSuggestions('eve', 'ski', ski)).toEqual([]);
    expect(missingSuggestions('eve', 'ski', removeCheck(ski, 'tea')).map((r) => r.id)).toEqual(['tea']);
  });

  it('finds what was missing on earlier trips of the same type, newest first, counted', () => {
    const trips = [
      { id: 'test_data_t1', domain: 'ski', startDate: '2026-02-20' },
      { id: 'test_data_t2', domain: 'ski', startDate: '2026-03-01' },
      { id: 'test_data_t3', domain: 'hiking', startDate: '2026-04-01' },
    ];
    const debriefs = [
      { tripId: 'test_data_t1', doneAt: '2026-02-21T18:00:00.000Z', missing: [{ id: 'm1', name: 'test_data_ Harscheisen' }] },
      { tripId: 'test_data_t2', doneAt: '2026-03-02T18:00:00.000Z', missing: [{ id: 'm2', name: 'test_data_ Harscheisen' }, { id: 'm3', name: 'test_data_ Mütze' }] },
      { tripId: 'test_data_t3', doneAt: '2026-04-02T18:00:00.000Z', missing: [{ id: 'm4', name: 'test_data_ Karte' }] },
    ];
    expect(missedBefore(trips, debriefs, 'ski')).toEqual([
      { name: 'test_data_ Harscheisen', at: '2026-03-02', n: 2 },
      { name: 'test_data_ Mütze', at: '2026-03-02', n: 1 },
    ]);
    // a row naming it already, and the trip itself, are left out
    expect(missedBefore(trips, debriefs, 'ski', [{ id: 'x', label: 'test_data_ Mütze einpacken' }]).map((m) => m.name)).toEqual(['test_data_ Harscheisen']);
    expect(missedBefore(trips, debriefs, 'ski', [], { except: 'test_data_t2' })).toEqual([{ name: 'test_data_ Harscheisen', at: '2026-02-21', n: 1 }]);
    expect(missedBefore(trips, debriefs, 'weekend')).toEqual([]);
  });

  it('counts how often a row was ticked on earlier trips of the type (V4)', () => {
    const trips = [
      { id: 'test_data_t1', domain: 'ski', startDate: '2026-02-20', eve: [{ id: 'bulletin', label: 'x', done: true }, { id: 'tea', label: 'y', done: false }] },
      { id: 'test_data_t2', domain: 'ski', startDate: '2026-03-01', eve: [{ id: 'bulletin', label: 'x', done: true }] },
      { id: 'test_data_t3', domain: 'ski', startDate: '2026-03-08' },
      { id: 'test_data_t4', domain: 'hiking', startDate: '2026-04-01', eve: [{ id: 'bulletin', label: 'x', done: true }] },
    ];
    expect(checkStats(trips, 'eve', 'ski')).toEqual({ bulletin: { done: 2, n: 2 }, tea: { done: 0, n: 1 } });
    expect(checkStats(trips, 'after', 'ski')).toEqual({});
    // a planned trip does not count yet
    expect(checkStats(trips, 'eve', 'ski', { before: '2026-03-01' })).toEqual({ bulletin: { done: 1, n: 1 }, tea: { done: 0, n: 1 } });
    expect(lastWithOwn(trips, 'eve', 'ski', '2026-03-01').id).toBe('test_data_t1');
    expect(lastWithOwn(trips, 'eve', 'ski').id).toBe('test_data_t2');
    expect(lastWithOwn(trips, 'after', 'ski')).toBeNull();
  });
});
