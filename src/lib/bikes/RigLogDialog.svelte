<script>
  /**
   * UC3-3: write down one change of the setup (or change one): the day, the kind, before and after,
   * why, and the weight it adds or saves. entry: the entry to change, or a draft (a workshop job
   * offered for the log), or null for a new one.
   */
  import { backClose } from '../ui/backclose.js';
  import { X } from '@lucide/svelte';
  import './velo-dlg.css';
  import { LOG_KINDS, newLogEntry } from '../rig.js';
  import { localDay } from '../localday.js';
  import { t } from '../i18n.svelte.js';

  let { entry = null, onsave, ondelete, onclose } = $props();

  // The dialog edits a copy of the entry as it was when it opened.
  // svelte-ignore state_referenced_locally
  const isNew = !entry?.id;
  // svelte-ignore state_referenced_locally
  let draft = $state({ date: entry?.date ?? localDay(), kind: entry?.kind ?? 'drive', title: entry?.title ?? '', before: entry?.before ?? '', after: entry?.after ?? '', why: entry?.why ?? '', deltaG: entry?.deltaG ?? '' });
  let error = $state('');
  let dialog;
  $effect(() => {
    dialog.showModal();
  });

  function save(event) {
    event.preventDefault();
    if (!draft.title.trim() && !(draft.before.trim() && draft.after.trim())) {
      error = t('Write what you changed.');
      return;
    }
    const title = draft.title.trim() || `${draft.before.trim()} → ${draft.after.trim()}`;
    const made = newLogEntry({ ...draft, title, deltaG: String(draft.deltaG).replace(/[^\d+-]/g, ''), source: entry?.source ?? null, part: entry?.part ?? null }, { id: entry?.id ?? `log-${Date.now().toString(36)}`, now: entry?.at });
    onsave?.($state.snapshot(entry?.id ? { ...made, backAsked: !!entry.backAsked } : made));
    dialog.close();
  }
</script>

<dialog class="sheet vdlg" bind:this={dialog} use:backClose {onclose} aria-labelledby="lg-h">
  <form onsubmit={save} novalidate>
    <div class="vd-head">
      <div class="vd-t">
        <h2 id="lg-h">{isNew ? t('Write down a change') : t('Change entry')}</h2>
        {#if entry?.source?.label}<p class="vd-sub meta">{entry.source.label}</p>{/if}
      </div>
      <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={18} aria-hidden="true" /></button>
    </div>
    <div class="grid">
      <label><span class="lbl">{t('Day')}</span><input class="inp" type="date" bind:value={draft.date} /></label>
      <label>
        <span class="lbl">{t('Kind|log')}</span>
        <select class="sel" bind:value={draft.kind}>{#each LOG_KINDS as k (k.key)}<option value={k.key}>{t(k.name)}</option>{/each}</select>
      </label>
      <label class="wide"><span class="lbl">{t('What changed')}</span><input class="inp" bind:value={draft.title} placeholder={t('e.g. Chainring 40 → 38 T.')} /></label>
      <label><span class="lbl">{t('Before')}</span><input class="inp" bind:value={draft.before} /></label>
      <label><span class="lbl">{t('After')}</span><input class="inp" bind:value={draft.after} /></label>
      <label class="wide"><span class="lbl">{t('Why')}</span><input class="inp" bind:value={draft.why} /></label>
      <label><span class="lbl">{t('Weight change (g)')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={draft.deltaG} placeholder={t('e.g. +180 or -90')} /></label>
    </div>
    <p class="err" role="alert">{error}</p>
    <div class="vd-foot">
      {#if !isNew}<button type="button" class="btn del" onclick={() => (ondelete?.(entry), dialog.close())}>{t('Delete')}</button>{/if}
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi">{t('Save')}</button>
    </div>
  </form>
</dialog>

<style>
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .wide {
    grid-column: 1 / -1;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .err:empty {
    display: none;
  }
  .err {
    color: var(--bad);
    margin: 8px 0 0;
  }
  @media (max-width: 520px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
