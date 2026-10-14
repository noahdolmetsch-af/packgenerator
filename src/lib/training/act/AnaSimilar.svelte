<script>
  /**
   * TR7b «Ähnliche Fahrten» (Noah 14.10.2026 «TR5–TR7 freigegeben»): the other rides on the same bike
   * with km and Hm within ±20 %, as dots: average power (or km/h without a power meter) against average
   * heart rate; this ride is the bigger green dot. Tapping a dot opens that ride. At least 3 rides.
   */
  import AnaCard from '../AnaCard.svelte';
  import { similarRides, niceTicks } from './analysen.js';
  import { strava } from '../../strava/client.svelte.js';
  import { t, num, locale } from '../../i18n.svelte.js';

  let { act = null, all = [], today = '' } = $props();
  let cw = $state(0);
  const H = 230;
  const P = { l: 36, r: 14, t: 22, b: 40 };
  const sim = $derived(similarRides(all, act));
  const bike = $derived(act ? (strava.prefs.gear.find((g) => g.id === act.gearId)?.name ?? '') : '');
  const dayShort = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'numeric' });
  const xs = (v) => (sim?.power ? `${num(v)} W` : `${num(v)}`);

  const ch = $derived.by(() => {
    if (!sim || !(cw > 0)) return null;
    const all2 = [...sim.pts, sim.me];
    const pad = (lo, hi, k) => (hi - lo < k ? [lo - (k - (hi - lo)) / 2, hi + (k - (hi - lo)) / 2] : [lo, hi]);
    // a little room around the outermost dots, so none sits on an axis label
    const air = ([lo, hi]) => [lo - (hi - lo) * 0.06, hi + (hi - lo) * 0.06];
    const [x0, x1] = air(pad(Math.min(...all2.map((p) => p.x)), Math.max(...all2.map((p) => p.x)), sim.power ? 10 : 2));
    const [y0, y1] = air(pad(Math.min(...all2.map((p) => p.y)), Math.max(...all2.map((p) => p.y)), 6));
    const sx = (v) => P.l + ((v - x0) / (x1 - x0)) * (cw - P.l - P.r);
    const sy = (v) => P.t + (1 - (v - y0) / (y1 - y0)) * (H - P.t - P.b);
    const n = cw < 500 ? 3 : 4;
    return { sx, sy, xt: niceTicks(x0, x1, n), yt: niceTicks(y0, y1, 3) };
  });
  const meName = $derived(act?.day === today ? t('today|an') : act ? dayShort(act.day) : '');
  const label = $derived(
    sim ? t('{n} similar rides as dots; this ride: {x}, heart rate {y}.', { n: sim.pts.length, x: xs(sim.me.x), y: num(sim.me.y) }) : '',
  );
  const caption = $derived.by(() => {
    if (!sim) return '';
    const what = [bike, `${num(sim.km[0])}–${num(sim.km[1])} km`, sim.hm ? `${num(sim.hm[0])}–${num(sim.hm[1])} ${t('Hm|an')}` : ''].filter(Boolean).join(', ');
    return [
      `${t('{n} similar rides', { n: sim.pts.length })}: ${what}.`,
      t(sim.power ? 'Bottom right = more power at lower heart rate.' : 'Bottom right = faster at lower heart rate.'),
      t('Tap a dot to open the ride.'),
    ].join(' ');
  });
</script>

{#if sim}
  <AnaCard key="similar" sub={t('same group, km and Hm within ±20 %')}>
    <div class="sc" bind:clientWidth={cw}>
      {#if ch}
        <svg width={cw} height={H} viewBox="0 0 {cw} {H}" role="group" aria-label={label}>
          <text class="at" x="2" y="10">{t('Ø heart rate ↑|an')}</text>
          {#each ch.yt as v (v)}
            <line class="gl" x1={P.l} x2={cw - P.r} y1={ch.sy(v)} y2={ch.sy(v)} />
            <text class="tk" x={P.l - 6} y={ch.sy(v) + 4} text-anchor="end">{num(v)}</text>
          {/each}
          {#each ch.xt as v (v)}
            <line class="gl" x1={ch.sx(v)} x2={ch.sx(v)} y1={P.t} y2={H - P.b} />
            <text class="tk" x={ch.sx(v)} y={H - P.b + 16} text-anchor="middle">{xs(v)}</text>
          {/each}
          <text class="at" x={cw - 2} y={H - 4} text-anchor="end">{t(sim.power ? 'Ø power →|an' : 'Ø km/h →|an')}</text>
          {#each sim.pts as p (p.id)}
            <a href="#/flow/training/a/{encodeURIComponent(p.id)}" aria-label={t('Ride on {day}: {x}, heart rate {y}', { day: dayShort(p.day), x: xs(p.x), y: num(p.y) })} data-similar={p.id}>
              <circle class="dot" cx={ch.sx(p.x)} cy={ch.sy(p.y)} r="5.5" />
              <circle class="hitc" cx={ch.sx(p.x)} cy={ch.sy(p.y)} r="12" />
            </a>
          {/each}
          <circle class="me" cx={ch.sx(sim.me.x)} cy={ch.sy(sim.me.y)} r="7.5" />
          <text class="ml" x={ch.sx(sim.me.x) + (ch.sx(sim.me.x) > cw - 70 ? -11 : 11)} y={ch.sy(sim.me.y) + 4} text-anchor={ch.sx(sim.me.x) > cw - 70 ? 'end' : 'start'}>{meName}</text>
        </svg>
      {/if}
    </div>
    <p class="cap">{caption}</p>
  </AnaCard>
{/if}

<style>
  .sc {
    min-height: 230px;
  }
  svg {
    display: block;
  }
  .gl {
    stroke: var(--line);
    stroke-width: 1;
    opacity: 0.6;
  }
  .tk,
  .at {
    fill: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .dot {
    fill: var(--pz2);
  }
  .hitc {
    fill: transparent;
  }
  a:hover .dot,
  a:focus-visible .dot {
    fill: var(--ink-2);
  }
  a:focus-visible {
    outline: var(--focus-ring);
  }
  .me {
    fill: var(--accent);
    stroke: var(--paper);
    stroke-width: 2;
  }
  .ml {
    fill: var(--ink);
    font-size: var(--fs-tiny);
    font-weight: 600;
  }
</style>
