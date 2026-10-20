<script>
  /**
   * Strava-Analyse 1:1 › «Analyse» (Noah 20.10.2026): the elevation profile over the km, under it one
   * curve per sensor (speed, power, heart rate, cadence, temperature), all on the same km.
   *   - Move over a chart: the line shows the spot in every chart, the values stand on the right.
   *   - Drag over the profile (or a curve): «Auswahl» names km, metres up, gradient and time, the curves
   *     zoom to the stretch, the row below gives its numbers (time, speed, power, NP, energy, VAM).
   *   - The cross clears the choice. The arrow keys move the line, Escape clears.
   * ser: stravaana.js serOf; kg: weight for W/kg; onkm(share 0…1 | null) puts the dot on the map.
   */
  import { X } from '@lucide/svelte';
  import { t, locale } from '../../i18n.svelte.js';
  import { idxOf, statOf, stretchOf, pointOf } from '../stravaana.js';
  import { clock } from './fmt.js';

  let { ser, kg = null, onkm = null } = $props();

  const CURVES = [
    { key: 'spd', name: 'Speed|ana', unit: 'km/h', d: 1, cls: 'c-spd' },
    { key: 'w', name: 'Power|ana', unit: 'W', d: 0, cls: 'c-w' },
    { key: 'hr', name: 'Heart rate|ana', unit: 'bpm', d: 0, cls: 'c-hr' },
    { key: 'cad', name: 'Cadence|ana', unit: 'rpm', d: 0, cls: 'c-cad' },
    { key: 'temp', name: 'Temperature|ana', unit: '°C', d: 0, cls: 'c-temp' },
  ];
  const curves = $derived(CURVES.filter((c) => ser[c.key]?.some((v) => Number.isFinite(v))));

  let w = $state(700);
  const PH = 140;
  const CH = 64;
  let sel = $state(null); // { a, b } km
  let cur = $state(null); // km
  const range = $derived(sel ?? { a: 0, b: ser.km });
  const num = (v, d = 0) => (Number.isFinite(v) ? v.toLocaleString(locale(), { maximumFractionDigits: d, minimumFractionDigits: d }) : '–');

  /* ---------- the profile ---------- */
  const alts = $derived((ser.alt ?? []).filter(Number.isFinite));
  const lo = $derived(alts.length ? Math.floor(Math.min(...alts) / 50) * 50 : 0);
  const hi = $derived(alts.length ? Math.max(lo + 100, Math.ceil(Math.max(...alts) / 50) * 50) : 100);
  const px = (km, a = 0, b = ser.km) => ((km - a) / (b - a || 1)) * w;
  const py = (m) => PH - 4 - ((m - lo) / (hi - lo)) * (PH - 12);
  const profPath = $derived.by(() => {
    if (!ser.alt) return '';
    let d = `M0,${PH}`;
    for (let k = 0; k < ser.n; k++) if (Number.isFinite(ser.alt[k])) d += ` L${px(k * ser.step).toFixed(1)},${py(ser.alt[k]).toFixed(1)}`;
    return `${d} L${w},${PH} Z`;
  });
  const altTicks = $derived.by(() => {
    const st = (hi - lo) / 4;
    const nice = st <= 25 ? 25 : st <= 50 ? 50 : st <= 100 ? 100 : st <= 250 ? 250 : 500;
    const out = [];
    for (let m = Math.ceil(lo / nice) * nice; m <= hi; m += nice) out.push({ m, y: py(m) });
    return out;
  });
  const kmTicks = (a, b) => {
    const span = b - a;
    const most = Math.max(3, Math.min(10, Math.floor(w / 64)));
    const st = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50].find((s) => span / s <= most) ?? 100;
    const out = [];
    for (let k = Math.ceil(a / st) * st; k <= b + 1e-9; k += st) out.push({ k, x: px(k, a, b) });
    return { out, d: st < 1 ? 1 : 0 };
  };
  const pTicks = $derived(kmTicks(0, ser.km));
  const zTicks = $derived(kmTicks(range.a, range.b));

  /* ---------- the curves ---------- */
  const scale = (c) => {
    const v = ser[c.key].filter(Number.isFinite);
    const mx = Math.max(...v);
    const mn = c.key === 'temp' ? Math.min(...v) : 0;
    return { mn, mx: mx > mn ? mx : mn + 1 };
  };
  const scales = $derived(Object.fromEntries(curves.map((c) => [c.key, scale(c)])));
  function line(c) {
    const { mn, mx } = scales[c.key];
    const i = Math.max(0, idxOf(ser, range.a) - 1);
    const j = Math.min(ser.n - 1, idxOf(ser, range.b) + 1);
    let d = '';
    let pen = false;
    for (let k = i; k <= j; k++) {
      const v = ser[c.key][k];
      if (!Number.isFinite(v)) {
        pen = false;
        continue;
      }
      const x = px(k * ser.step, range.a, range.b).toFixed(1);
      const y = (CH - 3 - ((v - mn) / (mx - mn)) * (CH - 8)).toFixed(1);
      d += `${pen ? 'L' : 'M'}${x},${y} `;
      pen = true;
    }
    return d;
  }
  const stats = $derived(Object.fromEntries(curves.map((c) => [c.key, statOf(ser, c.key, idxOf(ser, range.a), idxOf(ser, range.b))])));
  const here = $derived(cur == null ? null : pointOf(ser, cur));
  const part = $derived(stretchOf(ser, range.a, range.b));

  /* ---------- pointer ---------- */
  let drag = null; // { from, a, b } km, with the km range of the chart dragged on
  const kmAt = (e, a, b) => {
    const r = e.currentTarget.getBoundingClientRect();
    return Math.max(a, Math.min(b, a + ((e.clientX - r.left) / (r.width || 1)) * (b - a)));
  };
  function down(e, a, b) {
    drag = { from: kmAt(e, a, b), a, b };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function move(e, a, b) {
    const k = kmAt(e, a, b);
    cur = k;
    onkm?.(k / ser.km);
    if (drag) {
      const x = Math.min(drag.from, k);
      const y = Math.max(drag.from, k);
      if (y - x > (drag.b - drag.a) / 150 && y - x >= ser.step * 2) sel = { a: x, b: y };
    }
  }
  function up() {
    drag = null;
  }
  function leave() {
    if (drag) return;
    cur = null;
    onkm?.(null);
  }
  function key(e) {
    const st = (range.b - range.a) / 100;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      cur = Math.max(range.a, Math.min(range.b, (cur ?? range.a) + (e.key === 'ArrowRight' ? st : -st)));
      onkm?.(cur / ser.km);
    } else if (e.key === 'Escape') (sel = null), (cur = null), onkm?.(null);
  }
  const wkg = (v) => (Number.isFinite(v) && kg > 0 ? Math.round((v / kg) * 10) / 10 : null);
</script>

<div class="ast" data-ana-stacked>
  <!-- the profile -->
  <div class="row prof">
    <div class="lab" style:height="{PH}px">
      {#each altTicks as g (g.m)}<span class="yt" style:top="{g.y}px">{num(g.m)} m</span>{/each}
    </div>
    <div class="plot" bind:clientWidth={w}>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <svg width={w} height={PH} role="img" tabindex="0" aria-label={t('Elevation profile over the km; drag to choose a stretch')} onpointerdown={(e) => down(e, 0, ser.km)} onpointermove={(e) => move(e, 0, ser.km)} onpointerup={up} onpointerleave={leave} onkeydown={key} data-ana-profile>
        {#each altTicks as g (g.m)}<line class="grid" x1="0" x2={w} y1={g.y} y2={g.y} />{/each}
        <path class="alt" d={profPath} />
        {#if sel}<rect class="pick" x={px(sel.a)} y="0" width={Math.max(1, px(sel.b) - px(sel.a))} height={PH} />{/if}
        {#if cur != null}<line class="cur" x1={px(cur)} x2={px(cur)} y1="0" y2={PH} />{/if}
      </svg>
      <div class="xt">{#each pTicks.out as g (g.k)}<span class:first={g.x < 24} class:last={g.x > w - 24} style:left="{g.x}px">{num(g.k, pTicks.d)} km</span>{/each}</div>
    </div>
    <dl class="read" aria-live="polite">
      <div><dt>{t('km')}</dt><dd>{here ? `${num(here.km, 1)} km` : '–'}</dd></div>
      <div><dt>{t('Time')}</dt><dd>{here ? clock(here.t) : '–'}</dd></div>
      <div><dt>{t('Height')}</dt><dd>{here?.alt != null ? `${num(here.alt)} m` : '–'}</dd></div>
      <div><dt>{t('Gradient')}</dt><dd>{here?.grade != null ? `${num(here.grade, 1)} %` : '–'}</dd></div>
    </dl>
  </div>
  {#if sel}
    <p class="pickline" data-ana-pick>
      <b>{t('Selection')}</b>
      <span>{num(part.km, 1)} km</span><span>{num(part.up)} m</span><span>{part.grade != null ? `${num(part.grade, 1)} %` : ''}</span><span>{clock(part.time)}</span>
      <button type="button" class="btn btn-link" onclick={() => (sel = null)} aria-label={t('Clear the selection')}><X size={16} aria-hidden="true" /></button>
    </p>
  {:else}
    <p class="hint">{t('Drag over the profile to see the numbers of a stretch; the curves below zoom to it.')}</p>
  {/if}

  <!-- the numbers of the whole ride or the stretch (the Sauce row) -->
  <dl class="sauce" data-ana-sauce>
    <div><dt>{t('Active')}</dt><dd>{clock(part.moving)}</dd><small>{t('Speed')}: {num(part.kmh, 1)} km/h</small></div>
    {#if part.w != null}<div><dt>{t('Power')}</dt><dd>{num(part.w)} W</dd><small>{#if wkg(part.w) != null}{t('W/kg')}: {num(wkg(part.w), 1)} · {/if}{t('NP')}: {num(part.np)} W</small></div>{/if}
    {#if part.kj != null}<div><dt>{t('Energy')}</dt><dd>{num(part.kj)} kJ</dd></div>{/if}
    <div><dt>{t('Elevation')}</dt><dd>{num(part.up)} m</dd><small>{t('VAM')}: {num(part.vam)} m/h</small></div>
  </dl>

  <!-- the curves -->
  <div class="row axis">
    <div class="lab"></div>
    <div class="plot"><div class="xt top">{#each zTicks.out as g (g.k)}<span class:first={g.x < 24} class:last={g.x > w - 24} style:left="{g.x}px">{num(g.k, zTicks.d)} km</span>{/each}</div></div>
    <div class="read"></div>
  </div>
  {#each curves as c (c.key)}
    {@const st = stats[c.key]}
    <div class="row curve {c.cls}" data-ana-curve={c.key}>
      <div class="lab"><b>{t(c.name)}</b><small>{t('Max')} {num(st?.max, c.d)}</small><small>{t('Avg')} {num(st?.avg, c.d)}</small></div>
      <div class="plot">
        <svg width={w} height={CH} aria-hidden="true" onpointerdown={(e) => down(e, range.a, range.b)} onpointermove={(e) => move(e, range.a, range.b)} onpointerup={up} onpointerleave={leave}>
          <line class="grid" x1="0" x2={w} y1={CH - 3} y2={CH - 3} />
          <path class="ln" d={line(c)} />
          {#if cur != null && cur >= range.a && cur <= range.b}<line class="cur" x1={px(cur, range.a, range.b)} x2={px(cur, range.a, range.b)} y1="0" y2={CH} />{/if}
        </svg>
      </div>
      <div class="val"><b>{here && Number.isFinite(here[c.key]) ? num(here[c.key], c.d) : '–'}</b><small>{t(c.unit)}</small></div>
    </div>
  {/each}
</div>

<style>
  .ast {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  .row {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr) 96px;
    gap: 8px;
    align-items: stretch;
  }
  .plot {
    position: relative;
    min-width: 0;
    overflow: hidden;
  }
  .plot svg {
    display: block;
    width: 100%;
    touch-action: pan-y;
    cursor: crosshair;
  }
  .plot svg:focus:not(:focus-visible) {
    outline: none;
  }
  .lab {
    position: relative;
    display: grid;
    align-content: center;
    gap: 1px;
    font-size: var(--fs-tiny);
    color: var(--ink-2);
  }
  .lab b {
    overflow: hidden;
    color: var(--ink);
    font-size: var(--fs-small);
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .yt {
    position: absolute;
    right: 0;
    transform: translateY(-50%);
    white-space: nowrap;
  }
  .xt {
    position: relative;
    height: 18px;
    font-size: var(--fs-tiny);
    color: var(--ink-2);
  }
  .xt span {
    position: absolute;
    top: 2px;
    transform: translateX(-50%);
    white-space: nowrap;
  }
  .xt span.first {
    transform: none;
  }
  .xt span.last {
    transform: translateX(-100%);
  }
  .xt.top {
    border-bottom: 1px solid var(--line);
  }
  .read {
    display: grid;
    align-content: start;
    gap: 2px;
    margin: 0;
    font-size: var(--fs-tiny);
  }
  .read div {
    display: flex;
    justify-content: space-between;
    gap: 4px;
    padding: 3px 6px;
    background: var(--paper-2);
  }
  .read dt {
    color: var(--ink-2);
  }
  .read dd {
    margin: 0;
    font-weight: 500;
  }
  .val {
    display: grid;
    align-content: center;
    justify-items: center;
    background: var(--paper-2);
  }
  .val b {
    font-size: var(--fs-section);
  }
  .val small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .grid {
    stroke: var(--line);
  }
  .alt {
    fill: var(--line-strong);
    opacity: 0.6;
  }
  .pick {
    fill: var(--ink);
    opacity: 0.12;
  }
  .cur {
    stroke: var(--ink);
    stroke-width: 1;
  }
  .ln {
    fill: none;
    stroke-width: 1.4;
    stroke-linejoin: round;
  }
  .c-spd .ln {
    stroke: var(--l1);
  }
  .c-w .ln {
    stroke: var(--l2);
  }
  .c-hr .ln {
    stroke: var(--bad);
  }
  .c-cad .ln {
    stroke: var(--l3);
  }
  .c-temp .ln {
    stroke: var(--warn);
  }
  .curve {
    border-top: 1px solid var(--line);
    padding-top: 4px;
  }
  .pickline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 14px;
    margin: 0;
    font-size: var(--fs-small);
  }
  .hint {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .sauce {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 8px 16px;
    margin: 6px 0;
    padding: 10px 0;
    border-top: 2px solid var(--accent);
    border-bottom: 1px solid var(--line);
  }
  .sauce div {
    display: grid;
  }
  .sauce dt {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .sauce dd {
    margin: 0;
    font-weight: 600;
  }
  .sauce small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  @media (max-width: 640px) {
    .row {
      gap: 4px;
    }
    .row.prof {
      grid-template-columns: 48px minmax(0, 1fr);
    }
    .row.prof .read {
      grid-column: 1 / -1;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .row.axis,
    .row.curve {
      grid-template-columns: minmax(0, 1fr) 64px;
    }
    .row.axis .lab,
    .row.axis .read {
      display: none;
    }
    .row.curve .lab {
      grid-column: 1 / -1;
      display: flex;
      flex-wrap: wrap;
      gap: 2px 10px;
      align-items: baseline;
    }
    .val b {
      font-size: var(--fs-body);
    }
  }
</style>
