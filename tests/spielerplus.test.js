// Spielerplus-Kalender (Noah 06.11.2026 «1a 2a 3a 4a 5a»): the link rule, the dates, the week, «Heute fällig», the
// fetch with its failures, and the server function that may only read spielerplus.de. Links and dates are made up.
import { describe, it, expect, vi } from 'vitest';
import { cleanLink, maskLink, eventsFrom, prefsOf, allEvents, upcoming, dueToday, spielerWeek, signupHref, isStale, fetchLink, refreshAll, SP_KEY, newCalId } from '../src/lib/spielerplus.js';
import { dueToday as dueTodayLine } from '../src/lib/home/duetoday.js';
import { buildWeek } from '../src/lib/woche.js';
import { syncLocal } from '../src/lib/db.js';
import { makeHandler } from '../api/linkcheck.js';
import { spielerplusUrl } from '../api/_lib/spielerplus.js';

const LINK = 'https://www.spielerplus.de/events/ics?t=TEST_aaaa-1&u=TEST_bbbb-2';
const LINK2 = 'https://www.spielerplus.de/events/ics?t=TEST_cccc-3&u=TEST_dddd-4';
const ICS = [
  'BEGIN:VCALENDAR', 'VERSION:2.0',
  'BEGIN:VEVENT', 'UID:e1@test', 'SUMMARY:Training Erwachsene', 'DTSTART:20261111T180000Z', 'DTEND:20261111T193000Z', 'LOCATION:Halle Nord', 'URL:https://www.spielerplus.de/events/view?id=1', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:e2@test', 'SUMMARY:Heimspiel', 'DTSTART:20261114T130000Z', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:old@test', 'SUMMARY:Altes Training', 'DTSTART:20260101T180000Z', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:x@test', 'SUMMARY:Abgesagt', 'DTSTART:20261112T180000Z', 'STATUS:CANCELLED', 'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n');
const TODAY = '2026-11-06';

const memDb = (rec) => {
  let row = rec ? { key: SP_KEY, value: rec } : undefined;
  return { settings: { get: async () => row, put: async (r) => void (row = r) }, peek: () => row?.value };
};

describe('the calendar link', () => {
  it('takes only the Spielerplus calendar link with both keys', () => {
    expect(cleanLink(` ${LINK} `)).toBe(LINK);
    for (const bad of ['', 'nonsense', 'http://www.spielerplus.de/events/ics?t=abc&u=def', 'https://example.com/events/ics?t=abc&u=def', 'https://spielerplus.de.evil.com/events/ics?t=abc&u=def', 'https://www.spielerplus.de/events/calendar?date=2026-11-06', 'https://www.spielerplus.de/events/ics?t=abc', 'https://www.spielerplus.de/events/ics?t=a&u=b', 'https://me:pw@www.spielerplus.de/events/ics?t=abc&u=def']) expect(cleanLink(bad), bad).toBe('');
  });
  it('shows it hidden', () => {
    expect(maskLink(LINK)).not.toMatch(/TEST_/);
    expect(maskLink('x')).toBe('');
  });
  it('the app and the server agree on what is allowed', () => {
    for (const u of [LINK, 'https://example.com/events/ics?t=abc&u=def', 'https://www.spielerplus.de/events/ics?t=abc', 'http://www.spielerplus.de/events/ics?t=abc&u=def']) expect(!!spielerplusUrl(u), u).toBe(!!cleanLink(u));
  });
  it('is kept on this device: no backup, no sync', () => {
    expect(syncLocal('settings', SP_KEY)).toBe(true);
  });
});

describe('the dates', () => {
  const events = eventsFrom(ICS, TODAY);
  it('reads the coming dates, not the old or the cancelled ones', () => {
    expect(events.map((e) => [e.title, e.day, e.from, e.where])).toEqual([
      ['Training Erwachsene', '2026-11-11', '19:00', 'Halle Nord'],
      ['Heimspiel', '2026-11-14', '14:00', ''],
    ]);
  });
  it('«Anmelden» opens the page of the date, else the calendar of that day; never the private link', () => {
    expect(signupHref(events[0])).toBe('https://www.spielerplus.de/events/view?id=1');
    expect(signupHref(events[1])).toBe('https://www.spielerplus.de/events/calendar?date=2026-11-14');
    expect(signupHref({ day: '2026-11-14', link: LINK })).toBe('https://www.spielerplus.de/events/calendar?date=2026-11-14');
    expect(signupHref({ day: '2026-11-14', link: 'https://evil.example/x' })).toBe('https://www.spielerplus.de/events/calendar?date=2026-11-14');
  });
  it('several teams: each date knows its team; a team that is off is left out', () => {
    const prefs = prefsOf({ cals: [{ id: 'c1', name: 'Team A', url: LINK, events }, { id: 'c2', name: 'Team B', url: LINK2, events: [{ id: 'z', title: 'Eistraining', day: '2026-11-11', from: '17:00', allDay: false }] }, { id: 'c3', url: 'bad' }] });
    expect(prefs.cals.map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(allEvents(prefs).map((e) => [e.day, e.from, e.calName])).toEqual([['2026-11-11', '17:00', 'Team B'], ['2026-11-11', '19:00', 'Team A'], ['2026-11-14', '14:00', 'Team A']]);
    prefs.cals[1].on = false;
    expect(allEvents(prefs)).toHaveLength(2);
    expect(newCalId(prefs.cals)).toBe('c3');
  });
  it('upcoming keeps today\'s date until it is over', () => {
    const e = [{ id: 'a', title: 'T', day: TODAY, lastDay: TODAY, allDay: false, from: '19:00', to: '20:30' }];
    expect(upcoming(e, TODAY, 5, '20:00')).toHaveLength(1);
    expect(upcoming(e, TODAY, 5, '21:00')).toHaveLength(0);
  });
});

describe('week and Heute', () => {
  const prefs = prefsOf({ cals: [{ id: 'c1', name: 'Team A', url: LINK, act: 'hockey', events: eventsFrom(ICS, TODAY) }] });
  it('the week gets the dates with the word Spielerplus and the way to sign up', () => {
    expect(spielerWeek(prefs, '2026-11-09').map((x) => [x.day, x.time, x.src, x.name])).toEqual([['2026-11-11', '19:00', 'spielerplus', 'Team A'], ['2026-11-14', '14:00', 'spielerplus', 'Team A']]);
    const w = buildWeek({ monday: '2026-11-09', today: TODAY, spielerplus: prefs });
    const d = w.days.find((x) => x.day === '2026-11-11');
    const en = d.entries.find((x) => x.id.startsWith('sp:'));
    expect(en).toMatchObject({ kind: 'date', title: 'Training Erwachsene', time: '19:00', sub: { src: 'spielerplus', name: 'Team A' }, ext: true });
    expect(en.href).toMatch(/^https:\/\/www\.spielerplus\.de\//);
    expect(buildWeek({ monday: '2026-11-09', today: TODAY, spielerplus: { cals: [] } }).days.flatMap((x) => x.entries).some((x) => x.id.startsWith('sp:'))).toBe(false);
  });
  it('Heute fällig names today\'s dates and opens the sport page', () => {
    expect(dueToday(prefs, TODAY)).toEqual([]);
    const sp = dueToday(prefs, '2026-11-11');
    expect(sp).toHaveLength(1);
    const line = dueTodayLine({ today: '2026-11-11', sp });
    expect(line).toEqual([expect.objectContaining({ kind: 'sp', name: 'Training Erwachsene', time: '19:00', href: '#/flow/sport/act%3Ahockey' })]);
  });
});

describe('fetching', () => {
  const ok = () => vi.fn(async () => new Response(JSON.stringify({ ics: ICS }), { status: 200 }));
  it('asks the app\'s server with the link in the body, never in the address', async () => {
    const doFetch = ok();
    const r = await fetchLink(LINK, { doFetch, today: TODAY });
    expect(r.ok).toBe(true);
    expect(r.events).toHaveLength(2);
    const [url, init] = doFetch.mock.calls[0];
    expect(url).not.toContain('TEST_');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body).url).toBe(LINK);
    expect(await fetchLink('nonsense', { doFetch })).toEqual({ ok: false, code: 'no_link' });
  });
  it('keeps the old dates and the reason when it fails; fetches only when due', async () => {
    const old = [{ id: 'k', title: 'Altes', day: '2026-11-12', lastDay: '2026-11-12', allDay: true }];
    const db = memDb({ cals: [{ id: 'c1', url: LINK, events: old, fetchedAt: '2026-11-06T08:00:00.000Z' }] });
    const now = Date.parse('2026-11-06T08:10:00.000Z');
    const quiet = ok();
    expect(await refreshAll(db, { doFetch: quiet, now, today: TODAY })).toEqual({ n: 0, failed: [] });
    expect(quiet).not.toHaveBeenCalled();
    const bad = vi.fn(async () => new Response(JSON.stringify({ code: 'link_invalid' }), { status: 502 }));
    const r = await refreshAll(db, { doFetch: bad, now, today: TODAY, force: true });
    expect(r.failed).toEqual(['c1']);
    const c = db.peek().cals[0];
    expect(c.error).toBe('link_invalid');
    expect(c.events).toHaveLength(1);
    const good = await refreshAll(db, { doFetch: ok(), now, today: TODAY, force: true });
    expect(good).toEqual({ n: 1, failed: [] });
    expect(db.peek().cals[0]).toMatchObject({ error: '', fetchedAt: new Date(now).toISOString() });
    expect(db.peek().cals[0].events).toHaveLength(2);
  });
  it('a calendar that is off is not fetched', () => {
    expect(isStale({ on: false, url: LINK, fetchedAt: null })).toBe(false);
    expect(isStale({ on: true, url: LINK, fetchedAt: null })).toBe(true);
  });
});

describe('/api/linkcheck?a=spielerplus', () => {
  const req = (body, method = 'POST') => new Request('https://packgen-three.vercel.app/api/linkcheck?a=spielerplus', { method, headers: { origin: 'http://localhost:5173', 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify(body) : undefined });
  const handler = (doFetch, timeout) => makeHandler({ doFetch, timeout: timeout ? timeout / 2 : undefined });
  it('POST without ?a=spielerplus does nothing', async () => {
    const doFetch = vi.fn();
    const res = await handler(doFetch)(new Request('https://packgen-three.vercel.app/api/linkcheck', { method: 'POST', headers: { origin: 'http://localhost:5173' }, body: '{}' }));
    expect(res.status).toBe(400);
    expect(doFetch).not.toHaveBeenCalled();
  });
  it('reads the calendar file of a Spielerplus link, with no redirect followed', async () => {
    const doFetch = vi.fn(async () => new Response(ICS, { status: 200 }));
    const res = await handler(doFetch)(req({ url: LINK }));
    expect(res.status).toBe(200);
    expect((await res.json()).ics).toContain('BEGIN:VCALENDAR');
    expect(doFetch.mock.calls[0][1].redirect).toBe('manual');
  });
  it('is no open proxy: any other address is refused without a request', async () => {
    const doFetch = vi.fn();
    for (const url of ['https://example.com/events/ics?t=abc&u=def', 'http://127.0.0.1/events/ics?t=abc&u=def', 'https://www.spielerplus.de/events/ics']) {
      const res = await handler(doFetch)(req({ url }));
      expect(res.status, url).toBe(400);
    }
    expect((await handler(doFetch)(req(null))).status).toBe(400);
    expect(doFetch).not.toHaveBeenCalled();
  });
  it('says clearly when the link is dead, the answer is no calendar or Spielerplus is down; never repeats the key', async () => {
    const cases = [
      [new Response(null, { status: 404 }), 502, 'link_invalid'],
      [new Response(null, { status: 302, headers: { location: 'https://www.spielerplus.de/login' } }), 502, 'link_invalid'],
      [new Response('<html>login</html>', { status: 200 }), 422, 'not_calendar'],
      [new Response(null, { status: 500 }), 502, 'page_error'],
    ];
    for (const [answer, status, code] of cases) {
      const res = await handler(async () => answer)(req({ url: LINK }));
      const text = await res.text();
      expect(res.status).toBe(status);
      expect(JSON.parse(text).code).toBe(code);
      expect(text).not.toContain('TEST_');
    }
    const down = await handler(async () => { throw new Error('down TEST_aaaa-1'); })(req({ url: LINK }));
    expect(down.status).toBe(502);
    expect(await down.text()).not.toContain('TEST_');
  });
  it('gives up after the timeout', async () => {
    const doFetch = (u, init) => new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(new Error('aborted'))));
    const res = await handler(doFetch, 20)(req({ url: LINK }));
    expect((await res.json()).code).toBe('unreachable');
  });
});
