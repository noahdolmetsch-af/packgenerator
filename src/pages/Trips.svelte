<script>
  /**
   * v0.46.1 (Noah: «Touren» opened the last trip at Packen): #/trips, the calm overview of all trips
   * behind «Touren». #/pack and #/pack?… still open a trip directly.
   * v0.78.0 «Fünf Orte» 2 / «Übergänge 2» (Noah T1–T20 a, U1–U5 a, mockup uebergaenge2/touren): the
   * Touren page proper: «Weitermachen», the trips as tiles grouped by state (tripsoverview.js), each with
   * the drawing of its route and one button named by its next step; a dashed tile starts a new trip.
   * v0.88.0 (Noah 0.88 5a): a trip ended before its start date gets «Wieder planen» (trip/ending.js).
   * v0.102.0 Design-Refresh P4 «Touren» (T1, approved 12.10.2026 «Touren T1–T6 freigegeben»): the new look.
   * Under the title one line with the counts; «Weitermachen» as a soft band (the page's one main action);
   * the tiles with a tinted route, a small sign («in 5 Tagen», «Rückblick offen») and the packing bar;
   * on the side the «Wetter-Fenster» (the next 7 days at home, the best days framed) and the best values
   * as a list with «Alle» for the period and the averages. The four steps and the template tiles are gone
   * from here (the steps are on every trip, the templates have their own tab).
   * v0.126.0 TZ-1 «Zustand sichtbar» (Noah 13.10.2026 «1-5 a», mockup TZ1): the groups are the three trip
   * states (tripstate.js): Geplant, Abgeschlossen, Bewertet. Filter chips «Alle · Geplant · Abgeschlossen ·
   * Bewertet» with their numbers, the state pill on every tile (ui/TripState.svelte, icon + word + extra),
   * the tile's map in the state's colour, and the legend «Drei Zustände» (on the side; on a phone folded
   * under the chips). Rules of TZ-2 (the list fixed, «Wieder öffnen», «Bist du gefahren?») come later.
   */
  import { liveQuery } from 'dexie';
  import Skeleton from '../lib/ui/Skeleton.svelte';
  import { db } from '../lib/db.js';
  import { tripsOverview, GROUPS } from '../lib/tripsoverview.js';
  import { STATE_NAMES, STATE_HELP, stateExtra } from '../lib/tripstate.js';
  import { stateExtraText } from '../lib/tripstatetext.js';
  import TripState from '../lib/ui/TripState.svelte';
  import { routeOf, routePath, bestValues, PERIODS, hmm } from '../lib/tripsboard.js';
  import { overviewCounts, weatherWindow } from '../lib/touren.js';
  import { homeForecast } from '../lib/home-weather.js';
  import { HOME_PLACE } from '../lib/know.js';
  import { switchTrip, openNew } from '../lib/nav.js';
  import { planAgain } from '../lib/trip/ending.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn, num, locale } from '../lib/i18n.svelte.js';
  import Continue from '../lib/home/Continue.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import PlaceIcon from '../lib/nav/PlaceIcon.svelte';
  import HomePlaceForm from '../lib/know/HomePlaceForm.svelte';
  import { Plus, ChevronRight, Route, Trophy, Upload, Sun, CloudSun, CloudRain, MapPin, Pencil, Flag, Star } from '@lucide/svelte';

  const tripsQ = liveQuery(() => db.trips.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const ridesQ = liveQuery(() => db.rides.toArray());
  const kmQ = liveQuery(() => db.kmBook.toArray());
  const placeQ = liveQuery(() => db.settings.get(HOME_PLACE));
  const loaded = $derived(!!$tripsQ && !!$debriefsQ);
  const today = localDay();
  const rides = $derived($ridesQ ?? []);
  const view = $derived(loaded ? tripsOverview($tripsQ, $debriefsQ, today, rides) : null);
  const counts = $derived(overviewCounts(view));
  // v0.126.0 TZ-1: the filter chips (all, or one state); kept while the page is open
  let filter = $state('all');
  const GICON = { plan: Pencil, done: Flag, rated: Star };
  const debriefOf = $derived(Object.fromEntries(($debriefsQ ?? []).map((d) => [d.tripId, d])));
  const extraOf = (r) => stateExtraText(stateExtra(r.tstate, { trip: byId[r.tripId], debrief: debriefOf[r.tripId] ?? null, today }));
  const byId = $derived(Object.fromEntries(($tripsQ ?? []).map((x) => [x.id, x])));
  const routes = $derived(Object.fromEntries(($tripsQ ?? []).map((x) => [x.id, routeOf(x, rides)])));

  // The best values: this season by default; the choice is kept on this device.
  const PERIOD_KEY = 'trips.period';
  let period = $state(readPeriod());
  function readPeriod() {
    try {
      return localStorage.getItem(PERIOD_KEY) || 'season';
    } catch {
      return 'season';
    }
  }
  function pickPeriod(k) {
    period = k;
    try {
      localStorage.setItem(PERIOD_KEY, k);
    } catch {
      /* private mode */
    }
  }
  const best = $derived(loaded ? bestValues({ trips: $tripsQ, rides, kmBook: $kmQ ?? [], today, period }) : null);
  const hasHeart = $derived(!!best?.avg.some((a) => a.n && a.hrAvg));
  const periodName = $derived(t(PERIODS.find((p) => p.key === period)?.name ?? 'This season'));
  let allOpen = $state(false);

  // The weather window: the saved home forecast (fetched at most every 3 hours, home-weather.js).
  let forecast = $state(null);
  let wxTried = $state(false);
  let placeOpen = $state(false);
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
    // again when the home place is set or changed
    void $placeQ;
    loadWx();
  });
  const wxw = $derived(weatherWindow(forecast, today));
  const wd = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' }).replace('.', '');
  const bestText = $derived(wxw?.best.length ? wxw.best.map(wd).join(` ${t('and')} `) : '');

  const thisYear = String(new Date().getFullYear());
  const day = (iso) => {
    if (!iso) return t('No date set');
    const y = iso.slice(0, 4) !== thisYear ? { year: 'numeric' } : {};
    return new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', ...y });
  };
  const tripDays = (id) => Math.max(1, Number(byId[id]?.days) || 1);
  const line = (r, km = false) => [day(r.date), tn(tripDays(r.tripId), '{n} day', '{n} days'), r.bike, km && typeof r.km === 'number' ? `${num(r.km)} km` : ''].filter(Boolean).join(' · ');
  const go = (r) => switchTrip(r.tripId, r.go.href);
  const pct = (s) => (s?.total ? Math.round((100 * (s.done ?? 0)) / s.total) : null);
  const total = (k) => (k === 'plan' ? view.plan.length : k === 'done' ? view.doneTotal : view.ratedTotal);
  const ALL = { done: ['All {n} completed trips', 'All {n} completed trips'], rated: ['All {n} rated trips', 'All {n} rated trips'] };
</script>

{#snippet map(r)}
  {@const rt = routes[r.tripId]}
  {@const p = rt ? routePath(rt.line, 260, 96) : null}
  <div class="map st-{r.tstate.state}" class:none={!p}>
    {#if p}
      <svg viewBox="0 0 260 96" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path class="rt" d={p.d} /><circle class="end" cx={p.end[0]} cy={p.end[1]} r="4.5" /></svg>
    {:else}
      <span class="nomap" aria-hidden="true"><PlaceIcon place="trips" size={24} /></span>
    {/if}
    <span class="sign"><TripState state={r.tstate.state} extra={extraOf(r)} /></span>
  </div>
{/snippet}

{#snippet legend()}
  <ul class="lg">
    {#each GROUPS as g (g.key)}
      <li><TripState state={g.key} /><span>{t(STATE_HELP[g.key])}</span></li>
    {/each}
  </ul>
{/snippet}

{#snippet group(g)}
  {@const Icon = GICON[g.key]}
  <section class="grp" aria-labelledby="trips-{g.key}" data-group={g.key}>
    <h2 class="gh st-{g.key}" id="trips-{g.key}"><Icon size={15} fill={g.key === 'rated' ? 'currentColor' : 'none'} aria-hidden="true" /><span>{t(STATE_NAMES[g.key])}</span><span class="n num">{total(g.key)}</span></h2>
    <ul class="tiles">
      {#each view[g.key] as r (r.id)}
        {#if r.kind === 'past'}
          <li class="tile" data-trip={r.tripId}>
            <a class="whole" href={r.go.href} onclick={(e) => (e.preventDefault(), go(r))} aria-label="{t(r.go.label)}: {r.title}">
              {@render map(r)}
              <span class="body"><span class="tt">{r.title}</span><span class="s">{line(r, true)}</span></span>
            </a>
          </li>
        {:else}
          {@const p = r.kind === 'trip' || r.kind === 'ride' ? pct(r.state) : null}
          <li class="tile" data-trip={r.tripId}>
            {@render map(r)}
            <div class="body">
              <h3 class="tt">{r.title}</h3>
              <p class="s">{r.kind === 'replan' ? `${day(r.date)} · ${t(r.state.label, r.state)}` : line(r)}</p>
              {#if p != null}<span class="bar" role="img" aria-label={t('{done} of {n} packed', { done: r.state.done ?? 0, n: r.state.total })}><i style:width="{p}%"></i></span>
              {:else if r.kind === 'trip' || r.kind === 'ride'}<p class="st">{t(r.state.label, r.state)}</p>{/if}
              {#if r.kind === 'replan'}
                <button type="button" class="btn go" onclick={() => planAgain(byId[r.tripId])} aria-label="{t(r.go.label)}: {r.title}">{t(r.go.label)}</button>
              {:else}
                <a class="btn go" href={r.go.href} onclick={(e) => (e.preventDefault(), go(r))} aria-label="{t(r.go.label)}: {r.title}">{t(r.go.label)}</a>
              {/if}
            </div>
          </li>
        {/if}
      {/each}
      {#if g.key === 'plan'}
        <li class="tile add"><button type="button" class="addb" onclick={() => openNew('list')}><Plus size={22} aria-hidden="true" /><b>{t('New trip')}</b><small>{t('or from a template')}</small></button></li>
      {/if}
    </ul>
    {#if ALL[g.key] && total(g.key) > view[g.key].length}<a class="all" href="#/pack/past">{tn(total(g.key), ...ALL[g.key])}<ChevronRight size={16} aria-hidden="true" /></a>{/if}
  </section>
{/snippet}

<div class="trips">
  <header class="ph">
    <h1 class="title">{t('Trips|place')}</h1>
    {#if counts}<p class="cnt num">{[tn(counts.plan, '{n} planned', '{n} planned'), tn(counts.done, '{n} completed', '{n} completed'), tn(counts.rated, '{n} rated', '{n} rated')].join(' · ')}</p>{/if}
  </header>
  {#if view}
    {#if view.empty}
      <!-- v0.127.0 A-U2: the one empty building block -->
      <Empty icon={Route} title={t('No trips yet')} text={t('A trip is the packing list for one ride or journey.')} action={{ label: t('Create a trip|first'), onclick: () => openNew('list'), explain: t('Create the first trip') }}>
        {t('Best values come after your first ride with a GPX file.')} <a href="#/debrief/ride">{t('Upload a ride')}</a>
      </Empty>
    {:else}
      <div class="fchips" role="group" aria-label={t('Show trips')}>
        <button type="button" class="fc all-c" aria-pressed={filter === 'all'} onclick={() => (filter = 'all')}>{t('All|trips')}<span class="num">{counts.all}</span></button>
        {#each GROUPS as g (g.key)}
          {@const Icon = GICON[g.key]}
          <button type="button" class="fc st-{g.key}" aria-pressed={filter === g.key} onclick={() => (filter = filter === g.key ? 'all' : g.key)}><Icon size={14} fill={g.key === 'rated' ? 'currentColor' : 'none'} aria-hidden="true" />{t(STATE_NAMES[g.key])}<span class="num">{counts[g.key]}</span></button>
        {/each}
      </div>
      <details class="lgfold">
        <summary>{t('What do the three states mean?')}</summary>
        {@render legend()}
      </details>
      <Continue trips={$tripsQ ?? []} debriefs={$debriefsQ ?? []} {rides} {today} hour={new Date().getHours()} banner />
      <div class="cols">
        <div class="groups">
          {#each GROUPS.filter((g) => filter === 'all' || filter === g.key) as g (g.key)}
            {#if view[g.key].length || g.key === 'plan'}
              {@render group(g)}
            {/if}
          {/each}
        </div>
        <aside class="side-col">
          <section class="sbox lgbox" aria-labelledby="lg-h">
            <div class="card">
              <h2 class="bh" id="lg-h">{t('Three states')}</h2>
              {@render legend()}
            </div>
          </section>
          <section class="sbox" aria-labelledby="wx-h">
            <h2 class="bh" id="wx-h">{t('Weather window')}</h2>
            <p class="bs">{t('best days for a trip · Open-Meteo')}</p>
            <div class="card wxc">
              {#if wxw}
                <ol class="wdays">
                  {#each wxw.days as d (d.date)}
                    {@const Icon = d.rain === 'rain' ? CloudRain : d.rain === 'showers' ? CloudSun : Sun}
                    <li class:wet={d.rain !== 'none'} class:best={d.best}><b>{wd(d.date)}</b><Icon size={16} aria-hidden="true" /><span class="num">{d.max}°</span></li>
                  {/each}
                </ol>
                <p class="wl">{#if bestText}<b>{t('Best days: {days}', { days: bestText })}</b> · {t('dry')}{:else}{t('No dry day in sight.')}{/if}</p>
              {:else if !wxTried}
                <p class="quiet">{t('Loading…')}</p>
              {:else if !$placeQ?.value}
                <p class="quiet">{t('Set your home place, then the best days for a ride show here.')}</p>
                {#if placeOpen}<HomePlaceForm onchosen={() => (placeOpen = false)} />{:else}<button type="button" class="btn" onclick={() => (placeOpen = true)}><MapPin size={16} aria-hidden="true" />{t('Set home place')}</button>{/if}
              {:else}
                <p class="quiet">{t('No forecast right now. It needs the internet once.')}</p>
              {/if}
            </div>
          </section>
          <section class="sbox" aria-labelledby="best-h">
            <div class="bhr">
              <div>
                <h2 class="bh" id="best-h">{t('Best values')}</h2>
                <p class="bs">{periodName}</p>
              </div>
              <button type="button" class="btn btn-link more" aria-expanded={allOpen} onclick={() => (allOpen = !allOpen)}>{t('All|best')}<ChevronRight size={16} aria-hidden="true" /></button>
            </div>
            <div class="card bestc">
              {#if best?.any}
                <ul class="brows">
                  {#if best.longest}<li><span class="ti" aria-hidden="true"><Trophy size={16} /></span><span class="bt"><b>{t('Longest trip')}</b><small>{best.longest.title}{best.longest.days > 1 ? ` · ${tn(best.longest.days, '{n} day', '{n} days')}` : ''}</small></span><span class="bv num">{num(best.longest.km)} km</span></li>{/if}
                  {#if best.climb}<li><span class="ti" aria-hidden="true"><Trophy size={16} /></span><span class="bt"><b>{t('Most climbing')}</b><small>{best.climb.title}</small></span><span class="bv num">{num(best.climb.m)} Hm</span></li>{/if}
                  {#if best.time}<li><span class="ti" aria-hidden="true"><Trophy size={16} /></span><span class="bt"><b>{t('Longest riding time')}</b><small>{best.time.totalH ? t('in one day · {h} h in all', { h: hmm(best.time.totalH) }) : best.time.title}</small></span><span class="bv num">{hmm(best.time.h)} h</span></li>{/if}
                  {#if best.furthest}<li><span class="ti" aria-hidden="true"><Trophy size={16} /></span><span class="bt"><b>{t('Furthest day')}</b><small>{best.furthest.title}</small></span><span class="bv num">{num(best.furthest.km)} km</span></li>{/if}
                </ul>
              {:else}
                <p class="quiet">{t('Best values come after your first ride with a GPX file.')}</p>
              {/if}
              {#if allOpen}
                <div class="allp">
                  <Seg small full={false} label={t('Period')} value={period} options={PERIODS.map((p) => ({ key: p.key, name: t(p.name) }))} onchange={pickPeriod} />
                  {#if best?.avg.some((a) => a.n)}
                    <h3 class="th">{t('Average per trip, from GPX')}</h3>
                    <table class="avg">
                      <thead><tr><th scope="col">{t('Kind|trip')}</th><th scope="col">km</th><th scope="col">Hm</th><th scope="col">{t('moving|col')}</th><th scope="col">{t('in all')}</th><th scope="col">{t('Stops')}</th>{#if hasHeart}<th scope="col">{t('Ø heart rate')}</th>{/if}</tr></thead>
                      <tbody>
                        {#each best.avg.filter((a) => a.n) as a (a.key)}
                          <tr><th scope="row">{t(a.name)}</th><td class="num">{num(a.km)}</td><td class="num">{num(a.gainM)}</td><td class="num">{hmm(a.movingH)}</td><td class="num">{hmm(a.totalH)}</td><td class="num">{a.stops}</td>{#if hasHeart}<td class="num">{a.hrAvg ?? '–'}</td>{/if}</tr>
                        {/each}
                      </tbody>
                    </table>
                  {/if}
                  {#if hasHeart}
                    <p class="quiet">{t('Heart rate in bpm from Strava. Only observation, no rating.')}</p>
                  {:else}
                    <p class="quiet">{t('Heart rate, zones and power come later with Strava. Only observation, no rating.')}</p>
                  {/if}
                </div>
              {/if}
              <a class="lk" href="#/debrief/ride"><Upload size={16} aria-hidden="true" />{t('Upload a ride')}</a>
            </div>
          </section>
        </aside>
      </div>
    {/if}
  {:else}
    <!-- v0.127.0 A-U2: a calm placeholder while the trips load -->
    <Skeleton rows={4} />
  {/if}
</div>

<style>
  .trips {
    max-width: 1240px;
    margin: 0 auto;
  }
  .ph {
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
  .cols {
    display: grid;
    gap: var(--sp-5);
    margin-top: var(--sp-4);
  }
  @media (min-width: 1100px) {
    .cols {
      grid-template-columns: minmax(0, 1fr) 400px;
      align-items: start;
    }
  }
  .groups {
    display: grid;
    gap: var(--sp-5);
    min-width: 0;
  }
  .grp {
    min-width: 0;
  }
  .gh {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    margin: 0 0 var(--sp-2);
    color: var(--ink-2);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .gh .n {
    padding: 0 var(--sp-2);
    border-radius: 999px;
    background: var(--paper-2);
    font: 600 var(--fs-tiny) / 1.6 var(--font-body);
    letter-spacing: 0;
  }
  .gh :global(svg) {
    flex: none;
  }
  .gh.st-plan {
    color: var(--st-plan);
  }
  .gh.st-done {
    color: var(--st-done);
  }
  .gh.st-rated {
    color: var(--st-rated);
  }
  /* v0.126.0 TZ-1: the filter chips «Alle · Geplant · Abgeschlossen · Bewertet» */
  .fchips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    margin: 0 0 var(--sp-3);
  }
  .fc {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 var(--sp-3);
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.2 var(--font-body);
    cursor: pointer;
  }
  .fc .num {
    color: var(--ink-2);
    font-weight: 400;
  }
  .fc.st-plan {
    border-color: color-mix(in srgb, var(--st-plan-line) 45%, transparent);
    background: var(--st-plan-soft);
    color: var(--st-plan);
  }
  .fc.st-done {
    border-color: color-mix(in srgb, var(--st-done-line) 45%, transparent);
    background: var(--st-done-soft);
    color: var(--st-done);
  }
  .fc.st-rated {
    border-color: color-mix(in srgb, var(--st-rated-line) 45%, transparent);
    background: var(--st-rated-soft);
    color: var(--st-rated);
  }
  .fc[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .fc[aria-pressed='true'] .num {
    color: var(--paper);
  }
  .fc:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  /* the legend: on the side of a computer, folded under the chips on a phone */
  .lg {
    display: grid;
    margin: var(--sp-2) 0 0;
    padding: 0;
    list-style: none;
  }
  .lg li {
    display: grid;
    justify-items: start;
    gap: var(--sp-1);
    padding: var(--sp-2) 0;
    border-top: 1px solid var(--line);
    color: var(--ink-2);
    font: 400 var(--fs-small) / 1.4 var(--font-body);
  }
  .lg li:first-child {
    border-top: 0;
  }
  .lgfold {
    margin: 0 0 var(--sp-3);
    padding: 0 var(--sp-3);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .lgfold summary {
    display: flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
    cursor: pointer;
  }
  .lgfold[open] {
    padding-bottom: var(--sp-2);
  }
  @media (min-width: 1100px) {
    .lgfold {
      display: none;
    }
  }
  @media (max-width: 1099px) {
    .lgbox {
      display: none;
    }
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: var(--sp-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  @media (max-width: 719px) {
    .tiles {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  /* v0.104.0 Design-Refresh P4 (T1): on a 320 px phone a tile is only 112 px wide and a long trip name
     breaks mid-word: there the tiles stand one under the other */
  @media (max-width: 359px) {
    .tiles {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .tile {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .map {
    position: relative;
    display: grid;
    place-items: center;
    height: 74px;
    /* the state pill sits at the top: the route or the icon below it */
    padding-top: 22px;
    box-sizing: border-box;
    background: var(--paper-2);
  }
  /* v0.126.0 TZ-1: the map in the colour of the trip's state, the route in its line colour */
  .map.st-plan {
    --st-l: var(--st-plan-line);
    background: var(--st-plan-soft);
  }
  .map.st-done {
    --st-l: var(--st-done-line);
    background: var(--st-done-soft);
  }
  .map.st-rated {
    --st-l: var(--st-rated-line);
    background: var(--st-rated-soft);
  }
  .map svg {
    width: 100%;
    height: 100%;
  }
  .rt {
    fill: none;
    stroke: var(--st-l, var(--hi));
    stroke-width: 3;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .end {
    fill: var(--ink);
    stroke: var(--paper);
    stroke-width: 1.5;
  }
  .nomap {
    color: var(--ink-3);
  }
  .sign {
    position: absolute;
    top: var(--sp-2);
    left: var(--sp-2);
    right: var(--sp-2);
    display: flex;
    min-width: 0;
  }
  .body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    padding: var(--sp-3) var(--sp-3) var(--sp-3);
    min-width: 0;
  }
  .body .tt {
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .body .s,
  .body .st {
    margin: 0;
    color: var(--ink-2);
    font: 400 var(--fs-small) / 1.4 var(--font-body);
    overflow-wrap: break-word;
  }
  .bar {
    display: block;
    height: 6px;
    margin: var(--sp-2) 0 0;
    border-radius: 3px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: 3px;
    background: var(--hi);
  }
  .go {
    align-self: flex-start;
    margin-top: auto;
    max-width: 100%;
  }
  .body .s + .go,
  .bar + .go,
  .st + .go {
    margin-top: var(--sp-3);
  }
  .whole {
    display: flex;
    flex-direction: column;
    height: 100%;
    color: var(--ink);
    text-decoration: none;
  }
  .whole:focus-visible {
    outline: var(--focus-ring);
    outline-offset: -3px;
  }
  .tile.add {
    border: 0;
    background: none;
    box-shadow: none;
  }
  .addb {
    display: grid;
    place-items: center;
    align-content: center;
    gap: var(--sp-1);
    min-height: 200px;
    height: 100%;
    padding: var(--sp-3);
    border: 2px dashed var(--line-strong);
    border-radius: var(--radius-card);
    background: none;
    color: var(--ink-2);
    font: 400 var(--fs-small) / 1.3 var(--font-body);
    cursor: pointer;
  }
  .addb b {
    color: var(--ink);
    font: 500 var(--fs-body) / 1.3 var(--font-body);
  }
  .all {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    margin-top: var(--sp-1);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
    text-decoration: none;
  }
  .side-col {
    display: grid;
    gap: var(--sp-5);
    min-width: 0;
  }
  .sbox {
    min-width: 0;
  }
  .bhr {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--sp-2);
  }
  .bh {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .bs {
    margin: 2px 0 var(--sp-2);
    color: var(--ink-2);
    font: 400 var(--fs-small) / 1.3 var(--font-body);
  }
  .more {
    margin-bottom: var(--sp-1);
    text-decoration: none;
  }
  .wxc,
  .bestc {
    display: grid;
    gap: var(--sp-3);
  }
  .wdays {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: var(--sp-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .wdays li {
    display: grid;
    justify-items: center;
    gap: 2px;
    min-width: 0;
    padding: var(--sp-2) 0;
    border: 2px solid transparent;
    border-radius: var(--r-ctl);
    background: var(--warn-soft);
    color: var(--ink-2);
    font: 400 var(--fs-tiny) / 1.3 var(--font-body);
  }
  .wdays li.wet {
    background: var(--info-soft);
  }
  .wdays li.best {
    border-color: var(--hi);
    background: var(--hi-soft);
  }
  .wdays b {
    color: var(--ink);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
  }
  .wl {
    margin: 0;
    color: var(--ink-2);
    font: 400 var(--fs-small) / 1.4 var(--font-body);
  }
  .wl b {
    color: var(--ink);
    font-weight: 600;
  }
  .brows {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .brows li {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-height: 52px;
    padding: var(--sp-2) 0;
    border-top: 1px solid var(--line);
  }
  .brows li:first-child {
    border-top: 0;
  }
  .ti {
    display: grid;
    flex: none;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--hi-soft);
    color: var(--hi);
  }
  .bt {
    display: grid;
    flex: 1;
    min-width: 0;
  }
  .bt b {
    font: 500 var(--fs-body) / 1.3 var(--font-body);
  }
  .bt small {
    color: var(--ink-2);
    font: 400 var(--fs-tiny) / 1.35 var(--font-body);
    overflow-wrap: break-word;
  }
  .bv {
    flex: none;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .allp {
    display: grid;
    gap: var(--sp-3);
    padding-top: var(--sp-3);
    border-top: 1px solid var(--line);
  }
  .th {
    margin: 0;
    color: var(--ink-2);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .avg {
    width: 100%;
    border-collapse: collapse;
    font: 400 var(--fs-small) / 1.3 var(--font-body);
  }
  .avg th,
  .avg td {
    padding: var(--sp-2) 2px;
    border-bottom: 1px solid var(--line);
    text-align: right;
  }
  .avg thead th {
    color: var(--ink-2);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
  }
  .avg th[scope='row'],
  .avg thead th:first-child {
    text-align: left;
    font-weight: 400;
  }
  .lk {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-1);
    justify-self: start;
    min-height: 44px;
    color: var(--ink);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
  }
  .quiet {
    margin: 0;
    color: var(--ink-2);
    font: 400 var(--fs-small) / 1.4 var(--font-body);
  }
</style>
