<script>
  /**
   * «Kochen» (Noah 28.10.2026 «1b 2a 3a 4a 5a», thread «Einfache Kochrezepte»): Ich › Alltag › Kochen
   * (#/me/alltag/kochen). The app's own very simple recipes and your own ones from Freie Zeit, by meal.
   * A recipe (#/me/alltag/kochen/<id>) shows its ingredients for 1 to 8 portions, puts them on the shopping
   * list (Undo) and lists all steps. «Don't show again» hides an app recipe (Undo; «Hidden» brings it back).
   * Nothing on Heute (Noah «1b»). Cooking step by step and the daily tips come in their own steps.
   */
  import { ChevronRight, Clock, Minus, Plus, ShoppingCart, EyeOff, Eye, Pencil, ChefHat } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import Crumb from '../flow/kit/Crumb.svelte';
  import { offerDone } from '../ui/rename.svelte.js';
  import { db } from '../db.js';
  import { change, restore } from '../alltagdb.js';
  import { cfgQuery } from '../freidb.js';
  import { collsOf, collHref, pageHref } from '../frei.js';
  import { loadLists, changeList, restoreLists } from '../frei/shoplist.js';
  import { ALLTAG_HASH } from '../alltag.js';
  import { PREFS_KEY, KOCHEN_HASH, FILTERS, prefsOf, recipeOfHash, recipeHref, ownRecipes, listFor, hiddenRecipes, findRecipe, ingredientRows, shoppingLines, mealLabels } from '../kochen/kochen.js';
  import { t, tn } from '../i18n.svelte.js';

  let { hash = '' } = $props();

  const prefsQ = liveQuery(async () => prefsOf((await db.settings.get(PREFS_KEY))?.value));
  const prefs = $derived($prefsQ ?? { hidden: [] });
  const cfgQ = cfgQuery();
  const colls = $derived(collsOf($cfgQ ?? {}));
  const rowsQ = liveQuery(() => db.frei.where('kind').equals('entry').toArray());
  const own = $derived(ownRecipes($rowsQ ?? [], colls));
  const recipeColl = $derived(colls.find((c) => c.type === 'recipes' && !c.hidden) ?? null);

  let filter = $state('all');
  const list = $derived(listFor(filter, { hidden: prefs.hidden, own }));
  const hidden = $derived(hiddenRecipes(prefs.hidden));

  const openId = $derived(recipeOfHash(hash));
  const recipe = $derived(findRecipe(openId, own));
  let portions = $state(1);
  $effect(() => {
    openId;
    portions = 1;
  });
  const rows = $derived(ingredientRows(recipe, portions, t));

  const line = (x) =>
    x.own
      ? t('Your own recipe from Free time')
      : [t('{n} min', { n: x.min }), tn(x.ingredients.length, '{n} ingredient', '{n} ingredients'), mealLabels(x).map((m) => t(m)).join(', ')].join(' · ');

  async function toShopping() {
    const lines = shoppingLines(recipe, portions, t);
    if (!lines.length) return offerDone(t('This recipe has no ingredients yet.'));
    const before = await loadLists();
    await changeList(lines, t('Shopping list'));
    offerDone(tn(lines.length, '{n} ingredient is on your shopping list.', '{n} ingredients are on your shopping list.'), () => restoreLists(before));
  }
  async function hide(x) {
    const before = await change(PREFS_KEY, {}, (p) => ({ ...p, hidden: [...new Set([...prefsOf(p).hidden, x.id])] }));
    if (openId) location.hash = KOCHEN_HASH;
    offerDone(t('«{name}» is hidden. «Hidden» at the end of the list brings it back.', { name: t(x.title) }), () => restore(PREFS_KEY, before));
  }
  async function unhide(x) {
    const before = await change(PREFS_KEY, {}, (p) => ({ ...p, hidden: prefsOf(p).hidden.filter((id) => id !== x.id) }));
    offerDone(t('«{name}» is back in the list.', { name: t(x.title) }), () => restore(PREFS_KEY, before));
  }
  const ownHref = $derived(recipeColl ? collHref(recipeColl.id) : pageHref('sammlungen'));
</script>

{#if openId}
  <div class="fz" data-page="kochen-rezept">
    <Crumb path={[{ href: ALLTAG_HASH, label: t('Everyday life') }, { href: KOCHEN_HASH, label: t('Cooking') }]} here={recipe ? (recipe.own ? recipe.title : t(recipe.title)) : t('Recipe')} />
    {#if !recipe}
      <h1 class="fz-h1" tabindex="-1" data-page-title>{t('Recipe')}</h1>
      <p class="fz-empty">{t('This recipe is not here any more.')} <a href={KOCHEN_HASH}>{t('All recipes')}</a></p>
    {:else}
      <h1 class="fz-h1" tabindex="-1" data-page-title>{recipe.own ? recipe.title : t(recipe.title)}</h1>
      {#if !recipe.own}
        <p class="fz-intro ko-facts"><Clock size={16} aria-hidden="true" />{line(recipe)}</p>
      {/if}
      <div class="ko-two">
        <section class="fz-box ko-ing" aria-labelledby="ko-ing-h" data-ko-ingredients>
          <div class="ko-head">
            <h2 class="fz-h2" id="ko-ing-h">{t('Ingredients')}</h2>
            {#if !recipe.own}
              <div class="ko-step" role="group" aria-label={t('Portions')}>
                <button type="button" class="fz-icon" aria-label={t('One portion less')} disabled={portions <= 1} onclick={() => (portions = Math.max(1, portions - 1))} data-ko-less><Minus size={18} aria-hidden="true" /></button>
                <span data-ko-portions>{tn(portions, '{n} portion', '{n} portions')}</span>
                <button type="button" class="fz-icon" aria-label={t('One portion more')} disabled={portions >= 8} onclick={() => (portions = Math.min(8, portions + 1))} data-ko-more><Plus size={18} aria-hidden="true" /></button>
              </div>
            {/if}
          </div>
          {#if rows.length}
            <ul class="ko-rows">
              {#each rows as r, i (i)}
                <li data-ko-ing={r.name}><span>{r.name}</span>{#if r.amount}<small>{r.amount} {r.unit}</small>{/if}</li>
              {/each}
            </ul>
          {:else}
            <p class="fz-note">{t('This recipe has no ingredients yet.')}</p>
          {/if}
          {#if !recipe.own}<p class="fz-note">{t('Salt, pepper and water are not on the list; you have them at home.')}</p>{/if}
          <div class="fz-acts"><button type="button" class="btn" onclick={toShopping} disabled={!rows.length} data-ko-shop><ShoppingCart size={16} aria-hidden="true" />{t('Add to the shopping list')}</button></div>
        </section>
        <section class="fz-box" aria-labelledby="ko-steps-h" data-ko-steps>
          <h2 class="fz-h2" id="ko-steps-h">{t('All steps at a glance')}</h2>
          {#if recipe.steps.length}
            <ol class="ko-ol">
              {#each recipe.steps as s, i (i)}
                <li data-ko-step={i + 1}><span class="ko-num" aria-hidden="true">{i + 1}</span><span>{recipe.own ? s.text : t(s.text)}{#if s.min}<small>{t('about {n} min', { n: s.min })}</small>{/if}</span></li>
              {/each}
            </ol>
          {:else}
            <p class="fz-note">{t('No steps written yet.')}</p>
          {/if}
        </section>
      </div>
      <div class="fz-acts">
        {#if recipe.own}
          <a class="btn" href={collHref(recipe.coll)} data-ko-edit-own><Pencil size={16} aria-hidden="true" />{t('Change it in Free time')}</a>
        {:else}
          <button type="button" class="btn" onclick={() => hide(recipe)} data-ko-hide><EyeOff size={16} aria-hidden="true" />{t("Don't show again")}</button>
        {/if}
      </div>
    {/if}
  </div>
{:else}
  <div class="fz" data-page="kochen">
    <Crumb path={[{ href: '#/week', label: t('Plan|place') }, { href: ALLTAG_HASH, label: t('Everyday life') }]} here={t('Cooking')} />
    <h1 class="fz-h1" tabindex="-1" data-page-title>{t('Cooking')}</h1>
    <p class="fz-intro">{t('Very simple meals: at most 6 ingredients and 20 minutes. Tap a recipe for its ingredients and all steps.')}</p>
    <div class="fz-chips" role="group" aria-label={t('Which meal')}>
      {#each FILTERS as f (f.key)}
        <button type="button" class="fz-chip" aria-pressed={filter === f.key} onclick={() => (filter = f.key)} data-ko-filter={f.key}>{t(f.label)}</button>
      {/each}
    </div>
    {#if !list.length}
      <p class="fz-empty" data-ko-empty>
        {filter === 'own' ? t('No own recipe yet. Write one in Free time › My collections; it shows here too.') : t('All recipes of this meal are hidden. «Hidden» below brings them back.')}
        {#if filter === 'own'}<a href={ownHref}>{t('Write a recipe')}</a>{/if}
      </p>
    {:else}
      <ul class="fz-box fz-list" aria-label={t('Recipes')} data-ko-list>
        {#each list as x (x.id)}
          <li>
            <a class="fz-row ko-row" href={recipeHref(x.id)} data-ko-recipe={x.id}>
              <span class="fz-icon" aria-hidden="true"><ChefHat size={20} /></span>
              <span class="fz-row-main"><b>{x.own ? x.title : t(x.title)}</b><small>{line(x)}</small></span>
              <ChevronRight size={18} aria-hidden="true" />
            </a>
          </li>
        {/each}
      </ul>
    {/if}
    <p class="fz-note">{t('Your own recipes from Free time › My collections show here too.')} <a href={ownHref} data-ko-own-link>{t('Write a recipe')}</a></p>
    {#if hidden.length}
      <details class="fz-box" data-ko-hidden>
        <summary>{tn(hidden.length, 'Hidden ({n})', 'Hidden ({n})')}</summary>
        <ul class="fz-list">
          {#each hidden as x (x.id)}
            <li class="fz-row"><span class="fz-row-main"><b>{t(x.title)}</b></span><button type="button" class="btn sm" onclick={() => unhide(x)} data-ko-unhide={x.id}><Eye size={16} aria-hidden="true" />{t('Show again')}</button></li>
          {/each}
        </ul>
      </details>
    {/if}
  </div>
{/if}

<style>
  a.ko-row {
    color: var(--ink);
    text-decoration: none;
  }
  .ko-facts {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .ko-two {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr);
    gap: 16px;
    align-items: start;
  }
  @media (max-width: 760px) {
    .ko-two {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .ko-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .ko-step {
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 600;
  }
  .ko-rows,
  .ko-ol {
    list-style: none;
    margin: 8px 0;
    padding: 0;
  }
  .ko-rows li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--line);
    min-height: 44px;
    align-items: center;
  }
  .ko-rows li:last-child,
  .ko-ol li:last-child {
    border-bottom: 0;
  }
  .ko-rows small {
    color: var(--ink-2);
    white-space: nowrap;
  }
  .ko-ol li {
    display: flex;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--line);
    align-items: flex-start;
  }
  .ko-ol li small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ko-num {
    flex: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--paper-2);
    display: grid;
    place-items: center;
    font-weight: 700;
    font-size: var(--fs-small);
  }
  details summary {
    cursor: pointer;
    font-weight: 600;
    min-height: 44px;
    display: flex;
    align-items: center;
  }
</style>
