/**
 * «Diktat im Gerät» (Noah 19.10.2026 «2a»): Whisper turns a recording into text ON THIS DEVICE, free.
 * Nothing is in the app's own files: the first time, Transformers.js (about 1 MB) comes from the
 * jsdelivr CDN and the Whisper model (about 80 MB) from Hugging Face; the browser keeps both, so later
 * it works offline. The sound never leaves the device.
 */
export const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';
export const WHISPER_MODEL = 'onnx-community/whisper-base';
export const RATE = 16000; // Whisper listens at 16 kHz

/** The Whisper language name for the app language. */
export const whisperLang = (lang = 'de-CH') => (String(lang).startsWith('de') ? 'german' : 'english');

/** Record from the microphone until stop(); stop() gives the sound as 16 kHz mono samples. */
export async function recordMic(nav = navigator) {
  const stream = await nav.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
  const rec = new MediaRecorder(stream);
  const parts = [];
  rec.ondataavailable = (e) => e.data?.size && parts.push(e.data);
  rec.start(1000);
  const close = () => stream.getTracks().forEach((t) => t.stop());
  return {
    cancel() {
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
      close();
    },
    stop: () =>
      new Promise((res, rej) => {
        rec.onstop = async () => {
          close();
          try {
            const buf = await new Blob(parts, { type: rec.mimeType }).arrayBuffer();
            const ctx = new AudioContext({ sampleRate: RATE });
            const audio = await ctx.decodeAudioData(buf);
            ctx.close?.();
            res(audio.getChannelData(0));
          } catch (e) {
            rej(e);
          }
        };
        rec.stop();
      }),
  };
}

let model = null;
/** Turn 16 kHz samples into text. onprogress(0…100) while the model loads the first time. */
export async function transcribe(audio, { lang = 'de-CH', onprogress = () => {}, load = () => import(/* @vite-ignore */ TRANSFORMERS_URL) } = {}) {
  if (!model) {
    model = (async () => {
      const T = await load();
      const seen = {};
      return T.pipeline('automatic-speech-recognition', WHISPER_MODEL, {
        progress_callback: (p) => {
          if (p?.status !== 'progress' || !p.file) return;
          seen[p.file] = [p.loaded ?? 0, p.total ?? 0];
          const [l, t] = Object.values(seen).reduce((a, [x, y]) => [a[0] + x, a[1] + y], [0, 0]);
          if (t) onprogress(Math.min(99, Math.round((l / t) * 100)));
        },
      });
    })().catch((e) => {
      model = null;
      throw e;
    });
  }
  const run = await model;
  const out = await run(audio, { language: whisperLang(lang), task: 'transcribe', chunk_length_s: 30, stride_length_s: 5 });
  return String(out?.text ?? '').trim();
}
