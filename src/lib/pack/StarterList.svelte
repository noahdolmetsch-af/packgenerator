<script>
  /**
   * Paket H «Packen leichter», answer 1a (Noah 19.10.2026 «1b und a»): the ready suggestion list of the
   * trip's sport (startlists.js STARTERS). A quiet row in Plan and a sheet: each line shows the thing of
   * your own that fits; a tick puts it on the trip (or takes it off), «Not needed» strikes the line for
   * this trip, and a thing you do not have can go on the wishlist. A suggestion only: nothing comes by
   * itself.
   */
  import { backClose } from '../ui/backclose.js';
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { domainOf, domainName, inDomain } from '../domains.js';
  import { starterRows, startersFor } from '../startlists.js';
  import { t, nameOf } from '../i18n.svelte.js';
  import { ListChecks, ChevronRight } from '@lucide/svelte';
  import ItemDialog from '../gear/ItemDialog.svelte';

  let { trip, items = [], onadd, onremove, fixed = false } = $props();

  const domain = $derived(domainOf(trip));
  const skip = $derived(new Set(trip?.starterSkip ?? []));
  const rows = $derived(starterRows(domain, items, trip?.entries ?? [], (i) => inDomain(i, domain)));
  const done = $derived(rows.filter((r) => r.onTrip || skip.has(r.line.name)).length);
  let open = $state(false);
  let el = $state();
  let wish = $state(null);

  $effect(() => {
    if (open && el && !el.open) el.showModal();
  });

  async function setSkip(name, on) {
    const id = trip.id;
    await db.transaction('rw', db.trips, async () => {
      const cur = await db.trips.get(id);
      if (!cur) return;
      const list = new Set(cur.starterSkip ?? []);
      on ? list.add(name) : list.delete(name);
      await db.trips.update(id, touched({ starterSkip: [...list] }));
    });
  }
  const flip = (r) => (r.onTrip ? onremove?.(r.item.id) : onadd?.(r.item.id));
</script>

{#if startersFor(domain).length}
  <button type="button" class="tp-fold st-row" onclick={() => (open = true)}>
    <ListChecks size={20} aria-hidden="true" /><span>{t('Suggestion list {sport}', { sport: t(domainName(domain)) })}</span>
    <span class="r"><i class="tp-badge num">{done}/{rows.length}</i><ChevronRight class="chev" size={18} aria-hidden="true" /></span>
  </button>
{/if}

{#if open}
  <dialog use:backClose class="calm-sheet st-sheet" bind:this={el} onclose={() => (open = false)} aria-labelledby="st-h">
    <header><h2 id="st-h">{t('Suggestion list {sport}', { sport: t(domainName(domain)) })}</h2><button type="button" class="text-button" onclick={() => el.close()}>{t('Close')}</button></header>
    <p class="sub">{t('What usually belongs on this kind of trip. Tick what you take: it goes on your packing list. Only a suggestion.')}</p>
    <ul class="st">
      {#each rows as r (r.line.name)}
        {@const off = skip.has(r.line.name)}
        <li class:off class:on={r.onTrip}>
          {#if r.item}
            <label>
              <input type="checkbox" checked={r.onTrip} disabled={fixed || off} onchange={() => flip(r)} />
              <span class="nm"><b>{t(r.line.name)}</b><small>{nameOf(r.item)}</small></span>
            </label>
          {:else}
            <span class="nm miss"><b>{t(r.line.name)}</b><small>{t('Nothing of yours fits yet')}</small></span>
            {#if !off}<button type="button" class="text-button" onclick={() => (wish = r.line)}>{t('On the wishlist')}</button>{/if}
          {/if}
          {#if !r.onTrip}<button type="button" class="text-button skip" aria-pressed={off} onclick={() => setSkip(r.line.name, !off)}>{off ? t('Show again') : t('Not needed')}</button>{/if}
        </li>
      {/each}
    </ul>
    <footer><button type="button" class="primary" onclick={() => el.close()}>{t('Done')}</button></footer>
  </dialog>
{/if}

{#if wish}
  <ItemDialog item={null} {items} preset={{ name: t(wish.name), ownership: 'wishlist', domains: [domain] }} onclose={() => (wish = null)} />
{/if}

<style>
  .st-row { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 56px; padding: 6px 16px; color: var(--ink); font-family: var(--font-body); font-weight: 500; font-size: var(--fs-body); text-align: left; cursor: pointer; }
  .st-row > :global(svg:first-child) { color: var(--ink-3); flex: none; }
  .st-row .r { margin-left: auto; display: flex; align-items: center; gap: 8px; color: var(--ink-3); }
  .st-sheet { max-width: 560px; }
  .st-sheet > footer { margin-top: 16px; }
  .sub { margin: -12px 0 8px; color: var(--ink-3); font-size: var(--fs-small); }
  .st { list-style: none; margin: 0; padding: 0; }
  .st li { display: flex; align-items: center; gap: 10px; min-height: 52px; border-bottom: 1px solid var(--line); flex-wrap: wrap; }
  .st label { display: flex; align-items: center; gap: 12px; flex: 1 1 auto; cursor: pointer; min-height: 48px; }
  .st input { width: 22px; height: 22px; flex: none; accent-color: var(--ok); }
  .nm { display: grid; flex: 1 1 auto; min-width: 0; }
  .nm small { color: var(--ink-2); font-size: var(--fs-small); }
  .miss { padding-left: 34px; }
  .st li.off .nm { color: var(--ink-3); text-decoration: line-through; }
  .skip { margin-left: auto; }
</style>
