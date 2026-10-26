<script>
  /**
   * Verpflegungsstrategie (Noah 19.10.2026 21:11 «1a 2a 3a und b 4a 5a»): Touren › Verpflegung
   * (#/trips/fuel, #/trips/fuel?trip=ID). How much to eat and drink, section by section between the
   * places to buy food: carbohydrates (your g per hour), water (0.5–1.5 l per hour by temperature and
   * climbing), what to carry, and warnings for long gaps, bottles that are too small and shops closed
   * when you get there. Your values and products are yours to change, sort and delete. The rule:
   * src/lib/fuel.js. The places along the route come from the place search of the live map (Paket 7, map/poisearch.js
   * keepAlong: water, shops, bakeries, petrol stations, restaurants … with opening hours, race/outside.js
   * openAt); every kind can be shown and filtered on the live map (#/live/<tripId>). Without them the
   * fountains of the route card (route/pois.js) still count.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { t, tn, num, locale } from '../lib/i18n.svelte.js';
  import { localDay } from '../lib/localday.js';
  import { RIDER_KEY } from '../lib/weight.js';
  import GpxStops from '../lib/route/GpxStops.svelte';
  import { energyFor, riderKg } from '../lib/energie.js';
  import { upcomingTrips } from '../lib/gear/assign.js';
  import { nextTrip } from '../lib/debrief.js';
  import { hoursOf } from '../lib/situation.js';
  import { paceOf, PACE_KEY } from '../lib/pace.js';
  import { cacheKey, fitsRoute, lineHash } from '../lib/route/pois.js';
  import { keepAlong, cacheKeyOf, labelOf } from '../lib/map/poisearch.js';
  import { placeStore } from '../lib/map/poiprefs.js';
  import { lineKm, snap } from '../lib/race/race.js';
  import { openAt } from '../lib/race/outside.js';
  import {
    FUEL_KEY, LIMITS, ROUTE_KINDS, PLACE_KINDS, valuesOf, withValue, withStandardValues, fuelForTrip, tripOwnOf, tripDiff, fuelPlan, packOf, moveProduct, productId,
    climbAlong, hoursAlong, etaAlong, tempFromTrip, dayStartMs,
  } from '../lib/fuel.js';
  import PathHead from '../lib/ui/PathHead.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import Fold from '../lib/ui/Fold.svelte';
  import SortGrip from '../lib/ui/SortGrip.svelte';
  import SortArrows from '../lib/ui/SortArrows.svelte';
  import { sortable } from '../lib/ui/sortable.js';
  import { askDelete, deleteWithUndo, saveFailed } from '../lib/ui/ask.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import { phone } from '../lib/media.svelte.js';
  import { openTrip } from '../lib/nav.js';
  import { Cookie, Droplet, TriangleAlert, Plus, Trash2, Clock, Flame } from '@lucide/svelte';

  const today = localDay();
  const tripsQ = liveQuery(() => db.trips.toArray());
  const fuelQ = liveQuery(() => db.settings.get(FUEL_KEY));
  const paceQ = liveQuery(() => db.settings.get(PACE_KEY));
  const trips = $derived(($tripsQ ?? []).filter((x) => !x.skipped));
  const setting = $derived($fuelQ?.value ?? null);
  const pace = $derived(paceOf($paceQ?.value ?? null));

  const asked = new URLSearchParams(location.hash.split('?')[1] ?? '').get('trip');
  let tripId = $state(asked ?? null);
  const choices = $derived(upcomingTrips(trips, today));
  const chosenId = $derived(tripId ?? nextTrip(trips, today)?.id ?? choices[0]?.id ?? '');
  const trip = $derived(trips.find((x) => x.id === chosenId) ?? null);
  // Einzelidee 32: the trip's own numbers over your standard (only for this trip)
  const tripOwn = $derived(tripOwnOf(trip));
  const v = $derived(valuesOf(fuelForTrip(setting, trip)));
  const diff = $derived(tripDiff(setting, trip));

  // the places along the route (fountains today; shops and opening hours come with the race search)
  // 1. the places of every kind kept along the route (live map search), 2. else the route card's fountains
  const placesQ = $derived(trip?.id ? liveQuery(() => db.meta.get(cacheKeyOf('route', trip.id))) : null);
  const kept = $derived(placesQ ? $placesQ?.value ?? null : null);
  const keptFits = $derived(!!trip?.route?.line && kept?.hash === lineHash(trip.route.line) && Array.isArray(kept.list));
  const poisQ = $derived(trip?.id ? liveQuery(() => db.meta.get(cacheKey(trip.id))) : null);
  const poiCache = $derived(poisQ ? $poisQ?.value ?? null : null);
  const source = $derived.by(() => {
    if (keptFits) {
      const pts = lineKm({ line: trip.route.line, km: trip.route.km });
      return { kinds: PLACE_KINDS, pois: kept.list.map((p) => ({ ...p, km: snap(pts, p).km })), full: true, count: kept.list.length };
    }
    return { kinds: ROUTE_KINDS, pois: trip && fitsRoute(poiCache, trip) ? poiCache.items : [], full: false, count: 0 };
  });

  const route = $derived(trip?.route ?? null);
  const days = $derived(Math.max(1, Number(trip?.days) || 1));
  const rideH = $derived(hoursOf(trip) || 6);
  const totalKm = $derived(route?.km > 0 ? route.km : 0);
  const plan = $derived.by(() => {
    if (!trip) return null;
    if (!totalKm) return null;
    const climbTo = climbAlong(route.profile, totalKm, route.gainM);
    const hoursTo = hoursAlong(pace, climbTo);
    const eta = etaAlong({ startMs: dayStartMs(trip.startDate), startHour: v.startHour, rideH, hoursTo });
    return fuelPlan({ totalKm, gainM: route.gainM, profile: route.profile, values: v, hoursTo, eta, tempAt: (ms) => tempFromTrip(trip, ms), kinds: source.kinds, pois: source.pois, openAt: source.full ? openAt : null });
  });
  // without a route: the riding hours of the trip only
  // Paket X: the one energy rule, what the ride uses next to what you eat
  const kgQ = liveQuery(() => db.settings.get(RIDER_KEY));
  const used = $derived(plan && trip ? energyFor({ hours: plan.totals.hours, km: totalKm, gainM: Number(trip.route?.gainM) || 0, kg: riderKg($kgQ?.value), fuel: $fuelQ?.value ?? null }) : null);
  // Paket X: the places along the route as GPX waypoints; a planned stop says what to buy there
  const gpxPoints = $derived(
    source.pois.map((p) => {
      const sec = plan?.sections.find((x) => x.from && x.from.km === p.km && x.from.name === p.name);
      return { ...p, note: sec ? t('Stop: buy {g} for {km} km', { g: g(sec.carbs), km: num(Math.round(sec.toKm - sec.fromKm)) }) : p.km != null ? `km ${num(Math.round(p.km))}` : '' };
    }),
  );
  const plain = $derived(trip && !totalKm ? { hours: Math.round(rideH * days * 10) / 10 } : null);

  let problem = $state('');
  async function save(next) {
    problem = '';
    try {
      await db.settings.put({ key: FUEL_KEY, value: $state.snapshot(next) });
    } catch (err) {
      problem = saveFailed(err);
    }
  }
  const setVal = (key, raw) => {
    const n = Number(String(raw).replace(',', '.'));
    if (key !== 'view' && !Number.isFinite(n)) return;
    if (key !== 'view' && tripOwn && trip) return saveTripOwn(withValue(tripOwn, key, n));
    return save(withValue(setting, key, key === 'view' ? raw : n));
  };
  const OWN_NAME = { carbsGh: 'Carbohydrates per hour (g)', coolLh: 'Water per hour when cool (l)', hotLh: 'Water per hour when hot (l)', coolC: 'Cool up to (°C)', hotC: 'Hot from (°C)', bottles: 'Bottles', bottleL: 'Litres per bottle', stopH: 'A stop about every (h)', startHour: 'Start time (hour)' };
  async function saveTripOwn(own) {
    problem = '';
    try {
      await db.trips.update(trip.id, { fuelOwn: own == null ? undefined : $state.snapshot(own) });
    } catch (err) {
      problem = saveFailed(err);
    }
  }
  async function setTripOwn(on) {
    if (!trip) return;
    const before = tripOwn;
    await saveTripOwn(on ? (before ?? {}) : null);
    if (!on && before && Object.keys(before).length) offerDone(t('This trip uses your standard numbers again.'), () => saveTripOwn(before));
  }
  async function resetValues() {
    const before = setting;
    await save(withStandardValues(setting));
    offerDone(t('Back to the standard values.'), () => save(before));
  }

  /* ---------- products: add, rename, change, sort, delete ---------- */
  const products = $derived(v.products);
  const nameOf = (p) => p.name || t(p.std ?? '');
  const putProducts = (list) => save({ ...(setting ?? {}), products: list });
  const changeProduct = (id, patch) => putProducts(products.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  function rename(p, raw) {
    const name = raw.trim();
    if (!name || name === nameOf(p)) return;
    return changeProduct(p.id, { name });
  }
  function setCarbs(p, raw) {
    const n = Number(String(raw).replace(',', '.'));
    if (Number.isFinite(n) && n >= 0) return changeProduct(p.id, { carbs: Math.min(500, Math.round(n)) });
  }
  let newName = $state('');
  let newCarbs = $state(30);
  async function addProduct(e) {
    e.preventDefault();
    const name = newName.trim();
    const carbs = Number(String(newCarbs).replace(',', '.'));
    if (!name || !Number.isFinite(carbs) || carbs < 0) return;
    await putProducts([...products, { id: productId(), name, carbs: Math.round(carbs) }]);
    newName = '';
  }
  async function removeProduct(p) {
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: nameOf(p) }) });
    if (answer !== 'delete') return;
    const before = products;
    await deleteWithUndo({ run: () => putProducts(products.filter((x) => x.id !== p.id)), undo: () => putProducts(before), text: t('"{name}" deleted.', { name: nameOf(p) }), name: nameOf(p) });
  }
  const onmove = (from, to) => putProducts(moveProduct(products, from, to));
  const step = (i, dir) => {
    const to = Math.min(Math.max(i + dir, 0), products.length - 1);
    return to === i ? null : putProducts(moveProduct(products, i, to));
  };

  /* ---------- words ---------- */
  const kmOf = (km) => num(km < 10 ? Math.round(km * 10) / 10 : Math.round(km));
  const l = (x) => t('{n} l', { n: num(x) });
  const h = (x) => t('{n} h', { n: num(x) });
  const g = (x) => t('{n} g', { n: num(x) });
  const when = (ms) => (Number.isFinite(ms) ? new Date(ms).toLocaleString(locale(), { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : '');
  const placeName = (p, end) => (p ? p.name || t(labelOf(p)) : end ? t('Finish') : t('Start'));
  const shopName = (p) => p.name || t(labelOf(p));

  /* ---------- keep the places along the route (the live map's search, all kinds) ---------- */
  let keeping = $state(null);
  let keepFailed = $state(false);
  async function keepPlaces() {
    if (keeping || !trip?.route?.line) return;
    keepFailed = false;
    keeping = { done: 0, total: 0 };
    try {
      const r = await keepAlong($state.snapshot(trip.route.line), trip.id, { store: placeStore, onProgress: (p) => (keeping = p) });
      keepFailed = !r.count && !(r.chunks && r.failed < r.chunks);
    } finally {
      keeping = null;
    }
  }
  const packText = (carbs) => {
    const p = packOf(carbs, products);
    return p.items.length ? `${p.items.map((x) => `${x.n} × ${nameOf(x.product)}`).join(', ')} (${g(p.carbs)})` : t('No products in use: add one below.');
  };
  const carbsText = (carbs) => (v.view === 'products' ? packText(carbs) : g(carbs));
</script>

<div class="page fuel" data-page="fuel">
  <PathHead crumbs={[{ label: t('Trips|place'), href: '#/trips' }]} title={t('Food and water|fuel')} sub={t('Your fuelling plan, section by section')} />
  <p class="intro">{t('How much to eat and drink on the way: the app splits the route at the places where you can buy food and says, for each part, how many carbohydrates and how much water you need and what to carry. All values are suggestions: change them below.')}</p>
  {#if problem}<p class="err" role="alert">{problem}</p>{/if}

  <section class="box" aria-labelledby="fu-trip">
    <h2 id="fu-trip" class="title">{t('Trip')}</h2>
    {#if trips.length}
      <label class="fld">
        <span>{t('For which trip')}</span>
        <select value={chosenId} onchange={(e) => (tripId = e.currentTarget.value)} data-fuel-trip>
          {#each choices as c (c.id)}<option value={c.id}>{c.title || t('Trip')}{c.startDate ? ` · ${new Date(`${c.startDate}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', timeZone: 'UTC' })}` : ''}</option>{/each}
          {#if trip && !choices.some((c) => c.id === trip.id)}<option value={trip.id}>{trip.title || t('Trip')}</option>{/if}
        </select>
      </label>
    {:else}
      <p class="note">{t('No trip yet. Plan a trip with a GPX route, then the plan shows here.')} <a href="#/trips">{t('To the trips')}</a></p>
    {/if}
  </section>

  {#if trip}
    <!-- Einzelidee 32 «Ausnahme für eine Reise»: own numbers that count only for this trip -->
    <section class="box tripown" aria-labelledby="fu-tripown" data-fuel-tripown>
      <label class="tosw">
        <input type="checkbox" role="switch" checked={!!tripOwn} onchange={(e) => setTripOwn(e.currentTarget.checked)} data-fuel-tripown-switch />
        <span><b id="fu-tripown">{t('Own numbers only for this trip')}</b>
          <small>{tripOwn ? t('On: what you change under «Your values» counts only for «{name}». Your standard stays as it is.', { name: trip.title || t('Trip') }) : t('Off: «Your values» below are your standard for every trip.')}</small></span>
      </label>
      {#if diff.length}
        <ul class="tod">
          {#each diff as d (d.key)}<li>{t(OWN_NAME[d.key])}: <b class="num">{num(d.own)}</b> <small>{t('(standard {n})', { n: num(d.std) })}</small></li>{/each}
        </ul>
      {/if}
    </section>
    <section class="box res" aria-labelledby="fu-sum" data-fuel-result>
      <h2 id="fu-sum" class="title">{t('What you need')}</h2>
      <Seg label={t('Show as')} value={v.view} options={[{ key: 'grams', name: t('Grams and litres') }, { key: 'products', name: t('My products') }]} onchange={(k) => setVal('view', k)} />
      {#if plan}
        <div class="sum">
          <span><Clock size={18} aria-hidden="true" /><b class="num">{h(plan.totals.hours)}</b><small>{t('riding')}</small></span>
          <span><Cookie size={18} aria-hidden="true" /><b class="num">{g(plan.totals.carbs)}</b><small>{t('carbohydrates')}</small></span>
          <span><Droplet size={18} aria-hidden="true" /><b class="num">{l(plan.totals.waterL)}</b><small>{t('water')}</small></span>
          {#if used}<span data-fuel-kcal><Flame size={18} aria-hidden="true" /><b class="num">{num(used.burn)}</b><small>{t('kcal used, about')}</small></span>{/if}
        </div>
        {#if v.view === 'products'}<p class="note" data-fuel-pack>{t('In all: {list}', { list: packText(plan.totals.carbs) })}</p>{/if}
        <p class="note">{t('{km} km, {n} h riding a day with your pace; water {a}–{b} l per hour by temperature and climbing. Your bottles hold {cap}.', { km: kmOf(totalKm), n: num(rideH), a: num(v.coolLh), b: num(v.hotLh), cap: l(plan.capacityL) })}{#if plan.guessedTemp}{' '}{t('No forecast for some parts yet: 20 °C assumed there.')}{/if}{#if !trip.startDate}{' '}{t('Without a start day the app cannot check the weather and the opening hours.')}{/if}</p>
      {:else if plain}
        <div class="sum">
          <span><Clock size={18} aria-hidden="true" /><b class="num">{h(plain.hours)}</b><small>{t('riding')}</small></span>
          <span><Cookie size={18} aria-hidden="true" /><b class="num">{carbsText(Math.round((plain.hours * v.carbsGh) / 5) * 5)}</b><small>{t('carbohydrates')}</small></span>
        </div>
        <p class="note">{t('This trip has no route yet. With a GPX route the app splits it into sections between shops and adds water.')} <button type="button" class="text-button" onclick={() => { openTrip(trip.id); location.hash = '#/pack'; }}>{t('Add GPX route')}</button></p>
      {/if}
    </section>

    {#if plan?.sections.length}
      <section class="box" aria-labelledby="fu-sec">
        <h2 id="fu-sec" class="title">{t('Sections|fuel')} <small class="num">{plan.sections.length}</small></h2>
        <p class="note">{t('A section ends at the farthest shop you reach within about {n} h, open when you get there. Fountains on the way refill your water.', { n: num(v.stopH) })}</p>
        <ol class="secs">
          {#each plan.sections as s (s.n)}
            <li class="sec" data-fuel-section={s.n} class:warn={s.warn.length}>
              <div class="fu-head">
                <b class="num">km {kmOf(s.fromKm)} → {kmOf(s.toKm)}</b>
                <span>{placeName(s.from, false)} → {placeName(s.to, true)}{#if s.to?.state?.closes}{' '}<small>({t('open until {time}', { time: s.to.state.closes })})</small>{/if}</span>
                <small class="num">{h(s.hours)}{#if s.leaveMs}{' '}· {when(s.leaveMs)} → {when(s.arriveMs)}{/if}{#if s.temp != null}{' '}· {s.temp} °C{/if}</small>
              </div>
              <p class="line"><Cookie size={16} aria-hidden="true" /><span>{t('Eat: {what}', { what: carbsText(s.carbs) })}</span></p>
              <p class="line"><Droplet size={16} aria-hidden="true" /><span>{t('Drink: {l} ({lh} per hour).', { l: l(s.waterL), lh: l(s.waterLh) })} {s.waterStops ? tn(s.waterStops, 'Carry {c} to the first of {n} water stop on the way.', 'Carry {c} to the first of {n} water stops on the way.', { c: l(s.carryL) }) : t('No water on the way: carry {c}.', { c: l(s.carryL) })}</span></p>
              {#if s.warn.length}
                <ul class="warns">
                  {#if s.warn.includes('bottles')}<li data-warn="bottles"><TriangleAlert size={16} aria-hidden="true" />{t('Your bottles are too small: km {a}–{b} needs {need}, they hold {cap}. Take one more bottle or look for a fountain.', { a: kmOf(s.maxDry.fromKm), b: kmOf(s.maxDry.toKm), need: l(s.maxDry.l), cap: l(plan.capacityL) })}</li>{/if}
                  {#if s.warn.includes('noshop')}<li data-warn="noshop"><TriangleAlert size={16} aria-hidden="true" />{t('The app knows no shop along this route yet: carry everything, or search the places along the route below.')}</li>{/if}
                  {#if s.warn.includes('long')}<li data-warn="long"><TriangleAlert size={16} aria-hidden="true" />{t('Long gap: {n} without an open shop.', { n: h(s.hours) })}</li>{/if}
                  {#each s.closed as c (c.id ?? `${c.km}-${c.name}`)}
                    <li data-warn="closed"><TriangleAlert size={16} aria-hidden="true" />{c.opens ? t('{name} (km {km}) is closed when you get there, opens {opens}. Buy enough before it, up to km {to}: {what}.', { name: shopName(c), km: kmOf(c.km), opens: c.opens, to: kmOf(s.toKm), what: carbsText(s.carbs) }) : t('{name} (km {km}) is closed when you get there. Buy enough before it, up to km {to}: {what}.', { name: shopName(c), km: kmOf(c.km), to: kmOf(s.toKm), what: carbsText(s.carbs) })}</li>
                  {/each}
                  {#if s.warn.includes('unknown')}<li data-warn="unknown"><TriangleAlert size={16} aria-hidden="true" />{t('Opening hours of {name} unknown: check on the spot.', { name: placeName(s.to, true) })}</li>{/if}
                  {#if s.warn.includes('night')}<li data-warn="night"><TriangleAlert size={16} aria-hidden="true" />{t('A night lies in this section: buy breakfast and food for the morning too.')}</li>{/if}
                </ul>
              {/if}
            </li>
          {/each}
        </ol>
      </section>
    {/if}

    {#if route?.line?.length > 1}
      <section class="box" aria-labelledby="fu-poi">
        <h2 id="fu-poi" class="title">{t('Places along the route')}</h2>
        {#if source.full}
          <p class="note" data-fuel-places={source.count}>{tn(source.count, '{n} place along the route is kept: shops, petrol stations, restaurants and water count, with their opening hours.', '{n} places along the route are kept: shops, petrol stations, restaurants and water count, with their opening hours.', { n: num(source.count) })}</p>
        {:else}
          <p class="note">{t('Search once for shops, bakeries, petrol stations, restaurants and water along the whole route; afterwards they are there offline too.')}</p>
        {/if}
        {#if keeping}
          <p class="note" aria-live="polite">{keeping.total ? t('Keeping places along the route: part {done} of {total} …|poi', keeping) : t('Keeping places along the route …|poi')}</p>
        {:else}
          <div class="acts">
            <button type="button" class="btn" onclick={keepPlaces} data-fuel-keep>{source.full ? t('Load again') : t('Search places along the route')}</button>
            <a class="btn" href={`#/live/${encodeURIComponent(trip.id)}`}>{t('Show all kinds on the map')}</a>
          </div>
        {/if}
        {#if keepFailed}<p class="err" role="alert">{t('The places along the route could not be kept now (OpenStreetMap busy). Keep the strip again later.|poi')}</p>{/if}
        <p class="note">{t('On the map you choose every kind: camping, hotels, stations, WC, bike shops and more.')}</p>
        {#if source.pois.length}<GpxStops {route} points={gpxPoints} name={trip.title} />{/if}
      </section>
    {/if}
  {/if}

  <section class="box" aria-labelledby="fu-own">
    <h2 id="fu-own" class="title">{t('Your values')}</h2>
    <Fold label={t('Eat and drink')} summary={t('{g} per hour · {a}–{b} l per hour', { g: g(v.carbsGh), a: num(v.coolLh), b: num(v.hotLh) })}>
      <div class="grid">
        <label class="fld"><span>{t('Carbohydrates per hour (g)')}</span><input class="num" type="number" min={LIMITS.carbsGh[0]} max={LIMITS.carbsGh[1]} step="5" inputmode="numeric" value={v.carbsGh} onchange={(e) => setVal('carbsGh', e.currentTarget.value)} data-fuel-val="carbsGh" /></label>
        <label class="fld"><span>{t('Water per hour when cool (l)')}</span><input class="num" type="number" min="0" max="3" step="0.1" inputmode="decimal" value={v.coolLh} onchange={(e) => setVal('coolLh', e.currentTarget.value)} data-fuel-val="coolLh" /></label>
        <label class="fld"><span>{t('Water per hour when hot (l)')}</span><input class="num" type="number" min="0" max="4" step="0.1" inputmode="decimal" value={v.hotLh} onchange={(e) => setVal('hotLh', e.currentTarget.value)} data-fuel-val="hotLh" /></label>
        <label class="fld"><span>{t('Cool up to (°C)')}</span><input class="num" type="number" min="-20" max="40" step="1" inputmode="numeric" value={v.coolC} onchange={(e) => setVal('coolC', e.currentTarget.value)} /></label>
        <label class="fld"><span>{t('Hot from (°C)')}</span><input class="num" type="number" min="0" max="50" step="1" inputmode="numeric" value={v.hotC} onchange={(e) => setVal('hotC', e.currentTarget.value)} /></label>
      </div>
      <p class="note">{t('Between cool and hot the water grows with the temperature. Steep climbing adds up to half the difference.')}</p>
    </Fold>
    <Fold label={t('Bottles and stops')} summary={t('{n} × {l} · a stop about every {h}', { n: num(v.bottles), l: l(v.bottleL), h: h(v.stopH) })}>
      <div class="grid">
        <label class="fld"><span>{t('Bottles')}</span><input class="num" type="number" min="0" max="10" step="1" inputmode="numeric" value={v.bottles} onchange={(e) => setVal('bottles', e.currentTarget.value)} data-fuel-val="bottles" /></label>
        <label class="fld"><span>{t('Litres per bottle')}</span><input class="num" type="number" min="0.1" max="3" step="0.05" inputmode="decimal" value={v.bottleL} onchange={(e) => setVal('bottleL', e.currentTarget.value)} /></label>
        <label class="fld"><span>{t('A stop about every (h)')}</span><input class="num" type="number" min="0.5" max="24" step="0.5" inputmode="decimal" value={v.stopH} onchange={(e) => setVal('stopH', e.currentTarget.value)} /></label>
        <label class="fld"><span>{t('Start time (hour)')}</span><input class="num" type="number" min="0" max="23" step="0.5" inputmode="decimal" value={v.startHour} onchange={(e) => setVal('startHour', e.currentTarget.value)} /></label>
      </div>
    </Fold>
    {#if tripOwn}<p class="note" data-fuel-own-note>{t('You are changing the numbers of «{name}» only.', { name: trip.title || t('Trip') })}</p>
    {:else if setting && Object.keys(setting).some((k) => k in LIMITS)}<button type="button" class="text-button" onclick={resetValues}>{t('Back to the standard values')}</button>{/if}
  </section>

  <section class="box" aria-labelledby="fu-prod">
    <h2 id="fu-prod" class="title">{t('Your products')} <small class="num">{products.length}</small></h2>
    <p class="note">{t('With «My products» the plan says how many of each to take. Ticked ones are used, in turn. Change the name or the grams right in the row.')}</p>
    {#if products.length}
      <ul class="prods" use:sortable={{ onmove }} data-fuel-products>
        {#each products as p, i (p.id)}
          <li data-sort-id={p.id} data-product={p.id}>
            <SortGrip name={nameOf(p)} onstep={(dir) => step(i, dir)} />
            <input type="checkbox" checked={p.on !== false} aria-label={t('Use {name}', { name: nameOf(p) })} onchange={(e) => changeProduct(p.id, { on: e.currentTarget.checked })} />
            <input class="pn" type="text" maxlength="60" value={nameOf(p)} aria-label={t('Name')} onchange={(e) => rename(p, e.currentTarget.value)} />
            <label class="pg"><input class="num" type="number" min="0" max="500" step="1" inputmode="numeric" value={p.carbs} aria-label={t('Carbohydrates of {name} (g)', { name: nameOf(p) })} onchange={(e) => setCarbs(p, e.currentTarget.value)} /><span>g</span></label>
            {#if !phone.matches}<SortArrows name={nameOf(p)} {i} n={products.length} onstep={(dir) => step(i, dir)} />{/if}
            <button type="button" class="icon" aria-label={t('Delete {name}', { name: nameOf(p) })} onclick={() => removeProduct(p)}><Trash2 size={18} aria-hidden="true" /></button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="note">{t('No products. Add the ones you like to eat on the bike.')}</p>
    {/if}
    <form class="add" onsubmit={addProduct}>
      <input type="text" maxlength="60" bind:value={newName} placeholder={t('e.g. rice cake')} aria-label={t('New product')} data-fuel-new />
      <label class="pg"><input class="num" type="number" min="0" max="500" step="1" inputmode="numeric" bind:value={newCarbs} aria-label={t('Carbohydrates (g)')} /><span>g</span></label>
      <button type="submit" class="btn"><Plus size={16} aria-hidden="true" />{t('Add')}</button>
    </form>
  </section>
</div>

<style>
  .tosw {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
  }
  .tosw input {
    margin-top: 3px;
  }
  .tosw small {
    display: block;
    color: var(--ink-3);
  }
  .tod {
    margin: 0;
    padding-left: 18px;
  }
  .tod small {
    color: var(--ink-3);
  }
  .fuel {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
  .intro {
    margin: 0;
    color: var(--ink-2);
    max-width: 70ch;
  }
  .box {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    min-width: 0;
    gap: 10px;
    align-content: start;
    padding: 16px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  h2.title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: var(--fs-sub);
  }
  h2 small {
    color: var(--ink-2);
    font-weight: 500;
  }
  .grid {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    padding-bottom: 10px;
  }
  .fld {
    display: grid;
    min-width: 0;
    gap: 4px;
    font-size: var(--fs-small);
  }
  .fld select,
  .fld input,
  .prods input[type='text'],
  .pg input,
  .add input[type='text'] {
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--input);
    color: var(--ink);
    font: inherit;
    padding: 0 8px;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }
  .note,
  .err {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .err {
    color: var(--warn);
  }
  .sum {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 8px;
  }
  .sum span {
    display: grid;
    justify-items: start;
    gap: 2px;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    min-width: 0;
    overflow-wrap: break-word;
  }
  .sum :global(svg) {
    color: var(--accent);
  }
  .sum b {
    font-size: var(--fs-sub);
  }
  .sum small,
  .fu-head small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .secs {
    display: grid;
    gap: 10px;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .sec {
    display: grid;
    gap: 6px;
    min-width: 0;
    padding: 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    overflow-wrap: break-word;
  }
  .fu-head {
    display: grid;
    gap: 2px;
  }
  .line {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
  }
  .line :global(svg),
  .warns :global(svg) {
    flex: none;
    margin-top: 3px;
  }
  .line :global(svg) {
    color: var(--accent);
  }
  .warns {
    display: grid;
    gap: 4px;
    list-style: none;
    margin: 0;
    padding: 0;
    font-size: var(--fs-small);
  }
  .warns li {
    display: flex;
    gap: 8px;
  }
  .warns :global(svg) {
    color: var(--warn);
  }
  .prods {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .prods li {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 52px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .prods input[type='checkbox'] {
    width: 22px;
    height: 22px;
    flex: none;
  }
  .pn {
    flex: 1;
  }
  .pn {
    min-width: 0;
  }
  .pg {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: none;
    width: 76px;
  }
  .pg input {
    padding: 0 6px;
  }
  .icon {
    display: grid;
    place-items: center;
    flex: none;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .add {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .add input[type='text'] {
    flex: 1 1 160px;
    width: auto;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .text-button {
    justify-self: start;
    min-height: 44px;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
  }
</style>
