<script>
  /**
   * Paket U2 «Karte» › Höhenprofil unter der Karte: the elevation profile as one drawing, the sectors in
   * the colours of the map, the stretches you ride in the dark (darkRiding of the plan) and the snow.
   * Tap or drag on it (or the arrow keys): the cursor moves, the map shows the place and the line below
   * says km, height, gradient and when you are expected there (etaOf of the plan).
   * profile [[km, m]]; sectors [{ name, fromKm, toKm }]; nights / snow [{ fromKm, toKm }];
   * cursorKm (bindable); etaOf(km) → ms or null; onmove(km).
   */
  import { sampleProfile, profileRange, profileAt } from './maplib.js';
  import { hhmm } from '../race/race.js';
  import { t, locale } from '../i18n.svelte.js';

  let { profile = [], sectors = [], nights = [], snow = [], marks = [], cursorKm = $bindable(null), etaOf = null, onmove = null } = $props();

  const W = 1000;
  const H = 160;
  const TOP = 8;
  const pts = $derived(sampleProfile(profile, 400));
  const r = $derived(profileRange(profile));
  const total = $derived(r.km || 1);
  const x = (km) => (Math.max(0, Math.min(total, km)) / total) * W;
  const y = (m) => TOP + (1 - (m - r.lo) / (r.hi - r.lo || 1)) * (H - TOP);
  const area = $derived(pts.length > 1 ? `M0,${H} ${pts.map((p) => `L${x(p.km).toFixed(1)},${y(p.m).toFixed(1)}`).join(' ')} L${W},${H} Z` : '');
  const ridge = $derived(pts.length > 1 ? `M${pts.map((p) => `${x(p.km).toFixed(1)},${y(p.m).toFixed(1)}`).join(' L')}` : '');
  const at = $derived(cursorKm == null ? null : profileAt(profile, cursorKm));
  const eta = $derived(at && etaOf ? etaOf(at.km) : null);
  const when = (ms) => (Number.isFinite(ms) ? `${new Date(ms).toLocaleDateString(locale(), { weekday: 'short' })} ${hhmm(ms)}` : '');
  const fmtKm = (k) => (k >= 100 ? Math.round(k) : Math.round(k * 10) / 10);

  let box = $state();
  let down = false;
  function kmFrom(e) {
    const b = box.getBoundingClientRect();
    return Math.round(Math.max(0, Math.min(1, (e.clientX - b.left) / (b.width || 1))) * total * 10) / 10;
  }
  function go(km) {
    cursorKm = Math.max(0, Math.min(total, km));
    onmove?.(cursorKm);
  }
  function key(e) {
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[e.key];
    if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(total);
    else if (step) go((cursorKm ?? 0) + step);
    else return;
    e.preventDefault();
  }
</script>

{#if pts.length > 1}
  <div class="ps" data-profile>
    <div class="ps-axis">
      <span>{Math.round(r.hi)} m</span>
      <span>{Math.round(r.lo)} m</span>
    </div>
    <div
      class="ps-box"
      bind:this={box}
      role="slider"
      tabindex="0"
      aria-label={t('Elevation profile: move along the route')}
      aria-valuemin="0"
      aria-valuemax={Math.round(total)}
      aria-valuenow={Math.round(cursorKm ?? 0)}
      aria-valuetext={at ? t('km {km}, {m} m', { km: fmtKm(at.km), m: at.m }) : t('No point chosen')}
      onkeydown={key}
      onpointerdown={(e) => {
        down = true;
        box.setPointerCapture?.(e.pointerId);
        go(kmFrom(e));
      }}
      onpointermove={(e) => down && go(kmFrom(e))}
      onpointerup={() => (down = false)}
      onpointercancel={() => (down = false)}
      data-profile-box
    >
      <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true">
        {#each sectors as s, i (i)}
          <rect class="ps-sec s{i % 6}" x={x(s.fromKm)} y="0" width={Math.max(0, x(s.toKm) - x(s.fromKm))} height={H} />
        {/each}
        {#each nights as n, i (i)}
          <rect class="ps-night" x={x(n.fromKm)} y="0" width={Math.max(1, x(n.toKm) - x(n.fromKm))} height={H} />
        {/each}
        <path class="ps-area" d={area} />
        <path class="ps-ridge" d={ridge} vector-effect="non-scaling-stroke" />
        {#each snow as s, i (i)}
          <rect class="ps-snow" class:lies={s.state === 'lies'} x={x(s.fromKm)} y="0" width={Math.max(2, x(s.toKm) - x(s.fromKm))} height="7" />
        {/each}
        {#each sectors.slice(1) as s, i (i)}
          <line class="ps-cut" x1={x(s.fromKm)} x2={x(s.fromKm)} y1="0" y2={H} vector-effect="non-scaling-stroke" />
        {/each}
        {#each marks as m, i (i)}
          <line class="ps-mark" x1={x(m.km)} x2={x(m.km)} y1={H - 14} y2={H} vector-effect="non-scaling-stroke" />
        {/each}
        {#if at}
          <line class="ps-cur" x1={x(at.km)} x2={x(at.km)} y1="0" y2={H} vector-effect="non-scaling-stroke" />
        {/if}
      </svg>
    </div>
    <div class="ps-km"><span>0</span><span>{Math.round(total / 2)}</span><span>{Math.round(total)} km</span></div>
    <p class="ps-read" aria-live="polite" data-profile-read>
      {#if at}
        <b>{t('km {km}', { km: fmtKm(at.km) })}</b>
        <span>{at.m} m</span>
        <span class:ps-steep={Math.abs(at.grade) >= 8}>{at.grade > 0 ? '+' : ''}{at.grade} %</span>
        {#if eta}<span>{t('there {when}', { when: when(eta) })}</span>{/if}
      {:else}
        {t('Tap or drag on the profile: the map shows the place.')}
      {/if}
    </p>
    {#if nights.length || snow.length}
      <p class="ps-key">
        {#if nights.length}<span class="ps-ki"><span class="ps-k ps-k-night"></span>{t('in the dark (your plan)')}</span>{/if}
        {#if snow.length}<span class="ps-ki"><span class="ps-k ps-k-snow"></span>{t('snow or above the snow line')}</span>{/if}
      </p>
    {/if}
  </div>
{/if}

<style>
  .ps {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    column-gap: 6px;
    row-gap: 2px;
    min-width: 0;
  }
  .ps-axis {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
  .ps-box {
    position: relative;
    height: 140px;
    border-radius: 8px;
    background: var(--paper);
    border: 1px solid var(--line);
    overflow: hidden;
    touch-action: pan-y;
    cursor: crosshair;
  }
  .ps-box:focus-visible {
    outline: var(--focus-ring);
  }
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .ps-sec {
    opacity: 0.1;
  }
  .s0 {
    fill: var(--l1);
  }
  .s1 {
    fill: var(--l2);
  }
  .s2 {
    fill: var(--l3);
  }
  .s3 {
    fill: var(--l4);
  }
  .s4 {
    fill: var(--hi);
  }
  .s5 {
    fill: var(--ok);
  }
  .ps-night {
    fill: var(--ink);
    opacity: 0.14;
  }
  .ps-area {
    fill: var(--accent-soft);
  }
  .ps-ridge {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  .ps-snow {
    fill: var(--l3);
    opacity: 0.55;
  }
  .ps-snow.lies {
    opacity: 0.9;
  }
  .ps-cut {
    stroke: var(--line-strong);
    stroke-width: 1;
    stroke-dasharray: 3 3;
  }
  .ps-mark {
    stroke: var(--brand);
    stroke-width: 2;
  }
  .ps-cur {
    stroke: var(--hi);
    stroke-width: 2;
  }
  .ps-km {
    grid-column: 2;
    display: flex;
    justify-content: space-between;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-variant-numeric: tabular-nums;
  }
  .ps-read,
  .ps-key {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    margin: 4px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-variant-numeric: tabular-nums;
  }
  .ps-read b {
    color: var(--ink);
  }
  .ps-steep {
    color: var(--bad);
    font-weight: 600;
  }
  .ps-key {
    color: var(--ink-3);
  }
  .ps-ki {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .ps-k {
    flex: none;
    width: 14px;
    height: 10px;
    border-radius: 2px;
  }
  .ps-k-night {
    background: var(--ink);
    opacity: 0.3;
  }
  .ps-k-snow {
    background: var(--l3);
  }
</style>
