// «Frag Gemini» (Noah 23.11.2026): /api/ask hands a question to Gemini's free tier. Gemini is replaced by a fake answer here.
import { describe, it, expect, beforeEach } from 'vitest';
import { cleanBody, geminiRequest, answerText, parseJson, pointsOf, actionsOf, modelsOf, askGemini, flashModelsOf, tryOrder, forgetModel, shape, instructionFor, DEFAULT_MODEL, MAX_TEXT } from '../api/_lib/ask.js';
import { makeHandler } from '../api/ask.js';
import { DAY_CAPS } from '../api/_lib/daycap.js';

const IMG = 'A'.repeat(200);
const gem = (text) => ({ candidates: [{ content: { parts: [{ text }] } }] });
const okRes = (body) => ({ ok: true, status: 200, json: async () => body });
const stat = (status) => ({ ok: false, status, json: async () => ({}) });

describe('cleanBody', () => {
  it('takes a question, mode ask by default', () => {
    expect(cleanBody({ text: '  Was ziehe   ich an? ' })).toMatchObject({ mode: 'ask', text: 'Was ziehe ich an?', image: null, lang: 'de' });
  });
  it('refuses an empty or too long question', () => {
    expect(() => cleanBody({ text: ' ' })).toThrow(/empty/);
    expect(() => cleanBody({ text: 'x'.repeat(MAX_TEXT.ask + 1) })).toThrow(/too long/);
    expect(() => cleanBody({ mode: 'command', text: 'x'.repeat(MAX_TEXT.command + 1) })).toThrow(/too long/);
  });
  it('lets a photo go with a question only, checks type and size', () => {
    expect(cleanBody({ text: 'Was ist das?', image: { mime: 'image/jpeg', data: IMG } }).image).toEqual({ mime: 'image/jpeg', data: IMG });
    expect(() => cleanBody({ mode: 'report', text: 'abc def', image: { mime: 'image/jpeg', data: IMG } })).toThrow(/only goes with a question/);
    expect(() => cleanBody({ text: 'a', image: { mime: 'application/pdf', data: IMG } })).toThrow(/cannot be read/);
    expect(() => cleanBody({ text: 'a', image: { mime: 'image/png', data: 'A'.repeat(1_900_000) } })).toThrow(/too big/);
  });
});

describe('request and answer', () => {
  it('puts the photo into the request and asks for JSON only for report and command', () => {
    const r = geminiRequest({ mode: 'ask', text: 'Hi', image: { mime: 'image/png', data: IMG }, lang: 'de' });
    expect(r.contents[0].parts[1].inlineData).toEqual({ mimeType: 'image/png', data: IMG });
    expect(r.generationConfig.responseMimeType).toBeUndefined();
    expect(geminiRequest({ mode: 'command', text: 'Hi', image: null, lang: 'de' }).generationConfig.responseMimeType).toBe('application/json');
  });
  it('tells Gemini that it does not know the data', () => {
    expect(instructionFor('ask')).toMatch(/do not know their data/);
    expect(instructionFor('command', { today: '2026-11-23' })).toMatch(/2026-11-23/);
  });
  it('reads text and JSON, also in a code fence', () => {
    expect(answerText(gem(' Hallo '))).toBe('Hallo');
    expect(answerText({})).toBe('');
    expect(parseJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseJson('nope')).toBeNull();
  });
  it('keeps only known kinds of points, short, at most 8', () => {
    const pts = pointsOf({ points: [{ text: 'Regenjacke zu warm', kind: 'learn' }, { text: 'Kocher nie benutzt', kind: 'weird' }, { text: 'a', kind: 'note' }, ...Array.from({ length: 12 }, (_, i) => ({ text: `Punkt ${i + 1}`, kind: 'note' }))] });
    expect(pts[0]).toEqual({ text: 'Regenjacke zu warm', kind: 'learn' });
    expect(pts[1].kind).toBe('note');
    expect(pts).toHaveLength(8);
  });
  it('keeps only the four adding actions, with their limits', () => {
    const acts = actionsOf({
      actions: [
        { kind: 'remind', text: 'Reifen pumpen', due: '2026-11-27' },
        { kind: 'list', name: 'Wochenende', points: ['Sonnencreme', '', 'Snacks'] },
        { kind: 'note', text: 'Kette quietscht' },
        { kind: 'value', qid: 'koerper.waage', value: 72.5 },
        { kind: 'value', qid: 'koerper.waage', value: 900 },
        { kind: 'value', qid: 'other', value: 1 },
        { kind: 'delete', id: 'x' },
      ],
    });
    expect(acts.map((a) => a.kind)).toEqual(['remind', 'list', 'note', 'value']);
    expect(acts[1].points).toEqual(['Sonnencreme', 'Snacks']);
    expect(actionsOf({ actions: 'x' })).toEqual([]);
  });
  it('shapes the answer for each job and drops markdown signs', () => {
    expect(shape('ask', { text: '**Zwiebel** tragen' })).toEqual({ ok: true, text: 'Zwiebel tragen' });
    expect(shape('report', { text: '{"points":[{"text":"Alles gut hier","kind":"note"}]}' }).points).toHaveLength(1);
    expect(shape('command', { text: 'kaputt' })).toEqual({ ok: true, actions: [] });
  });
  it('has a daily cap that keeps the free tier', () => {
    expect(DAY_CAPS.ask).toBeLessThanOrEqual(200);
  });
});

describe('askGemini', () => {
  beforeEach(forgetModel);
  const req = { mode: 'ask', text: 'Hi', image: null, lang: 'de' };
  it('uses the default model and the key in a header, never in the address', async () => {
    const seen = [];
    const doFetch = async (url, init) => (seen.push({ url, init }), okRes(gem('Antwort')));
    expect(await askGemini(req, { key: 'KEY123', doFetch })).toEqual({ text: 'Antwort' });
    expect(seen[0].url).toContain(`/models/${DEFAULT_MODEL}:generateContent`);
    expect(seen[0].url).not.toContain('KEY123');
    expect(seen[0].init.headers['x-goog-api-key']).toBe('KEY123');
  });
  it('tries the next model when one is unknown or busy', async () => {
    const calls = [];
    const doFetch = async (url) => (calls.push(url), calls.length === 1 ? stat(404) : calls.length === 2 ? stat(429) : okRes(gem('ok')));
    expect(await askGemini(req, { key: 'k', models: ['a', 'b', 'c'], doFetch })).toEqual({ text: 'ok' });
    expect(calls).toHaveLength(3);
  });
  it('says busy when every model is over its free limit', async () => {
    await expect(askGemini(req, { key: 'k', models: ['a', 'b'], doFetch: async () => stat(429) })).rejects.toMatchObject({ status: 429, code: 'busy' });
  });
  it('tries the next model also when one refuses the request (400, 403)', async () => {
    const calls = [];
    const doFetch = async (url) => (calls.push(url), calls.length === 1 ? stat(403) : calls.length === 2 ? stat(400) : okRes(gem('ok')));
    expect(await askGemini(req, { key: 'k', models: ['a', 'b', 'c'], doFetch })).toEqual({ text: 'ok' });
    expect(calls).toHaveLength(3);
  });
  it('reads the key own model list when every listed model fails, takes the newest flash and remembers it', async () => {
    const list = { models: [
      { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
      { name: 'models/gemini-3.8-flash-lite', supportedGenerationMethods: ['generateContent'] },
      { name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] },
      { name: 'models/gemini-3.8-flash-image', supportedGenerationMethods: ['generateContent'] },
      { name: 'models/gemini-3.9-flash', supportedGenerationMethods: ['embedContent'] },
    ] };
    const seen = [];
    const doFetch = async (url) => {
      seen.push(url);
      if (url.includes('/models?')) return okRes(list);
      return url.includes('/models/gemini-3.8-flash:') ? okRes(gem('neu')) : stat(404);
    };
    expect(await askGemini(req, { key: 'k', models: ['old-a', 'old-b'], doFetch })).toEqual({ text: 'neu' });
    expect(seen.filter((u) => u.includes('/models?'))).toHaveLength(1);
    // the next question goes straight to the model that worked
    const seen2 = [];
    expect(await askGemini(req, { key: 'k', models: ['old-a'], doFetch: async (u) => (seen2.push(u), okRes(gem('zwei'))) })).toEqual({ text: 'zwei' });
    expect(seen2).toHaveLength(1);
    expect(seen2[0]).toContain('/models/gemini-3.8-flash:');
  });
  it('tries the lite model of a new version first and asks again once when a model is overloaded (503)', async () => {
    expect(tryOrder(['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.8-flash-lite', 'gemini-3.7-flash-lite', 'gemini-3.6-flash'])).toEqual(['gemini-3.8-flash-lite', 'gemini-3.8-flash', 'gemini-3.7-flash-lite', 'gemini-3.7-flash']);
    const list = { models: ['gemini-3.8-flash', 'gemini-3.8-flash-lite'].map((n) => ({ name: `models/${n}`, supportedGenerationMethods: ['generateContent'] })) };
    const calls = [];
    const doFetch = async (url) => {
      calls.push(url);
      if (url.includes('/models?')) return okRes(list);
      if (url.includes('gemini-3.8-flash-lite:')) return calls.filter((u) => u.includes('gemini-3.8-flash-lite:')).length === 1 ? stat(503) : okRes(gem('lite'));
      return stat(404);
    };
    expect(await askGemini(req, { key: 'k', models: ['old'], doFetch, pause: 1 })).toEqual({ text: 'lite' });
    expect(calls.filter((u) => u.includes('gemini-3.8-flash-lite:'))).toHaveLength(2);
    expect(calls.some((u) => u.includes('gemini-3.8-flash:'))).toBe(false);
  });
  it('keeps to its time: no new try when the budget is used up', async () => {
    let n = 0;
    await expect(askGemini(req, { key: 'k', models: ['a', 'b', 'c'], doFetch: async () => (n++, stat(503)), budget: 1 })).rejects.toMatchObject({ code: 'ai_unavailable' });
    expect(n).toBeLessThanOrEqual(1);
  });
  it('lists only text models: flash and flash-lite with a version, newest first', () => {
    expect(flashModelsOf({ models: [
      { name: 'models/gemini-2.5-flash-lite', supportedGenerationMethods: ['generateContent'] },
      { name: 'models/gemini-3.5-flash', supportedGenerationMethods: ['generateContent'] },
      { name: 'models/gemini-3.5-flash-lite', supportedGenerationMethods: ['generateContent'] },
      { name: 'models/gemini-3.5-flash-tts', supportedGenerationMethods: ['generateContent'] },
      { name: 'models/gemini-2.5-pro', supportedGenerationMethods: ['generateContent'] },
    ] })).toEqual(['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash-lite']);
    expect(flashModelsOf(null)).toEqual([]);
  });
  it('says not set up without a key, and unavailable (with the codes it saw) when Gemini refuses', async () => {
    await expect(askGemini(req, { key: '' })).rejects.toMatchObject({ status: 503, code: 'not_set_up' });
    await expect(askGemini(req, { key: 'k', models: ['zz-never'], doFetch: async () => stat(403) })).rejects.toMatchObject({ status: 502, code: 'ai_unavailable', extra: { tried: ['zz-never:403', 'list:403'] } });
    await expect(askGemini(req, { key: 'k', models: ['a'], doFetch: async () => { throw new Error('net'); } })).rejects.toMatchObject({ code: 'ai_unavailable' });
  });
  it('reads the model list from the settings', () => {
    expect(modelsOf({})[0]).toBe(DEFAULT_MODEL);
    expect(modelsOf({ GEMINI_MODEL: 'm1', GEMINI_FALLBACKS: 'm2, m3' })).toEqual(['m1', 'm2', 'm3']);
  });
});

describe('/api/ask', () => {
  const post = (body, origin = 'http://localhost:5173') => new Request('https://packgen-three.vercel.app/api/ask', { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) });
  const handler = (doFetch) => makeHandler({ env: { GEMINI_API_KEY: 'k' }, doFetch });
  it('answers a question', async () => {
    const res = await handler(async () => okRes(gem('Zwei Schichten.')))(post({ text: 'Was ziehe ich an?' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, text: 'Zwei Schichten.' });
  });
  it('only answers the app', async () => {
    const res = await handler(async () => okRes(gem('x')))(post({ text: 'Hi' }, 'https://evil.example'));
    expect(res.status).toBe(403);
  });
  it('refuses bad input with a clear code and never calls Gemini', async () => {
    let called = 0;
    const h = handler(async () => (called++, okRes(gem('x'))));
    expect((await h(post('not json'))).status).toBe(400);
    expect((await h(post({ text: '' }))).status).toBe(400);
    expect(called).toBe(0);
  });
  it('passes «busy» on as 429 so the app can offer the other services', async () => {
    const res = await handler(async () => stat(429))(post({ text: 'Hi' }));
    expect(res.status).toBe(429);
    expect((await res.json()).code).toBe('busy');
  });
});
