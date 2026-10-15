<script>
  /**
   * KT «Kacheln antippbar» (Noah 14.10.2026, 3a, mockup KT3): the short intro on Today, once after the
   * update. The page dims, one element stays light with a frame, a bubble says what it does: the first
   * small tile, the first activity in «Im Flow», «Customise the start page». «Next n/3», «Skip» and Esc;
   * «Done» on the last step. The rules (which steps, when, where the bubble goes) live in introkt.js.
   * onend: finished or skipped (Home stores it).
   */
  import { onMount, tick } from 'svelte';
  import { introSteps, nextStep, mainLabel, bubblePlace } from './introkt.js';
  import { t } from '../i18n.svelte.js';

  let { onend } = $props();

  // the first element of a step that is really on the screen (a hidden tile does not count)
  const find = (sel) => [...document.querySelectorAll(sel)].find((el) => el.getClientRects().length > 0) ?? null;
  let steps = $state([]);
  let i = $state(0);
  let rect = $state(null);
  let bw = $state(320);
  let bh = $state(180);
  let vw = $state(390);
  let vh = $state(844);
  let mainBtn = $state(null);
  let bub = $state(null);
  const step = $derived(steps[i] ?? null);
  const main = $derived(mainLabel(i, steps.length));
  const place = $derived(rect ? bubblePlace(rect, { vw, vh, bw, bh }) : null);

  function measure() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    const el = step ? find(step.sel) : null;
    const r = el?.getBoundingClientRect();
    rect = r ? { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right } : null;
  }
  async function show() {
    const el = step ? find(step.sel) : null;
    el?.scrollIntoView({ block: 'center', inline: 'nearest' });
    measure();
    await tick();
    mainBtn?.focus({ preventScroll: true });
  }
  onMount(() => {
    steps = introSteps((sel) => !!find(sel));
    if (!steps.length) return onend?.();
    show();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  });
  function next() {
    const n = nextStep(i, steps.length);
    if (n == null) return onend?.();
    i = n;
    show();
  }
  // Esc ends it; Tab stays in the bubble
  function onkey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onend?.();
    } else if (e.key === 'Tab' && bub) {
      const f = [...bub.querySelectorAll('button')];
      const at = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(at + (e.shiftKey ? f.length - 1 : 1)) % f.length]?.focus();
    }
  }
</script>

<svelte:window onkeydown={onkey} />

{#if step}
  <!-- KT: the dim page catches every tap, so nothing under it opens by mistake -->
  <div class="kt-dim" class:full={!rect} aria-hidden="true" data-intro-dim></div>
  {#if rect}<div class="kt-hole" aria-hidden="true" style:top="{rect.top - 6}px" style:left="{rect.left - 6}px" style:width="{rect.width + 12}px" style:height="{rect.height + 12}px"></div>{/if}
  <div
    class="kt-bub"
    class:above={place && !place.below}
    role="dialog"
    aria-modal="true"
    aria-label={t('Start page intro')}
    data-intro-step={step.id}
    bind:this={bub}
    bind:clientWidth={bw}
    bind:clientHeight={bh}
    style:top={place ? `${place.top}px` : null}
    style:left={place ? `${place.left}px` : null}
    style:--arrow={place ? `${place.arrow}px` : null}
  >
    <h2 class="kt-t">{t(step.title)}</h2>
    <p class="kt-x">{t(step.text)}{#if step.key}{' '}<b>{t(step.key)}</b> {t(step.more)}{/if}</p>
    <div class="kt-f">
      <span class="kt-dots" aria-hidden="true">{#each steps as s, k (s.id)}<span class:on={k === i}></span>{/each}</span>
      <button type="button" class="kt-skip" onclick={() => onend?.()}>{t('Skip|intro')}</button>
      <button type="button" class="btn hi kt-go" bind:this={mainBtn} onclick={next}>{t(main.key, main.vars)}</button>
    </div>
  </div>
{/if}

<style>
  .kt-dim {
    position: fixed;
    inset: 0;
    z-index: 60;
  }
  .kt-dim.full {
    background: color-mix(in srgb, var(--ink) 45%, transparent);
  }
  /* the light hole around the element: the rest of the page dims through its big shadow */
  .kt-hole {
    position: fixed;
    z-index: 61;
    border: 3px solid var(--hi);
    border-radius: 22px;
    box-shadow: 0 0 0 200vmax color-mix(in srgb, var(--ink) 45%, transparent);
    pointer-events: none;
    transition: top 0.2s ease, left 0.2s ease, width 0.2s ease, height 0.2s ease;
  }
  .kt-bub {
    position: fixed;
    top: 50%;
    left: 12px;
    z-index: 62;
    width: min(340px, calc(100vw - 24px));
    padding: 16px 18px 14px;
    border-radius: var(--radius-card);
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 12px 40px var(--shadow);
  }
  /* the little arrow to the element */
  .kt-bub::before {
    content: '';
    position: absolute;
    top: -7px;
    left: calc(var(--arrow, 40px) - 8px);
    width: 16px;
    height: 16px;
    background: var(--paper);
    transform: rotate(45deg);
  }
  .kt-bub.above::before {
    top: auto;
    bottom: -7px;
  }
  .kt-t {
    margin: 0 0 4px;
    font: 600 var(--fs-body)/1.3 var(--font-body);
  }
  .kt-x {
    margin: 0 0 12px;
    color: var(--ink-2);
    line-height: 1.4;
  }
  .kt-x b {
    color: var(--ink);
    font-weight: 600;
  }
  .kt-f {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 4px 10px;
  }
  .kt-dots {
    display: inline-flex;
    gap: 6px;
    margin-right: auto;
  }
  .kt-dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--line-strong);
  }
  .kt-dots span.on {
    background: var(--accent);
  }
  .kt-skip {
    min-height: 44px;
    padding: 0 6px;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .kt-go {
    white-space: nowrap;
  }
  @media (prefers-reduced-motion: reduce) {
    .kt-hole {
      transition: none;
    }
  }
</style>
