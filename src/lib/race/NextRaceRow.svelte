<script>
  /**
   * Alles fertig (Versteckte Funktionen, Noah 22.10.2026 «1a»): a race is a trip, so «Your race» stands at the
   * top of Touren as soon as one is planned (the same row as in Training). Nothing shows without a coming race.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { racesQuery } from './store.js';
  import { raceTrips, daysBetween } from './race.js';
  import { raceHref } from './parts.js';
  import { localDay } from '../localday.js';
  import { t, tn } from '../i18n.svelte.js';
  import { Flag, ChevronRight } from '@lucide/svelte';

  const tripsQ = liveQuery(() => db.trips.toArray());
  const racesQ = racesQuery();
  const today = localDay();
  const next = $derived(raceTrips($tripsQ ?? [], $racesQ ?? {}, today).coming.find((r) => r.startDate && r.startDate >= today) ?? null);
</script>

{#if next}
  {@const d = daysBetween(today, next.startDate)}
  <a class="race-top" href={raceHref(next.id)} data-next-race-top>
    <Flag size={18} aria-hidden="true" />
    <span>{t('Your race: {name} · {when}', { name: next.title, when: d === 0 ? t('today') : tn(d, 'in {n} day', 'in {n} days') })}</span>
    <ChevronRight size={16} aria-hidden="true" />
  </a>
{/if}

<style>
  .race-top {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 44px;
    margin: var(--sp-2) 0;
    padding: var(--sp-2) var(--sp-3);
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    background: var(--paper);
    color: var(--ink);
    font-weight: 600;
    text-decoration: none;
    overflow-wrap: break-word;
  }
  .race-top span {
    flex: 1;
  }
</style>
