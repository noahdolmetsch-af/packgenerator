<script>
  /**
   * Paket Y «Wetter-Kern» (#/wetter, #/wetter?trip=<id>; Noah 20.10.2026 «1-5a», «1-8 alle», «1a»): one page
   * for the weather of one place (home, a trip's start, or a place you search), from the one core
   * (wetter/kern.js). Everything is a suggestion:
   * - Heute: the day in one line, warnings (thunder, storm, ice, heat, fog, snow), Föhn or Bise,
   *   «Heute lieber Zug?» and the next good hour outside;
   * - Bestes Wetterfenster (1a): the best day and start time for a ride of 2–8 hours in the next 7 days;
   * - Regenradar: the Landi radar (Noah «unbedingt überall»), opened in a new tab, and MeteoSwiss;
   * - Orte vergleichen (extra 1), Klimawerte weit voraus (extra 2), Prognose gegen Wirklichkeit (extra 6);
   * - Meine Webcams (extra 7): add, rename, order with arrows and drag, delete with Undo; on this device only.
   */
  import { liveQuery } from 'dexie';
  import { CloudRain, Wind, TriangleAlert, Train, Sun, ExternalLink, Search, X, Plus, Camera, Mountain, CalendarDays, Target } from '@lucide/svelte';
  import PageHead from '../lib/ui/PageHead.svelte';
  import Crumbs from '../lib/ui/Crumbs.svelte';
  import { db } from '../lib/db.js';
  import { HOME_PLACE } from '../lib/know.js';
  import { searchPlace } from '../lib/weather.js';
  import { compass } from '../lib/toursky.js';
  import { loadCore, hoursBetween, dayLine, warningsOf, bestWindows, foehnBise, trainInstead, outdoorOk, localDate, atLocal, costWord, COST_WORD, WARN_TEXT, LANDI_RADAR, METEOSWISS } from '../lib/wetter/kern.js';
  import { loadClimate, climateFor } from '../lib/wetter/klima.js';
  import { SAID_KEY, noteSaid, hits } from '../lib/wetter/treffer.js';
  import WebcamList from '../lib/wetter/WebcamList.svelte';
  import FeelCard from '../lib/wetter/FeelCard.svelte';
  import LakeChip from '../lib/lake/LakeChip.svelte';
  import HomePlaceSheet from '../lib/ich/HomePlaceSheet.svelte';
  import { t, num, locale } from '../lib/i18n.svelte.js';

  const homeQ = liveQuery(() => db.settings.get(HOME_PLACE));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const saidQ = liveQuery(() => db.meta.get(SAID_KEY));

  const params = $derived(new URLSearchParams(location.hash.split('?')[1] ?? ''));
  const tripId = $derived(params.get('trip'));
  const trip = $derived(tripId ? ($tripsQ ?? []).find((x) => x.id === tripId) ?? null : null);
  let picked = $state(null); // a searched place
  let homeSheet = $state(false);
  const place = $derived.by(() => {
    if (picked) return picked;
    const s = trip?.route?.start;
    if (s && Number.isFinite(Number(s.lat))) return { lat: Number(s.lat), lon: Number(s.lon), name: trip.title ?? '' };
    return $homeQ?.value ?? null;
  });

  let core = $state(null);
  let busy = $state(false);
  let err = $state('');
  let now = $state(Date.now());
  async function load(force = false) {
    if (!place) return;
    busy = true;
    err = '';
    try {
      core = await loadCore(db, place, { force });
      if (!core) err = navigator.onLine === false ? t('Offline: no weather kept for this place yet.') : t('The weather service did not answer. Try again in a moment.');
      else if (!picked && !trip) {
        const kept = (await db.meta.get(SAID_KEY))?.value ?? {};
        await db.meta.put({ key: SAID_KEY, value: noteSaid(kept, core, Date.now()) });
      }
    } finally {
      busy = false;
      now = Date.now();
    }
  }
  let lastKey = '';
  $effect(() => {
    const k = place ? `${place.lat},${place.lon}` : '';
    if (k && k !== lastKey) {
      lastKey = k;
      load();
    }
  });

  const off = $derived(core?.offset ?? 0);
  const today = $derived(core ? localDate(now, off) : '');
  const rest = $derived(core ? hoursBetween(core, now - 36e5, atLocal(today, 24, off)) : []);
  const line = $derived(dayLine(rest));
  const warns = $derived(warningsOf(rest));
  const fb = $derived(foehnBise(rest));
  const train = $derived(core ? trainInstead(core, today) : null);
  const outside = $derived(core ? outdoorOk(core, now) : null);

  const DURS = [2, 4, 6, 8];
  let dur = $state(4);
  const windows = $derived(core ? bestWindows(core, { durH: dur, days: 7, now }) : { days: [], best: null });

  const hm = (ms) => new Date(ms).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  const wd = (date) => new Date(`${date}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'numeric' });
  const warnText = (w) => t(WARN_TEXT[w.kind], { at: hm(w.at), v: num(w.value) });
  const asOf = $derived(core?.at ? new Date(core.at).toLocaleString(locale(), { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : '');

  /* ---------- the place ---------- */
  let q = $state('');
  let found = $state([]);
  let searching = $state(false);
  async function search(e) {
    e?.preventDefault();
    searching = true;
    try {
      found = await searchPlace(q);
    } catch {
      found = [];
    } finally {
      searching = false;
    }
  }

  /* ---------- compare places (extra 1) ---------- */
  let cmp = $state([]); // [{ name, lat, lon, best, line }]
  let cq = $state('');
  let cBusy = $state(false);
  async function addCompare(e) {
    e?.preventDefault();
    if (cq.trim().length < 2 || cmp.length >= 3) return;
    cBusy = true;
    try {
      const [p] = await searchPlace(cq);
      if (p) {
        const c = await loadCore(db, p);
        const w = c ? bestWindows(c, { durH: dur, days: 7 }) : null;
        cmp = [...cmp, { ...p, best: w?.best ?? null }];
        cq = '';
      }
    } catch {
      /* the search did not answer: nothing added */
    } finally {
      cBusy = false;
    }
  }

  /* ---------- climate far ahead (extra 2) ---------- */
  let farDate = $state('');
  let clim = $state(null);
  let cErr = $state('');
  async function climate() {
    if (!place || !farDate) return;
    cErr = '';
    try {
      clim = climateFor(await loadClimate(db, place), farDate);
      if (!clim) cErr = t('No values found for this day.');
    } catch {
      clim = null;
      cErr = t('The weather archive did not answer. Try again in a moment.');
    }
  }

  const hitList = $derived(hits($saidQ?.value ?? {}).slice(0, 5));
</script>

<section class="wx" data-page="wetter">
  <Crumbs crumbs={[{ label: t('Me|place'), href: '#/me' }]} here={t('Weather')} />
  <PageHead title={t('Weather')} text={t('The weather for riding: today, the best time for a ride, the rain radar and your webcams. Everything is a suggestion.')} />

  <div class="card wx-place">
    <p class="wx-where"><b>{place?.name || t('No place yet')}</b>{#if asOf}<small>{t('As of {at}', { at: asOf })}{core?.old ? ` · ${t('older than 3 hours')}` : ''}</small>{/if}</p>
    <form class="wx-search" onsubmit={search}>
      <input class="inp" type="search" bind:value={q} placeholder={t('Another place')} aria-label={t('Another place')} data-wx-q />
      <button type="submit" class="btn sm" disabled={searching}><Search size={16} aria-hidden="true" />{t('Search')}</button>
      {#if picked}<button type="button" class="btn sm" onclick={() => ((picked = null), (found = []))}>{t('Back to home')}</button>{/if}
    </form>
    {#if found.length}
      <ul class="wx-found">
        {#each found as p, i (i)}<li><button type="button" class="btn sm" onclick={() => ((picked = p), (found = []), (q = ''))}>{p.name}<small>{p.detail}</small></button></li>{/each}
      </ul>
    {/if}
    {#if !place}<p class="rc-note">{t('Set your home place, or search a place above.')}</p>{/if}
    {#if !picked && !trip}<button type="button" class="btn sm" onclick={() => (homeSheet = true)} data-wx-home>{$homeQ?.value ? t('Change your home place') : t('Set your home place')}</button>{/if}
  </div>

  {#if err}<p class="rc-warn" role="status" data-wx-error>{err}</p>{/if}
  {#if busy && !core}<p class="rc-note">{t('Loading…')}</p>{/if}

  {#if core}
    <!-- today -->
    <section class="card wx-sec" aria-labelledby="wx-today" data-wx-today>
      <h2 id="wx-today" class="wx-h">{t('Today')}</h2>
      {#if line}
        <p class="wx-line">
          <span><Sun size={16} aria-hidden="true" />{num(line.tmin)}–{num(line.tmax)} °C</span>
          {#if line.windMax != null}<span><Wind size={16} aria-hidden="true" />{line.dir != null ? t('{kmh} km/h from the {dir}', { kmh: num(line.windMax), dir: t(compass(line.dir)) }) : t('{kmh} km/h', { kmh: num(line.windMax) })}</span>{/if}
          <span><CloudRain size={16} aria-hidden="true" />{line.rainFrom ? t('rain from {at}', { at: hm(line.rainFrom) }) : t('dry')}</span>
        </p>
      {/if}
      {#each warns as w (w.kind)}<p class="wx-warn" data-wx-warn={w.kind}><TriangleAlert size={16} aria-hidden="true" />{warnText(w)}</p>{/each}
      {#if fb}<p class="wx-note" data-wx-fb={fb}><Wind size={16} aria-hidden="true" />{fb === 'foehn' ? t('Föhn: strong, dry wind from the south. Gusty in the valleys.') : t('Bise: cold wind from the north-east. It feels colder than the number.')}</p>{/if}
      {#if train}<p class="wx-note" data-wx-train><Train size={16} aria-hidden="true" />{t('Today rather the train? On the way to and from work: {why}.', { why: train.why.map((k) => t(k === 'rain' ? 'heavy rain' : k === 'thunder' ? 'thunderstorms' : k === 'storm' ? 'storm gusts' : 'ice')).join(', ') })} <a href="https://www.sbb.ch/" target="_blank" rel="noopener noreferrer">SBB</a></p>{/if}
      {#if outside}<p class="wx-note" data-wx-outside><Sun size={16} aria-hidden="true" />{outside.now ? t('Good for outside now ({temp} °C).', { temp: num(outside.temp) }) : t('Good for outside from {at} ({temp} °C).', { at: hm(outside.at), temp: num(outside.temp) })}</p>{/if}
      <LakeChip />
      <div class="rc-acts">
        <a class="btn" href={LANDI_RADAR} target="_blank" rel="noopener noreferrer" data-landi><CloudRain size={18} aria-hidden="true" />{t('Landi rain radar')}<ExternalLink size={14} aria-hidden="true" /></a>
        <a class="btn sm" href={METEOSWISS} target="_blank" rel="noopener noreferrer">{t('MeteoSwiss')}<ExternalLink size={14} aria-hidden="true" /></a>
        <a class="btn sm" href="#/me/hinweise">{t('Warnings, avalanches, passes')}</a>
      </div>
    </section>

    <!-- 1a: the best weather window -->
    <section class="card wx-sec" aria-labelledby="wx-best" data-wx-best>
      <h2 id="wx-best" class="wx-h"><Target size={18} aria-hidden="true" />{t('Best time for a ride')}</h2>
      <div class="wx-chips" role="group" aria-label={t('How long you ride')}>
        {#each DURS as d (d)}<button type="button" class="wx-chip" aria-pressed={dur === d} onclick={() => (dur = d)} data-wx-dur={d}>{t('{n} h', { n: d })}</button>{/each}
      </div>
      {#if windows.best}
        <p class="wx-bestline" data-wx-bestline>{t('Best: {day}, {from}–{to}', { day: wd(windows.best.date), from: hm(windows.best.start), to: hm(windows.best.end) })}{#if windows.best.line}{' '}· {num(windows.best.line.tmin)}–{num(windows.best.line.tmax)} °C{/if}</p>
        <ul class="wx-days">
          {#each windows.days as d (d.date)}
            <li class:best={d === windows.best} data-wx-day={costWord(d.cost)}>
              <b>{wd(d.date)}</b>
              <span>{hm(d.start)}–{hm(d.end)}</span>
              <span class="wx-word w-{costWord(d.cost)}">{t(COST_WORD[costWord(d.cost)])}</span>
              <small>{d.line ? `${num(d.line.tmin)}–${num(d.line.tmax)} °C · ${d.line.rainFrom ? t('rain') : t('dry')}${d.line.windMax ? ` · ${num(d.line.windMax)} km/h` : ''}` : ''}{d.warnings.length ? ` · ${d.warnings.map((w) => t(w.kind === 'thunder' ? 'thunderstorms' : w.kind)).join(', ')}` : ''}</small>
            </li>
          {/each}
        </ul>
        <p class="rc-src">{t('From the forecast: rain counts most, then thunderstorms, storm and ice, then wind, cold, heat and the dark. A guide, not a promise.')}</p>
      {:else}
        <p class="rc-note">{t('No full window in the next days.')}</p>
      {/if}
    </section>

    <!-- extra 1: compare places -->
    <section class="card wx-sec" aria-labelledby="wx-cmp" data-wx-compare>
      <h2 id="wx-cmp" class="wx-h">{t('Compare places')}</h2>
      <p class="rc-note">{t('Where is the weather best for your ride? Add up to 3 places.')}</p>
      <form class="wx-search" onsubmit={addCompare}>
        <input class="inp" type="search" bind:value={cq} placeholder={t('Place|wx')} aria-label={t('Place to compare')} disabled={cmp.length >= 3} data-wx-cmpq />
        <button type="submit" class="btn sm" disabled={cBusy || cmp.length >= 3}><Plus size={16} aria-hidden="true" />{t('Add')}</button>
      </form>
      {#if cmp.length}
        <ul class="wx-days">
          {#if windows.best}<li><b>{place?.name || t('Here')}</b><span>{wd(windows.best.date)} {hm(windows.best.start)}</span><span class="wx-word w-{costWord(windows.best.cost)}">{t(COST_WORD[costWord(windows.best.cost)])}</span></li>{/if}
          {#each cmp as c, i (i)}
            <li data-wx-cmp-row>
              <b>{c.name}</b>
              <span>{c.best ? `${wd(c.best.date)} ${hm(c.best.start)}` : '–'}</span>
              {#if c.best}<span class="wx-word w-{costWord(c.best.cost)}">{t(COST_WORD[costWord(c.best.cost)])}</span>{/if}
              <button type="button" class="wx-x" aria-label={t('Remove {name}', { name: c.name })} onclick={() => (cmp = cmp.filter((_, k) => k !== i))}><X size={16} aria-hidden="true" /></button>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/if}

  {#if place}
    <!-- extra 2: climate far ahead -->
    <section class="card wx-sec" aria-labelledby="wx-clim" data-wx-climate>
      <h2 id="wx-clim" class="wx-h"><CalendarDays size={18} aria-hidden="true" />{t('Far ahead: the usual weather')}</h2>
      <p class="rc-note">{t('For a day more than 16 days away: how it was on these days in the last 10 years.')}</p>
      <div class="wx-search">
        <input class="inp" type="date" bind:value={farDate} aria-label={t('Day')} data-wx-fardate />
        <button type="button" class="btn sm" onclick={climate} disabled={!farDate}>{t('Show')}</button>
      </div>
      {#if clim}<p class="wx-line" data-wx-clim><span>{t('usually {min}–{max} °C', { min: num(clim.tmin), max: num(clim.tmax) })}</span><span>{t('rain on {p} % of the days', { p: num(Math.round(clim.rainShare * 100)) })}</span><span>{t('wind up to {kmh} km/h', { kmh: num(clim.windMax) })}</span></p>{/if}
      {#if cErr}<p class="rc-warn">{cErr}</p>{/if}
    </section>
  {/if}

  {#if hitList.length}
    <!-- extra 6: forecast against what came -->
    <section class="card wx-sec" aria-labelledby="wx-hits" data-wx-hits>
      <h2 id="wx-hits" class="wx-h">{t('Forecast against what came')}</h2>
      <ul class="wx-days">
        {#each hitList as h (h.date)}
          <li><b>{wd(h.date)}</b><span>{t('said {a} °C, came {b} °C', { a: num(h.said.tmax), b: num(h.had.tmax) })}</span><span class="wx-word" class:w-good={h.rainHit} class:w-poor={!h.rainHit}>{h.rainHit ? t('rain right') : t('rain wrong')}</span></li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if core}
    <!-- Lernen (2a): how it felt, for next time -->
    <section class="card wx-sec" aria-labelledby="wx-feel" data-wx-feel>
      <h2 id="wx-feel" class="wx-h">{t('How was it outside?')}</h2>
      <FeelCard {core} />
    </section>
  {/if}

  <!-- extra 7: my webcams -->
  <section class="card wx-sec" aria-labelledby="wx-cams" data-wx-cams>
    <h2 id="wx-cams" class="wx-h"><Camera size={18} aria-hidden="true" />{t('My webcams')}</h2>
    <WebcamList />
  </section>
  <p class="rc-src"><Mountain size={14} aria-hidden="true" /> {t('Weather from Open-Meteo (free, open data). Avalanches: the SLF bulletin, shown as it is; the app never rates the danger itself.')}</p>
</section>

{#if homeSheet}<HomePlaceSheet current={$homeQ?.value ?? null} onclose={() => (homeSheet = false)} />{/if}

<style>
  .wx {
    display: grid;
    gap: 12px;
  }
  .wx-place,
  .wx-sec {
    padding: 12px;
    display: grid;
    gap: 8px;
  }
  .wx-where {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    align-items: baseline;
  }
  .wx-where small {
    color: var(--ink-2);
  }
  .wx-search {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .wx-search .inp {
    flex: 1;
    min-width: 0;
  }
  .wx-found {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .wx-found small {
    margin-left: 6px;
    color: var(--ink-2);
  }
  .wx-h {
    margin: 0;
    font-size: var(--fs-sub);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .wx-line {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
  }
  .wx-line span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .wx-warn,
  .wx-note {
    margin: 0;
    display: flex;
    gap: 6px;
    align-items: flex-start;
    overflow-wrap: break-word;
  }
  .wx-warn {
    color: var(--bad);
  }
  .wx-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .wx-chip {
    min-height: 44px;
    min-width: 56px;
    padding: 8px 12px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-body) var(--font-body);
    cursor: pointer;
  }
  .wx-chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .wx-bestline {
    margin: 0;
    font-weight: 600;
  }
  .wx-days {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
  }
  .wx-days li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
    padding: 6px 8px;
    border-radius: 8px;
  }
  .wx-days li.best {
    background: var(--accent-soft);
  }
  .wx-days small {
    flex-basis: 100%;
    color: var(--ink-2);
  }
  .wx-word {
    font-size: var(--fs-small);
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--paper-2);
  }
  .w-good {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .w-ok {
    background: var(--info-soft);
  }
  .w-poor {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .w-bad {
    background: var(--bad-soft);
    color: var(--bad);
  }
  .wx-x {
    margin-left: auto;
    border: 0;
    background: none;
    color: var(--ink-2);
    min-width: 44px;
    min-height: 44px;
    cursor: pointer;
  }
</style>
