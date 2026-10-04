import { describe, it, expect } from 'vitest';
import { sharePayload, encodeShare, decodeShare } from '../src/lib/share.js';

describe('share a packing list as a link (answer 14)', () => {
  const trip = { title: '303 · October', startDate: '2026-10-15', days: 3, bike: 'Scott Scale', purpose: { seat: 'Sleep' }, entries: [] };
  const stats = {
    gearG: 5000, onMeG: 2000,
    zones: [
      { key: 'body', zone: { name: 'On me' }, bag: null, entries: [{ itemId: 'A', qty: 1 }] },
      { key: 'seat', zone: { name: 'Seat pack' }, bag: { name: 'Ortlieb' }, entries: [{ itemId: 'B', qty: 2 }] },
      { key: 'frame', zone: { name: 'Frame bag' }, bag: { name: 'Frame' }, entries: [] },
    ],
  };
  const items = { A: { name: 'Helmet', weightG: 263 }, B: { name: 'Socks', weightG: null } };
  it('keeps only names, amounts and weights, and survives the round trip', async () => {
    const p = sharePayload(trip, stats, items);
    expect(p.g).toEqual([['On me', [['Helmet', 1, 263]]], ['Sleep', [['Socks', 2, null]]]]);
    const text = await encodeShare(p);
    expect(text).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await decodeShare(text)).toEqual(p);
    expect(await decodeShare('broken!')).toBeNull();
  });
});
