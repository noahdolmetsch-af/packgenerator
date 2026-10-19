<script>
  /**
   * Kamera-Knopf (Noah, 14.10.2026 «bei Belegen immer»): two buttons for one photo. «Take photo»
   * opens the phone camera at once (capture="environment"); «Gallery» opens the picker as
   * before. On a computer without a camera the browser shows the file dialog for both, so there
   * only «Choose photo» stays. The photo never leaves the device; the caller shrinks and stores it.
   * P3b Teil 3 «Kamera überall» (Noah 15.10.2026 «1-5 a»): big: the camera is one big green button
   * («Beleg fotografieren») with a small «Galerie» beside it; pages: after the first photo the camera
   * says «Weitere Seite» and the caller adds a page; first: the camera opens at once (Neu › Werkstattbesuch).
   */
  import { onMount } from 'svelte';
  import { Camera, Image as ImageIcon } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  /** onfile(file): the chosen or taken photo; busy: reading; has: a photo is already there. */
  let { onfile, busy = false, has = false, camera = 'Take photo', again = 'Other photo', big = false, pages = false, first = false } = $props();
  let camEl = $state(null);

  // a phone or tablet: a coarse pointer; a computer with a mouse gets only the file dialog
  const phone = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

  function pick(event) {
    const file = event.currentTarget.files[0];
    event.currentTarget.value = '';
    if (file) onfile?.(file);
  }
  // the tap on «Werkstattbesuch» still counts as the person's own tap a moment later, so the camera may open
  onMount(() => {
    if (first && phone && !has) camEl?.click();
  });
  const camText = $derived(has ? t(pages ? 'Another page' : again) : t(camera));
</script>

{#if busy}
  <span class="btn sm" aria-live="polite">{t('Reading…')}</span>
{:else if phone}
  <span class="pp" class:big>
    <label class="btn hi cam" class:sm={!big}><Camera size={big ? 22 : 18} aria-hidden="true" />{camText}<input bind:this={camEl} type="file" accept="image/*" capture="environment" onchange={pick} hidden /></label>
    <label class="btn sm"><ImageIcon size={18} aria-hidden="true" />{t('Gallery')}<input type="file" accept="image/*" onchange={pick} hidden /></label>
  </span>
{:else}
  <label class="btn sm"><ImageIcon size={18} aria-hidden="true" />{has ? t(pages ? 'Another page' : again) : t('Choose photo')}<input type="file" accept="image/*" onchange={pick} hidden /></label>
{/if}

<style>
  .pp {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
  }
  .cam {
    flex: 1 1 auto;
    justify-content: center;
    font-weight: 600;
  }
  .big .cam {
    flex: 1 1 60%;
    min-height: 56px;
    font-size: var(--fs-body);
  }
  .big {
    align-items: stretch;
  }
  label :global(svg) {
    flex: none;
  }
</style>
