<script>
  /**
   * «Neuland-Runde» (Träume und Neuland N2): from «Weisse Flecken in der Nähe» › a place › «Round through it».
   * The app asks the free bike router once for a round from home through that place (runde.js) and shows
   * km, climb and time. «Plan as a trip» makes a Quick start trip with this round, «GPX» gives it to the
   * Garmin, «Other side» tries the round the other way round. Everything is a suggestion.
   * home { lat, lon }; spot { id, name, lat, lon }; onclose().
   */
  import { liveQuery } from 'dexie';
  import { Route, Download, RefreshCw, X, Compass } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, num } from '../i18n.svelte.js';
  import { backClose } from '../ui/backclose.js';
  import { sortBikes } from '../bikes.js';
  import { quickStart } from '../quickstart.js';
  import { freeTitle } from '../dayride.js';
  import { routeStats } from '../route.js';
  import { gpxString } from '../gpxout.js';
  import { switchTrip } from '../nav.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { homeForecast } from '../home-weather.js';
  import { gpxOfRound } from '../ueberraschung.js';
  import { spotRoundPlan, planSpotRound } from './runde.js';
  import '../bikes/velo-dlg.css';

  let { home, spot, onclose } = $props();
  let dialog = $state();
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const tripsQ = liveQuery(() => db.trips.toArray());

  let side = $state(1);
  let busy = $state(false);
  let err = $state('');
  let round = $state(null);
  const title = $derived(t('New ground round: {name}', { name: spot?.name ?? '' }));
  const timeOf = (min) => (min >= 60 ? t('{h} h {m} min', { h: Math.floor(min / 60), m: String(min % 60).padStart(2, '0') }) : t('{m} min', { m: min }));

  async function ask(s) {
    if (busy) return;
    busy = true;
    err = '';
    try {
      const plan = spotRoundPlan(home, spot, s);
      if (!plan) throw new Error('noroute');
      round = await planSpotRound(home, plan);
      side = s;
    } catch (e) {
      err =
        e?.message === 'busy'
          ? t('The bike router is busy right now. Try again in a minute.')
          : e?.message === 'noroute'
            ? t('The bike router found no round there. Tap «Other side».')
            : navigator.onLine === false
              ? t('Offline: a new round needs the internet.')
              : t('The bike router did not answer. Try again.');
    } finally {
      busy = false;
    }
  }
  // one request when the window opens (the tap on «Round through it»), never in the background
  $effect(() => {
    if (home && spot && !round && !busy && !err) ask(1);
  });

  function gpx() {
    const text = gpxString({ name: title, line: round.line });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/gpx+xml' }));
    a.download = 'neuland-runde.gpx';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  async function plan() {
    if (!round || busy) return;
    busy = true;
    try {
      const trips = ($tripsQ ?? []).map((x) => ({ ...x }));
      const bikes = sortBikes((await db.bikes.toArray()).map((b) => ({ ...b })));
      const items = await db.items.toArray();
      const forecast = navigator.onLine ? await homeForecast(db).catch(() => null) : null;
      const trip = await quickStart(db, { trips, bikes, items, forecast });
      if (!trip) {
        err = t('First add a bike: Bikes › «Add bike».');
        return;
      }
      const gpxData = gpxOfRound(round, title);
      const route = gpxData ? { ...routeStats(gpxData, 'neuland-runde.gpx'), wpts: [] } : null;
      const hours = Math.max(1, Math.round((round.min / 60) * 2) / 2);
      await db.trips.update(trip.id, { title: freeTitle(title, trips), hours, ...(route ? { route } : {}) });
      dialog?.close();
      switchTrip(trip.id, '#/pack');
      offerDone(t('Round planned: {km} km. Undo deletes the trip.', { km: num(Math.round(round.km)) }), () => db.trips.delete(trip.id));
    } finally {
      busy = false;
    }
  }
</script>

<dialog class="sheet vdlg" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="sp-h" data-spot-round>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="sp-h"><Compass size={20} aria-hidden="true" /> {title}</h2>
      <p class="vd-sub">{t('A round from home through a place you have never been.')}</p>
    </div>
    <button type="button" class="btn icon" aria-label={t('Close')} onclick={() => dialog?.close()}><X size={18} aria-hidden="true" /></button>
  </div>

  {#if busy && !round}
    <p class="sp-note" role="status">{t('Looking for a round…')}</p>
  {/if}
  {#if round}
    <div class="sp-out" role="status" data-sp-result>
      <b>{t('{km} km · {up} m up · about {time}', { km: num(Math.round(round.km)), up: num(round.gainM ?? 0), time: timeOf(round.min) })}</b>
      <span>{t('From home through {name} and back.', { name: spot.name })}</span>
    </div>
    <div class="sp-row">
      <button type="button" class="btn hi" disabled={busy} onclick={plan} data-sp-plan><Route size={18} aria-hidden="true" />{t('Plan as a trip')}</button>
      <button type="button" class="btn" disabled={busy} onclick={gpx} data-sp-gpx><Download size={18} aria-hidden="true" />{t('GPX for the Garmin')}</button>
      <button type="button" class="btn" disabled={busy} onclick={() => ask(-side)} data-sp-again><RefreshCw size={18} aria-hidden="true" />{t('Other side')}</button>
    </div>
  {/if}
  {#if err}
    <p class="sp-note err" role="alert">{err}</p>
    <button type="button" class="btn" disabled={busy} onclick={() => ask(round ? -side : side)} data-sp-retry><RefreshCw size={18} aria-hidden="true" />{t('Try again')}</button>
  {/if}
  <p class="sp-note">{t('Asks the free bike router once (BRouter). Nothing else leaves the device.')}</p>
</dialog>

<style>
  .sp-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .sp-out {
    display: grid;
    gap: 4px;
    padding: 10px 12px;
    margin: 0 0 12px;
    border-radius: var(--radius-card);
    background: var(--paper-2);
  }
  .sp-note {
    margin: 8px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sp-note.err {
    color: var(--warn, var(--ink));
  }
  h2 :global(svg) {
    vertical-align: -3px;
  }
</style>
