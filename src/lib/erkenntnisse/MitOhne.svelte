<script>
  /**
   * The little picture of an insight (Noah 23.11.2026 «ja»): the days with it and the days without it side by side. Every
   * day is a dot (its value of y), the mean of each side a line. Only looking: no line between the sides, no verdict.
   * Props: row (a row of insights() with hiVals / loVals), yName (the name of y), withText / withoutText (the two captions).
   */
  import { t, num as fmt } from '../i18n.svelte.js';

  let { row, yName = '', withText = '', withoutText = '' } = $props();

  const W = 300;
  const H = 150;
  const PAD = { l: 34, r: 8, t: 10, b: 8 };
  const all = $derived([...(row.hiVals ?? []), ...(row.loVals ?? [])]);
  const lo = $derived(Math.min(...all));
  const hi = $derived(Math.max(...all));
  const span = $derived(hi - lo || 1);
  const y = (v) => PAD.t + (1 - (v - lo) / span) * (H - PAD.t - PAD.b);
  const colW = (W - PAD.l - PAD.r) / 2;
  /** The dots of one side, spread over the width of its column (a fixed spread: the same picture every time). */
  function dots(vals, col) {
    const sorted = [...vals].sort((a, b) => a - b);
    const per = Math.max(1, Math.ceil(Math.sqrt(sorted.length)));
    return sorted.map((v, i) => ({ cx: PAD.l + col * colW + colW / 2 + ((i % per) - (per - 1) / 2) * Math.min(12, (colW - 24) / per), cy: y(v) }));
  }
  const dotsHi = $derived(dots(row.hiVals ?? [], 0));
  const dotsLo = $derived(dots(row.loVals ?? [], 1));
  const label = $derived(`${yName}: ${withText} ${fmt(row.hi.mean)}, ${withoutText} ${fmt(row.lo.mean)}`);
</script>

<figure class="mo" data-mit-ohne>
  <svg viewBox="0 0 {W} {H}" role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
    <line class="ax" x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} />
    <text class="tick" x={PAD.l - 6} y={y(hi) + 4} text-anchor="end">{fmt(hi)}</text>
    <text class="tick" x={PAD.l - 6} y={y(lo) + 4} text-anchor="end">{fmt(lo)}</text>
    {#each dotsHi as d, i (i)}<circle class="dot on" cx={d.cx} cy={d.cy} r="3.4" />{/each}
    {#each dotsLo as d, i (i)}<circle class="dot off" cx={d.cx} cy={d.cy} r="3.4" />{/each}
    <line class="mean on" x1={PAD.l + 10} x2={PAD.l + colW - 10} y1={y(row.hi.mean)} y2={y(row.hi.mean)} />
    <line class="mean off" x1={PAD.l + colW + 10} x2={PAD.l + 2 * colW - 10} y1={y(row.lo.mean)} y2={y(row.lo.mean)} />
  </svg>
  <figcaption>
    <span class="on"><b>{withText}</b> <small class="num">{t('{n} days, mean {m}', { n: row.hi.n, m: fmt(row.hi.mean) })}</small></span>
    <span class="off"><b>{withoutText}</b> <small class="num">{t('{n} days, mean {m}', { n: row.lo.n, m: fmt(row.lo.mean) })}</small></span>
  </figcaption>
  <p class="how">{t('Every dot is one day. The line is the mean of that side.')}</p>
</figure>

<style>
  .mo {
    margin: 8px 0 0;
    display: grid;
    gap: 6px;
  }
  svg {
    width: 100%;
    max-width: 420px;
    height: auto;
  }
  .ax {
    stroke: var(--line);
    stroke-width: 1;
  }
  .tick {
    fill: var(--ink-3);
    font-size: var(--fs-small);
  }
  .dot.on {
    fill: var(--accent);
    opacity: 0.75;
  }
  .dot.off {
    fill: var(--ink-3);
    opacity: 0.55;
  }
  .mean {
    stroke-width: 3;
    stroke-linecap: round;
  }
  .mean.on {
    stroke: var(--accent);
  }
  .mean.off {
    stroke: var(--ink-2);
  }
  figcaption {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    font-size: var(--fs-small);
  }
  figcaption span {
    display: grid;
    gap: 2px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  figcaption small,
  .how {
    color: var(--ink-3);
  }
  .how {
    margin: 0;
    font-size: var(--fs-small);
  }
</style>
