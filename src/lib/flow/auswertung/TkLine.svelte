<script>
  /**
   * «Verlauf» (Noah 20.10.2026, like «Puls über die Zeit» and «Verlauf» on the ride page): the ticks per day
   * as quiet bars and the mean of 7 days as a line. Observation only.
   */
  import AnaCard from '../../training/AnaCard.svelte';
  import { daily } from '../auswertung.js';
  import { dayName } from './words.js';
  import { t, num } from '../../i18n.svelte.js';

  let { d } = $props();
  const W = 600;
  const H = 140;
  const rows = $derived(daily(d.list, d.from, d.to));
  const most = $derived(Math.max(1, ...rows.map((r) => r.n)));
  const bw = $derived(W / Math.max(1, rows.length));
  const y = (v) => Math.round((H - (v / most) * (H - 8)) * 10) / 10;
  const path = $derived(rows.map((r, i) => `${i ? 'L' : 'M'}${Math.round((i + 0.5) * bw * 10) / 10},${y(r.mean)}`).join(' '));
  const last = $derived(rows.at(-1));
</script>

{#if rows.some((r) => r.n > 0)}
  <AnaCard key="tkline" sub={t('Ticks per day and 7-day mean')} wide>
    <div class="cv">
      <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" role="img" aria-label={t('Ticks per day from {a} to {b}, now Ø {n} per day over 7 days', { a: dayName(d.from), b: dayName(d.to), n: num(last?.mean ?? 0) })}>
        {#each rows as r, i (r.day)}{#if r.n}<rect x={i * bw + bw * 0.15} y={y(r.n)} width={Math.max(1, bw * 0.7)} height={H - y(r.n)} class="bar" />{/if}{/each}
        <path d={path} class="ln" />
      </svg>
      <p class="ax num"><span>{dayName(d.from)}</span><span>{dayName(d.to)}</span></p>
    </div>
    <ul class="lg"><li><i class="b"></i>{t('Ticks per day')}</li><li><i class="l"></i>{t('Ø of 7 days')}</li></ul>
  </AnaCard>
{/if}

<style>
  svg {
    display: block;
    width: 100%;
    height: 150px;
  }
  .bar {
    fill: var(--ch-alt);
  }
  .ln {
    fill: none;
    stroke: var(--ch-w);
    stroke-width: 2.5;
    vector-effect: non-scaling-stroke;
    stroke-linejoin: round;
  }
  .ax {
    display: flex;
    justify-content: space-between;
    margin: 6px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .lg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .lg li {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .lg i {
    width: 12px;
    height: 10px;
    border-radius: 2px;
  }
  .lg .b {
    background: var(--ch-alt);
  }
  .lg .l {
    height: 3px;
    background: var(--ch-w);
  }
</style>
