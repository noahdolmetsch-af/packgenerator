<script>
  /**
   * Strombudget (Noah 19.10.2026 «2a»): one line in Packen › «Charge the evening before»: does the power
   * last this trip, and which power bank. The whole calculation and the values: Material › Strom
   * (#/gear/power?trip=ID). The rule: src/lib/power.js.
   */
  import { t, nameOf } from '../i18n.svelte.js';
  import { tripFacts } from '../situation.js';
  import { powerInputs, powerBudget, tripDevices } from '../power.js';
  import { Zap } from '@lucide/svelte';

  let { trip, items = [] } = $props();
  const budget = $derived(powerBudget(tripDevices(trip, items), items, powerInputs(trip, tripFacts(trip))));
  const text = $derived(
    budget.needWh <= 0
      ? t('Power: no power bank needed.')
      : budget.banks.enough
        ? t('Power: take {names}.', { names: budget.banks.pick.map((i) => nameOf(i)).join(' + ') })
        : t('Power: your power banks are not enough.'),
  );
</script>

{#if budget.devices.length}
  <p class="pwl" class:warn={!budget.banks.enough} data-power-line>
    <Zap size={16} aria-hidden="true" />
    <span>{text} <a href={`#/gear/power?trip=${encodeURIComponent(trip.id)}`}>{t('Power budget ›')}</a></span>
  </p>
{/if}

<style>
  .pwl {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0 0 10px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .pwl :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .pwl.warn :global(svg) {
    color: var(--warn);
  }
</style>
