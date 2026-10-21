<script>
  /**
   * Paket SP 1126 «Erst am Abfahrtsmorgen» (Noah 20.10.2026 «3a»): on the morning of the start, the items
   * marked «only on the morning» as one short list on Unterwegs. A tick packs the item on the trip.
   * Nothing shows on other days or when the list is empty.
   */
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { t, nameOf } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { morningOf, startMorning } from './spack.js';
  import { Sunrise } from '@lucide/svelte';

  let { trip, itemsById = {} } = $props();
  const list = $derived(startMorning(trip, localDay()) ? morningOf(trip, itemsById) : []);
  const left = $derived(list.filter((r) => !r.e.packed).length);
  function tick(itemId, on) {
    const entries = (trip.entries ?? []).map((e) => (e.itemId === itemId ? { ...e, packed: on } : e));
    db.trips.update(trip.id, touched({ entries: JSON.parse(JSON.stringify(entries)) }));
  }
</script>

{#if list.length}
  <section class="card mlist" aria-labelledby="ml-h" data-morning-list>
    <h2 id="ml-h" class="sh"><Sunrise size={18} aria-hidden="true" />{t('This morning, still pack')}</h2>
    <p class="tp-small tp-muted">{left ? t('{n} left', { n: left }) : t('All in. Have a good ride!')}</p>
    <ul>
      {#each list as r (r.e.itemId)}
        <li><label><input type="checkbox" checked={!!r.e.packed} onchange={(ev) => tick(r.e.itemId, ev.currentTarget.checked)} /><span>{nameOf(r.item)}</span></label></li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .mlist {
    padding: 12px 14px;
    margin: 0 0 12px;
  }
  .mlist h2 {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  ul {
    list-style: none;
    margin: 6px 0 0;
    padding: 0;
  }
  label {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    overflow-wrap: break-word;
  }
</style>
