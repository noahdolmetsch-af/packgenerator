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
  import QuickLinks from '../../lib/ui/QuickLinks.svelte';
  import Seg from '../../lib/ui/Seg.svelte';
  import KindIcon from '../../lib/strava/KindIcon.svelte';
  import ZoneBar from '../../lib/strava/ZoneBar.svelte';
  import BarChart from '../../lib/charts/BarChart.svelte';
  import ChartSheet from '../../lib/charts/ChartSheet.svelte';
  import { db } from '../../lib/db.js';
  import { zones } from '../../lib/strava/zones.svelte.js';
  import { rideTimeS } from '../../lib/review/fmt.js';
  import { PLAN_KEY, GOAL_KEY, DAYS_KEY, cleanDayLimits, SPORTGOALS_KEY, cleanSportGoals, HABITS_KEY, LIBRARY_KEY, cleanLibrary, libraryOf, TODAYKEEP_KEY, LOADKEEP_KEY, NEXTKEEP_KEY, cleanHabits, planOf, goalOf, cleanSession, prunePlan, copyWeek, doneBy, weekNumbers, weeksTo, isoWeek, mondayOf, weekOf, shiftDay, zoneSecs, mainZone, hmm, KIND_NAMES, ZONE_NAMES, typeKey } from '../../lib/training.js';
  import { t, tn, num, locale, lang } from '../../lib/i18n.svelte.js';
  import { offerDone } from '../../lib/ui/rename.svelte.js';
  import { stravaName } from '../../lib/stravanames.js';
  import { localDay } from '../../lib/localday.js';
  import WeekAnalyses from '../../lib/training/week/WeekAnalyses.svelte';
  import AnaSheet from '../../lib/training/AnaSheet.svelte';
  import { weekLoadHint, scaleWeek } from '../../lib/training/suggest.js';
  import NextWeek from '../../lib/training/plans/NextWeek.svelte'; // «Training verbessern» 8: «Next week» in the look back
  import Library from '../../lib/training/plans/Library.svelte'; // «Training verbessern» 7: «From your library»
  import WeekLoad from '../../lib/training/plans/WeekLoad.svelte'; // «Training verbessern» 6: «A lighter week would fit»
  import Missed from '../../lib/training/plans/Missed.svelte'; // «Training verbessern» 5: «Missed one? Move it»
  import TodayFits from '../../lib/training/plans/TodayFits.svelte'; // «Training verbessern» 4: «Today a lighter one fits»
  import FeelAsk from '../../lib/training/plans/FeelAsk.svelte'; // «Trainingspläne»: «How hard was it?» after each ride
  import { strava, STRAVA_HASH } from '../../lib/strava/client.svelte.js';
  import { saveAct } from '../../lib/flowdb.js';
  import { blankAct } from '../../lib/flow.js';
  import SuggestWeek from '../../lib/training/plans/SuggestWeek.svelte'; // «Training verbessern» 2
  import { homeForecast } from '../../lib/home-weather.js';
  import { formQuery } from '../../lib/form-data.js';
  import { racesQuery } from '../../lib/race/store.js';
  import { raceTrips, daysBetween } from '../../lib/race/race.js';
  import { raceHref } from '../../lib/race/parts.js';

  let { acts = [] } = $props();

  const today = localDay();
  const planQ = liveQuery(async () => (await db.settings.get(PLAN_KEY))?.value ?? null);
  const goalQ = liveQuery(async () => (await db.settings.get(GOAL_KEY))?.value ?? null);
  const plan = $derived(planOf($planQ));
  const daysQ = liveQuery(async () => (await db.settings.get(DAYS_KEY))?.value ?? null);
  const dayLimits = $derived(cleanDayLimits($daysQ));
  // the forecast of the home place, for rain in the week suggestion (none without a home place or offline)
  let homeFc = $state(null);
  $effect(() => {
    homeForecast(db).then((f) => (homeFc = f)).catch(() => {});
  });
  const sgQ = liveQuery(async () => (await db.settings.get(SPORTGOALS_KEY))?.value ?? null);
  const sportGoals = $derived(cleanSportGoals($sgQ));
  const saveSportGoals = (v) => db.settings.put({ key: SPORTGOALS_KEY, value: cleanSportGoals(v) });
  const habQ = liveQuery(async () => (await db.settings.get(HABITS_KEY))?.value ?? null);
  const habits = $derived(cleanHabits($habQ));
  const saveHabits = (v) => db.settings.put({ key: HABITS_KEY, value: cleanHabits(v) });
  const saveLimits = (v) => db.settings.put({ key: DAYS_KEY, value: cleanDayLimits(v) });
  const goal = $derived(goalOf($goalQ));
  // Gesamttest 20.10.2026 (journey): from the training back to the next race (the race already links to its plan)
  const tripsQ = liveQuery(() => db.trips.toArray());
  const racesQ = racesQuery();
  const nextRace = $derived(raceTrips($tripsQ ?? [], $racesQ ?? {}, today).coming.find((r) => r.startDate && r.startDate >= today) ?? null);

  // «Training verbessern» 1: the sessions can be of any sport of Aktiv (yoga, climbing, gym …); ticked there, they tick here
  const actsQ = liveQuery(() => db.flowActs.toArray());
  const logQ = liveQuery(() => db.flowLog.where('day').between(shiftDay(today, -60), shiftDay(today, 60), true, true).toArray());
  const sports = $derived(($actsQ ?? []).filter((a) => !a.paused).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  const sportName = (a) => (a ? (lang.v === 'de' && a.nameDe ? a.nameDe : a.name) || t('Activity') : '');
  const sportById = (id) => ($actsQ ?? []).find((a) => a.id === id);
  const sportDone = (s) => !!s.sport && ($logQ ?? []).some((e) => e.actId === s.sport && e.day === s.day);
  const doneOf = (s, day) => (s.sport ? (sportDone(s) ? { day: s.day, kind: s.kind, byHand: true } : s.done ? { day: s.day, kind: s.kind, byHand: true } : null) : doneBy(s, day));
  const planName = (s) => s.name || (s.sport ? sportName(sportById(s.sport)) : '') || t(KIND_NAMES[s.kind]);
  let newSport = $state(null); // the name of a sport being added, or null
  async function addSport() {
    const name = (newSport ?? '').trim().slice(0, 40);
    if (!name) return;
    const act = blankAct(($actsQ ?? []).length);
    act.id = `act-${Date.now().toString(36)}`;
    act.name = name;
    act.goals = [];
    await saveAct(db, act);
    form.sport = act.id;
    newSport = null;
  }

  const formQ = formQuery(today);
  // «Training verbessern» 2: the suggestion replaces the planned days from today on; Undo puts the old plan back
  async function applySuggestion(list) {
    const before = plan;
    const end = shiftDay(monday, 7);
    await savePlan([...plan.filter((s) => !(s.day >= monday && s.day < end && s.day >= today)), ...list]);
    offerDone(t('Suggestion for the week taken over.'), () => savePlan(before));
  }

  // «Training verbessern» 4 «Heute passt»: the session of today becomes the lighter one; Undo puts it back
  async function lighterToday(before, lighter) {
    await db.settings.put({ key: TODAYKEEP_KEY, value: { day: today } }); // answered: the card does not offer it twice
    await savePlan(plan.map((x) => (x.id === before.id ? lighter : x)));
    offerDone(t('«{name}» made lighter.', { name: planName(before) }), async () => {
      await db.settings.delete(TODAYKEEP_KEY);
      await savePlan(plan.map((x) => (x.id === before.id ? before : x)));
    });
  }

  // «Training verbessern» 8: the look back suggests next week (hours like last week, a little more, easier); a tap opens its suggestion
  let nextPreset = $state(null);
  const lastWeekHours = $derived(weekNumbers(acts, plan, shiftDay(mondayOf(today), -7), zones.bounds).secs / 3600);
  // from Friday to Sunday, until next week is planned or «Not now» is tapped; it says why and shows the goals per sport
  const nextMonday = $derived(shiftDay(mondayOf(today), 7));
  const todayDow = $derived((new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7);
  const nextKeepQ = liveQuery(async () => (await db.settings.get(NEXTKEEP_KEY))?.value ?? null);
  const nextPlanned = $derived(plan.some((s) => s.day >= nextMonday && s.day < shiftDay(nextMonday, 7)));
  const showNext = $derived(monday === mondayOf(today) && todayDow >= 4 && !nextPlanned && $nextKeepQ?.monday !== mondayOf(today));
  const lastPlanned = $derived(plan.filter((s) => s.day >= shiftDay(mondayOf(today), -7) && s.day < mondayOf(today)));
  const lastMissed = $derived(lastPlanned.filter((s) => !doneOf(s, acts.filter((a) => a.day === s.day))));
  const nextReason = $derived(
    lastMissed.length
      ? tn(lastMissed.length, '1 planned session did not happen last week.', '{n} planned sessions did not happen last week.')
      : lastPlanned.length
        ? t('All planned sessions of last week were done.')
        : t('Nothing was planned last week: the hours you trained count.'),
  );
  const nextGoals = $derived(
    Object.entries(sportGoals)
      .filter(([, n]) => n > 0)
      .map(([id, n]) => ({ id, n, name: sportName(sportById(id)) }))
      .filter((g) => g.name),
  );
  const laterNext = () => db.settings.put({ key: NEXTKEEP_KEY, value: { monday: mondayOf(today) } });
  function pickNext(h) {
    monday = shiftDay(mondayOf(today), 7);
    nextPreset = { hours: h, n: Date.now() };
    setTimeout(() => document.getElementById('plan-h')?.scrollIntoView?.({ block: 'start' }), 50);
  }

  // «Training verbessern» 7 «Einheiten-Bibliothek»: keep a session, plan it again with one tap, rename, delete (Undo)
  const libQ = liveQuery(async () => (await db.settings.get(LIBRARY_KEY))?.value ?? null);
  const library = $derived(libraryOf($libQ, t));
  const saveLibrary = (v) => db.settings.put({ key: LIBRARY_KEY, value: cleanLibrary(v) });
  function pickFromLibrary(e) {
    form = { ...form, kind: e.kind, name: e.name, mins: e.mins, zone: e.zone ?? 0, sport: e.sport ?? '' };
    saveLibrary(library.map((x) => (x.id === e.id ? { ...x, uses: x.uses + 1 } : x))); // «Most used first»
  }
  async function saveToLibrary() {
    const name = (form.name ?? '').trim() || (form.sport ? sportName(sportById(form.sport)) : '') || t(KIND_NAMES[form.kind]);
    const mins = Math.round(Number(form.mins));
    if (!(mins > 0)) return;
    await saveLibrary([...library, { id: `lib-${Date.now().toString(36)}`, name, kind: form.kind, mins, zone: form.zone || null, sport: form.kind === 'other' ? form.sport : '', group: '', uses: 0 }]);
    offerDone(t('«{name}» kept in the library.', { name }));
  }
  // every change of the library (rename, move, group, delete) offers Undo
  function changeLibrary(list, msg) {
    const before = library;
    saveLibrary(list);
    if (msg) offerDone(msg, () => saveLibrary(before));
  }

  // «Training verbessern» 6 «Wochenlast-Wächter»: the planned week against the 3 weeks before; «Shorten» scales what is still to come (Undo)
  const loadHint = $derived(monday >= mondayOf(today) ? weekLoadHint([3, 2, 1].map((n) => Math.round(weekNumbers(acts, plan, shiftDay(monday, -7 * n), zones.bounds).secs / 60)), nums.planned) : null);
  async function shortenWeek(h) {
    const before = plan;
    await db.settings.put({ key: LOADKEEP_KEY, value: { monday } }); // answered: the card does not offer it twice
    await savePlan(scaleWeek(plan, { monday, today, target: h.target }));
    offerDone(t('Week shortened.'), async () => {
      await db.settings.delete(LOADKEEP_KEY);
      await savePlan(before);
    });
  }

  // «Training verbessern» 5 «Verpasst? Verschieben»: planned earlier this week, not done: move to a day that is left, or let go (Undo)
  const missed = $derived(plan.filter((s) => s.day >= mondayOf(today) && s.day < today && !doneOf(s, acts.filter((a) => a.day === s.day))));
  const targets = $derived(Array.from({ length: 7 }, (_, i) => shiftDay(today, i)).filter((d) => d < shiftDay(mondayOf(today), 7)).map((d, i) => ({ day: d, label: i === 0 ? t('Today|missed') : fmt(d, { weekday: 'short' }) })));
  async function moveMissed(s, day) {
    const before = plan;
    await savePlan(plan.map((x) => (x.id === s.id ? { ...x, day } : x)));
    offerDone(t('«{name}» moved.', { name: planName(s) }), () => savePlan(before));
  }
  async function skipMissed(s) {
    const before = plan;
    await savePlan(plan.filter((x) => x.id !== s.id));
    offerDone(t('«{name}» let go.', { name: planName(s) }), () => savePlan(before));
  }

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
  const add = (day) => ((newSport = null), (form = { id: '', day, kind: 'bike', name: '', mins: 60, zone: 2, sport: '' }));
  const edit = (s) => ((newSport = null), (form = { ...s, zone: s.zone ?? 0, sport: s.sport ?? '' }));
  async function keep(e) {
    e.preventDefault();
    const s = cleanSession({ ...form, sport: form.kind === 'other' ? form.sport : '' });
    if (!s) return;
    await savePlan([...plan.filter((x) => x.id !== s.id), s]);
    form = null;
  }
  async function drop() {
    await savePlan(plan.filter((x) => x.id !== form.id));
    form = null;
  }
  // Klick-Rundgang A04: «Gemacht» by hand, for a session Strava does not tick (indoor, no watch); with Undo
  async function markDone(on) {
    const before = plan.find((x) => x.id === form.id);
    if (!before) return;
    await savePlan(plan.map((x) => (x.id === before.id ? { ...x, done: on } : x)));
    form = null;
    offerDone(on ? t('«{name}» marked as done.', { name: before.name || t(KIND_NAMES[before.kind]) }) : t('«{name}» open again.', { name: before.name || t(KIND_NAMES[before.kind]) }), () => savePlan(plan.map((x) => (x.id === before.id ? before : x))));
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
  // «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): the look back is the shared bar chart, hours per week stacked by
  // zone, the plan as the line; a tap opens the week with the hours of every zone, «As table» lists the weeks.
  const ZONE_COLOR = ['var(--z1)', 'var(--z2)', 'var(--z3)', 'var(--z4)', 'var(--z5)'];
  const h2 = (secs) => Math.round((secs / 3600) * 100) / 100;
  const weekName = (w) => t('Week {kw}', { kw: w.kw });
  const wCols = $derived(
    weeks.map((w) => ({
      key: w.m,
      x: t('Wk {n}', { n: w.kw }),
      top: w.secs ? hmm(w.secs) : '',
      parts: [...w.zones.map((s, k) => ({ v: h2(s), color: ZONE_COLOR[k] })), { v: h2(w.unknown ?? 0), color: 'var(--bar)' }],
    })),
  );
  const wLine = $derived(weeks.some((w) => w.planned) ? weeks.map((w) => (w.planned ? Math.round((w.planned / 60) * 100) / 100 : null)) : null);
  const wRead = (i) => ({ title: weekName(weeks[i]), items: [{ label: t('Done'), value: `${hmm(weeks[i].secs)} h`, color: 'var(--z2)' }, ...(weeks[i].planned ? [{ label: t('Planned'), value: `${hours(weeks[i].planned)} h` }] : [])] });
  const wTable = $derived({ head: [t('Week'), t('Done'), t('Planned')], rows: [...weeks].reverse().map((w) => ({ key: w.m, cells: [weekName(w), `${hmm(w.secs)} h`, w.planned ? `${hours(w.planned)} h` : '–'] })) });
  let wSel = $state(null);
  const baseShare = $derived.by(() => {
    const z = nums.zones.reduce((s, x) => s + x, 0);
    return z ? Math.round(((nums.zones[0] + nums.zones[1]) / z) * 100) : null;
  });
</script>

<div class="wk">
  <!-- «Aktiv sichtbar» (332 Use Cases, Noah 25.10.2026 «fange mit dem bereich aktiv an»): the week plan, the week in
       review and the training plans stand 2 screens down; one chip row on top -->
  <QuickLinks label={t('On this page')} links={[{ key: 'plan', jump: '#plan-h', label: t('Plan the week') }, { key: 'review', href: '#/flow/review', label: t('Week in review') }, { key: 'plans', href: '#/flow/plans', label: t('Training plans') }, { key: 'ana', jump: '#wka-h', label: t('Power and analyses') }]} />
  <FeelAsk {acts} {today} />
  <WeekLoad hint={loadHint} {monday} planned={nums.planned} {hours} onshorten={shortenWeek} />
  <Missed {missed} {targets} name={planName} {hours} dayLabel={(d) => fmt(d, { weekday: 'long' })} onmove={moveMissed} onskip={skipMissed} />
  <TodayFits {plan} {today} level={$formQ?.ready?.level ?? null} name={planName} onlighter={lighterToday} />
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
                  <a class="ch done" href="#/flow/training/a/{encodeURIComponent(a.id)}" data-done={a.id}><KindIcon kind={a.kind} size={14} /><span class="cn">{stravaName(a.name) || t(typeKey(a.type))}</span><span class="num">· {rideTimeS(a.movingS)}</span>{#if z != null}<i class="zt z{z + 1}">Z{z + 1}</i>{/if}<Check size={14} aria-hidden="true" /></a>
                {/each}
                {#each planned as s (s.id)}
                  {@const by = doneOf(s, done)}
                  <button type="button" class="ch plan" class:ok={by} onclick={() => edit(s)} data-planned={s.id}><KindIcon kind={s.kind} size={14} /><span class="cn">{planName(s)}</span><span class="num">· {hours(s.mins)}</span>{#if s.zone}<i class="zt z{s.zone}">Z{s.zone}</i>{/if}{#if by}<span class="sr">{t('done')}</span><Check size={14} aria-hidden="true" />{/if}</button>
                {/each}
                <button type="button" class="ch add" aria-label={t('Plan a session on {day}', { day: fmt(d, { weekday: 'long' }) })} onclick={() => add(d)} data-add={d}><Plus size={14} aria-hidden="true" /></button>
              </span>
              {#if form?.day === d}
                <form class="sf" onsubmit={keep} data-session-form>
                  <Seg small chips full={false} label={t('Kind')} value={form.kind} onchange={(k) => (form.kind = k)} options={KINDS.map((k) => ({ key: k, name: t(KIND_NAMES[k]) }))} />
                  {#if form.kind === 'other'}
                    <div class="sfl">
                      <label>{t('Sport')}
                        <select class="sel" bind:value={form.sport} data-session-sport>
                          <option value="">{t('Other (no sport)')}</option>
                          {#each sports as a (a.id)}<option value={a.id}>{sportName(a)}</option>{/each}
                        </select>
                      </label>
                      {#if newSport == null}
                        <button type="button" class="btn btn-link sm" onclick={() => (newSport = '')} data-sport-new>{t('Add a sport')}</button>
                      {:else}
                        <label>{t('Name of the new sport')}<input class="inp" bind:value={newSport} maxlength="40" data-sport-name /></label>
                        <span class="row"><button type="button" class="btn sm" onclick={addSport} data-sport-save>{t('Add')}</button><button type="button" class="btn btn-link sm" onclick={() => (newSport = null)}>{t('Cancel')}</button></span>
                      {/if}
                    </div>
                    <p class="hint">{t('Your sports are the ones from «Meine Aktivitäten». Done is ticked as soon as you tick the sport in Aktiv.')}</p>
                  {/if}
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
                  <Library items={library} canSave {hours} onpick={pickFromLibrary} onsave={saveToLibrary} onchange={changeLibrary} />
                  <div class="row">
                    <button type="submit" class="btn hi sm">{t('Save')}</button>
                    {#if form.id}<button type="button" class="btn sm" onclick={() => markDone(!form.done)} data-session-done><Check size={16} aria-hidden="true" />{form.done ? t('Not done yet') : t('Done|session')}</button>{/if}
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
        <SuggestWeek {acts} flowActs={$actsQ ?? []} {plan} {goal} {monday} {today} level={$formQ?.ready?.level ?? null} daysToRace={nextRace?.startDate ? daysBetween(today, nextRace.startDate) : null} {dayLimits} forecast={homeFc} {sportGoals} onsportgoals={saveSportGoals} {habits} onhabits={saveHabits} onlimits={saveLimits} onapply={applySuggestion} preset={nextPreset} />
      </div>
    </Sec>

    <Sec id="back-h" title={t('Look back')} sub={t('Hours per week by zone · line = plan')} more={{ href: '#/flow/review', label: t('Week in review') }}>
      <div class="card back" data-section="look-back">
        {#if backEmpty}
          <p class="none" data-back-empty>{t('No training time in the last 6 weeks yet. As soon as Strava brings an activity with heart rate, a bar per week stands here.')}</p>
          <a class="btn sm" href={STRAVA_HASH} data-back-strava>{strava.key ? t('To Strava') : t('Connect Strava')}</a>
        {:else}
        <BarChart id="lookback" cols={wCols} line={wLine} lineColor="var(--ink)" readout={wRead} table={wTable} unit="h" label={t('Hours per week, last six weeks')} onopen={(i) => (wSel = i)} hint={t('Point at a week for its hours, tap it for the zones.')} />
        <ZoneBar bar={false} legend />
        <p class="tw num" data-this-week>{goal?.hours ? t('This week {a} of {b} h', { a: hmm(nums.secs), b: hours(goal.hours * 60) }) : t('This week {a} h', { a: hmm(nums.secs) })}{#if baseShare != null}{' · '}{goal?.base != null ? t('Z1–Z2 {n} % (goal {g} %)', { n: baseShare, g: goal.base }) : t('Z1–Z2 {n} %', { n: baseShare })}{/if}</p>
        {#if showNext}<NextWeek last={lastWeekHours} reason={nextReason} goals={nextGoals} hours={(h) => `${num(h)} h`} onpick={pickNext} onlater={laterNext} />{/if}
        {/if}
        <p class="fb"><span><Timer size={16} aria-hidden="true" />{t('Active zone minutes')} <i class="pill">{t('with Fitbit')}</i></span><span><Heart size={16} aria-hidden="true" />{t('Resting heart rate')} <i class="pill">{t('with Fitbit')}</i></span></p>
      </div>
    </Sec>
  </div>

  <WeekAnalyses {acts} {today} />
</div>
{#if wSel != null && weeks[wSel]}
  {@const w = weeks[wSel]}
  <ChartSheet kicker={t('Hours per week by zone')} title={weekName(w)} onclose={() => (wSel = null)} onprev={wSel > 0 ? () => wSel-- : null} onnext={wSel < weeks.length - 1 ? () => wSel++ : null} prevLabel={t('Week before')} nextLabel={t('Next week')}>
    <ul class="shl" data-lookback-sheet>
      <li><span>{t('Done')}</span><b class="num">{hmm(w.secs)} h</b></li>
      {#if w.planned}<li><span>{t('Planned')}</span><b class="num">{hours(w.planned)} h</b></li>{/if}
      {#each w.zones as s, k (k)}{#if s}<li><span>Z{k + 1}</span><b class="num">{hmm(s)} h</b></li>{/if}{/each}
    </ul>
  </ChartSheet>
{/if}

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
  .shl {
    display: grid;
    gap: 6px;
    margin: 0 0 10px;
    padding: 0;
    list-style: none;
  }
  .shl li {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }
  .shl span {
    color: var(--ink-2);
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
