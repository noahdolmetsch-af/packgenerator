<script>
  /**
   * Paket L «Werkzeugkasten» (#149 Kompass): the phone's compass sensor shows north and the direction you
   * face. An iPhone asks once for permission. A computer has no sensor: the page says so.
   * Hold the phone flat; metal and magnets nearby make it wrong.
   */
  import { Navigation } from '@lucide/svelte';
  import { headingOf, directionOf } from './compass.js';
  import { t } from '../i18n.svelte.js';
  import './tools.css';

  let heading = $state(null);
  let state = $state('idle'); // idle | on | none | denied
  const has = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
  const needsAsk = has && typeof DeviceOrientationEvent.requestPermission === 'function';
  let stop = () => {};

  function listen() {
    const on = (e) => {
      const h = headingOf(e);
      if (h != null) {
        heading = h;
        state = 'on';
      }
    };
    const ev = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    window.addEventListener(ev, on);
    stop = () => window.removeEventListener(ev, on);
    setTimeout(() => state === 'idle' && heading == null && (state = 'none'), 3000);
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
</script>

<section class="tool-card compass">
  <div class="dial" style:--rot={`${-(heading ?? 0)}deg`} aria-hidden="true">
    <div class="rose">
      <span class="n">{t('N|compass')}</span><span class="e">{t('E|compass')}</span><span class="s">{t('S|compass')}</span><span class="w">{t('W|compass')}</span>
    </div>
    <Navigation class="needle" size={40} />
  </div>
  {#if heading != null}
    <p class="tool-big" aria-live="polite" data-heading={heading}>{heading}° {t(directionOf(heading))}</p>
  {:else if state === 'none'}
    <p class="tool-status">{t('This device has no compass sensor, or the browser does not share it. On the phone it works.')}</p>
  {:else if state === 'denied'}
    <p class="tool-status err">{t('The compass was not allowed. Allow motion and orientation for this site in the browser settings.')}</p>
  {:else if needsAsk}
    <button type="button" class="btn hi" onclick={start}>{t('Start compass')}</button>
  {:else}
    <p class="tool-status">{t('Waiting for the sensor …')}</p>
  {/if}
  <p class="tool-help">{t('Hold the phone flat. Metal, magnets and the bike nearby can make it wrong.')}</p>
</section>

<style>
  .dial {
    position: relative;
    width: min(260px, 70vw);
    aspect-ratio: 1;
    margin: 0 auto;
    border-radius: 50%;
    border: 2px solid var(--line-strong);
    background: var(--paper-2);
    display: grid;
    place-items: center;
  }
  .rose {
    position: absolute;
    inset: 0;
    transform: rotate(var(--rot));
    transition: transform 0.2s linear;
    font: 700 var(--fs-sub) / 1 var(--font-body);
    color: var(--ink-2);
  }
  .rose span {
    position: absolute;
  }
  .rose .n {
    top: 10px;
    left: 50%;
    translate: -50% 0;
    color: var(--hi);
  }
  .rose .s {
    bottom: 10px;
    left: 50%;
    translate: -50% 0;
  }
  .rose .e {
    right: 12px;
    top: 50%;
    translate: 0 -50%;
  }
  .rose .w {
    left: 12px;
    top: 50%;
    translate: 0 -50%;
  }
  .dial :global(.needle) {
    color: var(--ink);
  }
  @media (prefers-reduced-motion: reduce) {
    .rose {
      transition: none;
    }
  }
</style>
