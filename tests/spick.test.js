// «Velo im Griff» #327 (Noah 19.10.2026): «Werkstatt-Spick», the torque table with own rows and the breakdown steps.
import { describe, it, expect } from 'vitest';
import { TORQUE, BREAKDOWNS, normRows, readNm, addRow, changeRow, removeRow, restoreRow, moveRow } from '../src/lib/spick.js';
import DE from '../src/lib/i18n/de/veloimgriff.js';

describe('Werkstatt-Spick', () => {
  it('has the typical values and the breakdowns, every text in German', () => {
    expect(TORQUE.find((r) => r.key === 'stem').nm).toBe('5');
    expect(TORQUE.find((r) => r.key === 'axle').nm).toBe('12–15');
    expect(BREAKDOWNS.map((b) => b.key)).toEqual(['tubeless', 'tube', 'chain', 'hanger', 'brake', 'spoke', 'bolt']);
    const texts = [...TORQUE.flatMap((r) => [r.name, r.note].filter(Boolean)), ...BREAKDOWNS.flatMap((b) => [b.name, ...b.steps])];
    // the torque names may come from elsewhere (e.g. «Seatpost clamp» of the parts); the rest is in this file
    const missing = texts.filter((x) => !DE[x] && !['Seatpost clamp'].includes(x));
    expect(missing).toEqual([]);
  });

  it('reads Nm values and ranges', () => {
    expect(readNm('5')).toBe('5');
    expect(readNm('5 Nm')).toBe('5');
    expect(readNm('4,5')).toBe('4,5');
    expect(readNm('5-6')).toBe('5–6');
    expect(readNm('5 – 6 nm')).toBe('5–6');
    expect(readNm('')).toBe('');
    expect(readNm('6-5')).toBe(null);
    expect(readNm('fest')).toBe(null);
    expect(readNm('0')).toBe(null);
  });

  it('adds, changes, moves and removes own rows; Undo puts one back', () => {
    let rows = addRow([], 'test_data_gtp_ Vorbau', '5', 1);
    rows = addRow(rows, 'test_data_gtp_ Sattel', '8–10', 2);
    expect(addRow(rows, '  ')).toHaveLength(2);
    const [a, b] = rows;
    rows = changeRow(rows, a.id, { name: 'test_data_gtp_ Vorbau neu', nm: '6' });
    expect(rows[0]).toMatchObject({ name: 'test_data_gtp_ Vorbau neu', nm: '6' });
    expect(changeRow(rows, a.id, { name: ' ' })[0].name).toBe('test_data_gtp_ Vorbau neu');
    rows = moveRow(rows, 0, 1);
    expect(rows.map((r) => r.id)).toEqual([b.id, a.id]);
    const res = removeRow(rows, b.id);
    expect(res.rows.map((r) => r.id)).toEqual([a.id]);
    expect(restoreRow(res.rows, res.row, res.at).map((r) => r.id)).toEqual([b.id, a.id]);
    expect(normRows([{ id: 1 }, null, { id: 'x', name: 'y', nm: 5 }])).toEqual([{ id: 'x', name: 'y', nm: '5' }]);
  });
});
