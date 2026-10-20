<script>
  /**
   * Paket Y on Heute (Noah 20.10.2026 «1b» wind line, «1a» home cam): one calm line about the weather when a
   * ride is planned today (a trip on today): low–high, wind and where from (and which way round a loop
   * gives the tailwind home), the first warning, and «Radar» (the Landi rain radar) when rain comes within
   * 3 hours. Under it the home webcam as a small picture, only when one is set (Meine Webcams).
   * Then the lake chip (Seetemperatur thread) when it has a value. Nothing shows without any of them. Tap → the weather page.
   * Home.svelte mounts it with one line (owner: «Heute neu gestalten»).
   */
  import { liveQuery } from 'dexie';
  import { Wind, CloudRain, TriangleAlert } from '@lucide/svelte';
  import { db } from '../db.js';
  import { HOME_PLACE } from '../know.js';
  import { onTripDay } from '../ride.js';
  import { compass, intoWind } from '../toursky.js';
  import { loadCore, hoursBetween, dayLine, warningsOf, rainWithin, localDate, atLocal, WARN_TEXT, LANDI_RADAR } from './kern.js';
  import { WEBCAMS_KEY, camsOf, homeCam, isImage, freshSrc, camLabel } from './webcams.js';
  import LakeChip from '../lake/LakeChip.svelte';
  import { t, num, locale } from '../i18n.svelte.js';

  let { today } = $props();
  const tripsQ = liveQuery(() => db.trips.toArray());
  const homeQ = liveQuery(() => db.settings.get(HOME_PLACE));
  const camsQ = liveQuery(() => db.settings.get(WEBCAMS_KEY));

  const trip = $derived(($tripsQ ?? []).filter((tr) => !tr.skipped && onTripDay(tr, today)).sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))[0] ?? null);
  const place = $derived.by(() => {
    const s = trip?.route?.start;
    if (s && Number.isFinite(Number(s.lat))) return { lat: Number(s.lat), lon: Number(s.lon) };
    return trip ? ($homeQ?.value ?? null) : null;
  });
  const cam = $derived(homeCam(camsOf($camsQ?.value)));

  let core = $state(null);
  let key = '';
  $effect(() => {
    const k = place ? `${place.lat},${place.lon}` : '';
    if (k === key) return;
    key = k;
    core = null;
    if (place) loadCore(db, place).then((c) => k === key && (core = c)).catch(() => {});
  });
  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 5 * 60_000);
    return () => clearInterval(id);
  });

  const off = $derived(core?.offset ?? 0);
  const hours = $derived(core ? hoursBetween(core, Math.max(now - 36e5, atLocal(localDate(now, off), 6, off)), atLocal(localDate(now, off), 21, off)) : []);
  const line = $derived(dayLine(hours));
  const warn = $derived(warningsOf(hours)[0] ?? null);
  const rainSoon = $derived(core ? rainWithin(core, now, 3) : null);
  // a loop: which way round gives the tailwind home (the wind of the day, as on the packing list)
  const loopTip = $derived.by(() => {
    const l = trip?.route?.line;
    if (!line || line.dir == null || (line.windMax ?? 0) < 12 || !l || l.length < 4) return null;
    const a = l[0];
    const b = l.at(-1);
    if (Math.abs(a[0] - b[0]) > 0.015 || Math.abs(a[1] - b[1]) > 0.02) return null;
    const w = intoWind(l, line.dir);
    if (w.total < 5) return null;
    return w.last <= -w.first ? 'keep' : 'reverse';
  });
  const hm = (ms) => new Date(ms).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  const href = $derived(trip ? `#/wetter?trip=${encodeURIComponent(trip.id)}` : '#/wetter');
</script>

<section class="hw-wx" aria-label={t('Weather')} data-heute-wetter>
    {#if trip && line}
      <a class="hw-line" {href} data-heute-wetter-line>
        <span><b>{num(line.tmin)}–{num(line.tmax)} °C</b></span>
        {#if line.windMax != null}<span><Wind size={16} aria-hidden="true" />{line.dir != null ? t('{kmh} km/h from the {dir}', { kmh: num(line.windMax), dir: t(compass(line.dir)) }) : t('{kmh} km/h', { kmh: num(line.windMax) })}</span>{/if}
        <span><CloudRain size={16} aria-hidden="true" />{line.rainFrom ? t('rain from {at}', { at: hm(line.rainFrom) }) : t('dry')}</span>
        {#if loopTip}<span class="hw-tip" data-heute-wetter-wind>{loopTip === 'keep' ? t('Ride the loop as planned: tailwind home.') : t('Ride the loop the other way: tailwind home.')}</span>{/if}
        {#if warn}<span class="hw-warn"><TriangleAlert size={16} aria-hidden="true" />{t(WARN_TEXT[warn.kind], { at: hm(warn.at), v: num(warn.value) })}</span>{/if}
      </a>
      {#if rainSoon}<a class="btn sm hw-radar" href={LANDI_RADAR} target="_blank" rel="noopener noreferrer" data-heute-radar><CloudRain size={16} aria-hidden="true" />{t('Radar')}</a>{/if}
    {/if}
    {#if cam}
      <a class="hw-cam" href={cam.url} target="_blank" rel="noopener noreferrer" data-heute-cam>
        {#if isImage(cam.url)}<img src={freshSrc(cam.url, now)} alt={t('Webcam {name}', { name: camLabel(cam) })} loading="lazy" referrerpolicy="no-referrer" />{/if}
        <small>{camLabel(cam)}</small>
      </a>
    {/if}
    <!-- the lake (thread «Seetemperatur und Sauna»): shows itself only with a value -->
    <LakeChip />
  </section>

<style>
  /* nothing to show (no ride, no home cam, no lake value): no empty space either */
  .hw-wx:not(:has(a, img)) {
    display: none;
  }
  .hw-wx {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin: 0 0 12px;
  }
  .hw-line {
    flex: 1 1 260px;
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    color: var(--ink);
    text-decoration: none;
    font-size: var(--fs-small);
  }
  .hw-line span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .hw-tip {
    color: var(--ink-2);
  }
  .hw-warn {
    color: var(--bad);
  }
  .hw-cam {
    display: grid;
    gap: 2px;
    width: 120px;
    color: var(--ink-2);
    text-decoration: none;
  }
  .hw-cam img {
    width: 120px;
    height: 68px;
    object-fit: cover;
    border-radius: 6px;
    background: var(--paper-2);
  }
  .hw-cam small {
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
</style>
