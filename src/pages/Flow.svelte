<script>
  /**
   * v0.51.0 «Im Flow – kleiner Start» (mockups ImFlow-Phone / -Desktop, approved 9.10.2026).
   *   #/flow             the page: three rings (rolling 7 days), «Heute abhaken», «Ziele × Tage»
   *                      (7 days on a phone, 14 on a computer), the daily check, recovery and seasons
   *   #/flow/goals       all activities, in their order (drag the grip or use the arrow keys)
   *   #/flow/edit/<id>   edit one activity; #/flow/new a new one (the same form, empty)
   *   #/flow/activity    hobby pages 1: Aktiv › Aktivität (pages/flow/Activity.svelte)
   *   #/flow/milestones  hobby pages 1: all milestones (pages/flow/Milestones.svelte), ?act=, ?tune=1
   *   #/flow/week        v0.130.0 «Woche» (mockup AK1): the week with fixed dates and suggestions (pages/flow/Week.svelte)
   *   #/flow/rest        «Erholung» (mockup AK2): the recovery ring, a pause hint, ticks (pages/flow/Rest.svelte)
   *   #/flow/bags        «Sporttasche» (mockup AK3): a packing list per sport (pages/flow/Bags.svelte)
   *   #/flow/trophies    v0.123.0 the trophy showcase, all stars by area and year (pages/flow/Trophies.svelte)
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
  import { Plus, Sun, GripVertical, Activity as Pulse, Lightbulb, Star, Timer, Mountain } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { flowQuery, seedIfNeeded } from '../lib/flow/data.svelte.js';
  import { flowStates, rings as ringsOf, summary, lastDays, halfOf, halfEnds, halfSince, moveAct, gridRow } from '../lib/flow.js';
  import { averages, checkOf, FIXED } from '../lib/flowcheck.js';
  import { saveOrder } from '../lib/flowdb.js';
  import { openTimer, actName, goalName } from '../lib/flow/ui.svelte.js';
  import { actGoalText, goalsText, dayShort } from '../lib/flow/words.js';
  import Rings from '../lib/flow/Rings.svelte';
  import TickGrid from '../lib/flow/TickGrid.svelte';
  import Sec from '../lib/flow/kit/Sec.svelte';
  import YearGoals from '../lib/flow/YearGoals.svelte';
  import Rows from '../lib/flow/kit/Rows.svelte';
  import Crumb from '../lib/flow/kit/Crumb.svelte';
  import GoalPath from '../lib/flow/kit/GoalPath.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { monthWeeks, seasonNow, goalPath } from '../lib/flow/aktiv.js';
  import { msContext, allMilestones, TUNE_KEY, weekStart } from '../lib/flowms.js';
  import { heartBetween, withStravaRides } from '../lib/kmbook.js';
  import HeartLine from '../lib/strava/HeartLine.svelte';
  import { msName, tileName } from '../lib/flow/hobby/words.js';
  import MedStartSheet from '../lib/flow/MedStartSheet.svelte';
  import { isMedAct } from '../lib/flow/hobby/medstart.js';
  import ActIcon from '../lib/flow/ActIcon.svelte';
  import ActEditor from '../lib/flow/ActEditor.svelte';
  import Activity from './flow/Activity.svelte';
  import Milestones from './flow/Milestones.svelte';
  import Trophies from './flow/Trophies.svelte';
  import Week from './flow/Week.svelte';
  import Bags from './flow/Bags.svelte';
  import Rest from './flow/Rest.svelte';
  import MoreAktiv from '../lib/flow/kit/MoreAktiv.svelte';
  import TipLine from '../lib/pageinfo/TipLine.svelte';
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
  import { t, locale, lang, num } from '../lib/i18n.svelte.js';

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
  const sum = $derived(summary(states));
  const week = lastDays(today, 7);
  const fmt = (d, o) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', ...o });
  const list = (names) => (names.length ? new Intl.ListFormat(locale(), { type: 'conjunction' }).format(names) : '');
  const sumLine = $derived.by(() => {
    const met = sum.met.map(actName);
    // v0.69.1 G: «Yoga Yoga Studio» → «Yoga Studio»; a sub-goal without the name: «Yoga (Zuhause)»
    const subOf = (m) => (goalName(m.goal).toLowerCase().includes(actName(m.act).toLowerCase()) ? goalName(m.goal) : `${actName(m.act)} (${goalName(m.goal)})`);
    const miss = sum.missing.map((m) => (m.goal ? subOf(m) : `${m.n}× ${actName(m.act)}`));
    const a = met.length ? t('{list} on track.', { list: list(met) }) : '';
    const b = miss.length ? t('{list} still to do.', { list: list(miss) }) : met.length ? t('Everything on track.') : '';
    return [a, b].filter(Boolean).join(' ');
  });

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
  const ridesQ = liveQuery(() => db.rides.toArray());
  // heart rate of this week's Strava rides (observation only, Noah 12.10.2026 «2a und b»)
  const kmBookQ = liveQuery(() => db.kmBook.toArray());
  // v0.121.0 (Noah «1a»): the counted Strava rides count too, a ride uploaded as a file once
  const km = $derived(monthWeeks(withStravaRides($ridesQ ?? [], $kmBookQ ?? []), today));
  const weekHeart = $derived(heartBetween($kmBookQ ?? [], weekStart(today), today));
  const prevMonth = $derived.by(() => {
    const [y, m] = today.split('-').map(Number);
    return new Date(Date.UTC(y, m - 2, 15)).toISOString().slice(0, 10);
  });
  // the line of the weeks so far: x from week 1 to week 4, y from the most km
  const pts = $derived.by(() => {
    const w = km.weeks.filter((v) => v != null);
    const max = Math.max(1, ...w);
    return w.map((v, i) => [(i * 300) / 3, 56 - (v / max) * 48]);
  });
  const sparkLine = $derived(pts.map(([x, y]) => `${x},${y}`).join(' '));
  const sparkArea = $derived(pts.length ? `M0,60 ${pts.map(([x, y]) => `L${x},${y}`).join(' ')} L${pts.at(-1)[0]},60 Z` : '');
  let seasonOpen = $state(false);
  // v0.130.0 «Mehr in Aktiv» (mockups AK1–AK3, Noah «1a»): the cards of Aktiv's own pages
  const pages = $derived(morePages({ openGoals: weekGoals(states).filter((g) => !g.met).length }));
  const medAct = $derived(live.find((s) => isMedAct(s.act))?.act ?? (data?.acts ?? []).find((a) => isMedAct(a) && !a.paused) ?? null);
  const moreRows = $derived([
    { key: 'goals', icon: Pulse, title: t('Goals × days'), sub: rings.move.of ? t('{n} of {m} movement goals on track', { n: rings.move.n, m: rings.move.of }) : '', href: '#/flow/goals' },
    ...(medAct ? [{ key: 'med', icon: Lightbulb, title: actName(medAct), sub: t('start, log, more'), href: `#/flow/act/${encodeURIComponent(medAct.id)}` }] : []),
    { key: 'activity', icon: Star, title: t('Activity and milestones'), href: '#/flow/activity' },
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

  /* v0.86.0 «Meditation einfach»: a tap on Meditation in «Heute abhaken» opens the start sheet (mockup A) */
  let medFor = $state(null);
  const medSt = $derived(medFor ? (states.find((s) => s.act.id === medFor) ?? null) : null);
  const hasMed = $derived(live.some((s) => isMedAct(s.act)));
</script>

{#if route[0] === 'activity'}
  <Activity />
{:else if route[0] === 'milestones'}
  <Milestones {params} />
{:else if route[0] === 'trophies'}
  <Trophies {params} />
{:else if route[0] === 'week'}
  <Week />
{:else if route[0] === 'bags'}
  <Bags {params} />
{:else if route[0] === 'rest'}
  <Rest />
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
      <Crumb path={[{ href: '#/flow', label: t('Active|place') }]} here={t('Goals|flow')} />
      <h1 class="title">{t('Goals|flow')}</h1>
      <p class="sub">{t('Rolling: always counts the last days, whatever the weekday')}{#if season}{' · '}{season.half === 'summer' ? t('Summer') : t('Winter')}{/if}</p>
    </header>
    <div class="tools">
      <div class="seg" role="group" aria-label={t('Filter by ring')}>
        {#each RING_FILTER as r (r.key)}<button type="button" class="sg" aria-pressed={ringF === r.key} onclick={() => (ringF = r.key)}>{t(r.name)}</button>{/each}
      </div>
      <a class="btn" href="#/flow/new"><Plus size={18} aria-hidden="true" />{t('New activity')}</a>
    </div>
    <div class="lay">
      <div class="col">
        <Sec id="acts-h" title={t('Goals × days')} sub={t('Dots = last 7 days · today on the right')}>
          <ul class="acts card" bind:this={listEl}>
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
                      <span class="bdw"><span class="pill {s.met || (s.daily && !s.open) ? 'ok' : 'warn'}">{s.met || (s.daily && !s.open) ? t('on track') : t('open today')}</span></span>
                    {:else}
                      <span class="d7 rest" aria-hidden="true">{#each week as d (d)}<i></i>{/each}</span>
                      <span class="st num">–</span>
                      <span class="bdw"><span class="pill">{a.paused ? t('paused') : t('rests')}</span></span>
                    {/if}
                  </a>
                  <button type="button" class="grip noswipe" data-grip={a.id} aria-label={t('Move {name}: arrow keys', { name: actName(a) })} onkeydown={(e) => gripKey(e, a, i)} onpointerdown={(e) => gripDown(e, a)} onpointermove={gripMove} onpointerup={gripUp} onpointercancel={gripUp}><GripVertical size={18} aria-hidden="true" /></button>
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
        <!-- «Werte überall» WU3: the year goals and the footprint -->
        <YearGoals {today} />
        <p class="note"><Lightbulb size={16} aria-hidden="true" /><span>{t('The order here is the order of «Tick off today».')} {t('Tap to edit, drag the grip to move.')}</span></p>
      </aside>
    </div>
  </div>
{:else}
  <div class="flow">
    <header class="ph">
      <h1 class="title">{t('Active|place')}</h1>
      <p class="sub">{t('Today, {date}', { date: fmt(today, { weekday: 'long', day: 'numeric', month: 'short' }) })}{#if season?.since}{' · '}{season.half === 'summer' ? t('Summer since {date}', { date: dayShort(season.since) }) : t('Winter since {date}', { date: dayShort(season.since) })}{/if}</p>
    </header>

    {#if data && !states.length}
      <Empty icon={Plus} text={t('No activities yet. Add the first one: name, goal, done.')} action={{ label: t('New activity'), href: '#/flow/new' }} />
    {:else if data}
      <!-- «Inhalte Flow» IF1 (Noah 14.10.2026, approved 04:32): the tip of the day, at the end the fold and the tiles -->
      <TipLine page="aktiv" name={t('Active|place')} />
      <MoreAktiv items={pages} />
      <div class="lay">
        <div class="col">
          <Sec id="tick-h" title={t('Tick off today')} sub={phone.matches ? t('One tap ticks · long press: duration, place or stopwatch') : t('One click ticks · right click: duration, place or stopwatch')}>
            <TickGrid states={live} {today} cols={phone.matches ? 2 : 3} big onmed={(s) => (medFor = s.act.id)} />
            {#if hasMed}<p class="hint">{t('Tap Meditation: start or tick off.')}</p>{/if}
          </Sec>
          <Sec id="ring-h" title={t('Rings')} sub={t('last 7 days against your goals')}>
            <div class="card ringc"><Rings {rings} size={phone.matches ? 112 : 140} quiet /></div>
          </Sec>
          <Sec id="km-h" title={t('Bike this month')} sub={t('from your rides and Strava')}>
            <a class="card kmc" href="#/debrief/ride" data-section="km">
              <small>{t('{month} until today', { month: fmt(today, { month: 'long' }) })}</small>
              <span class="kmn"><b class="num">{num(km.km)} km</b>{#if km.pct != null}<span class="pill {km.pct >= 0 ? 'ok' : ''} num">{km.pct >= 0 ? '↑' : '↓'} {t('{n} % vs {month}', { n: num(Math.abs(km.pct)), month: fmt(prevMonth, { month: 'short' }) })}</span>{/if}</span>
              <!-- «Werte überall» WU2 (Noah 13.10.2026 «1-5a»): the metres climbed this month, with the Everest as a picture -->
              {#if km.hm}<small class="kmhm" data-month-hm><Mountain size={14} aria-hidden="true" /><b class="num">{t('{n} m climbed', { n: num(km.hm) })}</b>{#if km.hm >= 885}{' · '}{t('≈ {x}× Everest', { x: num(Math.round((km.hm / 8849) * 10) / 10) })}{/if}</small>{/if}
              {#if km.weeks.some((v) => v)}
                <svg class="spark" viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true">
                  <path class="area" d={sparkArea} />
                  <polyline class="line" points={sparkLine} />
                </svg>
                <span class="wk" aria-hidden="true">{#each km.weeks as _, i (i)}<span>{t('W {n}', { n: i + 1 })}</span>{/each}</span>
              {:else}
                <small>{t('No ride this month yet. Upload a ride ›')}</small>
              {/if}
              {#if weekHeart}<small><HeartLine heart={weekHeart} label={t('Heart rate this week')} /></small>{/if}
            </a>
          </Sec>
          <!-- «Werte überall» WU2: the active zone minutes come with Fitbit (bundle B); until then a quiet place -->
          <Sec id="azm-h" title={t('Active zone minutes')} sub={t('weekly goal 150 min, changeable')}>
            <p class="card azm" data-section="azm"><Timer size={18} aria-hidden="true" /><span>{t('Come with Fitbit: then the minutes of every activity count here.')}</span></p>
          </Sec>
        </div>
        <aside class="col">
          <!-- WG: the daily check is «Wi gaht's?» now; the section keeps today's values and the 7 days -->
          <Sec id="chk-h" title={t('Your questions')} sub={t('sleep, energy and mood · one tap per question')}>
            <div class="card">{@render checkRow()}</div>
          </Sec>
          {#if sumLine}
            <Sec id="open-h" title={t('Still open today|aktiv')}>
              <p class="card sumline">{sumLine}</p>
            </Sec>
          {/if}
          <Sec id="more-h" title={t('More|item')}>
            <Rows rows={moreRows} open={seasonList} />
          </Sec>
        </aside>
      </div>
      <PageMore page="aktiv" name={t('Active|place')} />
      <!-- SK: the tile row at the page end (SK5, SKX4 with Strava and GotCourts) -->
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
      <a class="btn hi" href="#/me/abfragen">{t('Start|check')}</a>
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
  .kmc {
    display: flex;
    flex-direction: column;
    gap: 2px;
    color: var(--ink);
    text-decoration: none;
  }
  .kmc:hover {
    background: var(--paper-2);
  }
  .kmc small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .kmc .kmhm {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .azm {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    margin: 0;
    color: var(--ink-3);
  }
  .kmn {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
  }
  .kmn b {
    font: 700 var(--fs-title) / 1.15 var(--font-body);
  }
  .spark {
    display: block;
    width: 100%;
    height: 48px;
    margin-top: var(--sp-3);
  }
  .spark .area {
    fill: var(--hi-soft);
  }
  .spark .line {
    fill: none;
    stroke: var(--hi);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
  }
  .wk {
    display: flex;
    justify-content: space-between;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .sumline {
    margin: 0;
    font-size: var(--fs-body);
    line-height: 1.45;
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
</style>
