<script>
  /**
   * Paket U2 «Karte» › Höhenprofil, fein und zoombar (Noah 19.10.2026 «detailierteres profil … es muss
   * zoombar sein … analog zu komoot routenplaner»).
   * The profile under the map, drawn from the fine profile (route.profileFine, map/fineprofile.js; the
   * coarse [[km, m]] profile when there is none), the area coloured by steepness like komoot.
   * - Zoom: the wheel, two fingers, «+» and «−»; drag to move a zoomed profile; «Select stretch» (or Shift +
   *   drag) zooms to the stretch you drag over; «Whole route» goes back.
   * - The km and height ticks follow the zoom; the line above names the stretch, its lowest and highest
   *   point and the metres up and down.
   * - Tap (or hover with a mouse, or the arrow keys): the cursor moves, the map shows the place and the
   *   line below says km, height, the gradient of the 100 m there, the next summit or valley and when you
   *   are there (etaOf of the plan).
   * Props: profile [[km, m]], fine (route.profileFine), sectors [{ name, fromKm, toKm }],
   * nights / snow [{ fromKm, toKm }], marks [{ km }], cursorKm (bindable), etaOf(km) → ms, onmove(km),
   * view (bindable { from, to } or null = whole), onview(view, how) after a zoom, move or selection of yours,
   * follow (bindable) with canFollow: the «Follow map» switch, meKm: your place (live page),
   * withMap: false where no map is next to it (the route of a planned tour, «Tour planen mit GPX»).
   * Touch: one finger scrolls the page up and down (touch-action pan-y) and moves sideways; two fingers zoom.
   */
  import { Plus, Minus, Maximize2, ScanLine, Link2 } from '@lucide/svelte';
  import { fineOf, slice, segments, heightAt, gradeAt, rangeOf, gainOf, nextTurn, niceTicks, minSpan, clampView, zoomView, panView, STEEPNESS } from './fineprofile.js';
  import { zoomFactor } from './zoomfactor.js';
  import { hhmm } from '../race/race.js';
  import { t, locale } from '../i18n.svelte.js';

  let {
    profile = [],
    fine = null,
    sectors = [],
    nights = [],
    snow = [],
    marks = [],
    cursorKm = $bindable(null),
    etaOf = null,
    onmove = null,
    view = $bindable(null),
    onview = null,
    follow = $bindable(true),
    canFollow = false,
    meKm = null,
    withMap = true,
  } = $props();

  const W = 1000;
  const H = 200;
  const TOP = 6;
  const f = $derived(fineOf(fine, profile));
  const total = $derived(f?.km || 1);
  const least = $derived(f ? minSpan(f) : 0.3);
  const v = $derived(clampView(view, total, least));
  const vf = $derived(v?.from ?? 0);
  const vt = $derived(v?.to ?? total);
  const span = $derived(vt - vf || 1);

  /* ---------- what is drawn ---------- */
  const pts = $derived(f ? slice(f, vf, vt, 600) : []);
  const rg = $derived(f ? rangeOf(f, vf, vt) : null);
  const ud = $derived(f ? gainOf(f, vf, vt) : { up: 0, down: 0 });
  const yr = $derived.by(() => {
    if (!rg) return { lo: 0, hi: 100 };
    const pad = Math.max(8, (rg.hi - rg.lo) * 0.08);
    const lo = rg.lo - pad;
    return { lo, hi: Math.max(rg.hi + pad, lo + 60) };
  });
  const x = (km) => Math.max(-10, Math.min(W + 10, ((km - vf) / span) * W));
  const y = (m) => TOP + (1 - (m - yr.lo) / (yr.hi - yr.lo || 1)) * (H - TOP);
  const P = (km, m) => `${x(km).toFixed(1)},${y(m).toFixed(1)}`;
  const ridge = $derived(pts.length > 1 ? `M${pts.map((p) => P(p.km, p.m)).join(' L')}` : '');
  // one path per steepness class: every piece is a polygon from the ridge down to the bottom
  const fills = $derived.by(() => {
    if (!f || pts.length < 2) return [];
    const by = {};
    let j = 0;
    for (const s of segments(f, vf, vt)) {
      const ring = [P(s.fromKm, heightAt(f, s.fromKm))];
      while (j < pts.length && pts[j].km <= s.fromKm) j++;
      let q = j;
      while (q < pts.length && pts[q].km < s.toKm) ring.push(P(pts[q].km, pts[q].m)), q++;
      ring.push(P(s.toKm, heightAt(f, s.toKm)));
      (by[s.key] ??= []).push(`M${x(s.fromKm).toFixed(1)},${H} L${ring.join(' L')} L${x(s.toKm).toFixed(1)},${H} Z`);
    }
    return STEEPNESS.filter((c) => by[c.key]).map((c) => ({ key: c.key, d: by[c.key].join(' ') }));
  });
  const kmTicks = $derived(niceTicks(vf, vt, 4));
  const mTicks = $derived(niceTicks(yr.lo, yr.hi, 3).ticks.filter((m) => y(m) > 12 && y(m) < H - 8));

  /* ---------- the cursor ---------- */
  const at = $derived(f && cursorKm != null ? { km: Math.max(0, Math.min(total, cursorKm)), m: Math.round(heightAt(f, cursorKm)), grade: gradeAt(f, cursorKm, 0.1) } : null);
  const turn = $derived(at ? nextTurn(f, at.km) : null);
  const eta = $derived(at && etaOf ? etaOf(at.km) : null);
  const curIn = $derived(at && at.km >= vf && at.km <= vt);
  const meIn = $derived(f && meKm != null && meKm >= vf && meKm <= vt);
  const when = (ms) => (Number.isFinite(ms) ? `${new Date(ms).toLocaleDateString(locale(), { weekday: 'short' })} ${hhmm(ms)}` : '');
  const fmtKm = (k) => (k >= 100 ? Math.round(k) : Math.round(k * 10) / 10);
  const fmtTick = (k) => (kmTicks.step >= 1 ? Math.round(k) : Math.round(k * 100) / 100);
  const num = (n) => Math.round(n).toLocaleString(locale());
  const pctX = (km) => `${(((km - vf) / span) * 100).toFixed(2)}%`;
  const pctY = (m) => `${((y(m) / H) * 100).toFixed(2)}%`;

  /* ---------- changing the view ---------- */
  let timer = null;
  function setView(next, how) {
    view = clampView(next, total, least);
    clearTimeout(timer);
    // the map follows after a short pause (wheel and pinch send many steps)
    timer = setTimeout(() => onview?.(view, how), how === 'wheel' || how === 'pinch' || how === 'pan' ? 250 : 0);
  }
  const zoomBy = (factor, atKm = null) => setView(zoomView(v, total, factor, atKm ?? (curIn ? at.km : null), least), 'zoom');
  const whole = () => setView(null, 'whole');
  let selecting = $state(false);
  let sel = $state(null); // { a, b } while you drag over a stretch

  function go(km) {
    cursorKm = Math.round(Math.max(0, Math.min(total, km)) * 100) / 100;
    onmove?.(cursorKm);
  }

  /* ---------- pointer: tap, hover, drag, select, pinch ---------- */
  let box = $state();
  const down = new Map(); // pointerId → clientX
  let g = null; // the gesture: { kind: 'drag' | 'select' | 'pinch', … }
  const ratio = (cx) => {
    const b = box.getBoundingClientRect();
    return Math.max(0, Math.min(1, (cx - b.left) / (b.width || 1)));
  };
  const kmAt = (cx) => vf + ratio(cx) * span;
  const widthPx = () => (box?.getBoundingClientRect().width || 1);

  function pdown(e) {
    if (e.button > 0) return;
    down.set(e.pointerId, e.clientX);
    box.setPointerCapture?.(e.pointerId);
    if (down.size === 2) {
      const [a, b] = [...down.values()];
      g = { kind: 'pinch', d0: Math.max(20, Math.abs(a - b)), v0: v ?? { from: 0, to: total }, mid: kmAt((a + b) / 2) };
      sel = null;
      return;
    }
    if (selecting || e.shiftKey) {
      const k = kmAt(e.clientX);
      g = { kind: 'select' };
      sel = { a: k, b: k };
      return;
    }
    g = { kind: 'drag', x0: e.clientX, v0: v, moved: false };
  }
  function pmove(e) {
    if (!g) {
      // a mouse over the profile moves the cursor (komoot-like); touch only on a tap
      if (e.pointerType === 'mouse' && !e.buttons) go(kmAt(e.clientX));
      return;
    }
    if (!down.has(e.pointerId)) return;
    down.set(e.pointerId, e.clientX);
    if (g.kind === 'pinch' && down.size >= 2) {
      const [a, b] = [...down.values()];
      const d = Math.max(20, Math.abs(a - b));
      setView(zoomView(g.v0, total, g.d0 / d, g.mid, least), 'pinch');
    } else if (g.kind === 'select') {
      sel = { ...sel, b: kmAt(e.clientX) };
    } else if (g.kind === 'drag') {
      const dx = (e.clientX - g.x0) / zoomFactor();
      if (Math.abs(dx) > 6) g.moved = true;
      if (!g.moved) return;
      if (g.v0) setView(panView(g.v0, total, (-(e.clientX - g.x0) / widthPx()) * (g.v0.to - g.v0.from)), 'pan');
      else go(kmAt(e.clientX));
    }
  }
  function pup(e) {
    const had = down.has(e.pointerId);
    down.delete(e.pointerId);
    if (!g || !had) return;
    if (g.kind === 'pinch') {
      if (!down.size) g = null;
      return;
    }
    if (g.kind === 'select') {
      const a = Math.min(sel.a, sel.b);
      const b = Math.max(sel.a, sel.b);
      if (b - a >= least / 2) setView({ from: a, to: b }, 'select');
      else go(a);
      sel = null;
      selecting = false;
    } else if (g.kind === 'drag' && !g.moved && e.type === 'pointerup') go(kmAt(e.clientX));
    g = null;
  }

  // the wheel zooms around the pointer (sideways moves); not passive, so the page does not scroll with it
  $effect(() => {
    const el = box;
    if (!el) return;
    const wheel = (e) => {
      if (!f) return;
      e.preventDefault();
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        if (v) setView(panView(v, total, (e.deltaX / widthPx()) * span), 'wheel');
        return;
      }
      setView(zoomView(v, total, Math.exp(Math.max(-1, Math.min(1, e.deltaY * 0.002))), kmAt(e.clientX), least), 'wheel');
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  });
  $effect(() => () => clearTimeout(timer));

  function key(e) {
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[e.key];
    const fine1 = span < 20 ? 0.1 : 1;
    if (e.key === 'Home') go(vf);
    else if (e.key === 'End') go(vt);
    else if (e.key === '+' || e.key === '=') zoomBy(0.5);
    else if (e.key === '-') zoomBy(2);
    else if (step) go((cursorKm ?? vf) + step * fine1);
    else return;
    e.preventDefault();
  }
</script>

{#if f && pts.length > 1}
  <div class="ps" data-profile data-profile-fine={f.coarse ? undefined : ''}>
    <div class="ps-tools" role="toolbar" aria-label={t('Zoom the profile')}>
      <button type="button" class="ps-btn" onclick={() => zoomBy(2)} disabled={!v} aria-label={t('Zoom out')} data-profile-zoomout><Minus size={18} aria-hidden="true" /></button>
      <button type="button" class="ps-btn" onclick={() => zoomBy(0.5)} disabled={span <= least + 1e-6} aria-label={t('Zoom in')} data-profile-zoomin><Plus size={18} aria-hidden="true" /></button>
      <button type="button" class="ps-btn ps-wide" onclick={whole} disabled={!v} data-profile-whole><Maximize2 size={16} aria-hidden="true" />{t('Whole route')}</button>
      <button type="button" class="ps-btn ps-wide" aria-pressed={selecting} onclick={() => (selecting = !selecting)} data-profile-select><ScanLine size={16} aria-hidden="true" />{t('Select stretch')}</button>
      {#if canFollow}
        <button type="button" class="ps-btn ps-wide" aria-pressed={follow} onclick={() => (follow = !follow)} data-profile-follow><Link2 size={16} aria-hidden="true" />{t('Follow map')}</button>
      {/if}
    </div>
    <p class="ps-range" data-profile-range data-from={Math.round(vf * 100) / 100} data-to={Math.round(vt * 100) / 100}>
      <b>{v ? t('km {a}–{b}', { a: fmtKm(vf), b: fmtKm(vt) }) : t('Whole route')}</b>
      <span>{fmtKm(span)} km</span>
      <span>↑ {num(ud.up)} m · ↓ {num(ud.down)} m</span>
      {#if rg}<span>{t('lowest {lo} m, highest {hi} m', { lo: num(rg.lo), hi: num(rg.hi) })}</span>{/if}
    </p>
    {#if selecting}<p class="ps-hint" role="status">{t('Drag over the stretch you want to see larger.')}</p>{/if}
    <div class="ps-plot">
      <div class="ps-axis" aria-hidden="true">
        {#each mTicks as m (m)}<span style:top={pctY(m)}>{num(m)}</span>{/each}
      </div>
      <div
        class="ps-box"
        class:ps-selecting={selecting}
        bind:this={box}
        role="slider"
        tabindex="0"
        aria-label={t('Elevation profile: move along the route')}
        aria-valuemin="0"
        aria-valuemax={Math.round(total)}
        aria-valuenow={Math.round(cursorKm ?? 0)}
        aria-valuetext={at ? t('km {km}, {m} m', { km: fmtKm(at.km), m: at.m }) : t('No point chosen')}
        onkeydown={key}
        onpointerdown={pdown}
        onpointermove={pmove}
        onpointerup={pup}
        onpointercancel={pup}
        data-profile-box
      >
        <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true">
          {#each kmTicks.ticks as k (k)}
            <line class="ps-grid" x1={x(k)} x2={x(k)} y1="0" y2={H} vector-effect="non-scaling-stroke" />
          {/each}
          {#each mTicks as m (m)}
            <line class="ps-grid" x1="0" x2={W} y1={y(m)} y2={y(m)} vector-effect="non-scaling-stroke" />
          {/each}
          {#each sectors as s, i (i)}
            {#if s.toKm > vf && s.fromKm < vt}<rect class="ps-sec s{i % 6}" x={x(s.fromKm)} y="0" width={Math.max(0, x(s.toKm) - x(s.fromKm))} height="5" />{/if}
          {/each}
          {#each nights as n, i (i)}
            {#if n.toKm > vf && n.fromKm < vt}<rect class="ps-night" x={x(n.fromKm)} y="0" width={Math.max(1, x(n.toKm) - x(n.fromKm))} height={H} />{/if}
          {/each}
          {#each fills as c (c.key)}
            <path class="ps-fill ps-{c.key}" d={c.d} vector-effect="non-scaling-stroke" />
          {/each}
          <path class="ps-ridge" d={ridge} vector-effect="non-scaling-stroke" />
          {#each snow as s, i (i)}
            {#if s.toKm > vf && s.fromKm < vt}<rect class="ps-snow" class:lies={s.state === 'lies'} x={x(s.fromKm)} y="0" width={Math.max(2, x(s.toKm) - x(s.fromKm))} height="7" />{/if}
          {/each}
          {#each sectors.slice(1) as s, i (i)}
            {#if s.fromKm > vf && s.fromKm < vt}<line class="ps-cut" x1={x(s.fromKm)} x2={x(s.fromKm)} y1="0" y2={H} vector-effect="non-scaling-stroke" />{/if}
          {/each}
          {#each marks as m, i (i)}
            {#if m.km > vf && m.km < vt}<line class="ps-mark" x1={x(m.km)} x2={x(m.km)} y1={H - 16} y2={H} vector-effect="non-scaling-stroke" />{/if}
          {/each}
          {#if sel}
            <rect class="ps-sel" x={x(Math.min(sel.a, sel.b))} y="0" width={Math.abs(x(sel.b) - x(sel.a))} height={H} />
          {/if}
          {#if curIn}
            <line class="ps-cur" x1={x(at.km)} x2={x(at.km)} y1="0" y2={H} vector-effect="non-scaling-stroke" />
          {/if}
        </svg>
        {#if curIn}<span class="ps-dot" style:left={pctX(at.km)} style:top={pctY(at.m)} aria-hidden="true"></span>{/if}
        {#if meIn}<span class="ps-dot ps-me" style:left={pctX(meKm)} style:top={pctY(heightAt(f, meKm))} aria-hidden="true" data-profile-me></span>{/if}
      </div>
      <div class="ps-km" aria-hidden="true">
        {#each kmTicks.ticks.filter((k) => (k - vf) / span < 0.9) as k (k)}<span style:left={pctX(k)}>{fmtTick(k)}</span>{/each}
        <span class="ps-unit">km</span>
      </div>
    </div>
    <p class="ps-read" aria-live="polite" data-profile-read>
      {#if at}
        <b>{t('km {km}', { km: fmtKm(at.km) })}</b>
        <span>{num(at.m)} m</span>
        <span class:ps-steep={Math.abs(at.grade) >= 8} title={t('Gradient of the 100 m here')}>{at.grade > 0 ? '+' : ''}{at.grade} %</span>
        {#if turn}<span data-profile-turn>{turn.kind === 'summit' ? t('summit in {d} km ({m} m)', { d: fmtKm(turn.distKm), m: num(turn.m) }) : t('valley in {d} km ({m} m)', { d: fmtKm(turn.distKm), m: num(turn.m) })}</span>{/if}
        {#if eta}<span>{t('there {when}', { when: when(eta) })}</span>{/if}
      {:else}
        {withMap ? t('Tap or drag on the profile: the map shows the place.') : t('Tap or drag on the profile: you see the height and the gradient there.')}
      {/if}
    </p>
    <details class="ps-help">
      <summary>{t('Colours and how to zoom')}</summary>
      <p class="ps-key">
        {#each STEEPNESS as c (c.key)}<span class="ps-ki"><span class="ps-k ps-{c.key}"></span>{t(c.name)}</span>{/each}
        {#if nights.length}<span class="ps-ki"><span class="ps-k ps-k-night"></span>{t('in the dark (your plan)')}</span>{/if}
        {#if snow.length}<span class="ps-ki"><span class="ps-k ps-k-snow"></span>{t('snow or above the snow line')}</span>{/if}
      </p>
      <p class="ps-note">{withMap ? t('Zoom with «+» and «−», two fingers or the mouse wheel. Drag sideways to move along. «Select stretch» (or Shift and drag): drag over a stretch to see it large; the map shows the same stretch.') : t('Zoom with «+» and «−», two fingers or the mouse wheel. Drag sideways to move along. «Select stretch» (or Shift and drag): drag over a stretch to see it large.')}</p>
      {#if f.coarse}<p class="ps-note" data-profile-coarse>{t('This route has only a coarse profile. Load its GPX file again: then the profile has a point every 50 to 100 m.')}</p>{/if}
    </details>
  </div>
{/if}

<style>
  .ps {
    /* the steepness colours (like komoot): green to dark red up, blue down */
    --ps-u0: #bcd9b0;
    --ps-u1: #e9d46c;
    --ps-u2: #f0a33c;
    --ps-u3: #e2692c;
    --ps-u4: #c8331f;
    --ps-u5: #7c1b12;
    --ps-d1: #c4dbef;
    --ps-d2: #8fb6dd;
    --ps-d3: #4d7fb4;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .ps-tools {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .ps-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 44px;
    min-height: 44px;
    padding: 0 10px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .ps-btn:disabled {
    color: var(--ink-3);
    cursor: default;
    opacity: 0.6;
  }
  .ps-btn[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .ps-range,
  .ps-read {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 12px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-variant-numeric: tabular-nums;
  }
  .ps-range b,
  .ps-read b {
    color: var(--ink);
  }
  .ps-hint {
    margin: 0;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--hi-soft);
    color: var(--ink);
    font-size: var(--fs-small);
  }
  .ps-plot {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    column-gap: 4px;
    min-width: 0;
  }
  .ps-axis {
    position: relative;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
  .ps-axis span {
    position: absolute;
    right: 0;
    transform: translateY(-50%);
  }
  .ps-box {
    position: relative;
    height: 180px;
    border-radius: 8px;
    background: var(--paper);
    border: 1px solid var(--line);
    overflow: hidden;
    touch-action: pan-y;
    cursor: crosshair;
    user-select: none;
  }
  .ps-box.ps-selecting {
    touch-action: none;
    outline: 2px solid var(--hi);
    outline-offset: -2px;
  }
  @media (min-width: 900px) {
    .ps-box {
      height: 240px;
    }
  }
  .ps-box:focus-visible {
    outline: var(--focus-ring);
  }
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .ps-grid {
    stroke: var(--line);
    stroke-width: 1;
    opacity: 0.6;
  }
  .ps-sec {
    opacity: 0.8;
  }
  .s0 {
    fill: var(--l1);
  }
  .s1 {
    fill: var(--l2);
  }
  .s2 {
    fill: var(--l3);
  }
  .s3 {
    fill: var(--l4);
  }
  .s4 {
    fill: var(--hi);
  }
  .s5 {
    fill: var(--ok);
  }
  .ps-night {
    fill: var(--ink);
    opacity: 0.12;
  }
  .ps-fill {
    stroke-width: 0.6;
  }
  .ps-u0 {
    fill: var(--ps-u0);
    stroke: var(--ps-u0);
    background: var(--ps-u0);
  }
  .ps-u1 {
    fill: var(--ps-u1);
    stroke: var(--ps-u1);
    background: var(--ps-u1);
  }
  .ps-u2 {
    fill: var(--ps-u2);
    stroke: var(--ps-u2);
    background: var(--ps-u2);
  }
  .ps-u3 {
    fill: var(--ps-u3);
    stroke: var(--ps-u3);
    background: var(--ps-u3);
  }
  .ps-u4 {
    fill: var(--ps-u4);
    stroke: var(--ps-u4);
    background: var(--ps-u4);
  }
  .ps-u5 {
    fill: var(--ps-u5);
    stroke: var(--ps-u5);
    background: var(--ps-u5);
  }
  .ps-d1 {
    fill: var(--ps-d1);
    stroke: var(--ps-d1);
    background: var(--ps-d1);
  }
  .ps-d2 {
    fill: var(--ps-d2);
    stroke: var(--ps-d2);
    background: var(--ps-d2);
  }
  .ps-d3 {
    fill: var(--ps-d3);
    stroke: var(--ps-d3);
    background: var(--ps-d3);
  }
  .ps-ridge {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  .ps-snow {
    fill: var(--l3);
    opacity: 0.55;
  }
  .ps-snow.lies {
    opacity: 0.9;
  }
  .ps-cut {
    stroke: var(--line-strong);
    stroke-width: 1;
    stroke-dasharray: 3 3;
  }
  .ps-mark {
    stroke: var(--brand);
    stroke-width: 2;
  }
  .ps-sel {
    fill: var(--hi);
    opacity: 0.18;
  }
  .ps-cur {
    stroke: var(--hi);
    stroke-width: 2;
  }
  .ps-dot {
    position: absolute;
    width: 12px;
    height: 12px;
    margin: -6px 0 0 -6px;
    border: 2px solid var(--paper);
    border-radius: 50%;
    background: var(--hi);
    pointer-events: none;
  }
  .ps-me {
    width: 16px;
    height: 16px;
    margin: -8px 0 0 -8px;
    background: var(--l3);
    border-width: 3px;
  }
  .ps-km {
    grid-column: 2;
    position: relative;
    height: 18px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-variant-numeric: tabular-nums;
  }
  .ps-km span {
    position: absolute;
    top: 2px;
    transform: translateX(-50%);
    white-space: nowrap;
  }
  .ps-km .ps-unit {
    left: auto;
    right: 0;
    transform: none;
    background: var(--paper);
    padding-left: 4px;
  }
  .ps-steep {
    color: var(--bad);
    font-weight: 600;
  }
  .ps-help summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    color: var(--ink-2);
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .ps-key {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ps-note {
    margin: 6px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .ps-ki {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .ps-k {
    flex: none;
    width: 14px;
    height: 10px;
    border-radius: 2px;
  }
  .ps-k-night {
    background: var(--ink);
    opacity: 0.3;
  }
  .ps-k-snow {
    background: var(--l3);
  }
</style>
