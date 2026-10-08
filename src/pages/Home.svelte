<script>
  import { localDay } from '../lib/localday.js';
  /**
   * Start page (v0.19.6, Noah 5.10.2026, answers 1a-8a): three questions at a glance.
   * - What is next? A dark band with the next trip, its countdown and the main action.
   * - Where do I go? Pack, Gear and Bikes as three equal places, each with a number that helps,
   *   a way to create something new and the things to open.
   * - What else is good to know? One line each from more sources: weather and sun, the debriefs,
   *   your pace, the Inbox and the backup.
   * Creating is one tap away: "New packing list" here, "New" in the top bar (phone: the +).
   *
   * v0.23.0 (AP07): Today leads with ONE trip and ONE next step that fits it (today.js): Continue
   * planning, Start packing, Ride day or Write debrief; the step opens exactly that trip. Bike care,
   * event preparation, the backup, a waiting debrief and the Inbox follow as short lines below.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import DataPanel from '../lib/DataPanel.svelte';
  import { LAST_BACKUP, LAST_IMPORT, BACKUP_DAYS, backupDue, downloadBackup } from '../lib/backup.js';
  import { backupAfterTrip } from '../lib/todos.js';
  import { CATEGORY, formatWeight, knownWeight, weightText, gearStats, isConsumable, favouriteCounts } from '../lib/gear.js';
  import { sortBikes, bikesHash } from '../lib/bikes.js';
  import { withVisits, costByYear } from '../lib/workshop.js';
  import { bikeCare, bikeCareWords, bikeCareLine, eventPrep, eventPrepLine, packStatus, packLine, isShortRide } from '../lib/readiness.js';
  import { tripStats, daysUntil } from '../lib/trips.js';
  import { onTripDay } from '../lib/ride.js';
  import { demoState } from '../lib/demo.js';
  import { nextTrip, tripEnd, quickDebrief, templateOffer, templateName, isOver } from '../lib/debrief.js';
  import TemplateOffer from '../lib/debrief/TemplateOffer.svelte';
  // v0.25.1 (Noah 1b, 2b, 3a): more buttons on the Trips and Bikes tiles, four visible, the rest under "More".
  import TripsHubActions from '../lib/hubs/TripsHubActions.svelte';
  import BikesHubActions from '../lib/hubs/BikesHubActions.svelte';
  import { wishReason } from '../lib/insights.js';
  import { ballast } from '../lib/packhints.js';
  import { TEMPLATES_KEY } from '../lib/templates.js';
  import { openNew, openNote, openTrip, addItem, newTrip, wantBike, take } from '../lib/nav.js';
  import { todayFocus } from '../lib/today.js';
  import { t, tn, num, locale, nameOf } from '../lib/i18n.svelte.js';
  import { hasBike, domainOf, domainName } from '../lib/domains.js';
  import { phone } from '../lib/media.svelte.js';
  import GoodToKnow from '../lib/know/GoodToKnow.svelte';

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
  const importQ = liveQuery(() => db.meta.get(LAST_IMPORT));
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
  const today = localDay();

  /* ---------- the next trip ---------- */
  const next = $derived(nextTrip(trips));
  // v0.21.0: a trip without a bike (weekend, ski touring, world trip) has no ride day and no bike care.
  const nextByBike = $derived(next ? hasBike(next) : true);
  const bike = $derived(next ? bikes.find((b) => b.id === next.bikeId) : null);
  const stats = $derived(next ? tripStats(next, items, $bagsQ ?? [], bike, $riderQ?.value) : null);
  const days = $derived(next ? daysUntil(next.startDate) : null);
  // v0.18.2 (answer 3a): the same list "Before the trip" as in Pack and Bike care.
  // v0.22.0 (AP06): three named scopes, the same statements as Pack and Bikes → Care
  // (readiness.js): Bike care of the trip's bike, Event preparation and Packing status.
  // v0.25.0 (Noah 10): a short ride (1 day, no event) has no bike care step here; it stays in Bikes.
  const care = $derived(next && nextByBike && bike && !isShortRide(next) ? bikeCare(bike, { tasks, visits, trip: next, today }) : null);
  // v0.22.0 (Noah 4b): only for events; a trip without preparation tasks shows no line.
  const prep = $derived.by(() => {
    const p = next && nextByBike ? eventPrep(next, tasks, today) : null;
    return p?.total ? p : null;
  });
  const packing = $derived(next ? packStatus(next) : null);
  const extra = $derived(next ? ballast(next, items, trips, debriefs) : null);
  // v0.23.0 (AP07): the trip Today leads with and its one next step.
  const focus = $derived(loaded ? todayFocus(trips, debriefs, today) : null);
  const lead = $derived(focus?.trip ?? null);
  const leadStats = $derived(lead ? (lead === next ? stats : tripStats(lead, items, $bagsQ ?? [], bikes.find((b) => b.id === lead.bikeId), $riderQ?.value)) : null);
  const leadByBike = $derived(lead ? hasBike(lead) : true);
  const debrief = $derived(focus?.debrief ?? null);
  const packedPct = $derived(stats?.count ? Math.round((stats.packed / stats.count) * 100) : 0);

  /* ---------- v0.24.1 (Noah 3a): "How was {trip}?" → "All good" saves the debrief right here ---------- */
  // quick: { trip, prev, prevStatus, offer, undo } while "Saved. Undo" (and the template offer) shows.
  let quick = $state(null);
  let quickTimer;
  const UNDO_MS = 8000;
  async function allGood() {
    const trip = $state.snapshot(lead);
    const prev = debriefs.find((x) => x.tripId === trip.id) ?? null;
    const record = quickDebrief(trip, prev ? structuredClone($state.snapshot(prev)) : null);
    // Noah 4a: the template offer is decided before anything changes.
    const offer = templateOffer(trip, templates, trips) ? templateName(trip, bikes.find((b) => b.id === trip.bikeId), templates) : null;
    await db.transaction('rw', db.debriefs, db.trips, async () => {
      await db.debriefs.put(record);
      await db.trips.update(trip.id, { status: 'done' });
    });
    clearTimeout(quickTimer);
    quick = { trip, prev, prevStatus: trip.status, offer, undo: true };
    quickTimer = setTimeout(() => {
      if (!quick) return;
      quick.undo = false;
      if (!quick.offer) quick = null;
    }, UNDO_MS);
  }
  // Undo: the debrief goes (or the earlier draft comes back) and the trip is as it was.
  async function undoQuick() {
    const q = $state.snapshot(quick);
    clearTimeout(quickTimer);
    quick = null;
    await db.transaction('rw', db.debriefs, db.trips, async () => {
      if (q.prev) await db.debriefs.put(q.prev);
      else await db.debriefs.delete(q.trip.id);
      await db.trips.update(q.trip.id, { status: q.prevStatus });
    });
  }
  $effect(() => () => clearTimeout(quickTimer));

  /* ---------- Pack: trips and templates to open ---------- */
  // v0.30.1 (Noah E6, C5): every trip still ahead (also several day rides on one day), soonest
  // first, then the past ones (newest first) up to three rows. A trip ended early (finished) or
  // over by date is past, also when its start date is today or later.
  const tripList = $derived.by(() => {
    const list = trips.filter((t) => !t.id.startsWith('demo') || t.id === next?.id);
    const ahead = list
      .filter((t) => !t.skipped && !isOver(t, today))
      .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? '') || (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
    const past = list
      .filter((t) => !ahead.includes(t))
      .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? '') || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    return [...ahead, ...past.slice(0, Math.max(0, 3 - ahead.length))];
  });
  // v0.30.1 (Noah E6): other trips on the way today besides the one Today leads with.
  const alsoToday = $derived(trips.filter((t) => t !== lead && !t.skipped && !t.finished && !t.id.startsWith('demo') && onTripDay(t, today)));

  /* ---------- Gear: where the weight is, what is worth a look (answer 7a) ---------- */
  const gs = $derived(gearStats(items));
  // v0.22.0 (AP05): the same basis as Gear's favourites button (the inventory); the wishlist ones apart.
  const favN = $derived(favouriteCounts(items));
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
  // One line per bike (v0.22.0, AP06): Bike care in the same words as Bikes → Care and Pack:
  // what is due (with its name), "no data" when nothing is recorded, else "nothing due".
  // The Excel preparation of the next trip is not the bike's: it has its own line in the band.
  const bikeState = (b) => {
    const c = bikeCare(b, { tasks, visits, today });
    const w = bikeCareWords(c);
    const lastVisit = visits.filter((v) => v.bikeId === b.id).sort((x, y) => y.date.localeCompare(x.date))[0];
    const facts = [b.km != null ? `${num(b.km)} km` : null, next?.bikeId === b.id ? t('next trip') : null, lastVisit ? t('serviced {date}', { date: fmt(lastVisit.date, { day: 'numeric', month: 'short' }) }) : null].filter(Boolean).join(' · ');
    return { due: c.rows.length, tone: w.tone, tag: w.tag, text: [w.text, facts].filter(Boolean).join(' · '), href: c.status === 'ok' ? bikesHash({ bike: b.id }) : c.href };
  };

  /* ---------- Good to know: v0.25.1 (Noah 1a) the cards live in know.js and GoodToKnow.svelte ---------- */
  const place = $derived(next ? (next.place ?? next.route?.start ?? null) : null);
  let dataOpen = $state(false);
  // Open "Your data" by itself while there is nothing in the app yet, once: a later data
  // update must not toggle it again under a tap (v0.26.1: the e2e import raced with it).
  let autoOpened = false;
  $effect(() => {
    if (loaded && !trips.length && !autoOpened) {
      autoOpened = true;
      dataOpen = true;
    }
  });
  let dataEl = $state();
  function openData() {
    dataOpen = true;
    queueMicrotask(() => dataEl?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
  // v0.30.0 (Noah 1a): the tip "Try a demo" (nav.js openData) opens Your data, also from the overview.
  $effect(() => {
    if (dataEl && take('home.data')) openData();
    const on = () => take('home.data') && openData();
    window.addEventListener('pg:data', on);
    return () => window.removeEventListener('pg:data', on);
  });
  /* ---------- v0.23.1 (Noah 3b): on a phone the three places and Good to know start folded ---------- */
  // Closed, each is one line: its name and the number that matters. The desktop shows them open as before.
  let folds = $state({ pack: false, gear: false, bikes: false });
  const hubSum = $derived({
    pack: next ? `${next.title} · ${t('{n} % packed', { n: packedPct })}` : tn(trips.length, '{n} trip', '{n} trips'),
    gear: [tn(gs.inventory.length, '{n} item owned', '{n} items owned'), gs.unweighed ? t('{n} not weighed', { n: gs.unweighed }) : null].filter(Boolean).join(' · '),
    bikes: bikes.length
      ? [`${num(totalKm)} km`, tn(bikes.length, '{n} bike', '{n} bikes'), (() => { const n = bikes.filter((b) => bikeCare(b, { tasks, visits, today }).rows.length).length; return n ? t('{n} due', { n }) : null; })()].filter(Boolean).join(' · ')
      : t('No bikes yet.'),
  });
  const notes = $derived([...($notesQ ?? [])].sort((a, b) => (b.at ?? '').localeCompare(a.at ?? '')));

  const demoQ = liveQuery(() => demoState(db));
  // No backup reminder while a demo runs (backups are off then).
  const backup = $derived.by(() => {
    if ($lastQ === undefined || !items.length || $demoQ) return { due: false, days: null };
    const b = backupDue($lastQ);
    // v0.21.0 (answer 4a): after every saved debrief, so the desktop can take the phone's state.
    return backupAfterTrip($lastQ, debriefs) ? { ...b, due: true, afterTrip: true } : b;
  });
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
    return new Date(`${iso}T00:00:00`).toLocaleDateString(locale(), opts);
  }
  const dateText = (tr) =>
    tr.days > 1 ? `${fmt(tr.startDate, { weekday: 'short', day: 'numeric' })} – ${fmt(tripEnd(tr), { weekday: 'short', day: 'numeric', month: 'short' })} · ${tn(tr.days, '{n} day', '{n} days')}` : fmt(tr.startDate, { weekday: 'short', day: 'numeric', month: 'short' });
  const todayText = $derived(new Date().toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' }));

  // Ride day (answer 1a): on the days of the trip the app opens the ride view, once a day.
  // v0.29.2 (Noah 6a): not on the day the trip was made: then Noah is still planning or packing.
  const madeToday = (tr) => !!tr?.createdAt && localDay(new Date(tr.createdAt)) === today;
  const riding = $derived(next && nextByBike && !madeToday(next) ? onTripDay(next, today) : false);
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

<!-- v0.23.1 (Noah 3b): one place. Desktop: a card with its heading as now. Phone: folded closed,
     the closed line shows the name and its key number; tap or Enter/Space opens it. -->
{#snippet hub(key, label, href, icon, body)}
  {#if phone.matches}
    <details class="hub folded" bind:open={folds[key]}>
      <summary><h2 id="{key}-h" class="title">{label}</h2><span class="fsum">{hubSum[key]}</span></summary>
      <div class="hub-in">{@render body()}</div>
    </details>
  {:else}
    <section class="hub" aria-labelledby="{key}-h">
      <header><h2 id="{key}-h" class="title"><a {href}>{label}</a></h2>{@render ic(icon, 40)}</header>
      {@render body()}
    </section>
  {/if}
{/snippet}

<div class="home">
  <!-- v0.24.1 (Noah 3a): after "All good": "Saved. Undo" for a few seconds; Noah 4a: the template offer. -->
  {#if quick}
    <section class="card quickdone" aria-label={t('Debrief')}>
      <p class="saved" role="status"><span>{t('Saved: {trip}.', { trip: quick.trip.title })}</span>{#if quick.undo}<button type="button" class="btn sm" onclick={undoQuick}>{t('Undo')}</button>{/if}</p>
      {#if quick.offer}<TemplateOffer trip={quick.trip} name={quick.offer} />{/if}
    </section>
  {/if}

  <!-- What is next: the strongest contrast on the page, ONE main action (v0.23.0, AP07). -->
  {#if focus?.ask}
    <!-- v0.24.1 (Noah 3a): a trip that ended asks how it was: "All good" saves, "In detail" opens the steps. -->
    <section class="band" aria-labelledby="next-h">
      <div class="who">
        <span class="lbl">{todayText} · {t('trip ended')}</span>
        <h1 id="next-h" class="title">{t('How was {trip}?', { trip: lead.title })}</h1>
        <p class="facts">
          <span>{dateText(lead)}</span>{#if !leadByBike}<span>{t(domainName(domainOf(lead)))}</span>{:else if lead.bike}<span>{lead.bike}</span>{/if}
          <span class="num">{tn(leadStats.count, '{n} item', '{n} items')}</span>
        </p>
      </div>
      <div class="acts">
        <button type="button" class="btn hi main" onclick={allGood}>{t('All good')}</button>
        <a class="btn main second" href={focus.href} onclick={() => openTrip(lead.id)}>{t(focus.label)}</a>
        <span class="why">{t(focus.why)}</span>
      </div>
    </section>
  {:else if focus}
    <section class="band" aria-labelledby="next-h">
      <div class="who">
        <span class="lbl">{todayText} · {focus.kind === 'debrief' ? t('trip ended') : t('next trip')}</span>
        <h1 id="next-h" class="title">{lead.title}</h1>
        <p class="facts">
          <span>{dateText(lead)}</span>{#if !leadByBike}<span>{t(domainName(domainOf(lead)))}</span>{:else if lead.bike}<span>{lead.bike}</span>{/if}{#if lead === next && place?.name}<span>{place.name.split(',')[0]}</span>{/if}
          <span class="num">{tn(leadStats.count, '{n} item', '{n} items')}</span>{#if leadStats.gearG}<span class="num">{t('{w} gear', { w: knownWeight(leadStats.gearG, leadStats.gearMissing) })}</span>{/if}{#if leadStats.gearMissing}<span class="num">{t('{n} not weighed', { n: leadStats.gearMissing })}</span>{/if}
        </p>
      </div>
      {#if focus.days != null}
        <div class="count" aria-label={focus.days > 0 ? tn(focus.days, '{n} day to go', '{n} days to go') : t('On the way')}>
          {#if focus.days > 0}<b class="title num">{focus.days}</b><span class="lbl">{focus.days === 1 ? t('day') : t('days')}<br />{t('to go')}</span>{:else}<b class="title now">{t('On the way')}</b>{/if}
        </div>
      {/if}
      <div class="acts">
        <a class="btn hi main" href={focus.href} onclick={() => openTrip(lead.id)}>{t(focus.label)}</a>
        <span class="why">{t(focus.why)}</span>
        <!-- Quiet links, never a second button: the list itself and printing. -->
        {#if focus.kind !== 'debrief'}
          <span class="also-links">
            {#if focus.href !== '#/pack'}<a class="tap" href="#/pack" onclick={() => openTrip(lead.id)}>{t('Show the list')}</a>{/if}
            <a class="tap" href="#/pack?print" onclick={() => openTrip(lead.id)}>{t('Print list')}</a>
          </span>
        {/if}
      </div>
    </section>
  {:else if loaded}
    <section class="band" aria-labelledby="next-h">
      <div class="who">
        <span class="lbl">{todayText}</span>
        <h1 id="next-h" class="title">{t('No trip planned')}</h1>
        <p class="facts"><span>{t('Start a packing list from a template, from your last trip or from the standard set.')}</span></p>
      </div>
      <div class="acts"><button type="button" class="btn hi main" onclick={() => openNew('list')}>{t('Start a new trip')}</button></div>
    </section>
  {/if}

  <!-- v0.23.0 (AP07): everything else that wants attention, one short line each, below the main step. -->
  {#if loaded && ((care && care.status !== 'ok') || prep || debrief || backup.due || notes.length || !bikes.length || (focus?.kind === 'debrief' && next) || alsoToday.length)}
    <section class="also" aria-labelledby="also-h">
      <h2 id="also-h" class="lbl">{t('Also to do')}</h2>
      <ul>
        {#if focus?.kind === 'debrief' && next}
          <li><span>{t('Next trip: {title}', { title: next.title })} · {dateText(next)}</span><a href="#/pack" onclick={() => openTrip(next.id)}>{t('Open the trip')}</a></li>
        {/if}
        {#each alsoToday as tr (tr.id)}
          <li><span>{t('Also today: {title}', { title: tr.title })}{tr.bike ? ` · ${tr.bike}` : ''}</span><a href="#/pack" onclick={() => openTrip(tr.id)}>{t('Open the trip')}</a></li>
        {/each}
        {#if debrief}
          <li><span>{t('Last trip: {title}', { title: debrief.title })}</span><a href="#/debrief/{encodeURIComponent(debrief.id)}" onclick={() => openTrip(debrief.id)}>{t('Write debrief')}</a></li>
        {/if}
        <!-- v0.22.0 (AP06): one line per scope, each to the right bike or trip. -->
        {#if care && care.status !== 'ok'}<li class:late={care.status === 'due'}><span>{bikeCareLine(care)}</span><a href={care.href}>{t('Bike care')}</a></li>{/if}
        {#if prep}<li class:late={prep.overdue > 0}><span>{eventPrepLine(prep)}</span><a href={prep.href}>{t('Tick off in Bike care')}</a></li>{/if}
        {#if backup.due}
          <li class="late"><span>{t('Time for a backup')}: {backup.days == null ? t('You have not saved a backup file yet.') : t('Your last backup is {n} days old.', { n: backup.days })}</span><button type="button" class="link" disabled={backingUp} onclick={backupNow}>{t('Download backup')}</button></li>
        {/if}
        {#if notes.length}<li><span>{tn(notes.length, '{n} note to sort', '{n} notes to sort')}</span><a href="#/inbox">{t('Inbox')}</a></li>{/if}
        {#if !bikes.length}<li><span>{t('No bikes yet.')}</span><a href="#/bikes" onclick={wantBike}>{t('Add a bike')}</a></li>{/if}
      </ul>
    </section>
  {/if}

  <!-- Phone: four ways to create, one tap each (desktop has "New" in the top bar). -->
  <nav class="quick" aria-label={t('Create')}>
    <button type="button" onclick={() => openNew('list')}><span class="ring hi">{@render ic('plus', 22)}</span>{t('Plan a trip')}</button>
    <button type="button" onclick={() => openNote('')}><span class="ring">{@render ic('note', 22)}</span>{t('Note')}</button>
    <button type="button" onclick={addItem}><span class="ring">{@render ic('star', 22)}</span>{t('Gear item|short')}</button>
    <button type="button" onclick={() => openNew('km')}><span class="ring">{@render ic('bike', 22)}</span>{t('Log km')}</button>
  </nav>

  <!-- Where to go (answers 5a, 7a, 8a): three equal places, number → create → open. -->
  <div class="hubs">
    {#snippet packBody()}
      {#if next}
        <div class="sub">
          <!-- v0.27.0 (Noah 1a): the same words as the folded phone line ("{n} % packed"), plus the count. -->
          <div class="line"><b>{next.title}</b><span class="num muted">{t('{n} % packed', { n: packedPct })} · {t('{packed} of {count}|packed', { packed: stats.packed, count: stats.count })}</span></div>
          <div class="bar" role="img" aria-label={t('{n} % packed', { n: packedPct })}><i style:width="{Math.max(2, packedPct)}%"></i></div>
          <p class="small">
            <a href="#/pack" onclick={() => openTrip(next.id)}>{packLine(packing)}</a>{#if extra?.rows.length} · {tn(extra.rows.length, 'Ballast {w} on {n} item you did not use last times.', 'Ballast {w} on {n} items you did not use last times.', { w: weightText(extra.totalG, extra.unweighed) })} <a href="#/pack" onclick={() => openTrip(next.id)}>{t('Leave at home')}</a>{/if}
          </p>
        </div>
      {/if}
      <div>
        <span class="lbl">{t('Open a list')}</span>
        <ul class="rows">
          {#each tripList as tr (tr.id)}
            <li><a href="#/pack" onclick={() => openTrip(tr.id)}><span>{tr.title}</span><span class="num muted">{tr.startDate ? fmt(tr.startDate, { day: 'numeric', month: 'short' }) : ''}{tr.bike ? ` · ${tr.bike}` : ''}</span></a></li>
          {/each}
          {#each templates.slice(0, 2) as tp (tp.id)}
            <li><button type="button" onclick={() => newTrip(tp.id)} title={t('New trip from this template')}><span>{tp.name}</span><span class="muted">{t('template')}</span></button></li>
          {/each}
        </ul>
      </div>
      <!-- v0.25.1 (Noah 1b, 3a): New trip · Write debrief · Past trips · Setups, then More (All templates moved there). -->
      <TripsHubActions {trips} {debriefs} {next} {bikes} />
    {/snippet}
    {@render hub('pack', t('Trips|place'), '#/pack', 'bag', packBody)}

    {#snippet gearBody()}
      <div class="kpis">
        {#if favN.all}<a class="kpi" href="#/gear?fav=1"><b class="title num">{favN.inventory}</b><span class="lbl">{t('favourites owned')}</span>{#if favN.wishlist}<small class="muted">{tn(favN.wishlist, '+ {n} on the wishlist', '+ {n} on the wishlist')}</small>{/if}</a>{/if}
        <div><b class="title num">{gs.inventory.length}</b><span class="lbl">{t('items owned')}</span></div>
      </div>
      {#if cats.length}
        <div>
          <span class="lbl">{t('Where the weight is')}</span>
          <div class="cats">
            {#each cats as c (c.key)}
              <a href="#/gear?cat={c.key}" class="cn">{t(c.name)}</a>
              <div class="bar" role="img" aria-label={knownWeight(c.g, c.unweighed)}><i style:width="{Math.round((c.g / cats[0].g) * 100)}%" style:background={CATEGORY[c.key]?.color}></i></div>
              <span class="num">{knownWeight(c.g, c.unweighed)}</span>
            {/each}
          </div>
        </div>
      {/if}
      <div>
        <span class="lbl">{t('Worth a look')}</span>
        <ul class="rows">
          {#if heaviest}<li><a href="#/gear?q={encodeURIComponent(heaviest.name)}"><span>{t('Heaviest: {name}', { name: nameOf(heaviest) })}</span><span class="num muted">{formatWeight(heaviest.weightG)}</span></a></li>{/if}
          {#if wishTop}<li><a href="#/gear?tab=wishlist"><span>{t('Wishlist top: {name}', { name: nameOf(wishTop.item) })}</span><span class="muted">{tn(gs.wishlist.length, '{n} wish', '{n} wishes')}</span></a></li>{/if}
          {#if gs.unweighed}<li><a href="#/gear?tab=weigh"><span>{tn(gs.unweighed, 'Weigh next: {n} item', 'Weigh next: {n} items')}</span><span class="num muted">{t('{n} % done', { n: weighedPct })}</span></a></li>{/if}
        </ul>
      </div>
      <div class="foot">
        <button type="button" class="btn sm" onclick={addItem}>{@render ic('plus', 16)}{t('Add item')}</button>
        <!-- v0.23.1 (Noah): search right from the card, the cursor waits in Gear's search field. -->
        <a class="btn sm" href="#/gear?find=1">{t('Search')}</a>
        <a class="btn sm" href="#/gear?fav=1">★ {t('Favourites')}</a>
        <a class="btn sm" href="#/gear?tab=wishlist">{t('Wishlist')}</a>
      </div>
    {/snippet}
    {@render hub('gear', t('Gear|place'), '#/gear', 'star', gearBody)}

    {#snippet bikesBody()}
      {#if bikes.length}
        <div class="kpis"><div><b class="title num">{num(totalKm)}</b><span class="lbl">{tn(bikes.length, 'km on {n} bike', 'km on {n} bikes')}</span></div></div>
        <ul class="rows">
          {#each bikes as b (b.id)}
            {@const s = bikeState(b)}
            <li><a href={s.href}><span class="two"><b>{b.name}</b><small class="muted">{s.text}</small></span><span class="tag" class:due={s.due} class:nd={s.tone === 'nodata'}>{s.tag}</span></a></li>
          {/each}
        </ul>
        {#if year}<p class="small">{t('Workshop {year}:', { year: year.year })} <b class="num">{year.unknown === year.visits ? t('cost unknown') : `CHF ${num(Math.round(year.chf))}${year.unknown ? ` + ${t('unknown')}` : ''}`}</b> ({tn(year.visits, '{n} visit', '{n} visits')}).</p>{/if}
      {:else}
        <p class="small">{t('No bikes yet.')} <a href="#/bikes" onclick={wantBike}>{t('Add a bike')}</a></p>
      {/if}
      <!-- v0.25.1 (Noah 2b, 3a): Log a problem · Log km · Bike care · Idea, then More. -->
      <BikesHubActions {bikes} {next} />
    {/snippet}
    {@render hub('bikes', t('Bikes|place'), '#/bikes', 'bike', bikesBody)}
  </div>

  <!-- Good to know (v0.25.1, Noah 1a): only cards with content, the most urgent first, one button each.
       v0.30.0 (Noah 1a): 6 tiles with tips; it waits for every table it reads (a tip must not look unused). -->
  <GoodToKnow loaded={loaded && !!$bikesQ && !!$debriefsQ && !!$visitsQ && !!$learnQ && !!$bagsQ} {today} {next} {place} {trips} {items} {bikes} {visits} {debriefs} {learnings} {notes} containers={$bagsQ ?? []} {backup} demo={$demoQ ?? null} importFrom={$importQ?.from ?? null} {backingUp} onBackup={backupNow} onData={openData} />

  <details class="data" bind:this={dataEl} bind:open={dataOpen}>
    <summary><b>{t('Your data')}</b> <span class="muted">{t('backup, import, export, favourites')}</span></summary>
    <DataPanel />
  </details>

  <footer>
    <span class="dot" class:off={!online}></span>
    {online ? t('Online') : t('Offline')} · v{__APP_VERSION__}
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
    font: 600 var(--fs-small)/1.3 var(--font-body);
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

  /* The band: the next trip */
  .band {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px 32px;
    padding: 22px 26px;
    border-radius: 14px;
    background: var(--brand);
    color: var(--brand-ink);
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
    font-size: var(--fs-page);
    line-height: var(--lh-title);
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
    /* v0.22.0 (AP03): the countdown stays a big condensed number, a deliberate accent. */
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: clamp(64px, 14vw, 96px);
    line-height: 0.85;
    /* on the dark band the bright orange reads (4.7:1), the darker action orange would not */
    color: var(--hi-bright);
  }
  .count .now {
    font-size: var(--fs-page);
  }
  .acts {
    flex: 1 1 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }
  /* v0.23.0 (AP07): one main step; the reason beside it and two quiet links, no second button. */
  .btn.main {
    min-height: 52px;
    padding-inline: 26px;
    font-size: 18px;
  }
  /* v0.24.1 (Noah 3a): "In detail" beside "All good", quieter on the dark band. */
  .btn.second {
    background: transparent;
    border-color: var(--brand-ink);
    color: var(--brand-ink);
  }
  .btn.second:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  .quickdone .saved {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
    margin: 0;
    font-weight: 600;
  }
  .quickdone .saved span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .why {
    flex: 1 1 220px;
    color: #d6e2db;
    font-size: 15px;
  }
  .also-links {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 18px;
  }
  .also-links a {
    color: var(--brand-ink);
    font-size: 15px;
  }
  /* Also to do: short lines, each with its link (not cards, not orange buttons). */
  .also {
    padding: 4px 18px 8px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  .also h2 {
    margin: 10px 0 2px;
  }
  .also ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .also li {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 2px 16px;
    min-height: 44px;
    padding: 6px 0;
    border-bottom: 1px solid #dfe4dc;
  }
  .also li:last-child {
    border-bottom: 0;
  }
  .also li > span {
    flex: 1 1 240px;
    min-width: 0;
    overflow-wrap: anywhere;
    color: var(--ink-2);
  }
  /* due or overdue: a marker and the words of the line, not colour alone */
  .also li.late > span {
    padding-left: 10px;
    border-left: 3px solid var(--hi);
    color: var(--ink);
  }
  .also li > a,
  .also li > .link {
    color: var(--ink);
    font-weight: 600;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
  }

  /* Phone: quick create buttons */
  .quick {
    display: none;
  }
  @media (max-width: 719px) {
    .band {
      padding: 18px;
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
      font: 500 13px/1.25 var(--font-body);
      text-align: center;
      min-width: 0;
      hyphens: auto;
      overflow-wrap: anywhere;
      cursor: pointer;
    }
    .ring {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: 1px solid var(--line);
      background: var(--paper);
    }
    .ring.hi {
      border: 1.5px solid var(--ink);
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
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper);
  }
  .hub header h2 { min-width: 0; overflow-wrap: anywhere; }
  .hub header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .hub h2 {
    margin: 0;
    font-size: var(--fs-section);
    line-height: var(--lh-title);
  }
  .hub h2 a {
    color: var(--ink);
    text-decoration: none;
  }
  .hub h2 a:hover {
    color: var(--hi);
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
    font-size: var(--fs-small);
  }
  .tag {
    flex: none;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .tag.nd {
    padding: 2px 9px;
    border: 1.5px dashed var(--ink-3);
    border-radius: 999px;
    color: var(--ink-2);
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
  .kpis div,
  .kpis .kpi {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0 8px;
  }
  /* v0.22.0 (AP05): the favourites number opens Gear with the favourites filter on. */
  .kpis .kpi {
    color: inherit;
    text-decoration: none;
  }
  .kpis .kpi small {
    flex-basis: 100%;
    font-size: 13px;
  }
  @media (hover: hover) {
    .kpis .kpi:hover .lbl {
      text-decoration: underline;
    }
  }
  .kpis b {
    font-family: var(--font-brand);
    font-weight: 800;
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
  /* v0.27.0 (AP21): the category links are taller on a touch screen (were 21 px). */
  @media (pointer: coarse) {
    .cats .cn {
      padding: 10px 0;
    }
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

  /* v0.23.1 (Noah 3b): folded on a phone, one line closed (name + key number), open on touch or keyboard */
  .folded {
    padding: 0;
    gap: 0;
  }
  .folded > summary {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 12px;
    min-height: 52px;
    padding: 12px 40px 12px 16px;
    box-sizing: border-box;
    position: relative;
    list-style: none;
    cursor: pointer;
  }
  .folded > summary::-webkit-details-marker {
    display: none;
  }
  /* the chevron: down closed, up open (the state also reads from the summary itself) */
  .folded > summary::after {
    content: '';
    position: absolute;
    right: 18px;
    top: 22px;
    width: 9px;
    height: 9px;
    border-right: 2.2px solid var(--ink-2);
    border-bottom: 2.2px solid var(--ink-2);
    transform: rotate(45deg);
  }
  .folded[open] > summary::after {
    top: 26px;
    transform: rotate(-135deg);
  }
  .folded > summary:focus-visible {
    outline: var(--focus-ring);
    outline-offset: -3px;
    border-radius: 14px;
  }
  .folded > summary h2 {
    margin: 0;
    font-size: var(--fs-section);
    line-height: var(--lh-title);
  }
  .fsum {
    min-width: 0;
    color: var(--ink-2);
    font-size: 15px;
    overflow-wrap: anywhere;
  }
  .hub-in {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 0 16px 16px;
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
    font-size: var(--fs-small);
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
