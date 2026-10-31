<script>
  /**
   * Mini-Tools «Anmeldeliste mit Warteliste» (Noah 28.10.2026, idea 4): make a sign-up list (#/me/mini/liste).
   * A title, when and where (optional), how many places, then «Make the link». Sealed into the link like the
   * other Mini-Tools (lib/mini/client.js).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import VeloHead from '../bikes/VeloHead.svelte';
  import { ME_KEY } from '../freunde/freunde.js';
  import { createQuestion, MINI_ERRORS } from './client.js';
  import { readMine, saveMine } from './store.js';
  import { KIND_LIST, PLACES_MIN, PLACES_MAX, listQuestion } from './liste.js';
  import { Share2, Minus, Plus, Lock } from '@lucide/svelte';

  const DAYS_OPEN = [7, 14, 30, 60];
  const today = localDay();
  let title = $state('');
  let note = $state('');
  let by = $state('');
  let day = $state('');
  let time = $state('');
  let where = $state('');
  let places = $state(8);
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
  const step = (d) => (places = Math.min(PLACES_MAX, Math.max(PLACES_MIN, (Math.round(Number(places)) || 0) + d)));

  async function make(e) {
    e?.preventDefault?.();
    formErr = '';
    const q = listQuestion({ title, note, by, day, time, where, places });
    if (!q) return (formErr = t('Write a title first, so people know what it is about.'));
    making = true;
    try {
      // sign-up closes the day after the event at the latest
      const until = q.day ? Math.max(1, Math.round((Date.parse(`${q.day}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000) + 1) : days;
      const srv = await createQuestion(q, { days: Math.min(days, until) });
      const rec = { id: `mt-${Date.now().toString(36)}`, ...q, kind: KIND_LIST, made: new Date().toISOString(), srv, answers: [], read: null, closed: false };
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

<VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Mini tools'), href: '#/me/mini' }]} title={t('Sign-up list')} sub={t('A number of places; who comes too late waits and moves up')} />
<form class="ich-main ln-form" onsubmit={make} data-ln>
  <section class="card ln-box">
    <label class="ln-fld"><span>{t('What is it?')}</span><input type="text" bind:value={title} maxlength="80" placeholder={t('e.g. Workshop evening')} data-ln-title /></label>
    <div class="ln-two">
      <label class="ln-fld"><span>{t('Day (optional)')}</span><input type="date" bind:value={day} min={today} data-ln-day /></label>
      <label class="ln-fld"><span>{t('Time (optional)')}</span><input type="time" bind:value={time} disabled={!day} data-ln-time /></label>
    </div>
    <label class="ln-fld"><span>{t('Where (optional)')}</span><input type="text" bind:value={where} maxlength="80" placeholder={t('e.g. Meeting point at the station')} data-ln-where /></label>
    <label class="ln-fld"><span>{t('A note for the others (optional)')}</span><input type="text" bind:value={note} maxlength="200" data-ln-note /></label>
    <label class="ln-fld"><span>{t('Your name for the others')}</span><input type="text" bind:value={by} maxlength="40" autocomplete="given-name" data-ln-by /></label>
  </section>

  <section class="card ln-box" aria-labelledby="ln-places-h">
    <h2 id="ln-places-h">{t('Places|seats')}</h2>
    <div class="ln-places">
      <button type="button" class="ln-step" aria-label={t('One place less')} onclick={() => step(-1)} disabled={places <= PLACES_MIN}><Minus size={18} aria-hidden="true" /></button>
      <label><span class="sr">{t('Places|seats')}</span><input type="number" inputmode="numeric" min={PLACES_MIN} max={PLACES_MAX} bind:value={places} data-ln-places /></label>
      <button type="button" class="ln-step" aria-label={t('One place more')} onclick={() => step(1)} disabled={places >= PLACES_MAX}><Plus size={18} aria-hidden="true" /></button>
    </div>
    <p class="ln-help">{t('Whoever signs up after the last place is on the waiting list. When someone signs off, the first on the waiting list moves up by itself.')}</p>
  </section>

  <section class="card ln-box">
    <label class="ln-fld"><span>{t('Sign-up possible for')}</span>
      <select bind:value={days} data-ln-days>
        {#each DAYS_OPEN as n (n)}<option value={n}>{t('{n} days', { n })}</option>{/each}
      </select>
    </label>
    {#if day}<p class="ln-help">{t('With a day, sign-up closes the day after it at the latest.')}</p>{/if}
    <p class="ln-help"><Lock size={14} aria-hidden="true" /> {t('Only you see the names. They are locked on the other person’s device; the server only counts the places and deletes everything after these days.')}</p>
  </section>
  {#if formErr}<p class="ln-err" role="alert" data-ln-err>{formErr}</p>{/if}
  <div class="ln-acts"><button type="submit" class="btn hi" disabled={making} data-ln-make><Share2 size={18} aria-hidden="true" />{t('Make the link')}</button><a class="btn btn-link" href="#/me/mini">{t('Cancel')}</a></div>
</form>

<style>
  .ln-form {
    display: grid;
    gap: var(--sp-3);
  }
  .ln-box {
    display: grid;
    gap: var(--sp-3);
    min-width: 0;
  }
  .ln-box h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .ln-help {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ln-fld {
    display: grid;
    gap: var(--sp-1);
    min-width: 0;
  }
  .ln-fld > span {
    font-weight: 600;
  }
  .ln-fld input,
  .ln-fld select {
    min-height: 44px;
    width: 100%;
    box-sizing: border-box;
  }
  .ln-two {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--sp-3);
  }
  .ln-places {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
  .ln-places input {
    width: 5rem;
    min-height: 44px;
    text-align: center;
    font-size: var(--fs-sub);
    font-weight: 700;
  }
  .ln-step {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .ln-step:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .ln-err {
    margin: 0;
    color: var(--bad);
    font-weight: 600;
  }
  .ln-acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
</style>
