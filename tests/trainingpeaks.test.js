// TrainingPeaks-Plan (Noah 19.11.2026 «1a 2b 3a 4a 5b»), step P2: the link rule, the entries → planned sessions,
// the merge into the plan (what stays as the user has it), the fetch with its failures. Links and entries are made up.
import { describe, it, expect, vi } from 'vitest';
import { cleanLink, maskLink, prefsOf, kindOf, zoneOf, minutesOf, sessionsFrom, mergeFeed, isStale, fetchFeed, refresh, importIcs, withoutFeed, TP_KEY, TP_SRC, TP_API } from '../src/lib/trainingpeaks.js';
import { PLAN_KEY } from '../src/lib/training.js';
import { syncLocal } from '../src/lib/db.js';
import { trainingpeaksUrl } from '../api/_lib/trainingpeaks.js';

const LINK = 'https://www.trainingpeaks.com/ical/TEST_aaaa-1.ics';
const TODAY = '2026-11-19';
const ics = (events) => ['BEGIN:VCALENDAR', 'VERSION:2.0', ...events.flatMap((e) => ['BEGIN:VEVENT', ...e, 'END:VEVENT']), 'END:VCALENDAR'].join('\r\n');
const FEED = ics([
  ['UID:a@test', 'SUMMARY:Bike - Endurance Z2', 'DTSTART:20261120T080000Z', 'DTEND:20261120T093000Z'], // 90 min, Zurich 09:00–10:30
  ['UID:b@test', 'SUMMARY:Run Intervals', 'DTSTART;VALUE=DATE:20261121', 'DESCRIPTION:Planned duration: 0:45\\nWarm up Z1\\, main set Z4'],
  ['UID:c@test', 'SUMMARY:Swim', 'DTSTART;VALUE=DATE:20261122', 'DESCRIPTION:Technique'], // no duration: left out
  ['UID:d@test', 'SUMMARY:Strength', 'DTSTART;VALUE=DATE:20261123', 'DESCRIPTION:Total time planned 1h 15m'],
]);

const memDb = (rows = {}) => {
  const m = new Map(Object.entries(rows).map(([k, v]) => [k, { key: k, value: v }]));
  return { settings: { get: async (k) => m.get(k), put: async (r) => void m.set(r.key, r) }, peek: (k) => m.get(k)?.value };
};

describe('the link', () => {
  it('takes only the TrainingPeaks calendar link', () => {
    expect(cleanLink(` ${LINK} `)).toBe(LINK);
    expect(cleanLink('webcal://www.trainingpeaks.com/ical/TEST_aaaa-1.ics')).toBe(LINK);
    for (const bad of ['', 'nonsense', 'http://www.trainingpeaks.com/ical/abc123.ics', 'https://example.com/ical/abc123.ics', 'https://trainingpeaks.com.evil.com/ical/abc123.ics', 'https://www.trainingpeaks.com/ical/abc123', 'https://me:pw@www.trainingpeaks.com/ical/abc123.ics']) expect(cleanLink(bad), bad).toBe('');
  });
  it('the app and the server agree', () => {
    for (const u of [LINK, 'https://example.com/ical/abc123.ics', 'https://www.trainingpeaks.com/ical/a.ics', 'http://www.trainingpeaks.com/ical/abc123.ics']) expect(!!trainingpeaksUrl(u), u).toBe(!!cleanLink(u));
  });
  it('shows it hidden', () => {
    expect(maskLink(LINK)).not.toMatch(/TEST_/);
    expect(maskLink('x')).toBe('');
  });
  it('stays on this device: no backup, no sync', () => {
    expect(syncLocal('settings', TP_KEY)).toBe(true);
  });
  it('the record is cleaned', () => {
    expect(prefsOf(null)).toMatchObject({ url: '', on: true, found: 0 });
    expect(prefsOf({ url: LINK, on: false, seen: { 'tp-abc': 'x', evil: 'y' } })).toMatchObject({ url: LINK, on: false, seen: { 'tp-abc': 'x' } });
  });
});

describe('one entry → one planned session', () => {
  it('kind from the title', () => {
    expect(['Bike - Endurance', 'Rennrad Grundlage', 'Zwift Race', 'Ride'].map(kindOf)).toEqual(['bike', 'bike', 'bike', 'bike']);
    expect(['Run Intervals', 'Lauf locker', 'Jogging'].map(kindOf)).toEqual(['run', 'run', 'run']);
    expect(['Hike', 'Wanderung'].map(kindOf)).toEqual(['hike', 'hike']);
    expect(['Swim', 'Strength', 'Grad der Kraft'].map(kindOf)).toEqual(['other', 'other', 'other']);
  });
  it('a zone only when exactly one is named', () => {
    expect(zoneOf('Bike Z2')).toBe(2);
    expect(zoneOf('Endurance', 'Stay in zone 3 all the time')).toBe(3);
    expect(zoneOf('Run', 'Warm up Z1, main set Z4')).toBeNull();
    expect(zoneOf('Z2-Z3 mixed')).toBeNull();
    expect(zoneOf('Bike', 'Zones are fun')).toBeNull();
    expect(zoneOf('Easy spin')).toBeNull();
  });
  it('minutes from start and end, else from the text, else none', () => {
    expect(minutesOf({ day: '2026-11-20', lastDay: '2026-11-20', allDay: false, from: '09:00', to: '10:30', note: '' })).toBe(90);
    expect(minutesOf({ allDay: true, note: 'Duration: 1:30' })).toBe(90);
    expect(minutesOf({ allDay: true, note: 'Total time planned 1h 15m' })).toBe(75);
    expect(minutesOf({ allDay: true, note: 'about 45 min easy' })).toBe(45);
    expect(minutesOf({ allDay: true, note: 'Technique' })).toBeNull();
    expect(minutesOf({ allDay: false, day: '2026-11-20', lastDay: '2026-11-20', from: '09:00', to: null, note: '' })).toBeNull();
  });
  it('the feed gives sessions with src tp and counts the ones without a duration', () => {
    const f = sessionsFrom(FEED, TODAY);
    expect(f.sessions.map((s) => [s.day, s.kind, s.name, s.mins, s.zone, s.src])).toEqual([
      ['2026-11-20', 'bike', 'Bike - Endurance Z2', 90, 2, TP_SRC],
      ['2026-11-21', 'run', 'Run Intervals', 45, null, TP_SRC],
      ['2026-11-23', 'other', 'Strength', 75, null, TP_SRC],
    ]);
    expect(f.skipped).toBe(1);
    expect(f.from).toBe('2026-11-14');
    expect(f.to).toBe('2026-12-03');
    expect(new Set(f.sessions.map((s) => s.id)).size).toBe(3);
    expect(sessionsFrom(FEED, TODAY).sessions[0].id).toBe(f.sessions[0].id);
  });
});

describe('the merge into the plan', () => {
  const feed = sessionsFrom(FEED, TODAY);
  const own = { id: 'mine', day: '2026-11-20', kind: 'run', name: 'Own run', mins: 30, zone: 2 };
  it('adds the sessions and remembers what the feed said', () => {
    const m = mergeFeed([own], feed, {});
    expect(m.added).toBe(3);
    expect(m.plan).toHaveLength(4);
    expect(Object.keys(m.seen)).toHaveLength(3);
  });
  it('takes a change from TrainingPeaks and drops an entry that is gone', () => {
    const first = mergeFeed([own], feed, {});
    const moved = { ...feed, sessions: [{ ...feed.sessions[0], mins: 60 }, feed.sessions[1]] }; // third entry gone, first shorter
    const m = mergeFeed(first.plan, moved, first.seen);
    expect(m.changed).toBe(1);
    expect(m.removed).toBe(1);
    expect(m.plan.find((s) => s.id === feed.sessions[0].id).mins).toBe(60);
    expect(m.plan.some((s) => s.id === feed.sessions[2].id)).toBe(false);
    expect(m.plan.some((s) => s.id === 'mine')).toBe(true);
  });
  it('leaves a session the user changed, ticked or took out', () => {
    const first = mergeFeed([own], feed, {});
    const [a, b, c] = feed.sessions;
    const edited = first.plan.map((s) => (s.id === a.id ? { ...s, mins: 20 } : s.id === b.id ? { ...s, done: true } : s)).filter((s) => s.id !== c.id);
    const m = mergeFeed(edited, { ...feed, sessions: [{ ...a, mins: 100 }, { ...b, mins: 50 }, c] }, first.seen);
    expect(m.plan.find((s) => s.id === a.id).mins).toBe(20);
    expect(m.plan.find((s) => s.id === b.id)).toMatchObject({ mins: 45, done: true });
    expect(m.plan.some((s) => s.id === c.id)).toBe(false);
    expect(m.added).toBe(0);
    const gone = mergeFeed(edited, { ...feed, sessions: [] }, first.seen);
    expect(gone.plan.some((s) => s.id === a.id)).toBe(true);
    expect(gone.plan.some((s) => s.id === b.id)).toBe(true);
  });
  it('touches nothing outside the window of the feed, and nothing without src tp', () => {
    const old = { id: 'tp-old', day: '2026-01-05', kind: 'bike', name: 'Old', mins: 60, zone: null, src: TP_SRC };
    const m = mergeFeed([old, own], { sessions: [], skipped: 0, from: '2026-11-14', to: '2026-12-03' }, { 'tp-old': 'x' });
    expect(m.plan).toHaveLength(2);
  });
  it('a plan session of another device (no memory of the feed) is never overwritten or doubled', () => {
    const [a] = feed.sessions;
    const m = mergeFeed([{ ...a, mins: 15 }], { ...feed, sessions: [a] }, {});
    expect(m.plan.filter((s) => s.id === a.id)).toEqual([{ ...a, mins: 15 }]);
  });
  it('taking the link out removes only open future sessions of the feed', () => {
    const plan = [{ ...feed.sessions[0] }, { ...feed.sessions[1], done: true }, { id: 'old', day: '2026-11-10', kind: 'bike', name: 'x', mins: 30, zone: null, src: TP_SRC }, own];
    expect(withoutFeed(plan, TODAY).map((s) => s.id)).toEqual([feed.sessions[1].id, 'old', 'mine']);
  });
});

describe('fetching', () => {
  const ok = () => vi.fn(async () => new Response(JSON.stringify({ ics: FEED }), { status: 200 }));
  it('asks the app\'s server with the link in the body, never in the address', async () => {
    const doFetch = ok();
    const r = await fetchFeed(LINK, { doFetch, today: TODAY });
    expect(r.ok).toBe(true);
    expect(r.feed.sessions).toHaveLength(3);
    const [url, init] = doFetch.mock.calls[0];
    expect(url).toBe(TP_API);
    expect(url).not.toContain('TEST_');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body).url).toBe(LINK);
    expect(await fetchFeed('nonsense', { doFetch })).toEqual({ ok: false, code: 'no_link' });
  });
  it('adds a link, writes the plan and the record, and fetches again only when due', async () => {
    const db = memDb({ [PLAN_KEY]: { sessions: [{ id: 'mine', day: '2026-11-20', kind: 'run', name: 'Own', mins: 30, zone: 2 }] } });
    const now = Date.parse('2026-11-19T08:00:00.000Z');
    const r = await refresh(db, { doFetch: ok(), now, today: TODAY, url: LINK });
    expect(r).toMatchObject({ ok: true, added: 3, skipped: 1, found: 3 });
    expect(db.peek(PLAN_KEY).sessions).toHaveLength(4);
    expect(db.peek(TP_KEY)).toMatchObject({ url: LINK, on: true, error: '', found: 3, skipped: 1 });
    const quiet = ok();
    expect(await refresh(db, { doFetch: quiet, now: now + 10 * 60_000, today: TODAY })).toEqual({ ok: true, notDue: true });
    expect(quiet).not.toHaveBeenCalled();
    const again = await refresh(db, { doFetch: ok(), now: now + 2 * 3600_000, today: TODAY });
    expect(again).toMatchObject({ ok: true, added: 0, changed: 0, removed: 0 });
    expect(db.peek(PLAN_KEY).sessions).toHaveLength(4);
  });
  it('keeps the plan and the reason when it fails; a failed first try saves nothing', async () => {
    const bad = vi.fn(async () => new Response(JSON.stringify({ code: 'link_invalid' }), { status: 502 }));
    const empty = memDb();
    expect(await refresh(empty, { doFetch: bad, today: TODAY, url: LINK })).toEqual({ ok: false, code: 'link_invalid', status: null });
    expect(empty.peek(TP_KEY)).toBeUndefined();
    const db = memDb({ [TP_KEY]: { url: LINK, on: true, fetchedAt: '2026-11-01T00:00:00.000Z' }, [PLAN_KEY]: { sessions: [{ id: 'x', day: '2026-11-20', kind: 'bike', name: 'x', mins: 30, zone: null, src: TP_SRC }] } });
    expect((await refresh(db, { doFetch: bad, today: TODAY, force: true })).ok).toBe(false);
    expect(db.peek(TP_KEY).error).toBe('link_invalid');
    expect(db.peek(PLAN_KEY).sessions).toHaveLength(1);
  });
  it('passes on the status the server names, a number only', async () => {
    const refused = vi.fn(async () => new Response(JSON.stringify({ code: 'refused', status: 403, message: 'x' }), { status: 502 }));
    expect(await fetchFeed(LINK, { doFetch: refused, today: TODAY })).toEqual({ ok: false, code: 'refused', status: 403 });
    const odd = vi.fn(async () => new Response(JSON.stringify({ code: 'refused', status: 'TEST_aaaa-1' }), { status: 502 }));
    expect((await fetchFeed(LINK, { doFetch: odd, today: TODAY })).status).toBeNull();
    expect(await refresh(memDb(), { doFetch: refused, today: TODAY, url: LINK })).toEqual({ ok: false, code: 'refused', status: 403 });
  });
  it('reads a calendar file by hand: the same plan rules, once, no link needed', async () => {
    const db = memDb({ [PLAN_KEY]: { sessions: [{ id: 'mine', day: '2026-11-20', kind: 'run', name: 'Own', mins: 30, zone: 2 }] } });
    const now = Date.parse('2026-11-19T08:00:00.000Z');
    const r = await importIcs(db, FEED, { now, today: TODAY });
    expect(r).toMatchObject({ ok: true, added: 3, skipped: 1, found: 3 });
    expect(db.peek(PLAN_KEY).sessions).toHaveLength(4);
    expect(db.peek(TP_KEY)).toMatchObject({ url: '', error: '', found: 3 });
    expect(prefsOf(db.peek(TP_KEY)).url).toBe('');
    const again = await importIcs(db, FEED, { now, today: TODAY });
    expect(again).toMatchObject({ ok: true, added: 0, changed: 0, removed: 0 });
    expect(db.peek(PLAN_KEY).sessions).toHaveLength(4);
  });
  it('a file that is no calendar changes nothing; a saved link stays', async () => {
    const db = memDb({ [TP_KEY]: { url: LINK, on: true } });
    expect(await importIcs(db, '<html>login</html>', { today: TODAY })).toEqual({ ok: false, code: 'not_calendar' });
    expect(db.peek(PLAN_KEY)).toBeUndefined();
    await importIcs(db, FEED, { today: TODAY });
    expect(db.peek(TP_KEY).url).toBe(LINK);
  });
  it('a link that is off is not fetched', () => {
    expect(isStale({ on: false, url: LINK, fetchedAt: null })).toBe(false);
    expect(isStale({ on: true, url: '', fetchedAt: null })).toBe(false);
    expect(isStale({ on: true, url: LINK, fetchedAt: null })).toBe(true);
  });
});
