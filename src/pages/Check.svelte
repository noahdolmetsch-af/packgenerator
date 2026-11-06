<script>
  /**
   * The morning check (#/check/morning) and the evening review (#/check/evening) as pages of Heute (v0.127.0, mockups T1/T2).
   * Noah 04.11.2026 «ein Fragebogen»: the questions on top are the window's (RoundQuestions, from «Deine Fragen»); every answer is
   * saved at once and counts in the window too. Around them what is not a question: «Gestern Abend», the suggestion, what the app
   * already knows today, the night from Fitbit (morning); the trip's rating, a few words of your own, the day in numbers, morning →
   * evening and the week so far (evening). Sleep, battery and mood also land in the day's row of flowChecks (saveAnswers).
   */
  import SpeakButton from '../lib/ui/SpeakButton.svelte';
  import InputBar from '../lib/eingabe/InputBar.svelte'; // «Eingaben überall» (Noah 26.10.2026): voice note, photo, templates, prompts
  import { cleanInputs } from '../lib/eingabe/inputs.js';
  import { appendSpoken } from '../lib/speak.js';
  import { Sun, Clock, CalendarClock, Route, Lightbulb, PenLine, Flower2 } from '@lucide/svelte';
  import Crumb from '../lib/flow/kit/Crumb.svelte';
  import AbendTour from '../lib/lernen/AbendTour.svelte'; // Paket M #223
  import CheckTabs from '../lib/flow/check/CheckTabs.svelte';
  import Chips from '../lib/flow/check/Chips.svelte';
  import RoundQuestions from '../lib/abfragen/RoundQuestions.svelte'; // Noah 04.11.2026 «ein Fragebogen»: the same questions as the window
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { checkQuery, checksQuery, seedIfNeeded } from '../lib/flow/data.svelte.js';
  import { saveCheck } from '../lib/flowdb.js';
  import { checkOf, patchCheck, BEST, GOALS, LAST_EVENING, toggleId, outsideFromRides, mindfulFound, weekHighlights, suggestion } from '../lib/flowcheck.js';
  import { flowStates } from '../lib/flow.js';
  import { streaks, zurichTime } from '../lib/flowmed.js';
  import { soonTrips } from '../lib/home/heute.js';
  import { todayAppointments } from '../lib/todayfixed.js';
  import { qText, actName } from '../lib/flow/ui.svelte.js';
  import { localDay } from '../lib/localday.js';
  import GoodDayLine from '../lib/wohl/GoodDayLine.svelte';
  import { normalOf as healthNormal } from '../lib/health.js';
  import { phone } from '../lib/media.svelte.js';
  import { t, tn, num, locale } from '../lib/i18n.svelte.js';

  let { part = 'morning' } = $props();
  const today = localDay();
  const q = checkQuery(today);
  const data = $derived($q);
  const checksQ = checksQuery(today);
  const checks = $derived($checksQ ?? []);
  const checksIn = $derived($checksQ != null);
  $effect(() => {
    seedIfNeeded(data);
  });

  /* the day's answers: read once, then kept here and saved on every tap (no tap waits for the database) */
  let cur = $state(null);
  $effect(() => {
    if (data && checksIn && !cur) cur = checkOf(checks.find((c) => c.day === today), today);
  });
  function set(fields) {
    // the time the morning was first answered (the «Morgen-Check» tile on Heute shows it)
    if (part === 'morning' && !cur.mAt) fields = { ...fields, mAt: new Date().toISOString() };
    cur = patchCheck(cur, fields, today);
    saveCheck(db, $state.snapshot(cur));
  }
  const evening = $derived(part === 'evening');
  const dateLong = new Date(`${today}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const dateShort = new Date(`${today}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  // Noah 21.10.2026 «immer das datum und die uhrzeit der befragung, damit wir testen können»: the clock, each minute
  let clock = $state(zurichTime(Date.now()));
  $effect(() => {
    const id = setInterval(() => (clock = zurichTime(Date.now())), 30_000);
    return () => clearInterval(id);
  });
  const label = (list, id) => {
    const x = list.find((y) => y.id === id);
    return x ? t(x.label) : id;
  };

  /* ---------- morning ---------- */
  const goalText = (g) => (g?.id ? label(GOALS, g.id) : (g?.text ?? ''));
  // the morning's goal is the answer to «Your goal for today» in the window and on the page (Deine Abfragen); the evening asks about it
  const abQ = liveQuery(() => db.abAnswers.where('day').aboveOrEqual(addDay(today, -7)).toArray());
  const abWeek = $derived($abQ ?? []);
  const abToday = $derived(abWeek.filter((r) => r.day === today));
  const lastAb = (qid, type = 'number') => abToday.filter((r) => r.qid === qid && typeof r.value === type).sort((a, b) => String(b.at ?? '').localeCompare(String(a.at ?? '')))[0]?.value ?? null;
  const goalAb = $derived(lastAb('ziele.ziel', 'string'));
  // the satisfaction of the evening is the answer to «How happy are you with the day?» (Deine Abfragen), or the old daily check's
  const satNow = $derived(lastAb('erreicht.zufrieden') ?? cur?.sat ?? null);
  // what you look forward to: the answer to «What are you looking forward to most today?» (Deine Fragen, when it is on), else the old daily check's
  const joyNow = $derived(lastAb('ziele.freude', 'object') ?? cur?.joy ?? []);
  const goalNow = $derived(cur?.goal ?? (goalAb ? { text: goalAb } : null));
  // sleep, battery and mood answered on the page or in the window land in the day's check too (saveAnswers): take them over here,
  // so the next tap on this page does not write the old value back
  $effect(() => {
    const row = checks.find((c) => c.day === today);
    if (!row || !cur) return;
    const diff = ['sleep', 'energy', 'mood'].filter((f) => row[f] !== cur[f] && row[f] != null);
    if (diff.length) cur = { ...cur, ...Object.fromEntries(diff.map((f) => [f, row[f]])) };
  });
  const sugg = $derived(cur ? suggestion({ sleep: cur.sleep, energy: cur.energy, joy: joyNow, weather: data?.weather ?? null }) : null);
  const suggOff = $derived(cur?.sugg?.id === sugg?.id && cur?.sugg?.pick === 'no');
  const pickSugg = (id) => set({ sugg: cur.sugg?.id === sugg.id && cur.sugg.pick === id ? null : { id: sugg.id, pick: id } });

  /* what the app already knows today */
  const medId = 'meditation';
  const medAct = $derived(data?.acts.find((a) => a.id === medId && !a.paused) ?? null);
  const medToday = $derived(data ? mindfulFound(data.log, today, medId) : null);
  const medYesterday = $derived(data ? mindfulFound(data.log, addDay(today, -1), medId) : null);
  const medStreak = $derived(data ? streaks(data.log, medId, today).now : 0);
  const nextTrip = $derived(data ? (soonTrips(data.trips, today)[0] ?? null) : null);
  // package G #226: today's fixed dates (Aktiv › Woche) and timed Google appointments, by time
  const appts = $derived(data ? todayAppointments({ fixed: data.fixed ?? [], events: data.events ?? [], today, nameOf: (id) => actName(data.acts.find((a) => a.id === id)) || id }) : []);
  function addDay(day, n) {
    const d = new Date(`${day}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  const dayWords = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const wxWords = (w) => `${num(w.max)}°, ${w.rain === 'none' ? t('dry|weather') : w.rain === 'showers' ? t('showers possible') : t('rain|weather')}`;

  /* 0.171 (Noah 20.10.2026 «Fitbit … das haben wir bereits»): the Fitbit values of today, with the normal of 30 days */
  const fit = $derived((data?.health ?? []).find((h) => h.date === today) ?? null);
  const fitAny = $derived((data?.health ?? []).length > 0);
  const hm = (min) => `${Math.floor(min / 60)} h ${Math.round(min % 60)} min`;
  const fitNormal = (k) => healthNormal(data?.health ?? [], k, today);
  const fin = (v) => typeof v === 'number' && Number.isFinite(v);

  /* ---------- evening ---------- */
  const outsidePre = $derived(data ? outsideFromRides(data.rides, today) : null);
  const outsideNow = $derived(cur?.outside ?? outsidePre?.step ?? null);
  // a ride and a meditation of today fill in the evening questions by themselves (changeable, saved like a tap)
  const OUT_ANSWER = { 0: 'm0', lt30: 'm30', '30-90': 'm90', gt90: 'more' };
  const eveningPrefill = $derived({
    ...(outsidePre && OUT_ANSWER[outsidePre.step] ? { 'natur.draussen': OUT_ANSWER[outsidePre.step] } : {}),
    ...(medToday ? { 'achtsamkeit.moment': 'yes' } : {}),
  });
  const eveningHints = $derived({
    'natur.draussen': t('filled in from your ride, changeable'),
    'achtsamkeit.moment': medToday ? (zurichTime(medToday.at) ? t('found by itself: meditation {min} min at {time}', { min: medToday.min, time: zurichTime(medToday.at) }) : t('found by itself: meditation {min} min', { min: medToday.min })) : '',
  });
  const kmToday = $derived(data ? Math.round(data.rides.reduce((s, r) => s + (Number(r.km) || 0), 0) * 10) / 10 : 0);
  const viaStrava = $derived(!!data?.rides.some((r) => r.source === 'strava'));
  const states = $derived(data ? flowStates(data.acts, data.log, today, data.tripDays).filter((s) => !s.resting) : []);
  const goalsMet = $derived(states.filter((s) => s.met).length);
  // the coolest things of the week: the old daily checks and the answers to «What was the coolest thing today?» (one count per day and kind)
  const week = $derived.by(() => {
    if (!data) return [];
    const byDay = new Map();
    for (const c of [...checks.filter((x) => x.day !== today), ...(cur ? [cur] : [])]) byDay.set(c.day, new Set(c.best ?? []));
    for (const r of abWeek) if (r.qid === 'spass.coolstes' && Array.isArray(r.value)) byDay.set(r.day, new Set([...(byDay.get(r.day) ?? []), ...r.value]));
    return weekHighlights([...byDay].map(([day, best]) => ({ day, best: [...best] })), today);
  });
  const DOT = { nature: 'var(--l1)', sport: 'var(--l2)', calm: 'var(--l4)', friends: 'var(--l3)', done: 'var(--hi)', new: 'var(--ink-3)' };
  async function finish() {
    // the evening's answers are saved at once (RoundQuestions), also what was filled in by itself
    location.hash = '#/';
  }

</script>

<div class="ck" data-check={part}>
  <header class="ph">
    <Crumb path={[{ href: '#/', label: t('Today|place') }]} here={evening ? t('Evening review') : t('Morning check')} />
    <h1 class="h1" tabindex="-1" data-page-title>{evening ? t('How was your day?') : t('Good morning')}</h1>
    <p class="sub num" data-check-when>{dateShort} · {clock}</p>
    {#if evening}
      <p class="sub">{phone.matches ? t('from 20:30 · about 30 seconds') : t('Evening review · from 20:30 · about 30 seconds · what the app already knows, it does not ask.')}</p>
    {:else}
      <p class="sub">{phone.matches ? t('about 40 seconds · everything skippable') : t('Morning check · {date} · about 40 seconds · every question skippable. The line under a number shows yesterday.', { date: dateLong })}</p>
    {/if}
    <!-- «Heute-Check» (Noah 30.10.2026 «1-5a»): the analyses are one tap away from the questionnaire -->
    <CheckTabs here="today" {evening} />
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

{#snippet morningQs()}
  <section class="card qs" aria-label={t('Morning check')}>
    <!-- Noah 04.11.2026 «ein Fragebogen»: sleep, battery, mood, the goal … are the questions of the window (Deine Abfragen) -->
    <RoundQuestions part="morning" {today} />
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
        <li data-row="med"><span class="ib"><Flower2 size={18} aria-hidden="true" /></span><span class="rt"><b>{t('Meditation')}</b><small>{#if medToday}{t('today {min} min', { min: medToday.min })}{:else if medYesterday}{t('yesterday {min} min', { min: medYesterday.min })}{:else}{t('not yet today')}{/if}{#if medStreak > 1}{' '}· {tn(medStreak, '{n} day in a row', '{n} days in a row')}{/if}</small></span></li>
      {/if}
      {#if nextTrip}
        <li><span class="ib"><Route size={18} aria-hidden="true" /></span><span class="rt"><b>{nextTrip.title || t('Next trip')}</b><small>{nextTrip.startDate <= today ? t('under way') : t('next trip · from {date}', { date: dayWords(nextTrip.startDate) })}</small></span></li>
      {/if}
      {#each appts as a (a.key)}
        <li data-row="appt"><span class="ib"><CalendarClock size={18} aria-hidden="true" /></span><span class="rt"><b>{a.title}</b><small><span class="num">{a.time}</span> · {a.kind === 'fixed' ? t('fixed date') : t('Google Calendar')}</small></span></li>
      {/each}
      {#if !data.weather && !medAct && !nextTrip && !appts.length}<li><span class="ib"><Clock size={18} aria-hidden="true" /></span><span class="rt"><small>{t('Nothing known for today yet.')}</small></span></li>{/if}
    </ul>
  </section>
{/snippet}

{#snippet night()}
  <section class="card" aria-labelledby="cq-night">
    <div class="ch2"><h2 id="cq-night">{t('Your night')}</h2><p>Fitbit</p></div>
    {#if fit && (fin(fit.sleep?.asleepMin) || fin(fit.restingHr) || fin(fit.hrvMs))}
      <div class="mm" data-night>
        <div data-num="sleep"><small>{t('Sleep|numbers')}</small><b class="num">{fin(fit.sleep?.asleepMin) ? hm(fit.sleep.asleepMin) : '–'}</b><small>{fitNormal('sleep') != null ? t('normal {v}', { v: hm(fitNormal('sleep')) }) : 'Fitbit'}</small></div>
        <div data-num="rhr"><small>{t('Resting pulse')}</small><b class="num">{fin(fit.restingHr) ? Math.round(fit.restingHr) : '–'}</b><small>{fitNormal('restingHr') != null ? t('normal {v}', { v: Math.round(fitNormal('restingHr')) }) : 'Fitbit'}</small></div>
        <div data-num="hrv"><small>HRV</small><b class="num">{fin(fit.hrvMs) ? `${Math.round(fit.hrvMs)} ms` : '–'}</b><small>{fitNormal('hrvMs') != null ? t('normal {v}', { v: `${Math.round(fitNormal('hrvMs'))} ms` }) : 'Fitbit'}</small></div>
      </div>
      <p class="fine">{t('Only to look at, next to your feeling: no rating.')}</p>
    {:else if fitAny}
      <p class="fine" data-night-none>{t('No Fitbit values for last night yet. They often come a little later.')}</p>
    {:else}
      <p class="fine" data-night-none>{t('Connect Fitbit once and your sleep, resting pulse and HRV show here.')} <a href="#/me/fitbit">{t('Connect Fitbit')}</a></p>
    {/if}
  </section>
{/snippet}

{#snippet done()}
  <!-- Paket P4 (mockup E4): keep a good day as a recipe; in the morning a kept day planned for today -->
  <GoodDayLine {part} {today} />
  <button type="button" class="btn hi big" onclick={finish} data-check-done>{t('Done')}</button>
{/snippet}

{#snippet eveningQs()}
  <section class="card qs" aria-label={t('Evening review')}>
    <!-- Paket M #223: on a trip day, rate the trip while it is fresh (nothing shows on other days) -->
    <AbendTour trips={data.trips} {today} />
    <!-- Noah 04.11.2026 «ein Fragebogen»: satisfaction, the coolest thing, the goal, outside, the mindful moment, friends and the
         Sunday vision are the questions of the window (Deine Abfragen); a ride and a meditation of today fill in by themselves -->
    <RoundQuestions part="evening" {today} prefill={eveningPrefill} hints={eveningHints} />
    <div class="q" data-q="story">
      <div class="more">
        <PenLine size={16} aria-hidden="true" />
        <textarea class="st" rows="1" placeholder={t('Want to tell a bit more?')} aria-label={t('Want to tell a bit more?')} value={cur.story} onchange={(e) => set({ story: e.currentTarget.value })} data-story></textarea>
        <!-- «Diktat» (Noah 19.10.2026): the app's one microphone, until you stop -->
        <SpeakButton onsaid={(w) => set({ story: appendSpoken(cur.story ?? '', w) })} />
      </div>
      <InputBar place="check" text={cur.story ?? ''} ontext={(s) => set({ story: s })} inputs={cur.inputs} oninputs={(x) => set({ inputs: cleanInputs(x) })} />
    </div>
  </section>
{/snippet}

{#snippet dayNumbers()}
  <section class="card" aria-labelledby="cq-nums">
    <div class="ch2"><h2 id="cq-nums">{t('The day in numbers')}</h2><p>{t('comes by itself')}</p></div>
    <div class="mm">
      <div data-num="km"><small>{t('Bike|numbers')}</small><b class="num">{kmToday ? `${num(kmToday)} km` : '–'}</b><small>{kmToday ? (viaStrava ? 'Strava' : tn(data.rides.length, '{n} ride', '{n} rides')) : t('no ride today')}</small></div>
      <div data-num="med"><small>{t('Meditation')}</small><b class="num">{medToday ? t('{min} min|check', { min: medToday.min }) : '–'}</b><small>{medStreak > 1 ? tn(medStreak, '{n} day in a row', '{n} days in a row') : medToday ? t('today') : t('not yet today')}</small></div>
      <div data-num="goals"><small>{t('Active goals')}</small><b class="num">{states.length ? t('{n} of {m}', { n: goalsMet, m: states.length }) : '–'}</b><small>{t('reached right now')}</small></div>
    </div>
    {#if fit && (fin(fit.steps) || fin(fit.azm))}
      <div class="mm" data-fit-day>
        <div data-num="steps"><small>{t('Steps')}</small><b class="num">{fin(fit.steps) ? num(Math.round(fit.steps)) : '–'}</b><small>Fitbit</small></div>
        <div data-num="azm"><small>{t('Active zone minutes|metric')}</small><b class="num">{fin(fit.azm) ? `${Math.round(fit.azm)} min` : '–'}</b><small>Fitbit</small></div>
      </div>
    {:else if !fitAny}
      <p class="fine">{t('Steps and active zone minutes show here once Fitbit is connected.')} <a href="#/me/fitbit">{t('Connect Fitbit')}</a></p>
    {/if}
  </section>
{/snippet}

{#snippet morningEvening()}
  <section class="card" aria-labelledby="cq-me">
    <div class="ch2"><h2 id="cq-me">{t('Morning → evening')}</h2><p><span class="dt m" aria-hidden="true"></span>{t('Mood in the morning')} <span class="dt a" aria-hidden="true"></span>{t('Satisfaction in the evening')}</p></div>
    {#if cur.mood != null && satNow != null}
      <div class="cmp" data-cmp>
        <span>{t('Feeling|cmp')}</span>
        <div class="ln"><i class="m" style:left="{((cur.mood - 1) / 9) * 100}%"></i><i class="a" style:left="{((satNow - 1) / 9) * 100}%"></i></div>
        <b class="num">{cur.mood} → {satNow}</b>
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
  .qs {
    counter-reset: q;
  }
  .qs :global(.q) {
    counter-increment: q;
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
