// «Status aller Verbindungen» (Noah 03.11.2026 «1a»): the shared fetch line and the 2-minute limit of a Fitbit fetch. Fictional data.
import 'fake-indexeddb/auto';
import { describe, it, expect, vi } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { fetchingLine, lastOkFetchLine } from '../src/lib/ui/connstatus.js';
import { syncHealth } from '../src/lib/health.js';

const t = (k, p = {}) => k.replace(/\{(\w+)\}/g, (_, x) => p[x]);

describe('fetchingLine', () => {
  it('says name, seconds and progress', () => {
    expect(fetchingLine(t, { name: 'Fitbit', since: 0, now: 12_000, done: 30, total: 90 })).toBe('Fitbit: fetching … 12 s|sync. 30 of 90 days fetched so far.');
  });
  it('adds the hint when it takes long', () => {
    expect(fetchingLine(t, { name: 'Fitbit', since: 0, now: 100_000 })).toContain('stops by itself after 2 minutes');
  });
});

describe('lastOkFetchLine', () => {
  it('names the last success or says never', () => {
    expect(lastOkFetchLine(t, { lastOkAt: 'x', when: () => 'today 07:42' })).toBe('Last successful fetch: today 07:42.');
    expect(lastOkFetchLine(t, { lastOkAt: null, when: () => '' })).toBe('Not fetched successfully yet.');
  });
});

describe('syncHealth limit', () => {
  it('stops after the limit, keeps what came and reports progress', async () => {
    const db = createDb(`cs-${Math.random()}`);
    let ticks = 0;
    const clock = () => ticks * 130_000; // every window costs more than the limit
    const calls = [];
    const progress = [];
    const c = async (_s, { params }) => ((ticks++, calls.push(params.from)), { days: [{ date: params.to, steps: 1 }], missing: [] });
    const now = new Date('2026-11-03T08:00:00Z');
    await syncHealth(db, { c, now, clock, onProgress: (p) => progress.push(p) });
    expect(calls.length).toBe(1);
    expect(progress[0].done).toBe(0);
    expect(progress.at(-1).done).toBeGreaterThan(0);
    expect(progress.at(-1).total).toBeGreaterThanOrEqual(progress.at(-1).done);
  });
});

describe('Strava', () => {
  it('shows received rides', () => {
    expect(fetchingLine(t, { name: 'Strava', since: 0, now: 5000, done: 40, unit: 'rides' })).toBe('Strava: fetching … 5 s|sync. 40 rides received so far.');
  });
  it('a call without an answer ends with code timeout', async () => {
    const { call } = await import('../src/lib/strava/client.svelte.js');
    const hang = (_u, init) => new Promise((_ok, no) => init.signal.addEventListener('abort', () => no(new Error('aborted'))));
    vi.useFakeTimers();
    const p = call('gear', { key: 'k', doFetch: hang });
    const check = expect(p).rejects.toMatchObject({ code: 'timeout' });
    await vi.advanceTimersByTimeAsync(61_000);
    await check;
    vi.useRealTimers();
  });
  it('a fetch over the limit writes nothing', async () => {
    const { runSync } = await import('../src/lib/strava/client.svelte.js');
    const db = createDb(`st-${Math.random()}`);
    let n = 0;
    const c = async (step) => (step === 'gear' ? { bikes: [] } : { activities: [{ id: ++n, type: 'Ride', start_date: '2026-11-01T08:00:00Z', distance: 1000 }], more: true });
    let tick = 0;
    await expect(runSync(db, { call: c, now: new Date('2026-11-03T08:00:00Z'), clock: () => tick++ * 130_000 })).rejects.toMatchObject({ code: 'timeout' });
    expect(await db.kmBook.count()).toBe(0);
    expect(await db.settings.get('strava')).toBeUndefined();
  });
});

describe('Google Kalender und Aufgaben', () => {
  it('a fetch over the limit ends with timeout and keeps the old copy', async () => {
    const { fetchNow, agenda } = await import('../src/lib/agenda/client.svelte.js');
    const db = createDb(`ag-${Math.random()}`);
    await db.settings.put({ key: 'agenda', value: { calendar: true, tasks: true } });
    await db.gEvents.put({ id: 'old', title: 'Alt', day: '2026-11-03' });
    let tick = 0;
    const c = async (step) => (step === 'cal-list' ? { calendars: [{ id: 'primary', primary: true }] } : { events: [], tasks: [], lists: [] });
    const ok = await fetchNow({ db, c, today: '2026-11-03', clock: () => tick++ * 130_000 });
    expect(ok).toBe(false);
    expect(agenda.error).toBe('timeout');
    expect((await db.gEvents.toArray()).map((e) => e.id)).toEqual(['old']);
  });
});

describe('Trello', () => {
  it('a call without an answer ends with code timeout', async () => {
    const { call } = await import('../src/lib/trello/client.svelte.js');
    const hang = (_u, init) => new Promise((_ok, no) => init.signal.addEventListener('abort', () => no(new Error('aborted'))));
    vi.useFakeTimers();
    const p = call('board', { key: 'k', doFetch: hang });
    const check = expect(p).rejects.toMatchObject({ code: 'timeout' });
    await vi.advanceTimersByTimeAsync(61_000);
    await check;
    vi.useRealTimers();
  });
  it('a slow board read ends the sync before anything is written to Trello', async () => {
    const { syncNow, trello } = await import('../src/lib/trello/client.svelte.js');
    const db = createDb(`tr-${Math.random()}`);
    const steps = [];
    const c = async (step) => (steps.push(step), { board: { id: 'b'.repeat(24), name: 'Packgenerator' }, lists: [], cards: [] });
    let tick = 0;
    const ok = await syncNow({ db, c, clock: () => tick++ * 130_000 });
    expect(ok).toBe(false);
    expect(trello.error).toBe('timeout');
    expect(steps).toEqual(['board']);
  });
});
