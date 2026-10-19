// Paket Q #148: /api/news reads feeds, weather warnings and the avalanche level for the app.
import { describe, it, expect } from 'vitest';
import { parseFeed, parseWarnings, avalancheLevel, safeFeedUrl, decode } from '../api/_lib/news.js';
import { makeHandler, WEATHER_FEED } from '../api/news.js';

const RSS = `<?xml version="1.0"?><rss><channel><title>Testvelo &amp; Berg</title>
<item><title><![CDATA[Neue Route im Jura]]></title><link>https://example.org/a</link><pubDate>Mon, 19 Oct 2026 08:00:00 GMT</pubDate></item>
<item><title>Ältere Meldung</title><link>https://example.org/b</link><pubDate>Sun, 18 Oct 2026 08:00:00 GMT</pubDate></item>
<item><title>Ohne Link</title></item></channel></rss>`;
const ATOM = `<feed><title>Atom Test</title><entry><title>Eintrag</title><link rel="alternate" href="https://example.org/e"/><updated>2026-10-19T07:00:00Z</updated></entry></feed>`;
const WARN = `<feed><entry><title>Gelb</title><link href="https://meteoalarm.org/x"/><cap:event>Starkregen</cap:event><cap:areaDesc>Testregion Nord</cap:areaDesc><cap:severity>Moderate</cap:severity><cap:onset>2026-10-19T10:00:00+02:00</cap:onset><cap:expires>2026-10-20T10:00:00+02:00</cap:expires></entry></feed>`;

describe('feed reader', () => {
  it('reads RSS, newest first, only items with a link', () => {
    const f = parseFeed(RSS);
    expect(f.title).toBe('Testvelo & Berg');
    expect(f.items.map((x) => x.title)).toEqual(['Neue Route im Jura', 'Ältere Meldung']);
  });
  it('reads Atom', () => {
    expect(parseFeed(ATOM).items).toEqual([{ title: 'Eintrag', link: 'https://example.org/e', date: '2026-10-19T07:00:00.000Z' }]);
  });
  it('decodes entities', () => {
    expect(decode('A &#228; &amp; <b>B</b>')).toBe('A ä & B');
  });
  it('reads weather warnings with their level', () => {
    expect(parseWarnings(WARN)[0]).toMatchObject({ event: 'Starkregen', area: 'Testregion Nord', level: 2 });
  });
  it('finds the highest avalanche level', () => {
    expect(avalancheLevel({ bulletins: [{ dangerRatings: [{ mainValue: 'low' }, { mainValue: 'considerable' }] }] })).toBe(3);
    expect(avalancheLevel(null)).toBeNull();
  });
  it('lets only public https addresses through', () => {
    expect(safeFeedUrl('https://example.org/feed')).toBe('https://example.org/feed');
    for (const u of ['http://example.org/feed', 'https://127.0.0.1/x', 'https://localhost/x', 'https://router.local/x', 'https://u:p@example.org/', 'https://example.org:8080/', 'nonsense']) expect(safeFeedUrl(u), u).toBeNull();
  });
});

describe('/api/news', () => {
  const req = (q) => new Request(`https://packgen-three.vercel.app/api/news?${q}`, { headers: { origin: 'http://localhost:5173' } });
  it('reads a feed', async () => {
    const h = makeHandler({ doFetch: async () => new Response(RSS) });
    const r = await h(req('feed=' + encodeURIComponent('https://example.org/feed')));
    expect(r.status).toBe(200);
    expect((await r.json()).items.length).toBe(2);
  });
  it('refuses a local address', async () => {
    const h = makeHandler({ doFetch: async () => new Response(RSS) });
    expect((await h(req('feed=' + encodeURIComponent('http://localhost/feed')))).status).toBe(400);
  });
  it('says clearly when a source does not answer', async () => {
    const h = makeHandler({ doFetch: async () => new Response('x', { status: 500 }) });
    const r = await h(req('feed=' + encodeURIComponent('https://example.org/feed')));
    expect(r.status).toBe(502);
    expect((await r.json()).code).toBe('source_failed');
  });
  it('reads the weather warnings', async () => {
    let asked = '';
    const h = makeHandler({ doFetch: async (u) => ((asked = u), new Response(WARN)) });
    const r = await h(req('alerts=weather'));
    expect(asked).toBe(WEATHER_FEED);
    expect((await r.json()).warnings.length).toBe(1);
  });
  it('gives the avalanche page even when the bulletin cannot be read', async () => {
    const h = makeHandler({ doFetch: async () => new Response('nope', { status: 403 }) });
    const b = await (await h(req('alerts=avalanche'))).json();
    expect(b.level).toBeNull();
    expect(b.link).toMatch(/^https:\/\/www\.slf\.ch\//);
  });
});
