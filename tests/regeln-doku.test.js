// «Regeln an einem Ort» (Noah 24.11.2026) and «9 Blöcke statt 33 Regeln» (Noah «1-5a» 24.11.2026 16:50):
// docs/regeln.md is the one source of the working rules, in nine blocks in a fixed order. This test keeps its form:
// every block has a date and a source, CLAUDE.md points to it, holds no rule block of its own and names only blocks that exist.
// It checks form, not meaning.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const regeln = fs.readFileSync(path.join(ROOT, 'docs/regeln.md'), 'utf8');
const claude = fs.readFileSync(path.join(ROOT, 'CLAUDE.md'), 'utf8');

// a block starts with «## Block 3 · Title» and runs to the next «## » heading or the end of the file
const blocks = [...regeln.matchAll(/^## Block (\d+) · (.+)\n[\s\S]*?(?=\n## |(?![\s\S]))/gm)].map((m) => ({ n: Number(m[1]), title: m[2], text: m[0] }));

describe('docs/regeln.md', () => {
  it('has the nine blocks 1..9 in this order, no gap, no duplicate', () => {
    expect(blocks.map((b) => b.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('gives every block a date and a source', () => {
    for (const b of blocks) {
      expect(b.text, `Block ${b.n} has no date (dd.mm.yyyy)`).toMatch(/\d{2}\.\d{2}\.\d{4}/);
      expect(b.text, `Block ${b.n} names no source (Noah, Thread or a file)`).toMatch(/Noah|Thread|`docs\//);
    }
  });

  it('has no old numbered rule («**R12 · ») left; those live in docs/regeln-archiv.md', () => {
    expect(regeln).not.toMatch(/^\*\*R\d+ · /m);
  });

  it('carries no version number and no «Stand:» line (rule «Versionsnummer beim Merge»)', () => {
    expect(regeln).not.toMatch(/\b0\.\d{2,4}\.\d+\b/);
    expect(regeln).not.toMatch(/^\s*Stand:/m);
  });
});

describe('CLAUDE.md', () => {
  it('points to docs/regeln.md and docs/app-stand.md', () => {
    expect(claude).toContain('docs/regeln.md');
    expect(claude).toContain('docs/app-stand.md');
  });

  it('holds no working-rule block of its own (those live in docs/regeln.md)', () => {
    expect(claude).not.toMatch(/^## Current rules/m);
    expect(claude).not.toMatch(/^## How we work/m);
  });

  it('names only blocks that exist in docs/regeln.md and no old rule number R1..R33', () => {
    const have = new Set(blocks.map((b) => b.n));
    for (const m of claude.matchAll(/\bBlocks? (\d+)\b/g)) expect(have.has(Number(m[1])), `Block ${m[1]} is named in CLAUDE.md but not in docs/regeln.md`).toBe(true);
    expect(claude).not.toMatch(/\bR(?:[1-9]|[12]\d|3[0-3])\b/);
  });
});
