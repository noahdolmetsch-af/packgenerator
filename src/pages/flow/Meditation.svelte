<script>
  /**
   * «Meditation» (mockup ME2, Noah 13.10.2026 «1a 2a 3a 4b 5b», approved «ME1-ME3 und Z1-Z5 freigeben»):
   * a tab of Aktiv (the second, Noah 15.10.2026 «1a»), #/flow/act/meditation. One page, timer and Rückblick side by side:
   *   Timer: the clock as it will look (the face chosen for meditation, Z3), the start («Wie letztes Mal ·
   *   {n} Min», before the first session «Jetzt starten · {n} Min»), the durations 10–60 and «eigene», the
   *   templates and «+ neue», and three rows (Klänge, Art, Uhr).
   *   Rückblick: days in a row, the last 7 days, the minutes and the average depth, the week as dots and the
   *   last sessions («Alles ansehen» → …/rueckblick, ME3), the next star, and «Mehr» (MedMore.svelte).
   * Before (hobby pages 2, v0.86.0 «Meditation einfach»): the page was reached from Aktivität and called
   * «Kissenzeit»; the name is «Meditation» everywhere now (Noah 3a).
   * Everything is a suggestion. A session runs in the full view (B7, FlowLayer); the start is shared with
   * the start sheet of «Heute abhaken» (lib/flow/hobby/medstart.js).
   */
  import HintCard from '../../lib/pageinfo/HintCard.svelte';
  import PageMore from '../../lib/pageinfo/PageMore.svelte';
  import TipLine from '../../lib/pageinfo/TipLine.svelte';
  import { ChevronRight, Play, Plus, Star, Ellipsis, Bell, Flower2, Clock } from '@lucide/svelte';
  import Face from '../../lib/timer/Face.svelte';
  import { db } from '../../lib/db.js';
  import { medQuery, seedMed } from '../../lib/flow/data.svelte.js';
  import { actState, addDays } from '../../lib/flow.js';
  import { msContext, actMilestones, evaluate, isOff, newStars } from '../../lib/flowms.js';
  import { daysGrid, streaks, recentSessions, noteOf, MED_DURATIONS, CLOCK_KEY, clockPrefOf, bowlWords } from '../../lib/flowmed.js';
  import { saveStars } from '../../lib/flowdb.js';
  import { clockState, actName } from '../../lib/flow/ui.svelte.js';
  import { beginMed, tplStart, medTemplates, lastStart, artOfData, startLine } from '../../lib/flow/hobby/medstart.js';
  import { actGoalText, dayShort, wd } from '../../lib/flow/words.js';
  import { tplName, artName, msName, val, timeShort } from '../../lib/flow/hobby/words.js';
  import { prefsOf, PREFS_KEY } from '../../lib/timer.js';
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

  /* the clock as it will look: the face for meditation (Z3 «nur Meditation»), else the session's clock */
  let face = $state('ring');
  $effect(() => {
    Promise.all([db.settings.get(PREFS_KEY), db.settings.get(CLOCK_KEY)])
      .then(([p, c]) => {
        const v = clockPrefOf(c?.value).view;
        const own = prefsOf(p?.value).faces.meditation;
        face = own ?? (v === 'digits' ? 'digital' : v);
      })
      .catch(() => {});
  });

  /* the start */
  const running = $derived(!!clockState.tm);
  const tpls = $derived(medTemplates(data));
  const ls = $derived(data ? lastStart(data, actId) : null);
  const first = $derived(tpls[0] ?? null);
  const main = $derived(ls ? ls.start : first ? tplStart(first) : null);
  const mainTplId = $derived(ls ? ls.last.tplId : first?.id);
  const others = $derived(tpls.filter((x) => x.id !== mainTplId).slice(0, 4));
  let mins = $state(null);
  const minutes = $derived(mins ?? main?.minutes ?? 20);
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
  const gong = $derived.by(() => {
    if (!main) return '';
    const w = bowlWords(main.bowl);
    return t('Gong {when}', { when: t(w.key, w.vars) });
  });
  const startMain = () => main && beginMed(actId, data, { ...main, minutes });
  const startTpl = (x) => beginMed(actId, data, tplStart(x));

  /* the Rückblick */
  const week = $derived(data ? daysGrid(data.log, actId, today, 7) : []);
  const weekDays = $derived(week.filter((g) => g.on).length);
  const weekMin = $derived(week.reduce((a, g) => a + (Number(g.min) || 0), 0));
  const str = $derived(data ? streaks(data.log, actId, today) : { now: 0, longest: 0 });
  const doneToday = $derived(!!week.at(-1)?.on);
  const recent = $derived(data ? recentSessions(data.log, data.sessions, actId, 3) : []);
  const depth = $derived.by(() => {
    const from = addDays(today, -6);
    const d = recent.length ? recentSessions(data.log, data.sessions, actId, 50).filter((r) => r.e.day >= from).map((r) => noteOf(r.s).depth).filter(Boolean) : [];
    return d.length ? Math.round((d.reduce((a, x) => a + x, 0) / d.length) * 10) / 10 : null;
  });
  const hm = (min) => {
    const m = Math.round(min);
    return m >= 60 ? t('{h} h {m}', { h: Math.floor(m / 60), m: String(m % 60).padStart(2, '0') }) : t('{n} min', { n: m });
  };
  const tplOf = (id) => (id ? tpls.find((x) => x.id === id) : null);
  const pct = (r) => Math.round((r?.progress ?? 0) * 100);
  let depthHelp = $state(false);
</script>

<div class="med">
  {#if data && !act}
    <section class="surf pad">
      <h1 class="h1" tabindex="-1" data-page-title>{t('Activity|tab')}</h1>
      <p class="hint">{t('This activity has no page of its own yet.')} <a href="#/flow/edit/{encodeURIComponent(actId)}?from=activity">{t('Open the activity')}</a></p>
    </section>
  {:else if data && act}
    <header class="head" class:intro={actId === 'meditation'}>
      <h1 class="h1" tabindex="-1" data-page-title>{actName(act)}</h1>
      <p class="sub">
        {t('Goal|flow')} {actGoalText(act, today)}{#if str.now}{' · '}{tn(str.now, 'streak {n} day', 'streak {n} days')}{/if}{' · '}{doneToday ? t('done today') : t('still open today')}{#if st?.resting}{' · '}{t('resting')}{/if}
      </p>
    </header>

    <!-- IF2 (Noah 14.10.2026, approved 04:32) on the central meditation page: the tip of the day, at the end the fold -->
    <!-- Noah 19.10 «2a»: one card per page; the Einstieg lives in the card «Was hier steht» (its own card only while the page is empty) -->
    <HintCard page="meditation" intro={actId === 'meditation' ? 'meditation' : null} />
    <TipLine page="meditation" name={actName(act)} />
    <div class="cols">
      <section class="surf pad tcard" aria-labelledby="m-timer">
        <div class="hl"><h2 id="m-timer" class="h2">{t('Timer')}</h2>{#if main?.name}<p>{t('Template «{name}»', { name: main.name })}</p>{/if}</div>
        {#if main}
          <div class="dial"><Face {face} sec={minutes * 60} frac={0} fmt="auto" size="m" sub={gong} label={t('{n} min', { n: minutes })} /></div>
          <button type="button" class="btn hi go" onclick={startMain} data-start={ls ? 'last' : 'first'}>
            <Play size={22} aria-hidden="true" />
            {#if running}{t('Open the running session')}{:else if mins != null && mins !== main.minutes}{t('Start · {n} min', { n: minutes })}{:else if ls}{t('Like last time · {n} min', { n: main.minutes })}{:else}{t('Start now · {n} min', { n: main.minutes })}{/if}
          </button>
          {#if mainLine}<p class="ml">{mainLine}</p>{/if}
        {:else}
          <a class="btn hi go" href="{base}/timer?new=1">{t('Set the clock')}</a>
        {/if}
        <p class="cap" id="m-dur">{t('Duration')}</p>
        <div class="tchips" role="group" aria-labelledby="m-dur">
          {#each MED_DURATIONS as n (n)}
            <button type="button" class="tchip d" class:on={minutes === n} aria-pressed={minutes === n} onclick={() => (mins = n)} data-dur={n}>{n}</button>
          {/each}
          <a class="tchip new" href="{base}/timer?new=1">{t('own|duration')}</a>
        </div>
        <p class="cap">{t('Templates')}</p>
        <div class="tchips">
          {#each others as x (x.id)}
            <button type="button" class="tchip" aria-label={t('Start {name}', { name: tplName(x) })} onclick={() => startTpl(x)} data-tpl={x.id}><Play size={16} aria-hidden="true" />{tplName(x)}</button>
          {/each}
          <a class="tchip new" href="{base}/timer?new=1" data-to="new-tpl"><Plus size={16} aria-hidden="true" />{t('new|template')}</a>
        </div>
        <ul class="opts">
          <li><a class="row" href="{base}/timer?new=1" data-opt="sounds"><span class="ri" aria-hidden="true"><Bell size={18} /></span><span class="rt"><b>{t('Sounds')}</b><small>{main ? startLine({ ...main, name: null }) : ''}</small></span><span class="v">{t('Change')}<ChevronRight size={16} aria-hidden="true" /></span></a></li>
          <li><a class="row" href="{base}/mehr" data-opt="kind"><span class="ri" aria-hidden="true"><Flower2 size={18} /></span><span class="rt"><b>{t('Kind|meditation')}</b><small>{(main && kindName(main.art)) || t('none chosen')}</small></span><span class="v">{t('Change')}<ChevronRight size={16} aria-hidden="true" /></span></a></li>
          <li><a class="row" href="#/timer/faces?scope=meditation" data-opt="clock"><span class="ri" aria-hidden="true"><Clock size={18} /></span><span class="rt"><b>{t('Clock')}</b><small>{t('Ring · hourglass · moon · digits')}</small></span><span class="v">{t('Change')}<ChevronRight size={16} aria-hidden="true" /></span></a></li>
        </ul>
      </section>

      <div class="side">
        <section class="surf pad" aria-labelledby="m-review">
          <div class="hl"><h2 id="m-review" class="h2">{t('Look back|page')}</h2><a href="{base}/rueckblick" data-to="review">{t('See everything')}<ChevronRight size={16} aria-hidden="true" /></a></div>
          {#if !recent.length}
            <!-- Impeccable runde 2 (onboard): before the first session one sentence instead of four zeros and seven empty circles -->
            <p class="first" data-review-empty>{t('No session yet. After your first meditation you see your streak here, the minutes of the week and how deep it was.')}</p>
          {:else}
          <div class="stats">
            <div><b class="num">{str.now}</b><small>{t('days in a row')}</small></div>
            <div><b class="num">{weekDays}/7</b><small>{t('last 7 days')}</small></div>
            <div><b class="num">{hm(weekMin)}</b><small>{t('last 7 days')}</small></div>
            <!-- Impeccable runde 2 (clarify): «Ø Tiefe (1–5)», a tap explains where the number comes from -->
            <button type="button" class="dq" aria-expanded={depthHelp} aria-controls="m-depth-help" onclick={() => (depthHelp = !depthHelp)} data-depth><b class="num">{depth ?? '–'}</b><small>{t('avg. depth (1–5)')} <span class="qm" aria-hidden="true">?</span></small></button>
          </div>
          {#if depthHelp}<p class="dhelp" id="m-depth-help" role="note">{t('Your own rating after each session, from 1 (restless) to 5 (very deep).')}</p>{/if}
          <a class="wk" href="{base}/log" data-row="week" aria-label={t('{n} of 7 days', { n: weekDays })}>
            {#each week as g (g.day)}<span class="wd" class:on={g.on} class:today={g.day === today}><i aria-hidden="true"></i><small>{wd(g.day)}</small></span>{/each}
            <span class="sr">{t('{n} of 7 days', { n: weekDays })} · {t('{n} min', { n: weekMin })}</span>
          </a>
          <div class="sh2"><p class="cap">{t('Last sessions')}</p><a href="{base}/log" data-to="log">{t('Logbook')}<ChevronRight size={16} aria-hidden="true" /></a></div>
          <ul class="ses" data-row="log">
            {#each recent as r (r.e.id)}
              {@const n = noteOf(r.s)}
              {@const x = tplOf(r.s?.tplId)}
              <li>
                <a href="{base}/s/{encodeURIComponent(r.e.id)}" class="srow">
                  <span class="d"><b>{wd(r.e.day)}</b>{dayShort(r.e.day)}</span>
                  <span class="rt"><b>{x ? tplName(x) : actName(act)}</b><small>{[kindName(r.s?.art), r.e.at ? timeShort(Date.parse(r.e.at)) : ''].filter(Boolean).join(' · ')}{#if n.depth}{' · '}{t('depth {n} of 5', { n: n.depth })}{/if}</small>{#if n.note}<em>«{n.note}»</em>{/if}</span>
                  <b class="m num">{Math.round(Number(r.e.min) || 0)}′</b>
                </a>
              </li>
            {/each}
          </ul>
          {/if}
        </section>

        {#if nextStar}
          <a class="surf pad row star" href="#/flow/milestones?act={encodeURIComponent(actId)}" data-row="star">
            <span class="ri warn" aria-hidden="true"><Star size={20} /></span>
            <span class="rt">
              <b>{t('Next star: {name}', { name: msName(nextStar.m) })}</b>
              <small>{t('{n} to go', { n: val(Math.max(0, Math.round((nextStar.target - nextStar.value) * 10) / 10), nextStar.m.unit) })}</small>
              <span class="bar" role="progressbar" aria-label={msName(nextStar.m)} aria-valuemin="0" aria-valuemax="100" aria-valuenow={pct(nextStar)}><i style:width="{pct(nextStar)}%"></i></span>
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </a>
        {/if}

        <a class="surf row more" href="{base}/mehr" data-to="more">
          <span class="ri" aria-hidden="true"><Ellipsis size={20} /></span>
          <span class="rt"><b>{t('More')}</b><small>{t('Kinds · sounds · places and things · quotes · links · all stars')}</small></span>
          <ChevronRight size={18} aria-hidden="true" />
        </a>
      </div>
    </div>
    <PageMore page="meditation" name={actName(act)} {base} />
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
  .pad {
    padding: 16px 18px;
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
  .h2 {
    margin: 0;
    font: 700 var(--fs-sub)/1.2 var(--font-brand);
  }
  .hl,
  .sh2 {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }
  .hl p {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .hl a,
  .sh2 a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    min-width: 44px;
    color: var(--ink);
    text-decoration: none;
    font-size: var(--fs-small);
    font-weight: 500;
  }
  .sh2 .cap {
    margin: 16px 0 4px;
  }
  .dial {
    display: flex;
    justify-content: center;
    margin: 6px 0 12px;
  }
  .tchip.d {
    min-width: 52px;
    justify-content: center;
  }
  .tchip.on {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .opts {
    margin: 14px 0 0;
    padding: 0;
    list-style: none;
  }
  .opts li + li {
    border-top: 1px solid var(--line);
  }
  .opts .row {
    min-height: 56px;
    padding: 6px 0;
  }
  .v {
    display: inline-flex;
    align-items: center;
    flex: none;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    margin: 12px 0 4px;
  }
  @media (max-width: 480px) {
    .stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .stats b {
    display: block;
    font: 800 var(--fs-section)/1.1 var(--font-brand);
  }
  .stats small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  /* Impeccable runde 2: the depth cell is a button that explains the number */
  .dq {
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .qm {
    display: inline-grid;
    place-items: center;
    width: 18px;
    height: 18px;
    margin-left: 2px;
    border: 1px solid var(--line-strong);
    border-radius: 50%;
    font-weight: 600;
    line-height: 1;
  }
  .dq[aria-expanded='true'] .qm {
    background: var(--ink);
    color: var(--paper);
  }
  .dhelp,
  .first {
    margin: 8px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .first {
    margin: 12px 0 4px;
    font-size: var(--fs-body);
  }
  .wk {
    position: relative;
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 4px;
    margin-top: 12px;
    padding: 6px 0;
    color: var(--ink-2);
    text-decoration: none;
  }
  .wd {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: var(--fs-small);
  }
  .wd i {
    width: 26px;
    height: 26px;
    border: 2px solid var(--line-strong);
    border-radius: 50%;
  }
  .wd.on i {
    border-color: var(--accent);
    background: var(--accent);
  }
  .wd.today small {
    color: var(--ink);
    font-weight: 700;
  }
  .ses {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .ses li + li {
    border-top: 1px solid var(--line);
  }
  .srow {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-height: 56px;
    padding: 8px 0;
    color: var(--ink);
    text-decoration: none;
  }
  .srow .d {
    flex: none;
    width: 58px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.3;
  }
  .srow .d b {
    display: block;
    color: var(--ink);
  }
  .srow em {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .srow .m {
    flex: none;
    font: 700 var(--fs-body) var(--font-brand);
  }
  .row.star {
    padding: 12px 18px;
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
  /* «Einstieg» (Noah «4a»): the round «i» sits in the corner of the head */
  .head.intro {
    position: relative;
  }
  .head.intro h1 {
    padding-right: 52px;
  }
</style>
