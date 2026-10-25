<script>
  import { uiZoom, unzoomRect } from '../uizoom.js';
  /**
   * Paket S «Reise-Spur» (answer 2a): the zoomable map of a tour. Drag to move, pinch or the wheel to
   * zoom, «+» «−» and «Ganze Tour». Under it swisstopo in Switzerland, OpenStreetMap elsewhere
   * (tiles.js); the «Layers» button chooses another ground for all maps (Kartenlayer 20.10.2026). The lines per day, the places, notes and photos as dots; a tap on a dot opens it.
   * Own small map (mapmath.js), no library. Loaded only with the tour page.
   */
  import { onMount } from 'svelte';
  import { Plus, Minus, Maximize2, Layers, Check } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { merc, unmerc, fitView, toScreen, zoomAt, panBy, tilesFor, pathOf } from './mapmath.js';
  import { boundsOf } from './polyline.js';
  import { RASTER_GROUNDS, rasterGround, tileUrl } from '../map/sources.js';
  import { mapGround, chooseGround } from '../map/groundpref.svelte.js';
  import { cellBounds } from './neuland.js';

  /** lines: [{ id, pts, n, src }]; points: [{ id, pos, kind, photo, text, n, cls? }] (kind 'friend': text is the whole label); cells: squares to tint (Neuland); pick(point). */
  let { lines = [], points = [], cells = null, cellZ = 14, height = 420, ground = null, focus = null, onpick = null, label = '', marker = null } = $props();
  // Tour-Seite (19.10.2026): marker [lat, lon] = the place the finger is on in the elevation profile
  const mark = $derived(marker ? toScreen(merc(marker), view, w, h) : null);

  let box = $state();
  let w = $state(360);
  let h = $state(420);
  let view = $state({ x: 0.52, y: 0.35, zoom: 7 });
  let fitted = false;

  const bounds = $derived(boundsOf(lines.map((l) => l.pts), points.map((p) => p.pos)));
  const fit = () => {
    view = fitView(bounds, w, h, { maxZoom: 15 });
  };
  // Tote Knöpfe 8 («Alles fertig»): the whole tour was already in view, so the tap showed nothing; say it
  let fitNote = $state('');
  let fitTimer;
  const fitAll = () => {
    fit();
    fitNote = t('The whole tour is in view');
    clearTimeout(fitTimer);
    fitTimer = setTimeout(() => (fitNote = ''), 2500);
  };
  onMount(() => {
    const ro = new ResizeObserver(() => {
      w = box.clientWidth || 360;
      h = box.clientHeight || height;
      if (!fitted) {
        fit();
        fitted = true;
      }
    });
    ro.observe(box);
    return () => ro.disconnect();
  });
  // a day chosen from outside: fit that
  $effect(() => {
    if (!focus) return;
    const b = boundsOf(focus.lines ?? [], focus.points ?? []);
    if (b) view = fitView(b, w, h, { maxZoom: 15 });
  });

  const mid = $derived(unmerc({ x: view.x, y: view.y }));
  // ground: a fixed key from the page, else the app's choice (groundpref)
  const g = $derived(rasterGround(ground ?? mapGround.key, mid[0], mid[1]));
  let pickOpen = $state(false);
  const choose = (k) => {
    chooseGround(k);
    pickOpen = false;
  };
  const tiles = $derived(tilesFor(view, w, h, g.maxZoom));
  // day colours, calm and distinct, from the app's tokens
  const COLS = ['var(--l3)', 'var(--l2)', 'var(--l1)', 'var(--l4)', 'var(--z5)', 'var(--z2)'];
  const colOf = (n) => COLS[((n ?? 1) - 1) % COLS.length];
  const paths = $derived(lines.map((l) => ({ id: l.id, d: pathOf(l.pts, view, w, h), col: l.src === 'rec' ? 'var(--bad)' : colOf(l.n), dash: l.src === 'rec' })));
  const dots = $derived(points.map((p) => ({ ...p, s: toScreen(merc(p.pos), view, w, h) })).filter((p) => p.s.x > -30 && p.s.x < w + 30 && p.s.y > -30 && p.s.y < h + 30));
  const squares = $derived.by(() => {
    if (!cells || view.zoom < 9) return [];
    const out = [];
    for (const c of cells) {
      const [[n, wl], [s, e]] = cellBounds(c, cellZ);
      const a = toScreen(merc([n, wl]), view, w, h);
      const b = toScreen(merc([s, e]), view, w, h);
      if (b.x < 0 || a.x > w || b.y < 0 || a.y > h) continue;
      out.push({ c, x: a.x, y: a.y, w: Math.max(1, b.x - a.x), h: Math.max(1, b.y - a.y) });
      if (out.length > 3000) break;
    }
    return out;
  });
  const ends = $derived.by(() => {
    const all = lines.filter((l) => l.pts.length >= 2);
    if (!all.length) return [];
    return [{ k: 'start', s: toScreen(merc(all[0].pts[0]), view, w, h) }, { k: 'end', s: toScreen(merc(all.at(-1).pts.at(-1)), view, w, h) }];
  });

  /* ---------- gestures ---------- */
  const ptrs = new Map();
  let pinch = null;
  let moved = 0;
  // «Grösse»: pointer and box in the page's own pixels (the app may be zoomed)
  const pt = (e) => ({ x: e.clientX / uiZoom(), y: e.clientY / uiZoom() });
  function down(e) {
    if (e.target.closest('button, .gp')) return;
    box.setPointerCapture?.(e.pointerId);
    ptrs.set(e.pointerId, pt(e));
    moved = 0;
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
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
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
  const pick = (p) => moved < 8 && onpick?.(p);
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div class="tmap" style:height="{height}px" bind:this={box} role="application" aria-label={label || t('Tour map: drag to move, pinch or wheel to zoom')} tabindex="0" onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} onwheel={wheel} onkeydown={key}>
  <div class="tiles" aria-hidden="true">
    {#each tiles as tl (tl.key + g.key)}
      <img src={tileUrl(g, tl.z, tl.x, tl.y)} alt="" draggable="false" style:left="{tl.left}px" style:top="{tl.top}px" style:width="{tl.size + 0.5}px" style:height="{tl.size + 0.5}px" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" />
    {/each}
  </div>
  <svg class="over" width={w} height={h} aria-hidden="true">
    {#each squares as q (q.c)}<rect class="neu" x={q.x} y={q.y} width={q.w} height={q.h} />{/each}
    {#each paths as p (p.id)}
      <path d={p.d} class="halo" />
      <path d={p.d} class="line" stroke={p.col} stroke-dasharray={p.dash ? '6 5' : null} />
    {/each}
    {#each ends as e (e.k)}<circle cx={e.s.x} cy={e.s.y} r="7" class="end {e.k}" />{/each}
    {#if mark}<circle cx={mark.x} cy={mark.y} r="8" class="here" data-map-marker />{/if}
  </svg>
  {#each dots as p (p.id)}
    <button type="button" class="dot {p.kind} {p.cls ?? ''}" style:left="{p.s.x}px" style:top="{p.s.y}px" aria-label={p.kind === 'friend' ? p.text : p.kind === 'tour' ? t('Open the tour {text}', { text: p.text || '' }) : p.kind === 'place' ? t('Place: {text}', { text: p.text || t('I am here') }) : p.kind === 'photo' ? t('Photo: {text}', { text: p.text || '' }) : t('Note: {text}', { text: p.text || '' })} onclick={() => pick(p)}>
      {#if p.photo}<img src={p.photo} alt="" />{:else}<span>{p.n ?? ''}</span>{/if}
    </button>
  {/each}
  <div class="ctl">
    <button type="button" class="btn sm" aria-label={t('Zoom in')} onclick={() => zoom(2)}><Plus size={18} aria-hidden="true" /></button>
    <button type="button" class="btn sm" aria-label={t('Zoom out')} onclick={() => zoom(0.5)}><Minus size={18} aria-hidden="true" /></button>
    <button type="button" class="btn sm" aria-label={t('Whole tour')} onclick={fitAll} data-tour-fit><Maximize2 size={18} aria-hidden="true" /></button>
    {#if ground == null}<button type="button" class="btn sm" aria-label={t('Map ground')} aria-expanded={pickOpen} onclick={() => (pickOpen = !pickOpen)} data-map-layers><Layers size={18} aria-hidden="true" /></button>{/if}
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
  <p class="fitnote" role="status">{fitNote}</p>
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
  .tmap {
    position: relative;
    overflow: hidden;
    border-radius: var(--radius-card, 12px);
    --tm-ground: #e8ece6;
    --tm-white: #fff;
    --tm-shadow: rgb(0 0 0 / 0.35);
    --tm-attr-bg: rgb(255 255 255 / 0.8);
    --tm-attr-ink: #333;
    --fs-tm-dot: 13px;
    --fs-tm-attr: 11px;
    background: var(--tm-ground);
    touch-action: none;
    user-select: none;
    cursor: grab;
    outline-offset: 2px;
  }
  .tmap:active {
    cursor: grabbing;
  }
  .tiles img {
    position: absolute;
    max-width: none;
    pointer-events: none;
  }
  .over {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .halo {
    fill: none;
    stroke: var(--tm-white);
    stroke-width: 7;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.85;
  }
  .here {
    fill: var(--bad);
    stroke: var(--tm-white);
    stroke-width: 3;
  }
  .line {
    fill: none;
    stroke-width: 4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .neu {
    fill: var(--accent);
    opacity: 0.18;
  }
  .end {
    stroke: var(--tm-white);
    stroke-width: 3;
  }
  .end.start {
    fill: var(--accent);
  }
  .end.end {
    fill: var(--ink);
  }
  .dot {
    position: absolute;
    transform: translate(-50%, -50%);
    width: 34px;
    height: 34px;
    min-height: 0;
    padding: 0;
    border-radius: 50%;
    border: 3px solid var(--tm-white);
    box-shadow: 0 1px 4px var(--tm-shadow);
    background: var(--brand);
    color: var(--tm-white);
    font-weight: 700;
    font-size: var(--fs-tm-dot);
    display: grid;
    place-items: center;
    overflow: hidden;
    cursor: pointer;
  }
  .dot.note {
    background: var(--l2);
  }
  /* Gruppen-Live-Karte: the members of a group ride (initials; you in the brand colour; old places pale) */
  .dot.friend {
    background: var(--l3);
  }
  .dot.friend.me {
    background: var(--brand);
  }
  .dot.friend.stale {
    opacity: 0.55;
  }
  .dot img {
    width: 100%;
    height: 100%;
    object-fit: cover;
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
    box-shadow: 0 2px 10px var(--tm-shadow);
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
    font-size: var(--fs-tm-attr);
    color: var(--ink-2);
  }
  .attr {
    position: absolute;
    right: 0;
    bottom: 0;
    margin: 0;
    padding: 1px 6px;
    font-size: var(--fs-tm-attr);
    background: var(--tm-attr-bg);
    color: var(--tm-attr-ink);
    pointer-events: none;
  }
</style>
