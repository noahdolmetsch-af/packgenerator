<script>
  /**
   * SN1c «Tour aus komoot übernehmen» (Noah 13.10.2026 «freigabe», answer 2b): a GPX without times,
   * shared from komoot to the app (public/share-target.js → #/komoot/shared), becomes a planned trip.
   * A small map with the elevation profile, name, km, climbing and about how long. Preselected: today
   * (answer 2b) and the bike of the last trip, both changeable with a tap. When the day falls in a
   * running trip, a quiet hint (both may stand). «komoot-Link» and «Mehr Angaben» (days, start time,
   * packing list) are folded. «Abbrechen» and «Als geplante Tour anlegen». The file stays on the
   * device; nothing goes back to komoot. Everything is a suggestion.
   * Rules in src/lib/komoot.js; the route numbers from route.js, as for «GPX-Route hinzufügen».
   */
  import { tick } from 'svelte';
  import { liveQuery } from 'dexie';
  import { X, Check, Link as LinkIcon, SlidersHorizontal, Lock, Info, Bike as BikeIcon, CalendarDays, ChevronRight, ChevronDown } from '@lucide/svelte';
  import { db } from '../db.js';
  import { backClose } from '../ui/backclose.js';
  import OptionButton from '../ui/OptionButton.svelte';
  import DateInput from '../ui/DateInput.svelte';
  import Profile from '../ui/Profile.svelte';
  import StaticMap from '../ui/StaticMap.svelte';
  import { parseGpx, routeStats, GPX_MAX_MB } from '../route.js';
  import { SHARE_CACHE, SHARE_KEY } from '../gpx.js';
  import { PACE_KEY, paceOf } from '../pace.js';
  import { sortBikes } from '../bikes.js';
  import { lastBikeId } from '../dayride.js';
  import { lastTripOn } from '../trips.js';
  import { localDay } from '../localday.js';
  import { addDays } from '../phase.js';
  import { openTrip } from '../nav.js';
  import { komootLinkIn, komootLink, komootSport, clashOn, routeMinutes, hoursText, tripFromKomoot, defaultDay, SHARE_TEXT } from '../komoot.js';
  import { t, num, locale } from '../i18n.svelte.js';
  import '../ui/daumen.css'; // FE1: the main button stays at the bottom edge of the window on a phone
  import { weiter } from '../daumen.js'; // FE16: «Weiter» to the next field, the number keyboard

  let { onclose } = $props();

  const tripsQ = liveQuery(() => db.trips.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const paceQ = liveQuery(() => db.settings.get(PACE_KEY));
  const trips = $derived($tripsQ ?? []);
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const pace = $derived(paceOf($paceQ?.value));

  let dialog;
  let linkInput = $state();
  let route = $state(null);
  let error = $state('');
  let loading = $state(true);
  let busy = $state(false);

  // the choices (all suggestions; null: not touched yet, the suggestion stands)
  let title = $state('');
  const today = localDay();
  let date = $state(defaultDay()); // answer 2b: today
  let otherDay = $state(false);
  let bikeId = $state(null);
  let link = $state('');
  let linkOpen = $state(false);
  let linkMsg = $state('');
  let moreOpen = $state(false);
  let days = $state(1);
  let start = $state('');
  let list = $state('suggest');

  const sharedUrl = () => new URL(SHARE_KEY, location.href).href;
  $effect(() => {
    dialog.showModal();
    (async () => {
      try {
        const res = await (await caches.open(SHARE_CACHE)).match(sharedUrl());
        if (!res) throw new Error(t('The shared file is not here any more. Share it again from komoot.'));
        const blob = await res.blob();
        if (blob.size > GPX_MAX_MB * 1024 * 1024) throw new Error(t('This file is too big for a GPX route (more than {mb} MB).', { mb: GPX_MAX_MB }));
        const file = decodeURIComponent(res.headers.get('X-File-Name') ?? 'route.gpx');
        route = routeStats(parseGpx(await blob.text()), file);
        title = route.name || '';
        link = komootLinkIn(decodeURIComponent(res.headers.get(SHARE_TEXT) ?? '')) ?? '';
      } catch (e) {
        error = e?.message || t('This file could not be read.');
      } finally {
        loading = false;
      }
    })();
  });

  // the bike of the last trip (once the trips and bikes are read), until another one is tapped
  const preBike = $derived($tripsQ && $bikesQ ? lastBikeId(trips, bikes, today) : null);
  const bike = $derived(bikes.find((b) => b.id === (bikeId ?? preBike)) ?? null);
  const sport = $derived(komootSport('bikepacking', bike?.type));
  const minutes = $derived(route ? routeMinutes(route, pace) : null);
  const clash = $derived(clashOn(trips, date));
  const from = $derived(bike ? lastTripOn(bike.id, trips) : null);
  const preview = $derived(route && bike && $itemsQ ? tripFromKomoot($state.snapshot(route), { title: 'x', startDate: date, bike: $state.snapshot(bike), days, list: 'suggest' }, trips, $itemsQ) : null);

  const dm = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const tomorrow = addDays(today, 1);
  const after = addDays(today, 2);
  const isOther = $derived(otherDay || ![today, tomorrow, after].includes(date));
  const pick = (d) => ((date = d), (otherDay = false));

  const goodLink = $derived(link.trim() ? komootLink(link) : null);

  async function dropShared() {
    try {
      await (await caches.open(SHARE_CACHE)).delete(sharedUrl());
    } catch {
      /* no Cache (private mode): nothing to tidy */
    }
  }
  async function cancel() {
    await dropShared();
    dialog.close();
  }

  async function save(e) {
    e?.preventDefault();
    if (!route || busy) return;
    if (link.trim() && !goodLink) {
      linkOpen = true;
      linkMsg = t('This is not a komoot link. Leave the field empty, or paste the link from komoot.');
      await tick();
      linkInput?.focus();
      return;
    }
    busy = true;
    try {
      // the trips and items as stored now (the list is copied from them)
      const [allTrips, items] = await Promise.all([db.trips.toArray(), db.items.toArray()]);
      const trip = tripFromKomoot($state.snapshot(route), { title, startDate: date || today, bike: bike ? $state.snapshot(bike) : null, days, start, link: goodLink, list }, allTrips, items, pace);
      await db.trips.add(trip);
      await dropShared();
      openTrip(trip.id);
      dialog.close();
      location.hash = '#/pack';
    } catch {
      error = t('Could not save. Please try again.');
      busy = false;
    }
  }
</script>

<dialog class="sheet from-below km-sheet" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="km-h" data-komoot-sheet>
  <form onsubmit={save} novalidate use:weiter>
    <div class="km-head">
      <div>
        <h2 id="km-h">{t('Take over a tour from komoot')}</h2>
        <p class="km-lead">{t('Shared from komoot · everything is a suggestion')}</p>
      </div>
      <button type="button" class="km-x" aria-label={t('Close')} onclick={cancel}><X size={20} aria-hidden="true" /></button>
    </div>

    {#if loading}
      <p class="km-lead" role="status">{t('Reading the file …')}</p>
    {:else if !route}
      <p class="km-err" role="alert">{error}</p>
      <div class="km-foot"><button type="button" class="btn" onclick={cancel}>{t('Close')}</button></div>
    {:else}
      <div class="km-card">
        {#if route.line?.length > 1}<div class="km-map"><StaticMap line={route.line} marks={[{ ...route.start, kind: 'start' }]} label={route.name} /></div>{/if}
        <div class="km-sum">
          <b class="km-name">{route.name || t('Tour from komoot')}</b>
          <span class="num">{num(route.km)} km · ↑ {num(route.gainM)} m{#if minutes}{` · ${t('about {time}', { time: hoursText(minutes) })}`}{/if}</span>
          {#if sport}<small>{t(sport.name)}</small>{/if}
        </div>
        {#if route.profile?.length > 1}<div class="km-prof"><Profile points={route.profile} /></div>{/if}
      </div>

      <label class="km-f"><span class="km-lbl">{t('Name')}</span><input class="inp" bind:value={title} placeholder={route.name || t('Tour from komoot')} autocomplete="off" /></label>

      <fieldset class="km-f">
        <legend class="km-lbl">{t('When|komoot')}</legend>
        <div class="km-chips">
          <OptionButton pressed={!isOther && date === today} label={!isOther && date === today ? t('Today, {date}', { date: dm(today) }) : t('Today')} onclick={() => pick(today)} />
          <OptionButton pressed={!isOther && date === tomorrow} label={!isOther && date === tomorrow ? t('Tomorrow, {date}', { date: dm(tomorrow) }) : t('Tomorrow')} onclick={() => pick(tomorrow)} />
          <OptionButton pressed={!isOther && date === after} label={dm(after)} onclick={() => pick(after)} />
          <OptionButton pressed={isOther} icon={CalendarDays} label={t('Other day')} onclick={() => (otherDay = true)} />
        </div>
        {#if isOther}<DateInput class="inp km-date" bind:value={date} aria-label={t('Start date')} />{/if}
        {#if clash}<p class="km-info" data-komoot-clash><Info size={16} aria-hidden="true" /><span>{clash.day > 1 ? t('On {day} you are still on {name} (day {n}). Both may stand.', { day: dm(date), name: clash.trip.title, n: clash.day }) : t('On {day} {name} starts. Both may stand.', { day: dm(date), name: clash.trip.title })}</span></p>{/if}
      </fieldset>

      {#if bikes.length}
        <fieldset class="km-f">
          <legend class="km-lbl">{t('Bike')}</legend>
          <div class="km-chips">
            {#each bikes as b (b.id)}<OptionButton pressed={bike?.id === b.id} icon={BikeIcon} label={b.name} onclick={() => (bikeId = b.id)} />{/each}
          </div>
          {#if bikeId == null && bike}<p class="km-info"><Info size={16} aria-hidden="true" /><span>{t('Suggestion: the bike of your last trip.')}</span></p>{/if}
        </fieldset>
      {/if}

      <div class="km-folds">
        <button type="button" class="km-fold" aria-expanded={linkOpen} aria-controls="km-link" onclick={() => (linkOpen = !linkOpen)}>
          <LinkIcon size={18} aria-hidden="true" /><b>{t('komoot link')}</b><small>{goodLink ? t('stays in the trip') : t('none yet|link')}</small>{#if linkOpen}<ChevronDown size={18} aria-hidden="true" />{:else}<ChevronRight size={18} aria-hidden="true" />{/if}
        </button>
        {#if linkOpen}
          <div class="km-in" id="km-link">
            <input class="inp" bind:this={linkInput} bind:value={link} type="url" inputmode="url" autocomplete="off" placeholder="https://www.komoot.com/tour/…" aria-label={t('komoot link')} aria-invalid={!!linkMsg} oninput={() => (linkMsg = '')} />
            {#if linkMsg}<p class="km-err" role="alert">{linkMsg}</p>{:else}<p class="km-note">{t('The link stays in the trip: «Open in komoot» opens the tour there.')}</p>{/if}
          </div>
        {/if}
        <button type="button" class="km-fold" aria-expanded={moreOpen} aria-controls="km-more" onclick={() => (moreOpen = !moreOpen)}>
          <SlidersHorizontal size={18} aria-hidden="true" /><b>{t('More details')}</b><small>{t('Days, start time, packing list')}</small>{#if moreOpen}<ChevronDown size={18} aria-hidden="true" />{:else}<ChevronRight size={18} aria-hidden="true" />{/if}
        </button>
        {#if moreOpen}
          <div class="km-in km-more" id="km-more">
            <div class="km-two">
              <label class="km-f"><span class="km-lbl">{t('Days')}</span><input class="inp num" type="number" inputmode="numeric" min="1" max="60" bind:value={days} /></label>
              <label class="km-f"><span class="km-lbl">{t('Start time')}</span><input class="inp" type="time" bind:value={start} /></label>
            </div>
            <fieldset class="km-f">
              <legend class="km-lbl">{t('Packing list')}</legend>
              <div class="km-chips">
                {#if bike}<OptionButton pressed={list === 'suggest'} label={from ? t('Like {name}, {n} items', { name: from.title, n: preview?.entries.length ?? 0 }) : t('Standard, {n} items', { n: preview?.entries.length ?? 0 })} onclick={() => (list = 'suggest')} />{/if}
                <OptionButton pressed={list === 'empty' || !bike} label={t('Start empty')} onclick={() => (list = 'empty')} />
              </div>
            </fieldset>
          </div>
        {/if}
      </div>

      <p class="km-note km-lock"><Lock size={16} aria-hidden="true" /><span>{t('The file stays on your device. Nothing goes back to komoot.')}</span></p>
      {#if error}<p class="km-err" role="alert">{error}</p>{/if}
      <div class="km-foot daumen-foot">
        <button type="button" class="btn btn-link" onclick={cancel}>{t('Cancel')}</button>
        <button type="submit" class="btn hi" disabled={busy}><Check size={18} aria-hidden="true" />{t('Create as planned trip')}</button>
      </div>
    {/if}
  </form>
</dialog>

<style>
  .km-sheet {
    width: min(580px, calc(100vw - 24px));
  }
  .km-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 14px;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-section);
    overflow-wrap: break-word;
  }
  .km-lead {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .km-x {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    cursor: pointer;
  }
  .km-card {
    display: grid;
    grid-template-columns: 112px minmax(0, 1fr);
    align-items: start;
    gap: 8px 12px;
    margin: 0 0 16px;
    padding: 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  @media (min-width: 520px) {
    .km-card {
      grid-template-columns: 140px minmax(0, 1fr);
    }
  }
  .km-map {
    overflow: hidden;
    border-radius: 8px;
    background: var(--paper);
  }
  .km-sum {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .km-name {
    font-weight: 600;
  }
  .km-sum small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .km-prof {
    grid-column: 1 / -1;
  }
  .km-f {
    display: grid;
    gap: 6px;
    min-width: 0;
    margin: 0 0 14px;
    padding: 0;
    border: 0;
  }
  .km-f .inp {
    width: 100%;
    min-height: 48px;
  }
  .km-lbl {
    padding: 0;
    font-weight: 600;
    font-size: var(--fs-small);
  }
  .km-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .km-f :global(.km-date) {
    max-width: 260px;
  }
  .km-info,
  .km-note {
    display: flex;
    gap: 8px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.4;
    overflow-wrap: break-word;
  }
  .km-info :global(svg),
  .km-note :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .km-folds {
    margin: 0 0 12px;
    border-top: 1px solid var(--line);
  }
  .km-fold {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 52px;
    padding: 6px 0;
    border: 0;
    border-bottom: 1px solid var(--line);
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .km-fold b {
    font-weight: 500;
  }
  .km-fold small {
    flex: 1;
    min-width: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-align: right;
    overflow-wrap: break-word;
  }
  .km-fold :global(svg) {
    flex: none;
    color: var(--ink-2);
  }
  .km-in {
    display: grid;
    gap: 8px;
    padding: 12px 0;
    border-bottom: 1px solid var(--line);
  }
  .km-in .inp {
    width: 100%;
    min-height: 48px;
  }
  .km-more .km-f {
    margin: 0;
  }
  .km-two {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 12px;
  }
  .km-lock {
    margin: 0 0 12px;
  }
  .km-err {
    margin: 0 0 10px;
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .km-foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 8px 12px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  @media (max-width: 519px) {
    .km-foot .btn.hi {
      flex: 1;
    }
  }
</style>
