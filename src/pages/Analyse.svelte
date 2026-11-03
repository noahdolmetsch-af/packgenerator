<script>
  /**
   * «Analyse» (Noah 27.10.2026 «1a 2a 3a 4a 5b», thread «Analyse-Tool für alle Daten»): Auswerten › Analyse,
   * #/auswerten/analyse, also behind «Mehr» on Heute's «Aktiv heute». Every value the app has, as one tile
   * with a small course: Fitbit (heart, sleep, movement), Strava (sports, bike values), your body entries,
   * «Wi gaht's?» and every activity of Aktiv. On top: the sources (switch on and off) and the period.
   * A tap opens the value's own page: Körperwerte, a sport, or «Haken ausgewertet» for an activity
   * («2a»: no second page for the same thing). Only to look at, nothing is rated. Rules in lib/analyse.js.
   * Loaded only when opened (App.svelte PAGES.Analyse).
   */
  import { ChevronRight } from '@lucide/svelte';
  import Crumb from '../lib/flow/kit/Crumb.svelte';
  import PageHead from '../lib/ui/PageHead.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { valueText as fmtValue, unitText } from '../lib/analyse/format.js';
  import { PERIODS, DEFAULT_PERIOD, SOURCES, periodDays, tilesOf, sparkPath } from '../lib/analyse.js';
  import { analyseData } from '../lib/analyse/data.svelte.js';
  import { analyseGroups } from '../lib/analyse/catalog.js';
  import { localDay } from '../lib/localday.js';
  import { t, num } from '../lib/i18n.svelte.js';
  import AnalyseWert from './analyse/AnalyseWert.svelte';
  import Diagramm from './analyse/Diagramm.svelte';
  import Ueberblick from './analyse/Ueberblick.svelte';
  import Vergleiche from './analyse/Vergleiche.svelte';
  import Muster from './analyse/Muster.svelte';
  import Ansichten from './analyse/Ansichten.svelte';
  import VeloKm from './analyse/VeloKm.svelte';
  import { liveQuery } from 'dexie';
  import { fromStore } from 'svelte/store';
  import { db } from '../lib/db.js';
  import { VIEWS_KEY, cleanViews, applyDiagram } from '../lib/analyse/views.js';
  import DaySheet from './analyse/DaySheet.svelte';
  import { dayOfHash, rangeOfHash } from '../lib/analyse/jump.js';
  import { itemsByKey } from '../lib/analyse/catalog.js';
  import { addDays } from '../lib/analyse.js';
  import { tripEnd } from '../lib/tripstate.js';

  // #/auswerten/analyse/<key>: the page of one value (M6)
  const keyOf = (h) => {
    const m = /^#\/auswerten\/analyse\/([^?#]+)/.exec(h ?? '');
    if (!m) return null;
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return m[1];
    }
  };
  let hash = $state(location.hash);
  let dayOpen = $state(null); // a day tapped in «Jeder Tag ein Feld»
  $effect(() => {
    const on = () => (hash = location.hash);
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  });
  const detailKey = $derived(keyOf(hash));
  const askedRange = $derived(rangeOfHash(hash));
  // a link from another page (dayHref) opens the sheet of that day
  $effect(() => {
    const d = dayOfHash(hash);
    if (d) dayOpen = d;
  });
  function closeDay() {
    dayOpen = null;
    if (dayOfHash(location.hash)) {
      history.replaceState(history.state, '', location.hash.replace(/[?&]tag=[^&]*/, '').replace(/\?$/, ''));
      hash = location.hash;
    }
  }

  const today = localDay();
  const LS = 'pg.analyse';
  const saved = (() => {
    try {
      return JSON.parse(localStorage.getItem(LS) ?? '{}') ?? {};
    } catch {
      return {};
    }
  })();
  // Parts of the page as tabs (Noah 03.11.2026 «1a»): one part at a time instead of one very long page
  const TABS = ['ueberblick', 'diagramm', 'vergleiche', 'rekorde', 'velos', 'werte'];
  const TAB_NAMES = { ueberblick: 'Overview|tab', diagramm: 'Own diagram|tab', vergleiche: 'Comparisons|tab', rekorde: 'Records and runs|tab', velos: 'Bikes|tab', werte: 'All values|tab' };
  let tab = $state(TABS.includes(saved.tab) ? saved.tab : 'ueberblick');
  // Groups are closed (Noah 03.11.2026 «4a»); the open ones are remembered
  let openG = $state(Array.isArray(saved.openG) ? saved.openG : []);
  const toggleG = (k, isOpen) => (openG = isOpen ? (openG.includes(k) ? openG : [...openG, k]) : openG.filter((x) => x !== k));
  let period = $state(PERIODS.includes(saved.period) ? saved.period : DEFAULT_PERIOD);
  let on = $state(Array.isArray(saved.on) ? SOURCES.filter((s) => saved.on.includes(s)) : [...SOURCES]);
  // «Alle Werte» (Noah 27.10.2026 «zumindest optional»): also the values without any day, as dashed tiles
  let all = $state(saved.all === true);
  $effect(() => {
    try {
      localStorage.setItem(LS, JSON.stringify({ period, on, all, tab, openG }));
    } catch {
      /* a private window: the choice is only for now */
    }
  });
  // saved views (Ansichten): the diagram reports its state; a view starts the diagram anew with its own
  const viewsQ = fromStore({
    subscribe(run) {
      const sub = liveQuery(() => db.settings.get(VIEWS_KEY)).subscribe({ next: run, error: () => {} });
      return () => sub.unsubscribe();
    },
  });
  const views = $derived(cleanViews(viewsQ.current?.value));
  let dgState = $state({});
  let dgStart = $state(null);
  let dgRun = $state(0);
  const nowShown = () => ({ diagram: dgState, tiles: { period, on, all } });
  function applyView(v) {
    dgStart = applyDiagram(dgState, v);
    dgRun += 1;
    if (v.tiles.period != null && PERIODS.includes(v.tiles.period)) period = v.tiles.period;
    if (Array.isArray(v.tiles.on)) on = SOURCES.filter((s) => v.tiles.on.includes(s));
    if (typeof v.tiles.all === 'boolean') all = v.tiles.all;
  }
  const toggle = (s) => (on = on.includes(s) ? on.filter((x) => x !== s) : SOURCES.filter((x) => x === s || on.includes(x)));

  // a year back, so «Eigenes Diagramm» has its counted values (readiness, load) too
  const data = analyseData({ from: () => addDays(today, -400) });
  const days = $derived(periodDays(today, period));
  const groups = $derived(analyseGroups({ table: data.table, weights: data.weights, ctx: data.ctx, acts: data.acts, log: data.log, ownKeys: data.ownKeys, period }));
  const byKey = $derived(itemsByKey(groups));
  const prevDays = $derived(periodDays(addDays(today, -period), period));
  const shownGroups = $derived(tilesOf(groups, days, on, { all, prevDays }));
  const allOpen = $derived(shownGroups.length > 0 && shownGroups.every((g) => openG.includes(g.key)));
  // «more / less than before»: only to look at, nothing is rated
  const deltaOf = (x) => {
    if (x.prev == null || x.value == null || x.empty) return null;
    const d = x.value - x.prev;
    const txt = fmtValue(x, Math.abs(d), num);
    if (!d) return null;
    return { up: d > 0, text: `${txt}${unitText(x) ? ' ' + unitText(x) : ''}` };
  };
  const loading = $derived(data.loading);

  const SRC_NAMES = { aktiv: 'Aktiv', fitbit: 'Fitbit', strava: 'Strava', body: 'Body|group', check: "Wi gaht's?|analyse" };
  const periodOpts = $derived(PERIODS.map((p) => ({ key: String(p), name: p === 365 ? t('Year|analyse') : t('{n} days|analyse', { n: p }) })));

  const valueText = (x) => fmtValue(x, x.value, num);
  const howText = (x) => (x.own && !x.empty ? `${t('own calculation|own')} · ${baseHow(x)}` : baseHow(x));
  const baseHow = (x) =>
    x.later === 'garmin'
      ? t('Garmin does not give this out')
      : x.later
        ? t('Google does not give this out; the app will count its own')
        : x.empty
          ? t('No data yet|analyse')
          : x.tick
            ? t('in {n} days|analyse', { n: period })
            : x.hours
              ? t('{avg}, small picture: per hour of the day|analyse', { avg: t('average|analyse') })
              : x.sum
                ? t('total|analyse')
                : t('average|analyse');
</script>

{#if detailKey}
  {#key detailKey}<AnalyseWert key={detailKey} range={askedRange} />{/key}
{:else}
<div class="an">
  <header>
    <Crumb path={[{ href: '#/auswerten', label: t('Analysis|place') }]} here={t('Analyse|page')} />
    <PageHead title={t('Analyse|page')} sub={t('All your values from Fitbit, Strava, your body, «Wi gaht\'s?» and Aktiv. Tap a value to see its course. Only to look at, nothing is rated.')} />
  </header>

  <section class="card pick" aria-label={t('Choose what you see')}>
    <div class="pr">
      <span class="pl" id="an-src">{t('Data from|analyse')}</span>
      <div class="chips" role="group" aria-labelledby="an-src">
        {#each SOURCES as s (s)}
          <button type="button" class="chip" class:on={on.includes(s)} aria-pressed={on.includes(s)} data-src={s} onclick={() => toggle(s)}><i class="dot {s}" aria-hidden="true"></i>{t(SRC_NAMES[s])}</button>
        {/each}
      </div>
    </div>
    <div class="pr">
      <span class="pl" id="an-period">{t('Period|tk')}</span>
      <Seg options={periodOpts} value={String(period)} onchange={(v) => (period = Number(v))} labelledby="an-period" full={false} />
    </div>
    <div class="pr">
      <span class="pl" id="an-all">{t('Show|analyse')}</span>
      <button type="button" class="chip" class:on={all} aria-pressed={all} data-all onclick={() => (all = !all)} aria-labelledby="an-all">{t('Also values without data')}</button>
    </div>
  </section>

  <div class="tabs" role="tablist" aria-label={t('Parts of the analysis|analyse')}>
    {#each TABS as k (k)}
      <button type="button" role="tab" class="tab" class:on={tab === k} aria-selected={tab === k} data-tab={k} onclick={() => (tab = k)}>{t(TAB_NAMES[k])}</button>
    {/each}
  </div>

  {#if loading}
    <p class="hint" role="status">{t('Loading …')}</p>
  {:else if tab === 'ueberblick'}
    {#if on.length}<Ueberblick {days} {byKey} acts={data.acts} log={data.log} {on} onday={(d) => (dayOpen = d)} />{/if}
  {:else if tab === 'diagramm'}
    <section class="card vw" aria-label={t('Views|views')}><Ansichten {views} now={nowShown} onapply={applyView} /></section>
    {#key dgRun}<Diagramm {groups} {byKey} rowOf={(d) => data.table.get(d)} trips={data.trips} acts={data.acts} log={data.log} {today} start={dgStart} onstate={(st) => (dgState = st)} />{/key}
  {:else if tab === 'vergleiche'}
    <Vergleiche {byKey} acts={data.acts} log={data.log} trips={data.trips} {today} />
  {:else if tab === 'rekorde'}
    <Muster {days} {byKey} acts={data.acts} log={data.log} {today} />
  {:else if tab === 'velos'}
    <VeloKm {days} {today} />
  {:else}
      {#if !on.length}
        <Empty text={t('Switch on at least one source above, then your values show here.')} />
      {:else if !shownGroups.length}
        <Empty text={t('No values in this period yet. Connect Fitbit or Strava, or tick an activity in Aktiv.')} action={{ label: t('Open Aktiv'), href: '#/flow' }} />
      {:else}
        <p class="gall"><button type="button" class="chip" data-groups-toggle onclick={() => (openG = allOpen ? [] : shownGroups.map((g) => g.key))}>{allOpen ? t('Close all groups|analyse') : t('Open all groups|analyse')}</button></p>
        {#each shownGroups as g (g.key)}
          <details class="grp" data-group={g.key} open={openG.includes(g.key)} ontoggle={(e) => toggleG(g.key, e.currentTarget.open)}>
            <summary class="gh">
              <h2 id="an-g-{g.key}">{g.name}</h2>
              <small>{t('{n} values|analyse', { n: g.tiles.length })}</small>
            </summary>
            <ul class="tiles">
              {#each g.tiles as x (x.key)}
                <li>
                  <svelte:element this={x.href && !x.empty ? 'a' : 'div'} class="tile" class:empty={x.empty} href={x.href && !x.empty ? x.href : undefined} data-value={x.key}>
                    <span class="nm"><span class="tx">{x.name}</span>{#if x.href && !x.empty}<ChevronRight size={14} aria-hidden="true" />{/if}</span>
                    <span class="v num"><b>{valueText(x)}</b>{#if unitText(x) && !x.empty}<small>{unitText(x)}</small>{/if}</span>
                    <span class="how">{howText(x)}</span>
                {#if deltaOf(x)}{@const dl = deltaOf(x)}<span class="dl" data-delta={dl.up ? 'up' : 'down'}>{dl.up ? '▲' : '▼'} {dl.text} {dl.up ? t('more than before|analyse') : t('less than before|analyse')}</span>{/if}
                    <svg class="sp" class:bars={x.sum} viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
                      {#if x.empty}
                        <line x1="0" y1="14" x2="100" y2="14" class="none" vector-effect="non-scaling-stroke" />
                      {:else if x.sum || x.bars}
                        {@const top = Math.max(...x.spark.map((v) => v ?? 0), 1)}
                        {#each x.spark as v, i (i)}
                          {#if v}<rect x={(i * 100) / x.spark.length + 0.6} width={Math.max(100 / x.spark.length - 1.2, 0.8)} y={28 - (v / top) * 26} height={(v / top) * 26} rx="0.8" />{/if}
                        {/each}
                      {:else}
                        <path d={sparkPath(x.spark)} vector-effect="non-scaling-stroke" />
                      {/if}
                    </svg>
                  </svelte:element>
                </li>
              {/each}
            </ul>
          </details>
        {/each}
        <p class="hint">{#if all}{t('Dashed tiles have no data in this period yet. New Fitbit values come with the next fetch:')} <a href="#/me/fitbit">{t('Fitbit')}</a>{:else}{ t('A value without any day in this period is left out; «Also values without data» shows every value. Values come from your Fitbit (Google), Strava and what you enter or tick in the app.')}{/if}</p>
      {/if}
  {/if}
</div>
{#if dayOpen}
  <DaySheet day={dayOpen} {groups} {today} rowOf={(d) => data.table.get(d)} log={data.log} acts={data.acts} tripName={data.trips.find((tr) => tr.startDate && tr.startDate <= dayOpen && (tripEnd(tr) ?? tr.startDate) >= dayOpen)?.name ?? ''} onday={(d) => (dayOpen = d)} onclose={closeDay} />
{/if}
{/if}

<style>
  .an {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .pick {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 28px;
    align-items: flex-start;
  }
  .tabs {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 2px;
  }
  .tab {
    flex: none;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--card);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .tab.on {
    border-color: var(--hi);
    background: var(--hi-soft);
    font-weight: 600;
  }
  .vw {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .pr {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .pl {
    color: var(--ink-3);
    font-size: var(--fs-label);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    padding: 4px 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .chip.on {
    border-color: var(--hi);
    background: var(--hi-soft);
    color: var(--ink);
    font-weight: 600;
  }
  .chip:not(.on) .dot {
    opacity: 0.35;
  }
  @media (pointer: coarse) {
    .chip {
      min-height: 44px;
    }
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--ink-3);
  }
  .dot.aktiv {
    background: var(--hi);
  }
  .dot.fitbit {
    background: var(--g3);
  }
  .dot.strava {
    background: var(--warm);
  }
  .dot.body {
    background: var(--l4);
  }
  .dot.check {
    background: var(--pz4, var(--warm));
  }
  .grp {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .gh {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    min-height: 44px;
    cursor: pointer;
    list-style: none;
  }
  .gh::-webkit-details-marker {
    display: none;
  }
  .gh::before {
    content: '▸';
    color: var(--ink-3);
    margin-right: 6px;
  }
  .grp[open] > .gh::before {
    content: '▾';
  }
  .gh h2 {
    flex: 1;
  }
  .grp[open] > .gh {
    margin-bottom: 8px;
  }
  .gall {
    margin: 0;
  }
  .dl {
    color: var(--ink-2, var(--ink-3));
    font-size: var(--fs-label);
  }
  .gh h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .gh small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tile {
    display: flex;
    flex-direction: column;
    gap: 2px;
    height: 100%;
    box-sizing: border-box;
    padding: 10px 12px;
    border: 1px solid var(--card-line, var(--line));
    border-radius: 14px;
    background: var(--paper);
    color: var(--ink);
    text-decoration: none;
  }
  .tile.empty {
    border-style: dashed;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .sp .none {
    stroke: var(--line);
    stroke-width: 2;
    stroke-dasharray: 4 4;
  }
  a.tile:hover {
    background: var(--paper-2);
  }
  .tile:focus-visible {
    outline: 2px solid var(--hi);
    outline-offset: 2px;
  }
  .nm {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 4px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .nm .tx {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .nm :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--ink-3);
  }
  .v {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }
  .v b {
    font-size: var(--fs-sub);
    font-weight: 600;
  }
  .v small,
  .how {
    color: var(--ink-3);
    font-size: var(--fs-label);
  }
  .sp {
    width: 100%;
    height: 44px;
    margin-top: 4px;
  }
  .sp path {
    fill: none;
    stroke: var(--hi);
    stroke-width: 2;
    stroke-linejoin: round;
  }
  .sp rect {
    fill: var(--hi);
    fill-opacity: 0.6;
  }
  .hint {
    color: var(--ink-3);
    font-size: var(--fs-small);
    margin: 0;
  }
</style>
