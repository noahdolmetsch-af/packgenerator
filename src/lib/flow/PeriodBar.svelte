<script>
  /**
   * «Zeitraum» on top of Auswerten (Noah 05.11.2026 «1a 2b 3a 4a»): one switch for the whole place. Week, Month and
   * Year can be paged back with ‹ ›; «All» takes everything; «Own range» shows two date fields. The lists that
   * have a time (the list of the sports, the averages of the questions) follow it; the cards of today do not,
   * and a line says so (4a). The choice is remembered (zeitraum.svelte.js).
   */
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';
  import Seg from '../ui/Seg.svelte';
  import DateInput from '../ui/DateInput.svelte';
  import { period, setPeriod } from './zeitraum.svelte.js';
  import { rangeOf, step, canStep, withMode, labelOf, STEPPED } from './zeitraum.js';
  import { t, locale } from '../i18n.svelte.js';

  let { today } = $props();
  const range = $derived(rangeOf(period, today));
  const label = $derived(labelOf(period, today, locale()));
  const options = $derived([
    { key: 'week', name: t('Week|period') },
    { key: 'month', name: t('Month|period') },
    { key: 'year', name: t('Year|period') },
    { key: 'all', name: t('Everything|period') },
    { key: 'custom', name: t('Own range|period') },
  ]);
  const stepped = $derived(STEPPED.includes(period.mode));
  let from = $state(period.from ?? '');
  let to = $state(period.to ?? '');
  // an own range needs both days; with only one, the last 7 days stay until the second is set
  function setRange() {
    setPeriod({ mode: 'custom', from: from || null, to: to || null });
  }
  function pick(mode) {
    if (mode === 'custom' && !from && !to) {
      to = today;
      from = rangeOf({ mode: 'week', back: 0 }, today).from;
      setPeriod({ mode, from, to });
      return;
    }
    if (mode === 'custom') return setPeriod({ mode, from: from || null, to: to || null });
    setPeriod(withMode(period, mode));
  }
</script>

<section class="pb" data-period-bar aria-label={t('Period')}>
  <Seg full label={t('Period')} value={period.mode} onchange={pick} {options} />
  {#if stepped}
    <div class="stp" data-period-step>
      <button type="button" class="arr" aria-label={t('Earlier')} data-period-prev disabled={!canStep(period, -1)} onclick={() => setPeriod(step(period, -1))}><ChevronLeft size={20} aria-hidden="true" /></button>
      <b class="lab num" data-period-label>{label}</b>
      <button type="button" class="arr" aria-label={t('Later')} data-period-next disabled={!canStep(period, 1)} onclick={() => setPeriod(step(period, 1))}><ChevronRight size={20} aria-hidden="true" /></button>
    </div>
  {:else if period.mode === 'custom'}
    <div class="own" data-period-own>
      <label><span class="pblbl">{t('From|period')}</span><DateInput bind:value={from} max={today} onchange={setRange} data-period-from /></label>
      <label><span class="pblbl">{t('To|period')}</span><DateInput bind:value={to} max={today} onchange={setRange} data-period-to /></label>
    </div>
    {#if range.incomplete}<p class="hint" data-period-incomplete>{t('Pick both days: until then the last 7 days count.')}</p>{/if}
  {:else}
    <p class="lab all" data-period-label>{t('Everything you have recorded')}</p>
  {/if}
  <!-- 4a: the cards without a period say so -->
  <p class="hint" data-period-hint>{t('The period counts for the list below and the averages of «Your questions». «Today», «In focus» and «Overview» always show the latest days.')}</p>
</section>

<style>
  .pb {
    display: grid;
    gap: var(--sp-2);
    min-width: 0;
  }
  .stp {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2);
  }
  .lab {
    flex: 1;
    text-align: center;
    font-weight: 600;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .all {
    margin: 0;
    font-weight: 500;
    color: var(--ink-2);
  }
  .arr {
    display: inline-grid;
    place-items: center;
    min-width: 44px;
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: var(--r-md, 12px);
    background: var(--card, var(--bg));
    color: var(--ink);
  }
  .arr:disabled {
    opacity: 0.4;
  }
  .own {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-3);
  }
  .own label {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .pblbl {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hint {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
</style>
