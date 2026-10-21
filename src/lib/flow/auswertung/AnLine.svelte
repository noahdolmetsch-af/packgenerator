<script>
  /**
   * «Verlauf» of one answer (Noah 20.10.2026, like «Puls über die Zeit» on the ride page): each answer as a
   * dot, the mean of 7 days as a line. A 1–10 question keeps its scale from 0 to 10. Observation only.
   */
  import AnaCard from '../../training/AnaCard.svelte';
  import { valueDaily } from '../auswertung.js';
  import { dayName } from './words.js';
  import { t, num } from '../../i18n.svelte.js';

  let { d } = $props();
  const W = 600;
  const H = 140;
  const rows = $derived(valueDaily(d.vals, d.from, d.to));
  const lo = $derived(d.scale ? 0 : Math.min(...rows.filter((r) => r.v != null).map((r) => r.v)));
  const hi = $derived(d.scale ? 10 : Math.max(...rows.filter((r) => r.v != null).map((r) => r.v)));
  const y = (v) => Math.round((H - 6 - ((v - lo) / Math.max(1, hi - lo)) * (H - 12)) * 10) / 10;
  const x = (i) => Math.round(((i + 0.5) / rows.length) * W * 10) / 10;
  const path = $derived(rows.map((r, i) => (r.mean == null ? null : `${x(i)},${y(r.mean)}`)).filter(Boolean).map((p, i) => `${i ? 'L' : 'M'}${p}`).join(' '));
  const last = $derived(rows.findLast((r) => r.mean != null));
</script>

{#if rows.some((r) => r.v != null)}
  <AnaCard key="anline" sub={t('Answers and 7-day mean')} wide>
    <div class="cv">
      <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" role="img" aria-label={t('Answers from {a} to {b}, lately Ø {n} over 7 days', { a: dayName(d.from), b: dayName(d.to), n: num(last?.mean ?? 0) })}>
        {#each rows as r, i (r.day)}{#if r.v != null}<rect x={x(i) - 2} y={y(r.v) - 2} width="4" height="4" rx="2" class="dot" />{/if}{/each}
        <path d={path} class="ln" />
      </svg>
      <p class="ax num"><span>{dayName(d.from)}</span><span>{d.scale ? t('scale 0 to 10') : `${num(lo)}–${num(hi)}`}</span><span>{dayName(d.to)}</span></p>
    </div>
    <ul class="lg"><li><i class="b"></i>{t('Answer of the day')}</li><li><i class="l"></i>{t('Ø of 7 days')}</li></ul>
  </AnaCard>
{/if}

<style>
  svg {
    display: block;
    width: 100%;
    height: 150px;
  }
  .dot {
    fill: var(--pz2);
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
    width: 10px;
    height: 10px;
    border-radius: 5px;
  }
  .lg .b {
    background: var(--pz2);
  }
  .lg .l {
    width: 12px;
    height: 3px;
    border-radius: 0;
    background: var(--ch-w);
  }
</style>
