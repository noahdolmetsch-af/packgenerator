<script>
  /**
   * P3b Teil 3 «Kamera überall» (Noah 15.10.2026 «1-5 a»): a camera button wherever a photo is added
   * (Notiz, Material, Velo, Setup, Problem). It opens the phone camera at once (capture="environment"),
   * beside the picker that was there before. Only on a phone or tablet: a computer has the file dialog.
   * onchange: the same handler as the picker beside it (it reads event.currentTarget.files).
   */
  import { Camera } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { onchange, label = 'Take photo', disabled = false, icon = false } = $props();

  const phone = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
</script>

{#if phone}
  <label class={icon ? 'tb camb' : 'btn sm hi camb'} aria-label={icon ? t(label) : undefined} data-camera>
    <Camera size={18} aria-hidden="true" />{#if !icon}{t(label)}{/if}<input type="file" accept="image/*" capture="environment" {onchange} {disabled} hidden />
  </label>
{/if}

<style>
  .camb {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
  .tb {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    box-sizing: border-box;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
  }
  .camb :global(svg) {
    flex: none;
  }
</style>
