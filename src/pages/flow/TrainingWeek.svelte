<script>
  /**
   * «Training» TR4 (Noah 13.10.2026 «1-5a» 4a, «tr1-4 ok»): Aktiv › Training › Woche. An optional goal
   * (hours per week, share in Z1–Z2, a day), the week to plan (sessions with duration and zone per
   * day; what was done comes by itself from Strava and ticks the plan) and the look back: hours per
   * week by zone for six weeks, the plan as a line. Everything is a suggestion: plan, goal and
   * «Wie letzte Woche» can be changed or removed any time. Observation only: nothing is rated.
   */
  import { liveQuery } from 'dexie';
  import { Target, ChevronLeft, ChevronRight, Plus, Check, Copy, Timer, Heart } from '@lucide/svelte';
  import Sec from '../../lib/flow/kit/Sec.svelte';
  import Seg from '../../lib/ui/Seg.svelte';
  import KindIcon from '../../lib/strava/KindIcon.svelte';
  import ZoneBar from '../../lib/strava/ZoneBar.svelte';
  import { db } from '../../lib/db.js';
  import { zones } from '../../lib/strava/zones.svelte.js';
  import { rideTimeS } from '../../lib/review/fmt.js';
  import { PLAN_KEY, GOAL_KEY, planOf, goalOf, cleanSession, prunePlan, copyWeek, doneBy, weekNumbers, weeksTo, isoWeek, mondayOf, weekOf, shiftDay, zoneSecs, mainZone, hmm, KIND_NAMES, ZONE_NAMES, typeKey } from '../../lib/training.js';
  import { t, tn, num, locale } from '../../lib/i18n.svelte.js';
  import { localDay } from '../../lib/localday.js';
  import WeekAnalyses from '../../lib/training/week/WeekAnalyses.svelte';
  import AnaSheet from '../../lib/training/AnaSheet.svelte';
  import FeelAsk from '../../lib/training/plans/FeelAsk.svelte'; // «Trainingspläne»: «How hard was it?» after each ride
  import { strava, STRAVA_HASH } from '../../lib/strava/client.svelte.js';
  import { racesQuery } from '../../lib/race/store.js';
  import { raceTrips, daysBetween } from '../../lib/race/race.js';
  import { raceHref } from '../../lib/race/parts.js';

  let { acts = [] } = $props();

  const today = localDay();
  const planQ = liveQuery(async () => (await db.settings.get(PLAN_KEY))?.value ?? null);
  const goalQ = liveQuery(async () => (await db.settings.get(GOAL_KEY))?.value ?? null);
  const plan = $derived(planOf($planQ));
  const goal = $derived(goalOf($goalQ));
  // Gesamttest 20.10.2026 (journey): from the training back to the next race (the race already links to its plan)
  const tripsQ = liveQuery(() => db.trips.toArray());
  const racesQ = racesQuery();
  const nextRace = $derived(raceTrips($tripsQ ?? [], $racesQ ?? {}, today).coming.find((r) => r.startDate && r.startDate >= today) ?? null);

  let monday = $state(mondayOf(today));
  const days = $derived(weekOf(monday));
  const sessions = $derived(plan.filter((s) => s.day >= monday && s.day < shiftDay(monday, 7)));
  const weekActs = $derived(acts.filter((a) => a.day >= monday && a.day < shiftDay(monday, 7)));
  const nums = $derived(weekNumbers(acts, plan, monday, zones.bounds));
  const lastHad = $derived(copyWeek(plan, monday).length);
  const fmt = (d, o) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', ...o });
  const range = $derived(`${fmt(monday, { day: 'numeric', month: 'numeric' })}–${fmt(shiftDay(monday, 6), { day: 'numeric', month: 'long' })}`);
  const hours = (mins) => hmm(mins * 60);

  async function savePlan(next) {
    await db.settings.put({ key: PLAN_KEY, value: { sessions: prunePlan(next, today) } });
  }

  // one session in the form: a new one on a day, or a planned one
  let form = $state(null);
  const KINDS = ['bike', 'run', 'hike', 'other'];
  const add = (day) => (form = { id: '', day, kind: 'bike', name: '', mins: 60, zone: 2 });
  const edit = (s) => (form = { ...s, zone: s.zone ?? 0 });
  async function keep(e) {
    e.preventDefault();
    const s = cleanSession(form);
    if (!s) return;
    await savePlan([...plan.filter((x) => x.id !== s.id), s]);
    form = null;
  }
  async function drop() {
    await savePlan(plan.filter((x) => x.id !== form.id));
    form = null;
  }
  const likeLast = () => savePlan([...plan, ...copyWeek(plan, monday)]);

  // the goal (optional)
  let goalForm = $state(null);
  const openGoal = () => (goalForm = { name: goal?.name ?? '', hours: goal?.hours ?? 6, base: goal?.base ?? 80, until: goal?.until ?? '' });
  async function keepGoal(e) {
    e.preventDefault();
    const g = goalOf(goalForm);
    if (g) await db.settings.put({ key: GOAL_KEY, value: g });
    else await db.settings.delete(GOAL_KEY);
    goalForm = null;
  }
  async function dropGoal() {
    await db.settings.delete(GOAL_KEY);
    goalForm = null;
  }
  const goalLine = $derived(goal ? [goal.hours ? t('{n} h per week', { n: num(goal.hours) }) : '', goal.base != null ? t('{n} % in Z1–Z2', { n: goal.base }) : '', goal.until ? tn(weeksTo(goal.until, today), '{n} week to go', '{n} weeks to go') : ''].filter(Boolean).join(' · ') : '');

  // the look back: six weeks up to the shown one
  const weeks = $derived(
    Array.from({ length: 6 }, (_, i) => shiftDay(monday, (i - 5) * 7)).map((m) => ({ m, kw: isoWeek(m), ...weekNumbers(acts, plan, m, zones.bounds) })),
  );
  // Impeccable runde 2 (onboard): six empty weeks get one sentence and the way to Strava instead of an empty chart
  const backEmpty = $derived(weeks.every((w) => !w.secs && !w.planned));
  const top = $derived(Math.max(1, ...weeks.map((w) => Math.max(w.secs / 3600, w.planned / 60, goal?.hours ?? 0))));
  const baseShare = $derived.by(() => {
    const z = nums.zones.reduce((s, x) => s + x, 0);
    return z ? Math.round(((nums.zones[0] + nums.zones[1]) / z) * 100) : null;
  });
</script>

<div class="wk">
  <FeelAsk {acts} {today} />
  <section class="card goal" aria-labelledby="goal-h" data-section="goal">
    <span class="gi" aria-hidden="true"><Target size={22} /></span>
    {#if goalForm}
      <form class="gf" onsubmit={keepGoal}>
        <h2 id="goal-h" class="gh">{t('Your training goal')}</h2>
        <div class="gfl">
          <label>{t('Name (optional)')}<input class="inp" bind:value={goalForm.name} placeholder={t('e.g. a bikepacking trip in June')} data-goal-name /></label>
          <label>{t('Hours per week')}<input class="inp num" type="number" step="0.25" min="0.5" max="40" bind:value={goalForm.hours} data-goal-hours /></label>
          <label>{t('Share in Z1–Z2 (%)')}<input class="inp num" type="number" min="0" max="100" bind:value={goalForm.base} /></label>
          <label>{t('Until (optional)')}<input class="inp" type="date" bind:value={goalForm.until} /></label>
        </div>
        <div class="row">
          <button type="submit" class="btn hi">{t('Save')}</button>
          {#if goal}<button type="button" class="btn" onclick={dropGoal}>{t('Remove goal')}</button>{/if}
          <button type="button" class="btn btn-link" onclick={() => (goalForm = null)}>{t('Cancel')}</button>
        </div>
      </form>
    {:else if goal}
      <div class="gt">
        <h2 id="goal-h" class="gh">{goal.name ? t('Goal: {name}', { name: goal.name }) : t('Your training goal')}</h2>
        {#if goalLine}<p class="num">{goalLine}</p>{/if}
      </div>
      <button type="button" class="btn sm" onclick={openGoal}>{t('change')}</button>
    {:else}
      <div class="gt">
        <!-- Impeccable runde 2 (clarify): an hour goal, said apart from the goals under «Ziele» (how often) -->
        <h2 id="goal-h" class="gh">{t('An hour goal for your training?')}</h2>
        <p>{t('Hours per week, the share in Z1–Z2 and a day. Unlike under «Goals», the time counts here, not how often. All optional.')}</p>
      </div>
      <button type="button" class="btn sm" onclick={openGoal}>{t('Set a goal')}</button>
    {/if}
  </section>
  {#if nextRace}
    {@const d = daysBetween(today, nextRace.startDate)}
    <a class="race-row" href={raceHref(nextRace.id)} data-next-race>{t('Your race: {name} · {when}', { name: nextRace.title, when: d === 0 ? t('today') : tn(d, 'in {n} day', 'in {n} days') })}<ChevronRight size={16} aria-hidden="true" /></a>
  {/if}

  <div class="lay">
    <!-- Impeccable runde 2 (clarify): the explanation stands above the days; the week and its hours sit by the week arrows -->
    <Sec id="plan-h" title={t('Plan the week')} sub={t('Tap + on a day to plan a session. Dashed = planned, green = done (from Strava).')} more={{ href: '#/flow/plans', label: t('Training plans') }}>
      <div class="card plan" data-section="week-plan">
        <div class="nav">
          <span class="rg num" data-week-range>{goal?.hours ? t('{range} · planned {a} of {b} h', { range, a: hours(nums.planned), b: hours(goal.hours * 60) }) : t('{range} · planned {a} h', { range, a: hours(nums.planned) })}</span>
          <button type="button" class="ib" aria-label={t('Week before')} onclick={() => ((monday = shiftDay(monday, -7)), (form = null))}><ChevronLeft size={18} aria-hidden="true" /></button>
          {#if monday !== mondayOf(today)}<button type="button" class="btn btn-link sm" onclick={() => ((monday = mondayOf(today)), (form = null))}>{t('This week|plan')}</button>{/if}
          <button type="button" class="ib" aria-label={t('Week after')} onclick={() => ((monday = shiftDay(monday, 7)), (form = null))}><ChevronRight size={18} aria-hidden="true" /></button>
        </div>
        <ul class="days">
          {#each days as d (d)}
            {@const done = weekActs.filter((a) => a.day === d)}
            {@const planned = sessions.filter((s) => s.day === d)}
            <li data-day={d} class:today={d === today}>
              <span class="dl"><b>{fmt(d, { weekday: 'short' })}</b><small class="num">{fmt(d, { day: 'numeric', month: 'numeric' })}</small></span>
              <span class="chips">
                {#each done as a (a.id)}
                  {@const z = mainZone(zoneSecs(a.hist, zones.bounds))}
                  <a class="ch done" href="#/flow/training/a/{encodeURIComponent(a.id)}" data-done={a.id}><KindIcon kind={a.kind} size={14} /><span class="cn">{a.name || t(typeKey(a.type))}</span><span class="num">· {rideTimeS(a.movingS)}</span>{#if z != null}<i class="zt z{z + 1}">Z{z + 1}</i>{/if}<Check size={14} aria-hidden="true" /></a>
                {/each}
                {#each planned as s (s.id)}
                  {@const by = doneBy(s, done)}
                  <button type="button" class="ch plan" class:ok={by} onclick={() => edit(s)} data-planned={s.id}><KindIcon kind={s.kind} size={14} /><span class="cn">{s.name || t(KIND_NAMES[s.kind])}</span><span class="num">· {hours(s.mins)}</span>{#if s.zone}<i class="zt z{s.zone}">Z{s.zone}</i>{/if}{#if by}<span class="sr">{t('done')}</span><Check size={14} aria-hidden="true" />{/if}</button>
                {/each}
                <button type="button" class="ch add" aria-label={t('Plan a session on {day}', { day: fmt(d, { weekday: 'long' }) })} onclick={() => add(d)} data-add={d}><Plus size={14} aria-hidden="true" /></button>
              </span>
              {#if form?.day === d}
                <form class="sf" onsubmit={keep} data-session-form>
                  <Seg small chips full={false} label={t('Kind')} value={form.kind} onchange={(k) => (form.kind = k)} options={KINDS.map((k) => ({ key: k, name: t(KIND_NAMES[k]) }))} />
                  <div class="sfl">
                    <label>{t('Name (optional)')}<input class="inp" bind:value={form.name} placeholder={t('e.g. Intervals 4 × 6 min')} data-session-name /></label>
                    <label>{t('Minutes')}<input class="inp num" type="number" min="5" max="1440" step="5" bind:value={form.mins} data-session-mins /></label>
                    <label>{t('Zone')}
                      <select class="sel" bind:value={form.zone} data-session-zone>
                        <option value={0}>{t('no zone')}</option>
                        {#each ZONE_NAMES as n, i (n)}<option value={i + 1}>Z{i + 1} {t(n)}</option>{/each}
                      </select>
                    </label>
                  </div>
                  <div class="row">
                    <button type="submit" class="btn hi sm">{t('Save')}</button>
                    {#if form.id}<button type="button" class="btn sm" onclick={drop}>{t('Remove')}</button>{/if}
                    <button type="button" class="btn btn-link sm" onclick={() => (form = null)}>{t('Cancel')}</button>
                  </div>
                </form>
              {/if}
            </li>
          {/each}
        </ul>
        {#if !sessions.length && lastHad}<button type="button" class="btn sm like" onclick={likeLast}><Copy size={16} aria-hidden="true" />{tn(lastHad, 'Like last week (1 session)', 'Like last week ({n} sessions)')}</button>{/if}
        {#if sessions.length}<p class="hint">{t('Tap a planned one to change it.')}</p>{/if}
      </div>
    </Sec>

    <Sec id="back-h" title={t('Look back')} sub={t('Hours per week by zone · line = plan')} more={{ href: '#/flow/review', label: t('Week in review') }}>
      <div class="card back" data-section="look-back">
        {#if backEmpty}
          <p class="none" data-back-empty>{t('No training time in the last 6 weeks yet. As soon as Strava brings an activity with heart rate, a bar per week stands here.')}</p>
          <a class="btn sm" href={STRAVA_HASH} data-back-strava>{strava.key ? t('To Strava') : t('Connect Strava')}</a>
        {:else}
        <ol class="bars" aria-label={t('Hours per week, last six weeks')}>
          {#each weeks as w (w.m)}
            <li data-week={w.kw} aria-label={t('Week {kw}: {a} h done, {b} h planned', { kw: w.kw, a: hmm(w.secs), b: hours(w.planned) })}>
              <span class="col" aria-hidden="true">
                {#if w.planned}<i class="pl" style:bottom="{(w.planned / 60 / top) * 100}%"></i>{/if}
                <span class="stack" style:height="{(w.secs / 3600 / top) * 100}%">
                  {#if w.unknown}<i class="un" style:flex-grow={w.unknown}></i>{/if}
                  {#each [...w.zones].reverse() as s, k (k)}{#if s}<i class="z{5 - k}" style:flex-grow={s}></i>{/if}{/each}
                </span>
              </span>
              <small class="num">{t('Wk {n}', { n: w.kw })}</small>
            </li>
          {/each}
        </ol>
        <ZoneBar bar={false} legend />
        <p class="tw num" data-this-week>{goal?.hours ? t('This week {a} of {b} h', { a: hmm(nums.secs), b: hours(goal.hours * 60) }) : t('This week {a} h', { a: hmm(nums.secs) })}{#if baseShare != null}{' · '}{goal?.base != null ? t('Z1–Z2 {n} % (goal {g} %)', { n: baseShare, g: goal.base }) : t('Z1–Z2 {n} %', { n: baseShare })}{/if}</p>
        {/if}
        <p class="fb"><span><Timer size={16} aria-hidden="true" />{t('Active zone minutes')} <i class="pill">{t('with Fitbit')}</i></span><span><Heart size={16} aria-hidden="true" />{t('Resting heart rate')} <i class="pill">{t('with Fitbit')}</i></span></p>
      </div>
    </Sec>
  </div>

  <WeekAnalyses {acts} {today} />
</div>
<AnaSheet />

<style>
  .race-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2);
    min-height: 44px;
    margin: var(--sp-2) 0;
    padding: var(--sp-2) var(--sp-3);
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    background: var(--paper);
    color: var(--ink);
    font-weight: 600;
    text-decoration: none;
  }
  .wk {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
    min-width: 0;
  }
  .goal {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 16px;
    padding: 16px 20px;
  }
  .gi {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: var(--radius);
    background: var(--warn-soft);
    color: var(--warn);
  }
  .gt {
    flex: 1 1 220px;
    min-width: 0;
  }
  .gh {
    margin: 0;
    font: 700 var(--fs-sub) / 1.3 var(--font-body);
  }
  .gt p {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .gf {
    flex: 1 1 300px;
    min-width: 0;
  }
  .gfl,
  .sfl {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
    margin: 10px 0;
  }
  .gfl label,
  .sfl label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: var(--fs-small);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .lay {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-5);
    align-items: start;
  }
  @media (min-width: 1000px) {
    .lay {
      grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    }
  }
  .plan,
  .back {
    padding: 12px 20px 16px;
  }
  .nav {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 4px;
  }
  .rg {
    flex: 1 1 auto;
    min-width: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .none {
    margin: 4px 0 12px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .days {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .days li {
    display: grid;
    grid-template-columns: 56px minmax(0, 1fr);
    gap: 4px 12px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .days li.today .dl b {
    color: var(--accent);
  }
  .dl {
    display: flex;
    flex-direction: column;
  }
  .dl small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-width: 0;
  }
  .ch {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    padding: 0 12px;
    border: 1px dashed var(--line-strong);
    border-radius: var(--radius);
    background: var(--paper);
    color: var(--ink);
    font: 400 var(--fs-small) / 1.2 var(--font-body);
    text-decoration: none;
    cursor: pointer;
  }
  .ch {
    max-width: 100%;
    box-sizing: border-box;
  }
  .ch > :global(svg),
  .ch .num,
  .zt {
    flex: none;
  }
  .cn {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ch.done,
  .ch.plan.ok {
    border: 1px solid var(--accent-soft);
    background: var(--accent-soft);
  }
  .ch.add {
    width: 40px;
    justify-content: center;
    padding: 0;
    color: var(--ink-2);
  }
  .zt {
    padding: 1px 5px;
    border-radius: 4px;
    color: var(--paper);
    font: 700 var(--fs-tiny) / 1.3 var(--font-body);
    font-style: normal;
  }
  .zt.z1,
  .zt.z3 {
    color: var(--ink);
  }
  .sf {
    grid-column: 1 / -1;
    padding: 12px;
    border-radius: var(--radius);
    background: var(--paper-2);
  }
  .like {
    margin-top: 10px;
  }
  .hint {
    margin: 10px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .bars {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 12px;
    margin: 8px 0 10px;
    padding: 0;
    list-style: none;
  }
  .bars li {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .col {
    position: relative;
    display: flex;
    align-items: flex-end;
    width: 100%;
    height: 120px;
  }
  .stack {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 0;
    border-radius: 4px 4px 0 0;
    overflow: hidden;
  }
  .stack i {
    flex: 1 1 0;
  }
  .pl {
    position: absolute;
    left: -2px;
    right: -2px;
    height: 2px;
    background: var(--ink);
  }
  .bars small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .un {
    background: var(--bar);
  }
  .z1 {
    background: var(--z1);
  }
  .z2 {
    background: var(--z2);
  }
  .z3 {
    background: var(--z3);
  }
  .z4 {
    background: var(--z4);
  }
  .z5 {
    background: var(--z5);
  }
  .tw {
    margin: 12px 0 0;
    font-weight: 600;
  }
  .fb {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 18px;
    margin: 8px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .fb span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .fb .pill {
    font-style: normal;
  }
</style>
