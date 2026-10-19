<script>
  /**
   * «Gruppen überall» (Noah 18.10.2026: «gruppen umbenennen und löschen soll grundsätzlich überall auf
   * der app möglich sein»): ONE window to delete a group, the same everywhere (Material categories,
   * building blocks, note topics, the groups of the bike values …). When the group still holds things,
   * it asks where they go: «Ohne Gruppe» (the first choice, chosen) or one of the other groups.
   * After «Löschen» the caller offers Undo for a few seconds (app rule 2b: ask, then undo).
   *
   * title: «Delete category "Food"?»; count: how many things are in the group; what(n): «3 items»;
   * none: the word for «no group» on this page («No category»); noneHint: what «none» means there;
   * targets: the other groups [{ id, name }] (name already translated); onconfirm(targetId | null).
   */
  import { backClose } from './backclose.js';
  import { t } from '../i18n.svelte.js';
  import { X, Trash2 } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';

  let { title, count = 0, what = (n) => String(n), none = '', noneHint = '', targets = [], note = '', onconfirm, onclose } = $props();

  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  let to = $state('');

  function confirm() {
    onconfirm?.(to || null);
    dialog.close();
  }
</script>

<dialog class="sheet vdlg gds" bind:this={dialog} use:backClose {onclose} aria-labelledby="gds-h">
  <div class="vd-head">
    <div class="vd-t"><h2 id="gds-h">{title}</h2></div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  {#if count > 0}
    <fieldset class="where">
      <legend class="lbl">{t('In it: {what}. Where should they go?', { what: what(count) })}</legend>
      <label class="opt">
        <input type="radio" name="gds-to" value="" bind:group={to} />
        <span><b>{none || t('No group')}</b>{#if noneHint}<small>{noneHint}</small>{/if}</span>
      </label>
      {#each targets as g (g.id)}
        <label class="opt">
          <input type="radio" name="gds-to" value={g.id} bind:group={to} />
          <span><b>{g.name}</b></span>
        </label>
      {/each}
    </fieldset>
  {:else}
    <p class="empty">{t('The group is empty.')}</p>
  {/if}
  {#if note}<p class="hint">{note}</p>{/if}
  <p class="hint">{t('You can undo this for a few seconds.')}</p>

  <div class="vd-foot">
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
    <button type="button" class="btn del" onclick={confirm}><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>
  </div>
</dialog>

<style>
  .where {
    margin: 0;
    padding: 0;
    border: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 50vh;
    overflow-y: auto;
  }
  .where legend {
    margin: 0 0 6px;
    padding: 0;
  }
  .opt {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    padding: 6px 12px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    cursor: pointer;
  }
  .opt:has(input:checked) {
    border: 2px solid var(--ink);
    background: var(--paper-2);
  }
  .opt input {
    width: 20px;
    height: 20px;
    margin: 0;
    accent-color: var(--ink);
  }
  .opt span {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .opt b {
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .opt small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .empty,
  .hint {
    margin: 10px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .del {
    color: var(--bad);
  }
</style>
