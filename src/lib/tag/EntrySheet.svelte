<script>
  /**
   * «Mein Tag» step 2 (Noah 23.11.2026): one small window to add or change an own date or to-do of the day.
   * Fields: title, day, time (empty = without a time), length. «Delete» is the app's rule: it offers Undo (done by the page).
   * item: the own item to change, or null for a new one; day, time: the start values of a new one.
   * onsave(fields) saves; ondelete() deletes (only for an existing item).
   */
  import { tick } from 'svelte';
  import { X } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import '../ui/daumen.css';

  let { item = null, day = '', time = '', onsave, ondelete, onclose } = $props();

  /* svelte-ignore state_referenced_locally */
  let f = $state({ title: item?.title ?? '', kind: item?.kind ?? 'date', day: item?.day ?? day, time: item?.time ?? time, mins: item?.mins ?? '' });
  let error = $state('');
  let dialog;
  let input;

  $effect(() => {
    dialog.showModal();
    tick().then(() => input?.focus());
  });

  async function save(e) {
    e?.preventDefault();
    if (!f.title.trim()) {
      error = t('Give it a name.');
      input?.focus();
      return;
    }
    if (!f.day) {
      error = t('Choose a day.');
      return;
    }
    const mins = Math.round(Number(f.mins));
    await onsave?.({ title: f.title.trim(), kind: f.kind, day: f.day, time: f.time || '', mins: mins >= 5 && mins <= 480 ? mins : null });
    dialog.close();
  }
  async function del() {
    dialog.close();
    await ondelete?.();
  }
</script>

<dialog class="sheet from-below entry" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="es-h" data-entry-sheet>
  <form onsubmit={save} novalidate>
    <div class="head">
      <h2 id="es-h">{item ? t('Change entry') : t('New entry')}</h2>
      <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    <div class="fld">
      <label class="flbl" for="es-title">{t('Name')}</label>
      <input id="es-title" class="inp" bind:this={input} bind:value={f.title} maxlength="80" autocomplete="off" enterkeyhint="done" oninput={() => (error = '')} />
    </div>
    {#if !item || item.kind !== 'bike'}
      <div class="fld">
        <span class="flbl" id="es-kind">{t('Kind')}</span>
        <div class="seg" role="radiogroup" aria-labelledby="es-kind">
          <label class:on={f.kind === 'date'}><input type="radio" name="es-kind" value="date" bind:group={f.kind} /> {t('Date|week')}</label>
          <label class:on={f.kind === 'todo'}><input type="radio" name="es-kind" value="todo" bind:group={f.kind} /> {t('To-dos')}</label>
        </div>
      </div>
    {/if}
    <div class="row">
      <div class="fld">
        <label class="flbl" for="es-day">{t('Day')}</label>
        <input id="es-day" class="inp" type="date" bind:value={f.day} />
      </div>
      <div class="fld">
        <label class="flbl" for="es-time">{t('Time')}</label>
        <input id="es-time" class="inp" type="time" bind:value={f.time} />
      </div>
      <div class="fld">
        <label class="flbl" for="es-mins">{t('Minutes|length')}</label>
        <input id="es-mins" class="inp" type="number" min="5" max="480" step="5" inputmode="numeric" bind:value={f.mins} />
      </div>
    </div>
    <p class="hint">{t('Without a time, the entry stands above the timeline. Without minutes, the usual length counts.')}</p>
    {#if error}<p class="err" role="alert">{error}</p>{/if}
    <div class="foot daumen-foot">
      <button type="submit" class="btn hi">{t('Save')}</button>
      {#if item}<button type="button" class="btn del" onclick={del}>{t('Delete')}</button>{/if}
    </div>
  </form>
</dialog>

<style>
  .entry {
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
    min-width: 0;
  }
  .flbl {
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
  .row {
    display: grid;
    grid-template-columns: 1.4fr 1fr 0.8fr;
    gap: 8px;
  }
  .seg {
    display: flex;
    gap: 6px;
  }
  .seg label {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: 10px;
    cursor: pointer;
  }
  .seg label.on {
    background: var(--brand);
    border-color: var(--brand);
    color: var(--brand-ink);
  }
  .seg input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
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
