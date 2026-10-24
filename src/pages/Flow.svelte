<script>
  /**
   * v0.51.0 «Im Flow – kleiner Start» (mockups ImFlow-Phone / -Desktop, approved 9.10.2026).
   * «Aktiv neu» (Noah 22.10.2026, spec «Aktiv-Bereich: Beschreibung»): Aktiv is the place to do things, with
   * four tabs (Heute, Meine Sportarten, Training, Erholung); what you look at is the place «Auswerten»
   * (pages/AuswertenStart.svelte and the addresses below marked «Auswerten»), the same addresses as before.
   *   #/flow             the start: «Heute abhaken» (the stopwatch in its head), «Diese Woche», the rings
   *   #/flow/sports      «Meine Sportarten» (pages/flow/MySports.svelte); #/flow/goals shows it too
   *   #/flow/sport/<id>  one sport with its goal, history, milestones, sport bag and blocks (pages/flow/Sport.svelte, lazy)
   *   #/flow/edit/<id>   edit one sport; #/flow/new a new one (the same form, empty)
   *   #/flow/activity    hobby pages 1: suggestions, ideas and connections (pages/flow/Activity.svelte), from «Meine Sportarten»
   *   #/flow/training    «Training» TR2: every Strava activity with its heart rate zones (pages/flow/Training.svelte);
   *                      …/a/<id> one activity (TR3, TrainingAct.svelte)
   *   #/flow/plans       «Trainingspläne»: sample plans for ultracycling, …/<id> one plan (pages/flow/TrainingPlans.svelte, lazy)
   *   #/flow/rest        «Erholung» (mockup AK2): the recovery ring, a pause hint, ticks (pages/flow/Rest.svelte)
   *   #/flow/week        v0.130.0 «Woche» (mockup AK1): the week with fixed dates and suggestions (pages/flow/Week.svelte)
   *   #/flow/review      «Wochenrückblick» (W1–W6, Noah 15.10.2026 «1-5 a»), ?w=<Monday> (pages/flow/WeekReview.svelte)
   *   #/flow/bags        «Sporttasche» (mockup AK3): a packing list per sport (pages/flow/Bags.svelte)
   *   #/flow/gipfelbuch  v0.165.0 «Gipfelbuch für alle»: passes, summits, trails and places of every sport (pages/flow/Gipfelbuch.svelte)
   *   #/flow/act/<id>    hobby pages 2: Meditation's own page (Meditation.svelte, B1); …/timer the
   *                      intervals (MedTimer.svelte, B2); the running session is in FlowLayer (B7)
   *   …/done/<sid>       hobby pages 3: the evaluation after the gong (MedDone.svelte, B3)
   *   …/log              hobby pages 3: the log, list · calendar · chart (MedLog.svelte, B4 + B6)
   *   …/s/<sid>          hobby pages 3: one session in full (MedSession.svelte, B5)
   *   …/muster           v0.105.0 Design-Refresh P8 (A14c): the patterns of the log (MedPatterns.svelte)
   *   …/rueckblick       «Meditation» (mockup ME3): the Rückblick by week, month or year (MedReview.svelte)
   *   …/mehr             v0.86.0 «Meditation einfach»: «Mehr», the rare things folded (MedMore.svelte, C)
   * Auswerten:
   *   #/flow/form        «Form und Erholung» (Noah 20.10.2026): readiness, 12 weeks, tour readiness (pages/flow/Form.svelte, lazy)
   *   #/flow/stats/<id>  Körperwerte and the Garmin-Übersicht of one sport (pages/flow/Stats.svelte, lazy)
   *   #/flow/auswertung  «Haken ausgewertet»: what you tick, evaluated like a ride (pages/flow/TickReview.svelte, lazy)
   *   #/flow/milestones  all milestones (pages/flow/Milestones.svelte), ?act=, ?tune=1; #/flow/trophies the trophies
   *   #/flow/ideen       «Meine Ideen» (HN4c): tips for the balance and the own ideas list (pages/flow/Ideas.svelte)
   * The rules are pure and tested (lib/flow.js, flowcheck.js, flowtimer.js, flowbowl.js).
   */
  import Ideas from './flow/Ideas.svelte';
  import LiveStart from '../lib/live/LiveStart.svelte';
  import { Plus, Snowflake, ChevronRight } from '@lucide/svelte';
  import { inSeason } from '../lib/ski.js';
  import { flowQuery, seedIfNeeded } from '../lib/flow/data.svelte.js';
  import { restRows } from '../lib/flow/restlist.js';
  import { flowStates, rings as ringsOf } from '../lib/flow.js';
  import { openTimer, actName } from '../lib/flow/ui.svelte.js';
  import Rings from '../lib/flow/Rings.svelte';
  import TickGrid from '../lib/flow/TickGrid.svelte';
  import WeekGlance from '../lib/flow/WeekGlance.svelte';
  import Sec from '../lib/flow/kit/Sec.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import HintCard from '../lib/pageinfo/HintCard.svelte';
  import { seasonNow } from '../lib/flow/aktiv.js';
  import MedStartSheet from '../lib/flow/MedStartSheet.svelte';
  import { isMedAct } from '../lib/flow/hobby/medstart.js';
  import ActEditor from '../lib/flow/ActEditor.svelte';
  import Activity from './flow/Activity.svelte';
  import MySports from './flow/MySports.svelte';
  import Training from './flow/Training.svelte';
  import TrainingAct from './flow/TrainingAct.svelte';
  import Milestones from './flow/Milestones.svelte';
  import Trophies from './flow/Trophies.svelte';
  import Gipfelbuch from './flow/Gipfelbuch.svelte';
  import Week from './flow/Week.svelte';
  import WeekReview from './flow/WeekReview.svelte';
  import Bags from './flow/Bags.svelte';
  import Rest from './flow/Rest.svelte';
  import TickSuggest from '../lib/strava/TickSuggest.svelte';
  import Meditation from './flow/Meditation.svelte';
  import MedTimer from './flow/MedTimer.svelte';
  import MedDone from './flow/MedDone.svelte';
  import MedLog from './flow/MedLog.svelte';
  import MedSession from './flow/MedSession.svelte';
  import MedMore from './flow/MedMore.svelte';
  import MedPatterns from './flow/MedPatterns.svelte';
  import MedReview from './flow/MedReview.svelte';
  import { sportHref } from '../lib/flow/mysports.js';
  import { localDay } from '../lib/localday.js';
  import { phone } from '../lib/media.svelte.js';
  import { t, tn, locale } from '../lib/i18n.svelte.js';

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
  // WS6 (Noah 3a): what counts for «Erholung», in the fold under the rings, with «zuletzt am»
  const rest = $derived(restRows(states, data?.log ?? [], today));
  const lastLine = (r) => (r.last ? [t('last {date}', { date: fmt(r.last.day, { weekday: 'short', day: 'numeric', month: 'short' }) }), r.last.min ? t('{n} min', { n: r.last.min }) : ''].filter(Boolean).join(' · ') : t('not yet'));
  const fmt = (d, o) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', ...o });
  const season = $derived(data ? seasonNow(data.acts, today) : null);
  // «Aktiv neu» (spec «Eine Zählweise»): the head and «Heute abhaken» name the same number as the ring «Bewegen»
  // (rolling 7 days), so «0 von 8» against «1 von 11» is gone
  const moveLine = $derived(rings.move.of ? tn(rings.move.of, 'this week {k} of {n} move goal on track', 'this week {k} of {n} move goals on track', { k: rings.move.n }) : '');
  const todayLine = $derived(
    [fmt(today, { weekday: 'long', day: 'numeric', month: 'short' }), moveLine, season ? (season.half === 'summer' ? t('Summer') : t('Winter')) : ''].filter(Boolean).join(' · '),
  );
  const tickSub = $derived(moveLine ? `${moveLine.charAt(0).toUpperCase()}${moveLine.slice(1)}` : '');

  // hobby pages 1: the sub address may carry a query (#/flow/milestones?act=meditation)
  const route = $derived(sub.split('?')[0].split('/'));
  const params = $derived(new URLSearchParams(sub.split('?')[1] ?? ''));
  const editId = $derived(route[0] === 'edit' ? decodeURIComponent(route[1] ?? '') : route[0] === 'new' ? 'new' : null);
  // «Aktiv neu»: the editor leads back to the sport's page when it was opened there
  const editBack = $derived(params.get('from') === 'sport' && editId && editId !== 'new' ? sportHref({ id: editId }) : params.get('from') === 'activity' ? '#/flow/activity' : '');

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
{:else if route[0] === 'form'}
  <!-- «Form und Erholung» (Noah 20.10.2026 «3a»): loaded only when opened -->
  {#await import('./flow/Form.svelte') then m}<m.default />{:catch}<p class="hint" role="alert">{t('This page could not load. Please check the connection and try again.')}</p>{/await}
{:else if route[0] === 'stats'}
  <!-- Garmin-Übersicht: one sport or the heart rate, 7 days / 4 weeks / 1 year -->
  {#await import('./flow/Stats.svelte') then m}{#key route[1]}<m.default id={decodeURIComponent(route[1] ?? 'bike')} />{/key}{:catch}<p class="hint" role="alert">{t('This page could not load. Please check the connection and try again.')}</p>{/await}
{:else if route[0] === 'auswertung'}
  <!-- «Auswertung wie Training» (Noah 20.10.2026): what you tick, evaluated like a ride; loaded only when opened -->
  {#await import('./flow/TickReview.svelte') then m}<m.default {params} />{:catch}<p class="hint" role="alert">{t('This page could not load. Please check the connection and try again.')}</p>{/await}
{:else if route[0] === 'sports' || route[0] === 'goals'}
  <!-- «Aktiv neu» (Noah 22.10.2026 «4a»): «Ziele», «Aktivität» and «Sportarten» are one list «Meine Sportarten» -->
  <MySports />
{:else if route[0] === 'sport'}
  {#await import('./flow/Sport.svelte') then m}{#key route[1]}<m.default id={decodeURIComponent(route[1] ?? '')} />{/key}{/await}
{:else if route[0] === 'activity'}
  <Activity />
{:else if route[0] === 'milestones'}
  <Milestones {params} />
{:else if route[0] === 'trophies'}
  <Trophies {params} />
{:else if route[0] === 'gipfelbuch'}
  <Gipfelbuch {params} />
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
  {#if data}<ActEditor id={editId} acts={data.acts} log={data.log} {today} tripDays={data.tripDays} back={editBack} />{/if}
{:else}
  <div class="flow">
    <header class="ph">
      <h1 class="title">{t('Active|place')}</h1>
      <p class="sub" data-today-line>{todayLine}</p>
      <!-- «Skitouren»: in season (November–May) one small row to Touren › Skitouren -->
      {#if inSeason(today)}<a class="skl" href="#/ski" data-to="ski"><Snowflake size={16} aria-hidden="true" />{t('Ski tour')}<ChevronRight size={16} aria-hidden="true" /></a>{/if}
      <!-- Paket U3 «Live-Karte» (Noah 19.10.2026 «5a» «Aktiv „Ausfahrt starten"»): one small line to the live map -->
      <LiveStart />
      {#await import('../lib/wetter/DraussenTipp.svelte') then m}<m.default />{:catch}{/await}
    </header>

    <!-- Noah 19.10 «2a»: the Einstieg of Aktiv in the card «Was hier steht» (after the first visit one quiet line) -->
    <HintCard page="aktiv" intro="aktiv" />

    {#if data && !states.length}
      <Empty icon={Plus} text={t('No sports yet. Add the first one: name, goal, done.')} action={{ label: t('New sport'), href: '#/flow/new' }} />
    {:else if data}
      <!-- «Aktiv neu» (Noah 22.10.2026, spec «Startseite Aktiv»): one question, «Was mache ich heute, und bin ich im
           Soll?», in three parts: tick off today, this week, the rings. The form card, Strava, «Wi gaht's?» and the
           tiles moved to Auswerten; the lake and the air to the weather page. -->
      <div class="lay">
        <div class="col">
          <!-- the stopwatch sits in the head of this part (was Aktiv › Mehr › Stoppuhr) -->
          <Sec id="tick-h" title={t('Tick off today')} sub={tickSub} edit={{ href: '#/flow/sports', label: t('Edit|acts') }} more={{ label: t('Stopwatch'), onclick: () => openTimer() }}>
            <!-- the help line (spec «Heute abhaken»), the same as on Heute -->
            <TickGrid states={live} {today} cols={phone.matches ? 2 : 4} compact help onmed={(s) => (medFor = s.act.id)} />
            {#if hasMed}<p class="hint">{t('Tap Meditation: start or tick off.')}</p>{/if}
            <!-- package G #156: Strava activities waiting for «Count» (only when ticking is set to «suggest first») -->
            <TickSuggest />
          </Sec>
        </div>
        <div class="col">
          <Sec id="week-h" title={t('This week')} sub={t('your ticks and fixed dates · a tap plans the week')}>
            <WeekGlance acts={data.acts} {states} log={data.log} {today} />
          </Sec>
          <Sec id="ring-h" title={t('Rings')} sub={t('last 7 days against your goals')} more={{ href: '#/flow/form', label: t('See your form') }}>
            <div class="card ringc">
              <Rings {rings} size={phone.matches ? 112 : 140} quiet />
              <!-- WS6 (Noah 3a): what counts for «Erholung», with «zuletzt am» -->
              {#if rest.length}
                <details class="restf" data-rest>
                  <summary><span>{t('What counts for recovery')}</span><small class="num">{t('last 7 days')}</small></summary>
                  <ul>
                    {#each rest as r (r.act.id)}
                      <li><span>{actName(r.act)}</span><small class="num">{lastLine(r)}</small></li>
                    {/each}
                  </ul>
                  <a class="link" href="#/flow/sports">{t('Change in My sports')}</a>
                </details>
              {/if}
              <!-- «Was zählt wofür?» (spec «Ringe»): what each ring counts -->
              <details class="restf" data-ring-help>
                <summary><span>{t('What counts for what?')}</span></summary>
                <p class="rhelp">{t('Each ring shows the last 7 days against your goals: Move (sport and training), Mindful (meditation) and Recovery (sauna, walks, sleep). A full ring means every goal of that ring is on track.')}</p>
                <a class="link" href="#/flow/sports">{t('Change in My sports')}</a>
              </details>
            </div>
          </Sec>
        </div>
      </div>
    {/if}
  </div>
{/if}

{#if medSt}<MedStartSheet st={medSt} {today} onclose={() => (medFor = null)} />{/if}

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
</style>
