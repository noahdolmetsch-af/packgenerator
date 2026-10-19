<script>
  /**
   * Vorbereiten › Route and stops: the organisers' sector files (one or many GPX) become the race route
   * with its sectors as checkpoints; their POI file (Garmin symbols) becomes your own stops; OpenStreetMap
   * adds opening hours, stations and shelters (only on a tap, kept on this device).
   */
  import { Upload, MapPin, CloudDownload, Trash2 } from '@lucide/svelte';
  import RaceBox from '../RaceBox.svelte';
  import { db } from '../../db.js';
  import { readSectorFiles, sectorCheckpoints, parseWaypoints, ownPois, tripRouteOf, biggestGaps } from '../files.js';
  import { fetchPois, POI_CACHE, POI_KINDS } from '../outside.js';
  import { cacheSet, putRace } from '../store.js';
  import { countByKind } from '../prep-lib.js';
  import { askDelete, deleteWithUndo } from '../../ui/ask.js';
  import { offerDone } from '../../ui/rename.svelte.js';
  import { t, tn, num, locale } from '../../i18n.svelte.js';

  let { ctx } = $props();
  let busy = $state('');
  let msg = $state('');
  let poiMsg = $state('');
  let osmMsg = $state('');
  let gaps = $state([]);

  const route = $derived(ctx.stored.route ?? null);
  const kinds = $derived(countByKind(ctx.own, POI_KINDS.map((k) => k.key)));
  const kindName = Object.fromEntries(POI_KINDS.map((k) => [k.key, k.name]));
  const GAP = {
    shop: 'No shop for {km} km: km {from}–{to}',
    food: 'No restaurant for {km} km: km {from}–{to}',
    water: 'No water for {km} km: km {from}–{to}',
    sleep: 'No place to sleep for {km} km: km {from}–{to}',
    bike: 'No bike shop for {km} km: km {from}–{to}',
  };
  const holes = $derived(ctx.route?.km && ctx.pois.length ? biggestGaps(ctx.pois, ctx.route.km).filter((g) => g.km >= 40) : []);
  const isUser = (c) => !String(c.id ?? '').startsWith('sec');

  async function loadRoute(e) {
    const input = e.currentTarget;
    const files = input.files;
    if (!files?.length) return;
    busy = 'route';
    msg = '';
    try {
      const res = await readSectorFiles(files);
      if (!res.route) {
        msg = t('No track found in these files.');
        return;
      }
      gaps = res.gaps;
      const oldTrip = ctx.trip.route ?? null;
      const id = ctx.trip.id;
      const before = await ctx.save((s) => ({ ...s, route: res.route, checkpoints: [...sectorCheckpoints(res.route), ...(s.checkpoints ?? []).filter(isUser)] }));
      await db.trips.update(id, { route: tripRouteOf(res.route, ctx.trip.title) });
      offerDone(tn(files.length, 'Route loaded from {n} file: {km} km.', 'Route loaded from {n} files: {km} km.', { km: num(Math.round(res.route.km)) }), async () => {
        await putRace(id, before);
        await db.trips.update(id, { route: oldTrip });
      });
    } catch (err) {
      console.error(err);
      msg = t('These files could not be read. Are they GPX files?');
    } finally {
      busy = '';
      input.value = '';
    }
  }

  async function loadPois(e) {
    const input = e.currentTarget;
    const f = input.files?.[0];
    if (!f) return;
    busy = 'pois';
    poiMsg = '';
    try {
      const wpts = parseWaypoints(await f.text());
      if (!wpts.length) {
        poiMsg = t('This file has no waypoints.');
        return;
      }
      const { pois, far } = ownPois(wpts, ctx.route);
      const id = ctx.trip.id;
      const before = await ctx.save({ pois });
      poiMsg = far ? tn(far, '{n} stop was more than 5 km from the route and left out.', '{n} stops were more than 5 km from the route and left out.') : '';
      offerDone(tn(pois.length, '{n} stop loaded.', '{n} stops loaded.'), () => putRace(id, before));
    } catch (err) {
      console.error(err);
      poiMsg = t('This file could not be read. Is it a GPX file?');
    } finally {
      busy = '';
      input.value = '';
    }
  }

  async function loadOsm() {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      osmMsg = t('You are offline. Try again with internet.');
      return;
    }
    busy = 'osm';
    osmMsg = '';
    try {
      const list = await fetchPois(ctx.pts);
      await cacheSet(POI_CACHE + ctx.trip.id, list);
      osmMsg = tn(list.length, '{n} place found on OpenStreetMap.', '{n} places found on OpenStreetMap.');
    } catch (err) {
      console.error(err);
      osmMsg = err?.message === 'busy' ? t('OpenStreetMap is busy. Try again in a minute.') : t('Loading did not work. Try again later.');
    } finally {
      busy = '';
    }
  }

  async function dropRoute() {
    const answer = await askDelete({ title: t('Delete the route of this race?'), text: t('The route also goes from the trip. The checkpoints you added yourself stay.') });
    if (answer !== 'delete') return;
    const id = ctx.trip.id;
    const oldTrip = ctx.trip.route ?? null;
    await deleteWithUndo({
      run: async () => {
        const before = await ctx.save((s) => {
          const { route: _r, ...rest } = s;
          return { ...rest, checkpoints: (s.checkpoints ?? []).filter(isUser) };
        });
        await db.trips.update(id, { route: null });
        return before;
      },
      undo: async (before) => {
        await putRace(id, before);
        await db.trips.update(id, { route: oldTrip });
      },
      text: t('Route deleted.'),
      name: t('Route'),
    });
  }
  async function dropPois() {
    const answer = await askDelete({ title: t('Delete your own stops?'), text: t('The places from OpenStreetMap stay on this device.') });
    if (answer !== 'delete') return;
    const id = ctx.trip.id;
    await deleteWithUndo({ run: () => ctx.save({ pois: [] }), undo: (before) => putRace(id, before), text: t('Own stops deleted.'), name: t('Own stops') });
  }
  const age = (at) => (at ? new Date(at).toLocaleDateString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
</script>

<RaceBox
  id="prep-route"
  title={t('Route and stops')}
  what="Reads the route files of the race (one or many GPX, for example one per sector) and the file with the stops."
  why="The sectors become checkpoints, the stops show where shops, beds and water are, and the gaps between them show where to carry more."
  from="Your GPX files from the organisers. Opening hours, stations and shelters from OpenStreetMap, only when you tap."
>
  <label class="btn hi" data-race-route-file>
    <Upload size={16} aria-hidden="true" />{busy === 'route' ? t('Reading…') : route ? t('Load other route files') : t('Load the route files (GPX)')}
    <input type="file" accept=".gpx" multiple hidden onchange={loadRoute} disabled={!!busy} />
  </label>
  <p class="rc-note">{t('Many files at once are fine: they are joined in the order of their names (Sector 1, 2 … 11).')}</p>
  {#if msg}<p class="rc-warn" role="alert">{msg}</p>{/if}

  {#if route}
    <div class="rc-stat">
      <div><b>{num(Math.round(route.km))}</b><small>{t('km')}</small></div>
      <div><b>{num(Math.round(route.gainM ?? 0))}</b><small>{t('m up')}</small></div>
      {#if route.maxM != null}<div><b>{num(route.maxM)}</b><small>{t('m highest point')}</small></div>{/if}
    </div>
    {#if route.sectors?.length > 1}
      <div class="rc-scroll">
        <table class="rc-table" data-race-sectors>
          <thead><tr><th>{t('Sector')}</th><th class="num">{t('km')}</th><th class="num">{t('m up')}</th></tr></thead>
          <tbody>
            {#each route.sectors as s, i (i)}
              <tr><td>{s.name}</td><td class="num">{num(Math.round(s.fromKm))}–{num(Math.round(s.toKm))}</td><td class="num">{num(Math.round(s.gainM ?? 0))}</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="rc-note">{t('Each sector end is a checkpoint (see Strategy). Your own checkpoints stay.')}</p>
    {/if}
    {#each gaps as g, i (i)}
      <p class="rc-warn">{t('Gap of {km} km after «{name}»: the next file does not start where this one ends.', { km: num(g.km), name: g.after })}</p>
    {/each}
  {:else if ctx.route?.km}
    <p class="rc-note">{t('Now the route of the trip is used ({km} km).', { km: num(Math.round(ctx.route.km)) })}</p>
  {/if}

  <h3 class="rc-h2">{t('Stops')}</h3>
  <label class="btn" data-race-poi-file aria-disabled={!ctx.route?.km}>
    <MapPin size={16} aria-hidden="true" />{busy === 'pois' ? t('Reading…') : t('Load the file with the stops (GPX)')}
    <input type="file" accept=".gpx" hidden onchange={loadPois} disabled={!!busy || !ctx.route?.km} />
  </label>
  {#if !ctx.route?.km}<p class="rc-note">{t('Load the route first: the stops are placed along it.')}</p>{/if}
  {#if poiMsg}<p class="rc-note" role="status">{poiMsg}</p>{/if}
  {#if kinds.length}
    <ul class="rc-chips" aria-label={t('Your stops by kind')}>
      {#each kinds as k (k.kind)}<li class="rc-chip" data-race-poi-kind={k.kind}>{t(kindName[k.kind])} · {k.n}</li>{/each}
    </ul>
  {/if}

  <button type="button" class="btn" onclick={loadOsm} disabled={!!busy || !ctx.pts?.length} data-race-osm>
    <CloudDownload size={16} aria-hidden="true" />{busy === 'osm' ? t('Loading…') : t('Add opening hours, stations and shelters from OpenStreetMap')}
  </button>
  <p class="rc-note">{t('Stop files rarely have opening hours: OpenStreetMap fills them in.')}</p>
  {#if osmMsg}<p class="rc-note" role="status">{osmMsg}</p>{/if}
  {#if ctx.osmAt}<p class="rc-src">{tn(ctx.osm.length, '{n} place from OpenStreetMap, loaded {when}', '{n} places from OpenStreetMap, loaded {when}', { when: age(ctx.osmAt) })}</p>{/if}

  {#if holes.length}
    <h3 class="rc-h2">{t('Longest gaps')}</h3>
    <ul class="rc-list" data-race-gaps>
      {#each holes as g, i (i)}<li class="rc-row"><span>{t(GAP[g.kind], { km: num(g.km), from: num(g.fromKm), to: num(g.toKm) })}</span></li>{/each}
    </ul>
  {/if}

  {#if route || ctx.own.length}
    <div class="rc-acts">
      {#if route}<button type="button" class="btn sm del" onclick={dropRoute} data-race-route-del><Trash2 size={16} aria-hidden="true" />{t('Delete route')}</button>{/if}
      {#if ctx.own.length}<button type="button" class="btn sm del" onclick={dropPois} data-race-pois-del><Trash2 size={16} aria-hidden="true" />{t('Delete own stops')}</button>{/if}
    </div>
  {/if}
</RaceBox>
