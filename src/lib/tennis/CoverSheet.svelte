<script>
  /**
   * Paket P4 «Aktiv», mockup TN4 «Titelbild für Tennis»: a photo from the device, made small (it stays on
   * this device and goes into the backup), the crop moved up or down, another photo or none.
   * onsave({ cover, y }) saves; cover null means «Ohne Bild». name: the sport (Tennis by default; «Bild pro
   * Sportart», Noah 27.10.2026 «1a», uses it for every sport).
   */
  import { untrack } from 'svelte';
  import { X } from '@lucide/svelte';
  import PhotoPick from '../ui/PhotoPick.svelte';
  import { backClose } from '../ui/backclose.js';
  import { shrinkImage } from '../photo.js';
  import { t } from '../i18n.svelte.js';

  let { cover = null, y = 50, name = '', onsave, onclose } = $props();

  let src = $state(untrack(() => cover));
  let pos = $state(untrack(() => y));
  let busy = $state(false);
  let err = $state('');
  let dialog;
  $effect(() => {
    if (!dialog.open) dialog.showModal();
  });
  async function pick(file) {
    busy = true;
    err = '';
    try {
      src = await shrinkImage(file, 1000, 0.78);
      pos = 50;
    } catch (e) {
      err = e?.message ?? t('This photo could not be read. Please choose a JPG or PNG.');
    } finally {
      busy = false;
    }
  }
  async function take() {
    await onsave?.({ cover: src, y: pos });
    dialog.close();
  }
</script>

<dialog class="sheet from-below tn-cs" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="tn-cs-h" data-cover-sheet>
  <div class="tn-cs-head">
    <h2 id="tn-cs-h">{t('Cover photo for {sport}', { sport: name || t('Tennis') })}</h2>
    <button type="button" class="tn-cs-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <p class="tn-cs-fine">{t('A photo from this device. It is made small, stays on this device and goes into the backup.')}</p>
  {#if src}
    <div class="tn-cs-prev"><img {src} alt={t('Cover photo')} style:object-position="50% {pos}%" data-cover-preview /></div>
    <label class="tn-cs-lab">{t('Move the crop')}<input type="range" min="0" max="100" step="1" bind:value={pos} data-cover-y /></label>
  {:else}
    <p class="tn-cs-none" data-cover-empty>{t('No photo yet. The page shows a calm colour instead.')}</p>
  {/if}
  {#if err}<p class="tn-cs-err" role="alert">{err}</p>{/if}
  <div class="tn-cs-pick"><PhotoPick onfile={pick} {busy} has={!!src} /></div>
  <div class="tn-cs-foot">
    {#if src}<button type="button" class="btn" onclick={() => (src = null)} data-cover-none>{t('No picture')}</button>{/if}
    <button type="button" class="btn hi" onclick={take} disabled={busy} data-cover-save>{t('Apply')}</button>
  </div>
</dialog>

<style>
  .tn-cs {
    width: min(480px, calc(100vw - 24px));
  }
  .tn-cs-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .tn-cs-head h2 {
    margin: 0;
    font-size: var(--fs-section);
    overflow-wrap: break-word;
  }
  .tn-cs-x {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -6px -6px 0 0;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .tn-cs-fine,
  .tn-cs-none {
    margin: 4px 0 10px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .tn-cs-err {
    margin: 6px 0;
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .tn-cs-prev {
    overflow: hidden;
    border-radius: var(--radius-card);
    aspect-ratio: 16 / 7;
    background: var(--paper-2);
  }
  .tn-cs-prev img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .tn-cs-lab {
    display: grid;
    gap: 4px;
    margin: 10px 0;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
  .tn-cs-lab input {
    min-height: 44px;
  }
  .tn-cs-pick {
    margin: 8px 0;
  }
  .tn-cs-foot {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .tn-cs-foot .btn {
    min-height: 44px;
  }
</style>
