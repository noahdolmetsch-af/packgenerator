// v0.77.0 «KI-Helfer»: the server function api/helper.js with a fake environment, a fake Redis and a
// fake Claude. Fictional values only (no real key or code anywhere).
import { describe, it, expect, vi, afterEach } from 'vitest';
import { makeHandler, sameToken, helperEnv, MESSAGES_URL } from '../api/helper.js';
import { validate, costChf, monthKey, spendKey, buildRequest, forbiddenKey, TASK_NAMES } from '../api/_lib/helper.js';
import { allowedOrigin } from '../api/_lib/core.js';

const TOKEN = 'test-code-not-real-0000';
const REDIS = 'https://redis.example.test';
const env = (over = {}) => () => ({ apiKey: 'sk-test-not-real', token: TOKEN, model: 'claude-sonnet-5-5', cap: 5, redisUrl: REDIS, redisToken: 'redis-test', ...over });

function fakeWorld({ spent = '0', claude = null, claudeStatus = 200 } = {}) {
  const store = { [spendKey('2026-10')]: spent };
  const calls = [];
  const doFetch = vi.fn(async (url, init) => {
    if (url === REDIS) {
      const [cmd, k, v] = JSON.parse(init.body);
      calls.push({ redis: cmd, k, v });
      if (cmd === 'GET') return Response.json({ result: store[k] ?? null });
      if (cmd === 'INCRBYFLOAT') return Response.json({ result: String((store[k] = String(Number(store[k] ?? 0) + Number(v)))) });
      return Response.json({ result: 1 });
    }
    calls.push({ claude: url, init });
    return Response.json(claude, { status: claudeStatus });
  });
  return { store, calls, doFetch };
}
const req = (body, { auth = `Bearer ${TOKEN}`, origin = 'http://localhost:5173' } = {}) =>
  new Request('https://packgen-three.vercel.app/api/helper', { method: 'POST', headers: { 'content-type': 'application/json', origin, ...(auth ? { authorization: auth } : {}) }, body: typeof body === 'string' ? body : JSON.stringify(body) });
const now = () => new Date('2026-10-10T10:00:00Z');
const tripInput = { question: '3 Tage Jura', items: [{ id: 'IT1', name: 'Daunenjacke' }, { id: 'IT2', name: 'Stirnlampe' }], bikes: [{ id: 'bike-demo', name: 'Demo Gravel' }], blocks: [{ key: 'warm', label: 'Kälte' }], areas: [{ key: 'bikepacking', name: 'Bikepacking' }] };
const claudeAnswer = (input, usage = { input_tokens: 10000, output_tokens: 1000 }) => ({ model: 'claude-sonnet-5-5', stop_reason: 'tool_use', usage, content: [{ type: 'text', text: 'ok' }, { type: 'tool_use', id: 'tu1', name: 'answer', input }] });

afterEach(() => vi.restoreAllMocks());

describe('the helper code', () => {
  it('compares in constant time and refuses empty values', () => {
    expect(sameToken(TOKEN, TOKEN)).toBe(true);
    expect(sameToken('x', TOKEN)).toBe(false);
    expect(sameToken('', '')).toBe(false);
    expect(sameToken(null, TOKEN)).toBe(false);
  });
  it('reads the environment with the defaults (model, CHF 5)', () => {
    expect(helperEnv({ HELPER_TOKEN: ' t ', ANTHROPIC_API_KEY: 'k' })).toMatchObject({ token: 't', apiKey: 'k', model: 'claude-sonnet-5-5', cap: 5 });
    expect(helperEnv({ HELPER_MONTHLY_CHF: '12.5', HELPER_MODEL: 'claude-opus-5-5' })).toMatchObject({ cap: 12.5, model: 'claude-opus-5-5' });
    expect(helperEnv({ HELPER_MONTHLY_CHF: 'abc' }).cap).toBe(5);
  });
});

describe('POST /api/helper', () => {
  it('401 without or with a wrong code, 503 when the server has no code', async () => {
    const w = fakeWorld();
    const h = makeHandler({ env: env(), doFetch: w.doFetch, now });
    expect((await h(req({ task: 'status' }, { auth: null }))).status).toBe(401);
    const r = await h(req({ task: 'status' }, { auth: 'Bearer wrong' }));
    expect(r.status).toBe(401);
    expect(await r.json()).toMatchObject({ code: 'unauthorized' });
    expect(w.doFetch).not.toHaveBeenCalled();
    const off = makeHandler({ env: env({ token: '' }), doFetch: w.doFetch, now });
    expect(await (await off(req({ task: 'status' }))).json()).toMatchObject({ code: 'not_set_up' });
  });
  it('400 for unknown tasks and for fields the helper never takes', async () => {
    const w = fakeWorld();
    const h = makeHandler({ env: env(), doFetch: w.doFetch, now });
    expect((await h(req({ task: 'poem', input: {} }))).status).toBe(400);
    expect((await h(req('not json'))).status).toBe(400);
    for (const bad of [{ photo: 'x' }, { items: [{ id: 'a', receipt: 'r' }] }, { totalChf: 12 }, { code: 'abc' }, { notes: [{ text: 'data:image/png;base64,AAA' }] }]) {
      const r = await h(req({ task: 'trip', input: { ...tripInput, ...bad } }));
      expect(r.status).toBe(400);
      expect((await r.json()).code).toBe('forbidden_field');
    }
    expect(w.calls.some((c) => c.claude)).toBe(false);
  });
  it('status: checks the code and returns the spend, without asking Claude', async () => {
    const w = fakeWorld({ spent: '1.234' });
    const r = await makeHandler({ env: env(), doFetch: w.doFetch, now })(req({ task: 'status' }));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, task: 'status', model: 'claude-sonnet-5-5', spend: { month: '2026-10', chf: 1.23, cap: 5 } });
    expect(r.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
    expect(w.calls.some((c) => c.claude)).toBe(false);
  });
  it('429 monthly_cap once the month has reached the limit (Noah 7a), with the spend', async () => {
    const w = fakeWorld({ spent: '5.01' });
    const r = await makeHandler({ env: env(), doFetch: w.doFetch, now })(req({ task: 'trip', input: tripInput }));
    expect(r.status).toBe(429);
    expect(await r.json()).toMatchObject({ code: 'monthly_cap', spend: { month: '2026-10', chf: 5.01, cap: 5 } });
    expect(w.calls.some((c) => c.claude)).toBe(false);
  });
  it('asks Claude with the strict answer tool, checks the answer and counts the cost', async () => {
    const w = fakeWorld({ spent: '0.5', claude: claudeAnswer({ conditions: { area: 'bikepacking', bikeId: 'bike-invented', days: 3, overnight: 'outdoor', cook: true, tempMin: 5, tempMax: 12, rain: 'none' }, blocks: ['warm', 'invented'], items: [{ id: 'IT1', reason: 'kalt am Abend' }, { id: 'IT99', reason: 'erfunden' }], note: '' }) });
    const log = vi.spyOn(console, 'log');
    const err = vi.spyOn(console, 'error');
    const r = await makeHandler({ env: env(), doFetch: w.doFetch, now })(req({ task: 'trip', input: tripInput }));
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.result.conditions).toMatchObject({ area: 'bikepacking', bikeId: '', days: 3 });
    expect(body.result.blocks).toEqual(['warm']);
    expect(body.result.items).toEqual([{ id: 'IT1', reason: 'kalt am Abend' }]);
    // 10k in × $2 + 1k out × $10 = $0.03 → CHF 0.027
    expect(body.spend).toEqual({ month: '2026-10', chf: 0.53, cap: 5 });
    const call = w.calls.find((c) => c.claude);
    expect(call.claude).toBe(MESSAGES_URL);
    expect(call.init.headers).toMatchObject({ 'anthropic-version': '2023-06-01', 'x-api-key': 'sk-test-not-real' });
    const sent = JSON.parse(call.init.body);
    expect(sent).toMatchObject({ model: 'claude-sonnet-5-5', tool_choice: { type: 'auto', disable_parallel_tool_use: true } });
    expect(sent.tools[0]).toMatchObject({ name: 'answer', strict: true });
    expect(w.calls.filter((c) => c.redis).map((c) => c.redis)).toEqual(['GET', 'INCRBYFLOAT', 'EXPIRE']);
    // never a request body, key or code in the logs
    expect(log).not.toHaveBeenCalled();
    expect(err).not.toHaveBeenCalled();
  });
  it('Claude busy → 503 busy; no tool answer → 502; both count what was billed', async () => {
    const busy = fakeWorld({ claude: { type: 'error' }, claudeStatus: 529 });
    expect(await (await makeHandler({ env: env(), doFetch: busy.doFetch, now })(req({ task: 'trip', input: tripInput }))).json()).toMatchObject({ code: 'busy' });
    const none = fakeWorld({ claude: { model: 'claude-sonnet-5-5', stop_reason: 'end_turn', usage: { input_tokens: 1000, output_tokens: 10 }, content: [{ type: 'text', text: 'hm' }] } });
    const r = await makeHandler({ env: env(), doFetch: none.doFetch, now })(req({ task: 'trip', input: tripInput }));
    expect(r.status).toBe(502);
    expect((await r.json()).code).toBe('no_answer');
    expect(none.calls.some((c) => c.redis === 'INCRBYFLOAT')).toBe(true);
  });
  it('an unexpected error logs only its kind', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const h = makeHandler({ env: () => { throw new TypeError(`secret ${TOKEN}`); }, now });
    const r = await h(req({ task: 'status' }));
    expect(r.status).toBe(500);
    expect(JSON.stringify(err.mock.calls)).not.toContain(TOKEN);
  });
});

describe('answers are checked against the request (invented ids dropped)', () => {
  it('search keeps the text, drops unknown items', () => {
    expect(validate('search', { items: [{ id: 'IT1' }] }, { answer: [{ text: 'Nimm ', itemId: '' }, { text: 'Daunenjacke', itemId: 'IT1' }, { text: 'X', itemId: 'IT7' }], suggestTrip: true })).toEqual({ answer: [{ text: 'Nimm ', itemId: '' }, { text: 'Daunenjacke', itemId: 'IT1' }, { text: 'X', itemId: '' }], suggestTrip: true });
  });
  it('debrief: at most 3 learnings, note keys only from the request', () => {
    const out = validate('debrief', { notes: [{ key: 'n1' }] }, { learnings: [1, 2, 3, 4].map((i) => ({ rule: `R${i}`, action: '', noteKey: i === 1 ? 'n1' : 'n9' })), summary: 'Kurz.' });
    expect(out.learnings).toHaveLength(3);
    expect(out.learnings.map((l) => l.noteKey)).toEqual(['n1', '', '']);
  });
  it('checklist: missing own or generic, doubles only on the list, heavy with an own alternative', () => {
    const out = validate('checklist', { list: [{ id: 'A' }, { id: 'B' }], own: [{ id: 'C' }] }, { missing: [{ itemId: 'C', name: '', reason: 'r' }, { itemId: 'Z', name: 'Flickzeug', reason: 'r' }], double: [{ itemIds: ['A', 'B'], removeId: 'B', reason: 'r' }, { itemIds: ['A', 'Q'], removeId: 'Q', reason: 'r' }], heavy: [{ itemId: 'A', altId: 'C', reason: 'r' }, { itemId: 'Q', altId: 'C', reason: 'r' }] });
    expect(out.missing).toEqual([{ itemId: 'C', name: '', reason: 'r' }, { itemId: '', name: 'Flickzeug', reason: 'r' }]);
    expect(out.double).toEqual([{ itemIds: ['A', 'B'], removeId: 'B', reason: 'r' }]);
    expect(out.heavy).toEqual([{ itemId: 'A', altId: 'C', reason: 'r' }]);
  });
  it('maintenance: only parts of the request and known statuses', () => {
    const out = validate('maintenance', { parts: [{ key: 'chain' }, { key: 'padsF' }] }, { parts: [{ key: 'chain', status: 'soon', reason: 'r', check: 'Lehre 0,5' }, { key: 'rotor', status: 'soon', reason: 'r', check: '' }, { key: 'padsF', status: 'broken', reason: 'r', check: '' }] });
    expect(out.parts).toEqual([{ key: 'chain', status: 'soon', reason: 'r', check: 'Lehre 0,5' }]);
  });
});

describe('cost, month and request', () => {
  it('estimates CHF from usage with the price table (unknown models as the most expensive)', () => {
    expect(costChf('claude-sonnet-5-5', { input_tokens: 1e6, output_tokens: 0 })).toBeCloseTo(1.8);
    expect(costChf('claude-sonnet-5-5', { input_tokens: 0, output_tokens: 1e6 })).toBeCloseTo(9);
    expect(costChf('claude-sonnet-5-5', { cache_read_input_tokens: 1e6 })).toBeCloseTo(0.18);
    expect(costChf('model-unknown', { input_tokens: 1e6 })).toBeCloseTo(9);
  });
  it('the month is the Zurich month', () => {
    expect(monthKey(new Date('2026-10-31T23:30:00Z'))).toBe('2026-11');
    expect(spendKey('2026-10')).toBe('helper:spend:2026-10');
  });
  it('every task has a strict tool and no key in the request', () => {
    for (const task of TASK_NAMES) {
      const r = buildRequest(task, { a: 1 });
      expect(r.tools[0].strict).toBe(true);
      expect(r.tools[0].input_schema.additionalProperties).toBe(false);
      expect(JSON.stringify(r)).not.toMatch(/x-api-key|sk-/);
    }
  });
  it('forbidden keys are found deep inside', () => {
    expect(forbiddenKey({ a: [{ b: { photos: [] } }] })).toBe('photos');
    expect(forbiddenKey({ a: [{ name: 'Jacke' }] })).toBe(null);
  });
  it('CORS: the app, packgen previews and localhost only', () => {
    expect(allowedOrigin('https://noahdolmetsch-af.github.io')).toBe(true);
    expect(allowedOrigin('https://packgen-git-feature-x.vercel.app')).toBe(true);
    expect(allowedOrigin('http://localhost:5173')).toBe(true);
    expect(allowedOrigin('https://evil.example')).toBe(false);
    expect(allowedOrigin('https://packgenerator-evil.vercel.app')).toBe(false);
  });
});
