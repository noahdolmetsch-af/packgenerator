<script>
  /**
   * Paket L «Werkzeugkasten» (Wasserwaage, Noah 19.10.2026): the phone's motion sensor shows how crooked
   * a surface is: flat on a table both ways (bubble), on its edge one angle. «Set to zero» keeps the
   * offset of a crooked case; «Back to the sensor» clears it. The slope in percent for a road or ramp.
   */
  import { tiltOf, angleOf, bubbleOf, isLevel, isEdge, slopePct } from './level.js';
  import { loadTool, saveTool } from './toolstore.js';
  import { t } from '../i18n.svelte.js';
  import './tools.css';

  let tilt = $state(null);
  let zero = $state({ x: 0, y: 0 });
  let state = $state('idle'); // idle | on | none | denied
  const has = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
  const needsAsk = has && typeof DeviceOrientationEvent.requestPermission === 'function';
  let stop = () => {};
  loadTool('level', null).then((z) => z && (zero = z));

  function listen() {
    const on = (e) => {
      const v = tiltOf(e);
      if (v) {
        tilt = v;
        state = 'on';
      }
    };
    window.addEventListener('deviceorientation', on);
    stop = () => window.removeEventListener('deviceorientation', on);
    setTimeout(() => state === 'idle' && !tilt && (state = 'none'), 3000);
  }
  async function start() {
    if (!has) return (state = 'none');
    if (needsAsk) {
      try {
        if ((await DeviceOrientationEvent.requestPermission()) !== 'granted') return (state = 'denied');
      } catch {
        return (state = 'denied');
      }
    }
    listen();
  }
  $effect(() => {
    if (!needsAsk) start();
    return () => stop();
  });
  const angle = $derived(angleOf(tilt, zero));
  const bubble = $derived(bubbleOf(tilt, zero));
  const edge = $derived(isEdge(tilt));
  const setZero = () => tilt && ((zero = { x: tilt.x, y: tilt.y }), saveTool('level', zero).catch(() => {}));
  const clearZero = () => ((zero = { x: 0, y: 0 }), saveTool('level', zero).catch(() => {}));
</script>

<section class="tool-card level">
  <div class={['glass', { edge, ok: isLevel(angle) }]} aria-hidden="true">
    <span class="mark"></span>
    <span class="bubble" style:--bx={bubble.x} style:--by={bubble.y}></span>
  </div>
  {#if tilt}
    <p class="tool-big" aria-live="polite" data-angle={angle}>
      {isLevel(angle) ? t('Level') : `${Math.abs(angle).toFixed(1)}°`}
      <small class="tool-muted">{t('{pct} % slope', { pct: slopePct(angle) })}</small>
    </p>
    <div class="tool-row">
      <button type="button" class="btn" onclick={setZero}>{t('Set to zero here')}</button>
      {#if zero.x || zero.y}<button type="button" class="btn btn-link" onclick={clearZero}>{t('Back to the sensor')}</button>{/if}
    </div>
  {:else if state === 'none'}
    <p class="tool-status">{t('This device has no motion sensor, or the browser does not share it. On the phone it works.')}</p>
  {:else if state === 'denied'}
    <p class="tool-status err">{t('Motion was not allowed. Allow motion and orientation for this site in the browser settings.')}</p>
  {:else if needsAsk}
    <button type="button" class="btn hi" onclick={start}>{t('Start level')}</button>
  {:else}
    <p class="tool-status">{t('Waiting for the sensor …')}</p>
  {/if}
  <p class="tool-help">{t('Lay the phone flat on the surface, or stand it on its long edge. Is the case crooked? Lay it on something level and tap «Set to zero here».')}</p>
</section>

<style>
  .glass {
    position: relative;
    width: min(240px, 66vw);
    aspect-ratio: 1;
    margin: 0 auto;
    border-radius: 50%;
    border: 2px solid var(--line-strong);
    background: var(--paper-2);
  }
  .glass.edge {
    aspect-ratio: 5 / 1;
    width: min(320px, 80vw);
    border-radius: 999px;
  }
  .mark {
    position: absolute;
    inset: 0;
    margin: auto;
    width: 56px;
    height: 56px;
    border: 2px dashed var(--line-strong);
    border-radius: 50%;
  }
  .edge .mark {
    width: 52px;
    height: 70%;
  }
  .bubble {
    position: absolute;
    inset: 0;
    margin: auto;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--ink-3);
    translate: calc(var(--bx) * -40%  * 2.2) calc(var(--by) * -40% * 2.2);
    transition: translate 0.15s linear;
  }
  .edge .bubble {
    height: 36px;
    width: 36px;
    translate: calc(var(--bx) * -350%) 0;
  }
  .ok .bubble {
    background: var(--hi);
  }
  .tool-big small {
    display: block;
    font-weight: 500;
  }
  @media (prefers-reduced-motion: reduce) {
    .bubble {
      transition: none;
    }
  }
</style>
