<script>
  /**
   * v0.67.0 «Übergänge 1» (U004, U25a, mockup Tour-beenden): «Tour jetzt beenden?» as a sheet.
   * Riding on is the safe way and stands on top; «Tour beenden» is red and below it. Why (optional,
   * helps the debrief): Wetter, Panne, Müde, Plan geändert. Back closes only this sheet (Ü7a).
   * day / days: the day of the trip now (1-based) and how many it has; arrive: the planned arrival
   * of today («HH:MM») when the last day's riding is still ahead.
   */
  import { backClose } from '../ui/backclose.js';
  import { endTrip } from './ending.js';
  import { t } from '../i18n.svelte.js';

  let { trip, day = 1, days = 1, arrive = '', onclose } = $props();
  const REASONS = [
    { key: 'weather', name: 'Weather|reason' },
    { key: 'breakdown', name: 'Breakdown' },
    { key: 'tired', name: 'Tired' },
    { key: 'plan', name: 'Plan changed' },
  ];
  let reason = $state(null);
  let dialog = $state();
  let busy = $state(false);
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const left = $derived(days - day);
  const text = $derived(
    left > 0
      ? left === 1
        ? t('You are on day {n} of {total}. Day {last} falls away, then the debrief comes.', { n: day, total: days, last: days })
        : t('You are on day {n} of {total}. Days {from} to {last} fall away, then the debrief comes.', { n: day, total: days, from: day + 1, last: days })
      : arrive
        ? t('By the plan you arrive at about {time}. Then the debrief comes.', { time: arrive })
        : t('Then the debrief comes.'),
  );
  async function end() {
    busy = true;
    try {
      await endTrip($state.snapshot(trip), { reason });
    } finally {
      busy = false;
      dialog?.close();
    }
  }
</script>

<dialog class="sheet endsheet" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="end-h">
  <h2 id="end-h">{t('End the trip now?')}</h2>
  <p>{text}</p>
  <fieldset>
    <legend>{t('Why? Optional, it helps the debrief.')}</legend>
    <div class="tp-chips">
      {#each REASONS as r (r.key)}<button type="button" class="tp-chip" aria-pressed={reason === r.key} onclick={() => (reason = reason === r.key ? null : r.key)}>{t(r.name)}</button>{/each}
    </div>
  </fieldset>
  <div class="acts">
    <button type="button" class="btn ride-on" onclick={() => dialog.close()}>{t('Ride on')}</button>
    <button type="button" class="btn stop" disabled={busy} onclick={end}>{t('End the trip')}</button>
  </div>
  <p class="small">{t('Until tomorrow you can take it back: «Still on the way».')} {t('Back closes only this window.')}</p>
</dialog>

<style>
  h2 {
    margin: 0 0 8px;
    font: 700 var(--fs-section)/1.2 var(--font-body);
  }
  p {
    margin: 0 0 12px;
    font-size: var(--fs-body);
    color: var(--ink-2);
  }
  fieldset {
    margin: 0 0 16px;
    padding: 0;
    border: 0;
  }
  legend {
    margin: 0 0 8px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .acts {
    display: grid;
    gap: 10px;
  }
  .acts .btn {
    min-height: 52px;
    font-size: var(--fs-sub);
    border-radius: 8px;
  }
  .ride-on {
    border-width: 2px;
    border-color: var(--ink);
    font-weight: 600;
  }
  .stop {
    border-color: var(--bad-soft);
    background: var(--bad-soft);
    color: var(--bad);
  }
  .stop:hover {
    background: var(--bad-soft);
  }
  .small {
    margin: 12px 0 0;
    text-align: center;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
</style>
