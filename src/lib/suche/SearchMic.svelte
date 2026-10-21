<script>
  /*
   * The microphone in the top search (Noah 21.10.2026 «1a»: always there, where the browser can listen
   * or Whisper on this device is chosen; Ich › Suche can hide it). One tap listens to one sentence: with
   * the browser it stops by itself after a short pause, with Whisper you tap stop. onsaid(text) gets the
   * words for the search field. Reuses the app's dictation (dictate.js) and its speech model setting.
   */
  import { Mic, Square } from '@lucide/svelte';
  import { t, lang } from '../i18n.svelte.js';
  import { dict } from '../dictation.svelte.js';
  import { speechApi, speechLang } from '../speak.js';
  import { createDictation } from '../dictate.js';
  import { suche } from './suche.svelte.js';
  import { searchText } from './logic.js';

  let { onsaid = () => {}, oninterim = () => {}, onerror = () => {} } = $props();
  const Speech = speechApi();
  const canRecord = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
  const engine = $derived(dict.engine === 'whisper' && canRecord ? 'whisper' : 'browser');
  const shown = $derived(suche.mic && (engine === 'whisper' || !!Speech));
  const PAUSE = 1300; // ms of quiet after the last words: the sentence is done (browser engine)

  let st = $state('idle');
  let ctl = null;
  let words = [];
  let quiet = null;
  const ERR = {
    denied: 'The microphone is not allowed. Allow it in the browser (the lock left of the address).',
    network: 'Speaking needs internet. Without it choose «On this device (Whisper)» in Me › Search.',
    nomic: 'No microphone found.',
    failed: 'Listening did not work. Type instead.',
  };

  function soon() {
    clearTimeout(quiet);
    if (engine === 'browser' && words.length) quiet = setTimeout(() => ctl?.stop(), PAUSE);
  }
  function toggle() {
    if (st === 'listening') return ctl?.stop();
    if (st !== 'idle') return;
    words = [];
    onerror('');
    ctl = createDictation({
      engine,
      lang: speechLang(lang.v),
      Speech,
      record: async () => (await import('../whisper.js')).recordMic(),
      transcribe: async (audio, o) => (await import('../whisper.js')).transcribe(audio, o),
      onwords: (w) => {
        words.push(w);
        oninterim(searchText(words.join(' ')));
        soon();
      },
      oninterim: (s) => {
        if (s) oninterim(searchText([...words, s].join(' '))), clearTimeout(quiet);
        else soon();
      },
      onstate: (s) => {
        const was = st;
        st = s.state;
        if (s.error) onerror(t(ERR[s.error] ?? ERR.failed));
        if (s.state === 'idle' && was !== 'idle') {
          clearTimeout(quiet);
          const said = searchText(words.join(' '));
          if (said) onsaid(said);
        }
      },
    });
    ctl.start();
  }
  $effect(() => () => {
    clearTimeout(quiet);
    ctl?.cancel();
  });
  const label = $derived(st === 'listening' ? t('Stop listening') : st === 'idle' ? t('Speak into the search') : t('Writing it out on this device …'));
</script>

{#if shown}
  <button type="button" class="mic" class:on={st === 'listening'} aria-pressed={st === 'listening'} aria-label={label} title={label} disabled={st === 'working' || st === 'loading'} onclick={toggle} data-search-mic={st}>
    {#if st === 'listening'}<Square size={16} aria-hidden="true" />{:else}<Mic size={18} aria-hidden="true" />{/if}
  </button>
{/if}

<style>
  .mic {
    flex: none;
    display: inline-grid;
    place-items: center;
    width: 32px;
    height: 32px;
    margin-right: -6px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--ink-2);
    cursor: pointer;
  }
  .mic:hover {
    background: var(--paper-2);
  }
  .mic.on {
    background: var(--hi);
    color: var(--hi-ink);
  }
  .mic:disabled {
    opacity: 0.6;
  }
</style>
