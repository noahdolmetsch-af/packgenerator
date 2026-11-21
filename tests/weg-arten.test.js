import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { TYPES, typeOf, collect, suggestions } from '../src/lib/weg/types/index.js';

const DIR = new URL('../src/lib/weg/types/', import.meta.url);
const files = readdirSync(DIR).filter((f) => f.endsWith('.js') && f !== 'index.js');

describe('Weg zum Ziel: the kinds are collected from their files', () => {
  it('every file in the folder is a kind, and every kind is collected (new kind = new file)', () => {
    expect(files.length).toBeGreaterThan(0);
    expect(TYPES).toHaveLength(files.length);
  });

  it('keeps no hand-written list: index.js imports no kind', () => {
    const src = readFileSync(new URL('index.js', DIR), 'utf8');
    expect(src).not.toMatch(/^\s*import\s.+from\s+['"]\.\//m);
    expect(src).not.toMatch(/TYPES\s*=\s*\[[^\]]*\w/);
  });

  it('every kind has what the page needs, and the ids are unique', () => {
    for (const t of TYPES) {
      expect(typeof t.type, t.type).toBe('string');
      expect(typeof t.label, t.type).toBe('string');
      expect(typeof t.icon, t.type).toBe('string');
      expect(typeof t.defaults, t.type).toBe('function');
      expect(typeof t.auto, t.type).toBe('function');
    }
    const ids = TYPES.map((t) => t.type);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps the order of the sheet: Own step first, then the first kinds as before', () => {
    expect(TYPES.map((t) => t.type).slice(0, 5)).toEqual(['own', 'rennplanung', 'packen', 'nacht', 'velo']);
  });

  it('typeOf finds a kind and falls back to the own step', () => {
    for (const t of TYPES) expect(typeOf(t.type)).toBe(t);
    expect(typeOf('gibt-es-nicht').type).toBe('own');
    expect(typeOf(undefined).type).toBe('own');
  });

  it('collect: skips what is no kind, sorts by order, then kinds without order by their id', () => {
    const k = (type, order) => ({ type, ...(order === undefined ? {} : { order }) });
    const out = collect([k('zebra'), null, { label: 'no type' }, k('alpha'), k('late', 5), undefined, k('first', 0), k('')]);
    expect(out.map((t) => t.type)).toEqual(['first', 'late', 'alpha', 'zebra']);
  });

  it('suggestions still ask every kind, and one that fails adds nothing', () => {
    const boom = { type: 'boom', defaults: () => { throw new Error('x'); } };
    const ok = { type: 'ok', defaults: () => [{ title: 'A', offset: 3 }] };
    expect(suggestions({ kind: 'free' }, [boom, ok])).toEqual([{ title: 'A', offset: 3, type: 'ok' }]);
    expect(suggestions({ kind: 'race' }).every((s) => TYPES.some((t) => t.type === s.type))).toBe(true);
  });
});
