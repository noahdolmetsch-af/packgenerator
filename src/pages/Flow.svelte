<script>
  /**
   * v0.51.0 «Im Flow – kleiner Start» (mockups ImFlow-Phone / -Desktop, approved 9.10.2026).
   *   #/flow             the page: three rings (rolling 7 days), «Heute abhaken», «Ziele × Tage»
   *                      (7 days on a phone, 14 on a computer), the daily check, recovery and seasons
   *   #/flow/goals       all activities, in their order (drag the grip or use the arrow keys)
   *   #/flow/edit/<id>   edit one activity; #/flow/new a new one (the same form, empty)
   *   #/flow/training    «Training» TR2: every Strava activity with its heart rate zones (pages/flow/Training.svelte);
   *                      …/a/<id> one activity (TR3, TrainingAct.svelte)
   *   #/flow/plans       «Trainingspläne»: sample plans for ultracycling, …/<id> one plan (pages/flow/TrainingPlans.svelte, lazy)
   *   #/flow/activity    hobby pages 1: Aktiv › Aktivität (pages/flow/Activity.svelte)
 *   #/flow/sports      Paket O «Sportarten»: every sport, its colour and the mosaic (pages/flow/Sports.svelte, lazy);
 *                      #/flow/sport/<id> one sport with its blocks (pages/flow/Sport.svelte, lazy)
   *   #/flow/milestones  hobby pages 1: all milestones (pages/flow/Milestones.svelte), ?act=, ?tune=1
   *   #/flow/week        v0.130.0 «Woche» (mockup AK1): the week with fixed dates and suggestions (pages/flow/Week.svelte)
   *   #/flow/review      «Wochenrückblick» (W1–W6, Noah 15.10.2026 «1-5 a»), ?w=<Monday> (pages/flow/WeekReview.svelte)
   *   #/flow/rest        «Erholung» (mockup AK2): the recovery ring, a pause hint, ticks (pages/flow/Rest.svelte)
   *   #/flow/ideen       «Meine Ideen» (HN4c, Noah «4 ok»): tips for the balance and the own ideas list (pages/flow/Ideas.svelte)
   *   #/flow/bags        «Sporttasche» (mockup AK3): a packing list per sport (pages/flow/Bags.svelte)
   *   #/flow/trophies    v0.123.0 the trophy showcase, all stars by area and year (pages/flow/Trophies.svelte)
   *   #/flow/gipfelbuch  v0.165.0 «Gipfelbuch für alle»: passes, summits, trails and places of every sport (pages/flow/Gipfelbuch.svelte)
   *   #/flow/act/<id>    hobby pages 2: an activity's own page (Meditation.svelte, B1); …/timer the
   *                      intervals (MedTimer.svelte, B2); the running session is in FlowLayer (B7)
   *   …/done/<sid>       hobby pages 3: the evaluation after the gong (MedDone.svelte, B3)
   *   …/log              hobby pages 3: the log, list · calendar · chart (MedLog.svelte, B4 + B6)
   *   …/s/<sid>          hobby pages 3: one session in full (MedSession.svelte, B5)
   *   …/muster           v0.105.0 Design-Refresh P8 (A14c): the patterns of the log (MedPatterns.svelte)
   *   …/rueckblick     «Meditation» (mockup ME3): the Rückblick by week, month or year (MedReview.svelte)
   *   …/mehr             v0.86.0 «Meditation einfach»: «Mehr», the rare things folded (MedMore.svelte, C)
   * The rules are pure and tested (lib/flow.js, flowcheck.js, flowtimer.js, flowbowl.js).
   */
  import Ideas from './flow/Ideas.svelte';
  import LiveStart from '../lib/live/LiveStart.svelte';
  import PinnedLists from '../lib/merken/PinnedLists.svelte';
  import { Plus, Sun, GripVertical, Lightbulb, Timer, Snowflake, ChevronRight } from '@lucide/svelte';
  import { inSeason } from '../lib/ski.js';
  import HintCard from '../lib/pageinfo/HintCard.svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { flowQuery, seedIfNeeded } from '../lib/flow/data.svelte.js';
  import { restRows } from '../lib/flow/restlist.js';
  import { flowStates, rings as ringsOf, lastDays, halfOf, halfEnds, halfSince, moveAct, gridRow } from '../lib/flow.js';
  import { averages, checkOf, FIXED } from '../lib/flowcheck.js';
  import { saveOrder } from '../lib/flowdb.js';
  import { openTimer, actName, goalName } from '../lib/flow/ui.svelte.js';
  import { actGoalText, goalsText, dayShort } from '../lib/flow/words.js';
  import Rings from '../lib/flow/Rings.svelte';
  import TickGrid from '../lib/flow/TickGrid.svelte';
  import Sec from '../lib/flow/kit/Sec.svelte';
  import YearGoals from '../lib/flow/YearGoals.svelte';
  import AzmWeek from '../lib/health/AzmWeek.svelte';
  import Rows from '../lib/flow/kit/Rows.svelte';
  import Crumb from '../lib/flow/kit/Crumb.svelte';
  import GoalPath from '../lib/flow/kit/GoalPath.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { seasonNow, goalPath } from '../lib/flow/aktiv.js';
  import { msContext, allMilestones, TUNE_KEY } from '../lib/flowms.js';
  import { waitingThisMonth } from '../lib/kmbook.js';
  import { CHECK_HASH } from '../lib/strava/client.svelte.js';
  import { msName, tileName } from '../lib/flow/hobby/words.js';
  import MedStartSheet from '../lib/flow/MedStartSheet.svelte';
  import { isMedAct } from '../lib/flow/hobby/medstart.js';
  import ActIcon from '../lib/flow/ActIcon.svelte';
  import ActEditor from '../lib/flow/ActEditor.svelte';
  import GoneActs from '../lib/flow/GoneActs.svelte';
  import WeekNumbers from '../lib/flow/WeekNumbers.svelte';
  import Activity from './flow/Activity.svelte';
  import Training from './flow/Training.svelte';
  import TrainingAct from './flow/TrainingAct.svelte';
  import Milestones from './flow/Milestones.svelte';
  import Trophies from './flow/Trophies.svelte';
  import Gipfelbuch from './flow/Gipfelbuch.svelte';
  import Week from './flow/Week.svelte';
  import WeekReview from './flow/WeekReview.svelte';
  import Bags from './flow/Bags.svelte';
  import Rest from './flow/Rest.svelte';
  import MoreAktiv from '../lib/flow/kit/MoreAktiv.svelte';
  import TickSuggest from '../lib/strava/TickSuggest.svelte';
  import LakeCard from '../lib/lake/LakeCard.svelte';
  import AirCard from '../lib/air/AirCard.svelte';
  import TipLine from '../lib/pageinfo/TipLine.svelte';
  import AreaIntro from '../lib/intro/AreaIntro.svelte';
  import PageMore from '../lib/pageinfo/PageMore.svelte';
  import { morePages } from '../lib/flow/morepages.js';
  import { weekGoals } from '../lib/flowweek.js';
  import Meditation from './flow/Meditation.svelte';
  import MedTimer from './flow/MedTimer.svelte';
  import MedDone from './flow/MedDone.svelte';
  import MedLog from './flow/MedLog.svelte';
  import MedSession from './flow/MedSession.svelte';
  import MedMore from './flow/MedMore.svelte';
  import MedPatterns from './flow/MedPatterns.svelte';
  import MedReview from './flow/MedReview.svelte';
  import { localDay } from '../lib/localday.js';
  import PageTiles from '../lib/sk/PageTiles.svelte';
  import { phone } from '../lib/media.svelte.js';
  import { t, tn, locale, lang, num } from '../lib/i18n.svelte.js';
  import SortArrows from '../lib/ui/SortArrows.svelte';

  let { sub = '' } = $props();
  const today = localDay();
  const q = flowQuery(today);
  const data = $derived($q);
  $effect(() => {
    seedIfNeeded(data);
  });
  const states = $derived(data ? flowStates(data.acts, data.log, today, data.tripDays) : []);
  const live = $derived(states.filter((s) => !s.resting));
  const rings = $derived(ringsOf(states, data?.log ?? [], today));
  // WS6 (Noah 3a): what counts for «Erholung», folded open under the rings, with «zuletzt am»
  const rest = $derived(restRows(states, data?.log ?? [], today));
  const lastLine = (r) => (r.last ? [t('last {date}', { date: fmt(r.last.day, { weekday: 'short', day: 'numeric', month: 'short' }) }), r.last.min ? t('{n} min', { n: r.last.min }) : ''].filter(Boolean).join(' · ') : t('not yet'));
  const week = lastDays(today, 7);
  const fmt = (d, o) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', ...o });
  // Impeccable (18.10.2026, distill): «Noch offen heute» is one count under «Heute abhaken»; the tiles show the names
  const onTrack = $derived(live.filter((s) => s.met || (s.daily && !s.open)).length);
  // Impeccable runde 2 (18.10.2026, clarify): the head answers «how do I stand?»: the date, the move goals on track
  // (rolling 7 days, the same count as the ring «Bewegen») and the season; its dates stay under «Mehr › Saison»
  const todayLine = $derived(
    [
      fmt(today, { weekday: 'long', day: 'numeric', month: 'short' }),
      rings.move.of ? tn(rings.move.of, 'this week {k} of {n} move goal on track', 'this week {k} of {n} move goals on track', { k: rings.move.n }) : '',
      season ? (season.half === 'summer' ? t('Summer') : t('Winter')) : '',
    ]
      .filter(Boolean)
      .join(' · '),
  );
  const tickSub = $derived([live.length ? t('{n} of {m} activities on track', { n: onTrack, m: live.length }) : '', phone.matches ? t('One tap ticks · long press: duration, place or stopwatch') : t('One click ticks · right click: duration, place or stopwatch')].filter(Boolean).join(' · '));

  // hobby pages 1: the sub address may carry a query (#/flow/milestones?act=meditation)
  const route = $derived(sub.split('?')[0].split('/'));
  const params = $derived(new URLSearchParams(sub.split('?')[1] ?? ''));
  const editId = $derived(route[0] === 'edit' ? decodeURIComponent(route[1] ?? '') : route[0] === 'new' ? 'new' : null);

  /* the daily check; WG: answered in «Wi gaht's?» (sleep, energy and mood are mirrored into the day's check) */
  const check = $derived(checkOf(data?.checks.find((c) => c.day === today), today));
  const known = $derived(FIXED.some((f) => check[f.key] != null));
  const avg = $derived(averages(data?.checks ?? [], today, 7));
  const n1 = (v) => (v == null ? '–' : v.toLocaleString(lang.v === 'de' ? 'de-DE' : 'en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));

  /* v0.105.0 Design-Refresh P8 «Aktiv» (A1): the season, the bike month, the «Mehr» rows */
  const season = $derived(data ? seasonNow(data.acts, today) : null);
  const seasonal = $derived(states.filter((s) => s.act.season));
  const kmBookQ = liveQuery(() => db.kmBook.toArray());
  // 0.136.0: Strava rides of this month without a bike wait in «Zum Prüfen» and count after «Passt»
  const kmWaiting = $derived(waitingThisMonth($kmBookQ ?? [], today));
  let seasonOpen = $state(false);
  // v0.130.0 «Mehr in Aktiv» (mockups AK1–AK3, Noah «1a»): the cards of Aktiv's own pages
  const pages = $derived(morePages({ openGoals: weekGoals(states).filter((g) => !g.met).length }));
  // Impeccable (18.10.2026, distill): «Ziele × Tage», «Meditation» and «Aktivität und Meilensteine» are the tabs above, so «Mehr» keeps the rest
  const moreRows = $derived([
    { key: 'timer', icon: Timer, title: t('Stopwatch'), sub: t('runs until you are done, then ticks off'), onclick: () => openTimer() },
    ...(season ? [{ key: 'season', icon: Sun, title: t('Season'), sub: `${season.half === 'summer' ? t('Summer since {date}', { date: dayShort(season.since) }) : t('Winter since {date}', { date: dayShort(season.since) })}${season.next ? ` · ${season.half === 'summer' ? t('Winter from {date}', { date: dayShort(season.next) }) : t('Summer from {date}', { date: dayShort(season.next) })}` : ''}`, onclick: () => (seasonOpen = !seasonOpen), expanded: seasonOpen }] : []),
  ]);

  /* A5 «Ziele»: the filter by ring, the state of each activity and the next star as a path (B22) */
  const RING_FILTER = [
    { key: 'all', name: 'All goals' },
    { key: 'move', name: 'Move|ring' },
    { key: 'mind', name: 'Mindful|ring' },
    { key: 'rest', name: 'Recovery|ring' },
  ];
  let ringF = $state('all');
  const stateOf = $derived(new Map(states.map((s) => [s.act.id, s])));
  const msQ = liveQuery(async () => {
    const [log, sessions, stars, tune] = await Promise.all([db.flowLog.toArray(), db.flowSessions.toArray(), db.flowStars.toArray(), db.settings.get(TUNE_KEY)]);
    return { log, sessions, stars, tune: tune?.value ?? {} };
  });
  const pathMs = $derived.by(() => {
    if (!data || !$msQ || route[0] !== 'goals') return null;
    const ctx = msContext({ acts: data.acts, log: $msQ.log, sessions: $msQ.sessions, today, tripDays: data.tripDays });
    const stored = new Map($msQ.stars.map((x) => [x.id, x.day]));
    return allMilestones(ctx, stored, $msQ.tune).filter((r) => !r.off && r.next && r.value > 0).sort((a, b) => b.progress - a.progress)[0] ?? null;
  });
  const path = $derived(goalPath(pathMs));
  const pathName = $derived(pathMs ? `${msName(pathMs.m)}${pathMs.m.actId ? ` · ${tileName(data.acts.find((a) => a.id === pathMs.m.actId))}` : ''}` : '');

  /* the list of all activities: order by the grip */
  let dragId = $state(null);
  const all = $derived(data?.acts ?? []);
  async function move(id, to) {
    await saveOrder(db, moveAct(all, id, to));
  }
  function gripKey(e, a, i) {
    if (e.key === 'ArrowUp' && i > 0) (e.preventDefault(), move(a.id, i - 1).then(() => focusGrip(a.id)));
    if (e.key === 'ArrowDown' && i < all.length - 1) (e.preventDefault(), move(a.id, i + 1).then(() => focusGrip(a.id)));
  }
  const focusGrip = (id) => requestAnimationFrame(() => document.querySelector(`[data-grip="${id}"]`)?.focus());
  let listEl = $state();
  function gripDown(e, a) {
    dragId = a.id;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function gripMove(e) {
    if (!dragId || !listEl) return;
    const rows = [...listEl.querySelectorAll('li[data-id]')];
    const i = rows.findIndex((r) => {
      const b = r.getBoundingClientRect();
      return e.clientY >= b.top && e.clientY < b.bottom;
    });
    const from = all.findIndex((x) => x.id === dragId);
    if (i >= 0 && i !== from) move(dragId, i);
  }
  const gripUp = () => (dragId = null);
  // Impeccable runde 2 (distill): moving is rare, reading is daily; on a phone the grip and the arrows wait for «Reihenfolge ändern»
  let reorder = $state(false);
  const sorting = $derived(!phone.matches || reorder);

  /* Impeccable runde 2 (clarify): three calm states instead of «! heute offen» on nearly every goal.
     A daily goal not done today: «heute offen» (orange). A rolling goal not on track: «noch 1× in 10 Tagen»
     (grey, no «!»). A rolling goal on track whose window runs out in 1–2 days without a new entry:
     «bis morgen» / «bis übermorgen» (orange). Else «im Soll». */
  function goalPill(s) {
    if (s.met || (s.daily && !s.open)) {
      const due = s.daily ? null : Math.min(...s.goals.filter((r) => r.goal.days > 1 && r.dueIn != null).map((r) => r.dueIn));
      if (due === 1) return { key: 'due', cls: 'warn', text: t('until tomorrow|goal') };
      if (due === 2) return { key: 'due', cls: 'warn', text: t('until the day after tomorrow|goal') };
      return { key: 'ok', cls: 'ok', text: t('on track') };
    }
    if (s.open) return { key: 'today', cls: 'warn', text: t('open today') };
    const r = s.goals.find((x) => !x.met);
    return { key: 'left', cls: '', text: t('{n}× more in {d} days', { n: r.goal.count - r.done, d: r.goal.days }) };
  }

  /* v0.86.0 «Meditation einfach»: a tap on Meditation in «Heute abhaken» opens the start sheet (mockup A) */
  let medFor = $state(null);
  const medSt = $derived(medFor ? (states.find((s) => s.act.id === medFor) ?? null) : null);
  const hasMed = $derived(live.some((s) => isMedAct(s.act)));
</script>

{#if route[0] === 'training' && route[1] === 'a'}
  {#key sub}<TrainingAct id={decodeURIComponent(route[2] ?? '')} />{/key}
{:else if route[0] === 'training'}
  <Training {params} />
{:else if route[0] === 'plans'}
  <!-- «Trainingspläne» (Noah 19.10.2026): loaded only when opened -->
  {#await import('./flow/TrainingPlans.svelte') then m}{#key route[1]}<m.default id={decodeURIComponent(route[1] ?? '')} {params} />{/key}{:catch}<p class="hint" role="alert">{t('This page could not load. Please check the connection and try again.')}</p>{/await}
{:else if route[0] === 'sports'}
  <!-- Paket O «Sportarten»: loaded only when opened (main.js stays small) -->
  {#await import('./flow/Sports.svelte') then m}<m.default />{/await}
{:else if route[0] === 'sport'}
  {#await import('./flow/Sport.svelte') then m}{#key route[1]}<m.default id={decodeURIComponent(route[1] ?? '')} />{/key}{/await}
{:else if route[0] === 'activity'}
  <Activity />
{:else if route[0] === 'milestones'}
  <Milestones {params} />
{:else if route[0] === 'trophies'}
  <Trophies {params} />
{:else if route[0] === 'gipfelbuch'}
  <Gipfelbuch />
{:else if route[0] === 'week'}
  <Week />
{:else if route[0] === 'review'}
  <WeekReview {params} />
{:else if route[0] === 'bags'}
  <Bags {params} />
{:else if route[0] === 'rest'}
  <Rest />
{:else if route[0] === 'ideen'}
  <Ideas />
{:else if route[0] === 'act' && route[2] === 'done'}
  {#key sub}<MedDone actId={decodeURIComponent(route[1] ?? '')} id={decodeURIComponent(route[3] ?? '')} {params} />{/key}
{:else if route[0] === 'act' && route[2] === 'log'}
  {#key sub}<MedLog actId={decodeURIComponent(route[1] ?? '')} {params} />{/key}
{:else if route[0] === 'act' && route[2] === 's'}
  {#key sub}<MedSession actId={decodeURIComponent(route[1] ?? '')} id={decodeURIComponent(route[3] ?? '')} />{/key}
{:else if route[0] === 'act' && route[2] === 'muster'}
  {#key sub}<MedPatterns actId={decodeURIComponent(route[1] ?? '')} />{/key}
{:else if route[0] === 'act' && route[2] === 'mehr'}
  {#key sub}<MedMore actId={decodeURIComponent(route[1] ?? '')} {params} />{/key}
{:else if route[0] === 'act' && route[2] === 'rueckblick'}
  <!-- «Meditation» (mockup ME3): the Rückblick by week, month or year -->
  {#key sub}<MedReview actId={decodeURIComponent(route[1] ?? '')} />{/key}
{:else if route[0] === 'act' && route[2] === 'timer'}
  {#key sub}<MedTimer actId={decodeURIComponent(route[1] ?? '')} {params} />{/key}
{:else if route[0] === 'act'}
  {#key route[1]}<Meditation actId={decodeURIComponent(route[1] ?? 'meditation')} />{/key}
{:else if editId}
  {#if data}<ActEditor id={editId} acts={data.acts} log={data.log} {today} tripDays={data.tripDays} back={params.get('from') === 'activity' ? '#/flow/activity' : ''} />{/if}
{:else if route[0] === 'goals'}
  <div class="flow">
    <header class="ph">
      <Crumb path={[{ href: '#/flow', label: t('Active|place') }]} here={t('Activities|flow')} />
      <h1 class="title">{t('Activities|flow')}</h1>
      <p class="sub">{t('Rolling: always counts the last days, whatever the weekday')}{#if season}{' · '}{season.half === 'summer' ? t('Summer') : t('Winter')}{/if}</p>
    </header>
    <AreaIntro place="goals" />
    <div class="tools">
      <div class="seg" role="group" aria-label={t('Filter by ring')}>
        {#each RING_FILTER as r (r.key)}<button type="button" class="sg" aria-pressed={ringF === r.key} onclick={() => (ringF = r.key)}>{t(r.name)}</button>{/each}
      </div>
      <a class="btn" href="#/flow/new"><Plus size={18} aria-hidden="true" />{t('New activity')}</a>
    </div>
    <div class="lay">
      <div class="col">
        <!-- Impeccable runde 2 (distill): on a phone grip and arrows come after «Reihenfolge ändern»; a computer keeps them -->
        <Sec id="acts-h" title={t('Your goals, last 7 days')} sub={t('Dots = last 7 days · today on the right')} more={phone.matches ? { label: reorder ? t('Done|order') : t('Change the order'), onclick: () => (reorder = !reorder), expanded: reorder } : null}>
          {#if phone.matches && reorder}<p class="note ronote" data-reorder-note><Lightbulb size={16} aria-hidden="true" /><span>{t('The order here is the order of «Tick off today».')} {t('Tap to edit; drag the grip or use the arrows to move.')}</span></p>{/if}
          <ul class="acts card" class:sorting={sorting} bind:this={listEl}>
            {#each all as a, i (a.id)}
              {@const s = stateOf.get(a.id)}
              {#if ringF === 'all' || a.ring === ringF}
                <li data-id={a.id} data-row={a.id} class:drag={dragId === a.id}>
                  <a class="ar" href="#/flow/edit/{encodeURIComponent(a.id)}">
                    <span class="aico"><ActIcon icon={a.icon} ring={a.ring} dim={a.paused || s?.resting} /></span>
                    <span class="m"><b>{actName(a)}</b><small>{a.paused ? t('paused') : s?.resting ? t('rests until {date}', { date: dayShort(s.restUntil) }) : actGoalText(a, today)}{#if !a.paused && !s?.resting && a.counts.includes('commute')}{' · '}{t('commuting counts')}{/if}</small></span>
                    {#if s && !s.resting}
                      <span class="d7" aria-hidden="true">{#each gridRow(s, data.log, week, today, data.tripDays) as c, k (k)}<i class={c}></i>{/each}</span>
                      <span class="st num">{s.stand.n} / {s.stand.of}</span>
                      {@const p = goalPill(s)}
                      <span class="bdw"><span class="pill {p.cls}" data-pill={p.key}>{p.text}</span></span>
                    {:else}
                      <span class="d7 rest" aria-hidden="true">{#each week as d (d)}<i></i>{/each}</span>
                      <span class="st num">–</span>
                      <span class="bdw"><span class="pill">{a.paused ? t('paused') : t('rests')}</span></span>
                    {/if}
                  </a>
                  {#if sorting}
                    <button type="button" class="grip noswipe" data-grip={a.id} aria-label={t('Move {name}: arrow keys', { name: actName(a) })} onkeydown={(e) => gripKey(e, a, i)} onpointerdown={(e) => gripDown(e, a)} onpointermove={gripMove} onpointerup={gripUp} onpointercancel={gripUp}><GripVertical size={18} aria-hidden="true" /></button>
                    <SortArrows name={actName(a)} {i} n={all.length} onstep={(dir) => move(a.id, i + dir)} />
                  {/if}
                </li>
              {/if}
            {/each}
          </ul>
        </Sec>
      </div>
      <aside class="col">
        {#if path}
          <Sec id="path-h" title={t('Next goal: {name}', { name: pathName })} sub={t('your next star, station by station')}>
            <div class="card"><GoalPath {path} unit={pathMs.m.unit} label={pathName} /></div>
          </Sec>
        {/if}
        <!-- Noah 20.10.2026 «3a»: activities deleted with «Keep the history», to restore -->
        <GoneActs />
        <!-- «Werte überall» WU3: the year goals and the footprint -->
        <YearGoals {today} />
        {#if !phone.matches}<p class="note"><Lightbulb size={16} aria-hidden="true" /><span>{t('The order here is the order of «Tick off today».')} {t('Tap to edit; drag the grip or use the arrows to move.')}</span></p>{/if}
      </aside>
    </div>
  </div>
{:else}
  <div class="flow">
    <header class="ph">
      <h1 class="title">{t('Active|place')}</h1>
      <p class="sub" data-today-line>{todayLine}</p>
      <!-- «Skitouren»: in season (November–May) one small row to Touren › Skitouren -->
      {#if inSeason(today)}<a class="skl" href="#/ski" data-to="ski"><Snowflake size={16} aria-hidden="true" />{t('Ski tour')}<ChevronRight size={16} aria-hidden="true" /></a>{/if}
      <!-- Paket U3 «Live-Karte» (Noah 19.10.2026 «5a» «Aktiv „Ausfahrt starten"»): one small line to the live map -->
      <LiveStart />
    </header>

    {#if data && !states.length}
      <Empty icon={Plus} text={t('No activities yet. Add the first one: name, goal, done.')} action={{ label: t('New activity'), href: '#/flow/new' }} />
    {:else if data}
      <!-- «Inhalte Flow» IF1 (Noah 14.10.2026, approved 04:32): the tip of the day, at the end the fold and the tiles -->
      <!-- Noah 19.10 «2a»: one card per page; the Einstieg lives in the card «Was hier steht» (its own card only while the page is empty) -->
      <HintCard page="aktiv" intro="aktiv" />
      <MoreAktiv items={pages} />
      <div class="lay">
        <div class="col">
          <!-- Impeccable (layout): on a phone «Stoppuhr ›» sits in this head instead of the floating button, which covered a tile -->
          <Sec id="tick-h" title={t('Tick off today')} sub={tickSub} edit={{ href: '#/flow/goals', label: t('Edit|acts') }} more={phone.matches ? { label: t('Stopwatch'), onclick: () => openTimer() } : null}>
            <!-- «Aktiv neu» (Noah 20.10.2026 «1a»): small tiles, the symbol and the name in one line -->
            <TickGrid states={live} {today} cols={phone.matches ? 2 : 4} compact onmed={(s) => (medFor = s.act.id)} />
            {#if hasMed}<p class="hint">{t('Tap Meditation: start or tick off.')}</p>{/if}
          </Sec>
          <!-- Gesamttest 20.10.2026 Design 2: the tip of the day under the first part of the page, not above it -->
          <TipLine page="aktiv" name={t('Active|place')} />
          <!-- package G #156: Strava activities waiting for «Count» (only when ticking is set to «suggest first») -->
          <TickSuggest />
          <Sec id="ring-h" title={t('Rings')} sub={t('last 7 days against your goals')}>
            <div class="card ringc">
              <Rings {rings} size={phone.matches ? 112 : 140} quiet />
              {#if rest.length}
                <details class="restf" data-rest>
                  <summary><span>{t('What counts for recovery')}</span><small class="num">{t('last 7 days')}</small></summary>
                  <ul>
                    {#each rest as r (r.act.id)}
                      <li><span>{actName(r.act)}</span><small class="num">{lastLine(r)}</small></li>
                    {/each}
                  </ul>
                  <a class="link" href="#/flow/goals">{t('Change in Goals')}</a>
                </details>
              {/if}
              <!-- Impeccable runde 2 made the active zone minutes one place under the rings; G (Noah 19.10.2026 «1b»): this week from Fitbit, one bar per day -->
              <AzmWeek {today} />
              <!-- «Aktiv neu» (Noah 20.10.2026): what the rings and the minutes mean -->
              <details class="restf" data-ring-help>
                <summary><span>{t('What do the rings mean?')}</span></summary>
                <p class="rhelp">{t('Each ring shows the last 7 days against your goals: Move (sport and training), Mindful (meditation) and Recovery (sauna, walks, sleep). A full ring means every goal of that ring is on track.')}</p>
                <p class="rhelp">{t('Active zone minutes come from your Fitbit: minutes your pulse was in the fat burn, cardio or peak zone (one minute in cardio or peak counts twice). The WHO suggests 150 a week. Tap the goal to change it.')}</p>
              </details>
            </div>
          </Sec>
          <!-- «Aktiv neu» (Noah 20.10.2026 «2a»): «Deine Woche in Zahlen» replaces «Velo diesen Monat» -->
          <Sec id="km-h" title={t('Your week in numbers')} sub={t('last 7 days · compared with your usual week')}>
            <WeekNumbers {today} />
            {#if kmWaiting}<a class="kmwait" href={CHECK_HASH} data-km-waiting>{tn(kmWaiting, '{n} Strava ride without a bike waits in «To check»: it counts after «Fits»', '{n} Strava rides without a bike wait in «To check»: they count after «Fits»')} ›</a>{/if}
          </Sec>
        </div>
        <aside class="col">
          <!-- WG: the daily check is «Wi gaht's?» now; the section keeps today's values and the 7 days -->
          <Sec id="chk-h" title={t('Your questions')} sub={t('sleep, energy and mood · one tap per question')}>
            <div class="card">
              {@render checkRow()}
              <!-- «Aktiv neu» (Noah 20.10.2026: «warum fragen wir, was passiert mit den Daten, wo werden sie angezeigt») -->
              <ul class="why" data-check-why>
                <li><b>{t('Why|check')}</b> {t('a few seconds a day show you over weeks what does you good.')}</li>
                <li><b>{t('Your data|check')}</b> {t('stays on your devices; nobody else sees it.')}</li>
                <li><b>{t('Where you see it')}</b> <a href="#/me/history">{t('in the history')}</a>, <a href="#/me/insights">{t('in your insights')}</a> {t('and in the Rückblick of a trip.')}</li>
              </ul>
            </div>
          </Sec>
          <!-- package G #9: the lake temperature (Mythenquai) with the Eawag preview -->
          <LakeCard headingLevel={2} />
          <AirCard headingLevel={2} />
          <Sec id="more-h" title={t('More|item')}>
            <Rows rows={moreRows} open={seasonList} />
          </Sec>
        </aside>
      </div>
      <PageMore page="aktiv" name={t('Active|place')} />
      <!-- SK: the tile row at the page end (SK5, SKX4 with Strava and GotCourts) -->
      <PinnedLists place="active" />
      <PageTiles page="flow" />
    {/if}
  </div>
{/if}

{#if medSt}<MedStartSheet st={medSt} {today} onclose={() => (medFor = null)} />{/if}

{#snippet checkRow()}
  {#if known}
    <div class="crow done" data-check-row="done">
      <span class="ct"><b>{t('Today|values')}</b><small>{FIXED.map((f) => `${t(f.short)} ${check[f.key] ?? '–'}`).join(' · ')}</small></span>
      <a class="btn" href="#/me/abfragen">{t('Change')}</a>
    </div>
  {:else}
    <div class="crow" data-check-row="open">
      <span class="ct"><b>{t('Still open today')}</b></span>
      <!-- 20.10.2026 (Noah: «Was startet das überhaupt?»): «Start» opens the questions themselves, not their settings -->
      <a class="btn hi" href="#/check/morning" data-check-start>{t('Start|check')}</a>
    </div>
  {/if}
  {#if FIXED.some((f) => avg[f.key].mean != null)}<p class="avg num">{t('⌀ 7 days')}: {FIXED.map((f) => `${t(f.short)} ${n1(avg[f.key].mean)}`).join(' · ')}</p>{/if}
{/snippet}

{#snippet seasonList()}
  <ul class="rl">
    {#each seasonal as s (s.act.id)}
      {@const half = halfOf(s.act, today)}
      <li>
        <ActIcon icon={s.act.icon} ring={s.act.ring} dim={s.resting} />
        <span class="m"><b>{actName(s.act)}</b><small>{s.resting ? t('starts {date}', { date: dayShort(s.restUntil) }) : `${goalsText(s.act.goals)} · ${t('Winter')} ${goalsText(s.act.season.winter)}`}</small></span>
        <span class="v">{#if s.resting}{t('rests')}{:else if half === 'summer'}{t('Summer until {date}', { date: dayShort(halfEnds(s.act, today)) })}{:else}{t('Winter since {date}', { date: dayShort(halfSince(s.act, today)) })}{/if}</span>
      </li>
    {/each}
  </ul>
{/snippet}

<style>
  /* v0.105.0 Design-Refresh P8 «Aktiv» (A1, A5): the page head, two columns (the main column and the
     side column), white cards; one column on a phone */
  .flow {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 1240px;
    margin: 0 auto;
    min-width: 0;
  }
  .kmwait {
    display: block;
    margin-top: 6px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  /* 0.136.0: on a phone the small running clock floats over the page end; room below the last tiles */
  @media (max-width: 719px) {
    .flow {
      padding-bottom: 72px;
    }
  }
  .ph .sub {
    margin: var(--sp-1) 0 0;
    color: var(--ink-3);
    font: 400 var(--fs-body) / 1.45 var(--font-body);
  }
  .lay {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-5);
    align-items: start;
  }
  @media (min-width: 1000px) {
    .lay {
      grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
    }
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
    min-width: 0;
  }
  .hint {
    margin: var(--sp-2) 2px 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ringc {
    padding: var(--sp-4) var(--sp-5);
  }
  .restf {
    margin-top: var(--sp-3);
    border-top: 1px solid var(--line);
  }
  .restf summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 44px;
    cursor: pointer;
    font-weight: 500;
  }
  .restf small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .restf ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .restf li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .restf li small {
    text-align: right;
  }
  .restf .link {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
  }
  .rhelp {
    margin: 0 0 var(--sp-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .why {
    display: grid;
    gap: 4px;
    margin: var(--sp-3) 0 0;
    padding: var(--sp-2) 0 0;
    border-top: 1px solid var(--line);
    list-style: none;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
  .why b {
    color: var(--ink);
    font-weight: 600;
  }
  .why a {
    color: var(--ink);
  }
  .crow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
  }
  .ct {
    flex: 1 1 160px;
    min-width: 0;
    line-height: 1.35;
  }
  .ct b {
    display: block;
    font-weight: 500;
  }
  .ct small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .avg {
    margin: var(--sp-3) 0 0;
    padding-top: var(--sp-2);
    border-top: 1px solid var(--line);
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .rl {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rl li {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-height: 52px;
    border-top: 1px solid var(--line);
  }
  .m {
    flex: 1;
    min-width: 0;
    line-height: 1.3;
  }
  .m b {
    display: block;
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .m small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .v {
    flex: none;
    max-width: 45%;
    text-align: right;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  /* A5 «Ziele» */
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2) var(--sp-3);
  }
  .seg {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .sg {
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1 var(--font-body);
    cursor: pointer;
  }
  .sg[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .acts {
    margin: 0;
    padding: 0 var(--sp-2) 0 var(--sp-4);
    list-style: none;
  }
  .acts li {
    display: flex;
    align-items: center;
    gap: 2px;
    border-top: 1px solid var(--line);
  }
  .acts li:first-child {
    border-top: 0;
  }
  .acts li.drag {
    background: var(--paper-2);
  }
  .ar {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
    min-height: 60px;
    padding: var(--sp-2) 0;
    color: var(--ink);
    text-decoration: none;
  }
  .aico {
    display: flex;
  }
  .ar .m {
    flex: 1 1 140px;
  }
  .d7 {
    display: flex;
    gap: 4px;
  }
  .d7 i {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--paper-2);
    box-sizing: border-box;
  }
  .d7 i.done {
    background: var(--hi);
  }
  .d7 i.open {
    border: 2px dashed var(--warn);
    background: transparent;
  }
  .bdw {
    display: flex;
    justify-content: flex-end;
    min-width: 92px;
  }
  .st {
    min-width: 56px;
    text-align: right;
    font-size: var(--fs-small);
  }
  .grip {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-3);
    cursor: grab;
    touch-action: none;
  }
  /* a phone: the dots go under the name, the stand and the word stay on the right */
  @media (max-width: 719px) {
    .d7 {
      order: 3;
      flex-basis: 100%;
      padding-left: 46px;
    }
  }
  .note {
    display: flex;
    gap: var(--sp-2);
    margin: 0 var(--sp-3);
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .note :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .skl {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    color: var(--accent);
    font-size: var(--fs-small);
    font-weight: 600;
    text-decoration: none;
  }
  /* Impeccable runde 2: without grip and arrows (a phone, not reordering) the row ends with the same gutter as it starts */
  .acts:not(.sorting) {
    padding-right: var(--sp-4);
  }
  .ronote {
    margin: 0 2px var(--sp-2);
  }
</style>
