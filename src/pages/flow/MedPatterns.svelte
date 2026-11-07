<script>
  /**
   * v0.105.0 Design-Refresh P8 «Aktiv» (A14c «Muster», Noah «freigabe für a14 und a14c»): the new page
   * #/flow/act/meditation/muster, reached from the log's overview («Muster finden»). Only observation, no
   * rating: the records (longest in one go, longest streak, most minutes in a week, deepest session),
   * when it goes deepest (sessions per hour of the day, the colour the mean depth), the length of the
   * sessions and, at the side, what helped (from «Wie war es?», only what you noted). The charts count
   * the last 13 weeks; the records count every session.
   * «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): the hours chart is the shared bar chart: an axis in sessions,
   * the numbers of an hour when pointing, a tap opens the hour, «As table» lists the hours.
   */
  import { Lightbulb } from '@lucide/svelte';
  import Empty from '../../lib/ui/Empty.svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import Sec from '../../lib/flow/kit/Sec.svelte';
  import BarChart from '../../lib/charts/BarChart.svelte';
  import ChartSheet from '../../lib/charts/ChartSheet.svelte';
  import { medQuery, seedMed } from '../../lib/flow/data.svelte.js';
  import { logRows, streaks, deepestHours, durationBins } from '../../lib/flowmed.js';
  import { addDays } from '../../lib/flow.js';
  import { medRecords, helpedStats, hourDepth, isoWeek } from '../../lib/flow/aktiv.js';
  import { actName } from '../../lib/flow/ui.svelte.js';
  import { helpedLabel } from '../../lib/flow/hobby/words.js';
  import { dayShort } from '../../lib/flow/words.js';
  import { localDay } from '../../lib/localday.js';
  import { t, tn } from '../../lib/i18n.svelte.js';

  let { actId = 'meditation' } = $props();
  const today = localDay();
  const q = $derived(medQuery(actId, today));
  const data = $derived($q);
  $effect(() => {
    seedMed(data, actId);
  });
  const act = $derived(data?.acts.find((a) => a.id === actId) ?? null);
  const base = $derived(`#/flow/act/${encodeURIComponent(actId)}`);
  const name = $derived(act ? actName(act) : t('Meditation'));

  const WEEKS = 13;
  const from = addDays(today, -7 * WEEKS + 1);
  const rows = $derived(data ? logRows(data.log, data.sessions, actId).filter((r) => r.day <= today) : []);
  const recent = $derived(rows.filter((r) => r.day >= from));
  const rec = $derived(medRecords(rows));
  const str = $derived(data ? streaks(data.log, actId, today) : { now: 0, longest: 0 });
  const sHref = (r) => `${base}/s/${encodeURIComponent(r.id)}`;

  /* when it goes deepest: the hours from 5 to 23 (all 24 when something lies in the night) */
  const hours = $derived.by(() => {
    const all = hourDepth(recent);
    return all.some((x) => x.h < 5 && x.n) ? all : all.filter((x) => x.h >= 5);
  });
  const lvl = (d) => (d == null ? 0 : d >= 4 ? 3 : d >= 3 ? 2 : 1);
  const DEPTH_COLOR = ['var(--line)', 'var(--ok-soft)', 'color-mix(in srgb, var(--accent) 55%, var(--paper))', 'var(--accent)'];
  const hourName = (h) => `${h}:00–${h}:59`;
  const hCols = $derived(hours.map((x) => ({ key: String(x.h), x: x.h % 6 === 0 ? t('{h} h', { h: x.h }) : '', top: x.n ? String(x.n) : '', parts: [{ v: x.n, color: DEPTH_COLOR[lvl(x.depth)] }] })));
  const depthText = (x) => (x.depth == null ? '–' : String(Math.round(x.depth * 10) / 10));
  const hRead = (i) => ({ title: hourName(hours[i].h), items: [{ label: t('Sessions'), value: String(hours[i].n), color: DEPTH_COLOR[lvl(hours[i].depth)] }, { label: t('Depth ⌀'), value: depthText(hours[i]) }] });
  const hTable = $derived({ head: [t('Hour'), t('Sessions'), t('Depth ⌀')], rows: hours.map((x) => ({ key: String(x.h), cells: [hourName(x.h), String(x.n), depthText(x)] })) });
  let hSel = $state(null);
  const deep = $derived(deepestHours(recent));
  const bins = $derived(durationBins(recent));
  const binMax = $derived(Math.max(1, ...bins.map((b) => b.n)));
  const helps = $derived(helpedStats(recent));
</script>

<div class="mp">
  <header class="ph">
    <Crumb path={[{ href: '#/flow', label: t('Active|place') }, { href: base, label: name }, { href: `${base}/log`, label: t('Logbook') }]} here={t('Patterns')} />
    <h1 class="h1" tabindex="-1" data-page-title>{t('Patterns')}</h1>
    <p class="sub">{name} · {t('when it goes deepest · only observation, no rating')}</p>
  </header>
  <p class="tools"><span class="range">{t('Period: last {n} weeks', { n: WEEKS })}</span></p>

  {#if data}
    <div class="lay">
      <div class="col">
        <Sec id="rec-h" title={t('Records')} sub={t('over all your sessions')}>
          <div class="recs">
            {#snippet card(key, label, value, sub, href)}
              {#if href}
                <a class="card rc" {href} data-rec={key}><small>{label}</small><b class="num">{value}</b><span>{sub}</span></a>
              {:else}
                <div class="card rc" data-rec={key}><small>{label}</small><b class="num">{value}</b><span>{sub}</span></div>
              {/if}
            {/snippet}
            {@render card('longest', t('Longest in one go'), rec.longest ? t('{n} min', { n: rec.longest.min }) : '–', rec.longest ? dayShort(rec.longest.day) : '', rec.longest ? sHref(rec.longest) : null)}
            {@render card('streak', t('Longest streak'), tn(str.longest, '{n} day', '{n} days'), str.now ? t('now {n} in a row', { n: str.now }) : '', null)}
            {@render card('week', t('Most minutes'), rec.week ? t('{n} min', { n: rec.week.min }) : '–', rec.week ? t('Week {n}', { n: isoWeek(rec.week.monday) }) : '', null)}
            {@render card('deepest', t('Deepest session'), rec.deepest ? t('Depth {n}', { n: rec.deepest.depth }) : '–', rec.deepest ? dayShort(rec.deepest.day) : t('with a depth in the note'), rec.deepest ? sHref(rec.deepest) : null)}
          </div>
        </Sec>

        <Sec id="hr-h" title={t('When it goes deepest')} sub={t('sessions per time of day, last {n} weeks', { n: WEEKS })}>
          <div class="card pad">
            <BarChart id="hours" cols={hCols} readout={hRead} table={hTable} unit={t('Sessions')} steps={[1, 2, 5, 10, 20, 50, 100]} label={t('Sessions per hour of the day')} onopen={(i) => (hSel = i)} hint={t('Point at an hour for its sessions, tap it for the hour.')} />
            <p class="legend"><span>{t('Colour = depth:')}</span><i class="d1"></i><i class="d2"></i><i class="d3"></i><span>{t('deep')}</span></p>
            <p class="line">{deep ? t('Deepest (depth 4–5): {from} to {to} o’clock', { from: deep.from, to: deep.to }) : t('With a depth in the note you see here when it goes deepest.')}</p>
          </div>
        </Sec>

        <Sec id="len-h" title={t('Length of the sessions')} sub={t('how often')}>
          <ul class="card bins">
            {#each bins as b (b.id)}
              <li data-bin={b.id}><span class="bn">{t('{range} min', { range: t(b.name) })}</span><span class="bar"><i style:width="{Math.round((b.n / binMax) * 100)}%"></i></span><span class="bv num">{tn(b.n, '{n} session', '{n} sessions')}</span></li>
            {/each}
          </ul>
        </Sec>
      </div>

      <aside class="col">
        <Sec id="hl-h" title={t('What helped')} sub={t('from «How was it?» · only when you noted something')}>
          {#if helps.length}
            <ul class="card hl">
              {#each helps as h (h.id)}
                <li data-helped={h.id}><b>{helpedLabel(h.id)}</b><small>{t('{n}× noted', { n: h.n })}{#if h.depth != null}{' · '}{t('depth ⌀ {d}', { d: h.depth })}{/if}</small></li>
              {/each}
            </ul>
          {:else}
            <Empty icon={Lightbulb} text={t('Nothing noted yet. After a session, «How was it?» asks what helped.')} />
          {/if}
        </Sec>
        <p class="note"><Lightbulb size={16} aria-hidden="true" /><span>{t('Only observation, no rating. The calendar and every session are in the log.')}</span></p>
      </aside>
    </div>
  {/if}
</div>

{#if hSel != null && hours[hSel]}
  {@const x = hours[hSel]}
  <ChartSheet kicker={t('When it goes deepest')} title={hourName(x.h)} onclose={() => (hSel = null)} onprev={hSel > 0 ? () => hSel-- : null} onnext={hSel < hours.length - 1 ? () => hSel++ : null} prevLabel={t('Hour before')} nextLabel={t('Next hour')}>
    <ul class="shl" data-hours-sheet>
      <li><span>{t('Sessions')}</span><b class="num">{x.n}</b></li>
      <li><span>{t('Depth ⌀')}</span><b class="num">{depthText(x)}</b></li>
    </ul>
    {#if !x.n}<p class="line">{t('No session in this hour.')}</p>{/if}
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
  .mp {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 1240px;
    margin: 0 auto;
    min-width: 0;
  }
  .ph {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
  }
  .h1 {
    margin: 0;
    font: 800 var(--fs-page)/1.1 var(--font-brand);
  }
  .sub {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tools {
    margin: 0;
  }
  .range {
    display: inline-block;
    padding: 10px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lay {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-5);
    align-items: start;
  }
  @media (min-width: 1000px) {
    .lay {
      grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
    }
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
    min-width: 0;
  }
  .pad {
    padding: var(--sp-4);
    min-width: 0;
  }
  .recs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-3);
  }
  .rc {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    padding: var(--sp-3) var(--sp-4);
    color: var(--ink);
    text-decoration: none;
  }
  .rc small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .rc b {
    font: 700 var(--fs-section)/1.2 var(--font-brand);
  }
  .rc span {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .d1 {
    background: var(--ok-soft);
  }
  .d2 {
    background: color-mix(in srgb, var(--accent) 55%, var(--paper));
  }
  .d3 {
    background: var(--accent);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    margin: var(--sp-3) 0 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .legend i {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }
  .line {
    margin: var(--sp-2) 0 0;
    font-size: var(--fs-small);
  }
  .bins,
  .hl {
    margin: 0;
    padding: 0 var(--sp-4);
    list-style: none;
  }
  .bins li {
    display: grid;
    grid-template-columns: minmax(80px, 1fr) minmax(0, 2fr) auto;
    align-items: center;
    gap: var(--sp-3);
    min-height: 48px;
  }
  .bins li + li,
  .hl li + li {
    border-top: 1px solid var(--line);
  }
  .bar {
    height: 8px;
    border-radius: 99px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: 99px;
    background: var(--accent);
  }
  .bv {
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-align: right;
  }
  .hl li {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: var(--sp-3) 0;
  }
  .hl b {
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .hl small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .none {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .note {
    display: flex;
    gap: var(--sp-2);
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .note :global(svg) {
    flex: none;
    margin-top: 2px;
  }
</style>
