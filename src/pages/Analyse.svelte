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
  $effect(() => {
    const on = () => (hash = location.hash);
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  });
  const detailKey = $derived(keyOf(hash));

  const today = localDay();
  const LS = 'pg.analyse';
  const saved = (() => {
    try {
      return JSON.parse(localStorage.getItem(LS) ?? '{}') ?? {};
    } catch {
      return {};
    }
  })();
  let period = $state(PERIODS.includes(saved.period) ? saved.period : DEFAULT_PERIOD);
  let on = $state(Array.isArray(saved.on) ? SOURCES.filter((s) => saved.on.includes(s)) : [...SOURCES]);
  // «Alle Werte» (Noah 27.10.2026 «zumindest optional»): also the values without any day, as dashed tiles
  let all = $state(saved.all === true);
  $effect(() => {
    try {
      localStorage.setItem(LS, JSON.stringify({ period, on, all }));
    } catch {
      /* a private window: the choice is only for now */
    }
  });
  const toggle = (s) => (on = on.includes(s) ? on.filter((x) => x !== s) : SOURCES.filter((x) => x === s || on.includes(x)));

  const data = analyseData({ from: () => days[0] });
  const days = $derived(periodDays(today, period));
  const groups = $derived(analyseGroups({ table: data.table, weights: data.weights, ctx: data.ctx, acts: data.acts, log: data.log, ownKeys: data.ownKeys, period }));
  const shownGroups = $derived(tilesOf(groups, days, on, { all }));
  const loading = $derived(data.loading);

  const SRC_NAMES = { aktiv: 'Aktiv', fitbit: 'Fitbit', strava: 'Strava', body: 'Body|group', check: "Wi gaht's?|analyse" };
  const periodOpts = $derived(PERIODS.map((p) => ({ key: String(p), name: p === 365 ? t('Year|analyse') : t('{n} days|analyse', { n: p }) })));

  const valueText = (x) => fmtValue(x, x.value, num);
  const howText = (x) =>
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
  {#key detailKey}<AnalyseWert key={detailKey} />{/key}
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

  {#if loading}
    <p class="hint" role="status">{t('Loading …')}</p>
  {:else if !on.length}
    <Empty text={t('Switch on at least one source above, then your values show here.')} />
  {:else if !shownGroups.length}
    <Empty text={t('No values in this period yet. Connect Fitbit or Strava, or tick an activity in Aktiv.')} action={{ label: t('Open Aktiv'), href: '#/flow' }} />
  {:else}
    {#each shownGroups as g (g.key)}
      <section class="grp" data-group={g.key} aria-labelledby="an-g-{g.key}">
        <div class="gh">
          <h2 id="an-g-{g.key}">{g.name}</h2>
          <small>{t('{n} values|analyse', { n: g.tiles.length })}</small>
        </div>
        <ul class="tiles">
          {#each g.tiles as x (x.key)}
            <li>
              <svelte:element this={x.href && !x.empty ? 'a' : 'div'} class="tile" class:empty={x.empty} href={x.href && !x.empty ? x.href : undefined} data-value={x.key}>
                <span class="nm"><span class="tx">{x.name}</span>{#if x.href && !x.empty}<ChevronRight size={14} aria-hidden="true" />{/if}</span>
                <span class="v num"><b>{valueText(x)}</b>{#if unitText(x) && !x.empty}<small>{unitText(x)}</small>{/if}</span>
                <span class="how">{howText(x)}</span>
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
      </section>
    {/each}
    <p class="hint">{#if all}{t('Dashed tiles have no data in this period yet. New Fitbit values come with the next fetch:')} <a href="#/me/fitbit">{t('Fitbit')}</a>{:else}{ t('A value without any day in this period is left out; «Also values without data» shows every value. Values come from your Fitbit (Google), Strava and what you enter or tick in the app.')}{/if}</p>
  {/if}
</div>
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
    height: 28px;
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
