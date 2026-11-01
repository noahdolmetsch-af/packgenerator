<script>
  /**
   * Idee A3 «Freie Zeit plus gutes Wetter gibt einen Vorschlag»: one calm card with the next free and dry
   * window from your Google calendar and the weather at your home place (freiezeit/slots.js). Only with the
   * calendar switched on (Ich › Termine und Aufgaben) and a home place; «Not now» hides that window.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { HOME_PLACE } from '../know.js';
  import { prefsOf, AGENDA_KEY } from '../agenda.js';
  import { PACE_KEY, paceOf } from '../pace.js';
  import { loadCore } from '../wetter/kern.js';
  import { localDay } from '../localday.js';
  import { t, locale } from '../i18n.svelte.js';
  import { HIDE_KEY, freeSlot, hideSlot, DAYS } from './slots.js';
  import { ITEMS_KEY } from '../woche.js';
  import { hours } from '../woche/words.js';
  import { Bike, ChevronRight } from '@lucide/svelte';

  const setQ = liveQuery(() => db.settings.bulkGet([HOME_PLACE, AGENDA_KEY, PACE_KEY, HIDE_KEY, ITEMS_KEY]));
  const today = localDay();
  const evQ = liveQuery(() => db.gEvents.where('day').aboveOrEqual(today).limit(300).toArray().catch(() => []));
  const place = $derived($setQ?.[0]?.value && Number.isFinite(Number($setQ[0].value.lat)) ? $setQ[0].value : null);
  const calOn = $derived(prefsOf($setQ?.[1]?.value).calendar);
  const kmh = $derived(paceOf($setQ?.[2]?.value).kmh);
  const hidden = $derived(Array.isArray($setQ?.[3]?.value) ? $setQ[3].value : []);
  let core = $state(null);
  let key = '';
  $effect(() => {
    const k = place && calOn ? `${place.lat},${place.lon}` : '';
    if (k === key) return;
    key = k;
    core = null;
    if (k) loadCore(db, place).then((c) => k === key && (core = c)).catch(() => {});
  });
  const slot = $derived(core && $evQ ? freeSlot(core, $evQ, { now: Date.now(), kmh, hidden }) : null);
  // «Planen als verbindende Mitte» 4a: a to-do without a day whose time needed fits into the window can be put there
  const BUFFER = 30; // minutes of the window that stay free
  const slotMins = $derived(slot ? Math.floor((slot.end - slot.start) / 60000) : 0);
  const fits = $derived(slot ? (Array.isArray($setQ?.[4]?.value) ? $setQ[4].value : []).find((x) => x.kind === 'todo' && !x.day && !x.done && x.mins && x.mins <= slotMins - BUFFER) ?? null : null);
  async function putHere() {
    const at = new Date(slot.start);
    const time = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
    const items = (Array.isArray($setQ?.[4]?.value) ? $setQ[4].value : []).map((x) => (x.id === fits.id ? { ...x, day: slot.date, time } : x));
    await db.settings.put({ key: ITEMS_KEY, value: JSON.parse(JSON.stringify(items)) });
  }
  const hm = (ms) => new Date(ms).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  const dayWord = (date) => (date === today ? t('Today|day') : new Date(`${date}T12:00:00`).toLocaleDateString(locale(), { weekday: 'long' }));
  async function notNow() {
    await db.settings.put({ key: HIDE_KEY, value: hideSlot(hidden, slot.start) });
  }
</script>

{#if slot}
  <div class="card fz" data-free-slot>
    <span class="fz-ib" aria-hidden="true"><Bike size={18} /></span>
    <p class="fz-t">
      <b>{t('{day} {from}–{to} free and dry', { day: dayWord(slot.date), from: hm(slot.start), to: hm(slot.end) })}</b>
      <small data-fz-basis>{t('Based on your calendar and your home place; 30 minutes of the window stay free as a buffer.')}</small>
      <small>{t('A round of about {km} km? From your calendar and the weather at home, the next {n} days.', { km: slot.km, n: DAYS })}</small>
    </p>
    <span class="fz-acts">
      <a class="btn sm" href="#/wetter">{t('Weather')}<ChevronRight size={14} aria-hidden="true" /></a>
      {#if fits}<button type="button" class="btn sm hi" onclick={putHere} data-fz-put>{t('Put «{title}» here ({min})', { title: fits.title, min: hours(fits.mins) })}</button>{/if}
      <button type="button" class="btn sm" onclick={notNow}>{t('Not now')}</button>
    </span>
  </div>
{:else}
  <p class="fz-hint" data-free-slot-hint>
    <b>{t('Free time and good weather')}</b>: {calOn && place ? t('no free and dry window in the next {n} days yet.', { n: DAYS }) : t('with the calendar on and your home place set, the next free and dry window shows here.')}{#if !calOn} <a class="btn sm" href="#/me/agenda" data-fz-cal>{t('Connect calendar')}</a>{/if}{#if !place} <a class="btn sm" href="#/me" data-fz-place>{t('Set home place|week')}</a>{/if}
  </p>
{/if}

<style>
  .fz {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 12px;
    padding: 12px 16px;
    margin: 0 0 12px;
  }
  .fz-ib {
    display: grid;
    flex: none;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--hi-soft);
    color: var(--hi);
  }
  .fz-t {
    display: grid;
    gap: 2px;
    flex: 1 1 220px;
    min-width: 0;
    margin: 0;
  }
  .fz-t small {
    color: var(--ink-2);
  }
  .fz-hint {
    margin: 0 0 12px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .fz-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .fz-acts .btn {
    min-height: 44px;
  }
</style>
