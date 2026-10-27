<script>
  /**
   * Tour-Seite «wie komoot» (Noah 20.10.2026: «ich möchte 1:1 die details aus komoot»): under the map
   *   - the fine elevation profile of the race and plan pages (map/ProfileStrip.svelte): coloured by the
   *     gradient, km and m axes, zoom, «Select stretch» for the numbers of a stretch, the finger shows the
   *     spot on the map (onkm);
   *   - Anstieg, Abstieg, Höchster Punkt, Tiefster Punkt of the whole tour;
   *   - the speed profile over the time, the height behind it; tap or drag over it for the speed and the
   *     time of a stretch; under it Ø speed, moving time and the whole time.
   * Data: tourcourse.js from the details Strava sends (dprof, sprof); without them the plain profile of the
   * page stays (Tour.svelte) and a line says that it comes with the next fetch.
   */
  import ProfileStrip from '../../map/ProfileStrip.svelte';
  import { rangeOf, gainOf } from '../../map/fineprofile.js';
  import { courseOf, speedOf, speedIn } from '../tourcourse.js';
  import { t, locale } from '../../i18n.svelte.js';
  import { rideTimeS, longTimeS, hours } from '../../review/fmt.js';

  /** acts: the activities of the tour; trip: the trip (for its GPX route); moving, elapsed in seconds; onkm(share 0…1 | null). */
  let { acts = [], trip = null, moving = null, elapsed = null, onkm = null } = $props();

  const course = $derived(courseOf(acts, trip));
  // Strava check #7 (21.10.2026): the ascent of the rides is Strava's own number (its smoothing), the profile
  // only draws; summed from the profile it came out higher (↑ 364 instead of 337 m)
  const rideUp = $derived(course?.src === 'ride' ? Math.round(acts.reduce((s, a) => s + (Number(a?.own?.hm ?? a?.hm) > 0 ? Number(a.own?.hm ?? a.hm) : 0), 0)) || null : null);
  const whole = $derived(course ? { ...gainOf(course.fine), ...rangeOf(course.fine), ...(rideUp ? { up: rideUp } : {}) } : null);
  const total = $derived(course?.fine?.km || 1);
  let cursorKm = $state(null);
  let view = $state(null);

  const num = (v, d = 0) => (Number.isFinite(v) ? v.toLocaleString(locale(), { maximumFractionDigits: d, minimumFractionDigits: d }) : '–');
  const secs = rideTimeS;
  const hm = (min) => `${Math.floor(min / 60)}:${String(Math.round(min % 60)).padStart(2, '0')}`;

  /* ---------- the speed profile ---------- */
  const sp = $derived(speedOf(acts));
  const W = 1000;
  const H = 180;
  const PAD = { l: 0, r: 0, t: 8, b: 0 };
  const top = $derived(sp ? Math.max(10, Math.ceil(sp.max / 10) * 10) : 10);
  const X = (min) => PAD.l + (min / (sp?.end || 1)) * (W - PAD.l - PAD.r);
  const Y = (v) => PAD.t + (1 - v / top) * (H - PAD.t - PAD.b);
  const area = $derived(sp ? `M${X(sp.pts[0][0])},${Y(0)} ` + sp.pts.map(([m, v]) => `L${X(m).toFixed(1)},${Y(v).toFixed(1)}`).join(' ') + ` L${X(sp.pts.at(-1)[0])},${Y(0)} Z` : '');
  const eleLine = $derived.by(() => {
    if (!sp || sp.ele.length < 2) return '';
    const hs = sp.ele.map((p) => p[1]);
    const lo = Math.min(...hs);
    const hi = Math.max(lo + 50, Math.max(...hs));
    const yE = (h) => PAD.t + (1 - (h - lo) / (hi - lo)) * (H - PAD.t - PAD.b) * 0.9 + (H - PAD.t - PAD.b) * 0.1;
    return `M${X(sp.ele[0][0])},${Y(0)} ` + sp.ele.map(([m, h]) => `L${X(m).toFixed(1)},${yE(h).toFixed(1)}`).join(' ') + ` L${X(sp.ele.at(-1)[0])},${Y(0)} Z`;
  });
  const yTicks = $derived([0, top / 3, (2 * top) / 3, top].map((v) => ({ v, y: Y(v) })));
  const xTicks = $derived(sp ? Array.from({ length: 6 }, (_, i) => (sp.end * i) / 5).map((m) => ({ m, x: X(m) })) : []);

  let svg = $state();
  let sel = $state(null); // { a, b } minutes
  let at = $state(null); // minute under the finger
  let dragFrom = null;
  const minOf = (e) => {
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    return Math.max(0, Math.min(sp.end, ((px - PAD.l) / (W - PAD.l - PAD.r)) * sp.end));
  };
  function down(e) {
    if (!sp) return;
    dragFrom = minOf(e);
    sel = null;
    at = dragFrom;
    svg.setPointerCapture?.(e.pointerId);
  }
  function move(e) {
    if (!sp) return;
    at = minOf(e);
    if (dragFrom != null && Math.abs(at - dragFrom) > sp.end / 200) sel = { a: Math.min(dragFrom, at), b: Math.max(dragFrom, at) };
  }
  function up() {
    dragFrom = null;
  }
  function key(e) {
    if (!sp) return;
    const stepMin = sp.end / 100;
    if (e.key === 'ArrowRight') (at = Math.min(sp.end, (at ?? 0) + stepMin)), e.preventDefault();
    else if (e.key === 'ArrowLeft') (at = Math.max(0, (at ?? 0) - stepMin)), e.preventDefault();
    else if (e.key === 'Escape') (sel = null), (at = null);
  }
  const speedAt = (m) => (sp ? sp.pts.reduce((b, p) => (Math.abs(p[0] - m) < Math.abs(b[0] - m) ? p : b), sp.pts[0])[1] : null);
  const selStats = $derived(sel ? speedIn(sp, sel.a, sel.b) : null);
  const avg = $derived(sp ? speedIn(sp, 0, sp.end)?.kmh : null);
</script>

{#if course}
  <div class="tc" data-tour-course={course.src}>
    <h3 class="tc-h">{t('Elevation profile')}</h3>
    <ProfileStrip fine={course.fine} upWhole={rideUp} bind:view bind:cursorKm onmove={(km) => onkm?.(km == null ? null : km / total)} />
    <dl class="tc-sum" data-tour-course-sum>
      <div><dt>{t('Ascent')}</dt><dd class="num">{num(whole.up)} m</dd></div>
      <div><dt>{t('Descent')}</dt><dd class="num">{num(whole.down)} m</dd></div>
      <div><dt>{t('Highest point')}</dt><dd class="num">{num(whole.hi)} m</dd></div>
      <div><dt>{t('Lowest point')}</dt><dd class="num">{num(whole.lo)} m</dd></div>
    </dl>
    {#if course.src === 'route'}<p class="tc-hint">{t('From the GPX route of the trip; the ride itself comes with the next fetch from Strava.')}</p>{/if}
  </div>
{/if}

{#if sp}
  <div class="tc" data-tour-speed>
    <h3 class="tc-h">{t('Speed profile')}</h3>
    <p class="tc-hint" aria-live="polite">
      {#if selStats}{t('{a} to {b} h: Ø {v} km/h over {t}', { a: hm(sel.a), b: hm(sel.b), v: num(selStats.kmh, 1), t: hm(selStats.min) })}{:else if at != null}{t('{a} h: {v} km/h', { a: hm(at), v: num(speedAt(at), 1) })}{:else}{t('Tap or drag over the profile to see the numbers of a stretch.')}{/if}
    </p>
    <div class="tc-plot">
    <div class="tc-y" aria-hidden="true">{#each yTicks as g (g.v)}<span class="tick y" style:top="{(g.y / H) * 100}%">{num(g.v, 0)}</span>{/each}</div>
    <div class="tc-box">
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <svg bind:this={svg} viewBox="0 0 {W} {H}" preserveAspectRatio="none" class="tc-svg" role="img" tabindex="0" aria-label={t('Speed over the time of the tour, the height behind it')} onpointerdown={down} onpointermove={move} onpointerup={up} onpointerleave={() => dragFrom == null && (at = null)} onkeydown={key}>
      {#each yTicks as g (g.v)}<line class="grid" x1={PAD.l} x2={W - PAD.r} y1={g.y} y2={g.y} />{/each}
      {#each xTicks as g (g.m)}<line class="grid" x1={g.x} x2={g.x} y1={PAD.t} y2={H - PAD.b} />{/each}
      {#if eleLine}<path class="ele" d={eleLine} />{/if}
      <path class="spd" d={area} />
      {#if sel}<rect class="tc-range" x={X(sel.a)} y={PAD.t} width={Math.max(1, X(sel.b) - X(sel.a))} height={H - PAD.t - PAD.b} />{/if}
      {#if at != null}<line class="cur" x1={X(at)} x2={X(at)} y1={PAD.t} y2={H - PAD.b} />{/if}
    </svg>
    </div>
    <span class="tick unit" aria-hidden="true">km/h</span>
    <div class="tc-x" aria-hidden="true">{#each xTicks as g, i (g.m)}<span class="tick x" class:first={i === 0} class:last={i === xTicks.length - 1} style:left="{(g.x / W) * 100}%">{hm(g.m)}</span>{/each}</div>
    </div>
    <dl class="tc-sum">
      <div><dt>{t('Speed|komoot')}</dt><dd class="num">{num(avg, 1)} km/h</dd></div>
      <div><dt>{t('Moving time')}</dt><dd class="num">{secs(moving)}</dd></div>
      <div><dt>{t('Total time')}</dt><dd class="num">{longTimeS(elapsed)}</dd></div>
    </dl>
  </div>
{/if}

<style>
  .tc {
    display: grid;
    gap: var(--sp-2);
    margin-top: var(--sp-3);
    padding: var(--sp-3);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .tc-h {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .tc-hint {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tc-sum {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px 16px;
    margin: var(--sp-2) 0 0;
    padding-top: var(--sp-2);
    border-top: 1px solid var(--line);
  }
  .tc-sum dd {
    margin: 0;
    font-size: var(--fs-section);
    font-weight: 600;
  }
  .tc-sum dt {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tc-sum div {
    display: flex;
    flex-direction: column-reverse;
  }
  .tc-svg {
    display: block;
    width: 100%;
    height: 170px;
    touch-action: pan-y;
    cursor: crosshair;
  }
  .grid {
    vector-effect: non-scaling-stroke;
    stroke: var(--line);
    stroke-dasharray: 4 4;
  }
  .tc-plot {
    display: grid;
    grid-template-columns: 30px minmax(0, 1fr);
    grid-template-rows: auto 18px;
    gap: 2px 4px;
  }
  .tc-y,
  .tc-box,
  .tc-x {
    position: relative;
  }
  .tc-box {
    grid-column: 2;
  }
  .tc-x {
    grid-column: 2;
  }
  .tc-svg:focus:not(:focus-visible) {
    outline: none;
  }
  .tick {
    position: absolute;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    line-height: 1;
    pointer-events: none;
  }
  .tick.y {
    right: 0;
    transform: translateY(-50%);
  }
  .tick.x {
    top: 4px;
    transform: translateX(-50%);
  }
  .tick.x.first {
    transform: none;
  }
  .tick.x.last {
    transform: translateX(-100%);
  }
  .tick.unit {
    grid-column: 1;
    grid-row: 2;
    position: static;
    align-self: end;
  }
  .ele {
    fill: var(--line);
    opacity: 0.7;
  }
  .spd {
    vector-effect: non-scaling-stroke;
    fill: var(--accent-soft);
    stroke: var(--accent);
    stroke-width: 1.5;
  }
  .tc-range {
    fill: var(--accent);
    opacity: 0.15;
  }
  .cur {
    vector-effect: non-scaling-stroke;
    stroke: var(--ink);
    stroke-width: 2;
  }
</style>
