// «Wegweiser statt Katalog» PR 23: «Appears when …» on the page of every function that shows only in the right situation.
import { describe, it, expect } from 'vitest';
import { ERSCHEINT, SKIPPED, erscheintHier, pageOf } from '../src/lib/erscheint.js';
import { GAPS, HOME } from '../src/lib/know/heimat.js';
import { WHEN } from '../src/lib/know/wann.js';
import { DAYS } from '../src/lib/play.js';

const WHEN_IDS = Object.keys(GAPS).filter((id) => GAPS[id] === 'when');

describe('Appears when', () => {
  it('every situation function has a line or a reason to have none, and nothing else is listed', () => {
    for (const id of WHEN_IDS) expect(ERSCHEINT[id] || SKIPPED[id], id).toBeTruthy();
    for (const id of [...Object.keys(ERSCHEINT), ...Object.keys(SKIPPED)]) expect(WHEN_IDS, id).toContain(id);
    for (const id of Object.keys(ERSCHEINT)) expect(SKIPPED[id], id).toBeUndefined();
  });
  it('each line has its sentence, a page that is not Heute and a known example day', () => {
    for (const [id, e] of Object.entries(ERSCHEINT)) {
      expect(WHEN[id], id).toBeTruthy();
      expect(pageOf(HOME[id]), id).not.toBe('#/');
      if (e.play) expect(DAYS, id).toContain(e.play);
    }
  });
  it('a page shows its own functions only, never on Heute, and leaves out «Not for me»', () => {
    expect(erscheintHier('#/pack?day').map((e) => e.id)).toEqual(expect.arrayContaining(['f.laundry', 'f.morninglist']));
    expect(erscheintHier('#/pack').map((e) => e.id)).not.toContain('f.homecoming');
    expect(erscheintHier('#/')).toEqual([]);
    expect(erscheintHier('#/pack', { 'f.laundry': true }).map((e) => e.id)).not.toContain('f.laundry');
  });
});
