<script>
  /**
   * v0.46.1 (Noah: «Touren» opened the last trip at Packen): #/trips, the calm overview of all trips
   * behind «Touren». #/pack and #/pack?… still open a trip directly.
   * v0.78.0 «Fünf Orte» 2 / «Übergänge 2» (Noah T1–T20 a, U1–U5 a, mockup uebergaenge2/touren): the
   * Touren page proper. On top the four steps of every trip in short, then «Weitermachen» (the same
   * block as on Today), then the trips as tiles grouped by state (tripsoverview.js), each with the
   * drawing of its route and one button named by its next step; a dashed tile starts a new trip.
   * On the side the templates to start quickly and the best values and averages from the uploaded
   * rides (tripsboard.js). Heart rate, zones and power come later with Strava, as a grey note.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { tripsOverview, GROUPS, RIDDEN_SHOWN } from '../lib/tripsoverview.js';
  import { routeOf, routePath, bestValues, PERIODS, hmm } from '../lib/tripsboard.js';
  import { TEMPLATES_KEY, templateEntries } from '../lib/templates.js';
  import { SETS_KEY } from '../lib/sets.js';
  import { switchTrip, openNew, newTrip } from '../lib/nav.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn, num, locale } from '../lib/i18n.svelte.js';
  import Continue from '../lib/home/Continue.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import PlaceIcon from '../lib/nav/PlaceIcon.svelte';
  import { Plus, ArrowRight, ChevronRight, ListChecks, Trophy, Lock, Upload } from '@lucide/svelte';

  const tripsQ = liveQuery(() => db.trips.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const ridesQ = liveQuery(() => db.rides.toArray());
  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));
  const setsQ = liveQuery(() => db.settings.get(SETS_KEY));
  const itemsQ = liveQuery(() => db.items.toArray());
  const loaded = $derived(!!$tripsQ && !!$debriefsQ);
  const today = localDay();
  const view = $derived(loaded ? tripsOverview($tripsQ, $debriefsQ, today) : null);
  const rides = $derived($ridesQ ?? []);
  const byId = $derived(Object.fromEntries(($tripsQ ?? []).map((x) => [x.id, x])));
  const routes = $derived(Object.fromEntries(($tripsQ ?? []).map((x) => [x.id, routeOf(x, rides)])));

  // Templates to start quickly (the four used last); a tap makes a trip from it.
  const templates = $derived(
    ($tplQ?.value ?? [])
      .filter((x) => !x.archivedAt)
      .slice(0, 4)
      .map((tp) => ({ tp, n: templateEntries(tp, $itemsQ ?? [], $setsQ?.value ?? []).length, nights: Math.max(1, Number(tp.days) || 1) - 1 })),
  );
  const tplLine = (x) => [x.nights ? tn(x.nights, '{n} night', '{n} nights') : t('no night'), tn(x.n, '{n} item', '{n} items')].join(' · ');

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
  const best = $derived(loaded ? bestValues({ trips: $tripsQ, rides, today, period }) : null);

  const STEPS = [
    { name: 'Plan|stage', sub: 'when, where, which bike' },
    { name: 'Pack|stage', sub: 'the list stands, tick it off' },
    { name: 'On the way', sub: 'weather, notes, home' },
    { name: 'Look back|page', sub: 'what fitted, what was missing' },
  ];

  const thisYear = String(new Date().getFullYear());
  const day = (iso) => {
    if (!iso) return t('No date set');
    const y = iso.slice(0, 4) !== thisYear ? { year: 'numeric' } : {};
    return new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', ...y });
  };
  const line = (r) => [day(r.date), r.bike, typeof r.km === 'number' ? `${num(r.km)} km` : ''].filter(Boolean).join(' · ');
  const kmLine = (rt) => [rt?.km ? `${num(Math.round(rt.km))} km` : '', rt?.gainM ? `${num(Math.round(rt.gainM))} Hm` : ''].filter(Boolean).join(' · ');
  const go = (r) => switchTrip(r.tripId, r.go.href);
</script>

{#snippet map(id, small = false)}
  {@const rt = routes[id]}
  {@const p = rt ? routePath(rt.line, 260, small ? 96 : 128) : null}
  <div class="map" class:small class:none={!p}>
    {#if p}
      <svg viewBox="0 0 260 {small ? 96 : 128}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path class="rt" d={p.d} /><circle class="end" cx={p.end[0]} cy={p.end[1]} r="4.5" /></svg>
      {#if !small && kmLine(rt)}<span class="kmb num">{kmLine(rt)}</span>{/if}
    {:else}
      <span class="nomap" aria-hidden="true"><PlaceIcon place="trips" size={small ? 22 : 28} /></span>
    {/if}
  </div>
{/snippet}

<div class="trips">
  <div class="ph">
    <div>
      <h1 class="title">{t('Trips|place')}</h1>
      <p class="lead">{t('Every trip goes in four steps. The bar on top of every trip shows where you are.')}</p>
    </div>
    {#if view && !view.empty}<button type="button" class="btn hi" onclick={() => openNew('list')}><Plus size={18} aria-hidden="true" />{t('New trip')}</button>{/if}
  </div>
  <ol class="steps">
    {#each STEPS as s, i (s.name)}<li><span class="sn num" aria-hidden="true">{i + 1}</span><span class="sx"><b>{t(s.name)}</b><small>{t(s.sub)}</small></span></li>{/each}
  </ol>
  {#if view}
    {#if view.empty}
      <div class="card empty">
        <p>{t('No trips yet. A trip is the packing list for one ride or journey.')}</p>
        <button type="button" class="btn hi" onclick={() => openNew('list')}><Plus size={18} aria-hidden="true" />{t('Create the first trip')}</button>
        <p class="quiet">{t('Best values come after your first ride with a GPX file.')} <a href="#/debrief/ride">{t('Upload a ride')}</a></p>
      </div>
    {:else}
      <Continue trips={$tripsQ ?? []} debriefs={$debriefsQ ?? []} {today} hour={new Date().getHours()} />
      <div class="cols">
        <div class="groups">
          {#each GROUPS as g (g.key)}
            {#if view[g.key].length || g.key === 'planning'}
              <h2 class="sec-head" id="trips-{g.key}"><span>{t(g.name)}</span><span class="n">{g.key === 'ridden' ? view.riddenTotal : view[g.key].length}</span>{#if g.key === 'ridden' && view.riddenTotal > RIDDEN_SHOWN}<a class="all" href="#/pack/past">{t('All {n}', { n: view.riddenTotal })}<ChevronRight size={16} aria-hidden="true" /></a>{/if}</h2>
              <ul class="tiles" class:small={g.key === 'ridden'} aria-labelledby="trips-{g.key}">
                {#each view[g.key] as r (r.id)}
                  {#if g.key === 'ridden'}
                    <li class="tile">
                      <a class="whole" href={r.go.href} onclick={(e) => (e.preventDefault(), go(r))} aria-label="{t(r.go.label)}: {r.title}">
                        {@render map(r.tripId, true)}
                        <span class="body"><span class="t">{r.title}</span><span class="s">{line(r)}</span></span>
                      </a>
                    </li>
                  {:else}
                    <li class="tile">
                      {@render map(r.tripId)}
                      <div class="body">
                        <h3 class="t">{r.title}</h3>
                        <p class="s">{line({ ...r, km: null })}</p>
                        <p class="st">{#if g.key === 'debrief'}<span class="udot" aria-hidden="true"></span>{/if}{t(r.state.label, r.state)}</p>
                        <a class="btn sm go" class:hi={g.key === 'soon' || g.key === 'planning' && r === view.planning[0]} href={r.go.href} onclick={(e) => (e.preventDefault(), go(r))} aria-label="{t(r.go.label)}: {r.title}">{t(r.go.label)}<ArrowRight size={16} aria-hidden="true" /></a>
                      </div>
                    </li>
                  {/if}
                {/each}
                {#if g.key === 'planning'}
                  <li class="tile add"><button type="button" class="addb" onclick={() => openNew('list')}><Plus size={24} aria-hidden="true" /><b>{t('New trip')}</b><small>{t('or from a template')}</small></button></li>
                {/if}
              </ul>
            {/if}
          {/each}
        </div>
        <aside class="side-col">
          {#if templates.length}
            <section class="card box" aria-labelledby="tpl-h">
              <h2 class="bh" id="tpl-h"><ListChecks size={20} aria-hidden="true" /><span>{t('Templates')}</span><small>{t('start quickly')}</small></h2>
              <ul class="tpls">
                {#each templates as x (x.tp.id)}
                  <li><button type="button" class="tpl" onclick={() => newTrip(x.tp.id)}><b>{x.tp.name}</b><small>{tplLine(x)}</small></button></li>
                {/each}
              </ul>
              <a class="lk" href="#/pack/templates">{t('Edit templates')}<ChevronRight size={16} aria-hidden="true" /></a>
            </section>
          {/if}
          <section class="card box" aria-labelledby="best-h">
            <h2 class="bh" id="best-h"><Trophy size={20} aria-hidden="true" /><span>{t('Best values and average')}</span></h2>
            <Seg small full={false} label={t('Period')} value={period} options={PERIODS.map((p) => ({ key: p.key, name: t(p.name) }))} onchange={pickPeriod} />
            {#if best?.any}
              <dl class="stats">
                {#if best.longest}<div><dt>{t('Longest trip')}</dt><dd><b class="big num">{num(best.longest.km)}</b> km</dd><dd class="w">{best.longest.title}{best.longest.days > 1 ? `, ${tn(best.longest.days, '{n} day', '{n} days')}` : ''}</dd></div>{/if}
                {#if best.climb}<div><dt>{t('Most climbing')}</dt><dd><b class="big num">{num(best.climb.m)}</b> Hm</dd><dd class="w">{best.climb.title}</dd></div>{/if}
                {#if best.time}<div><dt>{t('Longest riding time')}</dt><dd><b class="big num">{hmm(best.time.h)}</b> h</dd><dd class="w">{best.time.totalH ? t('in one day · {h} h in all', { h: hmm(best.time.totalH) }) : best.time.title}</dd></div>{/if}
                {#if best.furthest}<div><dt>{t('Furthest day')}</dt><dd><b class="big num">{num(best.furthest.km)}</b> km</dd><dd class="w">{best.furthest.title}</dd></div>{/if}
              </dl>
              {#if best.avg.some((a) => a.n)}
                <h3 class="th">{t('Average per trip, from GPX')}</h3>
                <table class="avg">
                  <thead><tr><th scope="col">{t('Kind|trip')}</th><th scope="col">km</th><th scope="col">Hm</th><th scope="col">{t('moving')}</th><th scope="col">{t('in all')}</th><th scope="col">{t('Stops')}</th></tr></thead>
                  <tbody>
                    {#each best.avg.filter((a) => a.n) as a (a.key)}
                      <tr><th scope="row">{t(a.name)}</th><td class="num">{num(a.km)}</td><td class="num">{num(a.gainM)}</td><td class="num">{hmm(a.movingH)}</td><td class="num">{hmm(a.totalH)}</td><td class="num">{a.stops}</td></tr>
                    {/each}
                  </tbody>
                </table>
              {/if}
            {:else}
              <p class="quiet">{t('Best values come after your first ride with a GPX file.')}</p>
            {/if}
            <p class="later"><Lock size={16} aria-hidden="true" /><span>{t('Heart rate, zones and power come later with Strava. Only observation, no rating.')}</span></p>
            <a class="lk" href="#/debrief/ride"><Upload size={16} aria-hidden="true" />{t('Upload a ride')}</a>
          </section>
        </aside>
      </div>
    {/if}
  {/if}
</div>

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
    gap: var(--sp-2) var(--sp-4);
  }
  .ph .title {
    margin: 0;
  }
  .lead {
    margin: var(--sp-1) 0 0;
    color: var(--ink-2);
    font: 400 var(--fs-body) / 1.45 var(--font-body);
  }
  .btn.hi {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .steps {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--sp-2);
    margin: var(--sp-4) 0;
    padding: 0;
    list-style: none;
  }
  .steps li {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-2);
    padding: var(--sp-2) var(--sp-3);
    border-radius: 10px;
    background: var(--paper-2);
  }
  .sn {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 22px;
    height: 22px;
    border-radius: 11px;
    background: var(--paper);
    font: 700 var(--fs-tiny) / 1 var(--font-body);
  }
  .sx {
    display: grid;
    min-width: 0;
  }
  .sx b {
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .sx small {
    color: var(--ink-2);
    font: 400 var(--fs-tiny) / 1.35 var(--font-body);
  }
  @media (max-width: 719px) {
    .steps {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .cols {
    display: grid;
    gap: var(--sp-5);
  }
  @media (min-width: 1100px) {
    .cols {
      grid-template-columns: minmax(0, 1fr) 360px;
      align-items: start;
    }
  }
  .sec-head .all {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    margin-left: auto;
    color: var(--ink);
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: var(--sp-3);
    margin: var(--sp-2) 0 var(--sp-5);
    padding: 0;
    list-style: none;
  }
  .tiles.small {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
  .tile {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
    border-radius: 14px;
    background: var(--paper);
    box-shadow: 0 1px 3px var(--shadow);
  }
  .map {
    position: relative;
    display: grid;
    place-items: center;
    height: 128px;
    background: var(--paper-2);
  }
  .map.small {
    height: 96px;
  }
  /* on a phone, a trip without a route gets a slim band, not a tall empty box */
  @media (max-width: 719px) {
    .map.none {
      height: 56px;
    }
  }
  .map svg {
    width: 100%;
    height: 100%;
  }
  .rt {
    fill: none;
    stroke: var(--pc-trips);
    stroke-width: 3;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .end {
    fill: var(--pc-today);
    stroke: var(--paper);
    stroke-width: 2;
  }
  .nomap {
    color: var(--ink-3);
  }
  .kmb {
    position: absolute;
    right: var(--sp-2);
    bottom: var(--sp-2);
    padding: 2px var(--sp-2);
    border-radius: 6px;
    background: var(--paper);
    font: 700 var(--fs-tiny) / 1.3 var(--font-body);
  }
  .body {
    display: grid;
    gap: 2px;
    padding: var(--sp-3) var(--sp-3) var(--sp-3);
    min-width: 0;
  }
  .body .t {
    margin: 0;
    font: 700 var(--fs-body) / 1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .body .s,
  .body .st {
    margin: 0;
    color: var(--ink-2);
    font: 400 var(--fs-small) / 1.4 var(--font-body);
    overflow-wrap: break-word;
  }
  .go {
    display: inline-flex;
    align-items: center;
    justify-self: start;
    gap: var(--sp-1);
    min-height: 44px;
    margin-top: var(--sp-2);
  }
  .whole {
    display: flex;
    flex-direction: column;
    height: 100%;
    color: var(--ink);
    text-decoration: none;
  }
  .tile.add {
    background: none;
    box-shadow: none;
  }
  .addb {
    display: grid;
    place-items: center;
    align-content: center;
    gap: var(--sp-1);
    min-height: 220px;
    height: 100%;
    border: 2px dashed var(--line);
    border-radius: 14px;
    background: none;
    color: var(--ink-2);
    font: 400 var(--fs-small) / 1.3 var(--font-body);
    cursor: pointer;
  }
  .addb b {
    color: var(--ink);
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .side-col {
    display: grid;
    gap: var(--sp-4);
  }
  .box {
    display: grid;
    gap: var(--sp-3);
    padding: var(--sp-4);
  }
  .bh {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    margin: 0;
    font: 700 var(--fs-sub) / 1.25 var(--font-body);
  }
  .bh small {
    margin-left: auto;
    color: var(--ink-2);
    font: 400 var(--fs-small) / 1.3 var(--font-body);
  }
  .tpls {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tpl {
    display: grid;
    gap: 2px;
    width: 100%;
    min-height: 64px;
    padding: var(--sp-2) var(--sp-3);
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    text-align: left;
    cursor: pointer;
  }
  .tpl b {
    font: 600 var(--fs-body) / 1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .tpl small {
    color: var(--ink-2);
    font: 400 var(--fs-tiny) / 1.35 var(--font-body);
  }
  .lk {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-1);
    justify-self: start;
    min-height: 44px;
    color: var(--ink);
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-3);
    margin: 0;
  }
  .stats div {
    min-width: 0;
  }
  .stats dt {
    color: var(--ink-2);
    font: 400 var(--fs-tiny) / 1.3 var(--font-body);
  }
  .stats dd {
    margin: 0;
    font: 400 var(--fs-small) / 1.3 var(--font-body);
  }
  .stats .big {
    font: 700 var(--fs-title) / 1.1 var(--font-brand);
  }
  .stats .w {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    overflow-wrap: break-word;
  }
  .th {
    margin: 0;
    color: var(--ink-2);
    font: 700 var(--fs-tiny) / 1.3 var(--font-body);
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
  .later {
    display: flex;
    gap: var(--sp-2);
    margin: 0;
    padding: var(--sp-2) var(--sp-3);
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink-2);
    font: 400 var(--fs-tiny) / 1.4 var(--font-body);
  }
  .quiet {
    margin: 0;
    color: var(--ink-2);
    font: 400 var(--fs-small) / 1.4 var(--font-body);
  }
  .empty {
    display: grid;
    gap: 10px;
    justify-items: start;
    margin-top: 12px;
  }
  .empty p {
    margin: 0;
    color: var(--ink-2);
  }
</style>
