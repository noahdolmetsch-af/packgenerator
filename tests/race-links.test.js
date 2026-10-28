// «Links pro Rennen» (Noah 27.10.2026): made-up addresses only.
import { describe, it, expect } from 'vitest';
import { linksOf, safeUrl, withKind, LINK_KINDS } from '../src/lib/race/links-lib.js';

describe('links of a race', () => {
  it('only opens web addresses', () => {
    expect(safeUrl('https://example.org/rules')).toBe('https://example.org/rules');
    expect(safeUrl('example.org/handbook.pdf')).toBe('https://example.org/handbook.pdf');
    expect(safeUrl('javascript:alert(1)')).toBeNull();
    expect(safeUrl('Handbook')).toBeNull();
    expect(safeUrl('')).toBeNull();
  });
  it('shows the old rules link while there are no links yet', () => {
    expect(linksOf({ rulesUrl: 'https://example.org/r' })).toEqual([{ id: 'rules', text: 'Rules|race', url: 'https://example.org/r' }]);
    expect(linksOf({ rulesUrl: 'https://example.org/r', links: [] })).toEqual([]);
    expect(linksOf({})).toEqual([]);
  });
  it('a typed address becomes the link, its site the name', () => {
    const [r] = linksOf({ links: [{ id: 'a', text: 'www.example-race.org/tracker' }] });
    expect(r).toMatchObject({ text: 'example-race.org', url: 'https://www.example-race.org/tracker' });
  });
  it('adds a row of a kind without address', () => {
    const rows = withKind([], LINK_KINDS[0]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ text: 'Handbook', url: '' });
  });
});
