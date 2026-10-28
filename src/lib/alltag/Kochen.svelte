<script>
  /**
   * «Kochen» (Noah 28.10.2026 «1b 2a 3a 4a 5a», thread «Einfache Kochrezepte»): Ich › Alltag › Kochen
   * (#/me/alltag/kochen). The app's own very simple recipes and your own ones from Freie Zeit, by meal.
   * A recipe (#/me/alltag/kochen/<id>) shows its ingredients for 1 to 8 portions, puts them on the shopping
   * list (Undo) and lists all steps. «Don't show again» hides an app recipe (Undo; «Hidden» brings it back).
   * Nothing on Heute (Noah «1b»). Cooking step by step and the daily tips come in their own steps.
   * Groups (Noah 28.10.2026 «sinnvolle gruppen»): Meat, Rice, Desserts … as a second filter row. Gruppen überall:
   * rename, sort (arrows and drag), delete (asks where its recipes go, Undo), add own ones, back to the standard;
   * a recipe page puts the recipe in or out of any group.
   */
  import { ChevronRight, Clock, Play, Minus, Plus, ShoppingCart, EyeOff, Eye, Pencil, ChefHat, X, RotateCcw } from '@lucide/svelte';
  import CookMode from './CookMode.svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import GroupDeleteSheet from '../ui/GroupDeleteSheet.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
  import { phone } from '../media.svelte.js';
  import { liveQuery } from 'dexie';
  import Crumb from '../flow/kit/Crumb.svelte';
  import { offerDone } from '../ui/rename.svelte.js';
  import { db } from '../db.js';
  import { change, restore } from '../alltagdb.js';
  import { cfgQuery } from '../freidb.js';
  import { collsOf, collHref, pageHref } from '../frei.js';
  import { loadLists, changeList, restoreLists } from '../frei/shoplist.js';
  import { ALLTAG_HASH } from '../alltag.js';
  import { PREFS_KEY, KOCHEN_HASH, FILTERS, GROUP_FILTER, prefsOf, recipeOfHash, recipeHref, ownRecipes, listFor, hiddenRecipes, findRecipe, ingredientRows, shoppingLines, mealLabels, groupsOf, groupName, groupsOfRecipe, idsIn, setRecipeGroup, addGroup, renameGroup, deleteGroup, moveGroup, resetGroups, cookStepOfHash, cookHref } from '../kochen/kochen.js';
  import { uid } from '../alltag.js';
  import { t, tn } from '../i18n.svelte.js';

  let { hash = '' } = $props();

  const prefsQ = liveQuery(async () => prefsOf((await db.settings.get(PREFS_KEY))?.value));
  const prefs = $derived($prefsQ ?? prefsOf(null));
  const groups = $derived(groupsOf(prefs));
  const cfgQ = cfgQuery();
  const colls = $derived(collsOf($cfgQ ?? {}));
  const rowsQ = liveQuery(() => db.frei.where('kind').equals('entry').toArray());
  const own = $derived(ownRecipes($rowsQ ?? [], colls));
  const recipeColl = $derived(colls.find((c) => c.type === 'recipes' && !c.hidden) ?? null);

  let filter = $state('all');
  const list = $derived(listFor(filter, { hidden: prefs.hidden, own, prefs }));
  $effect(() => {
    // a deleted group's filter goes back to «All»
    if (filter.startsWith(GROUP_FILTER) && !groups.some((g) => GROUP_FILTER + g.id === filter)) filter = 'all';
  });
  const hidden = $derived(hiddenRecipes(prefs.hidden));

  const openId = $derived(recipeOfHash(hash));
  const recipe = $derived(findRecipe(openId, own));
  const cookStep = $derived(recipe?.steps?.length ? cookStepOfHash(hash) : 0);
  let portions = $state(1);
  $effect(() => {
    openId;
    portions = 1;
  });
  const rows = $derived(ingredientRows(recipe, portions, t));

  const line = (x) =>
    x.own
      ? t('Your own recipe from Free time')
      : [t('{n} min', { n: x.min }), tn(x.ingredients.length, '{n} ingredient', '{n} ingredients'), mealLabels(x).map((m) => t(m)).join(', ')].filter(Boolean).join(' · ');

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
  /* ---------- groups ---------- */
  const save = (fn, text = '') =>
    change(PREFS_KEY, {}, fn).then((before) => {
      if (text) offerDone(text, () => restore(PREFS_KEY, before));
      return before;
    });
  const gname = (g) => groupName(g, t);
  const inGroups = $derived(recipe ? groupsOfRecipe(prefs, recipe.id) : []);
  const toggleGroup = (g) => save((p) => setRecipeGroup(p, recipe.id, g.id, !inGroups.includes(g.id)));
  const countIn = (g) => idsIn(prefs, g.id, own).length;
  let newGroup = $state('');
  let renaming = $state(null);
  let deleting = $state(null);
  async function addGroupForm(e) {
    e.preventDefault();
    const v = newGroup.trim();
    if (!v || groups.some((g) => gname(g).toLowerCase() === v.toLowerCase())) return;
    await save((p) => addGroup(p, v, uid('kg')));
    newGroup = '';
  }
  const stepGroup = (id, dir) => {
    const i = groups.findIndex((g) => g.id === id);
    const to = Math.min(Math.max(i + dir, 0), groups.length - 1);
    return to === i ? null : save((p) => moveGroup(p, id, to));
  };
  const deleteNow = (to) => {
    const g = deleting;
    return save((p) => deleteGroup(p, g.id, to ?? '', own), t('"{name}" deleted.', { name: gname(g) }));
  };
  const reset = () => save(resetGroups, t('The standard groups are back.'));
  // cooking mode: each step is its own address, so the back key goes one step back
  const toStep = (n) => (location.hash = cookHref(recipe.id, n));
  const stopCooking = () => (location.hash = recipeHref(recipe.id));
  function doneCooking() {
    stopCooking();
    offerDone(t('Enjoy your meal!'));
  }
  const ownHref = $derived(recipeColl ? collHref(recipeColl.id) : pageHref('sammlungen'));
</script>

{#if openId && recipe && cookStep}
  <div class="fz" data-page="kochen-kochen">
    <CookMode {recipe} step={cookStep} {rows} onstep={toStep} onclose={stopCooking} ondone={doneCooking} />
  </div>
{:else if openId}
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
            <p class="fz-note">{t('Cooking mode: one step per screen, a timer where needed, the screen stays on.')}</p>
            <div class="fz-acts"><a class="btn hi" href={cookHref(recipe.id, 1)} data-ko-cook-start><Play size={16} aria-hidden="true" />{t('Start cooking')}</a></div>
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
      <section class="fz-box" aria-labelledby="ko-grp-h" data-ko-recipe-groups>
        <h2 class="fz-h2" id="ko-grp-h">{t('Groups')}</h2>
        <p class="fz-note">{t('Tap a group to put this recipe in or take it out.')}</p>
        <div class="fz-chips">
          {#each groups as g (g.id)}
            <button type="button" class="fz-chip" aria-pressed={inGroups.includes(g.id)} onclick={() => toggleGroup(g)} data-ko-in-group={g.id}>{gname(g)}</button>
          {/each}
        </div>
      </section>
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
    {#if groups.length}
      <div class="fz-chips" role="group" aria-label={t('Groups')} data-ko-group-chips>
        {#each groups as g (g.id)}
          <button type="button" class="fz-chip" aria-pressed={filter === GROUP_FILTER + g.id} onclick={() => (filter = GROUP_FILTER + g.id)} data-ko-filter={GROUP_FILTER + g.id}>{gname(g)}</button>
        {/each}
      </div>
    {/if}
    {#if !list.length}
      <p class="fz-empty" data-ko-empty>
        {filter === 'own' ? t('No own recipe yet. Write one in Free time › My collections; it shows here too.') : filter.startsWith(GROUP_FILTER) ? t('No recipe in this group yet. Open a recipe and tap the group to put it in.') : t('All recipes of this meal are hidden. «Hidden» below brings them back.')}
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
    <details class="fz-box" data-ko-groups>
      <summary>{t('Groups')}<small class="fz-note ko-count">{tn(groups.length, '{n} group', '{n} groups')}</small></summary>
      <p class="fz-note">{t('Rename, sort or delete the groups, or add your own. A deleted group never deletes its recipes.')}</p>
      {#if groups.length}
        <ul class="fz-list" use:sortable={{ onmove: (from, to) => save((p) => moveGroup(p, groups[from].id, to)) }}>
          {#each groups as g, n (g.id)}
            <li class="fz-row" data-sort-id={g.id} data-ko-grp={g.id}>
              <SortGrip name={gname(g)} onstep={(dir) => stepGroup(g.id, dir)} />
              <span class="fz-row-main"><b>{gname(g)}</b><small>{tn(countIn(g), '{n} recipe', '{n} recipes')}</small></span>
              {#if !phone.matches}<SortArrows name={gname(g)} i={n} n={groups.length} onstep={(dir) => stepGroup(g.id, dir)} />{/if}
              <button type="button" class="fz-icon" aria-label={t('Rename {name}', { name: gname(g) })} onclick={() => (renaming = g)} data-ko-grp-rename><Pencil size={18} aria-hidden="true" /></button>
              <button type="button" class="fz-icon" aria-label={t('Delete {name}', { name: gname(g) })} onclick={() => (deleting = g)} data-ko-grp-delete><X size={18} aria-hidden="true" /></button>
            </li>
          {/each}
        </ul>
      {/if}
      <form class="fz-inline" onsubmit={addGroupForm}>
        <input class="inp" maxlength="40" bind:value={newGroup} aria-label={t('New group')} placeholder={t('New group, e.g. For guests')} data-ko-grp-new />
        <button type="submit" class="btn"><Plus size={16} aria-hidden="true" />{t('Add')}</button>
      </form>
      {#if prefs.groups}
        <div class="fz-acts"><button type="button" class="btn sm" onclick={reset} data-ko-grp-reset><RotateCcw size={16} aria-hidden="true" />{t('Back to the standard groups')}</button></div>
      {/if}
    </details>
  </div>
{/if}

{#if renaming}
  <RenameSheet kicker={t('Group')} title={t('Rename group')} value={gname(renaming)} empty={renaming.std ? t('Empty brings back the standard name.') : ''} onsave={(name) => save((p) => renameGroup(p, renaming.id, name))} onclose={() => (renaming = null)} />
{/if}
{#if deleting}
  <GroupDeleteSheet
    title={t('Delete group «{name}»?', { name: gname(deleting) })}
    count={countIn(deleting)}
    what={(n) => tn(n, '{n} recipe', '{n} recipes')}
    none={t('Without a group')}
    noneHint={t('They stay in «All» and in their meal.')}
    targets={groups.filter((g) => g.id !== deleting.id).map((g) => ({ id: g.id, name: gname(g) }))}
    onconfirm={deleteNow}
    onclose={() => (deleting = null)}
  />
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
  .ko-count {
    margin-left: 8px;
    font-weight: 400;
  }
  details summary {
    cursor: pointer;
    font-weight: 600;
    min-height: 44px;
    display: flex;
    align-items: center;
  }
</style>
