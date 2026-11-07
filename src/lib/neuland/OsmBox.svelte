<script>
  /**
   * «Neue Sammlungen» (Träume und Neuland N18, Noah 07.11.2026 «ok N18»), on New ground under a collection that comes from
   * OpenStreetMap (Lookout towers, Suspension bridges, Waterfalls): when the places were loaded, how many, and «Load again»
   * on a tap. The app also asks once a week by itself when New ground opens (osm.js). With nothing loaded yet the list
   * says why it is empty and offers «Load now». Credit: © OpenStreetMap contributors.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { OSM_KEY, osmRec, osmCounts, refreshOsm } from './osm.js';
  import { dayLong } from '../review/fmt.js';
  import { t, tn } from '../i18n.svelte.js';
  import { RefreshCw } from '@lucide/svelte';

  let { cid, empty = false } = $props();
  const q = liveQuery(async () => (await db.meta.get(OSM_KEY))?.value ?? null);
  const rec = $derived(osmRec($q));
  const counts = $derived(osmCounts($q));
  let busy = $state(false);
  let failed = $state(false);
  const dayOf = (ms) => new Date(ms).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
  async function load() {
    if (busy) return;
    busy = true;
    failed = false;
    const r = await refreshOsm(db);
    failed = !r.ok;
    busy = false;
  }
</script>

<div class="ob" data-osm-box={cid}>
  {#if empty}
    <p class="ob-t" data-osm-empty>{rec.at ? t('No place with a name found for this in OpenStreetMap.') : t('Not loaded yet. The places come from OpenStreetMap, once a week by themselves or now on a tap.')}</p>
  {:else}
    <p class="ob-t" data-osm-status>{t('Loaded from OpenStreetMap on {day}: {n}.', { day: dayLong(dayOf(rec.at)), n: tn(counts[cid] ?? 0, '{n} place', '{n} places') })}</p>
  {/if}
  {#if failed}<p class="ob-e" role="status" data-osm-error>{t("OpenStreetMap didn't answer. Try again later.")}</p>{/if}
  <button type="button" class="btn sm" onclick={load} disabled={busy} data-osm-load><RefreshCw size={16} aria-hidden="true" />{busy ? t('Loading…') : rec.at ? t('Load again') : t('Load now')}</button>
  <p class="ob-c" data-osm-credit>{t('Data © OpenStreetMap contributors.')}</p>
</div>

<style>
  .ob {
    display: grid;
    gap: var(--sp-2);
    justify-items: start;
    padding: var(--sp-3) 0 0;
  }
  .ob p {
    margin: 0;
    overflow-wrap: break-word;
  }
  .ob-t {
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .ob-e {
    font-size: var(--fs-small);
    color: var(--warn);
  }
  .ob-c {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .ob .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
</style>
