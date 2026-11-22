<script>
  /**
   * «Form im Vergleich zu früher» (Noah 21.11.2026, Klügere Auswertungen K2): the card on «Form und Erholung».
   * Watt per heartbeat, resting pulse and hours of the same months (May to October) of each year, with the label
   * «Sure / Tendency / Too little data» and the line «How it is counted», where the two limits can be changed
   * (setting training.vergleich). Days with a marker are left out. No judgement, no advice.
   * f: formOf() of the page (table); today: «YYYY-MM-DD».
   */
  import { liveQuery } from 'dexie';
  import { db } from '../../db.js';
  import { Info, ChevronDown } from '@lucide/svelte';
  import Sicherheit from './Sicherheit.svelte';
  import { compareYears, cleanSettings, SETTINGS_KEY, DEFAULTS, MIN_RHR_DAYS, OUTLIER } from './vergleich.js';
  import { MARKER_KEY, markedDays } from '../marker.js';
  import { t, tn, num, locale } from '../../i18n.svelte.js';

  let { f, today } = $props();

  const mq = liveQuery(() => db.settings.get(MARKER_KEY));
  const sq = liveQuery(() => db.settings.get(SETTINGS_KEY));
  const marked = $derived(markedDays($mq?.value));
  const set = $derived(cleanSettings($sq?.value));
  const r = $derived(compareYears({ table: f?.table, today, marked, settings: set }));
  const shown = $derived([...r.years].reverse().filter((y) => y.rides > 0 || y.rhr != null || y.hours > 0));
  const w2 = (v) => (v == null ? '–' : Number(v).toLocaleString(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const hrs = (h) => (h > 0 ? num(Math.round(h)) : '–');
  const yearName = (y) => (y === Number(today.slice(0, 4)) ? t('this year') : y === Number(today.slice(0, 4)) - 1 ? t('last year') : String(y));

  const sentence = $derived.by(() => {
    if (r.cur?.wpb == null || !r.prev) return '';
    return t('Watt per heartbeat: {cur} {a}, {prev} {b}.', { cur: t('this year'), a: w2(r.cur.wpb), prev: yearName(r.prev.year), b: w2(r.prev.wpb) });
  });
  const rhrLine = $derived.by(() => {
    const prev = [...r.years].reverse().find((y) => y.year < (r.cur?.year ?? 0) && y.rhr != null);
    if (r.cur?.rhr == null || !prev) return '';
    return t('Resting pulse (middle): {cur} {a}, {prev} {b}.', { cur: t('this year'), a: num(Math.round(r.cur.rhr)), prev: yearName(prev.year), b: num(Math.round(prev.rhr)) });
  });
  const why = $derived.by(() => {
    if (r.level !== 'few') return '';
    if (r.years.some((y) => y.outlier)) return t('One year sticks out so far from the others that it is probably a data problem. So no statement.');
    if (r.cur?.wpb == null) return t('This year has fewer than {n} bike rides with a power meter and a pulse in these months so far.', { n: set.minRides });
    return t('There is no earlier year with at least {n} such rides.', { n: set.minRides });
  });
  const markedDaysN = $derived(marked.size);

  async function save(key, v) {
    const n = Math.round(Number(v));
    await db.settings.put({ key: SETTINGS_KEY, value: cleanSettings({ ...set, [key]: n }) });
  }
  async function reset() {
    await db.settings.delete(SETTINGS_KEY);
  }
</script>

<div class="card vg" data-vergleich>
  <div class="top">
    <Sicherheit level={r.level} />
    <span class="mo">{t('May to October, each year')}</span>
  </div>
  {#if sentence}<p class="sen" data-vergleich-sentence>{sentence}</p>{/if}
  {#if rhrLine}<p class="sen2">{rhrLine}</p>{/if}
  {#if why}<p class="wait" data-vergleich-why>{why}</p>{/if}

  {#if shown.length}
    <div class="tw">
      <table data-vergleich-table>
        <thead>
          <tr>
            <td></td>
            <th scope="col">{t('Watt per heartbeat')}</th>
            <th scope="col">{t('Resting pulse')}</th>
            <th scope="col">{t('Hours')}</th>
          </tr>
        </thead>
        <tbody>
          {#each shown as y (y.year)}
            <tr data-vergleich-year={y.year}>
              <th scope="row">{y.year}<small>{tn(y.rides, '{n} ride', '{n} rides')}</small></th>
              <td class="num">{w2(y.wpb)}{#if y.outlier}<small>{t('sticks out')}</small>{/if}</td>
              <td class="num">{y.rhr == null ? '–' : num(Math.round(y.rhr))}</td>
              <td class="num">{hrs(y.hours)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
  {#if !r.years.some((y) => y.rides > 0)}
    <p class="wait" data-vergleich-empty>{t('Comes with your rides from Strava: the app then compares the same months of each year.')}</p>
  {/if}

  <details class="how" data-vergleich-how>
    <summary><Info size={16} aria-hidden="true" /><span>{t('How it is counted')}</span><ChevronDown class="cv" size={16} aria-hidden="true" /></summary>
    <p>{t('Watt per heartbeat: average watts divided by average pulse of a bike ride with a power meter, the middle value of the window. Resting pulse: the middle of all days with a value, from {n} days. Hours: all activities.', { n: MIN_RHR_DAYS })}</p>
    <p>{t('Sure: this year and the two years before moved the same way. Tendency: this year against the year before. Too little data: too few rides, no earlier year, or one year sticks out by more than {p} %.', { p: Math.round(OUTLIER * 100) })}</p>
    <p>{markedDaysN ? tn(markedDaysN, '{n} marked day is left out of the rides and the resting pulse.', '{n} marked days are left out of the rides and the resting pulse.') : t('Days with a marker are left out of the rides and the resting pulse. You have none yet.')}</p>
    <div class="row">
      <label class="fld"><span>{t('Fewest rides per year')}</span><input class="inp" type="number" inputmode="numeric" min="3" max="60" value={set.minRides} onchange={(e) => save('minRides', e.currentTarget.value)} data-vergleich-rides /></label>
      <label class="fld"><span>{t('Shortest ride, minutes')}</span><input class="inp" type="number" inputmode="numeric" min="10" max="240" value={set.minMin} onchange={(e) => save('minMin', e.currentTarget.value)} data-vergleich-min /></label>
    </div>
    {#if set.minRides !== DEFAULTS.minRides || set.minMin !== DEFAULTS.minMin}
      <button type="button" class="btn sm" onclick={reset} data-vergleich-reset>{t('Back to the usual values')}</button>
    {/if}
  </details>
</div>

<style>
  .vg {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
  }
  .mo {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sen {
    margin: 0;
    font-weight: 600;
  }
  .sen2 {
    margin: 0;
  }
  .wait {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .tw {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-variant-numeric: tabular-nums;
  }
  th,
  td {
    padding: 8px 6px;
    text-align: right;
    vertical-align: top;
    border-bottom: 1px solid var(--line);
  }
  thead th {
    color: var(--ink-3);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
  }
  tbody th {
    text-align: left;
    font-weight: 600;
  }
  small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-weight: 400;
  }
  .how summary {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    cursor: pointer;
    color: var(--ink-2);
  }
  .how p {
    margin: 6px 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
    gap: 8px;
    margin: 8px 0;
  }
  .fld {
    display: grid;
    gap: 4px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .fld :global(.inp) {
    min-width: 0;
    width: 100%;
  }
</style>
