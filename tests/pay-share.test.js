// Noah 19.10.2026 «2b»: a picture shared to the app always goes to «Dokumente» (field "doc"); the TWINT
// screenshot (mockup QR6) is chosen in Rechnungen instead (tests/e2e/twint-teilen.spec.js). A phone with the
// old manifest may still send the field "pay": it goes to Dokumente too. The service worker
// (public/share-target.js) runs here with a fake Cache. Fictional data only.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const SRC = readFileSync(fileURLToPath(new URL('../public/share-target.js', import.meta.url)), 'utf8');
const MANIFEST = readFileSync(fileURLToPath(new URL('../vite.config.js', import.meta.url)), 'utf8');

async function share(files) {
  let handler;
  const stored = new Map();
  const self = { addEventListener: (type, fn) => type === 'fetch' && (handler = fn) };
  const caches = { open: async (name) => ({ put: async (key, res) => stored.set(`${name} ${key}`, res), keys: async () => [], delete: async () => true }) };
  vm.runInNewContext(SRC, { self, caches, Response, URL, URLSearchParams, Date, Number, encodeURIComponent });
  const form = new FormData();
  for (const [name, file] of files) form.append(name, file);
  let answer;
  handler({ request: new Request('https://example.org/packgenerator/share-target', { method: 'POST', body: form }), respondWith: (p) => (answer = p) });
  const res = await answer;
  return { to: new URL(res.headers.get('location')).hash, stored };
}

describe('a picture shared to the app (Noah 19.10 «2b»)', () => {
  const png = () => new File([new Uint8Array([137, 80, 78, 71, 1, 2, 3])], 'test_twint.png', { type: 'image/png' });
  it('goes to Dokumente', async () => {
    const { to, stored } = await share([['doc', png()]]);
    expect(to).toBe('#/me/docs/scan?shared=1');
    const kept = stored.get('pg-shared-docs /packgenerator/shared-doc-0');
    expect(kept.headers.get('Content-Type')).toBe('image/png');
    expect(new Uint8Array(await kept.arrayBuffer())).toEqual(new Uint8Array([137, 80, 78, 71, 1, 2, 3]));
  });
  it('from a phone with the old manifest ("pay") goes to Dokumente too, not to Rechnungen', async () => {
    const { to, stored } = await share([['pay', png()]]);
    expect(to).toBe('#/me/docs/scan?shared=1');
    expect(decodeURIComponent(stored.get('pg-shared-docs /packgenerator/shared-doc-0').headers.get('X-File-Name'))).toBe('test_twint.png');
    const gpx = await share([['ride', new File(['<gpx></gpx>'], 'test_data_gtp_x.gpx', { type: 'application/gpx+xml' })]]);
    expect(gpx.to).not.toContain('docs');
  });
  it('the manifest offers pictures only to Dokumente', () => {
    expect(MANIFEST).not.toMatch(/name: 'pay'/);
    expect(MANIFEST).toMatch(/name: 'doc', accept: \[[^\]]*'image\/png'[^\]]*'application\/pdf'/);
  });
});
