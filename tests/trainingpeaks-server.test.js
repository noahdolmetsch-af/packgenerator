// TrainingPeaks-Plan (Noah 19.11.2026 «1a 2b 3a 4a 5b»), step P1: the server function that may only read the
// calendar link of trainingpeaks.com. Links and answers are made up; no real link is used anywhere.
import { describe, it, expect, vi } from 'vitest';
import { makeHandler } from '../api/linkcheck.js';
import { trainingpeaksUrl } from '../api/_lib/trainingpeaks.js';
import { DAY_CAPS } from '../api/_lib/daycap.js';

const LINK = 'https://www.trainingpeaks.com/ical/TEST_aaaa-1.ics';
const ICS = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', 'UID:w1@test', 'SUMMARY:Bike Endurance', 'DTSTART:20261121T080000Z', 'DTEND:20261121T093000Z', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');

describe('the allowed address', () => {
  it('takes only https://(www.)trainingpeaks.com/ical/<key>.ics', () => {
    expect(trainingpeaksUrl(` ${LINK} `)?.href).toBe(LINK);
    expect(trainingpeaksUrl('https://trainingpeaks.com/ical/ABC_def-123.ics')).not.toBeNull();
  });
  it('refuses everything else', () => {
    for (const bad of [
      '', 'nonsense', null,
      'http://www.trainingpeaks.com/ical/abc123.ics',
      'https://example.com/ical/abc123.ics',
      'https://trainingpeaks.com.evil.com/ical/abc123.ics',
      'https://www.trainingpeaks.com/ical/abc123',
      'https://www.trainingpeaks.com/ical/.ics',
      'https://www.trainingpeaks.com/ical/a.ics',
      'https://www.trainingpeaks.com/ical/a/b.ics',
      'https://www.trainingpeaks.com/other/abc123.ics',
      'https://www.trainingpeaks.com:8443/ical/abc123.ics',
      'https://me:pw@www.trainingpeaks.com/ical/abc123.ics',
      'https://www.trainingpeaks.com/ical/abc123.ics?x=' + 'a'.repeat(250),
    ]) expect(trainingpeaksUrl(bad), String(bad)).toBeNull();
  });
});

describe('/api/linkcheck?a=trainingpeaks', () => {
  const req = (body, a = 'trainingpeaks') => new Request(`https://packgen-three.vercel.app/api/linkcheck?a=${a}`, { method: 'POST', headers: { origin: 'http://localhost:5173', 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const handler = (doFetch, timeout) => makeHandler({ doFetch, timeout: timeout ? timeout / 2 : undefined });
  it('reads the calendar file, with no redirect followed and a POST body only', async () => {
    const doFetch = vi.fn(async () => new Response(ICS, { status: 200 }));
    const res = await handler(doFetch)(req({ url: LINK }));
    expect(res.status).toBe(200);
    expect((await res.json()).ics).toContain('BEGIN:VCALENDAR');
    expect(doFetch.mock.calls[0][0]).toBe(LINK);
    expect(doFetch.mock.calls[0][1].redirect).toBe('manual');
  });
  it('is no open proxy: any other address is refused without a request', async () => {
    const doFetch = vi.fn();
    for (const url of ['https://example.com/ical/abc123.ics', 'http://127.0.0.1/ical/abc123.ics', 'https://www.trainingpeaks.com/ical/', 'https://www.spielerplus.de/events/ics?t=abc&u=def']) {
      expect((await handler(doFetch)(req({ url }))).status, url).toBe(400);
    }
    expect((await handler(doFetch)(req(null))).status).toBe(400);
    expect(doFetch).not.toHaveBeenCalled();
  });
  it('the Spielerplus way is untouched and an unknown way does nothing', async () => {
    const doFetch = vi.fn(async () => new Response(ICS, { status: 200 }));
    expect((await handler(doFetch)(req({ url: 'https://www.spielerplus.de/events/ics?t=abc&u=def' }, 'spielerplus'))).status).toBe(200);
    doFetch.mockClear();
    expect((await handler(doFetch)(req({ url: LINK }, 'other'))).status).toBe(400);
    expect(doFetch).not.toHaveBeenCalled();
  });
  it('says clearly when the link is dead, the answer is no calendar or TrainingPeaks is down; never repeats the key', async () => {
    const cases = [
      [new Response(null, { status: 404 }), 502, 'link_invalid'],
      [new Response(null, { status: 302, headers: { location: 'https://home.trainingpeaks.com/login' } }), 502, 'link_invalid'],
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
  it('refuses a file over 1.5 MB', async () => {
    const big = new Response('BEGIN:VCALENDAR' + 'x'.repeat(1_500_001), { status: 200 });
    expect((await handler(async () => big)(req({ url: LINK }))).status).toBe(413);
  });
  it('gives up after the timeout', async () => {
    const doFetch = (u, init) => new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(new Error('aborted'))));
    expect((await (await handler(doFetch, 20)(req({ url: LINK }))).json()).code).toBe('unreachable');
  });
  it('has its own daily cap', () => {
    expect(DAY_CAPS.trainingpeaks).toBe(300);
  });
});
