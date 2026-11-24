// «Wackel-Wächter» (Noah «a-c alle» 24.11.2026): docs/wackelliste.md lists every test that was red by chance,
// with a state. This test keeps the form of the table, not its meaning.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const text = fs.readFileSync(path.resolve(__dirname, '../docs/wackelliste.md'), 'utf8');
const rows = text.split('\n').filter((l) => l.startsWith('|') && !/^\|\s*(Test|---)/.test(l));

describe('docs/wackelliste.md', () => {
  it('has rows with six cells, the last one a known state', () => {
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      const cells = r.split('|').slice(1, -1).map((c) => c.trim());
      expect(cells, r).toHaveLength(6);
      expect(['offen', 'beobachten', 'stabil'], r).toContain(cells[5]);
    }
  });

  it('gives every stable row a fix', () => {
    for (const r of rows) {
      const cells = r.split('|').slice(1, -1).map((c) => c.trim());
      if (cells[5] === 'stabil') expect(cells[4], r).toMatch(/#\d+/);
    }
  });
});
