<script>
  /**
   * TR7e «Effizienz: Watt pro Herzschlag»: NP ÷ mean heart rate of the calm rides (main zone Z2) of the last
   * four months as dots, with a straight trend. Only rides with a power meter and heart rate; at least 4.
   * weeks.js effPoints.
   * «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): a day is a column, a ride a dot on it; an axis with round
   * steps, the ride and the trend of a day when pointing, a tap opens the day, «Als Tabelle» lists the rides.
   */
  import AnaCard from '../AnaCard.svelte';
  import LineChart from '../../charts/LineChart.svelte';
  import ChartSheet from '../../charts/ChartSheet.svelte';
  import { t, locale } from '../../i18n.svelte.js';
  import { zones } from '../../strava/zones.svelte.js';
  import { effPoints, monthStart, daysBetween, EFF_MIN, EFF_MONTHS } from './weeks.js';
  import { shiftDay } from '../../training.js';

  let { acts = [], today = '' } = $props();
  const data = $derived(today ? effPoints(acts, today, zones.bounds) : null);
  const has = $derived(!!data && data.pts.length >= EFF_MIN && !!data.trend);
  const f2 = (v) => Number(v).toLocaleString(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const monthOf = (day, month = 'long') => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { month, timeZone: 'UTC' });
  const dmy = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', timeZone: 'UTC' });
  const C = 'var(--ch-w)';

  // one column per day of the four months
  const days = $derived(has ? Array.from({ length: data.span + 1 }, (_, i) => shiftDay(data.from, i)) : []);
  const monthStarts = $derived(has ? new Set(Array.from({ length: EFF_MONTHS }, (_, i) => daysBetween(data.from, monthStart(today, EFF_MONTHS - 1 - i)))) : new Set());
  const rides = $derived(has ? days.map((d) => data.pts.filter((p) => p.day === d)) : []);
  const mean = (l) => (l.length ? l.reduce((s, p) => s + p.v, 0) / l.length : null);
  const cols = $derived(days.map((d, i) => ({ key: d, x: monthStarts.has(i) ? monthOf(d, 'short') : '' })));
  const trendAt = (i) => (has && i >= data.trend.x0 ? data.trend.a + data.trend.b * i : null);
  const series = $derived(
    has
      ? [
          { key: 'rides', color: C, line: false, dots: true, v: rides.map(mean) },
          { key: 'trend', color: C, v: days.map((_, i) => trendAt(i)) },
        ]
      : [],
  );
  const items = (i) => [
    { label: t('Watts per beat'), value: rides[i].length ? rides[i].map((p) => f2(p.v)).join(' · ') : '–', color: C },
    { label: t('Trend'), value: trendAt(i) == null ? '–' : f2(trendAt(i)) },
  ];
  const readout = (i) => ({ title: dmy(days[i]), items: items(i) });
  const table = $derived(has ? { head: [t('Day'), t('Watts per beat'), t('Trend')], rows: [...data.pts].reverse().map((p, k) => ({ key: `${p.day}-${k}`, cells: [dmy(p.day), f2(p.v), f2(trendAt(p.x))] })) } : null);
  const grows = $derived(has && data.trend.end - data.trend.start >= 0.005);
  const now = $derived(has ? f2(data.trend.end) : '');
  const then = $derived(has ? f2(data.trend.start) : '');
  const thenMonth = $derived(has ? monthOf(data.pts[0].day) : '');
  const cap = $derived(
    grows
      ? t('More watts at the same heart rate means: the base is growing. Today {now} W per beat, in {month} {then}. Only rides with a power meter and heart rate.', { now, then, month: thenMonth })
      : t('Watts per heartbeat on calm rides: today {now}, in {month} {then}. Only rides with a power meter and heart rate.', { now, then, month: thenMonth }),
  );
  const label = $derived(has ? t('{n} calm rides; trend from {then} to {now} W per beat', { n: data.pts.length, now, then }) : '');
  let open = $state(null);
</script>

{#if has}
  <AnaCard key="eff" wide sub={t('NP ÷ mean heart rate, only calm rides (mostly Z2)')}>
    <LineChart id="eff" {cols} {series} {readout} {table} {label} maxTop={0} tick={(v) => f2(v)} onopen={(i) => (open = i)} hint={t('Point at a day for its numbers, tap it for the day.')} />
    <ul class="leg">
      <li><i class="k"></i>{t('Trend')}</li>
    </ul>
    <p class="cap">{cap}</p>
  </AnaCard>
{/if}

{#if open != null && days[open]}
  <ChartSheet kicker={t('Efficiency: watts per heartbeat')} title={dmy(days[open])} onclose={() => (open = null)} onprev={open > 0 ? () => open-- : null} onnext={open < days.length - 1 ? () => open++ : null} prevLabel={t('Day before')} nextLabel={t('Next day')}>
    <ul class="shl" data-eff-sheet>
      {#each items(open) as it (it.label)}<li><span>{it.label}</span><b class="num">{it.value}</b></li>{/each}
    </ul>
    {#if !rides[open].length}<p class="cap">{t('No calm ride with a power meter on this day.')}</p>{/if}
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
  .leg {
    display: flex;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .leg li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .k {
    display: inline-block;
    width: 14px;
    height: 0;
    border-top: 3px solid var(--ch-w);
  }
</style>
