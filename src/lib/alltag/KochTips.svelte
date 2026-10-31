<script>
  /**
   * «Kochen» step 3 (Noah 28.10.2026 «3a», «4a»): the tips of the day at the top of Kochen: one suggestion
   * per meal with «Another suggestion», «Like it» and «Never show again», and the short start (what you
   * don't eat, the longest time you want to cook). Everything is a suggestion; the start has «Later», and
   * the taste can be changed any time under «Change».
   */
  import { Clock, RefreshCw, Heart, EyeOff, ChevronRight, SlidersHorizontal } from '@lucide/svelte';
  import { MEALS } from '../kochen/rezepte.js';
  import { recipeHref, prefsOf } from '../kochen/kochen.js';
  import { TASTE_TAGS, MAX_MINUTES, ensureTips, pickMeal, toggleLike, toggleDislike, setMaxMin, markAsked, tipOf, fitCount } from '../kochen/tipps.js';
  import { nutritionById } from '../kochen/naehrwerte.js';
  import { localDay } from '../localday.js';
  import { t, tn } from '../i18n.svelte.js';

  /** prefs: the saved choices (kochen.js prefsOf); save(fn): writes them; onhide(recipe): «Never show again» with Undo. */
  let { prefs, loaded = true, save, onhide } = $props();

  const day = $derived(localDay());
  let later = $state(false);
  let editing = $state(false);

  // a new day, a hidden recipe or a new taste: the tips are made again (once)
  $effect(() => {
    if (!loaded) return;
    const next = ensureTips(prefs, day);
    if (next !== prefs) save(() => next);
  });

  const showStart = $derived(loaded && ((!prefs.asked && !later) || editing));
  const nothing = $derived(fitCount(prefs) === 0);
  const taste = $derived(
    [prefs.maxMin ? t('at most {n} minutes', { n: prefs.maxMin }) : '', prefs.dislikes.length ? t('without {list}', { list: TASTE_TAGS.filter((x) => prefs.dislikes.includes(x.tag)).map((x) => t(x.label)).join(', ') }) : ''].filter(Boolean).join(' · ')
  );
  const facts = (r) => [t('{n} min', { n: r.min }), tn(r.ingredients.length, '{n} ingredient', '{n} ingredients'), t('{n} kcal', { n: nutritionById(r.id)?.kcal ?? 0 })].join(' · ');
  const done = () => {
    editing = false;
    return save((p) => markAsked(p));
  };
</script>

{#if showStart}
  <section class="fz-box kt-start" aria-labelledby="kt-start-h" data-ko-start>
    <h2 class="fz-h2" id="kt-start-h">{t('Just for you')}</h2>
    <p class="fz-note">{t('So the suggestions fit. Everything can be changed later, nothing is a must.')}</p>
    <h3 class="kt-h3">{t("What don't you eat?")}</h3>
    <p class="fz-note">{t('Tap to leave it out.')}</p>
    <div class="fz-chips" role="group" aria-label={t("What don't you eat?")}>
      {#each TASTE_TAGS as x (x.tag)}
        <button type="button" class="fz-chip" aria-pressed={prefs.dislikes.includes(x.tag)} onclick={() => save((p) => toggleDislike(p, x.tag))} data-ko-dislike={x.tag}>{t(x.label)}</button>
      {/each}
    </div>
    <h3 class="kt-h3">{t('How long do you want to cook at most?')}</h3>
    <div class="fz-chips" role="group" aria-label={t('How long do you want to cook at most?')}>
      {#each MAX_MINUTES as m (m)}
        <button type="button" class="fz-chip" aria-pressed={prefs.maxMin === m} onclick={() => save((p) => setMaxMin(p, m))} data-ko-maxmin={m}>{t('{n} min', { n: m })}</button>
      {/each}
      <button type="button" class="fz-chip" aria-pressed={prefs.maxMin === 0} onclick={() => save((p) => setMaxMin(p, 0))} data-ko-maxmin="0">{t('No limit')}</button>
    </div>
    {#if nothing}<p class="fz-empty" data-ko-nothing>{t('No recipe fits this. Leave something out of the list above.')}</p>{/if}
    <div class="fz-acts">
      <button type="button" class="btn hi" onclick={done} data-ko-start-done>{t('Show suggestions')}</button>
      {#if !prefs.asked}<button type="button" class="btn" onclick={() => (later = true)} data-ko-start-later>{t('Later')}</button>{/if}
    </div>
  </section>
{/if}

{#if loaded}
  <section class="kt-tips" aria-labelledby="kt-tips-h" data-ko-tips>
    <h2 class="fz-h2" id="kt-tips-h">{t('Tips of the day')}</h2>
    <p class="fz-note">
      {taste || t('No limits set.')}
      <button type="button" class="kt-link" onclick={() => (editing = !editing)} aria-expanded={showStart} data-ko-taste-change><SlidersHorizontal size={14} aria-hidden="true" />{t('Change')}</button>
    </p>
    <div class="kt-grid">
      {#each MEALS as m (m.key)}
        {@const r = tipOf(prefs, m.key)}
        <article class="fz-box kt-card" data-ko-tip={m.key}>
          <p class="kt-meal">{t(m.label)}</p>
          {#if r}
            <h3 class="kt-title" data-ko-tip-title>{t(r.title)}</h3>
            <p class="fz-note kt-facts"><Clock size={14} aria-hidden="true" />{facts(r)}</p>
            <a class="btn hi" href={recipeHref(r.id)} data-ko-tip-open>{t('Look at the recipe')}<ChevronRight size={16} aria-hidden="true" /></a>
            <div class="kt-acts">
              <button type="button" class="btn sm" onclick={() => save((p) => pickMeal(p, m.key, day))} data-ko-tip-other><RefreshCw size={14} aria-hidden="true" />{t('Another suggestion')}</button>
              <button type="button" class="btn sm" aria-pressed={prefs.liked.includes(r.id)} onclick={() => save((p) => toggleLike(p, r.id))} data-ko-tip-like><Heart size={14} aria-hidden="true" fill={prefs.liked.includes(r.id) ? 'currentColor' : 'none'} />{t('Like it')}</button>
              <button type="button" class="btn sm" onclick={() => onhide(r)} data-ko-tip-never><EyeOff size={14} aria-hidden="true" />{t("Don't show again")}</button>
            </div>
          {:else}
            <p class="fz-empty" data-ko-tip-none>{t('No recipe fits for this meal. Change what you leave out.')}</p>
          {/if}
        </article>
      {/each}
    </div>
    <p class="fz-note">{t('A recipe comes again only when all the others have been suggested.')}</p>
  </section>
{/if}

<style>
  .kt-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 12px;
  }
  .kt-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
  }
  .kt-meal {
    margin: 0;
    color: var(--brand);
    font-weight: 700;
    font-size: var(--fs-small);
  }
  .kt-title {
    margin: 0;
    font-size: var(--fs-sub);
    line-height: 1.25;
  }
  .kt-h3 {
    font-size: var(--fs-body);
    margin: 12px 0 4px;
  }
  .kt-facts {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
  }
  .kt-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .kt-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0 6px;
    border: 0;
    background: none;
    color: var(--brand);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
</style>
