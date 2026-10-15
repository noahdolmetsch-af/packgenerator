// «Ich habe bezahlt» (mockup QR5, Noah 14.10.2026 04:00 «a»): the payer link, the report box on the
// server (fake Redis) and matching reports to open invoices. Fictional data only.
import { describe, it, expect, vi } from 'vitest';
import { makeHandler } from '../api/pay.js';
import { boxOf as serverBox, readReport } from '../api/_lib/report.js';
import { boxOf, payLink, readLink, reportsForOpen, sendReport, fetchReports, forgetReports, readKey, KEY_LS } from '../src/lib/pay/report.js';
import { invoiceMail } from '../src/lib/pay/invoices.js';

const REDIS = 'https://redis.example.test';
const KEY = 'a'.repeat(64);
const ACCOUNT = { iban: 'CH44 3199 9123 0008 8901 2', name: 'Beispiel Velo-Werkstatt', twint: '079 000 00 00' };
const INV = { no: 'R-0317', name: 'Mia Beispiel', amount: 8000, purpose: 'Tennisstunde 60 min', ref: '210000000003139471430009017', ways: { qr: true, twint: true }, status: 'open', email: '' };

function store() {
  const kv = {};
  const doFetch = vi.fn(async (url, init = {}) => {
    if (url === REDIS) {
      const [cmd, k, ...rest] = JSON.parse(init.body);
      if (cmd === 'RPUSH') return Response.json({ result: (kv[k] = [...(kv[k] ?? []), ...rest]).length });
      if (cmd === 'LRANGE') return Response.json({ result: kv[k] ?? [] });
      if (cmd === 'LTRIM') {
        kv[k] = (kv[k] ?? []).slice(Number(rest[0]));
        return Response.json({ result: 'OK' });
      }
      if (cmd === 'DEL') return Response.json({ result: delete kv[k] ? 1 : 0 });
      return Response.json({ result: 1 });
    }
    // the app talks to the handler
    const req = new Request(url, { ...init, headers: { ...init.headers, origin: 'http://localhost:5173' } });
    return handler(req);
  });
  const handler = makeHandler({ env: () => ({ mode: 'off', redisUrl: REDIS, redisToken: 'r' }), doFetch, now: () => 1_800_000_000_000 });
  return { kv, doFetch, handler };
}

describe('the payer link', () => {
  it('uses the same box on the device and on the server, and the key never leaves', async () => {
    const box = await boxOf(KEY);
    expect(box).toBe(serverBox(KEY));
    const link = payLink(INV, ACCOUNT, box, 'https://example.test/');
    expect(link.startsWith('https://example.test/#/zahlen/')).toBe(true);
    expect(link).not.toContain(KEY);
    expect(readLink(link.split('#/zahlen/')[1])).toEqual({ box, no: 'R-0317', amount: 8000, purpose: 'Tennisstunde 60 min', from: 'Beispiel Velo-Werkstatt', twint: '079 000 00 00', iban: ACCOUNT.iban, ref: INV.ref });
  });
  it('carries only the ways that are switched on; a broken link gives null', async () => {
    const box = await boxOf(KEY);
    const only = readLink(payLink({ ...INV, ways: { qr: false, twint: true } }, ACCOUNT, box).split('#/zahlen/')[1]);
    expect(only).toMatchObject({ twint: '079 000 00 00', iban: '', ref: '' });
    expect(readLink('nonsense')).toBeNull();
    expect(readLink('')).toBeNull();
  });
  it('goes into the invoice mail', () => {
    const tr = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
    expect(invoiceMail(INV, ACCOUNT, tr, 'https://x.test/#/zahlen/abc').body).toContain('https://x.test/#/zahlen/abc');
    expect(invoiceMail(INV, ACCOUNT, tr).body).not.toContain('#/zahlen/');
  });
  it('keeps one key per device', () => {
    const mem = new Map();
    vi.stubGlobal('localStorage', { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) });
    expect(readKey(false)).toBeNull();
    const k = readKey();
    expect(k).toMatch(/^[0-9a-f]{64}$/);
    expect(readKey()).toBe(k);
    expect(mem.get(KEY_LS)).toBe(k);
    vi.unstubAllGlobals();
  });
});

describe('the report box on the server', () => {
  it('checks reports strictly', () => {
    expect(readReport({ box: 'f'.repeat(32), no: 'R-0317', way: 'twint' })).toBeTruthy();
    expect(readReport({ box: 'f'.repeat(31), no: 'R-0317', way: 'twint' })).toBeNull();
    expect(readReport({ box: 'f'.repeat(32), no: '<script>', way: 'twint' })).toBeNull();
    expect(readReport({ box: 'f'.repeat(32), no: 'R-0317', way: 'cash' })).toBeNull();
  });
  it('a payer reports, only the key holder reads, and handled reports go away', async () => {
    const { kv, doFetch } = store();
    const box = await boxOf(KEY);
    await sendReport(box, 'R-0317', 'twint', doFetch);
    await sendReport(box, 'R-0318', 'qr', doFetch);
    const stored = JSON.stringify(kv);
    expect(stored).toContain('R-0317');
    expect(stored).not.toContain('Mia');
    const reports = await fetchReports(KEY, doFetch);
    expect(reports.map((r) => [r.no, r.way, r.at])).toEqual([['R-0317', 'twint', 1_800_000_000], ['R-0318', 'qr', 1_800_000_000]]);
    expect(await fetchReports('b'.repeat(64), doFetch)).toEqual([]);
    await forgetReports([reports[0].id], KEY, doFetch);
    expect((await fetchReports(KEY, doFetch)).map((r) => r.no)).toEqual(['R-0318']);
  });
  it('without the store the payer gets an error and the writer an empty list', async () => {
    const doFetch = async (url, init) => makeHandler({ env: () => ({}) })(new Request(url, { ...init, headers: { ...init.headers, origin: 'http://localhost:5173' } }));
    await expect(sendReport('f'.repeat(32), 'R-0317', 'twint', doFetch)).rejects.toThrow();
    expect(await fetchReports(KEY, doFetch)).toEqual([]);
  });
});

describe('matching reports', () => {
  it('only open invoices with that number', () => {
    const r = [{ id: '1', no: 'R-0317', way: 'twint', at: 1 }, { id: '2', no: 'R-0999', way: 'qr', at: 1 }, { id: '3', no: 'R-0318', way: 'qr', at: 1 }];
    const list = [INV, { ...INV, no: 'R-0318', status: 'paid' }];
    expect(reportsForOpen(r, list).map((x) => x.report.id)).toEqual(['1']);
  });
});
