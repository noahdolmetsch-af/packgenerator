// «KI im Gerät» (Noah 20.10.2026): the pure parts and the engine with a fake library and cache.
import { describe, it, expect } from 'vitest';
import { LOCAL_MODELS, modelOf, runMode, speedWord, chatFor, MAX_INPUT, cleanAnswer, belongsTo, canRunLocal } from '../src/lib/localai/models.js';
import { isDownloaded, removeModel, storedBytes, loadModel, askModel, CACHE_NAME } from '../src/lib/localai/engine.js';
import DE from '../src/lib/i18n/de/index.js';

function fakeCaches(urls) {
  const store = new Map(urls.map((u) => [u, 100]));
  const cache = {
    keys: async () => [...store.keys()].map((url) => ({ url })),
    match: async (r) => ({ headers: { get: () => String(store.get(r.url)) } }),
    delete: async (r) => store.delete(r.url),
  };
  return { store, c: { open: async (name) => (name === CACHE_NAME ? cache : null) } };
}
const HF = (id, f) => `https://huggingface.co/${id}/resolve/main/${f}`;

describe('the models', () => {
  it('has a small one first and cleverer ones, each with a German text', () => {
    expect(LOCAL_MODELS[0].kind).toBe('small');
    expect(LOCAL_MODELS.some((m) => m.kind === 'clever')).toBe(true);
    expect(new Set(LOCAL_MODELS.map((m) => m.key)).size).toBe(LOCAL_MODELS.length);
    for (const m of LOCAL_MODELS) {
      expect(m.id).toMatch(/^onnx-community\//);
      expect(DE[m.text], m.text).toBeTruthy();
      expect(DE[m.size], m.size).toBeTruthy();
    }
    expect(modelOf('nope')).toBe(LOCAL_MODELS[0]);
  });
  it('runs on the graphics chip when there is one, else on the processor', () => {
    expect(runMode({ gpu: true, f16: true })).toEqual({ device: 'webgpu', dtype: 'q4f16' });
    expect(runMode({ gpu: true, f16: false })).toEqual({ device: 'webgpu', dtype: 'q4' });
    expect(runMode({ gpu: true, f16: true }, { q4only: true })).toEqual({ device: 'webgpu', dtype: 'q4' });
    expect(runMode({ gpu: false })).toEqual({ device: 'wasm', dtype: 'q4' });
    expect(canRunLocal({ WebAssembly: {}, caches: {} })).toBe(true);
    expect(canRunLocal({})).toBe(false);
  });
  it('names the speed', () => {
    expect(speedWord(0)).toBe('');
    expect(speedWord(1)).toBe('slow');
    expect(speedWord(4)).toBe('usable');
    expect(speedWord(12)).toBe('fast');
  });
  it('builds a short chat with the lines, cut for small models', () => {
    const [sys, user] = chatFor('Was fehlt?', ['Zelt', '', 'Regenjacke']);
    expect(sys.role).toBe('system');
    expect(sys.content).toMatch(/Deutsch/);
    expect(user.content).toBe('Was fehlt?\n\nAus der App:\nZelt\nRegenjacke');
    expect(chatFor('What?', [], { de: false })[0].content).toMatch(/English/);
    expect(chatFor('x', ['y'.repeat(5000)])[1].content.length).toBe(MAX_INPUT);
  });
  it('leaves out «thinking aloud»', () => {
    expect(cleanAnswer('<think>hmm</think>\nRegenhose')).toBe('Regenhose');
    expect(cleanAnswer('<think>still')).toBe('');
    expect(belongsTo(HF('a/b', 'x.onnx'), 'a/b')).toBe(true);
    expect(belongsTo(HF('a/bc', 'x.onnx'), 'a/b')).toBe(false);
  });
});

describe('the engine', () => {
  it('knows whether a model is on the device and deletes only its files', async () => {
    const small = LOCAL_MODELS[0].id;
    const other = LOCAL_MODELS[1].id;
    const { store, c } = fakeCaches([HF(small, 'config.json'), HF(small, 'onnx/model_q4f16.onnx'), HF(other, 'onnx/model_q4.onnx'), HF('onnx-community/whisper-base', 'onnx/x.onnx')]);
    expect(await isDownloaded(LOCAL_MODELS[0].key, c)).toBe(true);
    expect(await isDownloaded(LOCAL_MODELS[2].key, c)).toBe(false);
    expect(await storedBytes(LOCAL_MODELS[0].key, c)).toBe(200);
    await removeModel(LOCAL_MODELS[0].key, c);
    expect(await isDownloaded(LOCAL_MODELS[0].key, c)).toBe(false);
    expect(store.size).toBe(2); // the other model and the dictation model stay
    expect(await isDownloaded('x', { open: async () => Promise.reject(new Error('no')) })).toBe(false);
  });
  it('loads with progress and answers with the streamed text and the speed', async () => {
    const calls = [];
    class TextStreamer {
      constructor(tok, o) {
        this.o = o;
      }
    }
    let streamer;
    const gen = async (messages, opts) => {
      streamer = opts.streamer;
      for (const p of ['Regen', 'hose']) streamer.o.callback_function(p);
      return [{ generated_text: [...messages, { role: 'assistant', content: 'Regenhose' }] }];
    };
    gen.tokenizer = {};
    const T = {
      env: { backends: { onnx: { wasm: {} } } },
      TextStreamer,
      pipeline: async (task, id, o) => {
        calls.push([task, id, o.device, o.dtype]);
        o.progress_callback({ status: 'progress', file: 'a', loaded: 50, total: 100 });
        return gen;
      },
    };
    const seen = [];
    const key = LOCAL_MODELS[3].key;
    await loadModel(key, { load: async () => T, gpu: async () => ({ gpu: false }), onprogress: (p) => seen.push(p) });
    expect(calls).toEqual([['text-generation', LOCAL_MODELS[3].id, 'wasm', 'q4']]);
    expect(T.env.backends.onnx.wasm.proxy).toBe(true);
    expect(seen).toEqual([50]);
    let t = 0;
    const parts = [];
    const r = await askModel(key, chatFor('Was fehlt?'), { onText: (s) => parts.push(s), now: () => (t += 500) });
    expect(parts).toEqual(['Regen', 'Regenhose']);
    expect(r.text).toBe('Regenhose');
    expect(r.device).toBe('wasm');
    expect(r.tps).toBeGreaterThan(0);
  });
  it('can try again after a failed download', async () => {
    const key = LOCAL_MODELS[2].key;
    await expect(loadModel(key, { load: async () => ({ pipeline: async () => Promise.reject(new Error('net')) }), gpu: async () => ({}) })).rejects.toThrow('net');
    let n = 0;
    const T = { pipeline: async () => (n++, Object.assign(async () => [], { tokenizer: {} })) };
    await loadModel(key, { load: async () => T, gpu: async () => ({}) });
    expect(n).toBe(1);
  });
});
