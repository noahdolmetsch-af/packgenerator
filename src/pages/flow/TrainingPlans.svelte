<script>
  /**
   * «Trainingspläne» (Noah 19.10.2026 «1a 2 kann eingestellt werden 3 a und b und gefühlte Anstrengung 4 1-4»):
   * Aktiv › Training › Trainingspläne, loaded only when opened.
   *   #/flow/plans           the four sample plans for ultracycling and the own ones, the plan in use
   *                          (with suggestions for missed sessions this week) and how hard each zone is
   *   #/flow/plans/<id>      one plan: start (backwards from the race day or from a day), hours per week,
   *                          the weeks, a typical week, «Try it»; own plans: rename, weeks, hours, delete
   *   ?race=YYYY-MM-DD       a race day to start from (e.g. from Rennen › Vorbereiten)
   * «Try it» writes the sessions into the week plan (training.plan); Strava ticks them as before.
   * Everything is a suggestion: sessions can be changed in the week plan, the plan can be taken out.
   */
  import { liveQuery } from 'dexie';
  import { CalendarRange, ChevronRight, Copy, Pencil, Trash2, Play, X, Heart, Zap, Gauge, MoveRight } from '@lucide/svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import Sec from '../../lib/flow/kit/Sec.svelte';
  import PageHead from '../../lib/ui/PageHead.svelte';
  import Seg from '../../lib/ui/Seg.svelte';
  import { db } from '../../lib/db.js';
  import { zones } from '../../lib/strava/zones.svelte.js';
  import { PLAN_KEY, GOAL_KEY, planOf, goalOf, prunePlan, cleanSession, ftpEstimate, mondayOf, shiftDay, hmm, ZONE_NAMES } from '../../lib/training.js';
  import { sessionStates } from '../../lib/training/inhalt/inhalt-woche.js';
  import { TPL_KEY, OWN_KEY, HIDE_KEY, allPlans, planById, ownOf, cleanOwn, midHours, firstMonday, buildPlan, longestOf, applyPlan, removePlan, weeksGone, zoneWays, moveSuggestions, raceChoices, raceMoved, RACES_KEY, WEEKS_MIN, WEEKS_MAX } from '../../lib/training/plans.js';
  import { askDelete, deleteWithUndo, once } from '../../lib/ui/ask.js';
  import { offerDone } from '../../lib/ui/rename.svelte.js';
  import { t, tn, num, locale } from '../../lib/i18n.svelte.js';
  import { localDay } from '../../lib/localday.js';

  let { id = '', params = new URLSearchParams() } = $props();

  const today = localDay();
  const setting = (key) => liveQuery(async () => (await db.settings.get(key))?.value ?? null);
  const tplQ = setting(TPL_KEY);
  const ownQ = setting(OWN_KEY);
  const hideQ = setting(HIDE_KEY);
  const planQ = setting(PLAN_KEY);
  const goalQ = setting(GOAL_KEY);
  const racesQ = setting(RACES_KEY); // Paket U «Rennen», read only
  const tripsQ = liveQuery(() => db.trips.toArray());
  const actsQ = liveQuery(() => db.activities.toArray());

  const own = $derived(ownOf($ownQ));
  const hidden = $derived(Array.isArray($hideQ) ? $hideQ : []);
  const plans = $derived(allPlans(own, hidden));
  const sessions = $derived(planOf($planQ));
  const acts = $derived($actsQ ?? []);
  const ftp = $derived(ftpEstimate(acts, today));
  const active = $derived($tplQ && typeof $tplQ === 'object' ? $tplQ : null);
  const activePlan = $derived(active ? planById(active.id, own) : null);
  const plan = $derived(id ? planById(id, own) : null);
  const goal = $derived(goalOf($goalQ));
  // coupled to a race (Noah «1a»): the trips ahead that are races
  const trips = $derived($tripsQ ?? []);
  const races = $derived(raceChoices(trips, $racesQ, today));
  const raceTitle = (r) => r?.title || t('Race without a name');
  const activeRace = $derived(active?.tripId ? (trips.find((x) => x.id === active.tripId) ?? null) : null);
  const movedTo = $derived(raceMoved(active, trips));

  const nameOf = (p) => (p.own ? p.name : t(p.name)); // own names are the user's text, never through t()
  const fmt = (d, o = { day: 'numeric', month: 'short' }) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', ...o });
  const hours = (mins) => hmm(mins * 60);
  const nextMonday = shiftDay(mondayOf(today), 7);
  const KIND_WORD = { build: 'Build|week', easy: 'Easier week', taper: 'Easier before the race', race: 'Race week' };

  const savePlan = (next) => db.settings.put({ key: PLAN_KEY, value: { sessions: prunePlan(next, today) } });

  /* ---------- the plan in use: missed sessions of this week (default a: suggest a free day) ---------- */
  const weekStates = $derived(active ? sessionStates(sessions.filter((s) => s.day >= mondayOf(today) && s.day < today && String(s.src ?? '').startsWith('tpl:')), acts, today, zones.bounds) : []);
  const moves = $derived(moveSuggestions(weekStates, sessions.filter((s) => s.day >= mondayOf(today) && s.day < shiftDay(mondayOf(today), 7)), today));
  const moveTo = (s, day) => savePlan(sessions.map((x) => (x.id === s.id ? cleanSession({ ...x, day }) : x)));
  const leaveOut = (s) => savePlan(sessions.filter((x) => x.id !== s.id));

  async function takeOut() {
    const name = activePlan ? nameOf(activePlan) : '';
    const before = { sessions, tpl: active };
    await deleteWithUndo({
      run: async () => {
        await savePlan(removePlan(sessions, today));
        await db.settings.delete(TPL_KEY);
        return before;
      },
      undo: async (b) => {
        await savePlan(b.sessions);
        await db.settings.put({ key: TPL_KEY, value: b.tpl });
      },
      text: t('Plan «{name}» taken out of your week plan.', { name }),
      name,
    });
  }

  /* ---------- one plan: the start and the hours ---------- */
  const raceParam = $derived(params.get('race') ?? '');
  const tripParam = $derived(params.get('trip') ?? '');
  let mode = $state('race');
  let date = $state('');
  let tripId = $state('');
  let hrs = $state(0);
  let shownFor = '';
  $effect(() => {
    if (!plan || shownFor === plan.id) return;
    if ($tripsQ === undefined || $racesQ === undefined || $tplQ === undefined || $goalQ === undefined) return; // wait for the data
    shownFor = plan.id;
    const mine = active?.id === plan.id ? active : null;
    // the race day: from the address, a race of «Rennen» (asked for, or the soonest), or the training goal's day
    const pick = races.find((r) => r.id === tripParam) ?? (/^\d{4}-\d{2}-\d{2}$/.test(raceParam) ? null : races[0]) ?? null;
    const raceDay = /^\d{4}-\d{2}-\d{2}$/.test(raceParam) ? raceParam : pick ? pick.day : goal?.until && goal.until > today ? goal.until : '';
    mode = mine?.mode ?? (raceDay ? 'race' : 'start');
    date = mine?.date ?? (mode === 'race' ? raceDay : nextMonday);
    tripId = mine ? (mine.tripId ?? '') : mode === 'race' && pick && raceDay === pick.day ? pick.id : '';
    hrs = mine?.hours ?? midHours(plan);
  });
  const first = $derived(plan ? firstMonday(plan, mode, date) : null);
  const weeks = $derived(plan && first ? buildPlan(plan, { first, hours: hrs, race: mode === 'race' ? date : null }) : []);
  const pastN = $derived(weeks.filter((w) => w.monday < mondayOf(today)).length);
  const gone = $derived(first ? Math.min(plan?.weeks ?? 0, weeksGone(first, today)) : 0);
  const sample = $derived(weeks.find((w) => w.kind === 'build' && w.sessions.some((s) => s.long && s.name === 'Second long day')) ?? weeks.find((w) => w.kind === 'build') ?? weeks[0] ?? null);
  const dateErr = $derived(!date ? '' : mode === 'race' && date <= today ? t('The race day lies in the past.') : '');
  const ready = $derived(!!first && !dateErr && gone < (plan?.weeks ?? 0));

  const tryIt = once(async () => {
    if (!ready) return;
    // Klick-Rundgang A02: «Ausprobieren» can be taken back (the week plan and the plan in use as they were)
    const [oldPlan, oldTpl] = await Promise.all([db.settings.get(PLAN_KEY), db.settings.get(TPL_KEY)]);
    await savePlan(applyPlan(sessions, weeks, plan.id, today, t));
    await db.settings.put({ key: TPL_KEY, value: { id: plan.id, mode, date, hours: hrs, first, ...(mode === 'race' && tripId ? { tripId } : {}) } });
    const back = (key, row) => (row ? db.settings.put(row) : db.settings.delete(key));
    offerDone(t('Plan «{name}» is in your week plan. Strava ticks the sessions.', { name: nameOf(plan) }), () => Promise.all([back(PLAN_KEY, oldPlan), back(TPL_KEY, oldTpl)]));
    location.hash = '#/flow/training';
  });

  // the race moved: the plan follows it (same plan and hours, new race day)
  const follow = once(async () => {
    if (!activePlan || !movedTo) return;
    const f = firstMonday(activePlan, 'race', movedTo);
    await savePlan(applyPlan(sessions, buildPlan(activePlan, { first: f, hours: active.hours, race: movedTo }), activePlan.id, today, t));
    await db.settings.put({ key: TPL_KEY, value: { ...active, date: movedTo, first: f } });
    offerDone(t('Plan moved to the new race day.'));
  });

  /* ---------- own plans and hidden samples ---------- */
  const saveOwn = (list) => db.settings.put({ key: OWN_KEY, value: list });
  const copyIt = once(async () => {
    const base = plan.own ? plan.base : plan.id;
    const c = cleanOwn({ name: t('{name} (mine)', { name: nameOf(plan) }).slice(0, 60), base, weeks: plan.weeks, lo: plan.lo, hi: plan.hi, order: (own.at(-1)?.order ?? 0) + 1 });
    await saveOwn([...own, c]);
    location.hash = `#/flow/plans/${encodeURIComponent(c.id)}?edit=1`;
  });
  let form = $state(null); // { name, weeks, lo, hi }
  $effect(() => {
    if (plan?.own && params.get('edit') === '1' && !form) form = { name: plan.name, weeks: plan.weeks, lo: plan.lo, hi: plan.hi };
  });
  const keepOwn = once(async () => {
    const c = cleanOwn({ ...plan, ...form, id: plan.id });
    if (!c) return;
    await saveOwn(own.map((o) => (o.id === c.id ? c : o)));
    form = null;
    shownFor = '';
  });
  async function dropPlan(p) {
    const name = nameOf(p);
    const text = active?.id === p.id ? t('The sessions already in your week plan stay.') : '';
    if ((await askDelete({ title: t('Delete plan «{name}»?', { name }), text })) !== 'delete') return;
    if (p.own) {
      const old = own;
      await deleteWithUndo({ run: async () => (await saveOwn(old.filter((o) => o.id !== p.id)), old), undo: (o) => saveOwn(o), text: t('"{name}" deleted.', { name }), name });
    } else {
      const old = hidden;
      await deleteWithUndo({ run: async () => (await db.settings.put({ key: HIDE_KEY, value: [...old, p.id] }), old), undo: (o) => db.settings.put({ key: HIDE_KEY, value: o }), text: t('"{name}" deleted.', { name }), name });
    }
    if (id === p.id) location.hash = '#/flow/plans';
  }
  const showHidden = () => db.settings.delete(HIDE_KEY);
  // reorder the own plans with arrows (rule 12; few entries, so arrows do it)
  async function moveOwn(p, dir) {
    const list = [...own].sort((a, b) => a.order - b.order);
    const i = list.findIndex((o) => o.id === p.id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    await saveOwn(list.map((o, k) => ({ ...o, order: k + 1 })));
  }

  const hrText = (w) => (!w?.hr ? '' : w.hr.from == null ? t('under {n} bpm', { n: w.hr.to + 1 }) : w.hr.to == null ? t('from {n} bpm', { n: w.hr.from }) : t('{a}–{b} bpm', { a: w.hr.from, b: w.hr.to }));
  const wText = (w) => (!w?.w ? '' : w.w.from == null ? t('under {n} W', { n: w.w.to + 1 }) : t('{a}–{b} W', { a: w.w.from, b: w.w.to }));
  const feelText = (w) => (w?.feel ? t('feels {a}–{b} of 10', { a: w.feel[0], b: w.feel[1] }) : '');
</script>

<div class="tp">
  <header class="ph">
    <Crumb path={[{ href: '#/flow', label: t('Analysis|place') }, { href: '#/flow/training', label: t('Training|tab') }, ...(plan ? [{ href: '#/flow/plans', label: t('Training plans') }] : [])]} here={plan ? nameOf(plan) : t('Training plans')} />
    {#if plan}
      <PageHead title={nameOf(plan)} text={t(plan.who)} />
    {:else}
      <PageHead title={t('Training plans')} text={t('Sample plans for ultracycling to try. «Try it» puts the sessions into your week plan under Training; Strava ticks them by itself. You can change or take out everything.')} />
    {/if}
  </header>

  {#if id && !plan}
    <p class="hint" role="status">{t('This plan is no longer there.')} <a href="#/flow/plans">{t('All training plans')}</a></p>
  {:else if plan}
    <!-- one plan -->
    {#if form}
      <form class="card own" onsubmit={keepOwn} data-section="own-edit">
        <label>{t('Name')}<input class="inp" bind:value={form.name} maxlength="60" required data-own-name /></label>
        <label>{t('Weeks')}<input class="inp num" type="number" min={WEEKS_MIN} max={WEEKS_MAX} bind:value={form.weeks} data-own-weeks /></label>
        <label>{t('Hours per week from')}<input class="inp num" type="number" min="1" max="30" step="0.5" bind:value={form.lo} /></label>
        <label>{t('to|hours')}<input class="inp num" type="number" min="1" max="30" step="0.5" bind:value={form.hi} /></label>
        <div class="row">
          <button type="submit" class="btn hi">{t('Save')}</button>
          <button type="button" class="btn btn-link" onclick={() => (form = null)}>{t('Cancel')}</button>
        </div>
      </form>
    {/if}

    <Sec id="start-h" title={t('When and how much')} sub={t('The plan ends in the race week, or starts in the week you choose.')}>
      <div class="card st" data-section="plan-start">
        <Seg label={t('Start')} value={mode} onchange={(k) => ((mode = k), (tripId = k === 'race' && races[0] ? races[0].id : ''), (date = k === 'race' ? (races[0]?.day ?? (goal?.until && goal.until > today ? goal.until : '')) : nextMonday))} options={[{ key: 'race', name: t('Back from the race day') }, { key: 'start', name: t('From a day') }]} />
        {#if mode === 'race' && races.length}
          <label class="lab">{t('Race')}
            <select class="sel" value={tripId} onchange={(e) => ((tripId = e.currentTarget.value), tripId && (date = races.find((r) => r.id === tripId)?.day ?? date))} data-plan-race>
              {#each races as r (r.id)}<option value={r.id}>{raceTitle(r)} · {fmt(r.day, { day: 'numeric', month: 'short', year: 'numeric' })}</option>{/each}
              <option value="">{t('Another day')}</option>
            </select>
          </label>
        {:else if mode === 'race'}
          <p class="hint">{t('Tip: mark a trip as race (or open it under «Rennen»), then you can pick it here and the plan follows its day.')}</p>
        {/if}
        <label class="lab">{mode === 'race' ? t('Race day') : t('Start in the week of')}<input class="inp" type="date" bind:value={date} oninput={() => tripId && races.find((r) => r.id === tripId)?.day !== date && (tripId = '')} data-plan-date /></label>
        {#if dateErr}<p class="warn" role="alert">{dateErr}</p>{/if}
        <label class="lab">{t('Hours per week: {h}', { h: num(hrs) })}<input type="range" min={Math.max(1, plan.lo - 2)} max={plan.hi + 2} step="0.5" bind:value={hrs} data-plan-hours /></label>
        <p class="hint">{t('Suggested: {a} to {b} hours. The weeks rise from 80 % to 110 % of it, every fourth week is easier.', { a: num(plan.lo), b: num(plan.hi) })}</p>
        {#if gone > 0 && ready}<p class="warn" data-plan-gone>{t('The race is close: the first {n} weeks fall away, the plan starts with this week.', { n: gone })}</p>{/if}
        {#if !date}<p class="hint">{mode === 'race' ? t('Choose the race day. Tip: a goal with a day under Training fills it in.') : t('Choose a day.')}</p>{/if}
        <div class="row">
          <button type="button" class="btn hi" disabled={!ready} onclick={tryIt} data-plan-try><Play size={16} aria-hidden="true" />{active?.id === plan.id ? t('Write in again') : t('Try it')}</button>
          <button type="button" class="btn" onclick={copyIt} data-plan-copy><Copy size={16} aria-hidden="true" />{t('Copy as my own plan')}</button>
          {#if plan.own}<button type="button" class="btn" onclick={() => (form = { name: plan.name, weeks: plan.weeks, lo: plan.lo, hi: plan.hi })} data-own-change><Pencil size={16} aria-hidden="true" />{t('Change|plan')}</button>{/if}
        </div>
        {#if active && active.id !== plan.id}<p class="hint">{t('«Try it» replaces the plan in use from today on. Sessions you planned yourself stay.')}</p>{/if}
      </div>
    </Sec>

    {#if weeks.length}
      <Sec id="weeks-h" title={t('The weeks')} sub={t('Hours per week and the longest ride.')}>
        <!-- Klick-Rundgang A03: the list starts with this week; weeks already past are only counted -->
        {#if pastN}<p class="hint" data-weeks-past>{tn(pastN, '{n} week lies in the past and is left out.', '{n} weeks lie in the past and are left out.')}</p>{/if}
        <ol class="card wl" data-section="plan-weeks">
          {#each weeks.filter((w) => w.monday >= mondayOf(today)) as w (w.i)}
            <li class:gone={w.monday < mondayOf(today)} class:easy={w.kind !== 'build'} data-week={w.i + 1}>
              <span class="wn num">{t('Wk {n}', { n: w.i + 1 })}</span>
              <span class="wd">{fmt(w.monday)}<small>{t(KIND_WORD[w.kind])}</small></span>
              <span class="wh num">{hours(w.mins)} h</span>
              <span class="wlg num">{t('longest {t}', { t: hours(longestOf(w)) })}</span>
            </li>
          {/each}
        </ol>
      </Sec>
    {/if}

    {#if sample}
      <Sec id="typ-h" title={t('A typical week')} sub={t('Week {n}. How hard: heart rate, watts and how it feels.', { n: sample.i + 1 })}>
        <ul class="card tw" data-section="plan-typical">
          {#each sample.sessions as s (s.day)}
            {@const w = zoneWays(s.zone, zones.bounds, ftp)}
            <li>
              <span class="td">{fmt(s.day, { weekday: 'short' })}</span>
              <span class="tn"><b>{t(s.name)}</b><small>{[`${hours(s.mins)} h`, `Z${s.zone} ${t(ZONE_NAMES[s.zone - 1])}`].join(' · ')}</small><small class="ways">{[hrText(w), wText(w), feelText(w)].filter(Boolean).join(' · ')}</small></span>
            </li>
          {/each}
        </ul>
      </Sec>
      {#if !ftp}<p class="hint">{t('Watts show once a ride with a power meter is in from Strava (the app estimates your FTP from it).')}</p>{/if}
    {/if}

    <div class="row end">
      <button type="button" class="btn btn-link" onclick={() => dropPlan(plan)} data-plan-delete><Trash2 size={16} aria-hidden="true" />{t('Delete plan')}</button>
    </div>
  {:else}
    <!-- the list -->
    {#if active && activePlan}
      <section class="card on" aria-labelledby="on-h" data-section="plan-active">
        <span class="oi" aria-hidden="true"><CalendarRange size={22} /></span>
        <div class="oc">
          <h2 id="on-h" class="oh">{t('In use: {name}', { name: nameOf(activePlan) })}</h2>
          {#if activeRace}<p data-plan-for>{t('For: {race}', { race: activeRace.title || t('Race without a name') })}</p>{/if}
          {#if movedTo}
            <p class="warn" data-plan-moved>{t('The race now starts on {date}.', { date: fmt(movedTo, { day: 'numeric', month: 'long', year: 'numeric' }) })} <button type="button" class="btn sm" onclick={follow} data-plan-follow>{t('Move the plan along')}</button></p>
          {/if}
          <p class="num">{active.mode === 'race' ? t('Race day {date} · {h} h per week', { date: fmt(active.date, { day: 'numeric', month: 'long', year: 'numeric' }), h: num(active.hours) }) : t('From {date} · {h} h per week', { date: fmt(active.first), h: num(active.hours) })}</p>
          {#if moves.length}
            <ul class="mv" data-section="plan-missed">
              {#each moves as m (m.s.id)}
                <li>
                  <span>{t('{name} on {day} not ridden.', { name: m.s.name, day: fmt(m.s.day, { weekday: 'long' }) })}</span>
                  {#if m.to}<button type="button" class="btn sm" onclick={() => moveTo(m.s, m.to)} data-move={m.s.id}><MoveRight size={14} aria-hidden="true" />{t('Move to {day}', { day: fmt(m.to, { weekday: 'long' }) })}</button>{/if}
                  <button type="button" class="btn btn-link sm" onclick={() => leaveOut(m.s)} data-leave={m.s.id}>{t('Leave it out')}</button>
                </li>
              {/each}
            </ul>
            <p class="hint">{t('A missed session is no problem: move it to a free day or leave it out. Do not ride two hard days in a row to catch up.')}</p>
          {/if}
          <div class="row">
            <a class="btn sm" href="#/flow/plans/{encodeURIComponent(activePlan.id)}">{t('Open|plan')}</a>
            <a class="btn sm" href="#/flow/training">{t('To the week plan')}</a>
            <button type="button" class="btn btn-link sm" onclick={takeOut} data-plan-out><X size={14} aria-hidden="true" />{t('Take out')}</button>
          </div>
        </div>
      </section>
    {/if}

    <Sec id="all-h" title={t('Plans to try')} sub={t('Written for this app, free. Pick one, set the race day and the hours.')}>
      <ul class="pl" data-section="plan-list">
        {#each plans as p, i (p.id)}
          <li class="card pc" data-plan={p.id}>
            <a class="pa" href="#/flow/plans/{encodeURIComponent(p.id)}">
              <span class="pn"><b>{nameOf(p)}</b>{#if p.own}<small class="tag">{t('My plan')}</small>{/if}</span>
              <span class="pw">{t(p.who)}</span>
              <span class="pf num">{t('{w} weeks · {a}–{b} h per week', { w: p.weeks, a: num(p.lo), b: num(p.hi) })}</span>
              <ChevronRight size={18} aria-hidden="true" />
            </a>
            <div class="pt">
              {#if p.own}
                <button type="button" class="ib" aria-label={t('Up')} disabled={i === 0 || !plans[i - 1].own} onclick={() => moveOwn(p, -1)}>↑</button>
                <button type="button" class="ib" aria-label={t('Down')} disabled={i === plans.length - 1} onclick={() => moveOwn(p, 1)}>↓</button>
                <a class="ib" aria-label={t('Rename')} href="#/flow/plans/{encodeURIComponent(p.id)}?edit=1"><Pencil size={16} aria-hidden="true" /></a>
              {/if}
              <button type="button" class="ib" aria-label={t('Delete plan «{name}»?', { name: nameOf(p) })} onclick={() => dropPlan(p)} data-plan-drop={p.id}><Trash2 size={16} aria-hidden="true" /></button>
            </div>
          </li>
        {/each}
      </ul>
      {#if hidden.length}<button type="button" class="btn btn-link" onclick={showHidden} data-plan-unhide>{t('Show deleted sample plans again ({n})', { n: hidden.length })}</button>{/if}
    </Sec>

    <Sec id="how-h" title={t('How hard is each zone?')} sub={t('Three ways to the same zone: heart rate, watts with a power meter, or how it feels.')}>
      <ul class="card zl" data-section="plan-zones">
        {#each [1, 2, 3, 4, 5] as z (z)}
          {@const w = zoneWays(z, zones.bounds, ftp)}
          <li>
            <b>Z{z} {t(ZONE_NAMES[z - 1])}</b>
            <span class="zw"><Heart size={14} aria-hidden="true" />{hrText(w)}</span>
            <span class="zw"><Zap size={14} aria-hidden="true" />{wText(w) || t('no FTP yet')}</span>
            <span class="zw"><Gauge size={14} aria-hidden="true" />{feelText(w)}</span>
          </li>
        {/each}
      </ul>
      <p class="hint">{t('After each ride the app asks how hard it felt (1 to 10). Without heart rate that answer counts for «Plan kept?»; without an answer nothing counts.')}</p>
    </Sec>
  {/if}
</div>

<style>
  .tp { display: grid; gap: var(--sp-4); }
  .row { display: flex; flex-wrap: wrap; gap: var(--sp-2); align-items: center; margin-top: var(--sp-3); }
  .row.end { justify-content: flex-end; }
  .hint { margin: var(--sp-2) 0 0; color: var(--ink-2); font-size: var(--fs-small); }
  .warn { margin: var(--sp-2) 0 0; padding: var(--sp-2) var(--sp-3); border-radius: var(--radius); background: var(--warn-soft); color: var(--ink); font-size: var(--fs-small); }
  .lab { display: grid; gap: 4px; margin-top: var(--sp-3); font-size: var(--fs-label); }
  .lab input[type='range'] { width: 100%; }
  .own { display: grid; gap: var(--sp-2); grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
  .own label { display: grid; gap: 4px; font-size: var(--fs-label); }
  .own .row { grid-column: 1 / -1; }
  .on { display: flex; gap: var(--sp-3); }
  .oi { color: var(--accent); }
  .oc { flex: 1; min-width: 0; }
  .oh { margin: 0; font-size: var(--fs-sub); }
  .oc p { margin: 2px 0 0; color: var(--ink-2); }
  .mv { list-style: none; margin: var(--sp-3) 0 0; padding: 0; display: grid; gap: var(--sp-2); }
  .mv li { display: flex; flex-wrap: wrap; gap: var(--sp-2); align-items: center; }
  .pl { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-2); grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
  .pc { display: flex; flex-direction: column; gap: var(--sp-2); }
  .pa { display: grid; grid-template-columns: 1fr auto; gap: 2px var(--sp-2); color: inherit; text-decoration: none; }
  .pa :global(svg) { grid-column: 2; grid-row: 1 / span 3; align-self: center; color: var(--ink-3); }
  .pn, .pw, .pf { grid-column: 1; }
  .pn { display: flex; gap: var(--sp-2); align-items: baseline; }
  .pw { color: var(--ink-2); font-size: var(--fs-small); }
  .pf { color: var(--ink-2); font-size: var(--fs-small); }
  .tag { padding: 0 6px; border-radius: 999px; background: var(--accent-soft); font-size: var(--fs-tiny); }
  .pt { display: flex; gap: 4px; justify-content: flex-end; }
  .ib { display: inline-grid; place-items: center; min-width: 40px; min-height: 40px; border: 1px solid var(--line); border-radius: var(--r-ctl); background: var(--paper); color: var(--ink); cursor: pointer; }
  .ib:disabled { opacity: 0.4; cursor: default; }
  .wl, .tw, .zl { list-style: none; margin: 0; display: grid; gap: 0; }
  .wl li { display: grid; grid-template-columns: 56px 1fr auto auto; gap: var(--sp-2); align-items: baseline; padding: 6px 0; border-bottom: 1px solid var(--line); }
  .wl li:last-child, .tw li:last-child, .zl li:last-child { border-bottom: 0; }
  .wl li.easy .wh { color: var(--ink-2); }
  .wl li.gone { opacity: 0.5; }
  .wd small { display: block; color: var(--ink-2); font-size: var(--fs-tiny); }
  .wlg { color: var(--ink-2); font-size: var(--fs-small); }
  .tw li { display: grid; grid-template-columns: 48px 1fr; gap: var(--sp-2); padding: 8px 0; border-bottom: 1px solid var(--line); }
  .td { color: var(--ink-2); }
  .tn small { display: block; color: var(--ink-2); font-size: var(--fs-small); }
  .zl li { display: flex; flex-wrap: wrap; gap: 4px var(--sp-3); padding: 8px 0; border-bottom: 1px solid var(--line); }
  .zl b { flex-basis: 100%; }
  .zw { display: inline-flex; gap: 4px; align-items: center; color: var(--ink-2); font-size: var(--fs-small); }
  @media (max-width: 480px) {
    .wl li { grid-template-columns: 48px 1fr auto; }
    .wlg { grid-column: 2 / -1; }
  }
</style>
