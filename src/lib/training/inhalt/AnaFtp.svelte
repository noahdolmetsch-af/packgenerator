<script>
  /**
   * T4 «FTP über die Monate» (Noah 15.10.2026 «1-5 a»): the estimated FTP at the end of each of the last
   * twelve months (the app's own estimate, training.js ftpEstimate: 95 % of the best 20 minutes in 90 days),
   * as a line, with W/kg when a weight is entered. A calm hint when the last six weeks had no full hard
   * 20 minutes (90 % of today's estimate). Observation only. inhalt-woche.js ftpMonths, hardRecently.
   */
  import AnaCard from '../AnaCard.svelte';
  import LineChart from '../../weight/LineChart.svelte';
  import { t, locale } from '../../i18n.svelte.js';
  import { weight } from '../../weight.svelte.js';
  import { niceTicks } from '../week/weeks.js';
  import { ftpMonths, hardRecently, FTP_MONTHS } from './inhalt-woche.js';

  let { acts = [], today = '' } = $props();
  const months = $derived(today ? ftpMonths(acts, today, weight.entries) : []);
  const pts = $derived(months.map((m, i) => ({ ...m, x: i / (FTP_MONTHS - 1) })).filter((m) => m.ftp));
  const has = $derived(pts.length > 0);
  const now = $derived(months.at(-1) ?? null);
  const first = $derived(pts[0] ?? null);
  const hard = $derived(today ? hardRecently(acts, today) : null);
  const f1 = (v) => Number(v).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const monthName = (ym, month = 'short') => new Date(`${ym}-15T12:00:00Z`).toLocaleDateString(locale(), { month, timeZone: 'UTC' });
  const ticks = $derived.by(() => {
    if (!has) return [];
    const v = pts.map((p) => p.ftp);
    return niceTicks(Math.min(...v) - 5, Math.max(...v) + 5, 3).ticks;
  });
  const labels = $derived(months.map((m, i) => ({ x: i / (FTP_MONTHS - 1), text: monthName(m.ym) })).filter((_, i) => i % 3 === 2));
  const value = (m) => (m.wkg ? t('{w} W · {r} W/kg', { w: m.ftp, r: f1(m.wkg) }) : t('{w} W', { w: m.ftp }));
  const label = $derived(has && now?.ftp ? t('Estimated FTP over {n} months, today {v}', { n: FTP_MONTHS, v: value(now) }) : has ? t('Estimated FTP over {n} months', { n: FTP_MONTHS }) : '');
</script>

{#if today}
  <AnaCard key="ftp" wide sub={t('Estimated from your best 20 minutes')}>
    {#if has}
      {#if pts.length > 1}
        <LineChart dots={pts.map((p) => ({ x: p.x, y: p.ftp }))} line={pts.map((p) => ({ x: p.x, y: p.ftp }))} {ticks} {labels} fmt={(v) => `${v} W`} color="var(--ch-w)" {label} height={170} />
      {/if}
      <ul class="ft-vals">
        {#if now?.ftp}<li data-ftp-now><span>{t('Today')}</span><b>{value(now)}</b></li>{/if}
        {#if first && first.ym !== now?.ym}<li data-ftp-first><span>{monthName(first.ym, 'long')} {first.ym.slice(0, 4)}</span><b>{value(first)}</b></li>{/if}
      </ul>
      {#if hard === false}
        <p class="ft-hint" data-ftp-hint>{t('No full 20-minute hard effort for 6 weeks: the estimate is uncertain.')}</p>
      {/if}
      <p class="cap">
        {t('Each month: 95 % of the best 20 minutes in the 90 days up to its end. Only rides with a power meter.')}
        {#if !weight.entries.length}{t('With your weight under Me › My data › Weight also in W/kg.')}{/if}
      </p>
    {:else}
      <p class="cap" data-ftp-none>{t('No ride with a power meter and 20 minutes of power in the last 12 months yet.')}</p>
    {/if}
  </AnaCard>
{/if}

<style>
  .ft-vals {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 24px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--fs-small);
  }
  .ft-vals li {
    display: inline-flex;
    gap: 8px;
    align-items: baseline;
  }
  .ft-vals span {
    color: var(--ink-3);
  }
  .ft-vals b {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .ft-hint {
    margin: 0;
    padding: 8px 12px;
    border-left: 3px solid var(--pz4);
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
