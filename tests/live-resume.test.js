// Live-Karte «Absturz» (Noah 20.10.2026): a ride is never cut by an automatic reload, and after a reload
// the live map picks the open ride up again by itself.
import { describe, it, expect, vi } from 'vitest';
import { resumeOf, RESUME_MIN } from '../src/lib/live/resume.js';
import { hold, held } from '../src/lib/holdreload.js';
import { watchUpdates } from '../src/lib/swupdate.js';
import { loadPage } from '../src/lib/nav/lazy.js';

const T = Date.parse('2026-10-20T17:20:00Z');
const open = { id: 'rec-1', kind: 'rec', open: true, tripId: 't1', startAt: T - 30 * 60_000, endAt: T - 60_000, pts: [] };

describe('resumeOf', () => {
  it('picks up a recent open ride of the same tour', () => {
    expect(resumeOf(open, 't1', T)).toBe(open);
  });
  it('not another tour, not a closed ride, not an old one', () => {
    expect(resumeOf(open, 't2', T)).toBeNull();
    expect(resumeOf(open, '', T)).toBeNull();
    expect(resumeOf({ ...open, open: false }, 't1', T)).toBeNull();
    expect(resumeOf(open, 't1', open.endAt + (RESUME_MIN + 1) * 60_000)).toBeNull();
    expect(resumeOf(null, 't1', T)).toBeNull();
  });
  it('a ride without a tour on the page without a tour', () => {
    const free = { ...open, tripId: null };
    expect(resumeOf(free, '', T)).toBe(free);
    expect(resumeOf(free, 't1', T)).toBeNull();
  });
});

function fakeWindow() {
  const on = {};
  const sw = { controller: {}, addEventListener: (k, f) => (on[k] = f), getRegistration: async () => null };
  const d = { visibilityState: 'visible', activeElement: null, addEventListener: (k, f) => (on['d:' + k] = f) };
  const w = { navigator: { serviceWorker: sw }, document: d, location: { reload: vi.fn() }, setInterval: () => 0, setTimeout: () => 0 };
  return { w, on, d };
}

describe('no reload in the middle of a ride', () => {
  it('a new version waits while recording, then loads when the app goes to the background', () => {
    const { w, on, d } = fakeWindow();
    const release = hold('recording');
    const h = watchUpdates(w, { behind: async () => {} });
    on.controllerchange();
    expect(w.location.reload).not.toHaveBeenCalled();
    expect(h.reloadPending()).toBe(true);
    d.visibilityState = 'hidden';
    on['d:visibilitychange']();
    expect(w.location.reload).not.toHaveBeenCalled();
    release();
    expect(held()).toBe(false);
    on['d:visibilitychange']();
    expect(w.location.reload).toHaveBeenCalledTimes(1);
  });
  it('without a ride it reloads at once as before', () => {
    const { w, on } = fakeWindow();
    watchUpdates(w, { behind: async () => {} });
    on.controllerchange();
    expect(w.location.reload).toHaveBeenCalledTimes(1);
  });
  it('a missing page part does not reload during a ride', async () => {
    const release = hold('recording');
    const reload = vi.fn();
    const err = new Error('chunk gone');
    await expect(loadPage(() => Promise.reject(err), { reload, store: null, now: T })).rejects.toBe(err);
    expect(reload).not.toHaveBeenCalled();
    release();
  });
});

describe('OpenStreetMap: one request at a time', () => {
  it('two searches at once wait for each other', async () => {
    const { fetchOverpass } = await import('../src/lib/route/pois.js');
    let open = 0;
    let most = 0;
    const fetcher = async () => {
      open++;
      most = Math.max(most, open);
      await new Promise((r) => setTimeout(r, 20));
      open--;
      return { ok: true, status: 200, json: async () => ({ elements: [] }) };
    };
    await Promise.all([fetchOverpass('a', { fetcher, urls: ['u'] }), fetchOverpass('b', { fetcher, urls: ['u'] })]);
    expect(most).toBe(1);
  });
});
