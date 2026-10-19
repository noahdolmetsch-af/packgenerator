<script>
  /**
   * «Erkenntnisse» (Noah 19.10.2026 «4b» + «zusätzlich eine eigene Seite»): what goes together in your data,
   * one sentence each (erkenntnisse.js). In the Auswertung (compact: the three strongest and a link) and on
   * its own page Ich › Erkenntnisse (#/me/insights, everything, also what is still waiting for days).
   */
  import { liveQuery } from 'dexie';
  import { Lightbulb, HeartPulse, Hourglass, ChevronRight, Lock } from '@lucide/svelte';
  import { db } from '../db.js';
  import { historyQuery } from '../abdb.js';
  import { localDay } from '../localday.js';
  import { t, tn, num as fmt } from '../i18n.svelte.js';
  import { seriesOf, insights, rhrHigh, lastDays, MIN_DAYS, WINDOW_DAYS } from '../erkenntnisse.js';

  let { compact = false, idp = 'ek' } = $props();
  const today = localDay();
  const hist = historyQuery();
  const healthQ = liveQuery(() => db.healthDays.toArray());
  const logQ = liveQuery(() => db.flowLog.where('actId').equals('meditation').toArray());
  const series = $derived(seriesOf({ rows: $hist?.rows ?? [], health: $healthQ ?? [], log: $logQ ?? [], days: lastDays(today, WINDOW_DAYS + 1) }));
  const all = $derived(insights(series, today));
  const shown = $derived(all.filter((x) => x.shown));
  const waiting = $derived(all.filter((x) => !x.ready));
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
    return key;
  }
  const Y = {
    battery: 'your battery|insight',
    mood: 'your mood|insight',
    sat: 'your satisfaction with the day|insight',
    rhr: 'your resting pulse|insight',
    sleepH: 'your sleep in hours|insight',
  };
  const NAME = { sleepH: 'Sleep (Fitbit)', sleepFelt: 'Sleep felt', battery: 'Battery', mood: 'Mood', sat: 'Satisfaction', km: 'Bike km', med: 'Meditation', steps: 'Steps', rhr: 'Resting pulse', azm: 'Active zone minutes' };
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
          <span><b>{sentence(x)}</b><small class="num">{tn(x.n, '{n} day', '{n} days')} · {x.clear ? t('goes together clearly') : t('goes together a little')} · {t(NAME[x.x])} → {t(NAME[x.y])}</small></span>
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
        {#each waiting as x (x.id)}<li data-waiting={x.id}><span>{t(NAME[x.x])} → {t(NAME[x.y])}{#if x.lag} · {t('the day after')}{/if}</span><small class="num">{t('{n} of {m} days', { n: x.n, m: MIN_DAYS })}</small></li>{/each}
      </ul>
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
