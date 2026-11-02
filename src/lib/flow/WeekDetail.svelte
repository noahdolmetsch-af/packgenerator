<script>
  /**
   * «Verlauf und alle Zahlen» (Noah 02.11.2026 «1a 3a»): the detail page of ONE tile or sentence of the week review
   * (#/flow/review/tile?k=<value>&w=<Monday>): this week against the weeks before, every week written out as a bar
   * and in a table, how it was counted, and the way on to Analyse. Each week is counted for the same days as the
   * shown week. Rules: lib/weekmore.js (weekCourse). Observation only: what was, never what is good.
   */
  import { liveQuery } from 'dexie';
  import { ChevronLeft } from '@lucide/svelte';
  import { db } from '../db.js';
  import PageHead from '../ui/PageHead.svelte';
  import Crumb from './kit/Crumb.svelte';
  import { zones } from '../strava/zones.svelte.js';
  import { loadDayData } from '../daydata.js';
  import { SLEEP_Q, MOOD_Q, weekParam } from '../weekreview.js';
  import { weekCourse, COURSE, COURSE_WEEKS } from '../weekmore.js';
  import { normAct } from '../flow.js';
  import { isoWeek, hmm } from '../training.js';
  import { localDay } from '../localday.js';
  import { t, num } from '../i18n.svelte.js';
  import '../trip/trip.css';

  let { params = new URLSearchParams() } = $props();
  const today = localDay();
  const monday = $derived(weekParam(params.get('w'), today));
  const key = $derived(Object.hasOwn(COURSE, params.get('k') ?? '') ? params.get('k') : null);

  const q = liveQuery(async () => {
    const [acts, health, log, flowActs, answers, checks, day] = await Promise.all([db.activities.toArray(), db.healthDays.toArray(), db.flowLog.toArray(), db.flowActs.toArray(), db.abAnswers.where('qid').anyOf([SLEEP_Q, MOOD_Q]).toArray(), db.flowChecks.toArray(), loadDayData(db)]);
    return { acts, health, log, flowActs: flowActs.map(normAct), answers, checks, weather: day.weather };
  });
  const course = $derived($q && key ? weekCourse(key, $q, monday, today, zones.bounds) : null);

  const NAME = {
    restingHr: 'Resting heart rate',
    hrvMs: 'HRV',
    sleep: 'Sleep',
    steps: 'Steps',
    azm: 'Active zone minutes',
    zones: 'Share of Z1–Z2',
    bikes: 'Km on the bike',
    tmax: 'Daily high',
    rain: 'Rain',
    hours: 'Hours|five',
    sleepFelt: 'Sleep (your rating)',
    streak: 'Days of training in a row',
  };
  const HOW = {
    restingHr: 'Mean resting heart rate of the days with a value (Fitbit).',
    hrvMs: 'Mean HRV of the days with a value (Fitbit).',
    sleep: 'Mean sleep per night of the days with a value (Fitbit).',
    steps: 'Mean steps per day of the days with a value (Fitbit).',
    azm: 'Sum of the active zone minutes of the days (Fitbit).',
    zones: 'Share of the time in Z1 and Z2 of all heart rate time, from the activities of the week that have a heart rate.',
    bikes: 'Km of the rides on the bike (Strava).',
    tmax: 'Mean of the daily highs at your home place; days without a value are left out.',
    rain: 'Sum of the rain at your home place; days without a value are left out.',
    hours: 'Strava moving time plus the minutes you noted in Aktiv.',
    sleepFelt: 'Mean of your own sleep rating 1–10 on the days you answered.',
    streak: 'The longest run of days with training that ends in the week.',
  };
  const fmt = (v, unit) => {
    if (v == null) return '–';
    if (unit === 'min' && key === 'sleep') return `${hmm(v * 60)} h`;
    if (unit === 'bpm') return `${num(Math.round(v))} bpm`;
    if (unit === 'ms') return `${num(Math.round(v))} ms`;
    if (unit === 'steps') return num(Math.round(v));
    if (unit === 'min') return `${num(Math.round(v))} min`;
    if (unit === 'pct') return `${num(v)} %`;
    if (unit === 'km') return `${num(v)} km`;
    if (unit === 'deg') return `${num(v)}°`;
    if (unit === 'mm') return `${num(v)} mm`;
    if (unit === 'hours') return `${num(v)} h`;
    if (unit === 'pt') return `${num(v)}`;
    return num(v);
  };
  const max = $derived(Math.max(1, ...(course?.points ?? []).map((p) => p.value ?? 0)));
  const head = $derived(course?.now == null ? t('No value for this week.') : course.usual == null ? t('This week {a}; there are no weeks before to compare with.', { a: fmt(course.now, course.unit) }) : t('This week {a}; the {n} weeks before had {b} on average.', { a: fmt(course.now, course.unit), n: COURSE_WEEKS - 1, b: fmt(course.usual, course.unit) }));
  const wr = $derived(t('Wk {n}', { n: isoWeek(monday) }));
</script>

<div class="wd">
  <header class="ph">
    <Crumb path={[{ href: '#/flow', label: t('Active|place') }, { href: '#/flow/week', label: t('Week') }, { href: `#/flow/review?w=${monday}`, label: t('Week in review') }]} here={key ? t(NAME[key]) : t('Course')} />
    <PageHead title={key ? t(NAME[key]) : t('Course')} text={t('Observation only: what was, nothing is rated.')} />
  </header>

  {#if !key}
    <section class="card wdc" data-wd-none>
      <p class="quiet">{t('This value is not known.')}</p>
      <a class="tp-link" href="#/flow/review?w={monday}"><ChevronLeft size={16} aria-hidden="true" />{t('Back to the week in review')}</a>
    </section>
  {:else if !course}
    <p class="quiet">…</p>
  {:else}
    <section class="card wdc" data-wd={key}>
      <p class="say" data-wd-head>{head}</p>
      <p class="cap">{wr} · {t('Every week counted for the same days as the shown week.')}</p>
      <ul class="bars" role="img" aria-label={course.points.map((p) => `${t('Wk {n}', { n: p.kw })}: ${fmt(p.value, course.unit)}`).join(', ')}>
        {#each course.points as p (p.monday)}
          <li class:hi={p.hi} data-wd-week={p.monday}>
            <span class="bl">{t('Wk {n}', { n: p.kw })}</span>
            <span class="bt"><i style:width="{((p.value ?? 0) / max) * 100}%"></i></span>
            <b class="num">{fmt(p.value, course.unit)}</b>
          </li>
        {/each}
      </ul>
    </section>

    <section class="card wdc" data-wd-table>
      <h2>{t('The numbers')}</h2>
      <table class="tbl">
        <thead><tr><th scope="col">{t('What')}</th><th scope="col">{t('Value')}</th></tr></thead>
        <tbody>
          {#each course.points as p (p.monday)}
            <tr><th scope="row"><a href="#/flow/review?w={p.monday}">{t('Wk {n}', { n: p.kw })}</a></th><td class="num">{fmt(p.value, course.unit)}</td></tr>
          {/each}
        </tbody>
      </table>
    </section>

    <section class="card wdc" data-wd-how>
      <h2>{t('How it was counted')}</h2>
      <p>{t(HOW[key])}</p>
      <a class="tp-link" href="#/auswerten/analyse" data-wd-analyse>{t('Open all values in Analyse')}</a>
      <a class="tp-link" href="#/flow/review?w={monday}"><ChevronLeft size={16} aria-hidden="true" />{t('Back to the week in review')}</a>
    </section>
  {/if}
</div>

<style>
  .wd {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 760px;
    margin: 0 auto;
    min-width: 0;
  }
  .ph {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
  }
  .wd :global(.pagehead) {
    margin: 0;
  }
  .wdc {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    margin: 0;
    padding: var(--sp-4);
    min-width: 0;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  p {
    margin: 0;
  }
  .say {
    font: 500 var(--fs-body) / 1.45 var(--font-body);
  }
  .cap,
  .quiet {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .bars {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .bars li {
    display: grid;
    grid-template-columns: 56px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    font-size: var(--fs-small);
  }
  .bt {
    display: block;
    height: 12px;
    border-radius: 99px;
    background: var(--paper-2);
  }
  .bt i {
    display: block;
    height: 100%;
    min-width: 2px;
    border-radius: 99px;
    background: var(--ink-3);
  }
  .bars li.hi .bt i {
    background: var(--hi);
  }
  .tbl {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  .tbl th,
  .tbl td {
    padding: 8px 6px;
    border-bottom: 1px solid var(--line);
    text-align: left;
    font-weight: 500;
  }
  .tbl thead th {
    color: var(--ink-3);
  }
  .tp-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
  }
</style>
