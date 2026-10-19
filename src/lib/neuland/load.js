/**
 * «Neuland»: the built-in items of each collection, loaded only when needed (every data file is its
 * own chunk via import(), nothing of it is in the app's main file). Kept in memory once loaded.
 * → [{ id, name, kind, rings?, bbox?, c?, lat?, lon?, alt?, region?, r?, kt?, en? }]
 */
import { decodeRing, bboxOf } from './geo.js';
import { slug } from './neuland.js';

const cache = new Map();

const areas = (data, extra = () => ({})) =>
  data.items.map((it) => {
    const rings = it.rings.map((r) => decodeRing(r, data.q));
    return { id: it.id, name: it.name, kind: 'area', rings, bbox: bboxOf(rings), c: [it.c[0] / data.q, it.c[1] / data.q], ...extra(it) };
  });
const points = (list, prefix) => list.map(([name, lat, lon, alt, region]) => ({ id: `${prefix}${slug(name)}`, name, kind: 'point', lat, lon, alt, region }));

const LOADERS = {
  cantons: async () => areas((await import('./data/cantons.js')).default, (it) => ({ bfs: it.bfs })),
  municipalities: async () => areas((await import('./data/municipalities.js')).default, (it) => ({ kt: it.kt })),
  countries: async () => areas((await import('./data/countries.js')).default, (it) => ({ en: it.en })),
  passes: async () => points((await import('./data/passes.js')).default, 'p-'),
  huts: async () => points((await import('./data/huts.js')).default, 'h-'),
  peaks: async () => points((await import('./data/peaks.js')).default, 'k-'),
  lakes: async () => {
    const [shapes, pts] = await Promise.all([import('./data/lakes-shapes.js'), import('./data/lakes-points.js')]);
    const big = areas(shapes.default, (it) => ({ kind: 'lake', km2: it.km2 }));
    const small = pts.default.map(([name, lat, lon, r, region]) => ({ id: `lk-${slug(name)}`, name, kind: 'point', lat, lon, r, region }));
    return [...big, ...small];
  },
};

/** The built-in items of a collection ([] for an own one). */
export function loadBase(cid) {
  if (!LOADERS[cid]) return Promise.resolve([]);
  if (!cache.has(cid)) cache.set(cid, LOADERS[cid]().catch((err) => (cache.delete(cid), Promise.reject(err))));
  return cache.get(cid);
}
