import { describe, it, expect } from 'vitest';
import { zaehle, ampel, GRUEN_BIS, GELB_BIS, JOBS_PRO_PR } from '../scripts/schlange.mjs';

describe('schlange: the light before the label «ok»', () => {
  it('counts waiting and running jobs, not finished or skipped ones', () => {
    const jobs = [
      { status: 'queued' }, { status: 'queued' }, { status: 'waiting' }, { status: 'pending' },
      { status: 'in_progress' }, { status: 'completed', conclusion: 'skipped' }, { status: 'completed', conclusion: 'success' },
    ];
    expect(zaehle(jobs)).toEqual({ wartend: 4, laufend: 1, offen: 5 });
    expect(zaehle([])).toEqual({ wartend: 0, laufend: 0, offen: 0 });
  });
  it('is green below the limit and says how many pull requests may get «ok»', () => {
    expect(ampel(0).farbe).toBe('gruen');
    expect(ampel(0).frei).toBe(Math.floor(GRUEN_BIS / JOBS_PRO_PR));
    expect(ampel(GRUEN_BIS - 1)).toMatchObject({ farbe: 'gruen', frei: 1 });
  });
  it('is yellow, then red, and allows no «ok» then', () => {
    expect(ampel(GRUEN_BIS)).toMatchObject({ farbe: 'gelb', frei: 0 });
    expect(ampel(GELB_BIS - 1)).toMatchObject({ farbe: 'gelb', frei: 0 });
    expect(ampel(GELB_BIS)).toMatchObject({ farbe: 'rot', frei: 0 });
    expect(ampel(131 + 18).text).toMatch(/Rot/);
  });
  it('allows nothing when the queue cannot be read', () => {
    expect(ampel(NaN)).toMatchObject({ farbe: 'unbekannt', frei: 0 });
  });
});
