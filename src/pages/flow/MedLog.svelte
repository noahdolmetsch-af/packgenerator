<script>
  /**
   * Hobby pages 3 «Nach dem Gong»: the log of the meditation page (mockups B4 and B6, Noah 10.10.2026, H10a).
   *   #/flow/act/meditation/log?view=list|cal|chart&art=&dur=&tod=&tpl=&note=1&longest=1&range=&month=&day=
   *   Liste: every session, a tap opens it (B5); filters by kind, duration, «längste am Stück», time of day,
   *   template, with a note and period. Kalender: minutes per day, month by month; a day shows its sessions.
   *   Grafik: minutes per week, per kind, by duration. Beside it: the streaks (current, longest, days with a
   *   session, the heatmap of 13 weeks), the best time of day and the month comparison (all sessions).
   * A filter change keeps the scroll position: the address is updated in place.
   */
  import { ChevronLeft, ChevronRight, X, SlidersHorizontal } from '@lucide/svelte';
  import { medQuery, seedMed } from '../../lib/flow/data.svelte.js';
  import { artsOf, sortTemplates, bowlWords, logRows, filterRows, filterOf, filterQuery, filterCount, LOG_DEFAULT, DUR, TOD, RANGES, heatmap, streaks, hourHistogram, deepestHours, monthCompare, monthCalendar, monthRun, monthAdd, artMinutes, durationBins, weekMinutes, weekendMinutes, doubleDays } from '../../lib/flowmed.js';
  import { actName } from '../../lib/flow/ui.svelte.js';
  import { tplName, artName, whenShort, marksLine, monthWord, moodLabel } from '../../lib/flow/hobby/words.js';
  import { dayShort } from '../../lib/flow/words.js';
  import { localDay } from '../../lib/localday.js';
  import { phone } from '../../lib/media.svelte.js';
  import { t, tn, locale } from '../../lib/i18n.svelte.js';

  let { actId = 'meditation', params = new URLSearchParams() } = $props();
  const today = localDay();
  const q = $derived(medQuery(actId, today));
  const data = $derived($q);
  $effect(() => {
    seedMed(data, actId);
  });
  const base = $derived(`#/flow/act/${encodeURIComponent(actId)}`);
  const act = $derived(data?.acts.find((a) => a.id === actId) ?? null);
  const arts = $derived(artsOf(data?.arts));
  const artOf = (x) => arts.all.find((a) => a.id === x) ?? null;
  const artLabel = (x) => (artOf(x) ? artName(artOf(x)) : x ? x : act ? actName(act) : '');
  const tpls = $derived(sortTemplates(data?.tpls ?? []));
  const tplOfId = (x) => tpls.find((y) => y.id === x) ?? null;

  /* the filter: from the address once, then in place */
  let f = $state({ ...LOG_DEFAULT, month: null, day: null });
  let inited = false;
  $effect.pre(() => {
    if (inited) return;
    f = filterOf(params);
    inited = true;
  });
  function set(patch) {
    f = { ...f, ...patch };
    try {
      history.replaceState(null, '', `${location.pathname}${location.search}${base}/log${filterQuery(f)}`);
    } catch {
      /* an old browser: the filter still works, only the address stays */
    }
  }
  const reset = () => set({ ...LOG_DEFAULT, view: f.view, month: f.month, day: null });
  const nFilters = $derived(filterCount(f));
  // on a phone the filters fold behind one button (no sideways scroll); on a computer they are always there
  let filtersOpen = $state(false);

  const rows = $derived(data ? logRows(data.log, data.sessions, actId) : []);
  const shown = $derived(filterRows(rows, f, today));
  // a phone shows fewer rows first, so the streaks below are not far away
  const STEP = phone.matches ? 12 : 30;
  let limit = $state(STEP);
  const list = $derived(shown.slice(0, limit));
  const rangeAll = $derived(filterRows(rows, { ...f, range: 'all', longest: false }, today));
  const total = $derived(rows.filter((r) => r.day <= today).length);
  const artIds = $derived([...new Set([...rows.map((r) => r.art).filter(Boolean), ...arts.favs])]);
  const modeLine = (r) => {
    if (r.marks.length && r.bowl?.mode !== 'every') return marksLine(r.marks);
    if (!r.bowl) return '';
    const w = bowlWords(r.bowl);
    return t(w.key, w.vars);
  };
  const rowSub = (r) => [modeLine(r), r.note ? `«${r.note.length > 60 ? `${r.note.slice(0, 58)}…` : r.note}»` : r.moods.length ? `«${moodLabel(r.moods[0])}»` : '', r.tplId && tplOfId(r.tplId) ? t('Template «{name}»', { name: tplName(tplOfId(r.tplId)) }) : ''].filter(Boolean).join(' · ');
  const sHref = (r) => `${base}/s/${encodeURIComponent(r.id)}`;
  const listTitle = $derived(f.note ? t('Sessions with a note') : f.longest ? t('The longest sessions') : t('Sessions|log'));

  /* beside: streaks, heatmap, time of day, month comparison (all sessions) */
  const str = $derived(data ? streaks(data.log, actId, today) : { now: 0, longest: 0 });
  const heat = $derived(heatmap(rows, actId, today, 13));
  const hours = $derived(hourHistogram(rows));
  const hourMax = $derived(Math.max(1, ...hours));
  const deep = $derived(deepestHours(rows));
  const months = $derived(monthCompare(rows, actId, today, 3));
  const monthName = (m, form = 'short') => monthWord(`${m}-01`, form);

  /* calendar (B6) */
  const month = $derived(f.month ?? today.slice(0, 7));
  const cal = $derived(monthCalendar(rangeAll, actId, month, today));
  const run = $derived(monthRun(rangeAll, actId, month, today));
  const dayRows = $derived(f.day ? rangeAll.filter((r) => r.day === f.day) : []);
  const WD = $derived(Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(2026, 9, 5 + i)).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' })));
  const pickDay = (d) => set({ day: f.day === d ? null : d });

  /* charts (B6) */
  const weeks = $derived(weekMinutes(shown, actId, today, 13));
  const weekMax = $derived(Math.max(1, ...weeks.map((w) => w.min)));
  const perArt = $derived(artMinutes(shown));
  const artMax = $derived(Math.max(1, ...perArt.map((a) => a.min)));
  const bins = $derived(durationBins(shown));
  const weekend = $derived(weekendMinutes(rows, actId, today));
  const doubles = $derived(doubleDays(rows, actId));
  const rangeName = $derived(t(RANGES.find((r) => r.id === f.range)?.name ?? ''));

  const VIEWS = [
    { id: 'list', name: 'List|view' },
    { id: 'cal', name: 'Calendar|view' },
    { id: 'chart', name: 'Chart|view' },
  ];
</script>

<div class="ml">
  <p class="back"><a href={base}><ChevronLeft size={16} aria-hidden="true" />{t('Back to {name}', { name: act ? actName(act) : t('Meditation') })}</a></p>

  <header class="head">
    <h1 class="h1" tabindex="-1" data-page-title>{t('Log')}</h1>
    <div class="views" role="group" aria-label={t('View')}>
      {#each VIEWS as v (v.id)}
        <button type="button" class="vw" class:on={f.view === v.id} aria-pressed={f.view === v.id} onclick={() => set({ view: v.id })} data-view={v.id}>{t(v.name)}</button>
      {/each}
    </div>
  </header>

  {#if phone.matches}
    <button type="button" class="ft fopen" class:set={nFilters > 0} aria-expanded={filtersOpen} aria-controls="medfilters" onclick={() => (filtersOpen = !filtersOpen)} data-filters><SlidersHorizontal size={16} aria-hidden="true" />{nFilters ? t('Filter ({n})', { n: nFilters }) : t('Filter')}</button>
  {/if}
  {#if !phone.matches || filtersOpen}
  <div class="filters" id="medfilters" role="group" aria-label={t('Filter')}>
    <label class="fs" class:set={f.art !== 'all'}><span class="sr">{t('Kind')}</span>
      <select value={f.art} onchange={(e) => set({ art: e.currentTarget.value })} data-filter="art">
        <option value="all">{t('Kind: all')}</option>
        {#each artIds as x (x)}<option value={x}>{artLabel(x)}</option>{/each}
      </select>
    </label>
    <label class="fs" class:set={f.dur !== 'all'}><span class="sr">{t('Duration')}</span>
      <select value={f.dur} onchange={(e) => set({ dur: e.currentTarget.value })} data-filter="dur">
        <option value="all">{t('Duration: all')}</option>
        {#each DUR as d (d.id)}<option value={d.id}>{t('{range} min', { range: t(d.name) })}</option>{/each}
      </select>
    </label>
    <button type="button" class="ft" class:set={f.longest} aria-pressed={f.longest} onclick={() => set({ longest: !f.longest })}>{t('Longest in one go')}</button>
    <label class="fs" class:set={f.tod !== 'all'}><span class="sr">{t('Time of day')}</span>
      <select value={f.tod} onchange={(e) => set({ tod: e.currentTarget.value })} data-filter="tod">
        <option value="all">{t('Time of day: all')}</option>
        {#each TOD as d (d.id)}<option value={d.id}>{t(d.name)}</option>{/each}
      </select>
    </label>
    <label class="fs" class:set={f.tpl !== 'all'}><span class="sr">{t('Template')}</span>
      <select value={f.tpl} onchange={(e) => set({ tpl: e.currentTarget.value })} data-filter="tpl">
        <option value="all">{t('Template: all')}</option>
        {#each tpls as x (x.id)}<option value={x.id}>{tplName(x)}</option>{/each}
      </select>
    </label>
    <button type="button" class="ft" class:set={f.note} aria-pressed={f.note} onclick={() => set({ note: !f.note })} data-filter="note">{t('with a note')}</button>
    <label class="fs" class:set={f.range !== LOG_DEFAULT.range}><span class="sr">{t('Period')}</span>
      <select value={f.range} onchange={(e) => set({ range: e.currentTarget.value })} data-filter="range">
        {#each RANGES as r (r.id)}<option value={r.id}>{t('Period: {name}', { name: t(r.name) })}</option>{/each}
      </select>
    </label>
    {#if nFilters}<button type="button" class="ft clr" onclick={reset}><X size={16} aria-hidden="true" />{tn(nFilters, 'reset {n} filter', 'reset {n} filters')}</button>{/if}
  </div>
  {/if}

  {#if data}
    <div class="cols">
      <div class="main">
        {#if f.view === 'list'}
          <section class="surf pad" aria-labelledby="ls-h">
            <div class="sh-row"><h2 id="ls-h" class="zlabel sh">{listTitle}</h2><span class="cnt num">{t('{n} of {m}', { n: shown.length, m: total })}</span></div>
            {#if list.length}
              <ul class="rows">
                {#each list as r (r.id)}
                  <li>
                    <a class="row" href={sHref(r)} data-session={r.id}>
                      <span class="rd num">{r.at ? whenShort(r.at).replace(' · ', '\n') : dayShort(r.day)}</span>
                      <span class="rt"><b>{artLabel(r.art)}</b>{#if rowSub(r)}<small>{rowSub(r)}</small>{/if}</span>
                      <b class="rm num">{r.min ? t('{n} min', { n: r.min }) : t('ticked')}</b>
                      <ChevronRight size={18} aria-hidden="true" />
                    </a>
                  </li>
                {/each}
              </ul>
              <p class="hint">{t('Every row opens the session.')}{#if shown.length > limit}{' · '}<button type="button" class="lnk" onclick={() => (limit += STEP)}>{t('load older')}</button>{/if}</p>
            {:else}
              <p class="hint">{rows.length ? t('No session fits these filters.') : t('No session yet.')}</p>
              {#if nFilters}<button type="button" class="btn" onclick={reset}>{t('Reset the filters')}</button>{/if}
            {/if}
          </section>
        {:else if f.view === 'cal'}
          <section class="surf pad calpad" aria-labelledby="cal-h">
            <div class="sh-row">
              <h2 id="cal-h" class="zlabel sh">{monthName(month, 'long')} {month.slice(0, 4)}</h2>
              <span class="mnav">
                <button type="button" class="ib" aria-label={t('Previous month')} onclick={() => set({ month: monthAdd(month, -1), day: null })}><ChevronLeft size={18} aria-hidden="true" /></button>
                <button type="button" class="ib" aria-label={t('Next month')} disabled={month >= today.slice(0, 7)} onclick={() => set({ month: monthAdd(month, 1), day: null })}><ChevronRight size={18} aria-hidden="true" /></button>
              </span>
            </div>
            <div class="cal">
              <div class="cw" aria-hidden="true">{#each WD as w (w)}<span class="wd">{w}</span>{/each}</div>
              {#each cal.weeks as wk, i (i)}
                <div class="cw">
                  {#each wk as c, j (j)}
                    {#if c && c.n && !c.future}
                      <button type="button" class="cd l{c.level}" class:sel={f.day === c.day} class:today={c.day === today} aria-pressed={f.day === c.day} aria-label={t('{day}: {n} min', { day: dayShort(c.day), n: c.min })} onclick={() => pickDay(c.day)} data-day={c.day}>
                        <span class="dn num">{Number(c.day.slice(8))}</span>
                        <b class="dm num">{c.min || '✓'}</b>
                      </button>
                    {:else if c}
                      <span class="cd l0" class:today={c.day === today} data-day={c.day}><span class="dn num">{Number(c.day.slice(8))}</span></span>
                    {:else}
                      <span class="cd empty"></span>
                    {/if}
                  {/each}
                </div>
              {/each}
            </div>
            <p class="hint">{t('Number = minutes. Tap a day to see its sessions.')}{#if run > 1}{' '}{t('Streak: {n} days in {month} without a gap.', { n: run, month: monthName(month, 'long') })}{/if}</p>
            {#if f.day}
              <h3 class="dh">{dayShort(f.day)}</h3>
              <ul class="rows">
                {#each dayRows as r (r.id)}
                  <li><a class="row" href={sHref(r)} data-session={r.id}><span class="rd num">{r.at ? whenShort(r.at).split(' · ')[1] : ''}</span><span class="rt"><b>{artLabel(r.art)}</b>{#if rowSub(r)}<small>{rowSub(r)}</small>{/if}</span><b class="rm num">{r.min ? t('{n} min', { n: r.min }) : t('ticked')}</b><ChevronRight size={18} aria-hidden="true" /></a></li>
                {/each}
              </ul>
            {/if}
          </section>
        {:else}
          <section class="surf pad" aria-labelledby="wk-h">
            <h2 id="wk-h" class="zlabel sh">{t('Minutes per week')}</h2>
            <div class="wbars" role="img" aria-label={t('Minutes per week, last 13 weeks')}>
              {#each weeks as w, i (w.week)}<i class:now={i === weeks.length - 1} style:height="{Math.max(3, Math.round((w.min / weekMax) * 100))}%" title={t('{day}: {n} min', { day: dayShort(w.week), n: w.min })}></i>{/each}
            </div>
            <p class="axis"><span>{dayShort(weeks[0]?.week ?? today)}</span><span>{t('this week')}</span></p>
          </section>
          <section class="surf pad" aria-labelledby="art-h">
            <h2 id="art-h" class="zlabel sh">{t('Minutes by kind, {range}', { range: rangeName })}</h2>
            {#if perArt.length}
              <ul class="abars">
                {#each perArt as a (a.art ?? 'none')}
                  <li><span class="an">{artLabel(a.art)}</span><span class="ab"><i style:width="{Math.max(4, Math.round((a.min / artMax) * 100))}%"></i></span><span class="av num">{a.min}</span></li>
                {/each}
              </ul>
            {:else}
              <p class="hint">{t('No minutes in this period.')}</p>
            {/if}
          </section>
          <section class="surf pad" aria-labelledby="dur-h">
            <h2 id="dur-h" class="zlabel sh">{t('Length of the sessions')}</h2>
            <div class="tiles four">
              {#each bins as b (b.id)}<div class="tile"><b class="num">{b.n}</b><small>{t(b.name)}</small></div>{/each}
            </div>
            <p class="hint">{t('Weekend: {n} min this weekend', { n: weekend })} · {tn(doubles, '{n} day with two sessions', '{n} days with two sessions')}</p>
          </section>
        {/if}
      </div>

      <div class="side">
        <section class="surf pad" aria-labelledby="st-h">
          <div class="sh-row"><h2 id="st-h" class="zlabel sh">{t('Streaks')}</h2><span class="cnt">{t('last {n} weeks', { n: 13 })}</span></div>
          <div class="tiles">
            <div class="tile"><b class="num">{str.now}</b><small>{t('days, current')}</small></div>
            <div class="tile"><b class="num">{str.longest}</b><small>{t('longest streak')}</small></div>
            <div class="tile"><b class="num">{heat.share} %</b><small>{t('days with a session')}</small></div>
          </div>
          <div class="heat" role="img" aria-label={t('Heatmap of the last 13 weeks')}>
            {#each heat.cols as col, i (i)}
              {#each col as c (c.day)}<i class="l{c.level}" class:fut={c.future} title={c.n ? t('{day}: {n} min', { day: dayShort(c.day), n: c.min }) : dayShort(c.day)}></i>{/each}
            {/each}
          </div>
          <p class="legend"><span><i class="l1"></i>{t('up to 15 min')}</span><span><i class="l2"></i>{t('up to 30')}</span><span><i class="l3"></i>{t('over 30')}</span></p>
        </section>

        <section class="surf pad" aria-labelledby="tod-h">
          <h2 id="tod-h" class="zlabel sh">{t('Best time of day')}</h2>
          <div class="hist" role="img" aria-label={t('Sessions per hour of the day')}>
            {#each hours as n, h (h)}<i style:height="{n ? Math.max(6, Math.round((n / hourMax) * 100)) : 0}%" title="{h}:00 · {n}"></i>{/each}
          </div>
          <p class="axis five"><span>0</span><span>6</span><span>12</span><span>18</span><span>24</span></p>
          <p class="hint">{deep ? t('Deepest (depth 4–5): {from} to {to} o’clock', { from: deep.from, to: deep.to }) : t('With a depth in the note you see here when it goes deepest.')}</p>
        </section>

        <section class="surf pad" aria-labelledby="mc-h">
          <h2 id="mc-h" class="zlabel sh">{t('Month comparison')}</h2>
          <div class="tiles">
            {#each months as m (m.month)}<div class="tile"><b class="num">{m.min}</b><small>{m.partial ? t('{month} so far', { month: monthName(m.month) }) : t('{month} min', { month: monthName(m.month) })}</small></div>{/each}
          </div>
        </section>
      </div>
    </div>
  {/if}
</div>

<style>
  .ml {
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
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px 16px;
  }
  .h1 {
    margin: 0;
    font: 800 var(--fs-title)/1.1 var(--font-brand);
  }
  .views {
    display: flex;
    gap: 2px;
    padding: 4px;
    border-radius: 12px;
    background: var(--paper-2);
  }
  .vw {
    min-height: 44px;
    padding: 6px 14px;
    border: 0;
    border-radius: 9px;
    background: none;
    color: var(--ink-2);
    font: 500 var(--fs-small)/1.2 var(--font-body);
    cursor: pointer;
  }
  .vw.on {
    background: var(--paper);
    color: var(--ink);
    font-weight: 700;
    box-shadow: var(--card-shadow);
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    min-width: 0;
  }
  .fs {
    position: relative;
    min-width: 0;
    max-width: 100%;
  }
  .fs select {
    max-width: 100%;
  }
  .fopen {
    align-self: flex-start;
  }
  .fs select,
  .ft {
    min-height: 44px;
    padding: 6px 12px;
    border: 1.5px solid var(--line-strong);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small)/1.2 var(--font-body);
    cursor: pointer;
  }
  .ft {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .fs.set select,
  .ft.set {
    border-color: var(--accent);
    background: var(--ok-soft);
    font-weight: 700;
  }
  .ft.clr {
    border-style: dashed;
    color: var(--ink-2);
  }
  .cols {
    display: grid;
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    gap: 14px 20px;
    align-items: start;
  }
  @media (max-width: 959px) {
    .cols {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .main,
  .side {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }
  .pad {
    padding: 16px 18px;
    min-width: 0;
  }
  @media (min-width: 720px) {
    .pad {
      padding: 20px 24px;
    }
  }
  .sh-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 12px;
    margin-bottom: 8px;
  }
  .sh {
    margin: 0 0 8px;
  }
  .sh-row .sh {
    margin: 0;
  }
  .cnt {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .rows {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rows li {
    border-top: 1px solid var(--line);
  }
  .rows li:first-child {
    border-top: 0;
  }
  .row {
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr) auto 18px;
    align-items: center;
    gap: 10px;
    min-height: 56px;
    padding: 8px 0;
    color: var(--ink);
    text-decoration: none;
  }
  @media (max-width: 419px) {
    .row {
      grid-template-columns: 62px minmax(0, 1fr) auto 18px;
      gap: 8px;
    }
  }
  .row :global(svg) {
    color: var(--ink-3);
  }
  .rd {
    color: var(--ink-2);
    font-size: var(--fs-small);
    white-space: pre-line;
    line-height: 1.35;
  }
  .rt {
    min-width: 0;
    line-height: 1.3;
  }
  .rt b {
    display: block;
    font-weight: 700;
  }
  .rt small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .rm {
    font: 800 var(--fs-sub) var(--font-brand);
    white-space: nowrap;
  }
  .hint {
    margin: 10px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hint + .btn {
    margin-top: 10px;
    min-height: 44px;
  }
  .lnk {
    position: relative;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  .lnk::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 44px;
    transform: translateY(-50%);
  }
  .mnav {
    display: flex;
    gap: 4px;
  }
  .ib {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink-2);
    cursor: pointer;
  }
  .ib:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .cal {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .cw {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 4px;
  }
  @media (max-width: 719px) {
    /* the day buttons stay 44 px wide on a 390 px phone */
    .calpad {
      padding-left: 12px;
      padding-right: 12px;
    }
    .cal,
    .cw {
      gap: 3px;
    }
  }
  .wd {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    text-align: center;
  }
  .cd {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: space-between;
    min-width: 0;
    min-height: 48px;
    padding: 4px 6px;
    border: 1.5px solid transparent;
    border-radius: 8px;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  @media (min-width: 720px) {
    .cd {
      min-height: 54px;
    }
  }
  span.cd {
    cursor: default;
  }
  .cd.empty {
    min-height: 0;
  }
  .cd.l0 .dn {
    color: var(--ink-3);
  }
  .dn {
    font-size: var(--fs-tiny);
  }
  .dm {
    font: 800 var(--fs-small) var(--font-brand);
  }
  .l1 {
    background: var(--ok-soft);
  }
  .l2 {
    background: color-mix(in srgb, var(--accent) 50%, var(--paper));
  }
  .l3 {
    background: var(--accent);
    color: var(--paper);
  }
  .cd.today {
    border-color: var(--ink-3);
  }
  .cd.sel {
    border-color: var(--ink);
  }
  .dh {
    margin: 14px 0 4px;
    font: 700 var(--fs-body) var(--font-body);
  }
  .wbars,
  .hist {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    height: 120px;
    border-bottom: 1px solid var(--line);
  }
  .wbars i,
  .hist i {
    flex: 1;
    min-width: 0;
    border-radius: 3px 3px 0 0;
    background: var(--accent);
  }
  .wbars i.now {
    background: var(--accent-soft);
  }
  .hist {
    gap: 2px;
    height: 80px;
  }
  .axis {
    display: flex;
    justify-content: space-between;
    margin: 4px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .abars {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .abars li {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 2fr) 44px;
    align-items: center;
    gap: 10px;
  }
  .an {
    overflow-wrap: break-word;
    line-height: 1.3;
  }
  .ab {
    height: 12px;
    border-radius: 6px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .ab i {
    display: block;
    height: 100%;
    background: var(--accent);
  }
  .av {
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-align: right;
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .tiles.four {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .tile {
    min-width: 0;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--paper-2);
  }
  .tile b {
    display: block;
    font: 800 var(--fs-section)/1.1 var(--font-brand);
  }
  .tile small {
    display: block;
    margin-top: 4px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.3;
    overflow-wrap: break-word;
  }
  .heat {
    display: grid;
    grid-template-rows: repeat(7, minmax(0, 1fr));
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    gap: 3px;
    margin-top: 12px;
  }
  .heat i {
    aspect-ratio: 1;
    border-radius: 3px;
    background: var(--paper-2);
  }
  .heat i.l1 {
    background: var(--ok-soft);
  }
  .heat i.l2 {
    background: color-mix(in srgb, var(--accent) 50%, var(--paper));
  }
  .heat i.l3 {
    background: var(--accent);
  }
  .heat i.fut {
    border: 1px dashed var(--line);
    background: none;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 8px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .legend i {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }
</style>
