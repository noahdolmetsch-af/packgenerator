<script>
  /**
   * Paket D «Mit Freunden» (Noah 24.10.2026 «4b»: voice notes up to one minute): record a short voice
   * note on this device. It stops by itself after 60 seconds. The note stays in the answer only.
   * onchange({ voice, voiceS }): voice is a data URL or '' (removed).
   */
  import { onDestroy } from 'svelte';
  import { t } from '../i18n.svelte.js';
  import { VOICE_MAX_S } from './freunde.js';
  import { Mic, Square, Trash2 } from '@lucide/svelte';

  let { voice = '', voiceS = 0, onchange } = $props();
  let rec = $state(null);
  let secs = $state(0);
  let problem = $state('');
  let timer = null;
  const can = typeof window !== 'undefined' && typeof window.MediaRecorder === 'function' && !!navigator.mediaDevices?.getUserMedia;

  async function start() {
    problem = '';
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find((x) => MediaRecorder.isTypeSupported?.(x)) ?? '';
      const r = new MediaRecorder(stream, { ...(type ? { mimeType: type } : {}), audioBitsPerSecond: 24000 });
      const parts = [];
      r.ondataavailable = (e) => e.data.size && parts.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((x) => x.stop());
        const blob = new Blob(parts, { type: r.mimeType || 'audio/webm' });
        const fr = new FileReader();
        const s = secs;
        fr.onload = () => onchange?.({ voice: String(fr.result), voiceS: s });
        fr.readAsDataURL(blob);
        rec = null;
        clearInterval(timer);
      };
      secs = 0;
      r.start();
      rec = r;
      timer = setInterval(() => {
        secs += 1;
        if (secs >= VOICE_MAX_S) stop();
      }, 1000);
    } catch {
      problem = t('The microphone could not start. Allow it in the browser, or write instead.');
    }
  }
  function stop() {
    if (rec?.state === 'recording') rec.stop();
  }
  onDestroy(() => {
    clearInterval(timer);
    stop();
  });
</script>

{#if can}
  <div class="fr-voice" data-fr-voice>
    {#if rec}
      <button type="button" class="btn" onclick={stop}><Square size={16} aria-hidden="true" />{t('Stop')} · {secs} / {VOICE_MAX_S} s</button>
    {:else if voice}
      <audio controls src={voice}></audio>
      <span class="fr-fine">{t('{n} s', { n: voiceS })}</span>
      <button type="button" class="btn btn-link" onclick={() => onchange?.({ voice: '', voiceS: 0 })} aria-label={t('Remove the voice note')}><Trash2 size={16} aria-hidden="true" /></button>
    {:else}
      <button type="button" class="btn" onclick={start}><Mic size={16} aria-hidden="true" />{t('Voice note (up to 1 minute)')}</button>
    {/if}
    {#if problem}<p class="fr-fine" role="alert">{problem}</p>{/if}
  </div>
{/if}
