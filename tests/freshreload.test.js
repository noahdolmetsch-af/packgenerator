// «Neueste Version laden» (20.10.2026): online it removes the app's offline copy and reloads, so the newest
// version comes from the internet; the data and the offline maps stay. Offline it only reloads.
import { describe, it, expect, vi } from 'vitest';
import { freshReload, askForUpdate, isAppCache } from '../src/lib/freshreload.js';

function fake({ online = true } = {}) {
  const reg = { unregister: vi.fn(async () => true), update: vi.fn(async () => {}) };
  const names = ['workbox-precache-v2-https://x/packgenerator/', 'pg-offline-map', 'pg-cutout-lib'];
  return {
    reg,
    w: {
      navigator: { onLine: online, serviceWorker: { getRegistrations: async () => [reg], getRegistration: async () => reg } },
      caches: { keys: async () => names, delete: vi.fn(async () => true) },
      location: { reload: vi.fn() },
    },
  };
}

describe('freshReload', () => {
  it('online: removes the worker and the app files, keeps the offline maps, then reloads', async () => {
    const { w, reg } = fake();
    await freshReload(w);
    expect(reg.unregister).toHaveBeenCalled();
    expect(w.caches.delete.mock.calls.map((c) => c[0])).toEqual(['workbox-precache-v2-https://x/packgenerator/']);
    expect(w.location.reload).toHaveBeenCalledTimes(1);
  });
  it('offline: only reloads, so the app still starts from its offline copy', async () => {
    const { w, reg } = fake({ online: false });
    await freshReload(w);
    expect(reg.unregister).not.toHaveBeenCalled();
    expect(w.caches.delete).not.toHaveBeenCalled();
    expect(w.location.reload).toHaveBeenCalledTimes(1);
  });
  it('the data is never touched: no IndexedDB or storage call exists in the file', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../src/lib/freshreload.js', import.meta.url), 'utf8').replace(/\/\/.*$/gm, '');
    expect(src).not.toMatch(/indexedDB|localStorage|sessionStorage|deleteDatabase/);
    expect(isAppCache('pg-offline-map')).toBe(false);
  });
  it('askForUpdate asks the worker for a new version', async () => {
    const { w, reg } = fake();
    await askForUpdate(w);
    expect(reg.update).toHaveBeenCalled();
  });
});
