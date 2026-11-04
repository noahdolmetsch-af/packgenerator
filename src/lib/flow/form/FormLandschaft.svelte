<script>
  /**
   * «Belastungslandschaft» (Noah 03.11.2026, Cockpit-Idee 1) on the page «Form und Erholung»: the load of the
   * past 8 weeks as a landscape: the back hill is your fitness, the front hill your fatigue, the thin ridges
   * are the days' loads. Planned sessions of Training continue it to the right as an estimate (dashed, lighter).
   * One tap on «Curves» shows the same days as precise curves with an axis. Pointing, tapping or ← → goes
   * through the days; the day below lists its single sessions, each a link. f: formOf() of the page.
   * Planned loads are estimated from minutes and zone (landschaft.js), never measured.
   */
  import { niceScale, fracOf, tickText } from '../../charts/axis.js';
  import YTicks from '../../charts/YTicks.svelte';
  import GridLines from '../../charts/GridLines.svelte';
  import Readout from '../../charts/Readout.svelte';
  import Seg from '../../ui/Seg.svelte';
  import { indexAt, stepKey } from '../../charts/pick.js';
  import { dayLoads, loadOf } from '../../form.js';
  import { doneBy, KIND_NAMES } from '../../training.js';
  import { plannedByDay, plannedLoad, landscapeDays, hillPath, smoothPath } from './landschaft.js';
  import { dateMarks } from './zeitraum.js';
  import { dm } from '../garmin/words.js';
  import { t, num, locale } from '../../i18n.svelte.js';

  let { f, today } = $props();

  let view = $state('land');
  let sel = $state(null);

  const acts = $derived([...f.table.values()].flatMap((r) => r.acts ?? []));
  const actsByDay = $derived.by(() => {
    const m = new Map();
    for (const a of acts) m.set(a.day, [...(m.get(a.day) ?? []), a]);
    return m;
  });
  const plan = $derived(f.plan ?? []);
  const planned = $derived(plannedByDay(plan, actsByDay, today));
  const pts = $derived(landscapeDays({ loads: dayLoads(acts, f.opts), planned, today }));
  const n = $derived(pts.length);
  const ti = $derived(pts.findIndex((p) => p.day === today));
  const hasLoad = $derived(pts.some((p) => p.load > 0));
  const hasPlan = $derived(planned.size > 0);

  const sc = $derived(niceScale(pts.flatMap((p) => [p.fit, p.fat, p.load]).concat(0), { zero: true, count: 4 }));
  const Y = (v) => 96 - fracOf(v, sc) * 92;
  const X = (i) => i * 10 + 5;
  const W = $derived(Math.max(1, n) * 10);
  const xy = (k) => pts.map((p, i) => ({ x: X(i), y: Y(p[k]) }));
  const upTo = (list, a, b) => list.slice(a, b);
  // the hills and lines: the whole way for the hills; lines solid up to today, dashed (estimate) from there
  const hillFit = $derived(hillPath(xy('fit'), 100));
  const hillFat = $derived(hillPath(xy('fat'), 100));
  const lineFat = $derived(smoothPath(upTo(xy('fat'), 0, ti + 1)));
  const lineFatAhead = $derived(smoothPath(upTo(xy('fat'), ti, n)));
  const lineFit = $derived(smoothPath(upTo(xy('fit'), 0, ti + 1)));
  const lineFitAhead = $derived(smoothPath(upTo(xy('fit'), ti, n)));
  const marks = $derived(dateMarks(n, 4));

  const signed = (v) => (v > 0 ? `+${num(v)}` : v < 0 ? `−${num(-v)}` : num(0));
  const longDay = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const shownSel = $derived(sel ?? (ti >= 0 ? ti : n - 1));
  const cur = $derived(pts[shownSel] ?? null);
  const ro = $derived.by(() => {
    if (!cur) return null;
    const title = cur.day === today ? `${t('today')} · ${longDay(cur.day)}` : cur.future ? `${longDay(cur.day)} · ${t('planned, estimated|ls')}` : longDay(cur.day);
    return {
      title,
      items: [
        { label: t('Fitness|form'), value: num(cur.fit), color: 'var(--hi)' },
        { label: t('Fatigue|form'), value: num(cur.fat), color: 'var(--warn)' },
        { label: t('Form|form'), value: signed(cur.form), color: cur.form < 0 ? 'var(--bad)' : 'var(--ok)' },
        { label: t('Load|day'), value: `${cur.future ? '~' : ''}${num(Math.round(cur.load))}`, color: 'var(--ink-3)' },
      ],
    };
  });

  // the sessions of the chosen day: what you did (each a link to the ride) and what is planned
  const dayActs = $derived(cur ? (actsByDay.get(cur.day) ?? []) : []);
  const dayPlan = $derived(cur && cur.day >= today ? plan.filter((s) => s.day === cur.day && !doneBy(s, actsByDay.get(cur.day) ?? [])) : []);
  const actMeta = (a, l) => [Number.isFinite(a.movingS) ? `${num(Math.round(a.movingS / 60))} min` : null, l ? t('load {n}|ls', { n: num(l.load) }) : null].filter(Boolean).join(' · ');
  const planMeta = (s) => [`${num(s.mins)} min`, s.zone ? `Z${s.zone}` : null, t('~load {n}|ls', { n: num(plannedLoad(s)) })].filter(Boolean).join(' · ');

  const at = (e) => indexAt(e.clientX, e.currentTarget.getBoundingClientRect(), n);
  const move = (e) => {
    if (e.pointerType === 'mouse' || e.buttons) sel = at(e) ?? sel;
  };
  const leave = (e) => {
    if (e.pointerType === 'mouse') sel = null;
  };
  const tap = (e) => {
    const i = at(e);
    if (i != null) sel = i;
  };
  function key(e) {
    const i = stepKey(e.key, sel ?? shownSel, n);
    if (i == null) return;
    e.preventDefault();
    sel = i;
  }
</script>

{#if hasLoad}
  <div class="ls" data-chart="landscape" data-view={view}>
    <div class="top">
      <Seg small full={false} label={t('Show as')} value={view} onchange={(v) => (view = v)} options={[{ key: 'land', name: t('Landscape|ls') }, { key: 'curve', name: t('Curves|ls') }]} />
      <ul class="lg" aria-label={t('Legend|ls')}>
        <li><i class="k hi"></i>{t('Fitness|form')}</li>
        <li><i class="k warn"></i>{t('Fatigue|form')}</li>
        <li><i class="k ink"></i>{t('Load of the day|ls')}</li>
        {#if hasPlan}<li><i class="k dash"></i>{t('Planned, estimated|ls')}</li>{/if}
      </ul>
    </div>
    {#if ro}<Readout title={ro.title} items={ro.items} />{/if}

    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="g" class:curve={view === 'curve'} role="group" tabindex="0" aria-label={t('Load landscape per day, {n} days', { n })} aria-roledescription={t('chart')} aria-keyshortcuts="ArrowLeft ArrowRight Home End PageUp PageDown" onkeydown={key} data-plot data-n={n}>
      {#if view === 'curve'}<YTicks ticks={sc.ticks} y={Y} h={100} text={(v) => tickText(v, sc.step, num)} width={40} />{/if}
      <div class="p" onpointermove={move} onpointerdown={move} onpointerleave={leave} onclick={tap} role="presentation">
        <svg viewBox="0 0 {W} 100" preserveAspectRatio="none" aria-hidden="true">
          {#if view === 'curve'}<GridLines ticks={sc.ticks} y={Y} x1={0} x2={W} />{/if}
          {#if hasPlan && ti >= 0}<rect class="ahead" x={X(ti) + 5} y="0" width={Math.max(0, W - X(ti) - 5)} height="100" />{/if}
          {#if view === 'land'}
            {#if hillFit}<path class="hill fit" d={hillFit} />{/if}
            {#if hillFat}<path class="hill fat" d={hillFat} />{/if}
            {#each pts as p, i (p.day)}
              {#if p.load > 0}<rect class="ridge" class:fut={p.future} x={i * 10 + 3.5} width="3" y={Y(p.load)} height={Math.max(0.6, 96 - Y(p.load))} />{/if}
            {/each}
          {:else}
            {#each pts as p, i (p.day)}
              {#if p.load > 0}<rect class="ridge" class:fut={p.future} x={i * 10 + 3.5} width="3" y={Y(p.load)} height={Math.max(0.6, 96 - Y(p.load))} />{/if}
            {/each}
            {#if lineFit}<path class="ln fit" d={lineFit} />{/if}
            {#if lineFitAhead && hasPlan}<path class="ln fit dash" d={lineFitAhead} />{/if}
            {#if lineFat}<path class="ln fat" d={lineFat} />{/if}
            {#if lineFatAhead && hasPlan}<path class="ln fat dash" d={lineFatAhead} />{/if}
          {/if}
          {#if ti >= 0 && hasPlan}<line class="today" x1={X(ti)} x2={X(ti)} y1="0" y2="100" />{/if}
          {#if sel != null}<line class="cur" x1={X(sel)} x2={X(sel)} y1="0" y2="100" />{/if}
        </svg>
        {#if sel != null && view === 'curve'}
          <i class="dot" style:left="{((sel + 0.5) / n) * 100}%" style:bottom="{fracOf(pts[sel].fit, sc) * 92 + 4}%" style:background="var(--hi)"></i>
          <i class="dot" style:left="{((sel + 0.5) / n) * 100}%" style:bottom="{fracOf(pts[sel].fat, sc) * 92 + 4}%" style:background="var(--warn)"></i>
        {/if}
        {#if hasPlan && ti >= 0}<span class="ahl" data-ahead-label>{t('planned, estimated|ls')}</span>{/if}
      </div>
      <div class="xs num" aria-hidden="true" data-xdates>
        {#each marks as i (i)}<span style:left="{((i + 0.5) / n) * 100}%" class:first={i === 0} class:last={i === n - 1}>{pts[i].day === today ? t('today') : dm(pts[i].day)}</span>{/each}
      </div>
    </div>
    <p class="hint">{view === 'land' ? t('Height = load points. Back hill: fitness, front hill: fatigue, ridges: the days. Point at a day or use ← →.|ls') : t('The same days as exact curves. Point at a day or use ← →.|ls')}</p>

    <div class="day" data-ls-day={cur?.day}>
      <h4>{cur ? (cur.day === today ? `${t('today')} · ${longDay(cur.day)}` : longDay(cur.day)) : ''}</h4>
      {#if dayActs.length || dayPlan.length}
        <ul>
          {#each dayActs as a, i (a.id ?? i)}
            {@const l = loadOf(a, f.opts)}
            <li data-ls-act>
              {#if a.id}<a href="#/flow/training/a/{encodeURIComponent(a.id)}">{a.name || t('Activity')}</a>{:else}<span>{a.name || t('Activity')}</span>{/if}
              <small class="num">{actMeta(a, l)}</small>
            </li>
          {/each}
          {#each dayPlan as s (s.id)}
            <li class="pl" data-ls-planned>
              <a href="#/flow/training">{s.name || t(KIND_NAMES[s.kind] ?? 'Other|kind')}</a>
              <small class="num"><b class="tag">{t('planned|ls')}</b> {planMeta(s)}</small>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="none">{cur?.future ? t('Nothing planned on this day.|ls') : t('No activity on this day.')}</p>
      {/if}
    </div>
    {#if !hasPlan}
      <p class="hint" data-ls-noplan>{t('Plan sessions in Training and they continue the landscape to the right, as an estimate.|ls')} <a href="#/flow/training">{t('Open the plan|ls')}</a></p>
    {:else}
      <p class="hint">{t('A planned session counts like a ride in the middle of its zone (minutes and zone only). Today counts only what you did.|ls')}</p>
    {/if}
  </div>
{:else}
  <p class="wait" data-ls-empty>{t('The landscape comes with your first activities from Strava. Planned sessions of Training continue it.|ls')}</p>
{/if}

<style>
  .ls {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .top {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .lg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .lg li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .k {
    width: 14px;
    height: 8px;
    border-radius: 2px;
  }
  .k.hi {
    background: var(--hi);
    opacity: 0.45;
  }
  .k.warn {
    background: var(--warn);
    opacity: 0.6;
  }
  .k.ink {
    width: 4px;
    background: var(--ink-3);
  }
  .k.dash {
    border: 1px dashed var(--ink-3);
  }
  .g {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    row-gap: 16px;
    border-radius: 6px;
    outline-offset: 2px;
  }
  .g.curve {
    grid-template-columns: 40px minmax(0, 1fr);
  }
  .g:focus-visible {
    outline: var(--focus-ring);
  }
  .g > :global([data-yticks]) {
    grid-column: 1;
  }
  .p {
    position: relative;
    height: 170px;
    touch-action: pan-y;
    cursor: pointer;
  }
  .g.curve .p {
    grid-column: 2;
  }
  svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .hill {
    stroke: none;
  }
  .hill.fit {
    fill: var(--hi);
    opacity: 0.22;
  }
  .hill.fat {
    fill: var(--warn);
    opacity: 0.32;
  }
  .ridge {
    fill: var(--ink-3);
    opacity: 0.4;
  }
  .ridge.fut {
    fill: none;
    stroke: var(--ink-3);
    stroke-width: 1;
    stroke-dasharray: 3 2;
    vector-effect: non-scaling-stroke;
    opacity: 0.9;
  }
  .ln {
    fill: none;
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
    stroke-linejoin: round;
  }
  .ln.fit {
    stroke: var(--hi);
  }
  .ln.fat {
    stroke: var(--warn);
  }
  .ln.dash {
    stroke-dasharray: 5 4;
  }
  .ahead {
    fill: var(--paper-2);
    opacity: 0.7;
  }
  .today {
    stroke: var(--ink-3);
    stroke-width: 1;
    stroke-dasharray: 2 3;
    vector-effect: non-scaling-stroke;
  }
  .cur {
    stroke: var(--ink-2);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }
  .dot {
    position: absolute;
    width: 10px;
    height: 10px;
    border: 2px solid var(--paper);
    border-radius: 50%;
    transform: translate(-50%, 50%);
    pointer-events: none;
  }
  .ahl {
    position: absolute;
    top: 2px;
    right: 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    white-space: nowrap;
    pointer-events: none;
  }
  .xs {
    margin-top: -8px;
    position: relative;
    grid-column: 1 / -1;
    height: 1.6em;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .g.curve .xs {
    grid-column: 2;
  }
  .xs span {
    position: absolute;
    transform: translateX(-50%);
    white-space: nowrap;
  }
  .xs span.first {
    transform: none;
    left: 0 !important;
  }
  .xs span.last {
    transform: none;
    left: auto !important;
    right: 0;
  }
  .hint,
  .wait {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .day h4 {
    margin: 0 0 4px;
    font-size: var(--fs-body);
  }
  .day ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .day li {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 2px 12px;
    min-height: 44px;
    border-bottom: 1px solid var(--line);
  }
  .day a {
    color: inherit;
  }
  .day small {
    color: var(--ink-3);
  }
  .tag {
    padding: 1px 8px;
    border: 1px dashed var(--ink-3);
    border-radius: 999px;
    font-size: var(--fs-tiny);
    font-weight: 600;
  }
  .none {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
