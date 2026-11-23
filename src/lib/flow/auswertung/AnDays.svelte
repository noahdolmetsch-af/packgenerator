<script>
  /**
   * «Wochentage» of one answer (Noah 20.10.2026, like «Trittfrequenz verteilt» on the ride page): the mean
   * answer per weekday as a bar, the number on top. Observation only.
   * «Diagramme überall verbessern» (Noah 23.11.2026 «ja»): the shared bar chart with an axis, the numbers when pointing,
   * a tap opens the weekday, «Als Tabelle». A weekday without an answer says «No data», it is no zero.
   */
  import AnaCard from '../../training/AnaCard.svelte';
  import BarChart from '../../charts/BarChart.svelte';
  import ChartSheet from '../../charts/ChartSheet.svelte';
  import { valueWeekdays, inRange } from '../auswertung.js';
  import { weekdayShort, weekdayLong } from './words.js';
  import { t, num } from '../../i18n.svelte.js';

  let { d } = $props();
  const rows = $derived(valueWeekdays(inRange(d.vals, d.from, d.to)).map((r) => ({ ...r, label: weekdayShort(r.i) })));
  const one = (v) => (v == null ? '–' : num(Math.round(v * 10) / 10));
  const top = $derived(d.scale ? 10 : Math.max(1, ...rows.map((r) => r.mean ?? 0)));
  const aria = $derived(rows.map((r) => `${r.label}: ${one(r.mean)}`).join(', '));
  const best = $derived(rows.filter((r) => r.mean != null).reduce((a, b) => (a && a.mean >= b.mean ? a : b), null));
  const cols = $derived(rows.map((r) => ({ key: r.label, x: r.label, top: r.mean == null ? '' : one(r.mean), none: r.mean == null ? t('No data') : '', parts: [{ v: r.mean ?? 0, color: `color-mix(in srgb, var(--hi) ${Math.round(45 + 55 * ((r.mean ?? 0) / top))}%, var(--paper))` }] })));
  const readout = (i) => ({ title: weekdayLong(rows[i].i), items: [{ label: t('Ø answer'), value: one(rows[i].mean) }, { label: t('Answers'), value: num(rows[i].n) }] });
  const table = $derived({ head: [t('Weekday'), t('Ø answer'), t('Answers')], rows: rows.map((r) => ({ key: r.label, cells: [weekdayLong(r.i), one(r.mean), num(r.n)] })) });

  let open = $state(null);
  const row = $derived(open == null ? null : rows[open]);
</script>

{#if rows.filter((r) => r.n > 0).length > 1}
  <AnaCard key="andays" sub={t('Ø per weekday')}>
    <BarChart id="andays" {cols} {readout} {table} height={130} onopen={(i) => (open = i)} label={t('Ø answer per weekday: {list}', { list: aria })} hint={t('Point at a day for its numbers, tap it for what is behind.')} />
    {#if best}<p class="cap">{t('Ø answer per weekday. Highest on {d}.', { d: best.label })}</p>{/if}
  </AnaCard>
{/if}

{#if row}
  <ChartSheet kicker={t('Ø per weekday')} title={weekdayLong(row.i)} onclose={() => (open = null)} onprev={open > 0 ? () => open-- : null} onnext={open < rows.length - 1 ? () => open++ : null} prevLabel={t('Day before')} nextLabel={t('Next day')}>
    <ul class="shl" data-andays-sheet>
      <li><span>{t('Ø answer')}</span><b class="num">{one(row.mean)}</b></li>
      <li><span>{t('Answers')}</span><b class="num">{num(row.n)}</b></li>
    </ul>
  </ChartSheet>
{/if}

<style>
  .shl {
    display: grid;
    gap: 6px;
    margin: 0 0 10px;
    padding: 0;
    list-style: none;
  }
  .shl li {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }
  .shl span {
    color: var(--ink-2);
  }
</style>
