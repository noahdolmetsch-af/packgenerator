<script>
  /**
   * «Timer» faces (Z3): Digital, Ring, Hourglass, Moon, Egg, Big number. sec: the seconds the clock
   * shows; frac: how much has run (0…1, drives the ring, the sand, the moon and the egg hand);
   * fmt: 'hms' | 'auto' (Z3 «Ziffern»); size: 's' (the choice on Z3, the tile), 'm', 'l', 'xl' (full view);
   * sub: a line under the time («noch · Ende 15:02»).
   */
  import Digits from './Digits.svelte';
  import { digits } from '../timer.js';

  let { face = 'digital', sec = 0, frac = 0, fmt = 'hms', size = 'l', sub = '', label = '' } = $props();
  const uid = $props.id();
  const text = $derived(digits(sec, fmt));
  const f = $derived(Math.max(0, Math.min(1, Number(frac) || 0)));
  const TICKS = Array.from({ length: 60 }, (_, i) => i);
  const pos = (a, r) => ({ x: 120 + r * Math.sin(a), y: 120 - r * Math.cos(a) });
  const dot = $derived(pos(f * 2 * Math.PI, 104));
  const hand = $derived(pos(f * 2 * Math.PI, 26));
</script>

<div class="face {size} {face}" data-face={face}>
  {#if face === 'digital'}
    <Digits {text} {label} size={size === 's' ? 's' : size === 'm' ? 'm' : size === 'xl' ? 'xl' : 'l'} />
  {:else if face === 'big'}
    <span class="big num" role="timer" aria-label={label || text}>{text}</span>
  {:else if face === 'ring'}
    <span class="wrap" role="timer" aria-label={label || text}>
      <svg viewBox="0 0 240 240" aria-hidden="true">
        {#each TICKS as i (i)}
          {@const a = (i / 60) * 2 * Math.PI}
          {@const long = i % 5 === 0}
          {@const p1 = pos(a, long ? 92 : 97)}
          {@const p2 = pos(a, 108)}
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} class:long class:gone={i / 60 < f} />
        {/each}
        <circle cx={dot.x} cy={dot.y} r="6" class="dot" />
      </svg>
      <span class="mid"><b class="num">{text}</b>{#if sub}<small>{sub}</small>{/if}</span>
    </span>
  {:else if face === 'glass'}
    <span class="pic" role="timer" aria-label={label || text}>
      <svg viewBox="0 0 120 160" aria-hidden="true">
        <defs><clipPath id="{uid}-top"><path d="M24 18 H96 C96 52 66 66 62 80 H58 C54 66 24 52 24 18 Z" /></clipPath><clipPath id="{uid}-bot"><path d="M58 80 H62 C66 94 96 108 96 142 H24 C24 108 54 94 58 80 Z" /></clipPath></defs>
        <rect class="frame" x="16" y="10" width="88" height="8" rx="3" /><rect class="frame" x="16" y="142" width="88" height="8" rx="3" />
        <path class="glass" d="M24 18 H96 C96 52 66 66 62 80 C66 94 96 108 96 142 H24 C24 108 54 94 58 80 C54 66 24 52 24 18 Z" />
        <rect class="sand" x="20" y={18 + 62 * f} width="80" height={62 * (1 - f)} clip-path="url(#{uid}-top)" />
        <rect class="sand" x="20" y={142 - 62 * f} width="80" height={62 * f} clip-path="url(#{uid}-bot)" />
      </svg>
      <b class="num">{text}</b>
    </span>
  {:else if face === 'moon'}
    <span class="pic" role="timer" aria-label={label || text}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <defs><mask id="{uid}-m"><rect width="120" height="120" fill="white" /><circle cx={60 + 100 * (1 - f) - 2} cy="60" r="50" fill="black" /></mask></defs>
        <circle cx="60" cy="60" r="50" class="shade" />
        <circle cx="60" cy="60" r="50" class="lit" mask="url(#{uid}-m)" />
        <circle cx="44" cy="44" r="6" class="crater" /><circle cx="70" cy="76" r="8" class="crater" /><circle cx="38" cy="72" r="4" class="crater" />
      </svg>
      <b class="num">{text}</b>
    </span>
  {:else}
    <span class="pic" role="timer" aria-label={label || text}>
      <svg viewBox="0 0 120 150" aria-hidden="true">
        <path class="egg" d="M60 6 C92 6 112 60 112 92 C112 124 90 144 60 144 C30 144 8 124 8 92 C8 60 28 6 60 6 Z" />
        <circle cx="60" cy="92" r="30" class="dial" />
        <line x1="60" y1="92" x2="60" y2="68" class="hand" />
        <line x1="60" y1="92" x2={60 + (hand.x - 120)} y2={92 + (hand.y - 120)} class="hand red" />
      </svg>
      <b class="num">{text}</b>
    </span>
  {/if}
</div>

<style>
  .face {
    display: flex;
    justify-content: center;
    align-items: center;
    min-width: 0;
    color: var(--ink);
  }
  /* the sizes of a clock: its own scale, by face size (s, m, l, xl) */
  .face {
    --fs-big: clamp(56px, 14vw, 140px);
    --fs-mid: clamp(36px, 9vw, 72px);
    --fs-pic: clamp(28px, 6vw, 48px);
  }
  .face.s {
    --fs-big: 44px;
    --fs-mid: 26px;
    --fs-pic: 20px;
  }
  .face.m {
    --fs-big: 64px;
  }
  .face.xl {
    --fs-big: clamp(72px, 18vw, 220px);
  }
  .big {
    font: 800 var(--fs-big) / 1 var(--font-brand);
    letter-spacing: -0.02em;
  }
  .wrap {
    position: relative;
    display: grid;
    place-items: center;
    width: 320px;
    max-width: 100%;
    aspect-ratio: 1;
    container-type: inline-size;
  }
  .s .wrap {
    width: 150px;
  }
  .m .wrap {
    width: 240px;
  }
  .xl .wrap {
    width: 480px;
  }
  .wrap svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  line {
    stroke: var(--ink-3);
    stroke-width: 1.5;
    stroke-linecap: round;
  }
  line.long {
    stroke: var(--accent);
    stroke-width: 3;
  }
  line.gone {
    opacity: 0.3;
  }
  .dot {
    fill: var(--ink);
  }
  .mid {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  /* the time and the line under it stay inside the ticks (inner ring ≈ 70 % of the width) */
  .mid b {
    font: 800 min(var(--fs-mid), 20cqi) / 1 var(--font-brand);
  }
  .mid small {
    max-width: 58cqi;
    margin-top: 6px;
    color: var(--ink-2);
    font-size: var(--fs-body);
  }
  .pic {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .pic svg {
    width: min(60vw, 220px);
    height: auto;
  }
  .s .pic svg {
    width: 96px;
  }
  .xl .pic svg {
    width: min(60vw, 320px);
  }
  .pic b {
    font: 700 var(--fs-pic) / 1 var(--font-brand);
  }
  .frame {
    fill: var(--warn);
  }
  .glass {
    fill: none;
    stroke: var(--ink-3);
    stroke-width: 2;
  }
  .sand {
    fill: var(--warn-soft);
    stroke: var(--warn);
    stroke-width: 0.5;
  }
  .shade {
    fill: var(--paper-2);
  }
  .lit {
    fill: var(--warn-soft);
  }
  .crater {
    fill: var(--line-strong);
    opacity: 0.35;
  }
  .egg {
    fill: var(--warn-soft);
    stroke: var(--warn);
    stroke-width: 2;
  }
  .dial {
    fill: var(--paper);
    stroke: var(--warn);
    stroke-width: 3;
  }
  .hand {
    stroke: var(--ink);
    stroke-width: 3;
  }
  .hand.red {
    stroke: var(--bad);
  }
</style>
