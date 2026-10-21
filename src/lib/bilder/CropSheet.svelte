<script>
  /**
   * «Bilder in der App» 4a (Noah 20.10.2026): cut the edges of a photo. The same frame as in
   * Werkzeugkasten › Fotos: drag the frame or its corners; the part outside goes away.
   * src: the photo (data URL); onsave(newSrc); onclose.
   */
  import { X } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { dragCrop } from '../tools/phototools.js';
  import { cropSrc } from './bilder.js';
  import { t } from '../i18n.svelte.js';
  import '../ui/daumen.css'; // FE1: the buttons stay at the bottom edge on a phone

  let { src, onsave, onclose } = $props();
  let dialog;
  let frame = $state();
  let size = $state(null); // { w, h } of the photo
  let crop = $state(null);
  let busy = $state(false);
  let err = $state('');

  $effect(() => {
    dialog.showModal();
  });
  function loaded(e) {
    const img = e.currentTarget;
    size = { w: img.naturalWidth, h: img.naturalHeight };
    const m = Math.round(Math.min(size.w, size.h) * 0.04);
    crop = { x: m, y: m, w: size.w - 2 * m, h: size.h - 2 * m };
  }
  const pct = (v, all) => `${(v / all) * 100}%`;

  let drag = null;
  function down(e, handle) {
    e.stopPropagation();
    drag = { handle, x: e.clientX, y: e.clientY, start: { ...crop }, k: size.w / frame.clientWidth };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function move(e) {
    if (!drag) return;
    crop = dragCrop(drag.start, drag.handle, (e.clientX - drag.x) * drag.k, (e.clientY - drag.y) * drag.k, size.w, size.h);
  }
  const up = () => (drag = null);

  async function save() {
    if (!crop || busy) return;
    busy = true;
    err = '';
    try {
      onsave?.(await cropSrc(src, crop));
      dialog.close();
    } catch {
      err = t('This photo could not be read.');
    } finally {
      busy = false;
    }
  }
</script>

<dialog class="sheet from-below crop" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="crop-h">
  <div class="head">
    <h2 id="crop-h">{t('Cut the edges')}</h2>
    <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <div class="stage">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="frame" bind:this={frame} onpointermove={move} onpointerup={up} onpointercancel={up}>
      <img {src} alt={t('Your photo')} draggable="false" onload={loaded} />
      {#if crop && size}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="box" data-crop-box style:left={pct(crop.x, size.w)} style:top={pct(crop.y, size.h)} style:width={pct(crop.w, size.w)} style:height={pct(crop.h, size.h)} onpointerdown={(e) => down(e, 'move')}>
          {#each ['nw', 'ne', 'sw', 'se'] as h (h)}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <span class="hd {h}" onpointerdown={(e) => down(e, h)}></span>
          {/each}
        </div>
      {/if}
    </div>
  </div>
  <p class="hint">{t('Drag the frame or its corners to cut. The part outside goes away.')}</p>
  {#if err}<p class="err" role="alert">{err}</p>{/if}
  <div class="foot daumen-foot">
    <button type="button" class="btn hi" disabled={!crop || busy} onclick={save} data-crop-save>{busy ? t('Reading…') : t('Cut|photo')}</button>
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
  </div>
</dialog>

<style>
  .crop {
    width: min(560px, calc(100vw - 24px));
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 10px;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .ib {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .stage {
    display: grid;
    justify-items: center;
    padding: 8px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .frame {
    position: relative;
    max-width: 100%;
    overflow: hidden;
    touch-action: none;
    user-select: none;
  }
  .frame img {
    display: block;
    max-width: 100%;
    max-height: 55vh;
  }
  .box {
    position: absolute;
    box-shadow: 0 0 0 9999px var(--scrim);
    outline: 2px solid var(--paper);
    cursor: move;
  }
  .hd {
    position: absolute;
    width: 28px;
    height: 28px;
    margin: -14px;
    border-radius: 50%;
    background: var(--paper);
    border: 2px solid var(--ink);
  }
  .hd.nw {
    left: 0;
    top: 0;
    cursor: nwse-resize;
  }
  .hd.ne {
    right: 0;
    top: 0;
    cursor: nesw-resize;
  }
  .hd.sw {
    left: 0;
    bottom: 0;
    cursor: nesw-resize;
  }
  .hd.se {
    right: 0;
    bottom: 0;
    cursor: nwse-resize;
  }
  .hint {
    margin: 8px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .err {
    color: var(--bad);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }
</style>
