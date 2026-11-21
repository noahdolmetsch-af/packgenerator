<script>
  /**
   * SN2+ SN2i (mockup approved 13.10.2026, answer 5b: all months since the first ride, no toggle):
   * «Tempo über die Monate»: km/h per month as bars, Ø heart rate as dots below, only to look at.
   * «Puls und Leistung pro Monat»: Ø and highest heart rate, Ø and max power, best 20 min (power meter
   * only) and the time in the zones as small bars per month, the newest value on the right. Estimated
   * power is lighter and dashed. months: werte.js monthly().
   * «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): the pace per month is the shared bar chart: an axis in km/h,
   * the numbers of a month when pointing (pace, rides, Ø heart rate), a tap opens the month with every value,
   * «As table» lists all months. The small bars of the second card stay: they show the newest value, the table has all.
   */
  import BarChart from '../charts/BarChart.svelte';
  import ChartSheet from '../charts/ChartSheet.svelte';
  import { t, num, locale } from '../i18n.svelte.js';
  import { n1, monthLong } from '../review/fmt.js';
  import { hm } from '../gpx.js';
  import { lastOf } from '../review/werte.js';
  import '../review/zones.css';

  let { months = [] } = $props();
  const letter = (ym) => new Date(`${ym}-15T12:00:00`).toLocaleDateString(locale(), { month: 'narrow' });
  const top = (key) => Math.max(0, ...months.map((m) => m[key] ?? 0)) || 1;
  const newest = $derived(months.at(-1)?.ym ?? null);
  const empty = $derived(months.filter((m) => !m.n && m.hrAvg == null).length);

  const ROWS = [
    { key: 'hrAvg', name: 'Ø heart rate', unit: 'bpm' },
    { key: 'hrMax', name: 'Highest heart rate', unit: 'bpm' },
    { key: 'wAvg', name: 'Ø power', unit: 'W', est: true },
    { key: 'wMax', name: 'Max. power', unit: 'W', est: true },
    { key: 'w20', name: 'Best 20 min', unit: 'W', sub: 'only rides with a power meter' },
  ];
  const any = (key) => months.some((m) => m[key] != null && m[key] !== 0);
  const zoneTop = $derived(top('zoneS'));
  const cols = $derived(months.map((m) => ({ key: m.ym, x: letter(m.ym), top: m.kmh != null ? n1(m.kmh) : '', parts: [{ v: m.kmh ?? 0, color: m.ym === newest ? 'var(--hi)' : 'var(--line-strong)' }] })));
  const read = (i) => {
    const m = months[i];
    const items = [{ label: 'km/h', value: m.kmh != null ? n1(m.kmh) : '–', color: m.ym === newest ? 'var(--hi)' : 'var(--line-strong)' }, { label: t('Rides'), value: String(m.n ?? 0) }];
    if (m.hrAvg != null) items.push({ label: t('Ø heart rate, bpm'), value: String(m.hrAvg) });
    return { title: monthLong(m.ym), items };
  };
  const monthShort = (ym) => new Date(`${ym}-15T12:00:00`).toLocaleDateString(locale(), { month: 'short', year: '2-digit' });
  const dash = (v, f = (x) => String(x)) => (v != null && v !== 0 ? f(v) : '–');
  // only the columns that have a value somewhere (a phone has little room)
  const COLS = [
    { key: 'hrAvg', head: 'Ø bpm' },
    { key: 'hrMax', head: 'max. bpm' },
    { key: 'wAvg', head: 'Ø W' },
    { key: 'wMax', head: 'max. W' },
    { key: 'w20', head: 'Best 20 min W' },
  ];
  const table = $derived.by(() => {
    const cs = COLS.filter((c) => months.some((m) => m[c.key]));
    return {
      head: [t('Month'), 'km/h', t('Rides'), ...cs.map((c) => (c.head.startsWith('Ø') ? c.head : t(c.head)))],
      rows: [...months].reverse().map((m) => ({ key: m.ym, cells: [monthShort(m.ym), m.kmh != null ? n1(m.kmh) : '–', String(m.n ?? 0), ...cs.map((c) => dash(m[c.key]))] })),
    };
  });
  let sel = $state(null);
  const cur = $derived(sel != null ? months[sel] : null);
</script>

{#if months.length}
  <section class="rv-sec pm" aria-labelledby="pm-h" data-months>
    <div class="rv-h"><div><h2 id="pm-h">{t('Pace over the months')}</h2><p class="rv-sub">{t('Average while moving per month, with Ø heart rate · only to look at')}</p></div></div>
    <div class="rv-box pad">
      <BarChart id="pace" {cols} readout={read} {table} unit="km/h" height={150} maxTop={12} label={t('Pace per month')} onopen={(i) => (sel = i)} hint={t('Point at a month for its numbers, tap it for the month.')} />
      {#if empty}<p class="foot">{t('{n} of {all} months without rides.', { n: empty, all: months.length })}</p>{/if}
    </div>
  </section>

  {#if any('hrAvg') || any('wAvg') || any('zoneS')}
    <section class="rv-sec pm" aria-labelledby="pp-h" data-months-values>
      <div class="rv-h"><div><h2 id="pp-h">{t('Heart rate and power per month')}</h2><p class="rv-sub">{t('from Strava · {month} last, without rating', { month: monthLong(newest) })}</p></div></div>
      <ul class="rv-box pad mv">
        {#each ROWS.filter((r) => any(r.key)) as r (r.key)}
          {@const tp = top(r.key)}
          {@const l = lastOf(months, r.key)}
          <li data-row={r.key}>
            <span class="ml2">{t(r.name)}{#if r.sub}<small>{t(r.sub)}</small>{/if}</span>
            <span class="mb" style:--n={months.length}>{#each months as m (m.ym)}<i class:last={m.ym === newest} class:est={r.est && m.west} style:height="{m[r.key] ? Math.max(4, (m[r.key] / tp) * 100) : 4}%" class:none={!m[r.key]}></i>{/each}</span>
            <b class="num">{l ? num(l.v) : '–'} <small class="u">{t(r.unit)}</small></b>
          </li>
        {/each}
        {#if any('zoneS')}
          {@const l = lastOf(months, 'zoneS')}
          <li data-row="zones">
            <span class="ml2">{t('Time in heart rate zones')}<small>{t('Hours per month, Z1 below up to Z5 on top')}</small></span>
            <span class="mb zs" style:--n={months.length}>
              {#each months as m (m.ym)}
                <span class="zcol" style:height="{m.zoneS ? Math.max(4, (m.zoneS / zoneTop) * 100) : 4}%">{#if m.zones}{#each [4, 3, 2, 1, 0] as i (i)}{#if m.zones[i]}<i class="zc-{i + 1}" style:flex-grow={m.zones[i]}></i>{/if}{/each}{/if}</span>
              {/each}
            </span>
            <b class="num">{l ? hm(l.v / 3600) : '–'} <small class="u">h</small></b>
          </li>
        {/if}
        <li class="lg"><span><i class="k"></i>{t('measured')}</span>{#if months.some((m) => m.west)}<span><i class="k est"></i>{t('estimated (without power meter)')}</span>{/if}</li>
      </ul>
    </section>
  {/if}

  {#if cur}
    <ChartSheet kicker={t('Pace over the months')} title={monthLong(cur.ym)} onclose={() => (sel = null)} onprev={sel > 0 ? () => sel-- : null} onnext={sel < months.length - 1 ? () => sel++ : null} prevLabel={t('Month before')} nextLabel={t('Next month')}>
      <ul class="shl" data-months-sheet>
        <li><span>km/h</span><b class="num">{cur.kmh != null ? n1(cur.kmh) : '–'}</b></li>
        <li><span>{t('Rides')}</span><b class="num">{cur.n ?? 0}</b></li>
        {#each ROWS.filter((r) => cur[r.key]) as r (r.key)}<li><span>{t(r.name)}</span><b class="num">{num(cur[r.key])} {t(r.unit)}</b></li>{/each}
        {#if cur.zoneS}<li><span>{t('Time in heart rate zones')}</span><b class="num">{hm(cur.zoneS / 3600)} h</b></li>{/if}
      </ul>
      {#if !cur.n}<p class="foot">{t('No ride in this month.')}</p>{/if}
    </ChartSheet>
  {/if}
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
  .shl b {
    white-space: nowrap;
  }
  .foot {
    margin: 10px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .mv {
    list-style: none;
  }
  .mv li {
    display: grid;
    grid-template-columns: minmax(0, 10em) minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 8px 0;
  }
  .mv li + li {
    border-top: 1px solid var(--line);
  }
  .ml2 {
    display: grid;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .ml2 small,
  .u {
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .mb {
    display: grid;
    grid-template-columns: repeat(var(--n), minmax(0, 1fr));
    align-items: end;
    gap: 3px;
    height: 40px;
  }
  .mb > i {
    display: block;
    border-radius: 2px;
    background: var(--line-strong);
  }
  .mb > i.none {
    background: var(--line);
  }
  .mb > i.last {
    background: var(--hi);
  }
  .mb > i.est {
    background: var(--paper-2);
    border: 1px dashed var(--ink-3);
    box-sizing: border-box;
  }
  .zs {
    height: 64px;
  }
  .zcol {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-height: 2px;
    border-radius: 2px;
    overflow: hidden;
    background: var(--line);
  }
  .zcol i {
    display: block;
    flex: 1 1 0;
    min-height: 1px;
    border-radius: 0;
  }
  .mv b {
    font: 600 var(--fs-sub) / 1.2 var(--font-body);
    white-space: nowrap;
    text-align: right;
  }
  .lg {
    display: flex !important;
    flex-wrap: wrap;
    gap: 6px 16px;
    min-height: 0 !important;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .lg span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .k {
    display: inline-block;
    width: 14px;
    height: 8px;
    border-radius: 2px;
    background: var(--line-strong);
  }
  .k.est {
    background: var(--paper-2);
    border: 1px dashed var(--ink-3);
  }
  @media (max-width: 559px) {
    .mv li {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .mb {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
</style>
