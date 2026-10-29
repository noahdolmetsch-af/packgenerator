// Mini-Tools (Noah 28.10.2026 «1b»): /api/sync?action=mini keeps a sealed question and sealed answers that only
// the maker can open; client.js makes, reads, answers, changes and ends it. Fictional data only.
import { describe, it, expect } from 'vitest';
import { makeDispatch } from '../api/sync.js';
import { makeMiniHandler, ANSWERS_MAX, MINI_DAYS_MAX } from '../api/_lib/mini.js';
import { DAY_CAPS } from '../api/_lib/daycap.js';
import { fakeRedis } from './fakeredis.js';
import { createQuestion, openQuestion, readAnswers, sendAnswer, editQuestion, endQuestion, sealFor, openWith, newPair, parseJoinLink, joinLinkOf } from '../src/lib/mini/client.js';

const T0 = Date.parse('2026-11-02T08:00:00Z');

function setup() {
  const r = fakeRedis();
  let now = T0;
  const env = () => ({ redisUrl: 'https://redis.example.test', redisToken: 'r' });
  const doRedis = async (url, init) => Response.json({ result: r.run(...((a) => [a[0], a.slice(1)])(JSON.parse(init.body))) });
  const handler = makeDispatch({ mini: makeMiniHandler({ env, doFetch: doRedis, now: () => new Date(now) }) });
  const doFetch = (url, init = {}) => handler(new Request(url, { ...init, headers: { ...(init.headers ?? {}), origin: 'http://localhost:5173', 'x-forwarded-for': '203.0.113.9' } }));
  return { r, opts: { doFetch, url: 'https://packgen.example.test/api/sync?action=mini' }, later: (ms) => (now += ms) };
}

const Q = { v: 1, kind: 'date', title: 'Testtour Jura', opts: [{ d: '2026-11-14', t: '' }, { d: '2026-11-15', t: '' }] };

describe('/api/sync?action=mini', () => {
  it('makes a question, two people answer, only the maker reads the answers, the server reads nothing', async () => {
    const { r, opts } = setup();
    const srv = await createQuestion(Q, { ...opts, days: 30 });
    expect(srv.id).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(Date.parse(srv.end) - T0).toBe(30 * 86_400_000);
    const open = await openQuestion(srv.id, srv.key, opts);
    expect(open.question.title).toBe('Testtour Jura');
    expect(open.question.pk).toBe(srv.pub);
    const a = await sendAnswer(srv.id, open.question.pk, { name: 'Test-Person A', picks: { '2026-11-14': 'y' } }, null, opts);
    await sendAnswer(srv.id, open.question.pk, { name: 'Test-Person B', picks: { '2026-11-14': 'm', '2026-11-15': 'n' } }, null, opts);
    const stored = JSON.stringify([...r.kv.get(`mini:${srv.id}`)]);
    expect(stored).not.toMatch(/Test-Person|Testtour|2026-11-14/);
    const read = await readAnswers(srv, opts);
    expect(read.answers.map((x) => x.name).sort()).toEqual(['Test-Person A', 'Test-Person B']);
    // the same person changes the answer: still two answers
    await sendAnswer(srv.id, open.question.pk, { name: 'Test-Person A', picks: { '2026-11-14': 'n' } }, a, opts);
    const read2 = await readAnswers(srv, opts);
    expect(read2.answers).toHaveLength(2);
    expect(read2.answers.find((x) => x.name === 'Test-Person A').picks['2026-11-14']).toBe('n');
    // another device cannot change it
    await expect(sendAnswer(srv.id, open.question.pk, { name: 'X', picks: {} }, { aid: a.aid, del: 'x'.repeat(32) }, opts)).rejects.toMatchObject({ code: 'forbidden' });
    // without the owner code nobody reads the answers
    await expect(readAnswers({ ...srv, del: 'y'.repeat(32) }, opts)).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('an answer is only readable with the maker key', async () => {
    const owner = await newPair();
    const other = await newPair();
    const e = await sealFor({ name: 'Test', picks: {} }, owner.pub);
    expect((await openWith(e, owner.priv)).name).toBe('Test');
    expect(await openWith(e, other.priv)).toBeNull();
  });

  it('the maker changes the title and ends it; then the link says ended', async () => {
    const { opts } = setup();
    const srv = await createQuestion(Q, opts);
    await editQuestion(srv, { ...Q, title: 'Neuer Titel' }, opts);
    expect((await openQuestion(srv.id, srv.key, opts)).question.title).toBe('Neuer Titel');
    await endQuestion(srv, opts);
    await expect(openQuestion(srv.id, srv.key, opts)).rejects.toMatchObject({ code: 'not_found' });
    await endQuestion(srv, opts); // twice is fine
  });

  it('ends by itself after its days, at most 60 days, and has a limit of answers', async () => {
    const { opts, later } = setup();
    const srv = await createQuestion(Q, { ...opts, days: 999 });
    expect(Date.parse(srv.end) - T0).toBe(MINI_DAYS_MAX * 86_400_000);
    const pk = (await openQuestion(srv.id, srv.key, opts)).question.pk;
    for (let i = 0; i < ANSWERS_MAX; i++) await sendAnswer(srv.id, pk, { name: `T${i}`, picks: {} }, null, opts);
    await expect(sendAnswer(srv.id, pk, { name: 'one more', picks: {} }, null, opts)).rejects.toMatchObject({ code: 'full' });
    later(MINI_DAYS_MAX * 86_400_000 + 1);
    await expect(openQuestion(srv.id, srv.key, opts)).rejects.toMatchObject({ code: 'not_found' });
  });

  it('has its own daily cap and a link form', () => {
    expect(DAY_CAPS.mini).toBeGreaterThan(0);
    const l = joinLinkOf('a'.repeat(22), 'b'.repeat(43), 'https://x.test/packgenerator/');
    expect(l).toBe(`https://x.test/packgenerator/#/mitmachen/${'a'.repeat(22)}/${'b'.repeat(43)}`);
    expect(parseJoinLink(`#/mitmachen/${'a'.repeat(22)}/${'b'.repeat(43)}`)).toEqual({ id: 'a'.repeat(22), key: 'b'.repeat(43) });
    expect(parseJoinLink('#/mitmachen/short/key')).toBeNull();
  });
});
