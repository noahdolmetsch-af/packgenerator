<script>
  /**
   * Tour-Seite, Noah 20.10.2026 «1a» (Gestaltungsregeln B, 6 Kopfbereich): a drawn landscape at the top of
   * the tour, no photo. Two quiet hills behind; in front the tour's own elevation profile as a hill, with
   * the route on it as a dashed line from the start to the flag. Drawn in code, works offline.
   * points: [[km, m], …] (empty: a gentle made-up hill); chips: short lines on it (date, weather);
   * warm: 0.174 (UI-Ziele #10) the countdown chip in a warm colour, first («In 5 Tagen», «Zurück seit 2 Tagen»).
   */
  let { points = [], chips = [], warm = '' } = $props();

  let w = $state(800);
  const W = $derived(Math.max(300, Math.round(w || 800)));
  const H = 150;
  const front = $derived.by(() => {
    const pts = points.length > 1 ? points : Array.from({ length: 21 }, (_, i) => [i, 300 + 120 * Math.sin(i / 3.2) + 60 * Math.sin(i / 1.4)]);
    const end = pts.at(-1)[0] || 1;
    const ms = pts.map((p) => p[1]);
    const lo = Math.min(...ms);
    const hi = Math.max(lo + 50, Math.max(...ms));
    // the hill takes the lower 70 %, the highest point 30 px under the top
    return pts.map(([km, m]) => [(km / end) * W, H - 22 - ((m - lo) / (hi - lo)) * (H * 0.62)]);
  });
  const line = $derived(front.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${(y - 6).toFixed(1)}`).join(' '));
  const hill = $derived(`M0,${H} ` + front.map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ` L${W},${H} Z`);
  const back = (amp, base, f, ph) => `M0,${H} ` + Array.from({ length: 41 }, (_, i) => `L${((i / 40) * W).toFixed(1)},${(base - amp * Math.sin(i / f + ph)).toFixed(1)}`).join(' ') + ` L${W},${H} Z`;
  const flag = $derived(front.at(-1));
</script>

<div class="land" bind:clientWidth={w} data-tour-landscape>
  <svg viewBox="0 0 {W} {H}" aria-hidden="true" preserveAspectRatio="none">
    <circle cx={W * 0.82} cy="34" r="16" class="sun" />
    <path d={back(18, 70, 5, 0.6)} class="b2" />
    <path d={back(14, 92, 3.4, 2)} class="b1" />
    <path d={hill} class="f" />
    <path d={line} class="route" />
    <circle cx={front[0][0] + 4} cy={front[0][1] - 6} r="4" class="st" />
    {#if flag}<path d="M{flag[0] - 6},{flag[1] - 6} v-20 l12,5 l-12,5" class="flag" />{/if}
  </svg>
  {#if chips.length || warm}<p class="chips">{#if warm}<span class="warm" data-tour-countdown>{warm}</span>{/if}{#each chips as c (c)}<span>{c}</span>{/each}</p>{/if}
</div>

<style>
  .land {
    position: relative;
    overflow: hidden;
    border-radius: 22px;
    background: color-mix(in srgb, var(--accent-soft) 45%, var(--paper));
  }
  svg {
    display: block;
    width: 100%;
    height: 150px;
  }
  .sun {
    fill: color-mix(in srgb, var(--l2) 30%, var(--paper));
  }
  .b2 {
    fill: color-mix(in srgb, var(--accent) 14%, var(--paper));
  }
  .b1 {
    fill: color-mix(in srgb, var(--accent) 24%, var(--paper));
  }
  .f {
    fill: color-mix(in srgb, var(--accent) 40%, var(--paper));
  }
  .route {
    fill: none;
    stroke: var(--paper);
    stroke-width: 2.5;
    stroke-dasharray: 7 6;
    stroke-linecap: round;
  }
  .st {
    fill: var(--paper);
    stroke: var(--accent);
    stroke-width: 2;
  }
  .flag {
    fill: var(--paper);
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  .chips {
    position: absolute;
    top: 12px;
    left: 14px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    max-width: calc(100% - 80px);
    margin: 0;
  }
  .chips span {
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .chips .warm {
    background: var(--warm-soft);
    color: var(--ink);
    font-weight: 600;
  }
</style>
