<script>
  /**
   * «Mehr Inhalt» T5 «Deine Hausrunde über die Zeit» (Noah 15.10.2026 «1-5 a»): from 3 rides on the
   * same route (same name, km within 10 %, training.js sameRoute) a small line of the average speed
   * over the rides and a table: date, moving time, km/h, Ø W (with power), Ø heart rate and one
   * efficiency number (watts per heartbeat with power, else heart rate per km/h). This ride is marked;
   * one calm sentence compares it with the mean of the others. Fewer than 3 rides: nothing.
   * «Schlag deinen Geist» (Noah 04.11.2026 «5b»): while the ghost card shows for this ride, it says the
   * same thing against one earlier ride, so the sentence here is left out (the line and the table stay).
   */
  import AnaCard from '../AnaCard.svelte';
  import LineChart from '../../charts/LineChart.svelte';
  import ChartSheet from '../../charts/ChartSheet.svelte';
  import { homeLoop } from './inhalt-fahrt.js';
  import { mss } from '../act/analysen.js';
  import { ghostsOf } from '../act/ghost.js';
  import { ana } from '../analyses.svelte.js';
  import { keysOf } from '../analyses.js';
  import { t, tn, num, locale } from '../../i18n.svelte.js';

  let { act = null, all = [], today = '' } = $props();
  const loop = $derived(homeLoop(all, act));
  const dayShort = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'numeric' });
  const v = (x) => (Number.isFinite(x) ? num(x) : '–');
  const v1 = (x) => (Number.isFinite(x) ? x.toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '–');
  const v2 = (x) => (Number.isFinite(x) ? x.toLocaleString(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '–');

  // the line: km/h over the rides shown, evenly spaced, this ride as the bigger dot; the table below has every number
  const cols = $derived(loop ? loop.rows.map((r) => ({ key: String(r.id), x: dayShort(r.day) })) : []);
  const series = $derived(
    loop
      ? [
          { key: 'kmh', color: 'var(--pz2)', v: loop.rows.map((r) => (Number.isFinite(r.kmh) ? r.kmh : null)) },
          { key: 'me', color: 'var(--accent)', line: false, dots: true, v: loop.rows.map((r) => (r.me && Number.isFinite(r.kmh) ? r.kmh : null)) },
        ]
      : [],
  );
  const lines = (r) => [
    { label: t('Time|an'), value: r.s ? mss(r.s) : '–' },
    { label: t('km/h|an'), value: v1(r.kmh), color: 'var(--pz2)' },
    ...(loop.power ? [{ label: t('Ø W|an'), value: v(r.w) }] : []),
    { label: t('Ø HR|an'), value: v(r.hr) },
    { label: t(loop.eff === 'wpb' ? 'W/beat|hl' : 'HR/km/h|hl'), value: v2(r.eff) },
  ];
  const readout = (i) => ({ title: `${dayShort(loop.rows[i].day)}${loop.rows[i].me ? ` · ${t('this ride|hl')}` : ''}`, items: lines(loop.rows[i]) });
  let open = $state(null);

  // the ghost card is shown for this ride (switched on in «Analysen anpassen» and an earlier ride to compare with)
  const ghostShown = $derived(keysOf(ana, 'act').includes('ghost') && ghostsOf(all, act, 1).length > 0);
  const sentence = $derived.by(() => {
    if (!loop || loop.dS == null || ghostShown) return '';
    const now = act?.day === today;
    const time = mss(Math.abs(loop.dS));
    const same = Math.abs(loop.dS) < 10;
    let head;
    if (same) head = t(now ? 'On this route you are as fast today as on average|hl' : 'On this route you were as fast this time as on average|hl');
    else if (loop.dS < 0) head = t(now ? 'On this route you are {t} faster today than on average|hl' : 'On this route you were {t} faster this time than on average|hl', { t: time });
    else head = t(now ? 'On this route you are {t} slower today than on average|hl' : 'On this route you were {t} slower this time than on average|hl', { t: time });
    const d = loop.dHr;
    const hr = d == null ? '' : d === 0 ? t(', at the same heart rate|hl') : d < 0 ? tn(-d, ', with {n} beat less heart rate|hl', ', with {n} beats less heart rate|hl') : tn(d, ', with {n} beat more heart rate|hl', ', with {n} beats more heart rate|hl');
    return `${head}${hr}.`;
  });
  const label = $derived(loop ? t('Average speed on {n} rides of this route; this ride is the bigger dot.', { n: loop.rows.length }) : '');
</script>

{#if loop}
  <AnaCard key="homeloop" sub={tn(loop.n, '{n} ride on this route|hl', '{n} rides on this route|hl')}>
    {#if sentence}<p class="hlsen" data-homeloop-sentence>{sentence}</p>{/if}
    <LineChart id="homeloop" {cols} {series} {readout} {label} unit="km/h" tick={(x) => v1(x)} onopen={(i) => (open = i)} hint={t('Point at a ride for its numbers, tap it for the ride.')} />
    <div class="hlwrap">
      <table class="hltab">
        <thead>
          <tr>
            <th scope="col" class="dt">{t('Date|hl')}</th>
            <th scope="col">{t('Time|an')}</th>
            <th scope="col">{t('km/h|an')}</th>
            {#if loop.power}<th scope="col">{t('Ø W|an')}</th>{/if}
            <th scope="col">{t('Ø HR|an')}</th>
            <th scope="col">{t(loop.eff === 'wpb' ? 'W/beat|hl' : 'HR/km/h|hl')}</th>
          </tr>
        </thead>
        <tbody>
          {#each loop.rows as r (r.id)}
            <tr class:me={r.me} data-loop-row={r.id} aria-current={r.me ? 'true' : undefined}>
              <th scope="row" class="dt">
                {#if r.me}{dayShort(r.day)} <span class="mepill">{t('this ride|hl')}</span>{:else}<a href="#/flow/training/a/{encodeURIComponent(r.id)}">{dayShort(r.day)}</a>{/if}
              </th>
              <td>{r.s ? mss(r.s) : '–'}</td>
              <td>{v1(r.kmh)}</td>
              {#if loop.power}<td>{v(r.w)}</td>{/if}
              <td>{v(r.hr)}</td>
              <td>{v2(r.eff)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="cap">
      {t(loop.eff === 'wpb' ? 'Same name and km within 10 %. Line: average speed. W per beat: more = more power for each heartbeat.|hl' : 'Same name and km within 10 %. Line: average speed. HR per km/h: less = less heart rate for the same speed.|hl')}
      {#if loop.n > loop.rows.length}{t('The last {n} rides.|hl', { n: loop.rows.length })}{/if}
    </p>
  </AnaCard>
{/if}

{#if open != null && loop?.rows[open]}
  {@const r = loop.rows[open]}
  <ChartSheet kicker={t('Your home loop')} title={dayShort(r.day)} onclose={() => (open = null)} onprev={open > 0 ? () => open-- : null} onnext={open < loop.rows.length - 1 ? () => open++ : null} prevLabel={t('Ride before')} nextLabel={t('Next ride')}>
    <ul class="shl" data-homeloop-sheet>
      {#each lines(r) as it (it.label)}<li><span>{it.label}</span><b class="num">{it.value}</b></li>{/each}
    </ul>
    {#if !r.me}<a class="more" href="#/flow/training/a/{encodeURIComponent(r.id)}">{t('Open this ride')}</a>{:else}<p class="cap">{t('this ride|hl')}</p>{/if}
  </ChartSheet>
{/if}

<style>
  .hlsen {
    margin: 0;
  }
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
  .more {
    color: var(--accent);
    font-weight: 600;
  }
  .hlwrap {
    overflow-x: auto;
  }
  .hltab {
    width: 100%;
    border-collapse: collapse;
    font-variant-numeric: tabular-nums;
    font-size: var(--fs-small);
  }
  th,
  td {
    padding: 8px 6px;
    text-align: right;
    border-bottom: 1px solid var(--line);
    white-space: nowrap;
  }
  thead th {
    color: var(--ink-3);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .dt {
    text-align: left;
    font-weight: 400;
  }
  thead .dt {
    font-weight: 600;
  }
  tr.me > * {
    background: var(--accent-soft);
    font-weight: 600;
  }
  .dt a {
    color: inherit;
  }
  .mepill {
    display: inline-block;
    margin-left: 4px;
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--paper);
    color: var(--accent);
    font-size: var(--fs-tiny);
    font-weight: 600;
  }
  @media (max-width: 640px) {
    th,
    td {
      padding: 8px 2px;
    }
    thead th {
      letter-spacing: 0;
    }
    .mepill {
      display: none;
    }
  }
</style>
