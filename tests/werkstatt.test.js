import { describe, it, expect } from 'vitest';
import { chfOf, limitLines, withLimit, refundOf, similarProblems, HANDOVER_STEPS } from '../src/lib/werkstatt/werkstatt.js';
import { orderText } from '../src/lib/workshop.js';

describe('Werkstatt: cost limit in the order', () => {
  it('reads francs as typed', () => {
    expect(chfOf('250')).toBe(250);
    expect(chfOf("1'200")).toBe(1200);
    expect(chfOf('80.–')).toBe(80);
    expect(chfOf('12,50')).toBe(12.5);
    expect(chfOf('')).toBe(null);
    expect(chfOf('viel')).toBe(null);
  });
  it('adds one line before «Wann hätten Sie Zeit?»', () => {
    const text = orderText([{ de: 'Kette ersetzen', chf: 60 }], { bike: { name: 'test_data_gtp_Velo' } });
    expect(withLimit(text, {})).toBe(text);
    const out = withLimit(text, { limit: 200, call: true }).split('\n');
    const at = out.findIndex((l) => l.startsWith('Wann hätten'));
    expect(out[at - 1]).toContain('höchstens CHF 200');
    expect(out[at - 1]).toContain('vorher an');
    expect(limitLines({ call: true })[0]).toContain('vorher an');
    expect(limitLines({ limit: 90 })).toEqual(['Bitte höchstens CHF 90.']);
  });
});

describe('Werkstatt: refund on a visit', () => {
  it('keeps what you paid and what came back apart', () => {
    expect(refundOf({}, 100)).toBe(null);
    expect(refundOf({ refund: { chf: 40, from: 'Versicherung', got: false } }, 100)).toMatchObject({ chf: 40, open: true, back: 0, net: 100 });
    expect(refundOf({ refund: { chf: 40, got: true } }, 100)).toMatchObject({ open: false, back: 40, net: 60 });
    expect(refundOf({ refund: { chf: 40, got: true } }, null)).toMatchObject({ net: null });
  });
});

describe('Werkstatt: a problem seen before', () => {
  const all = [
    { id: 1, bikeId: 'a', task: 'Kette springt am Berg', status: 'done', logDate: '2026-05-01', statusDate: '2026-05-03', note: 'Kettenblatt ersetzt' },
    { id: 2, bikeId: 'b', task: 'Kette springt', status: 'done', logDate: '2026-06-01' },
    { id: 3, bikeId: 'a', task: 'Bremse quietscht', status: 'done', logDate: '2026-06-01' },
    { id: 4, bikeId: 'a', task: 'Kette rostet', status: 'open', logDate: '2026-06-01' },
  ];
  it('finds solved problems of the same bike with a telling word in common', () => {
    const now = { id: 9, bikeId: 'a', task: 'Die Kette springt wieder', status: 'open', logDate: '2026-10-01' };
    const out = similarProblems(now, all);
    expect(out.map((x) => x.task.id)).toEqual([1]);
    expect(out[0].shared).toBe(2);
    expect(similarProblems({ ...now, task: 'Licht flackert' }, all)).toEqual([]);
    expect(similarProblems({ ...now, logDate: '2026-04-01' }, all)).toEqual([]);
  });
});

describe('Werkstatt: handover', () => {
  it('has unique keys', () => {
    expect(new Set(HANDOVER_STEPS.map((s) => s.key)).size).toBe(HANDOVER_STEPS.length);
  });
});

describe('A warranty claim draft (UC-180-I2)', () => {
  it('collects bike, purchase, part, since and what, without empty lines', async () => {
    const { claimText } = await import('../src/lib/werkstatt/werkstatt.js');
    const text = claimText({ bikeName: 'test_data_gtp_ Gravel', bought: '2025-04-01', shop: 'test_data_gtp_ Laden', rows: [{ key: 'frame', label: 'Rahmen', end: '2030-04-01' }], claim: { part: 'frame', since: '2026-10-01', what: 'test_data_gtp_ knackt' } });
    expect(text.split('\n')).toEqual([
      'Warranty claim, draft',
      '',
      'Bike: test_data_gtp_ Gravel',
      'Bought on 2025-04-01 (test_data_gtp_ Laden)',
      'Part: Rahmen, warranty until 2030-04-01',
      'Since: 2026-10-01',
      'What happens: test_data_gtp_ knackt',
      '',
      'Receipt and photos attached. Please let me know how we go on.',
    ]);
    expect(claimText({ bikeName: 'x', claim: {} })).not.toContain('Part:');
  });
});
