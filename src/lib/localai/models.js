/**
 * «KI im Gerät» (Noah 20.10.2026 «1a 2a 3 beide optionen 5a und b»): a small language model that runs
 * inside the app, on the computer AND on the phone, without internet once it is loaded. Free, and no
 * question or entry leaves the device. Only the pure parts live here (which models, which way to run,
 * the prompt, the speed); engine.js loads and runs the model.
 *
 * The models come once from Hugging Face (free, public); the browser keeps them in its own storage on
 * this device (Cache Storage «transformers-cache»), never in a backup or in sync.
 */

/**
 * The models to choose from when loading (Noah «3 beide optionen beim download verfügbar», «a weitere
 * modelle»): small and fast, or a bit cleverer, from three makers. `q4only`: the model has no q4f16 file
 * worth using, so it always loads q4.
 */
export const LOCAL_MODELS = [
  {
    key: 'qwen05',
    id: 'onnx-community/Qwen2.5-0.5B-Instruct',
    name: 'Qwen 0.5B',
    kind: 'small',
    size: 'about 0.5–0.8 GB',
    text: 'Small and fast, from Alibaba. Quick answers, also on the phone; short and simple.',
  },
  {
    key: 'gemma1',
    id: 'onnx-community/gemma-3-1b-it-ONNX',
    name: 'Gemma 1B',
    kind: 'clever',
    size: 'about 1 GB',
    text: 'A bit cleverer, from Google. Good German; on the phone it needs a little patience.',
    q4only: true,
  },
  {
    key: 'llama1',
    id: 'onnx-community/Llama-3.2-1B-Instruct',
    name: 'Llama 1B',
    kind: 'clever',
    size: 'about 1–1.2 GB',
    text: 'A bit cleverer, from Meta. Strong in English, German is fine.',
  },
  {
    key: 'qwen15',
    id: 'onnx-community/Qwen2.5-1.5B-Instruct',
    name: 'Qwen 1.5B',
    kind: 'clever',
    size: 'about 1.1–1.6 GB',
    text: 'The cleverest of these, from Alibaba. Slow on the phone; best on the computer.',
  },
];

export const LOCAL_KEY = 'localai.'; // localStorage: localai.model, localai.speed
export const DEFAULT_MODEL = 'qwen05';
export const modelOf = (key) => LOCAL_MODELS.find((m) => m.key === key) ?? LOCAL_MODELS[0];

/**
 * How to run: the graphics chip (WebGPU) is much faster; without it the processor (WebAssembly) works
 * everywhere, slower. q4f16 needs the chip's «shader-f16», else q4.
 */
export function runMode({ gpu = false, f16 = false } = {}, model = {}) {
  if (gpu) return { device: 'webgpu', dtype: f16 && !model.q4only ? 'q4f16' : 'q4' };
  return { device: 'wasm', dtype: 'q4' };
}

/** Is the browser able at all? (WebAssembly and Cache Storage; both are in every current browser.) */
export const canRunLocal = (g = globalThis) => typeof g?.WebAssembly === 'object' && !!g?.caches;

/** Tokens a second → a word for the person. */
export function speedWord(tps) {
  if (!(tps > 0)) return '';
  if (tps >= 8) return 'fast';
  if (tps >= 3) return 'usable';
  return 'slow';
}

const SYS_DE =
  'Du hilfst bei Velotouren, beim Packen und im Alltag. Antworte kurz auf Deutsch (Schweizer Schreibweise, ss statt ß), höchstens 5 Sätze. Nutze die Einträge aus der App, die mitkommen; erfinde nichts dazu. Wenn du etwas nicht weisst, sag es.';
const SYS_EN =
  'You help with bike tours, packing and everyday life. Answer briefly in English, at most 5 sentences. Use the entries from the app that come along; do not make things up. If you do not know, say so.';

export const MAX_INPUT = 2400; // characters; small models lose the thread with more

/** The chat for the model: a short rule, then the question with the page's lines (cut to MAX_INPUT). */
export function chatFor(question, lines = [], { de = true } = {}) {
  const q = String(question ?? '').trim();
  const body = lines
    .map((l) => String(l ?? '').trim())
    .filter(Boolean)
    .join('\n');
  let user = body ? `${q}\n\n${de ? 'Aus der App' : 'From the app'}:\n${body}` : q;
  if (user.length > MAX_INPUT) user = `${user.slice(0, MAX_INPUT - 1)}…`;
  return [
    { role: 'system', content: de ? SYS_DE : SYS_EN },
    { role: 'user', content: user },
  ];
}

/** The question the speed check asks (short answer, so the check takes seconds, not minutes). */
export const SPEED_QUESTION = { de: 'Nenne drei Dinge für eine Velotour bei Regen.', en: 'Name three things for a bike tour in the rain.' };

/** The part of a cache address that belongs to this model (to find and delete only its files). */
export const belongsTo = (url, id) => String(url).includes(`/${id}/`);

/** Small models sometimes «think aloud» in <think>…</think>; only the answer counts. */
export const cleanAnswer = (text) =>
  String(text ?? '')
    .replace(/<think>[\s\S]*?(<\/think>|$)/g, '')
    .trim();
