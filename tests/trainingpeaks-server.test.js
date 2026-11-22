// TrainingPeaks-Plan (Noah 19.11.2026 «1a 2b 3a 4a 5b»), step P1: the server function that may only read the
// calendar link of trainingpeaks.com. Links and answers are made up; no real link is used anywhere.
import { describe, it, expect, vi } from 'vitest';
import { makeHandler } from '../api/linkcheck.js';
import { trainingpeaksUrl, redirectTarget } from '../api/_lib/trainingpeaks.js';
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
      [new Response(null, { status: 410 }), 502, 'link_invalid'],
      [new Response(null, { status: 401 }), 502, 'link_invalid'],
      [new Response(null, { status: 403 }), 502, 'refused'],
      [new Response(null, { status: 302 }), 502, 'redirect_other'],
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
  it('names the status of the refusal (a number only, never the link)', async () => {
    const res = await handler(async () => new Response(null, { status: 403 }))(req({ url: LINK }));
    const body = await res.json();
    expect(body.status).toBe(403);
    expect(JSON.stringify(body)).not.toContain('TEST_');
    expect((await (await handler(async () => new Response(null, { status: 503 }))(req({ url: LINK }))).json()).status).toBe(503);
  });
  it('follows up to three redirects by hand, only to https on trainingpeaks.com', async () => {
    const hop = (to) => new Response(null, { status: 301, headers: { location: to } });
    const doFetch = vi.fn()
      .mockResolvedValueOnce(hop('https://home.trainingpeaks.com/ical/TEST_aaaa-1.ics'))
      .mockResolvedValueOnce(hop('/other/TEST_aaaa-1.ics'))
      .mockResolvedValueOnce(new Response(ICS, { status: 200 }));
    const res = await handler(doFetch)(req({ url: LINK }));
    expect(res.status).toBe(200);
    expect(doFetch.mock.calls.map((c) => c[0])).toEqual([LINK, 'https://home.trainingpeaks.com/ical/TEST_aaaa-1.ics', 'https://home.trainingpeaks.com/other/TEST_aaaa-1.ics']);
    expect(doFetch.mock.calls.every((c) => c[1].redirect === 'manual')).toBe(true);
  });
  it('stops at the fourth redirect and refuses a redirect to another host, another scheme or a port', async () => {
    const hop = (to) => new Response(null, { status: 302, headers: { location: to } });
    const loop = vi.fn(async () => hop('https://www.trainingpeaks.com/ical/TEST_aaaa-1.ics'));
    expect((await (await handler(loop)(req({ url: LINK }))).json()).code).toBe('redirect_loop');
    expect(loop).toHaveBeenCalledTimes(4);
    for (const to of ['https://example.com/ical/TEST_aaaa-1.ics', 'https://trainingpeaks.com.evil.com/x', 'http://www.trainingpeaks.com/ical/a.ics', 'https://www.trainingpeaks.com:8443/x', 'https://me:pw@www.trainingpeaks.com/x']) {
      const doFetch = vi.fn(async () => hop(to));
      const res = await handler(doFetch)(req({ url: LINK }));
      expect((await res.json()).code, to).toBe('redirect_other');
      expect(doFetch, to).toHaveBeenCalledTimes(1);
    }
  });
  it('redirectTarget takes only https on trainingpeaks.com or a subdomain', () => {
    expect(redirectTarget('/ical/x.ics', new URL(LINK))?.href).toBe('https://www.trainingpeaks.com/ical/x.ics');
    expect(redirectTarget('https://home.trainingpeaks.com/x', new URL(LINK))).not.toBeNull();
    expect(redirectTarget('//evil.com/x', new URL(LINK))).toBeNull();
    expect(redirectTarget('', new URL(LINK))).toBeNull();
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
