// «Aus TWINT teilen» (mockup QR6, Noah 14.10.2026 04:00 «a»): a picture shared to the app goes to
// Rechnungen, kept where the app takes it (twintshot.js); a GPX still goes to the ride. The service
// worker (public/share-target.js) runs here with a fake Cache. Fictional data only.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { SHOT_CACHE, SHOT_KEY } from '../src/lib/pay/twintshot.js';

const SRC = readFileSync(fileURLToPath(new URL('../public/share-target.js', import.meta.url)), 'utf8');
const MANIFEST = readFileSync(fileURLToPath(new URL('../vite.config.js', import.meta.url)), 'utf8');

async function share(files) {
  let handler;
  const stored = new Map();
  const self = { addEventListener: (type, fn) => type === 'fetch' && (handler = fn) };
  const caches = { open: async (name) => ({ put: async (key, res) => stored.set(`${name} ${key}`, res) }) };
  vm.runInNewContext(SRC, { self, caches, Response, URL, URLSearchParams, Date, Number, encodeURIComponent });
  const form = new FormData();
  for (const [name, file] of files) form.append(name, file);
  let answer;
  handler({ request: new Request('https://example.org/packgenerator/share-target', { method: 'POST', body: form }), respondWith: (p) => (answer = p) });
  const res = await answer;
  return { to: new URL(res.headers.get('location')).hash, stored };
}

describe('a TWINT screenshot shared to the app', () => {
  it('is kept where Rechnungen takes it and opens Rechnungen', async () => {
    const png = new File([new Uint8Array([137, 80, 78, 71, 1, 2, 3])], 'test_twint.png', { type: 'image/png' });
    const { to, stored } = await share([['pay', png]]);
    expect(to).toBe('#/me/pay/invoices?shared=pay');
    const kept = stored.get(`${SHOT_CACHE} /packgenerator/${SHOT_KEY}`);
    expect(kept.headers.get('Content-Type')).toBe('image/png');
    expect(decodeURIComponent(kept.headers.get('X-File-Name'))).toBe('test_twint.png');
    expect(new Uint8Array(await kept.arrayBuffer())).toEqual(new Uint8Array([137, 80, 78, 71, 1, 2, 3]));
  });
  it('something that is not a picture is not taken as one; a GPX still goes to the ride', async () => {
    const odd = await share([['pay', new File(['hello'], 'x.txt', { type: 'text/plain' })]]);
    expect(odd.to).toBe('#/inbox');
    expect(odd.stored.size).toBe(0);
    const gpx = await share([['ride', new File(['<gpx></gpx>'], 'test_data_gtp_x.gpx', { type: 'application/gpx+xml' })]]);
    expect(gpx.to).not.toContain('shared=pay');
  });
  it('the manifest offers the app for pictures', () => {
    expect(MANIFEST).toMatch(/name: 'pay', accept: \[[^\]]*'image\/png'[^\]]*'image\/jpeg'/);
  });
});
