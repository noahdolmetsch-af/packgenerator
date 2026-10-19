<script>
  /**
   * Paket U «Rennen» on Heute (Noah 19.10.2026 «3b», his OK for this HN4 addition): one small line
   * «Race in X days» with a link, only when a race of yours is coming (the sample race does not count).
   */
  import { Flag } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, tn } from '../i18n.svelte.js';

  let { today } = $props();
  const q = liveQuery(async () => {
    const races = (await db.settings.get('races'))?.value?.races ?? {};
    const ids = Object.keys(races).filter((id) => !races[id]?.sample);
    if (!ids.length) return null;
    const trips = (await db.trips.bulkGet(ids)).filter((x) => x && x.startDate && x.startDate >= today && !x.skipped);
    return trips.sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null;
  });
  const next = $derived($q ?? null);
  const days = $derived(next ? Math.round((Date.parse(`${next.startDate}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 864e5) : null);
</script>

{#if next}
  <p class="raceline" data-race-countdown>
    <Flag size={14} aria-hidden="true" />
    <a href="#/race/{encodeURIComponent(next.id)}">{days === 0 ? t('{name} starts today', { name: next.title }) : tn(days, '{name} in {n} day', '{name} in {n} days', { name: next.title })}</a>
  </p>
{/if}

<style>
  .raceline {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 4px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .raceline a {
    color: inherit;
  }
</style>
