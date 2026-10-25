<script>
  /**
   * Hobby pages 3 «Nach dem Gong»: the log of the meditation page (mockups B4 and B6, Noah 10.10.2026, H10a).
   *   #/flow/act/meditation/log?view=list|cal|chart&art=&dur=&tod=&tpl=&note=1&longest=1&range=&month=&day=
   *   Liste: every session, a tap opens it (B5); filters by kind, duration, «längste am Stück», time of day,
   *   template, with a note and period. Kalender: minutes per day, month by month; a day shows its sessions.
   *   Grafik: minutes per week, per kind, by duration. Beside it: the streaks (current, longest, days with a
   *   session, the heatmap of 13 weeks), the best time of day and the month comparison (all sessions).
   * A filter change keeps the scroll position: the address is updated in place.
   * v0.105.0 Design-Refresh P8 «Aktiv» (A14 «Logbuch neu», Noah «freigabe für a14 und a14c»: 1 + 3): two
   * tabs, «Übersicht» (the month in numbers with its trend, the month as a story, the last 7 days, the
   * calendar of 13 weeks with a tap on a day, minutes per week; at the side «Muster finden», the trophy
   * shelf, the goal path, what helps and the latest) and «Liste» (the list with its filters, as before).
   * view=cal and view=chart (old links) open the overview; a filter or view=list opens the list.
   */
  import { ChevronLeft, ChevronRight, X, SlidersHorizontal, ArrowUp, ArrowDown, Activity as Pulse } from '@lucide/svelte';
  import Empty from '../../lib/ui/Empty.svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import Sec from '../../lib/flow/kit/Sec.svelte';
  import Rows from '../../lib/flow/kit/Rows.svelte';
  import TrophyShelf from '../../lib/flow/kit/TrophyShelf.svelte';
  import GoalPath from '../../lib/flow/kit/GoalPath.svelte';
  import { monthNumbers, lastSeven, helpedStats, usualHour, goalPath, isoWeek } from '../../lib/flow/aktiv.js';
  import { msContext, actMilestones, evaluate, isOff, soonList, recentStars } from '../../lib/flowms.js';
  import { medQuery, seedMed } from '../../lib/flow/data.svelte.js';
  import { artsOf, sortTemplates, bowlWords, logRows, filterRows, filterOf, filterQuery, filterCount, LOG_DEFAULT, DUR, TOD, RANGES, heatmap, weekMinutes } from '../../lib/flowmed.js';
  import { actName } from '../../lib/flow/ui.svelte.js';
  import { tplName, artName, whenShort, marksLine, monthWord, moodLabel, msName, starLine, dayWord, val, helpedLabel } from '../../lib/flow/hobby/words.js';
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
  // A14: the tab; a filter or view=list in the address opens the list, everything else the overview
  let tab = $state('over');
  let inited = false;
  $effect.pre(() => {
    if (inited) return;
    f = filterOf(params);
    tab = params.get('view') === 'list' || filterCount(f) > 0 ? 'list' : 'over';
    inited = true;
  });
  function write() {
    const q = filterQuery({ ...f, view: LOG_DEFAULT.view }).slice(1);
    const s = [tab === 'list' && !filterCount(f) ? 'view=list' : '', q].filter(Boolean).join('&');
    try {
      history.replaceState(null, '', `${location.pathname}${location.search}${base}/log${s ? `?${s}` : ''}`);
    } catch {
      /* an old browser: the filter still works, only the address stays */
    }
  }
  function set(patch) {
    f = { ...f, ...patch };
    write();
  }
  function setTab(v) {
    tab = v;
    f = { ...f, day: null };
    write();
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

  /* A14 Übersicht: the month in numbers and as a story, the last 7 days, 13 weeks, minutes per week */
  const monthName = (m, form = 'short') => monthWord(`${m}-01`, form);
  const past = $derived(rows.filter((r) => r.day <= today));
  const mn = $derived(monthNumbers(past, today));
  const prevMonth = $derived(new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 2, 1)).toISOString().slice(0, 7));
  const trend = $derived({
    min: mn.before.min ? Math.round(((mn.now.min - mn.before.min) / mn.before.min) * 100) : null,
    days: mn.before.days ? mn.now.days - mn.before.days : null,
    depth: mn.now.depth != null && mn.before.depth != null ? Math.round((mn.now.depth - mn.before.depth) * 10) / 10 : null,
  });
  const monthRows = $derived(past.filter((r) => r.day.startsWith(today.slice(0, 7))));
  const usual = $derived(usualHour(monthRows));
  const monthNote = $derived(monthRows.filter((r) => r.note).sort((x, y) => (y.depth ?? 0) - (x.depth ?? 0) || y.day.localeCompare(x.day))[0] ?? null);
  const seven = $derived(data ? lastSeven(data.log, actId, today) : []);
  const wd = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' });
  const heat = $derived(heatmap(rows, actId, today, 13));
  const monthLabel = (col, i) => {
    const first = col.find((c) => c.day.endsWith('-01'));
    return i === 0 ? monthName(col[0].day.slice(0, 7)) : first ? monthName(first.day.slice(0, 7)) : '';
  };
  const dayRows = $derived(f.day ? past.filter((r) => r.day === f.day) : []);
  const pickDay = (d) => set({ day: f.day === d ? null : d });
  const weeks = $derived(weekMinutes(rows, actId, today, 13));
  const weekMax = $derived(Math.max(1, ...weeks.map((w) => w.min)));

  /* A14 side: the stars of this activity (the trophy shelf), the goal path, what helps */
  const ctx = $derived(data ? msContext({ acts: data.acts, log: data.log, sessions: data.sessions, today, tripDays: data.tripDays }) : null);
  const stored = $derived(new Map((data?.stars ?? []).map((x) => [x.id, x.day])));
  const ms = $derived(act && ctx ? actMilestones(act).map((m) => ({ ...evaluate(m, ctx, stored, data.tune), off: isOff(m, data.tune) })).filter((r) => !r.off) : []);
  const nextUp = $derived(soonList(ms, 1)[0] ?? ms.filter((r) => r.next).sort((x, y) => y.progress - x.progress)[0] ?? null);
  const shelf = $derived([
    ...recentStars(ms, 3).map((x) => ({ id: x.star.id, name: msName(x.r.m), when: dayWord(x.star.day, today), done: true })),
    ...(nextUp ? [{ id: `next-${nextUp.id}`, name: msName(nextUp.m), when: starLine(nextUp.next), done: false }] : []),
  ]);
  const shelfNext = $derived(nextUp ? { name: msName(nextUp.m), value: val(nextUp.value, nextUp.m.unit), target: val(nextUp.target, nextUp.m.unit) } : null);
  const pathMs = $derived(nextUp);
  const path = $derived(pathMs ? goalPath(pathMs) : null);
  const helps = $derived.by(() => {
    const deep = past.filter((r) => r.depth);
    return helpedStats(past)
      .filter((h) => h.depth != null)
      .map((h) => {
        const rest = deep.filter((r) => !(r.helped ?? []).includes(h.id));
        return { ...h, other: rest.length ? Math.round((rest.reduce((x, r) => x + r.depth, 0) / rest.length) * 10) / 10 : null };
      });
  });
  let hi = $state(0);
</script>

<div class="ml">
  <header class="ph">
    <Crumb path={[{ href: '#/flow', label: t('Active|place') }, { href: base, label: act ? actName(act) : t('Meditation') }]} here={t('Logbook')} />
    <h1 class="h1" tabindex="-1" data-page-title>{t('Logbook')}</h1>
    <p class="sub">{act ? actName(act) : t('Meditation')} · {t('every number opens the matching sessions')}</p>
  </header>

  <div class="tools">
    <div class="tabs" role="group" aria-label={t('View')}>
      <button type="button" class="tb" aria-pressed={tab === 'over'} onclick={() => setTab('over')} data-view="over">{t('Overview|log')}</button>
      <button type="button" class="tb" aria-pressed={tab === 'list'} onclick={() => setTab('list')} data-view="list">{t('List|view')}</button>
    </div>
    {#if tab === 'over'}<span class="range">{t('Period: last {n} weeks', { n: 13 })}</span>{/if}
  </div>

  {#if tab === 'list'}
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
  {/if}

  {#if data}
    {#snippet sessRows(list)}
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
    {/snippet}

    {#if tab === 'list'}
      <section class="card pad" aria-labelledby="ls-h">
        <div class="sh-row"><h2 id="ls-h" class="sh">{listTitle}</h2><span class="cnt num">{t('{n} of {m}', { n: shown.length, m: total })}</span></div>
        {#if list.length}
          {@render sessRows(list)}
          <p class="hint">{t('Every row opens the session.')}{#if shown.length > limit}{' · '}<button type="button" class="lnk" onclick={() => (limit += STEP)}>{t('load older')}</button>{/if}</p>
        {:else}
          <Empty text={rows.length ? t('No session fits these filters.') : t('No session yet.')} action={nFilters ? { label: t('Reset the filters'), onclick: reset } : null} />
        {/if}
      </section>
    {:else}
      <div class="lay">
        <div class="col">
          <Sec id="mn-h" title={t('{month} so far', { month: monthName(today.slice(0, 7), 'long') })} sub={t('compared with {month} up to the same day', { month: monthName(prevMonth, 'long') })}>
            <div class="card nums">
              <a class="nb" href="{base}/log?range=1m" data-num="min">
                <small>{t('Minutes|log')}</small>
                <b class="num">{t('{n} min', { n: mn.now.min })}</b>
                {#if trend.min != null}<span class="pill tr">{#if trend.min >= 0}<ArrowUp size={12} aria-hidden="true" />{:else}<ArrowDown size={12} aria-hidden="true" />{/if}{Math.abs(trend.min)} %</span>{/if}
              </a>
              <a class="nb" href="{base}/log?range=1m" data-num="days">
                <small>{t('Days|log')}</small>
                <b class="num">{t('{n} of {m}', { n: mn.now.days, m: mn.now.of })}</b>
                {#if trend.days != null}<span class="pill tr">{#if trend.days >= 0}<ArrowUp size={12} aria-hidden="true" />{:else}<ArrowDown size={12} aria-hidden="true" />{/if}{Math.abs(trend.days)}</span>{/if}
              </a>
              <a class="nb" href="{base}/log?range=1m&note=1" data-num="depth">
                <small>{t('Depth ⌀')}</small>
                <b class="num">{mn.now.depth ?? '–'}</b>
                {#if trend.depth != null}<span class="pill tr">{#if trend.depth >= 0}<ArrowUp size={12} aria-hidden="true" />{:else}<ArrowDown size={12} aria-hidden="true" />{/if}{Math.abs(trend.depth)}</span>{/if}
              </a>
            </div>
          </Sec>

          {#if mn.now.days}
            <Sec id="my-h" title={t('Your month')}>
              <article class="card story" data-story>
                <svg class="land" viewBox="0 0 640 120" preserveAspectRatio="none" aria-hidden="true">
                  <circle cx="512" cy="40" r="22" class="sun" />
                  <path d="M0 92 C120 70 220 100 340 84 S560 60 640 70 L640 120 L0 120 Z" class="h1p" />
                  <path d="M0 104 C140 92 260 112 400 100 S580 88 640 96 L640 120 L0 120 Z" class="h2p" />
                </svg>
                <div class="sb">
                  <p class="sk">{t('Your {month} so far', { month: monthName(today.slice(0, 7), 'long') })}</p>
                  <div class="s4">
                    <span><b class="num">{mn.now.days}</b><small>{t('Days|log')}</small></span>
                    <span><b class="num">{mn.now.min}</b><small>{t('Minutes|log')}</small></span>
                    <span><b class="num">{mn.now.depth ?? '–'}</b><small>{t('Depth ⌀')}</small></span>
                    <span><b class="num">{usual == null ? '–' : `${usual}:00`}</b><small>{t('mostly at')}</small></span>
                  </div>
                  {#if monthNote}<p class="sq">«{monthNote.note.length > 80 ? `${monthNote.note.slice(0, 78)}…` : monthNote.note}» · {dayShort(monthNote.day)}</p>{/if}
                </div>
              </article>
            </Sec>
          {/if}

          <Sec id="l7-h" title={t('Last 7 days')} sub={t('minutes per day')}>
            <ul class="card l7">
              {#each seven as d (d.day)}
                <li class:today={d.day === today}>
                  <small>{wd(d.day)}</small>
                  <i class:on={d.any} aria-hidden="true"></i>
                  <span class="num">{d.any ? d.min || '✓' : '–'}</span>
                </li>
              {/each}
            </ul>
          </Sec>

          <Sec id="cal-h" title={t('Calendar')} sub={t('last {n} weeks · tap a day to see its sessions', { n: 13 })}>
            <div class="card pad calc">
              <div class="mrow" aria-hidden="true">{#each heat.cols as col, i (i)}<span>{monthLabel(col, i)}</span>{/each}</div>
              <div class="heat" role="group" aria-label={t('Heatmap of the last 13 weeks')}>
                {#each heat.cols as col, i (i)}
                  {#each col as c (c.day)}
                    {#if c.n && !c.future}
                      <button type="button" class="hc l{c.level}" class:sel={f.day === c.day} class:today={c.day === today} aria-pressed={f.day === c.day} aria-label={t('{day}: {n} min', { day: dayShort(c.day), n: c.min })} onclick={() => pickDay(c.day)} data-day={c.day}></button>
                    {:else}
                      <span class="hc l0" class:fut={c.future} class:today={c.day === today} data-day={c.day}></span>
                    {/if}
                  {/each}
                {/each}
              </div>
              <p class="legend"><span>{t('less')}</span><i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><span>{t('more')}</span></p>
              {#if f.day}
                <h3 class="dh">{dayShort(f.day)}</h3>
                {@render sessRows(dayRows)}
              {/if}
            </div>
          </Sec>

          <Sec id="wk-h" title={t('Minutes per week')} sub={t('last {n} weeks', { n: 13 })}>
            <div class="card pad">
              <div class="wbars" role="img" aria-label={t('Minutes per week, last 13 weeks')}>
                {#each weeks as w, i (w.week)}<i class:now={i === weeks.length - 1} style:height="{Math.max(3, Math.round((w.min / weekMax) * 100))}%" title={t('{day}: {n} min', { day: dayShort(w.week), n: w.min })}></i>{/each}
              </div>
              <p class="axis"><span>{t('CW {n}', { n: isoWeek(weeks[0]?.week ?? today) })}</span><span>{t('CW {n}', { n: isoWeek(weeks[6]?.week ?? today) })}</span><span>{t('now')}</span></p>
              <p class="hint">{t('This week so far: {n} min', { n: weeks.at(-1)?.min ?? 0 })}</p>
            </div>
          </Sec>
        </div>

        <aside class="col">
          <Sec id="mu-h" title={t('Find patterns')}>
            <Rows rows={[{ key: 'muster', icon: Pulse, title: t('When it goes deepest'), sub: t('records, time of day, length, what helped'), href: `${base}/muster` }]} />
          </Sec>

          <Sec id="ms-h" title={t('Milestones')} more={{ href: `${base}/mehr?open=stars`, label: t('All') }}>
            <div class="card pad"><TrophyShelf items={shelf} next={shelfNext} more="#/flow/trophies?area={encodeURIComponent(actId)}" /></div>
          </Sec>

          {#if path}
            <Sec id="path-h" title={t('Next goal: {name}', { name: msName(pathMs.m) })} sub={t('your next star, station by station')}>
              <div class="card"><GoalPath {path} unit={pathMs.m.unit} label={msName(pathMs.m)} /></div>
            </Sec>
          {/if}

          {#if helps.length}
            {@const h = helps[hi % helps.length]}
            <Sec id="hp-h" title={t('What helps you')} sub={t('from your notes')}>
              <div class="card pad help" data-helped={h.id}>
                <p class="hk">{t('{n} of {m}', { n: (hi % helps.length) + 1, m: helps.length })}</p>
                <p class="hx">{h.other != null ? t('With «{name}»: depth ⌀ {a}, otherwise ⌀ {b}.', { name: helpedLabel(h.id), a: h.depth, b: h.other }) : t('With «{name}»: depth ⌀ {a}.', { name: helpedLabel(h.id), a: h.depth })}</p>
                {#if helps.length > 1}
                  <p class="hn">
                    <button type="button" class="ib" aria-label={t('Previous tip')} onclick={() => (hi = (hi + helps.length - 1) % helps.length)}><ChevronLeft size={18} aria-hidden="true" /></button>
                    <button type="button" class="ib" aria-label={t('Next tip')} onclick={() => (hi = (hi + 1) % helps.length)}><ChevronRight size={18} aria-hidden="true" /></button>
                  </p>
                {/if}
              </div>
            </Sec>
          {/if}

          <Sec id="la-h" title={t('Lately')} more={{ onclick: () => setTab('list'), label: t('Whole list') }}>
            {#if rows.length}<div class="card pad">{@render sessRows(rows.filter((r) => r.day <= today).slice(0, 2))}</div>{:else}<p class="card pad hint">{t('No session yet.')}</p>{/if}
          </Sec>
        </aside>
      </div>
    {/if}
  {/if}
</div>

<style>
  /* v0.105.0 Design-Refresh P8 «Aktiv» (A14): two tabs, the overview in two columns, white cards */
  .ml {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 1240px;
    margin: 0 auto;
    min-width: 0;
  }
  .ph {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
  }
  .h1 {
    margin: 0;
    font: 800 var(--fs-page)/1.1 var(--font-brand);
  }
  .sub {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2) var(--sp-3);
  }
  .tabs {
    display: flex;
    gap: var(--sp-2);
  }
  .tb {
    min-height: 44px;
    padding: 6px 16px;
    border: 1px solid var(--line-strong);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small)/1.2 var(--font-body);
    cursor: pointer;
  }
  .tb[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .range {
    padding: 10px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink-2);
    font-size: var(--fs-small);
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
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
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
    border-color: var(--ink);
    background: var(--paper-2);
    font-weight: 600;
  }
  .ft.clr {
    border-style: dashed;
    color: var(--ink-2);
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
  .pad {
    padding: var(--sp-4);
    min-width: 0;
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
    margin: 0;
    font: 600 var(--fs-sub)/1.3 var(--font-body);
  }
  .cnt {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  /* the month in numbers */
  .nums {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    padding: var(--sp-2);
  }
  .nb {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    min-width: 0;
    min-height: 44px;
    padding: var(--sp-2);
    border-radius: var(--r-ctl);
    color: var(--ink);
    text-decoration: none;
  }
  .nb:hover {
    background: var(--paper-2);
  }
  .nb small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .nb b {
    font: 700 var(--fs-section)/1.15 var(--font-brand);
  }
  .nb .tr {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  /* the month as a story */
  .story {
    overflow: hidden;
    padding: 0;
  }
  .land {
    display: block;
    width: 100%;
    height: 96px;
    background: var(--paper-2);
  }
  .sun {
    fill: var(--warn-soft);
  }
  .h1p {
    fill: color-mix(in srgb, var(--accent) 30%, var(--paper));
  }
  .h2p {
    fill: var(--ok-soft);
  }
  .sb {
    padding: var(--sp-3) var(--sp-4) var(--sp-4);
  }
  .sk {
    margin: 0 0 var(--sp-2);
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .s4 {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--sp-2);
  }
  .s4 span {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .s4 b {
    font: 700 var(--fs-sub)/1.2 var(--font-brand);
  }
  .s4 small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .sq {
    margin: var(--sp-3) 0 0;
    color: var(--ink-2);
    font-style: italic;
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  /* the last 7 days */
  .l7 {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    margin: 0;
    padding: var(--sp-3) var(--sp-2);
    list-style: none;
  }
  .l7 li {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    min-width: 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .l7 li.today {
    color: var(--ink);
    font-weight: 700;
  }
  .l7 i {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--paper-2);
  }
  .l7 i.on {
    background: var(--accent);
  }
  /* the calendar of 13 weeks */
  .mrow,
  .heat {
    display: grid;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
    gap: 4px;
    max-width: 480px;
  }
  .mrow {
    margin-bottom: 4px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .mrow span {
    white-space: nowrap;
  }
  .heat {
    grid-template-rows: repeat(7, auto);
  }
  .hc {
    aspect-ratio: 1;
    min-width: 0;
    padding: 0;
    border: 1.5px solid transparent;
    border-radius: 5px;
    background: var(--paper-2);
    cursor: pointer;
  }
  span.hc {
    cursor: default;
  }
  .hc.fut {
    border: 1px dashed var(--line);
    background: none;
  }
  .hc.today {
    border-color: var(--ink-3);
  }
  .hc.sel {
    border-color: var(--ink);
  }
  .l1 {
    background: var(--ok-soft);
  }
  .l2 {
    background: color-mix(in srgb, var(--accent) 50%, var(--paper));
  }
  .l3 {
    background: var(--accent);
  }
  @media (max-width: 599px) {
    /* a phone: one row per week, the days as 44 px targets */
    .calc {
      padding: var(--sp-3);
    }
    .mrow {
      display: none;
    }
    .heat {
      grid-template-rows: none;
      grid-template-columns: repeat(7, minmax(0, 44px));
      grid-auto-flow: row;
      gap: 3px;
    }
    .hc {
      aspect-ratio: auto;
      min-height: 44px;
    }
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    margin: var(--sp-2) 0 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .legend i {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }
  .legend i.l0 {
    background: var(--paper-2);
  }
  .dh {
    margin: var(--sp-3) 0 4px;
    font: 600 var(--fs-body) var(--font-body);
  }
  /* minutes per week */
  .wbars {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    height: 140px;
    border-bottom: 1px solid var(--line);
  }
  .wbars i {
    flex: 1;
    min-width: 0;
    border-radius: 4px 4px 0 0;
    background: color-mix(in srgb, var(--accent) 35%, var(--paper));
  }
  .wbars i.now {
    background: var(--accent);
  }
  .axis {
    display: flex;
    justify-content: space-between;
    margin: 4px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  /* what helps */
  .help {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }
  .hk {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .hx {
    margin: 0;
    font: 600 var(--fs-sub)/1.35 var(--font-body);
    overflow-wrap: break-word;
  }
  .hn {
    display: flex;
    justify-content: space-between;
    margin: 0;
  }
  /* the rows of sessions */
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
    font-weight: 600;
  }
  .rt small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .rm {
    font: 700 var(--fs-body) var(--font-brand);
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
</style>
