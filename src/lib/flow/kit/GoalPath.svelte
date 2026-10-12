<script>
  /**
   * v0.105.0 Design-Refresh P8 «Aktiv» (B22 «Ziel-Pfad», A5 and A14): a path with stations, the part
   * walked in colour, «you are here» on it, the next stations as open rings. path: aktiv.js goalPath();
   * unit: '' | 'min' | 'h'; label: the goal's name under the path.
   */
  import { t, tn, num } from '../../i18n.svelte.js';

  let { path, unit = '', label = '' } = $props();
  const W = 360;
  const H = 140;
  const n = $derived(path.stations.length);
  const pts = $derived(path.stations.map((s, i) => ({ ...s, x: 24 + (i * (W - 48)) / Math.max(1, n - 1), y: 104 - (i * 64) / Math.max(1, n - 1) + (i % 2 ? -14 : 8) })));
  const seg = (a, b) => `C${(a.x + b.x) / 2},${a.y} ${(a.x + b.x) / 2},${b.y} ${b.x},${b.y}`;
  const d = $derived(pts.length ? `M${pts[0].x},${pts[0].y} ${pts.slice(1).map((p, i) => seg(pts[i], p)).join(' ')}` : '');
  // where you are: on the curve between the last station reached and the next one
  const here = $derived.by(() => {
    const v = path.value;
    let i = pts.findIndex((p, k) => k < pts.length - 1 && v >= p.at && v <= pts[k + 1].at);
    if (i < 0) i = v >= pts.at(-1).at ? pts.length - 2 : 0;
    const a = pts[i];
    const b = pts[i + 1] ?? a;
    const f = b.at > a.at ? Math.min(1, Math.max(0, (v - a.at) / (b.at - a.at))) : 1;
    const mx = (a.x + b.x) / 2;
    const u = 1 - f;
    // the cubic of seg(): P0 = a, P1 = (mx, a.y), P2 = (mx, b.y), P3 = b
    const x = u * u * u * a.x + 3 * u * u * f * mx + 3 * u * f * f * mx + f * f * f * b.x;
    const y = u * u * u * a.y + 3 * u * u * f * a.y + 3 * u * f * f * b.y + f * f * f * b.y;
    return { x, y };
  });
  const fmt = (v) => `${num(v)}${unit === 'h' ? ' h' : unit === 'min' ? ' min' : ''}`;
  const clip = `gp-${Math.random().toString(36).slice(2, 8)}`;
</script>

<figure class="gp">
  <svg viewBox="0 0 {W} {H}" role="img" aria-label={t('{value} of {target}, {n} stations to go', { value: fmt(path.value), target: fmt(path.target), n: path.next })}>
    <defs><clipPath id={clip}><rect x="0" y="0" width={here.x} height={H} /></clipPath></defs>
    <path class="rest" {d} />
    <path class="walked" {d} clip-path="url(#{clip})" />
    {#each pts as p, i (i)}
      <circle class="st" class:on={p.reached} cx={p.x} cy={p.y} r={p.reached ? 7 : 8} />
      <text class="lb" x={p.x} y={p.y - 14} text-anchor={i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'middle'}>{num(p.at)}</text>
    {/each}
    <circle class="here" cx={here.x} cy={here.y} r="10" />
    <text class="hl" x={here.x} y={here.y + 28} text-anchor="middle">{num(Math.round(path.value * 10) / 10)}</text>
  </svg>
  <figcaption>
    <b>{label}</b>
    <span>{t('{left} to go', { left: fmt(path.left) })} · {tn(path.next, '{n} station', '{n} stations')}</span>
  </figcaption>
</figure>

<style>
  .gp {
    margin: 0;
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
  .rest,
  .walked {
    fill: none;
    stroke-width: 10;
    stroke-linecap: round;
  }
  .rest {
    stroke: var(--paper-2);
  }
  .walked {
    stroke: var(--hi);
  }
  .st {
    fill: var(--paper);
    stroke: var(--ink-3);
    stroke-width: 3;
  }
  .st.on {
    fill: var(--hi);
    stroke: var(--hi);
  }
  .here {
    fill: var(--paper);
    stroke: var(--hi);
    stroke-width: 4;
  }
  .lb,
  .hl {
    fill: var(--ink-2);
    font: 500 var(--fs-tiny) var(--font-body);
  }
  .hl {
    fill: var(--ink);
    font-weight: 600;
  }
  figcaption {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 2px 12px;
    margin-top: var(--sp-1);
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  figcaption b {
    color: var(--ink);
    font-weight: 600;
  }
</style>
