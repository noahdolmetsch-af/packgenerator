import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// «Icon-Grössen» (Noah 24.11.2026 «5a», «1-7»): icons stand at 14 · 16 · 20 · 24 and the line is 2 (2.5 for ticks); from 30 up they are drawings.
const LADDER = new Set(['14', '16', '20', '24']);
const STROKES = new Set(['2', '2.5']);

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (n.endsWith('.svelte')) out.push(p);
  }
  return out;
}

describe('icons: sizes and lines', () => {
  it('every Lucide icon with a fixed size is on the ladder, every fixed line is 2 or 2.5', () => {
    const bad = [];
    for (const f of walk('src')) {
      const s = readFileSync(f, 'utf8');
      const m = /import\s*\{([^}]*)\}\s*from\s*'@lucide\/svelte'/.exec(s);
      if (!m) continue;
      const names = new Set(m[1].split(',').map((x) => x.trim().split(' as ').pop()).filter(Boolean));
      for (const t of s.matchAll(/<(\w+)\b([^<>]*?)\/?>/g)) {
        if (!names.has(t[1])) continue;
        const z = /\bsize=\{(\d+)\}/.exec(t[2]);
        if (z && Number(z[1]) < 30 && !LADDER.has(z[1])) bad.push(`${f}: ${t[1]} size ${z[1]}`);
        const w = /strokeWidth=\{([\d.]+)\}/.exec(t[2]);
        if (w && !STROKES.has(w[1])) bad.push(`${f}: ${t[1]} strokeWidth ${w[1]}`);
      }
    }
    expect(bad, 'use size 14 · 16 · 20 · 24 and strokeWidth 2 or 2.5').toEqual([]);
  });
});
