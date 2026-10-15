<script>
  /**
   * T3 «Ausdauer-Check» (Noah 15.10.2026 «1-5 a»): the aerobic decoupling (Pw:HR) of the long calm rides of
   * the last six months, one dot per ride, a calm trend from three rides and one sentence with the mean.
   * Long calm = an hour or more moving, mostly Z1–Z2, with a power meter, heart rate and both halves.
   * Observation only. Without such rides one quiet line says why nothing shows. inhalt-woche.js decouplePoints.
   */
  import AnaCard from '../AnaCard.svelte';
  import { t, tn, locale } from '../../i18n.svelte.js';
  import { zones } from '../../strava/zones.svelte.js';
  import { monthStart, daysBetween, niceTicks } from '../week/weeks.js';
  import { decouplePoints, DEC_MONTHS, DEC_GOOD } from './inhalt-woche.js';

  let { acts = [], today = '' } = $props();
  const data = $derived(today ? decouplePoints(acts, today, zones.bounds) : null);
  const has = $derived(!!data && data.pts.length > 0);
  const f1 = (v) => Number(v).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const monthOf = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { month: 'short', timeZone: 'UTC' });

  let w = $state(0);
  const H = 120;
  const T = 10;
  const L = 42;
  const R = 34;
  const width = $derived(Math.max(240, w || 600));
  const ax = $derived.by(() => {
    if (!has) return null;
    const vals = [...data.pts.map((p) => p.v), ...(data.trend ? [data.trend.start, data.trend.end] : [])];
    return niceTicks(Math.min(0, ...vals), Math.max(DEC_GOOD + 1, ...vals), 4);
  });
  const X = (x) => L + (x / Math.max(1, data.span)) * (width - L - R);
  const Y = (v) => T + ((ax.hi - v) / (ax.hi - ax.lo)) * H;
  const months = $derived(has ? Array.from({ length: DEC_MONTHS }, (_, i) => monthStart(today, DEC_MONTHS - 1 - i)).map((d) => ({ d, x: daysBetween(data.from, d) })) : []);
  const sentence = $derived(
    !has
      ? ''
      : data.mean > 0
        ? t('On long calm rides your heart rate rises by {n} % on average at the same power. Below 5 % is commonly read as a good endurance base.', { n: f1(data.mean) })
        : t('On long calm rides your heart rate stays level on average at the same power ({n} %). Below 5 % is commonly read as a good endurance base.', { n: f1(data.mean) }),
  );
  const label = $derived(has ? tn(data.pts.length, '{n} long calm ride, mean {m} %', '{n} long calm rides, mean {m} %', { m: f1(data.mean) }) : '');
</script>

{#if data}
  <AnaCard key="decouple" sub={has ? tn(data.pts.length, '{n} ride of an hour or more, mostly Z1–Z2', '{n} rides of an hour or more, mostly Z1–Z2') : t('Heart rate drift at the same power')}>
    {#if has}
      <div class="dc-plot" bind:clientWidth={w}>
        <svg width={width} height={H + T + 30} viewBox="0 0 {width} {H + T + 30}" role="img" aria-label={label}>
          {#each ax.ticks as v (v)}
            <line x1={L} x2={width - R} y1={Y(v)} y2={Y(v)} class={v === 0 ? 'dc-zero' : 'dc-grid'} />
            <text x={L - 8} y={Y(v) + 4} text-anchor="end">{Number.isInteger(v) ? v : f1(v)} %</text>
          {/each}
          <line class="dc-ref" x1={L} x2={width - R} y1={Y(DEC_GOOD)} y2={Y(DEC_GOOD)} />
          <text class="dc-reft" x={width - R + 4} y={Y(DEC_GOOD) + 4}>{DEC_GOOD} %</text>
          {#each data.pts as p (p.id)}
            <circle cx={X(p.x)} cy={Y(p.v)} r="4" data-decouple={p.id} />
          {/each}
          {#if data.trend}
            <line class="dc-trend" x1={X(data.trend.x0)} y1={Y(data.trend.start)} x2={X(data.span)} y2={Y(data.trend.end)} />
          {/if}
          {#each months as m, i (m.d)}
            <text x={X(m.x)} y={H + T + 24} text-anchor={i === 0 ? 'start' : 'middle'}>{monthOf(m.d)}</text>
          {/each}
        </svg>
      </div>
      <ul class="dc-leg">
        <li><i class="dc-kd"></i>{t('one ride')}</li>
        {#if data.trend}<li><i class="dc-kt"></i>{t('Trend')}</li>{/if}
        <li><i class="dc-kr"></i>{t('5 % line')}</li>
      </ul>
      <p class="cap" data-decouple-sentence>{sentence}</p>
      <p class="cap">{t('Power per heartbeat in the second half against the first. Only rides with a power meter and heart rate.')}</p>
    {:else}
      <p class="cap" data-decouple-none>{t('No long calm ride in the last 6 months yet: it takes an hour or more, mostly in Z1–Z2, with a power meter and heart rate.')}</p>
    {/if}
  </AnaCard>
{/if}

<style>
  .dc-plot {
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
  .dc-grid {
    stroke: var(--line);
    stroke-dasharray: 3 4;
  }
  .dc-zero {
    stroke: var(--ink-3);
    opacity: 0.6;
  }
  .dc-ref {
    stroke: var(--pz4);
    stroke-width: 1.5;
    stroke-dasharray: 6 4;
  }
  circle {
    fill: var(--ch-hr);
    opacity: 0.5;
  }
  .dc-trend {
    stroke: var(--ch-hr);
    stroke-width: 2.5;
    stroke-linecap: round;
  }
  .dc-leg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .dc-leg li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .dc-kd {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ch-hr);
    opacity: 0.5;
  }
  .dc-kt,
  .dc-kr {
    display: inline-block;
    width: 14px;
    height: 0;
    border-top: 3px solid var(--ch-hr);
  }
  .dc-kr {
    border-top: 2px dashed var(--pz4);
  }
</style>
