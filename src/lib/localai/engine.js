/**
 * «KI im Gerät»: loads and runs the chosen model with Transformers.js (the same library and CDN address
 * as «Diktat im Gerät», whisper.js). The library comes from jsdelivr, the model from Hugging Face, both
 * only on the first «Load»; the browser keeps them on this device, so later it works without internet.
 * Nothing is in the app bundle. Questions and answers never leave the device.
 */
import { TRANSFORMERS_URL } from '../whisper.js';
import { modelOf, runMode, cleanAnswer, belongsTo } from './models.js';

export const CACHE_NAME = 'transformers-cache'; // Transformers.js keeps the downloaded files here

const loaded = {}; // model key → Promise<{ gen, T, mode }> (the library import itself is kept by the browser)

/** The graphics chip, if the browser offers it (WebGPU), and whether it can do half numbers (f16). */
export async function gpuInfo(nav = globalThis.navigator) {
  try {
    const a = await nav?.gpu?.requestAdapter?.();
    if (!a) return { gpu: false, f16: false };
    return { gpu: true, f16: !!a.features?.has?.('shader-f16') };
  } catch {
    return { gpu: false, f16: false };
  }
}

/** Is this model already on the device? (Its .onnx file is in the cache.) */
export async function isDownloaded(key, c = globalThis.caches) {
  try {
    const cache = await c.open(CACHE_NAME);
    const keys = await cache.keys();
    const id = modelOf(key).id;
    return keys.some((r) => belongsTo(r.url, id) && /\.onnx(_data)?$/.test(r.url));
  } catch {
    return false;
  }
}

/** How much this model takes on the device, in bytes (0 if unknown). */
export async function storedBytes(key, c = globalThis.caches) {
  try {
    const cache = await c.open(CACHE_NAME);
    const id = modelOf(key).id;
    let sum = 0;
    for (const r of await cache.keys()) {
      if (!belongsTo(r.url, id)) continue;
      const len = Number((await cache.match(r))?.headers?.get('content-length'));
      if (len > 0) sum += len;
    }
    return sum;
  } catch {
    return 0;
  }
}

/** Delete only this model's files (other models and the dictation model stay). */
export async function removeModel(key, c = globalThis.caches) {
  delete loaded[key];
  const cache = await c.open(CACHE_NAME);
  const id = modelOf(key).id;
  for (const r of await cache.keys()) if (belongsTo(r.url, id)) await cache.delete(r);
}

/** Load the model (downloads it the first time). onprogress(0…100). */
export function loadModel(key, { onprogress = () => {}, load = () => import(/* @vite-ignore */ TRANSFORMERS_URL), gpu = gpuInfo } = {}) {
  if (!loaded[key]) {
    loaded[key] = (async () => {
      const T = await load();
      const m = modelOf(key);
      const mode = runMode(await gpu(), m);
      if (mode.device === 'wasm' && T.env?.backends?.onnx?.wasm) T.env.backends.onnx.wasm.proxy = true; // keep the page usable
      const seen = {};
      const gen = await T.pipeline('text-generation', m.id, {
        ...mode,
        progress_callback: (p) => {
          if (p?.status !== 'progress' || !p.file) return;
          seen[p.file] = [p.loaded ?? 0, p.total ?? 0];
          const [l, t] = Object.values(seen).reduce((a, [x, y]) => [a[0] + x, a[1] + y], [0, 0]);
          if (t) onprogress(Math.min(99, Math.round((l / t) * 100)));
        },
      });
      return { gen, T, mode };
    })().catch((e) => {
      delete loaded[key];
      throw e;
    });
  }
  return loaded[key];
}

/**
 * Ask. `messages` from chatFor(). onText(textSoFar) while it writes. Gives { text, tps, seconds, device }.
 */
export async function askModel(key, messages, { onText = () => {}, onprogress, max = 220, now = () => performance.now() } = {}) {
  const { gen, T, mode } = await loadModel(key, { onprogress });
  let out = '';
  let tokens = 0;
  let first = 0;
  const start = now();
  const streamer = new T.TextStreamer(gen.tokenizer, {
    skip_prompt: true,
    skip_special_tokens: true,
    callback_function: (piece) => {
      if (!first) first = now();
      tokens += 1;
      out += piece;
      onText(cleanAnswer(out));
    },
  });
  const res = await gen(messages, { max_new_tokens: max, do_sample: false, streamer });
  const last = res?.[0]?.generated_text;
  const text = cleanAnswer(Array.isArray(last) ? last.at(-1)?.content : out);
  const end = now();
  const secs = Math.max(0.001, (end - (first || start)) / 1000);
  return { text, tps: tokens > 1 ? Math.round((tokens / secs) * 10) / 10 : 0, seconds: Math.round((end - start) / 100) / 10, device: mode.device };
}
