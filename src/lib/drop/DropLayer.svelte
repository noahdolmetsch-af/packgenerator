<script>
  /**
   * «Datei auf das Fenster ziehen» (Noah 23.11.2026 «3a»), on a computer: a file dragged over any window of the app shows
   * «Loslassen zum Öffnen»; dropped, a sheet asks «Was soll mit dieser Datei geschehen?» with the kind it found and a suggestion.
   * «Abbrechen» is the default and has the focus: nothing is kept without a choice. Same split as the share target of the phone
   * (dropkind.js, send.js). A drop field of a page (Dokumente-Scan) keeps its priority: when it took the event, this layer stays out.
   */
  import { onMount, tick } from 'svelte';
  import { FileUp, X } from '@lucide/svelte';
  import { t, tn } from '../i18n.svelte.js';
  import { backClose } from '../ui/backclose.js';
  import { planDrop } from './dropkind.js';
  import { stash, open } from './send.js';

  let over = $state(false);
  let plan = $state(null); // { kind, files, left }
  let error = $state('');
  let dialog = $state(null);
  let cancel = $state(null);

  const hasFiles = (e) => [...(e.dataTransfer?.types ?? [])].includes('Files');

  onMount(() => {
    // only where a mouse can drag a file in (a computer); a phone has the share sheet
    if (typeof matchMedia === 'function' && !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const move = (e) => {
      if (!hasFiles(e)) return;
      if (e.defaultPrevented) return void (over = false); // a drop field of the page wants it
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      over = true;
    };
    const leave = (e) => {
      if (!e.relatedTarget) over = false;
    };
    const drop = async (e) => {
      if (!hasFiles(e) || e.defaultPrevented) return void (over = false);
      e.preventDefault();
      over = false;
      error = '';
      plan = await planDrop(e.dataTransfer?.files ?? []);
      await tick();
      dialog?.showModal();
      cancel?.focus();
    };
    const end = () => (over = false);
    window.addEventListener('dragenter', move);
    window.addEventListener('dragover', move);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    window.addEventListener('dragend', end);
    return () => {
      window.removeEventListener('dragenter', move);
      window.removeEventListener('dragover', move);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', drop);
      window.removeEventListener('dragend', end);
    };
  });

  const close = () => dialog?.close();
  async function choose() {
    const p = plan;
    if (!p || p.kind === 'none') return close();
    try {
      const to = await stash(p.kind, p.files);
      close();
      open(to);
    } catch {
      error = t('The file could not be handed over. Nothing was changed.');
    }
  }
  function look() {
    const f = plan?.files?.[0];
    if (!f) return;
    window.open(URL.createObjectURL(f), '_blank', 'noopener');
    close();
  }

  const what = $derived(
    plan?.kind === 'ride' ? t('A recorded ride (GPX or TCX with times).')
    : plan?.kind === 'route' ? t('A planned route (GPX without times).')
    : plan?.kind === 'backup' ? t('A backup file of the app.')
    : plan?.kind === 'doc' ? tn(plan.files.length, 'A photo or a PDF.', '{n} photos or PDFs.')
    : t('The app cannot use this file. It reads rides (GPX, TCX), backups (.json), photos and PDFs.'),
  );
  const yes = $derived(
    plan?.kind === 'ride' ? t('Upload the ride')
    : plan?.kind === 'route' ? t('Take over as planned tour')
    : plan?.kind === 'backup' ? t('Check the backup')
    : plan?.kind === 'doc' ? t('Keep in Documents')
    : '',
  );
  const sizeText = (f) => (f.size >= 1048576 ? `${(f.size / 1048576).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB`);
</script>

{#if over}
  <div class="dropveil" aria-hidden="true" data-drop-veil>
    <p><FileUp size={28} aria-hidden="true" /><span>{t('Drop to open')}</span></p>
  </div>
{/if}

{#if plan}
  <dialog class="sheet drop" bind:this={dialog} use:backClose onclose={() => (plan = null)} aria-labelledby="drop-h" data-drop-sheet>
    <div class="head">
      <h2 id="drop-h">{t('What should happen with this file?')}</h2>
      <button type="button" class="ib" aria-label={t('Close')} onclick={close}><X size={20} aria-hidden="true" /></button>
    </div>
    <p class="file"><strong>{plan.files[0]?.name}</strong>{#if plan.kind !== 'doc' && plan.files[0]}&nbsp;<span class="soft">· {sizeText(plan.files[0])}</span>{/if}</p>
    <p>{what}</p>
    {#if plan.left > 0}<p class="soft">{tn(plan.left, '{n} more file was left out.', '{n} more files were left out.')}</p>{/if}
    <p class="soft">{t('Nothing is kept before you choose.')}</p>
    {#if error}<p class="warn" role="alert">{error}</p>{/if}
    <div class="acts">
      {#if plan.kind !== 'none'}<button type="button" class="btn hi" onclick={choose} data-drop-yes>{yes}</button>{/if}
      {#if plan.kind === 'doc' && plan.files.length === 1}<button type="button" class="btn" onclick={look}>{t('Just look')}</button>{/if}
      <button type="button" class="btn" bind:this={cancel} onclick={close} data-drop-cancel>{t('Cancel')}</button>
    </div>
  </dialog>
{/if}

<style>
  .dropveil {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: grid;
    place-items: center;
    padding: 24px;
    background: color-mix(in srgb, var(--paper) 82%, transparent);
    pointer-events: none;
  }
  .dropveil p {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0;
    padding: 36px 56px;
    border: 2px dashed var(--ink-3);
    border-radius: 18px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-h3, 1.25rem) var(--font-body);
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }
  .head h2 {
    margin: 0 0 8px;
  }
  .file {
    margin: 0 0 4px;
    overflow-wrap: break-word;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }
</style>
