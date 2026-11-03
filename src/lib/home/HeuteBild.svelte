<script>
  /**
   * «Paket G» (Noah 03.11.2026 «a»): the drawn landscape at the top of Today, with the next trip and its countdown
   * («Noch 12 Tage bis Bodensee-Runde»). Drawn in code like the landscape of the tour page, works offline. The sky
   * follows the day clock (morning, day, evening, night) and turns grey when the weather line expects rain.
   * It is a still picture (nothing moves, so «Bewegung reduzieren» changes nothing); a tap opens the trip.
   * trip: the trip it is about; line: { kind, n, m } from bildOf (heutebild.js); mood: moodOf; weather: the
   * weather sentence of Today or ''; href / onopen: where a tap goes. Switch it off in Ich › Darstellung › Bedienung.
   */
  import { t, tn } from '../i18n.svelte.js';

  let { trip, line, mood = 'day', weather = '', href = '#/', onopen = () => {} } = $props();

  let w = $state(640);
  const W = $derived(Math.max(300, Math.round(w || 640)));
  const H = 150;
  const wave = (amp, base, f, ph) => `M0,${H} ` + Array.from({ length: 41 }, (_, i) => `L${((i / 40) * W).toFixed(1)},${(base - amp * Math.sin(i / f + ph)).toFixed(1)}`).join(' ') + ` L${W},${H} Z`;
  const sun = $derived({ cx: W * 0.82, cy: mood === 'morning' || mood === 'evening' ? 70 : 38 });
  const words = $derived.by(() => {
    const title = trip?.title ?? '';
    if (line.kind === 'days') return tn(line.n, '{n} day to go until {trip}', '{n} days to go until {trip}', { trip: title });
    if (line.kind === 'tomorrow') return t('Tomorrow it starts: {trip}', { trip: title });
    if (line.kind === 'today') return t('Today: {trip}', { trip: title });
    return t('{trip}, day {n} of {m}', { trip: title, n: line.n, m: line.m });
  });
  // the stars of the night, fixed places (no random: the picture is the same at every draw)
  const STARS = [
    [0.08, 20], [0.19, 46], [0.31, 14], [0.43, 38], [0.55, 18], [0.66, 52], [0.74, 12], [0.9, 40],
  ];
</script>

<a class="bild {mood}" {href} onclick={onopen} bind:clientWidth={w} data-heutebild data-mood={mood}>
  <svg viewBox="0 0 {W} {H}" aria-hidden="true" preserveAspectRatio="none">
    {#if mood === 'night'}
      {#each STARS as [x, y] (x)}<circle cx={x * W} cy={y} r="1.3" class="stern" />{/each}
      <circle cx={sun.cx} cy={sun.cy} r="15" class="moon" />
      <circle cx={sun.cx + 7} cy={sun.cy - 3} r="13" class="bite" />
    {:else if mood === 'rain'}
      <g class="cloud"><ellipse cx={W * 0.74} cy="34" rx="34" ry="13" /><ellipse cx={W * 0.74 - 22} cy="40" rx="20" ry="10" /><ellipse cx={W * 0.74 + 24} cy="41" rx="22" ry="10" /></g>
      <g class="drops">{#each [0, 1, 2, 3, 4] as i (i)}<path d="M{W * 0.74 - 30 + i * 15},56 l-3,10" />{/each}</g>
    {:else}
      <circle cx={sun.cx} cy={sun.cy} r="19" class="sun" />
    {/if}
    <path d={wave(16, 82, 5, 0.6)} class="h1" />
    <path d={wave(12, 108, 3.4, 2)} class="h2" />
    <path d="M0,{H} V{H - 8} Q{W * 0.25},{H - 20} {W * 0.5},{H - 12} T{W},{H - 16} V{H} Z" class="h3" />
    <!-- a rider on the road, small, drawn in lines -->
    <g class="rider" transform="translate({W * 0.16},{H - 24})"><circle cx="0" cy="8" r="7" /><circle cx="28" cy="8" r="7" /><path d="M0 8 L11 8 L17 -4 L23 -4 L28 8 M11 8 L17 -4 M13 -6 h7" /></g>
  </svg>
  <span class="txt"><b data-heutebild-line>{words}</b>{#if weather}<span data-heutebild-wx>{weather}</span>{/if}</span>
</a>

<style>
  .bild {
    --a: #cfe6f5;
    --b: #f4e6c8;
    --hill: #7fae8d;
    --ink-on: #10201a;
    --sunc: #f6d676;
    --moonc: #f3efd8;
    --cloudc: #f2f5f7;
    --dropc: #6f8497;
    --grass: #1b3a29;
    position: relative;
    display: block;
    height: 150px;
    overflow: hidden;
    border-radius: var(--radius-card);
    background: linear-gradient(var(--a), var(--b));
    color: var(--ink-on);
    text-decoration: none;
  }
  .morning {
    --a: #f6d9b4;
    --b: #fbeedd;
  }
  .evening {
    --a: #c9b8d9;
    --b: #f4c9a0;
  }
  .rain {
    --a: #b7c3cc;
    --b: #dde3e7;
  }
  .night {
    --a: #1c2a44;
    --b: #34456a;
    --bitec: #1c2a44;
    --hill: #3f6b50;
    --ink-on: #f0f6f2;
  }
  :global(:root[data-theme='dark']) .morning {
    --a: #7a5a3a;
    --b: #a98a63;
  }
  :global(:root[data-theme='dark']) .day {
    --a: #35607f;
    --b: #6f8a99;
  }
  :global(:root[data-theme='dark']) .evening {
    --a: #4a3d63;
    --b: #8a5b46;
  }
  :global(:root[data-theme='dark']) .rain {
    --a: #3c4750;
    --b: #5a666e;
  }
  :global(:root[data-theme='dark']) .morning,
  :global(:root[data-theme='dark']) .day,
  :global(:root[data-theme='dark']) .evening,
  :global(:root[data-theme='dark']) .rain {
    --ink-on: #f0f6f2;
  }
  svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .sun {
    fill: var(--sunc);
  }
  .moon {
    fill: var(--moonc);
  }
  .bite {
    fill: var(--bitec, var(--a));
  }
  .stern {
    fill: var(--moonc);
    opacity: 0.8;
  }
  .cloud ellipse {
    fill: var(--cloudc);
  }
  .drops path {
    fill: none;
    stroke: var(--dropc);
    stroke-width: 2;
    stroke-linecap: round;
  }
  .h1 {
    fill: color-mix(in srgb, var(--hill) 70%, var(--b));
  }
  .h2 {
    fill: color-mix(in srgb, var(--hill) 90%, var(--a));
  }
  .h3 {
    fill: color-mix(in srgb, var(--accent) 70%, var(--grass));
  }
  .rider {
    fill: none;
    stroke: var(--ink-on);
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .txt {
    position: absolute;
    left: 16px;
    right: 16px;
    top: 14px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-width: 66%;
  }
  .txt b {
    font: 700 var(--fs-sub) / 1.2 var(--font-body);
    overflow-wrap: break-word;
  }
  .txt span {
    font-size: var(--fs-small);
    opacity: 0.85;
  }
  .bild:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }
  @media (min-width: 900px) {
    .bild {
      height: 170px;
    }
    .txt b {
      font-size: var(--fs-section);
    }
  }
</style>
