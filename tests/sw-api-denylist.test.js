// 19.10.2026: the service worker of the server project «packgen» (same app build) must let /api/… through,
// or the Google and Strava logins land in the app instead of their /api/…/callback.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('service worker and /api', () => {
  it('never answers a navigation to /api/… with the app', () => {
    const cfg = readFileSync(new URL('../vite.config.js', import.meta.url), 'utf8');
    const m = cfg.match(/navigateFallbackDenylist:\s*\[([^\]]*)\]/);
    expect(m).not.toBeNull();
    const list = eval(`[${m[1]}]`);
    for (const p of ['/api/google/callback', '/api/strava']) expect(list.some((re) => re.test(p))).toBe(true);
    expect(list.some((re) => re.test('/'))).toBe(false);
  });
});
