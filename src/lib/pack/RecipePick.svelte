<script>
  /**
   * «A recipe that worked» (Noah 04.11.2026 «5a», Persönliches Lernen Idee 5): in Planen of a bike tour, when you
   * have kept success recipes (tour page › «Save as a recipe»), one tap puts one next to this trip: breakfast, start
   * time, food and pace as you wrote them. A second tap on the chosen recipe takes it away. Never advice: it only
   * shows your own words. Without a recipe the card is not there. trip: the trip; fixed: the trip is over (read only).
   */
  import { liveQuery } from 'dexie';
  import { ChefHat } from '@lucide/svelte';
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { t } from '../i18n.svelte.js';
  import { RECIPES_KEY, RECIPE_ID_FIELD, recipesOf, recipeOfTrip, linesOf } from '../rezept.js';

  let { trip, fixed = false } = $props();
  const recQ = liveQuery(() => db.settings.get(RECIPES_KEY));
  const list = $derived(recipesOf($recQ?.value));
  const chosen = $derived(recipeOfTrip(list, trip));
  const pick = (id) => db.trips.update(trip.id, touched({ [RECIPE_ID_FIELD]: chosen?.id === id ? null : id }));
</script>

{#if list.length && !(fixed && !chosen)}
  <section class="rp card pad" aria-labelledby="rp-h" data-recipe-pick>
    <h2 id="rp-h"><ChefHat size={18} aria-hidden="true" />{t('A recipe that worked')}</h2>
    {#if !fixed}
      <p class="ws">{t('Put one of your own recipes next to this tour. Only if you want.')}</p>
      <div class="chips" role="group" aria-labelledby="rp-h">
        {#each list as r (r.id)}<button type="button" class="chip" aria-pressed={chosen?.id === r.id} onclick={() => pick(r.id)} data-recipe-choose={r.id}>{r.name}</button>{/each}
      </div>
    {/if}
    {#if chosen}
      <dl class="ln" data-recipe-lines>{#each linesOf(chosen) as l (l.key)}<div><dt>{t(l.label)}</dt><dd>{l.value}</dd></div>{/each}</dl>
    {/if}
    <a class="btn btn-link" href="#/pack/templates">{t('All recipes: Templates')}</a>
  </section>
{/if}

<style>
  .rp { display: grid; gap: 8px; min-width: 0; margin: 16px 0 8px; }
  h2 { display: flex; align-items: center; gap: 8px; margin: 0; font: 600 var(--fs-sub) / 1.3 var(--font-body); }
  .ws { margin: 0; color: var(--ink-2); font-size: var(--fs-small); }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip { min-height: 44px; padding: 8px 14px; border: 1px solid var(--line); border-radius: 999px; background: var(--paper); color: var(--ink); font: inherit; cursor: pointer; }
  .chip[aria-pressed='true'] { background: var(--hi); border-color: var(--hi); color: var(--hi-ink); }
  .ln { margin: 0; display: grid; gap: 4px; }
  .ln div { display: grid; grid-template-columns: minmax(90px, auto) 1fr; gap: 8px; }
  .ln dt { color: var(--ink-2); font-size: var(--fs-small); }
  .ln dd { margin: 0; }
  .rp :global(.btn) { min-height: 44px; justify-self: start; }
</style>
