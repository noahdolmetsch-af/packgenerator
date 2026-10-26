<script>
  /**
   * Paket Y «Planen» (Noah 20.10.2026 «1a», Landi «unbedingt überall»): the weather of a planned trip on its
   * Plan page, from the one core. Within the forecast (16 days): the trip day in one line and the best start
   * time for its riding hours (1a, a suggestion), warnings like afternoon thunderstorms, the snow line when
   * the route goes high (4a; avalanches only as the SLF bulletin), and the dark at the end. Without a date
   * or later: the best day of the next 7. «Landi-Regenradar», «Webcams» (bergfex) and «Mehr Wetter».
   * Packen: what to wear and take from the riding hours (packHints). RouteCard mounts it with one line; «Hide» folds it.
   */
  import { liveQuery } from 'dexie';
  import { CloudRain, Wind, TriangleAlert, Target, Mountain, Moon, ExternalLink, ChevronRight, Shirt, Flame } from '@lucide/svelte';
  import { db } from '../db.js';
  import { HOME_PLACE } from '../know.js';
  import { ridingHours } from '../route.js';
  import { compass } from '../toursky.js';
  import { loadCore, hoursBetween, dayLine, warningsOf, bestWindows, snowOnRoute, routeTop, packHints, PACK_TEXT, darkAfter, atLocal, localDate, costWord, COST_WORD, WARN_TEXT, LANDI_RADAR } from './kern.js';
  import { BERGFEX } from './webcams.js';
  import { FEEL_KEY, FEEL_TEXT, PART_TEXT, feelsOf, feelHints } from './gefuehl.js';
  import { FUEL_KEY, fuelForTrip } from '../fuel.js';
  import { RIDER_KEY } from '../weight.js';
  import { energyFor, riderKg } from '../energie.js';
  import { t, num, locale } from '../i18n.svelte.js';

  let { trip } = $props();
  const homeQ = liveQuery(() => db.settings.get(HOME_PLACE));
  const feelQ = liveQuery(() => db.settings.get(FEEL_KEY));
  const fuelQ = liveQuery(() => db.settings.get(FUEL_KEY));
  const kgQ = liveQuery(() => db.settings.get(RIDER_KEY));
  const place = $derived.by(() => {
    const p = trip?.place ?? trip?.route?.start ?? null;
    if (p && Number.isFinite(Number(p.lat))) return { lat: Number(p.lat), lon: Number(p.lon), name: p.name ?? '' };
    return $homeQ?.value ?? null;
  });
  let open = $state(true);
  let core = $state(null);
  let key = '';
  $effect(() => {
    const k = place ? `${place.lat},${place.lon}` : '';
    if (k === key) return;
    key = k;
    core = null;
    if (place) loadCore(db, place).then((c) => k === key && (core = c)).catch(() => {});
  });

  const durH = $derived(Math.max(2, Math.min(10, Math.round(ridingHours(trip?.route, Number(trip?.days) || 1) ?? Number(trip?.hours) ?? 4) || 4)));
  const off = $derived(core?.offset ?? 0);
  const lastDay = $derived(core?.days?.at(-1)?.date ?? '');
  const inForecast = $derived(!!trip?.startDate && !!lastDay && trip.startDate >= localDate(Date.now(), off) && trip.startDate <= lastDay);
  const day = $derived(inForecast ? bestWindows(core, { durH, days: 1, fromDate: trip.startDate }).days[0] ?? null : null);
  const dayHours = $derived(inForecast && core ? hoursBetween(core, atLocal(trip.startDate, 6, off), atLocal(trip.startDate, 21, off)) : []);
  const line = $derived(dayLine(dayHours));
  const warns = $derived(day ? warningsOf(hoursBetween(core, day.start, day.end)) : []);
  const snow = $derived(dayHours.length ? snowOnRoute(dayHours, routeTop(trip?.route?.profile)) : null);
  const dark = $derived(day ? darkAfter(core, day.end) : 0);
  const wear = $derived(day ? packHints(hoursBetween(core, day.start, day.end)) : []);
  const ride = $derived(day ? dayLine(hoursBetween(core, day.start, day.end)) : null);
  const learned = $derived(ride ? feelHints(feelsOf($feelQ?.value), ride.feelsMin ?? ride.tmin) : { off: [], ok: null });
  // Paket X: the one energy rule for the riding day (km and climbing of the route, the warmest riding hour)
  const days = $derived(Math.max(1, Number(trip?.days) || 1));
  const energy = $derived(trip?.route?.km > 0 ? energyFor({ hours: durH, km: trip.route.km / days, gainM: (Number(trip.route.gainM) || 0) / days, tempC: ride?.tmax ?? null, kg: riderKg($kgQ?.value), fuel: fuelForTrip($fuelQ?.value ?? null, trip) }) : null);
  const week = $derived(core && !inForecast ? bestWindows(core, { durH, days: 7 }).best : null);

  const hm = (ms) => new Date(ms).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  const wd = (date) => new Date(`${date}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'numeric' });
</script>

{#if place && core && (line || week)}
  <section class="tw" aria-labelledby="tw-h" data-tour-wetter>
    <div class="tw-hd">
      <h3 id="tw-h">{t('Weather for this tour')}</h3>
      <button type="button" class="tw-x" aria-expanded={open} onclick={() => (open = !open)}>{open ? t('Hide') : t('Show')}</button>
    </div>
    {#if open}
      {#if line}
        <p class="tw-line">
          <span><b>{num(line.tmin)}–{num(line.tmax)} °C</b></span>
          {#if line.windMax != null}<span><Wind size={16} aria-hidden="true" />{line.dir != null ? t('{kmh} km/h from the {dir}', { kmh: num(line.windMax), dir: t(compass(line.dir)) }) : t('{kmh} km/h', { kmh: num(line.windMax) })}</span>{/if}
          <span><CloudRain size={16} aria-hidden="true" />{line.rainFrom ? t('rain from {at}', { at: hm(line.rainFrom) }) : t('dry')}</span>
        </p>
      {/if}
      {#if day}<p class="tw-best" data-tour-wetter-start><Target size={16} aria-hidden="true" />{t('Best start for {h} h riding: {from} (back about {to})', { h: num(durH), from: hm(day.start), to: hm(day.end) })} · <span class="tw-word w-{costWord(day.cost)}">{t(COST_WORD[costWord(day.cost)])}</span></p>{/if}
      {#if week}<p class="tw-best" data-tour-wetter-week><Target size={16} aria-hidden="true" />{t('Best day in the next week: {day}, from {from}', { day: wd(week.date), from: hm(week.start) })}</p>{/if}
      {#if wear.length}<p class="tw-note" data-tour-wetter-pack><Shirt size={16} aria-hidden="true" />{t('Pack: {list}', { list: wear.map((w) => t(PACK_TEXT[w.key])).join(', ') })}</p>{/if}
      {#if energy}<p class="tw-note" data-tour-energy><Flame size={16} aria-hidden="true" />{t('Per riding day about {kcal} kcal used: eat about {g} g carbohydrates, drink about {l} L.', { kcal: num(energy.burn), g: num(energy.carbsG), l: num(energy.waterL) })} <a href="#/trips/fuel">{t('Food and water|fuel')}</a></p>{/if}
      {#each learned.off as x (x.id)}<p class="tw-note" data-tour-wetter-feel>{x.parts.length ? t('Last time at {c} °C: {feel} ({parts}).', { c: num(x.tmin), feel: t(FEEL_TEXT[x.feel]), parts: x.parts.map((p) => t(PART_TEXT[p])).join(', ') }) : t('Last time at {c} °C: {feel}.', { c: num(x.tmin), feel: t(FEEL_TEXT[x.feel]) })}{x.wore ? ` · ${x.wore}` : ''}</p>{/each}
      {#if learned.ok}<p class="tw-note" data-tour-wetter-feel>{t('Just right at {c} °C with: {wore}.', { c: num(learned.ok.tmin), wore: learned.ok.wore })}</p>{/if}
      {#each warns as w (w.kind)}<p class="tw-warn"><TriangleAlert size={16} aria-hidden="true" />{t(WARN_TEXT[w.kind], { at: hm(w.at), v: num(w.value) })}</p>{/each}
      {#if snow}<p class="tw-note" data-tour-wetter-snow><Mountain size={16} aria-hidden="true" />{snow.top != null ? t('Snow line about {line} m; your route goes up to {top} m.', { line: num(snow.line), top: num(snow.top) }) : t('Snow line about {line} m.', { line: num(snow.line) })}{#if snow.depthCm}{' '}{t('{cm} cm of snow lie there.', { cm: num(snow.depthCm) })}{/if} <a href="https://www.slf.ch/de/lawinenbulletin-und-schneesituation/" target="_blank" rel="noopener noreferrer">{t('SLF bulletin')}</a></p>{/if}
      {#if dark}<p class="tw-note"><Moon size={16} aria-hidden="true" />{t('Back {n} min after sunset: lights on.', { n: num(dark) })}</p>{/if}
      <div class="tw-acts">
        <a class="btn sm" href={LANDI_RADAR} target="_blank" rel="noopener noreferrer" data-landi><CloudRain size={16} aria-hidden="true" />{t('Landi rain radar')}<ExternalLink size={14} aria-hidden="true" /></a>
        <a class="btn sm" href={BERGFEX} target="_blank" rel="noopener noreferrer">{t('Webcams')}<ExternalLink size={14} aria-hidden="true" /></a>
        <a class="btn sm" href={`#/wetter?trip=${encodeURIComponent(trip.id)}`}>{t('More weather')}<ChevronRight size={14} aria-hidden="true" /></a>
      </div>
    {/if}
  </section>
{/if}

<style>
  .tw {
    display: grid;
    gap: 6px;
    padding-top: 8px;
    border-top: 1px solid var(--line);
  }
  .tw-hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .tw-hd h3 {
    margin: 0;
    font: 600 var(--fs-body) var(--font-body);
  }
  .tw-x {
    min-height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
    font: 500 var(--fs-small) var(--font-body);
  }
  .tw-line,
  .tw-best,
  .tw-warn,
  .tw-note {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
    overflow-wrap: break-word;
  }
  .tw-line span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .tw-warn {
    color: var(--bad);
  }
  .tw-word {
    font-size: var(--fs-small);
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--paper-2);
  }
  .w-good {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .w-poor {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .w-bad {
    background: var(--bad-soft);
    color: var(--bad);
  }
  .tw-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
</style>
