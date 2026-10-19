// Paket U3 «Karte offline»: tile maths, dedup, plan and cap, size, the free map's URLs, refcount delete,
// the runner (pause, cancel, throttle) and the service worker's constants and decisions. Fictional lines.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import 'fake-indexeddb/auto';
import {
  tileOf,
  tilesAlong,
  densify,
  planStrip,
  estimateBytes,
  fmtBytes,
  fillTile,
  rasterUrls,
  fontStacks,
  glyphUrls,
  spriteUrls,
  tileSources,
  sourceTileUrls,
  urlsToDrop,
  createRunner,
  groundsFor,
  MAX_TILES,
  AVG_KB,
  OVERVIEW_ZOOMS,
  readStrips,
  writeStrips,
  removeStrip,
  undoRemove,
  renameStrip,
  storageInfo,
} from '../src/lib/map/offline.js';
import { OFFLINE_CACHE, OFFLINE_HOSTS, GROUNDS } from '../src/lib/map/sources.js';
import { createDb } from '../src/lib/db.js';

// a short made-up line in the Swiss midlands (about 12 km) and one in France
const CH = [
  [47.0, 7.4],
  [47.05, 7.5],
  [47.08, 7.55],
];
const FR = [
  [45.0, 4.0],
  [45.02, 4.05],
];

describe('tile maths', () => {
  it('finds the slippy tile of a point', () => {
    expect(tileOf(0, 0, 1)).toEqual({ z: 1, x: 1, y: 1 });
    expect(tileOf(85, -180, 2)).toEqual({ z: 2, x: 0, y: 0 });
    // Bern at z10: x = (7.447 + 180) / 360 × 1024 = 533.2, y = 360.4
    expect(tileOf(46.948, 7.447, 10)).toEqual({ z: 10, x: 533, y: 360 });
  });
  it('densifies a line without losing its points', () => {
    const d = densify(CH, 0.5);
    expect(d[0]).toEqual(CH[0]);
    expect(d.at(-1)).toEqual(CH.at(-1));
    expect(d.length).toBeGreaterThan(20);
    expect(densify([[1, 2], ['x', 3]], 1)).toEqual([[1, 2]]);
  });
  it('tilesAlong gives unique, sorted tiles that hold every line point', () => {
    const tiles = tilesAlong(CH, { zooms: [12, 10, 12], bufferKm: 1 });
    const keys = tiles.map((t) => `${t.z}/${t.x}/${t.y}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect([...new Set(tiles.map((t) => t.z))]).toEqual([10, 12]);
    for (const [lat, lon] of densify(CH, 0.2)) {
      const k = tileOf(lat, lon, 12);
      expect(keys).toContain(`12/${k.x}/${k.y}`);
    }
    const sorted = [...tiles].sort((a, b) => a.z - b.z || a.x - b.x || a.y - b.y);
    expect(tiles).toEqual(sorted);
  });
  it('a wider strip has more tiles, and the buffer reaches beside the line', () => {
    const one = tilesAlong(CH, { zooms: [14], bufferKm: 1 });
    const two = tilesAlong(CH, { zooms: [14], bufferKm: 2 });
    expect(two.length).toBeGreaterThan(one.length);
    // 1.5 km north of the start is in the 2 km strip, not far outside it
    const n = tileOf(47.0 + 1.5 / 111.32, 7.4, 14);
    expect(two.some((t) => t.x === n.x && t.y === n.y)).toBe(true);
    const far = tileOf(47.0 + 6 / 111.32, 7.4, 14);
    expect(two.some((t) => t.x === far.x && t.y === far.y)).toBe(false);
  });
});

describe('the plan and the size', () => {
  it('swisstopo only when the route touches Switzerland', () => {
    expect(groundsFor(CH)).toContain('swisstopo');
    expect(groundsFor(FR)).toEqual(['vector']);
  });
  it('keeps overview and corridor zooms and stays under the cap', () => {
    const p = planStrip(CH, { ground: 'swisstopo', bufferKm: 1 });
    expect(p.zooms.slice(0, 3)).toEqual(OVERVIEW_ZOOMS);
    expect(p.maxZoom).toBe(15);
    expect(p.cut).toBe(false);
    expect(p.count).toBe(p.tiles.length);
    expect(p.count).toBeLessThanOrEqual(MAX_TILES.raster);
    expect(planStrip(CH, { ground: 'vector', bufferKm: 1 }).maxZoom).toBe(14);
  });
  it('drops the top zooms of a long route to fit the cap', () => {
    const long = Array.from({ length: 60 }, (_, i) => [46.2 + i * 0.02, 6.2 + i * 0.06]);
    const full = planStrip(long, { ground: 'swisstopo', bufferKm: 2, cap: 1e9 });
    const p = planStrip(long, { ground: 'swisstopo', bufferKm: 2, cap: Math.round(full.count / 3) });
    expect(p.cut).toBe(true);
    expect(p.maxZoom).toBeLessThan(15);
    expect(p.count).toBeLessThan(full.count);
  });
  it('says too big when even zoom 12 passes the cap', () => {
    expect(planStrip(CH, { ground: 'swisstopo', bufferKm: 1, cap: 5 }).tooBig).toBe(true);
  });
  it('estimates tiles × average, plus the free map style', () => {
    expect(estimateBytes(100, 'swisstopo')).toBe(100 * AVG_KB.swisstopo * 1024);
    expect(estimateBytes(100, 'vector')).toBeGreaterThan(100 * AVG_KB.vector * 1024);
    expect(fmtBytes(500)).toBe('1 KB');
    expect(fmtBytes(300 * 1024)).toBe('300 KB');
    expect(fmtBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
    expect(fmtBytes(120 * 1024 * 1024)).toBe('120 MB');
    expect(fmtBytes(3 * 1024 ** 3)).toBe('3 GB');
  });
});

describe('the URLs of a strip', () => {
  const style = {
    version: 8,
    sprite: 'https://tiles.example.org/sprites/v1/ofm',
    glyphs: 'https://tiles.example.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      main: { type: 'vector', url: 'https://tiles.example.org/planet' },
      shade: { type: 'raster', tiles: ['https://tiles.example.org/ne/{z}/{x}/{y}.png'], maxzoom: 6 },
      pts: { type: 'geojson', data: {} },
    },
    layers: [
      { id: 'a', type: 'symbol', layout: { 'text-font': ['Noto Sans Regular'] } },
      { id: 'b', type: 'symbol', layout: { 'text-font': ['Noto Sans Bold', 'Noto Sans Regular'] } },
      { id: 'c', type: 'symbol', layout: { 'text-font': ['step', ['zoom'], ['literal', ['Noto Sans Italic']], 10, ['literal', ['Noto Sans Regular']]] } },
      { id: 'd', type: 'symbol', layout: { 'text-font': { stops: [[1, ['Noto Sans Bold']]] } } },
      { id: 'e', type: 'line' },
    ],
  };
  it('fills tile templates (xyz and tms)', () => {
    expect(fillTile('https://a/{z}/{x}/{y}.pbf', { z: 3, x: 1, y: 2 })).toBe('https://a/3/1/2.pbf');
    expect(fillTile('https://a/{z}/{x}/{y}.pbf', { z: 3, x: 1, y: 2 }, 'tms')).toBe('https://a/3/1/5.pbf');
    expect(rasterUrls('swisstopo', [{ z: 9, x: 266, y: 180 }])).toEqual(['https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/9/266/180.jpeg']);
  });
  it('reads the font stacks, glyphs and sprites from the style', () => {
    expect(fontStacks(style).sort()).toEqual(['Noto Sans Bold', 'Noto Sans Bold,Noto Sans Regular', 'Noto Sans Italic', 'Noto Sans Regular']);
    const g = glyphUrls(style);
    expect(g).toHaveLength(4 * 3);
    expect(g).toContain('https://tiles.example.org/fonts/Noto%20Sans%20Bold,Noto%20Sans%20Regular/0-255.pbf');
    expect(spriteUrls(style)).toEqual([
      'https://tiles.example.org/sprites/v1/ofm.json',
      'https://tiles.example.org/sprites/v1/ofm.png',
      'https://tiles.example.org/sprites/v1/ofm@2x.json',
      'https://tiles.example.org/sprites/v1/ofm@2x.png',
    ]);
    expect(spriteUrls({ sprite: [{ id: 'x', url: 'https://s.example.org/a' }] })).toHaveLength(4);
    expect(glyphUrls({})).toEqual([]);
    expect(spriteUrls({})).toEqual([]);
  });
  it('lists the tile sources and overzooms above maxzoom', () => {
    expect(tileSources(style).map((s) => s.id)).toEqual(['main', 'shade']);
    const tiles = [
      { z: 6, x: 33, y: 22 },
      { z: 8, x: 133, y: 90 },
      { z: 8, x: 132, y: 90 },
    ];
    const shade = sourceTileUrls(tileSources(style)[1], tiles);
    expect(shade).toEqual(['https://tiles.example.org/ne/6/33/22.png']);
    const main = sourceTileUrls({ tiles: ['https://t.example.org/v/{z}/{x}/{y}.pbf'], minzoom: 7, maxzoom: 14 }, tiles);
    expect(main).toEqual(['https://t.example.org/v/8/133/90.pbf', 'https://t.example.org/v/8/132/90.pbf']);
    expect(sourceTileUrls({}, tiles)).toEqual([]);
  });
});

describe('reference count', () => {
  it('drops only the URLs no other strip uses', () => {
    expect(urlsToDrop(['a', 'b', 'c', 'c'], [['b'], ['c', 'x']])).toEqual(['a']);
    expect(urlsToDrop(['a'], [])).toEqual(['a']);
  });
});

describe('the runner', () => {
  it('fetches 4 at a time, skips known URLs and retries once', async () => {
    let now = 0;
    let most = 0;
    const tries = {};
    const urls = Array.from({ length: 10 }, (_, i) => `u${i}`);
    const r = createRunner(urls, {
      pauseMs: 0,
      known: async (u) => (u === 'u0' ? 5 : null),
      fetchOne: async (u) => {
        tries[u] = (tries[u] ?? 0) + 1;
        now++;
        most = Math.max(most, now);
        await new Promise((res) => setTimeout(res, 1));
        now--;
        if (u === 'u3' && tries[u] === 1) throw new Error('once');
        if (u === 'u9') throw new Error('always');
        return { bytes: 10 };
      },
    });
    const res = await r.start();
    expect(most).toBeLessThanOrEqual(4);
    expect(tries.u0).toBeUndefined();
    expect(tries.u3).toBe(2);
    expect(res).toMatchObject({ state: 'done', done: 10, total: 10, bytes: 5 + 8 * 10, failed: ['u9'] });
  });
  it('pauses, resumes and cancels', async () => {
    const seen = [];
    let runner;
    runner = createRunner(
      Array.from({ length: 12 }, (_, i) => `u${i}`),
      {
        pauseMs: 0,
        concurrency: 2,
        fetchOne: async () => ({ bytes: 1 }),
        onProgress: (p) => {
          seen.push(p.state);
          if (p.done === 4 && p.state === 'running' && !seen.includes('paused')) {
            runner.pause();
            setTimeout(() => runner.resume(), 5);
          }
          if (p.done === 8 && p.state === 'running') runner.cancel();
        },
      },
    );
    const res = await runner.start();
    expect(seen).toContain('paused');
    expect(res.state).toBe('cancelled');
    expect(res.done).toBe(8);
  });
});

describe('the strip index (settings, small)', () => {
  it('adds, renames, removes with undo, and keeps no URL lists', async () => {
    const db = createDb(`map-offline-${Math.random()}`);
    await writeStrips(db, [
      { id: 's1', name: 'Strecke A', ground: 'vector', tiles: 10, bytes: 100 },
      { id: 's2', name: 'Strecke B', ground: 'swisstopo', tiles: 20, bytes: 200 },
    ]);
    await renameStrip(db, 's2', 'Neu');
    expect((await readStrips(db)).map((s) => s.name)).toEqual(['Strecke A', 'Neu']);
    const saved = await removeStrip(db, 's1');
    expect((await readStrips(db)).map((s) => s.id)).toEqual(['s2']);
    await undoRemove(db, saved);
    expect((await readStrips(db)).map((s) => s.id)).toEqual(['s1', 's2']);
    expect(JSON.stringify(await db.settings.get('offline-strips'))).not.toContain('urls');
    db.close();
  });
  it('reads the storage estimate', async () => {
    expect(await storageInfo({ storage: { estimate: async () => ({ usage: 30, quota: 100 }) } })).toEqual({ used: 30, quota: 100, free: 70 });
    expect(await storageInfo({})).toBeNull();
  });
});

describe('the offline service worker', () => {
  const code = readFileSync(new URL('../public/offline-map-sw.js', import.meta.url), 'utf8');
  const self = {};
  new Function('self', code)(self);
  const sw = self.__pgOfflineMap;
  it('mirrors the cache name and hosts of sources.js', () => {
    expect(sw.CACHE).toBe(OFFLINE_CACHE);
    expect(sw.HOSTS).toEqual(OFFLINE_HOSTS);
  });
  it('never serves OpenStreetMap or OpenTopoMap', () => {
    for (const g of GROUNDS.filter((x) => x.offline === false)) expect(sw.HOSTS).not.toContain(new URL(g.url.replace(/\{.\}/g, '0')).hostname);
  });
  it('is listed in the Workbox importScripts', () => {
    expect(readFileSync(new URL('../vite.config.js', import.meta.url), 'utf8')).toMatch(/importScripts:\s*\[[^\]]*'offline-map-sw\.js'/);
  });
  it('answers kept tiles from the cache, the style network first, and leaves the rest', () => {
    const tile = 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/9/266/180.jpeg';
    const styleUrl = 'https://tiles.openfreemap.org/styles/liberty';
    const font = 'https://tiles.openfreemap.org/fonts/Noto%20Sans%20Regular/0-255.pbf';
    const set = new Set([tile, styleUrl, font]);
    expect(sw.decide('GET', tile, set)).toBe('cache');
    expect(sw.decide('GET', font, set)).toBe('cache');
    expect(sw.decide('GET', styleUrl, set)).toBe('network-first');
    expect(sw.decide('GET', tile.replace('/180.', '/181.'), set)).toBe('pass');
    expect(sw.decide('GET', 'https://tile.openstreetmap.org/9/1/1.png', set)).toBe('pass');
    expect(sw.decide('POST', tile, set)).toBe('pass');
    expect(sw.decide('GET', tile, null)).toBe('wait');
    expect(sw.decide('GET', 'https://example.org/x', null)).toBe('pass');
  });
});
