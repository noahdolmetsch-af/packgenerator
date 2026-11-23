<script>
  /**
   * «Mein Tag» step 3 (Noah 23.11.2026 «dreimal ja»): one small window to change a to-do of Merken: its words and its day.
   * todo: the to-do; onsave({ text, due }) saves; ondelete() deletes (the page offers Undo).
   */
  import { tick } from 'svelte';
  import { X } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import '../ui/daumen.css';

  let { todo, onsave, ondelete, onclose } = $props();

  /* svelte-ignore state_referenced_locally */
  let f = $state({ text: todo?.text ?? '', due: todo?.due ?? '' });
  let error = $state('');
  let dialog;
  let input;

  $effect(() => {
    dialog.showModal();
    tick().then(() => input?.focus());
  });

  async function save(e) {
    e?.preventDefault();
    if (!f.text.trim()) {
      error = t('Give it a name.');
      input?.focus();
      return;
    }
    await onsave?.({ text: f.text.trim().slice(0, 200), due: f.due || null });
    dialog.close();
  }
  async function del() {
    dialog.close();
    await ondelete?.();
  }
</script>

<dialog class="sheet from-below todo" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="ts-h" data-todo-sheet>
  <form onsubmit={save} novalidate>
    <div class="head">
      <h2 id="ts-h">{t('Change to-do')}</h2>
      <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    <div class="fld">
      <label class="flbl" for="ts-text">{t('Name')}</label>
      <input id="ts-text" class="inp" bind:this={input} bind:value={f.text} maxlength="200" autocomplete="off" enterkeyhint="done" oninput={() => (error = '')} />
    </div>
    <div class="fld">
      <label class="flbl" for="ts-due">{t('Day')}</label>
      <input id="ts-due" class="inp" type="date" bind:value={f.due} />
    </div>
    <p class="hint">{t('Without a day, the to-do waits in the list «Without date».')}</p>
    {#if error}<p class="err" role="alert">{error}</p>{/if}
    <div class="foot daumen-foot">
      <button type="submit" class="btn hi">{t('Save')}</button>
      <button type="button" class="btn del" onclick={del}>{t('Delete')}</button>
    </div>
  </form>
</dialog>

<style>
  .todo {
    width: min(460px, calc(100vw - 24px));
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 10px;
  }
  h2 {
    margin: 2px 0 0;
    font-size: var(--fs-section);
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
  .fld {
    display: grid;
    gap: 4px;
    margin: 0 0 10px;
  }
  .flbl {
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
  .hint {
    margin: 0 0 8px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .err {
    margin: 0 0 8px;
    color: var(--bad);
  }
  .del {
    color: var(--bad);
  }
</style>
