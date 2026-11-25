<script>
  /**
   * «Termine ziehen» (Noah 24.11.2026 «2+3 dazu»): «Move all …» for one day. When a day falls out, the entries that can move are
   * listed (all ticked), a day is chosen (tomorrow is preset) and they go together; the page offers one Undo.
   * entries: [{ id, title, sub }] the entries that can move; day: the day they stand on; to: the preset target day;
   * onsave({ ids, day }) moves; onclose.
   */
  import { tick } from 'svelte';
  import { X } from '@lucide/svelte';
  import { backClose } from './backclose.js';
  import { t } from '../i18n.svelte.js';
  import './daumen.css';

  let { entries = [], day = '', to = '', onsave, onclose } = $props();

  /* svelte-ignore state_referenced_locally */
  let target = $state(to);
  /* svelte-ignore state_referenced_locally */
  let chosen = $state(entries.map((x) => x.id));
  let error = $state('');
  let dialog;
  let input;

  $effect(() => {
    dialog.showModal();
    tick().then(() => input?.focus());
  });

  const toggle = (id, on) => (chosen = on ? [...chosen, id] : chosen.filter((x) => x !== id));
  async function save(e) {
    e?.preventDefault();
    if (!target) return (error = t('Choose a day.'));
    if (target === day) return (error = t('Choose another day.'));
    if (!chosen.length) return (error = t('Tick at least one entry.'));
    await onsave?.({ ids: chosen, day: target });
    dialog.close();
  }
</script>

<dialog class="sheet from-below shift" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="sh-h" data-shift-sheet>
  <form onsubmit={save} novalidate>
    <div class="head">
      <h2 id="sh-h">{t('Move all …')}</h2>
      <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    <ul class="list">
      {#each entries as x (x.id)}
        <li>
          <label><input type="checkbox" checked={chosen.includes(x.id)} onchange={(e) => toggle(x.id, e.currentTarget.checked)} data-shift-entry={x.id} /><span><b>{x.title}</b>{#if x.sub}<small>{x.sub}</small>{/if}</span></label>
        </li>
      {/each}
    </ul>
    <div class="fld">
      <label class="flbl" for="sh-day">{t('To this day')}</label>
      <input id="sh-day" class="inp" type="date" bind:this={input} bind:value={target} oninput={() => (error = '')} />
    </div>
    {#if error}<p class="err" role="alert">{error}</p>{/if}
    <div class="foot daumen-foot">
      <button type="submit" class="btn hi" data-shift-go>{t('Move|button')}</button>
    </div>
  </form>
</dialog>

<style>
  .shift {
    width: min(440px, calc(100vw - 24px));
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
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .list {
    list-style: none;
    margin: 0 0 12px;
    padding: 0;
    display: grid;
    gap: 2px;
    max-height: 40vh;
    overflow-y: auto;
  }
  .list label {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    min-height: 44px;
    padding: 8px 4px;
    cursor: pointer;
  }
  .list input {
    margin-top: 3px;
    width: 18px;
    height: 18px;
    flex: none;
  }
  .list b {
    display: block;
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .list small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
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
  .err {
    margin: 0 0 8px;
    color: var(--bad);
  }
</style>
