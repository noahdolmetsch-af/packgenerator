// Erinnerungen aufs Handy (Web-Push): api/push.js and its parts with a fake environment, a fake Redis,
// a fake push service and a fake Open-Meteo. Fictional values only (keys are made here, never real ones).
import { describe, it, expect, vi } from 'vitest';
import { createECDH, createDecipheriv, createPublicKey, hkdfSync, randomBytes, verify } from 'node:crypto';
import { newVapidKeys, vapidOk, vapidHeader, encrypt } from '../api/_lib/webpush.js';
import { cleanList, split, weatherReasons, weatherMessage, devKey, nextAt, STALE_MS, dayGood, watchVerdict, watchNews, watchMessage, keepWatch, watchUrl, WATCH_EVERY_MS } from '../api/_lib/push.js';
import { makeHandler, sameToken, VAPID_KEY, TICK_KEY, LAST_TICK, DEFAULT_SUBJECT, pushEnv } from '../api/push.js';
import { hash, KEYS } from '../api/_lib/oauth.js';

const REDIS = 'https://redis.example.test';
const ENDPOINT = 'https://push.example.test/send/abc';
const TOKEN = 'test_phone_code_not_real_0123456789abcdef';
const TICK = 'test-tick-code';
const vapid = { ...newVapidKeys(), subject: 'mailto:test@example.org' };
const env = (over = {}) => () => ({ vapid, tickKey: TICK, redisUrl: REDIS, redisToken: 'redis-test', ...over });

function phone() {
  const ua = createECDH('prime256v1');
  ua.generateKeys();
  const auth = randomBytes(16);
  return { ua, auth, sub: { endpoint: ENDPOINT, keys: { p256dh: ua.getPublicKey().toString('base64url'), auth: auth.toString('base64url') } } };
}
/** Read a message as the browser does (RFC 8291). */
function decrypt(body, { ua, auth }) {
  const salt = body.subarray(0, 16);
  const asPub = body.subarray(21, 21 + body[20]);
  const ct = body.subarray(21 + body[20]);
  const hk = (i, s, inf, l) => Buffer.from(hkdfSync('sha256', i, s, Buffer.from(inf), l));
  const ikm = hk(ua.computeSecret(asPub), auth, Buffer.concat([Buffer.from('WebPush: info\0'), ua.getPublicKey(), asPub]), 32);
  const d = createDecipheriv('aes-128-gcm', hk(ikm, salt, 'Content-Encoding: aes128gcm\0', 16), hk(ikm, salt, 'Content-Encoding: nonce\0', 12));
  d.setAuthTag(ct.subarray(ct.length - 16));
  const out = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]);
  return JSON.parse(out.subarray(0, out.length - 1).toString());
}

function world({ pushStatus = 201, forecast = null } = {}) {
  const store = {};
  const sets = {};
  const sent = [];
  const doFetch = vi.fn(async (url, init = {}) => {
    if (url === REDIS) {
      const [cmd, k, ...rest] = JSON.parse(init.body);
      if (cmd === 'GET') return Response.json({ result: store[k] ?? null });
      if (cmd === 'SET') {
        if (rest.includes('NX') && k in store) return Response.json({ result: null });
        return Response.json({ result: (store[k] = rest[0]) && 'OK' });
      }
      if (cmd === 'SISMEMBER') return Response.json({ result: sets[k]?.has(rest[0]) ? 1 : 0 });
      if (cmd === 'DEL') return Response.json({ result: delete store[k] ? 1 : 0 });
      if (cmd === 'SADD') return Response.json({ result: (sets[k] ??= new Set()).add(rest[0]).size });
      if (cmd === 'SREM') return Response.json({ result: sets[k]?.delete(rest[0]) ? 1 : 0 });
      if (cmd === 'SMEMBERS') return Response.json({ result: [...(sets[k] ?? [])] });
      return Response.json({ result: 1 });
    }
    if (String(url).startsWith('https://api.open-meteo.com/')) return Response.json(forecast ?? { daily: { time: [] } });
    sent.push({ url, init });
    return new Response(null, { status: pushStatus });
  });
  return { store, sets, sent, doFetch };
}
const T0 = Date.parse('2026-10-20T05:00:00Z');
const post = (body) => new Request('https://packgen-three.vercel.app/api/push', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' }, body: JSON.stringify(body) });
const get = (q, headers = {}) => new Request(`https://packgen-three.vercel.app/api/push?${q}`, { headers });

describe('web push building blocks', () => {
  it('encrypts like RFC 8291 (its own example)', () => {
    const as = createECDH('prime256v1');
    as.setPrivateKey(Buffer.from('yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw', 'base64url'));
    const out = encrypt('When I grow up, I want to be a watermelon', { p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', auth: 'BTBZMqHH6r4Tts7J_aSIgg' }, { salt: Buffer.from('DGv6ra1nlYgDCS1FRnbzlw', 'base64url'), ecdh: as });
    expect(out.toString('base64url')).toBe('DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN');
  });
  it('signs the VAPID token with the key pair (ES256), for the push service origin', () => {
    expect(vapidOk(vapid)).toBe(true);
    expect(vapidOk({ ...vapid, subject: 'nobody' })).toBe(false);
    const h = vapidHeader(ENDPOINT, vapid, T0);
    const [jwt, k] = h.replace('vapid t=', '').split(', k=');
    expect(k).toBe(vapid.publicKey);
    const [a, b, s] = jwt.split('.');
    expect(JSON.parse(Buffer.from(b, 'base64url'))).toEqual({ aud: 'https://push.example.test', exp: T0 / 1000 + 12 * 3600, sub: 'mailto:test@example.org' });
    const pub = Buffer.from(vapid.publicKey, 'base64url');
    const key = createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: pub.subarray(1, 33).toString('base64url'), y: pub.subarray(33).toString('base64url') }, format: 'jwk' });
    expect(verify('sha256', Buffer.from(`${a}.${b}`), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url'))).toBe(true);
  });
  it('keeps only clean reminders and caps the lists', () => {
    const l = cleanList({ items: [{ key: 'a', at: 5, title: 'T', body: 'B', url: 'https://evil.example' }, { key: 'b', title: 'no time' }, null], weather: [{ key: 'w', at: 1, date: '2026-10-21', lat: 47, lon: 8 }, { key: 'x', at: 1, date: 'x', lat: 0, lon: 0 }], hotC: 99 });
    expect(l.items).toEqual([{ key: 'a', at: 5, title: 'T', body: 'B', url: '#/' }]);
    expect(l.weather).toHaveLength(1);
    expect(l.hotC).toBe(30);
    expect(nextAt({ items: l.items, weather: l.weather })).toBe(1);
  });
  it('sends what is due, waits for the rest, drops what is more than 6 hours late', () => {
    const r = split([{ at: T0 - 10 }, { at: T0 + 10 }, { at: T0 - STALE_MS - 1 }], T0);
    expect(r.due).toEqual([{ at: T0 - 10 }]);
    expect(r.wait).toEqual([{ at: T0 + 10 }]);
  });
  it('warns of thunder, a storm or heat from the forecast, in that order', () => {
    const daily = (code, gust, tmax) => ({ time: ['2026-10-21'], weather_code: [code], wind_gusts_10m_max: [gust], temperature_2m_max: [tmax] });
    expect(weatherReasons(daily(3, 30, 20), '2026-10-21', 30).reasons).toEqual([]);
    expect(weatherReasons(daily(95, 70, 31), '2026-10-21', 30).reasons).toEqual(['thunder', 'storm', 'heat']);
    expect(weatherReasons(daily(3, 30, 28), '2026-10-21', 28).reasons).toEqual(['heat']);
    expect(weatherReasons(daily(3, 30, 28), '2026-10-22', 28).reasons).toEqual([]);
    const msg = weatherMessage({ key: 'wx', title: 'Testtour', url: '#/pack' }, { reasons: ['heat'], tmax: 31.4 }, { heat: 'Heute bis {temp} °C.' });
    expect(msg).toEqual({ title: 'Testtour', body: 'Heute bis 31 °C.', url: '#/pack', tag: 'wx' });
  });
  it('compares codes safely', () => {
    expect(sameToken(TICK, TICK)).toBe(true);
    expect(sameToken('', '')).toBe(false);
    expect(sameToken('x', TICK)).toBe(false);
  });
});

describe('/api/push', () => {
  it('gives the public key and says whether it is set up', async () => {
    const w = world();
    expect(await (await makeHandler({ env: env(), doFetch: w.doFetch })(get('a=key'))).json()).toEqual({ publicKey: vapid.publicKey, ready: true });
    expect(await (await makeHandler({ env: env({ redisUrl: '' }), doFetch: w.doFetch })(get('a=key'))).json()).toMatchObject({ ready: false });
  });
  it('makes its own key pair on first use, keeps it in Upstash and reuses it (Noah copies nothing)', async () => {
    const w = world();
    const make = vi.fn(newVapidKeys);
    const h = makeHandler({ env: env({ vapid: { publicKey: '', privateKey: '', subject: DEFAULT_SUBJECT }, tickKey: '' }), doFetch: w.doFetch, makeKeys: make });
    const first = await (await h(get('a=key'))).json();
    expect(first.ready).toBe(true);
    expect(JSON.parse(w.store[VAPID_KEY]).publicKey).toBe(first.publicKey);
    const second = await (await h(get('a=key'))).json();
    expect(second.publicKey).toBe(first.publicKey);
    expect(make).toHaveBeenCalledTimes(1);
    // the private half is never answered
    expect(JSON.stringify(first)).not.toContain(JSON.parse(w.store[VAPID_KEY]).privateKey);
    // the old setup help is gone
    expect((await h(get('a=keys'))).status).toBe(400);
  });
  it('a pair set in Vercel wins over the stored one; the subject defaults to the app address', async () => {
    const w = world();
    const h = makeHandler({ env: env(), doFetch: w.doFetch });
    expect((await (await h(get('a=key'))).json()).publicKey).toBe(vapid.publicKey);
    expect(w.store[VAPID_KEY]).toBeUndefined();
    expect(pushEnv({}).vapid.subject).toBe('https://noahdolmetsch-af.github.io/packgenerator/');
    expect(vapidOk({ ...vapid, subject: DEFAULT_SUBJECT })).toBe(true);
  });
  it('gives the tick address only to a device of this server or the Helfer-Code, with a code made once', async () => {
    const w = world();
    w.sets[KEYS] = new Set([hash('test-device-key')]);
    const h = makeHandler({ env: env({ tickKey: '', helperToken: 'test-helper-code' }), doFetch: w.doFetch, now: () => T0 });
    expect((await h(get('a=cron'))).status).toBe(401);
    expect((await h(get('a=cron', { authorization: 'Bearer wrong' }))).status).toBe(401);
    const a = await (await h(get('a=cron', { authorization: 'Bearer test-device-key' }))).json();
    const b = await (await h(get('a=cron', { authorization: 'Bearer test-helper-code' }))).json();
    expect(a.url).toBe(b.url);
    const code = w.store[TICK_KEY];
    expect(code.length).toBeGreaterThan(20);
    expect(a.url).toBe(`https://packgen-three.vercel.app/api/push?a=tick&key=${code}`);
    // the tick takes that code, refuses a wrong one and notes its time
    expect((await h(get('a=tick&key=wrong'))).status).toBe(401);
    expect(w.store[LAST_TICK]).toBeUndefined();
    expect(await (await h(get(`a=tick&key=${code}`))).json()).toMatchObject({ ok: true, sent: 0 });
    expect(w.store[LAST_TICK]).toBe(String(T0));
  });
  it('no tick code yet: every tick is refused', async () => {
    const w = world();
    const h = makeHandler({ env: env({ tickKey: '' }), doFetch: w.doFetch });
    expect((await h(get('a=tick&key='))).status).toBe(401);
    expect((await h(get('a=tick&key=undefined'))).status).toBe(401);
  });
  it('saves the phone, sends a due reminder on the tick (readable only by the phone) and then forgets it', async () => {
    const w = world();
    const ph = phone();
    let now = T0;
    const h = makeHandler({ env: env(), doFetch: w.doFetch, now: () => now });
    const saved = await (await h(post({ a: 'save', token: TOKEN, sub: ph.sub, items: [{ key: 'eve:1', at: T0 + 60000, title: 'Vorabend', body: 'Morgen: Testtour.', url: '#/pack' }] }))).json();
    expect(saved).toMatchObject({ ok: true, items: 1, next: T0 + 60000 });
    expect(Object.keys(w.store)).toContain(devKey(TOKEN));
    expect(JSON.stringify(w.store)).not.toContain(TOKEN);
    // without the tick code: refused
    expect((await h(get('a=tick&key=wrong'))).status).toBe(401);
    // not due yet: one read, nothing sent
    expect(await (await h(get(`a=tick&key=${TICK}`))).json()).toMatchObject({ sent: 0 });
    expect(w.sent).toHaveLength(0);
    now = T0 + 61000;
    expect(await (await h(get('a=tick', { authorization: `Bearer ${TICK}` }))).json()).toMatchObject({ sent: 1, next: null });
    expect(w.sent).toHaveLength(1);
    expect(w.sent[0].url).toBe(ENDPOINT);
    expect(w.sent[0].init.headers.Authorization).toMatch(/^vapid t=/);
    expect(decrypt(w.sent[0].init.body, ph)).toEqual({ title: 'Vorabend', body: 'Morgen: Testtour.', url: '#/pack', tag: 'eve:1' });
    expect(JSON.parse(w.store[devKey(TOKEN)]).items).toEqual([]);
  });
  it('checks the weather on the tour morning and sends only when there is a reason', async () => {
    const forecast = { daily: { time: ['2026-10-21'], weather_code: [95], wind_gusts_10m_max: [40], temperature_2m_max: [24] } };
    const w = world({ forecast });
    const ph = phone();
    let now = T0;
    const h = makeHandler({ env: env(), doFetch: w.doFetch, now: () => now });
    const texts = { title: 'Wetter', thunder: 'Heute sind Gewitter möglich.', storm: 'Böen', heat: 'Bis {temp} °C' };
    await h(post({ a: 'save', token: TOKEN, sub: ph.sub, weather: [{ key: 'wx:1', at: T0 + 1000, date: '2026-10-21', lat: 46.95, lon: 7.45, title: 'Testtour', url: '#/pack' }], texts, hotC: 30 }));
    now = T0 + 2000;
    expect(await (await h(get(`a=tick&key=${TICK}`))).json()).toMatchObject({ sent: 1 });
    expect(decrypt(w.sent[0].init.body, ph)).toMatchObject({ title: 'Testtour', body: 'Heute sind Gewitter möglich.' });
    expect(w.doFetch.mock.calls.some(([u]) => String(u).includes('latitude=46.950') && String(u).includes('start_date=2026-10-21'))).toBe(true);
  });
  it('forgets a phone the push service no longer knows (410), and on «off»', async () => {
    const w = world({ pushStatus: 410 });
    const ph = phone();
    let now = T0;
    const h = makeHandler({ env: env(), doFetch: w.doFetch, now: () => now });
    await h(post({ a: 'save', token: TOKEN, sub: ph.sub, items: [{ key: 'a', at: T0 + 1, title: 'A' }] }));
    now = T0 + 5;
    await h(get(`a=tick&key=${TICK}`));
    expect(w.store[devKey(TOKEN)]).toBeUndefined();
    const w2 = world();
    const h2 = makeHandler({ env: env(), doFetch: w2.doFetch, now: () => T0 });
    await h2(post({ a: 'save', token: TOKEN, sub: ph.sub, items: [] }));
    expect(await (await h2(post({ a: 'off', token: TOKEN }))).json()).toEqual({ ok: true });
    expect(w2.store[devKey(TOKEN)]).toBeUndefined();
  });
  it('refuses a bad phone code, a missing subscription and a server that is not set up', async () => {
    const w = world();
    const h = makeHandler({ env: env(), doFetch: w.doFetch });
    expect((await h(post({ a: 'save', token: 'short' }))).status).toBe(400);
    expect((await h(post({ a: 'save', token: TOKEN, sub: { endpoint: 'http://x' } }))).status).toBe(400);
    const off = makeHandler({ env: env({ redisUrl: '' }), doFetch: w.doFetch });
    expect(await (await off(post({ a: 'save', token: TOKEN, sub: phone().sub }))).json()).toMatchObject({ code: 'storage_not_set_up' });
  });
  it('sends a test message to a signed-up phone', async () => {
    const w = world();
    const ph = phone();
    const h = makeHandler({ env: env(), doFetch: w.doFetch, now: () => T0 });
    await h(post({ a: 'save', token: TOKEN, sub: ph.sub, items: [] }));
    expect(await (await h(post({ a: 'test', token: TOKEN, title: 'Pack Generator', body: 'So kommen deine Erinnerungen an.' }))).json()).toEqual({ ok: true, status: 201 });
    expect(decrypt(w.sent[0].init.body, ph)).toMatchObject({ body: 'So kommen deine Erinnerungen an.' });
  });
});

describe('Wetter-Wecker (Paket G)', () => {
  const days = ['2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27'];
  /** good: list of booleans per day → a forecast. */
  const fc = (good) => ({ time: days, weather_code: good.map((g) => (g ? 1 : 61)), precipitation_sum: good.map((g) => (g ? 0 : 8)), precipitation_probability_max: good.map((g) => (g ? 10 : 90)), wind_gusts_10m_max: good.map(() => 20), temperature_2m_max: good.map(() => 16) });
  const w = { key: 'ww:1', date: '2026-10-24', days: 1, lat: 46.95, lon: 7.45, title: 'Testtour', url: '#/pack' };
  const texts = { wtitle: 'Wetter-Wecker', bad: 'Das Wetter für {trip} sieht schlecht aus.', turn: 'Das Wetter für {trip} kippt.', good: 'Gutes Wetterfenster: {trip}.', window: 'Für {trip} sieht {day} besser aus.', better: 'Ab {day} sieht es besser aus.', wdays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'] };

  it('a day is good when dry, without thunder or storm and not cold', () => {
    expect(dayGood(fc([true]), '2026-10-21')).toBe(true);
    expect(dayGood(fc([false]), '2026-10-21')).toBe(false);
    expect(dayGood({ ...fc([true]), weather_code: [95] }, '2026-10-21')).toBe(false);
    expect(dayGood({ ...fc([true]), wind_gusts_10m_max: [70] }, '2026-10-21')).toBe(false);
    expect(dayGood(fc([true]), '2026-11-30')).toBe(null);
  });
  it('finds a better start day nearby, never today or before', () => {
    expect(watchVerdict(fc([true, true, true, true, true, true, true]), w, '2026-10-20')).toEqual({ verdict: 'good', alt: null });
    expect(watchVerdict(fc([true, true, false, false, true, true, true]), w, '2026-10-20')).toEqual({ verdict: 'bad', alt: '2026-10-25' });
    expect(watchVerdict(fc([true, false, false, false, false, false, false]), w, '2026-10-20')).toEqual({ verdict: 'bad', alt: '2026-10-21' });
    expect(watchVerdict(fc([true, false, false, false, false, false, false]), w, '2026-10-21')).toEqual({ verdict: 'bad', alt: null });
    expect(watchVerdict(fc([true, true, true, true, false, true, true]), { ...w, days: 2 }, '2026-10-20')).toEqual({ verdict: 'bad', alt: '2026-10-23' });
    expect(watchVerdict({ time: [] }, w, '2026-10-20').verdict).toBe(null);
  });
  it('tells only news: the weather turns, gets good, or a better day shows up', () => {
    expect(watchNews(null, 'good', null, null)).toBe(null);
    expect(watchNews(null, 'bad', '2026-10-25', null)).toEqual({ kind: 'bad', alt: '2026-10-25' });
    expect(watchNews('good', 'bad', null, null)).toEqual({ kind: 'turn', alt: null });
    expect(watchNews('bad', 'good', null, '2026-10-25')).toEqual({ kind: 'good', alt: null });
    expect(watchNews('bad', 'bad', '2026-10-25', '2026-10-25')).toBe(null);
    expect(watchNews('bad', 'bad', '2026-10-26', '2026-10-25')).toEqual({ kind: 'window', alt: '2026-10-26' });
    expect(watchNews('good', 'good', null, null)).toBe(null);
    expect(watchNews('good', null, null, null)).toBe(null);
  });
  it('words the message with the tour and the better day', () => {
    expect(watchMessage(w, { kind: 'turn', alt: '2026-10-25' }, texts)).toEqual({ title: 'Wetter-Wecker', body: 'Das Wetter für Testtour kippt. Ab So 25.10. sieht es besser aus.', url: '#/pack', tag: 'ww:1' });
    expect(watchMessage(w, { kind: 'window', alt: '2026-10-26' }, texts).body).toBe('Für Testtour sieht Mo 26.10. besser aus.');
    expect(watchMessage(w, { kind: 'good', alt: null }, texts).body).toBe('Gutes Wetterfenster: Testtour.');
    expect(watchMessage(w, { kind: 'good', alt: null }, {})).toBe(null);
  });
  it('a resend keeps what the server learned; the forecast spans the days around the tour from tomorrow', () => {
    const old = [{ ...w, at: 99, last: 'bad', alt: '2026-10-25' }];
    expect(keepWatch([{ ...w, at: 5 }, { ...w, key: 'ww:2', at: 7 }], old)).toEqual([{ ...w, at: 99, last: 'bad', alt: '2026-10-25' }, { ...w, key: 'ww:2', at: 7, last: null, alt: null }]);
    const u = watchUrl({ ...w, date: '2026-10-22', days: 2 }, '2026-10-20');
    expect(u).toContain('start_date=2026-10-21');
    expect(u).toContain('end_date=2026-10-26');
    expect(u).toContain('precipitation_sum');
  });
  it('on the tick: silent while good, one message when it turns, checks again 12 hours later, stops on the tour day', async () => {
    let forecast = { daily: fc([true, true, true, true, true, true, true]) };
    const wld = world();
    wld.doFetch.mockImplementation(
      ((orig) => async (url, init) => (String(url).startsWith('https://api.open-meteo.com/') ? Response.json(forecast) : orig(url, init)))(wld.doFetch.getMockImplementation()),
    );
    const ph = phone();
    let now = T0; // 20 Oct 2026, 07:00 in Zurich
    const h = makeHandler({ env: env(), doFetch: wld.doFetch, now: () => now });
    const saved = await (await h(post({ a: 'save', token: TOKEN, sub: ph.sub, watch: [{ ...w, at: T0 + 1000 }], texts }))).json();
    expect(saved).toMatchObject({ ok: true, watch: 1 });
    now = T0 + 2000;
    expect(await (await h(get(`a=tick&key=${TICK}`))).json()).toMatchObject({ sent: 0 });
    let rec = JSON.parse(wld.store[devKey(TOKEN)]);
    expect(rec.watch[0]).toMatchObject({ last: 'good', at: T0 + 2000 + WATCH_EVERY_MS });
    // the app sends its list again: the learned state stays
    await h(post({ a: 'save', token: TOKEN, sub: ph.sub, watch: [{ ...w, at: T0 + 3000 }], texts }));
    expect(JSON.parse(wld.store[devKey(TOKEN)]).watch[0]).toMatchObject({ last: 'good', at: T0 + 2000 + WATCH_EVERY_MS });
    // 12 hours later rain on the tour day, Sunday dry
    forecast = { daily: fc([true, true, true, false, true, true, true]) };
    now = T0 + 2000 + WATCH_EVERY_MS;
    expect(await (await h(get(`a=tick&key=${TICK}`))).json()).toMatchObject({ sent: 1 });
    expect(decrypt(wld.sent[0].init.body, ph)).toMatchObject({ title: 'Wetter-Wecker', body: 'Das Wetter für Testtour kippt. Ab So 25.10. sieht es besser aus.' });
    // the same again: nothing new
    now += WATCH_EVERY_MS;
    expect(await (await h(get(`a=tick&key=${TICK}`))).json()).toMatchObject({ sent: 0 });
    // on the tour day the watch ends (the morning warning takes over)
    now = Date.parse('2026-10-24T05:00:00Z');
    await h(get(`a=tick&key=${TICK}`));
    rec = JSON.parse(wld.store[devKey(TOKEN)]);
    expect(rec.watch).toEqual([]);
  });
});
