<script>
  import { readLite } from '../actlite.js';
  /**
   * «Route kennt deine Erfahrung» (S3, Noah 21.11.2026): under the route of a trip, what your own rides say about it.
   * The stretches you marked as bad or good after a ride show at once (one small settings row); how much of the
   * route is new for you needs all rides, so it is counted only after a tap. Nothing is changed, nothing is stored.
   * Hidden for a trip without a route line.
   */
  import { liveQuery } from 'dexie';
  import { TriangleAlert } from '@lucide/svelte';
  import { db } from '../db.js';
  import { WAYS_KEY, cleanMemory } from '../live/wegegedaechtnis.js';
  import { heatLines } from '../heat/heat.js';
  import { localDay } from '../localday.js';
  import { experience, experienceLines } from './erfahrung.js';
  import { t, tn, num } from '../i18n.svelte.js';

  let { route } = $props();
  const line = $derived(Array.isArray(route?.line) && route.line.length > 1 ? route.line : null);

  const memQ = liveQuery(() => db.settings.get(WAYS_KEY));
  const ways = $derived(cleanMemory($memQ?.value).ways);

  let lines = $state.raw(null); // the bike lines of all rides, only after the tap
  let busy = $state(false);
  async function compare() {
    busy = true;
    try {
      const [activities, rides, tracks, entries] = await Promise.all([
        db.activities ? readLite(db, (T) => T.toArray()) : [],
        db.rides.toArray(),
        db.tracks ? db.tracks.where('kind').equals('rec').toArray() : [],
        db.kmBook.toArray(),
      ]);
      lines = heatLines({ activities, rides, tracks, entries, today: localDay() }).filter((l) => l.kind === 'bike');
    } finally {
      busy = false;
    }
  }

  const exp = $derived(line ? experience({ line, ways, lines: lines?.length ? lines : null }) : null);
  const rows = $derived(exp ? experienceLines(exp, { t, tn, num }) : []);
</script>

{#if line}
  <div class="rk" data-route-known>
    {#if rows.length}
      <ul>
        {#each rows as r (r.key)}
          <li data-route-known-line={r.key} class:bad={r.key === 'bad'}>
            {#if r.key === 'bad'}<TriangleAlert size={14} aria-hidden="true" />{/if}{r.text}
          </li>
        {/each}
      </ul>
    {/if}
    {#if lines && !lines.length}
      <p class="tp-small tp-muted" data-route-known-empty>{t('No ride with a line yet. Connect Strava or upload a ride, then the app can tell how new a route is.')}</p>
    {:else if !lines}
      <button type="button" class="link" onclick={compare} disabled={busy} data-route-known-compare>{busy ? t('Counting …') : t('How new is this route for me?')}</button>
    {/if}
    {#if !ways.length}
      <p class="tp-small tp-muted" data-route-known-hint>{t('After a ride you can mark stretches as good or bad. The route then tells you where they lie.')}</p>
    {/if}
  </div>
{/if}

<style>
  .rk {
    display: grid;
    gap: 4px;
    margin-top: 6px;
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--fs-small);
    display: grid;
    gap: 2px;
  }
  li.bad {
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }
  li.bad :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--warn, var(--accent));
  }
  p {
    margin: 0;
  }
  .link {
    justify-self: start;
  }
</style>
