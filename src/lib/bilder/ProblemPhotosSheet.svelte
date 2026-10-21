<script>
  /**
   * «Bilder in der App» 3a/4a (Noah 20.10.2026): the photos of a problem in Bike care, added later as well:
   * more photos, cut, take away, all as one PDF. Every change is saved at once (the problem row keeps
   * `photos`, `photo` = the first one for the older pages, and `docId` of the PDF).
   */
  import { X } from '@lucide/svelte';
  import PhotoSet from './PhotoSet.svelte';
  import { backClose } from '../ui/backclose.js';
  import { problemPhotos } from '../photo.js';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';

  let { task, bikeName = '', onclose } = $props();
  let dialog;
  // svelte-ignore state_referenced_locally
  let photos = $state(problemPhotos(task));
  // svelte-ignore state_referenced_locally
  let docId = $state(task.docId ?? null);
  // svelte-ignore state_referenced_locally
  let inks = $state(task.inks); // Paket NE 1146: the drawings on the photos

  $effect(() => {
    dialog.showModal();
  });
  async function save(list, doc = null, ink = undefined) {
    const clean = $state.snapshot(list);
    await db.maintenance.update(task.id, { photos: clean, photo: clean[0] ?? null, docId: doc, inks: $state.snapshot(ink) });
  }
</script>

<dialog class="sheet from-below pps" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="pps-h">
  <div class="head">
    <div>
      <p class="kick">{t('Problem')}</p>
      <h2 id="pps-h">{task.task}</h2>
    </div>
    <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <PhotoSet bind:photos bind:docId bind:inks pdfName={[bikeName, task.task].filter(Boolean).join(' · ')} label="Photos" onchange={save} />
  <p class="hint">{t('Changes are saved at once.')}</p>
  <div class="foot daumen-foot">
    <button type="button" class="btn hi" onclick={() => dialog.close()}>{t('Done')}</button>
  </div>
</dialog>

<style>
  .pps {
    width: min(520px, calc(100vw - 24px));
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 12px;
  }
  .kick {
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  h2 {
    margin: 2px 0 0;
    font-size: var(--fs-section);
    overflow-wrap: break-word;
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -6px -6px 0 0;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .hint {
    margin: 10px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .foot {
    display: flex;
    gap: 8px;
    margin-top: 14px;
  }
</style>
