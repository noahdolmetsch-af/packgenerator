<script>
  /**
   * Paket N N5 (Noah 19.10.2026 «4a»): draw with the finger, the mouse or a pen. «Use» gives the drawing
   * as a picture (PNG, white background, max 1000 px wide); the note keeps it like a photo.
   * onsave(dataUrl), oncancel().
   */
  import { t } from '../i18n.svelte.js';
  import { Eraser, Check, Undo2 } from '@lucide/svelte';

  let { onsave, oncancel } = $props();
  let canvas;
  let strokes = $state([]);
  let cur = null;
  const W = 1000;
  const H = 700;

  function pos(e) {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  }
  function draw() {
    const g = canvas.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, W, H);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.lineWidth = 6;
    g.strokeStyle = '#1d2a24';
    for (const s of [...strokes, ...(cur ? [cur] : [])]) {
      g.beginPath();
      s.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      if (s.length === 1) g.lineTo(s[0][0] + 0.1, s[0][1]);
      g.stroke();
    }
  }
  $effect(() => {
    strokes;
    if (canvas) draw();
  });
  function down(e) {
    canvas.setPointerCapture?.(e.pointerId);
    cur = [pos(e)];
    draw();
  }
  function move(e) {
    if (!cur) return;
    cur.push(pos(e));
    draw();
  }
  function up() {
    if (cur) strokes = [...strokes, cur];
    cur = null;
  }
  function use() {
    if (!strokes.length) return oncancel?.();
    onsave?.(canvas.toDataURL('image/png'));
  }
</script>

<div class="sketch" data-sketch>
  <canvas bind:this={canvas} width={W} height={H} aria-label={t('Drawing area')} onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} onpointerleave={up}></canvas>
  <div class="row">
    <button type="button" class="btn" disabled={!strokes.length} onclick={() => (strokes = strokes.slice(0, -1))}><Undo2 size={16} aria-hidden="true" />{t('Undo|sketch')}</button>
    <button type="button" class="btn" disabled={!strokes.length} onclick={() => (strokes = [])}><Eraser size={16} aria-hidden="true" />{t('Clear')}</button>
    <button type="button" class="btn" onclick={() => oncancel?.()}>{t('Cancel')}</button>
    <button type="button" class="btn hi" onclick={use}><Check size={16} aria-hidden="true" />{t('Use the sketch')}</button>
  </div>
</div>

<style>
  .sketch {
    display: grid;
    gap: 8px;
    margin: 0 0 12px;
  }
  canvas {
    width: 100%;
    aspect-ratio: 10 / 7;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    touch-action: none;
    cursor: crosshair;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
</style>
