<script>
  /**
   * «Neuland»: the map of one collection, drawn as SVG from the bundled shapes (no map service, works
   * offline). Areas (cantons, municipalities, countries) are filled when reached; points (passes, huts,
   * peaks, lakes, own places) are dots on the Swiss cantons or the Alps. Your routes show as thin lines.
   * view: 'ch' | 'alps' | 'europe'; areas: [{ id, rings, st }]; points: [{ id, lat, lon, st }];
   * st: 'year' (new in the chosen year), 'old' (reached before), '' (not yet); bg: { cantons, countries,
   * lakes } background shapes; labels: [{ lon, lat, text, st }]; lines: [[[lat, lon], …], …];
   * onpick(id): a tap on an area or a dot. The list below the map does the same for the keyboard.
   * Summit book map (Noah 24.11.2026 «1-5a»): view 'near' shows the surroundings of `center` {lat, lon}, and `big` draws
   * big dots: yours filled, the open ones near you as rings, the rest pale.
   * Zoom (Noah 27.11.2026 «die Karte muss wirklich ausgezeichnet sein mit Zoomfunktion»): the buttons + / − / «Whole map», Ctrl + wheel
   * or a pinch on the trackpad, two fingers on the phone, drag to move, double tap to zoom in; dots and names keep their size on screen.
   * zoomable (default true) switches it off; focus { id, n } zooms to that area or dot (the list calls it; n counts the taps so the same place can be shown again).
   */
  import { untrack } from 'svelte';
  import { Plus, Minus, Maximize2, LocateFixed, X } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { zoomAt, clampView, pinch, MAX_ZOOM, visibleBox } from './kartezoom.js';
  import { placeLabels } from '../dotlabels.js';

  let { view = 'ch', areas = [], points = [], bg = {}, labels = [], lines = [], title = '', onpick = null, center = null, big = false, span = 0.62, ratio = 1.15, labelSize = 3.4, dotLabels = false, selId = null, zoomable = true, focus = null } = $props();

  const S = 100; // 1° = 100 units
  const NAMES_AT = 2.5; // from this zoom on the dots show their names
  const BOX = { ch: [5.9, 45.78, 10.55, 47.84, 46.8], alps: [5.4, 43.85, 14.4, 48.0, 46.2], europe: [-11, 35, 33, 66, 50] };

  // the box: the view's own, widened for countries reached outside Europe
  const box = $derived.by(() => {
    if (view === 'near' && center) {
      const kc = Math.cos((center.lat * Math.PI) / 180);
      const hx = (span * ratio) / kc;
      return [center.lon - hx, center.lat - span, center.lon + hx, center.lat + span, center.lat];
    }
    const b = [...BOX[view === 'near' ? 'ch' : view]];
    if (view === 'europe') {
      for (const a of areas) {
        if (!a.st || !a.bbox) continue;
        b[0] = Math.min(b[0], a.bbox[0]);
        b[1] = Math.min(b[1], a.bbox[1]);
        b[2] = Math.max(b[2], a.bbox[2]);
        b[3] = Math.max(b[3], a.bbox[3]);
      }
      b[0] = Math.max(-180, b[0]);
      b[2] = Math.min(180, b[2]);
      b[1] = Math.max(-58, b[1]);
      b[3] = Math.min(78, b[3]);
    }
    if (view === 'alps') {
      for (const p of points) {
        b[0] = Math.min(b[0], p.lon - 0.2);
        b[1] = Math.min(b[1], p.lat - 0.2);
        b[2] = Math.max(b[2], p.lon + 0.2);
        b[3] = Math.max(b[3], p.lat + 0.2);
      }
    }
    return b;
  });
  const k = $derived(Math.cos((box[4] * Math.PI) / 180));
  // the whole map as [x, y, w, h] in drawing units; `view` is what the zoom shows of it: { z, cx, cy }
  const base = $derived([box[0] * k * S, -box[3] * S, (box[2] - box[0]) * k * S, (box[3] - box[1]) * S]);
  let view_ = $state({ z: 1, cx: null, cy: null });
  const zoomed = $derived(view_.z > 1.001);
  const cur = $derived(visibleBox(base, view_));
  const vb = $derived(cur.map((n) => n.toFixed(1)).join(' '));
  const maxZoom = $derived(view === 'near' ? Math.min(MAX_ZOOM, 12) : MAX_ZOOM);
  // dots and names grow only a little when you zoom, so they stay about the same on the screen
  const sz = $derived(1 / Math.pow(view_.z, 0.85));
  const unit = $derived((base[2] / 100) * sz); // 1 % of the width, as it should look now
  // a new map (another collection or view) starts with the whole picture; ticking an entry (same frame) keeps your zoom
  const frame = $derived(base.map((n) => n.toFixed(1)).join(' '));
  let frameSeen = '';
  $effect(() => {
    const f = frame;
    if (f === frameSeen) return;
    frameSeen = f;
    untrack(() => (view_ = { z: 1, cx: null, cy: null }));
  });

  const visible = (bb) => bb && !(bb[2] < box[0] || bb[0] > box[2] || bb[3] < box[1] || bb[1] > box[3]);
  function path(rings) {
    let s = '';
    for (const r of rings) {
      for (let i = 0; i < r.length; i += 2) s += `${i ? 'L' : 'M'}${(r[i] * k * S).toFixed(1)} ${(-r[i + 1] * S).toFixed(1)}`;
      s += 'Z';
    }
    return s;
  }
  const xy = (lon, lat) => [+(lon * k * S).toFixed(1), +(-lat * S).toFixed(1)];

  const bgCountries = $derived((bg.countries ?? []).filter((c) => visible(c.bbox)).map((c) => ({ id: c.id, d: path(c.rings) })));
  const bgCantons = $derived((bg.cantons ?? []).map((c) => ({ id: c.id, d: path(c.rings) })));
  const bgLakes = $derived((bg.lakes ?? []).filter((l) => l.rings).map((l) => ({ id: l.id, d: path(l.rings) })));
  const shapes = $derived(areas.filter((a) => a.rings && visible(a.bbox)).map((a) => ({ id: a.id, st: a.st, d: path(a.rings) })));
  const dots = $derived(points.map((p) => ({ id: p.id, st: p.st, name: p.name, xy: xy(p.lon, p.lat) })));
  const radius = (p) => (big ? (p.st === 'year' ? unit * 2.4 : p.st === 'old' ? unit * 2.1 : unit * 1.1) : p.st ? unit * 1.1 : unit * 0.75);
  // the names of your places and of the open ones near you stand beside their dots, where no other name or dot is
  const dotNames = $derived.by(() => {
    // zoomed in, every dot in view gets its name (as far as they fit); zoomed out only the ones that are yours
    const close = view_.z >= NAMES_AT;
    if (!dotLabels && !close) return [];
    const fs = unit * (dotLabels ? labelSize : 2.1);
    // yours and the chosen one first, so they get the free places
    const all = dots
      .map((d) => ({ id: d.id, x: d.xy[0], y: d.xy[1], r: radius(d), name: d.name && (close || d.st === 'year' || d.st === 'old') ? d.name : '' }))
      .sort((a, b) => (b.id === selId) - (a.id === selId) || !!b.name - !!a.name);
    const inView = all.filter((d) => d.x >= cur[0] && d.x <= cur[0] + cur[2] && d.y >= cur[1] && d.y <= cur[1] + cur[3]);
    const placed = placeLabels(inView, fs, { x0: cur[0], x1: cur[0] + cur[2], y0: cur[1], y1: cur[1] + cur[3] });
    if (dotLabels) return placed.map((l) => ({ ...l, fs }));
    // zoomed in on a map of many places: a name that would cover another stays away (zoom further and it shows)
    const hit = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
    const kept = [];
    const within = (b) => b.x0 >= cur[0] && b.x1 <= cur[0] + cur[2] && b.y0 >= cur[1] && b.y1 <= cur[1] + cur[3];
    for (const l of placed) if (within(l.b) && !kept.some((q) => hit(l.b, q.b))) kept.push(l);
    return kept.map((l) => ({ ...l, fs }));
  });
  const routes = $derived(lines.map((l) => l.map(([lat, lon]) => xy(lon, lat).join(',')).join(' ')));

  // ---- zoom and move
  let svg = $state(null);
  let hint = $state(false);
  let big_ = $state(false); // the map fills the whole screen
  let kbd = $state(false); // the focus ring shows only after a key, not after a tap or a drag
  let hintTimer;
  let moved = false;
  const pts = new Map(); // the fingers or the mouse that are down: pointerId → { x, y } (screen)
  let last = null; // the last pinch: { dist, mid }
  let lastTap = 0;

  const toSvg = (cx, cy) => {
    const m = svg?.getScreenCTM?.();
    if (!m) return [cur[0] + cur[2] / 2, cur[1] + cur[3] / 2];
    const p = new DOMPoint(cx, cy).matrixTransform(m.inverse());
    return [p.x, p.y];
  };
  const perPx = () => {
    const m = svg?.getScreenCTM?.();
    return m ? 1 / m.a : cur[2] / (svg?.clientWidth || 400); // drawing units per screen pixel
  };
  function setView(v) {
    view_ = clampView(base, v, maxZoom);
  }
  function zoomBy(f, at) {
    const [px, py] = at ?? [cur[0] + cur[2] / 2, cur[1] + cur[3] / 2];
    setView(zoomAt(base, view_, px, py, view_.z * f));
  }
  $effect(() => {
    if (!big_) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => (document.body.style.overflow = old);
  });
  function reset() {
    view_ = { z: 1, cx: null, cy: null };
  }
  function onwheel(e) {
    if (!zoomable) return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      zoomBy(Math.exp(-e.deltaY * 0.01), toSvg(e.clientX, e.clientY));
    } else {
      // a plain scroll belongs to the page: say how to zoom
      hint = true;
      clearTimeout(hintTimer);
      hintTimer = setTimeout(() => (hint = false), 1400);
    }
  }
  function ondown(e) {
    if (!zoomable) return;
    kbd = false;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = false;
    last = null;
  }
  function onmove(e) {
    if (!zoomable || !pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId);
    const now = { x: e.clientX, y: e.clientY };
    if (pts.size === 1) {
      const dx = now.x - prev.x;
      const dy = now.y - prev.y;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      if (!zoomed && e.pointerType === 'touch') return; // the whole map: a finger scrolls the page
      moved = true;
      try {
        svg.setPointerCapture(e.pointerId);
      } catch {}
      const u = perPx();
      pts.set(e.pointerId, now);
      setView({ ...view_, cx: (view_.cx ?? cur[0] + cur[2] / 2) - dx * u, cy: (view_.cy ?? cur[1] + cur[3] / 2) - dy * u });
    } else if (pts.size === 2) {
      pts.set(e.pointerId, now);
      const [a, b] = [...pts.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (last && last.dist > 0) {
        moved = true;
        const [px, py] = toSvg(mid.x, mid.y);
        const u = perPx();
        setView(pinch(base, view_, { px, py, ratio: dist / last.dist, dx: (mid.x - last.mid.x) * u, dy: (mid.y - last.mid.y) * u }, maxZoom));
      }
      last = { dist, mid };
    }
  }
  function onup(e) {
    pts.delete(e.pointerId);
    last = null;
    if (!pts.size && !moved && e.pointerType === 'touch') {
      // a double tap on the empty map zooms in there
      const now = Date.now();
      if (now - lastTap < 320 && !e.target?.closest?.('[data-id]')) zoomBy(2.2, toSvg(e.clientX, e.clientY));
      lastTap = now;
    }
  }
  function onkey(e) {
    if (!zoomable || e.target !== e.currentTarget) return;
    const step = cur[2] * 0.2;
    if (e.key === '+' || e.key === '=') zoomBy(1.6);
    else if (e.key === '-' || e.key === '_') zoomBy(1 / 1.6);
    else if (e.key === '0') reset();
    else if (zoomed && e.key === 'ArrowLeft') setView({ ...view_, cx: (view_.cx ?? cur[0] + cur[2] / 2) - step, cy: view_.cy ?? cur[1] + cur[3] / 2 });
    else if (zoomed && e.key === 'ArrowRight') setView({ ...view_, cx: (view_.cx ?? cur[0] + cur[2] / 2) + step, cy: view_.cy ?? cur[1] + cur[3] / 2 });
    else if (zoomed && e.key === 'ArrowUp') setView({ ...view_, cx: view_.cx ?? cur[0] + cur[2] / 2, cy: (view_.cy ?? cur[1] + cur[3] / 2) - step });
    else if (zoomed && e.key === 'ArrowDown') setView({ ...view_, cx: view_.cx ?? cur[0] + cur[2] / 2, cy: (view_.cy ?? cur[1] + cur[3] / 2) + step });
    else return;
    e.preventDefault();
  }
  // focus: zoom to that dot or area
  $effect(() => {
    const id = focus?.id;
    focus?.n;
    if (id == null) return;
    // reading the map to find the place must not make this run again when the view changes
    untrack(() => {
      const d = dots.find((x) => x.id === id);
      if (d) return setView({ z: Math.max(view_.z, view === 'near' ? 4 : 6), cx: d.xy[0], cy: d.xy[1] });
      const a = areas.find((x) => x.id === id && x.bbox);
      if (!a) return;
      const [x0, y0] = xy(a.bbox[0], a.bbox[3]);
      const [x1, y1] = xy(a.bbox[2], a.bbox[1]);
      const z = Math.min(maxZoom, Math.max(1, 0.7 * Math.min(base[2] / Math.max(x1 - x0, 1), base[3] / Math.max(y1 - y0, 1))));
      setView({ z, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 });
    });
  });

  function pick(e) {
    if (moved) {
      moved = false;
      return;
    }
    const id = e.target?.closest?.('[data-id]')?.dataset.id;
    if (id) onpick?.(id);
  }
</script>

<!-- the list under the map is the way for the keyboard and the screen reader; the map is a picture with taps -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<svelte:window onkeydown={(e) => big_ && e.key === 'Escape' && ((big_ = false), e.stopPropagation())} />
<div class="nm-wrap" class:zoomed class:full={big_} role={big_ ? 'dialog' : undefined} aria-modal={big_ ? 'true' : undefined} aria-label={big_ ? title || t('Map') : undefined}>
{#if big_}<div class="nm-top"><b>{title || t('Map')}</b><button type="button" class="nm-x" onclick={() => (big_ = false)} data-zoom-close aria-label={t('Close')}><X size={20} aria-hidden="true" /></button></div>{/if}
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<svg bind:this={svg} class="nmap {view}" class:big viewBox={vb} role="img" aria-label={title || t('Map')} onclick={pick} preserveAspectRatio="xMidYMid meet" tabindex={zoomable ? 0 : undefined} onwheel={onwheel} onpointerdown={ondown} onpointermove={onmove} onpointerup={onup} onpointercancel={onup} onkeydown={(e) => ((kbd = true), onkey(e))} class:kbd data-zoom={view_.z.toFixed(2)}>
  {#each bgCountries as c (c.id)}<path class="bgc" d={c.d} />{/each}
  {#each bgCantons as c (c.id)}<path class="bgk" d={c.d} />{/each}
  {#each shapes as a (a.id)}<path class="area {a.st || 'no'}" class:sel={selId === a.id} data-id={a.id} d={a.d} />{/each}
  {#each bgLakes as l (l.id)}<path class="lake" d={l.d} />{/each}
  {#each routes as r, i (i)}<polyline class="route" points={r} />{/each}
  {#each dotNames as l (l.id)}
    <text class="dn" x={l.x} y={l.y} font-size={l.fs} text-anchor={l.anchor} dominant-baseline="central" data-id={l.id} style:stroke-width="{l.fs * 0.28}px">{l.name}</text>
  {/each}
  {#each dots as p (p.id)}
    <circle class="dot {p.st || 'no'}" class:sel={selId === p.id} data-id={p.id} cx={p.xy[0]} cy={p.xy[1]} r={radius(p)} />
  {/each}
  {#each labels as l (l.text)}
    {@const [x, y] = xy(l.lon, l.lat)}
    <text class="nl-lbl {l.st || 'no'}" {x} {y} font-size={unit * 1.8} text-anchor="middle" dominant-baseline="central">{l.text}</text>
  {/each}
</svg>
{#if zoomable}
  <div class="nm-zoom" role="group" aria-label={t('Zoom')}>
    <button type="button" aria-label={t('Zoom in')} onclick={() => zoomBy(1.7)} disabled={view_.z >= maxZoom - 0.01} data-zoom-in><Plus size={20} aria-hidden="true" /></button>
    <button type="button" aria-label={t('Zoom out')} onclick={() => zoomBy(1 / 1.7)} disabled={!zoomed} data-zoom-out><Minus size={20} aria-hidden="true" /></button>
    <button type="button" aria-label={t('Whole map')} onclick={reset} disabled={!zoomed} data-zoom-reset><LocateFixed size={20} aria-hidden="true" /></button>
    {#if !big_}<button type="button" aria-label={t('Full screen')} onclick={() => (big_ = true)} data-zoom-full><Maximize2 size={16} aria-hidden="true" /></button>{/if}
  </div>
  {#if hint}<p class="nm-hint" role="status">{t('Ctrl and scroll, or pinch, to zoom')}</p>{/if}
{/if}
</div>

<style>
  .nm-wrap {
    position: relative;
  }
  .nm-wrap.full {
    position: fixed;
    inset: 0;
    z-index: 80;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: calc(8px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right)) calc(12px + env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-left));
    background: var(--paper);
    overscroll-behavior: contain;
  }
  .nm-top {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 44px;
  }
  .nm-x {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border: 1px solid var(--line-strong);
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .full .nmap {
    flex: 1;
    min-height: 0;
    max-height: none;
    height: 100%;
    background: var(--paper-2);
  }
  .full .nm-zoom {
    right: calc(20px + env(safe-area-inset-right));
    top: calc(64px + env(safe-area-inset-top));
  }
  .nm-zoom {
    position: absolute;
    right: 8px;
    top: 8px;
    display: flex;
    flex-direction: column;
    gap: 1px;
    border-radius: var(--r-ctl);
    overflow: hidden;
    box-shadow: var(--shadow-1);
    background: var(--line);
  }
  .nm-zoom button {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border: 0;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .nm-zoom button:disabled {
    color: var(--ink-3);
    cursor: default;
  }
  .nm-zoom button:not(:disabled):hover {
    background: var(--paper-2);
  }
  .nm-hint {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    margin: 0;
    padding: 8px 14px;
    border-radius: var(--r-ctl);
    background: var(--ink);
    color: var(--paper);
    font-size: var(--fs-small);
    pointer-events: none;
    text-align: center;
  }
  .nmap {
    display: block;
    width: 100%;
    height: auto;
    max-height: 62vh;
    border-radius: var(--r-ctl);
    background: var(--paper);
    touch-action: manipulation;
    cursor: grab;
  }
  .zoomed .nmap {
    touch-action: none; /* zoomed in: a finger moves the map, the page scrolls beside it */
  }
  .nmap:focus {
    outline: none;
  }
  .nmap.kbd:focus {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .nmap.europe {
    background: var(--info-soft);
  }
  path,
  polyline,
  circle {
    vector-effect: non-scaling-stroke;
  }
  .bgc {
    fill: var(--paper-2);
    stroke: var(--line);
    stroke-width: 0.6;
  }
  .europe .bgc {
    fill: var(--paper);
  }
  .bgk {
    fill: var(--paper-2);
    stroke: var(--line);
    stroke-width: 0.6;
  }
  .area {
    stroke: var(--line-strong);
    stroke-width: 0.5;
    cursor: pointer;
  }
  .area.no {
    fill: var(--paper-2);
  }
  .europe .area.no {
    fill: var(--paper);
  }
  .area.old {
    fill: var(--accent);
    fill-opacity: 0.55;
  }
  .area.year {
    fill: var(--accent);
  }
  .area.sel {
    stroke: var(--ink);
    stroke-width: 2;
  }
  .lake {
    fill: var(--info-soft);
    stroke: var(--line);
    stroke-width: 0.4;
    pointer-events: none;
  }
  .route {
    fill: none;
    stroke: var(--hi);
    stroke-width: 1.4;
    stroke-opacity: 0.75;
    stroke-linejoin: round;
    pointer-events: none;
  }
  .dot {
    stroke: var(--paper);
    stroke-width: 1;
    cursor: pointer;
  }
  .dot.no {
    fill: var(--ink-3);
    fill-opacity: 0.55;
  }
  .dot.old {
    fill: var(--accent);
    fill-opacity: 0.7;
  }
  .dot.year {
    fill: var(--accent);
  }
  .dot.sel {
    stroke: var(--ink);
    stroke-width: 3;
  }
  .dn {
    fill: var(--ink);
    font-family: var(--font-body);
    font-weight: 600;
    paint-order: stroke;
    stroke: var(--paper);
    stroke-linejoin: round;
    cursor: pointer;
  }
  .big .dot.old {
    fill: var(--paper);
    fill-opacity: 1;
    stroke: var(--accent);
    stroke-width: 2.5;
  }
  .big .dot.no {
    fill-opacity: 0.35;
    stroke: none;
  }
  .nl-lbl {
    fill: var(--ink-2);
    font-family: var(--font-body);
    font-weight: 600;
    pointer-events: none;
  }
  .nl-lbl.old,
  .nl-lbl.year {
    fill: var(--paper);
  }
</style>
