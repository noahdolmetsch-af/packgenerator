<script>
  /**
   * «Geschafft» (Noah 19.11.2026 «1-5a», Thread «Training erfassen vereinfachen», T1): the one page after a tick.
   *   #/flow/geschafft?e=<entry id>   what you did, how often this week, the week in hours and days, the weekly goals still
   *                                   open, a comparison with the last time (only with Strava numbers), one next step.
   * It only counts and looks (never «good» or «too little»), saves nothing and has no new data; «Rückgängig» takes the tick
   * back as the message after the tick does. It replaces the two links «Dein Verlauf» and «Meilensteine» of that message;
   * «Alle Zahlen» leads to the sport's page. The rules are pure and tested (lib/flow/geschafft.js).
   * T2 «Haken zuerst»: a tap on a tile of Aktiv ticks and opens this page; two optional chip rows (duration 30/45/60/90, feeling light/good/hard)
   * save `min` and `feel` on the entry of the tick (lib/flow/feel.js); the same chip again takes it back.
   * Draft: https://claude.ai/artifact/2gziTtHYQWcPa7wPDsWwah
   */
  import { Check, ChevronRight, Star, Undo2 } from '@lucide/svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import Empty from '../../lib/ui/Empty.svelte';
  import { db } from '../../lib/db.js';
  import { flowQuery, seedIfNeeded } from '../../lib/flow/data.svelte.js';
  import { flowStates } from '../../lib/flow.js';
  import { actName, undoTick, toast } from '../../lib/flow/ui.svelte.js';
  import { putEntry } from '../../lib/flowdb.js';
  import { MIN_CHIPS, FEELS, canSetMinutes, withMinutes, withFeel } from '../../lib/flow/feel.js';
  import { sportHref } from '../../lib/flow/mysports.js';
  import { GOAL_KEY } from '../../lib/training.js';
  import { WEEKPLAN_KEY } from '../../lib/training/wochenplan.js';
  import { WEEKLOG_KEY } from '../../lib/training/wochenlog.js';
  import { UNIT_NAME } from '../../lib/training/wochenplan-text.js';
  import { entryToShow, sourceKey, nthThisWeek, weekNumbers, hhmm, hoursGoal, openGoals, compareLast, nextUnit } from '../../lib/flow/geschafft.js';
  import { localDay } from '../../lib/localday.js';
  import { t, tn, num, locale } from '../../lib/i18n.svelte.js';

  let { params = new URLSearchParams() } = $props();
  const today = localDay();
  const q = flowQuery(today);
  const data = $derived($q);
  $effect(() => {
    seedIfNeeded(data);
  });
  const acts = $derived(data?.acts ?? []);
  const log = $derived(data?.log ?? []);
  const wanted = $derived(params.get('e') ?? '');
  const entry = $derived(data ? entryToShow(log, wanted, today) : null);
  const act = $derived(entry ? (acts.find((a) => a.id === entry.actId) ?? null) : null);

  // what the settings and Strava hold (read once per entry; nothing here changes while you look)
  let more = $state.raw(null);
  $effect(() => {
    const e = entry;
    if (!e) return (more = null);
    let stale = false;
    (async () => {
      const [goal, weekplan, weeklog] = await Promise.all([db.settings.get(GOAL_KEY), db.settings.get(WEEKPLAN_KEY), db.settings.get(WEEKLOG_KEY)]);
      const activities = e.stravaId ? await db.activities.toArray().catch(() => []) : [];
      const stars = await db.flowStars.toArray().catch(() => []);
      if (!stale) more = { goal: goal?.value ?? null, weekplan: weekplan?.value ?? null, weeklog: weeklog?.value ?? null, activities, stars };
    })();
    return () => (stale = true);
  });

  const states = $derived(data ? flowStates(acts, log, today, data.tripDays) : []);
  const nth = $derived(nthThisWeek(log, entry));
  const week = $derived(entry ? weekNumbers(log, acts, entry.day) : null);
  const goalH = $derived(more && entry ? hoursGoal(more, entry.day) : null);
  const goals = $derived(entry ? openGoals(states, entry.actId) : { list: [], open: 0, all: 0 });
  const compare = $derived(more && entry?.stravaId ? compareLast(more.activities, entry.stravaId) : null);
  const nowTime = new Date().toLocaleTimeString('sv-SE', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit' });
  const next = $derived(more ? nextUnit(more.weekplan, more.weeklog, { day: today, time: nowTime }) : null);
  // «Meilensteine» (stars are kept per milestone id «<activity>.…»): a star reached on the day of this tick
  const star = $derived(more && entry ? more.stars.some((s) => s.day === entry.day && String(s.msId).startsWith(`${entry.actId}.`)) : false);

  const fmt = (d, o) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', ...o });
  const SOURCE = { hand: 'ticked by you', strava: 'from Strava|done', timer: 'with the stopwatch', commute: 'ride to work', plan: 'from your plan' };
  const when = $derived(entry ? (entry.day === today ? t('Today|day') : fmt(entry.day, { weekday: 'long', day: 'numeric', month: 'short' })) : '');
  const amount = $derived(entry ? [entry.min ? t('{n} min', { n: entry.min }) : '', entry.n > 1 ? `${entry.n}×` : ''].filter(Boolean).join(' · ') : '');
  const nthText = $derived(nth <= 1 ? t('The first time this week') : t('Time {n} this week', { n: nth }));
  const dayShort = (d) => fmt(d, { weekday: 'short' }).replace('.', '').slice(0, 2);
  const unitText = $derived(next ? `${fmt(next.day, { weekday: 'short' }).replace('.', '')} ${next.t} · ${t(UNIT_NAME[next.type] ?? next.type)}` : '');
  const pct = $derived(goalH && week ? Math.min(100, Math.round((week.mins / 60 / goalH) * 100)) : 0);

  const FEEL_TEXT = { light: 'light|feel', good: 'good|feel', hard: 'hard|feel' };
  // «Haken zuerst»: both are optional and can be taken back by tapping the chosen chip again
  const chooseMin = (m) => entry && db.flowLog.put(withMinutes(entry, m));
  const chooseFeel = (f) => entry && db.flowLog.put(withFeel(entry, f));

  async function back() {
    const e = entry;
    if (!e) return;
    const name = actName(act);
    if (!(await undoTick(e.id))) return;
    toast(t('{name} · taken back', { name }), () => putEntry(db, e));
    location.hash = '#/flow';
  }
</script>

<div class="geschafft" data-geschafft>
  <header class="ph">
    <Crumb path={[{ href: '#/flow', label: t('Active|place') }]} here={t('Done|page')} />
  </header>

  {#if !data}
    <p class="muted" role="status">{t('Loading…')}</p>
  {:else if !entry || !act}
    <h1 tabindex="-1" data-page-title>{t('Done page')}</h1>
    <Empty text={wanted ? t('This tick is gone, perhaps it was taken back.') : t('Nothing ticked yet. Tick something on Active and this page shows what it brought.')} action={{ label: t('Back to Active'), href: '#/flow' }} />
  {:else}
    <section class="head" data-geschafft-head>
      <span class="check" aria-hidden="true"><Check size={22} strokeWidth={2.5} /></span>
      <div class="ht">
        <h1 tabindex="-1" data-page-title>{t('Done page: {name}', { name: actName(act) })}{#if amount || entry.feel}{' '}<span class="amt">· {[amount, entry.feel ? t(FEEL_TEXT[entry.feel]) : ''].filter(Boolean).join(' · ')}</span>{/if}</h1>
        <p class="src" data-geschafft-source>{when} · {t(SOURCE[sourceKey(entry)])}</p>
      </div>
    </section>

    <section class="card gs how" data-geschafft-how aria-label={t('Optional: how long and how was it')}>
      {#if canSetMinutes(entry)}
        <div class="chips" role="group" aria-label={t('How long')} data-geschafft-mins>
          <span class="cl">{t('How long? (optional)')}</span>
          {#each MIN_CHIPS as m (m)}
            <button type="button" class="chip" class:on={entry.min === m} aria-pressed={entry.min === m} data-min={m} onclick={() => chooseMin(m)}>{t('{n} min', { n: m })}</button>
          {/each}
        </div>
      {/if}
      <div class="chips" role="group" aria-label={t('How was it')} data-geschafft-feel>
        <span class="cl">{t('How was it? (optional)')}</span>
        {#each FEELS as f (f)}
          <button type="button" class="chip" class:on={entry.feel === f} aria-pressed={entry.feel === f} data-feel={f} onclick={() => chooseFeel(f)}>{t(FEEL_TEXT[f])}</button>
        {/each}
      </div>
      <small>{t('Both are optional. Tap a chosen one again to take it back.')}</small>
    </section>

    <div class="lay">
      <div class="col">
        <section class="card gs obs" data-geschafft-obs aria-label={t('This time')}>
          <b data-geschafft-nth>{nthText}</b>
          {#if star}<p class="gstar" data-geschafft-star><Star size={16} aria-hidden="true" />{t('A new star today: {sport}', { sport: actName(act) })} <a href="#/flow/milestones?act={encodeURIComponent(entry.actId)}">{t('Milestones')}<ChevronRight size={14} aria-hidden="true" /></a></p>{/if}
          {#if compare?.rows.length}
            <ul class="cmp" data-geschafft-compare>
              <li class="cl">{t('Compared with the last time ({date})', { date: fmt(compare.before.day, { day: 'numeric', month: 'short' }) })}</li>
              {#each compare.rows as r (r.k)}
                <li>{r.k === 'min' ? t('{now} instead of {before} min', r) : r.k === 'km' ? t('{now} instead of {before} km', { now: num(r.now), before: num(r.before) }) : t('Heart rate avg {now} instead of {before}', r)}</li>
              {/each}
            </ul>
            <p class="quiet">{t('Only to look at.')}</p>
          {:else if compare}
            <p class="quiet" data-geschafft-quiet>{t('There is no earlier one to compare with yet.')}</p>
          {:else}
            <p class="quiet" data-geschafft-quiet>{t('With a watch or Strava this card shows time, distance and heart rate next to the last time.')}</p>
          {/if}
        </section>
      </div>

      <div class="col">
        <section class="card gs wk" data-geschafft-week aria-labelledby="gs-week">
          <div class="row"><b id="gs-week">{t('This week|done')}</b><span class="big num" data-geschafft-hours>{hhmm(week.mins)} h</span></div>
          {#if goalH}
            <div class="prog" role="img" aria-label={t('{n} percent of the weekly goal', { n: pct })}><i style="width:{pct}%"></i></div>
            <small>{t('of {h} h weekly goal', { h: num(goalH) })}</small>
          {:else if !week.mins}
            <small>{t('Without a duration only the days count.')}</small>
          {/if}
          <div class="days" data-geschafft-days>
            {#each week.days as d, i (d)}
              <span class:today={d === entry.day}>{dayShort(d)}<b class:y={week.done[i]} aria-hidden="true">{#if week.done[i]}✓{/if}</b><span class="vh">{fmt(d, { weekday: 'long' })}: {week.done[i] ? t('trained|day') : t('nothing ticked')}</span></span>
            {/each}
          </div>
          <small>{tn(week.daysDone, '{n} day with training this week', '{n} days with training this week')}</small>
        </section>

        <section class="card gs gl" data-geschafft-goals aria-labelledby="gs-goals">
          <b id="gs-goals">{t('Weekly goals')}</b>
          {#if goals.list.length}
            <ul class="goals">
              {#each goals.list as g (g.act.id)}
                <li><span>{actName(g.act)}</span><span class={g.met ? 'ok' : 'muted'}>{g.met ? t('reached') : t('{n} of {m} so far', { n: g.n, m: g.of })}</span></li>
              {/each}
            </ul>
          {:else}
            <small>{goals.all ? t('All weekly goals on track') : t('You have no weekly goals yet.')}</small>
          {/if}
        </section>
      </div>
    </div>

    <section class="card gs nx" data-geschafft-next aria-label={t('As next')}>
      <div class="row">
        <span class="nt">
          {#if next}<small>{t('As next')}</small><a href="#/flow/wochenplan" data-geschafft-unit><b>{unitText}</b></a>{:else}<small>{t('That is it for now.')}</small>{/if}
        </span>
        <a class="btn hi" href="#/flow" data-geschafft-back>{t('Back to Active')}</a>
      </div>
      <div class="row links">
        <a class="lk" href={sportHref(act)} data-geschafft-all>{t('All numbers of this training')}<ChevronRight size={16} aria-hidden="true" /></a>
        <a class="lk" href="#/flow/milestones?act={encodeURIComponent(entry.actId)}" data-geschafft-ms>{t('Milestones')}<ChevronRight size={16} aria-hidden="true" /></a>
        <a class="lk" href="#/flow/review" data-geschafft-review>{t('Week in review')}<ChevronRight size={16} aria-hidden="true" /></a>
        <button type="button" class="lk" onclick={back} data-geschafft-undo><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>
      </div>
    </section>
  {/if}
</div>

<style>
  .geschafft {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 1100px;
    margin: 0 auto;
    min-width: 0;
  }
  .ph {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
  }
  .head {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .check {
    display: grid;
    place-items: center;
    flex: none;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: var(--accent-soft);
    color: var(--accent);
  }
  .ht {
    min-width: 0;
  }
  h1 {
    margin: 0;
    font: 700 var(--fs-section) / 1.2 var(--font-body);
    overflow-wrap: break-word;
  }
  .amt {
    font-weight: 500;
    color: var(--ink-2);
  }
  .src {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .lay {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-4);
    align-items: start;
  }
  @media (min-width: 1000px) {
    .lay {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    min-width: 0;
  }
  .gs {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .chips .cl {
    flex: none;
    min-width: 5.5em;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .chip {
    min-height: 44px;
    padding: 0 16px;
    border: 1px solid var(--line);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .chip.on {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .gs b {
    font-size: var(--fs-body);
  }
  small,
  .quiet {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .gstar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .gstar :global(svg) {
    color: var(--warn);
  }
  .gstar a {
    display: inline-flex;
    align-items: center;
    color: var(--ink);
    font-weight: 600;
  }
  .cmp {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: var(--fs-small);
  }
  .cmp .cl {
    color: var(--ink-3);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
  }
  .big {
    font: 700 var(--fs-page) var(--font-body);
  }
  .prog {
    height: 10px;
    border-radius: 99px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .prog i {
    display: block;
    height: 100%;
    border-radius: 99px;
    background: var(--accent);
  }
  .days {
    display: flex;
    gap: 6px;
  }
  .days > span {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    color: var(--ink-3);
    font-size: var(--fs-small);
    position: relative;
  }
  .days b {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--paper-2);
    color: var(--ink);
    font-size: var(--fs-small);
  }
  .days b.y {
    background: var(--accent);
    color: var(--paper);
  }
  .days .today b {
    outline: 2px solid var(--ink);
    outline-offset: 1px;
  }
  .goals {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: var(--fs-small);
  }
  .goals li {
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }
  .goals li > :first-child {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .goals .ok {
    color: var(--ok);
    font-weight: 600;
  }
  .nt {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .nt a {
    color: var(--ink);
    text-decoration: none;
  }
  .links {
    justify-content: flex-start;
    gap: 4px 18px;
  }
  .lk {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: 500 var(--fs-small) var(--font-body);
    text-decoration: underline;
    cursor: pointer;
  }
  .vh {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
</style>
