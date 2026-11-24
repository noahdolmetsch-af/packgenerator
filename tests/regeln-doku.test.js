// «Regeln an einem Ort» (Noah 24.11.2026): docs/regeln.md is the one source of the working rules. This test keeps its form:
// every rule has a number, a date and a source, CLAUDE.md points to it and holds no rule block of its own,
// and every R-number CLAUDE.md names exists. It checks form, not meaning.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const regeln = fs.readFileSync(path.join(ROOT, 'docs/regeln.md'), 'utf8');
const claude = fs.readFileSync(path.join(ROOT, 'CLAUDE.md'), 'utf8');

// a rule starts with «**R12 · » and runs to the next blank line that is followed by another rule or a heading
const rules = [...regeln.matchAll(/^\*\*R(\d+) · [\s\S]*?(?=\n\n(?:\*\*R\d+ · |#{1,3} )|(?![\s\S]))/gm)].map((m) => ({ n: Number(m[1]), text: m[0] }));

describe('docs/regeln.md', () => {
  it('numbers its rules 1..n without a gap or a duplicate', () => {
    expect(rules.length).toBeGreaterThan(20);
    expect(rules.map((r) => r.n)).toEqual(rules.map((_, i) => i + 1));
  });

  it('gives every rule a date and a source', () => {
    for (const r of rules) {
      expect(r.text, `R${r.n} has no date (dd.mm.yyyy)`).toMatch(/\d{2}\.\d{2}\.\d{4}/);
      expect(r.text, `R${r.n} names no source (Noah, Thread or a file)`).toMatch(/Noah|Thread|`docs\/|Projekt-Anweisung/);
    }
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

  it('names only rule numbers that exist in docs/regeln.md', () => {
    const named = [...new Set([...claude.matchAll(/\bR(\d+)\b/g)].map((m) => Number(m[1])))];
    const have = new Set(rules.map((r) => r.n));
    for (const n of named) expect(have.has(n), `R${n} is named in CLAUDE.md but not in docs/regeln.md`).toBe(true);
    // ranges like «R21–R25» name their ends, which is enough
  });
});
