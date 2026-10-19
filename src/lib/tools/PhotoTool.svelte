<script>
  /**
   * Paket L «Werkzeugkasten» (#310 Fotos verkleinern, zuschneiden, freistellen): choose a photo, then
   * the size, an optional cut (drag the frame or its corners; a shape keeps the ratio) and «Cut out»
   * (the background becomes see-through; Noah 19.10.2026 «4a»: the model is loaded once, then offline).
   * The result is saved or shared from the device.
   */
  import { ImagePlus, Share2, Scissors, Wand2, RotateCcw } from '@lucide/svelte';
  import Seg from '../ui/Seg.svelte';
  import { SIZES, SHAPES, fitSize, centerCrop, dragCrop, outName, loadImage, render, cutout, cutoutReady } from './phototools.js';
  import { sizeText } from './pdftools.js';
  import { deliver } from './tools.js';
  import { t } from '../i18n.svelte.js';
  import './tools.css';

  let input;
  let file = $state(null); // the chosen File
  let img = $state(null); // its picture
  let url = $state('');
  let size = $state(1280);
  let shape = $state('free');
  let crop = $state(null);
  let cutting = $state(false);
  let cut = $state(null); // { blob, url } after «Cut out»
  let progress = $state(0);
  let modelHere = $state(false);
  let error = $state('');
  let result = $state(null); // { blob, name }
  let frame = $state(); // the shown picture (for the drag)
  cutoutReady().then((v) => (modelHere = v));

  async function choose(e) {
    const f = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!f) return;
    error = '';
    try {
      const pic = await loadImage(f);
      reset();
      file = f;
      img = pic;
      url = URL.createObjectURL(f);
      crop = { x: 0, y: 0, w: pic.width, h: pic.height };
    } catch {
      error = t('This photo cannot be opened. Try a JPG or PNG.');
    }
  }
  function reset() {
    if (url) URL.revokeObjectURL(url);
    if (cut?.url) URL.revokeObjectURL(cut.url);
    cut = null;
    result = null;
    shape = 'free';
  }
  function setShape(k) {
    shape = k;
    crop = centerCrop(img.width, img.height, SHAPES.find((s) => s.key === k).ratio);
    result = null;
  }

  // drag the frame or a corner; pointer moves are in screen pixels, the crop in photo pixels
  let drag = null;
  function down(e, handle) {
    e.preventDefault();
    e.stopPropagation();
    drag = { handle, x: e.clientX, y: e.clientY, start: { ...crop }, k: img.width / frame.clientWidth };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function moveDrag(e) {
    if (!drag) return;
    const ratio = SHAPES.find((s) => s.key === shape).ratio;
    crop = dragCrop(drag.start, drag.handle, (e.clientX - drag.x) * drag.k, (e.clientY - drag.y) * drag.k, img.width, img.height, ratio);
    result = null;
  }
  const up = () => (drag = null);
  const pct = (v, all) => `${(v / all) * 100}%`;

  async function doCut() {
    cutting = true;
    error = '';
    progress = 0;
    try {
      const blob = await cutout(file, { onprogress: (p) => (progress = p) });
      cut = { blob, url: URL.createObjectURL(blob) };
      modelHere = true;
      result = null;
    } catch (err) {
      console.error(err);
      error = navigator.onLine === false && !modelHere ? t('The first time «Cut out» needs the internet to load the model (about 45 MB).') : t('Cutting out did not work on this device.');
    } finally {
      cutting = false;
    }
  }

  async function make() {
    error = '';
    try {
      const src = cut ? await loadImage(cut.blob) : img;
      const s = fitSize(crop.w, crop.h, size);
      const type = cut ? 'image/png' : 'image/jpeg';
      const blob = await render(src, crop, s.w, s.h, { type });
      result = { blob, name: outName(file.name, cut ? t('cut out|file') : t('small|file'), cut ? 'png' : 'jpg'), w: s.w, h: s.h };
    } catch (err) {
      console.error(err);
      error = t('This did not work.');
    }
  }
</script>

<section class="tool-card photo">
  <input bind:this={input} type="file" accept="image/*" hidden onchange={choose} />
  <div class="tool-row">
    <button type="button" class="btn" class:hi={!img} onclick={() => input.click()}><ImagePlus size={16} aria-hidden="true" />{img ? t('Other photo') : t('Choose photo')}</button>
    {#if img}<span class="tool-muted">{file.name} · {img.width} × {img.height} · {sizeText(file.size)}</span>{/if}
  </div>
  {#if error}<p class="tool-status err" role="alert">{error}</p>{/if}

  {#if img}
    <div class="ph-stage" class:checker={!!cut}>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="ph-frame" bind:this={frame} onpointermove={moveDrag} onpointerup={up} onpointercancel={up}>
        <img src={cut?.url ?? url} alt={t('Your photo')} draggable="false" />
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="ph-crop" style:left={pct(crop.x, img.width)} style:top={pct(crop.y, img.height)} style:width={pct(crop.w, img.width)} style:height={pct(crop.h, img.height)} onpointerdown={(e) => down(e, 'move')}>
          {#each ['nw', 'ne', 'sw', 'se'] as h (h)}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <span class="ph-h {h}" onpointerdown={(e) => down(e, h)}></span>
          {/each}
        </div>
      </div>
    </div>
    <p class="tool-help">{t('Drag the frame or its corners to cut. The part outside goes away.')}</p>
    <div class="tool-field">
      <span>{t('Shape')}</span>
      <Seg small label={t('Shape')} value={shape} options={SHAPES.map((s) => ({ key: s.key, name: t(s.label) }))} onchange={setShape} />
    </div>
    <div class="tool-field">
      <span>{t('Size')}</span>
      <Seg small label={t('Size')} value={size} options={SIZES.map((s) => ({ key: s.px, name: s.px ? `${t(s.label)} · ${s.px} px` : t(s.label) }))} onchange={(v) => ((size = v), (result = null))} />
    </div>
    <div class="tool-row">
      {#if cut}
        <button type="button" class="btn" onclick={() => ((cut = null), (result = null))}><RotateCcw size={16} aria-hidden="true" />{t('Keep background')}</button>
      {:else}
        <button type="button" class="btn" disabled={cutting} onclick={doCut}><Wand2 size={16} aria-hidden="true" />{cutting ? (progress > 0 && progress < 1 ? t('Loading model {n} %', { n: Math.round(progress * 100) }) : t('Cutting out …')) : t('Cut out')}</button>
      {/if}
      <button type="button" class="btn hi" onclick={make}><Scissors size={16} aria-hidden="true" />{t('Make photo')}</button>
    </div>
    {#if !modelHere && !cut}<p class="tool-muted">{t('«Cut out» loads a model once (about 45 MB, best on Wi-Fi); then it works offline. The photo stays on this device.')}</p>{/if}
    {#if result}
      <div class="tool-row" data-result>
        <span class="tool-status"><b>{result.name}</b> · {result.w} × {result.h} · {sizeText(result.blob.size)}</span>
        <button type="button" class="btn hi" onclick={() => deliver(result.blob, result.name)}><Share2 size={16} aria-hidden="true" />{t('Save or share')}</button>
      </div>
    {/if}
  {/if}
</section>

<style>
  .ph-stage {
    display: grid;
    justify-items: center;
    padding: var(--sp-2);
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .ph-stage.checker {
    background: repeating-conic-gradient(var(--line) 0 25%, var(--paper) 0 50%) 0 0 / 16px 16px;
  }
  .ph-frame {
    position: relative;
    max-width: 100%;
    touch-action: none;
    user-select: none;
  }
  .ph-frame img {
    display: block;
    max-width: 100%;
    max-height: 60vh;
  }
  .ph-crop {
    position: absolute;
    box-shadow: 0 0 0 9999px var(--scrim);
    outline: 2px solid var(--paper);
    cursor: move;
  }
  .ph-frame {
    overflow: hidden;
  }
  .ph-h {
    position: absolute;
    width: 28px;
    height: 28px;
    margin: -14px;
    border-radius: 50%;
    background: var(--paper);
    border: 2px solid var(--ink);
  }
  .ph-h.nw {
    left: 0;
    top: 0;
    cursor: nwse-resize;
  }
  .ph-h.ne {
    right: 0;
    top: 0;
    cursor: nesw-resize;
  }
  .ph-h.sw {
    left: 0;
    bottom: 0;
    cursor: nesw-resize;
  }
  .ph-h.se {
    right: 0;
    bottom: 0;
    cursor: nwse-resize;
  }
</style>
