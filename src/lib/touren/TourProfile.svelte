<script>
  /**
   * Tour-Seite (Noah 19.10.2026 «1a»): the elevation profile of a finished tour, linked with the map.
   * Move the finger or the mouse over it: a line and «km 12.4 · 840 m» show the spot, and onpoint(share
   * 0…1 of the way) puts a red dot on the map. The arrow keys move along it too.
   * points: [[km, m], …].
   */
  import { t, num } from '../i18n.svelte.js';

  let { points = [], onpoint = null } = $props();

  let box = $state(600); // the measured width: the profile stays 150 px high on every screen
  const W = $derived(Math.max(240, Math.round(box || 600)));
  const H = 150;
  const PAD = { l: 40, r: 8, t: 10, b: 22 };
  const end = $derived(points.at(-1)?.[0] || 1);
  const lo = $derived(Math.floor(Math.min(...points.map((p) => p[1])) / 50) * 50);
  const hi = $derived(Math.max(lo + 100, Math.ceil(Math.max(...points.map((p) => p[1])) / 50) * 50));
  const x = (km) => PAD.l + (km / end) * (W - PAD.l - PAD.r);
  const y = (m) => PAD.t + (1 - (m - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
  const area = $derived(points.length < 2 ? '' : `M${x(points[0][0])},${y(lo)} ` + points.map(([km, m]) => `L${x(km).toFixed(1)},${y(m).toFixed(1)}`).join(' ') + ` L${x(end)},${y(lo)} Z`);
  const top = $derived(Math.max(...points.map((p) => p[1])));

  let at = $state(null); // km under the finger
  const eleAt = (km) => points.reduce((b, p) => (Math.abs(p[0] - km) < Math.abs(b[0] - km) ? p : b), points[0])[1];
  function setKm(km) {
    at = km == null ? null : Math.max(0, Math.min(end, km));
    onpoint?.(at == null ? null : at / end);
  }
  function move(e) {
    const r = e.currentTarget.getBoundingClientRect();
    // the box's own size on screen: the share stays right whatever the app's zoom («Grösse»)
    const sx = ((e.clientX - r.left) / r.width) * W;
    setKm(((sx - PAD.l) / (W - PAD.l - PAD.r)) * end);
  }
  function key(e) {
    const step = end / 50;
    if (e.key === 'ArrowRight') setKm((at ?? 0) + step);
    else if (e.key === 'ArrowLeft') setKm((at ?? end) - step);
    else if (e.key === 'Escape') setKm(null);
    else return;
    e.preventDefault();
  }
</script>

{#if points.length > 1}
  <figure class="tprof" data-tour-profile bind:clientWidth={box}>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
    <svg viewBox="0 0 {W} {H}" role="img" aria-label={t('Elevation profile: move along it to see the spot on the map')} tabindex="0" onpointermove={move} onpointerdown={move} onpointerleave={() => setKm(null)} onkeydown={key} onblur={() => setKm(null)}>
      {#each [lo, hi] as m (m)}
        <line x1={PAD.l} x2={W - PAD.r} y1={y(m)} y2={y(m)} class="grid" />
        <text x={PAD.l - 6} y={y(m) + 4} class="ax" text-anchor="end">{num(m)}</text>
      {/each}
      <text x={PAD.l} y={H - 4} class="ax">0</text>
      <text x={W - PAD.r} y={H - 4} class="ax" text-anchor="end">{num(Math.round(end))} km</text>
      <path d={area} class="area" />
      {#if at != null}
        <line x1={x(at)} x2={x(at)} y1={PAD.t} y2={H - PAD.b} class="cur" />
        <circle cx={x(at)} cy={y(eleAt(at))} r="5" class="dot" />
      {/if}
    </svg>
    <figcaption class="cap num" aria-live="polite" data-profile-at>
      {#if at != null}{t('km {km} · {m} m', { km: num(Math.round(at * 10) / 10), m: num(eleAt(at)) })}{:else}{t('highest point {m} m', { m: num(top) })}{/if}
    </figcaption>
  </figure>
{/if}

<style>
  .tprof {
    margin: 0;
  }
  svg {
    display: block;
    width: 100%;
    height: 150px;
    touch-action: pan-y;
    cursor: crosshair;
    outline-offset: 2px;
  }
  .area {
    fill: var(--accent-soft, var(--paper-2));
    stroke: var(--accent);
    stroke-width: 2;
  }
  .grid {
    stroke: var(--card-line);
    stroke-dasharray: 3 4;
  }
  .ax {
    fill: var(--ink-3);
    font: 400 var(--fs-tiny) var(--font-body);
  }
  .cur {
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  .dot {
    fill: var(--bad);
    stroke: var(--paper);
    stroke-width: 2;
  }
  .cap {
    margin: 4px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
