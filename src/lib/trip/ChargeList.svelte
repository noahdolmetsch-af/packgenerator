<script>
  /**
   * v0.34.0 (L4, L8): the devices of this trip to charge, with ticks. The evening before the trip
   * (night null: trip.charge) or an evening on the way (night: the date, trip.chargeNight[date]).
   * The ticks are saved on the trip right away; the items never change (charge.js).
   * v0.105.0 Design-Refresh P5 (T8, approved 12.10.2026): rows with a check box, the bag under the
   * name and a small bolt; in the sheet (head) «2 von 6 geladen» with a bar on top, «Alles geladen»
   * is the sheet's button.
   */
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { SLOTS } from '../bikes.js';
  import { t } from '../i18n.svelte.js';
  import { chargeList, chargeCount, isCharged, toggleCharge, chargeAll } from '../charge.js';
  import { Check, Zap } from '@lucide/svelte';
  import './trip.css';

  let { trip, items = [], night = null, head = false } = $props();

  const list = $derived(chargeList(trip, items));
  const count = $derived(chargeCount(trip, list, night));
  // where the device is packed: «Oberrohrtasche», «Am Körper», «Am Velo»
  const placeOf = (itemId) => {
    const slot = trip.entries?.find((e) => e.itemId === itemId)?.slot;
    if (!slot) return '';
    if (slot === 'body') return t('On me');
    if (slot === 'mounted') return t('On the bike');
    const pack = trip.packs?.find((p) => p.key === slot);
    return trip.purpose?.[slot] || (pack ? t(pack.name) : t(SLOTS.find((s) => s.key === slot)?.name ?? slot));
  };

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
    {#if head}
      <p class="prog"><b class="num">{t('{done} of {n} charged', { done: count.done, n: count.total })}</b><span class="bar" aria-hidden="true"><i style:width="{count.total ? (count.done / count.total) * 100 : 0}%"></i></span></p>
    {/if}
    <ul class="rows" class:card={head} aria-label={night ? t('Charge tonight') : t('Charge the evening before')}>
      {#each list as r (r.itemId)}
        {@const on = isCharged(trip, r.itemId, night)}
        {@const place = placeOf(r.itemId)}
        <li class:on>
          <button type="button" class="it" aria-pressed={on} onclick={() => tick(r.itemId)}>
            <span class="box" aria-hidden="true">{#if on}<Check size={16} strokeWidth={2.5} />{/if}</span>
            <span class="nm">{r.name}{#if r.qty > 1}<span class="q num">{' '}× {r.qty}</span>{/if}{#if place}<small>{place}</small>{/if}</span>
            <Zap class="zap" size={18} aria-hidden="true" />
          </button>
        </li>
      {/each}
    </ul>
    {#if !head}
      <p class="foot">
        <span class="tp-badge num" class:ok={count.done === count.total}>{t('{done} of {n} charged', { done: count.done, n: count.total })}</span>
        {#if count.done < count.total}<button type="button" class="tp-link" onclick={tickAll}>{t('All charged')}</button>{/if}
      </p>
    {/if}
  {/if}
</div>

<style>
  .charge { min-width: 0; }
  .none { margin: 0; color: var(--ink-3); font-size: var(--fs-small); }
  .prog { display: flex; align-items: center; gap: 12px; margin: 0 0 10px; }
  .prog b { flex: none; font-weight: 600; }
  .bar { flex: 1; height: 6px; border-radius: 9px; background: var(--paper-2); overflow: hidden; }
  .bar i { display: block; height: 100%; background: var(--hi); }
  .rows { list-style: none; margin: 0; padding: 0; }
  .rows.card { padding-top: 4px; padding-bottom: 4px; }
  li + li .it { border-top: 1px solid var(--line); }
  .it { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 52px; padding: 6px 0; border: 0; background: none; color: var(--ink); font: 400 var(--fs-body) / 1.3 var(--font-body); text-align: left; cursor: pointer; }
  .box { flex: none; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 6px; border: 1.5px solid var(--line-strong); background: var(--paper); }
  .on .box { background: var(--hi); border-color: var(--hi); color: var(--hi-ink); }
  .on .nm { color: var(--ink-3); text-decoration: line-through; text-decoration-thickness: 1px; }
  .nm { flex: 1 1 auto; min-width: 0; overflow-wrap: break-word; }
  .nm small { display: block; font-size: var(--fs-small); color: var(--ink-2); }
  .q { color: var(--ink-3); }
  .it :global(.zap) { flex: none; color: var(--ink-2); }
  .foot { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 14px; margin: 6px 0 0; }
  .num { font-variant-numeric: tabular-nums; }
</style>
