<script>
  /**
   * Mini-Tools «Essen und Unverträglichkeiten» (Noah 28.10.2026, idea 7): ask who eats what (#/me/mini/essen).
   * A title, the day (optional), whether you eat along and what you eat, then «Make the link».
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import VeloHead from '../bikes/VeloHead.svelte';
  import { ME_KEY } from '../freunde/freunde.js';
  import { createQuestion, MINI_ERRORS } from './client.js';
  import { readMine, saveMine } from './store.js';
  import { KIND_FOOD, DIETS, SIZES, foodQuestion, cleanFoodAnswer } from './essen.js';
  import { Share2, Lock } from '@lucide/svelte';

  const DAYS_OPEN = [7, 14, 30, 60];
  const today = localDay();
  let title = $state('');
  let day = $state('');
  let note = $state('');
  let by = $state('');
  let eat = $state(true);
  let diets = $state([]);
  let size = $state('m');
  let days = $state(14);
  let formErr = $state('');
  let making = $state(false);

  const meQ = liveQuery(() => db.settings.get(ME_KEY));
  let bySeen = false;
  $effect(() => {
    if (!bySeen && $meQ !== undefined) {
      by = typeof $meQ?.value === 'string' ? $meQ.value : '';
      bySeen = true;
    }
  });
  const flip = (k) => (diets = diets.includes(k) ? diets.filter((x) => x !== k) : [...diets, k]);

  async function make(e) {
    e?.preventDefault?.();
    formErr = '';
    const q = foodQuestion({ title, note, by, day });
    if (!q) return (formErr = t('Write a title first, so people know what it is about.'));
    making = true;
    try {
      const srv = await createQuestion(q, { days });
      const me = eat ? cleanFoodAnswer({ name: t('You'), diets, size }) : null;
      const rec = { id: `mt-${Date.now().toString(36)}`, ...q, kind: KIND_FOOD, made: new Date().toISOString(), srv, answers: [], me, menu: 'pasta', read: null, closed: false };
      delete rec.v;
      await saveMine(db, [rec, ...(await readMine(db))]);
      location.hash = `#/me/mini/${encodeURIComponent(rec.id)}`;
    } catch (err) {
      formErr = t(MINI_ERRORS[err?.code] ?? MINI_ERRORS.server_error);
    } finally {
      making = false;
    }
  }
</script>

<VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Mini tools'), href: '#/me/mini' }]} title={t('Who eats what')} sub={t('Diets and allergies of the group; the app makes the shopping list')} />
<form class="ich-main fn-form" onsubmit={make} data-fn>
  <section class="card fn-box">
    <label class="fn-fld"><span>{t('What is it about?')}</span><input type="text" bind:value={title} maxlength="80" placeholder={t('e.g. Hut evening')} data-fn-title /></label>
    <label class="fn-fld"><span>{t('Day (optional)')}</span><input type="date" bind:value={day} min={today} data-fn-day /></label>
    <label class="fn-fld"><span>{t('A note for the others (optional)')}</span><input type="text" bind:value={note} maxlength="200" data-fn-note /></label>
    <label class="fn-fld"><span>{t('Your name for the others')}</span><input type="text" bind:value={by} maxlength="40" autocomplete="given-name" data-fn-by /></label>
  </section>

  <section class="card fn-box" aria-labelledby="fn-me-h">
    <h2 id="fn-me-h">{t('You')}</h2>
    <label class="fn-check"><input type="checkbox" bind:checked={eat} data-fn-eat /><span>{t('I eat along')}</span></label>
    {#if eat}
      <div class="fn-chips" role="group" aria-label={t('What you eat')}>
        {#each DIETS as d (d.key)}<button type="button" class="fn-chip" class:on={diets.includes(d.key)} aria-pressed={diets.includes(d.key)} onclick={() => flip(d.key)} data-fn-diet={d.key}>{t(d.label)}</button>{/each}
      </div>
      <div class="fn-chips" role="radiogroup" aria-label={t('How hungry')}>
        {#each SIZES as s (s.key)}<button type="button" role="radio" class="fn-chip" class:on={size === s.key} aria-checked={size === s.key} onclick={() => (size = s.key)}>{t(s.label)}</button>{/each}
      </div>
    {/if}
  </section>

  <section class="card fn-box">
    <label class="fn-fld"><span>{t('Answers possible for')}</span>
      <select bind:value={days} data-fn-days>
        {#each DAYS_OPEN as n (n)}<option value={n}>{t('{n} days', { n })}</option>{/each}
      </select>
    </label>
    <p class="fn-help"><Lock size={14} aria-hidden="true" /> {t('Only you can read the answers. They are locked on the other person’s device; the server cannot read them and deletes them after these days.')}</p>
  </section>
  {#if formErr}<p class="fn-err" role="alert" data-fn-err>{formErr}</p>{/if}
  <div class="fn-acts"><button type="submit" class="btn hi" disabled={making} data-fn-make><Share2 size={18} aria-hidden="true" />{t('Make the link')}</button><a class="btn btn-link" href="#/me/mini">{t('Cancel')}</a></div>
</form>

<style>
  .fn-form {
    display: grid;
    gap: var(--sp-3);
  }
  .fn-box {
    display: grid;
    gap: var(--sp-3);
    min-width: 0;
  }
  .fn-box h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .fn-help {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .fn-fld {
    display: grid;
    gap: var(--sp-1);
  }
  .fn-fld > span {
    font-weight: 600;
  }
  .fn-fld input,
  .fn-fld select {
    min-height: 44px;
    width: 100%;
    box-sizing: border-box;
  }
  .fn-check {
    display: flex;
    gap: var(--sp-2);
    align-items: center;
    min-height: 44px;
  }
  .fn-check input {
    width: 20px;
    height: 20px;
  }
  .fn-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .fn-chip {
    min-height: 44px;
    padding: 6px 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .fn-chip.on {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--paper);
  }
  .fn-err {
    margin: 0;
    color: var(--bad);
    font-weight: 600;
  }
  .fn-acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
</style>
