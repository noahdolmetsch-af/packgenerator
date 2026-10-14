<script>
  /**
   * TR7a «Verlauf» (Noah 14.10.2026 «TR5–TR7 freigegeben»): elevation (grey area), heart rate and power
   * over the minutes of the ride, breaks as light bands. Pointing at or tapping the chart shows the
   * nearest minute; a section tapped in «Abschnitte» is shaded here (focus.svelte.js). The SVG is drawn
   * in real pixels of its box, so its text is never stretched.
   */
  import AnaCard from '../AnaCard.svelte';
  import { courseChart, nearest, focusRange, sectionRows } from './analysen.js';
  import { focus } from './focus.svelte.js';
  import { t, tn, num } from '../../i18n.svelte.js';

  let { act = null } = $props();
  let cw = $state(0);
  let at = $state(null); // the minute pointed at
  const H = 200;
  const pts = $derived(Array.isArray(act?.prof?.pts) ? act.prof.pts : []);
  const power = $derived(!!act?.wDevice && pts.some((p) => p[3] > 0));
  const ch = $derived(cw > 0 ? courseChart(act?.prof, cw, H) : null);
  const has = $derived(pts.length >= 2);
  const fr = $derived(focus.id === act?.id && focus.i != null ? focusRange(act?.secs5, focus.i, act?.prof?.breaks) : null);
  const frRow = $derived(fr ? sectionRows(act?.secs5)[focus.i] : null);
  const hit = $derived(at == null ? null : nearest(pts, at));

  const range = (r) => (r ? `${num(r[0])}–${num(r[1])}` : '');
  const label = $derived.by(() => {
    if (!ch) return '';
    const parts = [t('Course over {n} minutes', { n: num(Math.round(ch.m1 - ch.m0)) })];
    if (ch.alt) parts.push(t('elevation {r} m', { r: range(ch.alt) }));
    if (ch.hrRange) parts.push(t('heart rate {r}', { r: range(ch.hrRange) }));
    if (power && ch.wRange) parts.push(t('power {r} W', { r: range(ch.wRange) }));
    if (ch.breaks.length) parts.push(tn(ch.breaks.length, '{n} break|an', '{n} breaks|an'));
    return parts.join(', ');
  });
  const tip = $derived.by(() => {
    if (!hit) return null;
    const head = [t('{n} min|an', { n: num(Math.round(hit[0])) })];
    if (Number.isFinite(hit[1])) head.push(t('Elevation {n} m|an', { n: num(Math.round(hit[1])) }));
    const vals = [];
    if (Number.isFinite(hit[2])) vals.push(t('Heart rate {n}|an', { n: num(Math.round(hit[2])) }));
    if (power && Number.isFinite(hit[3])) vals.push(t('Watts {n}|an', { n: num(Math.round(hit[3])) }));
    return { head: head.join(' · '), vals: vals.join(' · '), x: ch ? ch.x(hit[0]) : 0 };
  });

  function point(e) {
    if (!ch) return;
    const box = e.currentTarget.getBoundingClientRect();
    const m = ch.m0 + ((e.clientX - box.left - 8) / Math.max(1, box.width - 16)) * (ch.m1 - ch.m0);
    at = Math.min(ch.m1, Math.max(ch.m0, m));
  }
  const leave = (e) => {
    if (e.pointerType === 'mouse') at = null;
  };
</script>

{#if has}
  <AnaCard key="timeline" sub={t('Elevation, heart rate and power over time')}>
    <div class="tl" bind:clientWidth={cw}>
      {#if ch}
        <!-- pointing only adds the tooltip; every value is also in the label and in «Abschnitte» -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <svg width={cw} height={H} viewBox="0 0 {cw} {H}" role="img" aria-label={label} onpointerdown={point} onpointermove={point} onpointerleave={leave}>
          {#each ch.breaks as b, i (i)}
            <rect class="brk" x={b.x0} y={ch.top} width={Math.max(2, b.x1 - b.x0)} height={ch.base - ch.top} />
            <text class="bt" x={(b.x0 + b.x1) / 2} y={ch.top - 3} text-anchor="middle">{t('Break|an')}</text>
          {/each}
          {#if fr}
            <rect class="foc" x={ch.x(fr[0])} y={ch.top} width={Math.max(2, ch.x(fr[1]) - ch.x(fr[0]))} height={ch.base - ch.top} data-focus />
          {/if}
          <path class="alt" d={ch.area} />
          {#if ch.hr}<path class="hr" d={ch.hr} />{/if}
          {#if power && ch.w}<path class="w" d={ch.w} />{/if}
          <line class="ax" x1="8" x2={cw - 8} y1={ch.base} y2={ch.base} />
          {#each ch.ticks as k, i (i)}
            <text class="tk" x={k.x} y={H - 6} text-anchor={i === 0 ? 'start' : i === ch.ticks.length - 1 ? 'end' : 'middle'}>{t('{n} min|an', { n: num(k.m) })}</text>
          {/each}
          {#if tip}<line class="cur" x1={tip.x} x2={tip.x} y1={ch.top} y2={ch.base} />{/if}
        </svg>
        {#if tip}
          <div class="tip" style:left="{Math.min(Math.max(tip.x, 90), cw - 90)}px" aria-live="polite" data-tip>
            <span>{tip.head}</span>
            {#if tip.vals}<b>{tip.vals}</b>{/if}
          </div>
        {/if}
      {/if}
    </div>
    <ul class="lg">
      <li><i class="lsw alt"></i>{t('Elevation profile|an')}</li>
      <li><i class="lsw hr"></i>{t('Heart rate|an')}</li>
      {#if power}<li><i class="lsw w"></i>{t('Power|an')}</li>{/if}
      {#if ch?.breaks.length}<li><i class="lsw brk"></i>{t('Break|an')}</li>{/if}
    </ul>
    {#if frRow}<p class="cap">{t('Shaded: km {from}–{to}. Tap the section again to clear it.', { from: num(frRow.from), to: num(frRow.to) })}</p>{/if}
  </AnaCard>
{/if}

<style>
  .tl {
    position: relative;
    min-height: 200px;
  }
  svg {
    display: block;
    touch-action: pan-y;
    cursor: crosshair;
  }
  .alt {
    fill: var(--ch-alt);
  }
  .hr,
  .w {
    fill: none;
    stroke-width: 1.6;
    stroke-linejoin: round;
  }
  .hr {
    stroke: var(--ch-hr);
  }
  .w {
    stroke: var(--ch-w);
  }
  .brk {
    fill: color-mix(in srgb, var(--ink-3) 14%, transparent);
  }
  .foc {
    fill: color-mix(in srgb, var(--pz4) 32%, transparent);
  }
  .ax {
    stroke: var(--line);
  }
  .cur {
    stroke: var(--ink-2);
    stroke-dasharray: 2 3;
  }
  .tk,
  .bt {
    fill: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .tip {
    position: absolute;
    top: 0;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 6px 10px;
    border-radius: 6px;
    background: var(--brand);
    color: var(--brand-ink);
    font-size: var(--fs-tiny);
    line-height: 1.35;
    white-space: nowrap;
    pointer-events: none;
  }
  .tip b {
    color: var(--brand-ink-2);
  }
  .lg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .lg li {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .lsw {
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }
  .lsw.alt {
    background: var(--ch-alt);
  }
  .lsw.hr {
    background: var(--ch-hr);
  }
  .lsw.w {
    background: var(--ch-w);
  }
  .lsw.brk {
    background: color-mix(in srgb, var(--ink-3) 14%, transparent);
    border: 1px solid var(--line);
  }
</style>
