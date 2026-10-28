<script>
  /**
   * Paket N «Pläne und Träume» (Noah 19.10.2026 «1a 2b 3a und b»): Touren › Träume (#/trips/dreams).
   * - #32 your dream tours as a list (order with arrows and drag); one tap «Plan the tour» makes a trip draft.
   * - #287 the year band January to December: when each dream fits (months suggested by the kind of tour,
   *   changeable per dream). A tap on a month shows only the dreams of that month.
   * - #1008 races from Inspiration and from your Google calendar («Rennen», «Race» … in the title) become
   *   a planned trip with the race block and the registration deadline; deadlines show here until you
   *   tick «Signed up».
   * - The kinds of tour are a group: add your own, rename, delete (GroupDeleteSheet, Undo).
   * Data: settings DREAMS_KEY (dreams.js), in every backup. Nothing is fetched online.
   */
  import { liveQuery } from 'dexie';
  import AreaIntro from '../lib/intro/AreaIntro.svelte'; // «Anleitungen überall»: the guide of this page (lib/guides.js)
  import { db } from '../lib/db.js';
  import { DREAMS_KEY, MONTHS, linkKind, storeOf, newDream, dreamList, moveDream, monthsOf, seasonText, yearBand, nextWindow, suggestStart, kindName, addKind, renameKind, deleteKind, plannableRaces, raceDays, raceEvent, deadlines, daysUntil, WEEK_HIDE_KEY } from '../lib/dreams.js';
  import { RIG_KEY } from '../lib/inspiration.js';
  import { newTrip, toggleSet } from '../lib/trips.js';
  import { sortBikes } from '../lib/bikes.js';
  import { switchTrip } from '../lib/nav.js';
  import { localDay } from '../lib/localday.js';
  import { sortable } from '../lib/ui/sortable.js';
  import SortGrip from '../lib/ui/SortGrip.svelte';
  import SortArrows from '../lib/ui/SortArrows.svelte';
  import GroupActions from '../lib/ui/GroupActions.svelte';
  import GroupDeleteSheet from '../lib/ui/GroupDeleteSheet.svelte';
  import { deleteWithUndo } from '../lib/ui/ask.js';
  import Empty from '../lib/ui/Empty.svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import DreamSheet from '../lib/dreams/DreamSheet.svelte';
  import PlanSheet from '../lib/dreams/PlanSheet.svelte';
  import WhiteSpots from '../lib/neuland/WhiteSpots.svelte'; // Träume und Neuland N1
  import NeulandGoals from '../lib/neuland/NeulandGoals.svelte'; // Träume und Neuland N5
  import TripTips from '../lib/neuland/TripTips.svelte'; // N3 «Heute passt: Ausflugstipps»
  import DreamsMap from '../lib/dreams/DreamsMap.svelte'; // N14 «Karte aller Träume»
  import MonthIdeas from '../lib/dreams/MonthIdeas.svelte'; // N8 «Passt jetzt: Ideen pro Monat»
  import BiwakCard from '../lib/dreams/BiwakCard.svelte'; // N6 «Feierabend-Biwak»
  import TrainHome from '../lib/neuland/TrainHome.svelte'; // N7 «Zug hin, Velo heim»
  import { nightFields } from '../lib/context.js';
  import { linkIn, readLink, withLink, distText } from '../lib/dreams/fromlink.js'; // N13 «Ein Link wird ein Traum»
  import { fulfilledDreams } from '../lib/dreams/erfuellt.js'; // N17 «Erfüllte Träume»
  import { refreshDreamWx, windowsOf, dayRange, DREAM_WX } from '../lib/dreams/wetterfenster.js'; // N15 «Wetterfenster»
  import { t, tn, num, locale } from '../lib/i18n.svelte.js';
  import { Sparkles, Flag, ChevronRight, Plus, Check, CalendarClock, Route, Pencil, Compass, Flame } from '@lucide/svelte';
  import '../lib/ich/ich.css';

  const today = localDay();
  const storeQ = liveQuery(() => db.settings.get(DREAMS_KEY));
  const linksQ = liveQuery(() => db.settings.get(RIG_KEY));
  const eventsQ = liveQuery(() => db.gEvents.where('day').aboveOrEqual(today).toArray().catch(() => []));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray()); // N17: a dream counts as fulfilled once its trip has its debrief
  const weekHideQ = liveQuery(() => db.settings.get(WEEK_HIDE_KEY));
  const weekHidden = $derived($weekHideQ?.value === true);

  const store = $derived(storeOf($storeQ?.value));
  const kinds = $derived(store.kinds);
  const list = $derived(dreamList(store.dreams));
  const band = $derived(yearBand(store.dreams, kinds));
  const trips = $derived($tripsQ ?? []);
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const races = $derived(plannableRaces({ links: $linksQ?.value ?? [], events: $eventsQ ?? [], trips }, today));
  const due = $derived(deadlines(trips, today));
  const fulfilled = $derived(fulfilledDreams(store.dreams, trips, $debriefsQ ?? [], today));
  const doneDay = $derived(new Map(fulfilled.map((f) => [f.dream.id, f.day])));
  const nowMonth = Number(today.slice(5, 7));
  // N15 «Wetterfenster»: dry days in a row for the dreams that fit now (forecast kept on this device)
  const homeQ = liveQuery(async () => (await db.settings.get('homePlace'))?.value ?? null);
  const wxQ = liveQuery(async () => (await db.meta.get(DREAM_WX)) ?? null);
  const nowDreams = $derived(list.filter((d) => !d.tripId && nextWindow(d, today, kinds)?.now));
  const wxWin = $derived(windowsOf(nowDreams, $homeQ, $wxQ, today));
  $effect(() => {
    const ds = $state.snapshot(nowDreams);
    const home = $homeQ;
    if ($homeQ === undefined || !ds.length) return;
    refreshDreamWx(db, ds, home).catch(() => {});
  });

  let view = $state('list'); // «list», «map» or «year»
  let month = $state(0); // 0: all months
  const shown = $derived(month ? list.filter((d) => !d.tripId && monthsOf(d, kinds).includes(month)) : list);

  async function save(next) {
    const value = { dreams: next.dreams ?? store.dreams, kinds: next.kinds ?? store.kinds };
    await db.settings.put({ key: DREAMS_KEY, value: $state.snapshot(value) });
  }
  const putDream = (d) => save({ dreams: store.dreams.some((x) => x.id === d.id) ? store.dreams.map((x) => (x.id === d.id ? d : x)) : [...store.dreams, d] });

  let title = $state('');
  let msg = $state('');
  let reading = $state(false);
  async function add(e) {
    e.preventDefault();
    if (!title.trim()) return (msg = t('Write the name of a dream tour.'));
    msg = '';
    // N13: a pasted link (Ride with GPS, komoot, a report) reads the name, km and climb
    const url = linkIn(title);
    if (url) return addFromLink(url, title.replace(url, '').replace(/^https?:\/\//, '').trim());
    const d = newDream({ title }, { id: `dream-${Date.now().toString(36)}`, kinds });
    await save({ dreams: [d, ...store.dreams] });
    title = '';
    done = t('«{name}» added under {kind}. Tap it to change the months.', { name: d.title, kind: kindName(kinds, d.kind, t) });
  }
  // N6: an after-work bivouac becomes a two-day trip with the bivouac block; the note keeps the place and the times
  function biwakPlan({ name, day, spot, cfg }) {
    const where = spot ? `${spot.name || t('Place to sleep')} (${spot.lat}, ${spot.lon})` : '';
    plan = { kind: 'biwak', name, start: day, days: 2, note: [t('Off {start}, back {back}', { start: cfg.start, back: cfg.back }), where].filter(Boolean).join(' · ') };
  }
  // N8: a month idea becomes a dream with its months
  async function ideaDream({ title: name, months }) {
    const d = { ...newDream({ title: name }, { id: `dream-${Date.now().toString(36)}`, kinds }), months: [...months] };
    await save({ dreams: [d, ...store.dreams] });
    done = t('«{name}» added as a dream. Tap it to change the months.', { name: d.title });
  }
  async function addFromLink(url, own) {
    reading = true;
    done = '';
    let info = null;
    let fail = '';
    try {
      info = await readLink(url);
    } catch (err) {
      fail = err.message;
    }
    reading = false;
    const name = own || info?.title || linkKind(url) || url;
    const base = newDream({ title: name, url }, { id: `dream-${Date.now().toString(36)}`, kinds });
    const d = info ? withLink(base, info, { keepTitle: !!own }) : base;
    await save({ dreams: [d, ...store.dreams] });
    title = '';
    const what = distText(d, num);
    done = fail
      ? t('«{name}» added with its link. {why} The name can be changed in the dream.', { name: d.title, why: fail })
      : what
        ? t('«{name}» added from the link: {what}.', { name: d.title, what })
        : t('«{name}» added from the link. The page names no km; a GPX file adds the map.', { name: d.title });
  }

  let open = $state(null);
  const openDream = $derived(open ? store.dreams.find((d) => d.id === open) : null);
  let plan = $state(null); // { kind: 'dream'|'race'|'biwak', dream?, race?, note?, name, start, days }
  let done = $state('');

  const ymText = (ym) => new Date(`${ym}-15T12:00:00Z`).toLocaleDateString(locale(), { month: 'long', year: 'numeric' });
  const monthsText = (d) => seasonText(monthsOf(d, kinds), (m) => t(MONTHS[m - 1]));
  function windowText(d) {
    if (doneDay.has(d.id)) return t('Fulfilled in {when}', { when: ymText(doneDay.get(d.id).slice(0, 7)) });
    if (d.tripId) return t('Planned as a trip');
    const w = nextWindow(d, today, kinds);
    if (w?.now && wxWin.has(d.id)) return t('Fits now, dry {days}', { days: dayRange(wxWin.get(d.id), locale()) });
    return !w ? '' : w.now ? t('Fits now') : t('Next: {when}', { when: ymText(w.ym) });
  }
  // Umbau Träume: a state (fits now, dry days, fulfilled, planned) is a chip; «Next: April 2027» stays in the grey line
  const isChip = (d) => !!windowText(d) && (doneDay.has(d.id) || !!d.tripId || !!nextWindow(d, today, kinds)?.now);
  const dayText = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' });

  async function makeTrip({ name, start, days, bike, signupBy }) {
    const all = await db.trips.toArray();
    const items = await db.items.toArray();
    let trip = { ...newTrip({ title: name, startDate: start, days, bike }, all, items), idea: !start };
    // toggleSet gives only { sets, entries }: the trip keeps its id and the rest
    if (plan.kind === 'race') {
      trip = { ...trip, ...toggleSet(trip, items, 'race', true), event: raceEvent(plan.race, { signupBy }) };
    } else if (plan.kind === 'biwak') {
      // N6: the bivouac night brings its building block, so the packing list is ready
      trip = { ...trip, ...nightFields('bivy'), ...toggleSet(trip, items, 'bivy', true), note: plan.note };
    } else {
      trip = { ...trip, fromDream: plan.dream.id, ...(plan.taste ? { note: plan.dream.taste ?? '' } : plan.dream.url ? { note: `${plan.dream.title} ${plan.dream.url}` } : {}) };
    }
    await db.trips.put(trip);
    if (plan.kind === 'dream') await putDream(plan.taste ? { ...plan.dream, tasteTripId: trip.id } : { ...plan.dream, tripId: trip.id }); // Paket B, UC-055-I1: a taste does not plan the dream itself
    switchTrip(trip.id, '#/pack');
  }
  async function signedUp(tripId) {
    const tr = await db.trips.get(tripId);
    if (tr?.event) await db.trips.put({ ...tr, event: { ...tr.event, signedUp: true } });
  }

  // kinds of tour (a group)
  let newKind = $state('');
  let deleting = $state.raw(null);
  const countOf = (key) => store.dreams.filter((d) => d.kind === key).length;
  async function addOwnKind(e) {
    e.preventDefault();
    if (!newKind.trim()) return;
    await save({ kinds: addKind(kinds, newKind) });
    newKind = '';
  }
  async function removeKind(k, to) {
    const name = kindName(kinds, k.key, t);
    const before = $state.snapshot(store);
    await deleteWithUndo({
      run: async () => {
        await save(deleteKind(before, k.key, to));
        return before;
      },
      undo: (snap) => db.settings.put({ key: DREAMS_KEY, value: snap }),
      text: t('Kind of tour «{name}» deleted.', { name }),
      name,
    });
  }
  import PasstHier from '../lib/ui/PasstHier.svelte'; // «Wegweiser statt Katalog» PR 6
</script>

<div class="ich-page dreams" data-page="dreams">
  <VeloHead crumbs={[{ label: t('Trips|place'), href: '#/trips' }]} title={t('Dreams|page')} sub={t('Dream tours with their season, races as event tours')} />
  <p class="dr-intro">{t('Tours you dream of. The app tells you when they fit.')}</p>
  <AreaIntro place="dreams" />

  <form class="card cap" onsubmit={add}>
    <label class="capt"><span class="sr">{t('New dream tour')}</span><input class="inp" type="text" bind:value={title} maxlength="80" placeholder={t('e.g. Over the Furka and Grimsel')} /></label>
    <button type="submit" class="btn hi" disabled={reading} data-dream-add><Plus size={16} aria-hidden="true" />{reading ? t('Reading the link…') : t('Add')}</button>
    <p class="caph">{t('«A link becomes a dream»: paste a link from Ride with GPS, komoot or a report, and name, km and climb come along.')}</p>
    {#if msg}<p class="err" role="alert">{msg}</p>{/if}
  </form>
  {#if done}<p class="ok" role="status"><Check size={16} aria-hidden="true" />{done}</p>{/if}

  {#if view === 'list'}<p class="ich-help dr-more" data-dreams-more>{t('Open a dream for «Ready for the dream?». A dream that fits now gets a «Weather window for dreams». «All dreams on one map» is the view Map; «Fulfilled dreams» is the closed row at the end of the list; «Fits now: ideas per month» and «After-work bivouac» sit under the list.')}</p>{/if}

  <TripTips />

  {#if due.length}
    <section class="ich-sec" aria-labelledby="dr-due" data-deadlines>
      <div class="ich-h"><div><h2 id="dr-due">{t('Registration deadlines')}</h2><p class="ich-hs">{t('Tick «Signed up» and the reminder goes.')}</p></div></div>
      <ul class="card ich-list">
        {#each due as x (x.tripId)}
          <li class="ich-row">
            <span class="ich-ib"><CalendarClock size={18} aria-hidden="true" /></span>
            <span class="ich-m"><b>{x.title}</b><small>{t('Register by {day}', { day: dayText(x.signupBy) })} · {x.days === 0 ? t('today') : tn(x.days, 'in {n} day', 'in {n} days')}</small></span>
            <button type="button" class="btn sm" onclick={() => signedUp(x.tripId)}><Check size={16} aria-hidden="true" />{t('Signed up')}</button>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <!-- Umbau Träume-Seite (Noah 02.11.2026 «1a 2a 3a 4a 5a»): the list is the main thing; map and year are views, not blocks below -->
  <div class="dr-seg" role="group" aria-label={t('View')} data-dreams-views>
    <button type="button" aria-pressed={view === 'list'} data-view="list" onclick={() => (view = 'list')}>{t('List|view')}</button>
    <button type="button" aria-pressed={view === 'map'} data-view="map" onclick={() => (view = 'map')}>{t('Map|view')}</button>
    <button type="button" aria-pressed={view === 'year'} data-view="year" onclick={() => (view = 'year')}>{t('Year|view')}</button>
  </div>

  {#if view === 'year'}
  <section class="ich-sec" aria-labelledby="dr-year" data-yearband>
    <div class="ich-h"><div><h2 id="dr-year">{t('Your year')}</h2><p class="ich-hs">{t('How many dreams fit in each month. A tap shows them.')}</p></div></div>
    <div class="card band" role="group" aria-label={t('Your year')}>
      {#each band as m (m.month)}
        <button type="button" class="mo" class:now={m.month === nowMonth} aria-pressed={month === m.month} data-month={m.month} onclick={() => (month = month === m.month ? 0 : m.month)}>
          <span class="mn">{t(MONTHS[m.month - 1])}</span>
          <span class="dots" aria-hidden="true">{#each m.dreams.slice(0, 4) as d (d.id)}<i></i>{/each}</span>
          <span class="num">{m.dreams.length}</span>
        </button>
      {/each}
    </div>
  </section>
  {/if}

  {#if view === 'list'}
  <section class="ich-sec" aria-labelledby="dr-list">
    <div class="ich-h"><div><h2 id="dr-list">{month ? t('Dreams in {month}', { month: t(MONTHS[month - 1]) }) : t('Your dreams')} <small class="n num">{shown.length}</small></h2>{#if month}<button type="button" class="btn btn-link" onclick={() => (month = 0)}>{t('Show all')}</button>{/if}</div></div>
    {#if !shown.length}
      <Empty icon={Sparkles} text={month ? t('No dream fits in this month yet.') : t('No dream yet. Write one above.')} />
    {:else}
      <ul class="card ich-list" use:sortable={{ onmove: (from, to) => !month && save({ dreams: moveDream(store.dreams, from, to) }) }}>
        {#each shown as d, i (d.id)}
          <li data-sort-id={d.id} data-dream={d.id}>
            <div class="ich-row">
              {#if !month}<SortGrip name={d.title} onstep={(dir) => save({ dreams: moveDream(store.dreams, i, i + dir) })} />{/if}
              <button type="button" class="open" onclick={() => (open = d.id)}>
                {#if d.photo}<img class="thumb" src={d.photo} alt="" />{:else}<span class="ich-ib">{#if d.tripId}<Route size={18} aria-hidden="true" />{:else}<Sparkles size={18} aria-hidden="true" />{/if}</span>{/if}
                <span class="ich-m"><b>{d.title}</b><small>{[kindName(kinds, d.kind, t), monthsText(d), isChip(d) ? '' : windowText(d), distText(d, num)].filter(Boolean).join(' · ')}</small>{#if isChip(d)}<span class="dr-chips"><span class="dr-chip">{windowText(d)}</span></span>{/if}</span>
              </button>
              {#if !month}<SortArrows name={d.title} {i} n={shown.length} onstep={(dir) => save({ dreams: moveDream(store.dreams, i, i + dir) })} />{/if}
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  {/if}

  {#if view !== 'map'}
  <MonthIdeas month={month || nowMonth} current={!month || month === nowMonth} onmakedream={ideaDream} />
  <BiwakCard onplan={biwakPlan} />
  <TrainHome />
  {/if}

  {#if view === 'list'}
    <!-- N17 «Erfüllte Träume»: the dreams you rode, once the debrief is done; a closed row at the bottom of the list (Noah 03.11.2026 «5a»); a tap opens the debrief -->
    <details class="dr-done" data-dreams-done>
      <summary><Check size={16} aria-hidden="true" />{t('Fulfilled dreams')}<small class="num dr-cnt">{fulfilled.length}</small></summary>
      <p class="ich-hs" id="dr-done">{t('Dreams you rode. They count once the debrief is done.')}</p>
      {#if !fulfilled.length}
        <Empty icon={Check} text={t('No fulfilled dream yet. A dream counts once its trip has the debrief.')} />
      {:else}
      <ul class="card ich-list">
        {#each fulfilled as f (f.dream.id)}
          <li>
            <a class="ich-row done-row" href="#/debrief/{encodeURIComponent(f.trip.id)}" data-dream-done={f.dream.id}>
              {#if f.dream.photo}<img class="thumb" src={f.dream.photo} alt="" />{:else}<span class="ich-ib"><Check size={18} aria-hidden="true" /></span>{/if}
              <span class="ich-m"><b>{f.dream.title}</b><small>{[t('Fulfilled in {when}', { when: ymText(f.day.slice(0, 7)) }), distText(f.dream, num)].filter(Boolean).join(' · ')}</small></span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
        {/each}
      </ul>
      {/if}
    </details>
  {/if}

  {#if view === 'map'}
  <DreamsMap dreams={list.filter((d) => !doneDay.has(d.id))} onopen={(id) => (open = id)} />
  {/if}

  <WhiteSpots />
  <NeulandGoals />
  <!-- below the heimat measure of the functions above (2.5 screens): the row must not push «Herausforderungen mit Ende» out of it -->
  <div class="dr-passt"><PasstHier place="dreams" /></div>

  <section class="ich-sec" aria-labelledby="dr-races" data-races>
    <div class="ich-h"><div><h2 id="dr-races">{t('Races to plan')}</h2><p class="ich-hs">{t('From Inspiration and from your Google calendar («Rennen», «Race» … in the title).')}</p></div></div>
    {#if races.length}
      <ul class="card ich-list">
        {#each races as r (r.key)}
          <li class="ich-row" data-race={r.key}>
            <span class="ich-ib"><Flag size={18} aria-hidden="true" /></span>
            <span class="ich-m"><b>{r.title}</b><small>{dayText(r.raceDate)} · {r.source === 'calendar' ? t('Google calendar') : t('Inspiration')} · {tn(daysUntil(r.raceDate, today), 'in {n} day', 'in {n} days')}</small></span>
            <button type="button" class="btn sm" onclick={() => (plan = { kind: 'race', race: r, name: r.title, start: r.raceDate, days: raceDays(r) })}><Route size={16} aria-hidden="true" />{t('Plan as a trip')}</button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="ich-help">{t('No upcoming race yet. Add one in Inspiration with its date, or put it in your Google calendar.')} <a href="#/inspiration">{t('Inspiration')}</a></p>
    {/if}
  </section>

  <!-- «Träume und Neuland» (Noah 27.10.2026 «1-5 a»): what you reached for the first time stays under Rückblick, linked from here -->
  <section class="ich-sec" aria-labelledby="dr-got" data-dreams-got>
    <div class="ich-h"><div><h2 id="dr-got">{t('Collected|dreams')}</h2><p class="ich-hs">{t('Where you were for the first time: cantons, passes, lakes and more, and all your rides on one map.')}</p></div></div>
    <div class="got">
      <a class="btn" href="#/neuland" data-dreams-neuland><Compass size={16} aria-hidden="true" />{t('New ground')}</a>
      <a class="btn" href="#/heatmap" data-dreams-heatmap><Flame size={16} aria-hidden="true" />{t('Heatmap')}</a>
    </div>
  </section>

  <section class="ich-sec" aria-labelledby="dr-kinds" data-kinds>
    <details class="kfold">
    <summary><span><b id="dr-kinds">{t('Kinds of tour')}</b> <small class="n num">{kinds.length}</small><small class="ich-hs">{t('Each kind suggests its months. Rename, delete or add your own.')}</small></span></summary>
    <div class="card ich-body kinds">
      {#each kinds as k (k.key)}
        <GroupActions name={kindName(kinds, k.key, t)} count={countOf(k.key)} allowEmpty={!k.key.startsWith('own-')}
          renameExplain={t('every dream of this kind gets the new name')} deleteExplain={t('only the kind goes; its dreams stay with their months')}
          deleteAsk="" onrename={(v) => save({ kinds: renameKind(kinds, k.key, v) })} ondelete={() => (deleting = k)}>
          <h3 class="kn">{kindName(kinds, k.key, t)}</h3><p class="ich-hs">{seasonText(k.months ?? [], (m) => t(MONTHS[m - 1])) || t('the race month')} · {tn(countOf(k.key), '{n} dream', '{n} dreams')}</p>
        </GroupActions>
      {/each}
      <form class="addk" onsubmit={addOwnKind}>
        <input class="inp" type="text" bind:value={newKind} maxlength="40" placeholder={t('Own kind of tour')} aria-label={t('Own kind of tour')} />
        <button type="submit" class="btn"><Plus size={16} aria-hidden="true" />{t('Add')}</button>
      </form>
      <p class="ich-help"><Pencil size={14} aria-hidden="true" /> {t('A new kind suggests May to September; change the months on each dream.')}</p>
    </div>
    </details>
    <!-- idea 5: the dreams card in «Woche planen» can be hidden there and comes back here -->
    <label class="ck wk"><input type="checkbox" checked={!weekHidden} onchange={(e) => db.settings.put({ key: WEEK_HIDE_KEY, value: !e.currentTarget.checked })} data-week-show /><span>{t('Show fitting dreams and deadlines in «Plan the week»')}</span></label>
  </section>
</div>

{#if openDream}
  {#key open}<DreamSheet dream={openDream} {kinds} onchange={putDream} onremove={async (id) => (await save({ dreams: store.dreams.filter((x) => x.id !== id) }), id)} onplan={(d, taste = false) => (plan = { kind: 'dream', dream: d, taste, name: taste ? t('Taste of {name}', { name: d.title }) : d.title, start: suggestStart(d, today, kinds), days: taste ? 1 : d.days || 2 })} onclose={() => (open = null)} />{/key}
{/if}
{#if plan}
  <PlanSheet title={plan.kind === 'race' ? t('Plan the race as a trip') : t('Plan the tour')} sub={plan.kind === 'race' ? t('With the race building block and the registration deadline') : plan.kind === 'biwak' ? t('Two days with the bivouac building block: the packing list is ready') : t('A trip draft from your dream')} name={plan.name} start={plan.start} days={plan.days} race={plan.kind === 'race'} {bikes} onsave={makeTrip} onclose={() => (plan = null)} />
{/if}
{#if deleting}
  {@const k = deleting}
  <GroupDeleteSheet
    title={t('Delete the kind of tour «{name}»?', { name: kindName(kinds, k.key, t) })}
    count={countOf(k.key)}
    what={(n) => tn(n, '{n} dream', '{n} dreams')}
    none={t('No kind of tour')}
    noneHint={t('The dreams keep their months. No dream is deleted.')}
    targets={kinds.filter((x) => x.key !== k.key).map((x) => ({ id: x.key, name: kindName(kinds, x.key, t) }))}
    onconfirm={(to) => removeKind(k, to)}
    onclose={() => (deleting = null)}
  />
{/if}

<style>
  .dr-passt {
    margin-bottom: 20px;
  }
  .dreams {
    max-width: 900px;
  }
  .dr-seg { display: flex; background: var(--paper); border: 1px solid var(--line); border-radius: var(--r-ctl); padding: 3px; margin: 0 0 var(--sp-3); }
  .dr-seg button { flex: 1; min-height: 44px; border: 0; border-radius: var(--r-ctl); background: transparent; font: inherit; font-weight: 600; color: var(--ink-2); cursor: pointer; }
  .dr-seg button[aria-pressed='true'] { background: var(--card); color: var(--ink); box-shadow: 0 0 0 1px var(--line); }
  .dr-more { margin: var(--sp-3) 0; }
  .dr-cnt { margin-left: var(--sp-2); }
  .dr-done { margin-top: var(--sp-3); }
  .dr-done > summary { display: flex; align-items: center; gap: var(--sp-2); cursor: pointer; padding: var(--sp-3) 0; }
  .dr-chips { display: block; margin-top: 2px; }
  .dr-chip { display: inline-block; white-space: nowrap; font-size: var(--fs-small); font-weight: 600; border-radius: 99px; padding: 1px var(--sp-2); background: var(--accent-soft); color: var(--accent-ink); }
  .dr-intro {
    max-width: 65ch;
    margin: 0 0 var(--sp-4);
    color: var(--ink-2);
  }
  .cap {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 var(--sp-3);
    padding: 10px 12px;
  }
  .caph {
    flex: 1 0 100%;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .capt {
    flex: 1 1 14em;
    min-width: 0;
  }
  .capt .inp {
    width: 100%;
    box-sizing: border-box;
  }
  .band {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 4px;
    padding: 8px;
  }
  @media (max-width: 700px) {
    .band {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }
  }
  .mo {
    display: grid;
    justify-items: center;
    gap: 2px;
    min-width: 0;
    min-height: 56px;
    padding: 6px 2px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .mo.now {
    border-color: var(--accent);
    font-weight: 600;
  }
  .mo[aria-pressed='true'] {
    background: var(--ink);
    color: var(--paper);
  }
  .dots {
    display: flex;
    gap: 2px;
    min-height: 6px;
  }
  .dots i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
  }
  li .ich-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .open {
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    gap: 10px;
    min-width: 0;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .kfold summary {
    display: flex;
    align-items: center;
    min-height: 44px;
    cursor: pointer;
  }
  .kfold summary span {
    display: grid;
  }
  .got {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .kinds {
    display: grid;
    gap: 4px;
  }
  .kn {
    margin: 0;
    font-size: var(--fs-body);
  }
  .addk {
    display: flex;
    gap: 6px;
    margin-top: 8px;
  }
  .addk .inp {
    flex: 1 1 auto;
    min-width: 0;
  }
  .ok {
    display: flex;
    gap: 6px;
    align-items: center;
    color: var(--ok);
  }
  .done-row {
    color: inherit;
    text-decoration: none;
  }
  .thumb {
    width: 36px;
    height: 36px;
    flex: none;
    object-fit: cover;
    border-radius: 8px;
  }
  .ck.wk {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 12px 0 0;
  }
</style>
