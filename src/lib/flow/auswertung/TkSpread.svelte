<script>
  /**
   * «Wochentage verteilt» and «Tageszeit verteilt» (Noah 20.10.2026, like «Trittfrequenz verteilt» on the
   * ride page): the share of the ticks per weekday or per three hours, the bar darker the more. kind: 'days' | 'hours'.
   */
  import AnaCard from '../../training/AnaCard.svelte';
  import { weekdays, hours, inRange } from '../auswertung.js';
  import { weekdayShort } from './words.js';
  import { t } from '../../i18n.svelte.js';

  let { d, kind = 'days' } = $props();
  const es = $derived(inRange(d.list, d.from, d.to));
  const rows = $derived(kind === 'days' ? weekdays(es).map((r) => ({ ...r, label: weekdayShort(r.i) })) : hours(es).map((r) => ({ ...r, label: String(r.from).padStart(2, '0') })));
  const sum = $derived(rows.reduce((s, r) => s + r.n, 0));
  const most = $derived(Math.max(1, ...rows.map((r) => r.pct)));
  const top = $derived(sum ? rows.reduce((a, b) => (b.n > a.n ? b : a)) : null);
  const aria = $derived(rows.map((r) => `${r.label}: ${r.pct} %`).join(', '));
</script>

{#if sum > 0}
  <AnaCard key={kind === 'days' ? 'tkdays' : 'tkhours'} sub={kind === 'days' ? t('share of the ticks') : t('from the time you ticked')}>
    <div class="bars num" role="img" aria-label={kind === 'days' ? t('Share of the ticks per weekday: {list}', { list: aria }) : t('Share of the ticks per time of day: {list}', { list: aria })} style:grid-template-columns="repeat({rows.length}, minmax(0, 1fr))">
      {#each rows as r (r.label)}
        <div class="col" data-spread={r.label}>
          <b>{r.pct} %</b>
          <i style:height="{Math.max(2, (r.pct / most) * 90)}px" style:opacity={0.45 + 0.55 * (r.pct / most)}></i>
          <small>{r.label}</small>
        </div>
      {/each}
    </div>
    <p class="cap">
      {#if kind === 'days'}{t('Share of the ticks per weekday. Most often on {d}.', { d: top.label })}{:else}{t('Share of the ticks per three hours (from the hour shown). Most often from {h} o’clock.', { h: top.label })}{/if}
    </p>
  </AnaCard>
{/if}

<style>
  .bars {
    display: grid;
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
    white-space: nowrap;
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
