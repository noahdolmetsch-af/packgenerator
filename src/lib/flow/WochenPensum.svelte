<script>
  /**
   * «Wochenpensum» (Noah 27.11.2026 «wochenpensum vgl. mit vorwoche», Paket A): the hours of movement per week (Monday to Sunday), the
   * running week against last week at the same point, last week against the one before and against your mean of the last 12 weeks.
   * The period is the shared switch of the page (at least 12 weeks, a year shows 52). Minutes as in the report below (einheiten.js,
   * measured and estimated apart). Only looking: a week above or below your mean is no good or bad, just where it lies.
   * The rules are flow/hakenzahlen.js. units: the movement units of the page; today: the local day.
   */
  import BarChart from '../charts/BarChart.svelte';
  import { hoursMin } from '../charts/exact.js';
  import { weekTotals, placeOf, percent } from './hakenzahlen.js';
  import { hakenSpan } from './haken-zeitraum.svelte.js';
  import { addDays } from '../flow.js';
  import { dnum } from './words.js';
  import { t, num, locale } from '../i18n.svelte.js';

  let { units = [], today } = $props();

  const MEASURED = 'var(--ch-w)';
  const ESTIMATED = 'color-mix(in srgb, var(--ch-w) 38%, var(--paper-2))';

  const res = $derived(weekTotals(units, today, hakenSpan.v));
  const weeks = $derived(res.weeks);
  const loc = $derived(locale());
  const dayTxt = (day, o) => new Date(`${day}T12:00:00Z`).toLocaleDateString(loc, { ...o, timeZone: 'UTC' });
  const hrs = (m) => {
    const h = m / 60;
    return h < 10 ? num(Math.round(h * 10) / 10) : num(Math.round(h));
  };
  const few = $derived(weeks.length <= 14);
  const monthOf = (key) => Number(addDays(key, 3).slice(5, 7)); // a week belongs to the month of its Thursday

  const cols = $derived(
    weeks.map((w, i) => ({
      key: w.key,
      x: few ? ((weeks.length - 1 - i) % 2 === 0 ? `${dnum(w.key)}.${Number(w.key.slice(5, 7))}.` : '') : i && monthOf(weeks[i - 1].key) !== monthOf(w.key) && (monthOf(w.key) - 1) % 2 === 0 ? dayTxt(addDays(w.key, 3), { month: 'short' }).replace('.', '') : '',
      top: few && w.min >= 30 ? hrs(w.min) : '',
      dashed: w.current && w.min > 0,
      parts: [
        { v: (w.min - w.ca) / 60, color: MEASURED },
        { v: w.ca / 60, color: ESTIMATED },
      ],
    })),
  );
  const readout = (i) => {
    const w = weeks[i];
    return {
      title: `${t('Week of {d}', { d: dayTxt(w.key, { day: 'numeric', month: 'long' }) })}${w.current ? ` (${t('running')})` : ''}`,
      extra: '',
      items: [{ label: t('Hours'), value: w.min ? hoursMin(w.min) : t('nothing') }, ...(w.ca > 0 ? [{ label: t('of it estimated'), value: hoursMin(w.ca), color: ESTIMATED }] : [])],
    };
  };
  const table = $derived({
    head: [t('Week of|wp'), t('Hours')],
    rows: [...weeks].reverse().map((w) => ({ key: w.key, cells: [dayTxt(w.key, { day: 'numeric', month: 'short' }), w.min ? hoursMin(w.min) : '–'] })),
  });
  const aria = $derived(weeks.map((w) => `${dayTxt(w.key, { day: 'numeric', month: 'short' })}: ${hoursMin(w.min)}`).join(', '));
  const hasEstimate = $derived(weeks.some((w) => w.ca > 0));
  const none = $derived(weeks.every((w) => w.min === 0));

  /* the three numbers: the running week, last week at the same point, the whole last week against the one before */
  const upto = $derived(`${dayTxt(addDays(today, -res.dayIdx), { weekday: 'short' }).replace('.', '')}–${dayTxt(today, { weekday: 'short' }).replace('.', '')}`);
  const sinceWeek = $derived(percent(res.prev, res.prev2));
  const pct = (p) => (p === 0 ? '±0 %' : `${p > 0 ? '+' : '−'}${num(Math.abs(p))} %`);
  const place = $derived(res.prev > 0 ? placeOf(res.prev, res.mean) : null);
  const PLACE = { on: 'Last week ({h} h) was right on your mean ({m} h).', above: 'Last week ({h} h) was above your mean ({m} h).', below: 'Last week ({h} h) was below your mean ({m} h).' };
  const lead = $derived(place ? t(PLACE[place], { h: hrs(res.prev), m: hrs(res.mean) }) : res.prev > 0 ? t('Last week you moved {h} h.', { h: hrs(res.prev) }) : t('No movement last week.'));
  const running = $derived.by(() => {
    if (res.dayIdx <= 1) return t('The running week has only just begun.');
    const p = percent(res.cur, res.prevSame);
    if (p == null) return t('So far this week {h} h.', { h: hrs(res.cur) });
    return t('So far this week {h} h, {p} against last week at the same point.', { h: hrs(res.cur), p: pct(p) });
  });
</script>

<section class="card wp" aria-labelledby="wp-h" data-wochenpensum>
  <h2 id="wp-h" class="h2">{t('Week volume')}</h2>
  <p class="det">{t('Hours of movement per week (Monday to Sunday), the running week dashed.')}</p>
  {#if none}
    <p class="det" data-wp-none>{t('No movement in these weeks yet. Tick a sport on Active or connect Strava, and this chart fills itself.')} <a href="#/flow">{t('To Active')}</a></p>
  {:else}
    <ul class="kpis" data-wp-kpis>
      <li><b class="num" data-wp-cur>{hrs(res.cur)} h</b><small>{t('This week so far ({a})', { a: upto })}</small></li>
      <li><b class="num">{hrs(res.prevSame)} h</b><small>{t('Last week at the same point')}</small></li>
      <li><b class="num" data-wp-prev>{hrs(res.prev)} h</b><small>{sinceWeek == null ? t('Whole last week') : t('Whole last week, {p} against the week before', { p: pct(sinceWeek) })}</small></li>
    </ul>
    <BarChart id="wochenpensum" {cols} {readout} {table} unit="h" steps={null} goal={res.mean != null ? { v: res.mean / 60, text: t('mean of 12 weeks') } : null} label={t('Hours of movement per week: {list}', { list: aria })} hint={t('Point at a bar for its numbers.')} />
    {#if hasEstimate}
      <ul class="lg" data-wp-legend>
        <li><i style:background={MEASURED}></i>{t('measured')}</li>
        <li><i style:background={ESTIMATED}></i>{t('estimated with the usual duration («ca.»)')}</li>
      </ul>
    {/if}
    <p class="lead" data-wp-sentence><b>{lead}</b> {running}</p>
  {/if}
</section>

<style>
  .wp {
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
  .kpis {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin: var(--sp-1) 0 0;
    padding: 0;
    list-style: none;
  }
  .kpis li {
    display: grid;
    align-content: start;
    gap: 2px;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--paper-2);
    min-width: 0;
  }
  .kpis b {
    font: 700 var(--fs-h3, 1.15rem) / 1.2 var(--font-body);
    color: var(--ink);
  }
  .kpis small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    line-height: 1.3;
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
