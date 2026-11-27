<script>
  /**
   * «Ein Schalter für alles» (Noah 27.11.2026 «2a»): the period of the cards under it on Auswerten › Woche (Haken-Verlauf,
   * Tagestotal, Wochenpensum, Gesundheit). The choice stays on this device (flow/haken-zeitraum.svelte.js). The report further
   * down keeps its own calendar period (Woche, Monat, Jahr), because it counts whole calendar periods.
   */
  import ChipChoice from '../ui/ChipChoice.svelte';
  import { hakenSpan, pickSpan } from './haken-zeitraum.svelte.js';
  import { t } from '../i18n.svelte.js';

  const OPTIONS = $derived([
    { value: 10, label: t('10 days|hv') },
    { value: 30, label: t('30 days|hv') },
    { value: 90, label: t('3 months|hv') },
    { value: 365, label: t('Year|hv') },
  ]);
</script>

<section class="card hz" aria-labelledby="hz-h" data-haken-zeitraum>
  <h2 id="hz-h" class="h2">{t('Period for everything here')}</h2>
  <ChipChoice options={OPTIONS} value={hakenSpan.v} onchange={pickSpan} aria-label={t('Period of the tick history')} data-hz-span />
  <p class="det">{t('One switch for the tick history, the day total and the week volume.')}</p>
</section>

<style>
  .hz {
    padding: var(--sp-4);
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    min-width: 0;
  }
  .h2 {
    margin: 0;
    font: 600 var(--fs-h3, 1.1rem) / 1.25 var(--font-body);
    color: var(--ink);
  }
  .det {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
</style>
