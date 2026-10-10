<script>
  /**
   * v0.51.0 «Im Flow – kleiner Start» (mockups ImFlow-Phone / -Desktop, approved 9.10.2026).
   *   #/flow             the page: three rings (rolling 7 days), «Heute abhaken», «Ziele × Tage»
   *                      (7 days on a phone, 14 on a computer), the daily check, recovery and seasons
   *   #/flow/goals       all activities, in their order (drag the grip or use the arrow keys)
   *   #/flow/edit/<id>   edit one activity; #/flow/new a new one (the same form, empty)
   *   #/flow/activity    hobby pages 1: Aktiv › Aktivität (pages/flow/Activity.svelte)
   *   #/flow/milestones  hobby pages 1: all milestones (pages/flow/Milestones.svelte), ?act=, ?tune=1
   * The rules are pure and tested (lib/flow.js, flowcheck.js, flowtimer.js, flowbowl.js).
   */
  import { ChevronLeft, ChevronRight, Pencil, Plus, Sun, Timer, GripVertical, Snowflake, Sparkles } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { flowQuery, seedIfNeeded } from '../lib/flow/data.svelte.js';
  import { flowStates, rings as ringsOf, summary, lastDays, activeGoals, halfOf, halfEnds, halfSince, restsUntil, moveAct } from '../lib/flow.js';
  import { averages, checkOf, complete, rotating, FIXED } from '../lib/flowcheck.js';
  import { saveOrder } from '../lib/flowdb.js';
  import { ui, openTimer, actName, goalName, qText } from '../lib/flow/ui.svelte.js';
  import { actGoalText, goalsText, dayShort, wd } from '../lib/flow/words.js';
  import Rings from '../lib/flow/Rings.svelte';
  import TickGrid from '../lib/flow/TickGrid.svelte';
  import GoalGrid from '../lib/flow/GoalGrid.svelte';
  import ActIcon from '../lib/flow/ActIcon.svelte';
  import ActEditor from '../lib/flow/ActEditor.svelte';
  import Activity from './flow/Activity.svelte';
  import Milestones from './flow/Milestones.svelte';
  import { localDay } from '../lib/localday.js';
  import { phone } from '../lib/media.svelte.js';
  import { t, tn, locale, lang } from '../lib/i18n.svelte.js';

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
  const sum = $derived(summary(states));
  const week = lastDays(today, 7);
  const fmt = (d, o) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', ...o });
  // «Sa 3. – Fr 9. Okt.»
  const range = $derived(`${wd(week[0])} ${fmt(week[0], { day: 'numeric' })} – ${wd(today)} ${fmt(today, { day: 'numeric', month: 'short' })}`);
  const list = (names) => (names.length ? new Intl.ListFormat(locale(), { type: 'conjunction' }).format(names) : '');
  const sumLine = $derived.by(() => {
    const met = sum.met.map(actName);
    // v0.69.1 G: «Yoga Yoga Studio» → «Yoga Studio»; a sub-goal without the name: «Yoga (Zuhause)»
    const subOf = (m) => (goalName(m.goal).toLowerCase().includes(actName(m.act).toLowerCase()) ? goalName(m.goal) : `${actName(m.act)} (${goalName(m.goal)})`);
    const miss = sum.missing.map((m) => (m.goal ? subOf(m) : `${m.n}× ${actName(m.act)}`));
    const a = met.length ? t('{list} on track.', { list: list(met) }) : '';
    const b = miss.length ? t('{list} still to do.', { list: list(miss) }) : met.length ? t('Everything on track.') : '';
    return [a, b].filter(Boolean).join(' ');
  });

  // hobby pages 1: the sub address may carry a query (#/flow/milestones?act=meditation)
  const route = $derived(sub.split('?')[0].split('/'));
  const params = $derived(new URLSearchParams(sub.split('?')[1] ?? ''));
  const editId = $derived(route[0] === 'edit' ? decodeURIComponent(route[1] ?? '') : route[0] === 'new' ? 'new' : null);

  /* the daily check */
  const check = $derived(checkOf(data?.checks.find((c) => c.day === today), today));
  const rot = $derived(data ? rotating(data.pool, today) : null);
  const avg = $derived(averages(data?.checks ?? [], today, 7));
  const n1 = (v) => (v == null ? '–' : v.toLocaleString(lang.v === 'de' ? 'de-DE' : 'en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));

  /* recovery and seasons (computer) */
  const restStates = $derived(states.filter((s) => s.act.ring === 'rest'));
  const lastOf = (id) => (data?.log ?? []).filter((e) => e.actId === id).sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''))[0] ?? null;
  const seasonal = $derived(states.filter((s) => s.act.season));

  /* the list of all activities: order by the grip */
  let dragId = $state(null);
  const all = $derived(data?.acts ?? []);
  async function move(id, to) {
    await saveOrder(db, moveAct(all, id, to));
  }
  function gripKey(e, a, i) {
    if (e.key === 'ArrowUp' && i > 0) (e.preventDefault(), move(a.id, i - 1).then(() => focusGrip(a.id)));
    if (e.key === 'ArrowDown' && i < all.length - 1) (e.preventDefault(), move(a.id, i + 1).then(() => focusGrip(a.id)));
  }
  const focusGrip = (id) => requestAnimationFrame(() => document.querySelector(`[data-grip="${id}"]`)?.focus());
  let listEl = $state();
  function gripDown(e, a) {
    dragId = a.id;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function gripMove(e) {
    if (!dragId || !listEl) return;
    const rows = [...listEl.querySelectorAll('li[data-id]')];
    const i = rows.findIndex((r) => {
      const b = r.getBoundingClientRect();
      return e.clientY >= b.top && e.clientY < b.bottom;
    });
    const from = all.findIndex((x) => x.id === dragId);
    if (i >= 0 && i !== from) move(dragId, i);
  }
  const gripUp = () => (dragId = null);
</script>

{#if route[0] === 'activity'}
  <Activity />
{:else if route[0] === 'milestones'}
  <Milestones {params} />
{:else if editId}
  {#if data}<ActEditor id={editId} acts={data.acts} log={data.log} {today} tripDays={data.tripDays} back={params.get('from') === 'activity' ? '#/flow/activity' : ''} />{/if}
{:else if route[0] === 'goals'}
  <div class="flow narrow">
    <p class="back"><a href="#/flow"><ChevronLeft size={16} aria-hidden="true" />{t('In the flow')}</a></p>
    <h1 class="title">{t('Goals|flow')}</h1>
    <section class="surf card-pad" aria-labelledby="acts-h">
      <h2 id="acts-h" class="sh">{t('Activities')} <span class="cnt num">{all.length}</span></h2>
      <ul class="acts" bind:this={listEl}>
        {#each all as a, i (a.id)}
          <li data-id={a.id} class:drag={dragId === a.id}>
            <a class="ar" href="#/flow/edit/{encodeURIComponent(a.id)}">
              <ActIcon icon={a.icon} ring={a.ring} dim={a.paused} />
              <span class="m"><b>{actName(a)}</b><small>{a.paused ? t('paused') : actGoalText(a, today)}{#if !a.paused && !activeGoals(a, today).length && a.season}{" · "}{t('rests until {date}', { date: dayShort(restsUntil(a, today)) })}{/if}</small></span>
            </a>
            <button type="button" class="grip" data-grip={a.id} aria-label={t('Move {name}: arrow keys', { name: actName(a) })} onkeydown={(e) => gripKey(e, a, i)} onpointerdown={(e) => gripDown(e, a)} onpointermove={gripMove} onpointerup={gripUp} onpointercancel={gripUp}><GripVertical size={18} aria-hidden="true" /></button>
            <a class="chev" href="#/flow/edit/{encodeURIComponent(a.id)}" aria-hidden="true" tabindex="-1"><ChevronRight size={18} /></a>
          </li>
        {/each}
      </ul>
      <p class="hint">{t('The order here is the order of «Tick off today».')}</p>
    </section>
    <a class="btn wide-btn" href="#/flow/new"><Plus size={18} aria-hidden="true" />{t('New activity')}</a>
  </div>
{:else}
  <div class="flow">
    <header class="ph">
      <div class="ht">
        <p class="back"><a href="#/"><ChevronLeft size={16} aria-hidden="true" />{t('Today|place')}</a></p>
        <h1 class="title">{t('In the flow')}</h1>
        <p class="page-sub">{t('Last 7 days')} · {range}{#if !phone.matches && rings.move.of}{' · '}{t('{n} of {m} movement goals on track', { n: rings.move.n, m: rings.move.of })}{/if}</p>
      </div>
      {#if !phone.matches}
        <div class="hb">
          <button type="button" class="btn" onclick={() => (ui.checkOpen = true)}><Sun size={18} aria-hidden="true" />{t('Daily check')}</button>
          <button type="button" class="btn" onclick={() => openTimer()}><Timer size={18} aria-hidden="true" />{t('Stopwatch')}</button>
          <a class="btn" href="#/flow/activity" data-to="activity"><Sparkles size={18} aria-hidden="true" />{t('Activity|tab')}</a>
        </div>
      {/if}
    </header>

    {#if data && !states.length}
      <section class="surf card-pad empty">
        <p>{t('No activities yet. Add the first one: name, goal, done.')}</p>
        <a class="btn hi" href="#/flow/new"><Plus size={18} aria-hidden="true" />{t('New activity')}</a>
      </section>
    {:else if data}
      <div class="top">
        <section class="surf card-pad ringc" aria-label={t('Rings')}>
          <Rings {rings} size={phone.matches ? 136 : 180} />
          {#if sumLine}<p class="sumline">{sumLine}</p>{/if}
        </section>
        <section class="surf card-pad" aria-labelledby="tick-h">
          <div class="sh-row">
            <h2 id="tick-h" class="sh">{t('Tick off today')}</h2>
            <span class="quiet">{phone.matches ? t('one tap') : t('one click ticks · right click: duration, place, stopwatch')}</span>
          </div>
          <TickGrid states={live} {today} cols={phone.matches ? 2 : 5} />
          {#if phone.matches}
            <p class="hint">{t('Long press: duration, place (Studio / At home) or the stopwatch.')}</p>
          {:else}
            {@render checkRow()}
          {/if}
        </section>
      </div>

      <section class="surf card-pad" aria-labelledby="grid-h">
        <div class="sh-row">
          <h2 id="grid-h" class="sh">{t('Goals × days')}{#if !phone.matches} <span class="quiet">{t('last {n} days', { n: 14 })}</span>{/if}</h2>
          {#if phone.matches}
            <a class="lk" href="#/flow/goals"><Pencil size={16} aria-hidden="true" />{t('Edit')}</a>
          {:else}
            <a class="btn sm" href="#/flow/new"><Plus size={16} aria-hidden="true" />{t('Activity')}</a>
          {/if}
        </div>
        <GoalGrid {states} log={data.log} {today} tripDays={data.tripDays} wide={!phone.matches} />
      </section>

      <div class="bottom">
        <section class="surf card-pad" aria-labelledby="chk-card-h">
          <div class="sh-row"><h2 id="chk-card-h" class="sh">{t('Daily check')}</h2><span class="quiet">{t('⌀ 7 days')}</span></div>
          {#if phone.matches}{@render checkRow()}{/if}
          {#if phone.matches}
            <div class="avg">
              {#each FIXED as f (f.key)}<div><span class="bignum num">{n1(avg[f.key].mean)}</span><small>{t(f.short)}</small></div>{/each}
            </div>
          {:else}
            <ul class="bars">
              {#each FIXED as f (f.key)}
                <li>
                  <span class="bn">{t(f.short)}</span>
                  <span class="bs" aria-hidden="true">{#each avg[f.key].series as v, i (i)}<i class:last={i === 6} style:height="{v ? 6 + v * 2.4 : 3}px"></i>{/each}</span>
                  <span class="bv num">{n1(avg[f.key].mean)}</span>
                </li>
              {/each}
            </ul>
            {#if rot}<p class="hint">{t('Plus a rotating 4th question each day, today: «{q}»', { q: qText(rot.q) })}</p>{/if}
          {/if}
        </section>
        {#if !phone.matches}
          <section class="surf card-pad" aria-labelledby="rest-h">
            <div class="sh-row"><h2 id="rest-h" class="sh">{t('Recovery|ring')}</h2>{#if rings.rest.of}<span class="pill warn num">{t('{n} of {m}', { n: rings.rest.n, m: rings.rest.of })}</span>{/if}</div>
            <ul class="rl">
              {#each restStates as s (s.act.id)}
                {@const e = lastOf(s.act.id)}
                <li><ActIcon icon={s.act.icon} ring="rest" /><span class="m"><b>{actName(s.act)}</b><small>{e ? fmt(e.day, { weekday: 'short', day: 'numeric', month: 'short' }) : t('not ticked yet')} · {actGoalText(s.act, today)}</small></span>{#if e?.min}<span class="v num">{e.min} min</span>{/if}</li>
              {/each}
            </ul>
            <p class="hint">{t('Recovery is its own ring: the units of the last 7 days against your goals.')}</p>
          </section>
          <section class="surf card-pad" aria-labelledby="season-h">
            <div class="sh-row"><h2 id="season-h" class="sh">{t('Season')}</h2><span class="quiet">{t('per sport')}</span></div>
            <ul class="rl">
              {#each seasonal as s (s.act.id)}
                {@const half = halfOf(s.act, today)}
                <li>
                  <ActIcon icon={s.act.icon} ring={s.act.ring} dim={s.resting} />
                  <span class="m"><b>{actName(s.act)}</b><small>{s.resting ? t('starts {date}', { date: dayShort(s.restUntil) }) : `${goalsText(s.act.goals)} · ${t('Winter')} ${goalsText(s.act.season.winter)}`}</small></span>
                  <span class="v">{#if s.resting}{t('rests')}{:else if half === 'summer'}{t('Summer until {date}', { date: dayShort(halfEnds(s.act, today)) })}{:else}{t('Winter since {date}', { date: dayShort(halfSince(s.act, today)) })}{/if}</span>
                </li>
              {/each}
            </ul>
          </section>
        {/if}
      </div>

      {#if phone.matches}
        <div class="foot">
          <a class="btn" href="#/flow/new"><Plus size={16} aria-hidden="true" />{t('Activity')}</a>
          <a class="lk" href="#/flow/goals">{t('All goals')}<ChevronRight size={16} aria-hidden="true" /></a>
          <a class="lk" href="#/flow/activity" data-to="activity">{t('Activity|tab')}<ChevronRight size={16} aria-hidden="true" /></a>
        </div>
      {/if}
    {/if}
  </div>
{/if}

{#snippet checkRow()}
  {#if complete(check)}
    <div class="crow done">
      <Sun size={20} aria-hidden="true" />
      <span class="ct"><b>{t('Daily check done')}</b><small>{FIXED.map((f) => `${t(f.short)} ${check[f.key]}`).join(' · ')} · {qText(data.pool.find((x) => x.id === check.q) ?? rot?.q, 'short') || t('4th')} {check.extra}</small></span>
      <button type="button" class="btn sm" onclick={() => (ui.checkOpen = true)}>{t('Change')}</button>
    </div>
  {:else}
    <div class="crow">
      <Sun size={20} aria-hidden="true" />
      <span class="ct"><b>{t('Still open today')}</b><small>{t('4 questions · one tap per question')}</small></span>
      <button type="button" class="btn start" onclick={() => (ui.checkOpen = true)}>{t('Start|check')}</button>
    </div>
  {/if}
{/snippet}

<style>
  .flow {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 1328px;
    margin: 0 auto;
  }
  .flow.narrow {
    max-width: 640px;
    gap: 14px;
  }
  @media (max-width: 719px) {
    .flow {
      gap: 14px;
    }
  }
  .back {
    margin: 0;
  }
  .back a {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 32px;
    color: var(--accent);
    text-decoration: none;
    font-size: var(--fs-small);
  }
  .ph {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
  }
  .ht {
    min-width: 0;
  }
  .ht .page-sub {
    margin-bottom: 0;
  }
  .hb {
    display: flex;
    gap: 10px;
  }
  .hb .btn {
    min-height: 44px;
    border-radius: 12px;
    border-color: var(--line);
  }
  .card-pad {
    padding: 16px 18px;
    min-width: 0;
  }
  @media (max-width: 359px) {
    .card-pad {
      padding: 14px 12px;
    }
  }
  @media (min-width: 720px) {
    .card-pad {
      padding: 20px 24px;
    }
  }
  .top {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
  }
  @media (min-width: 1000px) {
    .top {
      grid-template-columns: minmax(340px, 420px) minmax(0, 1fr);
      gap: 24px;
    }
  }
  .ringc {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .sumline {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .sh-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 12px;
    margin-bottom: 12px;
  }
  .sh {
    margin: 0;
    font-size: var(--fs-section);
    font-weight: 500;
    line-height: 1.2;
  }
  .sh .quiet {
    margin-left: 8px;
  }
  .quiet {
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .hint {
    margin: 10px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .lk {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    color: var(--accent);
    font-weight: 500;
    text-decoration: none;
  }
  .crow {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    padding: 10px 10px 10px 14px;
    border-radius: 14px;
    background: var(--paper-2);
    color: var(--warn);
  }
  .crow.done {
    color: var(--ok);
  }
  .ct {
    flex: 1;
    min-width: 0;
    color: var(--ink);
    line-height: 1.3;
  }
  .ct b {
    display: block;
    font-weight: 500;
  }
  .ct small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .start {
    min-height: 44px;
    border-color: transparent;
    border-radius: 10px;
    box-shadow: var(--card-shadow);
  }
  .avg {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin-top: 14px;
  }
  .avg small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .bottom {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
  }
  @media (min-width: 1000px) {
    .bottom {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 24px;
    }
  }
  .bars {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .bars li {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 46px;
  }
  .bn {
    width: 84px;
    font-size: var(--fs-small);
  }
  .bs {
    flex: 1;
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 30px;
    border-bottom: 1px solid var(--line);
  }
  .bs i {
    flex: 1;
    border-radius: 3px 3px 0 0;
    background: var(--bar);
  }
  .bs i.last {
    background: var(--accent);
  }
  .bv {
    width: 40px;
    text-align: right;
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: var(--fs-section);
  }
  .rl {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rl li {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    border-top: 1px solid var(--line);
  }
  .rl li:first-child {
    border-top: 0;
  }
  .m {
    flex: 1;
    min-width: 0;
    line-height: 1.3;
  }
  .m b {
    display: block;
    font-weight: 500;
  }
  .m small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .v {
    flex: none;
    text-align: right;
    color: var(--ink);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 18px;
  }
  .foot .btn {
    min-height: 44px;
    border-radius: 12px;
    border-color: var(--line);
  }
  .empty {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .empty p {
    margin: 0;
  }
  .cnt {
    color: var(--ink-3);
    font-weight: 400;
  }
  .acts {
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
  }
  .acts li {
    display: flex;
    align-items: center;
    gap: 4px;
    border-top: 1px solid var(--line);
    background: var(--paper);
  }
  .acts li:first-child {
    border-top: 0;
  }
  .acts li.drag {
    background: var(--paper-2);
  }
  .ar {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    color: var(--ink);
    text-decoration: none;
  }
  .grip {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-3);
    cursor: grab;
    touch-action: none;
  }
  .chev {
    flex: none;
    display: grid;
    place-items: center;
    width: 28px;
    height: 44px;
    color: var(--ink-3);
  }
  .wide-btn {
    min-height: 48px;
    border-radius: 12px;
    border-color: var(--line);
    background: var(--paper);
    font-weight: 500;
  }
</style>
