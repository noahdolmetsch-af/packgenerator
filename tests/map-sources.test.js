// Paket U2 «Karte»: the map grounds (src/lib/map/sources.js) and their maplibre styles (maplib.js styleOf).
import { describe, it, expect } from 'vitest';
import { GROUNDS, groundOf, pickGround, inSwitzerland, tileUrl, OFFLINE_HOSTS, OFFLINE_CACHE } from '../src/lib/map/sources.js';
import { styleOf } from '../src/lib/map/maplib.js';

describe('map grounds', () => {
  it('every ground has a key, a name and a way to draw it', () => {
    const keys = GROUNDS.map((g) => g.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys[0]).toBe('auto');
    for (const g of GROUNDS) {
      expect(g.name, g.key).toBeTruthy();
      expect(g.sub, g.key).toBeTruthy();
      if (g.kind === 'raster') expect(g.url, g.key).toMatch(/^https:\/\/.+\{z\}.+\{x\}.+\{y\}/);
      if (g.kind === 'vector') expect(g.style, g.key).toMatch(/^https:\/\//);
      if (g.kind !== 'auto') expect(g.attribution, g.key).toMatch(/©/);
    }
  });
  it('only grounds whose terms allow it can be kept offline', () => {
    expect(groundOf('osm').offline).toBe(false);
    expect(groundOf('topo').offline).toBe(false);
    for (const g of GROUNDS.filter((x) => x.offline)) expect(OFFLINE_HOSTS.some((h) => (g.url ?? g.style).includes(h)), g.key).toBe(true);
    expect(OFFLINE_CACHE).toBeTruthy();
  });
  it('an unknown key falls back to «auto»', () => {
    expect(groundOf('nope').key).toBe('auto');
  });
  it('auto: swisstopo in Switzerland (winter map Nov–Apr), the free vector map elsewhere', () => {
    expect(inSwitzerland(46.8, 8.2)).toBe(true);
    expect(inSwitzerland(48.5, 8.2)).toBe(false);
    expect(pickGround('auto', 46.8, 8.2, 7).key).toBe('swisstopo');
    expect(pickGround('auto', 46.8, 8.2, 1).key).toBe('swisstopoWinter');
    expect(pickGround('auto', 46.8, 8.2, 11).key).toBe('swisstopoWinter');
    expect(pickGround('auto', 45.0, 7.0, 7).key).toBe('vector');
    expect(pickGround('auto', NaN, NaN, 7).key).toBe('vector');
    expect(pickGround('osm', 46.8, 8.2).key).toBe('osm');
  });
  it('a raster tile address', () => {
    expect(tileUrl(groundOf('osm'), 7, 66, 45)).toBe('https://tile.openstreetmap.org/7/66/45.png');
    expect(tileUrl(groundOf('swisstopo'), 8, 133, 90)).toMatch(/pixelkarte-farbe\/default\/current\/3857\/8\/133\/90\.jpeg$/);
  });
  it('a raster ground becomes a style with one raster source; the vector ground keeps its style url', () => {
    const s = styleOf(groundOf('swisstopo'));
    expect(s.version).toBe(8);
    expect(Object.keys(s.sources)).toEqual(['ground']);
    expect(s.sources.ground).toMatchObject({ type: 'raster', tileSize: 256, attribution: '© swisstopo', maxzoom: 18 });
    expect(s.layers).toEqual([{ id: 'ground', type: 'raster', source: 'ground' }]);
    expect(s.glyphs).toMatch(/\{fontstack\}.*\{range\}/);
    expect(styleOf(groundOf('vector'))).toBe(groundOf('vector').style);
  });
});

// Kartenlayer (Noah 20.10.2026): one ground for all maps, also the plain tile maps.
import { RASTER_GROUNDS, rasterGround } from '../src/lib/map/sources.js';
describe('grounds for plain tile maps', () => {
  it('CyclOSM is there, view only', () => {
    expect(groundOf('cyclo').kind).toBe('raster');
    expect(groundOf('cyclo').offline).toBe(false);
  });
  it('a plain tile map offers every ground but the vector map', () => {
    expect(RASTER_GROUNDS.map((g) => g.key)).toEqual(GROUNDS.filter((g) => g.kind !== 'vector').map((g) => g.key));
    expect(RASTER_GROUNDS.some((g) => g.kind === 'vector')).toBe(false);
  });
  it('the vector map becomes OpenStreetMap; auto keeps swisstopo in Switzerland', () => {
    expect(rasterGround('vector', 46.8, 8.2).key).toBe('osm');
    expect(rasterGround('auto', 45.0, 7.0, 7).key).toBe('osm');
    expect(rasterGround('auto', 46.8, 8.2, 7).key).toBe('swisstopo');
    expect(rasterGround('cyclo', 46.8, 8.2).key).toBe('cyclo');
    expect(rasterGround('swissimage', 46.8, 8.2).key).toBe('swissimage');
  });
});

describe('SchweizMobil on top of the map (Noah 20.10.2026)', () => {
  it('the cycling routes of SchweizMobil from swisstopo: a png layer, view only', async () => {
    const { SWISS_OVERLAYS, SWISS_WMTS, OFFLINE_HOSTS } = await import('../src/lib/map/sources.js');
    const v = SWISS_OVERLAYS.find((o) => o.id === 'veloland');
    expect(v.url).toBe(`${SWISS_WMTS}/ch.astra.veloland/default/current/3857/{z}/{x}/{y}.png`);
    expect(v.attribution).toContain('swisstopo');
    expect(v.opacity).toBeGreaterThan(0);
  });
});
