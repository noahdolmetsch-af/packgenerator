<script>
  /**
   * «Haken pro Woche» (Noah 20.10.2026, like «Leistungsbereiche als Balken» on the ride page): one bar
   * per week, stacked by ring (Bewegung, Achtsamkeit, Erholung), the count on top. Observation only.
   * «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): a labelled axis, the exact numbers of a week when
   * pointing at it, a tap opens the week with its days and ticks, «Als Tabelle» the same as rows.
   */
  import AnaCard from '../../training/AnaCard.svelte';
  import BarChart from '../../charts/BarChart.svelte';
  import ChartSheet from '../../charts/ChartSheet.svelte';
  import TkSheet from './TkSheet.svelte';
  import { perWeek, daysWith, inRange } from '../auswertung.js';
  import { diffText } from '../../charts/pick.js';
  import { addDays } from '../../flow.js';
  import { RING_WORDS, dayName } from './words.js';
  import { t, num } from '../../i18n.svelte.js';

  let { d } = $props();
  // the rings in the chart colours of the ride page (green, blue-grey, yellow), so they stay apart
  const RING_COLOUR = { move: 'var(--ch-w)', mind: 'var(--pz2)', rest: 'var(--pz4)' };
  const weeks = $derived(perWeek(d.list, d.from, d.to, d.ringOf));
  // a year has 53 weeks: the bars stay readable, the labels only every few weeks
  const step = $derived(weeks.length > 26 ? 8 : weeks.length > 8 ? 4 : 1);
  const rings = $derived(Object.keys(RING_WORDS).filter((r) => weeks.some((w) => w.rings[r] > 0)));
  const mean = $derived(weeks.length ? Math.round((weeks.reduce((s, w) => s + w.n, 0) / weeks.length) * 10) / 10 : 0);
  const aria = $derived(weeks.map((w) => `${dayName(w.mon)}: ${w.n}`).join(', '));
  const range = (w) => `${dayName(w.mon)} – ${dayName(addDays(w.mon, 6))}`;
  const cols = $derived(weeks.map((w, i) => ({ key: w.mon, x: i % step === 0 ? dayName(w.mon) : '', top: w.n ? num(w.n) : '', parts: rings.map((r) => ({ v: w.rings[r], color: RING_COLOUR[r] })) })));
  const readout = (i) => ({
    title: t('Week from {d}', { d: dayName(weeks[i].mon) }),
    items: [{ label: t('Ticks'), value: num(weeks[i].n) }, ...(rings.length > 1 ? rings.map((r) => ({ label: t(RING_WORDS[r]), value: num(weeks[i].rings[r]), color: RING_COLOUR[r] })) : [])],
  });
  const table = $derived({
    head: [t('Week from'), ...(rings.length > 1 ? rings.map((r) => t(RING_WORDS[r])) : []), t('Ticks')],
    rows: [...weeks].reverse().map((w) => ({ key: w.mon, cells: [dayName(w.mon), ...(rings.length > 1 ? rings.map((r) => num(w.rings[r])) : []), num(w.n)] })),
  });

  let open = $state(null);
  const wk = $derived(open == null ? null : weeks[open]);
  const pills = $derived.by(() => {
    if (!wk) return [];
    const out = [];
    if (open > 0) out.push({ text: t('{d} against the week before', { d: diffText(wk.n, weeks[open - 1].n, num) }) });
    out.push({ text: t('Ø {n} a week in this period', { n: num(mean) }) });
    for (const r of rings) if (wk.rings[r]) out.push({ text: `${t(RING_WORDS[r])} ${num(wk.rings[r])}` });
    return out;
  });
</script>

{#if weeks.some((w) => w.n > 0)}
  <AnaCard key="tkweeks" sub={t('Ticks')} wide>
    <BarChart id="tkweeks" {cols} {readout} {table} onopen={(i) => (open = i)} label={t('Ticks per week: {list}', { list: aria })} hint={t('Point at a week for its numbers, tap it for its days.')} />
    {#if rings.length > 1}
      <ul class="lg">{#each rings as r (r)}<li><i style:background={RING_COLOUR[r]}></i>{t(RING_WORDS[r])}</li>{/each}</ul>
    {/if}
    <p class="cap num">{t('Ticks per week, Monday to Sunday. Ø {n} per week.', { n: num(mean) })}</p>
  </AnaCard>
{/if}

{#if wk}
  <ChartSheet kicker={t('Ticks per week')} title={range(wk)} onclose={() => (open = null)} onprev={open > 0 ? () => open-- : null} onnext={open < weeks.length - 1 ? () => open++ : null} prevLabel={t('Week before')} nextLabel={t('Next week')}>
    <TkSheet n={wk.n} {pills} days={daysWith(inRange(d.list, d.from, d.to), wk.mon, addDays(wk.mon, 6))} nameOf={d.nameOf} />
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
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }
</style>
