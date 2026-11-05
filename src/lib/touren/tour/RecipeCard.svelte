<script>
  /**
   * «Success recipe» (Noah 04.11.2026 «5a», Persönliches Lernen Idee 5): on the tour page of a bike tour whose
   * Rückblick is written, one button keeps what worked as a recipe: breakfast, start time, food on the way, pace.
   * The start time and the pace are filled in from the ride when it has them; everything stays changeable and
   * nothing is saved before «Save recipe». The recipes live next to the templates (Templates › Recipes).
   * Observation only: the app keeps what you write and never says why it worked. d: the tour (tourdata.js loadTour).
   */
  import { liveQuery } from 'dexie';
  import { ChefHat } from '@lucide/svelte';
  import { db } from '../../db.js';
  import { putSetting } from '../../flowdb.js';
  import { t, num } from '../../i18n.svelte.js';
  import { offerDone } from '../../ui/rename.svelte.js';
  import { RECIPES_KEY, PARTS, TEXT_MAX, NAME_MAX, newRecipe, addRecipe, fromTrip, recipesOf } from '../../rezept.js';

  let { d } = $props();
  const show = $derived(d?.kind === 't' && d.state === 'rated');
  const recQ = liveQuery(() => db.settings.get(RECIPES_KEY));
  const list = $derived(recipesOf($recQ?.value));
  const mine = $derived(fromTrip(list, d?.trip?.id));

  let open = $state(false);
  let name = $state('');
  let form = $state({ breakfast: '', start: '', food: '', pace: '' });

  const hhmm = (iso) => {
    const x = iso ? new Date(iso) : null;
    return x && !Number.isNaN(x.getTime()) ? `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}` : '';
  };
  function begin() {
    const first = (d.acts ?? []).find((a) => a.startAt);
    const kmh = d.row?.kmh;
    name = d.trip?.title ?? '';
    form = { breakfast: '', start: hhmm(first?.startAt), food: '', pace: kmh ? t('{kmh} km/h on average', { kmh: num(Math.round(kmh * 10) / 10) }) : '' };
    open = true;
  }
  const made = $derived(open ? newRecipe({ id: 'x', name, trip: d?.trip, parts: form, now: '' }) : null);
  async function save() {
    const r = newRecipe({ id: `rc-${Date.now().toString(36)}`, name, trip: d.trip, parts: form, now: new Date().toISOString() });
    if (!r) return;
    const before = list;
    await putSetting(db, RECIPES_KEY, addRecipe(before, r));
    open = false;
    offerDone(t('Recipe «{name}» saved.', { name: r.name }), () => putSetting(db, RECIPES_KEY, before.length ? before : null));
  }
</script>

{#if show}
  <section class="rc card pad" aria-labelledby="rc-h" data-tour-recipe>
    <h2 id="rc-h"><ChefHat size={18} aria-hidden="true" />{t('A day that worked?')}</h2>
    {#if !open}
      <p class="ws">{t('Keep what worked, breakfast, start, food and pace, as a recipe for a next tour. Only if you want.')}</p>
      <div class="row">
        <button type="button" class="btn" onclick={begin} data-recipe-start>{t('Save as a recipe')}</button>
        {#if mine.length}<span class="ws" data-recipe-have>{t('Saved: {names}', { names: mine.map((r) => r.name).join(', ') })}</span>{/if}
        <a class="btn btn-link" href="#/pack/templates">{t('All recipes: Templates')}</a>
      </div>
    {:else}
      <label class="fl">{t('Name of the recipe')}<input type="text" maxlength={NAME_MAX} bind:value={name} data-recipe-name /></label>
      {#each PARTS as p (p.key)}
        <label class="fl">{t(p.label)}<input type="text" maxlength={p.key === 'start' ? 5 : TEXT_MAX} placeholder={t(p.hint)} bind:value={form[p.key]} data-recipe-part={p.key} /></label>
      {/each}
      <div class="row">
        <button type="button" class="btn hi" disabled={!made} onclick={save} data-recipe-save>{t('Save recipe')}</button>
        <button type="button" class="btn btn-link" onclick={() => (open = false)}>{t('Not now')}</button>
      </div>
    {/if}
  </section>
{/if}

<style>
  .rc { display: grid; gap: 8px; min-width: 0; margin-top: 16px; }
  h2 { display: flex; align-items: center; gap: 8px; margin: 0; font: 600 var(--fs-sub) / 1.3 var(--font-body); }
  .ws { margin: 0; color: var(--ink-2); font-size: var(--fs-small); }
  .fl { display: grid; gap: 4px; font-size: var(--fs-small); color: var(--ink-2); }
  .fl input { min-height: 44px; padding: 8px 12px; border: 1px solid var(--line); border-radius: var(--r-ctl); background: var(--paper); color: var(--ink); font: inherit; min-width: 0; }
  .row { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 16px; }
  .row :global(.btn) { min-height: 44px; }
</style>
