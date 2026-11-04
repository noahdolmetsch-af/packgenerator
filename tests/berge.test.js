// «Schweizer Berge statt Everest» (Paket E, Idee 25): the metres climbed in a Swiss mountain.
import { describe, it, expect } from 'vitest';
import { MOUNTAINS, AUTO, choiceOf, bestMountain, mountainOf } from '../src/lib/pageinfo/berge.js';

describe('berge', () => {
  it('lists the mountains from small to big with their heights', () => {
    const hs = MOUNTAINS.map((m) => m.m);
    expect([...hs].sort((a, b) => a - b)).toEqual(hs);
    expect(MOUNTAINS.find((m) => m.key === 'saentis').m).toBe(2502);
    expect(new Set(MOUNTAINS.map((m) => m.key)).size).toBe(MOUNTAINS.length);
  });

  it('fits the mountain to the metres by itself', () => {
    expect(bestMountain(3250).key).toBe('saentis'); // 1.3 Säntis
    expect(bestMountain(900).key).toBe('uetliberg');
    expect(bestMountain(96000).key).toBe('dufour');
    expect(bestMountain(4500).key).toBe('matterhorn');
    expect(bestMountain(4400).key).toBe('eiger');
    expect(bestMountain(100).key).toBe('uetliberg');
  });

  it('counts the metres in the mountain: 1.3 times the Säntis', () => {
    const r = mountainOf(3250, 'auto');
    expect(r.mountain.name).toBe('Säntis');
    expect(r.x).toBe(1.2); // 3250 / 2502 = 1.299 rounded down, never promised too early
    expect(r.next).toBe(2);
    expect(r.left).toBe(1754);
    expect(r.fill).toBeCloseTo(0.299, 2);
  });

  it('takes the mountain the person chose', () => {
    expect(mountainOf(5000, 'pilatus').mountain.name).toBe('Pilatus');
    expect(mountainOf(5000, 'pilatus').x).toBe(2.3);
    expect(mountainOf(5000, 'gibtsnicht').mountain.key).toBe(bestMountain(5000).key);
  });

  it('gives nothing without metres', () => {
    expect(mountainOf(0)).toBeNull();
    expect(mountainOf(null)).toBeNull();
    expect(mountainOf(-5)).toBeNull();
  });

  it('reads a stored choice', () => {
    expect(choiceOf({ key: 'eiger' })).toBe('eiger');
    expect(choiceOf({ key: 'x' })).toBe(AUTO);
    expect(choiceOf(undefined)).toBe(AUTO);
  });
});
