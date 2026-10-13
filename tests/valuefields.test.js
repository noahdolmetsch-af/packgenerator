import { describe, it, expect } from 'vitest';
import { VALUE_GROUPS, valueGroups, setValue, valueOf, toggleField, showAll, addOwnField, renameOwnField, removeOwnField, fieldsOf, stepValue } from '../src/lib/valuefields.js';

const bike = (x = {}) => ({ id: 'b1', name: 'Test Hardtail', type: 'hardtail', fit: { seatHeight: 745, pressureF: 1.8 }, parts: [], ...x });
const row = (b, stored, id) => valueGroups(b, stored, { all: true }).groups.flatMap((g) => g.rows).find((r) => r.id === id);

describe('valuefields: «Enter values» (Bugfix Dateneingabe D2–D4)', () => {
  it('lists the four groups with the bike values and counts the filled ones', () => {
    const page = valueGroups(bike(), null);
    expect(page.groups.map((g) => g.key)).toEqual(VALUE_GROUPS.map((g) => g.key));
    expect(row(bike(), null, 'fit:seatHeight').value).toBe(745);
    expect(page.filled).toBe(2);
    expect(page.total).toBeGreaterThan(10);
  });

  it('shows shock values only on a bike with a rear shock', () => {
    const ids = valueGroups(bike(), null).groups.flatMap((g) => g.rows.map((r) => r.id));
    expect(ids).toContain('fit:forkPressure');
    expect(ids).not.toContain('fit:shockPressure');
    const full = valueGroups(bike({ type: 'full' }), null).groups.flatMap((g) => g.rows.map((r) => r.id));
    expect(full).toContain('fit:shockPressure');
  });

  it('hides a field for all bikes only on the page, and «Show all» brings it back', () => {
    const s = toggleField(null, 'fit:seatHeight', false);
    expect(valueGroups(bike(), s).groups.flatMap((g) => g.rows).some((r) => r.id === 'fit:seatHeight')).toBe(false);
    expect(row(bike(), s, 'fit:seatHeight')).toMatchObject({ hidden: true, value: 745 });
    expect(valueGroups(bike({ id: 'b2' }), s).groups.flatMap((g) => g.rows).some((r) => r.id === 'fit:seatHeight')).toBe(false);
    expect(fieldsOf(showAll(s)).hidden).toEqual([]);
    expect(fieldsOf(toggleField(s, 'fit:seatHeight', true)).hidden).toEqual([]);
  });

  it('reads «1,8» as 1.8 in a number field and clears with an empty text', () => {
    const b = bike();
    const r = row(b, null, 'fit:pressureR');
    expect(setValue(b, r, '1,9').fit.pressureR).toBe(1.9);
    expect('seatHeight' in setValue(b, row(b, null, 'fit:seatHeight'), '').fit).toBe(false);
  });

  it('adds an own field to a group; every bike gets it empty, its value is stored on the bike', () => {
    const r = addOwnField(null, { name: 'Token Gabel', unit: 'Stück', num: true, group: 'susp' });
    expect(r.id).toBe('own:token-gabel');
    const f = row(bike(), r.fields, r.id);
    expect(f).toMatchObject({ own: true, label: 'Token Gabel', unit: 'Stück', value: null });
    const b = { ...bike(), ...setValue(bike(), f, '2') };
    expect(valueOf(b, f)).toBe(2);
    expect(valueGroups(b, r.fields).groups.find((g) => g.key === 'susp').rows.at(-1).id).toBe(r.id);
    expect(addOwnField(r.fields, { name: 'Token Gabel' }).id).toBe('own:token-gabel-2');
    expect(addOwnField(null, { name: '  ' })).toBeNull();
  });

  it('renames and deletes an own field; the value stays on the bike', () => {
    const r = addOwnField(null, { name: 'Token Gabel', group: 'susp' });
    expect(fieldsOf(renameOwnField(r.fields, r.id, 'Tokens')).own[0].name).toBe('Tokens');
    expect(fieldsOf(renameOwnField(r.fields, r.id, ' ')).own[0].name).toBe('Token Gabel');
    expect(fieldsOf(removeOwnField(r.fields, r.id)).own).toEqual([]);
  });

  it('steps 0.1 bar and 1 for the other units', () => {
    expect(stepValue(1.8, 'bar', 1)).toBe(1.9);
    expect(stepValue(1.8, 'bar', -1)).toBe(1.7);
    expect(stepValue(745, 'mm', 1)).toBe(746);
    expect(stepValue(null, 'mm', 1)).toBeNull();
  });
});
