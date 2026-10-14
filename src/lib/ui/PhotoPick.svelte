<script>
  /**
   * Kamera-Knopf (Noah, 14.10.2026 «bei Belegen immer»): two buttons for one photo. «Take photo»
   * opens the phone camera at once (capture="environment"); «Gallery» opens the picker as
   * before. On a computer without a camera the browser shows the file dialog for both, so there
   * only «Choose photo» stays. The photo never leaves the device; the caller shrinks and stores it.
   */
  import { Camera, Image as ImageIcon } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  /** onfile(file): the chosen or taken photo; busy: reading; has: a photo is already there. */
  let { onfile, busy = false, has = false, camera = 'Take photo', again = 'Other photo' } = $props();

  // a phone or tablet: a coarse pointer; a computer with a mouse gets only the file dialog
  const phone = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

  function pick(event) {
    const file = event.currentTarget.files[0];
    event.currentTarget.value = '';
    if (file) onfile?.(file);
  }
</script>

{#if busy}
  <span class="btn sm" aria-live="polite">{t('Reading…')}</span>
{:else if phone}
  <span class="pp">
    <label class="btn sm hi cam"><Camera size={18} aria-hidden="true" />{has ? t(again) : t(camera)}<input type="file" accept="image/*" capture="environment" onchange={pick} hidden /></label>
    <label class="btn sm"><ImageIcon size={18} aria-hidden="true" />{t('Gallery')}<input type="file" accept="image/*" onchange={pick} hidden /></label>
  </span>
{:else}
  <label class="btn sm"><ImageIcon size={18} aria-hidden="true" />{has ? t(again) : t('Choose photo')}<input type="file" accept="image/*" onchange={pick} hidden /></label>
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
  label :global(svg) {
    flex: none;
  }
</style>
