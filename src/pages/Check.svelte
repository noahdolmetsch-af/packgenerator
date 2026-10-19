<script>
  /**
   * v0.127.0 «Tages-Check» 1 (mockups T1 and T2, Noah 13.10.2026 «ich gebe hiermit alle mockups frei»):
   * the morning check (#/check/morning) and the evening review (#/check/evening) as pages of Heute.
   *   Morning: 1–3 sleep, energy, mood (as since v0.51.0, the line under a number is yesterday), 4 the
   *   rotating question of the editable pool, 6 «Worauf freust du dich?», 7 the goal of the day, and
   *   «Gestern Abend» (optional). At the side: a suggestion for today (rules, never mandatory, «Nicht
   *   heute»), what the app already knows today, and the night as a small placeholder (Fitbit/Google later).
   *   Evening: 8 satisfaction, 9 the best of the day (+ a few words, spoken where the browser can),
   *   10 the morning's goal reached?, 11 time outside (filled in from today's rides, changeable), 12 or 13
   *   (they take turns), 14 a mindful moment (found by itself from today's meditation). At the side: the
   *   day in numbers, morning → evening, the week so far.
   * Every answer is saved at once in the day's row of flowChecks; every question can be skipped.
   * v0.127.0 «Tages-Check» 2 (T4): a question switched off in «Deine 15 Fragen» (#/check/questions) is
   * not asked; on Sundays the evening asks question 15 «Bist du deiner Vision näher gekommen?».
   */
  import SpeakButton from '../lib/ui/SpeakButton.svelte';
  import { appendSpoken } from '../lib/speak.js';
  import { Sun, Clock, Route, Lightbulb, PenLine, Flower2, Pencil, ListChecks, ChevronRight } from '@lucide/svelte';
  import Crumb from '../lib/flow/kit/Crumb.svelte';
  import Scale from '../lib/flow/check/Scale.svelte';
  import Chips from '../lib/flow/check/Chips.svelte';
  import PoolEditor from '../lib/flow/check/PoolEditor.svelte';
  import { db } from '../lib/db.js';
  import { checkQuery, seedIfNeeded, offQuery } from '../lib/flow/data.svelte.js';
  import { saveCheck } from '../lib/flowdb.js';
  import { FIXED, rotatingFor, isOn, eveningTurnFor, visionToday, checkOf, patchCheck, yesterdayOf, JOYS, BEST, GOALS, LAST_EVENING, OUTSIDE, PEOPLE, GOAL_DONE, toggleId, outsideFromRides, eveningTurn, mindfulFound, weekHighlights, suggestion } from '../lib/flowcheck.js';
  import { flowStates } from '../lib/flow.js';
  import { streaks, zurichTime } from '../lib/flowmed.js';
  import { soonTrips } from '../lib/home/heute.js';
  import { qText } from '../lib/flow/ui.svelte.js';
  import { localDay } from '../lib/localday.js';
  import { phone } from '../lib/media.svelte.js';
  import { t, tn, num, locale } from '../lib/i18n.svelte.js';

  let { part = 'morning' } = $props();
  const today = localDay();
  const q = checkQuery(today);
  const data = $derived($q);
  const offQ = offQuery();
  const off = $derived($offQ ?? []);
  const on = (n) => isOn(off, n);
  $effect(() => {
    seedIfNeeded(data);
  });

  /* the day's answers: read once, then kept here and saved on every tap (no tap waits for the database) */
  let cur = $state(null);
  $effect(() => {
    if (data && !cur) cur = checkOf(data.checks.find((c) => c.day === today), today);
  });
  function set(fields) {
    // the time the morning was first answered (the «Morgen-Check» tile on Heute shows it)
    if (part === 'morning' && !cur.mAt) fields = { ...fields, mAt: new Date().toISOString() };
    cur = patchCheck(cur, fields, today);
    saveCheck(db, $state.snapshot(cur));
  }
  const evening = $derived(part === 'evening');
  const rot = $derived(data ? rotatingFor(data.pool, off, today) : null);
  const ydot = (key, qid = null) => yesterdayOf(data?.checks ?? [], today, key, qid);
  const dateLong = new Date(`${today}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const dateShort = new Date(`${today}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const label = (list, id) => {
    const x = list.find((y) => y.id === id);
    return x ? t(x.label) : id;
  };
  // own chips (their text) after the given ones
  const withOwn = (list, chosen = []) => [...list.map((x) => ({ id: x.id, label: t(x.label) })), ...chosen.filter((id) => !list.some((x) => x.id === id)).map((id) => ({ id, label: id }))];

  /* ---------- morning ---------- */
  const fixedQs = $derived(FIXED.map((f, i) => ({ n: i + 1, key: f.key, text: t(f.text), lo: t(f.lo), hi: t(f.hi) })).filter((f) => on(f.n)));
  let editPool = $state(false);
  const goalText = (g) => (g?.id ? label(GOALS, g.id) : (g?.text ?? ''));
  const goalItems = $derived([...GOALS.map((g) => ({ id: g.id, label: t(g.label) })), ...(cur?.goal?.text ? [{ id: 'own', label: cur.goal.text }] : [])]);
  const goalValue = $derived(cur?.goal ? (cur.goal.id ?? 'own') : null);
  const pickGoal = (id) => set({ goal: goalValue === id ? null : id === 'own' ? cur.goal : { id } });
  const sugg = $derived(cur ? suggestion({ sleep: cur.sleep, energy: cur.energy, joy: cur.joy, weather: data?.weather ?? null }) : null);
  const suggOff = $derived(cur?.sugg?.id === sugg?.id && cur?.sugg?.pick === 'no');
  const pickSugg = (id) => set({ sugg: cur.sugg?.id === sugg.id && cur.sugg.pick === id ? null : { id: sugg.id, pick: id } });

  /* what the app already knows today */
  const medId = 'meditation';
  const medAct = $derived(data?.acts.find((a) => a.id === medId && !a.paused) ?? null);
  const medToday = $derived(data ? mindfulFound(data.log, today, medId) : null);
  const medYesterday = $derived(data ? mindfulFound(data.log, addDay(today, -1), medId) : null);
  const medStreak = $derived(data ? streaks(data.log, medId, today).now : 0);
  const nextTrip = $derived(data ? (soonTrips(data.trips, today)[0] ?? null) : null);
  function addDay(day, n) {
    const d = new Date(`${day}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  const dayWords = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const wxWords = (w) => `${num(w.max)}°, ${w.rain === 'none' ? t('dry|weather') : w.rain === 'showers' ? t('showers possible') : t('rain|weather')}`;

  /* ---------- evening ---------- */
  const outsidePre = $derived(data ? outsideFromRides(data.rides, today) : null);
  const outsideNow = $derived(cur?.outside ?? outsidePre?.step ?? null);
  const turn = $derived(eveningTurnFor(today, off));
  const vision = $derived(visionToday(today, off));
  const OUT_LABEL = { 0: '0', lt30: 'up to 30 min', '30-90': '30–90 min', gt90: 'over 90 min' };
  const PEOPLE_LABEL = { no: 'No|people', short: 'Briefly', lots: 'A lot|people' };
  const DONE_LABEL = { yes: 'Yes|goal', part: 'Partly', no: 'No|goal' };
  const kmToday = $derived(data ? Math.round(data.rides.reduce((s, r) => s + (Number(r.km) || 0), 0) * 10) / 10 : 0);
  const viaStrava = $derived(!!data?.rides.some((r) => r.source === 'strava'));
  const states = $derived(data ? flowStates(data.acts, data.log, today, data.tripDays).filter((s) => !s.resting) : []);
  const goalsMet = $derived(states.filter((s) => s.met).length);
  const week = $derived(data ? weekHighlights([...data.checks.filter((c) => c.day !== today), ...(cur ? [cur] : [])], today) : []);
  const DOT = { nature: 'var(--l1)', sport: 'var(--l2)', calm: 'var(--l4)', friends: 'var(--l3)', done: 'var(--hi)', new: 'var(--ink-3)' };
  async function finish() {
    // what was filled in by itself is kept as the answer (still changeable later)
    if (evening && cur) {
      const fields = {};
      if (cur.outside == null && outsidePre) fields.outside = outsidePre.step;
      if (cur.mindful == null && medToday && on(14)) fields.mindful = 'auto';
      if (Object.keys(fields).length) await saveCheck(db, patchCheck($state.snapshot(cur), fields, today));
    }
    location.hash = '#/';
  }

</script>

<div class="ck" data-check={part}>
  <header class="ph">
    <Crumb path={[{ href: '#/', label: t('Today|place') }]} here={evening ? t('Evening review') : t('Morning check')} />
    <h1 class="h1" tabindex="-1" data-page-title>{evening ? t('How was your day?') : t('Good morning')}</h1>
    {#if evening}
      <p class="sub">{phone.matches ? t('from 20:30 · about 30 seconds') : t('Evening review · from 20:30 · about 30 seconds · what the app already knows, it does not ask.')}</p>
    {:else}
      <p class="sub">{phone.matches ? `${dateShort} · ${t('about 40 seconds · everything skippable')}` : t('Morning check · {date} · about 40 seconds · every question skippable. The line under a number shows yesterday.', { date: dateLong })}</p>
    {/if}
  </header>

  {#if data && cur}
    {#if phone.matches}
      <div class="one">
        {#if evening}
          {@render eveningQs()}
          {@render done()}
          {@render dayNumbers()}
          {@render morningEvening()}
          {@render weekSoFar()}
        {:else}
          {@render morningQs()}
          {@render suggest()}
          {@render lastEvening()}
          {@render done()}
          {@render todayView()}
          {@render night()}
        {/if}
      </div>
    {:else}
      <div class="two">
        <div class="col">
          {#if evening}{@render eveningQs()}{:else}{@render morningQs()}{@render lastEvening()}{/if}
          {@render done()}
        </div>
        <div class="col">
          {#if evening}{@render dayNumbers()}{@render morningEvening()}{@render weekSoFar()}{:else}{@render suggest()}{@render todayView()}{@render night()}{/if}
        </div>
      </div>
    {/if}
  {/if}
</div>

{#snippet head(n, id, text, small, tag)}
  <div class="qh">
    <span class="qn num" aria-hidden="true">{n}</span>
    <span class="qt"><b id={id}>{text}</b>{#if small}<small>{small}</small>{/if}</span>
    <span class="pill">{tag}</span>
  </div>
{/snippet}

{#snippet morningQs()}
  <section class="card qs" aria-label={t('Morning check')}>
    {#each fixedQs as f (f.key)}
      <div class="q" data-q={f.key}>
        {@render head(f.n, `cq-${f.key}`, f.text, `${f.lo} … ${f.hi}`, t('daily|check'))}
        <Scale value={cur[f.key]} yesterday={ydot(f.key)} label="cq-{f.key}" onpick={(v) => set({ [f.key]: v })} />
      </div>
    {/each}
    {#if rot}
      <div class="q" data-q="extra">
        {@render head(rot.q.id === 'calm' ? 5 : 4, 'cq-extra', qText(rot.q), [qText(rot.q, 'lo'), qText(rot.q, 'hi')].filter(Boolean).join(' … ') + ` · ${t('changes daily')}`, t('today|check'))}
        <Scale value={cur.q === rot.q.id || cur.q == null ? cur.extra : null} yesterday={ydot('extra', rot.q.id)} label="cq-extra" onpick={(v) => set({ extra: v, q: rot.q.id })} />
        {#if editPool}
          <div class="pe"><PoolEditor pool={data.pool} onclose={() => (editPool = false)} /></div>
        {:else}
          <button type="button" class="lk" onclick={() => (editPool = true)} data-edit-pool><Pencil size={14} aria-hidden="true" />{t('Edit the rotating questions')}</button>
        {/if}
      </div>
    {/if}
    {#if on(6)}
    <div class="q" data-q="joy">
      {@render head(6, 'cq-joy', t('What are you looking forward to today?'), t('several possible'), t('daily|check'))}
      <Chips name="joy" label="cq-joy" multi items={withOwn(JOYS, cur.joy)} value={cur.joy} own={t('own|chip')} onpick={(id) => set({ joy: toggleId(cur.joy, id) })} onown={(s) => set({ joy: cur.joy.includes(s) ? cur.joy : [...cur.joy, s] })} />
    </div>
    {/if}
    {#if on(7)}
    <div class="q" data-q="goal">
      {@render head(7, 'cq-goal', t('Your most important goal for today'), t('a suggestion or one sentence of your own'), t('daily|check'))}
      <Chips name="goal" label="cq-goal" items={goalItems} value={goalValue} own={t('own sentence')} onpick={pickGoal} onown={(s) => set({ goal: { text: s } })} />
    </div>
    {/if}
    {@render allQs()}
  </section>
{/snippet}

{#snippet lastEvening()}
  <section class="card" aria-labelledby="cq-last">
    <div class="ch2"><h2 id="cq-last">{t('Last night')}</h2><p>{t('optional · for sleep comparisons')}</p></div>
    <Chips name="last" label="cq-last" multi items={LAST_EVENING.map((x) => ({ id: x.id, label: t(x.label) }))} value={cur.last} onpick={(id) => set({ last: toggleId(cur.last, id) })} />
  </section>
{/snippet}

{#snippet suggest()}
  {#if sugg}
    <section class="sg" aria-labelledby="cq-sugg" data-sugg={sugg.id}>
      <Lightbulb size={18} aria-hidden="true" />
      <div class="sgb">
        {#if suggOff}
          <p><b id="cq-sugg">{t('Suggestion for today')}</b> {t('Not today. Fine.')}</p>
          <button type="button" class="lk" onclick={() => set({ sugg: null })}>{t('Show the suggestion again')}</button>
        {:else}
          <p><b id="cq-sugg">{t('Suggestion for today')}</b> {t(sugg.text)}</p>
          <Chips name="sugg" label="cq-sugg" items={[...sugg.opts.map((o) => ({ id: o.id, label: t(o.label) })), { id: 'no', label: t('Not today|sugg') }]} value={cur.sugg?.id === sugg.id ? cur.sugg.pick : null} onpick={pickSugg} />
        {/if}
      </div>
    </section>
  {/if}
{/snippet}

{#snippet todayView()}
  <section class="card" aria-labelledby="cq-today">
    <div class="ch2"><h2 id="cq-today">{t('Today at a glance')}</h2><p>{dateShort}</p></div>
    <ul class="rows">
      {#if data.weather}<li><span class="ib"><Sun size={18} aria-hidden="true" /></span><span class="rt"><b>{wxWords(data.weather)}</b><small>{t('home weather, saved forecast')}</small></span></li>{/if}
      {#if medAct}
        <li data-row="med"><span class="ib"><Flower2 size={18} aria-hidden="true" /></span><span class="rt"><b>{t('Meditation')}</b><small>{#if medToday}{t('today {min} min', { min: medToday.min })}{:else if medYesterday}{t('yesterday {min} min', { min: medYesterday.min })}{:else}{t('not yet today')}{/if}{#if medStreak > 1} · {tn(medStreak, '{n} day in a row', '{n} days in a row')}{/if}</small></span></li>
      {/if}
      {#if nextTrip}
        <li><span class="ib"><Route size={18} aria-hidden="true" /></span><span class="rt"><b>{nextTrip.title || t('Next trip')}</b><small>{nextTrip.startDate <= today ? t('under way') : t('next trip · from {date}', { date: dayWords(nextTrip.startDate) })}</small></span></li>
      {/if}
      {#if !data.weather && !medAct && !nextTrip}<li><span class="ib"><Clock size={18} aria-hidden="true" /></span><span class="rt"><small>{t('Nothing known for today yet.')}</small></span></li>{/if}
    </ul>
  </section>
{/snippet}

{#snippet night()}
  <section class="card" aria-labelledby="cq-night">
    <div class="ch2"><h2 id="cq-night">{t('Your night')}</h2><p>Fitbit</p></div>
    <p class="ghost">{t('Comes with Fitbit/Google: sleep, resting pulse and HRV next to your feeling, with your normal. Until then this space stays small.')}</p>
  </section>
{/snippet}

{#snippet done()}
  <button type="button" class="btn hi big" onclick={finish} data-check-done>{t('Done')}</button>
{/snippet}

{#snippet eveningQs()}
  <section class="card qs" aria-label={t('Evening review')}>
    {#if on(8)}
    <div class="q" data-q="sat">
      {@render head(8, 'cq-sat', t('How happy are you with the day?'), `${t('not at all|sat')} … ${t('very|sat')}`, t('daily|check'))}
      <Scale value={cur.sat} yesterday={ydot('sat')} label="cq-sat" onpick={(v) => set({ sat: v })} />
    </div>
    {/if}
    {#if on(9)}
    <div class="q" data-q="best">
      {@render head(9, 'cq-best', t('What was the best part of today?'), t('several possible'), t('daily|check'))}
      <Chips name="best" label="cq-best" multi items={withOwn(BEST, cur.best)} value={cur.best} own={t('own|chip')} onpick={(id) => set({ best: toggleId(cur.best, id) })} onown={(s) => set({ best: cur.best.includes(s) ? cur.best : [...cur.best, s] })} />
      <div class="more">
        <PenLine size={16} aria-hidden="true" />
        <textarea class="st" rows="1" placeholder={t('Want to tell a bit more?')} aria-label={t('Want to tell a bit more?')} value={cur.story} onchange={(e) => set({ story: e.currentTarget.value })} data-story></textarea>
        <!-- «Diktat» (Noah 19.10.2026): the app's one microphone, until you stop -->
        <SpeakButton onsaid={(w) => set({ story: appendSpoken(cur.story ?? '', w) })} />
      </div>
    </div>
    {/if}
    {#if cur.goal && on(10)}
      <div class="q" data-q="goalDone">
        {@render head(10, 'cq-gd', t('Goal from this morning: «{goal}»', { goal: goalText(cur.goal) }), t('reached?'), t('daily|check'))}
        <Chips name="goalDone" label="cq-gd" items={GOAL_DONE.map((x) => ({ id: x, label: t(DONE_LABEL[x]) }))} value={cur.goalDone} onpick={(id) => set({ goalDone: cur.goalDone === id ? null : id })} />
      </div>
    {/if}
    {#if on(11)}
    <div class="q" data-q="outside">
      {@render head(11, 'cq-out', t('How long were you outside?'), outsidePre && cur.outside == null ? t('filled in from your ride, changeable') : '', t('daily|check'))}
      <Chips name="outside" label="cq-out" items={OUTSIDE.map((x) => ({ id: x, label: t(OUT_LABEL[x]) }))} value={outsideNow} onpick={(id) => set({ outside: outsideNow === id && cur.outside != null ? null : id })} />
    </div>
    {/if}
    {#if turn === 'people'}
      <div class="q" data-q="people">
        {@render head(12, 'cq-ppl', t('Time with friends or family?'), on(13) ? t('takes turns with question 13') : '', t('today|check'))}
        <Chips name="people" label="cq-ppl" items={PEOPLE.map((x) => ({ id: x, label: t(PEOPLE_LABEL[x]) }))} value={cur.people} onpick={(id) => set({ people: cur.people === id ? null : id })} />
      </div>
    {:else if turn === 'fun'}
      <div class="q" data-q="fun">
        {@render head(13, 'cq-fun', t('How much fun did you have?'), `${t('little|fun')} … ${t('a lot|fun')}${on(12) ? ` · ${t('takes turns with question 12')}` : ''}`, t('today|check'))}
        <Scale value={cur.fun} label="cq-fun" onpick={(v) => set({ fun: v })} />
      </div>
    {/if}
    {#if !on(14)}
      <!-- question 14 switched off -->
    {:else if medToday}
      <div class="q" data-q="mindful">
        <div class="auto" data-mindful-auto>
          <Flower2 size={18} aria-hidden="true" />
          <span><b>{t('Mindful moment')}</b> {zurichTime(medToday.at) ? t('found by itself: meditation {min} min at {time}', { min: medToday.min, time: zurichTime(medToday.at) }) : t('found by itself: meditation {min} min', { min: medToday.min })}</span>
          <em>{t('question 14 is not needed today')}</em>
        </div>
      </div>
    {:else}
      <div class="q" data-q="mindful">
        {@render head(14, 'cq-mind', t('Did you have a mindful moment?'), t('a meditation counts by itself'), t('daily|check'))}
        <Chips name="mindful" label="cq-mind" items={[{ id: 'yes', label: t('Yes|goal') }, { id: 'no', label: t('No|goal') }]} value={cur.mindful} onpick={(id) => set({ mindful: cur.mindful === id ? null : id })} />
      </div>
    {/if}
    {#if vision}
      <!-- v0.127.0 «Tages-Check» 2: question 15, on Sundays -->
      <div class="q" data-q="vision">
        {@render head(15, 'cq-vis', t('Did you get closer to your vision?'), `${t('not at all|vision')} … ${t('a big step')}`, t('Sunday|check'))}
        <Scale value={cur.vision} label="cq-vis" onpick={(v) => set({ vision: v })} />
        <div class="more">
          <PenLine size={16} aria-hidden="true" />
          <textarea class="st" rows="1" placeholder={t('One sentence about it')} aria-label={t('One sentence about your vision')} value={cur.visionNote} onchange={(e) => set({ visionNote: e.currentTarget.value })} data-vision-note></textarea>
        </div>
      </div>
    {/if}
    {@render allQs()}
  </section>
{/snippet}

{#snippet allQs()}
  <a class="lk all" href="#/check/questions" data-all-questions><ListChecks size={16} aria-hidden="true" />{t('Your 15 questions')}<ChevronRight size={16} aria-hidden="true" /></a>
{/snippet}

{#snippet dayNumbers()}
  <section class="card" aria-labelledby="cq-nums">
    <div class="ch2"><h2 id="cq-nums">{t('The day in numbers')}</h2><p>{t('comes by itself')}</p></div>
    <div class="mm">
      <div data-num="km"><small>{t('Bike|numbers')}</small><b class="num">{kmToday ? `${num(kmToday)} km` : '–'}</b><small>{kmToday ? (viaStrava ? 'Strava' : tn(data.rides.length, '{n} ride', '{n} rides')) : t('no ride today')}</small></div>
      <div data-num="med"><small>{t('Meditation')}</small><b class="num">{medToday ? t('{min} min|check', { min: medToday.min }) : '–'}</b><small>{medStreak > 1 ? tn(medStreak, '{n} day in a row', '{n} days in a row') : medToday ? t('today') : t('not yet today')}</small></div>
      <div data-num="goals"><small>{t('Active goals')}</small><b class="num">{states.length ? t('{n} of {m}', { n: goalsMet, m: states.length }) : '–'}</b><small>{t('reached right now')}</small></div>
    </div>
    <p class="ghost">{t('Steps and active zones come with Fitbit/Google.')}</p>
  </section>
{/snippet}

{#snippet morningEvening()}
  <section class="card" aria-labelledby="cq-me">
    <div class="ch2"><h2 id="cq-me">{t('Morning → evening')}</h2><p><span class="dt m" aria-hidden="true"></span>{t('Mood in the morning')} <span class="dt a" aria-hidden="true"></span>{t('Satisfaction in the evening')}</p></div>
    {#if cur.mood != null && cur.sat != null}
      <div class="cmp" data-cmp>
        <span>{t('Feeling|cmp')}</span>
        <div class="ln"><i class="m" style:left="{((cur.mood - 1) / 9) * 100}%"></i><i class="a" style:left="{((cur.sat - 1) / 9) * 100}%"></i></div>
        <b class="num">{cur.mood} → {cur.sat}</b>
      </div>
      <p class="fine">{t('Two different questions, both on 1–10: an observation, no rating.')}</p>
    {:else}
      <p class="fine">{t('Shows up when the mood this morning and the satisfaction tonight are both answered.')}</p>
    {/if}
  </section>
{/snippet}

{#snippet weekSoFar()}
  <section class="card" aria-labelledby="cq-week">
    <div class="ch2"><h2 id="cq-week">{t('The week so far')}</h2><p>{t('best parts · 7 days')}</p></div>
    {#if week.length}
      <ul class="leg">
        {#each week as w (w.id)}<li><i style:background={DOT[w.id] ?? 'var(--ink-3)'}></i>{label(BEST, w.id)}<em class="num">{w.n}×</em></li>{/each}
      </ul>
    {:else}
      <p class="fine">{t('Your best parts of the last 7 days show up here.')}</p>
    {/if}
  </section>
{/snippet}

<style>
  .ck {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 1120px;
  }
  .ph {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
  }
  .h1 {
    margin: 0;
    font: 800 var(--fs-page) / 1.1 var(--font-brand);
  }
  .ph p {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .two {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: var(--sp-4);
    align-items: start;
  }
  .col,
  .one {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    min-width: 0;
  }
  .qs {
    padding-block: var(--sp-2);
  }
  .q {
    padding: var(--sp-3) 0;
    border-top: 1px solid var(--line);
  }
  .q:first-child {
    border-top: 0;
  }
  .qh {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-2);
    margin-bottom: var(--sp-2);
  }
  .qn {
    display: grid;
    flex: none;
    place-items: center;
    width: 24px;
    height: 24px;
    margin-top: 1px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font: 700 var(--fs-tiny) / 1 var(--font-body);
  }
  .qt {
    flex: 1;
    min-width: 0;
  }
  .qt b {
    display: block;
    font: 500 var(--fs-body) / 1.35 var(--font-body);
  }
  .qt small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ch2 {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0 var(--sp-3);
    margin-bottom: var(--sp-3);
  }
  .ch2 h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .ch2 p {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .lk {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    margin-top: var(--sp-1);
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: 400 var(--fs-small) / 1.3 var(--font-body);
    text-decoration: underline;
    cursor: pointer;
  }
  .pe {
    margin-top: var(--sp-3);
  }
  .big {
    width: 100%;
    min-height: 56px;
    font-size: var(--fs-sub);
  }
  .sg {
    display: flex;
    gap: var(--sp-3);
    padding: var(--sp-4);
    border: 1px solid var(--l2-soft);
    border-radius: var(--radius-card);
    background: var(--l2-soft);
    color: var(--l2);
  }
  .sgb {
    flex: 1;
    min-width: 0;
    color: var(--ink);
  }
  .sgb p {
    margin: 0 0 var(--sp-3);
    color: var(--ink-2);
    line-height: 1.45;
  }
  .sgb b {
    color: var(--ink);
  }
  .rows {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rows li {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    padding: var(--sp-3) 0;
    border-top: 1px solid var(--line);
  }
  .rows li:first-child {
    border-top: 0;
    padding-top: 0;
  }
  .ib {
    display: grid;
    flex: none;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .rt {
    min-width: 0;
  }
  .rt b {
    display: block;
    font-weight: 500;
  }
  .rt small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ghost {
    margin: 0;
    padding: var(--sp-3) var(--sp-4);
    border: 1.5px dashed var(--line-strong);
    border-radius: var(--r-ctl);
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .mm {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--sp-2);
    margin-bottom: var(--sp-3);
  }
  .mm div {
    min-width: 0;
    padding: var(--sp-2) var(--sp-3);
    border-radius: var(--r-ctl);
    background: var(--ground);
  }
  .mm small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .mm b {
    display: block;
    font: 700 var(--fs-sub) / 1.3 var(--font-body);
  }
  .more {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2);
    margin-top: var(--sp-3);
    padding: var(--sp-2) var(--sp-3);
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    color: var(--ink-3);
  }
  .st {
    flex: 1 1 180px;
    min-width: 0;
    min-height: 44px;
    padding: 10px 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: 400 var(--fs-body) / 1.4 var(--font-body);
    resize: vertical;
  }
  .st:focus-visible {
    outline: 2px solid var(--hi);
    outline-offset: 2px;
  }
  .auto {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
    padding: var(--sp-3);
    border-radius: var(--r-ctl);
    background: var(--accent-soft);
    color: var(--ok);
  }
  .auto span {
    flex: 1 1 200px;
    color: var(--ink);
    font-size: var(--fs-small);
  }
  .auto em {
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-style: normal;
  }
  .cmp {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: var(--sp-3);
    align-items: center;
    font-size: var(--fs-small);
  }
  .ln {
    position: relative;
    height: 8px;
    margin: 0 7px;
    border-radius: 9px;
    background: var(--paper-2);
  }
  .ln i {
    position: absolute;
    top: -3px;
    width: 14px;
    height: 14px;
    margin-left: -7px;
    border: 2px solid var(--paper);
    border-radius: 999px;
  }
  .ln i.m,
  .dt.m {
    background: var(--l2);
  }
  .ln i.a,
  .dt.a {
    background: var(--hi);
  }
  .dt {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin: 0 4px 0 8px;
    border-radius: 999px;
  }
  .fine {
    margin: var(--sp-2) 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .leg {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-1) var(--sp-4);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--fs-small);
  }
  .leg li {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
  .leg i {
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 3px;
  }
  .leg em {
    margin-left: auto;
    color: var(--ink-3);
    font-style: normal;
  }
  @media (max-width: 719px) {
    .mm {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px;
    }
    .mm div {
      padding: var(--sp-2);
    }
  }
</style>
