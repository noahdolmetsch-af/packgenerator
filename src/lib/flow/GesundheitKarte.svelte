<script>
  /**
   * «Was Bewegung mit dir macht» (Noah 27.11.2026 «aktivzonenminuten pro woche vgl mit ruheherzfrequenz pro woche … oder andere sinnvolle»,
   * «4a», Paket B): the active zone minutes of each week as bars and, under them, your resting pulse, HRV or sleep of the same week as a
   * line (the chips choose which), so the weeks line up. One sentence says how the week AFTER weeks with more active zone minutes looked,
   * over all weeks the app knows (relation(): a pattern, never a cause; under 20 weeks or a tiny difference it says nothing).
   * The period is the shared switch of the page (at least 12 weeks, a year shows 52). The rules are flow/hakengesundheit.js.
   * «Garmin gegen Fitbit» (Noah 27.11.2026): under it the mean pulse of the sessions that both recorded, side by side (flow/hakenpuls.js, the pairing is
   * flow/dieselbe.js: the Garmin recording is the one that counts, nothing twice). health: healthDays rows, activities: the Strava rows.
   * table: the day table of the app (loadTable); today: the local day.
   */
  import BarChart from '../charts/BarChart.svelte';
  import LineChart from '../charts/LineChart.svelte';
  import ChipChoice from '../ui/ChipChoice.svelte';
  import { hoursMin } from '../charts/exact.js';
  import { shownWeeks, relation, METRIC_KEYS } from './hakengesundheit.js';
  import { pulsePairs, pulseSummary, windowDays, windowFrom } from './hakenpuls.js';
  import { hakenSpan } from './haken-zeitraum.svelte.js';
  import { addDays } from '../flow.js';
  import { dnum } from './words.js';
  import { PART_NAMES } from './form/words.js';
  import { t, num, locale } from '../i18n.svelte.js';

  let { table = new Map(), today, health = [], activities = [] } = $props();

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

  /* Garmin against Fitbit: the sessions both recorded in the last 90 days or the shared period */
  const days = $derived(windowDays(hakenSpan.v));
  const pairs = $derived(pulsePairs({ health, activities, from: windowFrom(today, hakenSpan.v), to: today }));
  const pulse = $derived(pulseSummary(pairs));
  const PULSE = { under: 'On {n} sessions that both recorded, the Fitbit showed {x} beats per minute less than the Garmin on average.', over: 'On {n} sessions that both recorded, the Fitbit showed {x} beats per minute more than the Garmin on average.', same: 'On {n} sessions that both recorded, the Fitbit and the Garmin showed about the same pulse.' };
  const pulseText = $derived(pulse ? t(PULSE[pulse.direction], { n: num(pulse.n), x: dec(Math.abs(pulse.mean)) }) : '');
  const diffText = (d) => (d === 0 ? '±0' : `${d > 0 ? '+' : '−'}${num(Math.abs(d))}`);

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
    {#if pairs.length}
      <div class="pg" data-gk-pulse>
        <h3 class="h3">{t('Garmin against Fitbit')}</h3>
        <p class="det">{t('Same session, two recordings: the mean pulse. The Garmin recording is the one that counts. Last {d} days.', { d: num(days) })}</p>
        {#if pulse}<p class="lead" data-gk-pulse-sentence><b>{pulseText}</b></p>{:else}<p class="det" data-gk-pulse-few>{t('Too few sessions with both recordings for a mean yet.')}</p>{/if}
        <ul class="pl" data-gk-pairs>
          <li class="ph" aria-hidden="true"><span>{t('Session|pulse')}</span><span class="num">Garmin</span><span class="num">Fitbit</span><span class="num">{t('Difference')}</span></li>
          {#each pairs.slice(0, 5) as p (`${p.day}-${p.name}-${p.garmin}`)}
            <li><span class="pn">{dayTxt(p.day, { day: 'numeric', month: 'short' })} · {p.name}</span><span class="num">{num(p.garmin)}</span><span class="num">{num(p.fitbit)}</span><span class="num">{diffText(p.diff)}</span></li>
          {/each}
        </ul>
      </div>
    {/if}
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
  .pg {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    margin-top: var(--sp-2);
    padding-top: var(--sp-2);
    border-top: 1px solid var(--line);
  }
  .pl {
    margin: var(--sp-1) 0 0;
    padding: 0;
    list-style: none;
    font-size: var(--fs-small);
  }
  .pl li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 52px 52px 64px;
    gap: var(--sp-2);
    align-items: baseline;
    padding: 6px 0;
    border-top: 1px solid var(--line);
    color: var(--ink);
  }
  .pl li.ph {
    border-top: 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .pl .num {
    text-align: right;
  }
  .pn {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
