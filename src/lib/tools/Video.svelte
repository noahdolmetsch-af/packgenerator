<script>
  /**
   * Paket L «Werkzeugkasten» (Video verkleinern, Noah 19.10.2026): a video for WhatsApp or e-mail made
   * smaller on the device. The video plays once silently; the page shows how far it is.
   */
  import { Film } from '@lucide/svelte';
  import { VIDEO_SIZES, recType, shrinkVideo } from './video.js';
  import { sizeText } from './pdftools.js';
  import { outName } from './phototools.js';
  import { deliver } from './tools.js';
  import { t } from '../i18n.svelte.js';
  import './tools.css';

  const can = typeof window !== 'undefined' && !!recType() && !!HTMLCanvasElement.prototype.captureStream;
  let input = $state();
  let size = $state('480');
  let file = $state(null);
  let busy = $state(false);
  let share = $state(0);
  let result = $state(null);
  let fail = $state(false);

  async function pick(e) {
    const el = e.currentTarget;
    file = el.files?.[0] ?? null;
    el.value = '';
    result = null;
    fail = false;
    if (!file) return;
    busy = true;
    share = 0;
    try {
      const blob = await shrinkVideo(file, VIDEO_SIZES.find((x) => x.key === size), { onprogress: (p) => (share = p) });
      result = { blob, name: outName(file.name, 'klein', blob.type.includes('mp4') ? 'mp4' : 'webm') };
    } catch (err) {
      console.error(err);
      fail = true;
    }
    busy = false;
  }
</script>

<section class="tool-card video">
  {#if can}
    <div class="tool-row" role="radiogroup" aria-label={t('Size|video')}>
      {#each VIDEO_SIZES as x (x.key)}
        <label class="tool-chip"><input type="radio" name="vd-size" value={x.key} bind:group={size} disabled={busy} /> {t(x.label)} · {x.key}p</label>
      {/each}
    </div>
    <input bind:this={input} type="file" accept="video/*" hidden onchange={pick} />
    <div><button type="button" class="btn hi" disabled={busy} onclick={() => input.click()}><Film size={16} aria-hidden="true" />{t('Choose video')}</button></div>
    {#if busy}
      <progress max="1" value={share}></progress>
      <p class="tool-status" aria-live="polite">{t('Making it smaller: {pct} %. Keep this page open; it takes as long as the video.', { pct: Math.round(share * 100) })}</p>
    {:else if result}
      <p class="tool-big">{sizeText(file.size)} → {sizeText(result.blob.size)}</p>
      <div><button type="button" class="btn hi" onclick={() => deliver(result.blob, result.name)}>{t('Save or share')}</button></div>
    {:else if fail}
      <p class="tool-status err">{t('This video could not be made smaller here. Try a shorter one, or another browser.')}</p>
    {/if}
  {:else}
    <p class="tool-status">{t('This browser cannot record video. Chrome on the phone or computer can.')}</p>
  {/if}
  <p class="tool-help">{t('The video stays on the device. Phones often film very big; «Small» is enough for messages.')}</p>
</section>

<style>
  progress {
    width: 100%;
  }
</style>
