<script>
  /**
   * TR7e «Leistungskurve: 90 Tage gegen das Jahr»: the best mean power per span (5 s … 60 min) of the last
   * 90 days (green) against the calendar year (grey), and one calm sentence on 20 and 60 minutes. weeks.js.
   * «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): an axis with round steps, the two numbers of a span when
   * pointing, a tap opens the span with the days the bests came from, «Als Tabelle» the same as rows.
   */
  import AnaCard from '../AnaCard.svelte';
  import LineChart from '../../charts/LineChart.svelte';
  import ChartSheet from '../../charts/ChartSheet.svelte';
  import { t, num, locale } from '../../i18n.svelte.js';
  import { curveBests, nearSame } from './weeks.js';

  let { acts = [], today = '' } = $props();
  const rows = $derived(today ? curveBests(acts, today) : []);
  const has = $derived(rows.filter((r) => r.d90 || r.year).length >= 2);
  const year = $derived(today.slice(0, 4));
  const spanName = (s) => (s < 60 ? t('{n} s|span', { n: s }) : t('{n} min', { n: s / 60 }));
  const monthName = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { month: 'long', timeZone: 'UTC' });
  const dm = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const C = { d90: 'var(--ch-w)', yr: 'var(--pz1)' };

  // the five spans are the columns, one under the other in the order of the duration
  const cols = $derived(rows.map((r) => ({ key: String(r.span), x: spanName(r.span) })));
  const series = $derived([
    { key: 'yr', color: C.yr, dots: true, v: rows.map((r) => r.year?.w ?? null) },
    { key: 'd90', color: C.d90, dots: true, v: rows.map((r) => r.d90?.w ?? null) },
  ]);
  const w = (x) => (x ? `${num(x.w)} W` : '–');
  const items = (i) => [
    { label: t('best of the last 90 days'), value: w(rows[i].d90), color: C.d90 },
    { label: t('best {year}', { year }), value: w(rows[i].year), color: C.yr },
  ];
  const readout = (i) => ({ title: spanName(rows[i].span), items: items(i) });
  const table = $derived({ head: [t('Duration'), t('best of the last 90 days'), t('best {year}', { year })], rows: rows.map((r) => ({ key: String(r.span), cells: [spanName(r.span), w(r.d90), w(r.year)] })) });
  const at = (s) => rows.find((r) => r.span === s);
  const sentence = (s) => {
    const r = at(s);
    if (!r?.d90 || !r?.year) return '';
    const near = nearSame(r.d90.w, r.year.w);
    const name = spanName(s);
    if (near === 'same') return t('{span} the same: {w} W.', { span: name, w: r.d90.w });
    if (near === 'near') return t('{span} nearly the same: {a} / {b} W.', { span: name, a: r.d90.w, b: r.year.w });
    if (s !== 1200) return '';
    return t('{span}: {a} W in 90 days, {b} W in the year ({month}).', { span: name, a: r.d90.w, b: r.year.w, month: monthName(r.year.day) });
  };
  const cap = $derived(has ? [sentence(1200), sentence(3600)].filter(Boolean).join(' ') : '');
  const label = $derived(
    rows.map((r) => `${spanName(r.span)}: ${r.d90 ? `${r.d90.w} W` : '–'} / ${r.year ? `${r.year.w} W` : '–'}`).join(', '),
  );
  let open = $state(null);
</script>

{#if has}
  <AnaCard key="pcurve" wide sub={t('best mean power per duration')}>
    <LineChart id="pcurve" {cols} {series} {readout} {table} {label} unit="W" maxTop={0} onopen={(i) => (open = i)} hint={t('Point at a duration for its numbers, tap it for the days.')} />
    <ul class="leg">
      <li><i class="k d90"></i>{t('best of the last 90 days')}</li>
      <li><i class="k yr"></i>{t('best {year}', { year })}</li>
    </ul>
    {#if cap}<p class="cap">{cap}</p>{/if}
  </AnaCard>
{/if}

{#if open != null && rows[open]}
  <ChartSheet kicker={t('best mean power per duration')} title={spanName(rows[open].span)} onclose={() => (open = null)} onprev={open > 0 ? () => open-- : null} onnext={open < rows.length - 1 ? () => open++ : null} prevLabel={t('Shorter')} nextLabel={t('Longer')}>
    <ul class="shl" data-pcurve-sheet>
      {#each items(open) as it (it.label)}<li><span>{it.label}</span><b class="num">{it.value}</b></li>{/each}
      {#if rows[open].d90}<li><span>{t('Day of the 90-day best')}</span><b>{dm(rows[open].d90.day)}</b></li>{/if}
      {#if rows[open].year}<li><span>{t('Day of the best {year}', { year })}</span><b>{dm(rows[open].year.day)}</b></li>{/if}
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
  .leg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
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
    border-top: 3px solid;
  }
  .k.d90 {
    border-color: var(--ch-w);
  }
  .k.yr {
    border-color: var(--pz1);
  }
</style>
