<script>
  /**
   * «Erkenntnisse» (Noah 19.10.2026 «4b» + «zusätzlich eine eigene Seite»): what goes together in your data,
   * one sentence each (erkenntnisse.js). In the Auswertung (compact: the three strongest and a link) and on
   * its own page Ich › Erkenntnisse (#/me/insights, everything, also what is still waiting for days).
   * Noah 19.10.2026 «2a 3a 4a und b möglich»: also weather and daylight, appointments per day and every own
   * number question; on the page each own question can be switched off.
   */
  import { onMount } from 'svelte';
  import { liveQuery } from 'dexie';
  import { Lightbulb, HeartPulse, Hourglass, ChevronRight, ChevronDown, Lock, FlaskConical, Check, TrendingUp } from '@lucide/svelte';
  import { db } from '../db.js';
  import { historyQuery } from '../abdb.js';
  import { localDay } from '../localday.js';
  import { t, tn, num as fmt } from '../i18n.svelte.js';
  import { seriesOf, insights, rhrHigh, lastDays, ownNumberQuestions, leversOf, soonOf, isLever, expMetricOf, MIN_DAYS, WINDOW_DAYS, OWN_OFF_KEY } from '../erkenntnisse.js';
  import { keepDayWeather, loadDayData } from '../daydata.js';
  import { configOf } from '../abfragen.js';
  import { sentenceOf, xText, leverLine, tipOf, cap, SHORT } from './words.js';
  import { countedActs } from './aktiv.js';
  import { actName } from '../flow/ui.svelte.js';
  import MitOhne from './MitOhne.svelte';
  import { settingQ, readSetting, saveSetting } from '../ruhig/store.js';
  import { EXP_KEY, expsOf, expState, newExp } from '../ruhig/versuche.js';
  import { HOME_PLACE } from '../know.js';
  import '../abfragen/ab.css';

  let { compact = false, idp = 'ek' } = $props();
  const today = localDay();
  const hist = historyQuery();
  const healthQ = liveQuery(() => db.healthDays.toArray());
  const logQ = liveQuery(() => db.flowLog.where('actId').equals('meditation').toArray());
  let dayQ = $state(liveQuery(() => loadDayData(db)));
  const offQ = liveQuery(async () => (await db.settings.get(OWN_OFF_KEY))?.value ?? []);
  const placeQ = liveQuery(async () => !!(await db.settings.get(HOME_PLACE))?.value);
  // the activities of Aktiv as Analyse counts them (ticks plus Strava sports without a tick)
  const actsQ = liveQuery(() => countedActs(db));
  const expQ = settingQ(EXP_KEY);
  // the weather of the last days, quietly, at most once a day (daydata.js); when new days came, read them
  // again, because the first read can run before the weather is kept and then sometimes missed it
  onMount(() => void keepDayWeather(db).then((got) => got && (dayQ = liveQuery(() => loadDayData(db)))).catch(() => {}));
  /** Every own number question (scale or number), and those that count (not switched off). */
  const ownAll = $derived(ownNumberQuestions(configOf($hist?.cfg).own));
  const own = $derived(ownNumberQuestions(ownAll, $offQ ?? []));
  const series = $derived(
    seriesOf({ rows: $hist?.rows ?? [], health: $healthQ ?? [], log: $logQ ?? [], days: lastDays(today, WINDOW_DAYS + 1), weather: $dayQ?.weather, events: $dayQ?.events, own, acts: $actsQ }),
  );
  const all = $derived(insights(series, today, { own }));
  const shown = $derived(all.filter((x) => x.shown));
  /** Waiting: only pairs whose first value has data at all (no weather without a home place, no calendar without Google); soon: from 7 days; first: a first trend. */
  const soon = $derived(soonOf(all, series, today));
  const waiting = $derived(soon.waiting);
  const levers = $derived(leversOf(all));
  /** The row that is open (its picture shows), «lev:<id>» for a lever. */
  let openId = $state('');
  const toggle = (id) => (openId = openId === id ? '' : id);

  async function toggleOwn(id, on) {
    await db.transaction('rw', db.settings, async () => {
      const off = new Set((await db.settings.get(OWN_OFF_KEY))?.value ?? []);
      if (on) off.delete(id);
      else off.add(id);
      await db.settings.put({ key: OWN_OFF_KEY, value: [...off] });
    });
  }
  const rhr = $derived(rhrHigh($healthQ ?? [], today));

  const v = (x) => fmt(x);
  /** The text of an own question or an activity as the user typed it (never through t()). */
  const ownName = (key) => (key.startsWith('act:') ? actName(($actsQ?.acts ?? []).find((a) => a.id === key.slice(4))) : (ownAll.find((q) => `own:${q.id}` === key)?.text ?? ''));
  const nameOf = (key) => (key.startsWith('own:') || key.startsWith('act:') ? ownName(key) : t(NAME[key]));
  const NAME = { hrv: 'HRV', sleepH: 'Sleep (Fitbit)', sleepFelt: 'Sleep felt', battery: 'Battery', mood: 'Mood', sat: 'Satisfaction', km: 'Bike km', med: 'Meditation', steps: 'Steps', rhr: 'Resting pulse', azm: 'Active zone minutes', sunH: 'Sunshine', lightH: 'Daylight', rainMm: 'Rain', evts: 'Appointments' };
  const sentence = (x) => sentenceOf(t, v, ownName, x);
  const list = $derived(compact ? shown.slice(0, 3) : shown);
  const leverText = (x) => leverLine(t, v, ownName, x);
  const withText = (x) => t('With {x}', { x: xText(t, v, ownName, x.x, x.cut) });

  /** The tries that run or wait (Eigene Experimente): a lever only starts one when none with the same question is open. */
  const exps = $derived(expsOf($expQ));
  const askOf = (x) => t('What changes with «{x}»: {y}?', { x: xText(t, v, ownName, x.x, x.cut), y: `${t(SHORT[x.y])}${x.lag ? ` · ${t('the day after')}` : ''}` });
  const openTry = (x) => exps.find((e) => e.q === askOf(x) && ['soon', 'running', 'review'].includes(expState(e, today)));
  let startedId = $state('');
  /** «Test 14 days»: a try with an end in Eigene Experimente, measured by the value of y (the look back compares the 14 days with the 14 before). */
  async function startTry(x) {
    if (openTry(x)) return;
    const e = newExp({ q: askOf(x), change: t('Aim for: {x}', { x: xText(t, v, ownName, x.x, x.cut) }), from: today, days: 14, metric: expMetricOf(x.y) });
    if (!e) return;
    await saveSetting(EXP_KEY, [...expsOf(await readSetting(EXP_KEY)), e]);
    startedId = x.id;
  }
</script>

{#snippet detail(x)}
  <div class="detail" data-insight-detail={x.id}>
    <MitOhne row={x} yName={t(SHORT[x.y])} withText={withText(x)} withoutText={t('Otherwise')} />
    {#if isLever(x.x)}
      {#if openTry(x) || startedId === x.id}
        <p class="tried" data-try-running><Check size={15} aria-hidden="true" /><span>{t('Your try runs.')} <a href="#/me/ruhig/versuche">{t('Open the try')}</a></span></p>
      {:else}
        <button type="button" class="btn" onclick={() => startTry(x)} data-try-start><FlaskConical size={16} aria-hidden="true" />{t('Test it for 14 days')}</button>
        <p class="ich-hs">{t('Starts a try with an end in «Experiment mit Ende». After 14 days the app shows the result next to the 14 days before.')}</p>
      {/if}
    {/if}
  </div>
{/snippet}

<section class="ich-sec ek" aria-labelledby="{idp}-h" data-section="insights">
  {#if compact}<div class="ich-h"><div><h2 id="{idp}-h">{t('Insights')}</h2><p class="ich-hs">{t('what goes together in your data, the last {n} days', { n: WINDOW_DAYS })}</p></div></div>{/if}
  {#if rhr}
    <div class="card pad note" data-rhr-high>
      <HeartPulse size={18} aria-hidden="true" />
      <p>{t('Your resting pulse has been above your normal ({n}) for {d} days: {list}. Maybe keep an eye on recovery.', { n: v(rhr.normal), d: rhr.last.length, list: rhr.last.join(', ') })}</p>
    </div>
  {/if}
  {#if !compact && levers.length}
    <div class="card pad lev" data-levers>
      <b class="wh">{t('Your strongest levers')}</b>
      <p class="ich-hs">{t('What you can do yourself, and what it went with in your last {n} days. Tap one to see the days.', { n: WINDOW_DAYS })}</p>
      <ol class="ins">
        {#each levers as x (x.id)}
          <li data-lever={x.id}>
            <TrendingUp size={16} aria-hidden="true" />
            <div class="rowc">
              <button type="button" class="row" aria-expanded={openId === `lev:${x.id}`} onclick={() => toggle(`lev:${x.id}`)}>
                <span><b>{leverText(x)}</b><small>{tipOf(t, ownName, x)} · {tn(x.n, '{n} day', '{n} days')}</small></span>
                <ChevronDown size={16} aria-hidden="true" class="chev" />
              </button>
              {#if openId === `lev:${x.id}`}{@render detail(x)}{/if}
            </div>
          </li>
        {/each}
      </ol>
    </div>
  {/if}
  {#if !compact}<div class="ich-h"><div><h2 id="{idp}-h">{t('All that goes together')}</h2><p class="ich-hs">{t('what goes together in your data, the last {n} days', { n: WINDOW_DAYS })}</p></div></div>{/if}
  {#if list.length}
    <ul class="card pad ins">
      {#each list as x (x.id)}
        <li data-insight={x.id}>
          <Lightbulb size={16} aria-hidden="true" />
          {#if compact}
            <span><b>{sentence(x)}</b><small class="num">{tn(x.n, '{n} day', '{n} days')} · {x.clear ? t('goes together clearly') : t('goes together a little')} · {nameOf(x.x)} → {nameOf(x.y)}</small></span>
          {:else}
            <div class="rowc">
              <button type="button" class="row" aria-expanded={openId === x.id} onclick={() => toggle(x.id)}>
                <span><b>{sentence(x)}</b><small class="num">{tn(x.n, '{n} day', '{n} days')} · {x.clear ? t('goes together clearly') : t('goes together a little')} · {nameOf(x.x)} → {nameOf(x.y)}</small></span>
                <ChevronDown size={16} aria-hidden="true" class="chev" />
              </button>
              {#if openId === x.id}{@render detail(x)}{/if}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {:else}
    <p class="card pad wait" data-insights-none><Hourglass size={15} aria-hidden="true" /><span>{t('Nothing clear yet. Insights show from {n} days with both values.', { n: MIN_DAYS })}</span></p>
  {/if}
  {#if !compact && waiting.length}
    <div class="card pad soon" data-soon>
      <b class="wh"><Hourglass size={15} aria-hidden="true" /> {soon.soon.length ? tn(soon.soon.length, 'Soon visible: {n} link', 'Soon visible: {n} links') : t('Still collecting days')}</b>
      {#if soon.first}
        <p class="first" data-soon-first>{t('A first trend, not sure yet:')} <b>{sentence(soon.first)}</b> <small class="num">({tn(soon.first.n, '{n} day', '{n} days')})</small></p>
      {/if}
      <details class="wd" data-waiting-all>
        <summary>{t('Everything that is still collecting days')}</summary>
        <ul class="wl">
          {#each waiting as x (x.id)}<li data-waiting={x.id}><span>{nameOf(x.x)} → {nameOf(x.y)}{#if x.lag}{' '}· {t('the day after')}{/if}</span><small class="num">{t('{n} of {m} days', { n: x.n, m: MIN_DAYS })}</small></li>{/each}
        </ul>
      </details>
    </div>
  {/if}
  {#if !compact}
    <div class="card pad src" data-insights-sources>
      <b class="wh">{t('Also compared')}</b>
      <p class="ich-hs">{t('The weather and daylight of each day at your home place, and how many appointments your Google calendar had. Both are kept quietly on this device.')}</p>
      <p class="ich-hs">{t('Every activity you tick in Aktiv (training, sauna, cold water, friends, meditation, habits) is compared with your sleep, resting pulse, HRV, battery and mood, on the day and the day after. An activity needs 6 ticked days first.')}</p>
      {#if $placeQ === false}<p class="ich-hs" data-insights-noplace>{t('No home place yet: set it under Me › Settings › Home place, then the weather is compared too.')}</p>{/if}
      {#if ownAll.length}
        <b class="wh">{t('Your own questions')}</b>
        <p class="ich-hs">{t('Every own question with a number or a scale is compared with your mood and battery. Switch one off if it does not belong here.')}</p>
        <ul class="wl">
          {#each ownAll as q (q.id)}
            <li>
              <label class="ownrow" data-insights-own={q.id}>
                <span>{q.text}</span>
                <span class="ab-sw"><input type="checkbox" role="switch" checked={!($offQ ?? []).includes(q.id)} onchange={(e) => toggleOwn(q.id, e.currentTarget.checked)} /></span>
              </label>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
  <p class="local"><Lock size={15} aria-hidden="true" /><span>{t('Going together is not a cause. Only to look at, never a diagnosis. Everything stays on the device.')}</span></p>
  {#if compact}<a class="btn" href="#/me/insights" data-insights-all>{t('All insights')}<ChevronRight size={16} aria-hidden="true" /></a>{/if}
</section>

<style>
  .pad {
    padding: 14px 16px;
  }
  .note {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin-bottom: 10px;
  }
  .note :global(svg),
  .ins :global(svg) {
    flex: none;
    margin-top: 3px;
  }
  .note p {
    margin: 0;
    overflow-wrap: break-word;
  }
  .ins,
  .wl {
    margin: 0;
    list-style: none;
  }
  .ins li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .ins li:first-child {
    border-top: 0;
  }
  .ins li span {
    display: grid;
    gap: 2px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .ins b {
    font-weight: 500;
  }
  .ins small,
  .wl small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .lev,
  .soon {
    display: grid;
    gap: 6px;
    margin-bottom: 10px;
  }
  .lev p,
  .soon p {
    margin: 0;
  }
  .lev .ins {
    padding: 0;
  }
  .rowc {
    flex: 1;
    min-width: 0;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    width: 100%;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
    min-height: 32px;
  }
  .row span {
    display: grid;
    gap: 2px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .row :global(.chev) {
    flex: none;
    margin-top: 3px;
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  .row[aria-expanded='true'] :global(.chev) {
    transform: rotate(180deg);
  }
  .row:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }
  .detail {
    display: grid;
    gap: 8px;
    padding: 4px 0 8px;
    justify-items: start;
  }
  .detail p {
    margin: 0;
  }
  .tried {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .first {
    color: var(--ink-2);
  }
  .wd summary {
    cursor: pointer;
    color: var(--ink-3);
    font-size: var(--fs-small);
    padding: 4px 0;
  }
  .wait {
    display: flex;
    gap: 8px;
    align-items: center;
    color: var(--ink-3);
  }
  .wh {
    font-weight: 600;
  }
  .wl {
    padding: 0;
  }
  .wl li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
    overflow-wrap: break-word;
  }
  .src {
    display: grid;
    gap: 6px;
    margin-bottom: 10px;
  }
  .src p {
    margin: 0;
  }
  .ownrow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    width: 100%;
    overflow-wrap: break-word;
  }
  .local {
    display: flex;
    gap: 8px;
    align-items: center;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ek :global(.btn) {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
</style>
