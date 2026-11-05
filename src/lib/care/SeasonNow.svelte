<script>
  /**
   * «Velos-Pflege einbauen» (Noah 03.11.2026 «2a»): «Fits now», what the time of year suggests (src/lib/season.js).
   * On Bikes › Care a small card; on Today a line in «Your moment». Only a suggestion: it shows by month and goes
   * away when the checklist is done. Nothing is stored.
   */
  import { liveQuery } from 'dexie';
  import { Snowflake } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { activeBikes } from '../bikeretire.js';
  import { SEASON_KEY } from '../griff.js';
  import { seasonNow } from '../season.js';

  let { today, area = 'velo', compact = false } = $props();
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const seasonQ = liveQuery(() => db.settings.get(SEASON_KEY));
  const rules = $derived(seasonNow(today, { area, bikes: activeBikes($bikesQ ?? []), season: $seasonQ?.value ?? null }));
</script>

{#if rules.length}
  {#if compact}
    <p class="sn-line" data-season-now>{t('Fits now:')} {#each rules as r, i (r.id)}{#if i}{', '}{/if}<a href={r.href}>{t(r.label)}</a>{/each}</p>
  {:else}
    <section class="sn card" aria-labelledby="sn-h" data-season-now>
      <h2 id="sn-h"><Snowflake size={16} aria-hidden="true" /> {t('Fits now')}</h2>
      <ul>
        {#each rules as r (r.id)}<li><a class="btn sm" href={r.href} data-season-rule={r.id}>{t(r.label)}</a></li>{/each}
      </ul>
      <p class="quiet">{t('A suggestion for this month. It goes away when the list is done.')}</p>
    </section>
  {/if}
{/if}

<style>
  .sn {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    padding: var(--sp-3) var(--sp-4);
  }
  .sn h2 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: var(--fs-body);
  }
  .sn ul {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .sn p {
    margin: 0;
    font-size: var(--fs-small);
  }
  .sn-line {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
