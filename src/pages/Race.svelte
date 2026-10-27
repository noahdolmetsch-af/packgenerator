<script>
  /**
   * Paket U «Bikepacking und Ultra-Rennen» (Noah 19.10.2026, ideas 1–40): Touren › Rennen (#/race).
   * The list of your races, a new race, and one race with its five parts (#/race/<tripId>/<part>).
   * A race is a trip; everything the race adds lives in the settings record 'races' (race.js).
   */
  import { Flag, Plus, ChevronRight, Info } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import Crumb from '../lib/flow/kit/Crumb.svelte';
  import LazyPage from '../lib/nav/LazyPage.svelte';
  import RaceSheet from '../lib/race/RaceSheet.svelte';
  import { db } from '../lib/db.js';
  import { newTrip } from '../lib/trips.js';
  import { racesQuery, saveRace } from '../lib/race/store.js';
  import { raceTrips, countdown } from '../lib/race/race.js';
  import { raceRoute, raceHref } from '../lib/race/parts.js';
  import { makeSample, SAMPLE_ID } from '../lib/race/sample.js';
  import { putRace } from '../lib/race/store.js';
  import { startTour } from '../lib/tour/run.js';
  import { homeTrips } from '../lib/home/heute.js';
  import { localDay } from '../lib/localday.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import '../lib/race/race.css';

  let { hash = '' } = $props();
  const DETAIL = () => import('../lib/race/RaceDetail.svelte');
  const where = $derived(raceRoute(hash));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const racesQ = racesQuery();
  const today = localDay();
  const list = $derived(raceTrips(homeTrips($tripsQ ?? []), $racesQ ?? {}, today));
  const others = $derived(homeTrips($tripsQ ?? []).filter((x) => !list.coming.includes(x) && !list.past.includes(x) && !x.skipped));
  let info = $state(false);

  let draft = $state(null); // { title, startDate, days, bikeId }
  let pick = $state('');
  const openNew = () => (draft = { title: '', startDate: '', days: 7, bikeId: ($bikesQ ?? [])[0]?.id ?? '' });
  async function create() {
    const title = draft.title.trim();
    if (!title) return t('Please give the race a name.');
    const bike = ($bikesQ ?? []).find((b) => b.id === draft.bikeId) ?? { id: '', name: '', setup: {} };
    const trip = newTrip({ title, startDate: draft.startDate || null, days: draft.days, bike }, await db.trips.toArray(), await db.items.toArray());
    await db.trips.add(trip);
    await saveRace(trip.id, { createdAt: new Date().toISOString() });
    offerDone(t('Race «{name}» created.', { name: title }));
    location.hash = raceHref(trip.id);
  }
  async function markRace() {
    if (!pick) return;
    await saveRace(pick, { createdAt: new Date().toISOString() });
    location.hash = raceHref(pick);
  }
  // Muster-Rennen (Noah «7b»): open it, or make it first
  const hasSample = $derived(!!($racesQ ?? {})[SAMPLE_ID] && ($tripsQ ?? []).some((x) => x.id === SAMPLE_ID));
  async function openSample(tour = false) {
    if (!hasSample) await makeSample({ db, newTrip, putRace, today, title: t('Sample race 1000'), tr: t });
    if (tour) return startTour('race');
    location.hash = raceHref(SAMPLE_ID);
  }
  let asked = false;
  $effect(() => {
    // #/race?sample (from First steps and «What the app can do») opens the sample once
    if (!where && /[?&]sample\b/.test(hash) && $racesQ !== undefined && $tripsQ !== undefined && !asked) {
      asked = true;
      openSample(/[?&]tour\b/.test(hash));
    }
  });
  const dateOf = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' }) : t('no date yet'));
</script>

{#if where}
  {#key where.id}<LazyPage load={DETAIL} id={where.id} part={where.part} box={hash.match(/[?&]box=([\w-]+)/)?.[1] ?? ''} />{/key}
{:else}
  <div class="rc" data-page="race">
    <Crumb path={[{ href: '#/trips', label: t('Trips|place') }]} here={t('Races')} />
    <!-- Gesamttest 20.10.2026 Design 1: the common page head (title, one line, one main button); the
      explanation is the quiet help line «ⓘ So geht's ›» under it instead of an ⓘ next to the title -->
    <h1 class="rc-h1" tabindex="-1" data-page-title>{t('Races')}</h1>
    <p class="rc-intro">{t('Bikepacking races and ultra rides: plan the strategy, know the route, ride with a calm head and learn afterwards.')}</p>
    <button type="button" class="help-line" aria-expanded={info} data-race-help onclick={() => (info = !info)}><Info size={18} aria-hidden="true" /><span>{t('How it works|help')}</span><ChevronRight class="hl-chev" size={16} aria-hidden="true" /></button>
    {#if info}
      <div class="rc-info" data-race-explain="hub">
        <p>{t('A race is one of your trips. Here it gets five parts: strategy, prepare, along the route, race mode and after the race.')}</p>
        <p>{t('Everything is a suggestion: every number can be changed, every list is yours.')}</p>
        <p>{t('The data: your route files and stops, your rides (Strava), OpenStreetMap, Open-Meteo and the Swiss timetable. Free, and only when you tap.')}</p>
      </div>
    {/if}

    <div class="rc-acts">
      <button type="button" class="btn hi" onclick={openNew} data-race-new><Plus size={16} aria-hidden="true" />{t('New race')}</button>
    </div>

    {#if $tripsQ !== undefined}
      {#if !list.coming.length && !list.past.length}
        <section class="rc-box rc-soft" data-race-empty>
          <h2 class="rc-h2"><Flag size={18} aria-hidden="true" /> {t('No race yet')}</h2>
          <p class="rc-text">{t('Create a race, or make one of your trips a race. Then load the route files and the stops of the organiser.')}</p>
        </section>
      {/if}
      {#each [{ key: 'coming', name: 'Coming', rows: list.coming }, { key: 'past', name: 'Done', rows: list.past }] as g (g.key)}
        {#if g.rows.length}
          <section class="rc-box" aria-labelledby="rc-{g.key}-h">
            <h2 id="rc-{g.key}-h" class="rc-h2">{t(g.name)}</h2>
            <!-- Gesamttest 20.10.2026 C9: rows like the app's other lists (title, the date small, ›; the whole row is the link) -->
            <ul class="rowlist rc-races">
              {#each g.rows as tr (tr.id)}
                {@const cd = countdown(tr.startDate, today)}
                <li>
                  <a class="lrow" href={raceHref(tr.id)} data-race-row={tr.id}>
                    <span class="ic" aria-hidden="true"><Flag size={18} /></span>
                    <span class="m"><span class="t">{tr.title}</span><span class="s">{dateOf(tr.startDate)}{#if cd && cd.days > 0}{' '}· {tn(cd.days, 'in {n} day', 'in {n} days')}{/if}</span></span>
                    <ChevronRight class="chev" size={18} aria-hidden="true" />
                  </a>
                </li>
              {/each}
            </ul>
          </section>
        {/if}
      {/each}
      <!-- Impeccable: the sample race comes after your own races, not above them -->
      <section class="rc-box rc-soft" data-race-sample-offer>
        <h2 class="rc-h2">{t('Sample race')}</h2>
        <p class="rc-text">{t('A made-up 1000 km race with 11 sectors, a depot and gaps: see what the app can do and what you can change, with small tasks.')}</p>
        <div class="rc-acts">
          <button type="button" class="btn" onclick={() => openSample(false)} data-race-sample-open>{t('See the sample race')}</button>
          <button type="button" class="btn sm" onclick={() => openSample(true)} data-race-sample-tour>{t('Show me around')}</button>
        </div>
      </section>
      {#if others.length}
        <section class="rc-box" aria-labelledby="rc-mark-h">
          <h2 id="rc-mark-h" class="rc-h2">{t('Make a trip a race')}</h2>
          <p class="rc-note">{t('The trip stays as it is; it gets the race parts on top.')}</p>
          <div class="rc-inline">
            <select class="inp" bind:value={pick} aria-label={t('Trip')} data-race-pick>
              <option value="">{t('Choose a trip')}</option>
              {#each others as tr (tr.id)}<option value={tr.id}>{tr.title}{tr.startDate ? ` · ${tr.startDate}` : ''}</option>{/each}
            </select>
            <button type="button" class="btn" disabled={!pick} onclick={markRace}>{t('Make it a race')}</button>
          </div>
        </section>
      {/if}
    {/if}
  </div>
{/if}

{#if draft}
  <RaceSheet title={t('New race')} onsave={create} onclose={() => (draft = null)} saveLabel={t('Create')}>
    <label class="rc-lab">{t('Name of the race')}<input class="inp" bind:value={draft.title} maxlength="80" placeholder={t('e.g. Alpine race 2027')} data-race-title /></label>
    <label class="rc-lab">{t('Start day')}<input class="inp" type="date" bind:value={draft.startDate} data-race-date /></label>
    <label class="rc-lab">{t('Days you plan for')}<input class="inp rc-num" type="number" min="1" max="40" bind:value={draft.days} /></label>
    {#if ($bikesQ ?? []).length}
      <label class="rc-lab">{t('Bike')}
        <select class="inp" bind:value={draft.bikeId}>
          {#each $bikesQ as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
        </select>
      </label>
    {/if}
    <p class="rc-note">{t('The race becomes a trip with a packing list from your last trip on this bike.')}</p>
  </RaceSheet>
{/if}
