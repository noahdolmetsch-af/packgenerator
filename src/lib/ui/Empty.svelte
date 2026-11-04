<script>
  /**
   * v0.67.0 «Übergänge 1» (kit, rule U7): an empty view says in one sentence why it is empty and
   * offers the matching action. text: the sentence; action: { label, href?, onclick? }.
   * v0.99.0 Design-Refresh R3 (G3 «Leer»): a calm card in the middle, the icon in a soft circle, an
   * optional short title above the sentence and the action as a normal button below.
   * v0.127.0 A-U2 «Leer, Laden, Fehler: überall gleich» (mockup «Leerzustand», Noah 13.10.2026 «A-U1–A-U5
   * freigeben»): the one building block for every empty list and page. The first action is the main
   * button, `action2` a second one beside it, `children` a quiet line below (e.g. a link). `level` makes
   * the title a heading (h2–h4, `headId` its id), e.g. inside a section that names itself by it.
   * «Neuer Schwung» Laden und leer (block B11, Noah 27.10.2026 «1a 2a 3a», «alle anderen Vorschläge umsetzen»):
   * with an icon the block shows a small drawn picture (a soft card with two lines, the icon in a bubble on its
   * corner) that rises in gently when the view opens; still with «Bewegung reduzieren».
   */
  import Murmeltier from '../murmeltier/Murmeltier.svelte'; // «Ein Murmeltier als Begleiter» (Idee 28)
  import { ops } from '../bedienung.svelte.js';
  import { SCENES, sceneFor } from './emptyscene.js';
  let { text, title = '', level = 0, headId = undefined, action = null, action2 = null, icon = null, children = null, scene = '' } = $props();
  // «Leere Seiten mit Velo-Szenen» (Noah 03.11.2026 «b», Paket D, Idee 19): the drawing is a small scene of the bike world
  // (a bike on the wall, a tent under stars, an empty bike rack); the page's area picks it, `scene` forces one.
  const which = $derived(SCENES.includes(scene) ? scene : sceneFor(globalThis.location?.hash));
</script>

{#snippet btn(a, main)}
  {#if a.href}<a class="btn" class:hi={main} href={a.href} onclick={a.onclick} data-explain={a.explain}>{a.label}</a>
  {:else}<button type="button" class="btn" class:hi={main} onclick={a.onclick} data-explain={a.explain}>{a.label}</button>{/if}
{/snippet}

<div class="empty" data-empty>
  {#if icon}{@const Icon = icon}
    <span class="pic" aria-hidden="true" data-empty-pic>
      <svg class="sheet" viewBox="0 0 120 84" data-scene={which}>
        {#if which === 'tent'}
          <g class="star"><circle cx="16" cy="16" r="1.8" /><circle cx="40" cy="8" r="1.8" /><circle cx="68" cy="14" r="1.8" /><circle cx="28" cy="34" r="1.8" /></g>
          <path class="fill" d="M22 72 L58 26 L94 72Z" /><path class="cut" d="M50 72 L58 46 L66 72Z" /><path class="draw" d="M22 72 L58 26 L94 72 M8 72 H112" />
        {:else if which === 'rack'}
          <path class="draw" d="M6 72 H114" />
          <path class="draw" d="M18 72V48Q18 36 28 36Q38 36 38 48V72M50 72V48Q50 36 60 36Q70 36 70 48V72M82 72V48Q82 36 92 36Q102 36 102 48V72" />
        {:else}
          <rect class="fill" x="4" y="8" width="104" height="66" rx="12" />
          <path class="draw" d="M62 12V32" /><circle class="draw" cx="62" cy="11" r="2.4" />
          <g class="draw"><circle cx="26" cy="58" r="13.5" /><circle cx="86" cy="58" r="13.5" /><path d="M26 58 L50 58 L62 38 L77 38 L86 58 M50 58 L62 38 M44 31 H56" /></g>
          <path class="draw" d="M4 76 H108" />
        {/if}
      </svg>
      <span class="ring"><Icon size={20} /></span>
      {#if ops.murmeltier}<span class="mmw"><Murmeltier size={40} /></span>{/if}
    </span>
  {/if}
  {#if title && level}<svelte:element this={`h${level}`} class="head" id={headId}>{title}</svelte:element>
  {:else if title}<b class="head">{title}</b>{/if}
  <p>{text}</p>
  {#if action || action2}
    <div class="acts">
      {#if action}{@render btn(action, true)}{/if}
      {#if action2}{@render btn(action2, false)}{/if}
    </div>
  {/if}
  {#if children}<div class="more">{@render children()}</div>{/if}
</div>

<style>
  .empty {
    display: grid;
    justify-items: center;
    gap: 10px;
    padding: var(--sp-5) var(--sp-4);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    color: var(--ink-2);
    text-align: center;
  }
  .pic {
    position: relative;
    display: block;
    width: 120px;
    height: 84px;
    margin-bottom: 4px;
  }
  .sheet {
    width: 100%;
    height: 100%;
  }
  .sheet .fill {
    fill: color-mix(in srgb, var(--hi) 12%, var(--paper));
  }
  .sheet .cut {
    fill: var(--paper);
  }
  .sheet .star circle {
    fill: var(--hi);
  }
  .sheet .draw,
  .sheet .draw :is(path, circle) {
    fill: none;
    stroke: var(--hi);
    stroke-width: 3.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .mmw {
    position: absolute;
    left: -34px;
    bottom: -2px;
  }
  .ring {
    position: absolute;
    right: -6px;
    top: 4px;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--paper);
    box-shadow: 0 1px 4px var(--shadow);
    color: var(--hi);
  }
  @media (prefers-reduced-motion: no-preference) {
    .pic {
      animation: em-rise 480ms var(--ease-out) both;
    }
    .ring {
      animation: em-pop 360ms var(--ease-out) 260ms both;
    }
    .sheet .draw,
    .sheet .draw :is(path, circle) {
      stroke-dasharray: 400;
      animation: em-draw 700ms var(--ease-out) 160ms both;
    }
  }
  @keyframes em-rise {
    from {
      opacity: 0;
      translate: 0 8px;
    }
  }
  @keyframes em-pop {
    from {
      opacity: 0;
      scale: 0.6;
    }
  }
  @keyframes em-draw {
    from {
      stroke-dashoffset: 400;
    }
  }
  .head {
    margin: 0;
    color: var(--ink);
    font-size: var(--fs-sub);
    font-weight: 600;
  }
  p {
    margin: 0;
    max-width: 30em;
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--sp-2);
  }
  .more {
    max-width: 30em;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
</style>
