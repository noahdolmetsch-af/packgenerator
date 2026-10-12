<script>
  /**
   * v0.67.0 «Übergänge 1» (U004, U25a, mockup Tour-beenden): «Tour jetzt beenden?» as a sheet.
   * Riding on is the safe way and comes first; «Tour beenden» after it (v0.105.0 P5: the sheet's
   * primary button, as in the approved T13 mockup; was red). Why (optional,
   * helps the debrief): Wetter, Panne, Müde, Plan geändert. Back closes only this sheet (Ü7a).
   * day / days: the day of the trip now (1-based) and how many it has; arrive: the planned arrival
   * of today («HH:MM») when the last day's riding is still ahead.
   */
  import { backClose } from '../ui/backclose.js';
  import { endTrip } from './ending.js';
  import { t } from '../i18n.svelte.js';
  import { X, Undo2 } from '@lucide/svelte';

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

<!-- v0.105.0 Design-Refresh P5 (T13, approved 12.10.2026): a light sheet with «×» on top, the optional why
     as chips, the way back in a hint box, «Weiterfahren» and «Tour beenden» at the bottom right (U25a: riding
     on still comes first). -->
<dialog class="sheet endsheet" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="end-h">
  <div class="hd">
    <h2 id="end-h">{t('End the trip now?')}</h2>
    <button type="button" class="x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={18} aria-hidden="true" /></button>
  </div>
  <p class="lead">{text}</p>
  <fieldset>
    <legend>{t('Why? Optional, it helps the debrief.')}</legend>
    <div class="tp-chips">
      {#each REASONS as r (r.key)}<button type="button" class="tp-chip" aria-pressed={reason === r.key} onclick={() => (reason = reason === r.key ? null : r.key)}>{t(r.name)}</button>{/each}
    </div>
  </fieldset>
  <p class="hint"><Undo2 size={16} aria-hidden="true" /><span>{t('Until tomorrow you can take it back: «Still on the way».')} {t('Back closes only this window.')}</span></p>
  <div class="acts">
    <button type="button" class="btn ride-on" onclick={() => dialog.close()}>{t('Ride on')}</button>
    <button type="button" class="btn hi stop" disabled={busy} onclick={end}>{t('End the trip')}</button>
  </div>
</dialog>

<style>
  .endsheet {
    max-width: 640px;
  }
  .hd {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  h2 {
    flex: 1;
    min-width: 0;
    margin: 0 0 4px;
    font: 700 var(--fs-section)/1.2 var(--font-body);
    overflow-wrap: break-word;
  }
  .x {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink);
    cursor: pointer;
  }
  .lead {
    margin: 0 0 16px;
    font-size: var(--fs-body);
    color: var(--ink-2);
  }
  fieldset {
    margin: 0 0 16px;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  legend {
    margin: 0 0 8px;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
  .hint {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin: 0 0 16px;
    padding: 12px 14px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink);
    font-size: var(--fs-small);
  }
  .hint :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--ink-2);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 10px;
  }
  .acts .btn {
    min-height: 48px;
  }
</style>
