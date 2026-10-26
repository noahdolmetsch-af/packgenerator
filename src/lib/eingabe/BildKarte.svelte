<script>
  /**
   * «Bildkarte» (Noah 26.10.2026 «1a»: no AI picture; your own photo and a sentence instead). A card of
   * 1080 × 1350 drawn on this device: the photo on top (choose which), the sentence below (changeable),
   * the day and place small. «Share» opens the phone's share menu with the picture, «Download» keeps it.
   * entry: { title, text, photos: [{ src }], day, place }; dayText: the day as shown; onclose().
   */
  import { X, Share2, Download } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t } from '../i18n.svelte.js';
  import { CARD, CARD_TEXT_MAX, cardSentence, wrapLines, coverCut, cardFile } from './bildkarte.js';

  let { entry, dayText = '', onclose } = $props();
  let dialog;
  let canvas = $state(null);
  // svelte-ignore state_referenced_locally
  let sentence = $state(cardSentence(entry));
  let pick = $state(0);
  // svelte-ignore state_referenced_locally
  const photos = (entry.photos ?? []).filter((p) => p?.src);
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });

  const loadImg = (src) =>
    new Promise((ok) => {
      const img = new Image();
      img.onload = () => ok(img);
      img.onerror = () => ok(null);
      img.src = src;
    });

  async function draw() {
    if (!canvas) return;
    const { w, h, pad, font } = CARD;
    const c = canvas.getContext('2d');
    if (!c) return;
    c.fillStyle = '#f7f5f0';
    c.fillRect(0, 0, w, h);
    const img = photos[pick] ? await loadImg(photos[pick].src) : null;
    const ph = img ? CARD.photoH : 360;
    if (img) {
      const k = coverCut(img.naturalWidth, img.naturalHeight, w, ph);
      c.drawImage(img, k.sx, k.sy, k.sw, k.sh, 0, 0, w, ph);
    } else {
      c.fillStyle = '#4a7360';
      c.fillRect(0, 0, w, ph);
    }
    c.fillStyle = '#1f2a24';
    const size = img ? 52 : 64;
    c.font = `600 ${size}px ${font}`;
    c.textBaseline = 'top';
    const lines = wrapLines(sentence, w - pad * 2, (s) => c.measureText(s).width, img ? 5 : 9);
    let y = ph + pad;
    for (const l of lines) {
      c.fillText(l, pad, y);
      y += size * 1.25;
    }
    c.font = `400 32px ${font}`;
    c.fillStyle = '#5b665f';
    const foot = [dayText, entry.place?.name].filter(Boolean).join(' · ');
    if (foot) c.fillText(foot, pad, h - pad - 32);
  }
  $effect(() => {
    void sentence;
    void pick;
    draw();
  });

  const blob = () => new Promise((ok) => canvas.toBlob((b) => ok(b), 'image/png'));
  async function share() {
    const b = await blob();
    const file = new File([b], cardFile(entry.day), { type: 'image/png' });
    try {
      if (navigator.canShare?.({ files: [file] })) return await navigator.share({ files: [file], title: sentence.slice(0, 60) });
      download(b);
    } catch (err) {
      if (err?.name !== 'AbortError') offerDone(t('Sharing did not work here. Use «Download» instead.'));
    }
  }
  async function download(b = null) {
    const url = URL.createObjectURL(b ?? (await blob()));
    const a = document.createElement('a');
    a.href = url;
    a.download = cardFile(entry.day);
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    offerDone(t('The picture card is in your downloads.'));
  }
</script>

<dialog class="sheet from-below bk" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="bk-h" data-bildkarte>
  <div class="bk-head">
    <div>
      <h2 id="bk-h">{t('Picture card')}</h2>
      <p class="bk-sub">{t('Your photo and a sentence as a picture to share. Made on this device, without AI.')}</p>
    </div>
    <button type="button" class="bk-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <canvas bind:this={canvas} width={CARD.w} height={CARD.h} class="bk-canvas" aria-label={t('Preview of the picture card')}></canvas>
  {#if photos.length > 1}
    <div class="bk-photos" role="group" aria-label={t('Which photo?')}>
      {#each photos as p, i (i)}<button type="button" class="bk-ph" aria-pressed={pick === i} aria-label={t('Photo {i}', { i: i + 1 })} onclick={() => (pick = i)}><img src={p.src} alt="" /></button>{/each}
    </div>
  {:else if !photos.length}
    <p class="bk-sub">{t('Without a photo the card is green. Add a photo to the entry for a picture.')}</p>
  {/if}
  <label class="bk-lab">{t('Sentence on the card')}<textarea class="inp" rows="3" maxlength={CARD_TEXT_MAX} bind:value={sentence} data-bildkarte-text></textarea></label>
  <div class="bk-row">
    <button type="button" class="btn hi" onclick={share} data-bildkarte-share><Share2 size={16} aria-hidden="true" />{t('Share')}</button>
    <button type="button" class="btn" onclick={() => download()} data-bildkarte-download><Download size={16} aria-hidden="true" />{t('Download it')}</button>
  </div>
</dialog>

<style>
  .bk {
    width: min(520px, 100%);
  }
  .bk-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  h2 {
    margin: 0;
  }
  .bk-sub {
    margin: 4px 0 8px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .bk-x {
    display: grid;
    place-items: center;
    flex: none;
    width: 40px;
    height: 40px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .bk-canvas {
    display: block;
    width: 100%;
    max-width: 320px;
    height: auto;
    margin: 0 auto 12px;
    border-radius: 12px;
    box-shadow: var(--shadow);
  }
  .bk-photos {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
  }
  .bk-ph {
    padding: 0;
    border: 2px solid transparent;
    border-radius: 8px;
    background: none;
    cursor: pointer;
  }
  .bk-ph[aria-pressed='true'] {
    border-color: var(--brand);
  }
  .bk-ph img {
    display: block;
    width: 56px;
    height: 56px;
    object-fit: cover;
    border-radius: 6px;
  }
  .bk-lab {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 12px;
    font-weight: 600;
  }
  .bk-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
