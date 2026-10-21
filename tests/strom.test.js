import { describe, it, expect } from 'vitest';
import { partialCharge, hoursText, elapsedHours, stopCharge, setSource, addMode, updateMode, dropMode, moveMode, powerLine, SOURCES } from '../src/lib/strom.js';
import { isChargeable } from '../src/lib/charge.js';
import { powerRole } from '../src/lib/power.js';

describe('power values', () => {
  it('works out half and a quarter from the full charge', () => {
    expect(partialCharge(3)).toEqual({ full: 3, half: 1.2, quarter: 0.6 });
    expect(partialCharge('2,5')).toEqual({ full: 2.5, half: 1, quarter: 0.5 });
    expect(partialCharge('')).toBeNull();
  });
  it('writes hours readably', () => {
    expect(hoursText(0.5)).toBe('30 min');
    expect(hoursText(2.25)).toBe('2:15 h');
    expect(hoursText(null)).toBe('');
  });
  it('knows five sources and sets one per value', () => {
    expect(SOURCES.map((s) => s.key)).toEqual(['maker', 'test', 'measured', 'computed', 'assumed']);
    expect(setSource({ runH: 'maker' }, 'mah', 'test')).toEqual({ runH: 'maker', mah: 'test' });
    expect(setSource({ runH: 'maker' }, 'runH', '')).toEqual({});
  });
});

describe('the stopwatch', () => {
  it('measures the hours and keeps the plug', () => {
    expect(elapsedHours('2026-10-21T18:00:00Z', '2026-10-21T20:33:00Z')).toBe(2.6);
    expect(elapsedHours('2026-10-21T18:00:00Z', '2026-10-21T18:01:00Z')).toBe(0.1);
    const item = { chargeTimer: { startedAt: '2026-10-21T18:00:00Z', plug: 'wall' }, powerSrc: { runH: 'maker' } };
    expect(stopCharge(item, '2026-10-21T21:00:00Z')).toEqual({ chargeH: 3, chargePlug: 'wall', powerSrc: { runH: 'maker', chargeH: 'measured' }, chargeTimer: null });
    expect(stopCharge({}, '2026-10-21T21:00:00Z')).toBeNull();
  });
});

describe('light levels', () => {
  it('adds, changes, moves and drops levels', () => {
    let l = addMode([], ' Hoch ', '1.5', 'm1');
    l = addMode(l, 'Tief', 12, 'm2');
    l = addMode(l, '', 3, 'm3');
    expect(l).toEqual([{ id: 'm1', name: 'Hoch', h: 1.5 }, { id: 'm2', name: 'Tief', h: 12 }]);
    l = updateMode(l, 'm2', { name: 'Spar', h: '10' });
    expect(l[1]).toEqual({ id: 'm2', name: 'Spar', h: 10 });
    expect(updateMode(l, 'm2', { name: '  ' })[1].name).toBe('Spar');
    expect(moveMode(l, 1, 0).map((m) => m.id)).toEqual(['m2', 'm1']);
    expect(dropMode(l, 'm1').map((m) => m.id)).toEqual(['m2']);
  });
  it('sums the values in one line', () => {
    expect(powerLine({ mah: 5000, runH: 3, chargeH: 2.5, lightModes: [{}, {}] })).toBe('5000 mAh · lasts {n} h · charges {h} · {n} levels');
    expect(powerLine({})).toBe('');
  });
});

describe('repair kits are no devices', () => {
  it('a patch kit with a spare battery in its contents does not count', () => {
    const kit = { name: 'Patch kit Flickzeug-Beutel (Tire fix, Kleber, Schrauben, Batterie, Messer)', category: 'tools' };
    expect(isChargeable(kit)).toBe(false);
    expect(powerRole(kit)).toBeNull();
    expect(isChargeable({ name: 'Werkzeug-Set mit Akku-Lampe', category: 'tools' })).toBe(false);
    // a real device outside Electronics still counts
    expect(isChargeable({ name: 'Di2 Akku', category: 'tools' })).toBe(true);
    expect(isChargeable({ name: 'Powerbank 10000', category: 'tools' })).toBe(true);
  });
});

import { applySuggestion, suggestValues } from '../src/lib/gear/suggestvalues.js';
describe('suggested power values (L2)', () => {
  it('gives a base battery value and marks the taken power values as an assumption', () => {
    const sug = suggestValues('Frontlicht neu', []);
    expect(sug.values.mah).toBe(3200);
    const out = applySuggestion({ name: 'Frontlicht neu', runH: '5' }, sug.values);
    expect(out.runH).toBe('5');
    expect(out.mah).toBe(3200);
    expect(out.powerSrc).toEqual({ chargeH: 'assumed', mah: 'assumed' });
  });
});
