<script>
  /**
   * Start page "Next trip" (stage 1, design audit H1–H4, 4.10.2026): what to do now instead of
   * a description of the app. Next trip with countdown, packing state, ready check and bike care,
   * the last trip's debrief, learnings for this trip, the bikes and the gear. Your data folds away.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import DataPanel from '../lib/DataPanel.svelte';
  import { LAST_BACKUP, BACKUP_DAYS, backupDue, downloadBackup } from '../lib/backup.js';
  import { formatWeight } from '../lib/gear.js';
  import { sortBikes } from '../lib/bikes.js';
  import { withVisits, tripPrep, tyreSetup } from '../lib/workshop.js';
  import { tripStats, daysUntil, readyDone, RAIN } from '../lib/trips.js';
  import { checkState, serviceDue, needsWork, wear, taskBike, isPrep } from '../lib/care.js';
  import { forecastForTrip, toWx } from '../lib/weather.js';
  import { onTripDay } from '../lib/ride.js';
  import { demoState } from '../lib/demo.js';
  import { nextTrip, toDebrief, tripEnd, learningsFor, wishCount, unweighedCount } from '../lib/debrief.js';

  const tripsQ = liveQuery(() => db.trips.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  const tasksQ = liveQuery(() => db.maintenance.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const learnQ = liveQuery(() => db.learnings.toArray());
  const riderQ = liveQuery(() => db.settings.get('riderWeightG'));
  // Answer 10a: the newest of the downloaded backup file and the automatic folder backup.
  const lastQ = liveQuery(async () => {
    const [file, folder] = await Promise.all([db.meta.get(LAST_BACKUP), db.meta.get('backupFolder')]);
    return [file?.at, folder?.lastWrite].filter(Boolean).sort().at(-1) ?? null;
  });

  const trips = $derived($tripsQ ?? []);
  const items = $derived($itemsQ ?? []);
  // Workshop jobs count as part history here too (services by time stay in Bike care, answer 17b).
  const bikes = $derived(sortBikes($bikesQ ?? []).map((b) => withVisits(b, $visitsQ ?? [])));
  const tasks = $derived($tasksQ ?? []);
  const learnings = $derived($learnQ ?? []);
  const loaded = $derived(!!$tripsQ && !!$itemsQ);

  const next = $derived(nextTrip(trips));
  const bike = $derived(next ? bikes.find((b) => b.id === next.bikeId) : null);
  const stats = $derived(next ? tripStats(next, items, $bagsQ ?? [], bike, $riderQ?.value) : null);
  const days = $derived(next ? daysUntil(next.startDate) : null);
  const onBikeG = $derived(stats ? stats.gearG + stats.bagsG : 0);
  const bagCount = $derived(stats ? stats.zones.filter((z) => z.bag && z.entries.length).length : 0);
  // The fullest bag with a known volume, for the bar.
  const fullest = $derived(
    stats
      ? stats.zones.filter((z) => z.bag?.volumeL && z.vol).map((z) => ({ name: next.purpose?.[z.key] || z.bag.name, pct: Math.round((z.vol / z.bag.volumeL) * 100) })).sort((a, b) => b.pct - a.pct)[0] ?? null
      : null,
  );
  const ready = $derived(next?.ready ?? []);
  const readyN = $derived(ready.filter((r) => readyDone(r, next)).length);
  // v0.18.2 (answer 3a): the same list "Before the trip" as in Pack and Bike care.
  const before = $derived(next ? tripPrep(bike, next, tasks, bike ? tyreSetup(bike, $visitsQ ?? []) : undefined) : null);
  const care = $derived(before?.rows ?? []);
  const tips = $derived(learningsFor(next, learnings, 3));
  const debrief = $derived(toDebrief(trips, $debriefsQ ?? [])[0] ?? null);
  const wx = $derived(next?.wx);
  // Answer 4a: the saved forecast (offline: the last one loaded).
  const fc = $derived(next ? toWx(forecastForTrip(next)) : null);

  // One line per bike: what is due, else its weight.
  const bikeState = (b) => {
    // The next trip's bike counts everything due before the trip (same number as the tile).
    if (next?.bikeId === b.id && care.length) return { due: care.length, text: `${care.length} to do before ${next.title}` };
    const parts = b.parts ?? [];
    const due = checkState(b).due + serviceDue(b).length + parts.filter((p) => needsWork(p) || wear(p) === 'worn').length + tasks.filter((t) => !isPrep(t) && taskBike(t) === b.id && (t.status === 'open' || t.status === 'needed')).length;
    if (due) return { due, text: `${due} to do${next?.bikeId === b.id ? ' · next trip' : ''}` };
    if (b.km == null) return { due: 0, text: next?.bikeId === b.id ? 'next trip · km not entered' : 'km not entered' };
    return { due: 0, text: `${b.km.toLocaleString('en')} km${b.weightG ? ` · ${formatWeight(b.weightG)}` : ''} · all fine` };
  };

  const demoQ = liveQuery(() => demoState(db));
  // No backup reminder while a demo runs (backups are off then).
  const backup = $derived($lastQ === undefined || !items.length || $demoQ ? { due: false } : backupDue($lastQ));
  let backingUp = $state(false);
  async function backupNow() {
    backingUp = true;
    try {
      await downloadBackup(db);
    } finally {
      backingUp = false;
    }
  }

  const fmt = (iso, opts) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', opts);
  const dateText = (t) =>
    t.days > 1 ? `${fmt(t.startDate, { weekday: 'short', day: 'numeric' })} – ${fmt(tripEnd(t), { weekday: 'short', day: 'numeric', month: 'short' })} · ${t.days} days` : fmt(t.startDate, { weekday: 'short', day: 'numeric', month: 'short' });
  const openTrip = (id) => {
    try {
      localStorage.setItem('pack.currentTrip', id);
    } catch {
      /* fine: Pack opens the next trip anyway */
    }
  };

  // Ride day (answer 1a): on the days of the trip the app opens the ride view, once a day.
  const riding = $derived(next ? onTripDay(next, new Date().toISOString().slice(0, 10)) : false);
  $effect(() => {
    if (!riding) return;
    const key = 'ride.autoOpened';
    const day = new Date().toISOString().slice(0, 10);
    try {
      if (localStorage.getItem(key) === `${next.id}:${day}`) return;
      localStorage.setItem(key, `${next.id}:${day}`);
    } catch {
      return; // without storage it would open every time: better not at all
    }
    openTrip(next.id);
    location.hash = '#/ride';
  });

  let online = $state(navigator.onLine);
  $effect(() => {
    const update = () => (online = navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  });
</script>

<div class="home">
  <div class="main">
    {#if backup.due}
      <section class="card backup" aria-labelledby="bk-h">
        <div>
          <h2 id="bk-h" class="title">Time for a backup</h2>
          <p>{backup.days == null ? 'You have not saved a backup file yet.' : `Your last backup is ${backup.days} days old.`} Your data lives only in this browser: one file keeps it safe (every {BACKUP_DAYS} days).</p>
        </div>
        <button type="button" class="btn hi" disabled={backingUp} onclick={backupNow}>Download backup</button>
      </section>
    {/if}
    {#if next}
      <section class="card next" aria-labelledby="next-h">
        <span class="lbl">Next trip</span>
        <div class="big">
          <h1 id="next-h" class="title">{next.title}</h1>
          <div class="count">
            {#if days > 0}<b class="num">{days}</b><span class="lbl">{days === 1 ? 'day to go' : 'days to go'}</span>{:else}<b class="now">On the way</b>{/if}
          </div>
        </div>
        <p class="meta"><span>{dateText(next)}</span>{#if next.bike}<span>{next.bike}</span>{/if}</p>
        <div class="tiles">
          <div class="tile">
            <span class="lbl">Packed</span>
            <b class="v num">{stats.packed ? `${stats.packed} / ${stats.count} in` : `${stats.count} items`}</b>
            <p>{onBikeG ? `${formatWeight(onBikeG)} on the bike` : 'not weighed yet'} · {bagCount} {bagCount === 1 ? 'bag' : 'bags'}</p>
            {#if fullest}<div class="bar"><i style:width="{Math.min(100, fullest.pct)}%"></i></div><p class="small">{fullest.name} {fullest.pct} % full</p>{/if}
          </div>
          <div class="tile">
            <span class="lbl">Ready check</span>
            <b class="v num">{readyN} / {ready.length}</b>
            <p>{ready.filter((r) => !readyDone(r, next)).slice(0, 3).map((r) => r.label).join(', ') || 'All done'}</p>
            <a class="btn sm" href="#/pack" onclick={() => openTrip(next.id)}>{days > 1 ? 'Open on the day' : 'Open'}</a>
          </div>
          <div class="tile" class:due={care.some((c) => c.late)}>
            <span class="lbl">Before the trip</span>
            <b class="v num">{care.length ? `${care.length} to do` : 'All done'}</b>
            <p>{care.slice(0, 2).map((c) => c.name).join(' · ') || 'Nothing left to do.'}</p>
            <a class="btn sm" href="#/care">Go to bike care</a>
          </div>
        </div>
        <p class="wx">
          <span class="lbl">Weather</span>
          <span>{#if fc}Forecast{next.place ? ` ${next.place.name.split(',')[0]}` : ''}: {fc.min} to {fc.max} °C, {RAIN[fc.rain]}.{' '}{/if}{wx && typeof wx.min === 'number' ? `Packed for ${wx.min} to ${wx.max} °C, ${RAIN[wx.rain] ?? 'dry'}.` : 'Packed for 15 °C, dry (the base).'}{#if !fc} Set the start place in Pack to get the forecast.{/if}</span>
        </p>
        <div class="row">
          {#if riding}
            <a class="btn hi" href="#/ride" onclick={() => openTrip(next.id)}>Ride day</a>
            <a class="btn" href="#/pack" onclick={() => openTrip(next.id)}>Pack</a>
          {:else if days <= 2}
            <a class="btn hi" href="#/pack?day" onclick={() => openTrip(next.id)}>Packing day</a>
            <a class="btn" href="#/pack" onclick={() => openTrip(next.id)}>Continue packing</a>
          {:else}
            <a class="btn hi" href="#/pack" onclick={() => openTrip(next.id)}>Continue packing</a>
          {/if}
          <a class="btn" href="#/pack?print" onclick={() => openTrip(next.id)}>Print list</a>
          {#if stats.unweighed}<span class="muted small">{stats.unweighed} not weighed</span>{/if}
        </div>
      </section>
    {:else if loaded}
      <section class="card next">
        <span class="lbl">Next trip</span>
        <h1 class="title">No trip planned</h1>
        <p class="meta">Start a new trip from your last one or from a template.</p>
        <div class="row"><a class="btn hi" href="#/pack">Plan a new trip</a><a class="btn" href="#/pack/templates">Templates</a></div>
      </section>
    {/if}

    {#if debrief}
      <section class="card" aria-labelledby="last-h">
        <h2 id="last-h" class="title">Last trip <small>{debrief.title} · no debrief yet</small></h2>
        <p>Two minutes: mark what you did not use, what broke and what you missed. The app turns it into tips for the next trip.</p>
        <a class="btn hi" href="#/debrief/{encodeURIComponent(debrief.id)}">Start debrief</a>
      </section>
    {/if}
  </div>

  <div class="side">
    {#if tips.length}
      <section class="card" aria-labelledby="tips-h">
        <h2 id="tips-h" class="title">{next ? 'For this trip' : 'Learnings'} <small>from your learnings</small></h2>
        <ul class="list">
          {#each tips as l (l.id)}<li><span class="prio">{l.priority ?? ''}</span><span>{l.rule}</span></li>{/each}
        </ul>
        <a class="btn sm" href="#/debrief/learnings">All {learnings.length} learnings</a>
      </section>
    {/if}

    {#if bikes.length}
      <section class="card" aria-labelledby="bikes-h">
        <h2 id="bikes-h" class="title">Your bikes</h2>
        <ul class="list bikes">
          {#each bikes as b (b.id)}
            {@const s = bikeState(b)}
            <li><span class="dot" class:on={s.due}></span><a href="#/bikes"><b>{b.name}</b></a><span class="muted">{s.text}</span></li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if items.length}
      <section class="card" aria-labelledby="gear-h">
        <h2 id="gear-h" class="title">Gear <small>{items.filter((i) => i.ownership === 'owned' || i.ownership === 'unclear').length} items</small></h2>
        <p>{unweighedCount(items)} not weighed · {wishCount(items)} on the wishlist</p>
        <div class="row"><a class="btn sm" href="#/gear?tab=weigh">Weigh</a><a class="btn sm" href="#/gear?tab=wishlist">Wishlist</a></div>
      </section>
    {:else if loaded}
      <section class="card">
        <h2 class="title">Welcome</h2>
        <p>Import your data below (Your data → Import backup) or start in Gear.</p>
      </section>
    {/if}
  </div>

  <details class="data" open={loaded && !trips.length}>
    <summary><b>Your data</b> <span class="muted">backup, import, export</span></summary>
    <DataPanel />
  </details>

  <footer>
    <span class="dot" class:off={!online}></span>
    {online ? 'Online' : 'Offline'} · v{__APP_VERSION__}
  </footer>
</div>

<style>
  .backup {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 16px;
    align-items: center;
    justify-content: space-between;
    border-left: 4px solid var(--hi);
  }
  .backup > div {
    flex: 1 1 260px;
  }
  .backup h2 {
    margin: 0 0 4px;
  }
  .backup p {
    margin: 0;
  }
  .home {
    display: grid;
    gap: 20px;
    align-items: start;
  }
  @media (min-width: 900px) {
    .home {
      grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
    }
  }
  .main,
  .side {
    display: grid;
    gap: 20px;
    min-width: 0;
  }
  .data,
  footer {
    grid-column: 1 / -1;
  }
  .card {
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: 6px;
    padding: 16px 18px;
    min-width: 0;
  }
  .card p {
    color: var(--ink-2);
    margin: 4px 0 12px;
  }
  .title {
    margin: 0;
  }
  h2.title {
    font-size: 26px;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 8px;
    margin-bottom: 6px;
  }
  h2 small {
    font: 500 13px var(--font-body);
    text-transform: none;
    color: var(--ink-3);
  }
  .big {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 4px 16px;
  }
  .big h1 {
    font-size: clamp(44px, 9vw, 74px);
    flex: 1 1 240px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .count {
    text-align: right;
    flex: none;
    margin-left: auto;
  }
  .count b {
    display: block;
    font: 900 clamp(44px, 9vw, 64px) / 1 var(--font-title);
  }
  .count .now {
    font-size: 28px;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 18px;
  }
  .tiles {
    display: grid;
    gap: 10px;
  }
  @media (min-width: 560px) {
    .tiles {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  .tile {
    border: 1.5px solid var(--line);
    border-radius: 6px;
    padding: 12px;
    background: #fff;
    min-width: 0;
  }
  .tile.due {
    border-left: 4px solid var(--hi);
  }
  .tile .v {
    display: block;
    font: 900 28px/1.1 var(--font-title);
  }
  .tile p {
    font-size: 13px;
    margin: 4px 0 8px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .bar {
    height: 7px;
    background: var(--paper-2);
    border-radius: 4px;
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    background: var(--ink);
  }
  .small {
    font-size: 13px;
  }
  .tile .small {
    margin: 6px 0 0;
  }
  .wx {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    align-items: baseline;
    font-size: 13px;
    border-top: 1px dashed var(--line);
    padding-top: 10px;
    margin-top: 14px !important;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .btn.sm {
    padding: 4px 9px;
    font-size: 13px;
  }
  .list {
    list-style: none;
    margin: 0 0 10px;
    padding: 0;
  }
  .list li {
    display: flex;
    gap: 10px;
    align-items: baseline;
    padding: 7px 0;
    border-top: 1px solid var(--paper-2);
  }
  .list li:first-child {
    border-top: 0;
  }
  .prio {
    flex: none;
    font: 700 10px var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-3);
    border: 1px solid var(--line);
    border-radius: 3px;
    padding: 0 5px;
  }
  .bikes a {
    color: inherit;
    text-decoration: none;
    min-width: 9em;
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex: none;
    background: var(--ink-3);
  }
  .dot.on {
    background: var(--hi);
  }
  .muted {
    color: var(--ink-3);
  }
  .data {
    border-top: 2px solid var(--line);
    padding-top: 10px;
  }
  .data summary {
    cursor: pointer;
    padding: 4px 0 10px;
  }
  footer {
    color: var(--ink-3);
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  footer .dot {
    background: #2f8f5b;
  }
  footer .dot.off {
    background: var(--ink-3);
  }
</style>
