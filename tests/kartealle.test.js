// «Karte aller Träume» (Träume und Neuland N14, Noah 27.10.2026 «1-5 a»): which dream brings the most new.
import { describe, it, expect } from 'vitest';
import { routedDreams, dreamNews, rankDreams } from '../src/lib/dreams/kartealle.js';

const P = 'test_data_gtp_';
// fictional square municipalities and passes along a line at latitude 47
const sq = (id, lon0) => {
  const ring = [lon0, 46.95, lon0 + 0.1, 46.95, lon0 + 0.1, 47.05, lon0, 47.05, lon0, 46.95]; // flat lon, lat as the app's data
  return { id, name: `${P}${id}`, kind: 'area', rings: [ring], bbox: [lon0, 46.95, lon0 + 0.1, 47.05], c: [lon0 + 0.05, 47] };
};
const col = (id, kind, items, visited = [], radius) => ({ id, kind, radius, items, visited: new Map(visited.map((v) => [v, { day: '2026-01-01' }])) });
const cols = [
  col('municipalities', 'area', [sq('m1', 8.0), sq('m2', 8.1), sq('m3', 8.2), sq('m4', 9.0)], ['m1']),
  col('passes', 'point', [{ id: 'p1', name: `${P}Pass`, lat: 47.0, lon: 8.15 }, { id: 'p2', name: `${P}Weit`, lat: 46.0, lon: 8.0 }], [], 0.6),
  col('lakes', 'lake', [], [], 0.3),
  col('peaks', 'point', [{ id: 'k1', name: `${P}Gipfel`, lat: 47.0, lon: 8.05 }], [], 0.25),
];
const dream = (id, line) => ({ id, title: `${P}${id}`, route: line ? { line, km: 20 } : undefined });

describe('the map of all dreams', () => {
  it('takes only dreams with a route', () => {
    expect(routedDreams([dream('a', [[47, 8.02], [47, 8.28]]), dream('b'), dream('c', [[47, 8]])]).map((d) => d.id)).toEqual(['a']);
  });

  it('counts what a route would bring for the first time, per kind, not peaks', () => {
    const news = dreamNews([dream('a', [[47, 8.02], [47, 8.28]]), dream('b', [[47, 9.02], [47, 9.08]])], cols);
    expect(news.get('a')).toEqual({ municipalities: 2, passes: 1, lakes: 0, total: 3 }); // m1 already visited
    expect(news.get('b')).toEqual({ municipalities: 1, passes: 0, lakes: 0, total: 1 });
  });

  it('ranks the dreams by what is new and numbers them for the map', () => {
    const ds = [dream('b', [[47, 9.02], [47, 9.08]]), dream('a', [[47, 8.02], [47, 8.28]]), dream('c', [[46.5, 7], [46.5, 7.1]])];
    const r = rankDreams(ds, dreamNews(ds, cols));
    expect(r.map((x) => [x.dream.id, x.no, x.news.total])).toEqual([['a', 1, 3], ['b', 2, 1], ['c', 3, 0]]);
  });
});
