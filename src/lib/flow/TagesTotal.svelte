<script>
  /**
   * «Tagestotal» (Noah 27.11.2026 «wie war das tagestotal im vergleich zu anderen tagen?», Paket A): the minutes of movement per day,
   * all activities together, against your typical training day. The period is the shared switch of the page (up to 90 days; a longer
   * period shows these 90, the weeks are in «Wochenpensum»). Minutes are the same as in the report below (einheiten.js): measured
   * ones and estimated ones («ca.», the usual duration of the sport) are drawn apart. Only looking. The rules are flow/hakenzahlen.js.
   * units: the movement units of the page (training(einheiten(…))); today: the local day.
   */
  import BarChart from '../charts/BarChart.svelte';
  import { hoursMin } from '../charts/exact.js';
  import { dayTotals, dayCount } from './hakenzahlen.js';
  import { hakenSpan } from './haken-zeitraum.svelte.js';
  import { wd, dnum } from './words.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';

  let { units = [], today } = $props();

  const MEASURED = 'var(--ch-w)';
  const ESTIMATED = 'color-mix(in srgb, var(--ch-w) 38%, var(--paper-2))';

  const res = $derived(dayTotals(units, today, hakenSpan.v));
  const days = $derived(res.days);
  const loc = $derived(locale());
  const dayTxt = (day, o) => new Date(`${day}T12:00:00Z`).toLocaleDateString(loc, { ...o, timeZone: 'UTC' });
  const few = $derived(days.length <= 12);
  const isMonday = (day) => new Date(`${day}T12:00:00Z`).getUTCDay() === 1;

  const cols = $derived(
    days.map((d) => ({
      key: d.day,
      x: few ? wd(d.day) : isMonday(d.day) ? String(dnum(d.day)) : '',
      top: d.min > 0 && few ? String(d.min) : '',
      dashed: d.today && d.min > 0,
      parts: [
        { v: d.min - d.ca, color: MEASURED },
        { v: d.ca, color: ESTIMATED },
      ],
    })),
  );
  const readout = (i) => {
    const d = days[i];
    return {
      title: dayTxt(d.day, { weekday: 'long', day: 'numeric', month: 'long' }),
      extra: '',
      items: [{ label: t('Minutes'), value: d.min ? hoursMin(d.min) : t('nothing') }, ...(d.ca > 0 ? [{ label: t('of it estimated'), value: hoursMin(d.ca), color: ESTIMATED }] : [])],
    };
  };
  const table = $derived({
    head: [t('Day'), t('Minutes')],
    rows: [...days].reverse().map((d) => ({ key: d.day, cells: [dayTxt(d.day, { weekday: 'short', day: 'numeric', month: 'short' }), d.min ? hoursMin(d.min) : '–'] })),
  });
  const aria = $derived(days.map((d) => `${dayTxt(d.day, { weekday: 'short', day: 'numeric', month: 'short' })}: ${hoursMin(d.min)}`).join(', '));
  const hasEstimate = $derived(days.some((d) => d.ca > 0));

  const lead = $derived.by(() => {
    if (res.typical == null) return t('Too few training days yet for a typical day.');
    return res.todayMin > 0 ? t('Today {n} min so far. A typical training day of yours has {m} min.', { n: num(res.todayMin), m: num(res.typical) }) : t('Nothing recorded yet today. A typical training day of yours has {m} min.', { m: num(res.typical) });
  });
  const second = $derived.by(() => {
    const parts = [];
    if (res.longest) parts.push(t('The longest day of the last 90 days was {d} with {n} min.', { d: dayTxt(res.longest.day, { weekday: 'long', day: 'numeric', month: 'long' }), n: num(res.longest.min) }));
    if (res.free >= 2) parts.push(t('{n} days in a row without movement before today.', { n: num(res.free) }));
    return parts.join(' ');
  });
  const none = $derived(res.trained === 0);
</script>

<section class="card tt" aria-labelledby="tt-h" data-tagestotal>
  <h2 id="tt-h" class="h2">{t('Day total')}</h2>
  <p class="det">{dayCount(hakenSpan.v) < hakenSpan.v ? t('Minutes of movement per day, all activities together. The last 90 days; weeks are in «Week volume».') : t('Minutes of movement per day, all activities together.')}</p>
  {#if none}
    <p class="det" data-tt-none>{t('No movement in the last 90 days yet. Tick a sport on Active or connect Strava, and this chart fills itself.')} <a href="#/flow">{t('To Active')}</a></p>
  {:else}
    <BarChart id="tagestotal" {cols} {readout} {table} unit="min" goal={res.typical != null ? { v: res.typical, text: t('typical day') } : null} label={t('Minutes of movement per day: {list}', { list: aria })} hint={t('Point at a bar for its numbers.')} />
    {#if hasEstimate}
      <ul class="lg" data-tt-legend>
        <li><i style:background={MEASURED}></i>{t('measured')}</li>
        <li><i style:background={ESTIMATED}></i>{t('estimated with the usual duration («ca.»)')}</li>
      </ul>
    {/if}
    <p class="lead" data-tt-sentence><b>{lead}</b> {second}</p>
  {/if}
</section>

<style>
  .tt {
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
  .lg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .lg li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .lg i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex: none;
  }
</style>
