<script>
  /**
   * «Meine Sportarten» (Noah 22.10.2026, spec «Aktiv-Bereich: Beschreibung», Runde 2 «4a»): «Ziele», «Aktivität»
   * and «Sportarten» are one list. Every sport with its symbol, its goal («3× in 7 Tagen»), the dots of the last
   * 7 days and its state («im Soll», «heute offen»); a tap opens the sport's own page (Sport.svelte; Meditation
   * keeps its page with the timer, Runde 3 «1b»). The order (arrows and drag) is the order of «Heute abhaken».
   * «Neue Sportart» on top; rename, hide and delete (with Undo) in the editor, as before.
   * Below: the season (was Aktiv › Mehr › Saison), the sports of trips, deleted sports to restore, the year
   * goals and the mosaic of all sports (was the top of #/flow/sports). Addresses #/flow/sports, …/goals and
   * …/activity all show this page.
   */
  import { Plus, GripVertical, Lightbulb, ChevronRight, Pencil } from '@lucide/svelte';
  import { db } from '../../lib/db.js';
  import { flowQuery, seedIfNeeded } from '../../lib/flow/data.svelte.js';
  import { flowStates, lastDays, halfOf, halfEnds, halfSince, moveAct, gridRow, activeGoals } from '../../lib/flow.js';
  import { saveOrder } from '../../lib/flowdb.js';
  import { actName } from '../../lib/flow/ui.svelte.js';
  import { actGoalText, goalsText, dayShort } from '../../lib/flow/words.js';
  import { seasonNow } from '../../lib/flow/aktiv.js';
  import { isMedAct } from '../../lib/flow/hobby/medstart.js';
  import ActIcon from '../../lib/flow/ActIcon.svelte';
  import GoneActs from '../../lib/flow/GoneActs.svelte';
  import YearGoals from '../../lib/flow/YearGoals.svelte';
  import Sec from '../../lib/flow/kit/Sec.svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import SortArrows from '../../lib/ui/SortArrows.svelte';
  import SortGrip from '../../lib/ui/SortGrip.svelte';
  import { sortable } from '../../lib/ui/sortable.js';
  import { saveCfg } from '../../lib/sportsdb.js';
  import Empty from '../../lib/ui/Empty.svelte';
  import AreaIntro from '../../lib/intro/AreaIntro.svelte';
  import SportsMosaic from '../../lib/sportpage/SportsMosaic.svelte';
  import { DOMAINS } from '../../lib/domains.js';
  import { allSports, orderedSports, moveId } from '../../lib/sportsbase.js';
  import { sportDays, goalOf } from '../../lib/sportshelp.js';
  import { sportCfg } from '../../lib/sportsbase.js';
  import { stravaOf } from '../../lib/sportsprogress.js';
  import { sportsQuery } from '../../lib/sportpage/data.js';
  import { sportName } from '../../lib/sportpage/words.js';
  import { sportHref } from '../../lib/flow/mysports.js';
  import { localDay } from '../../lib/localday.js';
  import { phone } from '../../lib/media.svelte.js';
  import { t, tn } from '../../lib/i18n.svelte.js';
  import QuickLinks from '../../lib/ui/QuickLinks.svelte';
  import '../../lib/sportpage/sport.css';

  const today = localDay();
  const q = flowQuery(today);
  const data = $derived($q);
  $effect(() => {
    seedIfNeeded(data);
  });
  const states = $derived(data ? flowStates(data.acts, data.log, today, data.tripDays) : []);
  const stateOf = $derived(new Map(states.map((s) => [s.act.id, s])));
  const week = lastDays(today, 7);
  const all = $derived(data?.acts ?? []);
  const season = $derived(data ? seasonNow(data.acts, today) : null);
  const seasonal = $derived(states.filter((s) => s.act.season));

  /* the sports of trips (Paket O) and the mosaic over all sports */
  const sq = sportsQuery();
  const sdata = $derived($sq);
  const cfg = $derived(sdata?.cfg ?? {});
  const sports = $derived(sdata ? orderedSports(allSports({ domains: DOMAINS, acts: sdata.acts }), cfg) : []);
  const tripSports = $derived(sports.filter((s) => s.kind === 'trip'));
  // the sports of trips keep their own order (arrows and drag), as on the old page «Sportarten»
  async function moveTrip(id, to) {
    const ids = sports.map((s) => s.id);
    const target = sports.indexOf(tripSports[Math.max(0, Math.min(tripSports.length - 1, to))]);
    await saveCfg({ ...cfg, _order: moveId(ids, id, target) });
  }
  const tripStep = (s, dir) => moveTrip(s.id, tripSports.indexOf(s) + dir);
  const tripDragged = (from, to) => moveTrip(tripSports[from].id, to);
  const rows = $derived(
    sdata
      ? sports.map((s) => {
          const dayMap = sportDays(s, { log: sdata.log, trips: sdata.trips, values: sdata.items, strava: stravaOf(sdata.activities, s.id), today });
          return { sport: s, dayMap, goal: goalOf(s, sportCfg(cfg, s.id).goal, s.act ? activeGoals(s.act, today) : []) };
        })
      : [],
  );

  /* the order: arrows and drag (rule «Pfeile und Ziehen»); the same order as «Heute abhaken» */
  let dragId = $state(null);
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
    const rowsEl = [...listEl.querySelectorAll('li[data-id]')];
    const i = rowsEl.findIndex((r) => {
      const b = r.getBoundingClientRect();
      return e.clientY >= b.top && e.clientY < b.bottom;
    });
    const from = all.findIndex((x) => x.id === dragId);
    if (i >= 0 && i !== from) move(dragId, i);
  }
  const gripUp = () => (dragId = null);
  // reading is daily, moving is rare: on a phone the grip and the arrows wait for «Reihenfolge ändern»
  let reorder = $state(false);
  const sorting = $derived(!phone.matches || reorder);

  /* three calm states (Impeccable runde 2): «heute offen», «noch 1× in 10 Tagen», «bis morgen» or «im Soll» */
  function goalPill(s) {
    if (s.met || (s.daily && !s.open)) {
      const due = s.daily ? null : Math.min(...s.goals.filter((r) => r.goal.days > 1 && r.dueIn != null).map((r) => r.dueIn));
      if (due === 1) return { key: 'due', cls: 'warn', text: t('until tomorrow|goal') };
      if (due === 2) return { key: 'due', cls: 'warn', text: t('until the day after tomorrow|goal') };
      return { key: 'ok', cls: 'ok', text: t('on track') };
    }
    if (s.open) return { key: 'today', cls: 'warn', text: t('open today') };
    const r = s.goals.find((x) => !x.met);
    return r ? { key: 'left', cls: '', text: t('{n}× more in {d} days', { n: r.goal.count - r.done, d: r.goal.days }) } : { key: 'none', cls: '', text: t('no goal|sport') };
  }
</script>

<div class="flow ms">
  <header class="ph">
    <Crumb path={[{ href: '#/flow', label: t('Active|place') }]} here={t('My sports|tab')} />
    <h1 class="title">{t('My sports|tab')}</h1>
    <p class="sub">{t('Every sport with its goal, its last 7 days and its own page.')}{#if season}{' · '}{season.half === 'summer' ? t('Summer') : t('Winter')}{/if}</p>
  </header>
  <AreaIntro place="goals" />
  <!-- «332 Use Cases» (Noah 26.10.2026: «aktivitätsmosaik, bikepark tage, jahresziele, sterne» sichtbar) -->
  <QuickLinks label={t('On this page')} links={[{ key: 'mosaic', jump: '[data-mosaic]', label: t('Activity mosaic') }, { key: 'year', jump: '#yg-h', label: t('Year goals') }, { key: 'park', href: `#/flow/sport/${encodeURIComponent('trip:downhill')}`, label: t('Bike park days') }, { key: 'stars', href: '#/flow/milestones', label: t('Stars from your data') }]} />
  <div class="tools">
    <a class="btn hi" href="#/flow/new" data-new-sport><Plus size={18} aria-hidden="true" />{t('New sport')}</a>
    <!-- hobby pages 1 (suggestions, challenges, ideas and connections) stay one tap away -->
    <a class="btn" href="#/flow/activity" data-to-activity><Lightbulb size={18} aria-hidden="true" />{t('Suggestions and ideas')}</a>
  </div>

  {#if data && !all.length}
    <Empty icon={Plus} text={t('No sport yet. Add the first one: name, goal, done.')} action={{ label: t('New sport'), href: '#/flow/new' }} />
  {:else if data}
    <div class="lay">
      <div class="col">
        <Sec id="ms-h" title={t('Your sports, last 7 days')} sub={t('Dots = last 7 days · today on the right · a tap opens the sport')} more={phone.matches ? { label: reorder ? t('Done|order') : t('Change the order'), onclick: () => (reorder = !reorder), expanded: reorder } : null}>
          {#if phone.matches && reorder}<p class="note ronote" data-reorder-note><Lightbulb size={16} aria-hidden="true" /><span>{t('The order here is the order of «Tick off today».')} {t('Drag the grip or use the arrows to move.')}</span></p>{/if}
          <ul class="acts card" class:sorting bind:this={listEl} data-my-sports>
            {#each all as a, i (a.id)}
              {@const s = stateOf.get(a.id)}
              <li data-id={a.id} data-row={a.id} class:drag={dragId === a.id}>
                <a class="ar" href={sportHref(a)} data-sport-row={a.id}>
                  <span class="aico"><ActIcon icon={a.icon} ring={a.ring} dim={a.paused || s?.resting} /></span>
                  <span class="m"><b>{actName(a)}</b><small>{a.paused ? t('paused') : s?.resting ? t('rests until {date}', { date: dayShort(s.restUntil) }) : actGoalText(a, today)}{#if isMedAct(a)}{' · '}{t('with timer')}{/if}</small></span>
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
            {/each}
          </ul>
          {#if !phone.matches}<p class="note"><Lightbulb size={16} aria-hidden="true" /><span>{t('The order here is the order of «Tick off today».')} {t('Drag the grip or use the arrows to move.')} {t('Rename, pause or delete a sport on its page under «Edit».')}</span></p>{/if}
        </Sec>

        {#if seasonal.length}
          <!-- was Aktiv › Mehr › Saison (spec: «Meine Sportarten (Sommer- und Wintersport)») -->
          <details class="card fold" data-season>
            <summary><span>{t('Season')}</span><small>{season ? (season.half === 'summer' ? t('Summer since {date}', { date: dayShort(season.since) }) : t('Winter since {date}', { date: dayShort(season.since) })) : ''}</small></summary>
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
          </details>
        {/if}
      </div>

      <aside class="col">
        {#if tripSports.length}
          <Sec id="ts-h" title={t('Sports of your trips')} sub={t('What you pack for. Each has its page with gear, packing list and care.')}>
            <ul class="card tsl" use:sortable={{ onmove: tripDragged }} data-trip-sports>
              {#each tripSports as s, i (s.id)}
                <li data-sort-id={s.id} data-sport={s.id}>
                  <SortGrip name={sportName(s)} onstep={(d) => tripStep(s, d)} />
                  <a href="#/flow/sport/{encodeURIComponent(s.id)}"><ActIcon icon={s.icon} ring={s.ring} /><span>{sportName(s)}</span><ChevronRight size={16} aria-hidden="true" /></a>
                  <SortArrows name={sportName(s)} {i} n={tripSports.length} onstep={(d) => tripStep(s, d)} />
                </li>
              {/each}
            </ul>
            <p class="small edit"><Pencil size={14} aria-hidden="true" /> <a href="#/me/lists?domains">{t('Add, rename or hide sports of trips')}</a></p>
          </Sec>
        {/if}
        <!-- Noah 20.10.2026 «3a»: activities deleted with «Keep the history», to restore -->
        <GoneActs />
        <!-- «Werte überall» WU3: the year goals and the footprint -->
        <YearGoals {today} />
      </aside>
    </div>

    {#if sdata && rows.length}
      <details class="card fold hob sp" data-mosaic>
        <summary><span>{t('All sports at a glance')}</span><small>{t('one square per day')}</small></summary>
        <SportsMosaic list={sports} {rows} {cfg} {today} />
      </details>
    {/if}
  {/if}
</div>

<style>
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
  .tools {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
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
  .acts:not(.sorting) {
    padding-right: var(--sp-4);
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
    display: flex;
    flex-direction: column;
  }
  .ar .m small {
    color: var(--ink-3);
    font-size: var(--fs-small);
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
  .d7 :global(i.done) {
    background: var(--hi);
  }
  .d7 :global(i.open) {
    border: 2px dashed var(--warn);
    background: transparent;
  }
  .st {
    min-width: 56px;
    text-align: right;
    font-size: var(--fs-small);
  }
  .bdw {
    display: flex;
    justify-content: flex-end;
    min-width: 92px;
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
    margin: var(--sp-2) var(--sp-3) 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .note :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .ronote {
    margin: 0 2px var(--sp-2);
  }
  .fold {
    padding: var(--sp-3) var(--sp-4);
  }
  .fold summary {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 4px var(--sp-3);
    min-height: 44px;
    align-content: center;
    font-weight: 600;
    cursor: pointer;
  }
  .fold summary small {
    color: var(--ink-3);
    font-weight: 400;
    font-size: var(--fs-small);
  }
  .rl {
    margin: var(--sp-2) 0 0;
    padding: 0;
    list-style: none;
  }
  .rl li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
    padding: var(--sp-2) 0;
    border-top: 1px solid var(--line);
  }
  .rl .m {
    flex: 1 1 140px;
    display: flex;
    flex-direction: column;
  }
  .rl small,
  .rl .v {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .tsl {
    margin: 0;
    padding: 0 var(--sp-4);
    list-style: none;
  }
  .tsl li {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
  .tsl li + li {
    border-top: 1px solid var(--line);
  }
  .tsl a {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-height: 52px;
    color: var(--ink);
    text-decoration: none;
  }
  .tsl a span {
    flex: 1;
  }
  .small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .edit {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: var(--sp-2) var(--sp-3) 0;
  }
</style>
