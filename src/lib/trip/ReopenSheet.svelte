<script>
  /**
   * TZ-2 «Fest nach der Fahrt» (Noah 13.10.2026, answer 5a, mockup TZ2 Tour-Kopf): «Wieder öffnen?»
   * asks once. Keeping it fixed is the safe way and comes first; «Wieder öffnen» after it makes the trip
   * planned again (reopen.svelte.js reopenPlan), a saved debrief stays. Back closes only this sheet; the state
   * note then offers Undo for a few seconds.
   */
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import { X } from '@lucide/svelte';
  import { tz2, reopenPlan } from './reopen.svelte.js';

  let { trip, rated = false, onclose } = $props();
  let dialog = $state();
  let busy = $state(false);
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  async function reopen() {
    busy = true;
    try {
      const undo = await reopenPlan($state.snapshot(trip));
      if (undo) tz2.done = { id: trip.id, text: t('Reopened: the trip is planned again.'), undo };
    } finally {
      busy = false;
      dialog?.close();
    }
  }
</script>

<dialog class="sheet reopensheet" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="reopen-h">
  <div class="hd">
    <h2 id="reopen-h">{t('Reopen this trip?')}</h2>
    <button type="button" class="x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={18} aria-hidden="true" /></button>
  </div>
  <p class="lead">{t('It becomes Planned again: the packing list, date and bike can be changed.')} {rated ? t('Your debrief stays saved.') : ''}</p>
  <div class="acts">
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Keep it fixed')}</button>
    <button type="button" class="btn hi" disabled={busy} onclick={reopen}>{t('Reopen')}</button>
  </div>
</dialog>

<style>
  .reopensheet {
    max-width: 560px;
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
