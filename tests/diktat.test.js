// «Diktat» (Noah 19.10.2026 «1a 2a 3a 4 a oder b beides wählbar 5a», KI «a und b», «1a 2a»): the pure parts of the
// dictation, the controller with a fictional speech recognition, «Weiter fragen bei …», Gemini on the server and
// «Meine KI-Projekte». Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { split, fresh, appendSpoken, withCommands, isQuestion, lastQuestion, sentences, clock, dictOf, ENGINES, ANSWERS, COMMANDS, readAloud } from '../src/lib/speak.js';
import { createDictation } from '../src/lib/dictate.js';
import { whisperLang, transcribe } from '../src/lib/whisper.js';
import { SERVICES, shownServices, contextFor, askText, claudeUrl } from '../src/lib/assistent/elsewhere.js';
import { serviceOf, cleanUrl, addProject, editProject, moveProject } from '../src/lib/aiprojects/aiprojects.js';
import { makeHandler, geminiRequest, geminiText, geminiKey, GEMINI_URL, helperEnv } from '../api/helper.js';
import DE from '../src/lib/i18n/de/index.js';
import { db } from '../src/lib/db.js';
import { HELPER_KEY } from '../src/lib/helper/client.svelte.js';
import { askGemini, geminiError } from '../src/lib/assistent/gemini.js';

const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

describe('what was heard', () => {
  it('splits finished and still-heard words from resultIndex on', () => {
    const r = (s, isFinal) => Object.assign([{ transcript: s }], { isFinal });
    expect(split({ resultIndex: 1, results: [r('alt', true), r('Kette quietscht', true), r('wieder', false)] })).toEqual({ final: 'Kette quietscht', interim: 'wieder' });
    expect(split({ results: [[{ transcript: 'Sattel knarzt' }]] })).toEqual({ final: 'Sattel knarzt', interim: '' });
  });
  it('drops what Android repeats', () => {
    expect(fresh('Kette quietscht', 'Kette quietscht wieder')).toBe('wieder');
    expect(fresh('Kette quietscht', 'kette quietscht')).toBe('');
    expect(fresh('Kette', 'Sattel')).toBe('Sattel');
    expect(fresh('', 'Sattel')).toBe('Sattel');
  });
  it('appends with one space; signs and new lines stick to the text', () => {
    expect(appendSpoken('Notiz:', 'Sattel knarzt')).toBe('Notiz: Sattel knarzt');
    expect(appendSpoken('', ' Sattel')).toBe('Sattel');
    expect(appendSpoken('Kette ', '.')).toBe('Kette.');
    expect(appendSpoken('Kette', '\nWas ist fällig?')).toBe('Kette\nWas ist fällig?');
    expect(appendSpoken('Text', '  ')).toBe('Text');
  });
});

describe('spoken commands', () => {
  it('turn «Punkt», «Komma», «neue Zeile» … into signs, with a capital after', () => {
    expect(withCommands('Kette quietscht Punkt neue Zeile was ist fällig Fragezeichen')).toBe('Kette quietscht.\nWas ist fällig?');
    expect(withCommands('Brot Komma Käse Komma Wasser')).toBe('Brot, Käse, Wasser');
    expect(withCommands('Liste Doppelpunkt Zelt neuer Absatz Ende')).toBe('Liste: Zelt\n\nEnde');
    expect(withCommands('chain squeaks full stop new line what is due question mark')).toBe('chain squeaks.\nWhat is due?');
  });
  it('leave words that only contain a command alone', () => {
    expect(withCommands('Treffpunkt beim Bahnhof')).toBe('Treffpunkt beim Bahnhof');
    expect(withCommands('Kommandant')).toBe('Kommandant');
  });
  it('the settings show every command', () => {
    expect(COMMANDS.map((c) => c.put)).toEqual(['\n\n', '\n', '?', '!', ':', ',', '.']);
    for (const c of COMMANDS) expect(c.say.length).toBeGreaterThanOrEqual(2);
  });
});

describe('a question in what was said', () => {
  it('knows questions by «?» or a question word', () => {
    expect(isQuestion('Was ist am Gravel fällig')).toBe(true);
    expect(isQuestion('wie viele km diesen Monat')).toBe(true);
    expect(isQuestion('Kette quietscht?')).toBe(true);
    expect(isQuestion('Kette quietscht wieder')).toBe(false);
    expect(isQuestion('Wasser kaufen')).toBe(false);
    expect(isQuestion('How many km this week')).toBe(true);
  });
  it('finds the last question of a text', () => {
    expect(sentences('Kette quietscht. Was ist fällig?\nSattel tief')).toEqual(['Kette quietscht.', 'Was ist fällig?', 'Sattel tief']);
    expect(lastQuestion('Kette quietscht. Was ist am Gravel fällig')).toBe('Was ist am Gravel fällig');
    expect(lastQuestion('Kette quietscht.')).toBe('');
  });
  it('shows the time as m:ss', () => {
    expect(clock(42_000)).toBe('0:42');
    expect(clock(3_725_000)).toBe('62:05');
    expect(clock(-5)).toBe('0:00');
  });
});

describe('settings', () => {
  it('fall back to the defaults', () => {
    expect(dictOf('engine', null)).toBe('browser');
    expect(dictOf('engine', 'whisper')).toBe('whisper');
    expect(dictOf('engine', 'nope')).toBe('browser');
    expect(dictOf('answer', 'live')).toBe('live');
    expect(dictOf('answer', null)).toBe('after');
    expect(dictOf('read', null)).toBe(false);
    expect(dictOf('read', '1')).toBe(true);
    expect(dictOf('commands', '0')).toBe(false);
    expect(dictOf('gemini', null)).toBe(true);
    expect(dictOf('others', null)).toBe(null);
    expect(dictOf('others', 'claude')).toBe('claude');
  });
  it('every name and text has a German entry', () => {
    for (const x of [...ENGINES, ...ANSWERS]) for (const k of [x.name, x.text]) expect(DE[k], k).toBeTruthy();
    for (const s of SERVICES) expect(DE[s.what], s.what).toBeTruthy();
  });
});

/** A fictional speech recognition: each start «hears» the next of `heard`, then ends (as Chrome does after a pause). */
function fakeSpeech(heard = [], { endAtOnce = false } = {}) {
  const made = [];
  class Rec {
    constructor() {
      made.push(this);
    }
    start() {
      this.started = true;
      const said = heard.shift();
      queueMicrotask(() => {
        if (said) this.onresult?.({ resultIndex: 0, results: [Object.assign([{ transcript: said }], { isFinal: true })] });
        if (endAtOnce || said !== undefined) this.onend?.();
      });
    }
    stop() {
      queueMicrotask(() => this.onend?.());
    }
    abort() {
      queueMicrotask(() => this.onend?.());
    }
  }
  return { Rec, made };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('the dictation runs until you stop it', () => {
  it('starts again after the browser ends, until stop', async () => {
    const { Rec, made } = fakeSpeech(['Kette quietscht', 'Sattel knarzt']);
    const words = [];
    const states = [];
    let t = 0;
    const d = createDictation({ Speech: Rec, now: () => (t += 5000), onwords: (w) => words.push(w), onstate: (s) => states.push(s.state) });
    d.start();
    await tick();
    await tick();
    expect(words).toEqual(['Kette quietscht', 'Sattel knarzt']);
    expect(made.length).toBeGreaterThanOrEqual(3); // it listened again after each end
    expect(made[0].continuous).toBe(true);
    expect(made[0].interimResults).toBe(true);
    expect(d.state).toBe('listening');
    d.stop();
    await tick();
    expect(d.state).toBe('idle');
    const n = made.length;
    await tick();
    expect(made.length).toBe(n); // no new start after stop
  });
  it('gives up when it ends at once again and again', async () => {
    const { Rec } = fakeSpeech([], { endAtOnce: true });
    const errs = [];
    const d = createDictation({ Speech: Rec, now: () => 0, onstate: (s) => errs.push(s.error) });
    d.start();
    for (let i = 0; i < 10; i++) await tick();
    expect(d.state).toBe('idle');
    expect(errs.at(-1)).toBe('failed');
  });
  it('a microphone that is not allowed stops with «denied»', async () => {
    class Rec {
      start() {
        queueMicrotask(() => (this.onerror?.({ error: 'not-allowed' }), this.onend?.()));
      }
      stop() {}
      abort() {}
    }
    let last = null;
    const d = createDictation({ Speech: Rec, onstate: (s) => (last = s) });
    d.start();
    await tick();
    expect(last).toMatchObject({ state: 'idle', error: 'denied' });
  });
  it('hold pauses while the app reads aloud, release listens again', async () => {
    const { Rec, made } = fakeSpeech([]);
    const d = createDictation({ Speech: Rec, now: () => 0 });
    d.start();
    expect(made.length).toBe(1);
    d.hold();
    await tick();
    expect(made.length).toBe(1);
    expect(d.state).toBe('listening');
    d.release();
    expect(made.length).toBe(2);
    d.cancel();
  });
  it('Whisper: records, then writes the text after stop', async () => {
    const audio = new Float32Array(16);
    const media = { stop: vi.fn(async () => audio), cancel: vi.fn() };
    const transcribe = vi.fn(async (a, o) => (o.onprogress(50), 'Kette quietscht'));
    const words = [];
    const states = [];
    const d = createDictation({ engine: 'whisper', lang: 'de-CH', record: async () => media, transcribe, onwords: (w) => words.push(w), onstate: (s) => states.push(s.state) });
    d.start();
    await tick();
    d.stop();
    await tick();
    await tick();
    expect(transcribe).toHaveBeenCalledWith(audio, expect.objectContaining({ lang: 'de-CH' }));
    expect(words).toEqual(['Kette quietscht']);
    expect(states).toEqual(['listening', 'working', 'loading', 'working', 'idle']);
  });
});

describe('Whisper on this device', () => {
  it('loads the model once, from the CDN, and answers German', async () => {
    const run = vi.fn(async () => ({ text: ' Sattel knarzt ' }));
    const pipeline = vi.fn(async (task, model, o) => (o.progress_callback({ status: 'progress', file: 'a', loaded: 5, total: 10 }), run));
    const load = vi.fn(async () => ({ pipeline }));
    const seen = [];
    expect(await transcribe(new Float32Array(4), { load, onprogress: (p) => seen.push(p) })).toBe('Sattel knarzt');
    expect(await transcribe(new Float32Array(4), { load })).toBe('Sattel knarzt');
    expect(load).toHaveBeenCalledTimes(1);
    expect(pipeline.mock.calls[0][0]).toBe('automatic-speech-recognition');
    expect(seen).toEqual([50]);
    expect(run.mock.calls[0][1]).toMatchObject({ language: 'german', task: 'transcribe' });
    expect(whisperLang('en-GB')).toBe('english');
  });
  it('is never in the app files: only a dynamic import of a pinned CDN address', () => {
    const w = src('src/lib/whisper.js');
    expect(w).toMatch(/cdn\.jsdelivr\.net\/npm\/@huggingface\/transformers@\d+\.\d+\.\d+\//);
    expect(src('src/lib/ui/SpeakButton.svelte')).toMatch(/import\('\.\.\/whisper\.js'\)/);
    expect(src('package.json')).not.toMatch(/@huggingface\/transformers/);
  });
  it('reading aloud says when it cannot', () => {
    const done = vi.fn();
    expect(readAloud('Hallo', { w: {}, onend: done })).toBe(false);
    expect(done).toHaveBeenCalled();
  });
});

describe('«Weiter fragen bei …»', () => {
  it('fills the question into every service', () => {
    for (const s of SERVICES) {
      const u = s.url('Welche Jacke bei 5 °C?');
      expect(u, s.key).toMatch(/^https:\/\//);
      expect(decodeURIComponent(u), s.key).toContain('Welche Jacke bei 5 °C?');
    }
    expect(SERVICES.find((s) => s.key === 'claude').url('x')).toBe('https://claude.ai/new?q=x');
    expect(SERVICES.find((s) => s.key === 'google').url('x')).toContain('udm=50');
  });
  it('shows all, or the chosen ones', () => {
    expect(shownServices(null)).toEqual(SERVICES.map((s) => s.key));
    expect(shownServices('claude,nope,chatgpt')).toEqual(['claude', 'chatgpt']);
    expect(shownServices('')).toEqual([]);
  });
  it('sends only the gear and learnings that fit', () => {
    const items = [{ id: 'a', name: 'Regenjacke Demo', weightG: 310 }, { id: 'b', name: 'Stirnlampe' }, { id: 'c', name: 'Regenhose', gone: true }];
    const learnings = [{ rule: 'Bei Regen die Handschuhe doppelt', action: 'zweites Paar' }, { rule: 'Früh starten' }];
    const ctx = contextFor('Was nehme ich bei Regen mit?', { items, learnings });
    expect(ctx).toContain('- Regenjacke Demo, 310 g');
    expect(ctx).toContain('- Bei Regen die Handschuhe doppelt → zweites Paar');
    expect(ctx).not.toContain('Stirnlampe');
    expect(ctx).not.toContain('Regenhose');
    expect(ctx).not.toContain('Früh starten');
    expect(contextFor('Was ist das?', { items, learnings })).toBe('');
    expect(askText('Frage?', '')).toBe('Frage?');
    expect(askText('Frage?', 'X')).toBe('Frage?\n\nX');
  });
  it('«Mit Claude besprechen»: the question, and the page only when given', () => {
    expect(claudeUrl('Was fehlt?')).toBe('https://claude.ai/new?q=Was%20fehlt%3F');
    expect(decodeURIComponent(claudeUrl('Was fehlt?', ['Zelt', '', 'Matte']))).toContain('Was fehlt?\n\n- Zelt\n- Matte');
    expect(claudeUrl('Q', Array(500).fill('Ein langer Eintrag aus der Liste')).length).toBeLessThan(12000);
  });
  it('sits on Packliste, Velo-Pflege and Rückblick', () => {
    expect(src('src/pages/Pack.svelte')).toContain('<AskClaude name="pack"');
    expect(src('src/lib/care/BikeCare.svelte')).toContain('<AskClaude name="care"');
    expect(src('src/pages/Debrief.svelte')).toContain('<AskClaude name="debrief"');
  });
});

describe('Gemini in the app (server)', () => {
  const TOKEN = 'test-code-not-real-0000';
  const REDIS = 'https://redis.example.test';
  const env = (over = {}) => () => ({ apiKey: '', token: TOKEN, model: 'claude-sonnet-5-5', cap: 2, redisUrl: REDIS, redisToken: 'r', geminiKey: 'g-test-not-real', geminiModel: 'gemini-flash-latest', geminiDaily: 2, ...over });
  const req = (body) => new Request('https://packgen-three.vercel.app/api/helper', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173', authorization: `Bearer ${TOKEN}` }, body: JSON.stringify(body) });
  function world(answer = { candidates: [{ content: { parts: [{ text: 'Nimm die Regenjacke.' }] } }] }, status = 200) {
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
      return Response.json(answer, { status });
    });
    return { store, calls, doFetch };
  }
  const now = () => new Date('2026-10-19T10:00:00Z');
  it('answers through Gemini with the key in a header, never in the body or address', async () => {
    const w = world();
    const r = await makeHandler({ env: env(), doFetch: w.doFetch, now })(req({ task: 'gemini', input: { question: 'Welche Jacke bei 5 °C?', context: '- Regenjacke Demo', lang: 'de' } }));
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ ok: true, task: 'gemini', result: { text: 'Nimm die Regenjacke.' } });
    expect(w.calls[0].url).toBe(GEMINI_URL('gemini-flash-latest'));
    expect(w.calls[0].init.headers['x-goog-api-key']).toBe('g-test-not-real');
    expect(w.calls[0].init.body).not.toContain('g-test-not-real');
    expect(JSON.parse(w.calls[0].init.body).contents[0].parts[0].text).toBe('Welche Jacke bei 5 °C?\n\n- Regenjacke Demo');
    expect(w.store[geminiKey('2026-10-19')]).toBe('1');
  });
  it('stops at the daily limit, says so without a key, needs the code', async () => {
    const w = world();
    const h = makeHandler({ env: env(), doFetch: w.doFetch, now });
    await h(req({ task: 'gemini', input: { question: 'Frage eins?' } }));
    await h(req({ task: 'gemini', input: { question: 'Frage zwei?' } }));
    const r = await h(req({ task: 'gemini', input: { question: 'Frage drei?' } }));
    expect(r.status).toBe(429);
    expect((await r.json()).code).toBe('daily_limit');
    const off = await makeHandler({ env: env({ geminiKey: '' }), doFetch: w.doFetch, now })(req({ task: 'gemini', input: { question: 'Frage?' } }));
    expect(off.status).toBe(503);
    const bad = new Request('https://packgen-three.vercel.app/api/helper', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' }, body: JSON.stringify({ task: 'gemini', input: { question: 'Frage?' } }) });
    expect((await makeHandler({ env: env(), doFetch: w.doFetch, now })(bad)).status).toBe(401);
    expect((await h(req({ task: 'gemini', input: { question: 'x' } }))).status).toBe(400);
  });
  it('«Gemini ausgelastet» (22.10.2026): a second try, then Ersatzmodelle; each failure gets its own code', async () => {
    const answer = { candidates: [{ content: { parts: [{ text: 'Ersatz antwortet.' }] } }] };
    const scripted = (byModel) => {
      const store = {};
      const calls = [];
      const doFetch = vi.fn(async (url, init) => {
        if (url === REDIS) {
          const [cmd, k, v] = JSON.parse(init.body);
          if (cmd === 'GET') return Response.json({ result: store[k] ?? null });
          if (cmd === 'INCRBYFLOAT') return Response.json({ result: String((store[k] = String(Number(store[k] ?? 0) + Number(v)))) });
          return Response.json({ result: 1 });
        }
        calls.push(url);
        const model = Object.keys(byModel).find((m) => url === GEMINI_URL(m));
        const [status, body] = byModel[model] ?? [404, { error: { status: 'NOT_FOUND' } }];
        return Response.json(body, { status });
      });
      return { store, calls, h: makeHandler({ env: env({ geminiDaily: 50 }), doFetch, now, wait: async () => {} }) };
    };
    const busy = [503, { error: { status: 'UNAVAILABLE', message: 'The model is overloaded.' } }];
    const ask = (w) => w.h(req({ task: 'gemini', input: { question: 'Welche Jacke?' } }));
    // the first model is full twice, the first fallback answers
    const a = scripted({ 'gemini-flash-latest': busy, 'gemini-flash-lite-latest': [200, answer] });
    const ra = await ask(a);
    expect(ra.status).toBe(200);
    expect((await ra.json()).result.text).toBe('Ersatz antwortet.');
    expect(a.calls).toEqual([GEMINI_URL('gemini-flash-latest'), GEMINI_URL('gemini-flash-latest'), GEMINI_URL('gemini-flash-lite-latest')]);
    expect(a.store[geminiKey('2026-10-19')]).toBe('3');
    // all full: «busy», honestly
    const b = scripted({ 'gemini-flash-latest': busy, 'gemini-flash-lite-latest': busy, 'gemini-2.5-flash': busy });
    const rb = await ask(b);
    expect([rb.status, (await rb.json()).code]).toEqual([503, 'busy']);
    // Google's own free limit is not «enough for today»
    const lim = [429, { error: { status: 'RESOURCE_EXHAUSTED' } }];
    const rc = await ask(scripted({ 'gemini-flash-latest': lim, 'gemini-flash-lite-latest': lim, 'gemini-2.5-flash': lim }));
    expect([rc.status, (await rc.json()).code]).toEqual([429, 'google_limit']);
    // a wrong or expired key stops at once
    const k = scripted({ 'gemini-flash-latest': [400, { error: { status: 'INVALID_ARGUMENT', message: 'API key expired. Please renew the API key.' } }] });
    const rk = await ask(k);
    expect([rk.status, (await rk.json()).code]).toEqual([503, 'bad_key']);
    expect(k.calls).toHaveLength(1);
    // no model left
    const rn = await ask(scripted({}));
    expect([rn.status, (await rn.json()).code]).toEqual([502, 'no_model']);
  });
  it('the app names each Gemini failure in its own words', async () => {
    const code = { code: 'x' };
    const reply = (status, body) => async () => Response.json(body, { status });
    await db.settings.put({ key: HELPER_KEY, value: { code: 'demo-code' } });
    expect((await askGemini('Frage?', { fetchFn: reply(503, { code: 'busy' }) })).error).toBe('busy');
    expect((await askGemini('Frage?', { fetchFn: reply(503, { code: 'bad_key' }) })).error).toBe('key');
    expect((await askGemini('Frage?', { fetchFn: reply(503, { code: 'not_set_up' }) })).error).toBe('server');
    expect((await askGemini('Frage?', { fetchFn: reply(429, { code: 'google_limit' }) })).error).toBe('google_limit');
    expect((await askGemini('Frage?', { fetchFn: reply(429, { code: 'daily_limit' }) })).error).toBe('limit');
    expect((await askGemini('Frage?', { fetchFn: reply(502, { code: 'no_model' }) })).error).toBe('model');
    expect((await askGemini('Frage?', { fetchFn: reply(502, code) })).error).toBe('error');
    for (const e of ['key', 'google_limit', 'model', 'busy']) expect(geminiError(e)).not.toBe(geminiError('error'));
  });
  it('reads the request, the answer and the environment', () => {
    expect(geminiRequest({ question: 'Q', lang: 'en' }).systemInstruction.parts[0].text).toMatch(/English/);
    expect(geminiText({ candidates: [{ content: { parts: [{ text: 'a\n\n\n\nb' }, { text: ' c' }] } }] })).toBe('a\n\nb c');
    expect(geminiText(null)).toBe('');
    expect(helperEnv({ GEMINI_API_KEY: 'k' })).toMatchObject({ geminiKey: 'k', geminiModel: 'gemini-flash-latest', geminiDaily: 200 });
    expect(helperEnv({ GEMINI_DAILY: '50', GEMINI_MODEL: 'gemini-x' })).toMatchObject({ geminiDaily: 50, geminiModel: 'gemini-x', geminiFallbacks: ['gemini-flash-lite-latest', 'gemini-2.5-flash'] });
    expect(helperEnv({ GEMINI_FALLBACKS: ' gemini-a , gemini-b ' }).geminiFallbacks).toEqual(['gemini-a', 'gemini-b']);
  });
  it('adds no new server function (12-Functions limit)', () => {
    expect(src('api/helper.js')).toContain("task === 'gemini'");
  });
});

describe('«Meine KI-Projekte»', () => {
  it('knows the service of an address', () => {
    expect(serviceOf('https://claude.ai/project/demo')).toBe('Claude');
    expect(serviceOf('https://chatgpt.com/c/demo')).toBe('ChatGPT');
    expect(serviceOf('https://www.example.org/x')).toBe('example.org');
    expect(serviceOf('nope')).toBe('');
  });
  it('makes a typed address whole, refuses what is none', () => {
    expect(cleanUrl('claude.ai/project/demo')).toBe('https://claude.ai/project/demo');
    expect(cleanUrl('  ')).toBe('');
    expect(cleanUrl('hallo')).toBe('');
  });
  it('adds, renames, moves', () => {
    let l = addProject([], { title: '', url: 'claude.ai/project/demo' }, { id: 'a', at: 'x' });
    expect(l).toEqual([{ id: 'a', title: 'Claude', url: 'https://claude.ai/project/demo', at: 'x' }]);
    l = addProject(l, { title: 'Demo Chat', url: 'https://chatgpt.com/c/1' }, { id: 'b', at: 'x' });
    expect(addProject(l, { title: 'x', url: 'kaputt' }, { id: 'c' })).toBe(l);
    l = editProject(l, 'a', { title: 'Pack Generator', url: 'kaputt' });
    expect(l[0]).toMatchObject({ title: 'Pack Generator', url: 'https://claude.ai/project/demo' });
    expect(editProject(l, 'a', { title: '  ' })[0].title).toBe('Pack Generator');
    expect(moveProject(l, 0, 1).map((p) => p.id)).toEqual(['b', 'a']);
    expect(moveProject(l, 5, 0)).toBe(l);
  });
  it('the page has its route, its row in Ich and in the menu, and loads later', () => {
    expect(src('src/lib/nav.js')).toContain("'#/me/ki-projekte')) return 'aiprojects'");
    expect(src('src/App.svelte')).toContain("AiProjects: () => import('./pages/AiProjects.svelte')");
    expect(src('src/pages/Me.svelte')).toContain('href="#/me/ki-projekte"');
    const page = src('src/pages/AiProjects.svelte');
    for (const s of ['askDelete', 'deleteWithUndo', 'SortGrip', 'SortArrows', 'use:sortable']) expect(page, s).toContain(s);
  });
});

describe('one microphone for the whole app', () => {
  it('Notes and the daily check use the shared SpeakButton, no own recognition', () => {
    for (const p of ['src/pages/Notes.svelte', 'src/pages/Check.svelte']) {
      const s = src(p);
      expect(s, p).toContain('<SpeakButton');
      expect(s, p).not.toMatch(/webkitSpeechRecognition/);
    }
  });
  it('also in gear notes, learnings, bike care, the look back, the ride and the ski day', () => {
    for (const p of ['src/lib/gear/ItemDialog.svelte', 'src/lib/review/LearningSheet.svelte', 'src/lib/care/CareSheet.svelte', 'src/pages/Debrief.svelte', 'src/pages/Ride.svelte', 'src/pages/ski/SkiAfter.svelte']) expect(src(p), p).toContain('<SpeakButton');
  });
});

describe('a capital at the start of a sentence', () => {
  it('after an empty field, a new line or . ! ?', () => {
    expect(appendSpoken('', 'kette')).toBe('Kette');
    expect(appendSpoken('Kette quietscht.', 'was ist fällig')).toBe('Kette quietscht. Was ist fällig');
    expect(appendSpoken('Liste\n', 'zelt')).toBe('Liste\nZelt');
    expect(appendSpoken('Notiz:', 'sattel')).toBe('Notiz: sattel');
  });
});
