<script>
  /**
   * «Was Bewegung mit dir macht» (Noah 27.11.2026 «aktivzonenminuten pro woche vgl mit ruheherzfrequenz pro woche … oder andere sinnvolle»,
   * «4a», Paket B): the active zone minutes of each week as bars and, under them, your resting pulse, HRV or sleep of the same week as a
   * line (the chips choose which), so the weeks line up. One sentence says how the week AFTER weeks with more active zone minutes looked,
   * over all weeks the app knows (relation(): a pattern, never a cause; under 20 weeks or a tiny difference it says nothing).
   * The period is the shared switch of the page (at least 12 weeks, a year shows 52). The rules are flow/hakengesundheit.js.
   * table: the day table of the app (loadTable); today: the local day.
   */
  import BarChart from '../charts/BarChart.svelte';
  import LineChart from '../charts/LineChart.svelte';
  import ChipChoice from '../ui/ChipChoice.svelte';
  import { hoursMin } from '../charts/exact.js';
  import { shownWeeks, relation, METRIC_KEYS } from './hakengesundheit.js';
  import { hakenSpan } from './haken-zeitraum.svelte.js';
  import { addDays } from '../flow.js';
  import { dnum } from './words.js';
  import { PART_NAMES } from './form/words.js';
  import { t, num, locale } from '../i18n.svelte.js';

  let { table = new Map(), today } = $props();

  let metric = $state('rhr');
  const weeks = $derived(shownWeeks(table, today, hakenSpan.v));
  const loc = $derived(locale());
  const dayTxt = (day, o) => new Date(`${day}T12:00:00Z`).toLocaleDateString(loc, { ...o, timeZone: 'UTC' });
  const few = $derived(weeks.length <= 14);
  const monthOf = (key) => Number(addDays(key, 3).slice(5, 7));
  const xOf = (w, i) => (few ? ((weeks.length - 1 - i) % 3 === 0 ? `${dnum(w.key)}.${Number(w.key.slice(5, 7))}.` : '') : i && monthOf(weeks[i - 1].key) !== monthOf(w.key) && (monthOf(w.key) - 1) % 2 === 0 ? dayTxt(addDays(w.key, 3), { month: 'short' }).replace('.', '') : '');

  const OPTIONS = $derived(METRIC_KEYS.map((k) => ({ value: k, label: t(PART_NAMES[k]) })));
  const UNIT = { rhr: 'bpm', hrv: 'ms', sleep: 'h' };
  const dec = (v) => num(Math.round(v * 10) / 10);
  const valueText = (k, v) => (v == null ? t('no value') : k === 'sleep' ? hoursMin(v) : `${dec(v)} ${UNIT[k]}`);

  const azmCols = $derived(weeks.map((w, i) => ({ key: w.key, x: xOf(w, i), top: few && w.azm ? String(Math.round(w.azm)) : '', dashed: w.current && w.azm > 0, parts: [{ v: w.azm ?? 0, color: 'var(--ch-w)' }] })));
  const azmReadout = (i) => ({ title: `${t('Week of {d}', { d: dayTxt(weeks[i].key, { day: 'numeric', month: 'long' }) })}${weeks[i].current ? ` (${t('running')})` : ''}`, extra: '', items: [{ label: t('Active zone minutes|metric'), value: weeks[i].azm == null ? t('no value') : `${num(Math.round(weeks[i].azm))} ${t('min')}` }] });
  const azmTable = $derived({ head: [t('Week of|wp'), t('Active zone minutes|metric')], rows: [...weeks].reverse().map((w) => ({ key: w.key, cells: [dayTxt(w.key, { day: 'numeric', month: 'short' }), w.azm == null ? '–' : num(Math.round(w.azm))] })) });
  const azmAria = $derived(weeks.map((w) => `${dayTxt(w.key, { day: 'numeric', month: 'short' })}: ${w.azm == null ? t('no value') : Math.round(w.azm)}`).join(', '));

  const lineCols = $derived(weeks.map((w, i) => ({ key: w.key, x: xOf(w, i) })));
  const lineSeries = $derived([{ key: metric, color: 'var(--ch-hr)', dots: few, v: weeks.map((w) => (w[metric] == null ? null : metric === 'sleep' ? w[metric] / 60 : w[metric])) }]);
  const lineReadout = (i) => ({ title: t('Week of {d}', { d: dayTxt(weeks[i].key, { day: 'numeric', month: 'long' }) }), items: [{ label: t(PART_NAMES[metric]), value: valueText(metric, weeks[i][metric]), color: 'var(--ch-hr)' }] });
  const lineTable = $derived({ head: [t('Week of|wp'), t(PART_NAMES[metric])], rows: [...weeks].reverse().map((w) => ({ key: w.key, cells: [dayTxt(w.key, { day: 'numeric', month: 'short' }), w[metric] == null ? '–' : valueText(metric, w[metric])] })) });
  const lineAria = $derived(weeks.map((w) => `${dayTxt(w.key, { day: 'numeric', month: 'short' })}: ${valueText(metric, w[metric])}`).join(', '));

  const none = $derived(weeks.every((w) => w.azm == null));
  const rel = $derived(relation(table, today, metric));
  const SENT = {
    'rhr-lower': 'In weeks with more active zone minutes, your resting pulse in the week after was lower: {a} instead of {b} beats per minute ({n} weeks since {y}).',
    'rhr-higher': 'In weeks with more active zone minutes, your resting pulse in the week after was higher: {a} instead of {b} beats per minute ({n} weeks since {y}).',
    'hrv-higher': 'In weeks with more active zone minutes, your HRV in the week after was higher: {a} instead of {b} ms ({n} weeks since {y}).',
    'hrv-lower': 'In weeks with more active zone minutes, your HRV in the week after was lower: {a} instead of {b} ms ({n} weeks since {y}).',
    'sleep-higher': 'In weeks with more active zone minutes, your sleep in the week after was longer: {a} instead of {b} ({n} weeks since {y}).',
    'sleep-lower': 'In weeks with more active zone minutes, your sleep in the week after was shorter: {a} instead of {b} ({n} weeks since {y}).',
  };
  const sentence = $derived.by(() => {
    if (!rel) return t('Not enough weeks yet to compare the weeks.');
    if (rel.verdict === 'none') return t('No clear difference between the weeks with more and fewer active zone minutes ({n} weeks since {y}).', { n: num(rel.n), y: rel.since });
    const fmt = (v) => (metric === 'sleep' ? hoursMin(v) : dec(v));
    return t(SENT[`${metric}-${rel.direction}`], { a: fmt(rel.high), b: fmt(rel.low), n: num(rel.n), y: rel.since });
  });
</script>

<section class="card gk" aria-labelledby="gk-h" data-gesundheit>
  <h2 id="gk-h" class="h2">{t('What movement does for you')}</h2>
  <p class="det">{t('Active zone minutes per week, and under them your resting pulse, HRV or sleep of the same week.')}</p>
  {#if none}
    <p class="det" data-gk-none>{t('No active zone minutes in these weeks yet. They come from your Fitbit.')} <a href="#/me/connections">{t('To connections')}</a></p>
  {:else}
    <ChipChoice options={OPTIONS} value={metric} onchange={(v) => (metric = v)} aria-label={t('Value under the active zone minutes')} data-gk-metric />
    <h3 class="h3">{t('Active zone minutes|metric')}</h3>
    <BarChart id="gesundheit-azm" cols={azmCols} readout={azmReadout} table={azmTable} unit="min" label={t('Active zone minutes per week: {list}', { list: azmAria })} hint={t('Point at a bar for its numbers.')} />
    <h3 class="h3">{t(PART_NAMES[metric])}</h3>
    <LineChart id="gesundheit-line" cols={lineCols} series={lineSeries} readout={lineReadout} table={lineTable} unit={UNIT[metric]} maxTop={0} label={t('{name} per week: {list}', { name: t(PART_NAMES[metric]), list: lineAria })} hint={t('Point at a week for its numbers.')} />
    <p class="lead" data-gk-sentence><b>{sentence}</b>{#if rel && rel.verdict !== 'none'}{' '}{t('A pattern, not a cause.')}{/if}</p>
  {/if}
</section>

<style>
  .gk {
    padding: var(--sp-4);
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    min-width: 0;
  }
  .h2 {
    margin: 0;
    font: 600 var(--fs-h3, 1.1rem) / 1.25 var(--font-body);
    color: var(--ink);
  }
  .h3 {
    margin: var(--sp-2) 0 0;
    color: var(--ink-2);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
  }
  .det {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .lead {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.5;
  }
  .lead b {
    color: var(--ink);
    font-weight: 600;
  }
</style>
