<script>
  /**
   * Elevation profile of a route (v0.18.0, answer 4b). points: [[km, metres], …].
   * from/to (km): the part to stand out, e.g. today's stage; the rest stays pale.
   * SN2x: marks [{ km, n }]: numbered points (the same numbers as the map and the timeline);
   * cuts [{ km, label }]: a thin dashed line where a day ends.
   * v0.151.0 (HP1–HP5, Noah «1a 2a 3a»): plan = the planned route, drawn as an orange dashed line over
   * the ridden profile, with a small legend; small = a mini profile without axes (Touren, Past trips).
   */
  import { t, num } from '../i18n.svelte.js';
  import { fineOf, segments, heightAt, gradeAt, STEEPNESS } from '../map/fineprofile.js';
  import Readout from '../charts/Readout.svelte';

  /**
   * detail (Noah 23.11.2026 «1-5a», Höhenprofil überall, Idee A): the area is coloured by the steepness like the big
   * profile (green flat, yellow to dark red steeper, blue downhill) and a tap, the mouse or the arrow keys show «km ·
   * height · steepness» of the spot in one line over it. Without detail nothing changes (small stays calm).
   */
  let { points, from = null, to = null, label = 'Elevation profile', marks = [], cuts = [], plan = null, small = false, detail = false } = $props();

  const W = 400;
  const H = $derived(small ? 56 : 120);
  const PAD = $derived(small ? { l: 2, r: 2, t: 4, b: 4 } : { l: 34, r: 6, t: 8, b: 18 });
  const planPts = $derived(plan?.length > 1 ? plan : null);
  const end = $derived(Math.max(points.at(-1)?.[0] || 0, planPts?.at(-1)?.[0] || 0) || 1);
  const eles = $derived([...points, ...(planPts ?? [])].map((p) => p[1]));
  const lo = $derived(Math.floor(Math.min(...eles) / 50) * 50);
  const hi = $derived(Math.max(lo + 100, Math.ceil(Math.max(...eles) / 50) * 50));
  const x = (km) => PAD.l + (km / end) * (W - PAD.l - PAD.r);
  const y = (m) => PAD.t + (1 - (m - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
  const area = (pts) => (pts.length < 2 ? '' : `M${x(pts[0][0])},${y(lo)} ` + pts.map(([km, m]) => `L${x(km).toFixed(1)},${y(m).toFixed(1)}`).join(' ') + ` L${x(pts.at(-1)[0])},${y(lo)} Z`);
  const all = $derived(area(points));
  const planLine = $derived(planPts ? 'M' + planPts.map(([km, m]) => `${x(km).toFixed(1)},${y(m).toFixed(1)}`).join(' L') : '');
  const part = $derived(from == null ? '' : area(points.filter(([km]) => km >= from - 1e-9 && km <= to + 1e-9)));
  const top = $derived(Math.max(...points.map((p) => p[1])));
  // SN2x: the height at a km (the nearest profile point)
  const eleAt = (km) => points.reduce((b, p) => (Math.abs(p[0] - km) < Math.abs(b[0] - km) ? p : b), points[0])[1];
  /* ---------- detail: steepness colours and the spot under the finger ---------- */
  const fine = $derived(detail && !small ? fineOf(null, points) : null);
  const fills = $derived.by(() => {
    if (!fine) return [];
    const by = {};
    for (const s of segments(fine, 0, fine.km)) {
      const [x0, x1] = [x(s.fromKm).toFixed(1), x(s.toKm).toFixed(1)];
      (by[s.key] ??= []).push(`M${x0},${y(lo).toFixed(1)} L${x0},${y(heightAt(fine, s.fromKm)).toFixed(1)} L${x1},${y(heightAt(fine, s.toKm)).toFixed(1)} L${x1},${y(lo).toFixed(1)} Z`);
    }
    return STEEPNESS.filter((c) => by[c.key]).map((c) => ({ key: c.key, d: by[c.key].join(' ') }));
  });
  const ridge = $derived(fine ? 'M' + points.map(([km, m]) => `${x(km).toFixed(1)},${y(m).toFixed(1)}`).join(' L') : '');
  let at = $state(null); // km under the finger
  let svg = $state();
  const atInfo = $derived(fine && at != null ? { km: at, m: Math.round(heightAt(fine, at)), grade: gradeAt(fine, at, 0.1) } : null);
  const gradeText = (g) => `${g > 0 ? '+' : ''}${num(g)} %`;
  const readout = $derived(
    atInfo
      ? { title: t('km {km}', { km: num(Math.round(atInfo.km * 10) / 10) }), items: [{ label: t('Height'), value: `${num(atInfo.m)} m` }, { label: t('Gradient'), value: gradeText(atInfo.grade) }] }
      : { title: t('Whole route'), items: [{ label: t('Highest point'), value: `${num(Math.round(top))} m` }, { label: t('Lowest point'), value: `${num(Math.round(Math.min(...points.map((p) => p[1]))))} m` }] },
  );
  function setAt(e) {
    const r = svg.getBoundingClientRect();
    // the box's own size on screen: the km stays right whatever the app's zoom («Grösse»)
    const sx = ((e.clientX - r.left) / (r.width || 1)) * W;
    at = Math.max(0, Math.min(fine.km, ((sx - PAD.l) / (W - PAD.l - PAD.r)) * end));
  }
  function key(e) {
    const step = fine.km / 50;
    if (e.key === 'ArrowRight') at = Math.min(fine.km, (at ?? 0) + step);
    else if (e.key === 'ArrowLeft') at = Math.max(0, (at ?? fine.km) - step);
    else if (e.key === 'Escape') at = null;
    else return;
    e.preventDefault();
  }
  const ticks = $derived.by(() => {
    const step = end > 200 ? 50 : end > 80 ? 20 : end > 30 ? 10 : 5;
    const out = [];
    for (let k = 0; k <= end; k += step) out.push(k);
    return out;
  });
</script>

{#if fine}<div data-profile-at><Readout title={readout.title} items={readout.items} /></div>{/if}
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<svg bind:this={svg} class="prof" class:small class:detail={!!fine} viewBox="0 0 {W} {H}" role="img" aria-label={t('{label}: {lo} to {top} m over {km} km', { label: t(label), lo, top, km: Math.round(points.at(-1)?.[0] || 0) })} tabindex={fine ? 0 : null} onpointermove={fine ? setAt : null} onpointerdown={fine ? setAt : null} onpointerleave={fine ? (e) => e.pointerType === 'mouse' && (at = null) : null} onkeydown={fine ? key : null} onblur={fine ? () => (at = null) : null}>
  {#if fine}
    {#each fills as f (f.key)}<path d={f.d} class="st {f.key}" />{/each}
    {#if from != null}
      <rect class="dim" x={PAD.l} y={PAD.t} width={Math.max(0, x(from) - PAD.l)} height={y(lo) - PAD.t} />
      <rect class="dim" x={x(to)} y={PAD.t} width={Math.max(0, W - PAD.r - x(to))} height={y(lo) - PAD.t} />
    {/if}
    <path d={ridge} class="ridge" />
  {:else}
    <path d={all} class:pale={from != null} class="a" />
    {#if part}<path d={part} class="a cur" />{/if}
  {/if}
  {#if planLine}<path d={planLine} class="plan" />{/if}
  {#if !small}
    <line x1={PAD.l} x2={W - PAD.r} y1={y(lo)} y2={y(lo)} class="ax" />
    <text x={PAD.l - 4} y={y(hi) + 4} class="t r">{hi}</text>
    <text x={PAD.l - 4} y={y(lo)} class="t r">{lo}</text>
    {#each ticks as k (k)}<text x={x(k)} y={H - 4} class="t c">{k}</text>{/each}
    {#each cuts as c (c.km)}<line x1={x(c.km)} x2={x(c.km)} y1={PAD.t} y2={y(lo)} class="cut" />{#if c.label}<text x={x(c.km) + 3} y={PAD.t + 8} class="t cl">{c.label}</text>{/if}{/each}
    {#if atInfo}<line x1={x(atInfo.km)} x2={x(atInfo.km)} y1={PAD.t} y2={y(lo)} class="at" /><circle cx={x(atInfo.km)} cy={y(atInfo.m)} r="4.5" class="atd" />{/if}
    {#each marks as m (m.n)}<g class="mk"><circle cx={x(m.km)} cy={y(eleAt(m.km))} r="8" /><text x={x(m.km)} y={y(eleAt(m.km)) + 4} class="mn">{m.n}</text></g>{/each}
  {/if}
</svg>
{#if fine}<p class="cl" data-profile-colours>{t('Green is flat, yellow to dark red is steeper, blue is downhill.')}</p>{/if}
{#if planLine && !small}
  <p class="leg"><span><i class="lsw ride" aria-hidden="true"></i>{t('ridden (GPX)')}</span><span><i class="lsw planl" aria-hidden="true"></i>{t('planned')}</span></p>
{/if}

<style>
  .prof {
    display: block;
    width: 100%;
    height: auto;
  }
  .prof.detail {
    /* the steepness colours, the same as the big profile (map/ProfileStrip.svelte) */
    --ps-u0: #bcd9b0;
    --ps-u1: #e9d46c;
    --ps-u2: #f0a33c;
    --ps-u3: #e2692c;
    --ps-u4: #c8331f;
    --ps-u5: #7c1b12;
    --ps-d1: #c4dbef;
    --ps-d2: #8fb6dd;
    --ps-d3: #4d7fb4;
    touch-action: pan-y;
    cursor: crosshair;
    outline-offset: 2px;
  }
  .st {
    stroke-width: 0.6;
    stroke-linejoin: round;
  }
  .st.u0 { fill: var(--ps-u0); stroke: var(--ps-u0); }
  .st.u1 { fill: var(--ps-u1); stroke: var(--ps-u1); }
  .st.u2 { fill: var(--ps-u2); stroke: var(--ps-u2); }
  .st.u3 { fill: var(--ps-u3); stroke: var(--ps-u3); }
  .st.u4 { fill: var(--ps-u4); stroke: var(--ps-u4); }
  .st.u5 { fill: var(--ps-u5); stroke: var(--ps-u5); }
  .st.d1 { fill: var(--ps-d1); stroke: var(--ps-d1); }
  .st.d2 { fill: var(--ps-d2); stroke: var(--ps-d2); }
  .st.d3 { fill: var(--ps-d3); stroke: var(--ps-d3); }
  .ridge {
    fill: none;
    stroke: var(--ink-2);
    stroke-width: 1.2;
  }
  .dim {
    fill: var(--paper);
    opacity: 0.6;
  }
  .at {
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  .atd {
    fill: var(--bad);
    stroke: var(--paper);
    stroke-width: 2;
  }
  .cl {
    margin: 4px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .a {
    fill: var(--ink-2);
  }
  .a.pale {
    fill: var(--line);
  }
  .a.cur {
    fill: var(--ink);
  }
  .ax {
    stroke: var(--ink-3);
    stroke-width: 1;
  }
  .plan {
    fill: none;
    stroke: var(--hi-bright);
    stroke-width: 2;
    stroke-dasharray: 5 4;
  }
  .leg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 6px 0 0;
    font: var(--fs-small) var(--font-body);
    color: var(--ink-3);
  }
  .leg span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .lsw {
    display: inline-block;
    width: 16px;
  }
  .lsw.ride {
    height: 10px;
    border-radius: 2px;
    background: var(--ink-2);
  }
  .lsw.planl {
    height: 0;
    border-top: 2px dashed var(--hi-bright);
  }
  .t {
    font: var(--fs-tiny) var(--font-body);
    fill: var(--ink-3);
  }
  .t.r {
    text-anchor: end;
  }
  .t.c {
    text-anchor: middle;
  }
  /* SN2x: day lines and numbered points */
  .cut {
    stroke: var(--ink-3);
    stroke-width: 1;
    stroke-dasharray: 3 3;
  }
  .t.cl {
    font-size: var(--fs-tiny);
  }
  .mk circle {
    fill: var(--paper);
    stroke: var(--ink);
    stroke-width: 1.2;
  }
  .mn {
    font: 600 var(--fs-tiny) var(--font-body);
    fill: var(--ink);
    text-anchor: middle;
  }
</style>
