<script>
  /**
   * «Wochentage verteilt» and «Tageszeit verteilt» (Noah 20.10.2026, like «Trittfrequenz verteilt» on the
   * ride page): the share of the ticks per weekday or per three hours. kind: 'days' | 'hours'.
   * «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): an axis in %, the share and the count when pointing,
   * a tap opens which activities are behind the bar, «Als Tabelle» the same as rows.
   */
  import AnaCard from '../../training/AnaCard.svelte';
  import BarChart from '../../charts/BarChart.svelte';
  import ChartSheet from '../../charts/ChartSheet.svelte';
  import TkSheet from './TkSheet.svelte';
  import { weekdays, hours, inRange, inSlot } from '../auswertung.js';
  import { weekdayShort, weekdayLong } from './words.js';
  import { t, num } from '../../i18n.svelte.js';

  let { d, kind = 'days' } = $props();
  const es = $derived(inRange(d.list, d.from, d.to));
  const rows = $derived(kind === 'days' ? weekdays(es).map((r) => ({ ...r, label: weekdayShort(r.i) })) : hours(es).map((r, i) => ({ ...r, i, label: String(r.from).padStart(2, '0') })));
  const sum = $derived(rows.reduce((s, r) => s + r.n, 0));
  const most = $derived(Math.max(1, ...rows.map((r) => r.pct)));
  const top = $derived(sum ? rows.reduce((a, b) => (b.n > a.n ? b : a)) : null);
  const aria = $derived(rows.map((r) => `${r.label}: ${r.pct} %`).join(', '));
  // the bar darker the more, as before
  const cols = $derived(rows.map((r) => ({ key: r.label, x: r.label, top: `${num(r.pct)} %`, parts: [{ v: r.pct, color: `color-mix(in srgb, var(--hi) ${Math.round(45 + 55 * (r.pct / most))}%, var(--paper))` }] })));
  const name = (r) => (kind === 'days' ? weekdayLong(r.i) : t('{a} to {b} o’clock', { a: r.label, b: String((r.from + 3) % 24).padStart(2, '0') }));
  const readout = (i) => ({ title: name(rows[i]), items: [{ label: t('Share|pct'), value: `${num(rows[i].pct)} %` }, { label: t('Ticks'), value: num(rows[i].n) }] });
  const table = $derived({ head: [kind === 'days' ? t('Weekday') : t('Time of day'), t('Ticks'), t('Share|pct')], rows: rows.map((r) => ({ key: r.label, cells: [name(r), num(r.n), `${num(r.pct)} %`] })) });

  let open = $state(null);
  const row = $derived(open == null ? null : rows[open]);
  const slot = $derived(row ? inSlot(es, kind, row.i) : []);
</script>

{#if sum > 0}
  <AnaCard key={kind === 'days' ? 'tkdays' : 'tkhours'} sub={kind === 'days' ? t('share of the ticks') : t('from the time you ticked')}>
    <BarChart id={kind === 'days' ? 'tkdays' : 'tkhours'} {cols} {readout} {table} unit="%" height={130} onopen={(i) => (open = i)} label={kind === 'days' ? t('Share of the ticks per weekday: {list}', { list: aria }) : t('Share of the ticks per time of day: {list}', { list: aria })} />
    <p class="cap">
      {#if kind === 'days'}{t('Share of the ticks per weekday. Most often on {d}.', { d: top.label })}{:else}{t('Share of the ticks per three hours (from the hour shown). Most often from {h} o’clock.', { h: top.label })}{/if}
    </p>
  </AnaCard>
{/if}

{#if row}
  <ChartSheet kicker={kind === 'days' ? t('Weekdays spread') : t('Time of day spread')} title={name(row)} onclose={() => (open = null)} onprev={open > 0 ? () => open-- : null} onnext={open < rows.length - 1 ? () => open++ : null} prevLabel={rows[open - 1]?.label ?? ''} nextLabel={rows[open + 1]?.label ?? ''}>
    <TkSheet n={row.n} pills={[{ text: t('{n} % of your ticks', { n: num(row.pct) }) }]} es={slot} nameOf={d.nameOf} />
  </ChartSheet>
{/if}
