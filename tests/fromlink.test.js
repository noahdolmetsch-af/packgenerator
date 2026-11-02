// «Ein Link wird ein Traum» (Träume und Neuland N13): a pasted link gives name, km and climb. Fictional data only.
import { describe, it, expect } from 'vitest';
import { linkIn, gainOfGpx, factsFromHtml, readLink, withLink, distText } from '../src/lib/dreams/fromlink.js';

const P = 'test_data_gtp_';
const GPX = `<?xml version="1.0"?><gpx><trk><name>${P}Jura</name><trkseg>${[500, 510, 508, 530, 529, 560, 540, 545]
  .map((e, i) => `<trkpt lat="${47 + i / 100}" lon="7.1"><ele>${e}</ele></trkpt>`)
  .join('')}</trkseg></trk></gpx>`;

describe('a link becomes a dream (N13)', () => {
  it('finds the link in a pasted text', () => {
    expect(linkIn('Schau: https://www.komoot.com/de-de/tour/123?ref=x.')).toBe('https://www.komoot.com/de-de/tour/123?ref=x');
    expect(linkIn('ridewithgps.com/routes/987')).toBe('https://ridewithgps.com/routes/987');
    expect(linkIn('www.example.org/bericht')).toBe('https://www.example.org/bericht');
    expect(linkIn('Über Furka und Grimsel')).toBeNull();
    expect(linkIn('mail@komoot.de')).toBeNull();
  });

  it('counts the climb of a GPX with a 5 m threshold', () => {
    expect(gainOfGpx(GPX)).toBe(65);
    expect(gainOfGpx('<gpx></gpx>')).toBeNull();
  });

  it('reads name, km and climb of a page', () => {
    const komoot = `<html><head><meta property="og:title" content="${P}Seeuferweg | komoot"><title>x</title></head><body><script>{"tour":{"distance":84512.3,"elevation_up":1250.4}}</script></body></html>`;
    expect(factsFromHtml(komoot)).toEqual({ title: `${P}Seeuferweg`, km: 84.5, gainM: 1250 });
    const blog = `<title>${P}Drei Pässe &amp; ein See</title><meta name="description" content="Eine Runde: 112,4 km und 2'340 Hm durch den Jura.">`;
    expect(factsFromHtml(blog)).toEqual({ title: `${P}Drei Pässe & ein See`, km: 112.4, gainM: 2340 });
    expect(factsFromHtml('<p>nichts</p>')).toEqual({ title: '', km: null, gainM: null });
  });

  it('reads a Ride with GPS link through the own server: map, km, climb', async () => {
    const asked = [];
    const fetcher = async (u) => (asked.push(u), { ok: true, status: 200, json: async () => ({ gpx: GPX, file: 'x.gpx' }) });
    const r = await readLink('https://ridewithgps.com/routes/987', { fetcher, online: true });
    expect(asked[0]).toContain('action=rwgps');
    expect(r).toMatchObject({ title: `${P}Jura`, from: 'rwgps', gainM: 65 });
    expect(r.route.line.length).toBeGreaterThan(2);
    expect(r.route.gainM).toBe(65);
  });

  it('reads another page through the page reader, and says when it cannot', async () => {
    const html = `<meta property="og:title" content="${P}Tour"><meta property="og:description" content="Distanz 45 km, 600 m bergauf">`;
    const r = await readLink('https://www.komoot.com/tour/1', { fetcher: async (u) => ({ ok: true, json: async () => ({ html, u }) }), online: true });
    expect(r).toMatchObject({ title: `${P}Tour`, km: 45, gainM: 600, route: null, from: 'page' });
    await expect(readLink('https://x.org/a', { fetcher: async () => ({ ok: false, json: async () => ({ code: 'daily_cap' }) }), online: true })).rejects.toThrow('enough for today');
    await expect(readLink('https://x.org/a', { online: false })).rejects.toThrow('No connection');
  });

  it('puts it on the dream; the own title stays', () => {
    const d = { id: 'd', title: `${P}Mein Traum`, url: '' };
    const page = { url: 'https://x.org/a', title: `${P}Seite`, route: null, km: 45, gainM: 600 };
    expect(withLink(d, page)).toMatchObject({ title: `${P}Mein Traum`, url: 'https://x.org/a', facts: { km: 45, gainM: 600 } });
    expect(withLink({ ...d, title: 'https://x.org/a' }, page).title).toBe(`${P}Seite`);
    expect(withLink(d, page, { keepTitle: false }).title).toBe(`${P}Seite`);
    expect(distText(withLink(d, page))).toBe('45 km · 600 m up');
    expect(distText({ route: { km: 84 } })).toBe('84 km');
    expect(distText({})).toBe('');
  });
});
