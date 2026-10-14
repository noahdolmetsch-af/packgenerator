<script>
  /**
   * TR5 «Belastung» and «Leistungskurve» (Noah 14.10.2026 «TR5–TR7 freigegeben»): the load two ways
   * (Strava's Relative Effort from the heart rate, the load from the power) and this ride's best Ø power
   * per duration against the best of the 90 days up to it (grey). Observation only.
   */
  import Sec from '../../flow/kit/Sec.svelte';
  import { ftpEstimate, powerLoad, hmm } from '../../training.js';
  import { fixed, hasMeter, bestCurve, CURVE_SPANS } from './power.js';
  import { t, locale } from '../../i18n.svelte.js';

  let { act = null, all = [], today = '' } = $props();

  const ftp = $derived(hasMeter(act) ? ftpEstimate(all, today) : null);
  const load = $derived(act && ftp ? powerLoad(act, ftp) : null);
  const effort = $derived(act?.effort != null ? act.effort : null);
  const spanLabel = (n, unit) => (unit === 's' ? t('{n} s', { n }) : t('{n} min', { n }));

  // the curve: x on a log scale of the seconds, y in watts; the width follows the card
  let w = $state(0);
  const H = 150;
  const PAD = { l: 34, r: 14, t: 18, b: 22 };
  const mine = $derived(Array.isArray(act?.pCurve) ? new Map(act.pCurve.filter((p) => p?.[1] > 0)) : null);
  const best = $derived(act && mine?.size ? bestCurve(all, act.day) : null);
  const chart = $derived.by(() => {
    if (!mine?.size || !(w > 80)) return null;
    const vals = [...mine.values(), ...(best ?? []).map((b) => b[1]).filter((v) => v > 0)];
    const lo = Math.max(0, Math.floor((Math.min(...vals) - 20) / 100) * 100);
    const hi = Math.ceil((Math.max(...vals) + 20) / 100) * 100;
    const lmin = Math.log(CURVE_SPANS[0][0]);
    const lmax = Math.log(CURVE_SPANS.at(-1)[0]);
    const x = (s) => Math.round((PAD.l + ((Math.log(s) - lmin) / (lmax - lmin)) * (w - PAD.l - PAD.r)) * 10) / 10;
    const y = (v) => Math.round((PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b)) * 10) / 10;
    const line = (pts) => pts.map(([s, v], i) => `${i ? 'L' : 'M'}${x(s)},${y(v)}`).join(' ');
    const own = CURVE_SPANS.filter(([s]) => mine.get(s) > 0).map(([s, n, unit]) => ({ s, v: mine.get(s), x: x(s), y: y(mine.get(s)), label: spanLabel(n, unit) }));
    const grey = (best ?? []).filter((b) => b[1] > 0);
    const grid = [];
    for (let v = lo; v <= hi; v += 100) grid.push({ v, y: y(v) });
    return { own, d: line(own.map((p) => [p.s, p.v])), dBest: grey.length > 1 ? line(grey) : '', grid, ticks: CURVE_SPANS.map(([s, n, unit]) => ({ x: x(s), label: spanLabel(n, unit) })) };
  });
  const aria = $derived(
    mine?.size
      ? t('Power curve: {list}', { list: CURVE_SPANS.filter(([s]) => mine.get(s) > 0).map(([s, n, unit]) => `${spanLabel(n, unit)} ${mine.get(s)} W`).join(', ') })
      : '',
  );
</script>

{#if effort != null || load}
  <Sec id="load-h" title={t('Load|card')} sub={t('two views, just to look at')}>
    <div class="card ld vals num" data-section="load">
      {#if effort != null}<span data-load="effort"><b>{effort}</b><small>{t('Relative Effort (Strava, from the heart rate)')}</small></span>{/if}
      {#if load}<span data-load="power"><b>{load.load}</b><small>{t('Load from power (NP ÷ FTP {f} · {h} h)', { f: fixed(load.intensity, 2, locale()), h: hmm(act.movingS) })}</small></span>{/if}
    </div>
  </Sec>
{/if}

{#if mine?.size}
  <Sec id="pcurve-h" title={t('Power curve|act')} sub={t('best Ø power per duration · grey = best of the last 90 days')}>
    <div class="card pc" data-section="power-curve">
      <div class="cw" bind:clientWidth={w}>
      {#if chart}
        <svg width="100%" height={H} viewBox="0 0 {w} {H}" role="img" aria-label={aria}>
          {#each chart.grid as g (g.v)}
            <line x1={PAD.l} x2={w - PAD.r} y1={g.y} y2={g.y} class="gl" />
            <text x={PAD.l - 6} y={g.y + 3} class="yl" text-anchor="end">{g.v}</text>
          {/each}
          {#each chart.ticks as k (k.label)}<text x={k.x} y={H - 4} class="xl" text-anchor="middle">{k.label}</text>{/each}
          {#if chart.dBest}<path d={chart.dBest} class="best" data-best />{/if}
          <path d={chart.d} class="own" />
          {#each chart.own as p, i (p.s)}
            {@const edge = i === 0 ? 'start' : i === chart.own.length - 1 ? 'end' : 'middle'}
            <circle cx={p.x} cy={p.y} r="3.5" class="dot" />
            <text x={p.x + (edge === 'start' ? 4 : edge === 'end' ? 2 : 0)} y={p.y - 8} class="vl" text-anchor={edge}>{p.v}</text>
          {/each}
        </svg>
      {/if}
      </div>
    </div>
  </Sec>
{/if}

<style>
  .ld {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
    padding: 16px;
  }
  .ld span {
    display: flex;
    flex-direction: column;
    padding: 10px 12px;
    border-radius: var(--radius);
    background: var(--paper-2);
  }
  .ld b {
    font: 700 var(--fs-sub) / 1.25 var(--font-body);
  }
  .ld small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .pc {
    padding: 14px 16px;
  }
  .cw {
    min-height: 150px;
  }
  svg {
    display: block;
    overflow: visible;
  }
  .gl {
    stroke: var(--line);
    stroke-dasharray: 3 4;
  }
  .yl,
  .xl {
    fill: var(--ink-3);
    font-size: var(--fs-tiny);
    font-family: var(--font-body);
  }
  .vl {
    fill: var(--ink);
    font-size: var(--fs-tiny);
    font-weight: 700;
    font-family: var(--font-body);
  }
  .best {
    fill: none;
    stroke: var(--ink-3);
    stroke-opacity: 0.55;
    stroke-width: 2;
  }
  .own {
    fill: none;
    stroke: var(--hi);
    stroke-width: 2;
  }
  .dot {
    fill: var(--hi);
  }
</style>
