<script>
  /**
   * T1 «Plan erfüllt?» (Noah 15.10.2026 «1-5 a»): the planned sessions of this week as rows (day, planned,
   * done) and one small bar per week for this week and the last five: how many were ridden as planned,
   * nearly (±1 zone), in another zone or not done. The plan is read live (training.plan). Observation only.
   * Without any plan in these weeks: one quiet line with the way to the plan. inhalt-woche.js planWeeks.
   */
  import { liveQuery } from 'dexie';
  import AnaCard from '../AnaCard.svelte';
  import { db } from '../../db.js';
  import { zones } from '../../strava/zones.svelte.js';
  import { PLAN_KEY, planOf, hmm, KIND_NAMES } from '../../training.js';
  import { t, locale } from '../../i18n.svelte.js';
  import { planWeeks, PLAN_WEEKS } from './inhalt-woche.js';

  let { acts = [], today = '' } = $props();
  const planQ = liveQuery(async () => (await db.settings.get(PLAN_KEY))?.value ?? null);
  const loaded = $derived($planQ !== undefined);
  const data = $derived(today && loaded ? planWeeks(planOf($planQ), acts, today, zones.bounds) : null);
  const now = $derived(data?.weeks.at(-1) ?? null);
  const fmt = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'numeric' });

  const planned = (s) => (s.zone ? t('{n} min Z{z}', { n: s.mins, z: s.zone }) : t('{n} min', { n: s.mins }));
  function done(r) {
    if (r.state === 'missed') return t('not done');
    if (r.state === 'open') return t('still open');
    const time = hmm(r.act.movingS);
    if (r.state === 'kept') return r.zone ? `${time} Z${r.zone} ✓` : `${time} ✓`;
    const harder = r.diff > 0;
    if (r.state === 'near') return harder ? t('{time} Z{z}, a little harder', { time, z: r.zone }) : t('{time} Z{z}, a little easier', { time, z: r.zone });
    return harder ? t('{time} Z{z}, harder', { time, z: r.zone }) : t('{time} Z{z}, easier', { time, z: r.zone });
  }
  const weekName = (w) => (w.current ? t('This week') : t('Wk {n}', { n: w.kw }));
  const weekLine = (w) => {
    if (!w.rows.length) return t('nothing planned');
    if (!w.due) return t('nothing due yet');
    return w.near ? t('{a} of {b} as planned, {n} nearly', { a: w.kept, b: w.due, n: w.near }) : t('{a} of {b} as planned', { a: w.kept, b: w.due });
  };
  // on this page the plan is just above: scroll there instead of opening the page again
  function toPlan(e) {
    const el = document.querySelector('[data-section="week-plan"]');
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

{#if data}
  <AnaCard key="plan" sub={t('Planned zone against ridden zone')}>
    {#if !data.any}
      <p class="cap" data-plan-none>{t('No plan yet.')} <a href="#/flow/training" onclick={toPlan}>{t('Plan one above under «Plan the week».')}</a></p>
    {:else}
      {#if now.rows.length}
        <ul class="pk-rows" aria-label={t('This week')}>
          {#each now.rows as r (r.s.id)}
            <li class="pk-row" data-plan-row={r.s.id} data-state={r.state}>
              <span class="pk-day">{fmt(r.s.day)}</span>
              <span class="pk-plan">{planned(r.s)}<small>{r.s.name || t(KIND_NAMES[r.s.kind])}</small></span>
              {#if r.act}
                <a class="pk-done st-{r.state}" href="#/flow/training/a/{encodeURIComponent(r.act.id)}">{done(r)}</a>
              {:else}
                <span class="pk-done st-{r.state}">{done(r)}</span>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="cap">{t('Nothing planned this week.')}</p>
      {/if}
      <ul class="pk-weeks" aria-label={t('{n} weeks', { n: PLAN_WEEKS })}>
        {#each data.weeks as w (w.monday)}
          <li class="pk-week" data-plan-week={w.monday} class:pk-now={w.current}>
            <span class="pk-wn">{weekName(w)}</span>
            <span class="pk-bar" aria-hidden="true">
              {#if w.due}
                {#each [['kept', w.kept], ['near', w.near], ['other', w.other], ['missed', w.missed]] as [k, n] (k)}
                  {#if n}<i class="bk-{k}" style:flex-grow={n}></i>{/if}
                {/each}
              {/if}
            </span>
            <span class="pk-wl">{weekLine(w)}</span>
          </li>
        {/each}
      </ul>
      <ul class="pk-leg">
        <li><i class="bk-kept"></i>{t('as planned')}</li>
        <li><i class="bk-near"></i>{t('one zone off')}</li>
        <li><i class="bk-other"></i>{t('other zone')}</li>
        <li><i class="bk-missed"></i>{t('not done')}</li>
      </ul>
      <p class="cap">{t('Done = an activity of that kind on that day; its zone is the one with the most time. Just to look at.')}</p>
    {/if}
  </AnaCard>
{/if}

<style>
  .pk-rows,
  .pk-weeks,
  .pk-leg {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .pk-rows {
    display: flex;
    flex-direction: column;
  }
  .pk-row {
    display: grid;
    grid-template-columns: 5.5em minmax(0, 1fr) minmax(0, 1.2fr);
    gap: 4px 12px;
    align-items: baseline;
    padding: 8px 0;
    border-top: 1px solid var(--line);
    font-size: var(--fs-small);
  }
  .pk-row:first-child {
    border-top: 0;
    padding-top: 0;
  }
  .pk-day {
    color: var(--ink-3);
  }
  .pk-plan {
    display: flex;
    flex-direction: column;
    font-variant-numeric: tabular-nums;
  }
  .pk-plan small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    overflow-wrap: break-word;
  }
  .pk-done {
    font-variant-numeric: tabular-nums;
    color: var(--ink);
  }
  a.pk-done {
    text-decoration: none;
  }
  a.pk-done:hover {
    text-decoration: underline;
  }
  .pk-done.st-kept {
    color: var(--ch-w);
    font-weight: 600;
  }
  .pk-done.st-missed,
  .pk-done.st-open {
    color: var(--ink-3);
  }
  .pk-weeks {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .pk-week {
    display: grid;
    grid-template-columns: 6.5em minmax(40px, 1fr) minmax(0, 1.4fr);
    gap: 10px;
    align-items: center;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .pk-now .pk-wn {
    color: var(--ink);
    font-weight: 600;
  }
  .pk-bar {
    display: flex;
    gap: 2px;
    height: 10px;
    border-radius: 5px;
    overflow: hidden;
    background: var(--ch-alt);
    opacity: 0.9;
  }
  .pk-bar i {
    display: block;
    min-width: 4px;
  }
  .bk-kept {
    background: var(--ch-w);
  }
  .bk-near {
    background: var(--pz2);
  }
  .bk-other {
    background: var(--pz4);
  }
  .bk-missed {
    background: var(--ch-alt);
  }
  .pk-bar .bk-missed {
    background: transparent;
  }
  .pk-leg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .pk-leg li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .pk-leg i {
    display: inline-block;
    width: 12px;
    height: 10px;
    border-radius: 3px;
  }
  @media (max-width: 480px) {
    .pk-row {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
    .pk-day {
      grid-column: 1 / -1;
    }
    .pk-week {
      grid-template-columns: auto minmax(0, 1fr);
      grid-template-areas: 'n l' 'b b';
      gap: 2px 10px;
    }
    .pk-wn {
      grid-area: n;
    }
    .pk-wl {
      grid-area: l;
      text-align: right;
    }
    .pk-bar {
      grid-area: b;
    }
  }
</style>
