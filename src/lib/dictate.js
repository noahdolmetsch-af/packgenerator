/**
 * «Diktat» (Noah 19.10.2026 «1a 2a»): one dictation for the whole app, used by ui/SpeakButton.svelte.
 *
 * Browser engine: the browser's speech recognition in continuous mode. Chrome still ends it after a
 * longer pause or about a minute (Android); while you have not tapped stop it starts again quietly, so
 * only you decide how long it runs. Words show while you speak (interim results).
 * Whisper engine: the microphone records until you stop, then Whisper turns it into text on this
 * device (whisper.js, loaded on first use).
 *
 * createDictation({ engine, lang, Speech, record, transcribe, now, onwords, oninterim, onstate })
 * → { start(), stop(), hold(), release(), get state }
 *   onwords(text)        finished words (once per piece)
 *   oninterim(text)      the words still being heard ('' when none)
 *   onstate({ state, error, startedAt, progress })
 *     state: 'idle' | 'listening' | 'working' (Whisper writes) | 'loading' (Whisper model loads)
 *     error: '' | 'denied' | 'network' | 'nomic' | 'failed'
 */
import { split, fresh } from './speak.js';

const RESTARTS = 6; // starts in a row that end at once: then it really cannot listen
const QUICK = 1500; // ms: an end this soon after a start counts as «at once»
const LONGEST = 60 * 60 * 1000; // a safety stop after one hour, in case the stop button is forgotten

export function createDictation(o = {}) {
  const now = o.now ?? (() => Date.now());
  const emit = (p) => o.onstate?.({ state, error, startedAt, progress, ...p });
  let state = 'idle';
  let error = '';
  let startedAt = 0;
  let progress = 0;
  let want = false;
  let held = false;
  let rec = null;
  let lastFinal = '';
  let quick = 0;
  let begun = 0;
  let timer = null;
  let media = null;
  // Einzelidee 37 «Sprachfrage als Text weiterführen»: the words still being heard when the microphone fails
  let heard = '';

  const set = (s, e = error) => {
    state = s;
    error = e;
    emit();
  };

  function finish(e = '') {
    want = false;
    held = false;
    clearTimeout(timer);
    // the microphone stopped with an error: the begun sentence is not lost, it becomes text in the field
    if (e && heard.trim()) o.onwords?.(heard.trim());
    heard = '';
    o.oninterim?.('');
    set('idle', e);
  }

  /* ---------- browser speech recognition ---------- */
  function listen() {
    const S = o.Speech;
    try {
      rec = new S();
      rec.lang = o.lang ?? 'de-CH';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => {
        quick = 0;
        const { final, interim } = split(e);
        const add = fresh(lastFinal, final);
        if (final) lastFinal = final;
        if (add) o.onwords?.(add);
        heard = interim;
        o.oninterim?.(interim);
      };
      rec.onerror = (e) => {
        const c = e?.error ?? '';
        if (c === 'not-allowed' || c === 'service-not-allowed') return finish('denied');
        if (c === 'network') return finish('network');
        if (c === 'audio-capture') return finish('nomic');
        // 'no-speech' and 'aborted': the end that follows starts it again
      };
      rec.onend = () => {
        if (!want || held) heard = '';
        o.oninterim?.('');
        rec = null;
        if (!want || held) return;
        quick = now() - begun < QUICK ? quick + 1 : 0;
        if (quick >= RESTARTS) return finish('failed');
        listen();
      };
      lastFinal = '';
      begun = now();
      rec.start();
    } catch {
      finish('failed');
    }
  }

  /* ---------- Whisper on this device ---------- */
  async function recordThenWrite() {
    try {
      media = await o.record();
    } catch (e) {
      return finish(e?.name === 'NotAllowedError' ? 'denied' : 'nomic');
    }
    if (!want) {
      media.cancel?.();
      return finish();
    }
  }
  async function writeOut() {
    const m = media;
    media = null;
    if (!m) return finish();
    try {
      set('working', '');
      const audio = await m.stop();
      const text = await o.transcribe(audio, {
        lang: o.lang,
        onprogress: (p) => {
          progress = p;
          set('loading', '');
        },
      });
      if (state === 'loading') set('working', '');
      const said = String(text ?? '').trim();
      if (said) o.onwords?.(said);
      finish();
    } catch {
      finish('failed');
    }
  }

  return {
    get state() {
      return state;
    },
    start() {
      if (state !== 'idle') return;
      want = true;
      held = false;
      quick = 0;
      progress = 0;
      startedAt = now();
      set('listening', '');
      clearTimeout(timer);
      timer = setTimeout(() => this.stop(), LONGEST);
      if (o.engine === 'whisper') recordThenWrite();
      else listen();
    },
    stop() {
      if (state !== 'listening') return;
      want = false;
      clearTimeout(timer);
      if (o.engine === 'whisper') return writeOut();
      held = false;
      try {
        rec?.stop();
      } catch {
        /* already ended */
      }
      finish();
    },
    /** Pause listening (while the app reads an answer aloud); the clock goes on. Browser engine only. */
    hold() {
      if (state !== 'listening' || o.engine === 'whisper') return;
      held = true;
      try {
        rec?.abort();
      } catch {
        /* already ended */
      }
    },
    release() {
      if (!held) return;
      held = false;
      if (want && state === 'listening' && !rec) listen();
    },
    /** Stop at once without writing anything (the field closes). */
    cancel() {
      want = false;
      try {
        rec?.abort();
      } catch {
        /* already ended */
      }
      media?.cancel?.();
      media = null;
      finish();
    },
  };
}
