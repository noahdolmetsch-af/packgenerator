<script>
  /**
   * TR5b «Leistungsbereiche als Balken» (Noah 14.10.2026 «TR5–TR7 freigegeben»): the minutes in the
   * 7 power zones (from the FTP estimate) as standing bars, with a legend and the shares. Only with the
   * watts per second and an FTP. Observation only.
   * «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): an axis in minutes, the zone when pointing, a tap opens
   * the zone, «Als Tabelle» lists the minutes.
   */
  import AnaCard from '../AnaCard.svelte';
  import BarChart from '../../charts/BarChart.svelte';
  import ChartSheet from '../../charts/ChartSheet.svelte';
  import { ftpEstimate, powerZoneSecs } from '../../training.js';
  import { hasMeter, pzShares, powerRange, POWER_ZONE_NAMES } from './power.js';
  import { t } from '../../i18n.svelte.js';

  let { act = null, all = [], today = '' } = $props();

  const ftp = $derived(hasMeter(act) ? ftpEstimate(all, today) : null);
  const mins = $derived.by(() => {
    const s = act?.pHist && ftp ? powerZoneSecs(act.pHist, ftp) : null;
    return s && s.some((x) => x > 0) ? s.map((x) => Math.round(x / 60)) : null;
  });
  const sh = $derived(mins ? pzShares(mins) : null);
  const aria = $derived(mins ? mins.map((m, i) => `Z${i + 1} ${t('{n} min', { n: m })}`).join(', ') : '');
  const zoneName = (i) => `Z${i + 1} ${t(POWER_ZONE_NAMES[i])}`;
  const total = $derived(mins ? mins.reduce((a, b) => a + b, 0) : 0);
  const pct = (m) => (total > 0 ? Math.round((m / total) * 100) : 0);
  const cols = $derived(mins ? mins.map((m, i) => ({ key: `z${i + 1}`, x: `Z${i + 1}`, top: String(m), parts: [{ v: m, color: `var(--pz${i + 1})` }] })) : []);
  const readout = (i) => ({ title: zoneName(i), items: [{ label: t('Minutes'), value: String(mins[i]), color: `var(--pz${i + 1})` }, { label: t('Share of the time'), value: `${pct(mins[i])} %` }] });
  const table = $derived(mins ? { head: [t('Zone'), t('Minutes'), t('Share of the time')], rows: mins.map((m, i) => ({ key: `z${i + 1}`, cells: [zoneName(i), String(m), `${pct(m)} %`] })) } : null);
  const rangeText = (i) => {
    const r = powerRange(i, ftp);
    return !r ? '–' : r.from == null ? t('up to {n} W', { n: r.to }) : r.to == null ? t('over {n} W', { n: r.from - 1 }) : t('{a}–{b} W', { a: r.from, b: r.to });
  };
  let open = $state(null);
</script>

{#if mins}
  <AnaCard key="pzbars" sub={t('Minutes')}>
    <div data-pz-chart>
      <BarChart id="pzbars" {cols} {readout} {table} unit="min" label={aria} onopen={(i) => (open = i)} hint={t('Point at a bar for its zone, tap it for the zone.')} />
    </div>
    <ul class="leg">
      {#each POWER_ZONE_NAMES as n, i (i)}<li><i style:background="var(--pz{i + 1})"></i>Z{i + 1} {t(n)}</li>{/each}
    </ul>
    <p class="cap num">
      {t('Minutes per power zone from FTP {n} W.', { n: ftp })}
      {#if sh}{t('Base (Z1–Z2) {a} % · over threshold (Z5–Z7) {b} %.', { a: sh.base, b: sh.over })}{/if}
    </p>
  </AnaCard>
{/if}

{#if open != null && mins?.[open] != null}
  <ChartSheet kicker={t('Power zone')} title={zoneName(open)} onclose={() => (open = null)} onprev={open > 0 ? () => open-- : null} onnext={open < mins.length - 1 ? () => open++ : null} prevLabel={t('Lower zone')} nextLabel={t('Higher zone')}>
    <ul class="shl" data-pz-sheet>
      <li><span>{t('Minutes')}</span><b class="num">{mins[open]}</b></li>
      <li><span>{t('Share of the time')}</span><b class="num">{pct(mins[open])} %</b></li>
      <li><span>{t('Power range')}</span><b class="num">{rangeText(open)}</b></li>
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
    gap: 4px 14px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .leg li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .leg i {
    display: inline-block;
    width: 12px;
    height: 3px;
    border-radius: 2px;
  }
</style>
