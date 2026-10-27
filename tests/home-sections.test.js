// «Heute ruhiger» part 3 (Noah 26.10.2026 «3a 4a», mockup H3): areas with a heading, «Entdecken» side by side.
import { describe, it, expect } from 'vitest';
import { SECTIONS, SECTION_OF, sectionOf, sectionsOf, fillers } from '../src/lib/home/sections.js';
import { TILE, TILES, READY } from '../src/lib/home/tiles.js';
import DE from '../src/lib/i18n/de/index.js';

const ids = (l) => l.map((x) => x.id);

describe('Heute ruhiger: areas (3a)', () => {
  it('every tile has an area, small tiles go to «Schnell öffnen»', () => {
    const keys = SECTIONS.map((s) => s.key);
    for (const x of TILES) for (const size of x.sizes) expect(keys, `${x.id} ${size}`).toContain(sectionOf({ id: x.id, size }));
    for (const id of Object.keys(SECTION_OF)) expect(TILE[id], id).toBeTruthy();
    expect(sectionOf({ id: 'fn:trip', size: 's' })).toBe('quick');
    expect(sectionOf({ id: 'meditation', size: 's' })).toBe('quick');
    expect(sectionOf({ id: 'meditation', size: 'long' })).toBe('now');
  });
  it('the ready wall: Jetzt, Dein Körper, Deine Woche, Unterwegs, Schnell öffnen; inside an area the order of the wall', () => {
    const g = sectionsOf(READY);
    expect(g.map((s) => s.key)).toEqual(['now', 'body', 'week', 'away', 'quick']);
    expect(ids(g[0].tiles)).toEqual(['meditation', 'trip', 'important']);
    expect(ids(g[1].tiles)).toEqual(['weighin', 'body', 'acts']);
    expect(g.at(-1).tiles).toHaveLength(8);
    // nothing lost, nothing twice
    expect(g.flatMap((s) => ids(s.tiles)).sort()).toEqual(ids(READY).sort());
  });
  it('4a: «Neu», «Schon probiert?» and the tip under «Entdecken»', () => {
    const g = sectionsOf([{ id: 'tipweek', size: 'long' }, { id: 'news', size: 'w' }, { id: 'try', size: 'w' }]);
    expect(g.map((s) => s.key)).toEqual(['discover']);
    expect(ids(g[0].tiles)).toEqual(['tipweek', 'news', 'try']);
  });
  it('the headings are German', () => {
    for (const s of SECTIONS) {
      expect(DE[s.name], s.name).toBeTruthy();
      if (s.sub) expect(DE[s.sub], s.sub).toBeTruthy();
    }
  });
});

describe('Heute ruhiger: no half-empty row inside an area', () => {
  it('a card the next one does not fit beside stretches to the end of its row', () => {
    const t = (id, size) => ({ id, size });
    expect([...fillers([t('a', 'long'), t('b', 'l'), t('c', 'l')])]).toEqual([]);
    expect([...fillers([t('a', 'long'), t('b', 'l')])]).toEqual([['b', 8]]);
    expect([...fillers([t('a', 'l'), t('b', 'long'), t('c', 'l'), t('d', 'w')])]).toEqual([['a', 8], ['d', 4]]);
    expect([...fillers([t('a', 'l'), t('b', 'w'), t('c', 'w')])]).toEqual([]);
    // a wide card first and a long card next: it spans the whole row from its start, not only the last column
    expect([...fillers([t('a', 'w'), t('b', 'long')])]).toEqual([['a', 8]]);
  });
});
