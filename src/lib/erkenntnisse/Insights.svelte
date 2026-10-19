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
  import { Lightbulb, HeartPulse, Hourglass, ChevronRight, Lock } from '@lucide/svelte';
  import { db } from '../db.js';
  import { historyQuery } from '../abdb.js';
  import { localDay } from '../localday.js';
  import { t, tn, num as fmt } from '../i18n.svelte.js';
  import { seriesOf, insights, rhrHigh, lastDays, ownNumberQuestions, MIN_DAYS, WINDOW_DAYS, OWN_OFF_KEY } from '../erkenntnisse.js';
  import { keepDayWeather, loadDayData } from '../daydata.js';
  import { configOf } from '../abfragen.js';
  import { HOME_PLACE } from '../know.js';
  import '../abfragen/ab.css';

  let { compact = false, idp = 'ek' } = $props();
  const today = localDay();
  const hist = historyQuery();
  const healthQ = liveQuery(() => db.healthDays.toArray());
  const logQ = liveQuery(() => db.flowLog.where('actId').equals('meditation').toArray());
  const dayQ = liveQuery(() => loadDayData(db));
  const offQ = liveQuery(async () => (await db.settings.get(OWN_OFF_KEY))?.value ?? []);
  const placeQ = liveQuery(async () => !!(await db.settings.get(HOME_PLACE))?.value);
  // the weather of the last days, quietly, at most once a day (daydata.js)
  onMount(() => void keepDayWeather(db).catch(() => {}));
  /** Every own number question (scale or number), and those that count (not switched off). */
  const ownAll = $derived(ownNumberQuestions(configOf($hist?.cfg).own));
  const own = $derived(ownNumberQuestions(ownAll, $offQ ?? []));
  const series = $derived(
    seriesOf({ rows: $hist?.rows ?? [], health: $healthQ ?? [], log: $logQ ?? [], days: lastDays(today, WINDOW_DAYS + 1), weather: $dayQ?.weather, events: $dayQ?.events, own }),
  );
  const all = $derived(insights(series, today, { own }));
  const shown = $derived(all.filter((x) => x.shown));
  /** Waiting: only pairs whose first value has data at all (no weather without a home place, no calendar without Google). */
  const waiting = $derived(all.filter((x) => !x.ready && Object.keys(series[x.x] ?? {}).length));

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
  function xText(key, cut) {
    if (key === 'sleepH') return t('more than {v} h of sleep', { v: v(cut) });
    if (key === 'sleepFelt') return t('sleep felt above {v}', { v: v(cut) });
    if (key === 'km') return cut ? t('more than {v} km by bike', { v: v(cut) }) : t('a bike ride');
    if (key === 'med') return cut ? t('more than {v} min of meditation', { v: v(cut) }) : t('meditation');
    if (key === 'steps') return t('more than {v} steps', { v: v(Math.round(cut)) });
    if (key === 'rhr') return t('a resting pulse above {v}', { v: v(cut) });
    if (key === 'azm') return cut ? t('more than {v} active zone minutes', { v: v(cut) }) : t('active zone minutes');
    if (key === 'sunH') return cut ? t('more than {v} h of sunshine', { v: v(cut) }) : t('sunshine');
    if (key === 'lightH') return t('more than {v} h of daylight', { v: v(cut) });
    if (key === 'rainMm') return cut ? t('more than {v} mm of rain', { v: v(cut) }) : t('rain');
    if (key === 'evts') return cut ? t('more than {v} appointments', { v: v(cut) }) : t('appointments');
    if (key.startsWith('own:')) return t('«{name}» above {v}', { name: ownName(key), v: v(cut) });
    return key;
  }
  /** The own question's text as the user typed it (never through t()). */
  const ownName = (key) => ownAll.find((q) => `own:${q.id}` === key)?.text ?? '';
  const nameOf = (key) => (key.startsWith('own:') ? ownName(key) : t(NAME[key]));
  const Y = {
    battery: 'your battery|insight',
    mood: 'your mood|insight',
    sat: 'your satisfaction with the day|insight',
    rhr: 'your resting pulse|insight',
    sleepH: 'your sleep in hours|insight',
    sleepFelt: 'your sleep felt|insight',
  };
  const NAME = { sleepH: 'Sleep (Fitbit)', sleepFelt: 'Sleep felt', battery: 'Battery', mood: 'Mood', sat: 'Satisfaction', km: 'Bike km', med: 'Meditation', steps: 'Steps', rhr: 'Resting pulse', azm: 'Active zone minutes', sunH: 'Sunshine', lightH: 'Daylight', rainMm: 'Rain', evts: 'Appointments' };
  const sentence = (x) =>
    t(x.lag ? 'The day after {x}, {y} was {hi} on average, otherwise {lo}.' : 'On days with {x}, {y} was {hi} on average, otherwise {lo}.', {
      x: xText(x.x, x.cut),
      y: t(Y[x.y]),
      hi: v(x.hi.mean),
      lo: v(x.lo.mean),
    });
  const list = $derived(compact ? shown.slice(0, 3) : shown);
</script>

<section class="ich-sec ek" aria-labelledby="{idp}-h" data-section="insights">
  <div class="ich-h"><div><h2 id="{idp}-h">{t('Insights')}</h2><p class="ich-hs">{t('what goes together in your data, the last {n} days', { n: WINDOW_DAYS })}</p></div></div>
  {#if rhr}
    <div class="card pad note" data-rhr-high>
      <HeartPulse size={18} aria-hidden="true" />
      <p>{t('Your resting pulse has been above your normal ({n}) for {d} days: {list}. Maybe keep an eye on recovery.', { n: v(rhr.normal), d: rhr.last.length, list: rhr.last.join(', ') })}</p>
    </div>
  {/if}
  {#if list.length}
    <ul class="card pad ins">
      {#each list as x (x.id)}
        <li data-insight={x.id}>
          <Lightbulb size={16} aria-hidden="true" />
          <span><b>{sentence(x)}</b><small class="num">{tn(x.n, '{n} day', '{n} days')} · {x.clear ? t('goes together clearly') : t('goes together a little')} · {nameOf(x.x)} → {nameOf(x.y)}</small></span>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="card pad wait" data-insights-none><Hourglass size={15} aria-hidden="true" /><span>{t('Nothing clear yet. Insights show from {n} days with both values.', { n: MIN_DAYS })}</span></p>
  {/if}
  {#if !compact && waiting.length}
    <div class="card pad">
      <b class="wh">{t('Still collecting days')}</b>
      <ul class="wl">
        {#each waiting as x (x.id)}<li data-waiting={x.id}><span>{nameOf(x.x)} → {nameOf(x.y)}{#if x.lag} · {t('the day after')}{/if}</span><small class="num">{t('{n} of {m} days', { n: x.n, m: MIN_DAYS })}</small></li>{/each}
      </ul>
    </div>
  {/if}
  {#if !compact}
    <div class="card pad src" data-insights-sources>
      <b class="wh">{t('Also compared')}</b>
      <p class="ich-hs">{t('The weather and daylight of each day at your home place, and how many appointments your Google calendar had. Both are kept quietly on this device.')}</p>
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
