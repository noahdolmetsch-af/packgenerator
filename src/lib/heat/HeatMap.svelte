<script>
  /**
   * «Heatmap» (Noah 20.10.2026): the zoomable map with all lines. Drag to move, pinch or the wheel to
   * zoom, «+» «−» and «Alles zeigen»; the «Layers» button chooses the ground for all maps (Kartenlayer).
   * Every ride is drawn see-through on its own, so where rides overlap the colour gets stronger (mode
   * «lines») or a soft cloud grows (mode «clouds»). A tap names the rides there (onpick).
   * Own small map (spur/mapmath.js) with a canvas on top, no library. Loaded only with the page.
   */
  import { onMount } from 'svelte';
  import { Plus, Minus, Maximize2, Layers, Check } from '@lucide/svelte';
  import { t, tn } from '../i18n.svelte.js';
  import { uiZoom, unzoomRect } from '../uizoom.js';
  import { unmerc, fitView, zoomAt, panBy, tilesFor, pathOf, fromScreen, TILE } from '../spur/mapmath.js';
  import { RASTER_GROUNDS, rasterGround, tileUrl } from '../map/sources.js';
  import { mapGround, chooseGround } from '../map/groundpref.svelte.js';
  import { mercOf, boxOf, linesNear, rampOf, mainBounds } from './heat.js';

  /** lines: from heat.js heatLines; mode: 'lines' | 'clouds'; sel: lines to show in blue; onpick(lines). */
  let { lines = [], mode = 'lines', sel = [], height = 460, onpick = null, label = '' } = $props();

  let box = $state();
  let canvas = $state();
  let w = $state(360);
  let h = $state(460);
  let view = $state({ x: 0.5214, y: 0.3523, zoom: 7 });
  let fitted = false;

  const prepared = $derived(lines.map((line) => {
    const m = mercOf(line.pts);
    return { line, m, box: boxOf(m) };
  }));
  const fit = () => {
    view = fitView(mainBounds(lines), w, h, { maxZoom: 14, pad: 56 }); // room for the buttons on the right
  };
  // Tote Knöpfe 10 («Alles fertig»): when everything is already in view the tap changed nothing visible; say it
  let fitNote = $state('');
  let fitTimer;
  const fitAll = () => {
    fit();
    fitNote = tn(lines.length, 'All {n} ride in view', 'All {n} rides in view');
    clearTimeout(fitTimer);
    fitTimer = setTimeout(() => (fitNote = ''), 2500);
  };
  onMount(() => {
    const ro = new ResizeObserver(() => {
      w = box.clientWidth || 360;
      h = box.clientHeight || height;
      if (!fitted && lines.length) {
        fit();
        fitted = true;
      }
    });
    ro.observe(box);
    return () => ro.disconnect();
  });
  // the first lines arrive after the map: fit them once
  $effect(() => {
    if (!fitted && lines.length && w > 0) {
      fit();
      fitted = true;
    }
  });

  const mid = $derived(unmerc({ x: view.x, y: view.y }));
  const g = $derived(rasterGround(mapGround.key, mid[0], mid[1]));
  let pickOpen = $state(false);
  const choose = (k) => {
    chooseGround(k);
    pickOpen = false;
  };
  const tiles = $derived(tilesFor(view, w, h, g.maxZoom));
  const selPaths = $derived(sel.map((l) => ({ id: l.id, d: pathOf(l.pts, view, w, h) })));

  /* ---------- drawing: each ride see-through on its own, then coloured by how much lies on a pixel ---------- */
  const luts = { lines: rampOf('lines'), clouds: rampOf('clouds') };
  let off = null;
  let blur = null;
  let frame = 0;
  function draw() {
    frame = 0;
    if (!canvas) return;
    const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    const W = Math.max(1, Math.round(w * dpr));
    const H = Math.max(1, Math.round(h * dpr));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    off ??= document.createElement('canvas');
    if (off.width !== W || off.height !== H) {
      off.width = W;
      off.height = H;
    }
    const o = off.getContext('2d');
    if (!o) return;
    o.clearRect(0, 0, W, H);
    const clouds = mode === 'clouds';
    const s = TILE * 2 ** view.zoom * dpr;
    const ox = W / 2 - view.x * s;
    const oy = H / 2 - view.y * s;
    o.lineCap = 'round';
    o.lineJoin = 'round';
    o.lineWidth = (clouds ? Math.max(6, Math.min(18, view.zoom * 1.2)) : Math.max(1.6, Math.min(3.5, view.zoom / 4))) * dpr;
    o.strokeStyle = clouds ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.22)';
    const pad = 20 * dpr;
    for (const it of prepared) {
      const b = it.box;
      if (b.x1 * s + ox < -pad || b.x0 * s + ox > W + pad || b.y1 * s + oy < -pad || b.y0 * s + oy > H + pad) continue;
      const m = it.m;
      o.beginPath();
      let lx = m[0] * s + ox;
      let ly = m[1] * s + oy;
      o.moveTo(lx, ly);
      for (let i = 2; i < m.length; i += 2) {
        const x = m[i] * s + ox;
        const y = m[i + 1] * s + oy;
        if (i < m.length - 2 && Math.abs(x - lx) < 0.8 && Math.abs(y - ly) < 0.8) continue;
        o.lineTo(x, y);
        lx = x;
        ly = y;
      }
      o.stroke();
    }
    let src = off;
    if (clouds) {
      blur ??= document.createElement('canvas');
      if (blur.width !== W || blur.height !== H) {
        blur.width = W;
        blur.height = H;
      }
      const bc = blur.getContext('2d');
      if (bc) {
        bc.clearRect(0, 0, W, H);
        bc.filter = `blur(${Math.round(6 * dpr)}px)`;
        bc.drawImage(off, 0, 0);
        bc.filter = 'none';
        src = blur;
      }
    }
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(src, 0, 0);
    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data;
    const lut = luts[clouds ? 'clouds' : 'lines'];
    // stronger with every ride: the density is the alpha of the stack; clouds are lifted a little
    const lift = clouds ? 1.6 : 1;
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3];
      if (!a) continue;
      const v = Math.min(255, Math.round(a * lift)) * 4;
      d[i] = lut[v];
      d[i + 1] = lut[v + 1];
      d[i + 2] = lut[v + 2];
      d[i + 3] = lut[v + 3];
    }
    ctx.putImageData(img, 0, 0);
  }
  $effect(() => {
    // read what the drawing depends on, then draw once per frame
    void [view, w, h, prepared, mode, canvas];
    if (!frame) frame = requestAnimationFrame(draw);
  });
  onMount(() => () => frame && cancelAnimationFrame(frame));

  /* ---------- gestures ---------- */
  const ptrs = new Map();
  let pinch = null;
  let moved = 0;
  let downAt = null;
  const pt = (e) => ({ x: e.clientX / uiZoom(), y: e.clientY / uiZoom() });
  function down(e) {
    if (e.target.closest('button, .gp')) return;
    box.setPointerCapture?.(e.pointerId);
    ptrs.set(e.pointerId, pt(e));
    moved = 0;
    downAt = pt(e);
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) };
    }
  }
  function move(e) {
    const p = ptrs.get(e.pointerId);
    if (!p) return;
    const r = unzoomRect(box.getBoundingClientRect());
    const c = pt(e);
    if (ptrs.size === 1) {
      view = panBy(view, c.x - p.x, c.y - p.y);
      moved += Math.abs(c.x - p.x) + Math.abs(c.y - p.y);
    }
    ptrs.set(e.pointerId, c);
    if (ptrs.size === 2 && pinch) {
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.d > 0 && d > 0) view = zoomAt(view, d / pinch.d, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, w, h, { max: g.maxZoom });
      pinch.d = d;
      moved += 10;
    }
  }
  function up(e) {
    const had = ptrs.has(e.pointerId);
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (had && !ptrs.size && moved < 8 && downAt && onpick) {
      const r = unzoomRect(box.getBoundingClientRect());
      const p = fromScreen(downAt.x - r.left, downAt.y - r.top, view, w, h);
      onpick(linesNear(prepared, p, 14 / (TILE * 2 ** view.zoom)));
    }
  }
  function wheel(e) {
    e.preventDefault();
    const r = unzoomRect(box.getBoundingClientRect());
    const c = pt(e);
    view = zoomAt(view, Math.exp(-e.deltaY * 0.0025), c.x - r.left, c.y - r.top, w, h, { max: g.maxZoom });
  }
  function key(e) {
    if (e.target.closest?.('.gp')) return;
    const step = 60;
    const k = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
    if (k) {
      e.preventDefault();
      view = panBy(view, ...k);
    } else if (e.key === '+' || e.key === '=') zoom(2);
    else if (e.key === '-') zoom(0.5);
  }
  const zoom = (k) => (view = zoomAt(view, k, w / 2, h / 2, w, h, { max: g.maxZoom }));
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div class="hmap" style:height="{height}px" bind:this={box} role="application" aria-label={label || t('Heatmap: drag to move, pinch or wheel to zoom, tap a line for its rides')} tabindex="0" onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} onwheel={wheel} onkeydown={key} data-heatmap data-mode={mode} data-lines={lines.length}>
  <div class="tiles" aria-hidden="true">
    {#each tiles as tl (tl.key + g.key)}
      <img src={tileUrl(g, tl.z, tl.x, tl.y)} alt="" draggable="false" style:left="{tl.left}px" style:top="{tl.top}px" style:width="{tl.size + 0.5}px" style:height="{tl.size + 0.5}px" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" />
    {/each}
  </div>
  <canvas class="heat" bind:this={canvas} style:width="{w}px" style:height="{h}px" aria-hidden="true"></canvas>
  {#if selPaths.length}
    <svg class="over" width={w} height={h} aria-hidden="true">
      {#each selPaths as p (p.id)}
        <path d={p.d} class="halo" />
        <path d={p.d} class="pickline" />
      {/each}
    </svg>
  {/if}
  <div class="ctl">
    <button type="button" class="btn sm" aria-label={t('Zoom in')} onclick={() => zoom(2)}><Plus size={18} aria-hidden="true" /></button>
    <button type="button" class="btn sm" aria-label={t('Zoom out')} onclick={() => zoom(0.5)}><Minus size={18} aria-hidden="true" /></button>
    <button type="button" class="btn sm" aria-label={t('Show all rides')} onclick={fitAll} data-heat-fit><Maximize2 size={18} aria-hidden="true" /></button>
    <button type="button" class="btn sm" aria-label={t('Map ground')} aria-expanded={pickOpen} onclick={() => (pickOpen = !pickOpen)} data-map-layers><Layers size={18} aria-hidden="true" /></button>
  </div>
  {#if pickOpen}
    <div class="gp" role="group" aria-label={t('Map ground')} data-map-grounds>
      <p class="gp-h">{t('Map ground')}</p>
      {#each RASTER_GROUNDS as x (x.key)}
        <button type="button" class="gp-row" aria-pressed={mapGround.key === x.key} onclick={() => choose(x.key)} data-map-ground-pick={x.key}>
          <span class="gp-n">{t(x.name)}{#if x.key === 'auto'}{' · '}{t(g.name)}{/if}</span>
          {#if mapGround.key === x.key}<Check size={16} aria-hidden="true" />{/if}
        </button>
      {/each}
      <p class="gp-note">{t('Applies to all maps in the app.')}</p>
    </div>
  {/if}
  <p class="attr">{g.attribution}</p>
  <p class="fitnote" role="status" data-heat-fit-note>{fitNote}</p>
</div>

<style>
  .fitnote {
    position: absolute;
    left: 50%;
    top: 10px;
    transform: translateX(-50%);
    margin: 0;
    padding: 0 10px;
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font-size: var(--fs-small);
    pointer-events: none;
  }
  .fitnote:empty {
    display: none;
  }
  .hmap {
    position: relative;
    overflow: hidden;
    border-radius: var(--radius-card, 12px);
    --hm-ground: #e8ece6;
    --hm-white: #fff;
    --hm-sel: #1f5fbf;
    --hm-shadow: rgb(0 0 0 / 0.35);
    --hm-attr-bg: rgb(255 255 255 / 0.8);
    --hm-attr-ink: #333;
    --fs-hm-attr: 11px;
    background: var(--hm-ground);
    touch-action: none;
    user-select: none;
    cursor: grab;
    outline-offset: 2px;
  }
  .hmap:active {
    cursor: grabbing;
  }
  .tiles {
    position: absolute;
    inset: 0;
    /* a calmer ground, so the colours of the rides stand out */
    filter: grayscale(0.7) brightness(1.04) contrast(0.92);
  }
  .tiles img {
    position: absolute;
    max-width: none;
    pointer-events: none;
  }
  .heat,
  .over {
    position: absolute;
    left: 0;
    top: 0;
    pointer-events: none;
  }
  .halo {
    fill: none;
    stroke: var(--hm-white);
    stroke-width: 7;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.9;
  }
  .pickline {
    fill: none;
    stroke: var(--hm-sel);
    stroke-width: 3.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .ctl {
    position: absolute;
    right: 8px;
    top: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ctl .btn {
    background: var(--paper);
    padding: 6px;
    min-width: 40px;
    justify-content: center;
  }
  .gp {
    position: absolute;
    right: 56px;
    top: 8px;
    max-width: min(260px, calc(100% - 72px));
    max-height: calc(100% - 16px);
    overflow: auto;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: var(--radius-card, 12px);
    box-shadow: 0 2px 10px var(--hm-shadow);
    padding: 6px;
    cursor: default;
    touch-action: auto;
  }
  .gp-h {
    margin: 2px 6px 4px;
    font-weight: 600;
  }
  .gp-row {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 40px;
    padding: 6px 8px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--ink);
    text-align: left;
    cursor: pointer;
  }
  .gp-row[aria-pressed='true'] {
    background: var(--paper-2);
    font-weight: 600;
  }
  .gp-note {
    margin: 4px 6px 2px;
    font-size: var(--fs-hm-attr);
    color: var(--ink-2);
  }
  .attr {
    position: absolute;
    right: 0;
    bottom: 0;
    margin: 0;
    padding: 1px 6px;
    font-size: var(--fs-hm-attr);
    background: var(--hm-attr-bg);
    color: var(--hm-attr-ink);
    pointer-events: none;
  }
</style>
