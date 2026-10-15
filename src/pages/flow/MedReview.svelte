<script>
  /**
   * «Meditation» › Rückblick (mockup ME3, Noah 13.10.2026, approved «ME1-ME3 und Z1-Z5 freigeben»).
   * #/flow/act/meditation/rueckblick: all sessions on one page, by week, month or year (‹ › for earlier
   * ones), filtered by kind and template. The numbers on top, minutes per week with the goal line, the
   * calendar (by day; for a year by month), «Was dir hilft» (observation only) and the notes.
   * The log with its list and filters stays (…/log, «Logbuch»); this page puts the overview in one place.
   */
  import { ChevronLeft, ChevronRight, Clock, Bell, Flower2 } from '@lucide/svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import { medQuery, seedMed } from '../../lib/flow/data.svelte.js';
  import { activeGoals } from '../../lib/flow.js';
  import { streaks, artsOf, sortTemplates } from '../../lib/flowmed.js';
  import { lastStart, artOfData } from '../../lib/flow/hobby/medstart.js';
  import { actName } from '../../lib/flow/ui.svelte.js';
  import { reviewRows, filterReview, periodOf, periodStats, weekBars, monthBars, periodDays, weekGoalMin, helps, RANGES } from '../../lib/medreview.js';
  import { tplName, artName, monthWord, timeShort } from '../../lib/flow/hobby/words.js';
  import { dayShort, wd } from '../../lib/flow/words.js';
  import { localDay } from '../../lib/localday.js';
  import { t, locale } from '../../lib/i18n.svelte.js';

  let { actId = 'meditation' } = $props();
  const today = localDay();
  const q = $derived(medQuery(actId, today));
  const data = $derived($q);
  $effect(() => {
    seedMed(data, actId);
  });
  const act = $derived(data?.acts.find((a) => a.id === actId) ?? null);
  const base = $derived(`#/flow/act/${encodeURIComponent(actId)}`);

  let range = $state('month');
  let back = $state(0);
  let art = $state('');
  let tpl = $state('');

  const all = $derived(data ? reviewRows(data.log, data.sessions, actId) : []);
  const rows = $derived(filterReview(all, { art: art || null, tpl: tpl || null }));
  const p = $derived(periodOf(range, today, back));
  const inP = $derived(rows.filter((r) => r.day >= p.from && r.day <= p.to));
  const ps = $derived(periodStats(rows, p, today));
  const str = $derived(data ? streaks(data.log, actId, today) : { now: 0, longest: 0 });
  const bars = $derived(weekBars(rows, p.to < today ? p.to : today, 8));
  const usual = $derived(data ? (lastStart(data, actId)?.start.minutes ?? act?.minMin ?? 0) : 0);
  const goal = $derived(act ? weekGoalMin(activeGoals(act, today), usual) : null);
  const max = $derived(Math.max(goal ?? 0, ...bars.map((b) => b.min), 1));
  const cal = $derived(range === 'year' ? [] : periodDays(rows, p, today));
  const months = $derived(range === 'year' ? monthBars(rows, Number(p.key)) : []);
  const mMax = $derived(Math.max(1, ...months.map((m) => m.min)));
  const kindName = (id) => {
    const a = artOfData(data, id);
    return a ? artName(a) : '';
  };
  const help = $derived(helps(inP.length >= 4 ? inP : rows, kindName));
  const notes = $derived(inP.filter((r) => r.note).slice(0, 4));
  const kinds = $derived(data ? artsOf(data.arts).all : []);
  const tpls = $derived(sortTemplates(data?.tpls ?? []));
  const tplOf = (id) => (id ? tpls.find((x) => x.id === id) : null);

  const hm = (min) => (min >= 60 ? t('{h} h {m}', { h: Math.floor(min / 60), m: String(min % 60).padStart(2, '0') }) : t('{n} min', { n: min }));
  const RANGE_NAME = { week: 'Week', month: 'Month', year: 'Year' };
  const title = $derived.by(() => {
    if (range === 'year') return p.key;
    if (range === 'month') return new Date(`${p.from}T00:00:00Z`).toLocaleDateString(locale(), { month: 'long', year: p.from.slice(0, 4) === today.slice(0, 4) ? undefined : 'numeric', timeZone: 'UTC' });
    return t('{from} to {to}', { from: dayShort(p.from), to: dayShort(p.to) });
  });
  const kw = (day) => {
    const d = new Date(`${day}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
    const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
    return 1 + Math.round((d - y) / 864e5 / 7 - 0.5 + ((y.getUTCDay() + 6) % 7) / 7);
  };
  const HELP_ICON = { morning: Clock, gong: Bell, kind: Flower2 };
  const pick = (r) => {
    range = r;
    back = 0;
  };
</script>

<div class="rv">
  <Crumb path={[{ href: base, label: act ? actName(act) : t('Meditation') }]} here={t('Look back|page')} />
  <h1 class="h1" tabindex="-1" data-page-title>{t('Look back|page')}</h1>
  <p class="sub">{t('All sessions at a glance')}</p>

  <div class="bar">
    <div class="seg" role="radiogroup" aria-label={t('Period')}>
      {#each RANGES as r (r)}<button type="button" role="radio" class:on={range === r} aria-checked={range === r} onclick={() => pick(r)} data-range={r}>{t(RANGE_NAME[r])}</button>{/each}
    </div>
    <label class="pick"><span class="sr">{t('Kind|meditation')}</span>
      <select bind:value={art} data-filter="art">
        <option value="">{t('All kinds')}</option>
        {#each kinds as k (k.id)}<option value={k.id}>{artName(k)}</option>{/each}
      </select>
    </label>
    <label class="pick"><span class="sr">{t('Template')}</span>
      <select bind:value={tpl} data-filter="tpl">
        <option value="">{t('All templates')}</option>
        {#each tpls as x (x.id)}<option value={x.id}>{tplName(x)}</option>{/each}
      </select>
    </label>
  </div>

  <div class="per">
    <button type="button" class="nav" onclick={() => back++} aria-label={t('Earlier')} data-back><ChevronLeft size={20} aria-hidden="true" /></button>
    <h2 class="h2" data-period={p.key}>{title}</h2>
    <button type="button" class="nav" onclick={() => (back = Math.max(0, back - 1))} disabled={back === 0} aria-label={t('Later')}><ChevronRight size={20} aria-hidden="true" /></button>
  </div>

  <div class="stats" data-stats>
    <div><b class="num">{str.now}</b><small>{t('days in a row · record {n}', { n: str.longest })}</small></div>
    <div><b class="num">{ps.days}/{ps.of}</b><small>{t('days with a session')}</small></div>
    <div><b class="num">{hm(ps.min)}</b><small>{t('together')}</small></div>
    <div><b class="num">{ps.longest}′</b><small>{t('longest session')}</small></div>
  </div>

  <div class="cols">
    <div class="col">
      <section class="surf pad" aria-labelledby="rv-weeks">
        <div class="hl"><h2 id="rv-weeks" class="h2">{t('Minutes per week')}</h2><p>{t('last 8 weeks')}</p></div>
        <div class="wb" role="img" aria-label={bars.map((b) => `${t('CW {n}', { n: kw(b.week) })}: ${t('{n} min', { n: b.min })}`).join(', ')}>
          {#if goal}<span class="goal" style:bottom="{(goal / max) * 100}%"><small>{t('Goal {n} min', { n: goal })}</small></span>{/if}
          {#each bars as b, i (b.week)}
            <span class="wcol"><i class:now={i === bars.length - 1} style:height="{(b.min / max) * 100}%"></i><small>{t('CW {n}', { n: kw(b.week) })}</small></span>
          {/each}
        </div>
      </section>

      <section class="surf pad" aria-labelledby="rv-cal">
        <div class="hl"><h2 id="rv-cal" class="h2">{title}</h2><p>{range === 'year' ? t('{n} days · {time}', { n: ps.days, time: hm(ps.min) }) : t('{n} of {m} days · {time}', { n: ps.days, m: ps.of, time: hm(ps.min) })}</p></div>
        {#if range === 'year'}
          <div class="mb">
            {#each months as m (m.month)}
              <span class="mcol" title={t('{n} min', { n: m.min })}><i style:height="{(m.min / mMax) * 100}%"></i><small>{monthWord(`${m.month}-01`)}</small></span>
            {/each}
          </div>
        {:else}
          <div class="cal" data-cal>
            {#each cal.slice(0, 7) as c, i (i)}<span class="h">{c ? wd(c.day) : ''}</span>{/each}
            {#each cal as c, i (i)}
              {#if c}<i class="l{c.level}" class:fut={c.future} class:today={c.day === today} title={t('{n} min', { n: c.min })} data-day={c.day}>{Number(c.day.slice(8))}</i>{:else}<i class="e"></i>{/if}
            {/each}
          </div>
          <p class="legend">{t('less')} <i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i> {t('more minutes')}</p>
        {/if}
      </section>
    </div>

    <div class="col">
      <section class="surf pad" aria-labelledby="rv-help">
        <div class="hl"><h2 id="rv-help" class="h2">{t('What helps you')}</h2><p>{t('observation only')}</p></div>
        {#each help as h (h.id)}
          {@const Icon = HELP_ICON[h.id]}
          <div class="opt" data-help={h.id}><span class="ri" aria-hidden="true"><Icon size={18} /></span><span class="rt"><b>{t(h.key)}</b><small>{t(h.sub, h.vars)}</small></span></div>
        {:else}
          <p class="hint">{t('After a few sessions with depth and time, this shows what goes with deeper or longer sessions.')}</p>
        {/each}
      </section>

      <section class="surf pad" aria-labelledby="rv-notes">
        <div class="hl"><h2 id="rv-notes" class="h2">{t('Notes')}</h2><a href="{base}/log?view=list&note=1">{t('All|notes')}<ChevronRight size={16} aria-hidden="true" /></a></div>
        <ul class="ses">
          {#each notes as r (r.id)}
            {@const x = tplOf(r.tplId)}
            <li>
              <a class="srow" href="{base}/s/{encodeURIComponent(r.id)}">
                <span class="d"><b>{wd(r.day)}</b>{dayShort(r.day)}</span>
                <span class="rt"><b>{x ? tplName(x) : act ? actName(act) : ''}</b><small>{[kindName(r.art), r.at ? timeShort(Date.parse(r.at)) : ''].filter(Boolean).join(' · ')}</small><em>«{r.note}»</em></span>
                <b class="m num">{Math.round(r.min)}′</b>
              </a>
            </li>
          {:else}
            <li class="hint">{t('No notes in this period.')}</li>
          {/each}
        </ul>
      </section>
    </div>
  </div>
</div>

<style>
  .rv {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-width: 1328px;
    margin: 0 auto;
    min-width: 0;
  }
  .h1 {
    margin: 0;
    font: 800 var(--fs-page)/1.1 var(--font-brand);
  }
  .sub {
    margin: -6px 0 0;
    color: var(--ink-2);
  }
  .h2 {
    margin: 0;
    font: 700 var(--fs-sub)/1.2 var(--font-brand);
  }
  .pad {
    padding: 16px 18px;
    min-width: 0;
  }
  .bar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    align-items: center;
  }
  .seg {
    display: inline-flex;
    padding: 3px;
    border-radius: 999px;
    background: var(--paper-2);
  }
  .seg button {
    min-height: 44px;
    padding: 0 16px;
    border: 0;
    border-radius: 999px;
    background: none;
    color: var(--ink-2);
    font: 500 var(--fs-body)/1.2 var(--font-body);
    cursor: pointer;
  }
  .seg button.on {
    background: var(--paper);
    color: var(--ink);
    font-weight: 600;
    box-shadow: 0 1px 3px var(--shadow);
  }
  .pick select {
    min-height: 44px;
    max-width: 100%;
    padding: 0 12px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
  }
  .per {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .nav {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .nav:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }
  @media (max-width: 600px) {
    .stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .stats > div {
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--paper);
    box-shadow: 0 1px 3px var(--shadow);
  }
  .stats b {
    display: block;
    font: 800 var(--fs-section)/1.1 var(--font-brand);
  }
  .stats small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .cols {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
    align-items: start;
  }
  @media (min-width: 1100px) {
    .cols {
      grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
    }
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }
  .hl {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;
  }
  .hl p {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .hl a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    min-width: 44px;
    color: var(--ink);
    text-decoration: none;
    font-size: var(--fs-small);
    font-weight: 500;
  }
  .wb,
  .mb {
    position: relative;
    display: flex;
    align-items: flex-end;
    gap: 8px;
    height: 170px;
    padding-bottom: 22px;
  }
  .wcol,
  .mcol {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    height: 100%;
    min-width: 0;
  }
  .wcol i,
  .mcol i {
    display: block;
    width: 100%;
    max-width: 44px;
    min-height: 2px;
    border-radius: 5px;
    background: var(--ok-soft);
  }
  .wcol i.now,
  .mcol i {
    background: var(--accent);
  }
  .wcol small,
  .mcol small {
    position: absolute;
    bottom: -20px;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    white-space: nowrap;
  }
  .goal {
    position: absolute;
    left: 0;
    right: 0;
    margin-bottom: 22px;
    border-top: 1.5px dashed var(--warn);
    pointer-events: none;
    z-index: 1;
  }
  .goal small {
    position: absolute;
    top: -18px;
    left: 2px;
    color: var(--warn);
    font-size: var(--fs-tiny);
  }
  .cal {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 4px;
  }
  .cal .h {
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-align: center;
  }
  .cal i {
    display: grid;
    place-items: center;
    min-height: 40px;
    border-radius: 8px;
    font-style: normal;
    font-size: var(--fs-small);
  }
  .cal i.e {
    background: none;
  }
  .l0 {
    background: var(--paper-2);
  }
  .l1 {
    background: color-mix(in srgb, var(--accent) 22%, var(--paper));
  }
  .l2 {
    background: color-mix(in srgb, var(--accent) 45%, var(--paper));
  }
  .l3 {
    background: var(--accent);
    color: var(--paper);
  }
  .cal i.fut {
    background: none;
    color: var(--ink-3);
  }
  .cal i.today {
    outline: 2px solid var(--ink);
    outline-offset: -2px;
  }
  .legend {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 10px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .legend i {
    width: 14px;
    height: 14px;
    border-radius: 3px;
  }
  .opt {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
  }
  .opt + .opt {
    border-top: 1px solid var(--line);
  }
  .ri {
    flex: none;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink-2);
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
  }
  .hint {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
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
</style>
