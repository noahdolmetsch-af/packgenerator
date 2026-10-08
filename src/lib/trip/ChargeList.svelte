<script>
  /**
   * v0.34.0 (L4, L8): the devices of this trip to charge, with ticks. The evening before the trip
   * (night null: trip.charge) or an evening on the way (night: the date, trip.chargeNight[date]).
   * The ticks are saved on the trip right away; the items never change (charge.js).
   */
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { t } from '../i18n.svelte.js';
  import { chargeList, chargeCount, isCharged, toggleCharge, chargeAll } from '../charge.js';
  import { Check } from '@lucide/svelte';
  import './trip.css';

  let { trip, items = [], night = null } = $props();

  const list = $derived(chargeList(trip, items));
  const count = $derived(chargeCount(trip, list, night));

  // Read and written in one go, so quick taps (or a tick on the other page) are never lost.
  const save = (fn) =>
    db.transaction('rw', db.trips, async () => {
      const cur = await db.trips.get(trip.id);
      if (cur) await db.trips.update(trip.id, touched(fn(cur)));
    });
  const tick = (itemId) => save((cur) => toggleCharge(cur, itemId, night));
  const tickAll = () => save((cur) => chargeAll(cur, list, night));
</script>

<div class="charge">
  {#if !list.length}
    <p class="none">{t('No device to charge on this trip (Electronics and Lights).')}</p>
  {:else}
    <ul class="rows" aria-label={night ? t('Charge tonight') : t('Charge the evening before')}>
      {#each list as r (r.itemId)}
        {@const on = isCharged(trip, r.itemId, night)}
        <li class:on>
          <button type="button" class="it" aria-pressed={on} onclick={() => tick(r.itemId)}>
            <span class="box" aria-hidden="true">{#if on}<Check size={18} />{/if}</span>
            <span class="nm">{r.name}</span>
            {#if r.qty > 1}<span class="q num">× {r.qty}</span>{/if}
          </button>
        </li>
      {/each}
    </ul>
    <p class="foot">
      <span class="tp-badge num" class:ok={count.done === count.total}>{t('{done} of {n} charged', { done: count.done, n: count.total })}</span>
      {#if count.done < count.total}<button type="button" class="tp-link" onclick={tickAll}>{t('All charged')}</button>{/if}
    </p>
  {/if}
</div>

<style>
  .charge { min-width: 0; }
  .none { margin: 0; color: var(--ink-3); font-size: 15px; }
  .rows { list-style: none; margin: 0; padding: 0; }
  .it { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 48px; padding: 4px 0; border: 0; border-top: 1px solid var(--paper-2); background: none; color: var(--ink); font: 400 16px/1.25 var(--font-body); text-align: left; cursor: pointer; }
  li:first-child .it { border-top: 0; }
  .box { flex: none; display: grid; place-items: center; width: 26px; height: 26px; border-radius: 7px; border: 2px solid var(--line-strong); background: var(--paper); }
  .on .box { background: var(--ink); border-color: var(--ink); color: var(--paper); }
  .on .nm { color: var(--ink-3); }
  .nm { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }
  .q { flex: none; margin-left: auto; color: var(--ink-3); font-variant-numeric: tabular-nums; text-align: right; }
  .foot { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 14px; margin: 6px 0 0; }
  .num { font-variant-numeric: tabular-nums; }
</style>
