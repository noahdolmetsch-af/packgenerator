<script>
  /**
   * TR7d «Belastung pro Woche»: 16 bars with the week's load (power, else Relative Effort), this week (until
   * today) lighter, KW under every third bar, and a quiet note on the weeks without any activity. weeks.js.
   * «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): an axis with round steps, the load and the number of
   * activities of a week when pointing, a tap opens the week with its activities, «Als Tabelle» the same as rows.
   */
  import AnaCard from '../AnaCard.svelte';
  import BarChart from '../../charts/BarChart.svelte';
  import ChartSheet from '../../charts/ChartSheet.svelte';
  import { t, num, locale } from '../../i18n.svelte.js';
  import { stravaName } from '../../stravanames.js';
  import { shiftDay } from '../../training.js';
  import { weekLoads, loadsOf, WEEKS } from './weeks.js';

  let { acts = [], today = '' } = $props();
  const loads = $derived(loadsOf(acts));
  const weeks = $derived(today ? weekLoads(acts, today, WEEKS, loads) : []);
  const max = $derived(Math.max(0, ...weeks.map((x) => x.load)));
  const empty = $derived(weeks.filter((x) => !x.current && x.n === 0).map((x) => x.kw));
  const dm = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const wkText = (x) => `${t('Wk {n}', { n: x.kw })} · ${dm(x.monday)}`;
  const now = 'color-mix(in srgb, var(--ch-w) 45%, transparent)';

  const cols = $derived(weeks.map((x, i) => ({ key: x.monday, x: i % 3 === 0 ? t('Wk {n}', { n: x.kw }) : '', top: x.load > 0 ? num(x.load) : '', parts: [{ v: x.load, color: x.current ? now : 'var(--ch-w)' }] })));
  const readout = (i) => ({ title: wkText(weeks[i]), items: [{ label: t('Load'), value: num(weeks[i].load), color: 'var(--ch-w)' }, { label: t('Activities'), value: num(weeks[i].n) }] });
  const table = $derived({ head: [t('Week'), t('Load'), t('Activities')], rows: [...weeks].reverse().map((x) => ({ key: x.monday, cells: [wkText(x), num(x.load), num(x.n)] })) });
  const label = $derived(weeks.map((x) => `${t('Wk {n}', { n: x.kw })}: ${x.load}`).join(', '));

  let open = $state(null);
  const wk = $derived(open == null ? null : weeks[open]);
  const list = $derived(wk ? acts.filter((a) => a.day >= wk.monday && a.day < shiftDay(wk.monday, 7) && a.day <= today).sort((a, b) => (a.day + (a.time ?? '')).localeCompare(b.day + (b.time ?? ''))) : []);
</script>

{#if max > 0}
  <AnaCard key="wload" wide sub={t('Bars')}>
    <BarChart id="wload" {cols} {readout} {table} onopen={(i) => (open = i)} {label} hint={t('Point at a week for its numbers, tap it for its activities.')} />
    <p class="cap">
      {t('Load per week (power, else Relative Effort). Light = this week until today.')}
      {#if empty.length}{t('Wk {list} without activity.', { list: empty.join(', ') })}{/if}
    </p>
  </AnaCard>
{/if}

{#if wk}
  <ChartSheet kicker={t('Load per week')} title={wkText(wk)} onclose={() => (open = null)} onprev={open > 0 ? () => open-- : null} onnext={open < weeks.length - 1 ? () => open++ : null} prevLabel={t('Week before')} nextLabel={t('Next week')}>
    <ul class="shl" data-wload-sheet>
      <li><span>{t('Load')}</span><b class="num">{num(wk.load)}</b></li>
      <li><span>{t('Activities')}</span><b class="num">{num(wk.n)}</b></li>
    </ul>
    {#if list.length}
      <ul class="shl acts">
        {#each list as a (a.id)}<li><a href="#/flow/training/a/{encodeURIComponent(a.id)}"><span>{stravaName(a.name) || t('Activity')} · {dm(a.day)}</span><b class="num">{num(Math.round(loads.get(a.id) ?? 0))}</b></a></li>{/each}
      </ul>
    {:else}
      <p class="cap">{t('No activity in this week.')}</p>
    {/if}
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
  .shl li,
  .shl a {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    color: inherit;
    text-decoration: none;
  }
  .shl span {
    color: var(--ink-2);
  }
</style>
