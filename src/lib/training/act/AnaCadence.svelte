<script>
  /**
   * TR5b «Trittfrequenz verteilt» (Noah 14.10.2026 «TR5–TR7 freigegeben»): the share of the time per
   * 10 rpm of cadence (without coasting), with Ø and the main range. Only with a cadence sensor; also
   * without a power meter. Observation only.
   * «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): an axis in %, the share of a bin when pointing, a tap opens
   * the bin, «Als Tabelle» lists the shares.
   */
  import AnaCard from '../AnaCard.svelte';
  import BarChart from '../../charts/BarChart.svelte';
  import ChartSheet from '../../charts/ChartSheet.svelte';
  import { cadenceShares, cadenceMean, cadenceMain } from './power.js';
  import { t } from '../../i18n.svelte.js';

  let { act = null, all = [], today = '' } = $props();

  const rows = $derived(act?.cHist ? cadenceShares(act.cHist) : null);
  const avg = $derived(rows ? (act.cad ?? cadenceMean(act.cHist)) : null);
  const main = $derived(rows ? cadenceMain(act.cHist) : null);
  const aria = $derived(rows ? rows.map((r) => `${r.bin}: ${r.pct} %`).join(', ') : '');
  const range = (r) => `${r.bin}–${r.bin + 9} ${t('rpm')}`;
  const cols = $derived(rows ? rows.map((r) => ({ key: String(r.bin), x: String(r.bin), top: `${r.pct} %`, parts: [{ v: r.pct, color: 'var(--hi)' }] })) : []);
  const readout = (i) => ({ title: range(rows[i]), items: [{ label: t('Share of the time'), value: `${rows[i].pct} %`, color: 'var(--hi)' }] });
  const table = $derived(rows ? { head: [t('Cadence'), t('Share of the time')], rows: rows.map((r) => ({ key: String(r.bin), cells: [range(r), `${r.pct} %`] })) } : null);
  let open = $state(null);
</script>

{#if rows}
  <AnaCard key="cadence" sub={t('from the cadence sensor')} wide>
    <div data-cad-chart>
      <BarChart id="cadence" {cols} {readout} {table} unit="%" label={t('Cadence (rpm) per share of the time: {list}', { list: aria })} onopen={(i) => (open = i)} hint={t('Point at a bar for its share, tap it for the bin.')} />
    </div>
    <p class="cap num">
      {t('Share of the time per cadence (rpm), without coasting.')}
      {#if avg != null}{main && main.from !== main.to ? t('Ø {a}, mostly {b}–{c}.', { a: avg, b: main.from, c: main.to }) : t('Ø {a}.', { a: avg })}{/if}
    </p>
  </AnaCard>
{/if}

{#if open != null && rows?.[open]}
  <ChartSheet kicker={t('Cadence')} title={range(rows[open])} onclose={() => (open = null)} onprev={open > 0 ? () => open-- : null} onnext={open < rows.length - 1 ? () => open++ : null} prevLabel={t('Slower')} nextLabel={t('Faster')}>
    <ul class="shl" data-cad-sheet>
      <li><span>{t('Share of the time')}</span><b class="num">{rows[open].pct} %</b></li>
      {#if avg != null}<li><span>{t('Mean cadence')}</span><b class="num">{avg} {t('rpm')}</b></li>{/if}
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
</style>
