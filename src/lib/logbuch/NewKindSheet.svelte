<script>
  /**
   * «Verbesserungs-Logbuch» L5 step 3 (Noah 22.11.2026 «4a»): the window for a NEW kind (a name and the way it takes) or for the way of
   * an existing kind (mode 'way'). The way is chosen here: a small change, first a picture (the standard), only a note. A new group
   * only needs a name (mode 'group'). onsave({ name, route }).
   * mode: 'kind' | 'way' | 'group'; name: the name now (mode 'way', shown, not changed here); route: the way now; where: the group's name («in Falsch»).
   */
  import { X, Check } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import { NAME_MAX } from './kinds.js';
  import { ROUTE_TEXT } from './words.js';
  import '../bikes/velo-dlg.css';

  let { mode = 'kind', name = '', route = 'draft', where = '', onsave, onclose } = $props();

  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  // svelte-ignore state_referenced_locally
  let text = $state(mode === 'way' ? '' : name);
  // svelte-ignore state_referenced_locally
  let way = $state(route);
  let msg = $state('');
  const title = $derived(mode === 'group' ? t('New group') : mode === 'way' ? t('Way of «{name}»', { name }) : where ? t('New kind in «{name}»', { name: where }) : t('New kind'));
  const ROUTE_NAME = { direct: () => t('Small change'), draft: () => t('First a picture'), note: () => t('Only a note') };

  function save(e) {
    e.preventDefault();
    if (mode !== 'way' && !text.trim()) return (msg = t('Write a name first.'));
    onsave?.({ name: text.trim(), route: way });
    dialog.close();
  }
</script>

<dialog class="sheet vdlg nks" bind:this={dialog} use:backClose {onclose} aria-labelledby="nks-h" data-new-kind-sheet={mode}>
  <div class="vd-head">
    <div class="vd-t"><h2 id="nks-h">{title}</h2></div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <form onsubmit={save}>
    {#if mode !== 'way'}
      <label class="fld"><span class="lbl">{mode === 'group' ? t('Name of the group') : t('Name of the kind')}</span><input class="inp" bind:value={text} maxlength={NAME_MAX} autocomplete="off" data-new-kind-name /></label>
    {/if}
    {#if mode !== 'group'}
      <p class="lbl sym" id="nks-way">{t('What happens with it?')}</p>
      <div class="ways" role="radiogroup" aria-labelledby="nks-way">
        {#each ['direct', 'draft', 'note'] as r (r)}
          <label class="opt">
            <input type="radio" name="nks-way" value={r} bind:group={way} data-way={r} />
            <span><b>{ROUTE_NAME[r]()}</b><small>{ROUTE_TEXT[r]()}</small></span>
          </label>
        {/each}
      </div>
    {/if}
    {#if msg}<p class="msg" role="alert">{msg}</p>{/if}
    <div class="vd-foot">
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi" data-new-kind-save><Check size={16} aria-hidden="true" />{t('Save')}</button>
    </div>
  </form>
</dialog>

<style>
  .fld {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 12px;
  }
  .sym {
    margin: 14px 0 6px;
  }
  .ways {
    display: flex;
    flex-direction: column;
    gap: 6px;
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
  }
  .opt small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .msg {
    margin: 10px 0 0;
    font-size: var(--fs-small);
    color: var(--bad);
  }
</style>
