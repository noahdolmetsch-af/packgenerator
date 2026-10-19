<script>
  /**
   * Paket T «Freie Zeit»: record what a favourite place sounds like (Noah 19.10.2026 «4b wenn nicht zu
   * gross»). The browser's own MediaRecorder, no library; stops by itself after 30 s. value: the recording
   * { src, sec, day } or null (bindable). Removing it here takes effect only with «Save».
   */
  import { Mic, Square, X } from '@lucide/svelte';
  import { SOUND_MAX_SEC, SOUND_BITS, soundType, soundOf } from './sound.js';
  import { localDay } from '../localday.js';
  import { t } from '../i18n.svelte.js';

  let { value = $bindable(null) } = $props();
  let rec = $state(null);
  let secs = $state(0);
  let err = $state('');
  let stream = null;
  let timer = null;

  const toUrl = (blob) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  function quit() {
    clearInterval(timer);
    stream?.getTracks().forEach((x) => x.stop());
    stream = null;
  }
  async function start() {
    err = '';
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      err = t('This browser cannot record sound.');
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      err = t('No access to the microphone. Allow it in the browser, then try again.');
      return;
    }
    const type = soundType((x) => MediaRecorder.isTypeSupported?.(x));
    const r = new MediaRecorder(stream, { ...(type ? { mimeType: type } : {}), audioBitsPerSecond: SOUND_BITS });
    const chunks = [];
    const began = Date.now();
    r.ondataavailable = (e) => e.data?.size && chunks.push(e.data);
    r.onstop = async () => {
      quit();
      const sec = Math.min(Math.round((Date.now() - began) / 1000), SOUND_MAX_SEC);
      try {
        const src = await toUrl(new Blob(chunks, { type: r.mimeType || type || 'audio/webm' }));
        value = soundOf({ src, sec, day: localDay() });
        if (!value) err = t('The recording did not work. Try again.');
      } catch {
        err = t('The recording did not work. Try again.');
      }
      rec = null;
    };
    r.start();
    rec = r;
    secs = 0;
    timer = setInterval(() => {
      secs = Math.floor((Date.now() - began) / 1000);
      if (secs >= SOUND_MAX_SEC && r.state === 'recording') r.stop();
    }, 250);
  }
  const stop = () => rec?.state === 'recording' && rec.stop();
  $effect(() => () => {
    if (rec?.state === 'recording') rec.stop();
    quit();
  });
</script>

<div class="fzs" data-sound-rec>
  {#if rec}
    <button type="button" class="btn hi sm" onclick={stop} data-sound-stop><Square size={16} aria-hidden="true" />{t('Stop ({n} of {max} s)', { n: secs, max: SOUND_MAX_SEC })}</button>
    <span class="fz-note" role="status">{t('Recording …')}</span>
  {:else if value}
    <audio controls preload="none" src={value.src}></audio>
    <span class="fz-acts">
      <button type="button" class="btn sm" onclick={start}><Mic size={16} aria-hidden="true" />{t('Record again')}</button>
      <button type="button" class="btn sm" onclick={() => (value = null)} data-sound-remove><X size={16} aria-hidden="true" />{t('Remove the recording')}</button>
    </span>
  {:else}
    <button type="button" class="btn sm" onclick={start} data-sound-start><Mic size={16} aria-hidden="true" />{t('Record up to {max} s', { max: SOUND_MAX_SEC })}</button>
  {/if}
  {#if err}<p class="fz-note" role="alert">{err}</p>{/if}
</div>

<style>
  .fzs {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  .fzs audio {
    width: 100%;
    max-width: 360px;
  }
</style>
