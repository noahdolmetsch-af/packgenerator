// Version at merge time (Noah 27.10.2026 «1a»): scripts/news.mjs numbers the news files by the order of
// merges on main, so open PRs never conflict over the version or the top of «What is new».
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { numberHistory, computeNews, bump, compare, zurichDay, ANCHOR_VERSION } from '../scripts/news.mjs';
import { APP_VERSION, NEWS } from '../src/lib/news/index.gen.js';
import { WHATS_NEW } from '../src/lib/whatsnew.js';
import DE from '../src/lib/i18n/de/index.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

describe('numbers at merge time', () => {
  it('a merge with a news file is a minor step, any other merge a patch step', () => {
    const r = numberHistory([
      { date: '2026-10-28', added: [] }, // e.g. a CI fix
      { date: '2026-10-28', added: ['kleider-sets.js'] },
      { date: '2026-10-29', added: ['live-umweg.js'] },
      { date: '2026-10-29', added: [] },
    ]);
    expect(r.files).toEqual({ 'kleider-sets.js': { version: '0.233.0', date: '2026-10-28' }, 'live-umweg.js': { version: '0.234.0', date: '2026-10-29' } });
    expect(r.version).toBe('0.234.1');
  });

  it('an old-style PR that sets a higher version by hand wins, a lower one never goes back', () => {
    expect(numberHistory([{ date: 'd', added: [], pkg: '0.233.0' }]).version).toBe('0.233.0');
    expect(numberHistory([{ date: 'd', added: ['a.js'] }, { date: 'd', added: [], pkg: '0.233.0' }]).version).toBe('0.233.1');
    expect(numberHistory([]).version).toBe(ANCHOR_VERSION);
  });

  it('a file not yet on main (or without history) comes after the newest, and is marked a guess', () => {
    const r = computeNews({ history: [{ date: '2026-10-28', added: ['a.js'] }], files: ['a.js', 'b.js'], today: '2026-10-29' });
    expect(r.news).toEqual([{ file: 'b.js', version: '0.234.0', date: '2026-10-29' }, { file: 'a.js', version: '0.233.0', date: '2026-10-28' }]);
    expect(r.version).toBe('0.234.0');
    expect(r.exact).toBe(false);
    expect(computeNews({ history: null, files: [], today: 'x' }).exact).toBe(false);
  });

  it('helpers', () => {
    expect(bump('0.232.0', 'minor')).toBe('0.233.0');
    expect(bump('0.232.0', 'patch')).toBe('0.232.1');
    expect(compare('0.232.10', '0.232.9')).toBe(1);
    expect(zurichDay('2026-10-27T23:30:00Z')).toBe('2026-10-28');
  });
});

describe('the news files', () => {
  const dir = new URL('../src/lib/news/', import.meta.url);
  const files = readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'index.gen.js');

  it('every file has a plain name and is in the list, newest first, versions unique', () => {
    for (const f of files) expect(f, f).toMatch(/^[a-z0-9][a-z0-9-]*\.js$/);
    expect(NEWS.map((n) => `${n.id}.js`).sort()).toEqual(files.sort());
    // news entries keep their order; a PR still numbered by hand (Touren c) may stand above them
    expect(WHATS_NEW.filter((e) => NEWS.includes(e))).toEqual(NEWS);
    expect(new Set(NEWS.map((n) => n.version)).size).toBe(NEWS.length);
    for (const n of NEWS) expect(compare(n.version, ANCHOR_VERSION), n.id).toBe(1);
    expect(compare(APP_VERSION, pkg.version)).toBeGreaterThanOrEqual(0);
  });

  it('a file carries no version or date of its own, and German for every text', async () => {
    for (const f of files) {
      const e = (await import(new URL(f, dir).href)).default;
      expect(e.version, f).toBeUndefined();
      expect(e.date, f).toBeUndefined();
      for (const text of [e.title, e.lead, ...(e.points ?? []).map((p) => p.text), ...(e.small ?? []).map((p) => p.text)].filter(Boolean)) {
        expect(DE[text], `${f}: ${text}`).toBeTruthy();
      }
    }
  });
});
