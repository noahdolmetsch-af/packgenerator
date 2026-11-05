<script>
  /**
   * «Success recipes» (Noah 04.11.2026 «5a», Persönliches Lernen Idee 5): the list under Templates. Every recipe
   * shows what you kept (breakfast, start, food, pace); each can be changed, renamed and deleted (with Undo). New
   * ones come from a tour page after the Rückblick («Save as a recipe»). Nothing here advises: it shows your words.
   */
  import { liveQuery } from 'dexie';
  import { ChefHat, Pencil, Trash2 } from '@lucide/svelte';
  import { db } from '../db.js';
  import { putSetting } from '../flowdb.js';
  import { t } from '../i18n.svelte.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { RECIPES_KEY, PARTS, TEXT_MAX, NAME_MAX, recipesOf, changeRecipe, removeRecipe, linesOf } from '../rezept.js';

  const recQ = liveQuery(() => db.settings.get(RECIPES_KEY));
  const list = $derived(recipesOf($recQ?.value));
  const save = (next) => putSetting(db, RECIPES_KEY, next.length ? next : null);

  let editId = $state(null);
  let form = $state({ name: '', breakfast: '', start: '', food: '', pace: '' });
  function edit(r) {
    editId = r.id;
    form = { name: r.name, breakfast: r.breakfast, start: r.start, food: r.food, pace: r.pace };
  }
  async function saveEdit() {
    const before = list;
    const next = changeRecipe(before, editId, form);
    await save(next);
    editId = null;
    offerDone(t('Recipe changed.'), () => save(before));
  }
  async function del(r) {
    if ((await askDelete({ title: t('Delete «{name}»?', { name: r.name }), text: t('The recipe is gone. The tour it came from stays.') })) !== 'delete') return;
    const before = list;
    await deleteWithUndo({ run: () => save(removeRecipe(before, r.id)), undo: () => save(before), text: t('«{name}» deleted.', { name: r.name }), name: r.name });
  }
</script>

<section class="rcl" aria-labelledby="rcl-h" data-recipes>
  <h2 id="rcl-h"><ChefHat size={18} aria-hidden="true" />{t('Success recipes')}</h2>
  {#if !list.length}
    <p class="ws" data-recipes-empty>{t('No recipe yet. After a tour that went well, open its tour page and tap «Save as a recipe».')} <a href="#/trips">{t('To the tours')}</a></p>
  {:else}
    <ul class="card rl">
      {#each list as r (r.id)}
        <li class="rr" data-recipe={r.id}>
          {#if editId === r.id}
            <label class="fl">{t('Name of the recipe')}<input type="text" maxlength={NAME_MAX} bind:value={form.name} data-recipe-edit-name /></label>
            {#each PARTS as p (p.key)}
              <label class="fl">{t(p.label)}<input type="text" maxlength={p.key === 'start' ? 5 : TEXT_MAX} placeholder={t(p.hint)} bind:value={form[p.key]} /></label>
            {/each}
            <div class="row"><button type="button" class="btn hi" onclick={saveEdit} data-recipe-edit-save>{t('Save recipe')}</button><button type="button" class="btn btn-link" onclick={() => (editId = null)}>{t('Cancel')}</button></div>
          {:else}
            <b>{r.name}</b>
            <dl class="ln">{#each linesOf(r) as l (l.key)}<div><dt>{t(l.label)}</dt><dd>{l.value}</dd></div>{/each}</dl>
            <div class="row">
              <button type="button" class="btn btn-link" onclick={() => edit(r)} data-recipe-edit><Pencil size={14} aria-hidden="true" /> {t('Change')}</button>
              <button type="button" class="btn btn-link" onclick={() => del(r)} data-recipe-delete><Trash2 size={14} aria-hidden="true" /> {t('Delete')}</button>
              {#if r.tripId}<a class="btn btn-link" href="#/tour/{encodeURIComponent(`t:${r.tripId}`)}">{t('To the tour')}</a>{/if}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .rcl { display: grid; gap: 8px; min-width: 0; margin-top: 24px; }
  h2 { display: flex; align-items: center; gap: 8px; margin: 0; font: 600 var(--fs-sub) / 1.3 var(--font-body); }
  .ws { margin: 0; color: var(--ink-2); font-size: var(--fs-small); }
  .rl { list-style: none; margin: 0; padding: 0; display: grid; }
  .rr { display: grid; gap: 8px; padding: 12px 14px; border-top: 1px solid var(--line); min-width: 0; }
  .rr:first-child { border-top: 0; }
  .ln { margin: 0; display: grid; gap: 4px; }
  .ln div { display: grid; grid-template-columns: minmax(90px, auto) 1fr; gap: 8px; }
  .ln dt { color: var(--ink-2); font-size: var(--fs-small); }
  .ln dd { margin: 0; }
  .fl { display: grid; gap: 4px; font-size: var(--fs-small); color: var(--ink-2); }
  .fl input { min-height: 44px; padding: 8px 12px; border: 1px solid var(--line); border-radius: var(--r-ctl); background: var(--paper); color: var(--ink); font: inherit; min-width: 0; }
  .row { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 16px; }
  .row :global(.btn) { min-height: 44px; }
</style>
