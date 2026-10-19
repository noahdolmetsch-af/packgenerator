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
   * Their rows keep their values (Noah 14.10.2026 «1-5a», answer 4a of the release inventory: ride time,
   * heart rate, power, weather and temp. stay) and add the things packed and the Strava activity of the trip.
   * Gone from here: «Weitermachen», the tile groups, the legend «Drei Zustände», the best values (now in
   * «Rekorde und Vergleich») and the Wetter-Fenster (now DG-O1). Health values only to look at.
   * 0.163.0 «Handy kurz» (Durchklick 2, Noah 15.10.2026 «freigabe», answers 1 «wo sinnvoll» and 2b): on a phone
   * the page is at most three screens. «Abgeschlossene Touren» and «Packmodus» show their newest five rows,
   * then «Show n more»; a row's values are one grey line (2b), a missing value is left out; «ohne Route», the
   * things packed, the legend, the notes and the pill «im Packmodus» under the band go; «In Zahlen» and «Weiter» are one closed line. A computer
   * keeps the page as before.
   */
  import HintCard from '../lib/pageinfo/HintCard.svelte';
  import PageMore from '../lib/pageinfo/PageMore.svelte';
  import TipLine from '../lib/pageinfo/TipLine.svelte';
  import { liveQuery } from 'dexie';
  import Skeleton from '../lib/ui/Skeleton.svelte';
  import { db } from '../lib/db.js';
  import { tripsOverview } from '../lib/tripsoverview.js';
  import { stateExtra } from '../lib/tripstate.js';
  import { stateExtraText } from '../lib/tripstatetext.js';
  import TripState from '../lib/ui/TripState.svelte';
  import Profile from '../lib/ui/Profile.svelte'; // HP4
  import StateChips from '../lib/ui/StateChips.svelte';
  import Btn from '../lib/ui/Btn.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { overviewCounts, weatherWindow, packBand, tileRows, rideBand, PACK_HREF } from '../lib/touren.js';
  import { homeForecast } from '../lib/home-weather.js';
  import { HOME_PLACE } from '../lib/know.js';
  import { switchTrip, openNew, openTrip, newTrip } from '../lib/nav.js';
  import KomootSign from '../lib/komoot/KomootSign.svelte'; // SN1d (answer 3b)
  import { TEMPLATES_KEY, templateUse } from '../lib/templates.js';
  import { riddenTrips } from '../lib/trips.js';
  import { planAgain } from '../lib/trip/ending.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn, num, locale } from '../lib/i18n.svelte.js';
  import Help from '../lib/ui/Help.svelte';
  import { FIELD_HELP } from '../lib/daumen.js'; // FE14
  import { Plus, ChevronRight, ChevronDown, Route, Upload, Flag, Star, SlidersHorizontal, Bookmark, X, Zap, ZapOff, Info, Calendar, Backpack, Search, Activity } from '@lucide/svelte';
  // SN4g: the rows, their values and the filters
  import { loadReview } from '../lib/review/load.js';
  import { tripFacts, periodOf } from '../lib/review/rueckblick.js';
  import { factStates, factCounts, matchesState } from '../lib/review/state.js';
  import { homeTrips, testTrips } from '../lib/home/heute.js';
  import TestDataSheet from '../lib/testdata/TestDataSheet.svelte';
  import { loadPastActs, zonesOf, zoneValues } from '../lib/review/actdata.js';
  import { rowValues, linesOf, routeMap } from '../lib/review/inzahlen.js';
  import { TOUR_VIEW_KEY, TOUR_GROUP_KEYS } from '../lib/review/pastcols.js';
  import { tourViewOf, bikeOfRow } from '../lib/review/tourzahlen.js';
  import { n0, n1, hours, temps, dates, monthLong, rainText, DASH } from '../lib/review/fmt.js';
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
  import { phone } from '../lib/media.svelte.js';
  import { PHONE_ROWS, TOUR_ROWS, nextRows, shortLine, capGroups } from '../lib/touren/kurz.js';
  import { untrack } from 'svelte';
  import { ftpEstimate } from '../lib/training.js';
  import { zones } from '../lib/strava/zones.svelte.js';
  import { strava } from '../lib/strava/client.svelte.js';
  import '../lib/review/review.css';
  import '../lib/ui/daumen.css'; // FE1: the main action at the bottom on a phone
  import AreaIntro from '../lib/intro/AreaIntro.svelte';

  import OldTripsSports from '../lib/trip/OldTripsSports.svelte';
  import '../lib/sports.css';
  import { oldTripSuggestions, OLD_TRIPS_DONE, oldTripsLater } from '../lib/sports.js';

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
  // SA3 (Noah 14.10.2026 «SA1–SA3 freigegeben», «4b»): once, a sport for the old bike trips (sports.js).
  // A quiet band opens the window («nothing jumps by itself», app rules 14.10.2026); «Später» hides it
  // until the app is opened again, «Alle übernehmen» for good.
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const oldDoneQ = liveQuery(() => db.settings.get(OLD_TRIPS_DONE).then((r) => r ?? null));
  let oldLater = $state(oldTripsLater.v);
  const oldRows = $derived(loaded && $bikesQ && $oldDoneQ !== undefined && !$oldDoneQ?.value && !oldLater ? oldTripSuggestions($tripsQ, $bikesQ) : []);
  // the rows are fixed while the window is open (a trip saved meanwhile does not move them)
  let shownRows = $state(null);
  const rides = $derived($ridesQ ?? []);
  // 0.161.0 (Bugfixes 0.132.2 B1, Noah 1b + H3a): trips with the «Test trip» switch count nowhere, as on Today
  const view = $derived(loaded ? tripsOverview(homeTrips($tripsQ), $debriefsQ, today, rides) : null);
  const hiddenTests = $derived(testTrips($tripsQ ?? []).length);
  let tidyOpen = $state(false);
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
  // Impeccable 18.10.2026 (Touren 1): while a trip is on the way the band shows it; the pack draft moves
  // to its row in «Geplant» (the pill «im Packmodus» there becomes the way into Packmodus)
  const ride = $derived(rideBand(plan, $tripsQ ?? [], today));
  const topBand = $derived(ride ?? band);
  const PLAN_SHORT = 3;
  // Paket D (Noah 18.10.2026 «1b»): on a phone «Schnell starten» is one line in the head of «Geplant» (where «New trip»
  // sits on a computer); a tap opens its buttons. So Touren stays within three phone screens (Handy kurz).
  let quickOpen = $state(false);
  const quickShown = $derived(!phone.matches || quickOpen);
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
  // 0.161.0 B1 (Noah 1b): no archived and no test trips, the same trips as Today and the Rückblick
  const facts = $derived($dataQ ? tripFacts({ ...$dataQ, trips: homeTrips($dataQ.trips), today }) : []);
  const states = $derived($dataQ ? factStates(facts, { debriefs: $dataQ.debriefs, rides: $dataQ.rides, today }) : {});
  const bikes = $derived($dataQ?.bikes ?? []);
  const bikeName = $derived(Object.fromEntries(bikes.map((b) => [b.id, b.name])));
  // SN4g: wire to training.js when the Training PR lands (the activities: power, NP, moving and elapsed time)
  const moreQ = liveQuery(async () => {
    const [acts, entries, zones] = await Promise.all([loadPastActs(db), db.kmBook.toArray(), zoneValues(db)]);
    return { acts, entries, zones: zonesOf(zones, entries, acts) };
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
  /* ---- 0.163.0 «Handy kurz»: five rows first on a phone, the values as one grey line ---- */
  let doneAll = $state(false);
  let extrasOpen = $state(false);
  let packOpen = $state(false);
  const shortDone = $derived(phone.matches && !doneAll);
  // Tempo (Noah 19.10.2026 «3a»): 20 rows first on every screen, «Show n more» adds 20 at a time; a new
  // filter or period starts at 20 again. Before, every trip and ride was drawn at once.
  let tourLimit = $state(TOUR_ROWS);
  $effect(() => {
    void [JSON.stringify(filter), st, mode];
    untrack(() => (tourLimit = TOUR_ROWS));
  });
  const cap = $derived(shortDone ? PHONE_ROWS : tourLimit);
  const shownGroups = $derived(rows.length > cap ? capGroups(groups, cap) : groups);
  const moreN = $derived(rows.length > cap ? nextRows(rows.length, cap) : 0);
  const showMore = () => {
    tourLimit = cap + moreN;
    doneAll = true;
  };
  const KIND_NAME = Object.fromEntries(KINDS.map((k) => [k.key, k.name]));
  const what = (r) => (r.kind === 'ride' ? t(KIND_NAME.ride) : r.days > 1 ? tn(r.days, '{n} day', '{n} days') : t(KIND_NAME[kindOf(r)] ?? 'Day ride|art'));
  const rowBike = (r) => r.bike ?? bikeName[vals[r.id]?.bikeId] ?? null;
  const openRow = (r) => r.trip && openTrip(r.trip.id);
  // «Bewerten» opens the trip's Rückblick; an uploaded ride on its own opens its short one («Kurz bewerten»)
  const rateHref = (r) => (r.kind === 'ride' ? r.href : `#/debrief/${encodeURIComponent(r.id)}`);
  const secs = (s) => hours(s ? s / 3600 : null);
  const hasRide = (v) => !!v && [v.movingS, v.elapsedS, v.kmh, v.hrAvg, v.hrMax].some((x) => x != null);
  const tempOf = (r, v) => (r.tmin != null || r.tmax != null ? temps(r.tmin, r.tmax) : v?.tempAvg != null ? `${v.tempAvg}°` : DASH);
  /** 0.163.0 (2b, Noah «mit weiteren sinnvollen Werten»): the grey line of a Packmodus row, the empty values left out. */
  const lineOf = (r) => {
    const v = vals[r.id];
    return shortLine(
      [
        [t('Moving time|col'), v ? secs(v.movingS) : DASH, ''],
        [t('Elapsed|col'), v ? secs(v.elapsedS) : DASH, ''],
        [t('Ø pace'), v ? n1(v.kmh) : DASH, 'km/h'],
        [t('Ø heart rate'), v ? n0(v.hrAvg) : DASH, t('bpm')],
        [t('Max. heart rate'), v ? n0(v.hrMax) : DASH, t('bpm')],
        [t('Ø power'), v?.watts ? n0(v.wAvg) : DASH, 'W'],
        [t('NP'), v?.watts ? n0(v.wNorm) : DASH, 'W'],
        [t('Weather'), rainText(r.rain, r.days), ''],
        [t('Temp.'), tempOf(r, v), ''],
      ],
      DASH,
    );
  };
  // Impeccable 18.10.2026 (Touren 2): «Keine Fahrt verknüpft» once above the list instead of in every card
  const noRide = $derived($moreQ ? rows.filter((r) => !hasRide(vals[r.id])).length : 0);

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
  const periodWords = $derived(mode === '12m' ? t('in 12 months') : mode === 'year' ? t('in {year}', { year }) : t('since the start'));
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

{#snippet cell(label, value, unit = '', help = '')}
  <!-- FE14: a difficult value explains itself with a «?» (one sentence, in place) -->
  <div class="vc"><dt>{label}{#if help}<Help {label} text={t(FIELD_HELP[help])} />{/if}</dt><dd class="num">{value}{#if unit && value !== DASH}{' '}<small>{unit}</small>{/if}</dd></div>
{/snippet}

{#snippet values(r)}
  {@const v = vals[r.id]}
  {@const ride = hasRide(v)}
  {@const tempText = tempOf(r, v)}
  <div class="vals" data-values>
    <dl class="vg">
      {#if ride}
        {@render cell(t('Moving time|col'), secs(v.movingS))}
        {@render cell(t('Elapsed|col'), secs(v.elapsedS))}
        {@render cell(t('Ø pace'), n1(v.kmh), 'km/h')}
        {@render cell(t('Ø heart rate'), n0(v.hrAvg), t('bpm'))}
        {@render cell(t('Max. heart rate'), n0(v.hrMax), t('bpm'))}
      {/if}
      {@render cell(t('Weather'), rainText(r.rain, r.days))}
      {@render cell(t('Temp.'), tempText)}
    </dl>
    {#if v?.watts}
      <div class="pw" data-power>
        <span class="pwh"><Zap size={15} aria-hidden="true" />{t('Power')}</span>
        <dl class="vg">
          {@render cell(t('Ø power'), n0(v.wAvg), 'W')}
          {@render cell(t('Max. power'), n0(v.wMax), 'W')}
          {@render cell(t('NP'), n0(v.wNorm), 'W')}
        </dl>
      </div>
    {:else if ride}
      <!-- Impeccable Touren 2: «ohne Wattwerte» only where a ride could have them; «Keine Fahrt verknüpft» is said once above the list -->
      <p class="nw" data-no-power><ZapOff size={15} aria-hidden="true" /><span>{[t('without power values'), v.hrAvg == null ? t('No heart rate.') : ''].filter(Boolean).join(' · ')}</span></p>
    {/if}
    {@render packInfo(r)}
  </div>
{/snippet}

{#snippet packInfo(r)}
  <!-- AT1: below the values of a Packmodus row: the things packed and the Strava activity of the trip -->
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
      <!-- 0.161.0 B1 (Noah 2a): completed and rated count the chosen period, as the chips, and say which -->
      {#if counts}<p class="cnt num" data-counts>{[tn(counts.plan, '{n} planned', '{n} planned'), `${periodWords}: ${tn(stCounts.done, '{n} completed', '{n} completed')}`, tn(stCounts.rated, '{n} rated', '{n} rated')].join(' · ')}</p>{/if}
      {#if hiddenTests}<p class="cnt tests" data-hidden-tests>{tn(hiddenTests, '{n} test trip hidden', '{n} test trips hidden')} · <button type="button" class="btn btn-link" onclick={() => (tidyOpen = true)}>{t('Clean up test data')}</button></p>{/if}
    </div>
    <!-- Paket D (Noah 19.10.2026 «1a»): on a phone the folded «Was hier steht ›» sits in the head beside «Fahrt hochladen» -->
    <div class="ph-acts">
      {#if phone.matches && view && !view.empty}<HintCard page="trips" foldedOnPhone only="line" />{/if}
      <Btn icon={Upload} label={t('Upload ride')} href="#/debrief/ride" />
    </div>
  </header>
  {#if oldRows.length}
    <button type="button" class="sa-band" onclick={() => (shownRows = oldRows)}>
      <span class="sa-bt"><b>{t('New: every trip has a sport')}</b><small>{tn(oldRows.length, 'Choose one for {n} old bike trip', 'Choose one for {n} old bike trips')}</small></span>
      <ChevronRight size={18} aria-hidden="true" />
    </button>
  {/if}
  {#if view}
    {#if view.empty}
      <!-- Noah 19.10 «2a»: one card per page; the Einstieg lives in the card «Was hier steht» (its own card only while the page is empty) -->
      <AreaIntro place="touren" />
      <!-- v0.127.0 A-U2: the one empty building block -->
      <Empty icon={Route} title={t('No trips yet')} text={t('A trip is the packing list for one ride or journey.')} action={{ label: t('Create a trip|first'), onclick: () => openNew('list'), explain: t('Create the first trip') }}>
        {t('Best values come after your first ride with a GPX file.')} <a href="#/debrief/ride">{t('Upload a ride')}</a>
      </Empty>
    {:else}
      <!-- «Mehr Inhalt» (Noah 15.10.2026, 1a–5a): the tip of the day, at the end the fold and the examples -->
      <!-- Paket D (Noah 19.10.2026 «1a», Handy kurz): on a phone the card starts as its quiet line and the tip of the day
           waits behind the line «In Zahlen · Weiter» -->
      <HintCard page="trips" intro="touren" foldedOnPhone only={phone.matches ? 'card' : ''} />
      {#if !phone.matches}<TipLine page="trips" name={t('Trips|place')} />{/if}
      <!-- SN4g: the band «Packmodus» (answer 1b), a suggestion: «×» hides it, a quiet link brings it back -->
      {#if tours.band !== 'hidden'}
        <PackBand band={topBand} extra={!ride && bandRow ? extraOf(bandRow) : ''} onhide={() => saveTours({ band: 'hidden' })} />
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
            {#if phone.matches && (hasRidden || recentTpls.length)}<button type="button" class="btn btn-link qopen" aria-expanded={quickOpen} aria-controls="trips-quick" onclick={() => (quickOpen = !quickOpen)} data-quick-open>{t('Start quickly')}<ChevronDown size={16} aria-hidden="true" /></button>{/if}
          </div>
        </div>
        <!-- v0.143.0 WS3a (Release-Analyse F5, Noah 14.10.2026 «ws1-ws7 freigeben»), Paket 3 on the SN4g layout:
             «Schnell starten» right under the head of «Geplant», next to «New trip» -->
        {#if (hasRidden || recentTpls.length) && quickShown}
          <div class="quick" id="trips-quick" role="group" aria-label={t('Start quickly')} data-quick>
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
              {@const rt = r.kind === 'trip' ? byId[r.tripId]?.route : null}
              <li class="pc" data-trip={r.tripId}>
                <div class="pt">
                  {#if r.kind === 'replan'}<b class="pn">{r.title}</b>{:else}<a class="pn whole" href={r.go.href} onclick={(e) => (e.preventDefault(), go(r))} aria-label="{t(r.go.label)}: {r.title}">{r.title}</a>{/if}
                  <TripState state="plan" extra={extraOf(r)} />
                </div>
                <p class="ps">{r.kind === 'replan' ? `${day(r.date)} · ${t(r.state.label, r.state)}` : planLine(r)}</p>
                <!-- v0.151.0 HP4 (Noah «2a»): a planned trip with a route shows its small profile -->
                {#if rt?.profile?.length > 1}
                  <div class="mprof" data-plan-profile><Profile points={rt.profile} small label="Elevation of the route" /><p class="ms num">{[rt.km != null ? `${num(Math.round(rt.km))} km` : '', rt.gainM != null ? `↑ ${num(Math.round(rt.gainM))} Hm` : '', t('highest point {m} m', { m: num(Math.max(...rt.profile.map((x) => x[1]))) })].filter(Boolean).join(' · ')}</p></div>
                {/if}
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
                {#if bandRow?.tripId === r.tripId && !(phone.matches && tours.band !== 'hidden')}
                  {#if ride && ride.tripId !== r.tripId}
                    <a class="inpm go-pm" href={PACK_HREF} onclick={(e) => (e.preventDefault(), switchTrip(r.tripId, PACK_HREF))} data-in-pack-mode><Backpack size={13} aria-hidden="true" />{t('in pack mode')} · {t('Open pack mode')}<ChevronRight size={13} aria-hidden="true" /></a>
                  {:else}
                    <span class="inpm" data-in-pack-mode><Backpack size={13} aria-hidden="true" />{t('in pack mode')}</span>
                  {/if}
                {/if}
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
      {#if phone.matches && !packOpen}
        <!-- 0.163.0: on a phone the Packmodus is one line with its count and what waits for a rating -->
        <button type="button" class="phone-more extras" aria-expanded="false" onclick={() => (packOpen = true)} data-packmode-open><Backpack size={16} aria-hidden="true" /><span><b>{t('Pack mode|section')}</b><small class="num">{[tn(inPeriod.length, '{n} trip', '{n} trips'), stCounts.done ? tn(stCounts.done, '{n} to rate', '{n} to rate') : ''].filter(Boolean).join(' · ')}</small></span><ChevronRight size={16} aria-hidden="true" /></button>
      {:else}
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
          <!-- Impeccable Touren 2: what is missing, said once; the «?» of the values explained here once -->
          <div class="vhead" data-values-head>
            {#if noRide}<p class="vmiss" data-no-ride><Info size={16} aria-hidden="true" /><span>{t('For {n} of {all} trips, times, pace and heart rate are missing because no ride is linked.', { n: num(noRide), all: num(rows.length) })} <a href="#/debrief/ride">{t('Upload ride')}<ChevronRight size={14} aria-hidden="true" /></a></span></p>{/if}
            {#if rows.length > noRide}
              <div class="vq" data-values-help>
                <span>{t('Moving time|col')}<Help label={t('Moving time|col')} text={t(FIELD_HELP.moving)} /></span>
                <span>{t('Elapsed|col')}<Help label={t('Elapsed|col')} text={t(FIELD_HELP.elapsed)} /></span>
                {#if rows.some((r) => vals[r.id]?.watts)}<span>{t('NP')}<Help label={t('NP')} text={t(FIELD_HELP.np)} /></span>{/if}
              </div>
            {/if}
          </div>
          <div class="list" data-trip-list>
            {#each shownGroups as g (g.month)}
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
                      {#if !linesOf(r).length && !phone.matches}<p class="nr"><Info size={14} aria-hidden="true" />{t('without a route')}</p>{/if}
                    </div>
                    <div class="rk num"><span><b>{n0(r.km)}</b><small>km</small></span><span><b>{n0(r.gainM)}</b><small>{t('Hm|col')}</small></span></div>
                    {#if s?.state === 'done'}
                      <div class="rr"><Btn label={r.kind === 'ride' ? t('Rate briefly') : t('Rate|debrief')} href={rateHref(r)} onclick={() => openRow(r)} aria="{r.kind === 'ride' ? t('Rate briefly') : t('Rate|debrief')}: {r.title}" data-rate={r.id} /></div>
                    {/if}
                    <span class="chev" aria-hidden="true"><ChevronRight size={18} /></span>
                    {#if phone.matches}
                      <!-- 0.163.0 (2b): one grey line; the rest after a tap on the trip -->
                      {@const line = lineOf(r)}
                      {#if line}<p class="pline num" data-pack-line>{line}</p>{/if}
                    {:else}
                      {@render values(r)}
                    {/if}
                  </li>
                {/each}
              </ul>
            {/each}
          </div>
          {#if moreN}
            <button type="button" class="phone-more" onclick={showMore} data-pack-phone-more><ChevronDown size={16} aria-hidden="true" />{tn(moreN, 'Show {n} more trip', 'Show {n} more trips')}</button>
          {/if}
          <ul class="legend hide-phone" aria-label={t('What the colours mean')}>
            <li><i class="lg rated"></i>{t('highlighted: with a Rückblick (Rated)')}</li>
            <li><i class="lg done"></i>{t('grey: no Rückblick yet (Completed), a tap opens it anyway')}</li>
          </ul>
          <p class="rv-note hint hide-phone"><Info size={16} aria-hidden="true" /><span>{t('Times, pace, heart rate and power come from Strava; without Strava the times come from the uploaded ride. Weather and temp. from the forecast saved with the trip. Without a value it says «–». Only to look at, no rating.')}</span></p>
        {/if}
      </section>
      {/if}

      {#if phone.matches && !extrasOpen && $dataQ && facts.length}
        <!-- 0.163.0: on a phone «In Zahlen» and «Weiter» wait behind one line -->
        <button type="button" class="phone-more extras" aria-expanded="false" onclick={() => (extrasOpen = true)} data-trips-extras><span><b>{t('In numbers')} · {t('More|tiles')}</b><small>{t('Totals, records, weather, map')}</small></span><ChevronRight size={16} aria-hidden="true" /></button>
      {:else}
      {#if phone.matches}<TipLine page="trips" name={t('Trips|place')} />{/if}
      {#if $dataQ && facts.length}
        <InZahlen tours {rows} {facts} {vals} {mode} {today} {scope} {states} {bikes} items={$dataQ.items} containers={$dataQ.containers} entries={$moreQ?.entries ?? []} view={izView} onview={saveIz} hrefOf={(id) => facts.find((x) => x.id === id)?.href ?? null} go={(id) => openRow(facts.find((x) => x.id === id) ?? {})} />
      {/if}

      <PageMore page="trips" name={t('Trips|place')} />
      <TourTiles {wx} open={tileData.open} {map} filtered={filtered ? filterWords : ''} go={openRow} {rateHref} extraOf={tileExtra} chips={activeRow} />
      {/if}
    {/if}
  {:else}
    <!-- v0.127.0 A-U2: a calm placeholder while the trips load -->
    <Skeleton rows={4} />
  {/if}
</div>
{#if shownRows}
  <OldTripsSports rows={shownRows} bikes={$bikesQ ?? []} onclose={(later) => ((shownRows = null), later && ((oldLater = true), (oldTripsLater.v = true)))} />
{/if}

{#if tidyOpen}<TestDataSheet onclose={() => (tidyOpen = false)} />{/if}
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
  .ph-acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .ph .title {
    margin: 0;
  }
  .cnt {
    margin: var(--sp-1) 0 0;
    color: var(--ink-2);
    font: 400 var(--fs-body) / 1.45 var(--font-body);
  }
  .cnt.tests {
    font-size: var(--fs-small);
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
    /* Durchklick DK7a: a long trip name without spaces wraps instead of widening the page */
    grid-template-columns: minmax(0, 1fr);
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
    min-width: 0;
  }
  .pn {
    min-width: 0;
    max-width: 100%;
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
  /* Touren 1: with a trip on the way the pill is the way into Packmodus (above the card's own link) */
  a.go-pm {
    position: relative;
    z-index: 1;
    min-height: 44px;
    padding: 0 12px;
    font-size: var(--fs-small);
    text-decoration: none;
  }
  /* Touren 2: the line above the list */
  .vhead {
    display: grid;
    gap: 4px;
    margin: 0 0 var(--sp-3);
  }
  .vmiss {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .vmiss :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .vmiss a {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    white-space: nowrap;
  }
  /* a 44 px tap area around the link, without pushing the line apart */
  .vmiss a::after {
    content: '';
    position: absolute;
    inset: -12px -4px;
  }
  .vq {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 2px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  /* the open sentence of a «?» takes its own line under the three words */
  .vq > span {
    display: contents;
  }
  .vq :global(.q) {
    margin-right: 14px;
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
    min-width: 0;
  }
  .rn {
    min-width: 0;
    max-width: 100%;
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
  .vals {
    grid-area: vals;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 20px;
    min-width: 0;
  }
  .vg {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 20px;
    margin: 0;
  }
  .vc {
    display: grid;
    min-width: 64px;
  }
  .vc dt {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  /* FE14: the «?» of a value stays small; its sentence opens over the row, the full width of the values */
  .vg {
    position: relative;
  }
  .vc dt :global(.q) {
    z-index: 1; /* above the link of the whole row */
    width: 20px;
    height: 20px;
    font-size: var(--fs-tiny);
  }
  .vc dt :global(.help) {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 3;
    box-shadow: 0 6px 18px var(--shadow);
  }
  .vc dd {
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .vc dd small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-weight: 400;
  }
  .pw {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 20px;
    padding-left: 16px;
    border-left: 1px solid var(--line-strong);
  }
  .pwh,
  .nw {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .nw {
    color: var(--ink-3);
  }
  .nw :global(svg) {
    flex: none;
  }
  /* AT1: below the values of a Packmodus row, a line of its own */
  .pinfo {
    flex-basis: 100%;
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
  .hint {
    margin-top: var(--sp-3);
  }
  /* 0.163.0 «Handy kurz»: the grey line of a row, «Show n more» and the one line for the extras */
  .pline {
    grid-area: vals;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .phone-more {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    min-height: 44px;
    margin: var(--sp-2) 0 0;
    padding: 10px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-body) / 1.3 var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  .phone-more.extras {
    margin: var(--sp-4) 0 0;
  }
  .phone-more.extras span {
    display: grid;
    flex: 1;
    gap: 2px;
  }
  .phone-more.extras span {
    min-width: 0;
  }
  .phone-more.extras small {
    color: var(--ink-2);
    font-weight: 400;
    font-size: var(--fs-small);
    /* Paket Q (Noah 19.10.2026 «1a aber bitte in zukunft lösen»): the grey line is shown whole again and
       wraps when it must; its text is short enough for one line on a phone, so Touren stays within three
       screens (handy-kurz) */
  }
  @media (max-width: 719px) {
    .hide-phone {
      display: none;
    }
    /* 0.163.0: the state chips in one line that scrolls sideways */
    .tools :global(.stchips) {
      order: 3;
      flex-wrap: nowrap;
      width: 100%;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .tools :global(.stchips .sc) {
      flex: none;
    }
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
    .vals {
      display: grid;
      gap: 8px;
      padding: 10px 12px;
      border-radius: var(--r-ctl);
      background: var(--paper);
    }
    .vg {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
    }
    .vc {
      min-width: 0;
    }
    .pw {
      display: grid;
      gap: 6px;
      padding: 8px 0 0;
      border-left: 0;
      border-top: 1px solid var(--line);
    }
    .pinfo {
      padding-top: 8px;
      border-top: 1px solid var(--line);
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
  /* Paket D «1b»: on a phone «Schnell starten» sits on the right of the head of «Geplant» (it wraps below on a very narrow phone) */
  @media (max-width: 599px) {
    .sh {
      align-items: center;
    }
    .qopen {
      flex: none;
      min-height: 44px;
    }
    .qopen[aria-expanded='true'] :global(svg) {
      transform: rotate(180deg);
    }
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
  .mprof {
    margin: 2px 0 8px;
  }
  .mprof .ms {
    margin: 4px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
</style>
