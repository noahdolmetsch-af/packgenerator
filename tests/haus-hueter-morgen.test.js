// Paket 4 (Noah 19.10.2026 «1a», «3a»): Haus-Check, Wohnungs-Hüter-Liste, Bereit für morgen. Fictional data only.
import { describe, it, expect } from 'vitest';
import { houseOf, houseLabel, addHouse, renameHouse, dropHouse, moveHouse, toggleHouse, resetHouse, doneOf, houseCount, houseValue, HOUSE_START } from '../src/lib/unterwegs/haus.js';
import { keeperOf, addKeeper, renameKeeper, dropKeeper, moveKeeper, keeperCode, readKeeper, keeperUrl, keeperValue, KEEPER_START } from '../src/lib/unterwegs/hueter.js';
import { eveningHints, startsTomorrow, nextDay } from '../src/lib/unterwegs/morgen.js';
import { eveningPayload, keysOf, FIELDS } from '../src/lib/helper/payload.js';
import { validate, buildRequest, TASK_NAMES } from '../api/_lib/helper.js';

describe('Haus-Check', () => {
  it('starts with the suggestions, shown through t; typed lines stay as typed', () => {
    const s = houseOf(undefined);
    expect(s.items.map((x) => x.key)).toEqual(HOUSE_START);
    expect(houseLabel(s.items[0], (k) => `DE:${k}`)).toBe('DE:Stove and oven off');
    const r = renameHouse(s, s.items[0].id, 'test_data_gtp_ Herd');
    expect(houseLabel(r.items[0], (k) => `DE:${k}`)).toBe('test_data_gtp_ Herd');
  });
  it('add, delete, move; empty text adds nothing', () => {
    let s = houseOf(undefined);
    expect(addHouse(s, '   ')).toBe(null);
    s = addHouse(s, 'test_data_gtp_ Storen', 'x1');
    expect(s.items.at(-1)).toEqual({ id: 'x1', text: 'test_data_gtp_ Storen' });
    s = moveHouse(s, s.items.length - 1, 0);
    expect(s.items[0].id).toBe('x1');
    expect(moveHouse(s, 0, 99)).toBe(s);
    s = dropHouse(s, 'x1');
    expect(s.items.some((x) => x.id === 'x1')).toBe(false);
  });
  it('ticks belong to one trip, delete removes the tick, reset clears', () => {
    let s = houseOf(undefined);
    s = toggleHouse(s, 't1', 'hs-0');
    s = toggleHouse(s, 't1', 'hs-1');
    expect(houseCount(s, 't1')).toEqual({ done: 2, all: HOUSE_START.length });
    expect(doneOf(s, 't2').size).toBe(0);
    s = toggleHouse(s, 't1', 'hs-1');
    expect([...doneOf(s, 't1')]).toEqual(['hs-0']);
    s = dropHouse(s, 'hs-0');
    expect(doneOf(s, 't1').size).toBe(0);
    s = toggleHouse(s, 't1', 'hs-2');
    expect(doneOf(resetHouse(s, 't1'), 't1').size).toBe(0);
    expect(houseValue(s).items[0]).toEqual({ id: 'hs-1', key: HOUSE_START[1] });
  });
});

describe('Wohnungs-Hüter-Liste', () => {
  it('edits like the house check', () => {
    let s = keeperOf(undefined);
    expect(s.items.map((x) => x.key)).toEqual(KEEPER_START);
    s = addKeeper(s, 'test_data_gtp_ Katze füttern', 'k1');
    s = renameKeeper(s, 'k1', 'test_data_gtp_ Katze am Morgen');
    s = moveKeeper(s, s.items.length - 1, 0);
    expect(s.items[0]).toEqual({ id: 'k1', text: 'test_data_gtp_ Katze am Morgen' });
    s = dropKeeper(s, 'k1');
    expect(keeperValue(s).items).toHaveLength(KEEPER_START.length);
  });
  it('the link carries the list (umlauts too) and reads back; a broken code gives null', () => {
    const code = keeperCode({ lines: ['Pflanzen giessen', 'Briefkasten leeren', ' '], note: 'test_data_gtp_ Schlüssel bei den Nachbarn', from: '2026-10-23', until: '2026-10-25' });
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(readKeeper(code)).toEqual({ lines: ['Pflanzen giessen', 'Briefkasten leeren'], note: 'test_data_gtp_ Schlüssel bei den Nachbarn', from: '2026-10-23', until: '2026-10-25' });
    expect(readKeeper('nonsense!')).toBe(null);
    expect(readKeeper(keeperCode({ lines: [] }))).toEqual({ lines: [], note: '', from: '', until: '' });
    expect(keeperUrl('https://example.org/app/#/ride/abfahrt', 'abc')).toBe('https://example.org/app/#/share/hueter/abc');
  });
});

describe('Bereit für morgen', () => {
  it('knows tomorrow', () => {
    expect(nextDay('2026-10-31')).toBe('2026-11-01');
    expect(startsTomorrow({ startDate: '2026-10-20' }, '2026-10-19')).toBe(true);
    expect(startsTomorrow({ startDate: '2026-10-19' }, '2026-10-19')).toBe(false);
    expect(startsTomorrow({}, '2026-10-19')).toBe(false);
  });
  it('hints from weather, packing list and parts; charging always', () => {
    const keys = (o) => eveningHints(o).map((h) => h.key);
    expect(keys({})).toEqual(['charge']);
    expect(keys({ wx: { min: 3, max: 30, rain: 'showers' }, open: ['a', 'b'], due: ['Kette'] })).toEqual(['cold', 'rain', 'hot', 'pack', 'bike', 'charge']);
    expect(eveningHints({ open: ['a', 'b', 'c', 'd'] })[0].vars).toEqual({ n: 4, names: 'a, b, c' });
    expect(eveningHints({ open: ['a'] })[0].text).toBe('Still to pack: {names}.');
  });
  it('the KI payload holds only allowed keys and no ids', () => {
    const trip = { id: 'secret-trip-id', title: 'test_data_gtp_ Jura', startDate: '2026-10-20', days: 2, wx: { min: 4, max: 12, rain: 'rain' }, entries: [{ itemId: 'i1' }], photo: 'data:x' };
    const p = eveningPayload(trip, { open: ['Regenjacke'], due: ['Kette'], learnings: [{ rule: 'kalt', action: 'Handschuhe' }], today: '2026-10-19', tomorrow: '2026-10-20' });
    for (const k of keysOf(p)) expect(FIELDS.has(k), k).toBe(true);
    expect(JSON.stringify(p)).not.toContain('secret-trip-id');
    expect(p.list).toEqual([{ name: 'Regenjacke' }]);
  });
  it('the server task: strict tool, answers checked and cut', () => {
    expect(TASK_NAMES).toContain('evening');
    expect(buildRequest('evening', {}).tools[0].strict).toBe(true);
    const out = validate('evening', {}, { hints: [{ text: ' Handschuhe  oben ', kind: 'weather' }, { text: 'x', kind: 'nope' }, { text: '' }, ...Array(6).fill({ text: 'y', kind: 'rest' })] });
    expect(out.hints).toEqual([{ text: 'Handschuhe oben', kind: 'weather' }, { text: 'x', kind: 'rest' }, { text: 'y', kind: 'rest' }]);
  });
});
