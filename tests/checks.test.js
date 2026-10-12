import { describe, it, expect } from 'vitest';
import { CHECK_KINDS, CHECKS_BY_DOMAIN, checkKey, suggested, freshCheck, checkOf, checkCount, toggleCheck, removeCheck, addCheck, asStandard, differs } from '../src/lib/checks.js';
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
