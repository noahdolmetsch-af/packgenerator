<script>
  /**
   * «Alle Zahlen dahinter» (Noah 01.11.2026 «2a»): the detail page of ONE observation of a week
   * (#/flow/review/obs?kind=<kind>&w=<Monday>): the sentence, the chart larger with every value written out,
   * the same numbers as a table, how it was worked out, and the way on to Analyse. Worked out from the same
   * data and rules as the card (lernen/beobachtungen.js); a finished week shows what was stored.
   * Observation only: what was, never what is good.
   */
  import { liveQuery } from 'dexie';
  import { ChevronLeft } from '@lucide/svelte';
  import { db } from '../db.js';
  import PageHead from '../ui/PageHead.svelte';
  import Crumb from '../flow/kit/Crumb.svelte';
  import { SLEEP_Q, MOOD_Q, weekParam } from '../weekreview.js';
  import { normAct } from '../flow.js';
  import { loadDayData } from '../daydata.js';
  import { isoWeek } from '../training.js';
  import { localDay } from '../localday.js';
  import { OBS_KEY, KINDS, KIND_NAMES, WINDOW_DAYS, MIN_DAYS, weekView } from './beobachtungen.js';
  import { sentence, label, value, chartText } from './obswords.js';
  import { t, num } from '../i18n.svelte.js';
  import '../trip/trip.css';

  let { params = new URLSearchParams() } = $props();
  const today = localDay();
  const monday = $derived(weekParam(params.get('w'), today));
  const kind = $derived(KINDS.includes(params.get('kind')) ? params.get('kind') : null);

  const q = liveQuery(async () => {
    const [acts, rides, trips, health, answers, checks, log, flowActs, rec] = await Promise.all([
      db.activities.toArray(),
      db.rides.toArray(),
      db.trips.toArray(),
      db.healthDays.toArray(),
      db.abAnswers.where('qid').anyOf([SLEEP_Q, MOOD_Q]).toArray(),
      db.flowChecks.toArray(),
      db.flowLog.toArray(),
      db.flowActs.toArray(),
      db.settings.get(OBS_KEY),
    ]);
    const { weather } = await loadDayData(db);
    return { data: { acts, rides, trips, health, answers, checks, log, flowActs: flowActs.map(normAct), weather }, value: rec?.value ?? null };
  });
  const view = $derived($q ? weekView($q.value, $q.data, monday, today) : null);
  const obs = $derived(view?.list.find((o) => o.kind === kind) ?? null);
  const c = $derived(obs?.chart ?? null);
  const rows = $derived(c ? (c.type === 'two' ? [c.a, c.b] : c.bars) : []);

  /** How each kind is worked out, in plain words. */
  const HOW = {
    week: 'The week is counted from Monday up to the same day as today and set against the mean of the four weeks before, counted for the same days. The measure that moved most is shown.',
    sleep: 'Sleep counts to the day you wake up. Nights after a day with a ride are set against all other nights of the last twelve weeks (Fitbit minutes, else your own rating 1–10).',
    after: 'The 1–3 days after a long tour or ride (four hours, 80 km, or a trip of two days or more) are set against normal days of the last twelve weeks. The value with the clearest difference is shown.',
    time: 'Your rides of the last twelve weeks are counted by weekday and by part of the day; the one with the most rides is shown.',
    streak: 'Days in a row with activity this week, or days in a row without one while you are usually active.',
    mind: 'Mood on days with meditation, set against days without, over the last twelve weeks.',
    body: 'Resting heart rate, HRV and steps of this week are set against the same days of the four weeks before; the value that moved most is shown (Fitbit).',
    weather: 'Days with at least 1 mm of rain are set against dry days: on how many of them were you active? Twelve weeks, weather of your home place.',
  };
  const wr = $derived(`${t('Wk {n}', { n: isoWeek(monday) })}`);
</script>

<div class="od">
  <header class="ph">
    <Crumb path={[{ href: '#/flow', label: t('Active|place') }, { href: '#/flow/week', label: t('Week') }, { href: `#/flow/review?w=${monday}`, label: t('Week in review') }]} here={t('Observation')} />
    <PageHead title={kind ? t(KIND_NAMES[kind]) : t('Observation')} text={t('Observation only: what was, nothing is rated.')} />
  </header>

  {#if !view}
    <p class="quiet">…</p>
  {:else if !obs}
    <section class="card odc" data-od-none>
      <p class="quiet">{t('This observation is not there for {week}.', { week: wr })}</p>
      <a class="tp-link" href="#/flow/review?w={monday}"><ChevronLeft size={16} aria-hidden="true" />{t('Back to the week in review')}</a>
    </section>
  {:else}
    <section class="card odc" data-od={obs.kind}>
      <p class="say">{sentence(obs)}</p>
      <p class="cap">{wr}</p>
      {#if c?.type === 'bars'}
        <ul class="bars" role="img" aria-label={chartText(c)}>
          {#each c.bars as b, i (i)}
            {@const max = Math.max(1, ...c.bars.map((x) => x.v ?? 0))}
            <li class:hi={b.hi}>
              <span class="bl">{label(b.l)}</span>
              <span class="bt"><i style:width="{((b.v ?? 0) / max) * 100}%"></i></span>
              <b class="num">{value(b.v, c.unit)}</b>
            </li>
          {/each}
        </ul>
        {#if c.upto}<p class="cap">{t('Every week counted for its first {n} days, like this week so far.', { n: c.upto })}</p>{/if}
      {:else if c?.type === 'two'}
        <ul class="bars" role="img" aria-label={chartText(c)}>
          {#each rows as g, i (i)}
            {@const max = Math.max(1, c.a.v ?? 0, c.b.v ?? 0)}
            <li class:hi={i === 0}>
              <span class="bl">{label(g.l)} <small class="num">· {t('{n} days', { n: g.n })}</small></span>
              <span class="bt"><i style:width="{((g.v ?? 0) / max) * 100}%"></i></span>
              <b class="num">{value(g.v, c.unit)}</b>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <section class="card odc" data-od-table>
      <h2>{t('The numbers')}</h2>
      <table class="tbl">
        <thead><tr><th scope="col">{t('What')}</th><th scope="col">{t('Value')}</th>{#if c?.type === 'two'}<th scope="col">{t('Days')}</th>{/if}</tr></thead>
        <tbody>
          {#each rows as r, i (i)}
            <tr><th scope="row">{label(r.l)}</th><td class="num">{value(r.v, c.unit)}</td>{#if c?.type === 'two'}<td class="num">{num(r.n)}</td>{/if}</tr>
          {/each}
        </tbody>
      </table>
    </section>

    <section class="card odc" data-od-how>
      <h2>{t('How it was worked out')}</h2>
      <p>{t(HOW[obs.kind])}</p>
      <p class="cap">{t('Looked back {n} days; a comparison needs at least {m} days in each group, otherwise no sentence is shown.', { n: WINDOW_DAYS, m: MIN_DAYS })}</p>
      <a class="tp-link" href="#/auswerten/analyse" data-od-analyse>{t('Open all values in Analyse')}</a>
      <a class="tp-link" href="#/flow/review?w={monday}"><ChevronLeft size={16} aria-hidden="true" />{t('Back to the week in review')}</a>
    </section>
  {/if}
</div>

<style>
  .od {
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
  .od :global(.pagehead) {
    margin: 0;
  }
  .odc {
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
    grid-template-columns: minmax(70px, 28%) minmax(0, 1fr) auto;
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
