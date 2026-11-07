<script>
  /**
   * «Sonnen-Ausfahrt» on Today (Noah 06.11.2026 «1-5a», variant A): on a day with fog and sun above it, a card under the
   * fog line suggests one of your saved rides that climbs above the fog, with the latest start, the km where the sun
   * begins and when the fog clears. «Other ride» goes through the rides, «Not today» puts it aside for the day.
   * With sun above but no ride of yours reaching it, the card says so and leads to the trips. It shows only with sun
   * above the fog, your place in the fog and a fog that holds 2 more hours; it is switched off on the weather page
   * (setting 'sunRide'). A guess, and the card says so. HeuteWetter mounts it with one line, under the fog line.
   * Step C (Noah «3a»), quiet: with Fitbit values the card adds the week line (zone minutes against the weekly goal);
   * when last night's sleep was clearly under your normal it also shows the shortest ride above the fog next to the
   * first. No advice, no cause; «Performance tips» (Me › Look › Suggestions) switches both off. Rules: sonnenrest.js.
   * Step D (Noah «4a»): «Remember today» keeps the day as a fog sea day on the Sammel-Wand (you say you were up there,
   * the app does not guess it); once kept, the card says so and leads to the shelf. Rules: sammlung/nebelmeer.js.
   */
  import { liveQuery } from 'dexie';
  import { Sun, Camera } from '@lucide/svelte';
  import { db } from '../db.js';
  import { HOME_PLACE } from '../know.js';
  import { openTrip } from '../nav.js';
  import { REFRESHED } from '../home/refresh.js';
  import { OWN_KEY } from './schneegrenze.js';
  import { summary } from './nebelgrenze.js';
  import { loadProfil } from './profil.js';
  import { localDate } from './kern.js';
  import { WEBCAMS_KEY, camsOf, homeCam, BERGFEX } from './webcams.js';
  import { KEY, SKIP_KEY, suggest, clock } from './sonnenfahrt.js';
  import { weakSleep, weekLine, shorter, hours } from './sonnenrest.js';
  import { AZM_WEEK_KEY } from '../health.js';
  import { suggest as areas, watchSuggest } from '../clear/suggest.svelte.js';
  import { KEY as FOG_KEY, daysOf, valueOf, hasDay, addDay } from '../sammlung/nebelmeer.js';
  import { t, num } from '../i18n.svelte.js';

  const homeQ = liveQuery(() => db.settings.get(HOME_PLACE));
  const ownQ = liveQuery(() => db.settings.get(OWN_KEY));
  const onQ = liveQuery(() => db.settings.get(KEY));
  const skipQ = liveQuery(() => db.settings.get(SKIP_KEY));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const camsQ = liveQuery(() => db.settings.get(WEBCAMS_KEY));
  const healthQ = liveQuery(() => db.healthDays.toArray());
  const goalQ = liveQuery(() => db.settings.get(AZM_WEEK_KEY));
  const fogQ = liveQuery(() => db.settings.get(FOG_KEY));
  watchSuggest();

  const home = $derived($homeQ?.value && Number.isFinite(Number($homeQ.value.lat)) ? { lat: Number($homeQ.value.lat), lon: Number($homeQ.value.lon) } : null);
  let fog = $state(null);
  let key = '';
  const read = (pl, k) => loadProfil(db, pl).then((f) => (k == null || k === key) && (fog = f)).catch(() => {});
  $effect(() => {
    const k = home ? `${home.lat},${home.lon}` : '';
    if (k === key) return;
    key = k;
    fog = null;
    if (home) read(home, k);
  });
  $effect(() => {
    const again = () => home && read(home, null);
    globalThis.addEventListener(REFRESHED, again);
    return () => globalThis.removeEventListener(REFRESHED, again);
  });
  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 5 * 60_000);
    return () => clearInterval(id);
  });

  const off = $derived(fog?.offset ?? 0);
  const day = $derived(localDate(now, off));
  const on = $derived($onQ?.value !== false && $skipQ?.value?.day !== day);
  const s = $derived(fog ? summary(fog, now, $ownQ?.value) : null);
  const sug = $derived(on && s && home ? suggest({ s, now, offset: off, trips: $tripsQ ?? [], home }) : null);
  let pick = $state(0);
  const ride = $derived(sug?.kind === 'rides' ? sug.list[pick % sug.list.length] : null);
  const cam = $derived(homeCam(camsOf($camsQ?.value)));
  const quiet = $derived(areas.on.performance && ride && $healthQ ? { week: weekLine($healthQ, day, $goalQ?.value), short: weakSleep($healthQ, day) ? shorter(sug.list, ride) : null } : null);

  const open = () => {
    openTrip(ride.id);
    location.hash = '#/pack';
  };
  const skip = () => db.settings.put({ key: SKIP_KEY, value: { day } });
  const kept = $derived(hasDay(daysOf($fogQ?.value), day));
  const remember = () => db.settings.put({ key: FOG_KEY, value: valueOf(addDay(daysOf($fogQ?.value), { date: day, title: ride.title, topM: s?.now?.top, tripId: ride.id })) });
</script>

{#if sug}
  <section class="hs" aria-label={t('Sun above the fog')} data-heute-sonne={sug.kind}>
    <h3 class="hs-h"><Sun size={16} aria-hidden="true" />{t('Sun above the fog')}</h3>
    {#if ride}
      <p class="hs-name" data-heute-sonne-name><b>{ride.title}</b></p>
      <p class="hs-sub">{t('{km} km · {gain} m climb · highest point {m} m', { km: num(ride.km), gain: num(ride.gainM), m: num(ride.topM) })}</p>
      <p class="hs-sub" data-heute-sonne-when>
        {#if ride.lastStartMin != null}
          {t('Start by {at}. From km {km} you ride in the sun, about {sun}.', { at: clock(ride.lastStartMin), km: num(ride.aboveKm), sun: clock(ride.startMin + ride.toSunMin) })}
        {:else}
          {t('The fog stays today. Start at {at} and from km {km} you ride in the sun, about {sun}.', { at: clock(ride.startMin), km: num(ride.aboveKm), sun: clock(ride.startMin + ride.toSunMin) })}
        {/if}
        {#if sug.clearsAt != null}{' '}{t('The fog clears around {h} h', { h: num(sug.clearsAt) })}.{/if}
      </p>
      {#if quiet?.week}
        <p class="hs-sub" data-heute-sonne-week>{quiet.week.reached ? t('Active zone minutes this week: {sum} of {of}. The weekly goal is reached.', { sum: num(quiet.week.sum), of: num(quiet.week.of) }) : t('Active zone minutes this week: {sum} of {of}.', { sum: num(quiet.week.sum), of: num(quiet.week.of) })}</p>
      {/if}
      {#if quiet?.short}
        <p class="hs-sub" data-heute-sonne-short>{t('Shortest ride above the fog: {title}, {km} km, about {time} h.', { title: quiet.short.ride.title, km: num(quiet.short.ride.km), time: hours(quiet.short.ride.totalMin) })} <button type="button" class="btn btn-link sm" onclick={() => (pick = quiet.short.index)} data-heute-sonne-short-show>{t('Show this ride')}</button></p>
      {/if}
      <div class="hs-btns">
        <button type="button" class="btn sm hi" onclick={open} data-heute-sonne-open>{t('Open ride')}</button>
        <a class="btn sm" href={cam?.url ?? BERGFEX} target="_blank" rel="noopener noreferrer" data-heute-sonne-cam><Camera size={16} aria-hidden="true" />{t('See it on a webcam')}</a>
        {#if sug.list.length > 1}<button type="button" class="btn sm" onclick={() => (pick = (pick + 1) % sug.list.length)} data-heute-sonne-next>{t('Other ride')}</button>{/if}
        {#if !kept}<button type="button" class="btn sm" onclick={remember} data-heute-sonne-keep>{t('Remember today')}</button>{/if}
        <button type="button" class="btn sm" onclick={skip} data-heute-sonne-skip>{t('Not today')}</button>
      </div>
      {#if kept}
        <p class="hs-sub" data-heute-sonne-kept>{t('Today is kept as a fog sea day.')} <a href="#/debrief/sammlung">{t('Open the collection wall')}</a></p>
      {/if}
    {:else}
      <p class="hs-sub" data-heute-sonne-none>{t('The sun shines above the fog, but none of your saved rides near home reaches up there.')}</p>
      <div class="hs-btns">
        <a class="btn sm hi" href="#/pack" data-heute-sonne-plan>{t('Plan a ride')}</a>
        <button type="button" class="btn sm" onclick={skip} data-heute-sonne-skip>{t('Not today')}</button>
      </div>
    {/if}
    <p class="hs-src">{t('A guess from the fog line and your route. A webcam shows how it really is.')}</p>
  </section>
{/if}

<style>
  .hs {
    flex: 1 1 100%;
    display: grid;
    gap: 6px;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: var(--warn-soft);
    color: var(--ink);
    font-size: var(--fs-small);
  }
  .hs-h {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: var(--fs-body);
  }
  .hs-name,
  .hs-sub,
  .hs-src {
    margin: 0;
  }
  .hs-sub {
    color: var(--ink-2);
  }
  .hs-src {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hs-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
