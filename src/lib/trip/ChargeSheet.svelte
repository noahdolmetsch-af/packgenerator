<script>
  /**
   * v0.34.0 (L4): the charge list as a sheet over Pack (#/pack?charge, and the ready-check point
   * "Devices charged"). The list itself is ChargeList.
   */
  import { t } from '../i18n.svelte.js';
  import ChargeList from './ChargeList.svelte';
  import { BatteryCharging } from '@lucide/svelte';

  let { trip, items = [], onclose } = $props();
  let dialog;
  $effect(() => {
    dialog.showModal();
  });
</script>

<dialog class="sheet" bind:this={dialog} onclose={onclose} aria-labelledby="charge-h">
  <p class="meta">{trip.title}</p>
  <h2 id="charge-h"><BatteryCharging size={20} aria-hidden="true" />{t('Charge the evening before')}</h2>
  <ChargeList {trip} {items} />
  <p class="hint">{t('Everything from Electronics and Lights on this trip, without cables and chargers. On a trip of several days, On the way has the list for every evening.')}</p>
  <div class="foot"><button type="button" class="btn" onclick={() => dialog.close()}>{t('Close')}</button></div>
</dialog>

<style>
  .meta { margin: 0; font-size: var(--fs-small); font-weight: 600; color: var(--ink-3); }
  h2 { display: flex; align-items: center; gap: 8px; font-size: var(--fs-sub); margin: 4px 0 8px; }
  h2 :global(svg) { color: var(--ink-3); flex: none; }
  .hint { margin: 10px 0 0; font-size: 14px; color: var(--ink-3); }
  .foot { display: flex; justify-content: flex-end; margin-top: 12px; }
  .foot .btn { min-height: 44px; }
</style>
