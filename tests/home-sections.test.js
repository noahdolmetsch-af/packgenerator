// «Heute ruhiger» part 3 (Noah 26.10.2026 «3a 4a», mockup H3): areas with a heading, «Entdecken» side by side.
import { describe, it, expect } from 'vitest';
import { SECTIONS, SECTION_OF, sectionOf, sectionsOf, fillers, normAreas, areasOf, moveArea, renameArea, hideArea, showArea, NONE } from '../src/lib/home/sections.js';
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
    expect(ids(g[0].tiles)).toEqual(['meditation', 'trip', 'weighin', 'important']);
    expect(ids(g[1].tiles)).toEqual(['body', 'acts']);
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

// «Bereiche anpassen» (Noah 27.10.2026 «1a 2a»): move, rename and hide the areas, with Undo in the page
describe('own setup of the areas (1a 2a)', () => {
  const keys = (g) => g.map((s) => s.key);
  it('nothing stored: the areas as the app has them', () => {
    expect(keys(areasOf(null))).toEqual(SECTIONS.map((s) => s.key));
    expect(keys(sectionsOf(READY, null))).toEqual(keys(sectionsOf(READY)));
    expect(normAreas({ order: ['x', 'now', 'now'], names: { now: '  ', week: ' Meine Woche ', y: 'z' }, off: { body: 'body', away: 'nope' } })).toEqual({ order: ['now'], names: { week: 'Meine Woche' }, off: { body: '', away: '' } });
  });
  it('1a: arrows and drag move the shown areas; hidden ones stay at the end', () => {
    let c = moveArea(null, 0, 1);
    expect(keys(areasOf(c)).slice(0, 2)).toEqual(['body', 'now']);
    expect(keys(sectionsOf(READY, c)).slice(0, 2)).toEqual(['body', 'now']);
    c = hideArea(c, 'week');
    c = moveArea(c, 3, 0); // the 4th shown area (week is hidden): «Open quickly»
    expect(keys(areasOf(c).filter((a) => !a.off))).toEqual(['quick', 'body', 'now', 'away', 'discover']);
    expect(areasOf(c).at(-1).key).toBe('week');
    expect(moveArea(c, 0, 9)).toEqual(normAreas(c));
  });
  it('2a: an own name shows instead of the app name; empty brings it back', () => {
    let c = renameArea(null, 'now', ' Mein Morgen ');
    expect(sectionsOf(READY, c)[0].own).toBe('Mein Morgen');
    c = renameArea(c, 'now', '');
    expect(sectionsOf(READY, c)[0].own).toBe(null);
  });
  it('2a: a hidden area sends its tiles to «Without area» at the end or to another area; nothing is lost', () => {
    let c = hideArea(null, 'body');
    let g = sectionsOf(READY, c);
    expect(keys(g)).not.toContain('body');
    expect(g.at(-1).key).toBe(NONE);
    expect(ids(g.at(-1).tiles)).toEqual(['body', 'acts']);
    expect(g.flatMap((s) => ids(s.tiles)).sort()).toEqual(ids(READY).sort());
    c = hideArea(null, 'body', 'week');
    g = sectionsOf(READY, c);
    expect(keys(g)).not.toContain(NONE);
    expect(ids(g.find((s) => s.key === 'week').tiles)).toEqual(expect.arrayContaining(['body', 'acts']));
    // the target hidden too: «Without area»
    c = hideArea(c, 'week');
    expect(ids(sectionsOf(READY, c).at(-1).tiles)).toEqual(expect.arrayContaining(['body', 'acts']));
    // shown again: the tiles come back
    c = showArea(showArea(c, 'week'), 'body');
    expect(keys(sectionsOf(READY, c))).toEqual(keys(sectionsOf(READY)));
  });
  it('German names for the new texts', () => {
    for (const k of ['Without area', 'Areas of Today', 'Hide area "{name}"?', 'Area "{name}" hidden.', 'Hidden areas', 'Show {name} again']) expect(DE[k], k).toBeTruthy();
  });
});
