<script>
  /**
   * «Wochentage» of one answer (Noah 20.10.2026, like «Trittfrequenz verteilt» on the ride page): the mean
   * answer per weekday as a bar, the number on top. Observation only.
   */
  import AnaCard from '../../training/AnaCard.svelte';
  import { valueWeekdays, inRange } from '../auswertung.js';
  import { weekdayShort } from './words.js';
  import { t, num } from '../../i18n.svelte.js';

  let { d } = $props();
  const rows = $derived(valueWeekdays(inRange(d.vals, d.from, d.to)).map((r) => ({ ...r, label: weekdayShort(r.i) })));
  const top = $derived(d.scale ? 10 : Math.max(1, ...rows.map((r) => r.mean ?? 0)));
  const aria = $derived(rows.map((r) => `${r.label}: ${r.mean == null ? '–' : num(r.mean)}`).join(', '));
  const best = $derived(rows.filter((r) => r.mean != null).reduce((a, b) => (a && a.mean >= b.mean ? a : b), null));
</script>

{#if rows.filter((r) => r.n > 0).length > 1}
  <AnaCard key="andays" sub={t('Ø per weekday')}>
    <div class="bars num" role="img" aria-label={t('Ø answer per weekday: {list}', { list: aria })}>
      {#each rows as r (r.i)}
        <div class="col" data-spread={r.label}>
          <b>{r.mean == null ? '–' : num(r.mean)}</b>
          <i style:height="{r.mean == null ? 0 : Math.max(2, (r.mean / top) * 90)}px" style:opacity={r.mean == null ? 0 : 0.45 + 0.55 * (r.mean / top)}></i>
          <small>{r.label}</small>
        </div>
      {/each}
    </div>
    {#if best}<p class="cap">{t('Ø answer per weekday. Highest on {d}.', { d: best.label })}</p>{/if}
  </AnaCard>
{/if}

<style>
  .bars {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
    height: 130px;
    align-items: end;
  }
  .col {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    height: 100%;
    min-width: 0;
  }
  .col b {
    text-align: center;
    font-size: var(--fs-tiny);
    margin-bottom: 4px;
  }
  .col i {
    display: block;
    border-radius: 4px 4px 0 0;
    background: var(--hi);
  }
  .col small {
    text-align: center;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    margin-top: 6px;
  }
</style>
