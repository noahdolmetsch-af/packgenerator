// «Aus TWINT teilen» (mockup QR6, Noah 14.10.2026 04:00 «a»): what the app takes from the text of a
// TWINT screenshot and which invoice it suggests. Fictional texts only; the reader itself is faked.
import { describe, it, expect, vi } from 'vitest';
import { parseTwintText, matchShot, readShotText } from '../src/lib/pay/twintshot.js';

describe('reading a TWINT screenshot', () => {
  it('finds amount, invoice number and sender in typical texts', () => {
    expect(parseTwintText('Bildschirmfoto\n+ 80.00 CHF\nvon Mia B.\nMitteilung: R-0317')).toEqual({ amount: 8000, no: 'R-0317', from: 'Mia B.' });
    expect(parseTwintText('CHF 1’250.50 erhalten\nNachricht: r0042')).toMatchObject({ amount: 125050, no: 'R-0042' });
    expect(parseTwintText('Geld erhalten 80.– CHF')).toMatchObject({ amount: 8000, no: null });
    expect(parseTwintText('CHF 12,50')).toMatchObject({ amount: 1250 });
    expect(parseTwintText('nichts Brauchbares')).toEqual({ amount: null, no: null, from: '' });
  });
  it('suggests the invoice by number first, else the only one with that amount', () => {
    const list = [
      { id: 'a', no: 'R-0317', amount: 8000, status: 'open' },
      { id: 'b', no: 'R-0318', amount: 8000, status: 'open' },
      { id: 'c', no: 'R-0319', amount: 500, status: 'open' },
      { id: 'd', no: 'R-0320', amount: 2500, status: 'paid' },
    ];
    expect(matchShot({ no: 'R-0318', amount: 8000 }, list)).toMatchObject({ inv: { id: 'b' }, how: 'no' });
    expect(matchShot({ no: null, amount: 500 }, list)).toMatchObject({ inv: { id: 'c' }, how: 'amount' });
    expect(matchShot({ no: null, amount: 8000 }, list)).toMatchObject({ inv: null, how: 'many' });
    expect(matchShot({ no: 'R-0320', amount: 2500 }, list)).toMatchObject({ inv: null, how: 'none' });
  });
  it('loads the reader once and reads on the device', async () => {
    const recognize = vi.fn(async () => ({ data: { text: '+ 5.00 CHF' } }));
    const load = vi.fn(async () => ({ default: { createWorker: async () => ({ recognize }) } }));
    expect(await readShotText('pic1', load)).toBe('+ 5.00 CHF');
    expect(await readShotText('pic2', load)).toBe('+ 5.00 CHF');
    expect(load).toHaveBeenCalledTimes(1);
    expect(recognize).toHaveBeenCalledTimes(2);
  });
});
