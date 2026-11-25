<script>
  /**
   * «Termine ziehen» (Noah 24.11.2026 «3a»): the way to move an entry WITHOUT dragging (menu «Move …»), the same on every
   * place that can drag (week grid, Mein Tag, Wochenplan). A small window: day and time (and, if wanted, the length).
   * title: the entry's name; day, time: where it stands now ('' time = without a time);
   * sync: a line that says where else the move is written («Also changed in your Google calendar.»), optional;
   * timeless: true lets the time stay empty; onsave({ day, time }) moves; onclose.
   * oncopy({ day, time }): optional, a second button «Copy» makes a copy there and leaves the entry where it is («2+3 dazu», Noah 24.11.2026).
   */
  import { tick } from 'svelte';
  import { X } from '@lucide/svelte';
  import { backClose } from './backclose.js';
  import { t } from '../i18n.svelte.js';
  import './daumen.css';

  let { title = '', day = '', time = '', sync = '', timeless = false, onsave, oncopy = null, onclose } = $props();

  /* svelte-ignore state_referenced_locally */
  let f = $state({ day, time });
  let error = $state('');
  let dialog;
  let input;

  $effect(() => {
    dialog.showModal();
    tick().then(() => input?.focus());
  });

  let copying = false;
  async function save(e) {
    e?.preventDefault();
    if (!f.day) {
      error = t('Choose a day.');
      return;
    }
    if (!f.time && !timeless) {
      error = t('Choose a time.');
      return;
    }
    await (copying ? oncopy : onsave)?.({ day: f.day, time: f.time || '' });
    dialog.close();
  }
</script>

<dialog class="sheet from-below move" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="mv-h" data-move-sheet>
  <form onsubmit={save} novalidate>
    <div class="head">
      <h2 id="mv-h">{t('Move «{name}»', { name: title })}</h2>
      <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    <div class="row">
      <div class="fld">
        <label class="flbl" for="mv-day">{t('Day')}</label>
        <input id="mv-day" class="inp" type="date" bind:this={input} bind:value={f.day} oninput={() => (error = '')} />
      </div>
      <div class="fld">
        <label class="flbl" for="mv-time">{t('Time')}</label>
        <input id="mv-time" class="inp" type="time" step="300" bind:value={f.time} oninput={() => (error = '')} />
      </div>
    </div>
    {#if sync}<p class="hint" data-move-sync>{sync}</p>{/if}
    {#if error}<p class="err" role="alert">{error}</p>{/if}
    <div class="foot daumen-foot">
      <button type="submit" class="btn hi" onclick={() => (copying = false)}>{t('Move|button')}</button>
      {#if oncopy}<button type="submit" class="btn" data-move-copy onclick={() => (copying = true)}>{t('Copy|button')}</button>{/if}
    </div>
  </form>
</dialog>

<style>
  .move {
    width: min(420px, calc(100vw - 24px));
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
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .row {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 8px;
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
  .hint {
    margin: 0 0 8px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .err {
    margin: 0 0 8px;
    color: var(--bad);
  }
</style>
