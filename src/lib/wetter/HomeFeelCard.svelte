<script>
  /**
   * Einzelidee Heute 1 (UC-004-I1 «Wetter an der Terrasse merken»): on the weather page of the home place,
   * «Zu Hause: wie war es wirklich?». Today or yesterday, two rows of three chips: less, the same or more
   * wind than forecast, less, the same or more sun. From a few notes your own hints come (terrasse.js),
   * shown on top for today's forecast. Each note can be deleted (the app's question, Undo).
   */
  import { liveQuery } from 'dexie';
  import { Trash2, Check, House } from '@lucide/svelte';
  import { db } from '../db.js';
  import { HOME_FEEL_KEY, FELT, WIND_TEXT, SUN_TEXT, forecastOf, homeFeelsOf, addHomeFeel, removeHomeFeel, homeHints, hintFor, hintText } from './terrasse.js';
  import { hoursBetween, atLocal, localDate } from './kern.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { t, num, locale } from '../i18n.svelte.js';

  let { core = null } = $props();
  const q = liveQuery(() => db.settings.get(HOME_FEEL_KEY));
  const list = $derived(homeFeelsOf($q?.value));
  const save = (l) => db.settings.put({ key: HOME_FEEL_KEY, value: l });
  const hints = $derived(homeHints(list));

  const off = $derived(core?.offset ?? 0);
  const today = $derived(core ? localDate(Date.now(), off) : '');
  const yesterday = $derived(today ? localDate(Date.parse(`${today}T12:00:00Z`) - 864e5, 0) : '');
  const fcOf = (d) => (core && d ? forecastOf(hoursBetween(core, atLocal(d, 9, off), atLocal(d, 18, off))) : null);
  const todayHint = $derived(hintText(hintFor(hints, fcOf(today))));
  let which = $state('today');
  const day = $derived(which === 'today' ? today : yesterday);
  const fc = $derived(fcOf(day));
  let wind = $state('');
  let sun = $state('');
  let saved = $state(false);

  async function keep() {
    await save(addHomeFeel(list, { day, fc, feltWind: wind || null, feltSun: sun || null }));
    wind = '';
    sun = '';
    saved = true;
    setTimeout(() => (saved = false), 3000);
  }
  const wd = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'numeric' });
  async function del(x) {
    const name = wd(x.day);
    if ((await askDelete({ title: t('Delete the note of {day}?', { day: name }) })) !== 'delete') return;
    const before = list;
    await deleteWithUndo({ run: () => save(removeHomeFeel(list, x.id)), undo: () => save(before), text: t('Note of {day} deleted.', { day: name }), name });
  }
  const say = (h) => t(h.key, { ...h.vars, ...(h.vars.side ? { side: t(h.vars.side) } : {}) });
</script>

<div class="hf" data-home-feel>
  <h3 class="hf-h"><House size={16} aria-hidden="true" /> {t('At home: how was it really?')}</h3>
  <p class="rc-note">{t('Note how the forecast felt on your own spot, a terrace or balcony. After a few notes the app knows your spot better.')}</p>
  {#if todayHint}<p class="hf-hint" role="status" data-home-feel-hint>{say(todayHint)}</p>{/if}
  <div class="fc-row" role="group" aria-label={t('Which day')}>
    <button type="button" class="fc-chip" aria-pressed={which === 'today'} onclick={() => (which = 'today')}>{t('Today')}</button>
    <button type="button" class="fc-chip" aria-pressed={which === 'yesterday'} onclick={() => (which = 'yesterday')}>{t('Yesterday')}</button>
    {#if fc}<small>{t('Forecast: {wind} km/h wind, {h} sunny hours', { wind: num(fc.wind), h: num(fc.sunH) })}</small>{/if}
  </div>
  <div class="fc-row" role="group" aria-label={t('Wind on your spot')}>
    {#each FELT as f (f)}<button type="button" class="fc-chip" aria-pressed={wind === f} onclick={() => (wind = wind === f ? '' : f)} data-home-wind={f}>{t(WIND_TEXT[f])}</button>{/each}
  </div>
  <div class="fc-row" role="group" aria-label={t('Sun on your spot')}>
    {#each FELT as f (f)}<button type="button" class="fc-chip" aria-pressed={sun === f} onclick={() => (sun = sun === f ? '' : f)} data-home-sun={f}>{t(SUN_TEXT[f])}</button>{/each}
  </div>
  {#if wind || sun}<button type="button" class="btn" onclick={keep} data-home-feel-save><Check size={18} aria-hidden="true" />{t('Keep the note')}</button>{/if}
  {#if saved}<p class="rc-note" role="status">{t('Kept. Your own hints grow with every note.')}</p>{/if}
  {#if hints.length}
    <ul class="hf-list" data-home-feel-hints>
      {#each hints as h (h.kind + (h.side ?? ''))}<li>{say(hintText(h))}</li>{/each}
    </ul>
  {/if}
  {#if list.length}
    <ul class="fc-list" data-home-feel-list>
      {#each [...list].reverse().slice(0, 8) as x (x.id)}
        <li>
          <span><b>{wd(x.day)}</b>{x.feltWind ? ` · ${t(WIND_TEXT[x.feltWind])}` : ''}{x.feltSun ? ` · ${t(SUN_TEXT[x.feltSun])}` : ''}</span>
          <button type="button" class="fc-x" aria-label={t('Delete the note of {day}?', { day: wd(x.day) })} onclick={() => del(x)}><Trash2 size={16} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .fc-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .fc-row small {
    color: var(--ink-2);
  }
  .fc-chip {
    min-height: 44px;
    padding: 8px 12px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-body) var(--font-body);
    cursor: pointer;
  }
  .fc-chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .fc-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
  }
  .fc-list li {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow-wrap: break-word;
  }
  .fc-list span {
    flex: 1;
    min-width: 0;
  }
  .fc-x {
    min-width: 44px;
    min-height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .hf {
    display: grid;
    gap: 8px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .hf-h {
    display: flex;
    gap: 6px;
    align-items: center;
    margin: 0;
    font-size: var(--fs-body);
  }
  .hf-hint {
    margin: 0;
    padding: 8px 10px;
    border-radius: var(--radius-card);
    background: var(--paper-2);
  }
  .hf-list {
    margin: 0;
    padding-left: 18px;
    color: var(--ink-2);
  }
</style>
