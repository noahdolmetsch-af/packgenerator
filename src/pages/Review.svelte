<script>
  /**
   * v0.44.0 "Rückblick 12 Monate" (#/review): the last 12 months, always rolling up to today, in four
   * light sections: Riding, Packing, Learned, Bikes. A row shows only when it has a number; a small
   * neutral badge says the difference to the 12 months before where both have data. Two small
   * charts drawn to scale from 0: km per month and the base weight per trip. Reached from the card
   * on Today, from Debrief and from More → Look back. Numbers: yearreview.js (tested).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { loadReview } from '../lib/review/load.js';
  import { yearReview } from '../lib/yearreview.js';
  import { signedWeight, signed } from '../lib/review/words.js';
  import { formatWeight } from '../lib/gear.js';
  import { localDay } from '../lib/localday.js';
  import { hm } from '../lib/gpx.js';
  import { t, tn, num, locale, nameOf } from '../lib/i18n.svelte.js';
  import { ChevronRight } from '@lucide/svelte';

  const today = localDay();
  const dataQ = liveQuery(() => loadReview(db));
  const r = $derived($dataQ ? yearReview({ ...$dataQ, today }) : null);

  const date = (iso, year = true) => new Date(`${iso}T00:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', ...(year ? { year: 'numeric' } : {}) });
  const monthName = (ym) => new Date(`${ym}-01T00:00:00`).toLocaleDateString(locale(), { month: 'short' });
  const monthLong = (ym) => new Date(`${ym}-01T00:00:00`).toLocaleDateString(locale(), { month: 'long', year: 'numeric' });
  const hours = (h) => `${hm(h)} h`;
  /** The unit a delta carries (the row's label says what it is). */
  const UNIT = { km: ' km', climbM: ' m', movingH: ' h', chf: ' CHF' };
  const withUnit = (key) => (d) => (key === 'movingH' ? `${d > 0 ? '+' : '−'}${hm(Math.abs(d))} h` : `${signed(d)}${UNIT[key] ?? ''}`);
  const kg = (g) => `${(g / 1000).toLocaleString(locale(), { maximumFractionDigits: 1 })} kg`;

  /** A round top for an axis: 1, 2 or 5 × a power of ten, at least the largest value. */
  function niceMax(v) {
    if (!(v > 0)) return 1;
    const p = 10 ** Math.floor(Math.log10(v));
    return [1, 2, 5, 10].map((m) => m * p).find((m) => m >= v);
  }

  /* ---------- chart 1: km per month (bars from 0) ---------- */
  const W = 320;
  const H = 132;
  const PAD = { l: 40, r: 8, t: 10, b: 22 };
  const kmChart = $derived.by(() => {
    if (!r) return null;
    const m = r.months;
    if (m.filter((x) => x.km > 0).length < 2) return null;
    const top = niceMax(Math.max(...m.map((x) => x.km)));
    const iw = W - PAD.l - PAD.r;
    const ih = H - PAD.t - PAD.b;
    const step = iw / m.length;
    const bw = Math.max(4, step - 4);
    return {
      top,
      bars: m.map((x, i) => {
        const h = (x.km / top) * ih;
        const x0 = PAD.l + i * step + (step - bw) / 2;
        const y0 = PAD.t + ih;
        const rr = Math.min(3, h, bw / 2);
        const d = h > 0 ? `M${x0} ${y0}V${y0 - h + rr}Q${x0} ${y0 - h} ${x0 + rr} ${y0 - h}H${x0 + bw - rr}Q${x0 + bw} ${y0 - h} ${x0 + bw} ${y0 - h + rr}V${y0}Z` : '';
        return { ...x, d, cx: x0 + bw / 2, hit: { x: PAD.l + i * step, w: step } };
      }),
      labels: [0, Math.floor((m.length - 1) / 2), m.length - 1].map((i) => ({ x: PAD.l + i * step + step / 2, text: monthName(m[i].month), anchor: i === 0 ? 'start' : i === m.length - 1 ? 'end' : 'middle' })),
      y0: PAD.t + ih,
    };
  });

  /* ---------- chart 2: base weight per trip (from 0) ---------- */
  const baseChart = $derived.by(() => {
    const tr = r?.pack.trend;
    if (!tr) return null;
    const pts = tr.points;
    const top = niceMax(Math.max(...pts.map((p) => p.g)) / 1000) * 1000;
    const iw = W - PAD.l - PAD.r - 8;
    const ih = H - PAD.t - PAD.b;
    const x = (i) => PAD.l + 4 + (pts.length === 1 ? iw / 2 : (i * iw) / (pts.length - 1));
    const y = (g) => PAD.t + ih - (g / top) * ih;
    const dots = pts.map((p, i) => ({ ...p, cx: x(i), cy: y(p.g) }));
    return { top, dots, line: dots.map((d, i) => `${i ? 'L' : 'M'}${d.cx.toFixed(1)} ${d.cy.toFixed(1)}`).join(' '), y0: PAD.t + ih, first: dots[0], last: dots.at(-1) };
  });

  const clothingText = (c) =>
    [
      ['fit', t('Fitted|clothing')],
      ['cold', t('Too cold')],
      ['warm', t('Too warm')],
    ]
      .filter(([k]) => c[k])
      .map(([k, name]) => `${name} ${c[k]}`)
      .join(' · ');
  const partBy = (p) => (p.by === 'shop' ? t('bike shop') : t('own work'));
</script>

{#snippet delta(key)}
  {#if r.delta[key]}<span class="nbadge num" title={t('Compared with the 12 months before')}>{withUnit(key)(r.delta[key])}<span class="sr"> {t('compared with the 12 months before')}</span></span>{/if}
{/snippet}

{#snippet row(label, value, key = null)}
  <li class="r"><span class="k">{label}</span><span class="v num">{value}{#if key}{@render delta(key)}{/if}</span></li>
{/snippet}

<div class="review">
  <h1 class="title">{t('Last 12 months')}</h1>
  {#if r}
    <p class="page-sub num">{date(r.window.from)} – {date(r.window.to)}{#if !r.empty && Object.keys(r.delta).length}{' · '}{t('small numbers: difference to the 12 months before')}{/if}</p>

    {#if r.empty}
      <p class="empty">{t('This fills up after your first trips: finished trips and uploaded rides of the last 12 months show here.')}</p>
    {:else}
      {#if r.has.ride}
        <section aria-labelledby="rv-ride">
          <h2 id="rv-ride" class="sec-head"><span>{t('Riding|review')}</span></h2>
          <ul class="rowlist">
            {#if r.ride.trips}{@render row(tn(r.ride.trips, 'trip|count', 'trips|count'), num(r.ride.trips), 'trips')}{/if}
            {#if r.ride.days}{@render row(tn(r.ride.days, 'day on the way', 'days on the way'), num(r.ride.days), 'days')}{/if}
            {#if r.ride.nights}{@render row(tn(r.ride.nights, 'night outside', 'nights outside'), num(r.ride.nights), 'nights')}{/if}
            {#if r.ride.km}{@render row(t('Distance'), `${num(r.ride.km)} km`, 'km')}{/if}
            {#if r.ride.climbM}{@render row(t('Climbing'), `${num(r.ride.climbM)} m`, 'climbM')}{/if}
            {#if r.ride.movingH}{@render row(t('Moving time'), hours(r.ride.movingH), 'movingH')}{/if}
            {#if r.ride.longest}{@render row(t('Longest trip'), `${r.ride.longest.title} · ${num(r.ride.longest.km)} km`)}{/if}
            {#if kmChart}
              <li class="chart">
                <figure>
                  <figcaption class="cap">{t('km per month')}</figcaption>
                  <svg viewBox="0 0 {W} {H}" role="img" aria-label={t('km per month')}>
                    <line class="grid" x1={PAD.l} x2={W - PAD.r} y1={PAD.t} y2={PAD.t} />
                    <line class="axis" x1={PAD.l} x2={W - PAD.r} y1={kmChart.y0} y2={kmChart.y0} />
                    <text class="tick" x={PAD.l - 6} y={PAD.t + 4} text-anchor="end">{num(kmChart.top)}</text>
                    <text class="tick" x={PAD.l - 6} y={kmChart.y0 + 4} text-anchor="end">0 km</text>
                    {#each kmChart.bars as b (b.month)}
                      <g class="bar">
                        <title>{monthLong(b.month)}: {num(b.km)} km</title>
                        <rect class="hit" x={b.hit.x} y={PAD.t} width={b.hit.w} height={kmChart.y0 - PAD.t} />
                        {#if b.d}<path d={b.d} />{/if}
                      </g>
                    {/each}
                    {#each kmChart.labels as l, i (i)}<text class="tick" x={l.x} y={H - 6} text-anchor={l.anchor}>{l.text}</text>{/each}
                  </svg>
                </figure>
              </li>
            {/if}
          </ul>
        </section>
      {/if}

      {#if r.has.pack}
        <section aria-labelledby="rv-pack">
          <h2 id="rv-pack" class="sec-head"><span>{t('Packing|review')}</span></h2>
          <ul class="rowlist">
            {#if r.pack.trend}
              <li class="r"><span class="k">{t('Base weight, first → last trip')}</span><span class="v num">{kg(r.pack.trend.first.g)} → {kg(r.pack.trend.last.g)}{#if r.pack.trend.diffG}<span class="nbadge num">{signedWeight(r.pack.trend.diffG)}</span>{/if}</span></li>
              {#if baseChart}
                <li class="chart">
                  <figure>
                    <figcaption class="cap">{t('Base weight per trip')}</figcaption>
                    <svg viewBox="0 0 {W} {H}" role="img" aria-label={t('Base weight per trip')}>
                      <line class="grid" x1={PAD.l} x2={W - PAD.r} y1={PAD.t} y2={PAD.t} />
                      <line class="axis" x1={PAD.l} x2={W - PAD.r} y1={baseChart.y0} y2={baseChart.y0} />
                      <text class="tick" x={PAD.l - 6} y={PAD.t + 4} text-anchor="end">{kg(baseChart.top)}</text>
                      <text class="tick" x={PAD.l - 6} y={baseChart.y0 + 4} text-anchor="end">0</text>
                      <path class="line" d={baseChart.line} />
                      {#each baseChart.dots as d (d.id)}
                        <g class="dot"><title>{d.title}, {date(d.date)}: {formatWeight(d.g)}{d.missing ? ` (${t('{n} not weighed', { n: d.missing })})` : ''}</title><circle class="hit" cx={d.cx} cy={d.cy} r="12" /><circle cx={d.cx} cy={d.cy} r="4" /></g>
                      {/each}
                      <text class="tick" x={baseChart.first.cx} y={H - 6} text-anchor="start">{date(baseChart.first.date, false)}</text>
                      <text class="tick" x={baseChart.last.cx} y={H - 6} text-anchor="end">{date(baseChart.last.date, false)}</text>
                    </svg>
                  </figure>
                  <p class="note">{t("With today's weights of the items.")}</p>
                </li>
              {/if}
            {/if}
            {#if r.pack.dead.length}
              <li>
                <details>
                  <summary class="lrow"><span class="m"><span class="t">{t('Never used')}</span></span><span class="v num">{tn(r.pack.dead.length, '{n} item', '{n} items')}{r.pack.deadG ? ` · ${formatWeight(r.pack.deadG)}` : ''}</span><ChevronRight class="chev" size={18} aria-hidden="true" /></summary>
                  <ul class="sub">
                    {#each r.pack.dead as d (d.item.id)}<li><span>{nameOf(d.item)}</span><span class="num">{t('{n}× along', { n: d.taken })}</span></li>{/each}
                  </ul>
                </details>
              </li>
            {/if}
            {#if r.pack.top.length}
              <li class="r stack">
                <span class="k">{t('Most often along')}</span>
                <ul class="sub">
                  {#each r.pack.top as x (x.item.id)}<li><span>{nameOf(x.item)}</span><span class="num">{tn(x.n, '{n} trip', '{n} trips')}</span></li>{/each}
                </ul>
              </li>
            {/if}
            {#if r.pack.bought.length}
              <li>
                <details>
                  <summary class="lrow"><span class="m"><span class="t">{t('Bought from the wishlist')}</span></span><span class="v num">{num(r.pack.bought.length)}</span><ChevronRight class="chev" size={18} aria-hidden="true" /></summary>
                  <ul class="sub">
                    {#each r.pack.bought as i (i.id)}<li><span>{nameOf(i)}</span><span class="num">{date(i.boughtAt.slice(0, 10))}</span></li>{/each}
                  </ul>
                </details>
              </li>
            {/if}
          </ul>
        </section>
      {/if}

      {#if r.has.learn}
        <section aria-labelledby="rv-learn">
          <h2 id="rv-learn" class="sec-head"><span>{t('Learned|review')}</span></h2>
          <ul class="rowlist">
            {#if r.learn.n}
              <li class="r stack">
                <span class="k">{tn(r.learn.n, 'learning added', 'learnings added')}</span><span class="v num">{num(r.learn.n)}{@render delta('learnings')}</span>
                <ul class="sub rules">
                  {#each r.learn.newest as l (l.id)}<li><span>{l.rule}</span></li>{/each}
                </ul>
                <a class="more" href="#/debrief/learnings">{t('All learnings')}</a>
              </li>
            {/if}
            {#if r.learn.clothing}{@render row(t('Clothing after the trip'), clothingText(r.learn.clothing))}{/if}
            {#if r.learn.pace}
              <li class="r"><span class="k">{t('Your pace')}</span><span class="v num">{num(r.learn.pace.kmh)} km/h{#if r.learn.pace.diff}<span class="nbadge num" title={t('Compared with the 12 months before')}>{signed(r.learn.pace.diff)} km/h<span class="sr"> {t('compared with the 12 months before')}</span></span>{/if}</span></li>
            {/if}
          </ul>
        </section>
      {/if}

      {#if r.has.bikes}
        <section aria-labelledby="rv-bikes">
          <h2 id="rv-bikes" class="sec-head"><span>{t('Bikes|review')}</span></h2>
          <ul class="rowlist">
            {#each r.bikes.km as b (b.bikeId)}{@render row(b.bike, `${num(b.km)} km`)}{/each}
            {#if r.bikes.visits}
              <li class="r"><span class="k">{t('Workshop|review')}</span><span class="v num">{tn(r.bikes.visits, '{n} visit', '{n} visits')} · {#if r.bikes.chf}CHF {num(r.bikes.chf)}{#if r.bikes.chfUnknown} + {t('unknown')}{/if}{:else}{t('cost unknown')}{/if}{@render delta('chf')}</span></li>
            {/if}
            {#if r.bikes.parts.length}
              <li>
                <details>
                  <summary class="lrow"><span class="m"><span class="t">{t('Parts replaced')}</span></span><span class="v num">{num(r.bikes.parts.length)}</span><ChevronRight class="chev" size={18} aria-hidden="true" /></summary>
                  <ul class="sub">
                    {#each r.bikes.parts as p, i (i)}<li><span>{t(p.name)} · {p.bike}</span><span class="num">{date(p.date)} · {partBy(p)}</span></li>{/each}
                  </ul>
                </details>
              </li>
            {/if}
          </ul>
        </section>
      {/if}
    {/if}
  {/if}
</div>

<style>
  .review {
    max-width: 760px;
    margin: 0 auto;
  }
  .empty {
    margin: 12px 0 0;
    color: var(--ink-2);
  }
  section {
    margin-top: 8px;
  }
  .r {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 2px 12px;
    min-height: 48px;
    padding: 8px 12px;
  }
  .r.stack {
    align-items: baseline;
  }
  .k {
    flex: 1 1 140px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .v {
    flex: 0 1 auto;
    min-width: 0;
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 4px 8px;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
    text-align: right;
    overflow-wrap: break-word;
  }
  .rowlist :global(.lrow .v) {
    white-space: normal;
  }
  .sub {
    flex: 1 1 100%;
    list-style: none;
    margin: 0;
    padding: 0 12px 8px;
    font-size: 15px;
  }
  .r .sub {
    padding: 4px 0 0;
  }
  .sub li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 4px 0;
    color: var(--ink-2);
  }
  .sub li span:first-child {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .sub li .num {
    flex: none;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .rules li {
    display: list-item;
    margin-left: 18px;
    list-style: disc;
  }
  .more {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    font-size: 15px;
  }
  .chart {
    padding: 8px 12px 10px;
  }
  figure {
    margin: 0;
  }
  .cap {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  svg {
    display: block;
    width: 100%;
    max-width: 480px;
    height: auto;
    overflow: visible;
  }
  .grid {
    stroke: var(--line);
    stroke-dasharray: 2 3;
  }
  .axis {
    stroke: var(--line-strong);
  }
  .tick {
    fill: var(--ink-3);
    font: 400 12px var(--font-body);
    font-variant-numeric: tabular-nums;
  }
  .bar path {
    fill: var(--brand);
  }
  .hit {
    fill: transparent;
  }
  .bar:hover path {
    fill: var(--ink-2);
  }
  .line {
    fill: none;
    stroke: var(--brand);
    stroke-width: 2;
  }
  .dot circle:not(.hit) {
    fill: var(--brand);
    stroke: var(--paper);
    stroke-width: 2;
  }
  .note {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--ink-3);
  }
</style>
