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
  import { liveQuery } from 'dexie';
  import { ChevronRight } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import Crumb from '../lib/flow/kit/Crumb.svelte';
  import PageHead from '../lib/ui/PageHead.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { tableQuery } from '../lib/messwerte-data.js';
  import { bodyOf, kindDay, BODY, KIND_ORDER, ownBodyKeys, ownBodyDays } from '../lib/uebersicht.js';
  import { AB_KEY, configOf } from '../lib/abfragen.js';
  import { bodyExtras } from '../lib/form-data.js';
  import { kgOn } from '../lib/weight.js';
  import { weight } from '../lib/weight.svelte.js';
  import { BP_KEY, WATER_KEY, bpEntries, waterEntries, medByDay, bedText } from '../lib/koerper.js';
  import { zones } from '../lib/strava/zones.svelte.js';
  import { shown } from '../lib/messwerte.js';
  import { normAct } from '../lib/flow.js';
  import { actName } from '../lib/flow/ui.svelte.js';
  import { sportName } from '../lib/flow/garmin/words.js';
  import { PERIODS, DEFAULT_PERIOD, SOURCES, sourceOf, periodDays, tilesOf, ticksByDay, tickPeriod, sparkPath } from '../lib/analyse.js';
  import { localDay } from '../lib/localday.js';
  import { t, num } from '../lib/i18n.svelte.js';

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
  $effect(() => {
    try {
      localStorage.setItem(LS, JSON.stringify({ period, on }));
    } catch {
      /* a private window: the choice is only for now */
    }
  });
  const toggle = (s) => (on = on.includes(s) ? on.filter((x) => x !== s) : SOURCES.filter((x) => x === s || on.includes(x)));

  const q = tableQuery();
  const table = $derived($q ?? new Map());
  const get = async (k) => (await db.settings.get(k))?.value ?? null;
  const flowQ = liveQuery(async () => {
    const [acts, log] = await Promise.all([db.flowActs.toArray(), db.flowLog.toArray()]);
    return { acts: acts.map(normAct).sort((a, b) => a.order - b.order), log };
  });
  const checksQ = liveQuery(() => (db.flowChecks ? db.flowChecks.toArray() : []));
  const abQ = liveQuery(() => db.settings.get(AB_KEY));
  const ansQ = liveQuery(() => (db.abAnswers ? db.abAnswers.toArray() : []));
  const bpQ = liveQuery(() => get(BP_KEY));
  const waterQ = liveQuery(() => get(WATER_KEY));

  const days = $derived(periodDays(today, period));
  const ownKeys = $derived(ownBodyKeys(configOf($abQ?.value).own));
  const weights = $derived(new Map(weight.entries.map((e) => [e.day, e.kg])));
  const ctx = $derived({
    ...bodyExtras({ table, checks: $checksQ ?? [], from: days[0], to: today }),
    kgOn: (d) => kgOn(weight.entries, d),
    bounds: zones.bounds,
    med: medByDay($flowQ?.log ?? []),
    water: new Map(waterEntries($waterQ).map((e) => [e.day, e.l])),
    bp: new Map(bpEntries($bpQ).map((e) => [e.day, e])),
    ab: ownBodyDays($ansQ ?? [], ownKeys),
  });

  // one value of uebersicht.js BODY: its name, unit, source and own page (Körperwerte)
  const body = (key, extra = {}) => ({
    key,
    name: t(BODY[key].name),
    unit: BODY[key].unit,
    src: sourceOf(BODY[key].src),
    sum: !!BODY[key].sum,
    href: `#/flow/stats/${key}`,
    get: (d) => bodyOf(table, d, key, weights, ctx, extra.part ?? null),
    ...extra,
  });
  const PART = { sleep: 'Sleep|flow', energy: 'Energy', mood: 'Mood' };
  const groups = $derived([
    {
      key: 'heart',
      name: t('Heart|group'),
      items: [
        { key: 'rhr', name: t('Resting pulse'), unit: 'bpm', src: 'fitbit', href: '#/flow/stats/hr', get: (d) => table.get(d)?.rhr },
        { key: 'hrMax', name: t('Highest pulse of the day'), unit: 'bpm', src: 'fitbit', href: '#/flow/stats/hr', get: (d) => table.get(d)?.hrMax },
        body('hrv'),
        body('spo2'),
        body('breath'),
        body('bp', { key: 'bp', part: 'sys', name: t('Blood pressure') }),
      ],
    },
    { key: 'sleep', name: t('Sleep|group'), items: [body('sleep'), body('eff'), body('bed'), body('skin')] },
    { key: 'move', name: t('Movement|analyse'), items: [body('azm'), body('steps'), body('kcal'), body('zones'), body('load')] },
    {
      key: 'sports',
      name: t('Sports and bike|analyse'),
      items: [
        ...KIND_ORDER.map((k) => ({ key: `km:${k}`, name: sportName(k), unit: 'km', src: 'strava', sum: true, href: `#/flow/stats/${k}`, get: (d) => kindDay(table.get(d), k).km || null })),
        body('wkg'),
        body('cad'),
        body('spd'),
      ],
    },
    { key: 'body', name: t('Body|group'), items: [body('weight'), body('water'), body('ready')] },
    {
      key: 'felt',
      name: t("Wi gaht's?|analyse"),
      items: [
        ...Object.entries(PART).map(([p, n]) => body('felt', { key: `felt:${p}`, part: p, name: t(n) })),
        // an own question keeps the name you typed (never through t())
        ...ownKeys.map((k) => ({ key: k.key, name: k.name, unit: k.unit ?? '', src: 'check', href: `#/flow/stats/${k.key}`, get: (d) => bodyOf(table, d, k.key, weights, ctx) })),
      ],
    },
    {
      key: 'aktiv',
      name: t('Your activities in Aktiv'),
      items: ($flowQ?.acts ?? []).map((a) => {
        const by = ticksByDay($flowQ.log, a.id);
        return { key: `act:${a.id}`, name: actName(a), unit: '×', src: 'aktiv', sum: true, tick: true, href: `#/flow/auswertung?act=${encodeURIComponent(a.id)}&p=${tickPeriod(period)}`, get: (d) => by.get(d) ?? null };
      }),
    },
  ]);
  const shownGroups = $derived(tilesOf(groups, days, on));
  const loading = $derived($q === undefined || $flowQ === undefined);

  const SRC_NAMES = { aktiv: 'Aktiv', fitbit: 'Fitbit', strava: 'Strava', body: 'Body|group', check: "Wi gaht's?|analyse" };
  const periodOpts = $derived(PERIODS.map((p) => ({ key: String(p), name: p === 365 ? t('Year|analyse') : t('{n} days|analyse', { n: p }) })));

  /** The big number of a tile, in the unit people know. */
  function valueText(x) {
    const v = x.value;
    if (v == null) return '–';
    if (x.key === 'sleep') return shown('sleep', v, num);
    if (x.key === 'bed') return bedText(v);
    if (x.key === 'skin') return `${v > 0 ? '+' : ''}${num(Math.round(v * 10) / 10)}`;
    if (Math.abs(v) < 20 && !x.sum) return num(Math.round(v * 10) / 10);
    return num(Math.round(v));
  }
  const unitText = (x) => (x.key === 'sleep' || x.key === 'bed' ? '' : x.unit);
  const howText = (x) => (x.tick ? t('in {n} days|analyse', { n: period }) : x.sum ? t('total|analyse') : t('average|analyse'));
</script>

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
              <a class="tile" href={x.href} data-value={x.key}>
                <span class="nm"><span class="tx">{x.name}</span><ChevronRight size={14} aria-hidden="true" /></span>
                <span class="v num"><b>{valueText(x)}</b>{#if unitText(x)}<small>{unitText(x)}</small>{/if}</span>
                <span class="how">{howText(x)}</span>
                <svg class="sp" class:bars={x.sum} viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
                  {#if x.sum}
                    {@const top = Math.max(...x.spark.map((v) => v ?? 0), 1)}
                    {#each x.spark as v, i (i)}
                      {#if v}<rect x={(i * 100) / x.spark.length + 0.6} width={Math.max(100 / x.spark.length - 1.2, 0.8)} y={28 - (v / top) * 26} height={(v / top) * 26} rx="0.8" />{/if}
                    {/each}
                  {:else}
                    <path d={sparkPath(x.spark)} vector-effect="non-scaling-stroke" />
                  {/if}
                </svg>
              </a>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
    <p class="hint">{t('A value without any day in this period is left out. Values come from your Fitbit (Google), Strava and what you enter or tick in the app.')}</p>
  {/if}
</div>

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
  .tile:hover {
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
