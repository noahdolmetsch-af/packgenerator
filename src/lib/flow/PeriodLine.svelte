<script>
  /**
   * «Zeitraum» as one line (Noah 24.11.2026 «1-5a», Impeccable ganze App, Auswerten F1): «Period: Week · 17 Nov – 23 Nov 2026» and
   * «Change». A tap unfolds the known switch (PeriodBar) right there. The choice stays remembered (zeitraum.svelte.js); the sentence
   * about what the period touches lives in «Good to know» of the «?» window (wissen/koerper.js, 'f.overview').
   */
  import PeriodBar from './PeriodBar.svelte';
  import { period } from './zeitraum.svelte.js';
  import { labelOf } from './zeitraum.js';
  import { t, locale } from '../i18n.svelte.js';

  let { today } = $props();
  let open = $state(false);
  const NAMES = { week: 'Week|period', month: 'Month|period', year: 'Year|period', all: 'Everything|period', custom: 'Own range|period' };
  const label = $derived(labelOf(period, today, locale()));
  const sum = $derived([t(NAMES[period.mode] ?? NAMES.week), label].filter(Boolean).join(' · '));
</script>

<div class="pl" data-period-line>
  <p class="row">
    <span class="sum num" data-period-sum>{t('Period: {label}', { label: sum })}</span>
    <button type="button" class="chg" aria-expanded={open} aria-controls="pl-bar" data-period-change onclick={() => (open = !open)}>{t('Change|period')}</button>
  </p>
  {#if open}
    <div id="pl-bar"><PeriodBar {today} hint={false} /></div>
  {/if}
</div>

<style>
  .pl {
    display: grid;
    gap: var(--sp-2);
    min-width: 0;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0 var(--sp-3);
    margin: 0;
  }
  .sum {
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
  .chg {
    min-height: 44px;
    padding: 0 var(--sp-2);
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-small) / 1 var(--font-body);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
</style>
