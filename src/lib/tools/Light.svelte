<script>
  /**
   * Paket L «Werkzeugkasten» (Lupe + Taschenlampe, Noah 19.10.2026): the back camera as a magnifier for
   * small print (tyre sizes, serial numbers), with zoom and «Hold picture»; the camera light as a torch.
   * Without a camera light, «White screen» lights up with the display. Nothing is recorded.
   */
  import { Flashlight, ZoomIn, Pause, Play } from '@lucide/svelte';
  import { backCamera, stopStream, abilities, tune, cameraError } from './camera.js';
  import { t } from '../i18n.svelte.js';
  import './tools.css';

  let video = $state();
  let stream = null;
  let on = $state(false);
  let err = $state('');
  let can = $state({ torch: false, zoom: null });
  let zoom = $state(1);
  let torch = $state(false);
  let held = $state(false);
  let white = $state(false);

  async function start() {
    err = '';
    try {
      stream = await backCamera({ width: 1920 });
    } catch (e) {
      err = cameraError(e);
      return;
    }
    on = true;
    await Promise.resolve();
    video.srcObject = stream;
    await video.play().catch(() => {});
    can = abilities(stream);
    zoom = can.zoom ? Math.min(can.zoom.max, Math.max(can.zoom.min, 2)) : 2;
    if (can.zoom) tune(stream, { zoom });
  }
  function stop() {
    stopStream(stream);
    stream = null;
    on = false;
    torch = false;
    held = false;
  }
  $effect(() => () => stop());
  async function setZoom(v) {
    zoom = Number(v);
    if (can.zoom) await tune(stream, { zoom });
  }
  async function toggleTorch() {
    if (await tune(stream, { torch: !torch })) torch = !torch;
  }
  function hold() {
    held = !held;
    if (held) video.pause();
    else video.play().catch(() => {});
  }
  const cssZoom = $derived(can.zoom ? 1 : zoom);
</script>

<section class="tool-card light">
  {#if on}
    <div class="l-frame">
      <!-- svelte-ignore a11y_media_has_caption -->
      <video class="tool-cam" bind:this={video} playsinline muted style:scale={cssZoom}></video>
    </div>
    <label class="tool-field"><span><ZoomIn size={14} aria-hidden="true" /> {t('Zoom')} {zoom.toFixed(1)}×</span>
      <input type="range" min={can.zoom?.min ?? 1} max={can.zoom?.max ?? 4} step={can.zoom?.step ?? 0.1} value={zoom} oninput={(e) => setZoom(e.currentTarget.value)} />
    </label>
    <div class="tool-row">
      <button type="button" class="btn" aria-pressed={held} onclick={hold}>
        {#if held}<Play size={16} aria-hidden="true" />{t('Go on')}{:else}<Pause size={16} aria-hidden="true" />{t('Hold picture')}{/if}
      </button>
      {#if can.torch}
        <button type="button" class={['btn', { hi: torch }]} aria-pressed={torch} onclick={toggleTorch}><Flashlight size={16} aria-hidden="true" />{torch ? t('Light off') : t('Light on')}</button>
      {/if}
      <button type="button" class="btn btn-link" onclick={stop}>{t('Stop camera')}</button>
    </div>
    {#if !can.torch}<p class="tool-muted">{t('This camera has no light the browser can switch on. Use «White screen».')}</p>{/if}
  {:else}
    <div class="tool-row">
      <button type="button" class="btn hi" onclick={start}><ZoomIn size={16} aria-hidden="true" />{t('Magnifier and light')}</button>
      <button type="button" class="btn" onclick={() => (white = true)}><Flashlight size={16} aria-hidden="true" />{t('White screen')}</button>
    </div>
  {/if}
  {#if err}
    <p class="tool-status err">{err === 'denied' ? t('The camera was not allowed. Allow the camera for this site in the browser settings.') : t('No camera found on this device.')}</p>
  {/if}
  <p class="tool-help">{t('For small print like tyre sizes and frame numbers. «Hold picture» keeps what you see, so you can read it calmly.')}</p>
</section>

{#if white}
  <button type="button" class="l-white" onclick={() => (white = false)}>{t('Tap to end')}</button>
{/if}

<style>
  .l-frame {
    overflow: hidden;
    border-radius: var(--radius-card);
  }
  .l-frame video {
    display: block;
    transform-origin: center;
  }
  input[type='range'] {
    width: 100%;
  }
  .l-white {
    position: fixed;
    inset: 0;
    z-index: 1000;
    border: 0;
    background: white;
    color: var(--ink-3);
    font-size: var(--fs-small);
    display: grid;
    align-items: end;
    padding-bottom: 32px;
  }
</style>
