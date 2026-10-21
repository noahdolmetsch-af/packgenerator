<script>
  /**
   * Paket Wetter «Webcams auf der Live-Karte»: a tap on a webcam point on the live map shows the cam: its
   * live picture (an image address, fetched anew every 5 minutes) or a button to open the page. Your
   * webcams live only on this device (Ich › Wetter › Meine Webcams). Live.svelte mounts it with one line.
   */
  import { X, ExternalLink } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { isImage, freshSrc, camLabel } from '../wetter/webcams.js';
  import { t } from '../i18n.svelte.js';

  let { cam, onclose } = $props();
  let dialog;
  let now = $state(Date.now());
  $effect(() => {
    dialog.showModal();
    const id = setInterval(() => (now = Date.now()), 60_000);
    return () => clearInterval(id);
  });
  const close = () => dialog?.close();
</script>

<dialog class="sheet from-below lwc" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="lwc-h" data-live-webcam>
  <div class="head">
    <div>
      <p class="kick">{t('Webcam')}</p>
      <h2 id="lwc-h">{camLabel(cam)}</h2>
    </div>
    <button type="button" class="ib" onclick={close} aria-label={t('Close')}><X size={20} aria-hidden="true" /></button>
  </div>
  {#if isImage(cam.url)}
    <img class="lwc-img" src={freshSrc(cam.url, now)} alt={t('Webcam {name}', { name: camLabel(cam) })} referrerpolicy="no-referrer" />
    <p class="rc-note">{t('The picture is fetched anew every 5 minutes.')}</p>
  {:else}
    <p class="rc-note">{t('This webcam is a web page: it opens in the browser.')}</p>
  {/if}
  <div class="rc-acts">
    <a class="btn" href={cam.url} target="_blank" rel="noopener noreferrer" data-live-webcam-open>{t('Open webcam')}<ExternalLink size={16} aria-hidden="true" /></a>
  </div>
</dialog>

<style>
  .lwc {
    width: min(480px, calc(100vw - 24px));
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 10px;
  }
  .kick {
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  h2 {
    margin: 2px 0 0;
    font-size: var(--fs-section);
    overflow-wrap: break-word;
  }
  .ib {
    flex: none;
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
  .lwc-img {
    width: 100%;
    max-height: 50vh;
    object-fit: contain;
    border-radius: 8px;
    background: var(--paper-2);
  }
</style>
