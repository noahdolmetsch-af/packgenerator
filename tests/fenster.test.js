// «Das beste Fenster heute» (Noah 24.11.2026 «1-3»): the dry window from the hourly rain. Fictional data only.
import { describe, it, expect } from 'vitest';
import { dryWindow } from '../src/lib/home/fenster.js';

const day = (wetHours) => ({ days: [{ date: '2026-11-24', hourly: { p: Array.from({ length: 24 }, (_, h) => (wetHours.includes(h) ? 80 : 5)) } }] });

describe('the dry window of today', () => {
  it('says until when it stays dry', () => {
    expect(dryWindow(day([19, 20]), '2026-11-24', 14)).toEqual({ kind: 'dry', until: 19 });
  });
  it('says dry for the rest of the day when no wet hour follows', () => {
    expect(dryWindow(day([2, 3]), '2026-11-24', 10)).toEqual({ kind: 'dry', until: null });
  });
  it('says when it gets dry after rain now', () => {
    expect(dryWindow(day([12, 13, 14]), '2026-11-24', 13)).toEqual({ kind: 'later', from: 15 });
  });
  it('says wet when it stays wet until the evening', () => {
    expect(dryWindow(day([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]), '2026-11-24', 10)).toEqual({ kind: 'wet' });
  });
  it('looks from 7 o\'clock at the earliest and gives nothing after 21', () => {
    expect(dryWindow(day([8]), '2026-11-24', 3)).toEqual({ kind: 'dry', until: 8 });
    expect(dryWindow(day([]), '2026-11-24', 22)).toBe(null);
  });
  it('gives nothing without hourly data or for another day', () => {
    expect(dryWindow({ days: [{ date: '2026-11-24' }] }, '2026-11-24', 10)).toBe(null);
    expect(dryWindow(day([]), '2026-11-25', 10)).toBe(null);
    expect(dryWindow(null, '2026-11-24', 10)).toBe(null);
  });
});
