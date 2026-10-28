<script>
  /**
   * Paket U «GPX auf der Live-Karte öffnen» (Noah 19.10.2026): on the live map without a race, open a GPX
   * file (komoot, Ride with GPS, Garmin) and ride along it: km along the route, left to the end, arrival,
   * climbs, as with a race route. The file is read on the device; a thinned line and the numbers are kept
   * (settings 'live-route', liveroute.js). Rename, replace, delete (askDelete + deleteWithUndo).
   * With a trip that has no route yet: «Save route to the trip», only an offer (with Undo).
   *
   * Props: trip (the ride's trip or null), onchange(route | null) after a load, rename or delete
   * (optional: the page can also read liveRouteQuery(db.settings)).
   */
  import { Upload, Pencil, Trash2, Route as RouteIcon, MapPinned } from '@lucide/svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import RwgpsLink from '../sources/RwgpsLink.svelte';
  import { db } from '../db.js';
  import { GPX_MAX_MB } from '../route.js';
  import { liveRouteQuery, liveRouteFromText, saveLiveRoute, clearLiveRoute, renameLiveRoute, canSaveToTrip, asTripRoute, liveRouteFor, forRide, NAME_MAX } from './liveroute.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone, offerRename } from '../ui/rename.svelte.js';
  import { t, num, locale } from '../i18n.svelte.js';

  let { trip = null, onchange = null } = $props();

  const routeQ = liveRouteQuery(db.settings);
  // only the GPX opened for this ride counts; one opened for another ride is only offered (Noah 28.10.2026)
  const route = $derived(liveRouteFor($routeQ ?? null, trip?.id));
  const last = $derived(!route ? ($routeQ ?? null) : null);
  const offerTrip = $derived(!!route && canSaveToTrip(trip));

  let busy = $state(false);
  let msg = $state('');
  let renaming = $state(false);

  const changed = (r) => onchange?.(r ?? null);
  const loadedOn = (iso) => (iso ? new Date(iso).toLocaleDateString(locale(), { day: 'numeric', month: 'numeric', year: 'numeric' }) : '');
  const facts = $derived(
    route ? [`${num(Math.round(route.km * 10) / 10)} km`, route.gainM ? `${num(Math.round(route.gainM))} Hm` : '', route.loadedAt ? t('loaded {day}', { day: loadedOn(route.loadedAt) }) : ''].filter(Boolean).join(' · ') : '',
  );

  async function pick(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file || busy) return;
    msg = '';
    if (file.size > GPX_MAX_MB * 1024 * 1024) return (msg = t('This file is too big for a GPX route (more than {mb} MB).', { mb: GPX_MAX_MB }));
    if (!file.size) return (msg = t('This file is empty.'));
    busy = true;
    try {
      await openText(await file.text(), file.name);
    } catch (err) {
      console.error(err);
      msg = err?.message && err.message !== 'invalid' ? err.message : t('This file could not be read.');
    } finally {
      busy = false;
    }
  }

  // a GPX text (a file, or the GPX of a Ride with GPS link) → the live route, with Undo; throws a plain message
  async function openText(text, fileName) {
    const r = forRide(liveRouteFromText(text, fileName), trip?.id);
    const before = await saveLiveRoute(db.settings, r);
    changed(r);
    offerDone(
      t('Route «{name}» opened: {km} km.', { name: r.name, km: num(Math.round(r.km)) }),
      async () => {
        if (before) await saveLiveRoute(db.settings, before);
        else await clearLiveRoute(db.settings);
        changed(before);
      },
    );
  }
  // the GPX of another ride, for this one (Undo: back to the other ride)
  async function reuse() {
    if (!last) return;
    const before = await saveLiveRoute(db.settings, forRide(last, trip?.id));
    changed(forRide(last, trip?.id));
    offerDone(t('Route «{name}» opened: {km} km.', { name: last.name, km: num(Math.round(last.km)) }), async () => {
      if (before) await saveLiveRoute(db.settings, before);
      changed(before);
    });
  }
  // «Neue Quellen» 20.10.2026: a Ride with GPS link (RwgpsLink shows the message when this throws)
  const fromLink = (text, fileName) => ((msg = ''), openText(text, fileName));

  async function rename(name) {
    if (!route) return;
    const before = route;
    const next = renameLiveRoute(route, name);
    if (next.name === before.name) return;
    await saveLiveRoute(db.settings, next);
    changed(next);
    offerRename(next.name, async () => {
      await saveLiveRoute(db.settings, before);
      changed(before);
    });
  }

  async function drop() {
    if (!route) return;
    const name = route.name;
    const answer = await askDelete({
      title: t('Remove «{name}» from the live map?', { name }),
      text: t('Only the route on this map goes. The GPX file on your phone and your rides stay.'),
      label: t('Remove'),
    });
    if (answer !== 'delete') return;
    await deleteWithUndo({
      run: async () => {
        const before = await clearLiveRoute(db.settings);
        changed(null);
        return before;
      },
      undo: async (before) => {
        if (before) await saveLiveRoute(db.settings, before);
        changed(before);
      },
      text: t('«{name}» removed.', { name }),
      name,
    });
  }

  async function toTrip() {
    if (!route || !trip?.id || !canSaveToTrip(trip)) return;
    const id = trip.id;
    const old = trip.route ?? null;
    try {
      await db.trips.update(id, { route: asTripRoute(route) });
      offerDone(t('Route saved to «{trip}».', { trip: trip.title || t('the trip') }), () => db.trips.update(id, { route: old }));
    } catch (err) {
      console.error(err);
      msg = t('Saving didn\'t work. Try again.');
    }
  }
</script>

<section class="lr" aria-labelledby="lr-h" data-live-route>
  <h3 id="lr-h"><MapPinned size={18} aria-hidden="true" />{t('Ride along a GPX route')}</h3>
  {#if route}
    <div class="lr-row">
      <RouteIcon size={20} aria-hidden="true" />
      <div class="lr-txt">
        <p class="lr-name">{route.name}</p>
        <p class="lr-facts num">{facts}</p>
      </div>
    </div>
    <div class="lr-acts">
      <button type="button" class="btn sm" onclick={() => (renaming = true)} data-live-route-rename><Pencil size={16} aria-hidden="true" />{t('Rename')}</button>
      <label class="btn sm lr-file">
        <Upload size={16} aria-hidden="true" />{busy ? t('Reading…') : t('Other GPX')}
        <input type="file" accept=".gpx,application/gpx+xml" onchange={pick} disabled={busy} class="sr" data-live-route-file />
      </label>
      <button type="button" class="btn sm" onclick={drop} data-live-route-remove><Trash2 size={16} aria-hidden="true" />{t('Remove')}</button>
    </div>
    <RwgpsLink onload={fromLink} />
    {#if offerTrip}
      <div class="lr-offer">
        <p class="lr-help">{t('«{trip}» has no route yet. Keep this one with the trip too (plan, packing list, review)?', { trip: trip.title || t('the trip') })}</p>
        <button type="button" class="btn sm lr-tbtn" onclick={toTrip} data-live-route-trip>{t('Save route to the trip')}</button>
      </div>
    {/if}
  {:else}
    <p class="lr-help">{t('Export the route as a GPX file from komoot, Ride with GPS or Garmin and open it here. The map then shows km along the route, how far to the end, arrival and the climbs. The file stays on this device.')}</p>
    {#if last}
      <div class="lr-offer" data-live-route-last>
        <p class="lr-help">{trip ? t('This ride starts without a route. Your last GPX «{name}» ({km} km) is still here.', { name: last.name, km: num(Math.round(last.km * 10) / 10) }) : t('Your last GPX «{name}» ({km} km) is still here.', { name: last.name, km: num(Math.round(last.km * 10) / 10) })}</p>
        <button type="button" class="btn sm lr-tbtn" onclick={reuse} data-live-route-reuse><RouteIcon size={16} aria-hidden="true" />{t('Load for this ride')}</button>
      </div>
    {/if}
    <label class="btn lr-file">
      <Upload size={17} aria-hidden="true" />{busy ? t('Reading…') : t('Open GPX file')}
      <input type="file" accept=".gpx,application/gpx+xml" onchange={pick} disabled={busy} class="sr" data-live-route-file />
    </label>
    <RwgpsLink onload={fromLink} />
  {/if}
  {#if msg}<p class="lr-msg" role="alert">{msg}</p>{/if}
</section>

{#if renaming && route}
  <RenameSheet
    kicker={t('GPX route')}
    title={t('Rename route')}
    value={route.name}
    hint={t('Only the name on the live map changes.')}
    max={NAME_MAX}
    onsave={rename}
    onclose={() => (renaming = false)}
  />
{/if}

<style>
  .lr {
    display: grid;
    gap: var(--sp-2);
    min-width: 0;
  }
  h3 {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
    color: var(--ink);
  }
  .lr-row {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-2);
    min-width: 0;
    color: var(--ink-2);
  }
  .lr-row :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .lr-txt {
    min-width: 0;
  }
  .lr-name {
    margin: 0;
    color: var(--ink);
    font: 600 var(--fs-body) / 1.35 var(--font-body);
    overflow-wrap: break-word;
  }
  .lr-facts,
  .lr-help {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .lr-acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .lr-file {
    cursor: pointer;
    justify-self: start;
  }
  .lr-file:focus-within {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  .lr-offer {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-3);
    border-radius: var(--radius);
    background: var(--paper-2);
  }
  .lr-tbtn {
    justify-self: start;
  }
  .lr-msg {
    margin: 0;
    color: var(--bad);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
</style>
