<script>
  /**
   * «Rennatlas» view Karte (Noah 24.11.2026, Mockup 3): where your races start. Europe at a glance and a
   * closer map of the densest part (the Alps for most). The outlines are the country data the app has
   * anyway (loaded when this view opens); the points are the start places of the file (lat, lon). A tap on
   * a number opens the race.
   */
  import { keyOf } from './atlas.js';
  import { pointsOf, yearLine } from './atlas-view.js';
  import { shortDay, daysLabel } from './atlas-text.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  let { mine, onopen, clashKeys = new Set() } = $props();
  let countries = $state(null);
  let failed = $state(false);
  $effect(() => {
    import('../neuland/load.js')
      .then((m) => m.loadBase('countries'))
      .then((c) => (countries = c))
      .catch(() => (failed = true));
  });

  const placed = $derived(pointsOf(mine).sort((a, b) => (a.row.date || '9999').localeCompare(b.row.date || '9999')));
  const numbered = $derived(placed.map((p, i) => ({ ...p, n: i + 1 })));
  const missing = $derived(mine.filter((r) => r.lat == null || r.lon == null));
  const W = 800;
  const H = 520;

  /** A view that holds the points, padded, in the shape of the picture. */
  function viewOf(pts, pad, minSpan = 0) {
    const lats = pts.map((p) => p.lat);
    const lons = pts.map((p) => p.lon);
    let la0 = Math.min(...lats) - pad;
    let la1 = Math.max(...lats) + pad;
    let lo0 = Math.min(...lons) - pad;
    let lo1 = Math.max(...lons) + pad;
    const mid = (la0 + la1) / 2;
    const k = Math.cos((mid * Math.PI) / 180);
    let w = (lo1 - lo0) * k;
    let h = la1 - la0;
    if (h < minSpan) { la0 -= (minSpan - h) / 2; la1 += (minSpan - h) / 2; h = minSpan; }
    const want = W / H;
    if (w / h < want) {
      const nw = h * want;
      lo0 -= (nw - w) / 2 / k;
      lo1 += (nw - w) / 2 / k;
      w = nw;
    } else {
      const nh = w / want;
      la0 -= (nh - h) / 2;
      la1 += (nh - h) / 2;
      h = nh;
    }
    return { la0, la1, lo0, lo1, k, w, h };
  }
  const europe = $derived.by(() => {
    const pts = numbered.filter((p) => p.lon > -25 && p.lon < 45 && p.lat > 30 && p.lat < 72);
    return pts.length ? { pts, v: viewOf(pts, 3, 12) } : null;
  });
  const zoom = $derived.by(() => {
    const pts = europe?.pts ?? [];
    if (pts.length < 2) return null;
    let best = [];
    for (const c of pts) {
      const near = pts.filter((p) => Math.abs(p.lat - c.lat) < 3.2 && Math.abs(p.lon - c.lon) < 5.5);
      if (near.length > best.length) best = near;
    }
    return best.length >= 2 ? { pts: best, v: viewOf(best, 0.9, 3) } : null;
  });
  const outside = $derived(zoom ? numbered.filter((p) => !zoom.pts.includes(p)) : []);

  const px = (v, lon) => ((lon - v.lo0) * v.k / v.w) * W;
  const py = (v, lat) => ((v.la1 - lat) / v.h) * H;
  /** The outlines of the countries that touch the view, as one path each. */
  function pathsOf(v, stride) {
    if (!countries) return [];
    const out = [];
    for (const c of countries) {
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
      if (d) out.push({ id: c.id, d, de: c.name, name: locale().startsWith('de') ? c.name : (c.en ?? c.name), c: c.c, big: (b2 - b0) * (b3 - b1) });
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
  const hit = (de) => landOf.has(de);
  const eMap = $derived(europe ? { paths: pathsOf(europe.v, 4), pts: europe.pts, v: europe.v } : null);
  const zMap = $derived(zoom ? { paths: pathsOf(zoom.v, 1), pts: zoom.pts, v: zoom.v } : null);
  const kind = (p) => (clashKeys.has(p.key) ? 'clash' : p.row.registered ? 'reg' : 'fav');
</script>

<div class="mp" data-atlas-map>
  <div class="mp-head"><div><h2 class="mp-h">{t('Start places of my races')}</h2><small>{t('{n} races: {a} registered, {b} favourites', { n: mine.length, a: mine.filter((r) => r.registered).length, b: mine.filter((r) => !r.registered && r.fav).length })}</small></div></div>
  {#if !numbered.length}
    <div class="mp-empty" data-atlas-map-empty>
      <p>{mine.length ? t('The start places of your races have no position in the file yet (lat and lon). Then they cannot stand on the map.') : t('Star races or mark them as registered in the list: they stand here on the map.')}</p>
    </div>
  {:else}
    <div class="mp-grid">
      {#each [eMap, zMap] as m, mi (mi)}
        {#if m}
          <svg viewBox={`0 0 ${W} ${H}`} class="mp-svg" role="img" aria-label={mi ? t('Map of the closer region') : t('Map of Europe with my races')} data-atlas-mapsvg={mi ? 'zoom' : 'europe'}>
            <rect class="sea" width={W} height={H} rx="12" />
            {#each m.paths as c (c.id)}<path class="land" class:mine={hit(c.de)} d={c.d} />{/each}
            {#if mi}
              {#each m.paths.filter((c) => hit(c.de) || c.big > 4) as c (c.id + 'n')}
                {@const cx = px(m.v, c.c[0])}
                {@const cy = py(m.v, c.c[1])}
                {#if cx > 30 && cx < W - 30 && cy > 20 && cy < H - 20}<text class="cname" x={cx} y={cy} text-anchor="middle">{c.name.toUpperCase()}</text>{/if}
              {/each}
            {/if}
            {#each m.pts as p (p.key)}
              <g class="pt {kind(p)}" role="button" tabindex="0" aria-label={p.row.name} onclick={() => onopen(p.row)} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onopen(p.row)} data-atlas-point={p.key}>
                <circle cx={px(m.v, p.lon)} cy={py(m.v, p.lat)} r={mi ? 14 : 10} />
                <text x={px(m.v, p.lon)} y={py(m.v, p.lat) + (mi ? 5 : 4)} text-anchor="middle" font-size={mi ? 14 : 11}>{p.n}</text>
              </g>
            {/each}
          </svg>
        {/if}
      {/each}
    </div>
    {#if outside.length}<p class="mp-note">{t('On the Europe map only: {names}.', { names: outside.map((p) => `${p.n} ${p.row.name}${p.row.land ? ` (${p.row.land})` : ''}`).join(' · ') })}</p>{/if}
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
  .mp-note {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .mp-note {
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
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 14px;
  }
  .mp-svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .sea {
    fill: var(--info-soft);
  }
  .land {
    fill: var(--paper-2);
    stroke: var(--paper);
    stroke-width: 1.4;
    stroke-linejoin: round;
  }
  .land.mine {
    fill: var(--accent-soft);
  }
  .cname {
    fill: var(--ink-3);
    font-size: var(--fs-small);
    letter-spacing: 0.18em;
    pointer-events: none;
  }
  .pt {
    cursor: pointer;
  }
  .pt circle {
    fill: var(--accent);
    stroke: var(--paper);
    stroke-width: 2;
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
