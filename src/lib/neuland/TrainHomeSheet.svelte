<script>
  /**
   * «Zug hin, Velo heim» (Träume und Neuland N7): for one start, the next trains from home there
   * (transport.opendata.ch) and the way home by bike (BRouter), asked once when the window opens.
   * «Plan as a trip» makes a Quick start trip with the way home as its route; «GPX» gives it to the Garmin.
   * home { lat, lon }; start { name, lat, lon }; onclose().
   */
  import { liveQuery } from 'dexie';
  import { Route, Download, RefreshCw, X, TrainFront } from '@lucide/svelte';
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
  import { minText } from '../unterwegs/heimweg.js';
  import { askTrains, askRideHome } from './zugheim.js';
  import '../bikes/velo-dlg.css';

  let { home, start, onclose } = $props();
  let dialog = $state();
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const tripsQ = liveQuery(() => db.trips.toArray());
  const title = $derived(t('Train to {name}, bike home', { name: start?.name ?? '' }));
  const timeOf = (min) => (min >= 60 ? t('{h} h {m} min', { h: Math.floor(min / 60), m: String(min % 60).padStart(2, '0') }) : t('{m} min', { m: min }));
  const why = (e, what) =>
    e?.message === 'busy'
      ? t('The service is busy right now. Try again in a minute.')
      : e?.message === 'noroute'
        ? t('The bike router found no way home from there.')
        : e?.message === 'nostation'
          ? t('No station found near the place.')
          : navigator.onLine === false
            ? t('Offline: this needs the internet.')
            : what;

  let busy = $state(false);
  let tr = $state(null);
  let trErr = $state('');
  let ride = $state(null);
  let rideErr = $state('');
  async function ask() {
    if (busy) return;
    busy = true;
    trErr = '';
    rideErr = '';
    await Promise.all([
      tr ? null : askTrains(home, start).then((x) => (tr = x)).catch((e) => (trErr = why(e, t('The timetable did not answer. Try again.')))),
      ride ? null : askRideHome(start, home).then((x) => (ride = x)).catch((e) => (rideErr = why(e, t('The bike router did not answer. Try again.')))),
    ]);
    busy = false;
  }
  // asked once when the window opens (the tap), never in the background
  let asked = false;
  $effect(() => {
    if (home && start && !asked) {
      asked = true;
      ask();
    }
  });

  function gpx() {
    const text = gpxString({ name: title, line: ride.line });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/gpx+xml' }));
    a.download = 'zug-hin-velo-heim.gpx';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  async function plan() {
    if (!ride || busy) return;
    busy = true;
    try {
      const trips = ($tripsQ ?? []).map((x) => ({ ...x }));
      const bikes = sortBikes((await db.bikes.toArray()).map((b) => ({ ...b })));
      const items = await db.items.toArray();
      const forecast = navigator.onLine ? await homeForecast(db).catch(() => null) : null;
      const trip = await quickStart(db, { trips, bikes, items, forecast });
      if (!trip) {
        rideErr = t('First add a bike: Bikes › «Add bike».');
        return;
      }
      const gpxData = gpxOfRound(ride, title);
      const route = gpxData ? { ...routeStats(gpxData, 'zug-hin-velo-heim.gpx'), wpts: [] } : null;
      const hours = Math.max(1, Math.round((ride.min / 60) * 2) / 2);
      const t0 = tr?.trains?.[0];
      const note = t0 ? t('Train {dep} from {from}, at {to} {arr}', { dep: t0.depTime, from: t0.from, to: t0.to, arr: t0.arrTime }) : '';
      await db.trips.update(trip.id, { title: freeTitle(title, trips), hours, ...(route ? { route } : {}), ...(note ? { note } : {}) });
      dialog?.close();
      switchTrip(trip.id, '#/pack');
      offerDone(t('Way home planned: {km} km. Undo deletes the trip.', { km: num(Math.round(ride.km)) }), () => db.trips.delete(trip.id));
    } finally {
      busy = false;
    }
  }
</script>

<dialog class="sheet vdlg" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="th-sh" data-train-sheet>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="th-sh"><TrainFront size={20} aria-hidden="true" /> {title}</h2>
      <p class="vd-sub">{t('The next trains there, then the way home through new ground.')}</p>
    </div>
    <button type="button" class="btn icon" aria-label={t('Close')} onclick={() => dialog?.close()}><X size={18} aria-hidden="true" /></button>
  </div>

  {#if busy && !tr && !ride}<p class="th-note" role="status">{t('Asking the timetable and the bike router …')}</p>{/if}

  {#if tr}
    <h3 class="th-sub">{t('From {from} to {to}', { from: tr.from.name, to: tr.to.name })}</h3>
    {#if tr.trains.length}
      <ul class="th-trains" data-th-trains>
        {#each tr.trains as c (c.dep)}
          <li>
            <b class="num">{c.depTime} → {c.arrTime}</b>
            <span>{minText(c.min)}{#if c.transfers}{' · '}{t('{n} changes', { n: c.transfers })}{/if}{#if c.platform}{' · '}{t('Platform {p}', { p: c.platform })}{/if}{#if c.lines.length}{' · '}{c.lines.join(', ')}{/if}</span>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="th-note">{t('No train found right now.')}</p>
    {/if}
  {:else if trErr}
    <p class="th-note err" role="alert">{trErr}</p>
  {/if}

  {#if ride}
    <div class="th-out" role="status" data-th-ride>
      <b>{t('{km} km · {up} m up · about {time}', { km: num(Math.round(ride.km)), up: num(ride.gainM ?? 0), time: timeOf(ride.min) })}</b>
      <span>{t('By bike from {name} home.', { name: start.name })}</span>
    </div>
    <div class="th-row">
      <button type="button" class="btn hi" disabled={busy} onclick={plan} data-th-plan><Route size={18} aria-hidden="true" />{t('Plan as a trip')}</button>
      <button type="button" class="btn" disabled={busy} onclick={gpx} data-th-gpx><Download size={18} aria-hidden="true" />{t('GPX for the Garmin')}</button>
    </div>
  {:else if rideErr}
    <p class="th-note err" role="alert">{rideErr}</p>
  {/if}

  {#if (trErr || rideErr) && !busy}
    <button type="button" class="btn" onclick={ask} data-th-retry><RefreshCw size={18} aria-hidden="true" />{t('Try again')}</button>
  {/if}
  <p class="th-note">{t('Asks the free timetable (transport.opendata.ch) and the free bike router once, with your home place and this place. Nothing else leaves the device.')}</p>
</dialog>

<style>
  .th-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .th-sub {
    margin: 0 0 6px;
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .th-trains {
    list-style: none;
    margin: 0 0 12px;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .th-trains li {
    display: grid;
    gap: 2px;
    overflow-wrap: break-word;
  }
  .th-trains span {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .th-out {
    display: grid;
    gap: 4px;
    padding: 10px 12px;
    margin: 0 0 12px;
    border-radius: var(--radius-card);
    background: var(--paper-2);
  }
  .th-note {
    margin: 8px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .th-note.err {
    color: var(--warn, var(--ink));
  }
  h2 :global(svg) {
    vertical-align: -3px;
  }
</style>
