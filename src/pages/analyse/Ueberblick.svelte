<script>
  /**
   * «Analyse» M2 «Überblick» (Noah 27.10.2026 «alle Mockups 1:1»), under the choice of sources and period:
   * the numbers of the period (ticks, bike km, sleep, active zone minutes, resting pulse, longest run of
   * days with a tick), every day as a field (darker = more ticked; a tap opens the day), the ranking of
   * your activities against the period before, and ticks per week with the mean of 4 weeks.
   * Only to look at, nothing is rated. Rules in lib/analyse/overview.js.
   * days: the period (oldest first); byKey; acts; log; on: the sources switched on; onday(day).
   */
  import { valueText, unitText } from '../../lib/analyse/format.js';
  import { ticksPerDay, longestRun, heatWeeks, ranking, perWeek } from '../../lib/analyse/overview.js';
  import { actName } from '../../lib/flow/ui.svelte.js';
  import { t, num, locale } from '../../lib/i18n.svelte.js';
  import { niceScale, tickText, LABEL_MAX } from '../../lib/charts/axis.js';
  import GridLines from '../../lib/charts/GridLines.svelte';
  import YTicks from '../../lib/charts/YTicks.svelte';

  let { days = [], byKey = new Map(), acts = [], log = [], on = [], onday } = $props();

  const aktiv = $derived(on.includes('aktiv'));
  const perDay = $derived(ticksPerDay(log));
  const inDays = $derived(days.reduce((s, d) => s + (perDay.get(d) ?? 0), 0));
  const run = $derived(longestRun(days, perDay));
  const heat = $derived(heatWeeks(days, perDay));
  const rank = $derived(ranking(acts, log, days));
  const rankTop = $derived(Math.max(1, ...rank.map((r) => r.n)));
  const weeks = $derived(perWeek(days, perDay));
  const wsc = $derived(niceScale(weeks.flatMap((w) => [w.n, w.mean4]), { zero: true }));
  let pickedWeek = $state(null);
  const pw = $derived(pickedWeek != null && pickedWeek < weeks.length ? pickedWeek : weeks.length - 1);
  const BAR = ['var(--l1)', 'var(--l3)', 'var(--l4)', 'var(--pz5)', 'var(--pz3)', 'var(--pz6)', 'var(--pz4)', 'var(--l2)'];

  // the boxes: only from the sources switched on, only with a value
  const mean = (it) => {
    const vals = days.map((d) => it.get(d)).filter((v) => typeof v === 'number' && Number.isFinite(v));
    if (!vals.length) return null;
    const s = vals.reduce((a, b) => a + b, 0);
    return it.sum ? s : s / vals.length;
  };
  const boxes = $derived.by(() => {
    const out = [];
    if (aktiv) out.push({ key: 'ticks', big: num(inDays), small: t('ticks in {n} days|overview', { n: days.length }) });
    const one = (key, label) => {
      const it = byKey.get(key);
      if (!it?.get || !on.includes(it.src)) return;
      const v = mean(it);
      if (v == null) return;
      out.push({ key, big: `${valueText(it, v, num)}${unitText(it) ? ` ${unitText(it)}` : ''}`, small: label, href: it.href });
    };
    one('km:bike', t('Bike, Strava|overview'));
    one('sleep', t('sleep on average|overview'));
    one('azm', t('active zone minutes a day|overview'));
    one('rhr', t('resting pulse|overview'));
    if (aktiv) out.push({ key: 'run', big: t('{n} days|overview', { n: run }), small: t('longest run|overview') });
    return out;
  });

  const dfmt = (d, o) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', ...o });
  const WD = $derived(Array.from({ length: 7 }, (_, i) => dfmt(`2026-10-${String(5 + i).padStart(2, '0')}`, { weekday: 'short' })));
  // a month name over the first week of each month
  const monthOf = (w, i) => {
    const first = w.cells.find(Boolean)?.day;
    if (!first) return '';
    const prev = heat.weeks[i - 1]?.cells.find(Boolean)?.day;
    return !prev || prev.slice(0, 7) !== first.slice(0, 7) ? dfmt(first, { month: 'short' }) : '';
  };
  const W = 600;
  const H = 160;
  const wy = (n) => H - 2 - ((n - wsc.lo) / (wsc.hi - wsc.lo || 1)) * (H - 12);
  function tapWeek(e) {
    const r = e.currentTarget.getBoundingClientRect();
    pickedWeek = Math.max(0, Math.min(weeks.length - 1, Math.floor(((e.clientX - r.left) / r.width) * weeks.length)));
  }
</script>

<section class="card ov" aria-labelledby="ov-h" data-overview>
  <h2 id="ov-h" class="sr">{t('Overview|overview')}</h2>
  {#if boxes.length}
    <ul class="boxes">
      {#each boxes as b (b.key)}
        <li class="box" data-ov-box={b.key}>
          {#if b.href}<a href={b.href}><b class="num">{b.big}</b><span>{b.small}</span></a>{:else}<b class="num">{b.big}</b><span>{b.small}</span>{/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>

{#if aktiv}
  <section class="card hm" aria-labelledby="hm-h" data-heat>
    <div class="ch"><h2 id="hm-h">{t('Every day a field|overview')}</h2><small>{t('calendar · all ticks|overview')}</small></div>
    <div class="cal" style="--weeks: {heat.weeks.length}">
      <div class="wd" aria-hidden="true">
        <span></span>
        {#each WD as w, i (i)}<span>{i % 2 === 0 ? w : ''}</span>{/each}
      </div>
      <div class="grid">
        <div class="months" aria-hidden="true">{#each heat.weeks as w, i (w.key)}<span>{monthOf(w, i)}</span>{/each}</div>
        <div class="cells">
          {#each heat.weeks as w (w.key)}
            <div class="col">
              {#each w.cells as c, i (i)}
                {#if c}
                  <button type="button" class="cell l{c.level}" data-day={c.day} aria-label={t('{day}: {n} ticked|overview', { day: dfmt(c.day, { weekday: 'long', day: 'numeric', month: 'long' }), n: c.n })} onclick={() => onday?.(c.day)}></button>
                {:else}
                  <span class="cell none"></span>
                {/if}
              {/each}
            </div>
          {/each}
        </div>
      </div>
    </div>
    <p class="hint">{t('Darker = more ticked. Tap a field to see the day.|overview')}</p>
  </section>

  <div class="two">
    <section class="card rk" aria-labelledby="rk-h" data-ranking>
      <div class="ch"><h2 id="rk-h">{t('Ranking|overview')}</h2><small>{t('how often · {n} days · against before|overview', { n: days.length })}</small></div>
      {#if rank.length}
        <ul>
          {#each rank as r, i (r.id)}
            <li data-rank={r.id}>
              <span class="nm">{actName(r.act)}</span>
              <span class="bar"><i style="width:{(r.n / rankTop) * 100}%; background:{BAR[i % BAR.length]}"></i></span>
              <span class="n num"><b>{r.n}×</b> <small>{r.diff > 0 ? '+' : r.diff < 0 ? '−' : '±'}{Math.abs(r.diff)}</small></span>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="hint">{t('Nothing ticked in this period yet.|overview')}</p>
      {/if}
    </section>
    <section class="card wk" aria-labelledby="wk-h" data-weekly>
      <div class="ch"><h2 id="wk-h">{t('Course|analyse')}</h2><small>{t('ticks per week|overview')}</small></div>
      {#if weeks[pw]}<p class="pv" data-week-value aria-live="polite"><b>{t('Week of {day}|overview', { day: dfmt(weeks[pw].key, { day: 'numeric', month: 'short' }) })}</b>: {t('{n} ticks|overview', { n: num(weeks[pw].n) })} · {t('mean of 4 weeks|overview')} {num(Math.round(weeks[pw].mean4 * 10) / 10)}</p>{/if}
      <div class="plot">
        <YTicks ticks={wsc.ticks} y={wy} h={H} text={(v) => tickText(v, wsc.step, num)} width={56} />
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
        <svg viewBox="0 0 {W} {H}" role="img" aria-label={t('Ticks per week|overview')} onclick={tapWeek}>
          <GridLines ticks={wsc.ticks} y={wy} x1={0} x2={W} />
          {#each weeks as w, i (w.key)}
            <rect class="wb" class:on={i === pw} x={(i / weeks.length) * W + 2} width={Math.max(2, W / weeks.length - 4)} y={wy(w.n)} height={wy(0) - wy(w.n)}><title>{dfmt(w.key, { day: 'numeric', month: 'short' })}: {w.n}</title></rect>
          {/each}
          <path class="m4" d={weeks.map((w, i) => `${i ? 'L' : 'M'}${(((i + 0.5) / weeks.length) * W).toFixed(1)} ${wy(w.mean4).toFixed(1)}`).join('')} />
        </svg>
        {#if weeks.length <= LABEL_MAX}
          {#each weeks as w, i (w.key)}<span class="vl num" style="left:calc(62px + (100% - 62px) * {(i + 0.5) / weeks.length}); top:{(wy(w.n) / H) * 100}%" data-bar-label>{num(w.n)}</span>{/each}
        {/if}
      </div>
      <div class="xl" aria-hidden="true" style="margin-left:62px"><span>{weeks[0] ? dfmt(weeks[0].key, { day: 'numeric', month: 'short' }) : ''}</span><span>{weeks.at(-1) ? dfmt(weeks.at(-1).key, { day: 'numeric', month: 'short' }) : ''}</span></div>
      <ul class="legend"><li><i class="lsw"></i>{t('ticks per week|overview')}</li><li><i class="lsw ln"></i>{t('mean of 4 weeks|overview')}</li></ul>
    </section>
  </div>
{/if}

<style>
  .ov {
    min-width: 0;
  }
  .boxes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .box,
  .box a {
    display: flex;
    flex-direction: column;
    gap: 2px;
    color: var(--ink);
    text-decoration: none;
  }
  .box {
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--paper-2);
  }
  .box b {
    font-size: var(--fs-sub);
  }
  .box span {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hm,
  .rk,
  .wk {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }
  .ch {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }
  .ch h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .ch small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    text-align: right;
  }
  .cal {
    display: flex;
    gap: 6px;
    overflow-x: auto;
  }
  .wd {
    flex: none;
    display: grid;
    grid-template-rows: 16px repeat(7, 1fr);
    gap: 3px;
    color: var(--ink-3);
    font-size: var(--fs-label);
  }
  .grid {
    flex: 1;
    min-width: calc(var(--weeks) * 15px);
  }
  .months {
    display: grid;
    grid-template-columns: repeat(var(--weeks), 1fr);
    height: 16px;
    color: var(--ink-3);
    font-size: var(--fs-label);
    white-space: nowrap;
  }
  .cells {
    display: grid;
    grid-template-columns: repeat(var(--weeks), 1fr);
    gap: 3px;
  }
  .col {
    display: grid;
    grid-template-rows: repeat(7, 1fr);
    gap: 3px;
  }
  .cell {
    aspect-ratio: 1;
    min-height: 12px;
    max-height: 34px;
    padding: 0;
    border: 0;
    border-radius: 4px;
    background: var(--paper-2);
    cursor: pointer;
  }
  .cell.none {
    background: none;
    cursor: default;
  }
  .cell.l1 {
    background: color-mix(in srgb, var(--l1) 25%, var(--paper));
  }
  .cell.l2 {
    background: color-mix(in srgb, var(--l1) 45%, var(--paper));
  }
  .cell.l3 {
    background: color-mix(in srgb, var(--l1) 70%, var(--paper));
  }
  .cell.l4 {
    background: var(--l1);
  }
  .cell:focus-visible {
    outline: 2px solid var(--hi);
    outline-offset: 1px;
  }
  .two {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 16px;
  }
  @media (max-width: 860px) {
    .two {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .rk ul {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rk li {
    display: grid;
    grid-template-columns: minmax(80px, 30%) minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    font-size: var(--fs-small);
  }
  .rk .nm {
    overflow-wrap: break-word;
  }
  .rk .bar {
    height: 10px;
    border-radius: 999px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .rk .bar i {
    display: block;
    height: 100%;
    border-radius: 999px;
  }
  .rk .n small {
    color: var(--ink-3);
  }
  .plot {
    position: relative;
    display: flex;
    gap: 6px;
    min-width: 0;
  }
  svg {
    flex: 1;
    min-width: 0;
    width: 100%;
    height: auto;
    cursor: crosshair;
  }
  .wb.on {
    fill-opacity: 0.7;
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  .pv {
    margin: 0;
    font-size: var(--fs-small);
  }
  .vl {
    position: absolute;
    transform: translate(-50%, -130%);
    color: var(--ink-2);
    font-size: var(--fs-label);
    pointer-events: none;
  }
  .wb {
    fill: var(--l1);
    fill-opacity: 0.35;
  }
  .m4 {
    fill: none;
    stroke: var(--l1);
    stroke-width: 2;
  }
  .xl {
    display: flex;
    justify-content: space-between;
    color: var(--ink-3);
    font-size: var(--fs-label);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .legend li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .lsw {
    display: inline-block;
    width: 12px;
    height: 10px;
    border-radius: 2px;
    background: var(--l1);
    opacity: 0.35;
  }
  .lsw.ln {
    height: 2px;
    opacity: 1;
  }
  .hint {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
