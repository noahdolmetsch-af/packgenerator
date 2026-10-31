<script>
  /**
   * Paket U «Rennen» › Entlang der Strecke (#/race/<id>/route): food, water, beds, trains home, weather,
   * night comfort, sun, light, climbs, countries and busy roads along the route (ideas 2, 19, 27, 8, 5, 9,
   * 30, 13, 20, 12, 35). Network only on a tap; answers kept on this device (cache in db.meta).
   */
  import { untrack } from 'svelte';
  import { liveQuery } from 'dexie';
  import { MapPin, CloudSun, TrainFront, Phone } from '@lucide/svelte';
  import RaceBox from './RaceBox.svelte';
  import SleepLists from './SleepLists.svelte';
  import NightsByWeather from './NightsByWeather.svelte';
  import BakeryMornings from './BakeryMornings.svelte';
  import { db } from '../db.js';
  import { cacheSet, cacheQuery } from './store.js';
  import { POI_CACHE, WX_CACHE, POI_KIND, fetchPois, fetchRouteWx, nextSupply, dryStretches, sleepNear, exitStations, nextTrain, wxAt, lowBetween, wxAdvice, uvAdvice, compass } from './outside.js';
  import { fetchRoads, busyInDark, bottlesFor } from './more.js';
  import { biggestGaps } from './files.js';
  import { samples, nightRows, climbsOf, climbWhen, darkRiding, countriesOf, COUNTRIES, COUNTRY, localOf, hhmm, hm } from './race.js';
  import { sunTimes } from '../blockplan.js';
  import { seriesNear, wxNear, openLabel, rideHoursAcross, sleepStops, comfortOf, uvByDay, sundayDays, darkAt, forecastFrom } from './route-lib.js';
  import { raceHref } from './parts.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  let { ctx } = $props();

  // the page is built anew for every race (RaceDetail keys the part), so the id stays the same here
  const id = untrack(() => ctx.trip.id);
  const wxQ = cacheQuery(WX_CACHE + id);
  const roadsQ = cacheQuery('race-roads:' + id);
  const homeQ = liveQuery(() => db.settings.get('homePlace'));
  const wx = $derived($wxQ?.data ?? null);
  const roads = $derived($roadsQ?.data ?? null);
  const home = $derived.by(() => {
    const v = $homeQ?.value;
    return v && v.name && Number.isFinite(Number(v.lat)) ? v : null;
  });

  const km = $derived(Number(ctx.route?.km) || 0);
  const plan = $derived(ctx.plan);
  const race = $derived(ctx.race);
  const pois = $derived(ctx.pois ?? []);
  const eta = $derived(plan ? plan.etaOf : null);
  const startPt = $derived(ctx.route?.start ?? ctx.pts[0] ?? null);
  const isDark = $derived(darkAt(Number(startPt?.lat), Number(startPt?.lon)));

  /* ---------- formatting ---------- */
  const when = (ms) => (ms == null ? '' : `${new Date(ms).toLocaleDateString(locale(), { weekday: 'short' })} ${hhmm(ms)}`);
  const dayLabel = (day) => new Date(`${day}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric' });
  const age = (iso) => (iso ? new Date(iso).toLocaleString(locale(), { dateStyle: 'short', timeStyle: 'short' }) : '');
  const kindName = (k) => t(POI_KIND[k]?.name ?? 'Other stop');
  const nameOfPoi = (p) => p.name || kindName(p.kind);
  const deg = (v) => (Number.isFinite(v) ? `${Math.round(v)}°` : '–');

  /* ---------- toolbar: load from outside, only on a tap ---------- */
  let busy = $state('');
  let msg = $state('');
  const fail = (err) => (navigator.onLine === false ? t('You are offline. Try again with internet.') : err?.message === 'busy' ? t('The free service is busy. Try again in a minute.') : t('Could not load. Try again later.'));
  async function run(key, fn) {
    if (busy) return;
    busy = key;
    msg = '';
    try {
      if (navigator.onLine === false) throw new Error('offline');
      await fn();
    } catch (err) {
      msg = fail(err);
    } finally {
      busy = '';
    }
  }
  const loadPois = () => run('poi', async () => cacheSet(POI_CACHE + id, await fetchPois(ctx.pts)));
  const loadWx = () =>
    run('wx', async () => {
      const points = samples(ctx.pts, 50, 12).map((p) => ({ lat: p.lat, lon: p.lon, km: Math.round(p.km) }));
      const series = await fetchRouteWx(points);
      await cacheSet(WX_CACHE + id, { points, series });
    });
  const loadRoads = () => run('roads', async () => cacheSet('race-roads:' + id, await fetchRoads(ctx.pts, km)));

  /* ---------- 2 · food ---------- */
  const FOOD = ['shop', 'food', 'fuel'];
  let foodKinds = $state(['shop', 'food', 'fuel']);
  let foodAll = $state(false);
  const foodList = $derived(pois.filter((p) => foodKinds.includes(p.kind)));
  const next = $derived(nextSupply(pois, race.currentKm, eta));
  const foodGaps = $derived(pois.length ? biggestGaps(pois, km, ['shop', 'food'], 1) : []);
  const toggle = (list, k) => (list.includes(k) ? list.filter((x) => x !== k) : [...list, k]);

  /* ---------- 19 · dry stretches ---------- */
  const dryKm = $derived(Number(ctx.stored.dryKm) || 30);
  const dry = $derived(pois.length ? dryStretches(pois, km, dryKm, eta) : []);

  /* ---------- 27 · beds ---------- */
  const nights = $derived(nightRows(race, plan));
  const stops = $derived(sleepStops(nights, plan));
  const SUB = { hotel: 'Hotel', guest_house: 'Guest house', hostel: 'Hostel', camp_site: 'Campsite', alpine_hut: 'Mountain hut', motel: 'Motel' };

  /* ---------- 8 · trains ---------- */
  const stations = $derived(exitStations(pois));
  let trains = $state({});
  async function train(s) {
    if (!home) return;
    trains = { ...trains, [s.id]: { busy: true } };
    try {
      const at = eta ? localOf(eta(s.km)) : null;
      const r = await nextTrain(s.name, home.name, fetch, at);
      trains = { ...trains, [s.id]: r ? { r } : { none: true } };
    } catch (err) {
      trains = { ...trains, [s.id]: { err: fail(err) } };
    }
  }

  /* ---------- 5 · weather ---------- */
  const wxRows = $derived(
    (wx?.points ?? []).map((p, i) => {
      const at = eta ? eta(p.km) : null;
      const w = at != null ? wxAt(wx.series?.[i], at) : null;
      return { km: p.km, at, w };
    }),
  );
  const fcFrom = $derived(forecastFrom(race.start?.slice(0, 10), ctx.today));

  /* ---------- 9 · night comfort ---------- */
  const bagC = $derived(race.bagC);
  const comfort = $derived(
    nights.map((n) => {
      if (n.kind === 'hotel') return { ...n, state: 'bed', low: null };
      const low = lowBetween(seriesNear(wx, n.km), n.from, n.to);
      return { ...n, low, state: comfortOf(low, bagC) };
    }),
  );
  const COMFORT = { warm: 'Warm enough', layer: 'Add a layer', cold: 'Too cold: find a roof', bed: 'In a bed' };

  /* ---------- 30 · sun ---------- */
  const uvDays = $derived(uvByDay(plan, wx));

  /* ---------- 13 · light ---------- */
  const lampH = $derived(race.lampH);
  const sun = (day) => (startPt ? sunTimes(day, Number(startPt.lat), Number(startPt.lon)) : null);
  const dark = $derived(darkRiding(plan, sun, lampH));

  /* ---------- 20 · climbs ---------- */
  const climbs = $derived(
    climbsOf(ctx.route?.profile ?? [], 300).map((c) => {
      if (!eta) return { ...c };
      const a = eta(c.fromKm);
      const b = eta(c.toKm);
      const temp = wxNear(wx, c.fromKm, a)?.temp ?? null;
      return { ...c, a, b, temp, mark: climbWhen(new Date(a).getHours(), temp, isDark(a)) };
    }),
  );
  const MARK = { hot: 'Midday heat: climb early or late if you can', midday: 'At midday: hot when the sun shines', dark: 'In the dark: good light, slow on the way down' };

  /* ---------- 12 · countries ---------- */
  const guessed = $derived(countriesOf(samples(ctx.pts, 20, 60)));
  const codes = $derived(Array.isArray(ctx.stored.countries) ? ctx.stored.countries : guessed);
  let changeCountries = $state(false);
  const sundays = $derived(sundayDays(plan, pois));

  /* ---------- 35 · busy roads ---------- */
  const busyDark = $derived(roads && eta ? busyInDark(roads.busy ?? [], eta, isDark) : []);

  const numSave = (key, e, min = 0) => {
    const v = Number(e.currentTarget.value);
    if (Number.isFinite(v) && v >= min) ctx.save({ [key]: v });
  };
</script>

{#if !ctx.route?.km}
  <section class="rc-box rc-soft" data-race-noroute>
    <h2 class="rc-h2">{t('Load the route first')}</h2>
    <p class="rc-text">{t('Everything along the route needs the route: load the GPX file under «Prepare».')}</p>
    <a class="btn hi" href={raceHref(id, 'prepare')}>{t('To «Prepare»')}</a>
  </section>
{:else}
  <div class="rc-box rc-soft" data-race-route-tools>
    <div class="rc-acts">
      <button type="button" class="btn" onclick={loadPois} disabled={!!busy} data-race-load-pois><MapPin size={18} aria-hidden="true" /> {busy === 'poi' ? t('Loading…') : t('Load places from OpenStreetMap')}</button>
      <button type="button" class="btn" onclick={loadWx} disabled={!!busy} data-race-load-wx><CloudSun size={18} aria-hidden="true" /> {busy === 'wx' ? t('Loading…') : t('Load the weather')}</button>
    </div>
    <p class="rc-note">
      {ctx.osmAt ? t('Places from {at}', { at: age(ctx.osmAt) }) : t('No places loaded yet.')}
      · {$wxQ?.at ? t('Weather from {at}', { at: age($wxQ.at) }) : t('No weather loaded yet.')}
    </p>
    {#if !plan}<p class="rc-note">{t('Without a start time only km are shown. Set the start under «Strategy».')}</p>{/if}
    {#if msg}<p class="rc-warn" role="status" data-race-route-msg>{msg}</p>{/if}
  </div>

  <div class="rc-grid">
    <!-- 2 · Food along the route -->
    <RaceBox id="food" title={t('Food along the route')} what="Lists shops, restaurants and petrol stations along the route and whether they are open when you are expected there." why="You know where to buy food before it runs out, and which shop will be closed when you pass." from="OpenStreetMap (opening hours as entered there) and your own stops; the time comes from your plan.">
      {#if !pois.length}
        <p class="rc-empty">{t('Load the places from OpenStreetMap above, or add your own stops under «Prepare».')}</p>
      {:else}
        {#if next}
          {@const s = openLabel(next.poi.hours, next.at)}
          <p class="rc-text" data-race-next-supply>{t('Next food from km {from}: {name} in {d} km', { from: Math.round(race.currentKm), name: nameOfPoi(next.poi), d: next.km })} · <span class:rc-ok={s.tone === 'ok'} class:rc-warn={s.tone === 'warn'}>{t(s.key, s.vars)}</span></p>
        {/if}
        {#each foodGaps as g (g.kind)}
          {#if g.km >= 40}<p class="rc-warn" data-race-food-gap>{t(g.kind === 'shop' ? 'No shop on {km} km (km {a}–{b}): carry food for it.' : 'No restaurant on {km} km (km {a}–{b}).', { km: g.km, a: g.fromKm, b: g.toKm })}</p>{/if}
        {/each}
        <div class="rc-chips" role="group" aria-label={t('Show these kinds')}>
          {#each FOOD as k (k)}
            <button type="button" class="rc-chip" aria-pressed={foodKinds.includes(k)} onclick={() => (foodKinds = toggle(foodKinds, k))} data-race-food-kind={k}>{kindName(k)}</button>
          {/each}
        </div>
        <ul class="rc-list">
          {#each foodAll ? foodList : foodList.slice(0, 25) as p (p.id ?? `${p.kind}${p.km}`)}
            {@const s = openLabel(p.hours, eta ? eta(p.km) : null)}
            <li class="rc-row">
              <div class="rc-row-main">
                <b>{t('km {km}', { km: Math.round(p.km) })} · {nameOfPoi(p)}</b>
                <small>{kindName(p.kind)}{#if eta}{' '}· {when(eta(p.km))}{/if} · <span class:rc-ok={s.tone === 'ok'} class:rc-warn={s.tone === 'warn'}>{t(s.key, s.vars)}</span></small>
              </div>
            </li>
          {:else}
            <li class="rc-empty">{t('Nothing of these kinds along the route.')}</li>
          {/each}
        </ul>
        {#if foodList.length > 25}<button type="button" class="btn sm" onclick={() => (foodAll = !foodAll)} data-race-food-all>{foodAll ? t('Show fewer') : t('Show all {n}', { n: foodList.length })}</button>{/if}
      {/if}
    </RaceBox>

    <!-- 19 · Dry stretches -->
    <RaceBox id="dry" title={t('Dry stretches')} what="Finds the stretches longer than your limit without water, an open shop or a petrol station." why="You fill up and take enough bottles before a long dry stretch." from="OpenStreetMap water points, shops and petrol stations; riding hours from your plan.">
      <label class="rc-lab">{t('Too long without water (km)')}
        <input class="inp rc-num" type="number" min="5" step="5" value={dryKm} onchange={(e) => numSave('dryKm', e, 5)} data-race-drykm />
      </label>
      {#if !pois.length}
        <p class="rc-empty">{t('Load the places from OpenStreetMap above first.')}</p>
      {:else if !dry.length}
        <p class="rc-ok">{t('No stretch longer than {km} km without water.', { km: dryKm })}</p>
      {:else}
        <ul class="rc-list">
          {#each dry as d (d.fromKm)}
            {@const h = rideHoursAcross(plan, d.fromKm, d.toKm)}
            <li class="rc-row" data-race-dry>
              <div class="rc-row-main">
                <b>{t('km {a}–{b}: {km} km without water', { a: d.fromKm, b: d.toKm, km: d.km })}</b>
                {#if h != null}<small>{t('About {h} riding: take {n} bottles', { h: hm(h), n: bottlesFor(h) })}</small>{/if}
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </RaceBox>

    <!-- 27 · Beds in reach -->
    <RaceBox id="beds" title={t('Beds in reach')} what="Shows hotels, hostels and campsites within 20 km of each planned night." why="You see early which nights have no bed nearby and can plan a bivy or another stop." from="OpenStreetMap places to sleep (phone where entered); the nights come from your plan.">
      {#if !plan}
        <p class="rc-empty">{t('Set the start under «Strategy» to see where your nights are.')}</p>
      {:else if !pois.length}
        <p class="rc-empty">{t('Load the places from OpenStreetMap above first.')}</p>
      {:else if !stops.length}
        <p class="rc-empty">{t('No night in this plan.')}</p>
      {:else}
        <ul class="rc-list">
          {#each stops as n (n.key)}
            {@const beds = sleepNear(pois, n.km, 20)}
            <li data-race-bed-night={n.i + 1}>
              <p class="rc-text"><b>{t('Night {n}', { n: n.i + 1 })}</b> · {t('km {km}', { km: n.km })}{#if n.from}{' '}· {when(n.from)}{/if}</p>
              {#if !beds.length}
                <p class="rc-warn">{t('No bed within 20 km: plan a bivy or move the night.')}</p>
              {:else}
                <ul class="rc-list">
                  {#each beds as b (b.id ?? b.km)}
                    <li class="rc-row">
                      <div class="rc-row-main">
                        <b>{nameOfPoi(b)}</b>
                        <small>{t('km {km}', { km: Math.round(b.km) })}{#if SUB[b.sub]}{' '}· {t(SUB[b.sub])}{/if}</small>
                      </div>
                      {#if b.phone}<a class="rc-icon" href="tel:{b.phone.replace(/[^\d+]/g, '')}" aria-label={t('Call {name}', { name: nameOfPoi(b) })}><Phone size={18} aria-hidden="true" /></a>{/if}
                    </li>
                  {/each}
                </ul>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </RaceBox>

    <!-- U4 1141 · places to sleep from lists of the organiser or other riders -->
    <SleepLists {ctx} />

    <!-- 8 · Exit points -->
    <RaceBox id="exit" title={t('Exit points')} what="Lists the stations along the route and finds the next train from there to your home place." why="If you have to stop, you know where and how you get home." from="OpenStreetMap stations; trains from transport.opendata.ch (only on a tap); home place under «Me».">
      {#if !home}<p class="rc-note">{t('Set your home place under «Me» to look up trains home.')} <a href="#/me">{t('To «Me»')}</a></p>{/if}
      {#if !pois.length}
        <p class="rc-empty">{t('Load the places from OpenStreetMap above first.')}</p>
      {:else if !stations.length}
        <p class="rc-empty">{t('No station near the route.')}</p>
      {:else}
        <ul class="rc-list">
          {#each stations as s (s.id ?? s.km)}
            {@const r = trains[s.id]}
            <li class="rc-row" data-race-station>
              <div class="rc-row-main">
                <b>{s.name}</b>
                <small>{t('km {km}', { km: Math.round(s.km) })}{#if eta}{' '}· {t('you are there {at}', { at: when(eta(s.km)) })}{/if}</small>
                {#if r?.r}<small class="rc-ok">{t('{dep} → {arr}', { dep: r.r.dep.slice(11, 16), arr: r.r.arr?.slice(11, 16) ?? '?' })} · {r.r.transfers ? tn(r.r.transfers, '{n} change', '{n} changes') : t('Direct|train')}</small>{/if}
                {#if r?.none}<small class="rc-warn">{t('No connection found.')}</small>{/if}
                {#if r?.err}<small class="rc-warn">{r.err}</small>{/if}
              </div>
              {#if home}<button type="button" class="btn sm" disabled={r?.busy} onclick={() => train(s)} data-race-train><TrainFront size={16} aria-hidden="true" /> {t('Next train home')}</button>{/if}
            </li>
          {/each}
        </ul>
      {/if}
    </RaceBox>

    <!-- 5 · Weather -->
    <RaceBox id="wx" title={t('Weather when you are there')} what="Shows the forecast at points along the route for the hour you are expected there, with what to wear and drink." why="You pack and dress for the weather of each stretch, not only of the start." from="Open-Meteo forecast (16 days, only on a tap); the times come from your plan.">
      {#if fcFrom}
        <p class="rc-note" data-race-wx-from>{t('Forecast from {date}', { date: dayLabel(fcFrom) })}: {t('until then only typical values for this time of year are known.')}</p>
      {/if}
      {#if !plan}
        <p class="rc-empty">{t('Set the start under «Strategy» to see the weather for your times.')}</p>
      {:else if !wx}
        <p class="rc-empty">{t('Load the weather above.')}</p>
      {:else}
        <ul class="rc-list">
          {#each wxRows as r (r.km)}
            <li class="rc-row" data-race-wx-row>
              <div class="rc-row-main">
                <b>{t('km {km}', { km: r.km })} · {when(r.at)}</b>
                {#if r.w}
                  <small>{deg(r.w.temp)} ({t('feels {t}', { t: deg(r.w.feels) })}) · {t('wind {v} km/h {dir}', { v: Math.round(r.w.wind ?? 0), dir: compass(r.w.windDir) })} · {t('rain {p} %', { p: r.w.rain ?? '–' })}</small>
                  {#each wxAdvice(r.w) as a (a)}<small>{t(a)}</small>{/each}
                {:else}
                  <small>{t('Not in the forecast yet.')}</small>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </RaceBox>

    <!-- 9 · Night comfort -->
    <RaceBox id="night" title={t('Night comfort')} what="Compares the lowest temperature of each bivy night with the comfort limit of your sleeping bag." why="You know which nights need an extra layer or a roof." from="Open-Meteo night temperatures near the place of the night; the limit is yours.">
      <label class="rc-lab">{t('Comfort limit (°C): the comfort temperature of your sleeping bag or quilt')}
        <input class="inp rc-num" type="number" step="1" value={bagC} onchange={(e) => numSave('bagC', e, -40)} data-race-bagc />
      </label>
      {#if !plan}
        <p class="rc-empty">{t('Set the start under «Strategy» to see your nights.')}</p>
      {:else if !comfort.length}
        <p class="rc-empty">{t('No night in this plan.')}</p>
      {:else}
        <ul class="rc-list">
          {#each comfort as n (n.n)}
            <li class="rc-row" data-race-comfort={n.state ?? 'unknown'}>
              <div class="rc-row-main">
                <b>{t('Night {n}', { n: n.i + 1 })} · {t('km {km}', { km: n.km })}</b>
                <small>
                  {#if n.low != null}{t('low {t}', { t: deg(n.low) })}{' · '}{/if}
                  {#if n.state}<span class:rc-ok={n.state === 'warm' || n.state === 'bed'} class:rc-warn={n.state === 'cold'}>{t(COMFORT[n.state])}</span>{:else}{wx ? t('Not in the forecast yet.') : t('Load the weather above.')}{/if}
                </small>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </RaceBox>

    <!-- U4 1144 · nights by the weather -->
    <NightsByWeather {ctx} {wx} />

    <!-- «Bäckerei am Morgen» (Noah 28.10.2026 «3b») -->
    <BakeryMornings {ctx} />

    <!-- 30 · Sun protection -->
    <RaceBox id="uv" title={t('Sun protection')} what="Shows the highest UV index on the route for each day of your plan, with the sun protection it needs." why="You pack enough sun cream and protect neck, ears and lips on long days in the sun." from="Open-Meteo UV forecast near the stretch of each day.">
      {#if !plan}
        <p class="rc-empty">{t('Set the start under «Strategy» to see your days.')}</p>
      {:else if !wx}
        <p class="rc-empty">{t('Load the weather above.')}</p>
      {:else}
        <ul class="rc-list">
          {#each uvDays as d (d.day)}
            {@const a = uvAdvice(d.uv)}
            <li class="rc-row" data-race-uv>
              <div class="rc-row-main">
                <b>{t('Day {n}', { n: d.n })} · {dayLabel(d.day)}{#if d.uv != null}{' '}· {t('UV {uv}', { uv: d.uv })}{/if}</b>
                <small>{a ? t(a.key) : t('Not in the forecast yet.')}</small>
              </div>
            </li>
          {/each}
        </ul>
        <p class="rc-note">{t('Reminder: cream again every 2 to 3 hours, after sweating and after rain.')}</p>
      {/if}
    </RaceBox>

    <!-- 13 · Light plan -->
    <RaceBox id="light" title={t('Light plan')} what="Counts the hours you ride in the dark each night and compares them with how long your lamp lasts." why="You know if one battery is enough or where you have to charge." from="Sunrise and sunset at the start of the route; riding times from your plan; the lamp hours are yours.">
      <label class="rc-lab">{t('Your lamp lasts (hours)')}
        <input class="inp rc-num" type="number" min="1" step="1" value={lampH} onchange={(e) => numSave('lampH', e, 1)} data-race-lamph />
      </label>
      {#if !plan}
        <p class="rc-empty">{t('Set the start under «Strategy» to see your dark hours.')}</p>
      {:else if !dark.length}
        <p class="rc-ok" data-race-light-none>{t('No night riding planned: a small lamp is enough.')}</p>
      {:else}
        <ul class="rc-list">
          {#each dark as d (d.day)}
            <li class="rc-row" data-race-dark>
              <div class="rc-row-main">
                <b>{dayLabel(d.day)} · {t('{h} in the dark', { h: hm(d.darkH) })}</b>
                <small class:rc-warn={d.need} class:rc-ok={!d.need}>{d.need ? t('Longer than your lamp lasts: charge on the way or take a second battery.') : t('Your lamp is enough.')}</small>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </RaceBox>

    <!-- 20 · Climbs by time of day -->
    <RaceBox id="climbs" title={t('Climbs by time of day')} what="Lists the big climbs (300 m up and more) with the time you are expected on them." why="You see which climbs fall in the midday heat or in the dark and can shift your plan." from="The elevation profile of your route; times from your plan; temperature from the weather if loaded.">
      {#if !climbs.length}
        <p class="rc-empty">{t('No climb of 300 m or more in the profile.')}</p>
      {:else}
        <ul class="rc-list">
          {#each climbs as c (c.fromKm)}
            <li class="rc-row" data-race-climb={c.mark ?? 'ok'}>
              <div class="rc-row-main">
                <b>{t('km {a}–{b} · {m} m up · {g} %', { a: c.fromKm, b: c.toKm, m: c.gain, g: c.grade })}</b>
                {#if c.a}<small>{when(c.a)}–{hhmm(c.b)}{#if c.temp != null}{' '}· {deg(c.temp)}{/if}</small>{/if}
                {#if MARK[c.mark]}<small class="rc-warn">{t(MARK[c.mark])}</small>{/if}
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </RaceBox>

    <!-- 12 · Country info -->
    <RaceBox id="countries" title={t('Country info')} what="Shows emergency numbers, money, plugs and Sunday shopping for each country on the route." why="You have the right number, money and adapter, and you buy food before a closed Sunday." from="A short list in the app (as of October 2026, check before the race); the countries are guessed from the route and you can change them.">
      {#if sundays.length}
        {#each sundays as s (s.day)}
          <p class="rc-warn" data-race-sunday>{t('Day {n} is a Sunday: shops on km {a}–{b} may be closed; buy before.', { n: s.n, a: s.fromKm, b: s.toKm })}</p>
        {/each}
      {/if}
      {#each codes as c (c)}
        {@const x = COUNTRY[c]}
        {#if x}
          <div data-race-country={c}>
            <p class="rc-text"><b>{t(x.name)}</b></p>
            <p class="rc-note">{t('Emergency: {v}', { v: t(x.sos) })} · {t('Money: {v}', { v: x.money })} · {t('Plug: {v}', { v: t(x.plug) })}</p>
            <p class="rc-note">{t('Sunday: {v}', { v: t(x.sunday) })}</p>
          </div>
        {/if}
      {:else}
        <p class="rc-empty">{t('No country found for this route. Add one below.')}</p>
      {/each}
      <div class="rc-acts">
        <button type="button" class="btn sm" aria-expanded={changeCountries} onclick={() => (changeCountries = !changeCountries)} data-race-countries-edit>{t('Change the countries')}</button>
        {#if Array.isArray(ctx.stored.countries)}<button type="button" class="btn sm" onclick={() => ctx.save({ countries: null })}>{t('Guess from the route again')}</button>{/if}
      </div>
      {#if changeCountries}
        <div class="rc-chips" role="group" aria-label={t('Countries on the route')}>
          {#each COUNTRIES as x (x.code)}
            <button type="button" class="rc-chip" aria-pressed={codes.includes(x.code)} onclick={() => ctx.save({ countries: toggle(codes, x.code) })} data-race-country-chip={x.code}>{t(x.name)}</button>
          {/each}
        </div>
      {/if}
    </RaceBox>

    <!-- 35 · Busy roads at night -->
    <RaceBox id="busy" title={t('Busy roads at night')} what="Finds the main roads on the route that you are expected to ride in the dark." why="You plan to pass them in daylight, or wear a reflective vest and extra light." from="OpenStreetMap road types (only on a tap); dark from sunrise and sunset; times from your plan.">
      {#if !roads}
        <p class="rc-empty">{t('The roads are not loaded yet.')}</p>
        <button type="button" class="btn sm" onclick={loadRoads} disabled={!!busy} data-race-load-roads>{busy === 'roads' ? t('Loading…') : t('Load the roads from OpenStreetMap')}</button>
      {:else if !plan}
        <p class="rc-empty">{t('Set the start under «Strategy» to see when you ride them.')}</p>
      {:else if !busyDark.length}
        <p class="rc-ok" data-race-busy-none>{dark.length ? t('No busy road in the dark.') : t('Hardly any night riding in the plan: no busy road in the dark.')}</p>
      {:else}
        <ul class="rc-list">
          {#each busyDark as b (b.fromKm)}
            <li class="rc-row" data-race-busy>
              <div class="rc-row-main">
                <b>{t('km {a}–{b}: main road', { a: b.fromKm, b: b.toKm })}</b>
                <small>{when(b.at)}–{hhmm(b.end)} · {t('in the dark: reflective vest, both lights on')}</small>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
      {#if $roadsQ?.at}<p class="rc-src">{t('Roads from {at}', { at: age($roadsQ.at) })}</p>{/if}
    </RaceBox>
  </div>
{/if}
