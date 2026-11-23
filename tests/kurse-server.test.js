// «Kursblick» (Noah 22.11.2026): the closing-price service of api/lake.js ?action=kurse. Invented prices only.
import { describe, it, expect } from 'vitest';
import { parseStooq, parseYahoo, cleanPoints, zurichDay, kursReihe, okAsset, isKursAnswer, stooqUrl, yahooUrl } from '../api/_lib/kurse.js';
import { makeHandler, KURSE_CACHE } from '../api/lake.js';

const csv = (rows) => ['Date,Open,High,Low,Close,Volume', ...rows.map(([d, c]) => `${d},1,2,0.5,${c},0`)].join('\n');
const DAYS = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-09'];
const rows = DAYS.map((d, i) => [d, 2000 + i]);
const yahoo = (days, off = 3600) => ({ chart: { result: [{ meta: { gmtoffset: off }, timestamp: days.map((d) => Date.parse(`${d}T08:00:00Z`) / 1000), indicators: { quote: [{ close: days.map((_, i) => 100 + i) }] } }] } });
const res = (body, ok = true) => ({ ok, status: ok ? 200 : 503, text: async () => body, json: async () => body });
const NOW = new Date('2026-11-10T07:00:00Z');

describe('parsers', () => {
  it('reads Stooq rows and skips an error text', () => {
    expect(parseStooq(csv(rows))).toHaveLength(6);
    expect(parseStooq('Exceeded the daily hits limit')).toEqual([]);
    expect(parseStooq(csv([['2026-11-02', 'N/D'], ['2026-11-03', 0]]))).toEqual([]);
  });
  it('reads Yahoo with the exchange offset, skips null closes', () => {
    const b = yahoo(['2026-11-02', '2026-11-03']);
    b.chart.result[0].indicators.quote[0].close[1] = null;
    expect(parseYahoo(b)).toEqual([['2026-11-02', 100]]);
    expect(parseYahoo({})).toEqual([]);
    // an exchange west of UTC: the close at 01:00 UTC still belongs to the day before
    const w = { chart: { result: [{ meta: { gmtoffset: -18000 }, timestamp: [Date.parse('2026-11-03T01:00:00Z') / 1000], indicators: { quote: [{ close: [5] }] } }] } };
    expect(parseYahoo(w)).toEqual([['2026-11-02', 5]]);
  });
  it('a bar of a market that trades around the clock gets the day it ends on, never a Sunday', () => {
    const at = (iso) => Date.parse(iso) / 1000;
    const g = { chart: { result: [{ meta: { gmtoffset: -18000 }, timestamp: [at('2026-10-29T22:00:00Z'), at('2026-11-01T23:00:00Z'), at('2026-11-02T05:00:00Z'), at('2026-11-22T23:00:00Z')], indicators: { quote: [{ close: [1, 2, 3, 4] }] } }] } };
    // Thursday evening starts Friday's bar, Sunday evening Monday's; a bar that starts at 05:00 UTC is that day's
    expect(parseYahoo(g, true)).toEqual([['2026-10-30', 1], ['2026-11-02', 2], ['2026-11-02', 3], ['2026-11-23', 4]]);
    // the Monday that has not been traded yet is today, so it drops out; Friday stays the last close
    expect(cleanPoints(parseYahoo(g, true), '2026-11-23')).toEqual([['2026-10-30', 1], ['2026-11-02', 3]]);
  });
  it('the Zurich day changes at local midnight, summer and winter', () => {
    expect(zurichDay('2026-07-14T22:30:00Z')).toBe('2026-07-15');
    expect(zurichDay('2026-12-14T22:30:00Z')).toBe('2026-12-14');
  });
  it('sorts, keeps one point per day and drops today and later', () => {
    expect(cleanPoints([['2026-11-03', 2], ['2026-11-02', 1], ['2026-11-03', 3], ['2026-11-10', 9]], '2026-11-10')).toEqual([['2026-11-02', 1], ['2026-11-03', 3]]);
  });
  it('builds addresses from the symbol only', () => {
    expect(stooqUrl('^smi')).toContain('s=%5Esmi');
    expect(yahooUrl('GC=F', 100.7)).toContain('GC%3DF?period1=0&period2=100');
  });
});

describe('kursReihe', () => {
  it('answers with the first source and leaves out today', async () => {
    const calls = [];
    const doFetch = async (url) => (calls.push(url), res(csv([...rows, ['2026-11-10', 9999]])));
    const a = await kursReihe('gold', { doFetch, now: NOW });
    expect(a.source).toBe('stooq');
    expect(a.last).toEqual({ day: '2026-11-09', close: 2005 });
    expect(a.since).toBe('2026-11-02');
    expect(isKursAnswer(a)).toBe(true);
    expect(calls).toHaveLength(1);
  });
  it('falls back to the second source when the first fails or answers nothing', async () => {
    const doFetch = async (url) => (url.includes('stooq') ? res('', false) : res(yahoo(DAYS)));
    expect((await kursReihe('gold', { doFetch, now: NOW })).source).toBe('yahoo');
    const doFetch2 = async (url) => (url.includes('stooq') ? res('No data') : res(yahoo(DAYS)));
    expect((await kursReihe('gold', { doFetch: doFetch2, now: NOW })).source).toBe('yahoo');
  });
  it('throws when both fail and for an unknown asset', async () => {
    await expect(kursReihe('gold', { doFetch: async () => { throw new Error('x'); }, now: NOW })).rejects.toMatchObject({ code: 'unreachable' });
    await expect(kursReihe('bitcoin', { now: NOW })).rejects.toMatchObject({ code: 'unknown' });
    expect(okAsset('toString')).toBe('');
  });
});

describe('/api/lake?action=kurse', () => {
  const handler = makeHandler({ doFetch: async () => res(csv(rows)), clock: () => NOW });
  const get = (q) => handler(new Request(`https://x.test/api/lake?action=kurse${q}`));
  it('answers with a cache header', async () => {
    const r = await get('&id=smi');
    expect(r.status).toBe(200);
    expect(r.headers.get('Cache-Control')).toBe(KURSE_CACHE);
    expect((await r.json()).last.day).toBe('2026-11-09');
  });
  it('refuses an unknown id and says 502 when no source answers', async () => {
    expect((await get('&id=x')).status).toBe(400);
    const down = makeHandler({ doFetch: async () => res('', false), clock: () => NOW });
    expect((await down(new Request('https://x.test/api/lake?action=kurse&id=gold'))).status).toBe(502);
  });
});
