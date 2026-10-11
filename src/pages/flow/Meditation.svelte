<script>
  /**
   * Hobby pages 2 «Kissenzeit»: the meditation page, short since v0.86.0 «Meditation einfach» (mockup B,
   * Noah «1-5 a» 11.10.2026). #/flow/act/meditation
   *   the head (name, «Kissenzeit», the goal ring), the start card («Wie letztes Mal · {n} Min», or before
   *   the first session «Jetzt starten · {n} Min» with the first template; «Andere Vorlage» chips and
   *   «+ neue»), three rows (Diese Woche → log, Protokoll → log, Nächster Stern → the milestones of
   *   meditation) and one row «Mehr» → #/flow/act/meditation/mehr (MedMore.svelte: sounds, kinds, places
   *   and things, quotes, links, all stars, templates; nothing lost, only folded away).
   * Everything is a suggestion. A session runs in the full view (B7, FlowLayer); the start is shared with
   * the start sheet of «Heute abhaken» (lib/flow/hobby/medstart.js).
   */
  import { ChevronLeft, ChevronRight, Play, Plus, CalendarDays, List, Star, Ellipsis } from '@lucide/svelte';
  import { db } from '../../lib/db.js';
  import { medQuery, seedMed } from '../../lib/flow/data.svelte.js';
  import { actState, addDays } from '../../lib/flow.js';
  import { msContext, actMilestones, evaluate, isOff, newStars } from '../../lib/flowms.js';
  import { daysGrid, streaks, recentSessions, noteOf } from '../../lib/flowmed.js';
  import { saveStars } from '../../lib/flowdb.js';
  import { clockState, actName } from '../../lib/flow/ui.svelte.js';
  import { beginMed, tplStart, medTemplates, lastStart, artOfData } from '../../lib/flow/hobby/medstart.js';
  import { actGoalText, dayShort } from '../../lib/flow/words.js';
  import { tileName, tplName, artName, msName, val, timeShort } from '../../lib/flow/hobby/words.js';
  import { localDay } from '../../lib/localday.js';
  import { t, tn } from '../../lib/i18n.svelte.js';

  let { actId = 'meditation' } = $props();
  const today = localDay();
  const q = $derived(medQuery(actId, today));
  const data = $derived($q);
  $effect(() => {
    seedMed(data, actId);
  });
  const act = $derived(data?.acts.find((a) => a.id === actId) ?? null);
  const st = $derived(act && data ? actState(act, data.log, today, data.tripDays) : null);
  const base = $derived(`#/flow/act/${encodeURIComponent(actId)}`);

  /* milestones (the stars reached are kept for ever) */
  const ctx = $derived(data ? msContext({ acts: data.acts, log: data.log, sessions: data.sessions, today, tripDays: data.tripDays }) : null);
  const stored = $derived(new Map((data?.stars ?? []).map((s) => [s.id, s.day])));
  const ms = $derived(act && ctx ? actMilestones(act).map((m) => ({ ...evaluate(m, ctx, stored, data.tune), off: isOff(m, data.tune) })) : []);
  $effect(() => {
    const fresh = newStars(ms, stored);
    if (fresh.length) saveStars(db, fresh);
  });
  const nextStar = $derived(
    ms
      .filter((r) => !r.off && !r.done)
      .sort((a, b) => b.progress - a.progress)[0] ?? null,
  );

  /* the start */
  const running = $derived(!!clockState.tm);
  const tpls = $derived(medTemplates(data));
  const ls = $derived(data ? lastStart(data, actId) : null);
  const first = $derived(tpls[0] ?? null);
  const main = $derived(ls ? ls.start : first ? tplStart(first) : null);
  const mainTplId = $derived(ls ? ls.last.tplId : first?.id);
  const others = $derived(tpls.filter((x) => x.id !== mainTplId).slice(0, 4));
  const kindName = (id) => {
    const a = artOfData(data, id);
    return a ? artName(a) : '';
  };
  const ago = (day) => (day === today ? t('today') : day === addDays(today, -1) ? t('yesterday') : dayShort(day));
  const mainLine = $derived.by(() => {
    if (!main) return '';
    const parts = [];
    if (main.name) parts.push(`«${main.name}»`);
    if (kindName(main.art)) parts.push(kindName(main.art));
    if (ls?.last.at) parts.push(`${ago(ls.last.day ?? today)} ${timeShort(Date.parse(ls.last.at))}`);
    return parts.join(' · ');
  });
  const startMain = () => main && beginMed(actId, data, main);
  const startTpl = (x) => beginMed(actId, data, tplStart(x));

  /* the three rows */
  const week = $derived(data ? daysGrid(data.log, actId, today, 7) : []);
  const weekDays = $derived(week.filter((g) => g.on).length);
  const weekMin = $derived(week.reduce((a, g) => a + (Number(g.min) || 0), 0));
  const str = $derived(data ? streaks(data.log, actId, today) : { now: 0, longest: 0 });
  const recent = $derived(data ? (recentSessions(data.log, data.sessions, actId, 1)[0] ?? null) : null);
  const recentNote = $derived(recent ? noteOf(recent.s).note : '');
  const pct = (r) => Math.round((r?.progress ?? 0) * 100);
</script>

<div class="med">
  <p class="back"><a href="#/flow/activity"><ChevronLeft size={16} aria-hidden="true" />{t('Activity|tab')}</a></p>

  {#if data && !act}
    <section class="surf pad">
      <h1 class="h1" tabindex="-1" data-page-title>{t('Activity|tab')}</h1>
      <p class="hint">{t('This activity has no page of its own yet.')} <a href="#/flow/edit/{encodeURIComponent(actId)}?from=activity">{t('Open the activity')}</a></p>
    </section>
  {:else if data && act}
    <header class="head">
      <div class="ht">
        <h1 class="h1" tabindex="-1" data-page-title>{actName(act)}</h1>
        <p class="sub">{#if tileName(act) !== actName(act)}«{tileName(act)}»{' · '}{/if}{t('Goal|flow')} {actGoalText(act, today)}</p>
      </div>
      {#if st && !st.resting}
        {@const f = st.stand.of ? Math.min(1, st.stand.n / st.stand.of) : 0}
        <span class="gring" role="img" aria-label={t('Goal: {n} of {m}', { n: st.stand.n, m: st.stand.of })}>
          <svg viewBox="0 0 48 48" aria-hidden="true"><circle class="rb" cx="24" cy="24" r="20" />{#if f > 0}<circle class="rf" cx="24" cy="24" r="20" pathLength="100" stroke-dasharray="{Math.round(f * 100)} 100" />{/if}</svg>
          <b class="num">{st.stand.n}/{st.stand.of}</b>
        </span>
      {/if}
    </header>

    <div class="cols">
      <section class="surf pad startc" aria-label={t('Start|session')}>
        {#if main}
          <button type="button" class="btn hi go" onclick={startMain} data-start={ls ? 'last' : 'first'}>
            <Play size={22} aria-hidden="true" />
            {#if running}{t('Open the running session')}{:else if ls}{t('Like last time · {n} min', { n: main.minutes })}{:else}{t('Start now · {n} min', { n: main.minutes })}{/if}
          </button>
          {#if mainLine}<p class="ml">{mainLine}</p>{/if}
        {:else}
          <a class="btn hi go" href="{base}/timer?new=1">{t('Set the clock')}</a>
        {/if}
        <p class="cap">{t('Other template')}</p>
          <div class="tchips">
            {#each others as x (x.id)}
              <button type="button" class="tchip" aria-label={t('Start {name}', { name: tplName(x) })} onclick={() => startTpl(x)} data-tpl={x.id}><Play size={16} aria-hidden="true" />{tplName(x)}</button>
            {/each}
            <a class="tchip new" href="{base}/timer?new=1" data-to="new-tpl"><Plus size={16} aria-hidden="true" />{t('new|template')}</a>
          </div>
      </section>

      <div class="side">
        <ul class="surf rows">
          <li>
            <a class="row" href="{base}/log" data-row="week">
              <span class="ri ok" aria-hidden="true"><CalendarDays size={20} /></span>
              <span class="rt"><b>{t('This week')}</b><small class="num">{t('{n} of 7 days', { n: weekDays })} · {t('{n} min', { n: weekMin })} · {tn(str.now, 'streak {n} day', 'streak {n} days')}</small></span>
              <ChevronRight size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <a class="row" href="{base}/log" data-row="log">
              <span class="ri ok" aria-hidden="true"><List size={20} /></span>
              <span class="rt"><b>{t('Log')}</b><small>{#if recent}{t('last: {when}, {n} min', { when: ago(recent.e.day), n: Math.round(Number(recent.e.min) || 0) })}{#if recentNote}{' · '}«{recentNote}»{/if}{:else}{t('no session yet')}{/if}</small></span>
              <ChevronRight size={18} aria-hidden="true" />
            </a>
          </li>
          {#if nextStar}
            <li>
              <a class="row" href="#/flow/milestones?act={encodeURIComponent(actId)}" data-row="star">
                <span class="ri warn" aria-hidden="true"><Star size={20} /></span>
                <span class="rt">
                  <b>{t('Next star: {name}', { name: msName(nextStar.m) })}</b>
                  <small>{t('{n} to go', { n: val(Math.max(0, Math.round((nextStar.target - nextStar.value) * 10) / 10), nextStar.m.unit) })}</small>
                  <span class="bar" role="progressbar" aria-label={msName(nextStar.m)} aria-valuemin="0" aria-valuemax="100" aria-valuenow={pct(nextStar)}><i style:width="{pct(nextStar)}%"></i></span>
                </span>
                <ChevronRight size={18} aria-hidden="true" />
              </a>
            </li>
          {/if}
        </ul>

        <a class="surf row more" href="{base}/mehr" data-to="more">
          <span class="ri" aria-hidden="true"><Ellipsis size={20} /></span>
          <span class="rt"><b>{t('More')}</b><small>{t('Kinds · sounds · places and things · quotes · links · all stars')}</small></span>
          <ChevronRight size={18} aria-hidden="true" />
        </a>
      </div>
    </div>
  {/if}
</div>

<style>
  .med {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-width: 1328px;
    margin: 0 auto;
    min-width: 0;
  }
  .back {
    margin: 0;
  }
  .back a {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    color: var(--accent);
    text-decoration: none;
    font-size: var(--fs-small);
  }
  .pad {
    padding: 16px 18px;
    min-width: 0;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 12px 16px;
  }
  .ht {
    flex: 1 1 auto;
    min-width: 0;
  }
  .h1 {
    margin: 0;
    font: 800 var(--fs-page)/1.1 var(--font-brand);
  }
  .sub {
    margin: 4px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .gring {
    position: relative;
    flex: none;
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
  }
  .gring svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }
  .gring circle {
    fill: none;
    stroke-width: 5;
  }
  .gring .rb {
    stroke: var(--ok-soft);
  }
  .gring .rf {
    stroke: var(--accent);
    stroke-linecap: round;
  }
  .gring b {
    font: 800 var(--fs-small) var(--font-brand);
  }
  .cols {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
    align-items: start;
  }
  @media (min-width: 960px) {
    .cols {
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
      gap: 18px;
    }
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }
  .go {
    width: 100%;
    min-height: 64px;
    justify-content: center;
    gap: 10px;
    border-radius: 14px;
    font: 700 var(--fs-sub)/1.2 var(--font-body);
    text-decoration: none;
  }
  .ml {
    margin: 10px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-align: center;
  }
  .cap {
    margin: 16px 0 10px;
    color: var(--ink);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .tchips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .tchip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 16px;
    border: 1.5px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-body)/1.2 var(--font-body);
    text-decoration: none;
    cursor: pointer;
  }
  .tchip.new {
    border-style: dashed;
    color: var(--ink-2);
    font-weight: 500;
  }
  .rows {
    margin: 0;
    padding: 4px 18px;
    list-style: none;
  }
  .rows li + li {
    border-top: 1px solid var(--line);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 64px;
    padding: 10px 0;
    color: var(--ink);
    text-decoration: none;
  }
  .row.more {
    padding: 10px 18px;
  }
  .row > :global(svg) {
    flex: none;
    color: var(--ink-2);
  }
  .ri {
    flex: none;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .ri.ok {
    background: var(--ok-soft);
    color: var(--accent);
  }
  .ri.warn {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .rt {
    flex: 1;
    min-width: 0;
    line-height: 1.35;
  }
  .rt b {
    display: block;
    font-weight: 600;
  }
  .rt small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .bar {
    display: block;
    height: 6px;
    margin: 8px 0 2px;
    border-radius: 3px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    background: var(--accent);
  }
  .hint {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
