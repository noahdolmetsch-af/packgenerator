<script>
  /**
   * «Eingaben überall» (Noah 26.10.2026 «3 nur Ton»): record one voice note on this device, at most one
   * minute; it stops by itself. The microphone is asked for only on «Record». ondone({ src, s }) gets the
   * sound as a data URL and its seconds. Like the voice notes of Mit Freunden (freunde/VoiceNote.svelte).
   */
  import { onDestroy } from 'svelte';
  import { Mic, Square } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { VOICE_MAX_S } from './inputs.js';

  let { ondone, oncancel = () => {} } = $props();
  let rec = $state(null);
  let secs = $state(0);
  let problem = $state('');
  let timer = null;
  const canRecord = () => typeof window !== 'undefined' && typeof window.MediaRecorder === 'function' && !!navigator.mediaDevices?.getUserMedia;
  const can = canRecord();

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
        clearInterval(timer);
        const s = Math.max(1, secs);
        rec = null;
        const blob = new Blob(parts, { type: r.mimeType || 'audio/webm' });
        if (!blob.size) return (problem = t('Nothing was recorded. Try again.'));
        const fr = new FileReader();
        fr.onload = () => ondone?.({ src: String(fr.result), s });
        fr.readAsDataURL(blob);
      };
      secs = 0;
      r.start(1000);
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

<div class="vr" data-in-voice-rec>
  {#if !can}
    <p class="in-note">{t('This browser cannot record sound. Use the dictation instead.')}</p>
  {:else if rec}
    <button type="button" class="btn sm vr-stop" onclick={stop} data-in-voice-stop><span class="vr-dot" aria-hidden="true"></span><Square size={16} aria-hidden="true" />{t('Stop')} · <span class="num">{secs} / {VOICE_MAX_S} s</span></button>
  {:else}
    <button type="button" class="btn sm hi" onclick={start} data-in-voice-start><Mic size={16} aria-hidden="true" />{t('Record')}</button>
    <button type="button" class="btn sm" onclick={oncancel}>{t('Cancel')}</button>
  {/if}
  {#if problem}<p class="in-note" role="alert">{problem}</p>{/if}
</div>

<style>
  .vr {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .vr-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--bad);
  }
  .in-note {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
