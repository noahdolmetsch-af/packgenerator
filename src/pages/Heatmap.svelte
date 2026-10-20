<script>
  /**
   * «Heatmap» (Noah 20.10.2026 «ich möchte eine Heatmap … wo alle meine Rides eingezeichnet werden»;
   * answers «1a+b 2b+a 3 alle Fahrten von Strava 4a 5a»). #/heatmap (Touren › Rückblick › Heatmap,
   * also a button on «Neuland»).
   * - Every ride with a line on one map; where rides overlap the colour gets stronger. «Wolken» (soft
   *   clouds) or «Linien» (sharp lines), switchable.
   * - Filters: year, sport (all Strava sports: rides, runs, hikes, ski tours …), bike, tour or everyday.
   * - A tap on the map names the rides there, each with a link to its page.
   * - Older Strava rides without a line get it once in the background (heat/backfill.js).
   * The rules are in src/lib/heat/heat.js (pure, tests/heatmap.test.js).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { heatLines, heatChoices, filterHeat, heatStats, needLine, HEAT_KINDS } from '../lib/heat/heat.js';
  import { backfillLines, BACKFILL_KEY } from '../lib/heat/backfill.js';
  import { strava, call } from '../lib/strava/client.svelte.js';
  import { actHref } from '../lib/strava/acthref.js';
  import { tourHref } from '../lib/touren/tour.js';
  import { typeKey } from '../lib/training.js';
  import HeatMap from '../lib/heat/HeatMap.svelte';
  import PathHead from '../lib/ui/PathHead.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import Skeleton from '../lib/ui/Skeleton.svelte';
  import { dayLong } from '../lib/review/fmt.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn, num } from '../lib/i18n.svelte.js';
  import { Flame, Info, X, ChevronRight, Compass, RefreshCw } from '@lucide/svelte';
  import '../lib/review/review.css';

  const today = localDay();
  const LS = 'pg.heat.f';

  const dataQ = liveQuery(async () => {
    const [activities, rides, tracks, entries, bikes, fill] = await Promise.all([
      db.activities ? db.activities.toArray() : [],
      db.rides.toArray(),
      db.tracks ? db.tracks.where('kind').equals('rec').toArray() : [],
      db.kmBook.toArray(),
      db.bikes.toArray(),
      db.settings.get(BACKFILL_KEY),
    ]);
    return { activities, rides, tracks, entries, bikes, fill: fill?.value ?? null };
  });
  const all = $derived($dataQ ? heatLines({ ...$dataQ, today }) : null);
  const choices = $derived(heatChoices(all ?? []));
  const bikeName = $derived(Object.fromEntries(($dataQ?.bikes ?? []).map((b) => [b.id, b.name || t('Bike')])));

  // the filter: remembered on this device (a convenience; without storage it starts on «all»)
  const START = { year: 'all', kind: 'all', bike: 'all', where: 'all', mode: 'clouds' };
  function readF() {
    try {
      return { ...START, ...JSON.parse(localStorage.getItem(LS) || '{}') };
    } catch {
      return { ...START };
    }
  }
  let f = $state(readF());
  function setF(k, v) {
    f = { ...f, [k]: v, ...(k === 'kind' && v !== 'bike' && v !== 'all' ? { bike: 'all' } : {}) };
    sel = [];
    try {
      localStorage.setItem(LS, JSON.stringify(f));
    } catch {
      /* private window: the filter is only for now */
    }
  }
  // a choice the data no longer has (a year gone, a bike deleted) counts as «all»
  const fx = $derived({
    ...f,
    year: f.year === 'all' || choices.years.includes(f.year) ? f.year : 'all',
    kind: f.kind === 'all' || choices.kinds.includes(f.kind) ? f.kind : 'all',
    bike: f.bike === 'all' || choices.bikes.includes(f.bike) ? f.bike : 'all',
  });
  const shown = $derived(all ? filterHeat(all, fx) : []);
  const stats = $derived(heatStats(shown));
  const kindName = (k) => t(HEAT_KINDS.find((x) => x.key === k)?.name ?? 'Other|kind');
  const showBikes = $derived((fx.kind === 'bike' || fx.kind === 'all') && choices.bikes.length > 0);

  /* ---------- tap: the rides there ---------- */
  let sel = $state.raw([]);
  let tapped = $state(false);
  const SEL_MAX = 12;
  function pick(lines) {
    sel = lines;
    tapped = true;
  }
  const nameOf = (l) => l.name || (l.src === 'rec' ? t('Recorded|spur') : l.src === 'gpx' ? t('Uploaded ride') : t(typeKey(l.type)));
  const hrefOf = (l) => (l.actId ? actHref(l.actId) : l.tripId ? tourHref(`t:${l.tripId}`) : null);

  /* ---------- 5a: older Strava rides get their line once, in the background ---------- */
  const missing = $derived(needLine($dataQ?.activities ?? []).length);
  let filling = $state(false);
  let fillMsg = $state('');
  async function fill() {
    if (filling) return;
    filling = true;
    fillMsg = '';
    try {
      const r = await backfillLines(db, call);
      fillMsg = r.got ? tn(r.got, '{n} older ride now has its line.', '{n} older rides now have their line.') : t('Strava sent no further lines (indoor rides or hidden routes).');
    } catch {
      fillMsg = t('Strava could not be reached. Try again later.');
    } finally {
      filling = false;
    }
  }
  let started = false;
  $effect(() => {
    if (started || !$dataQ || !strava.key || $dataQ.fill || !missing) return;
    started = true;
    fill();
  });
</script>

<div class="rv-page hm">
  <PathHead crumbs={[{ label: t('Trips|place'), href: '#/trips' }, { label: t('Look back|page'), href: '#/debrief' }]} title={t('Heatmap')} sub={t('All your rides on one map. The more often you were somewhere, the stronger the colour.')}>
    <a class="btn" href="#/neuland"><Compass size={16} aria-hidden="true" />{t('New ground')}</a>
  </PathHead>

  {#if !all}
    <Skeleton />
  {:else if !all.length}
    <Empty icon={Flame} title={t('No rides with a route yet')} text={t('Connect Strava, upload a GPX ride or record a ride in the app: every route then shows here.')} action={{ label: t('Connect Strava'), href: '#/me/connections' }} action2={{ label: t('Upload a ride'), href: '#/debrief/ride' }} />
    {#if filling}<p class="hm-note" role="status"><RefreshCw size={16} aria-hidden="true" />{t('Loading the routes of older Strava rides …')}</p>{/if}
  {:else}
    <div class="hm-filters" data-heat-filters>
      <Seg small full={false} label={t('How to draw')} value={fx.mode} onchange={(v) => setF('mode', v)} options={[{ key: 'clouds', name: t('Clouds|heat') }, { key: 'lines', name: t('Lines|heat') }]} />
      <Seg chips full={false} label={t('Year')} value={fx.year} onchange={(v) => setF('year', v)} options={[{ key: 'all', name: t('All years') }, ...choices.years.map((y) => ({ key: y, name: y }))]} />
      {#if choices.kinds.length > 1}
        <Seg chips full={false} label={t('Sport')} value={fx.kind} onchange={(v) => setF('kind', v)} options={[{ key: 'all', name: t('All sports') }, ...choices.kinds.map((k) => ({ key: k, name: kindName(k) }))]} />
      {/if}
      <div class="hm-row">
        <Seg small full={false} label={t('Tour or everyday')} value={fx.where} onchange={(v) => setF('where', v)} options={[{ key: 'all', name: t('All|heat') }, { key: 'tour', name: t('Tours') }, { key: 'everyday', name: t('Everyday') }]} />
        {#if showBikes}
          <label class="hm-bike">
            <span>{t('Bike')}</span>
            <select value={fx.bike} onchange={(e) => setF('bike', e.currentTarget.value)} data-heat-bike>
              <option value="all">{t('All bikes')}</option>
              {#each choices.bikes as id (id)}<option value={id}>{bikeName[id] ?? t('Bike')}</option>{/each}
            </select>
          </label>
        {/if}
      </div>
    </div>

    <p class="hm-sum" data-testid="heat-sum">
      {tn(stats.n, '{n} ride', '{n} rides')} · {num(stats.km)} km · {tn(stats.days, '{n} day', '{n} days')} · {tn(stats.cells, '{n} map square', '{n} map squares')}
    </p>

    <div class="rv-box pad">
      <HeatMap lines={shown} mode={fx.mode} sel={sel.slice(0, SEL_MAX)} onpick={pick} />
      <p class="legend" aria-hidden="true"><span>{t('once')}</span><span class="ramp {fx.mode}"></span><span>{t('often')}</span></p>
      <p class="hm-help">{t('Tap a line to see the rides there. Drag to move, pinch or scroll to zoom.')}</p>
    </div>

    {#if tapped}
      <section class="rv-sec" aria-labelledby="hm-sel-h" data-heat-picked>
        <div class="rv-h">
          <div>
            <h2 id="hm-sel-h">{sel.length ? tn(sel.length, '{n} ride here', '{n} rides here') : t('No ride here')}</h2>
            {#if sel.length}<p class="rv-sub">{t('Newest first. The blue lines on the map.')}</p>{/if}
          </div>
          <button type="button" class="btn sm" aria-label={t('Close')} onclick={() => ((sel = []), (tapped = false))}><X size={16} aria-hidden="true" /></button>
        </div>
        {#if sel.length}
          <ul class="rv-box">
            {#each sel.slice(0, SEL_MAX) as l (l.id)}
              {@const href = hrefOf(l)}
              <li>
                {#if href}
                  <a class="rv-row" {href}><span class="rv-m"><span class="rv-t">{nameOf(l)}</span><span class="rv-s">{dayLong(l.day)} · {kindName(l.kind)}{#if l.bikeId && bikeName[l.bikeId]}{' · '}{bikeName[l.bikeId]}{/if}</span></span><span class="rv-v">{num(Math.round(l.km))} km</span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a>
                {:else}
                  <div class="rv-row"><span class="rv-m"><span class="rv-t">{nameOf(l)}</span><span class="rv-s">{dayLong(l.day)} · {kindName(l.kind)}</span></span><span class="rv-v">{num(Math.round(l.km))} km</span></div>
                {/if}
              </li>
            {/each}
          </ul>
          {#if sel.length > SEL_MAX}<p class="hm-help">{t('And {n} more. Zoom in to choose fewer.', { n: sel.length - SEL_MAX })}</p>{/if}
        {:else}
          <p class="hm-help">{t('Tap closer to a coloured line.')}</p>
        {/if}
      </section>
    {/if}

    {#if filling}
      <p class="hm-note" role="status"><RefreshCw size={16} aria-hidden="true" />{t('Loading the routes of older Strava rides …')}</p>
    {:else if fillMsg}
      <p class="hm-note" role="status"><Info size={16} aria-hidden="true" />{fillMsg}</p>
    {:else if missing && strava.key}
      <p class="hm-note"><Info size={16} aria-hidden="true" /><span>{tn(missing, '{n} Strava ride has no route yet.', '{n} Strava rides have no route yet.')} <button type="button" class="btn sm" onclick={fill} data-heat-fill>{t('Load routes')}</button></span></p>
    {/if}
  {/if}
</div>

<style>
  .hm-filters {
    display: grid;
    gap: 10px;
    margin: 0 0 12px;
  }
  .hm-filters > :global(*) {
    justify-self: start;
  }
  .hm-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 16px;
  }
  .hm-bike {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--ink-2);
  }
  .hm-bike select {
    min-height: 44px;
    max-width: 60vw;
  }
  .hm-sum {
    margin: 0 0 12px;
    font-weight: 600;
    color: var(--ink);
  }
  .hm-help {
    margin: 8px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hm-note {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 16px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .hm-note :global(svg) {
    flex: none;
  }
  .legend {
    /* the same colours as heat.js rampOf */
    --hm-l1: rgb(253 174 97);
    --hm-l2: rgb(244 109 67);
    --hm-l3: rgb(215 48 39);
    --hm-l4: rgb(120 0 30);
    --hm-c1: rgb(254 217 118 / 0.5);
    --hm-c2: rgb(253 141 60 / 0.7);
    --hm-c3: rgb(227 26 28 / 0.85);
    --hm-c4: rgb(128 0 38);
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .ramp {
    display: inline-block;
    width: 120px;
    height: 10px;
    border-radius: 5px;
    border: 1px solid var(--line);
  }
  .ramp.lines {
    background: linear-gradient(90deg, var(--hm-l1), var(--hm-l2), var(--hm-l3), var(--hm-l4));
  }
  .ramp.clouds {
    background: linear-gradient(90deg, var(--hm-c1), var(--hm-c2), var(--hm-c3), var(--hm-c4));
  }
</style>
