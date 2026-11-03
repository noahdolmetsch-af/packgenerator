<script>
  /**
   * Mini-Tools «Spontan-Einladung» (Noah 28.10.2026, idea 5): «Are you riding with me tomorrow?» (#/me/mini/einladung).
   * Day (today, tomorrow or another), time, meeting point, route and the weather of your home place for that day,
   * then «Make the link». The link closes by itself the day after the ride.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, locale } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import VeloHead from '../bikes/VeloHead.svelte';
  import { ME_KEY } from '../freunde/freunde.js';
  import { homeForecast } from '../home-weather.js';
  import { createQuestion, MINI_ERRORS } from './client.js';
  import { readMine, saveMine } from './store.js';
  import { addDays } from './termin.js';
  import { KIND_INVITE, inviteQuestion, wxOf, daysOpen } from './einladung.js';
  import { Share2, CloudSun, Lock } from '@lucide/svelte';

  const today = localDay();
  const tomorrow = addDays(today, 1);
  let day = $state(tomorrow);
  let other = $state(false);
  let time = $state('');
  let title = $state(t('Are you riding with me?'));
  let where = $state('');
  let route = $state('');
  let routeUrl = $state('');
  let note = $state('');
  let by = $state('');
  let useWx = $state(true);
  let forecast = $state.raw(null);
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
  $effect(() => {
    homeForecast(db)
      .then((f) => (forecast = f))
      .catch(() => (forecast = null));
  });
  const wx = $derived(wxOf(forecast, day));
  const wxLine = (w) => [w.min !== null && w.max !== null ? `${w.min}–${w.max} °C` : '', w.rain !== null ? t('rain {n} %', { n: w.rain }) : ''].filter(Boolean).join(' · ');

  function pick(d) {
    other = false;
    day = d;
  }

  async function make(e) {
    e?.preventDefault?.();
    formErr = '';
    const q = inviteQuestion({ title, note, by, day, time, where, route, routeUrl, wx: useWx ? wx : null });
    if (!q || day < today) return (formErr = t('Pick a day from today on.'));
    making = true;
    try {
      const srv = await createQuestion(q, { days: daysOpen(today, day) });
      const rec = { id: `mt-${Date.now().toString(36)}`, ...q, title: q.title || t('Are you riding with me?'), kind: KIND_INVITE, made: new Date().toISOString(), srv, answers: [], read: null, closed: false };
      delete rec.v;
      await saveMine(db, [rec, ...(await readMine(db))]);
      location.hash = `#/me/mini/${encodeURIComponent(rec.id)}`;
    } catch (err) {
      formErr = t(MINI_ERRORS[err?.code] ?? MINI_ERRORS.server_error);
    } finally {
      making = false;
    }
  }
  const dayFmt = (d) => new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' });
</script>

<VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Mini tools'), href: '#/me/mini' }]} title={t('Quick invite')} sub={t('Who rides with you? One link with day, meeting point, route and weather')} />
<form class="ich-main in-form" onsubmit={make} data-in>
  <section class="card in-box" aria-labelledby="in-day-h">
    <h2 id="in-day-h">{t('When?')}</h2>
    <div class="in-chips" role="group" aria-label={t('When?')}>
      <button type="button" class="in-chip" class:on={!other && day === today} aria-pressed={!other && day === today} onclick={() => pick(today)} data-in-day="today">{t('Today')}</button>
      <button type="button" class="in-chip" class:on={!other && day === tomorrow} aria-pressed={!other && day === tomorrow} onclick={() => pick(tomorrow)} data-in-day="tomorrow">{t('Tomorrow')}</button>
      <button type="button" class="in-chip" class:on={other} aria-pressed={other} onclick={() => (other = true)} data-in-day="other">{t('Other day')}</button>
    </div>
    {#if other}<label class="in-fld"><span>{t('Day')}</span><input type="date" bind:value={day} min={today} data-in-date /></label>{/if}
    <p class="in-day" data-in-dayname>{dayFmt(day)}</p>
    <label class="in-fld"><span>{t('Time (optional)')}</span><input type="time" bind:value={time} data-in-time /></label>
  </section>

  <section class="card in-box">
    <label class="in-fld"><span>{t('Title')}</span><input type="text" bind:value={title} maxlength="80" data-in-title /></label>
    <label class="in-fld"><span>{t('Meeting point (optional)')}</span><input type="text" bind:value={where} maxlength="80" placeholder={t('e.g. Fountain in the old town')} data-in-where /></label>
    <label class="in-fld"><span>{t('Route (optional)')}</span><input type="text" bind:value={route} maxlength="80" placeholder={t('e.g. Lake loop, 60 km')} data-in-route /></label>
    <label class="in-fld"><span>{t('Link to the route (optional)')}</span><input type="url" bind:value={routeUrl} maxlength="300" placeholder="https://…" data-in-url /></label>
    <label class="in-fld"><span>{t('A note for the others (optional)')}</span><input type="text" bind:value={note} maxlength="200" data-in-note /></label>
    <label class="in-fld"><span>{t('Your name for the others')}</span><input type="text" bind:value={by} maxlength="40" autocomplete="given-name" data-in-by /></label>
  </section>

  <section class="card in-box" aria-labelledby="in-wx-h">
    <h2 id="in-wx-h"><CloudSun size={18} aria-hidden="true" /> {t('Weather')}</h2>
    {#if wx}
      <label class="in-check"><input type="checkbox" bind:checked={useWx} data-in-wx /><span>{t('Show the weather: {place} {line}', { place: wx.place, line: wxLine(wx) })}</span></label>
    {:else}
      <p class="in-help" data-in-nowx>{t('No forecast for this day. With a home place under Me, the weather comes along by itself.')}</p>
    {/if}
  </section>

  <p class="in-help"><Lock size={14} aria-hidden="true" /> {t('Only you see who answers. The link closes by itself the day after the ride.')}</p>
  {#if formErr}<p class="in-err" role="alert" data-in-err>{formErr}</p>{/if}
  <div class="in-acts"><button type="submit" class="btn hi" disabled={making} data-in-make><Share2 size={18} aria-hidden="true" />{t('Make the link')}</button><a class="btn btn-link" href="#/me/mini">{t('Cancel')}</a></div>
</form>

<style>
  .in-form {
    display: grid;
    gap: var(--sp-3);
  }
  .in-box {
    display: grid;
    gap: var(--sp-3);
    min-width: 0;
  }
  .in-box h2 {
    margin: 0;
    font-size: var(--fs-sub);
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
  .in-help {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .in-day {
    margin: 0;
    font-weight: 700;
  }
  .in-fld {
    display: grid;
    gap: var(--sp-1);
  }
  .in-fld > span {
    font-weight: 600;
  }
  .in-fld input {
    min-height: 44px;
    width: 100%;
    box-sizing: border-box;
  }
  .in-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .in-chip {
    min-height: 44px;
    padding: 6px 16px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .in-chip.on {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--paper);
  }
  .in-check {
    display: flex;
    gap: var(--sp-2);
    align-items: center;
    min-height: 44px;
  }
  .in-check input {
    width: 20px;
    height: 20px;
    flex: none;
  }
  .in-err {
    margin: 0;
    color: var(--bad);
    font-weight: 600;
  }
  .in-acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
</style>
