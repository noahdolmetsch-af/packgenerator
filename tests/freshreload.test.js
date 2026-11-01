// «Neueste Version laden» (20.10.2026): online it removes the app's offline copy and reloads, so the newest
// version comes from the internet; the data and the offline maps stay. Offline it only reloads.
import { describe, it, expect, vi } from 'vitest';
import { freshReload, askForUpdate, isAppCache, cleanFreshMarker, freshUrl } from '../src/lib/freshreload.js';

function fake({ online = true } = {}) {
  const reg = { unregister: vi.fn(async () => true), update: vi.fn(async () => {}) };
  const names = ['workbox-precache-v2-https://x/packgenerator/', 'pg-offline-map', 'pg-cutout-lib'];
  return {
    reg,
    w: {
      navigator: { onLine: online, serviceWorker: { getRegistrations: async () => [reg], getRegistration: async () => reg } },
      caches: { keys: async () => names, delete: vi.fn(async () => true) },
      location: { reload: vi.fn(), replace: vi.fn(), origin: 'https://x', pathname: '/packgenerator/', hash: '#/me' },
    },
  };
}

describe('freshReload', () => {
  it('online: removes the worker and the app files, keeps the offline maps, then reloads', async () => {
    const { w, reg } = fake();
    await freshReload(w);
    expect(reg.unregister).toHaveBeenCalled();
    expect(w.caches.delete.mock.calls.map((c) => c[0])).toEqual(['workbox-precache-v2-https://x/packgenerator/']);
    // a new address, the # place stays: a stale copy at the edge cannot answer it
    expect(w.location.replace).toHaveBeenCalledTimes(1);
    expect(w.location.replace.mock.calls[0][0]).toMatch(/^https:\/\/x\/packgenerator\/\?fresh=\d+#\/me$/);
  });
  it('a step that hangs does not stop the reload', async () => {
    vi.useFakeTimers();
    const { w } = fake();
    w.navigator.serviceWorker.getRegistrations = () => new Promise(() => {});
    w.caches.keys = () => new Promise(() => {});
    const done = freshReload(w);
    await vi.advanceTimersByTimeAsync(7000);
    await done;
    vi.useRealTimers();
    expect(w.location.replace).toHaveBeenCalledTimes(1);
  });
  it('offline: only reloads, so the app still starts from its offline copy', async () => {
    const { w, reg } = fake({ online: false });
    await freshReload(w);
    expect(reg.unregister).not.toHaveBeenCalled();
    expect(w.caches.delete).not.toHaveBeenCalled();
    expect(w.location.replace).not.toHaveBeenCalled();
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
  it('the marker comes off the address again, the # place stays', () => {
    const replaceState = vi.fn();
    cleanFreshMarker({ location: { href: 'https://x/packgenerator/?fresh=1#/me' }, history: { state: null, replaceState } });
    expect(replaceState).toHaveBeenCalledWith(null, '', '/packgenerator/#/me');
    expect(freshUrl({ origin: 'https://x', pathname: '/p/', hash: '' }, 5)).toBe('https://x/p/?fresh=5');
  });
});
