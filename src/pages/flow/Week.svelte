<script>
  /**
   * v0.130.0 «Woche» (mockup AK1, Noah 13.10.2026 «1-5a», «ich gebe hiermit alle mockups frei»):
   *   #/flow/week   Monday to Sunday: what was done, the fixed dates, the planned ones and suggestions by
   *                 the open goals and the home weather (a tap plans one, × hides it). Right: the goals of
   *                 the week (rolling), the fixed dates (add, change, delete) and the calendar file (.ics).
   * The rules are pure and tested (lib/flowweek.js).
   */
  import { Plus, X, Clock, Sun, Cloud, CloudRain, CalendarPlus, Lightbulb, ChevronRight } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../../lib/db.js';
  import PageHead from '../../lib/ui/PageHead.svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import Sec from '../../lib/flow/kit/Sec.svelte';
  import MoreAktiv from '../../lib/flow/kit/MoreAktiv.svelte';
  import { morePages } from '../../lib/flow/morepages.js';
  import { flowQuery, seedIfNeeded } from '../../lib/flow/data.svelte.js';
  import { flowStates } from '../../lib/flow.js';
  import { FIXED_KEY, PLAN_KEY, NO_KEY, fixedList, normFixed, weekOf, weekPlan, weekGoals, togglePlan, hideSugg, pruneNo, weekEvents } from '../../lib/flowweek.js';
  import { putSetting } from '../../lib/flowdb.js';
  import { icsCalendar } from '../../lib/flowmed.js';
  import { homeForecast } from '../../lib/home-weather.js';
  import { actName } from '../../lib/flow/ui.svelte.js';
  import { localDay } from '../../lib/localday.js';
  import { phone } from '../../lib/media.svelte.js';
  import { t, locale } from '../../lib/i18n.svelte.js';

  const today = localDay();
  const q = flowQuery(today);
  const data = $derived($q);
  $effect(() => {
    seedIfNeeded(data);
  });
  const setQ = liveQuery(async () => {
    const [f, p, n] = await Promise.all([db.settings.get(FIXED_KEY), db.settings.get(PLAN_KEY), db.settings.get(NO_KEY)]);
    return { fixed: fixedList(f?.value), plans: Array.isArray(p?.value) ? p.value : [], no: Array.isArray(n?.value) ? n.value : [] };
  });
  const sets = $derived($setQ ?? { fixed: [], plans: [], no: [] });
  let forecast = $state(null);
  $effect(() => {
    homeForecast(db)
      .then((f) => (forecast = f))
      .catch(() => (forecast = null));
  });

  const acts = $derived(data?.acts ?? []);
  const actOf = $derived(new Map(acts.map((a) => [a.id, a])));
  const states = $derived(data ? flowStates(acts, data.log, today, data.tripDays) : []);
  const week = $derived(data ? weekPlan({ acts, states, log: data.log, today, fixed: sets.fixed, plans: sets.plans, no: sets.no, forecast }) : null);
  const goals = $derived(weekGoals(states));
  const open = $derived(goals.filter((g) => !g.met).length);
  const pages = $derived(morePages({ openGoals: open }));

  const days = weekOf(today);
  const fmt = (d, o) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', ...o });
  const range = `${fmt(days[0], { day: 'numeric' })}–${fmt(days[6], { day: 'numeric', month: 'long' })}`;
  const name = (id) => actName(actOf.get(id)) || id;
  const WHY = { daily: 'daily', dry: 'dry', rain: 'rain, indoors', recovery: 'recovery is missing', goal: 'for your goal' };
  const doneText = (x) => `${name(x.actId)}${x.min ? ` ${x.min}′` : x.n > 1 ? ` ${x.n}` : ''}`;
  const WD = [1, 2, 3, 4, 5, 6, 7].map((wd) => ({ wd, long: fmt(days[wd - 1], { weekday: 'long' }), short: fmt(days[wd - 1], { weekday: 'short' }) }));

  async function plan(day, actId) {
    await putSetting(db, PLAN_KEY, togglePlan(sets.plans, day, actId, today));
  }
  async function hide(day, actId) {
    await putSetting(db, NO_KEY, hideSugg(pruneNo(sets.no, today), day, actId, today));
  }

  /* the fixed dates: one open at a time in the form */
  let edit = $state(null);
  const liveActs = $derived(acts.filter((a) => !a.paused));
  const startNew = () => (edit = { id: null, actId: liveActs[0]?.id ?? '', wd: 1, time: '18:00', minutes: 60 });
  async function saveFixed(e) {
    e.preventDefault();
    const f = normFixed({ ...edit, id: edit.id || `fx-${Date.now().toString(36)}` });
    if (!f) return;
    await putSetting(db, FIXED_KEY, [...sets.fixed.filter((x) => x.id !== f.id), f]);
    edit = null;
  }
  async function deleteFixed() {
    await putSetting(db, FIXED_KEY, sets.fixed.filter((x) => x.id !== edit.id));
    edit = null;
  }

  function download() {
    const text = icsCalendar(weekEvents({ fixed: sets.fixed, plans: sets.plans, today, name }));
    const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `aktiv-woche-${today}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
</script>

<div class="hob">
  <header class="ph">
    <Crumb path={[{ href: '#/flow', label: t('Active|place') }]} here={t('Week')} />
    <MoreAktiv items={pages} on="week" />
    <PageHead title={t('Week')} text={t('{range} · suggestions from your goals, fixed dates and the weather. Everything can be changed.', { range })} />
    <a class="btn btn-link sm" style="align-self: flex-start" href="#/flow/review" data-to-review>{t('Week in review')}<ChevronRight size={16} aria-hidden="true" /></a>
  </header>

  {#if week}
    <div class="lay">
      <div class="col">
        {#if phone.matches}{@render goalsSec()}{/if}
        <section class="card wk" aria-labelledby="wk-days">
          <h2 id="wk-days" class="vh">{t('The days of the week')}</h2>
          <p class="legend">
            <span class="ev fix"><Clock size={15} aria-hidden="true" />{t('fixed')}</span>
            <span class="ev sug lg"><Plus size={14} aria-hidden="true" />{t('suggestion')} <em>{t('tap = plan')}</em></span>
            <span class="ev done">{t('done')}</span>
          </p>
          {#each week.days as d (d.day)}
            <div class="day" class:today={d.today} class:past={d.past} data-day={d.day}>
              <div class="dn">
                <b>{fmt(d.day, { weekday: 'short' }).replace('.', '')} {fmt(d.day, { day: 'numeric' })}.</b>
                {#if d.wx}
                  {@const W = d.wx.wet ? CloudRain : d.wx.dry ? Sun : Cloud}
                  <small><W size={15} aria-label={d.wx.wet ? t('rain') : d.wx.dry ? t('dry') : t('cloudy')} /> {Math.round(d.wx.max)}°</small>
                {:else if d.today}<small>{t('today')}</small>{/if}
              </div>
              <div class="evs">
                {#each d.items as x (`${x.kind}:${x.actId}:${x.time ?? ''}`)}
                  {#if x.kind === 'done'}
                    <span class="ev done" data-done={x.actId}>{doneText(x)}</span>
                  {:else if x.kind === 'fix'}
                    <span class="ev fix" data-fix={x.actId}><Clock size={15} aria-hidden="true" />{name(x.actId)} {x.time}</span>
                  {:else if x.kind === 'plan'}
                    <button type="button" class="ev fix" data-plan={x.actId} aria-pressed="true" title={t('Planned · tap to unplan')} onclick={() => plan(d.day, x.actId)}><CalendarPlus size={15} aria-hidden="true" />{name(x.actId)}</button>
                  {:else}
                    <span class="ev sug" data-sug={x.actId}>
                      <button type="button" class="sp" onclick={() => plan(d.day, x.actId)} aria-label={t('Plan {name} on {day}', { name: name(x.actId), day: fmt(d.day, { weekday: 'long' }) })}><Plus size={14} aria-hidden="true" /><span>{name(x.actId)}{#if x.why !== 'goal'}{' '}<em>{t(WHY[x.why])}</em>{/if}</span></button>
                      <button type="button" class="sx" onclick={() => hide(d.day, x.actId)} aria-label={t('Hide this suggestion')}><X size={14} aria-hidden="true" /></button>
                    </span>
                  {/if}
                {/each}
              </div>
            </div>
          {/each}
        </section>
      </div>

      <aside class="col">
        {#if !phone.matches}{@render goalsSec()}{/if}

        <Sec id="wk-fixed" title={t('Fixed dates')} sub={t('every week, as long as the activity has a goal')}>
          <div class="card fixed">
            <ul class="rows">
              {#each sets.fixed as f (f.id)}
                <li><button type="button" class="fr" data-fixed={f.id} onclick={() => (edit = { ...f })}><Clock size={18} aria-hidden="true" /><span><b>{name(f.actId)}</b><small>{t('every {day} {time}', { day: WD[f.wd - 1].long, time: f.time })} · {f.minutes} min</small></span><ChevronRight size={16} aria-hidden="true" /></button></li>
              {:else}
                <li class="none">{t('No fixed dates yet. Yoga on Thursday 07:00? Add it once, it comes back every week.')}</li>
              {/each}
            </ul>
            {#if edit}
              <form class="fx" onsubmit={saveFixed} data-fixed-form>
                <label>{t('Activity')}<select bind:value={edit.actId} required>{#each liveActs as a (a.id)}<option value={a.id}>{actName(a)}</option>{/each}</select></label>
                <label>{t('Weekday')}<select bind:value={edit.wd}>{#each WD as w (w.wd)}<option value={w.wd}>{w.long}</option>{/each}</select></label>
                <label>{t('Time')}<input type="time" bind:value={edit.time} required /></label>
                <label>{t('Minutes')}<input type="number" min="5" max="600" step="5" bind:value={edit.minutes} /></label>
                <div class="fb">
                  <button type="submit" class="btn hi">{t('Save')}</button>
                  {#if edit.id}<button type="button" class="btn" onclick={deleteFixed}>{t('Delete')}</button>{/if}
                  <button type="button" class="btn" onclick={() => (edit = null)}>{t('Cancel')}</button>
                </div>
              </form>
            {/if}
            <div class="fb">
              {#if !edit}<button type="button" class="btn" onclick={startNew} data-add-fixed><Plus size={16} aria-hidden="true" />{t('Date|fixed')}</button>{/if}
              {#if sets.fixed.length || sets.plans.length}<button type="button" class="btn" onclick={download} data-ics><CalendarPlus size={16} aria-hidden="true" />{t('To my calendar (.ics)')}</button>{/if}
            </div>
          </div>
        </Sec>

        {#if week.tip}
          <p class="note" data-tip>
            <Lightbulb size={18} aria-hidden="true" />
            <span>
              {t('{day} has the best weather of the week. {name}?', { day: fmt(week.tip.day, { weekday: 'long' }), name: name(week.tip.actId) })}
              <span class="tb">
                <button type="button" class="btn hi" onclick={() => plan(week.tip.day, week.tip.actId)}>{t('Plan it')}</button>
                <button type="button" class="btn" onclick={() => hide(week.tip.day, week.tip.actId)}>{t('No thanks')}</button>
              </span>
            </span>
          </p>
        {/if}
      </aside>
    </div>
  {/if}
</div>

{#snippet goalsSec()}
    <Sec id="wk-goals" title={t('Goals this week')} sub={t('rolling|week')}>
      <ul class="card rows goals">
        {#each goals as g (g.act.id)}
          <li data-goal={g.act.id}>
            <span class="gl"><b>{actName(g.act)}</b><span class="num">{g.daily ? t('{n} of {m} days', { n: g.n, m: g.of }) : t('{n} of {m}', { n: g.n, m: g.of })}</span></span>
            <span class="bar" aria-hidden="true"><i style="width:{Math.max(3, Math.round((g.n / Math.max(1, g.of)) * 100))}%"></i></span>
          </li>
        {:else}
          <li>{t('No goals yet.')}</li>
        {/each}
      </ul>
    </Sec>
{/snippet}

<style>
  /* the look of the other Aktiv pages (Trophies.svelte); the days as in mockup AK1 */
  .hob {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 1240px;
    margin: 0 auto;
    min-width: 0;
  }
  .hob :global(.pagehead) {
    margin: 0;
  }
  .ph {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
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
  .vh {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .wk {
    padding: var(--sp-4);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    margin: 0 0 var(--sp-3);
  }
  .day {
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr);
    gap: var(--sp-3);
    align-items: start;
    padding: 12px 0;
    border-top: 1px solid var(--line);
  }
  .legend + .day {
    border-top: 0;
  }
  .dn b {
    display: block;
  }
  .day.today .dn b {
    color: var(--hi);
  }
  .day.past .dn b {
    color: var(--ink-3);
  }
  .dn small {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 2px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .evs {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    min-width: 0;
  }
  .ev {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    padding: 4px 10px;
    border-radius: 10px;
    font: 500 var(--fs-small) / 1.3 var(--font-body);
    max-width: 100%;
  }
  .ev.fix {
    border: 0;
    background: var(--hi-soft);
    color: var(--ink);
  }
  button.ev.fix {
    cursor: pointer;
  }
  .ev.done {
    background: var(--paper-2);
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .ev.sug {
    padding: 0;
    border: 1.5px dashed var(--line-strong);
    color: var(--ink-2);
    gap: 0;
  }
  .ev.sug.lg {
    gap: 6px;
    padding: 4px 10px;
  }
  .ev em {
    color: var(--ink-3);
    font-style: normal;
    font-weight: 400;
  }
  .sp,
  .sx {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    padding: 4px 8px 4px 10px;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .sx {
    padding: 4px 8px;
    color: var(--ink-3);
  }
  .rows {
    margin: 0;
    padding: 0 var(--sp-4);
    list-style: none;
  }
  .rows li {
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .rows li:first-child {
    border-top: 0;
  }
  .gl {
    display: flex;
    justify-content: space-between;
    gap: var(--sp-3);
  }
  .gl b {
    font-weight: 500;
  }
  .gl span {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .bar {
    display: block;
    height: 6px;
    margin-top: 6px;
    border-radius: 3px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    background: var(--hi);
  }
  .fixed {
    padding-bottom: var(--sp-4);
  }
  .fr {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    width: 100%;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .fr span {
    flex: 1;
    min-width: 0;
  }
  .fr b {
    display: block;
    font-weight: 600;
  }
  .fr small,
  .none {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .fx {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-3);
    margin: var(--sp-2) var(--sp-4) 0;
    padding-top: var(--sp-3);
    border-top: 1px solid var(--line);
  }
  .fx label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .fx select,
  .fx input {
    min-height: 44px;
    min-width: 0;
  }
  .fb {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    margin: var(--sp-3) var(--sp-4) 0;
  }
  .fx .fb {
    grid-column: 1 / -1;
    margin: 0;
  }
  .note {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin: 0;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .note :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--hi);
  }
  .tb {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    margin-top: var(--sp-2);
  }
  @media (max-width: 640px) {
    .day {
      grid-template-columns: 62px minmax(0, 1fr);
    }
  }
</style>
