// «Fester App-Stand» (Noah 03.11.2026 «1-5 a»): docs/app-stand.md is the one list of what the app can do, read by every
// thread before every request. This test keeps it true: every link still leads somewhere, every function of features.js
// sits under a row, and the file carries no version number or count (rule 13), so two open PRs never change the same line.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { FEATURES, featureHref } from '../src/lib/features.js';

const ROOT = path.resolve(__dirname, '..');
const md = fs.readFileSync(path.join(ROOT, 'docs/app-stand.md'), 'utf8');
const app = fs.readFileSync(path.join(ROOT, 'src/App.svelte'), 'utf8');

const ROW = /^\| ([^|]+) \| `(#\/[^`]*)` \| ([^|]+) \|$/gm;
const rows = [...md.matchAll(ROW)].map((m) => ({ name: m[1].trim(), link: m[2], text: m[3].trim() }));
const segs = (h) => h.replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean);
const rowPaths = rows.map((r) => segs(r.link));

describe('docs/app-stand.md', () => {
  it('has the 12 areas and rows with a name, a link and a text', () => {
    const heads = [...md.matchAll(/^### (\d+)\. /gm)].map((m) => Number(m[1]));
    expect(heads).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
    expect(rows.length).toBeGreaterThan(100);
    for (const r of rows) expect(r.text.length, r.name).toBeGreaterThan(10);
  });

  it('names no function twice', () => {
    const names = rows.map((r) => r.name);
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
  });

  it('carries no version number and no «Stand:» line (rule 13)', () => {
    expect(md).not.toMatch(/\bv?0\.\d{2,3}\.\d+\b/);
    expect(md).not.toMatch(/^\s*Stand:/m);
  });

  it('every link leads to a page the app knows', () => {
    const hrefs = FEATURES.map((f) => featureHref(f, { bikeId: '<id>' })).filter(Boolean).map(segs);
    const dead = rows.filter((r) => {
      const p = segs(r.link);
      if (!p.length) return false; // «#/» is Today
      const viaFeature = hrefs.some((h) => p.every((s, i) => h[i] === s));
      return !viaFeature && !app.includes(`#/${p[0]}`) && !app.includes(`page === '${p[0]}'`);
    });
    expect(dead.map((r) => `${r.name} ${r.link}`)).toEqual([]);
  });

  it('every function of features.js with a link sits under a row (add a row when a new page appears)', () => {
    const loose = FEATURES.map((f) => ({ id: f.id, href: featureHref(f, { bikeId: '<id>' }) }))
      .filter((f) => f.href)
      .filter((f) => {
        const p = segs(f.href);
        return !rowPaths.some((r) => (r.length > 0 || p.length === 0) && r.length <= p.length && r.every((s, i) => s === p[i]));
      });
    expect(loose.map((f) => `${f.id} ${f.href}`)).toEqual([]);
  });
});
