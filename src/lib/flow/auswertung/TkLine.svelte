<script>
  /**
   * «Verlauf» (Noah 20.10.2026, like «Puls über die Zeit» and «Verlauf» on the ride page): the ticks per day
   * as quiet bars and the mean of 7 days as a line. Observation only.
   * «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): an axis with the number of ticks, three dates under
   * it, the day and its mean when pointing, a tap opens the day with its ticks, «Als Tabelle» the same as rows.
   */
  import AnaCard from '../../training/AnaCard.svelte';
  import BarChart from '../../charts/BarChart.svelte';
  import ChartSheet from '../../charts/ChartSheet.svelte';
  import TkSheet from './TkSheet.svelte';
  import { daily, daysWith, inRange } from '../auswertung.js';
  import { dayName, weekdayLong } from './words.js';
  import { t, num } from '../../i18n.svelte.js';

  let { d } = $props();
  const rows = $derived(daily(d.list, d.from, d.to));
  const last = $derived(rows.at(-1));
  const mid = $derived(Math.floor((rows.length - 1) / 2));
  const cols = $derived(rows.map((r, i) => ({ key: r.day, x: i === 0 || i === mid || i === rows.length - 1 ? dayName(r.day) : '', top: '', parts: [{ v: r.n, color: 'var(--ch-alt)' }] })));
  const line = $derived(rows.map((r) => r.mean));
  const one = (v) => num(Math.round(v * 10) / 10);
  const dow = (day) => (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7;
  const full = (day) => `${weekdayLong(dow(day))}, ${dayName(day)}`;
  const readout = (i) => ({ title: full(rows[i].day), items: [{ label: t('Ticks per day'), value: num(rows[i].n), color: 'var(--ch-alt)' }, { label: t('Ø of 7 days'), value: one(rows[i].mean), color: 'var(--ch-w)' }] });
  const table = $derived({ head: [t('Day'), t('Ticks'), t('Ø of 7 days')], rows: [...rows].reverse().map((r) => ({ key: r.day, cells: [full(r.day), num(r.n), one(r.mean)] })) });

  let open = $state(null);
  const day = $derived(open == null ? null : rows[open]);
  const es = $derived(day ? (daysWith(inRange(d.list, d.from, d.to), day.day, day.day)[0]?.es ?? []) : []);
</script>

{#if rows.some((r) => r.n > 0)}
  <AnaCard key="tkline" sub={t('Ticks per day and 7-day mean')} wide>
    <BarChart id="tkline" {cols} {line} {readout} {table} maxTop={0} onopen={(i) => (open = i)} label={t('Ticks per day from {a} to {b}, now Ø {n} per day over 7 days', { a: dayName(d.from), b: dayName(d.to), n: num(last?.mean ?? 0) })} hint={t('Point at a day for its numbers, tap it for its ticks.')} />
    <ul class="lg"><li><i class="b"></i>{t('Ticks per day')}</li><li><i class="l"></i>{t('Ø of 7 days')}</li></ul>
  </AnaCard>
{/if}

{#if day}
  <ChartSheet kicker={t('Course|tk')} title={full(day.day)} onclose={() => (open = null)} onprev={open > 0 ? () => open-- : null} onnext={open < rows.length - 1 ? () => open++ : null} prevLabel={t('Day before')} nextLabel={t('Next day')}>
    <TkSheet n={day.n} pills={[{ text: t('Ø {n} a day over 7 days', { n: one(day.mean) }) }]} {es} nameOf={d.nameOf} />
  </ChartSheet>
{/if}

<style>
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
    width: 12px;
    height: 10px;
    border-radius: 2px;
  }
  .lg .b {
    background: var(--ch-alt);
  }
  .lg .l {
    height: 3px;
    background: var(--ch-w);
  }
</style>
