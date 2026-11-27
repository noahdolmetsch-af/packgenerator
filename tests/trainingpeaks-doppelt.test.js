// TrainingPeaks, every workout three times (Noah 27.11.2026): TrainingPeaks gives the same workout a new UID at every fetch.
// A session is named by day and title, old copies are folded into one, nothing is lost. Entries and links are made up.
import { describe, it, expect } from 'vitest';
import { sessionsFrom, mergeFeed, foldCopies, refresh, TP_KEY } from '../src/lib/trainingpeaks.js';
import { PLAN_KEY } from '../src/lib/training.js';

const LINK = 'https://www.trainingpeaks.com/ical/TEST_aaaa-1.ics';
const TODAY = '2026-11-27';
const ics = (events) => ['BEGIN:VCALENDAR', 'VERSION:2.0', ...events.flatMap((e) => ['BEGIN:VEVENT', ...e, 'END:VEVENT']), 'END:VCALENDAR'].join('\r\n');
const feedWith = (tag) =>
  ics([
    [`UID:${tag}-1`, 'SUMMARY:Bike: Test Base', 'DTSTART;VALUE=DATE:20261128', 'DESCRIPTION:Planned duration: 1:04:00'],
    [`UID:${tag}-2`, 'SUMMARY:Bike: Test Intervals', 'DTSTART;VALUE=DATE:20261129', 'DESCRIPTION:Planned duration: 1:15:30'],
    [`UID:${tag}-3`, 'SUMMARY:Recovery Day', 'DTSTART;VALUE=DATE:20261130'],
  ]);
const memDb = (rows = {}) => {
  const m = new Map(Object.entries(rows).map(([k, v]) => [k, { key: k, value: v }]));
  return { settings: { get: async (k) => m.get(k), put: async (r) => void m.set(r.key, r) }, peek: (k) => m.get(k)?.value };
};
const serve = (make) => {
  let n = 0;
  return async () => ({ ok: true, json: async () => ({ ics: make(`u${n++}`) }) });
};
const old = (id, over = {}) => ({ id, day: '2026-11-28', kind: 'bike', name: 'Bike: Test Base', mins: 64, zone: null, src: 'tp', ...over });

describe('a workout keeps its id although TrainingPeaks changes the UID', () => {
  it('two fetches, two sets of UIDs, the same ids', () => {
    const a = sessionsFrom(feedWith('x'), TODAY).sessions;
    const b = sessionsFrom(feedWith('y'), TODAY).sessions;
    expect(a.map((s) => s.id)).toEqual(b.map((s) => s.id));
    expect(a.every((s) => s.id.startsWith('tp2-'))).toBe(true);
  });
  it('two entries with the same title on one day stay two', () => {
    const f = sessionsFrom(ics([['UID:p', 'SUMMARY:Spin', 'DTSTART;VALUE=DATE:20261128', 'DESCRIPTION:Duration: 0:30'], ['UID:q', 'SUMMARY:Spin', 'DTSTART;VALUE=DATE:20261128', 'DESCRIPTION:Duration: 0:30']]), TODAY).sessions;
    expect(f).toHaveLength(2);
    expect(new Set(f.map((s) => s.id)).size).toBe(2);
  });
  it('the fetch again and again leaves one session per workout', async () => {
    const db = memDb({ [TP_KEY]: { url: LINK } });
    const doFetch = serve(feedWith);
    for (let i = 0; i < 4; i++) await refresh(db, { doFetch, today: TODAY, force: true });
    const s = db.peek(PLAN_KEY).sessions;
    expect(s.map((x) => x.name).sort()).toEqual(['Bike: Test Base', 'Bike: Test Intervals']);
    expect(db.peek(PLAN_KEY).rest).toEqual(['2026-11-30']);
  });
  it('two fetches at once (opening the app and coming back) write one set', async () => {
    const db = memDb({ [TP_KEY]: { url: LINK } });
    const doFetch = serve(feedWith);
    await Promise.all([refresh(db, { doFetch, today: TODAY, force: true }), refresh(db, { doFetch, today: TODAY, force: true })]);
    expect(db.peek(PLAN_KEY).sessions).toHaveLength(2);
  });
  it('even without the lock: two sets with other UIDs never double', async () => {
    const db = memDb({ [TP_KEY]: { url: LINK } });
    const a = sessionsFrom(feedWith('a'), TODAY);
    const b = sessionsFrom(feedWith('b'), TODAY);
    const first = mergeFeed([], a, {});
    const second = mergeFeed(first.plan, b, {}); // a stale record of the last fetch (the other device or a race)
    expect(second.plan).toHaveLength(2);
    void db;
  });
});

describe('old copies are folded into one', () => {
  const feed = sessionsFrom(feedWith('n'), TODAY);
  const id = feed.sessions[0].id;

  it('three copies of one workout become one, with the new id', () => {
    const plan = [old('tp-a1'), old('tp-b2'), old('tp-c3')];
    const m = mergeFeed(plan, feed, {});
    const base = m.plan.filter((s) => s.name === 'Bike: Test Base');
    expect(base).toHaveLength(1);
    expect(base[0].id).toBe(id);
    expect(m.merged).toBe(2);
    expect(m.plan).toHaveLength(2); // the other workout of the feed comes in as well
  });
  it('the next fetch does not double it again', () => {
    const first = mergeFeed([old('tp-a1'), old('tp-b2'), old('tp-c3')], feed, {});
    const again = mergeFeed(first.plan, sessionsFrom(feedWith('m'), TODAY), first.seen);
    expect(again.plan.map((s) => s.id).sort()).toEqual(first.plan.map((s) => s.id).sort());
    expect(again.merged).toBe(0);
  });
  it('a tick stays, wherever it was', () => {
    const m = mergeFeed([old('tp-a1'), old('tp-b2', { done: true }), old('tp-c3')], feed, {});
    const base = m.plan.filter((s) => s.name === 'Bike: Test Base');
    expect(base).toHaveLength(1);
    expect(base[0].done).toBe(true);
  });
  it('a copy changed by hand stays as it was changed', () => {
    const m = mergeFeed([old('tp-a1'), old('tp-b2', { mins: 90 }), old('tp-c3')], feed, {});
    const base = m.plan.filter((s) => s.name === 'Bike: Test Base');
    expect(base).toHaveLength(1);
    expect(base[0].mins).toBe(90);
    const next = mergeFeed(m.plan, feed, m.seen);
    expect(next.plan.find((s) => s.name === 'Bike: Test Base').mins).toBe(90); // the next fetch does not take it back
  });
  it('an old session with its own content is not thrown away', () => {
    const plan = [old('tp-a1'), old('tp-b2', { time: '07:00' }), old('tp-c3', { mins: 20 })];
    const r = foldCopies(plan, feed, {});
    // the changed one takes the feed id, the plain copy goes, the one with its own length stays
    expect(r.plan.map((s) => s.mins).sort((a, b) => a - b)).toEqual([20, 64]);
    expect(r.merged).toBe(1);
  });
  it('a session the user moved to another day keeps its id and is not doubled', () => {
    const first = mergeFeed([], feed, {});
    const moved = first.plan.map((s) => (s.id === id ? { ...s, day: '2026-11-29' } : s));
    const next = mergeFeed(moved, feed, first.seen);
    expect(next.plan.filter((s) => s.name === 'Bike: Test Base')).toHaveLength(1);
    expect(next.plan.find((s) => s.id === id).day).toBe('2026-11-29');
  });
  it('another device already folded: its session stays, the old copies go', () => {
    const m = mergeFeed([{ ...feed.sessions[0] }, old('tp-a1'), old('tp-b2')], feed, {});
    expect(m.plan.filter((s) => s.name === 'Bike: Test Base')).toHaveLength(1);
    expect(m.merged).toBe(2);
  });
  it('copies outside the window (past days) are folded too, to one', () => {
    const past = { day: '2026-11-10' };
    const m = mergeFeed([old('tp-a1', past), old('tp-b2', past), old('tp-c3', past)], feed, {});
    expect(m.plan.filter((s) => s.day === '2026-11-10')).toHaveLength(1);
  });
  it('sessions of the user and of other sources are never touched', () => {
    const own = { id: 'own-1', day: '2026-11-28', kind: 'bike', name: 'Bike: Test Base', mins: 64, zone: null };
    const plan = mergeFeed([own, old('tp-a1')], feed, {}).plan;
    expect(plan.find((s) => s.id === 'own-1')).toBeTruthy();
  });
});
