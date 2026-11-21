import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compare, render, readToday } from '../scripts/nacht-vergleich.mjs';

const set = (...a) => new Set(a);

describe('night run: what is new red (Noah 21.11.2026 «d plus b»)', () => {
  it('new, still red and fixed are told apart', () => {
    const r = compare(set('a', 'b', 'c'), set('b', 'c', 'd'));
    expect(r).toMatchObject({ erster: false, neu: ['a'], bleibt: ['b', 'c'], behoben: ['d'] });
  });
  it('without a list of the night before, all red tests count as known (no flood of «new»)', () => {
    const r = compare(set('a', 'b'), null);
    expect(r).toMatchObject({ erster: true, neu: [], bleibt: ['a', 'b'] });
    expect(render(r)).toContain('Erster Vergleich');
  });
  it('a job that left no list: new red is still told, «green again» is not', () => {
    const r = compare(set('a'), set('a', 'x'), true);
    expect(r.behoben).toEqual([]);
    expect(render(r)).toContain('fehlt die Liste');
  });
  it('the report is short German: new first, the rest as a count', () => {
    const text = render(compare(set('phone · tippzahl.spec.js · alle Funktionen', 'b'), set('b')));
    expect(text).toContain('Neu rot seit der letzten Nacht (1)');
    expect(text).toContain('- phone · tippzahl.spec.js · alle Funktionen');
    expect(text).toContain('Weiterhin rot wie in der letzten Nacht: 1 Tests.');
    expect(render(compare(set('b'), set('b')))).toContain('Nichts Neues rot.');
  });
  it('a long list is cut', () => {
    const many = Array.from({ length: 40 }, (_, i) => `t${String(i).padStart(2, '0')}`);
    expect(render(compare(new Set(many), set('x')))).toContain('und 25 weitere');
  });
  it('reads one list per job, ignores rot-liste.txt, and counts the files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rot-'));
    writeFileSync(join(dir, 'rot-e2e-phone-1.txt'), 'a\nb\n');
    writeFileSync(join(dir, 'rot-e2e-phone-2.txt'), '');
    writeFileSync(join(dir, 'rot-liste.txt'), 'old\n');
    const { set: s, files } = readToday(dir);
    expect([...s].sort()).toEqual(['a', 'b']);
    expect(files).toBe(2);
  });
});
