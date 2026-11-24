// «Was ist neu» mit Bild (Warteliste 3; Noah 22.11.2026 «1b», «5a»): the pictures in public/news belong to a news file, are small, and are only images.
import { describe, it, expect } from 'vitest';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { imagesOf } from '../scripts/news.mjs';
import { newsDay, newsWhen } from '../src/lib/know/neudatum.js';

const DIR = 'public/news';
const files = existsSync(DIR) ? readdirSync(DIR).filter((f) => statSync(join(DIR, f)).isFile()) : []; // folders hold the pictures of the other mechanism (picsFor)
const nameOf = (f) => f.replace(/(-vorher)?\.webp$/, '');
const kb = (f) => statSync(join(DIR, f)).size / 1024;

describe('pictures of «What is new»', () => {
  it('are only .webp files named like a news file', () => {
    for (const f of files) {
      expect(f, f).toMatch(/\.webp$/);
      expect(existsSync(join('src/lib/news', `${nameOf(f)}.js`)), `${f} has no news file`).toBe(true);
    }
  });
  it('are small: together at most 60 KB per entry, 40 KB each', () => {
    const per = {};
    for (const f of files) {
      expect(kb(f), f).toBeLessThanOrEqual(40);
      per[nameOf(f)] = (per[nameOf(f)] ?? 0) + kb(f);
    }
    for (const [n, k] of Object.entries(per)) expect(k, n).toBeLessThanOrEqual(60);
  });
  it('a «before» picture comes with an «after» picture', () => {
    for (const f of files.filter((x) => x.endsWith('-vorher.webp'))) expect(files, f).toContain(`${nameOf(f)}.webp`);
  });
  it('are found by name for the entry', () => {
    const f = files.find((x) => !x.endsWith('-vorher.webp'));
    if (f) expect(imagesOf(`${nameOf(f)}.js`).image).toBe(`news/${f}`);
    expect(imagesOf('no-such-entry.js')).toEqual({ image: null, imageBefore: null });
  });
});

describe('the day of an entry', () => {
  it('shows the weekday, the year and the time of the merge when known', () => {
    expect(newsDay('2026-11-21', 'de-CH')).toMatch(/Sa/);
    expect(newsDay('2026-11-21', 'de-CH')).toMatch(/2026/);
    expect(newsDay('2026-11-21', 'de-CH', false)).not.toMatch(/2026/);
    expect(newsWhen('2026-11-21', '14:32', 'de-CH')).toMatch(/, 14:32$/);
    expect(newsWhen('2026-11-21', null, 'de-CH')).not.toMatch(/14/);
    expect(newsDay('x', 'de-CH')).toBe('');
  });
});
