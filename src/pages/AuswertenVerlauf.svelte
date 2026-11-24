<script>
  /**
   * «Auswerten neu» Teil 3 (Noah 24.11.2026 «1b 2a 3b 4a 5a», «über die Jahre verteilt», Entwurf C «Cockpit»): the tab «Verlauf» of Auswerten
   * (#/auswerten/verlauf). HRV, resting pulse and sleep over 4 weeks, 12 weeks, 6 months or 2 years with YOUR OWN usual range of the
   * last 12 months as a soft band behind the line; «Dein Normal über die Jahre» (one band per year on a shared scale); and what the data of
   * your watch shows about bedtime and about a long ride (two patterns found by plain rules, each group needs at least 15 nights).
   * Observation only: never a cause, never a comparison with other people.
   */
  import { liveQuery } from 'dexie';
  import LineChart from '../lib/charts/LineChart.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { Activity } from '@lucide/svelte';
  import YearBands from '../lib/auswerten/YearBands.svelte';
  import TipLine from '../lib/pageinfo/TipLine.svelte';
  import PageMore from '../lib/pageinfo/PageMore.svelte';
  import PageTiles from '../lib/sk/PageTiles.svelte';
  import { db } from '../lib/db.js';
  import { loadTable } from '../lib/messwerte-data.js';
  import { shown } from '../lib/messwerte.js';
  import { addDays } from '../lib/health.js';
  import { PART_NAMES } from '../lib/flow/form/words.js';
  import { normalOf, normalYears, NORMAL_KEYS } from '../lib/auswerten/normal.js';
  import { bedtimeGroups, rideGroups, MIN_NIGHTS } from '../lib/auswerten/muster.js';
  import { SPANS, SPAN_DEFAULT, seriesOf, axisValue } from '../lib/auswerten/verlauf.js';
  import { localDay } from '../lib/localday.js';
  import { t, num, locale } from '../lib/i18n.svelte.js';
  import '../lib/ich/ich.css';
  import '../lib/training/charts.css';

  const today = localDay();
  const q = liveQuery(async () => ({ table: await loadTable(db) }));
  const table = $derived($q?.table ?? null);
  const has = $derived(!!table && NORMAL_KEYS.some((k) => normalYears(table, k).all));

  let spanKey = $state(SPAN_DEFAULT);
  try {
    const saved = localStorage.getItem('auswerten.verlauf.span');
    if (SPANS.some((s) => s.key === saved)) spanKey = saved;
  } catch {
    /* no storage: the default */
  }
  const span = $derived(SPANS.find((s) => s.key === spanKey) ?? SPANS[1]);
  function pickSpan(k) {
    spanKey = k;
    try {
      localStorage.setItem('auswerten.verlauf.span', k);
    } catch {
      /* ignore */
    }
  }
  const options = $derived(SPANS.map((s) => ({ key: s.key, name: t(s.name) })));

  const UNIT = { hrv: 'ms', rhr: 'bpm', sleep: '' };
  const val = (key, v) => (v == null ? '–' : `${shown(key, v, num)}${UNIT[key] ? ` ${UNIT[key]}` : ''}`);
  const loc = $derived(locale());
  const dayTxt = (day, o) => new Date(`${day}T12:00:00Z`).toLocaleDateString(loc, { ...o, timeZone: 'UTC' });

  /* one chart per value */
  const charts = $derived(
    !table
      ? []
      : NORMAL_KEYS.map((key) => {
          const s = seriesOf(table, key, today, span.days, span.grain);
          const normal = normalOf(table, key, today);
          const color = key === 'hrv' ? 'var(--ch-w)' : key === 'rhr' ? 'var(--ch-hr)' : 'var(--ch-b)';
          const step = Math.max(1, Math.round(s.cols.length / 5));
          const cols = s.cols.map((c, i) => ({ key: c.key, x: i % step === step >> 1 ? (span.days > 200 ? dayTxt(c.from, { month: 'short', year: '2-digit' }) : dayTxt(c.from, { day: 'numeric', month: 'short' })) : '' }));
          const values = s.v.map((v) => axisValue(key, v));
          const band = normal ? { from: axisValue(key, normal.q1), to: axisValue(key, normal.q3), text: '' } : null;
          const readout = (i) => ({
            title: span.grain === 'week' ? `${dayTxt(s.cols[i].from, { day: 'numeric', month: 'short', year: 'numeric' })} – ${dayTxt(s.cols[i].to, { day: 'numeric', month: 'short' })}` : dayTxt(s.cols[i].from, { weekday: 'short', day: 'numeric', month: 'short' }),
            items: [{ label: t(PART_NAMES[key]), value: val(key, s.v[i]), color }],
          });
          const tab = { head: [t('Day|verlauf'), t(PART_NAMES[key])], rows: [...s.cols.keys()].reverse().map((i) => ({ key: s.cols[i].key, cells: [dayTxt(s.cols[i].from, { day: 'numeric', month: 'short', year: '2-digit' }), val(key, s.v[i])] })) };
          return { key, cols, series: [{ key, color, v: values }], band, readout, table: tab, has: values.some((v) => v != null), normal, unit: key === 'sleep' ? 'h' : UNIT[key] };
        }),
  );

  /* your normal by year */
  const years = $derived(table ? Object.fromEntries(NORMAL_KEYS.map((k) => [k, normalYears(table, k)])) : {});
  const fmtYear = (key) => (v) => val(key, v);

  /* the two patterns */
  const bed = $derived(table ? bedtimeGroups(table) : []);
  const ride = $derived(table ? rideGroups(table, addDays) : []);
  const BED = ['Before 22:30', '22:30 to midnight', 'Midnight to 01:30', 'After 01:30'];
  const RIDE = { none: 'No ride that day', short: 'Under 1 h', mid: '1 to 3 h', long: 'Over 3 h' };
  const rowsOf = (list, nameOf, keyOf) => {
    const hs = list.filter((g) => g.hrv != null).map((g) => g.hrv);
    const lo = Math.min(...hs) * 0.9;
    const hi = Math.max(...hs) || 1;
    return list.map((g) => ({ ...g, name: nameOf(g), k: keyOf(g), ok: g.n >= MIN_NIGHTS && g.hrv != null, pct: g.hrv != null ? Math.round(((g.hrv - lo) / (hi - lo || 1)) * 100) : 0 }));
  };
  const bedRows = $derived(rowsOf(bed, (g) => t(BED[g.group]), (g) => String(g.group)));
  const rideRows = $derived(rowsOf(ride, (g) => t(RIDE[g.key]), (g) => g.key));
</script>

<div class="vl" data-page="auswerten-verlauf">
  <header class="ph">
    <h1 class="title">{t('Analysis|place')}</h1>
    <p class="sub">{t('How your values moved, against your own usual. Only to look at, nothing is graded.')}</p>
  </header>

  {#if !table}
    <p class="hint" aria-live="polite">{t('Loading…')}</p>
  {:else if !has}
    <Empty icon={Activity} title={t('No values from your watch yet')} text={t('HRV, resting pulse and sleep come with Fitbit. After 30 days with a value, your usual range appears here.')} action={{ label: t('Connect your data'), href: '#/auswerten/quellen' }} />
  {:else}
    <section class="card blk" aria-label={t('Period')}>
      <Seg full label={t('Period')} value={spanKey} onchange={pickSpan} {options} />
    </section>

    {#each charts as c (c.key)}
      {#if c.has}
        <section class="card blk" aria-labelledby="vl-{c.key}" data-verlauf-chart={c.key}>
          <h2 id="vl-{c.key}" class="h2">{t(PART_NAMES[c.key])}</h2>
          <p class="det">{c.normal ? t('The soft band is your usual range of the last 12 months: {lo} to {hi}.', { lo: val(c.key, c.normal.q1), hi: val(c.key, c.normal.q3) }) : t('Your usual range comes after 30 days with this value.')}</p>
          <LineChart id="vl-{c.key}" cols={c.cols} series={c.series} band={c.band} readout={c.readout} table={c.table} unit={c.unit} label={t('{name} over {n} days', { name: t(PART_NAMES[c.key]), n: span.days })} hint={t('Point at a day for its value.')} />
        </section>
      {/if}
    {/each}

    <section class="card blk" aria-labelledby="vl-years" data-verlauf-years>
      <h2 id="vl-years" class="h2">{t('Your normal over the years')}</h2>
      <p class="det">{t('Per year: the light band holds nearly all your days, the dark band the middle half, the tick the middle. A different year is only a different year.')}</p>
      {#each NORMAL_KEYS as key (key)}
        {#if years[key]?.years?.length}
          <h3 class="h3">{t(PART_NAMES[key])}</h3>
          <YearBands rows={years[key].years} all={years[key].all} fmt={fmtYear(key)} label={t(PART_NAMES[key])} />
        {/if}
      {/each}
    </section>

    {#if bedRows.length || rideRows.length}
      <section class="card blk" aria-labelledby="vl-good" data-verlauf-good>
        <h2 id="vl-good" class="h2">{t('What your data shows')}</h2>
        <p class="det">{t('Two patterns in all your nights. An observation, not a cause: many things change together.')}</p>
        {#if bedRows.length}
          <h3 class="h3">{t('HRV by the hour you went to bed')}</h3>
          <ul class="pat" data-pattern="bed">
            {#each bedRows as g (g.k)}
              <li class:dim={!g.ok}>
                <span class="nm">{g.name}</span>
                <span class="trk" aria-hidden="true"><b style:width="{g.ok ? Math.max(4, g.pct) : 0}%"></b></span>
                <span class="v num">{g.ok ? val('hrv', g.hrv) : '–'}</span>
                <small class="n num">{g.ok ? t('{n} nights', { n: num(g.n) }) : t('too few nights')}</small>
              </li>
            {/each}
          </ul>
        {/if}
        {#if rideRows.length}
          <h3 class="h3">{t('HRV in the night after a ride')}</h3>
          <ul class="pat" data-pattern="ride">
            {#each rideRows as g (g.k)}
              <li class:dim={!g.ok}>
                <span class="nm">{g.name}</span>
                <span class="trk" aria-hidden="true"><b style:width="{g.ok ? Math.max(4, g.pct) : 0}%"></b></span>
                <span class="v num">{g.ok ? val('hrv', g.hrv) : '–'}</span>
                <small class="n num">{g.ok ? t('{n} nights', { n: num(g.n) }) : t('too few nights')}</small>
              </li>
            {/each}
          </ul>
        {/if}
        <p class="det">{t('The bars start near the lowest group, so small differences look bigger than they are. Read the numbers.')}</p>
      </section>
    {/if}
  {/if}

  <TipLine page="aktiv" name={t('Analysis|place')} />
  <PageMore page="aktiv" name={t('Analysis|place')} />
  <PageTiles page="flow" />
</div>

<style>
  .vl {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 880px;
    margin: 0 auto;
    min-width: 0;
  }
  .ph .sub {
    margin: var(--sp-1) 0 0;
    color: var(--ink-3);
    font: 400 var(--fs-body) / 1.45 var(--font-body);
  }
  .blk {
    padding: var(--sp-4);
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }
  .h2 {
    margin: 0;
    font: 600 var(--fs-h3, 1.1rem) / 1.25 var(--font-body);
    color: var(--ink);
  }
  .h3 {
    margin: var(--sp-3) 0 var(--sp-1);
    font: 600 var(--fs-body) / 1.3 var(--font-body);
    color: var(--ink-2);
  }
  .det {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .pat {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .pat li {
    display: grid;
    grid-template-columns: minmax(7.5em, 10em) minmax(0, 1fr) 4.5em;
    grid-template-areas: 'nm trk v' '. n n';
    align-items: center;
    gap: 2px 8px;
    font-size: var(--fs-small);
  }
  .nm {
    grid-area: nm;
  }
  .trk {
    grid-area: trk;
    height: 10px;
    border-radius: var(--r-1);
    background: var(--paper-2);
    overflow: hidden;
  }
  .trk b {
    display: block;
    height: 100%;
    border-radius: var(--r-1);
    background: color-mix(in srgb, var(--accent) 55%, var(--accent-soft));
  }
  .v {
    grid-area: v;
    text-align: right;
    font-weight: 600;
  }
  .n {
    grid-area: n;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    text-align: right;
  }
  .dim {
    opacity: 0.6;
  }
</style>
