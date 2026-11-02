// «Tempo-Messer» (Noah 02.11.2026 «a»): the plain numbers and the line.
import { describe, it, expect } from 'vitest';
import { fileOf, frameStats, topFiles, topPages, reportLine } from '../src/lib/tempo/messer.js';

describe('Tempo-Messer', () => {
  it('names a script file without folder and hash', () => {
    expect(fileOf('https://x.ch/packgenerator/assets/Pack-DwrLxqqq.js?v=1')).toBe('Pack.js');
    expect(fileOf('')).toBe('(page)');
  });
  it('counts slow frames', () => {
    expect(frameStats([])).toEqual({ n: 0, p95: 0, over50: 0, over100: 0, worst: 0 });
    const s = frameStats([16, 17, 16, 60, 120, 17, 16, 16, 16, 16]);
    expect(s).toMatchObject({ n: 10, over50: 2, over100: 1, worst: 120 });
  });
  it('finds the files and pages that held the screen up', () => {
    const l = [
      { page: '#/', scripts: [{ url: 'a/start-AAAAAAAA.js', duration: 80 }, { url: 'a/Pack-BBBBBBBB.js', duration: 20 }] },
      { page: '#/', scripts: [{ url: 'a/start-AAAAAAAA.js', duration: 50 }] },
      { page: '#/pack', scripts: [] },
    ];
    expect(topFiles(l, 2)).toEqual([{ file: 'start.js', ms: 130 }, { file: 'Pack.js', ms: 20 }]);
    expect(topPages(l)[0]).toEqual({ page: '#/', n: 2 });
  });
  it('writes one line with numbers only', () => {
    const line = reportLine({ firstPaint: 1800, startBlocked: 600, frames: { n: 100, over50: 4, worst: 143 }, files: [{ file: 'start.js', ms: 130 }], pages: [{ page: '#/', n: 2 }], counts: { items: 700 }, cores: 8 });
    expect(line).toContain('Start: 1.8 s');
    expect(line).toContain('4 over 50 ms');
    expect(line).toContain('start.js 130 ms');
    expect(line).toContain('items 700');
  });
});
