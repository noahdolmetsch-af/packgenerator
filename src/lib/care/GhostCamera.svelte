<script>
  /**
   * Velo-Idee 75 «Verschleiss-Foto gleich aufnehmen» (Noah 26.10.2026 «3a»): the camera in the app with
   * the last photo of the part half see-through on top. Move the bike until the outlines lie on each other,
   * then take the photo; the slider makes the old photo lighter or stronger, «Vorlage aus» hides it.
   * Without a camera (a computer, no permission) «Choose file» works as before. Nothing is recorded or
   * sent; the photo goes to the caller (WearPhotos stores it on this device).
   * ghost: { data, date, km } the last photo; onphoto(file); onclose().
   */
  import { tick } from 'svelte';
  import { X, Camera } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { backCamera, stopStream, cameraError } from '../tools/camera.js';
  import { t, num, dateOf } from '../i18n.svelte.js';

  let { title, ghost = null, onphoto, onclose } = $props();
  let dialog;
  let video = $state();
  let stream = null;
  let status = $state('starting'); // starting | live | none | denied
  let fade = $state(40);
  let show = $state(true);
  let busy = $state(false);

  $effect(() => {
    dialog.showModal();
    start();
    return () => stopStream(stream);
  });
  async function start() {
    try {
      stream = await backCamera({ width: 1600 });
      status = 'live';
      await tick();
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => {});
      }
    } catch (err) {
      status = cameraError(err);
    }
  }
  function close() {
    stopStream(stream);
    stream = null;
    dialog.close();
  }
  async function shoot() {
    if (!video?.videoWidth || busy) return;
    busy = true;
    const c = document.createElement('canvas');
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    c.getContext('2d').drawImage(video, 0, 0);
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.9));
    busy = false;
    if (!blob) return;
    await onphoto?.(new File([blob], 'wear.jpg', { type: 'image/jpeg' }));
    close();
  }
  async function pickFile(e) {
    const f = e.currentTarget.files?.[0];
    if (!f) return;
    await onphoto?.(f);
    close();
  }
</script>

<dialog use:backClose class="sheet ghostcam" bind:this={dialog} {onclose} aria-labelledby="gc-h" data-ghost-camera={status}>
  <div class="head">
    <h2 id="gc-h">{title}</h2>
    <button type="button" class="x" aria-label={t('Close')} onclick={close}><X size={20} aria-hidden="true" /></button>
  </div>
  <p class="lead">{t('The last photo lies half see-through over the camera. Move the bike until the outlines lie on each other, then take the photo.')}</p>
  <div class="cam">
    {#if status === 'live'}
      <!-- svelte-ignore a11y_media_has_caption -->
      <video bind:this={video} playsinline muted autoplay></video>
    {:else}
      <p class="none" role="status">{status === 'starting' ? t('The camera starts …') : status === 'denied' ? t('The camera is not allowed. Allow it in the browser, or choose a file.') : t('No camera here. Choose a file instead.')}</p>
    {/if}
    {#if ghost && show}<img class="ghost" src={ghost.data} alt="" style:opacity={fade / 100} data-ghost-img />{/if}
    {#if ghost}<span class="gpill tl">{t('Template: {date}', { date: dateOf(ghost.date) })}{typeof ghost.km === 'number' ? ` · ${num(ghost.km)} km` : ''}</span>{/if}
  </div>
  {#if ghost}
    <label class="fade"><span>{t('Old photo')}</span><input type="range" min="10" max="90" bind:value={fade} disabled={!show} aria-label={t('How strong the old photo shows')} data-ghost-fade /><span class="num">{fade} %</span></label>
  {/if}
  <div class="bar">
    {#if ghost}<button type="button" class="btn sm" aria-pressed={!show} onclick={() => (show = !show)} data-ghost-toggle>{show ? t('Template off') : t('Template on')}</button>{/if}
    <button type="button" class="shut" disabled={status !== 'live' || busy} onclick={shoot} aria-label={t('Take photo')} data-ghost-shoot><Camera size={26} aria-hidden="true" /></button>
    <label class="btn sm">{t('Choose file')}<input type="file" accept="image/*" onchange={pickFile} hidden data-ghost-file /></label>
  </div>
  <p class="hint">{t('Same side, same light, e.g. the right side with the crank level. The photos stay on this device.')}</p>
</dialog>

<style>
  dialog.ghostcam {
    width: min(720px, calc(100vw - 16px));
    padding: 16px;
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }
  h2 {
    margin: 2px 0 0;
    font-size: var(--fs-section);
  }
  .x {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -6px -6px 0 0;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .lead,
  .hint {
    margin: 4px 0 10px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .cam {
    position: relative;
    aspect-ratio: 3 / 4;
    max-height: 62vh;
    width: 100%;
    border-radius: 14px;
    overflow: hidden;
    background: var(--ink);
  }
  @media (min-width: 700px) {
    .cam {
      aspect-ratio: 4 / 3;
    }
  }
  .cam video,
  .ghost {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .ghost {
    pointer-events: none;
  }
  .none {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    margin: 0;
    padding: 24px;
    text-align: center;
    color: var(--paper);
  }
  .gpill {
    position: absolute;
    padding: 4px 10px;
    border-radius: 99px;
    background: var(--ink);
    color: var(--paper);
    font-size: var(--fs-small);
  }
  .tl {
    top: 10px;
    left: 10px;
  }
  .fade {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 10px 0 0;
  }
  .fade input {
    flex: 1;
    min-height: 44px;
  }
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin: 8px 0 0;
  }
  .shut {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    border: 4px solid var(--accent);
    background: var(--accent-soft);
    color: var(--accent);
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .shut:disabled {
    opacity: 0.45;
    cursor: default;
  }
</style>
