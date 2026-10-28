<script>
  /**
   * Tour-Seite (Noah 19.10.2026 «1a»): the elevation profile of a finished tour, linked with the map.
   * Move the finger or the mouse over it: a line and «km 12.4 · 840 m» show the spot, and onpoint(share
   * 0…1 of the way) puts a red dot on the map. The arrow keys move along it too.
   * points: [[km, m], …].
   */
  import { t, num } from '../i18n.svelte.js';
  import { niceScale } from '../charts/axis.js';
  import GridLines from '../charts/GridLines.svelte';
  import Readout from '../charts/Readout.svelte';
  import DataTable from '../charts/DataTable.svelte';
  import Seg from '../ui/Seg.svelte';

  let { points = [], onpoint = null } = $props();

  let box = $state(600); // the measured width: the profile stays 150 px high on every screen
  const W = $derived(Math.max(240, Math.round(box || 600)));
  const H = 150;
  const PAD = { l: 52, r: 8, t: 10, b: 22 };
  const end = $derived(points.at(-1)?.[0] || 1);
  // «Genaue Werte» (Noah 27.10.2026): round height steps with grid lines, round km steps under it
  const mSc = $derived(niceScale(points.map((p) => p[1]), { count: 3 }));
  const lo = $derived(mSc.lo);
  const hi = $derived(mSc.hi);
  const kmTicks = $derived(niceScale([0, end], { zero: true, count: 4 }).ticks.filter((k) => k <= end + 1e-9));
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
  // «Diagramme zum Antippen» (Noah 27.10.2026): the exact spot in one line over the profile, the same as rows
  const readout = $derived(
    at != null
      ? { title: t('km {km}', { km: num(Math.round(at * 10) / 10) }), items: [{ label: t('Height'), value: `${num(eleAt(at))} m` }] }
      : { title: t('Whole tour|profile'), items: [{ label: t('Highest point'), value: `${num(top)} m` }, { label: t('Lowest point'), value: `${num(Math.min(...points.map((p) => p[1])))} m` }] },
  );
  let view = $state('chart');
  const table = $derived({ head: ['km', `${t('Height')} (m)`], rows: niceScale([0, end], { zero: true, count: 10 }).ticks.filter((k) => k <= end + 1e-9).map((k) => ({ key: String(k), cells: [num(k), num(eleAt(k))] })) });

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
    <div class="vw"><Seg small full={false} label={t('Show as')} value={view} onchange={(v) => (view = v)} options={[{ key: 'chart', name: t('Chart|table') }, { key: 'table', name: t('As table') }]} /></div>
    {#if view === 'table'}
    <DataTable head={table.head} rows={table.rows} limit={24} />
    {:else}
    <div data-profile-at><Readout title={readout.title} items={readout.items} /></div>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
    <svg viewBox="0 0 {W} {H}" role="img" aria-label={t('Elevation profile: move along it to see the spot on the map')} tabindex="0" onpointermove={move} onpointerdown={move} onpointerleave={() => setKm(null)} onkeydown={key} onblur={() => setKm(null)}>
      <GridLines ticks={mSc.ticks} {y} x1={PAD.l} x2={W - PAD.r} />
      {#each mSc.ticks as m, i (m)}<text x={PAD.l - 6} y={y(m) + 4} class="ax" text-anchor="end" data-profile-tick>{num(m)}{i === mSc.ticks.length - 1 ? ' m' : ''}</text>{/each}
      {#each kmTicks as k, i (k)}<text x={x(k)} y={H - 4} class="ax" text-anchor={i === 0 ? 'start' : x(k) > W - PAD.r - 30 ? 'end' : 'middle'}>{num(k)}{i === kmTicks.length - 1 ? ' km' : ''}</text>{/each}
      <path d={area} class="area" />
      {#if at != null}
        <line x1={x(at)} x2={x(at)} y1={PAD.t} y2={H - PAD.b} class="cur" />
        <circle cx={x(at)} cy={y(eleAt(at))} r="5" class="dot" />
      {/if}
    </svg>
    {/if}
    <figcaption class="cap">{t('Point at the profile for the height at that spot.')}</figcaption>
  </figure>
{/if}

<style>
  .tprof {
    display: grid;
    gap: 6px;
    margin: 0;
  }
  .vw {
    display: flex;
    justify-content: flex-end;
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
