<script>
  /**
   * TR7e «Effizienz: Watt pro Herzschlag»: NP ÷ mean heart rate of the calm rides (main zone Z2) of the last
   * four months as dots, with a straight trend. Only rides with a power meter and heart rate; at least 4.
   * weeks.js effPoints.
   */
  import AnaCard from '../AnaCard.svelte';
  import { t, locale } from '../../i18n.svelte.js';
  import { zones } from '../../strava/zones.svelte.js';
  import { effPoints, niceTicks, monthStart, daysBetween, EFF_MIN, EFF_MONTHS } from './weeks.js';

  let { acts = [], today = '' } = $props();
  const data = $derived(today ? effPoints(acts, today, zones.bounds) : null);
  const has = $derived(!!data && data.pts.length >= EFF_MIN && !!data.trend);
  const f2 = (v) => Number(v).toLocaleString(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const monthOf = (day, month = 'long') => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { month, timeZone: 'UTC' });

  let w = $state(0);
  const H = 110;
  const T = 10;
  const L = 42;
  const R = 10;
  const width = $derived(Math.max(240, w || 600));
  const ax = $derived.by(() => {
    if (!has) return null;
    const vals = [...data.pts.map((p) => p.v), data.trend.start, data.trend.end];
    return niceTicks(Math.min(...vals), Math.max(...vals), 3);
  });
  const X = (x) => L + (x / Math.max(1, data.span)) * (width - L - R);
  const Y = (v) => T + ((ax.hi - v) / (ax.hi - ax.lo)) * H;
  const months = $derived(has ? Array.from({ length: EFF_MONTHS }, (_, i) => monthStart(today, EFF_MONTHS - 1 - i)).map((d) => ({ d, x: daysBetween(data.from, d) })) : []);
  const grows = $derived(has && data.trend.end - data.trend.start >= 0.005);
  const now = $derived(has ? f2(data.trend.end) : '');
  const then = $derived(has ? f2(data.trend.start) : '');
  const thenMonth = $derived(has ? monthOf(data.pts[0].day) : '');
  const cap = $derived(
    grows
      ? t('More watts at the same heart rate means: the base is growing. Today {now} W per beat, in {month} {then}. Only rides with a power meter and heart rate.', { now, then, month: thenMonth })
      : t('Watts per heartbeat on calm rides: today {now}, in {month} {then}. Only rides with a power meter and heart rate.', { now, then, month: thenMonth }),
  );
  const label = $derived(has ? t('{n} calm rides; trend from {then} to {now} W per beat', { n: data.pts.length, now, then }) : '');
</script>

{#if has}
  <AnaCard key="eff" wide sub={t('NP ÷ mean heart rate, only calm rides (mostly Z2)')}>
    <div class="plot" bind:clientWidth={w}>
      <svg width={width} height={H + T + 30} viewBox="0 0 {width} {H + T + 30}" role="img" aria-label={label}>
        {#each ax.ticks as v (v)}
          <line x1={L} x2={width - R} y1={Y(v)} y2={Y(v)} class="grid" />
          <text x={L - 8} y={Y(v) + 4} text-anchor="end">{f2(v)}</text>
        {/each}
        {#each data.pts as p, i (i)}
          <circle cx={X(p.x)} cy={Y(p.v)} r="3.5" />
        {/each}
        <line class="trend" x1={X(data.trend.x0)} y1={Y(data.trend.start)} x2={X(data.span)} y2={Y(data.trend.end)} />
        {#each months as m, i (m.d)}
          <text x={X(m.x)} y={H + T + 24} text-anchor={i === 0 ? 'start' : 'middle'}>{monthOf(m.d, 'short')}</text>
        {/each}
      </svg>
    </div>
    <ul class="leg">
      <li><i class="k"></i>{t('Trend')}</li>
    </ul>
    <p class="cap">{cap}</p>
  </AnaCard>
{/if}

<style>
  .plot {
    min-width: 0;
    overflow: hidden;
  }
  svg {
    display: block;
  }
  text {
    fill: var(--ink-3);
    font: 400 var(--fs-tiny) / 1 var(--font-body);
  }
  .grid {
    stroke: var(--line);
    stroke-dasharray: 3 4;
  }
  circle {
    fill: var(--ch-w);
    opacity: 0.45;
  }
  .trend {
    stroke: var(--ch-w);
    stroke-width: 2.5;
    stroke-linecap: round;
  }
  .leg {
    display: flex;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .leg li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .k {
    display: inline-block;
    width: 14px;
    height: 0;
    border-top: 3px solid var(--ch-w);
  }
</style>
