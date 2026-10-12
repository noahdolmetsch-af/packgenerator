<script>
  /**
   * v0.34.0 (L4): the charge list as a sheet over Pack (#/pack?charge, and the ready-check point
   * "Devices charged"). The list itself is ChargeList.
   * v0.105.0 Design-Refresh P5 (T8, approved 12.10.2026): title and one line on top with «×», the list
   * with its bar, a hint box and «Schliessen» / «Alles geladen» at the bottom right.
   */
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { t } from '../i18n.svelte.js';
  import { chargeList, chargeCount, chargeAll } from '../charge.js';
  import ChargeList from './ChargeList.svelte';
  import { X, TriangleAlert } from '@lucide/svelte';

  let { trip, items = [], onclose } = $props();
  let dialog;
  $effect(() => {
    dialog.showModal();
  });
  const list = $derived(chargeList(trip, items));
  const count = $derived(chargeCount(trip, list));
  const all = () =>
    db.transaction('rw', db.trips, async () => {
      const cur = await db.trips.get(trip.id);
      if (cur) await db.trips.update(trip.id, touched(chargeAll(cur, list)));
    });
</script>

<dialog class="sheet chs" bind:this={dialog} onclose={onclose} aria-labelledby="charge-h">
  <header class="hd">
    <div class="tt">
      <h2 id="charge-h">{t('Charge the evening before')}</h2>
      <p class="sub">{t('Everything from Electronics and Lights on this trip, without cables and chargers.')}</p>
    </div>
    <button type="button" class="x" aria-label={t('Close the window')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </header>
  <ChargeList {trip} {items} head />
  <p class="hint"><TriangleAlert size={16} aria-hidden="true" /><span>{t('On a trip of several days, On the way has the list for every evening.')}</span></p>
  <div class="foot">
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Close')}</button>
    {#if list.length && count.done < count.total}<button type="button" class="btn hi" onclick={all}>{t('All charged')}</button>{/if}
  </div>
</dialog>

<style>
  .chs { width: min(640px, calc(100vw - 24px)); padding: 20px; }
  .hd { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
  .tt { flex: 1; min-width: 0; }
  h2 { margin: 0; font: 600 var(--fs-section) / 1.25 var(--font-body); overflow-wrap: break-word; }
  .sub { margin: 4px 0 0; color: var(--ink-2); font-size: var(--fs-small); }
  .x { flex: none; display: grid; place-items: center; width: 44px; height: 44px; border: 0; border-radius: var(--r-ctl); background: var(--paper-2); color: var(--ink); cursor: pointer; }
  .hint { display: flex; align-items: flex-start; gap: 10px; margin: 12px 0 0; padding: 10px 12px; border-radius: var(--r-ctl); background: var(--paper-2); color: var(--ink-2); font-size: var(--fs-small); }
  .hint :global(svg) { flex: none; margin-top: 2px; }
  .foot { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; margin-top: 14px; }
</style>
