<script>
  /**
   * «Rennatlas» view Karte (Noah 24.11.2026, Mockup 3 «Zoom von Europa bis zur Route»): where your races
   * start, on three maps: one large (the zoom you chose, + and − change it) and the two others beside it,
   * each with a dashed frame that shows where the next zoom goes. The outlines are the country data the
   * app has anyway and the big Swiss lakes (loaded when this view opens); the places are the start places
   * of the file (lat, lon). A tap on a number opens the race.
   */
  import { Plus, Minus } from '@lucide/svelte';
  import { pointsOf } from './atlas-view.js';
  import { shortDay, daysLabel } from './atlas-text.js';
  import { CITIES } from './atlas-cities.js';
  import { SHAPES, levelsOf, inEurope, px, py, inView, frameOf, scaleOf, inAlps } from './atlas-geo.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  let { mine, onopen, clashKeys = new Set(), wide = true } = $props();
  let countries = $state(null);
  let lakes = $state([]);
  let failed = $state(false);
  let level = $state(3);
  let widths = $state({ 1: 0, 2: 0, 3: 0 });
  $effect(() => {
    import('../neuland/load.js')
      .then((m) => Promise.all([m.loadBase('countries'), m.loadBase('lakes')]))
      .then(([c, l]) => {
        countries = c;
        lakes = l.filter((x) => x.kind === 'lake');
      })
      .catch(() => (failed = true));
  });

  const de = $derived(locale().startsWith('de'));
  const placed = $derived(pointsOf(mine).sort((a, b) => (a.row.date || '9999').localeCompare(b.row.date || '9999')));
  const numbered = $derived(placed.map((p, i) => ({ ...p, n: i + 1 })));
  const missing = $derived(mine.filter((r) => r.lat == null || r.lon == null));
  const onEurope = $derived(numbered.filter(inEurope));
  const outside = $derived(numbered.filter((p) => !inEurope(p)));
  const S = $derived(wide ? SHAPES.wide : SHAPES.narrow);
  const views = $derived(levelsOf(onEurope, S));
  const alps = $derived(views ? inAlps(views[3]) : false);
  const NAMES = $derived({
    1: t('Europe|map'),
    2: alps ? t('The Alps|map') : t('Wider region|map'),
    3: alps ? t('Switzerland|map') : t('Close up|map'),
  });
  const sides = $derived([3, 2, 1].filter((l) => l !== level));

  /** The outlines of the shapes that touch the view, as one path each. */
  function pathsOf(list, v, stride) {
    const out = [];
    for (const c of list ?? []) {
      const [b0, b1, b2, b3] = c.bbox;
      if (b2 < v.lo0 || b0 > v.lo1 || b3 < v.la0 || b1 > v.la1) continue;
      let d = '';
      for (const r of c.rings) {
        const rb = ringBox(r);
        if (rb[2] < v.lo0 || rb[0] > v.lo1 || rb[3] < v.la0 || rb[1] > v.la1) continue;
        const step = Math.max(2, stride * 2);
        for (let i = 0; i < r.length; i += step) d += `${i ? 'L' : 'M'}${px(v, r[i]).toFixed(1)} ${py(v, r[i + 1]).toFixed(1)}`;
        d += 'Z';
      }
      if (d) out.push({ id: c.id, d, name: de ? c.name : (c.en ?? c.name), land: c.name, c: c.c, big: (b2 - b0) * (b3 - b1) });
    }
    return out;
  }
  const boxes = new WeakMap();
  function ringBox(r) {
    let b = boxes.get(r);
    if (!b) {
      b = [Infinity, Infinity, -Infinity, -Infinity];
      for (let i = 0; i < r.length; i += 2) {
        if (r[i] < b[0]) b[0] = r[i];
        if (r[i] > b[2]) b[2] = r[i];
        if (r[i + 1] < b[1]) b[1] = r[i + 1];
        if (r[i + 1] > b[3]) b[3] = r[i + 1];
      }
      boxes.set(r, b);
    }
    return b;
  }
  const landOf = $derived(new Set(numbered.map((p) => p.row.land)));
  const hit = (land) => landOf.has(land);
  const kind = (p) => (clashKeys.has(p.key) ? 'clash' : p.row.registered ? 'reg' : 'fav');

  /** Does a label box run into the taken ones? */
  const hits = (box, taken) => taken.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1]);
  /**
   * The names that fit the big map without running into a number or into each other: the places first
   * (one by one, the most important first), then the country names where there is room.
   */
  function labelsOf(v, l, rank, pts, paths, u) {
    const taken = pts.map((p) => {
      const x = px(v, p.lon);
      const y = py(v, p.lat);
      return [x - 16 * u, y - 16 * u, x + 16 * u, y + 16 * u];
    });
    taken.push([0, v.H - 44 * u, scaleOf(v).units + 90 * u, v.H]); // the scale bar
    const cities = [];
    for (const [nameDe, nameEn, lat, lon, r] of CITIES) {
      if (r > rank || !inView(v, lat, lon, 0.04)) continue;
      const x = px(v, lon);
      const y = py(v, lat);
      const name = de ? nameDe : nameEn;
      const box = [x - 4 * u, y - 14 * u, x + (name.length * 6.6 + 14) * u, y + 6 * u];
      if (hits(box, taken)) continue;
      taken.push(box);
      cities.push({ name, x, y });
    }
    const lands = [];
    if (l > 1) {
      for (const c of paths) {
        if (!hit(c.land) && c.big <= 4) continue;
        const x = px(v, c.c[0]);
        const y0 = py(v, c.c[1]);
        const half = ((c.name.length * 9.5 * (l === 3 ? 1 : 0.8)) / 2) * u;
        // the name stays at the middle of the country, or moves up or down until there is room
        for (const dy of [0, 26, -26, 52, -52]) {
          const y = y0 + dy * u;
          if (x < 40 * u || x > v.W - 40 * u || y < 40 * u || y > v.H - 40 * u) continue;
          const box = [x - half, y - 8 * u, x + half, y + 8 * u];
          if (hits(box, taken)) continue;
          taken.push(box);
          lands.push({ id: c.id, name: c.name, x, y });
          break;
        }
      }
    }
    return { cities, lands };
  }
  function mapOf(l, main, u) {
    const v = views[l];
    const pts = numbered.filter((p) => inView(v, p.lat, p.lon));
    const paths = pathsOf(countries, v, l === 1 ? 2 : 1);
    return {
      v,
      pts,
      paths,
      lakes: l > 1 ? pathsOf(lakes, v, 1) : [],
      ...labelsOf(v, l, main ? l : 0, pts, paths, u),
      frame: l < 3 ? frameOf(v, views[l + 1]) : null,
      scale: scaleOf(v),
    };
  }
  /** Sizes that must stay readable on the screen: the picture is scaled, so divide by its scale. */
  const unit = (l) => S.W / (widths[l] || S.W);
  const maps = $derived(views && countries ? { 1: mapOf(1, level === 1, unit(1)), 2: mapOf(2, level === 2, unit(2)), 3: mapOf(3, level === 3, unit(3)) } : null);
</script>

{#snippet card(l, main)}
  {@const m = maps[l]}
  {@const u = unit(l)}
  {@const fs = (main ? 12 : 10) * u}
  <div class="mp-card" bind:clientWidth={widths[l]}>
    <svg viewBox={`0 0 ${S.W} ${S.H}`} class="mp-svg" role="img" aria-label={`${t('Zoom {n}', { n: l })} · ${NAMES[l]}`} data-atlas-mapsvg={l === 1 ? 'europe' : l === 2 ? 'region' : 'zoom'}>
      <rect class="sea" width={S.W} height={S.H} />
      {#each m.paths as c (c.id)}<path class="land" class:mine={hit(c.land)} d={c.d} />{/each}
      {#each m.lakes as c (c.id)}<path class="lake" d={c.d} />{/each}
      {#each m.lands as c (c.id + 'n')}<text class="cname" x={c.x} y={c.y + 4 * u} text-anchor="middle" font-size={fs}>{c.name.toUpperCase()}</text>{/each}
      {#each m.cities as c (c.name)}
        <circle class="city-dot" cx={c.x} cy={c.y} r={2.6 * u} />
        <text class="city" x={c.x + 6 * u} y={c.y + 4 * u} font-size={fs}>{c.name}</text>
      {/each}
      {#if m.frame}
        <rect class="frame" x={m.frame.x} y={m.frame.y} width={m.frame.w} height={m.frame.h} />
        <text class="frame-t" x={m.frame.x + m.frame.w - 6 * u} y={m.frame.y + m.frame.h - 6 * u} text-anchor="end" font-size={fs}>{t('Zoom {n}', { n: l + 1 })}</text>
      {/if}
      {#each m.pts as p (p.key)}
        {@const r = (main ? 13 : 10) * u}
        <g class="pt {kind(p)}" role="button" tabindex="0" aria-label={p.row.name} onclick={() => onopen(p.row)} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onopen(p.row)} data-atlas-point={p.key}>
          <circle cx={px(m.v, p.lon)} cy={py(m.v, p.lat)} {r} />
          <text x={px(m.v, p.lon)} y={py(m.v, p.lat) + r * 0.36} text-anchor="middle" font-size={r * 1.05}>{p.n}</text>
        </g>
      {/each}
      <g class="scale" transform={`translate(${12 * u} ${S.H - 12 * u})`}>
        <rect x="0" y={-26 * u} width={m.scale.units + 62 * u} height={26 * u} rx={7 * u} />
        <path d={`M${8 * u} ${-8 * u}H${8 * u + m.scale.units}M${8 * u} ${-13 * u}V${-3 * u}M${8 * u + m.scale.units} ${-13 * u}V${-3 * u}`} />
        <text x={14 * u + m.scale.units} y={-4 * u} font-size={fs}>{m.scale.km} km</text>
      </g>
    </svg>
    {#if main}
      <span class="mp-chip" data-atlas-zoomname>{t('Zoom {n}', { n: l })} · {NAMES[l]}</span>
      <div class="mp-zoom">
        <button type="button" class="mp-zb" aria-label={t('Zoom in')} disabled={level >= 3} onclick={() => (level = Math.min(3, level + 1))} data-atlas-zoom-in><Plus size={18} aria-hidden="true" /></button>
        <button type="button" class="mp-zb" aria-label={t('Zoom out')} disabled={level <= 1} onclick={() => (level = Math.max(1, level - 1))} data-atlas-zoom-out><Minus size={18} aria-hidden="true" /></button>
      </div>
    {:else}
      <button type="button" class="mp-chip" onclick={() => (level = l)} data-atlas-zoom-pick={l}>{t('Zoom {n}', { n: l })} · {NAMES[l]}</button>
    {/if}
  </div>
{/snippet}

<div class="mp" data-atlas-map>
  <div class="mp-head"><div><h2 class="mp-h">{t('Start places of my races')}</h2><small>{t('{n} races: {a} registered, {b} favourites', { n: mine.length, a: mine.filter((r) => r.registered).length, b: mine.filter((r) => !r.registered && r.fav).length })}</small></div></div>
  {#if !numbered.length}
    <div class="mp-empty" data-atlas-map-empty>
      <p>{mine.length ? t('The start places of your races have no position in the file yet (lat and lon). Then they cannot stand on the map.') : t('Star races or mark them as registered in the list: they stand here on the map.')}</p>
    </div>
  {:else}
    {#if maps}
      <p class="mp-sub">{t('Zoom with + and −. The dashed frame shows where the next zoom goes.')}</p>
      <div class="mp-grid">
        {#key level}{@render card(level, true)}{/key}
        <div class="mp-side">
          {#each sides as l (l)}{@render card(l, false)}{/each}
        </div>
      </div>
    {/if}
    {#if outside.length}<p class="mp-note" data-atlas-map-outside>{t('Not on the maps (outside Europe): {names}.', { names: outside.map((p) => `${p.n} ${p.row.name}${p.row.land ? ` (${p.row.land})` : ''}`).join(' · ') })}</p>{/if}
    <ul class="mp-leg">
      {#each numbered as p (p.key)}
        <li><button type="button" class="mp-li" onclick={() => onopen(p.row)}>
          <span class="mp-nb {kind(p)}">{p.n}</span>
          <span class="mp-t"><b>{p.row.name}</b><small>{[shortDay(p.row.date), daysLabel(p.row), p.row.registered ? t('registered|race') : t('favourite|race'), clashKeys.has(p.key) ? t('overlap|race') : ''].filter(Boolean).join(' · ')}</small></span>
        </button></li>
      {/each}
    </ul>
    {#if missing.length}<p class="mp-note" data-atlas-map-missing>{tn(missing.length, '{n} race has no position in the file and stands only in the list.', '{n} races have no position in the file and stand only in the list.')}</p>{/if}
  {/if}
  {#if failed}<p class="mp-note" role="alert">{t('The country outlines could not be loaded.')}</p>{/if}
</div>

<style>
  .mp {
    display: grid;
    gap: 14px;
    min-width: 0;
  }
  .mp-h {
    margin: 0;
    font: 700 var(--fs-section) / 1.2 var(--font-body);
  }
  .mp small,
  .mp-note,
  .mp-sub {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .mp-note,
  .mp-sub {
    margin: 0;
  }
  .mp-empty {
    padding: 18px;
    border: 1px dashed var(--line-strong);
    border-radius: var(--radius-card);
  }
  .mp-empty p {
    margin: 0;
    color: var(--ink-2);
  }
  .mp-grid {
    display: grid;
    gap: 14px;
    align-items: start;
  }
  .mp-side {
    display: grid;
    gap: 14px;
  }
  @media (min-width: 761px) {
    .mp-grid {
      grid-template-columns: 2fr 1fr;
    }
  }
  .mp-card {
    position: relative;
    min-width: 0;
  }
  .mp-svg {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 14px;
    overflow: hidden;
  }
  .sea {
    fill: var(--info-soft);
  }
  .land {
    fill: var(--paper-2);
    stroke: var(--paper);
    stroke-width: 1px;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }
  .land.mine {
    fill: var(--accent-soft);
  }
  .lake {
    fill: color-mix(in srgb, var(--info-soft) 82%, var(--ink-3));
    stroke: none;
  }
  .cname {
    fill: var(--ink-3);
    letter-spacing: 0.18em;
    pointer-events: none;
    opacity: 0.8;
  }
  .city-dot {
    fill: var(--ink-3);
  }
  .city {
    fill: var(--ink-2);
    stroke: var(--paper);
    stroke-width: 3px;
    stroke-linejoin: round;
    paint-order: stroke;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }
  .frame {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1.6px;
    stroke-dasharray: 6 4;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }
  .frame-t {
    fill: var(--ink);
    font-weight: 700;
    pointer-events: none;
  }
  .scale rect {
    fill: var(--paper);
    opacity: 0.88;
  }
  .scale path {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1.6px;
    vector-effect: non-scaling-stroke;
  }
  .scale text {
    fill: var(--ink-2);
  }
  .pt {
    cursor: pointer;
  }
  .pt circle {
    fill: var(--accent);
    stroke: var(--paper);
    stroke-width: 2px;
    vector-effect: non-scaling-stroke;
  }
  .pt.fav circle {
    fill: color-mix(in srgb, var(--accent) 60%, var(--paper));
  }
  .pt.clash circle {
    fill: var(--bad);
  }
  .pt text {
    fill: var(--paper);
    font-weight: 700;
    pointer-events: none;
  }
  .pt:focus-visible {
    outline: var(--focus-ring);
  }
  .mp-chip {
    all: unset;
    box-sizing: border-box;
    position: absolute;
    top: 10px;
    left: 10px;
    max-width: calc(100% - 76px);
    padding: 6px 12px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    font-size: var(--fs-small);
    font-weight: 700;
    box-shadow: 0 1px 3px color-mix(in srgb, var(--shadow) 40%, transparent);
  }
  button.mp-chip {
    cursor: pointer;
  }
  button.mp-chip:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  .mp-zoom {
    position: absolute;
    top: 10px;
    right: 10px;
    display: grid;
    border-radius: 12px;
    overflow: hidden;
    background: var(--paper);
    box-shadow: 0 1px 3px color-mix(in srgb, var(--shadow) 40%, transparent);
  }
  .mp-zb {
    all: unset;
    box-sizing: border-box;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    color: var(--ink);
    cursor: pointer;
  }
  .mp-zb + .mp-zb {
    border-top: 1px solid var(--line);
  }
  .mp-zb:disabled {
    color: var(--ink-3);
    opacity: 0.45;
    cursor: default;
  }
  .mp-zb:focus-visible {
    outline: var(--focus-ring);
    outline-offset: -3px;
  }
  .mp-leg {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 8px 16px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .mp-li {
    all: unset;
    box-sizing: border-box;
    display: flex;
    gap: 10px;
    align-items: center;
    min-height: 44px;
    width: 100%;
    cursor: pointer;
  }
  .mp-li:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  .mp-nb {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--accent);
    color: var(--paper);
    font-weight: 700;
    font-size: var(--fs-small);
  }
  .mp-nb.fav {
    background: color-mix(in srgb, var(--accent) 60%, var(--paper));
  }
  .mp-nb.clash {
    background: var(--bad);
  }
  .mp-t {
    display: grid;
    min-width: 0;
  }
  .mp-t b {
    font-size: var(--fs-small);
  }
</style>
