<script>
  /**
   * T3 «Ausdauer-Check» (Noah 15.10.2026 «1-5 a»): the aerobic decoupling (Pw:HR) of the long calm rides of
   * the last six months, one dot per ride, a calm trend from three rides and one sentence with the mean.
   * Long calm = an hour or more moving, mostly Z1–Z2, with a power meter, heart rate and both halves.
   * Observation only. Without such rides one quiet line says why nothing shows. inhalt-woche.js decouplePoints.
   */
  import AnaCard from '../AnaCard.svelte';
  import { t, tn, locale } from '../../i18n.svelte.js';
  import { zones } from '../../strava/zones.svelte.js';
  import { monthStart, daysBetween } from '../week/weeks.js';
  import { shiftDay } from '../../training.js';
  import LineChart from '../../charts/LineChart.svelte';
  import ChartSheet from '../../charts/ChartSheet.svelte';
  import { decouplePoints, DEC_MONTHS, DEC_GOOD } from './inhalt-woche.js';

  let { acts = [], today = '' } = $props();
  const data = $derived(today ? decouplePoints(acts, today, zones.bounds) : null);
  const has = $derived(!!data && data.pts.length > 0);
  const f1 = (v) => Number(v).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const monthOf = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { month: 'short', timeZone: 'UTC' });

  const C = 'var(--ch-hr)';
  // one column per day of the six months; a ride is a dot on its day
  const days = $derived(has ? Array.from({ length: data.span + 1 }, (_, i) => shiftDay(data.from, i)) : []);
  const monthStarts = $derived(has ? new Set(Array.from({ length: DEC_MONTHS }, (_, i) => daysBetween(data.from, monthStart(today, DEC_MONTHS - 1 - i)))) : new Set());
  const rides = $derived(has ? days.map((d) => data.pts.filter((p) => p.day === d)) : []);
  const mean = (l) => (l.length ? l.reduce((s, p) => s + p.v, 0) / l.length : null);
  const cols = $derived(days.map((d, i) => ({ key: d, x: monthStarts.has(i) ? monthOf(d) : '' })));
  const trendAt = (i) => {
    const tr = data?.trend;
    if (!tr || i < tr.x0) return null;
    return data.span === tr.x0 ? tr.start : tr.start + ((tr.end - tr.start) * (i - tr.x0)) / (data.span - tr.x0);
  };
  const series = $derived(
    has
      ? [
          { key: 'rides', color: C, line: false, dots: true, v: rides.map(mean) },
          ...(data.trend ? [{ key: 'trend', color: C, v: days.map((_, i) => trendAt(i)) }] : []),
          { key: 'ref', color: 'var(--pz4)', dashed: true, v: days.map(() => DEC_GOOD) },
        ]
      : [],
  );
  const pc = (v) => (v == null ? '–' : `${f1(v)} %`);
  const dmy = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', timeZone: 'UTC' });
  const items = (i) => [
    { label: t('Heart rate drift'), value: rides[i].length ? rides[i].map((p) => pc(p.v)).join(' · ') : '–', color: C },
    ...(trendAt(i) == null ? [] : [{ label: t('Trend'), value: pc(trendAt(i)) }]),
  ];
  const readout = (i) => ({ title: dmy(days[i]), items: items(i) });
  const table = $derived(has ? { head: [t('Day'), t('Heart rate drift'), t('Trend')], rows: [...data.pts].reverse().map((p, k) => ({ key: `${p.day}-${k}`, cells: [dmy(p.day), pc(p.v), pc(trendAt(p.x))] })) } : null);
  let open = $state(null);
  const sentence = $derived(
    !has
      ? ''
      : data.mean > 0
        ? t('On long calm rides your heart rate rises by {n} % on average at the same power. Below 5 % is commonly read as a good endurance base.', { n: f1(data.mean) })
        : t('On long calm rides your heart rate stays level on average at the same power ({n} %). Below 5 % is commonly read as a good endurance base.', { n: f1(data.mean) }),
  );
  const label = $derived(has ? tn(data.pts.length, '{n} long calm ride, mean {m} %', '{n} long calm rides, mean {m} %', { m: f1(data.mean) }) : '');
</script>

{#if data}
  <AnaCard key="decouple" sub={has ? tn(data.pts.length, '{n} ride of an hour or more, mostly Z1–Z2', '{n} rides of an hour or more, mostly Z1–Z2') : t('Heart rate drift at the same power')}>
    {#if has}
      <div data-decouple-chart>
        <LineChart id="decouple" {cols} {series} {readout} {table} {label} maxTop={0} unit="%" tick={(v) => f1(v)} onopen={(i) => (open = i)} hint={t('Point at a day for its numbers, tap it for the day.')} />
      </div>
      <ul class="dc-leg">
        <li><i class="dc-kd"></i>{t('one ride')}</li>
        {#if data.trend}<li><i class="dc-kt"></i>{t('Trend')}</li>{/if}
        <li><i class="dc-kr"></i>{t('5 % line')}</li>
      </ul>
      <p class="cap" data-decouple-sentence>{sentence}</p>
      <p class="cap">{t('Power per heartbeat in the second half against the first. Only rides with a power meter and heart rate.')}</p>
    {:else}
      <p class="cap" data-decouple-none>{t('No long calm ride in the last 6 months yet: it takes an hour or more, mostly in Z1–Z2, with a power meter and heart rate.')}</p>
    {/if}
  </AnaCard>
{/if}

{#if open != null && days[open]}
  <ChartSheet kicker={t('Endurance check')} title={dmy(days[open])} onclose={() => (open = null)} onprev={open > 0 ? () => open-- : null} onnext={open < days.length - 1 ? () => open++ : null} prevLabel={t('Day before')} nextLabel={t('Next day')}>
    <ul class="shl" data-decouple-sheet>
      {#each items(open) as it (it.label)}<li><span>{it.label}</span><b class="num">{it.value}</b></li>{/each}
    </ul>
    {#if !rides[open].length}<p class="cap">{t('No long calm ride on this day.')}</p>{/if}
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
  .dc-leg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .dc-leg li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .dc-kd {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ch-hr);
    opacity: 0.5;
  }
  .dc-kt,
  .dc-kr {
    display: inline-block;
    width: 14px;
    height: 0;
    border-top: 3px solid var(--ch-hr);
  }
  .dc-kr {
    border-top: 2px dashed var(--pz4);
  }
</style>
