<script>
  /**
   * TR7d «Fitness, Ermüdung und Form»: from the load of every activity (power, else Relative Effort) the
   * 42-day mean (fitness), the 7-day mean (fatigue) and their difference of the day before (form), one point
   * per week for 16 weeks. Observation only. weeks.js formWeeks.
   */
  import AnaCard from '../AnaCard.svelte';
  import { t } from '../../i18n.svelte.js';
  import { formWeeks, niceTicks, WEEKS } from './weeks.js';

  let { acts = [], today = '' } = $props();
  const data = $derived(today ? formWeeks(acts, today) : null);
  const has = $derived(!!data && data.weeks.some((w) => w.ctl > 0 || w.atl > 0));
  const signed = (v) => (v > 0 ? `+${v}` : String(v));

  let w = $state(0);
  const H = 150;
  const L = 34;
  const R = 8;
  const T = 8;
  const width = $derived(Math.max(240, w || 600));
  const ax = $derived.by(() => {
    if (!has) return null;
    const vals = data.weeks.flatMap((x) => [x.ctl, x.atl, x.tsb]);
    return niceTicks(Math.min(0, ...vals), Math.max(...vals), 4);
  });
  const X = (i) => L + (i * (width - L - R)) / (WEEKS - 1);
  const Y = (v) => T + ((ax.hi - v) / (ax.hi - ax.lo)) * H;
  const line = (k) => data.weeks.map((x, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(x[k]).toFixed(1)}`).join('');
  const label = $derived(
    has
      ? t('Fitness {f}, fatigue {a}, form {s} today; {n} weeks', { f: data.now.ctl, a: data.now.atl, s: signed(data.now.tsb), n: WEEKS })
      : '',
  );
</script>

{#if has}
  <AnaCard key="form" wide sub={t('{n} weeks · from the load of every activity', { n: WEEKS })}>
    <div class="plot" bind:clientWidth={w}>
      <svg width={width} height={H + T + 22} viewBox="0 0 {width} {H + T + 22}" role="img" aria-label={label}>
        {#each ax.ticks as v (v)}
          <line x1={L} x2={width - R} y1={Y(v)} y2={Y(v)} class={v === 0 ? 'zero' : 'grid'} />
          <text x={L - 8} y={Y(v) + 4} text-anchor="end">{v}</text>
        {/each}
        <path d={line('ctl')} class="ctl" />
        <path d={line('atl')} class="atl" />
        <path d={line('tsb')} class="tsb" />
        {#each data.weeks as x, i (x.monday)}
          {#if i % 5 === 0}
            <text x={X(i)} y={H + T + 18} text-anchor={i === 0 ? 'start' : i === WEEKS - 1 ? 'end' : 'middle'}>{t('Wk {n}', { n: x.kw })}</text>
          {/if}
        {/each}
      </svg>
    </div>
    <ul class="leg">
      <li><i class="k ctl"></i>{t('Fitness {n} (42-day mean)', { n: data.now.ctl })}</li>
      <li><i class="k atl"></i>{t('Fatigue {n} (7-day mean)', { n: data.now.atl })}</li>
      <li><i class="k tsb"></i>{t('Form {n} (fitness – fatigue)', { n: signed(data.now.tsb) })}</li>
    </ul>
    <p class="cap">{t('Form above zero = rather rested, below zero = rather tired. Just to look at. Rides without a power meter count with Relative Effort from the heart rate.')}</p>
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
  .zero {
    stroke: var(--ink-3);
    stroke-width: 1;
    opacity: 0.6;
  }
  path {
    fill: none;
    stroke-width: 2.5;
    stroke-linejoin: round;
  }
  .ctl {
    stroke: var(--ch-w);
  }
  .atl {
    stroke: var(--ch-hr);
    stroke-dasharray: 6 4;
  }
  .tsb {
    stroke: var(--pz4);
  }
  .leg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
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
    border-top: 3px solid;
  }
  .k.ctl {
    border-color: var(--ch-w);
  }
  .k.atl {
    border-top-style: dashed;
    border-color: var(--ch-hr);
  }
  .k.tsb {
    border-color: var(--pz4);
  }
</style>
