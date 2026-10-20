<script>
  /**
   * Strava-Analyse 1:1 (Noah 20.10.2026 «nimm das als vorlage und baue es 1:1 nach», ten screenshots of
   * Strava's activity page with the Sauce extension). The part «Analyse» of the tour page:
   *   - the head: Distanz, Bewegungszeit, Höhenmeter, Relative Leistung; Gewichtete Leistung, Gesamtarbeit,
   *     Trainingsbelastung, Intensität; NP, IF, TSS, FTP, Gewicht; Schnitt and Max of speed, heart rate,
   *     cadence, power, calories, temperature, the elapsed time; device and bike;
   *   - on the left the views (Analyse, Relative Leistung, Herzfrequenz, Leistungskurve, Zonenverteilung,
   *     25 W-Leistungsverteilung, Runden) and «Peak Power» 5 s to 1 h; on a phone the views as chips, Peak
   *     Power under the view;
   *   - each view as on Strava (stravaana.js for the numbers).
   * Observation only. a: the activity; acts: all activities (weeks, the power curve of 6 weeks).
   */
  import { t, tn, locale } from '../../i18n.svelte.js';
  import { dates } from '../../review/fmt.js';
  import { intensity } from '../../training/act/power.js';
  import { powerLoad } from '../../training.js';
  import { PEAK_SPANS, peakOf, hrZoneRows, powerZoneRows, dist25, curveOf, serOf, effortOf } from '../stravaana.js';
  import AnaStacked from './AnaStacked.svelte';
  import { clock } from './fmt.js';

  let { a, acts = [], bounds = null, ftp = null, kg = null, bike = '', onkm = null } = $props();

  const num = (v, d = 0) => (Number.isFinite(v) ? Number(v).toLocaleString(locale(), { maximumFractionDigits: d, minimumFractionDigits: d }) : '–');
  const own = $derived(a.own ?? {});
  const km = $derived(own.km ?? a.km);
  const hm = $derived(own.hm ?? a.hm);
  const moving = $derived(own.movingS ?? a.movingS);
  const np = $derived(a.wNorm ?? null);
  const ifac = $derived(intensity(np, ftp));
  const load = $derived(powerLoad(a, ftp));
  const ser = $derived(serOf(a));

  const VIEWS = [
    { key: 'analysis', name: 'Analysis|ana' },
    { key: 'effort', name: 'Relative Effort|ana' },
    { key: 'hr', name: 'Heart rate|ana' },
    { key: 'curve', name: 'Power curve|ana' },
    { key: 'zones', name: 'Zone distribution' },
    { key: 'dist', name: '25 W power distribution' },
    { key: 'laps', name: 'Laps|ana' },
  ];
  const has = $derived({ analysis: !!ser, effort: a.effort > 0, hr: !!hrZoneRows(a, bounds), curve: !!curveOf(a, acts), zones: !!powerZoneRows(a, ftp), dist: !!dist25(a), laps: (a.laps ?? []).length > 1 });
  const views = $derived(VIEWS.filter((v) => has[v.key]));
  let view = $state('analysis');
  const shown = $derived(views.some((v) => v.key === view) ? view : (views[0]?.key ?? null));

  const peaks = $derived(PEAK_SPANS.map(([s, n, u]) => ({ s, label: u === 's' ? t('{n} s|peak', { n }) : u === 'min' ? t('{n} min|peak', { n }) : t('{n} h|peak', { n }), w: peakOf(a, s) })).filter((p) => p.w != null));

  const ROWS = $derived(
    [
      { name: t('Speed|ana'), avg: a.spdAvg ?? (km && moving ? km / (moving / 3600) : null), max: a.spdMax, d: 1, unit: 'km/h' },
      { name: t('Heart rate|ana'), avg: a.hrAvg, max: a.hrMax, d: 0, unit: t('bpm') },
      { name: t('Cadence|ana'), avg: a.cad, max: ser?.cad ? Math.max(...ser.cad.filter(Number.isFinite)) : null, d: 0, unit: '' },
      { name: t('Power|ana'), avg: a.wAvg, max: a.wMax, d: 0, unit: 'W' },
      { name: t('Calories'), avg: a.kcal, max: null, d: 0, unit: '' },
      { name: t('Temperature|ana'), avg: a.tempAvg, max: null, d: 0, unit: '°C' },
    ].filter((r) => Number.isFinite(r.avg) || Number.isFinite(r.max)),
  );

  /* ---------- Relative Leistung ---------- */
  const eff = $derived(effortOf(a, acts));
  const wplot = $derived.by(() => {
    if (!eff) return null;
    const top = Math.max(1, ...eff.weeks.map((x) => Math.max(x.v, x.hi)));
    const X = (i) => 10 + i * 30;
    const Y = (v) => 105 - (v / top) * 95;
    const hi = eff.weeks.map((x, i) => `${X(i)},${Y(x.hi)}`);
    const lo = eff.weeks.map((x, i) => `${X(i)},${Y(x.lo)}`).reverse();
    return { band: `M${hi.join(' L')} L${lo.join(' L')} Z`, dots: eff.weeks.map((x, i) => ({ mon: x.mon, cx: X(i), cy: Y(x.v) })) };
  });

  /* ---------- Leistungskurve (log axis) ---------- */
  const cv = $derived(curveOf(a, acts));
  const CW = 720;
  const CHh = 300;
  const CP = { l: 56, r: 10, t: 10, b: 28 };
  const cplot = $derived.by(() => {
    if (!cv) return null;
    const all = [...cv.mine, ...cv.grey];
    const s0 = 1;
    const s1 = Math.max(...all.map((p) => p[0]));
    const top = Math.ceil(Math.max(...all.map((p) => p[1])) / 100) * 100;
    const X = (s) => CP.l + ((Math.log(Math.max(s, s0)) - Math.log(s0)) / (Math.log(s1) - Math.log(s0) || 1)) * (CW - CP.l - CP.r);
    const Y = (w) => CHh - CP.b - (w / top) * (CHh - CP.t - CP.b);
    const path = (pts) => pts.map(([s, w], i) => `${i ? 'L' : 'M'}${X(s).toFixed(1)},${Y(w).toFixed(1)}`).join(' ');
    const greyArea = cv.grey.length ? `${path(cv.grey)} L${X(cv.grey.at(-1)[0])},${Y(0)} L${X(cv.grey[0][0])},${Y(0)} Z` : '';
    const TICKS = [[1, '1 s'], [5, '5 s'], [15, '15 s'], [60, '1 m'], [300, '5 m'], [1200, '20 m'], [3600, '1 h'], [7200, '2 h'], [14400, '4 h'], [21600, '6 h']].filter(([s]) => s <= s1);
    const ys = Array.from({ length: Math.round(top / 100) + 1 }, (_, i) => i * 100).filter((w, i, arr) => arr.length <= 11 || i % 2 === 0);
    return { mine: path(cv.mine), greyArea, xt: TICKS.map(([s, l]) => ({ x: X(s), l })), yt: ys.map((w) => ({ w, y: Y(w) })) };
  });

  /* ---------- 25 W ---------- */
  const d25 = $derived(dist25(a));
  const DW = 720;
  const DH = 260;
  const DP = { l: 56, r: 10, t: 22, b: 26 };
  const dplot = $derived.by(() => {
    if (!d25) return null;
    const peakS = Math.max(...d25.map((b) => b.s));
    const stepS = [60, 120, 300, 600, 900, 1800, 3600, 7200].find((x) => peakS / x <= 5) ?? 14400;
    const maxS = Math.ceil(peakS / stepS) * stepS;
    const topW = d25.at(-1).w + 25;
    const X = (w) => DP.l + (w / topW) * (DW - DP.l - DP.r);
    const Y = (s) => DH - DP.b - (s / maxS) * (DH - DP.t - DP.b);
    const stepW = topW > 400 ? 100 : 50;
    return {
      bars: d25.map((b) => ({ ...b, x: X(b.w), w2: Math.max(1, X(25) - X(0) - 1), y: Y(b.s), h: DH - DP.b - Y(b.s) })),
      xt: Array.from({ length: Math.floor(topW / stepW) + 1 }, (_, i) => ({ w: i * stepW, x: X(i * stepW) })),
      yt: Array.from({ length: maxS / stepS + 1 }, (_, i) => ({ s: i * stepS, y: Y(i * stepS) })),
      np: np ? X(np) : null,
    };
  });

  /* ---------- Runden ---------- */
  let lapKey = $state('w');
  const laps = $derived(a.laps ?? []);
  const lapPlot = $derived.by(() => {
    if (laps.length < 2) return null;
    const key = lapKey === 'w' && laps.some((l) => l.w > 0) ? 'w' : lapKey === 'hr' && laps.some((l) => l.hr > 0) ? 'hr' : 'kmh';
    const total = laps.reduce((s, l) => s + (l.s || 0), 0) || 1;
    const top = Math.max(...laps.map((l) => l[key] ?? 0)) * 1.15 || 1;
    let at = 0;
    const bars = laps.map((l) => {
      const x = (at / total) * 100;
      at += l.s || 0;
      return { n: l.n, x, w: ((l.s || 0) / total) * 100, h: ((l[key] ?? 0) / top) * 100, v: l[key] };
    });
    return { key, bars, top };
  });
  const lapTop = $derived(Math.max(1, ...laps.map((l) => l.w ?? 0)));
</script>

<div class="sa" data-strava-analysis>
  <!-- the head -->
  <div class="head sa-card">
    <dl class="big">
      <div><dd>{num(km, 2)}<small>km</small></dd><dt>{t('Distance')}</dt></div>
      <div><dd>{clock(moving)}</dd><dt>{t('Moving time')}</dt></div>
      <div><dd>{num(hm)}<small>m</small></dd><dt>{t('Elevation gain')}</dt></div>
      {#if a.effort > 0}<div class="eff"><dd>{num(a.effort)}</dd><dt>{t('Relative Effort|ana')}</dt></div>{/if}
    </dl>
    {#if np || a.kj || load}
      <dl class="mid">
        {#if np}<div><dd>{num(np)}<small>W</small></dd><dt>{t('Weighted power')}</dt></div>{/if}
        {#if a.kj}<div><dd>{num(a.kj)}<small>kJ</small></dd><dt>{t('Total work')}</dt></div>{/if}
        {#if load}<div><dd>{num(load.load)}</dd><dt>{t('Training load')}</dt></div><div><dd>{num(load.intensity * 100)}<small>%</small></dd><dt>{t('Intensity')}</dt></div>{/if}
      </dl>
    {/if}
    {#if np || ftp || kg}
      <dl class="small">
        {#if np}<div><dd>{num(np)}<small>W</small></dd><dt>NP®</dt></div>{/if}
        {#if ifac}<div><dd>{num(ifac * 100)}<small>%</small></dd><dt>IF®</dt></div>{/if}
        {#if load}<div><dd>{num(load.load)}</dd><dt>TSS®</dt></div>{/if}
        {#if ftp}<div class="ftp"><dd>{num(ftp)}<small>W</small></dd><dt>{t('FTP (estimated)')}</dt></div>{/if}
        {#if kg}<div class="kg"><dd>{num(kg, 1)}<small>kg</small></dd><dt>{t('Weight')}</dt></div>{/if}
        {#if kg && np}<div><dd>{num(np / kg, 1)}<small>W/kg</small></dd><dt>{t('NP per kg')}</dt></div>{/if}
      </dl>
    {/if}
    <table class="am" data-ana-avgmax>
      <thead><tr><th></th><th scope="col">{t('Average|ana')}</th><th scope="col">{t('Max')}</th></tr></thead>
      <tbody>
        {#each ROWS as r (r.name)}<tr><th scope="row">{r.name}</th><td>{num(r.avg, r.d)} <small>{r.unit}</small></td><td>{Number.isFinite(r.max) ? num(r.max, r.d) : ''} {#if Number.isFinite(r.max)}<small>{r.unit}</small>{/if}</td></tr>{/each}
        <tr><th scope="row">{t('Elapsed time')}</th><td>{clock(a.elapsedS)}</td><td></td></tr>
      </tbody>
    </table>
    {#if a.device || bike}<p class="dev">{#if a.device}<span>{a.device}</span>{/if}{#if bike}<span>{t('Bike: {name}', { name: bike })}</span>{/if}</p>{/if}
  </div>

  {#if views.length}
    <div class="body">
      <nav class="side" aria-label={t('Views of the analysis')}>
        <ul class="vlist" role="tablist">
          {#each views as v (v.key)}<li><button type="button" role="tab" aria-selected={shown === v.key} class:on={shown === v.key} onclick={() => (view = v.key)} data-ana-view={v.key}>{t(v.name)}</button></li>{/each}
        </ul>
        {#if peaks.length}
          <div class="peak" data-ana-peak>
            <p class="ph">{t('Peak Power')}</p>
            <table>
              <tbody>{#each peaks as p (p.s)}<tr><th scope="row">{p.label}</th><td>{num(p.w)} <small>W</small></td></tr>{/each}</tbody>
            </table>
          </div>
        {/if}
      </nav>

      <section class="view sa-card" aria-label={t(VIEWS.find((v) => v.key === shown)?.name ?? '')} data-ana-show={shown}>
        {#if shown === 'analysis'}
          <AnaStacked {ser} {kg} {onkm} />
        {:else if shown === 'effort'}
          <div class="effv">
            <div>
              <h3>{t('Relative Effort|ana')}</h3>
              <p class="effn">{num(eff.v)}</p>
            </div>
            <div>
              <h3>{t('Weekly Relative Effort')}</h3>
              <p class="tp-muted tp-small">{dates(eff.days[0].day, eff.days[6].day)}</p>
              <div class="wk">
                <div class="wbars" aria-hidden="true">{#each eff.days as x, i (x.day)}<span class="wb"><i style:height="{Math.min(100, (x.v / Math.max(1, ...eff.days.map((y) => y.v))) * 100)}%"></i><small>{new Date(`${x.day}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'narrow', timeZone: 'UTC' })}</small></span>{/each}</div>
                <div>
                  <p class="effw">{num(eff.week)}</p>
                  <p>{#if eff.hi > 0}{eff.place === 'below' ? t('Below your weekly range') : eff.place === 'above' ? t('Above your weekly range') : t('In your weekly range')} <span class="tp-muted">({num(eff.lo)}–{num(eff.hi)})</span>{:else}<span class="tp-muted">{t('No weeks to compare yet.')}</span>{/if}</p>
                </div>
              </div>
              <svg class="weeks" viewBox="0 0 360 120" role="img" aria-label={t('The last 12 weeks')} data-ana-weeks>
                <path class="band" d={wplot.band} />
                {#each wplot.dots as x, i (x.mon)}<circle cx={x.cx} cy={x.cy} r={i === 11 ? 5 : 3.5} class:now={i === 11} />{/each}
              </svg>
            </div>
          </div>
        {:else if shown === 'hr'}
          <h3>{t('Heart rate analysis')}</h3>
          <table class="zt" data-ana-hrzones>
            <tbody>
              {#each hrZoneRows(a, bounds) as z (z.z)}<tr><th scope="row">Z{z.z}</th><td>{t(z.name)}</td><td>{z.from == null ? `< ${z.to + 1}` : z.to == null ? `> ${z.from - 1}` : `${z.from} – ${z.to}`}</td><td class="r">{clock(z.s)}</td><td class="r">{num(z.pct, 1)} %</td><td class="bar"><i class="hz{z.z}" style:width="{z.pct}%"></i></td></tr>{/each}
            </tbody>
          </table>
          <p class="tp-muted tp-small">{t('Based on your heart rate zones.')}</p>
        {:else if shown === 'curve'}
          <h3>{t('Power curve|ana')}</h3>
          <p class="legend"><span class="lm"></span>{t('This ride')} <span class="lg"></span>{t('Last 6 weeks')} <small class="tp-muted">{dates(cv.from, cv.to)}</small></p>
          <svg class="cv" viewBox="0 0 {CW} {CHh}" role="img" aria-label={t('Power curve of this ride against the last 6 weeks')} data-ana-curvechart>
            {#each cplot.yt as g (g.w)}<line class="grid" x1={CP.l} x2={CW - CP.r} y1={g.y} y2={g.y} /><text x={CP.l - 6} y={g.y + 4} text-anchor="end">{g.w} W</text>{/each}
            {#each cplot.xt as g (g.l)}<line class="grid" x1={g.x} x2={g.x} y1={CP.t} y2={CHh - CP.b} /><text x={g.x} y={CHh - 8} text-anchor="middle">{g.l}</text>{/each}
            {#if cplot.greyArea}<path class="grey" d={cplot.greyArea} />{/if}
            <path class="mine" d={cplot.mine} />
          </svg>
        {:else if shown === 'zones'}
          <h3>{t('Zone distribution')}</h3>
          <table class="zt" data-ana-pzones>
            <tbody>
              {#each powerZoneRows(a, ftp) as z (z.z)}<tr><th scope="row">Z{z.z}</th><td>{t(z.name)}</td><td>{z.to == null ? `${z.from}+ W` : `${z.from} – ${z.to} W`}</td><td class="r">{clock(z.s)}</td><td class="r">{num(z.pct)} %</td><td class="bar"><i class="pz" style:width="{z.pct}%"></i></td></tr>{/each}
            </tbody>
          </table>
          <p class="tp-muted tp-small">{t('Based on an FTP of {w} W (estimated from your best 20 minutes).', { w: ftp })}</p>
        {:else if shown === 'dist'}
          <h3>{t('25 W power distribution')}</h3>
          <svg class="cv" viewBox="0 0 {DW} {DH}" role="img" aria-label={t('Time per 25 W')} data-ana-dist>
            {#each dplot.yt as g (g.s)}<line class="grid" x1={DP.l} x2={DW - DP.r} y1={g.y} y2={g.y} /><text x={DP.l - 6} y={g.y + 4} text-anchor="end">{clock(g.s)}</text>{/each}
            {#each dplot.xt as g, i (g.w)}<text x={g.x} y={DH - 8} text-anchor={i === dplot.xt.length - 1 && g.x > DW - DP.r - 30 ? 'end' : 'middle'}>{g.w} W</text>{/each}
            {#each dplot.bars as b (b.w)}<rect class="bin" x={b.x} y={b.y} width={b.w2} height={b.h}><title>{b.w}–{b.w + 24} W: {clock(b.s)}</title></rect>{/each}
            {#if dplot.np}<line class="npl" x1={dplot.np} x2={dplot.np} y1={DP.t} y2={DH - DP.b} /><text class="npt" x={dplot.np} y={DP.t - 6} text-anchor="middle">{t('Weighted power {w} W', { w: np })}</text>{/if}
          </svg>
        {:else if shown === 'laps'}
          <div class="lapk" role="radiogroup" aria-label={t('Bars show')}>
            {#each [['w', t('Power|ana')], ['kmh', t('Speed|ana')], ['hr', t('Heart rate|ana')]] as [k, n] (k)}<label><input type="radio" name="lapk" value={k} bind:group={lapKey} />{n}</label>{/each}
          </div>
          <div class="lapbars" aria-hidden="true">{#each lapPlot.bars as b (b.n)}<i style:left="{b.x}%" style:width="{b.w}%" style:height="{b.h}%" class:first={b.n === 1}></i>{/each}</div>
          <table class="laps" data-ana-laps>
            <thead><tr><th scope="col">{t('Lap')}</th><th scope="col">{t('Distance')}</th><th scope="col">{t('Climb')}</th><th scope="col">{t('Time')}</th><th scope="col">{t('Speed|ana')}</th><th scope="col">{t('Power|ana')}</th><th scope="col">{t('HR')}</th></tr></thead>
            <tbody>
              {#each laps as l (l.n)}<tr><td>{l.n}</td><td>{num(l.km, 2)} <small>km</small></td><td>{num(l.hm)} <small>m</small></td><td>{clock(l.el || l.s)}</td><td>{num(l.kmh, 1)} <small>km/h</small></td><td>{#if l.w}{num(l.w)} <small>W</small> <i class="lw" style:width="{(l.w / lapTop) * 60}px"></i>{:else}–{/if}</td><td>{l.hr ? `${num(l.hr)}` : '–'} {#if l.hr}<small>{t('bpm')}</small>{/if}</td></tr>{/each}
            </tbody>
          </table>
        {/if}
      </section>
    </div>
  {:else}
    <p class="sa-card tp-muted" data-ana-wait>{t('The curves, zones and laps come when Strava has sent the details of this ride.')}</p>
  {/if}
</div>

<style>
  .sa {
    display: grid;
    gap: var(--sp-3);
    min-width: 0;
  }
  .sa-card {
    padding: var(--sp-3);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  dl {
    margin: 0;
  }
  .head dl {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 28px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--line);
    margin-bottom: 10px;
  }
  .head dl div {
    display: flex;
    flex-direction: column-reverse;
  }
  .head dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }
  .head dd small {
    margin-left: 2px;
    font-size: var(--fs-small);
  }
  .head dt {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .big dd {
    font-size: var(--fs-display);
    line-height: 1.1;
  }
  .mid dd {
    font-size: var(--fs-section);
  }
  .small dd {
    font-size: var(--fs-section);
  }
  .eff dd {
    color: var(--bad);
  }
  .ftp dd,
  .kg dd {
    color: var(--accent);
  }
  .am {
    width: 100%;
    max-width: 560px;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  .am th,
  .am td {
    padding: 3px 6px;
    text-align: left;
  }
  .am thead th {
    font-weight: 600;
  }
  .am tbody th {
    font-weight: 400;
  }
  .am small {
    color: var(--ink-2);
  }
  .dev {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 40px;
    margin: 10px 0 0;
    padding-top: 10px;
    border-top: 1px solid var(--line);
    font-size: var(--fs-small);
  }
  .body {
    display: grid;
    grid-template-columns: 180px minmax(0, 1fr);
    gap: var(--sp-3);
    align-items: start;
  }
  .side {
    display: grid;
    gap: var(--sp-3);
  }
  .vlist {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    overflow: hidden;
  }
  .vlist button {
    width: 100%;
    min-height: 40px;
    padding: 6px 12px;
    border: 0;
    border-left: 3px solid transparent;
    background: none;
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    text-align: left;
    cursor: pointer;
  }
  .vlist button.on {
    border-left-color: var(--accent);
    background: var(--paper-2);
    font-weight: 600;
  }
  .peak {
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    overflow: hidden;
  }
  .ph {
    margin: 0;
    padding: 8px 12px;
    border-bottom: 2px solid var(--accent);
    font-weight: 600;
  }
  .peak table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  .peak th,
  .peak td {
    padding: 6px 12px;
    border-bottom: 1px solid var(--line);
  }
  .peak th {
    font-weight: 400;
    text-align: left;
  }
  .peak td {
    color: var(--accent);
    text-align: right;
  }
  .view {
    min-width: 0;
  }
  .view h3 {
    margin: 0 0 var(--sp-2);
    font-size: var(--fs-sub);
  }
  .zt {
    width: 100%;
    border-collapse: separate;
    border-spacing: 4px;
    font-size: var(--fs-small);
  }
  .zt th,
  .zt td {
    padding: 10px 8px;
    background: var(--paper-2);
  }
  .zt th {
    width: 40px;
    text-align: center;
  }
  .zt .r {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .zt td.bar {
    width: 40%;
    padding: 0;
    background: none;
  }
  .bar i {
    display: block;
    height: 100%;
    min-height: 36px;
    min-width: 2px;
  }
  .hz1 {
    background: var(--z1);
  }
  .hz2 {
    background: var(--z2);
  }
  .hz3 {
    background: var(--z3);
  }
  .hz4 {
    background: var(--z4);
  }
  .hz5 {
    background: var(--z5);
  }
  .pz {
    background: var(--l2);
    opacity: 0.6;
  }
  .cv {
    display: block;
    width: 100%;
    height: auto;
  }
  .cv text {
    fill: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .grid {
    stroke: var(--line);
  }
  .grey {
    fill: var(--line-strong);
    opacity: 0.35;
  }
  .mine {
    fill: none;
    stroke: var(--l2);
    stroke-width: 2.5;
  }
  .bin {
    fill: var(--l2);
    opacity: 0.45;
  }
  .npl {
    stroke: var(--l2);
    stroke-dasharray: 5 4;
  }
  .cv .npt {
    fill: var(--l2);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 0 0 6px;
    font-size: var(--fs-small);
  }
  .lm,
  .lg {
    display: inline-block;
    width: 24px;
    height: 3px;
    background: var(--l2);
  }
  .lg {
    height: 8px;
    margin-left: 12px;
    background: var(--line-strong);
    opacity: 0.5;
  }
  .effv {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
    gap: var(--sp-4);
  }
  .effn {
    margin: 0;
    color: var(--l2);
    font-size: var(--fs-display);
    font-weight: 700;
  }
  .wk {
    display: flex;
    gap: 20px;
    align-items: flex-end;
  }
  .wbars {
    display: flex;
    gap: 6px;
    height: 90px;
    align-items: flex-end;
  }
  .wb {
    display: grid;
    grid-template-rows: 1fr auto;
    justify-items: center;
    width: 14px;
    height: 100%;
  }
  .wb i {
    align-self: end;
    width: 6px;
    min-height: 2px;
    background: var(--ink);
  }
  .wb small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .effw {
    margin: 0;
    color: var(--l2);
    font-size: var(--fs-section);
    font-weight: 700;
  }
  .weeks {
    display: block;
    width: 100%;
    max-width: 520px;
    margin-top: var(--sp-2);
  }
  .band {
    fill: var(--line-strong);
    opacity: 0.35;
  }
  .weeks circle {
    fill: var(--paper);
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  .weeks circle.now {
    fill: var(--l2);
    stroke: var(--l2);
  }
  .lapk {
    display: flex;
    gap: 24px;
    justify-content: center;
    margin-bottom: 8px;
    font-size: var(--fs-small);
  }
  .lapk label {
    display: inline-flex;
    gap: 6px;
    align-items: center;
  }
  .lapbars {
    position: relative;
    height: 120px;
    margin-bottom: 8px;
    border-bottom: 1px solid var(--line-strong);
  }
  .lapbars i {
    position: absolute;
    bottom: 0;
    border: 1px solid var(--paper);
    background: var(--ink-3);
  }
  .lapbars i.first {
    background: var(--l2);
  }
  .laps {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  .laps th,
  .laps td {
    padding: 6px 8px;
    border-bottom: 1px solid var(--line);
    text-align: left;
    white-space: nowrap;
  }
  .laps small {
    color: var(--ink-2);
  }
  .lw {
    display: inline-block;
    height: 10px;
    margin-left: 6px;
    background: var(--l2);
    vertical-align: middle;
  }
  @media (max-width: 760px) {
    .body {
      grid-template-columns: minmax(0, 1fr);
    }
    .side {
      order: 2;
    }
    .vlist {
      display: flex;
      order: -1;
      overflow-x: auto;
      border: 0;
      background: none;
      gap: 6px;
    }
    .side {
      display: contents;
    }
    .vlist {
      grid-row: 1;
    }
    .vlist li {
      flex: none;
    }
    .vlist button {
      min-height: 40px;
      border: 1px solid var(--line-strong);
      border-radius: 999px;
    }
    .vlist button.on {
      border-color: var(--ink);
      background: var(--ink);
      color: var(--paper);
    }
    .peak {
      grid-row: 3;
    }
    .effv {
      grid-template-columns: minmax(0, 1fr);
    }
    .laps {
      display: block;
      overflow-x: auto;
    }
    .big dd {
      font-size: var(--fs-page);
    }
  }
</style>
