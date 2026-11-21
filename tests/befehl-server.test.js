// «Mit der App sprechen», Etappe 2 (Noah 07.11.2026 «1b 2a 3a 4a 5a»): Gemini turns one sentence into actions of a
// fixed list. The server keeps only the allowed kinds and fields. Fictional values only (no real key or code).
import { describe, it, expect, vi } from 'vitest';
import { makeHandler, geminiRequest, commandText, COMMAND_KINDS, COMMAND_MODE } from '../api/helper.js';

const TOKEN = 'test-code-not-real-0000';
const REDIS = 'https://redis.example.test';
const env = () => ({ apiKey: '', token: TOKEN, model: 'claude-sonnet-5-5', cap: 2, redisUrl: REDIS, redisToken: 'r', geminiKey: 'g-test-not-real', geminiModel: 'gemini-flash-latest', geminiDaily: 50 });
const req = (body) => new Request('https://packgen-three.vercel.app/api/helper', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173', authorization: `Bearer ${TOKEN}` }, body: JSON.stringify(body) });
const answer = (obj) => ({ candidates: [{ content: { parts: [{ text: typeof obj === 'string' ? obj : JSON.stringify(obj) }] } }] });
function world(a) {
  const store = {};
  const calls = [];
  const doFetch = vi.fn(async (url, init) => {
    if (url === REDIS) {
      const [cmd, k, v] = JSON.parse(init.body);
      if (cmd === 'GET') return Response.json({ result: store[k] ?? null });
      if (cmd === 'INCRBYFLOAT') return Response.json({ result: String((store[k] = String(Number(store[k] ?? 0) + Number(v)))) });
      return Response.json({ result: 1 });
    }
    calls.push({ url, init });
    return Response.json(a);
  });
  return { calls, doFetch };
}
const now = () => new Date('2026-11-07T10:00:00Z');

describe('the command request', () => {
  it('asks for JSON in a fixed shape, with the instruction in German or English and a low temperature', () => {
    const r = geminiRequest({ question: 'Erstelle eine Liste: A, B', context: 'today: 2026-11-07', mode: COMMAND_MODE, lang: 'de' });
    expect(r.systemInstruction.parts[0].text).toContain('Schweizer Hochdeutsch');
    expect(r.generationConfig).toMatchObject({ responseMimeType: 'application/json', temperature: 0.1 });
    expect(r.generationConfig.responseSchema.properties.actions.items.properties.kind.enum).toEqual(COMMAND_KINDS);
    expect(r.contents[0].parts[0].text).toBe('Erstelle eine Liste: A, B\n\ntoday: 2026-11-07');
    expect(geminiRequest({ question: 'x', mode: COMMAND_MODE, lang: 'en' }).systemInstruction.parts[0].text).toContain('You translate ONE sentence');
  });
  it('the list of kinds has nothing that deletes or changes things that exist', () => {
    expect(COMMAND_KINDS).toEqual(['list', 'todo', 'note', 'value', 'care', 'plan', 'weather']);
  });
});

describe('commandText keeps only what is allowed', () => {
  it("Noah's list, a to-do with a day, a value, bike care", () => {
    const out = JSON.parse(
      commandText(
        JSON.stringify({
          actions: [
            { kind: 'list', name: 'To-do', points: ['Aufräumen', 'Kette wachsen', ' Anmeldung für das Rennen ', ''] },
            { kind: 'todo', text: 'Reifen pumpen', due: '2026-11-13' },
            { kind: 'value', valueKind: 'weight', value: 72.5 },
            { kind: 'care', careKind: 'chain', bike: 'Gravel' },
          ],
        }),
      ),
    );
    expect(out.actions).toEqual([
      { kind: 'list', name: 'To-do', points: ['Aufräumen', 'Kette wachsen', 'Anmeldung für das Rennen'] },
      { kind: 'todo', text: 'Reifen pumpen', due: '2026-11-13' },
      { kind: 'value', valueKind: 'weight', value: 72.5 },
      { kind: 'care', careKind: 'chain', bike: 'Gravel' },
    ]);
  });
  it('drops unknown kinds (delete, shell), foreign fields, bad days and incomplete actions; at most 8', () => {
    const out = JSON.parse(
      commandText(
        JSON.stringify({
          actions: [
            { kind: 'delete', text: 'alles' },
            { kind: 'note', text: 'Bremse quietscht', url: 'https://example.test', secret: 'x' },
            { kind: 'todo', text: 'Pumpen', due: 'Freitag' },
            { kind: 'value', valueKind: 'weight' },
            { kind: 'care', careKind: 'oil' },
            { kind: 'list' },
            ...Array(12).fill({ kind: 'note', text: 'n' }),
          ],
        }),
      ),
    );
    expect(out.actions[0]).toEqual({ kind: 'note', text: 'Bremse quietscht' });
    expect(out.actions[1]).toEqual({ kind: 'todo', text: 'Pumpen' });
    expect(out.actions).toHaveLength(8 - 4); // the first 8 entries: 4 survive, the rest were cut before checking
  });
  it('JSON in a code fence works, anything else gives an empty string', () => {
    expect(JSON.parse(commandText('```json\n{"actions":[{"kind":"weather","place":"Chur"}]}\n```')).actions).toEqual([{ kind: 'weather', place: 'Chur' }]);
    expect(commandText('Ich würde eine Liste anlegen.')).toBe('');
    expect(commandText('{"actions":"x"}')).toBe('');
    expect(JSON.parse(commandText('{"actions":[]}')).actions).toEqual([]);
  });
});

describe('task gemini, mode command', () => {
  it('answers cleaned JSON, counts one call, and sends the key only in a header', async () => {
    const w = world(answer({ actions: [{ kind: 'list', name: 'To-do', points: ['A', 'B'] }, { kind: 'format', text: 'x' }] }));
    const r = await makeHandler({ env, doFetch: w.doFetch, now })(req({ task: 'gemini', input: { question: 'Erstelle eine To-do-Liste mit A und B', context: 'today: 2026-11-07', lang: 'de', mode: 'command' } }));
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(JSON.parse(body.result.text)).toEqual({ actions: [{ kind: 'list', name: 'To-do', points: ['A', 'B'] }] });
    const sent = JSON.parse(w.calls[0].init.body);
    expect(sent.generationConfig.responseMimeType).toBe('application/json');
    expect(w.calls[0].init.body).not.toContain('g-test-not-real');
  });
  it('a reply that is no JSON is a clean 502, not a guess', async () => {
    const w = world(answer('Gerne! Ich lege die Liste an.'));
    const r = await makeHandler({ env, doFetch: w.doFetch, now })(req({ task: 'gemini', input: { question: 'Erstelle eine Liste mit A', lang: 'de', mode: 'command' } }));
    expect(r.status).toBe(502);
    expect((await r.json()).code).toBe('no_answer');
  });
});
