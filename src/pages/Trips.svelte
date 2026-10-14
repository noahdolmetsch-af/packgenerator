<script>
  /**
   * v0.46.1 (Noah: «Touren» opened the last trip at Packen): #/trips, the calm overview of all trips
   * behind «Touren». #/pack and #/pack?… still open a trip directly.
   * v0.78.0 «Fünf Orte» 2 / «Übergänge 2»: the Touren page proper (tiles grouped by state).
   * v0.102.0 Design-Refresh P4 «Touren» (T1): the count line, «Weitermachen», the Wetter-Fenster, the best values.
   * v0.126.0 TZ-1 «Zustand sichtbar»: the three trip states (tripstate.js) with their pills and chips.
   * SN4g–SN4i «Touren-Seite, Runde 2» (mockups seiten-neu-touren-2, Noah 13.10.2026 22:24 «SN4g–SN4i
   * freigegeben»; answers 1b 2 3b 4a 5a 6 7 8 and 1a / 2b of the second round). The page from top to bottom:
   *   - the narrow band «Packmodus» above everything (two states: a pack draft exists / nothing open);
   *   - «Geplant»: a short list of the planned trips, the next first, with the packing bar;
   *   - «Abgeschlossene Touren»: all trips of the period by month (12 Monate / year / Alle), the state chips,
   *     «Filter» (FL1–FL8, touren/FilterSheet.svelte) with the active filters as chips to tap away and the
   *     saved ones as «Meine Filter» right above the list. Every row carries its values: Fahrzeit,
   *     Verstrichen, Ø Tempo, Ø and max. Puls, Wetter, Temp.; with a power meter also Ø and max. Leistung
   *     and NP, without one a quiet «ohne Wattwerte». A row with a Rückblick is highlighted, one without is
   *     grey and keeps «Bewerten» / «Kurz bewerten». On a phone every trip is a card.
   *   - «In Zahlen» (review/InZahlen.svelte, tours): five groups, all open, a jump bar; they follow the
   *     period, chips and filters, except «Zum Vorjahr».
   *   - «Weiter»: the tiles DG-O1 Gute Tage (never filtered), DG-O2 Offene Rückblicke and DG-O5 Karte aller
   *     Touren (both follow the filters), touren/TourTiles.svelte.
   * AT1 «Abgeschlossene Touren aus Strava» (mockup AT1, Noah 14.10.2026 21:19 «1a 2a 3b 4b at1 freigeben»):
   * «Abgeschlossene Touren» is now every Strava activity with its values (touren/Activities.svelte); the
   * trips packed in the app follow as «Packmodus» (the name instead of «App-Touren»), the only place to rate.
   * Their rows are short: the state, the things packed and the Strava activity of the trip.
   * Gone from here: «Weitermachen», the tile groups, the legend «Drei Zustände», the best values (now in
   * «Rekorde und Vergleich») and the Wetter-Fenster (now DG-O1). Health values only to look at.
   */
  import { liveQuery } from 'dexie';
  import Skeleton from '../lib/ui/Skeleton.svelte';
  import { db } from '../lib/db.js';
  import { tripsOverview } from '../lib/tripsoverview.js';
  import { stateExtra } from '../lib/tripstate.js';
  import { stateExtraText } from '../lib/tripstatetext.js';
  import TripState from '../lib/ui/TripState.svelte';
  import StateChips from '../lib/ui/StateChips.svelte';
  import Btn from '../lib/ui/Btn.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { overviewCounts, weatherWindow, packBand, tileRows } from '../lib/touren.js';
  import { homeForecast } from '../lib/home-weather.js';
  import { HOME_PLACE } from '../lib/know.js';
  import { switchTrip, openNew, openTrip, newTrip } from '../lib/nav.js';
  import KomootSign from '../lib/komoot/KomootSign.svelte'; // SN1d (answer 3b)
  import { TEMPLATES_KEY, templateUse } from '../lib/templates.js';
  import { riddenTrips } from '../lib/trips.js';
  import { planAgain } from '../lib/trip/ending.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn, num, locale } from '../lib/i18n.svelte.js';
  import { Plus, ChevronRight, Route, Upload, Flag, Star, SlidersHorizontal, Bookmark, X, Info, Calendar, Backpack, Search, Activity } from '@lucide/svelte';
  // SN4g: the rows, their values and the filters
  import { loadReview } from '../lib/review/load.js';
  import { tripFacts, periodOf } from '../lib/review/rueckblick.js';
  import { factStates, factCounts, matchesState } from '../lib/review/state.js';
  import { isArchived } from '../lib/home/heute.js';
  import { loadPastActs, zonesOf, ZONES_KEY } from '../lib/review/actdata.js';
  import { rowValues, linesOf, routeMap } from '../lib/review/inzahlen.js';
  import { TOUR_VIEW_KEY, TOUR_GROUP_KEYS } from '../lib/review/pastcols.js';
  import { tourViewOf, bikeOfRow } from '../lib/review/tourzahlen.js';
  import { n0, dates, monthLong } from '../lib/review/fmt.js';
  import { TOURS_KEY, KINDS, toursOf, emptyFilter, normFilter, filterRows, activeChips, withoutChip, kindOf, sameFilter, saveFilter, dropFilter } from '../lib/touren/filter.js';
  import InZahlen from '../lib/review/InZahlen.svelte';
  import PackBand from '../lib/touren/PackBand.svelte';
  import FilterSheet from '../lib/touren/FilterSheet.svelte';
  import { saveActFilter } from '../lib/touren/actfilter.js';
  import TourTiles from '../lib/touren/TourTiles.svelte';
  // AT1: the Strava activities
  import Activities from '../lib/touren/Activities.svelte';
  import { tourRows, stravaOfTrip } from '../lib/touren/aktivitaeten.js';
  import { loadActs } from '../lib/review/actdata.js';
  import { ftpEstimate } from '../lib/training.js';
  import { zones } from '../lib/strava/zones.svelte.js';
  import { strava } from '../lib/strava/client.svelte.js';
  import '../lib/review/review.css';
  import '../lib/ui/daumen.css'; // FE1: the main action at the bottom on a phone

  const tripsQ = liveQuery(() => db.trips.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const ridesQ = liveQuery(() => db.rides.toArray());
  const placeQ = liveQuery(() => db.settings.get(HOME_PLACE));
  // v0.143.0 WS3a (Release-Analyse F5, Noah 14.10.2026 «ws1-ws7 freigeben»): start quickly again, like the last
  // trip ridden or from the two templates used last; «All templates» leads on.
  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));
  const loaded = $derived(!!$tripsQ && !!$debriefsQ);
  const today = localDay();
  const hasRidden = $derived(riddenTrips($tripsQ ?? [], today).some((x) => x.bikeId));
  const recentTpls = $derived(
    ($tplQ?.value ?? [])
      .filter((x) => !x.archivedAt)
      .map((tp) => ({ tp, use: templateUse(tp, $tripsQ ?? [], today) }))
      .filter((r) => r.use.n)
      .sort((a, b) => (b.use.last ?? '').localeCompare(a.use.last ?? ''))
      .slice(0, 2),
  );
  const rides = $derived($ridesQ ?? []);
  const view = $derived(loaded ? tripsOverview($tripsQ, $debriefsQ, today, rides) : null);
  const counts = $derived(overviewCounts(view));
  const byId = $derived(Object.fromEntries(($tripsQ ?? []).map((x) => [x.id, x])));
  const debriefOf = $derived(Object.fromEntries(($debriefsQ ?? []).map((d) => [d.tripId, d])));
  const extraOf = (r) => stateExtraText(stateExtra(r.tstate, { trip: byId[r.tripId], debrief: debriefOf[r.tripId] ?? null, today }));

  /* ---- SN4g: the page record (saved filters, the band) ---- */
  const toursQ = liveQuery(() => db.settings.get(TOURS_KEY));
  const tours = $derived(toursOf($toursQ?.value));
  const saveTours = (patch) => db.settings.put({ key: TOURS_KEY, value: { ...$state.snapshot(tours), ...patch, at: new Date().toISOString() } });

  /* ---- SN4g: the Packmodus band and «Geplant» ---- */
  const current = (() => {
    try {
      return localStorage.getItem('pack.currentTrip');
    } catch {
      return null;
    }
  })();
  const plan = $derived(view?.plan ?? []);
  const band = $derived(packBand(plan, $tripsQ ?? [], current));
  const bandRow = $derived(band.state === 'draft' ? band.row : null);
  const PLAN_SHORT = 3;
  let planAll = $state(false);
  const pct = (s) => (s?.total ? Math.round((100 * (s.done ?? 0)) / s.total) : null);
  const go = (r) => switchTrip(r.tripId, r.go.href);
  const tripDays = (id) => Math.max(1, Number(byId[id]?.days) || 1);
  const thisYear = String(new Date().getFullYear());
  const day = (iso) => {
    if (!iso) return t('No date set');
    const y = iso.slice(0, 4) !== thisYear ? { year: 'numeric' } : {};
    return new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', ...y });
  };
  const planLine = (r) => [day(r.date), tn(tripDays(r.tripId), '{n} day', '{n} days'), r.bike].filter(Boolean).join(' · ');

  /* ---- SN4g: the finished trips (the same rows as Vergangene Touren, review/rueckblick.js) ---- */
  const dataQ = liveQuery(() => loadReview(db));
  // like the rest of Touren the test trips stay until «Testdaten aufräumen» archives them; archived trips go
  const facts = $derived($dataQ ? tripFacts({ ...$dataQ, trips: $dataQ.trips.filter((x) => !isArchived(x)), today }) : []);
  const states = $derived($dataQ ? factStates(facts, { debriefs: $dataQ.debriefs, rides: $dataQ.rides, today }) : {});
  const bikes = $derived($dataQ?.bikes ?? []);
  const bikeName = $derived(Object.fromEntries(bikes.map((b) => [b.id, b.name])));
  // SN4g: wire to training.js when the Training PR lands (the activities: power, NP, moving and elapsed time)
  const moreQ = liveQuery(async () => {
    const [acts, entries, zones] = await Promise.all([loadPastActs(db), db.kmBook.toArray(), db.settings.get(ZONES_KEY)]);
    return { acts, entries, zones: zonesOf(zones?.value ?? null, entries, acts) };
  });
  const vals = $derived($dataQ && $moreQ ? Object.fromEntries(facts.map((r) => [r.id, rowValues(r, { acts: $moreQ.acts, entries: $moreQ.entries, bikes, bounds: $moreQ.zones?.bounds ?? null })])) : {});

  /* ---- AT1: «Abgeschlossene Touren» = every Strava activity; a trip of the Packmodus marks its own ---- */
  const actsQ = liveQuery(() => loadActs(db));
  const acts = $derived($actsQ ?? []);
  const packed = $derived(facts.filter((r) => r.kind === 'trip' && r.trip && (states[r.id]?.state === 'done' || states[r.id]?.state === 'rated')).map((r) => ({ trip: r.trip, state: states[r.id].state })));
  const actRows = $derived(tourRows(acts, { packed, kmBook: $moreQ?.entries ?? [], bounds: zones.bounds, ftp: ftpEstimate(acts, today) }));
  const stravaOf = (r) => (r.kind === 'trip' && r.trip ? stravaOfTrip(r.trip, acts, $moreQ?.entries ?? []) : { n: 0, name: '' });

  let mode = $state('12m');
  const year = today.slice(0, 4);
  const PERIODS = $derived([
    { key: '12m', name: t('12 months') },
    { key: 'year', name: year },
    { key: 'all', name: t('All|period') },
  ]);
  const period = $derived(periodOf(mode, today));
  const inPeriod = $derived(facts.filter((r) => (!period.from || r.start >= period.from) && r.start <= period.to));
  let st = $state('all');
  let filter = $state(emptyFilter());
  const ctx = $derived({ bikeOf: (r) => bikeOfRow(r, vals), wattsOf: (r) => !!vals[r.id]?.watts });
  const stCounts = $derived(factCounts(inPeriod, states));
  const rows = $derived(filterRows(inPeriod, filter, ctx).filter((r) => matchesState(states, r.id, st)));
  const chips = $derived(activeChips(filter, bikeName));
  const filtered = $derived(chips.length > 0 || st !== 'all');
  const filterWords = $derived([...(st !== 'all' ? [t(st === 'rated' ? 'Rated|state' : 'Completed|state')] : []), ...chips.map((c) => t(c.label, c.vars))].join(', '));
  let sheet = $state(false);
  const clearAll = () => {
    filter = emptyFilter();
    st = 'all';
  };
  const setSaved = (s) => (filter = sameFilter(filter, s.f) ? emptyFilter() : normFilter(s.f));

  /** Month groups, newest first: [{ month, rows }]. */
  const groups = $derived.by(() => {
    const out = [];
    for (const r of rows) {
      const m = r.start.slice(0, 7);
      if (out.at(-1)?.month !== m) out.push({ month: m, rows: [] });
      out.at(-1).rows.push(r);
    }
    return out;
  });
  const KIND_NAME = Object.fromEntries(KINDS.map((k) => [k.key, k.name]));
  const what = (r) => (r.kind === 'ride' ? t(KIND_NAME.ride) : r.days > 1 ? tn(r.days, '{n} day', '{n} days') : t(KIND_NAME[kindOf(r)] ?? 'Day ride|art'));
  const rowBike = (r) => r.bike ?? bikeName[vals[r.id]?.bikeId] ?? null;
  const openRow = (r) => r.trip && openTrip(r.trip.id);
  // «Bewerten» opens the trip's Rückblick; an uploaded ride on its own opens its short one («Kurz bewerten»)
  const rateHref = (r) => (r.kind === 'ride' ? r.href : `#/debrief/${encodeURIComponent(r.id)}`);

  /* ---- SN4h: «In Zahlen» (all groups open at first; Blöcke and closed blocks remembered) ---- */
  const tvQ = liveQuery(() => db.settings.get(TOUR_VIEW_KEY));
  let openNow = $state(null);
  let tvNow = $state(null);
  const izView = $derived({ ...tourViewOf(tvNow ?? $tvQ?.value ?? null), open: openNow ?? [...TOUR_GROUP_KEYS] });
  function saveIz(next) {
    const plain = $state.snapshot(next);
    openNow = [...plain.open];
    const keep = { off: plain.off, shut: plain.shut };
    tvNow = keep;
    db.settings.put({ key: TOUR_VIEW_KEY, value: { ...keep, at: new Date().toISOString() } });
  }
  const periodName = $derived(PERIODS.find((p) => p.key === mode)?.name ?? '');
  const scope = $derived([periodName, filtered ? t('{n} of {all} trips', { n: num(rows.length), all: num(inPeriod.length) }) : tn(inPeriod.length, 'the {n} trip', 'all {n} trips')].join(', '));

  /* ---- SN4i: the tiles (O1 the forecast, O2 and O5 the rows shown) ---- */
  let forecast = $state(null);
  let wxTried = $state(false);
  async function loadWx() {
    try {
      forecast = await homeForecast(db);
    } catch {
      forecast = null;
    } finally {
      wxTried = true;
    }
  }
  $effect(() => {
    void $placeQ;
    loadWx();
  });
  const wx = $derived({ window: weatherWindow(forecast, today), tried: wxTried, place: !!$placeQ?.value });
  const tileData = $derived(tileRows(rows, states));
  const map = $derived(routeMap(tileData.map));
  const tileExtra = (r) => stateExtraText(states[r.id]?.extra);
</script>

{#snippet activeRow()}
  {#if chips.length}
    <div class="active" data-active-filters>
      <span class="al">{t('Active|filter')}</span>
      {#each chips as c (c.id)}<button type="button" class="ac" data-chip={c.id} aria-label={t('Remove filter {name}', { name: t(c.label, c.vars) })} onclick={() => (filter = withoutChip(filter, c))}>{t(c.label, c.vars)}<X size={15} aria-hidden="true" /></button>{/each}
      <button type="button" class="btn btn-link clear" onclick={() => (filter = emptyFilter())} data-clear-filters>{t('Clear filters')}</button>
    </div>
  {/if}
{/snippet}

{#snippet packInfo(r)}
  <!-- AT1: the Packmodus row stays short: the things packed and the Strava activity of the trip -->
  {@const ents = r.trip?.entries ?? []}
  {@const sv = stravaOf(r)}
  <p class="pinfo" data-pack-info>
    {#if ents.length}<span><Backpack size={14} aria-hidden="true" />{tn(ents.length, '{n} item in the list', '{n} items in the list')}</span>{/if}
    <span data-strava-of={sv.n}><Activity size={14} aria-hidden="true" />{sv.n > 1 ? t('Strava: {n} activities', { n: sv.n }) : sv.n === 1 ? t('Strava: {name}', { name: sv.name || t('1 activity') }) : t('no Strava activity')}</span>
  </p>
{/snippet}

<div class="trips">
  <header class="ph">
    <div>
      <h1 class="title">{t('Trips|place')}</h1>
      {#if counts}<p class="cnt num">{[tn(counts.plan, '{n} planned', '{n} planned'), tn(counts.done, '{n} completed', '{n} completed'), tn(counts.rated, '{n} rated', '{n} rated')].join(' · ')}</p>{/if}
    </div>
    <Btn icon={Upload} label={t('Upload ride')} href="#/debrief/ride" />
  </header>
  {#if view}
    {#if view.empty}
      <!-- v0.127.0 A-U2: the one empty building block -->
      <Empty icon={Route} title={t('No trips yet')} text={t('A trip is the packing list for one ride or journey.')} action={{ label: t('Create a trip|first'), onclick: () => openNew('list'), explain: t('Create the first trip') }}>
        {t('Best values come after your first ride with a GPX file.')} <a href="#/debrief/ride">{t('Upload a ride')}</a>
      </Empty>
    {:else}
      <!-- SN4g: the band «Packmodus» (answer 1b), a suggestion: «×» hides it, a quiet link brings it back -->
      {#if tours.band !== 'hidden'}
        <PackBand {band} extra={bandRow ? extraOf(bandRow) : ''} onhide={() => saveTours({ band: 'hidden' })} />
      {/if}

      <!-- SN4g: «Geplant», a short list (answer 3b) -->
      <section class="plan" aria-labelledby="trips-plan" data-planned>
        <div class="sh">
          <div>
            <h2 id="trips-plan">{t('Planned|group')}</h2>
            {#if plan.length}<p class="ss">{tn(plan.length, '{n} trip', '{n} trips')} · {t('the next first')}</p>{/if}
          </div>
          <div class="sha">
            {#if tours.band === 'hidden'}<button type="button" class="btn btn-link" onclick={() => saveTours({ band: null })} data-band-show><Backpack size={16} aria-hidden="true" />{t('Show the pack mode band')}</button>{/if}
            <!-- FE1: on a phone «New trip» sits at the bottom, in reach of the thumb -->
            <span class="daumen"><button type="button" class="btn btn-link" onclick={() => openNew('list')} data-plan-new><Plus size={16} aria-hidden="true" />{t('New trip')}</button></span>
          </div>
        </div>
        <!-- v0.143.0 WS3a (Release-Analyse F5, Noah 14.10.2026 «ws1-ws7 freigeben»), Paket 3 on the SN4g layout:
             «Schnell starten» right under the head of «Geplant», next to «New trip» -->
        {#if hasRidden || recentTpls.length}
          <div class="quick" role="group" aria-label={t('Start quickly')} data-quick>
            <span class="ql">{t('Start quickly:')}</span>
            {#if hasRidden}<button type="button" class="btn sm" onclick={() => newTrip('last')}>{t('Like the last trip')}</button>{/if}
            {#each recentTpls as r (r.tp.id)}<button type="button" class="btn sm" onclick={() => newTrip(r.tp.id)}>{r.tp.name}</button>{/each}
            <a class="qa" href="#/pack/templates">{t('All templates')}<ChevronRight size={16} aria-hidden="true" /></a>
          </div>
        {/if}
        {#if plan.length}
          <ul class="pcards">
            {#each planAll ? plan : plan.slice(0, PLAN_SHORT) as r (r.id)}
              {@const ents = byId[r.tripId]?.entries ?? []}
              {@const packed = ents.filter((e) => e.packed).length}
              {@const p = r.kind === 'trip' && ents.length ? Math.round((100 * packed) / ents.length) : r.kind === 'ride' ? pct(r.state) : null}
              <li class="pc" data-trip={r.tripId}>
                <div class="pt">
                  {#if r.kind === 'replan'}<b class="pn">{r.title}</b>{:else}<a class="pn whole" href={r.go.href} onclick={(e) => (e.preventDefault(), go(r))} aria-label="{t(r.go.label)}: {r.title}">{r.title}</a>{/if}
                  <TripState state="plan" extra={extraOf(r)} />
                </div>
                <p class="ps">{r.kind === 'replan' ? `${day(r.date)} · ${t(r.state.label, r.state)}` : planLine(r)}</p>
                <KomootSign trip={byId[r.tripId]} small />
                {#if r.kind === 'replan'}
                  <button type="button" class="btn k rp" onclick={() => planAgain(byId[r.tripId])} aria-label="{t(r.go.label)}: {r.title}"><span class="kl">{t(r.go.label)}</span></button>
                {:else if r.kind === 'trip' && ents.length}
                  <!-- the same count as the band: the things ticked as packed -->
                  <span class="pr"><span class="bar" aria-hidden="true"><i style:width="{p}%"></i></span><span class="num">{packed ? tn(ents.length, '{done} of {n} packed', '{done} of {n} packed', { done: packed }) : t('not packed yet')}</span></span>
                {:else if p != null}
                  <span class="pr"><span class="bar" aria-hidden="true"><i style:width="{p}%"></i></span><span class="num">{tn(r.state.total, '{done} of {n} packed', '{done} of {n} packed', { done: r.state.done ?? 0 })}</span></span>
                {:else}
                  <span class="pr"><span class="num">{t(r.state.label, r.state)}</span></span>
                {/if}
                {#if bandRow?.tripId === r.tripId}<span class="inpm" data-in-pack-mode><Backpack size={13} aria-hidden="true" />{t('in pack mode')}</span>{/if}
              </li>
            {/each}
          </ul>
          {#if plan.length > PLAN_SHORT}<button type="button" class="btn btn-link more" aria-expanded={planAll} onclick={() => (planAll = !planAll)}>{planAll ? t('Fewer|list') : tn(plan.length, 'All {n} planned trip', 'All {n} planned trips')}<ChevronRight size={16} aria-hidden="true" /></button>{/if}
        {:else}
          <p class="noplan" data-no-plan><Calendar size={16} aria-hidden="true" />{t('No trip planned.')} <button type="button" class="btn btn-link" onclick={() => openNew('list')}>{t('New trip')}<ChevronRight size={14} aria-hidden="true" /></button></p>
        {/if}
      </section>

      <!-- AT1: «Abgeschlossene Touren», every Strava activity (answers 1a 2a 3b 4b) -->
      {#if $actsQ}<Activities rows={actRows} {bikes} {today} {periodOf} connected={strava.key || acts.length > 0} saved={tours.actSaved} onsave={(name, f) => saveTours({ actSaved: saveActFilter(tours.actSaved, name, f) })} ondrop={(id) => saveTours({ actSaved: dropFilter(tours.actSaved, id) })} />{/if}

      <!-- AT1: «Packmodus» (was «App-Touren»): the trips packed in the app, the only place to rate (SN4g answers 4a, 5a) -->
      <section class="done" aria-labelledby="trips-done" data-finished data-packmode>
        <div class="sh">
          <div>
            <h2 id="trips-done"><Backpack size={20} aria-hidden="true" />{t('Pack mode|section')}</h2>
            <p class="ss">{t('Trips you packed in the app: what came along and what proved itself')}</p>
            <p class="ss" data-list-sub>{filtered ? t('{n} of {all} · filtered', { n: num(rows.length), all: num(inPeriod.length) }) : `${tn(inPeriod.length, '{n} trip', '{n} trips')} · ${t('newest first, by month')}`}</p>
          </div>
          <a class="btn btn-link more" href="#/pack/past">{t('As a table')}<ChevronRight size={16} aria-hidden="true" /></a>
        </div>
        <div class="tools">
          <Seg full={false} label={t('Period')} value={mode} options={PERIODS} onchange={(v) => (mode = v)} />
          <StateChips value={st} counts={stCounts} onchange={(v) => (st = v)} />
          <button type="button" class="btn k fbtn" aria-haspopup="dialog" onclick={() => (sheet = true)} data-filter-open><SlidersHorizontal size={17} aria-hidden="true" /><span class="kl">{t('Filter')}</span>{#if chips.length}<span class="fn num" data-filter-n>{chips.length}</span>{/if}</button>
        </div>
        {#if tours.saved.length}
          <div class="mine" role="group" aria-label={t('My filters')} data-my-filters>
            <span class="al"><Bookmark size={14} aria-hidden="true" />{t('My filters')}</span>
            {#each tours.saved as s (s.id)}<button type="button" class="mf" aria-pressed={sameFilter(filter, s.f)} onclick={() => setSaved(s)} data-saved={s.name}>{s.name}</button>{/each}
          </div>
        {/if}
        {@render activeRow()}

        {#if !$dataQ}
          <Skeleton rows={3} />
        {:else if !rows.length}
          <div class="none"><Empty icon={Search} title={t('No trip matches.')} text={filtered ? t('Another filter or period shows more.') : t('No trip in this period.')} action={filtered ? { label: t('Clear filters'), onclick: clearAll, explain: t('Show all trips of the period') } : mode !== 'all' ? { label: t('Show all|filter'), onclick: () => (mode = 'all'), explain: t('Show all years') } : null} /></div>
        {:else}
          <div class="list" data-trip-list>
            {#each groups as g (g.month)}
              <h3 class="mh">{monthLong(g.month)}</h3>
              <ul class="rows">
                {#each g.rows as r (r.id)}
                  {@const s = states[r.id]}
                  {@const bike = rowBike(r)}
                  <li class="tr st-{s?.state}" data-row={r.id} data-state={s?.state}>
                    <span class="ric" aria-hidden="true">{#if s?.state === 'rated'}<Star size={18} fill="currentColor" />{:else}<Flag size={18} />{/if}</span>
                    <div class="rm">
                      <div class="rt"><a class="rn" href={r.href} onclick={() => openRow(r)}>{r.title}</a><TripState state={s?.state} extra={stateExtraText(s?.extra)} /></div>
                      <p class="rs">{[dates(r.start, r.end), what(r), bike].filter(Boolean).join(' · ')}</p>
                      {#if !linesOf(r).length}<p class="nr"><Info size={14} aria-hidden="true" />{t('without a route')}</p>{/if}
                    </div>
                    <div class="rk num"><span><b>{n0(r.km)}</b><small>km</small></span><span><b>{n0(r.gainM)}</b><small>{t('Hm|col')}</small></span></div>
                    {#if s?.state === 'done'}
                      <div class="rr"><Btn label={r.kind === 'ride' ? t('Rate briefly') : t('Rate|debrief')} href={rateHref(r)} onclick={() => openRow(r)} aria="{r.kind === 'ride' ? t('Rate briefly') : t('Rate|debrief')}: {r.title}" data-rate={r.id} /></div>
                    {/if}
                    <span class="chev" aria-hidden="true"><ChevronRight size={18} /></span>
                    {@render packInfo(r)}
                  </li>
                {/each}
              </ul>
            {/each}
          </div>
          <ul class="legend" aria-label={t('What the colours mean')}>
            <li><i class="lg rated"></i>{t('highlighted: with a Rückblick (Rated)')}</li>
            <li><i class="lg done"></i>{t('grey: no Rückblick yet (Completed), a tap opens it anyway')}</li>
          </ul>
        {/if}
      </section>

      {#if $dataQ && facts.length}
        <InZahlen tours {rows} {facts} {vals} {mode} {today} {scope} {states} {bikes} items={$dataQ.items} containers={$dataQ.containers} entries={$moreQ?.entries ?? []} view={izView} onview={saveIz} hrefOf={(id) => facts.find((x) => x.id === id)?.href ?? null} go={(id) => openRow(facts.find((x) => x.id === id) ?? {})} />
      {/if}

      <TourTiles {wx} open={tileData.open} {map} filtered={filtered ? filterWords : ''} go={openRow} {rateHref} extraOf={tileExtra} chips={activeRow} />
    {/if}
  {:else}
    <!-- v0.127.0 A-U2: a calm placeholder while the trips load -->
    <Skeleton rows={4} />
  {/if}
</div>

{#if sheet}
  <FilterSheet {filter} {st} rows={inPeriod} {ctx} {states} {bikes} saved={tours.saved} onapply={(f, s) => ((filter = f), (st = s))} onsave={(name, f) => saveTours({ saved: saveFilter(tours.saved, name, f) })} ondrop={(id) => saveTours({ saved: dropFilter(tours.saved, id) })} onclose={() => (sheet = false)} />
{/if}

<style>
  .trips {
    max-width: 1240px;
    margin: 0 auto;
  }
  .ph {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8px 16px;
    margin: 0 0 var(--sp-4);
  }
  .ph .title {
    margin: 0;
  }
  .cnt {
    margin: var(--sp-1) 0 0;
    color: var(--ink-2);
    font: 400 var(--fs-body) / 1.45 var(--font-body);
  }
  .sh {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 4px 16px;
    margin: 0 0 var(--sp-2);
  }
  .sh h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font: 600 var(--fs-section) / 1.25 var(--font-body);
  }
  .ss {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .sha {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
  }
  .sh .btn-link,
  .more {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    text-decoration: none;
  }
  /* «Geplant» */
  .plan {
    margin: 0 0 var(--sp-5);
  }
  .pcards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
    gap: var(--sp-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .pc {
    position: relative;
    display: grid;
    align-content: start;
    gap: 6px;
    min-width: 0;
    padding: 12px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .pt {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
  }
  .pn {
    color: var(--ink);
    font: 600 var(--fs-body) / 1.3 var(--font-body);
    text-decoration: none;
    overflow-wrap: break-word;
  }
  .whole::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
  }
  .whole:focus-visible {
    outline: none;
  }
  /* SN1d: the komoot sign stays tappable above the whole-row link */
  .pc :global(.kms) {
    position: relative;
    z-index: 1;
    align-self: flex-start;
  }
  .whole:focus-visible::after {
    outline: var(--focus-ring);
    outline-offset: -3px;
  }
  .ps {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .pr {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .bar {
    flex: 1;
    min-width: 40px;
    height: 6px;
    border-radius: 3px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: 3px;
    background: var(--st-plan);
  }
  .rp {
    position: relative;
    z-index: 1;
    justify-self: start;
  }
  .inpm {
    display: inline-flex;
    align-items: center;
    justify-self: start;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--st-plan-soft);
    color: var(--st-plan);
    font: 500 var(--fs-tiny) / 1.4 var(--font-body);
  }
  .noplan {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  /* «Abgeschlossene Touren» */
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
    margin: 0 0 var(--sp-2);
  }
  .fbtn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    margin-left: auto;
  }
  .fn {
    display: inline-grid;
    place-items: center;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--ink);
    color: var(--paper);
    font: 600 var(--fs-tiny) / 1 var(--font-body);
  }
  .mine,
  .active {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2);
    margin: 0 0 var(--sp-2);
  }
  .al {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-2);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
  }
  .mf,
  .ac {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 14px;
    border: 1px dashed var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.2 var(--font-body);
    cursor: pointer;
  }
  .mf[aria-pressed='true'],
  .ac {
    border: 1px solid var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .clear {
    min-height: 44px;
  }
  .mh {
    margin: var(--sp-4) 0 var(--sp-2);
    color: var(--ink-2);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .mh:first-child {
    margin-top: var(--sp-2);
  }
  .rows {
    display: grid;
    gap: var(--sp-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tr {
    position: relative;
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr) auto auto 20px;
    grid-template-areas: 'ic main km rate chev' '. vals vals vals vals';
    align-items: start;
    gap: 6px 14px;
    padding: 12px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper-2);
  }
  /* highlighted: with a Rückblick (green, a stripe, the star); grey: none yet */
  .tr.st-rated {
    border-color: color-mix(in srgb, var(--st-rated-line) 35%, transparent);
    border-left: 4px solid var(--st-rated);
    background: var(--st-rated-soft);
  }
  .ric {
    grid-area: ic;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--paper);
    color: var(--st-done);
  }
  .st-rated .ric {
    color: var(--st-rated);
  }
  .rm {
    grid-area: main;
    min-width: 0;
  }
  .rt {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
  }
  .rn {
    color: var(--ink);
    font: 600 var(--fs-body) / 1.3 var(--font-body);
    text-decoration: none;
    overflow-wrap: break-word;
  }
  /* the whole row opens the trip */
  .rn::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
  }
  .rn:focus-visible {
    outline: none;
  }
  .rn:focus-visible::after {
    outline: var(--focus-ring);
    outline-offset: -3px;
  }
  .rs,
  .nr {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .nr {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-3);
  }
  .rk {
    grid-area: km;
    display: flex;
    gap: 20px;
    text-align: center;
  }
  .rk span {
    display: grid;
  }
  .rk b {
    font: 600 var(--fs-body) / 1.2 var(--font-body);
  }
  .rk small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .rr {
    grid-area: rate;
    position: relative;
    z-index: 1;
  }
  .chev {
    grid-area: chev;
    align-self: center;
    color: var(--ink-3);
  }
  /* AT1: the short line of a Packmodus row */
  .pinfo {
    grid-area: vals;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 18px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .pinfo span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .legend {
    display: grid;
    gap: 4px;
    margin: var(--sp-3) 0 0;
    padding: 0;
    list-style: none;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .legend li {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .lg {
    flex: none;
    width: 22px;
    height: 12px;
    border-radius: 3px;
    background: var(--paper-2);
    border: 1px solid var(--card-line);
  }
  .lg.rated {
    background: var(--st-rated-soft);
    border-left: 3px solid var(--st-rated);
  }
  @media (max-width: 719px) {
    .fbtn {
      margin-left: 0;
    }
    /* on a phone every trip is a card: the values in a box of 4 columns, the power below with its own head */
    .tr {
      grid-template-columns: 36px minmax(0, 1fr) 20px;
      grid-template-areas: 'ic main chev' 'km km km' 'vals vals vals' 'rate rate rate';
    }
    .rk {
      gap: 16px;
      text-align: left;
    }
    .rk span {
      display: inline-flex;
      align-items: baseline;
      gap: 4px;
    }
    .rr :global(.btn) {
      display: flex;
      justify-content: center;
      width: 100%;
    }
  }
  /* v0.143.0 WS3a: start quickly */
  .quick {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 12px 0 16px;
  }
  .quick .ql {
    font-weight: 600;
    margin-right: 4px;
  }
  .quick .qa {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    margin-left: 4px;
  }
</style>
