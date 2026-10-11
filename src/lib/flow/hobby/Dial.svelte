<script>
  /**
   * Hobby pages 2 «Kissenzeit» (B1, B2, B7; H22a): the round dial with its marks. One drawing for three
   * uses: small and reading on B1 («Wie letztes Mal»), editable on B2 (tap the ring: a mark on the
   * 30-second grid; tap a mark: it goes; drag: it moves; long press: its own sound), and running on B7
   * (the arc that ran, the next mark in orange). The maths is pure in flowbowl.js.
   * total: seconds; marks: [{ sec, sound? }] in between; elapsed: seconds run (B7) or null;
   * next: the next mark (sec) or null; editable; onchange(marks); onlong(mark); children: the middle.
   */
  import { angleToSec, secToAngle, pointAngle, toggleMark, moveMark, marksOf, GRID } from '../../flowbowl.js';
  import { clock } from '../../flowtimer.js';
  import { t } from '../../i18n.svelte.js';

  let { total = 1200, marks = [], elapsed = null, next = null, editable = false, labels = false, small = false, onchange, onlong, label = '', children } = $props();

  const C = 120;
  const R = 96;
  const list = $derived(marksOf(marks));
  const pos = (sec, r = R) => {
    const a = (secToAngle(sec, total) * Math.PI) / 180;
    return { x: C + r * Math.sin(a), y: C - r * Math.cos(a) };
  };
  // a tick per minute up to an hour, else every five minutes; longer ones each quarter
  const ticks = $derived.by(() => {
    const step = total <= 3600 ? 60 : 300;
    const out = [];
    for (let s = 0; s < total; s += step) out.push({ s, long: s % Math.max(step, Math.round(total / 4)) === 0 });
    return out;
  });
  const arc = $derived.by(() => {
    if (elapsed == null || elapsed <= 0) return '';
    const frac = Math.min(0.9999, elapsed / total);
    const end = pos(frac * total);
    return `M ${C} ${C - R} A ${R} ${R} 0 ${frac > 0.5 ? 1 : 0} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
  });

  /* tap, drag, long press (B2) */
  let svg = $state();
  let drag = $state(null); // { from, sec, moved, x, y }
  let pressTimer = null;
  function at(e) {
    const b = svg.getBoundingClientRect();
    const x = ((e.clientX - b.left) / b.width) * 240;
    const y = ((e.clientY - b.top) / b.height) * 240;
    return { x, y, d: Math.hypot(x - C, y - C), angle: pointAngle(x, y, C, C) };
  }
  function down(e) {
    if (!editable) return;
    const p = at(e);
    if (p.d < R - 34 || p.d > R + 30) return; // only the ring
    e.preventDefault();
    svg.setPointerCapture?.(e.pointerId);
    const sec = angleToSec(p.angle, total);
    const near = list.find((m) => Math.abs(secToAngle(m.sec, total) - secToAngle(sec ?? 0, total)) < 8 || Math.abs(m.sec - (sec ?? -999)) <= GRID / 2);
    drag = { from: near?.sec ?? null, sec, moved: false, x: e.clientX, y: e.clientY, long: false };
    clearTimeout(pressTimer);
    if (near)
      pressTimer = setTimeout(() => {
        if (drag && !drag.moved) {
          drag = { ...drag, long: true };
          onlong?.(near);
        }
      }, 550);
  }
  function move(e) {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
    clearTimeout(pressTimer);
    const sec = angleToSec(at(e).angle, total);
    drag = { ...drag, moved: true, sec };
  }
  function up() {
    clearTimeout(pressTimer);
    const d = drag;
    drag = null;
    if (!d || d.long) return;
    if (d.from != null && d.moved) onchange?.(moveMark(list, d.from, d.sec));
    else if (d.from != null) onchange?.(list.filter((m) => m.sec !== d.from));
    else onchange?.(toggleMark(list, d.sec));
  }
  function cancel() {
    clearTimeout(pressTimer);
    drag = null;
  }
  const shown = $derived(drag?.from != null && drag.moved ? marksOf([...list.filter((m) => m.sec !== drag.from), { ...list.find((m) => m.sec === drag.from), sec: drag.sec }]) : list);
  const aria = $derived(label || (shown.length ? t('Marks at {list}', { list: shown.map((m) => clock(m.sec)).join(', ') }) : t('Only start and end')));
</script>

<div class="dial" class:small class:edit={editable}>
  <svg bind:this={svg} viewBox="0 0 240 240" role="img" aria-label={aria} onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={cancel} data-total={total}>
    {#each ticks as k (k.s)}
      {@const a = pos(k.s, R + 20)}
      {@const b = pos(k.s, R + (k.long ? 28 : 24))}
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} class="tick" class:long={k.long} />
    {/each}
    <circle cx={C} cy={C} r={R - 7} class="face" />
    <circle cx={C} cy={C} r={R} class="track" class:run={elapsed != null} />
    {#if arc}<path d={arc} class="arc" />{/if}
    <circle cx={C} cy={C - R} r={small ? 6 : 8} class="mk start" />
    {#each shown as m (m.sec)}
      {@const p = pos(m.sec)}
      {@const q = pos(m.sec, R - 24)}
      <circle cx={p.x} cy={p.y} r={small ? 6 : 8} class="mk" class:nx={next === m.sec} class:own={!!m.sound} class:past={elapsed != null && m.sec <= elapsed} data-mark={m.sec} />
      {#if labels}<text x={q.x} y={q.y} class="ml" class:nx={next === m.sec} text-anchor="middle" dominant-baseline="middle">{clock(m.sec)}</text>{/if}
    {/each}
  </svg>
  <div class="mid">{@render children?.()}</div>
</div>

<style>
  .dial {
    position: relative;
    width: min(100%, 380px);
    margin: 0 auto;
    aspect-ratio: 1;
  }
  .dial.small {
    width: 140px;
  }
  svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
    touch-action: none;
  }
  .edit svg {
    cursor: pointer;
  }
  .tick {
    stroke: var(--line-strong);
    stroke-width: 1.2;
  }
  .tick.long {
    stroke: var(--ink-3);
    stroke-width: 2;
  }
  .face {
    fill: var(--ok-soft);
  }
  .track {
    fill: none;
    stroke: var(--accent);
    stroke-width: 12;
  }
  .track.run {
    stroke: var(--accent-soft);
  }
  .arc {
    fill: none;
    stroke: var(--accent);
    stroke-width: 12;
    stroke-linecap: round;
  }
  .mk {
    fill: var(--paper);
    stroke: var(--accent);
    stroke-width: 3;
  }
  .mk.start {
    fill: var(--accent);
  }
  .mk.own {
    stroke-dasharray: 3 2;
  }
  .mk.past {
    fill: var(--accent-soft);
  }
  .mk.nx {
    stroke: var(--hi);
    stroke-width: 4;
  }
  .ml {
    fill: var(--accent);
    font: 600 var(--fs-tiny) var(--font-body);
  }
  .ml.nx {
    fill: var(--hi);
  }
  .mid {
    position: absolute;
    inset: 22%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    text-align: center;
    pointer-events: none;
  }
</style>
