<script>
  /**
   * Paket C › Klangbriefe (UC-231-I3, Noah «4b»: up to 1 minute): record a short thought, keep it, listen
   * to it later. The microphone is only asked for when you tap «Record»; nothing leaves the device except
   * through your own backup and sync. Rename and delete (with Undo) like everything else.
   */
  import { liveQuery } from 'dexie';
  import { onDestroy } from 'svelte';
  import { Mic, Square, Pencil, Trash2 } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { uid, dmy } from './base.js';
  import { SOUND_PREFIX, SOUND_MAX_S, AFTER, soundsOf, mmss } from './klang.js';

  const q = liveQuery(() => db.settings.where('key').startsWith(SOUND_PREFIX).toArray());
  const sounds = $derived(soundsOf($q ?? []));
  const can = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

  let rec = null;
  let stream = null;
  let secs = $state(0);
  let busy = $state(false);
  let error = $state('');
  let after = $state('');
  let timer = null;
  const toUrl = (blob) =>
    new Promise((ok, fail) => {
      const r = new FileReader();
      r.onload = () => ok(String(r.result));
      r.onerror = () => fail(r.error);
      r.readAsDataURL(blob);
    });
  async function start() {
    error = '';
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      error = t('The microphone is not allowed. Allow it in the browser and try again.');
      return;
    }
    const mime = MediaRecorder.isTypeSupported?.('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : '';
    rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 24_000 });
    const chunks = [];
    const began = Date.now();
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = async () => {
      clearInterval(timer);
      stream?.getTracks().forEach((x) => x.stop());
      const s = Math.min(SOUND_MAX_S, (Date.now() - began) / 1000);
      busy = false;
      if (!chunks.length || s < 1) return;
      const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
      const id = uid('klang');
      await db.settings.put({ key: SOUND_PREFIX + id, value: { id, day: localDay(), secs: Math.round(s), mime: blob.type, data: await toUrl(blob), title: '', after: after ? t(after) : '' } });
      secs = 0;
    };
    rec.start(1000);
    busy = true;
    secs = 0;
    timer = setInterval(() => {
      secs = Math.min(SOUND_MAX_S, (Date.now() - began) / 1000);
      if (secs >= SOUND_MAX_S) stop();
    }, 250);
  }
  function stop() {
    if (rec?.state === 'recording') rec.stop();
  }
  onDestroy(stop);

  let editing = $state('');
  let et = $state('');
  async function rename(s) {
    await db.settings.update(SOUND_PREFIX + s.id, { value: { ...s, title: et.trim() } });
    editing = '';
  }
  async function remove(s) {
    const name = s.title || dmy(s.day);
    const ok = await askDelete({ title: t('Delete «{name}»?', { name }), text: t('The recording goes from this device and from your next backups.') });
    if (ok !== 'delete') return;
    await deleteWithUndo({ run: async () => (await db.settings.delete(SOUND_PREFIX + s.id), s), undo: (x) => db.settings.put({ key: SOUND_PREFIX + x.id, value: x }), text: t('«{name}» deleted.', { name }), name });
  }
</script>

<p class="rh-help">{t('Speak a thought of up to 1 minute. It stays private; there are no numbers and no stars here.')}</p>
{#if can}
  <div class="rh-chips">{#each AFTER as a (a)}<button type="button" class="rh-chip" aria-pressed={after === a} onclick={() => (after = after === a ? '' : a)}>{t(a)}</button>{/each}</div>
  <div class="rh-row">
    {#if busy}
      <button type="button" class="btn hi" onclick={stop} data-sound-stop><Square size={16} aria-hidden="true" />{t('Stop')}</button>
      <span class="num" aria-live="polite">{mmss(secs)} / {mmss(SOUND_MAX_S)}</span>
    {:else}
      <button type="button" class="btn hi" onclick={start} data-sound-rec><Mic size={16} aria-hidden="true" />{t('Record')}</button>
    {/if}
  </div>
{:else}<p class="rh-note">{t('This browser cannot record sound. On the phone in Chrome it works.')}</p>{/if}
{#if error}<p class="rh-note" role="alert">{error}</p>{/if}
{#if sounds.length}
  <ul class="rh-list" data-sounds>
    {#each sounds as s (s.id)}
      <li class="rh-snd">
        <span class="rh-grow">
          {#if editing === s.id}
            <form class="rh-row" onsubmit={(e) => (e.preventDefault(), rename(s))}><input class="inp" bind:value={et} aria-label={t('Name')} /><button class="btn sm" type="submit">{t('Save')}</button></form>
          {:else}<b>{s.title || dmy(s.day)}</b>{/if}
          <small>{[dmy(s.day), mmss(s.secs), s.after].filter(Boolean).join(' · ')}</small>
          <audio controls preload="none" src={s.data}></audio>
        </span>
        <button type="button" class="rh-x" aria-label={t('Rename')} onclick={() => ((editing = s.id), (et = s.title))}><Pencil size={16} /></button>
        <button type="button" class="rh-x" aria-label={t('Delete')} onclick={() => remove(s)}><Trash2 size={16} /></button>
      </li>
    {/each}
  </ul>
{:else}<p class="rh-empty">{t('No voice letter yet.')}</p>{/if}

<style>
  .rh-snd .rh-grow {
    display: grid;
    gap: 4px;
  }
  audio {
    width: 100%;
    max-width: 360px;
    height: 36px;
  }
</style>
