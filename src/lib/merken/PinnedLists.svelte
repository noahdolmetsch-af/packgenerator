<script>
  /**
   * Eigene Listen, pinned (Noah 14.10.2026 «3a», «5 ok»): the lists pinned to this place, each as a small
   * card with its open points to tick; «Open ›» goes to the whole list in Kalender › Merken. Nothing shows
   * where no list is pinned. place: one of PIN_PLACES; tripId: the trip (place 'trips', an extra block when packing).
   */
  import { liveQuery } from 'dexie';
  import { ChevronRight, ListChecks } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { LISTS_KEY, pinnedTo, openCount } from '../lists.js';
  import ListView from './ListView.svelte';

  let { place, tripId = null } = $props();
  const q = liveQuery(async () => (await db.settings.get(LISTS_KEY))?.value ?? []);
  const lists = $derived(pinnedTo($q ?? [], place, tripId));
</script>

{#if lists.length}
  <section class="pinned" aria-label={t('My lists')} data-pinned={place}>
    {#each lists as l (l.id)}
      <div class="card plist">
        <div class="ph">
          <ListChecks size={18} aria-hidden="true" />
          <h2>{l.name}</h2>
          <span class="n">{t('{n} open', { n: openCount(l) })}</span>
          <a class="open" href={`#/calendar/list/${l.id}`}>{t('Open')}<ChevronRight size={16} aria-hidden="true" /></a>
        </div>
        <ListView list={l} compact />
      </div>
    {/each}
  </section>
{/if}

<style>
  .pinned {
    display: grid;
    gap: 12px;
    margin: 16px 0;
  }
  .plist {
    padding: 12px 16px;
  }
  .ph {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ph h2 {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: var(--fs-sub);
    overflow-wrap: break-word;
  }
  .n {
    color: var(--ink-2);
    font-size: var(--fs-small);
    white-space: nowrap;
  }
  .open {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink);
    white-space: nowrap;
  }
</style>
