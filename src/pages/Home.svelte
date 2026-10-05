<script>
  /**
   * Start page (v0.19.6, Noah 5.10.2026, answers 1a-8a): three questions at a glance.
   * - What is next? A dark band with the next trip, its countdown and the main action.
   * - Where do I go? Pack, Gear and Bikes as three equal places, each with a number that helps,
   *   a way to create something new and the things to open.
   * - What else is good to know? One line each from more sources: weather and sun, the debriefs,
   *   your pace, the Inbox and the backup.
   * Creating is one tap away: "New packing list" here, "New" in the top bar (phone: the +).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import DataPanel from '../lib/DataPanel.svelte';
  import { LAST_BACKUP, BACKUP_DAYS, backupDue, downloadBackup } from '../lib/backup.js';
  import { CATEGORY, formatWeight, gearStats, isConsumable } from '../lib/gear.js';
  import { sortBikes } from '../lib/bikes.js';
  import { withVisits, tripPrep, tyreSetup, costByYear } from '../lib/workshop.js';
  import { tripStats, daysUntil, readyDone, RAIN } from '../lib/trips.js';
  import { checkState, serviceDue, needsWork, wear, taskBike, isPrep } from '../lib/care.js';
  import { forecastForTrip, toWx } from '../lib/weather.js';
  import { onTripDay } from '../lib/ride.js';
  import { demoState } from '../lib/demo.js';
  import { nextTrip, toDebrief, tripEnd, learningsFor } from '../lib/debrief.js';
  import { wishReason } from '../lib/insights.js';
  import { ballast } from '../lib/packhints.js';
  import { sunTimes } from '../lib/blockplan.js';
  import { paceOf, PACE_KEY } from '../lib/pace.js';
  import { TEMPLATES_KEY } from '../lib/templates.js';
  import { openNew, openNote, openTrip, addItem, newTrip } from '../lib/nav.js';

  const tripsQ = liveQuery(() => db.trips.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  const tasksQ = liveQuery(() => db.maintenance.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const learnQ = liveQuery(() => db.learnings.toArray());
  const notesQ = liveQuery(() => db.notes.where('status').equals('open').toArray());
  const riderQ = liveQuery(() => db.settings.get('riderWeightG'));
  const paceQ = liveQuery(() => db.settings.get(PACE_KEY));
  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));
  // Answer 10a (stage 1): the newest of the downloaded backup file and the automatic folder backup.
  const lastQ = liveQuery(async () => {
    const [file, folder] = await Promise.all([db.meta.get(LAST_BACKUP), db.meta.get('backupFolder')]);
    return [file?.at, folder?.lastWrite].filter(Boolean).sort().at(-1) ?? null;
  });

  const trips = $derived($tripsQ ?? []);
  const items = $derived($itemsQ ?? []);
  const visits = $derived($visitsQ ?? []);
  const debriefs = $derived($debriefsQ ?? []);
  // Workshop jobs count as part history here too (services by time stay in Bike care, answer 17b).
  const bikes = $derived(sortBikes($bikesQ ?? []).map((b) => withVisits(b, visits)));
  const tasks = $derived($tasksQ ?? []);
  const learnings = $derived($learnQ ?? []);
  const templates = $derived($tplQ?.value ?? []);
  const loaded = $derived(!!$tripsQ && !!$itemsQ);
  const today = new Date().toISOString().slice(0, 10);

  /* ---------- the next trip ---------- */
  const next = $derived(nextTrip(trips));
  const bike = $derived(next ? bikes.find((b) => b.id === next.bikeId) : null);
  const stats = $derived(next ? tripStats(next, items, $bagsQ ?? [], bike, $riderQ?.value) : null);
  const days = $derived(next ? daysUntil(next.startDate) : null);
  const ready = $derived(next?.ready ?? []);
  const readyN = $derived(ready.filter((r) => readyDone(r, next)).length);
  // v0.18.2 (answer 3a): the same list "Before the trip" as in Pack and Bike care.
  const care = $derived(next ? (tripPrep(bike, next, tasks, bike ? tyreSetup(bike, visits) : undefined)?.rows ?? []) : []);
  const late = $derived(care.filter((c) => c.late).length);
  const extra = $derived(next ? ballast(next, items, trips, debriefs) : null);
  const debrief = $derived(toDebrief(trips, debriefs)[0] ?? null);
  const packedPct = $derived(stats?.count ? Math.round((stats.packed / stats.count) * 100) : 0);

  /* ---------- Pack: trips and templates to open ---------- */
  const tripList = $derived(
    [...trips]
      .filter((t) => !t.id.startsWith('demo') || t.id === next?.id)
      .sort((a, b) => {
        // Upcoming first (soonest first), then the past ones (newest first).
        const ua = (a.startDate ?? '') >= today;
        const ub = (b.startDate ?? '') >= today;
        if (ua !== ub) return ua ? -1 : 1;
        return ua ? (a.startDate ?? '').localeCompare(b.startDate ?? '') : (b.startDate ?? '').localeCompare(a.startDate ?? '');
      })
      .slice(0, 3),
  );

  /* ---------- Gear: where the weight is, what is worth a look (answer 7a) ---------- */
  const gs = $derived(gearStats(items));
  const favs = $derived(gs.inventory.filter((i) => i.favorite).length);
  const cats = $derived(gs.cats.filter((c) => c.g > 0 && !c.consumable).sort((a, b) => b.g - a.g).slice(0, 5));
  const heaviest = $derived(gs.top.find((i) => !isConsumable(i) && i.category !== 'bike') ?? null);
  const wishTop = $derived(
    gs.wishlist
      .map((item) => ({ item, ...wishReason(item, items, trips, debriefs) }))
      .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))[0] ?? null,
  );
  const weighedPct = $derived(gs.inventory.length ? Math.round(((gs.inventory.length - gs.unweighed) / gs.inventory.length) * 100) : 0);

  /* ---------- Bikes ---------- */
  const totalKm = $derived(bikes.reduce((t, b) => t + (b.km ?? 0), 0));
  const year = $derived(costByYear(visits).find((y) => y.year === today.slice(0, 4)) ?? null);
  // One line per bike: what is due, else its km and the last workshop visit.
  const bikeState = (b) => {
    if (next?.bikeId === b.id && care.length) return { due: care.length, tag: `${care.length} to do`, text: `${b.km != null ? `${b.km.toLocaleString('en')} km · ` : ''}next trip` };
    const parts = b.parts ?? [];
    const due = checkState(b).due + serviceDue(b).length + parts.filter((p) => needsWork(p) || wear(p) === 'worn').length + tasks.filter((t) => !isPrep(t) && taskBike(t) === b.id && (t.status === 'open' || t.status === 'needed')).length;
    const lastVisit = visits.filter((v) => v.bikeId === b.id).sort((x, y) => y.date.localeCompare(x.date))[0];
    const text = [b.km != null ? `${b.km.toLocaleString('en')} km` : null, lastVisit ? `serviced ${fmt(lastVisit.date, { day: 'numeric', month: 'short' })}` : null].filter(Boolean).join(' · ');
    if (due) return { due, tag: `${due} to do`, text };
    if (b.km == null) return { due: 0, tag: 'enter km', text: text || 'km not entered' };
    return { due: 0, tag: 'all fine', text };
  };

  /* ---------- Good to know (answer 6a): one line from each source ---------- */
  const fc = $derived(next ? toWx(forecastForTrip(next)) : null);
  const place = $derived(next ? (next.place ?? next.route?.start ?? null) : null);
  const sun = $derived(next?.startDate && place?.lat != null ? sunTimes(next.startDate, place.lat, place.lon) : null);
  const clock = (ms) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const tips = $derived(learningsFor(next, learnings, 1));
  const pace = $derived(paceOf($paceQ?.value));
  const notes = $derived([...($notesQ ?? [])].sort((a, b) => (b.at ?? '').localeCompare(a.at ?? '')));

  const demoQ = liveQuery(() => demoState(db));
  // No backup reminder while a demo runs (backups are off then).
  const backup = $derived($lastQ === undefined || !items.length || $demoQ ? { due: false, days: null } : backupDue($lastQ));
  let backingUp = $state(false);
  async function backupNow() {
    backingUp = true;
    try {
      await downloadBackup(db);
    } finally {
      backingUp = false;
    }
  }

  function fmt(iso, opts) {
    return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', opts);
  }
  const dateText = (t) =>
    t.days > 1 ? `${fmt(t.startDate, { weekday: 'short', day: 'numeric' })} – ${fmt(tripEnd(t), { weekday: 'short', day: 'numeric', month: 'short' })} · ${t.days} days` : fmt(t.startDate, { weekday: 'short', day: 'numeric', month: 'short' });
  const todayText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  // Ride day (answer 1a): on the days of the trip the app opens the ride view, once a day.
  const riding = $derived(next ? onTripDay(next, today) : false);
  $effect(() => {
    if (!riding) return;
    const key = 'ride.autoOpened';
    try {
      if (localStorage.getItem(key) === `${next.id}:${today}`) return;
      localStorage.setItem(key, `${next.id}:${today}`);
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

  const ICON = {
    plus: 'M12 5v14M5 12h14',
    note: 'M5 4h14v12l-4 4H5zM15 20v-4h4M8 9h8M8 13h5',
    star: 'M12 3l2.6 5.8 6.4.6-4.8 4.3 1.4 6.3L12 16.8 6.4 20l1.4-6.3L3 9.4l6.4-.6z',
    bike: 'M6 16m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0M18 16m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0M6 16l4-8h5l3 8M10 8l4 8',
    bag: 'M6 8h12l1.5 13h-15zM9 8V6a3 3 0 0 1 6 0v2',
  };
</script>

{#snippet ic(name, size = 20)}<svg class="ic" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d={ICON[name]} /></svg>{/snippet}

<div class="home">
  {#if backup.due}
    <section class="note-card" aria-labelledby="bk-h">
      <div>
        <h2 id="bk-h">Time for a backup</h2>
        <p>{backup.days == null ? 'You have not saved a backup file yet.' : `Your last backup is ${backup.days} days old.`} Your data lives only in this browser: one file keeps it safe (every {BACKUP_DAYS} days).</p>
      </div>
      <button type="button" class="btn hi" disabled={backingUp} onclick={backupNow}>Download backup</button>
    </section>
  {/if}

  <!-- What is next: the strongest contrast on the page, one main action. -->
  {#if next}
    <section class="band" aria-labelledby="next-h">
      <div class="who">
        <span class="lbl">{todayText} · next trip</span>
        <h1 id="next-h" class="title">{next.title}</h1>
        <p class="facts">
          <span>{dateText(next)}</span>{#if next.bike}<span>{next.bike}</span>{/if}{#if place?.name}<span>{place.name.split(',')[0]}</span>{/if}
          <span class="num">{stats.count} items</span>{#if stats.gearG}<span class="num">{formatWeight(stats.gearG)} gear</span>{/if}
        </p>
      </div>
      <div class="count" aria-label={days > 0 ? `${days} ${days === 1 ? 'day' : 'days'} to go` : 'On the way'}>
        {#if days > 0}<b class="title num">{days}</b><span class="lbl">{days === 1 ? 'day' : 'days'}<br />to go</span>{:else}<b class="title now">On the way</b>{/if}
      </div>
      <div class="acts">
        {#if riding}
          <a class="btn hi" href="#/ride" onclick={() => openTrip(next.id)}>Ride day</a>
          <a class="btn ghost" href="#/pack" onclick={() => openTrip(next.id)}>Pack</a>
        {:else if days <= 2}
          <a class="btn hi" href="#/pack?day" onclick={() => openTrip(next.id)}>Packing day</a>
          <a class="btn ghost" href="#/pack" onclick={() => openTrip(next.id)}>Continue packing</a>
          <a class="btn ghost" href="#/ride" onclick={() => openTrip(next.id)}>Ride day</a>
        {:else}
          <a class="btn hi" href="#/pack" onclick={() => openTrip(next.id)}>Continue packing</a>
          <a class="btn ghost" href="#/ride" onclick={() => openTrip(next.id)}>Ride day</a>
        {/if}
        <a class="btn ghost" href="#/pack?print" onclick={() => openTrip(next.id)}>Print list</a>
        {#if care.length}
          <a class="pill" class:late href="#/care">{late ? `Before the trip: ${care.length} to do, ${late} overdue` : `Before the trip: ${care.length} to do`}</a>
        {:else}
          <span class="pill ok">Before the trip: all done</span>
        {/if}
      </div>
    </section>
  {:else if loaded}
    <section class="band" aria-labelledby="next-h">
      <div class="who">
        <span class="lbl">{todayText}</span>
        <h1 id="next-h" class="title">No trip planned</h1>
        <p class="facts"><span>Start a packing list from a template, from your last trip or from the standard set.</span></p>
      </div>
      <div class="acts"><button type="button" class="btn hi" onclick={() => openNew('list')}>New packing list</button></div>
    </section>
  {/if}

  {#if debrief}
    <section class="note-card" aria-labelledby="last-h">
      <div>
        <h2 id="last-h">Last trip: {debrief.title}</h2>
        <p>Two minutes: mark what you did not use, what broke and what you missed. The app turns it into tips for the next trip.</p>
      </div>
      <a class="btn hi" href="#/debrief/{encodeURIComponent(debrief.id)}">Start debrief</a>
    </section>
  {/if}

  <!-- Phone: four ways to create, one tap each (desktop has "New" in the top bar). -->
  <nav class="quick" aria-label="Create">
    <button type="button" onclick={() => openNew('list')}><span class="ring hi">{@render ic('plus', 22)}</span>New list</button>
    <button type="button" onclick={() => openNote('')}><span class="ring">{@render ic('note', 22)}</span>Note</button>
    <button type="button" onclick={addItem}><span class="ring">{@render ic('star', 22)}</span>Gear item</button>
    <button type="button" onclick={() => openNew('km')}><span class="ring">{@render ic('bike', 22)}</span>Log km</button>
  </nav>

  <!-- Where to go (answers 5a, 7a, 8a): three equal places, number → create → open. -->
  <div class="hubs">
    <section class="hub" aria-labelledby="pack-h">
      <header><h2 id="pack-h" class="title"><a href="#/pack">Pack</a></h2>{@render ic('bag', 40)}</header>
      <button type="button" class="btn hi big" onclick={() => openNew('list')}>{@render ic('plus')}New packing list</button>
      {#if next}
        <div class="sub">
          <div class="line"><b>{next.title}</b><span class="num muted">{stats.packed} / {stats.count} in the bags</span></div>
          <div class="bar" role="img" aria-label="{packedPct} % packed"><i style:width="{Math.max(2, packedPct)}%"></i></div>
          <p class="small">
            Ready check {readyN} / {ready.length}{#if extra?.rows.length} · Ballast <b class="num">{formatWeight(extra.totalG)}</b> on {extra.rows.length} {extra.rows.length === 1 ? 'item' : 'items'} you did not use last times. <a href="#/pack" onclick={() => openTrip(next.id)}>Leave at home</a>{/if}
          </p>
        </div>
      {/if}
      <div>
        <span class="lbl">Open a list</span>
        <ul class="rows">
          {#each tripList as t (t.id)}
            <li><a href="#/pack" onclick={() => openTrip(t.id)}><span>{t.title}</span><span class="num muted">{t.startDate ? fmt(t.startDate, { day: 'numeric', month: 'short' }) : ''}{t.bike ? ` · ${t.bike}` : ''}</span></a></li>
          {/each}
          {#each templates.slice(0, 2) as t (t.id)}
            <li><button type="button" onclick={() => newTrip(t.id)} title="New trip from this template"><span>{t.name}</span><span class="muted">template</span></button></li>
          {/each}
          <li><a href="#/pack/templates"><span>All templates</span><span aria-hidden="true">→</span></a></li>
        </ul>
      </div>
    </section>

    <section class="hub" aria-labelledby="gear-h">
      <header><h2 id="gear-h" class="title"><a href="#/gear">Gear</a></h2>{@render ic('star', 40)}</header>
      <div class="kpis">
        {#if favs}<div><b class="title num">{favs}</b><span class="lbl">favourites</span></div>{/if}
        <div><b class="title num">{gs.inventory.length}</b><span class="lbl">items owned</span></div>
      </div>
      {#if cats.length}
        <div>
          <span class="lbl">Where the weight is</span>
          <div class="cats">
            {#each cats as c (c.key)}
              <a href="#/gear?cat={c.key}" class="cn">{c.name}</a>
              <div class="bar" role="img" aria-label="{formatWeight(c.g)}"><i style:width="{Math.round((c.g / cats[0].g) * 100)}%" style:background={CATEGORY[c.key]?.color}></i></div>
              <span class="num">{formatWeight(c.g)}</span>
            {/each}
          </div>
        </div>
      {/if}
      <div>
        <span class="lbl">Worth a look</span>
        <ul class="rows">
          {#if heaviest}<li><a href="#/gear?q={encodeURIComponent(heaviest.name)}"><span>Heaviest: {heaviest.name}</span><span class="num muted">{formatWeight(heaviest.weightG)}</span></a></li>{/if}
          {#if wishTop}<li><a href="#/gear?tab=wishlist"><span>Wishlist top: {wishTop.item.name}</span><span class="muted">{gs.wishlist.length} {gs.wishlist.length === 1 ? 'wish' : 'wishes'}</span></a></li>{/if}
          {#if gs.unweighed}<li><a href="#/gear?tab=weigh"><span>Weigh next: {gs.unweighed} items</span><span class="num muted">{weighedPct} % done</span></a></li>{/if}
        </ul>
      </div>
      <div class="foot">
        <button type="button" class="btn sm" onclick={addItem}>{@render ic('plus', 16)}Add item</button>
        <a class="btn sm" href="#/gear">★ Favourites</a>
        <a class="btn sm" href="#/gear?tab=wishlist">Wishlist</a>
      </div>
    </section>

    <section class="hub" aria-labelledby="bikes-h">
      <header><h2 id="bikes-h" class="title"><a href="#/bikes">Bikes</a></h2>{@render ic('bike', 40)}</header>
      {#if bikes.length}
        <div class="kpis"><div><b class="title num">{totalKm.toLocaleString('en')}</b><span class="lbl">km on {bikes.length} {bikes.length === 1 ? 'bike' : 'bikes'}</span></div></div>
        <ul class="rows">
          {#each bikes as b (b.id)}
            {@const s = bikeState(b)}
            <li><a href={s.due ? '#/care' : '#/bikes'}><span class="two"><b>{b.name}</b><small class="muted">{s.text}</small></span><span class="tag" class:due={s.due}>{s.tag}</span></a></li>
          {/each}
        </ul>
        {#if year}<p class="small">Workshop {year.year}: <b class="num">{year.unknown === year.visits ? 'cost unknown' : `CHF ${Math.round(year.chf).toLocaleString('en')}${year.unknown ? ' + unknown' : ''}`}</b> ({year.visits} {year.visits === 1 ? 'visit' : 'visits'}).</p>{/if}
      {:else}
        <p class="small">No bikes yet.</p>
      {/if}
      <div class="foot">
        <button type="button" class="btn sm" onclick={() => openNew('km')}>{@render ic('plus', 16)}Log km</button>
        <a class="btn sm" href="#/care">Bike care</a>
        <a class="btn sm" href="#/care">Workshop order</a>
      </div>
    </section>
  </div>

  <!-- Good to know (answer 6a): five sources, one line each, and where it comes from. -->
  <section class="know" aria-labelledby="know-h">
    <h2 id="know-h" class="title">Good to know</h2>
    <div class="cards">
      {#if next}
        <div class="sig">
          <span class="lbl">Weather{place?.name ? ` · ${place.name.split(',')[0]}` : ''}</span>
          <b>{fc ? `${fc.min} to ${fc.max} °C, ${RAIN[fc.rain]}` : place ? 'No forecast loaded yet' : 'No place set yet'}</b>
          <span>{sun ? `Sunrise ${clock(sun.rise)} · sunset ${clock(sun.set)}` : next.wx?.min != null ? `Packed for ${next.wx.min} to ${next.wx.max} °C` : 'Set the start place in Pack → Ride and weather.'}</span>
          <span class="src">{fc ? 'Open-Meteo' : 'Forecast from 16 days before'}{sun ? ' · sun computed offline' : ''}</span>
        </div>
      {/if}
      <div class="sig">
        <span class="lbl">From your debriefs</span>
        {#if tips[0]}<b>{tips[0].rule}</b>{:else}<b>No learnings yet</b>{/if}
        <span>{tips[0] ? (tips[0].topic ?? '') : 'After a trip, the debrief turns what you did not use into tips.'}</span>
        <span class="src">{learnings.length} learnings · <a href="#/debrief/learnings">all</a></span>
      </div>
      <div class="sig">
        <span class="lbl">Your pace</span>
        <b class="num">{pace.mine ? `${pace.kmh} km/h moving` : 'Standard guess: 16 km/h'}</b>
        <span>+1 h per {pace.climbMh.toLocaleString('en')} m climbing{pace.stops ? `, stops add ${Math.round((pace.stops - 1) * 100)} %` : ''}</span>
        <span class="src">{pace.mine ? `${pace.n} GPX rides` : 'Load your rides'} · <a href="#/debrief/pace">Your pace</a></span>
      </div>
      <div class="sig">
        <span class="lbl">Inbox</span>
        <b>{notes.length ? `${notes.length} ${notes.length === 1 ? 'note' : 'notes'} to sort` : 'Nothing to sort'}</b>
        <span>{notes[0]?.text ?? 'Quick notes land here: tap New → Quick note.'}</span>
        <span class="src">Quick notes · <a href="#/inbox">{notes.length ? 'sort now' : 'all notes'}</a></span>
      </div>
      <div class="sig">
        <span class="lbl">Your data</span>
        <b>{$demoQ ? 'Demo running' : backup.days == null ? 'No backup yet' : backup.days === 0 ? 'Backup today' : `Backup ${backup.days} ${backup.days === 1 ? 'day' : 'days'} old`}</b>
        <span>Phone and desktop keep their own data; a backup file moves it.</span>
        <span class="src"><button type="button" class="link" disabled={backingUp || !!$demoQ} onclick={backupNow}>Download backup</button></span>
      </div>
    </div>
  </section>

  <details class="data" open={loaded && !trips.length}>
    <summary><b>Your data</b> <span class="muted">backup, import, export, favourites</span></summary>
    <DataPanel />
  </details>

  <footer>
    <span class="dot" class:off={!online}></span>
    {online ? 'Online' : 'Offline'} · v{__APP_VERSION__}
  </footer>
</div>

<style>
  .home {
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 1360px;
    margin: 0 auto;
  }
  .lbl {
    font: 700 12px/1.2 var(--font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .muted {
    color: var(--ink-3);
  }
  .small {
    margin: 0;
    font-size: 14px;
    color: var(--ink-2);
  }
  .ic {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
    flex: none;
  }

  /* Notices: backup, debrief */
  .note-card {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 16px;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border: 2px solid var(--hi);
    border-radius: 12px;
    background: var(--hi-soft);
  }
  .note-card > div {
    flex: 1 1 260px;
  }
  .note-card h2 {
    margin: 0 0 2px;
    font-size: 18px;
  }
  .note-card p {
    margin: 0;
    color: var(--ink-2);
  }

  /* The band: the next trip */
  .band {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px 32px;
    padding: 22px 26px;
    border-radius: 14px;
    background: var(--ink);
    color: var(--paper);
  }
  .band .lbl {
    color: #a9c2b6;
  }
  .who {
    flex: 1 1 420px;
    min-width: 0;
  }
  .band h1 {
    margin: 4px 0 0;
    font-size: clamp(40px, 8vw, 64px);
    line-height: 0.95;
    overflow-wrap: anywhere;
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 14px;
    margin: 8px 0 0;
    color: #d6e2db;
  }
  .count {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .count b {
    font-size: clamp(64px, 14vw, 96px);
    line-height: 0.8;
    color: var(--hi);
  }
  .count .now {
    font-size: 40px;
  }
  .acts {
    flex: 1 1 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }
  .btn.ghost {
    background: transparent;
    color: var(--paper);
    border-color: var(--paper);
  }
  .btn.ghost:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  .pill {
    margin-left: auto;
    padding: 8px 14px;
    border-radius: 999px;
    background: #e3eef8;
    color: var(--ink);
    font-weight: 600;
    text-decoration: none;
  }
  .pill.late {
    background: var(--hi-soft);
    color: #8a2f00;
  }
  .pill.ok {
    background: transparent;
    color: #a9c2b6;
    font-weight: 500;
  }

  /* Phone: quick create buttons */
  .quick {
    display: none;
  }
  @media (max-width: 719px) {
    .band {
      padding: 18px;
    }
    .pill {
      margin-left: 0;
    }
    .quick {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
    }
    .quick button {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 0;
      border: 0;
      background: none;
      color: var(--ink);
      font: 600 12px var(--font-body);
      cursor: pointer;
    }
    .ring {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: 2px solid var(--ink);
      background: var(--paper);
    }
    .ring.hi {
      background: var(--hi);
      border-color: var(--hi);
      color: #fff;
    }
  }

  /* The three places */
  .hubs {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 22px;
  }
  .hub {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
    padding: 20px;
    border: 2px solid var(--ink);
    border-radius: 14px;
    background: var(--paper);
  }
  .hub header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .hub h2 {
    margin: 0;
    font-size: clamp(40px, 6vw, 52px);
    line-height: 1;
  }
  .hub h2 a {
    color: var(--ink);
    text-decoration: none;
  }
  .hub h2 a:hover {
    color: var(--hi);
  }
  .btn.big {
    justify-content: center;
    gap: 8px;
    min-height: 52px;
    font-size: 17px;
  }
  .sub {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px;
    border-radius: 10px;
    background: var(--paper-2);
  }
  .line {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 4px 12px;
  }
  .bar {
    height: 8px;
    border-radius: 4px;
    background: #dfe4dc;
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: 4px;
    background: var(--ink);
  }
  .rows {
    list-style: none;
    margin: 4px 0 0;
    padding: 0;
  }
  .rows li a,
  .rows li button {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 44px;
    padding: 6px 4px;
    border: 0;
    border-bottom: 1px solid #dfe4dc;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
    box-sizing: border-box;
  }
  .rows li:last-child a,
  .rows li:last-child button {
    border-bottom: 0;
  }
  .rows li a:hover,
  .rows li button:hover {
    background: var(--paper-2);
  }
  .rows span:first-child {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .two {
    display: flex;
    flex-direction: column;
  }
  .two small {
    font-size: 13px;
  }
  .tag {
    flex: none;
    font-size: 13px;
    color: var(--ink-3);
  }
  .tag.due {
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--hi-soft);
    color: #8a2f00;
    font-weight: 600;
  }
  .kpis {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 24px;
  }
  .kpis div {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .kpis b {
    font-size: 44px;
    line-height: 1;
  }
  .cats {
    display: grid;
    grid-template-columns: minmax(80px, auto) minmax(0, 1fr) auto;
    gap: 6px 10px;
    align-items: center;
    margin-top: 6px;
    font-size: 14px;
  }
  .cats .cn {
    color: var(--ink);
    text-decoration: none;
  }
  .cats .num {
    text-align: right;
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: auto;
  }
  .foot .btn {
    gap: 6px;
  }

  /* Good to know */
  .know h2 {
    margin: 0 0 12px;
    font-size: 30px;
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
  }
  .sig {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    padding: 16px;
    border: 1.5px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  .sig b {
    font-size: 17px;
    overflow-wrap: anywhere;
  }
  .sig > span:not(.lbl):not(.src) {
    font-size: 14px;
    color: var(--ink-2);
  }
  .src {
    margin-top: auto;
    font-size: 12px;
    color: var(--ink-3);
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }

  .data {
    border: 1.5px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    padding: 12px 16px;
  }
  .data summary {
    cursor: pointer;
  }
  footer {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ink-3);
    font-size: 13px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #2f8f5b;
  }
  .dot.off {
    background: var(--ink-3);
  }
</style>
