<script>
  /**
   * TR7b «Ähnliche Fahrten» (Noah 14.10.2026 «TR5–TR7 freigegeben»): the other rides on the same bike
   * with km and Hm within ±20 %, as dots: average power (or km/h without a power meter) against average
   * heart rate; this ride is the bigger green dot. Tapping a dot opens that ride. At least 3 rides.
   * «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): both axes with round steps, the numbers of a dot when
   * pointing or focusing it, «Als Tabelle» lists the rides.
   */
  import AnaCard from '../AnaCard.svelte';
  import { similarRides } from './analysen.js';
  import { niceScale, fracOf } from '../../charts/axis.js';
  import YTicks from '../../charts/YTicks.svelte';
  import GridLines from '../../charts/GridLines.svelte';
  import Readout from '../../charts/Readout.svelte';
  import DataTable from '../../charts/DataTable.svelte';
  import Seg from '../../ui/Seg.svelte';
  import { strava } from '../../strava/client.svelte.js';
  import { t, num, locale } from '../../i18n.svelte.js';

  let { act = null, all = [], today = '' } = $props();
  const sim = $derived(similarRides(all, act));
  const bike = $derived(act ? (strava.prefs.gear.find((g) => g.id === act.gearId)?.name ?? '') : '');
  const dayShort = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'numeric' });
  const xs = (v) => (sim?.power ? `${num(v)} W` : `${num(v)}`);
  const rideHref = (id) => `#/flow/training/a/${encodeURIComponent(id)}`;

  // a scale per axis with round steps; the outermost dots keep a little room from the edge
  const room = (sc) => {
    const d = (sc.hi - sc.lo) * 0.05;
    return { ...sc, lo: sc.lo - d, hi: sc.hi + d };
  };
  const sc = $derived.by(() => {
    if (!sim) return null;
    const all2 = [...sim.pts, sim.me];
    return { x: room(niceScale(all2.map((p) => p.x), { count: 4 })), y: room(niceScale(all2.map((p) => p.y), { count: 4 })), raw: { x: niceScale(all2.map((p) => p.x), { count: 4 }), y: niceScale(all2.map((p) => p.y), { count: 4 }) } };
  });
  const fx = (v) => fracOf(v, sc.x);
  const fy = (v) => fracOf(v, sc.y);
  const yy = (v) => 100 - fy(v) * 100;
  const xTicks = $derived(sc ? sc.raw.x.ticks.filter((v) => v >= sc.x.lo && v <= sc.x.hi) : []);
  const yTicks = $derived(sc ? sc.raw.y.ticks.filter((v) => v >= sc.y.lo && v <= sc.y.hi) : []);
  let sel = $state(null);
  let view = $state('chart');
  const dots = $derived(sim ? [...sim.pts, sim.me] : []);
  const shown = $derived(sel ?? sim?.me ?? null);
  const readout = $derived(
    shown ? { title: shown.id === sim.me.id ? `${dayShort(shown.day)} · ${t('this ride|hl')}` : dayShort(shown.day), items: [{ label: t(sim.power ? 'Ø power|an' : 'Ø km/h|an'), value: xs(shown.x), color: 'var(--pz2)' }, { label: t('Ø heart rate|an'), value: num(shown.y) }] } : null,
  );
  const table = $derived(
    sim
      ? { head: [t('Day'), t(sim.power ? 'Ø power|an' : 'Ø km/h|an'), t('Ø heart rate|an')], rows: [sim.me, ...[...sim.pts].sort((a, b) => b.day.localeCompare(a.day))].map((p) => ({ key: String(p.id), cells: [p.id === sim.me.id ? `${dayShort(p.day)} · ${t('this ride|hl')}` : dayShort(p.day), xs(p.x), num(p.y)] })) }
      : null,
  );
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
    <div class="vw"><Seg small full={false} label={t('Show as')} value={view} onchange={(v) => (view = v)} options={[{ key: 'chart', name: t('Chart|table') }, { key: 'table', name: t('As table') }]} /></div>
    {#if view === 'table' && table}
      <DataTable head={table.head} rows={table.rows} />
    {:else if sc}
      <Readout title={readout.title} items={readout.items} />
      <div class="g" data-chart="similar">
        <YTicks ticks={yTicks} y={yy} h={100} text={(v) => num(v)} unit={t('bpm')} />
        <div class="plot" role="group" aria-label={label} data-plot data-n={dots.length}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <GridLines ticks={yTicks} y={yy} x1={0} x2={100} />
            {#each xTicks as v (v)}<line class="vg" x1={fx(v) * 100} x2={fx(v) * 100} y1="0" y2="100" vector-effect="non-scaling-stroke" />{/each}
          </svg>
          {#each sim.pts as p (p.id)}
            <a class="dot" href={rideHref(p.id)} style:left="{fx(p.x) * 100}%" style:bottom="{fy(p.y) * 100}%" aria-label={t('Ride on {day}: {x}, heart rate {y}', { day: dayShort(p.day), x: xs(p.x), y: num(p.y) })} onpointerenter={() => (sel = p)} onpointerleave={() => (sel = null)} onfocus={() => (sel = p)} onblur={() => (sel = null)} data-similar={p.id}></a>
          {/each}
          <i class="me" style:left="{fx(sim.me.x) * 100}%" style:bottom="{fy(sim.me.y) * 100}%" aria-hidden="true"></i>
          <b class="ml" class:end={fx(sim.me.x) > 0.8} style:left="{fx(sim.me.x) * 100}%" style:bottom="{fy(sim.me.y) * 100}%">{meName}</b>
        </div>
        <div class="xs num" aria-hidden="true">
          {#each xTicks as v (v)}<span style:left="{fx(v) * 100}%">{xs(v)}</span>{/each}
        </div>
      </div>
      <p class="axl num" aria-hidden="true">{t('Ø heart rate ↑|an')} · {t(sim.power ? 'Ø power →|an' : 'Ø km/h →|an')}</p>
    {/if}
    <p class="cap">{caption}</p>
  </AnaCard>
{/if}

<style>
  .vw {
    display: flex;
    justify-content: flex-end;
  }
  .g {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: 230px auto;
    margin-top: 8px;
  }
  .g > :global([data-yticks]) {
    grid-row: 1;
    grid-column: 1;
  }
  .plot {
    position: relative;
    grid-row: 1;
    grid-column: 2;
  }
  svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .vg {
    stroke: var(--line);
    stroke-dasharray: 2 3;
    opacity: 0.7;
  }
  .dot {
    position: absolute;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: var(--pz2);
    transform: translate(-50%, 50%);
  }
  .dot::after {
    content: '';
    position: absolute;
    inset: -10px;
  }
  .dot:hover,
  .dot:focus-visible {
    background: var(--ink-2);
  }
  .dot:focus-visible {
    outline: var(--focus-ring);
  }
  .me {
    position: absolute;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: var(--accent);
    border: 2px solid var(--paper);
    transform: translate(-50%, 50%);
    pointer-events: none;
  }
  .ml {
    position: absolute;
    transform: translate(12px, 50%);
    font-size: var(--fs-tiny);
    white-space: nowrap;
    pointer-events: none;
  }
  .ml.end {
    transform: translate(calc(-100% - 12px), 50%);
  }
  .xs {
    position: relative;
    grid-row: 2;
    grid-column: 2;
    height: 1.6em;
    margin-top: 6px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .xs span {
    position: absolute;
    transform: translateX(-50%);
    white-space: nowrap;
  }
  .axl {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
</style>
