// «Nachttemperatur am Abend» (Noah 06.11.2026 «5a», «push ja»): the evening message about tonight's lowest temperature, server and app.
import { describe, it, expect, vi } from 'vitest';
import { createECDH, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';

vi.mock('../src/lib/i18n.svelte.js', () => ({ t: (s, v) => (v ? s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '') : s), locale: () => 'de-CH' }));

const { cleanList, cleanTexts, nightUrl, nightVerdict, nightMessage, MAX_WEATHER } = await import('../api/_lib/push.js');
const { newVapidKeys } = await import('../api/_lib/webpush.js');
const { makeHandler } = await import('../api/push.js');
const { buildList, KINDS, pushOf, NIGHT_DAYS } = await import('../src/lib/push/schedule.js');
const { nightOf } = await import('../src/lib/wetter/nacht.js');

const HOME = { name: 'Testdorf', lat: 47.1, lon: 8.2 };
const pad = (n) => String(n).padStart(2, '0');
/** Hours of whole days (local ISO times, as Open-Meteo says them) with a temperature per hour. */
function answer(temp, { from = '2026-11-19', days = 3 } = {}) {
  const time = [];
  const temperature_2m = [];
  for (let d = 0; d < days; d++) {
    const day = new Date(Date.parse(`${from}T12:00:00Z`) + d * 864e5).toISOString().slice(0, 10);
    for (let h = 0; h < 24; h++) {
      time.push(`${day}T${pad(h)}:00`);
      temperature_2m.push(temp(day, h));
    }
  }
  return { utc_offset_seconds: 3600, hourly: { time, temperature_2m } };
}
// the same hours in the format of the app's own request (unixtime), for the parity test
const asApp = (a) => ({ offset: 3600, hours: a.hourly.time.map((x, i) => ({ ms: Date.parse(`${x}:00Z`) - 3600e3, t: a.hourly.temperature_2m[i] })) });
// last night (evening 19.11. to 20.11.) down to -0.6 at 04:00, tonight (20.11. to 21.11.) down to 1.4 at 04:00
const cooling = (day, h) => (day === '2026-11-20' && h === 4 ? -0.6 : day === '2026-11-21' && h === 4 ? 1.4 : day === '2026-11-20' ? 6 : 4.2 + (h === 3 ? 0 : 3));

describe('the night on the server', () => {
  it('asks Open-Meteo for the hours of last night and tonight, in the place’s own time', () => {
    const u = nightUrl({ lat: 47.1, lon: 8.2, date: '2026-11-20' });
    for (const k of ['hourly=temperature_2m', 'timezone=auto', 'start_date=2026-11-19', 'end_date=2026-11-21', 'latitude=47.100']) expect(u).toContain(k);
  });
  it('takes the lowest value from 18 to 8 h, in whole degrees, and the night before it', () => {
    expect(nightVerdict(answer(cooling), '2026-11-20')).toEqual({ min: 1, last: -1 });
    // a night with too few hours has no value (the answer ends after the evening)
    expect(nightVerdict(answer(cooling, { days: 2 }), '2026-11-20')).toBeNull();
    // without last night: tonight alone
    expect(nightVerdict(answer(cooling, { from: '2026-11-20', days: 2 }), '2026-11-20')).toEqual({ min: 1, last: null });
    expect(nightVerdict(null, '2026-11-20')).toBeNull();
    expect(nightVerdict({ hourly: { time: ['2026-11-20T20:00'], temperature_2m: [3] } }, '2026-11-20')).toBeNull();
  });
  it('gives the same night as the app', () => {
    for (const temp of [cooling, () => 7, (day, h) => (h % 5) - 3 + (day === '2026-11-21' ? 2 : 0)]) {
      const a = answer(temp);
      const app = asApp(a);
      const s = nightVerdict(a, '2026-11-20');
      expect(s.min).toBe(Math.round(nightOf(app, '2026-11-21').min));
      expect(s.last).toBe(Math.round(nightOf(app, '2026-11-20').min));
    }
  });
  const TEXTS = { ntitle: 'Nachttemperatur', night: 'Heute Nacht bis {temp} °C.', nightfrost: 'Frost möglich (unter 0 °C).', nightwarm: '{d}° wärmer als letzte Nacht.', nightcold: '{d}° kälter als letzte Nacht.' };
  const w = { key: 'night:2026-11-20', url: '#/wetter' };
  it('the words: frost first, else a change of 2° or more, else only the number', () => {
    expect(nightMessage(w, { min: -2, last: 3 }, TEXTS)).toEqual({ title: 'Nachttemperatur', body: 'Heute Nacht bis -2 °C. Frost möglich (unter 0 °C).', url: '#/wetter', tag: 'night:2026-11-20' });
    expect(nightMessage(w, { min: 7, last: 5 }, TEXTS).body).toBe('Heute Nacht bis 7 °C. 2° wärmer als letzte Nacht.');
    expect(nightMessage(w, { min: 3, last: 7 }, TEXTS).body).toBe('Heute Nacht bis 3 °C. 4° kälter als letzte Nacht.');
    expect(nightMessage(w, { min: 5, last: 4 }, TEXTS).body).toBe('Heute Nacht bis 5 °C.');
    expect(nightMessage(w, { min: 5, last: null }, TEXTS).body).toBe('Heute Nacht bis 5 °C.');
    expect(nightMessage(w, null, TEXTS)).toBeNull();
    expect(nightMessage(w, { min: 5, last: 4 }, {})).toBeNull();
  });
  it('the list from the app keeps the night check and its words, made safe, and has room for all checks', () => {
    const l = cleanList({ weather: [{ key: 'night:2026-11-20', at: 1, date: '2026-11-20', lat: 47, lon: 8, only: ['night', 'nonsense'], url: '#/wetter' }] });
    expect(l.weather[0].only).toEqual(['night']);
    expect(cleanTexts({ night: 'a', nightfrost: 'b', nightwarm: 'c', nightcold: 'd', ntitle: 'e' })).toMatchObject({ night: 'a', nightfrost: 'b', nightwarm: 'c', nightcold: 'd', ntitle: 'e' });
    // fog (7) + ice (7) + night (7) + some tours must not be cut
    expect(MAX_WEATHER).toBeGreaterThanOrEqual(30);
  });
});

describe('the night push in the app', () => {
  const now = new Date(2026, 10, 20, 12, 0); // 20.11.2026 12:00
  const ON = { on: true, kinds: { night: true, fog: false } };
  it('has its own switch, off until switched on', () => {
    expect(KINDS.at(-1).key).toBe('night');
    expect(pushOf({ on: true }).kinds.night).toBe(false);
    expect(pushOf({ on: true, kinds: { night: true } }).kinds.night).toBe(true);
  });
  it('checks the home place at 19:00 on the next evenings, all year', () => {
    for (const d of [now, new Date(2026, 6, 10, 12, 0)]) {
      const l = buildList({ settings: { push: ON, homePlace: HOME }, now: d });
      const n = l.weather.filter((w) => w.only?.includes('night'));
      expect(n).toHaveLength(NIGHT_DAYS);
      expect(n[0]).toMatchObject({ lat: 47.1, lon: 8.2, url: '#/wetter', only: ['night'] });
      expect(new Date(n[0].at).getHours()).toBe(19);
      expect(n[0].key).toBe(`night:${n[0].date}`);
      expect(l.texts.night).toContain('{temp}');
      expect(l.texts.nightwarm).toContain('{d}');
    }
  });
  it('skips an evening that is past, and sends nothing with the switch off, without «on» or without a home place', () => {
    const late = buildList({ settings: { push: ON, homePlace: HOME }, now: new Date(2026, 10, 20, 21, 0) });
    expect(late.weather.map((w) => w.date)[0]).toBe('2026-11-21');
    const off = buildList({ settings: { push: { on: true, kinds: { fog: false } }, homePlace: HOME }, now });
    expect(off.weather).toEqual([]);
    expect(off.texts.night).toBe('');
    expect(buildList({ settings: { push: { ...ON, on: false }, homePlace: HOME }, now }).weather).toEqual([]);
    expect(buildList({ settings: { push: ON }, now }).weather).toEqual([]);
  });
});

describe('the evening tick', () => {
  const REDIS = 'https://redis.example.test';
  const TOKEN = 'test_phone_code_not_real_0123456789abcdef';
  const TICK = 'test-tick-code';
  const T0 = Date.parse('2026-11-20T18:00:00Z'); // 19:00 in Zurich
  it('sends «tonight down to …» at 19:00 and asks for the hours of the night', async () => {
    const ua = createECDH('prime256v1');
    ua.generateKeys();
    const auth = randomBytes(16);
    const sub = { endpoint: 'https://push.example.test/send/abc', keys: { p256dh: ua.getPublicKey().toString('base64url'), auth: auth.toString('base64url') } };
    const store = {};
    const sets = {};
    const sent = [];
    const asked = [];
    const doFetch = async (url, init = {}) => {
      if (url === REDIS) {
        const [cmd, k, ...rest] = JSON.parse(init.body);
        if (cmd === 'GET') return Response.json({ result: store[k] ?? null });
        if (cmd === 'SET') return Response.json({ result: (store[k] = rest[0]) && 'OK' });
        if (cmd === 'DEL') return Response.json({ result: delete store[k] ? 1 : 0 });
        if (cmd === 'SADD') return Response.json({ result: (sets[k] ??= new Set()).add(rest[0]).size });
        if (cmd === 'SMEMBERS') return Response.json({ result: [...(sets[k] ?? [])] });
        return Response.json({ result: 1 });
      }
      if (String(url).startsWith('https://api.open-meteo.com/')) {
        asked.push(String(url));
        return Response.json(answer(cooling));
      }
      sent.push(init);
      return new Response(null, { status: 201 });
    };
    let now = T0 - 5000;
    const h = makeHandler({ env: () => ({ vapid: { ...newVapidKeys(), subject: 'mailto:test@example.org' }, tickKey: TICK, redisUrl: REDIS, redisToken: 'redis-test' }), doFetch, now: () => now });
    const post = (b) => new Request('https://x.test/api/push', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) });
    const texts = { ntitle: 'Nachttemperatur', night: 'Heute Nacht bis {temp} °C.', nightfrost: 'Frost möglich.', nightwarm: '{d}° wärmer.', nightcold: '{d}° kälter.' };
    await h(post({ a: 'save', token: TOKEN, sub, weather: [{ key: 'night:2026-11-20', at: T0, date: '2026-11-20', lat: 47.1, lon: 8.2, title: 'Nachttemperatur', url: '#/wetter', only: ['night'] }], texts }));
    expect(await (await h(new Request(`https://x.test/api/push?a=tick&key=${TICK}`))).json()).toMatchObject({ sent: 0 });
    now = T0 + 1000;
    expect(await (await h(new Request(`https://x.test/api/push?a=tick&key=${TICK}`))).json()).toMatchObject({ sent: 1 });
    expect(asked).toHaveLength(1);
    expect(asked[0]).toContain('hourly=temperature_2m');
    const body = sent[0].body;
    const salt = body.subarray(0, 16);
    const asPub = body.subarray(21, 21 + body[20]);
    const ct = body.subarray(21 + body[20]);
    const hk = (i, s, inf, l) => Buffer.from(hkdfSync('sha256', i, s, Buffer.from(inf), l));
    const ikm = hk(ua.computeSecret(asPub), auth, Buffer.concat([Buffer.from('WebPush: info\0'), ua.getPublicKey(), asPub]), 32);
    const d = createDecipheriv('aes-128-gcm', hk(ikm, salt, 'Content-Encoding: aes128gcm\0', 16), hk(ikm, salt, 'Content-Encoding: nonce\0', 12));
    d.setAuthTag(ct.subarray(ct.length - 16));
    const out = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]);
    expect(JSON.parse(out.subarray(0, out.length - 1).toString())).toMatchObject({ title: 'Nachttemperatur', body: 'Heute Nacht bis 1 °C. 2° wärmer.' });
  });
});
