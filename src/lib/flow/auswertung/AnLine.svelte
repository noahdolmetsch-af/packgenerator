<script>
  /**
   * «Verlauf» of one answer (Noah 20.10.2026, like «Puls über die Zeit» on the ride page): each answer as a
   * dot, the mean of 7 days as a line. A 1–10 question keeps its scale from 0 to 10. Observation only.
   * «Diagramme überall verbessern» (Noah 23.11.2026 «ja»): the shared line chart: an axis with round steps, the numbers of a day
   * when pointing, a tap opens the day, «Als Tabelle», one neutral sentence above.
   */
  import AnaCard from '../../training/AnaCard.svelte';
  import LineChart from '../../charts/LineChart.svelte';
  import ChartSheet from '../../charts/ChartSheet.svelte';
  import { changeSentence } from '../../charts/sentence.js';
  import { valueDaily, inRange } from '../auswertung.js';
  import { dayName, weekdayLong } from './words.js';
  import { t, num } from '../../i18n.svelte.js';

  let { d } = $props();
  const rows = $derived(valueDaily(d.vals, d.from, d.to));
  const last = $derived(rows.findLast((r) => r.mean != null));
  const mid = $derived(Math.floor((rows.length - 1) / 2));
  const cols = $derived(rows.map((r, i) => ({ key: r.day, x: i === 0 || i === mid || i === rows.length - 1 ? dayName(r.day) : '' })));
  const series = $derived([
    { key: 'mean', color: 'var(--ch-w)', v: rows.map((r) => r.mean) },
    { key: 'v', color: 'var(--pz2)', line: false, dots: true, v: rows.map((r) => r.v) },
  ]);
  const scale = $derived(d.scale ? { lo: 0, hi: 10, step: 2, ticks: [0, 2, 4, 6, 8, 10] } : null);
  const one = (v) => (v == null ? '–' : num(Math.round(v * 10) / 10));
  const dow = (day) => (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7;
  const full = (day) => `${weekdayLong(dow(day))}, ${dayName(day)}`;
  const readout = (i) => ({ title: full(rows[i].day), items: [{ label: t('Answer of the day'), value: one(rows[i].v), color: 'var(--pz2)' }, { label: t('Ø of 7 days'), value: one(rows[i].mean), color: 'var(--ch-w)' }] });
  const table = $derived({ head: [t('Day'), t('Answer of the day'), t('Ø of 7 days')], rows: [...rows].reverse().map((r) => ({ key: r.day, cells: [full(r.day), one(r.v), one(r.mean)] })) });
  const sentences = $derived(changeSentence(rows.map((r) => ({ label: dayName(r.day), v: r.mean == null ? null : Math.round(r.mean * 10) / 10 })), one));
  const count = (day) => inRange(d.vals, day, day).length;

  let open = $state(null);
  const day = $derived(open == null ? null : rows[open]);
</script>

{#if rows.some((r) => r.v != null)}
  <AnaCard key="anline" sub={t('Answers and 7-day mean')} wide>
    <LineChart id="anline" {cols} {series} {scale} {readout} {table} {sentences} onopen={(i) => (open = i)} label={t('Answers from {a} to {b}, lately Ø {n} over 7 days', { a: dayName(d.from), b: dayName(d.to), n: num(last?.mean ?? 0) })} hint={t('Point at a day for its numbers, tap it for what is behind.')} />
    <ul class="lg"><li><i class="b"></i>{t('Answer of the day')}</li><li><i class="l"></i>{t('Ø of 7 days')}</li></ul>
  </AnaCard>
{/if}

{#if day}
  <ChartSheet kicker={t('Answers and 7-day mean')} title={full(day.day)} onclose={() => (open = null)} onprev={open > 0 ? () => open-- : null} onnext={open < rows.length - 1 ? () => open++ : null} prevLabel={t('Day before')} nextLabel={t('Next day')}>
    <ul class="shl" data-anline-sheet>
      <li><span>{t('Answer of the day')}</span><b class="num">{one(day.v)}</b></li>
      <li><span>{t('Ø of 7 days')}</span><b class="num">{one(day.mean)}</b></li>
      <li><span>{t('Answers')}</span><b class="num">{num(count(day.day))}</b></li>
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
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .lg i {
    width: 10px;
    height: 10px;
    border-radius: 5px;
  }
  .lg .b {
    background: var(--pz2);
  }
  .lg .l {
    width: 12px;
    height: 3px;
    border-radius: 0;
    background: var(--ch-w);
  }
</style>
