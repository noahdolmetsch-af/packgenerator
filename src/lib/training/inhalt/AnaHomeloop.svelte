<script>
  /**
   * «Mehr Inhalt» T5 «Deine Hausrunde über die Zeit» (Noah 15.10.2026 «1-5 a»): from 3 rides on the
   * same route (same name, km within 10 %, training.js sameRoute) a small line of the average speed
   * over the rides and a table: date, moving time, km/h, Ø W (with power), Ø heart rate and one
   * efficiency number (watts per heartbeat with power, else heart rate per km/h). This ride is marked;
   * one calm sentence compares it with the mean of the others. Fewer than 3 rides: nothing.
   */
  import AnaCard from '../AnaCard.svelte';
  import { homeLoop } from './inhalt-fahrt.js';
  import { mss } from '../act/analysen.js';
  import { t, tn, num, locale } from '../../i18n.svelte.js';

  let { act = null, all = [], today = '' } = $props();
  const loop = $derived(homeLoop(all, act));
  const dayShort = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'numeric' });
  const v = (x) => (Number.isFinite(x) ? num(x) : '–');
  const v1 = (x) => (Number.isFinite(x) ? x.toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '–');
  const v2 = (x) => (Number.isFinite(x) ? x.toLocaleString(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '–');

  // the small line: km/h over the rides shown, evenly spaced, this ride as the bigger dot
  let cw = $state(0);
  const H = 70;
  const ch = $derived.by(() => {
    if (!loop || !(cw > 0)) return null;
    const pts = loop.rows.map((r, i) => ({ i, kmh: r.kmh, me: r.me })).filter((p) => Number.isFinite(p.kmh));
    if (pts.length < 2) return null;
    const lo = Math.min(...pts.map((p) => p.kmh));
    const hi = Math.max(...pts.map((p) => p.kmh));
    const pad = Math.max(0.5, (hi - lo) * 0.15);
    const x = (i) => 12 + (i / Math.max(1, loop.rows.length - 1)) * (cw - 24);
    const y = (k) => 10 + (1 - (k - (lo - pad)) / (hi - lo + 2 * pad)) * (H - 20);
    return { pts: pts.map((p) => ({ ...p, x: x(p.i), y: y(p.kmh) })), d: pts.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)} ${y(p.kmh).toFixed(1)}`).join('') };
  });

  const sentence = $derived.by(() => {
    if (!loop || loop.dS == null) return '';
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
    <div class="hlline" bind:clientWidth={cw}>
      {#if ch}
        <svg width={cw} height={H} viewBox="0 0 {cw} {H}" role="img" aria-label={label}>
          <path class="ln" d={ch.d} />
          {#each ch.pts as p (p.i)}
            <circle class={p.me ? 'cme' : 'cdot'} cx={p.x} cy={p.y} r={p.me ? 6 : 4} />
          {/each}
        </svg>
      {/if}
    </div>
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

<style>
  .hlsen {
    margin: 0;
  }
  .hlline {
    min-height: 70px;
  }
  svg {
    display: block;
  }
  .ln {
    fill: none;
    stroke: var(--line);
    stroke-width: 1.6;
    stroke-linejoin: round;
  }
  .cdot {
    fill: var(--pz2);
  }
  .cme {
    fill: var(--accent);
    stroke: var(--paper);
    stroke-width: 2;
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
